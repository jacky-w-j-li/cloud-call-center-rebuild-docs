var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var http = require('appHttp');
var config = require('appConfig').conf;
var syncAcs = require(__baseDir + "/dishui/app/batch/SyncAcsHandler");
var historyHandler = require(__baseDir + "/dishui/app/customer/CustomerHistoryHandler");
var appEvent = require("appEvent");
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var qiniuHandler = require(__baseDir + '/dishui/app/qiniu/QiniuHandler');
var businessHandler = {

    setWaitforMessage: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.account.account + "_business").update(data, {$set: {businessStat: "wait"}}, function (err) {
            if (!err) {
                handler._getBusinessById(session, data._id, function (err, business) {
                    if (!err) {
                        result.success = true;
                        result.data = business;
                        callback(result);
                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    /**
     * 领取业务
     * @param data
     * @param session
     * @param callback
     */
    setTaskToMe: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        handler._getBusinessById(session, id, function (err, business) {
            if (!err && business) {
                business.roles = business.roles || [];
                var businessRole = [];
                for(var i=0;i<business.roles.length;i++){
                    businessRole.push(business.roles[i].role);
                }
                var userRole = session.user.role || [];

                if (!business.master && utils.ObjectUtil.arrayContainAnyForStr(businessRole,userRole)) {
                    //event
                    var query = {
                        businessId: id,
                        $or: [
                            {action: "transformIn", excuteUser: ""},
                            {action: "assign", excuteUser: ""},
                            {action: "backIn", excuteUser: ""}
                        ]
                    };
                    var sort = {
                        sortTime: -1
                    };
                    mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).findOne(query, {sort: sort}, function (err, doc) {
                        var processTime = 0;
                        if (!err) {
                            if (doc) {
                                var time = Math.floor(doc.sortTime / 1000);
                                var now = Math.floor(utils.DateTime.getCurrentTimestamp() / 1000);
                                processTime = now - time;
                            }
                        }

                        //处理业务
                        businessHandler.changeBusinessMaster(data, session, callback);

                        //抛出领取事件
                        var eventData = {
                            _id : business._id,
                            user : session.user._id,
                            flow : business.flow,
                            account : session.account.account,
                            time : utils.DateTime.getCurrentDateTime(),
                            waitTime : processTime
                        };
                        appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_PICK_BUSINESS,eventData);
                    });

                } else {
                    result.message = "此业务已被其他人领取。";
                    callback(result);
                }
            } else {
                logger.app.error("", err);
                result.message = "";
                callback(result);
            }
        });
    },
    /**
     * 改变业务所属人
     * @param data
     * @param session
     * @param callback
     */
    changeBusinessMaster: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.account.account + "_business").findOne({_id:data._id},function(err , business){
            if(!err && business){
                handler._checkBusinessUserRole(business,session.user,function(isAccess){ //是否有权限操作
                    if(isAccess){
                        if(data.master){
                            mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id:data.master},function(err , dbUser){
                                if(!err && dbUser){
                                    handler._checkBusinessUserRole(business,dbUser,function(isAccess){
                                        if(isAccess){
                                            mongo.db(session).collection(session.account.account + "_business").update({_id: data._id}, {$set: {master: data.master,isRead:false, lastUpdateTime: utils.DateTime.getCurrentDateTime(), updateTimestap: utils.DateTime.getCurrentTimestamp(), lastUpdateUser: session.user._id}, $unset: {businessStat: 1}}, {w: 1}, function (err) {
                                                if (!err) {
                                                    mongo.db(session).collection(session.account.account + "_business").findOne({_id: data._id}, function (err, business) {
                                                        if (!err) {

                                                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).find({"businessId":data._id},{sort: {"sortTime":-1}, limit: 1}).toArray(function (err, docs) {
                                                                var lastHistory = docs[0];
                                                                //查询当前步骤的时长
                                                                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: business.step}, function (err, step) {
                                                                    if(!err){
                                                                        var history = {
                                                                            _id: utils.UUID.generateUuid(),
                                                                            businessId: data._id,
                                                                            step: business.step,
                                                                            action: 'assign',
                                                                            excuteData: {master: data.master},
                                                                            excuteUser: data.master,
                                                                            date: utils.DateTime.getCurrentDate(),
                                                                            time: utils.DateTime.getCurrentDateTime(),
                                                                            sortTime: utils.DateTime.getCurrentTimestamp(),
                                                                            master: session.user._id
                                                                        };

                                                                        if(step.ctype){
                                                                            history.stepProcessTime = utils.DateTime.getDifferenceTime(utils.DateTime.getCurrentDateTime(),lastHistory.time);
                                                                            history.ctype = step.ctype;
                                                                            history.ctime = step.ctime;
                                                                        }

                                                                        //event
                                                                        if(data.master !== session.user._id){ //not assign self  or not pick
                                                                            var eventData = {
                                                                                _id : business._id,
                                                                                user : session.user._id,
                                                                                flow : business.flow,
                                                                                account : session.account.account,
                                                                                time : history.time
                                                                            };
                                                                            appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_ASSIGN_BUSINESS,eventData);
                                                                        }

                                                                        handler._addBusinessHistory(session, history, function (err) {
                                                                            if (!err) {
                                                                                result.success = true;
                                                                                callback(result);
                                                                            } else {
                                                                                logger.app.error("", err);
                                                                                result.message = err.message;
                                                                                callback(result);
                                                                            }
                                                                        });
                                                                        //if (data.master) {
                                                                        //    util.notifyUser(data.master, fields.BUSINESS_NOTIFY_ASSIGN, {}, session);
                                                                        //} else {
                                                                        //    util.notifyRoles(business.roles, fields.BUSINESS_NOTIFY_ASSIGN_ROLE, {}, session);
                                                                        //}

                                                                        if (data.master) {
                                                                            util.notifyBusinessUser(data._id,business.customer,data.master, session);
                                                                        } else {
                                                                            util.notifyBusinessRoles(data._id,business.customer,business.roles,session);
                                                                        }
                                                                    }else{
                                                                        logger.app.error("", err);
                                                                        result.message = err.message;
                                                                        callback(result);
                                                                    }
                                                                });
                                                            });

                                                        } else {
                                                            logger.app.error("", err);
                                                            result.message = err.message;
                                                            callback(result);
                                                        }
                                                    });
                                                } else {
                                                    logger.app.error("", err);
                                                    result.message = err.message;
                                                    callback(result);
                                                }
                                            });
                                        } else {
                                            result.errorCode = "403";
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.error("can not found user by id [" + data.master + "]");
                                    result.message = "can not found user by id [" + data.master + "]";
                                    callback(result);
                                }
                            });
                        } else {
                            mongo.db(session).collection(session.account.account + "_business").update({_id: data._id}, {$set: {master: data.master,isRead:false, lastUpdateTime: utils.DateTime.getCurrentDateTime(), updateTimestap: utils.DateTime.getCurrentTimestamp(), lastUpdateUser: session.user._id}, $unset: {businessStat: 1}}, {w: 1}, function (err) {
                                if (!err) {
                                    mongo.db(session).collection(session.account.account + "_business").findOne({_id: data._id}, function (err, business) {
                                        if (!err) {
                                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).find({"businessId":data._id},{sort: {"sortTime":-1}, limit: 1}).toArray(function (err, docs) {
                                                var lastHistory = docs[0];
                                                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: business.step}, function (err, step) {
                                                    if(!err){
                                                        var history = {
                                                            _id: utils.UUID.generateUuid(),
                                                            businessId: data._id,
                                                            step: business.step,
                                                            action: 'assign',
                                                            excuteData: {master: data.master},
                                                            excuteUser: data.master,
                                                            date: utils.DateTime.getCurrentDate(),
                                                            time: utils.DateTime.getCurrentDateTime(),
                                                            sortTime: utils.DateTime.getCurrentTimestamp(),
                                                            master: session.user._id
                                                        };

                                                        if(step.ctype){
                                                            history.stepProcessTime = utils.DateTime.getDifferenceTime(utils.DateTime.getCurrentDateTime(),lastHistory.time);
                                                            history.ctype = step.ctype;
                                                            history.ctime = step.ctime;
                                                        }
                                                        //event
                                                        if(data.master !== session.user._id){ //not assign self  or not pick
                                                            var eventData = {
                                                                _id : business._id,
                                                                user : session.user._id,
                                                                flow : business.flow,
                                                                account : session.account.account,
                                                                time : history.time
                                                            };
                                                            appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_ASSIGN_BUSINESS,eventData);
                                                        }

                                                        handler._addBusinessHistory(session, history, function (err) {
                                                            if (!err) {
                                                                result.success = true;
                                                                callback(result);
                                                            } else {
                                                                logger.app.error("", err);
                                                                result.message = err.message;
                                                                callback(result);
                                                            }
                                                        });
                                                        //if (data.master) {
                                                        //    util.notifyUser(data.master, fields.BUSINESS_NOTIFY_ASSIGN, {}, session);
                                                        //} else {
                                                        //    util.notifyRoles(business.roles, fields.BUSINESS_NOTIFY_ASSIGN_ROLE, {}, session);
                                                        //}
                                                        if (data.master) {
                                                            util.notifyBusinessUser(data._id,business.customer,data.master, session);
                                                        } else {
                                                            util.notifyBusinessRoles(data._id,business.customer,business.roles,session);
                                                        }
                                                    }else{
                                                        logger.app.error("", err);
                                                        result.message = err.message;
                                                        callback(result);
                                                    }
                                                });
                                            });

                                        } else {
                                            logger.app.error("", err);
                                            result.message = err.message;
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.error("", err);
                                    result.message = err.message;
                                    callback(result);
                                }
                            });
                        }
                    } else {
                        result.errorCode = "403";
                        callback(result);
                    }
                });
            } else {
                logger.app.error("can not found business by id [" + data._id+ "]",err || new Error(""));
                result.message = "can not found business by id [" + data._id+ "]";
                callback(result);
            }
        });

    },
    /**
     * 业务导出
     * @param data
     * @param session
     * @param callback
     */
    exportBusiness: function (data, session, callback) {
        var result = {success: false};
//        data.type = "business";
        if (!data.account) {
            data.account = session.account.account;
        }
        util.removeEmptyAndProcessCondition(data);
        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                data.customer = {$in: ids};
                delete data.query;
                var url = config.ccServiceUrl + '?Action=export&Method=business&Query=' + JSON.stringify(data);
                url = encodeURI(url);
                http.sendGet(url, function (err, res) {
                    if (!err && res) {
                        try {
                            var res = JSON.parse(res);
                            if (res.Succeed) {
                                result.success = true;
                                result.path = res.path;
                                callback(result);
                            } else {
                                callback(result);
                            }
                        } catch (e) {
                            callback(e);
                        }
                    } else {
                        var error = err || new Error('request service error!');
                        result.message = err.message;
                        callback(result);
                    }
                });
            });
        } else {
            var url = config.ccServiceUrl + '?Action=export&Method=business&Query=' + JSON.stringify(data);
            url = encodeURI(url);
            http.sendGet(url, function (err, res) {
                if (!err && res) {
                    try {
                        var res = JSON.parse(res);
                        if (res.Succeed) {
                            result.success = true;
                            result.path = res.path;
                            callback(result);
                        } else {
                            callback(result);
                        }
                    } catch (e) {
                        callback(e);
                    }
                } else {
                    var error = err || new Error('request service error!');
                    result.message = err.message;
                    callback(result);
                }
            });
        }
    },


    /**
     * 获取客户的最近一次业务
     * data
     * 客户id：customer
     */
    getCustomerLastBusiness: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).find(data, {sort: {createTime: -1}, limit: 1}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                result.success = true;
                result.data = docs[0] || "";
                callback(result);
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    /**
     * 获取客户业务历史 最多10条
     * @param data
     */
    getCustomerHistoryBusiness: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).find(data, {sort: {createTime: -1}, limit: 10}).toArray(function (err, tasks) {
            if (!err) {
                var ids = handler._getTaskIds(tasks);
                var condition = {
                    businessId: {
                        $in: ids
                    },
                    action: "create"
                };
                mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).find(condition, {fields: {businessId: 1, excuteData: 1}}).toArray(function (err, history) {
                    if (!err) {
                        result.success = true;
                        handler._linkBusinessHistoryData(tasks, history);
                        result.data = tasks
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },

    getCustomerBusiness: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).find(data, {sort: {createTime: -1}, limit: 10}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                result.success = true;
                result.data = docs;
                callback(result);
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });

    },
    /**
     * 退回业务单
     */
    excuteBusinessBackAction: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).findOne({_id: data._id}, function (err, business) {
            if (!err && business) {
                handler._checkBusinessBack(business,function(isAccess){
                    if(isAccess){
                        handler._checkBusinessUserRole(business, session.user, function (isAccess) {
                            if (isAccess) {
                                var historyCondition = {businessId: business._id, step: business.step, action: "transformIn"};
                                mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).findOne(historyCondition, {sort: {sortTime: -1}}, function (err, history) {
                                    if (!err) {
                                        var master = history.master;
                                        var lastStep = history.fromStep;

                                        handler._isAccessUser(master, function (err, accessUser) {
                                            if (!err) {
                                                if (!accessUser) {
                                                    master = "";
                                                    result.userAccess = true;
                                                }
                                                handler._getStepActionRoles(session, lastStep, function (err, roles,lastStepData) {
                                                    var update = {
                                                        $set: {
                                                            step: lastStep,
                                                            master: master,
                                                            lastUpdateTime: utils.DateTime.getCurrentDateTime(),
                                                            lastUpdateUser: session.user._id,
                                                            updateTimestap: utils.DateTime.getCurrentTimestamp(),
                                                            roles: roles,
                                                            isRead: false
                                                        },
                                                        $unset: {businessStat: 1}
                                                    };
                                                    mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).update({_id: data._id}, update, {w: 1}, function (err) {
                                                        if (!err) {
                                                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).find({"businessId": business._id},{sort: {"sortTime":-1}, limit: 1}).toArray(function (err, docs) {
                                                                var lastHistory = docs[0];
                                                                var history = {
                                                                    _id: utils.UUID.generateUuid(),
                                                                    businessId: business._id,
                                                                    fromStep: business.step,
                                                                    step: lastStep,
                                                                    action: 'backIn',
                                                                    time: utils.DateTime.getCurrentDateTime(),
                                                                    date: utils.DateTime.getCurrentDate(),
                                                                    sortTime: utils.DateTime.getCurrentTimestamp(),
                                                                    excuteData: {
                                                                        backInfo: data.backInfo
                                                                    },
                                                                    excuteUser: session.user._id,
                                                                    master: master,
                                                                    excuteFlag: true
                                                                };

                                                                if(lastStepData.ctype){
                                                                    history.stepProcessTime = utils.DateTime.getDifferenceTime(utils.DateTime.getCurrentDateTime(),lastHistory.time);
                                                                    history.ctype = lastStepData.ctype;
                                                                    history.ctime = lastStepData.ctime;
                                                                }

                                                                //if (master) {
                                                                //    util.notifyUser(master, fields.BUSINESS_NOTIFY_ASSIGN, {}, session);
                                                                //} else {
                                                                //    util.notifyRoles(roles, fields.BUSINESS_NOTIFY_ASSIGN_ROLE, {}, session);
                                                                //}

                                                                if (master) {
                                                                    util.notifyBusinessUser(business._id,business.customer,master, session);
                                                                } else {
                                                                    util.notifyBusinessRoles(business._id,business.customer,roles,session);
                                                                }

                                                                mongo.db().collection(fields.DB_APP_BUSINESS_NOTIFY).remove({"busId":business._id} ,{w:1}, function (err){
                                                                    if(!err) {
                                                                        logger.app.error('db remove app_business_notify error:' + err);
                                                                    }
                                                                });

                                                                mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).insert(history, {w: 1}, function (err) {
                                                                    if (!err) {
                                                                        handler._getBusinessById(session, business._id, function (err, business) {
                                                                            if (!err) {
                                                                                result.success = true;
                                                                                result.data = business;
                                                                            }
                                                                            callback(result);
                                                                        });

                                                                    } else {
                                                                        logger.app.error("", err);
                                                                        callback(result);
                                                                    }

                                                                });
                                                            });

                                                        } else {
                                                            logger.app.error("", err);
                                                            callback(result);
                                                        }
                                                    });
                                                });
                                            } else {
                                                logger.app.error("", err);
                                                callback(result);
                                            }
                                        });

                                    } else {
                                        logger.app.error("", err);
                                        callback(result);
                                    }
                                });
                            } else {
                                result.errorCode = "403";
                                callback(result);
                            }
                        },true);
                    } else {
                        result.errorCode = "403";
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err || new Error(""));
                callback(result);
            }
        });
    },

    /**
     * 执行业务动作，进行业务流转
     */
    excuteBusinessStepAction: function (data, session, callback) {
        var result = {success: false};
        var businessId = data._id, nextAction = data.actionId, nextUser = data.master;
        delete data._id, delete data.accountId, delete data.master;
        handler._flowBusinessTask(businessId, data.customer,nextAction, nextUser, data, session, function (err , errorCode) {
            if (!err) {
                handler._getBusinessById(session, businessId, function (err, business) {
                    if (!err) {
                        result.success = true;
                        result.data = business || {};
                    }
                    callback(result);
                });

            } else {
                if(errorCode){
                    result.errorCode = errorCode;
                }
                callback(result);
            }

        });
    },
    getBusinessInfoById: function (data, session, callback) {
        var result = {success: false};
        var condition = data;
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).findOne(condition, function(err , doc){
            if(!err){
                var business = doc ||{};
                var cid = business.customer;
                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err, dbCustomer){
                    if(!err){
                        dbCustomer = dbCustomer ||{};
                        result.success = true;
                        result.data = {
                            business : business,
                            customer : dbCustomer
                        };
                        callback(result);
                    } else {
                        logger.app.error('', err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error('', err);
                callback(result);
            }
        });
    },
    /**
     * 根据业务单id，获取业务单详细信息。
     */
    getBusinessDetailById: function (data, session, callback) {
        var result = {success: false};
        var condition = data;
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).findOne(condition, function (err, doc) {
            if (!err) {
                var business = doc || {};
                if(doc){
                    mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne({_id: doc.flow}, function (err, flow) {
                        if(!err){
                            //如果设置了工单总时长,计算工单剩余总时长
                            var ctype = flow.ctype;
                            if(ctype){
                                doc.totalExpireTime = handler._getBusinessTotalExpireTime(doc.createTime,ctype,flow.ctime) - new Date();
                            }
                            //
                            result.data = doc || {};
                            condition = {businessId: data._id};
                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).find(condition, {sort: {sortTime: -1}}).toArray(function (err, docs) {
                                if (!err) {
                                    result.data.history = docs;
                                    mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({"_id":doc.step}, function (err, step) {
                                        if(!err){
                                            var firstSetp = null;
                                            var createFlag = false;
                                            var newProcessTime = 0 ;
                                            for(var i=docs.length -1; i >= 0; i--){
                                                var entity = docs[i];
                                                if(entity.stepProcessTime){
                                                    newProcessTime += entity.stepProcessTime;
                                                }
                                                if(flow.ctype && !createFlag ){//获得工单最初创建时间
                                                    if(entity.action == "create"){
                                                        createFlag = true;
                                                        result.data.totalExpireTime = handler._getBusinessTotalExpireTime(entity.time,flow.ctype,flow.ctime) - new Date();
                                                    }
                                                }
                                                if(entity.step == business.step){
                                                    firstSetp = docs[i];
                                                    break;
                                                }
                                            }
                                            if(newProcessTime!=0){
                                                result.data.processTime = newProcessTime;
                                            }
                                            //如果设置了单步时长
                                            var ctype = step.ctype;
                                            if(firstSetp && ctype){
                                                result.data.stepExpireTime = handler._getBusinessTotalExpireTime(firstSetp.time,ctype,step.ctime) - new Date();
                                            }
                                            //
                                            if (business.callId) {
                                                mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_CALL_SHEET).findOne({CALL_SHEET_ID: business.callId}, function (err, fondCdr) {
                                                    if (!err && fondCdr) {
                                                        var callType = fondCdr.CONNECT_TYPE;
                                                        if (fondCdr.STATUS && fondCdr.STATUS == "dealing") {
                                                            result.data.linkCall = true;
                                                        }
                                                        result.data.callTime = fondCdr.OFFERING_TIME;
                                                        result.data.callAgent = fondCdr.DISPOSAL_AGENT;
                                                        result.data.recordUrl = fondCdr.FILE_SERVER + "/" + fondCdr.RECORD_FILE_NAME;
                                                        if (callType == "normal") {
                                                            result.data.callNum = fondCdr.CALL_NO;
                                                        } else {
                                                            result.data.callNum = fondCdr.CALLED_NO;
                                                        }
                                                        result.success = true;
                                                        callback(result);
                                                    } else {
                                                        result.data.linkCall = false;
                                                        result.success = true;
                                                        callback(result);
                                                    }
                                                });
                                            } else {
                                                result.success = true;
                                                callback(result);
                                            }
                                        }else{
                                            logger.app.error('', err);
                                            callback(result);
                                        }
                                    })
                                } else {
                                    logger.app.error('', err);
                                    callback(result);
                                }
                            });
                        }else{
                            logger.app.error('', err);
                            callback(result);
                        }
                    })
                }else{
                    result.message = "该工单已信息已被删除!";
                    callback(result);
                }
            } else {
                logger.app.error('', err);
                callback(result);
            }
        });
    },
    /**
     * 获取用户是否有新的代办业务
     */
    hasNewUnDealBusiness: function (timestap, session, callback) {
        var condition = {
            account: session.user.account,
            master: "",
            "roles.role": {$in: session.user.role},
            status: "dealing",
            updateTimestap: {$gt: timestap}
        };
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).count(condition, function (err, count) {
            if (!err) {
                count = count || 0;
                callback(null, count);
            } else {
                logger.app.error("", err);
                callback(err);
            }

        });
    },
    /**
     * 获取用户的代办业务单
     */
    getUnDealBusiness: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {
            "account": session.user.account,
            master: session.user._id,
            "status": "dealing"
        };
        util.removeEmptyAndProcessCondition(data);
        for (var key in data) {
            if (!condition[key]) {
                if (key == "businessStat" && data[key] == "undeal") {
                    condition["businessStat"] = {"$exists": false};
                } else {
                    condition[key] = data[key];
                }
            }
        }

        if(condition.ownercomCreateUser || condition.ownerdepCreateUser)
            utils.setUserLevelCondition2Many(condition,'createUser','business',session,false,"business");

        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                condition.customer = {$in: ids};
                delete condition.query;
                handler._queryBusinessList(session, condition, limit, skip, callback);
            });
        } else {
            handler._queryBusinessList(session, condition, limit, skip, callback);
        }
    },
    getRoleUnDealBusiness: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {
            "account": session.user.account,
            master: "",
            "roles.role": {$in: session.user.role || []},
            "status": "dealing"
        };
        util.removeEmptyAndProcessCondition(data);
        for (var key in data) {
            if (!condition[key]) {
                condition[key] = data[key];
            }
        }

        if(condition.ownercomCreateUser || condition.ownerdepCreateUser)
            utils.setUserLevelCondition2Many(condition,'createUser','business',session,false,"business");

        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                condition.customer = {$in: ids};
                delete condition.query;
                handler._queryBusinessList(session, condition, limit, skip, callback);
            });
        } else {
            handler._queryBusinessList(session, condition, limit, skip, callback);
        }
    },
    /**
     * 获取用户的已完成业务单
     */
    getFinishedBusiness: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {
            "status": "complete",
            "createUser": session.user._id
        };
        util.removeEmptyAndProcessCondition(data);
        if (!data.master) delete data.master;
        for (var key in data) {
            if (!condition[key]) {
                condition[key] = data[key];
            }
        }
        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                condition.customer = {$in: ids};
                delete condition.query;
                handler._queryBusinessList(session, condition, limit, skip, callback);
            });
        }
        else {

            handler._queryBusinessList(session, condition, limit, skip, callback);
        }

    },
    /**
     * 获取所有业务单
     */
    getAllBusiness: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {
        };
        util.removeEmptyAndProcessCondition(data);
        if (!data.master) delete data.master;
        for (var key in data) {
            if (!condition[key]) {
                condition[key] = data[key];
            }
        }
        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                condition.customer = {$in: ids};
                delete condition.query;
                handler._queryBusinessList(session, condition, limit, skip, callback);
            });
        } else {
            handler._queryBusinessList(session, condition, limit, skip, callback);
        }
    },
    /**
     *获取用户分配的业务单
     */
    getAssignedBusiness: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {
            "account": session.user.account,
            "createUser": session.user._id
        };
        util.removeEmptyAndProcessCondition(data);
        if (!data.master) delete data.master;
        for (var key in data) {
            if (!condition[key]) {
                condition[key] = data[key];
            }
        }
        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                condition.customer = {$in: ids};
                delete condition.query;
                handler._queryBusinessList(session, condition, limit, skip, callback);
            });
        }
        else {

            handler._queryBusinessList(session, condition, limit, skip, callback);
        }
    },
    /**
     *获取用户参与的业务单
     */
    getFollowedBusiness: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var historyCondition = {master: session.user._id};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).distinct("businessId", historyCondition, function (err, docs) {
            if (!err) {
                docs = docs || [];
                var condition = {_id: {$in: docs}};
                util.removeEmptyAndProcessCondition(data);
                if (!data.master) delete data.master;
                for (var key in data) {
                    if (!condition[key]) {
                        condition[key] = data[key];
                    }
                }
                //需要根据快捷查询条件过滤
                if(condition.master || condition.createUser || condition.ownercom || condition.ownerdep
                    || condition.ownercomCreateUser || condition.ownerdepCreateUser){
                    if(condition.master || condition.ownercom || condition.ownerdep){
                        utils.setUserLevelCondition(condition,'master','business',session);
                    }

                    if(condition.createUser || condition.ownercomCreateUser || condition.ownerdepCreateUser ){
                        utils.setUserLevelCondition2Many(condition,'createUser','business',session);
                    }
                }
                //
                if (data.query) {
                    handler._queryCustomerByName(session, data.query, function (err, ids) {
                        condition.customer = {$in: ids};
                        delete condition.query;
                        handler._queryBusinessList(session, condition, limit, skip, callback);
                    });
                }
                else {

                    handler._queryBusinessList(session, condition, limit, skip, callback);
                }
            } else {
                logger.app.error("", err);
                callback({success: false, message: err.message});
            }
        });
    },

    getAllUncompleteBusiness: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {
            status: "dealing"
        };
        util.removeEmptyAndProcessCondition(data);
        if (!data.master) delete data.master;
        for (var key in data) {
            if (!condition[key]) {
                condition[key] = data[key];
            }
        }

        var scope=session.user.scope.business;
        if(scope!=fields.data_scope_all){
            condition["$or"]=[{"roles.role": {$in: session.user.role || []}}];
            utils.setUserLevelCondition(condition,'master','business',session);
            utils.setUserLevelCondition2Many(condition,'createUser','business',session);
            if(condition.master){
                condition["$or"].push({master:condition.master});
                delete condition.master;
            }
            if(condition.createUser){
                condition["$or"].push({createUser:condition.createUser});
                delete condition.createUser;
            }
        }
        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                condition.customer = {$in: ids};
                delete condition.query;
                handler._queryBusinessList(session, condition, limit, skip, callback);
            });
        }
        else {
            handler._queryBusinessList(session, condition, limit, skip, callback);
        }
    },
    getAllFinishedBusiness: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {
            status: "complete"
        };
        util.removeEmptyAndProcessCondition(data);
        if (!data.master) delete data.master;
        for (var key in data) {
            if (!condition[key]) {
                condition[key] = data[key];
            }
        }

        var scope=session.user.scope.business;
        if(scope!=fields.data_scope_all){
            condition["$or"]=[{"roles.role": {$in: session.user.role || []}}];
            utils.setUserLevelCondition(condition,'master','business',session);
            utils.setUserLevelCondition2Many(condition,'createUser','business',session);
            if(condition.master){
                condition["$or"].push({master:condition.master});
                delete condition.master;
            }
            if(condition.createUser){
                condition["$or"].push({createUser:condition.createUser});
                delete condition.createUser;
            }
        }
        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                condition.customer = {$in: ids};
                delete condition.query;
                handler._queryBusinessList(session, condition, limit, skip, callback);
            });
        } else {
            handler._queryBusinessList(session, condition, limit, skip, callback);
        }
    },
    addBusinessBackInfo: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        handler._getBusinessById(session, id, function (err, business) {
            if (!err) {
                var history = {
                    _id: utils.UUID.generateUuid(),
                    businessId: id,
                    step: business.step,
                    action: 'comment',
                    excuteData: {backInfo: data.backInfo},
                    time: utils.DateTime.getCurrentDateTime(),
                    sortTime: utils.DateTime.getCurrentTimestamp(),
                    master: session.user._id
                };
                handler._addBusinessHistory(session, history, function (err) {
                    if (!err) {
                        handler._updateBusinessById(session, id, function (err) {
                            if (!err) {
                                result.success = true;
                            }
                            callback(result);
                        });
                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });

    },
    /**
     * 添加业务单
     */
    addBusinessTask: function (data, session, callback) {
        var result = {success: false};
        var flowId = data.flow;
        var nextAction = data.nextAction;
        var nextUser = data.nextUser;
        delete data.nextAction;
        delete data.nextUser;
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).find({flow_id: flowId}).toArray(function (err, docs) {
            if (!err) {
                var steps = docs || [];
                var startStep = handler._getStartStep(steps);
                var businessTask = data;
                if (businessTask._id) {
                    var businessId = businessTask._id;
                    delete businessTask._id;
                    var saveFlag = "save";
                    handler._getBusinessById(session, businessId, function (err, businessquery) {
                        if (!err && businessquery) {
                            if (businessquery.saveFlag && businessquery.saveFlag == "temp") {
                                saveFlag = "temp";
                                businessTask.saveFlag = "create";
                            }
                            handler._checkBusinessStep(businessquery, nextAction, session.user, function (isAccess) {
                                if(isAccess){
                                    businessTask.step = startStep._id;
                                    businessTask.status = 'dealing';
                                    var now = utils.DateTime.getCurrentDateTime();
                                    businessTask.createTime = now;
                                    businessTask.lastUpdateTime = now;
                                    businessTask.createDate = utils.DateTime.getCurrentDate();
                                    businessTask.updateTimestap = utils.DateTime.getCurrentTimestamp();
                                    businessTask.lastUpdateUser = session.user._id;
                                    businessTask.createUser = session.user._id;
                                    businessTask.master = session.user._id;
                                    businessTask.number = businessquery.number;

                                    mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).update({_id: businessId}, {$set: businessTask}, {w: 1}, function (err) {
                                        if (!err) {
                                            var createAction = saveFlag == "temp" ? "create" : "recreate";
                                            var businessTaskHistory = {
                                                _id: utils.UUID.generateUuid(),
                                                businessId: businessId,
                                                step: businessTask.step,
                                                action: createAction,
                                                excuteAction: nextAction,
                                                excuteUser: nextUser,
                                                excuteData: data,
                                                time: businessTask.createTime,
                                                date: utils.DateTime.getCurrentDate(),
                                                sortTime: utils.DateTime.getCurrentTimestamp(),
                                                master: session.user._id,
                                                reportFlag: createAction
                                            };
                                            businessTask._id = businessId;
                                            businessTask.customer = businessquery.customer;
                                            if(createAction == "create"){
                                                businessTask.account =  session.user.account;
                                                appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_NEW_BUSINESS,businessTask);
                                            }
                                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).insert(businessTaskHistory, {w: 1}, function (err) {
                                                if (!err) {
                                                    handler._flowBusinessTask(businessId, businessTask.customer,nextAction, nextUser, null, session, function (err) {
                                                        if (!err) {

                                                            handler._getBusinessById(session, businessId, function (err, business) {
                                                                if (!err) {
                                                                    result.success = true;
                                                                    result.data = business;
                                                                }
                                                                callback(result);
                                                            });
                                                        } else {
                                                            callback(result);
                                                        }
                                                    });
                                                } else {
                                                    logger.app.error('save business history error!', err);
                                                    callback(result);
                                                }
                                            });

                                            var commonHistory = {
                                                _id : businessTask._id,
                                                type : "business",
                                                customer : businessTask.customer,
                                                createTime : businessTask.createTime,
                                                businessType : businessTask.flow,
                                                agent : businessTask.createUser,
                                                status : businessTask.step,
                                                lastUpdateTime : businessTask.createTime,
                                                comments : "",
                                                beginTime : new Date().getTime(),
                                                endTime : "",
                                                dispose : ""
                                            };
                                            historyHandler.addHistroy(commonHistory , session , function(success){
                                                if(!success){
                                                    logger.app.error("add customer common history error!");
                                                }
                                            });

                                        } else {
                                            logger.app.error("", err);
                                            callback(result);
                                        }
                                    });
                                } else {
                                    result.errorCode = "403";
                                    callback(result);
                                }
                            },true);

                        } else {
                            callback(result);
                        }
                    });
                } else {
                    businessTask._id = utils.UUID.generateUuid();
                    businessTask.account = session.user.account;
                    businessTask.step = startStep._id;
                    businessTask.status = 'dealing';
                    var now = utils.DateTime.getCurrentDateTime();
                    businessTask.createTime = now;
                    businessTask.lastUpdateTime = now;
                    businessTask.createDate = utils.DateTime.getCurrentDate();
                    businessTask.updateTimestap = utils.DateTime.getCurrentTimestamp();
                    businessTask.lastUpdateUser = session.user._id;
                    businessTask.createUser = session.user._id;
                    businessTask.master = session.user._id;

                    utils.BusinessUtil.getBusinessNum(session.user.account, function (err, numberdata) {
                        if (!err) {
                            businessTask.number = numberdata.num;
                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).insert(businessTask, {w: 1}, function (err) {
                                if (!err) {
                                    var businessTaskHistory = {
                                        _id: utils.UUID.generateUuid(),
                                        businessId: businessTask._id,
                                        step: businessTask.step,
                                        action: 'create',
                                        excuteAction: nextAction,
                                        excuteUser: nextUser,
                                        excuteData: data,
                                        time: businessTask.createTime,
                                        date: utils.DateTime.getCurrentDate(),
                                        sortTime: utils.DateTime.getCurrentTimestamp(),
                                        master: session.user._id,
                                        reportFlag: "create"
                                    };
                                    appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_NEW_BUSINESS,businessTask);
                                    mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).insert(businessTaskHistory, {w: 1}, function (err) {
                                        if (!err) {
                                            handler._flowBusinessTask(businessTask._id, businessTask.customer,nextAction, nextUser, null, session, function (err) {
                                                if (!err) {
                                                    handler._getBusinessById(session, businessTask._id, function (err, business) {
                                                        if (!err) {
                                                            result.success = true;
                                                            result.data = business;
                                                        }
                                                        callback(result);
                                                    });
                                                } else {
                                                    callback(result);
                                                }

                                            });
                                        } else {
                                            logger.app.error('save business history error!', err);
                                            callback(result);
                                        }
                                    });

                                    var commonHistory = {
                                        _id : businessTask._id,
                                        type : "business",
                                        customer : businessTask.customer,
                                        createTime : businessTask.createTime,
                                        businessType : businessTask.flow,
                                        agent : businessTask.createUser,
                                        status : businessTask.step,
                                        lastUpdateTime : businessTask.createTime,
                                        comments : "",
                                        beginTime : new Date().getTime(),
                                        endTime : "",
                                        dispose : ""
                                    };
                                    historyHandler.addHistroy(commonHistory , session , function(success){
                                        if(!success){
                                            logger.app.error("add customer common history error!");
                                        }
                                    });

                                } else {
                                    logger.app.error('save business flow error!', err);
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error("", err);
                            callback(result);
                        }
                    });
                }
            } else {
                logger.app.error('query flow step error!', err);
                callback(result);
            }
        });
    },
    readBusiness : function (data ,session ,callback){
        var result = {success: false};
        var id = data._id;
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).findOne({_id:id},function(err , dbBusiness){
            if(!err && dbBusiness){
                if(dbBusiness.master == session._id){
                    mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).update({_id:id},{$set:{isRead:true}},function(err){
                        if(!err){
                            result.success = true;
                            callback(result);
                        } else {
                            result.message = "read error!";
                            callback(result);
                        }
                    });
                } else {
                    result.message = "not allow to read !";
                    result.success = true;
                    callback(result);
                }
            } else {
                result.message = "can not found message!";
                callback(result);
            }
        });
    },
    /**
     * 暂存业务单
     */
    addTempBusinessTask: function (data, session, callback) {
        var result = {success: false};
        var flowId = data.flow;
        var nextAction = data.nextAction;
        var nextUser = data.nextUser;
        delete data.nextAction;
        delete data.nextUser;

        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).find({flow_id: flowId}).toArray(function (err, docs) {
            if (!err) {
                var steps = docs || [];
                var startStep = handler._getStartStep(steps);
                var businessTask = data;
                businessTask.account = session.user.account;
                businessTask.step = startStep._id;
                businessTask.status = 'dealing';
                var now = utils.DateTime.getCurrentDateTime();
                businessTask.lastUpdateTime = now;
                businessTask.updateTimestap = utils.DateTime.getCurrentTimestamp();
                businessTask.lastUpdateUser = session.user._id;
                businessTask.master = session.user._id;
                businessTask.saveFlag = "temp";
                if (!businessTask._id) {
                    businessTask._id = utils.UUID.generateUuid();
                    businessTask.createUser = session.user._id;
                    businessTask.createTime = now;
                    utils.BusinessUtil.getBusinessNum(session.user.account, function (err, number) {
                        if (!err) {
                            businessTask.number = number.num;
                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).insert(businessTask, {w: 1}, function (err) {
                                if (!err) {
                                    handler._getBusinessById(session, businessTask._id, function (err, business) {
                                        if (!err) {
                                            result.success = true;
                                            result.data = business;
                                        }
                                        callback(result);
                                    });
                                    //var commonHistory = {
                                    //    _id : businessTask._id,
                                    //    type : "business",
                                    //    customer : businessTask.customer,
                                    //    createTime : businessTask.createTime,
                                    //    businessType : businessTask.flow,
                                    //    agent : businessTask.createUser,
                                    //    status : businessTask.step,
                                    //    lastUpdateTime : businessTask.createTime,
                                    //    comments : "",
                                    //    beginTime : new Date().getTime(),
                                    //    endTime : "",
                                    //    dispose : ""
                                    //};
                                    //historyHandler.addHistroy(commonHistory , session , function(success){
                                    //    if(!success){
                                    //        logger.app.error("add customer common history error!");
                                    //    }
                                    //});
                                } else {
                                    logger.app.error('save business flow error!', err);
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error("", err);
                            callback(result);
                        }
                    });

                } else {
                    var id = businessTask._id;
                    delete businessTask._id;
                    mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).update({_id: id}, {$set: businessTask}, {w: 1}, function (err) {
                        if (!err) {
                            handler._getBusinessById(session, id, function (err, business) {
                                if (!err) {
                                    result.success = true;
                                    result.data = business;
                                }
                                callback(result);
                            });

                            var commonHistory = {
                                _id : businessTask._id,
                                type : "business",
                                customer : businessTask.customer,
                                createTime : businessTask.createTime,
                                businessType : businessTask.flow,
                                agent : businessTask.createUser,
                                status : businessTask.step,
                                lastUpdateTime : businessTask.createTime,
                                comments : "",
                                beginTime : new Date().getTime(),
                                endTime : "",
                                dispose : ""
                            };
                            historyHandler.addHistroy(commonHistory , session , function(success){
                                if(!success){
                                    logger.app.error("add customer common history error!");
                                }
                            });
                        } else {
                            logger.app.error('save business flow error!', err);
                            callback(result);
                        }
                    });
                }


            } else {
                logger.app.error('query flow step error!', err);
                callback(result);
            }
        });
    },
    deleteBusiness : function ( data , session , callback ){
        var result = {success: false};
        var  query = data.query;
        delete data.query;
        var condition = {};
        util.removeEmptyAndProcessCondition(data);
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }

        if(query){
            handler._queryCustomerByName(session, query, function (err, ids) {
                condition.customer = {$in: ids};
                handler._deleteBusiness(session , condition ,function(err){
                   if(!err){
                       result.success = true;
                   } else {
                       result.message = "删除数据异常";
                   }
                   callback(result);
                });
            });
        } else {
            handler._deleteBusiness(session , condition ,function(err){
                if(!err){
                    result.success = true;
                } else {
                    result.message = "删除数据异常";
                }
                callback(result);
            });
        }


    },

    getBusinessCount : function ( data , session ,callback){
        var result = {success: false};
        var  query = data.query;
        delete data.query;
        var condition = {};

        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }

        if(query){
            handler._queryCustomerByName(session, query, function (err, ids) {
                condition.customer = {$in: ids};
                handler._queryBusinessCount(session , condition ,function(count){
                   if(count){
                       result.success = true;
                       result.count = count;
                   } else {
                       result.message = "获取业务数据异常！";
                   }
                    callback(result);
                });
            });
        } else {
            handler._queryBusinessCount(session , condition ,function(count){
                if(count){
                    result.success = true;
                    result.count = count;
                } else {
                    result.message = "获取业务数据异常！";
                }
                callback(result);
            });
        }
    },
    /**
     * for 客服版
     * @param data
     * @param session
     * @param callback
     */
    queryBusByScope: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {};
        util.removeEmptyAndProcessCondition(data);
        if (!data.master) delete data.master;
        for (var key in data) {
            if (!condition[key]) {
                condition[key] = data[key];
            }
        }
        var scope=session.user.scope.business;
        if(scope!=fields.data_scope_all){
            //判断是否输入了处理人或创建者组件高级查询条件
            if(condition.master || condition.createUser || condition.ownercom || condition.ownerdep
                 || condition.ownercomCreateUser || condition.ownerdepCreateUser){
                if(condition.master || condition.ownercom || condition.ownerdep){
                    utils.setUserLevelCondition(condition,'master','business',session);
                }

                if(condition.createUser || condition.ownercomCreateUser || condition.ownerdepCreateUser ){
                    utils.setUserLevelCondition2Many(condition,'createUser','business',session);
                }
            }else{
                condition["$or"]=[{"roles.role": {$in: session.user.role || []},"master":""}];
                utils.setUserLevelCondition(condition,'master','business',session);
                utils.setUserLevelCondition2Many(condition,'createUser','business',session);

                if(condition.master){
                    condition["$or"].push({master:condition.master});
                    delete condition.master;
                }
                if(condition.createUser){
                    condition["$or"].push({createUser:condition.createUser});
                    delete condition.createUser;
                }
            }

        }else{
            if(condition.master || condition.createUser || condition.ownercom || condition.ownerdep
                || condition.ownercomCreateUser || condition.ownerdepCreateUser){
                if(condition.master || condition.ownercom || condition.ownerdep){
                    utils.setUserLevelCondition(condition,'master','business',session,false,"business");
                }

                if(condition.createUser || condition.ownercomCreateUser || condition.ownerdepCreateUser ){
                    utils.setUserLevelCondition2Many(condition,'createUser','business',session,false,"business");
                }
            }
        }


//        console.dir(condition);
        if (data.query) {
            handler._queryCustomerByName(session, data.query, function (err, ids) {
                condition.customer = {$in: ids};
                delete condition.query;
                handler._queryBusinessList(session, condition, limit, skip, callback);
            });
        } else {
            handler._queryBusinessList(session, condition, limit, skip, callback);
        }
    },
    getUnDealBusNum: function (data, session, callback) {
        var result = {success: false};
        var condition = {
            "account": session.user.account,
            master: session.user._id,
            "status": "dealing"
        };
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).count(condition, function (err, count) {
            if(!err){
                result.total=count;
                condition.isRead=true;
                mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).count(condition, function (err, num) {
                    if(!err){
                        result.noReadNum=count-num;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getRoleUnDealBuNum: function (data, session, callback) {
        var result = {success: false};
        var condition = {
            "account": session.user.account,
            master: "",
            "roles.role": {$in: session.user.role || []},
            "status": "dealing"
        };
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).count(condition, function (err, count) {
            if(!err){
                result.roleNum=count;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    refreshUndealNum:function(data, session, callback){
        var result = {success: false};
        businessHandler.getRoleUnDealBuNum(data,session,function(rep){
            if(rep.success){
                result.roleNum=rep.roleNum;
                businessHandler.getUnDealBusNum(data,session,function(rep){
                    if(rep.success){
                        result.total=rep.total;
                        result.noReadNum=rep.noReadNum;
                        result.success=true;
                        callback(result);
                    }else{
                        callback(rep);
                    }
                });
            }else{
                callback(rep);
            }
        })
    },

    delBusAttach :function (data, session,callback) {
        var result = {success: false};
        var aid=session.user.account;
        var fileId=data.fileId;
        var field=data.field;
        var _set={$pull:{}};
        _set.$pull[field]={id:fileId};
        if(data._id){
            mongo.db(session).collection(aid+"_business").update({_id:data._id},_set, function (err){
                if (!err) {
                    qiniuHandler.delFile({key:fileId},session,function(){});
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error('delBusAttach error:' + err);
                    callback(result);
                }
            });
        }else{
            result.success = true;
            callback(result);
        }
    }

};





var handler = {
    _linkBusinessHistoryData: function (tasks, history) {
        tasks = tasks || [];
        history = history || [];
        for (var i = 0; i < tasks.length; i++) {
            var tasksItem = tasks[i];
            for (var k = 0; k < history.length; k++) {
                var historyItem = history[k];
                if (tasksItem._id == historyItem.businessId) {
                    tasksItem.historyData = {};
                    if (tasksItem.number) {
                        tasksItem.historyData.number = tasksItem.number;
                    }
                    for (var key in historyItem.excuteData) {
                        if (tasksItem[key]) {
                            tasksItem.historyData[key] = tasksItem[key];
                        } else {
                            tasksItem.historyData[key] = historyItem.excuteData[key];
                        }
                    }

                }
            }
        }
    },
    _setBusinessHistoryProcessTime: function (businessId, session, callback) {
        var query = {
            businessId: businessId,
            $or: [
                {action: "transformIn", excuteUser: session.user._id},
                {action: "assign", excuteUser: session.user._id},
                {action: "backIn", excuteUser: session.user._id}

            ]
        };
        var sort = {
            sortTime: -1
        };
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).findOne(query, {sort: sort}, function (err, doc) {
            if (!err) {
                var processTime = 0;
                if (doc) {
                    var time = Math.floor(doc.sortTime / 1000);
                    var now = Math.floor(utils.DateTime.getCurrentTimestamp() / 1000);
                    processTime = now - time;
                }
                callback(null, processTime);
            } else {
                callback(err);
            }
        });
    },
    _addBusienssReportHisotry: function (history, session) {
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).insert(history, function () {
        });
    },
    _getTaskIds: function (tasks) {
        tasks = tasks || [];
        var result = [];
        for (var i = 0; i < tasks.length; i++) {
            var tasksItem = tasks[i];
            result.push(tasksItem._id);
        }
        return result;
    },
    _queryCustomerByName: function (session, query, callback) {
        var condition = {
            //name: new RegExp(query)
            name:query
        };
        solrHandler.queryIndex2Cust(condition,session,function(rep){
            if(rep.success){
                delete query.name;
                var ids=rep.ids||[];
                callback(null, ids);
                //mongo.db(session).collection(session.account.account + fields.DB_C5_CUSTOMER).distinct("_id", condition, function (err, ids) {
                //    callback(err, ids);
                //});
            }else{
                logger.app.error("query solr index error");
                callback(null,[]);
            }
        });
    },
    _isAccessUser: function (id, callback) {
        var condition = {
            _id: id,
            status: "enable"
        };
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne(condition, callback);
    },

    _deleteBusiness : function (session , condition , callback){
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).remove(condition , function (err){
            callback(err);
        });
    },

    _queryBusinessCount : function (session , condition , callback){
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).count(condition, function (err , count){
           if(!err){
               callback(count);
           } else {
               callback(null);
           }
        });
    },

    _queryBusinessList: function (session, condition, limit, skip, callback) {
        //console.dir(condition);
        var result = {success: false};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).find(condition, {sort: {lastUpdateTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                var ids = [];
                for (var i = 0; i < docs.length; i++) {
                    ids.push(docs[i].customer);
                }
//                mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).distinct("customer", condition, function (err, ids) {
//                    if (!err) {
                ids = ids || [];
                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find({_id: {$in: ids}}, {fields: {name: 1}}).toArray(function (err, customers) {
                    if (!err) {
                        customers = customers || [];
                        util.processLinkData(docs, customers, "customer");
                        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).count(condition, function (err, count) {
                            if (!err) {
                                result.success = true;
                                result.list = docs;
                                result.count = count;
                                delete condition.query;
                                delete condition.customer;
                                delete condition._id;
                                result.condition = condition;
                                result.businessTime = utils.DateTime.getCurrentTimestamp();
                                callback(result);
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }

                        });
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
//                    }
//                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _updateBusinessById: function (session, id, callback) {
        var update = {
            $set: {
                lastUpdateTime: utils.DateTime.getCurrentDateTime(),
                updateTimestap: utils.DateTime.getCurrentTimestamp(),
                lastUpdateUser: session.user._id
            }
        };
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).update({_id: id}, update, function (err) {
            callback(err);
        });
    },
    _getBusinessById: function (session, id, callback) {
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).findOne({_id: id}, function (err, business) {
            callback(err, business);
        });
    },
    _addBusinessHistory: function (session, history, callback) {
        mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).insert(history, function (err) {
            callback(err);
        });
    },

    _getStepActionRoles: function (session, stepId, callback) {
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: stepId}, function (err, step) {
            if (!err) {
                var actions = step.actions || [];
                var roles = [];
                for (var i = 0; i < actions.length; i++) {
                    var actionsItem = actions[i];
                    if (actionsItem.actionRole) {
                        roles.push({role: actionsItem.actionRole});
                    }
                }
                callback(null, roles,step);
            } else {
                callback(err);
            }
        });
    },
    _getStartStep: function (steps) {
        steps = steps || [];
        for (var i = 0; i < steps.length; i++) {
            if (steps[i].isBegin) {
                return steps[i];
            }
        }
        return null;
    },
    /**
     * 校验业务的执行步骤
     * 判断当前业务是否可以执行此action
     * 包括步骤判断和用户权限判断
     */
    _checkBusinessStep: function (business, nextAction, executeUser, callback, isCreate) {
        var step = business.step || "";
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: step}, function (err, doc) {
            if (!err && doc) {
                if(isCreate && doc.isBegin){//创建工单 开始步骤 忽略校验 action
                    handler._checkBusinessUserRole(business,executeUser,function(isAccess){
                        callback(isAccess);
                    },true);
                } else {
                    var actions = doc.actions || [];
                    for (var i = 0; i < actions.length; i++) {
                        var action = actions[i] || {};
                        if (action._id == nextAction) {
                            handler._checkBusinessUserRole(business,executeUser,function(isAccess){
                                callback(isAccess);
                            },true);
                            return;
                        }
                    }
                    logger.app.error("can not execute action [" + nextAction + "] step [" + step + "]", err || new Error(""));
                    callback(false);
                }
            } else {
                logger.app.error("not found step [" + step + "]", err || new Error(""));
                callback(false);
            }
        });
    },
    /**
     * 判断工单是否可以被退回
     * @param business
     * @param callback
     * @private
     */
    _checkBusinessBack : function (business , callback){
        var step = business.step || "";
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: step}, function (err, doc) {
            if (!err && doc) {
                if(doc.isBegin){
                    callback(false);
                } else {
                    callback(true);
                }
            } else {
                logger.app.error("not found step [" + step + "]", err || new Error(""));
                callback(false);
            }
        });
    },
    /**
     * 判断用户是否有业务的执行权限
     * @param business
     * @param user
     * @param callback
     * @private
     */
    _checkBusinessUserRole: function (business, user, callback , isMaster) {
        if(isMaster){
            if(!business.master || business.master == user._id){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            var businessRoles = business.roles || [];
            var userRoles = user.role || [];
            for (var i = 0; i < businessRoles.length; i++) {
                var bRole = businessRoles[i].role || "";
                for (var m = 0; m < userRoles.length; m++) {
                    var uRole = userRoles[m];
                    if (bRole == uRole) {
                        callback(true);
                        return;
                    }
                }
            }
            callback(false);
        }
    },
    /**
     * 进行业务单的流转
     * @param businessId
     * 业务单id
     * @param nextAction
     * 动作
     * @param nextUser
     * 处理人
     * @param actionData
     * 动作数据
     * @param session
     * @param callback
     * @private
     */
    _flowBusinessTask: function (businessId, customerId,nextAction, nextUser, actionData, session, callback) {
        actionData = actionData || {};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).findOne({_id: businessId}, function (err, doc) {
            if (!err && doc) {
                var business = doc;
                handler._checkBusinessStep(business, nextAction, session.user, function (isAccess) {
                    if (isAccess){
                        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: business.step, "actions._id": nextAction}, {"actions.$": 1,"ctime":1,"ctype":1}, function (err, step) {
                            if (!err) {
                                var jumpTo = step.actions[0].jumpTo;
                                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: jumpTo}, function (err, jumpStep) {
                                    if (!err) {
                                        var udpatedata = actionData;
                                        var isSystem = false;
                                        var currentDateTime = utils.DateTime.getCurrentDateTime();
                                        if (jumpStep.type == "sys") {
                                            udpatedata.status = jumpStep.systemFn;
                                            udpatedata.master = session.user._id;
                                            isSystem = jumpStep.systemFn;
                                            udpatedata.processTime = utils.DateTime.getDifferenceTime(currentDateTime, business.createTime);
                                            udpatedata.processEndTime = currentDateTime;
                                        }
                                        if (!udpatedata.master) {
                                            udpatedata.master = nextUser;
                                        }
                                        udpatedata.step = jumpTo, udpatedata.lastUpdateUser = session.user._id, udpatedata.lastUpdateTime = currentDateTime, udpatedata.updateTimestap = utils.DateTime.getCurrentTimestamp();

                                        //设置当前提醒时间
                                        //先删除表内已有相同工单的提醒
                                        mongo.db().collection(fields.DB_APP_BUSINESS_NOTIFY).remove({"busId":businessId} ,{w:1}, function (err){
                                                if(!err){
                                                    //有时间并且不是系统时间
                                                    if(jumpStep.ctype && jumpStep.type != "sys"){
                                                        //插入工单提醒表
                                                        var notifyInfo = {
                                                            _id:utils.UUID.generateUuid(),
                                                            flowId:jumpStep.flow_id,
                                                            busId:businessId,
                                                            step:jumpStep._id,
                                                            account:session.account.account,
                                                            notifyUser:jumpStep.notifyUser || "",
                                                            expireTime:utils.DateTime.getDateFormat(handler._getBusinessTotalExpireTime(currentDateTime,jumpStep.ctype,jumpStep.ctime))
                                                        }
                                                        mongo.db().collection(fields.DB_APP_BUSINESS_NOTIFY).insert(notifyInfo,function(err){
                                                            if(err){
                                                                logger.app.error('db insert app_business_notify error:' + err);
                                                            }
                                                        });
                                                    }
                                                }else{
                                                    logger.app.error('db remove app_business_notify error:' + err);
                                                }
                                        });

                                        handler._getStepActionRoles(session, jumpTo, function (err, roles) {
                                            if (!err) {

                                                udpatedata.roles = roles;
                                                if(udpatedata.master){
                                                    udpatedata.isRead = false;
                                                }
                                                mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS).update({_id: businessId}, {$set: udpatedata, $unset: {businessStat: 1} }, {w: 1}, function (err) {
                                                    if (!err) {
                                                        handler._setBusinessHistoryProcessTime(businessId, session, function (err, processTime) {
                                                            if (!err) {

                                                                //db.getCollection('N00000000456_business_history').find({"businessId":"5d715fd0-975e-11e6-8a54-3f292c8c7e99","step":"b653d750-94dd-11e6-b256-cb8039656536"}).sort({"time":1}).limit(1);
                                                                //查询上一步时间:
                                                                mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).find({"businessId":businessId},{sort: {"sortTime":-1}, limit: 1}).toArray(function (err, docs) {
                                                                    var lastHistory = docs[0];
                                                                    if(!err){
                                                                        var history = {
                                                                            _id: utils.UUID.generateUuid(),
                                                                            businessId: businessId,
                                                                            fromStep: business.step,
                                                                            step: jumpTo,
                                                                            action: 'transformIn',
                                                                            time: utils.DateTime.getCurrentDateTime(),
                                                                            date: utils.DateTime.getCurrentDate(),
                                                                            sortTime: utils.DateTime.getCurrentTimestamp(),
                                                                            excuteAction: nextAction,
                                                                            excuteUser: nextUser,
                                                                            excuteData: actionData,
                                                                            master: session.user._id,
                                                                            processTime: processTime
                                                                        };

                                                                        if(lastHistory){
                                                                            history.stepProcessTime = utils.DateTime.getDifferenceTime(utils.DateTime.getCurrentDateTime(),lastHistory.time);
                                                                            if(step.ctime && step.ctime != "0" && lastHistory.action != "create"){
                                                                                history.ctime = step.ctime;
                                                                                history.ctype = step.ctype;
                                                                            }else if(lastHistory.action == "create"){
                                                                                delete history.stepProcessTime;
                                                                            }
                                                                        }

                                                                        if (udpatedata.master) {
                                                                                //util.notifyUser(business,udpatedata.master, fields.BUSINESS_NOTIFY_ASSIGN, {}, session);
                                                                                util.notifyBusinessUser(businessId,customerId,udpatedata.master, session);
                                                                            } else {
                                                                                //util.notifyRoles(business,udpatedata.roles, fields.BUSINESS_NOTIFY_ASSIGN_ROLE, {}, session)
                                                                                util.notifyBusinessRoles(businessId,customerId,udpatedata.roles,session);
                                                                            }
                                                                            //event
                                                                            if(isSystem){//end
                                                                                var eventData = {
                                                                                    _id : business._id,
                                                                                    user : session.user._id,
                                                                                    flow : business.flow,
                                                                                    account : session.account.account,
                                                                                    time : currentDateTime,
                                                                                    processTime : processTime,
                                                                                    finishTime : udpatedata.processTime
                                                                                };
                                                                                if(isSystem == "complete"){
                                                                                    appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_NEXT_STEP_BUSINESS,eventData);
                                                                                    appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_FINISH_BUSINESS,eventData);
                                                                                } else {
                                                                                    appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_CANCEL_BUSINESS,eventData);
                                                                                }
                                                                            } else {
                                                                                var eventData = {
                                                                                    _id : business._id,
                                                                                    user : session.user._id,
                                                                                    flow : business.flow,
                                                                                    account : session.account.account,
                                                                                    time : currentDateTime,
                                                                                    processTime : processTime
                                                                                };
                                                                                appEvent.emitBusinessReportEvent(appEvent.EventType.BUS_NEXT_STEP_BUSINESS,eventData);
                                                                            }


                                                                            mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).insert(history, function (err) {
                                                                                if (!err) {
                                                                                    if (isSystem) {
                                                                                        var history = {
                                                                                            _id: utils.UUID.generateUuid(),
                                                                                            businessId: businessId,
                                                                                            action: isSystem,
                                                                                            master: session.user._id,
                                                                                            time: utils.DateTime.getCurrentDateTime(),
                                                                                            date: utils.DateTime.getCurrentDate(),
                                                                                            sortTime: utils.DateTime.getCurrentTimestamp()
                                                                                        };
                                                                                        handler._addBusienssReportHisotry(history, session);
                                                                                    } else if(udpatedata.master){
                                                                                        var history = {
                                                                                            _id: utils.UUID.generateUuid(),
                                                                                            businessId: businessId,
                                                                                            step: jumpTo,
                                                                                            action: 'assign',
                                                                                            excuteData: {master: udpatedata.master},
                                                                                            excuteUser:session.user._id,
                                                                                            date: utils.DateTime.getCurrentDate(),
                                                                                            time: utils.DateTime.getCurrentDateTime(),
                                                                                            sortTime: utils.DateTime.getCurrentTimestamp() + 1,
                                                                                            master: session.user._id
                                                                                        }

                                                                                        if(lastHistory){
                                                                                            history.stepProcessTime = 0;
                                                                                            if(step.ctime && step.ctime != "0" && lastHistory.action != "create"){
                                                                                                history.ctime = step.ctime;
                                                                                                history.ctype = step.ctype;
                                                                                            }else if(lastHistory.action == "create"){
                                                                                                delete history.stepProcessTime;
                                                                                            }
                                                                                        }

                                                                                        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_BUSINESS_HISTORY).insert(history);
                                                                                    }
                                                                                    callback(null);
                                                                                } else {
                                                                                    logger.app.error('insert business history error!', err);
                                                                                    callback(err);
                                                                                }
                                                                            });
                                                                            //update common history
                                                                            var commonHistory = {
                                                                                status : udpatedata.step,
                                                                                lastUpdateTime : currentDateTime
                                                                            };
                                                                            if(isSystem){ //end
                                                                                commonHistory.endTime = new Date().getTime();
                                                                                commonHistory.dispose = isSystem;
                                                                            }
                                                                            historyHandler.updateHistory(businessId , commonHistory , session , function(isSuccess){
                                                                                if(!isSuccess){
                                                                                    logger.app.error("update business common history error!");
                                                                                }
                                                                            });
                                                                        }
                                                                });
                                                            } else {
                                                                logger.app.error('get business history process time error!', err);
                                                                callback(err);
                                                            }
                                                        });

                                                    } else {
                                                        logger.app.error('update business  error!', err);
                                                        callback(err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("", err);
                                                callback(err);
                                            }
                                        });

                                    } else {
                                        callback(err);
                                    }
                                });
                            } else {
                                logger.app.error('get business step action error!', err);
                                callback(err);
                            }
                        });
                    } else {
                        callback(new Error("403 not access!"),"403");
                    }
                });
            } else {
                logger.app.error('get business error!', err || new Error(""));
                callback(err || new Error(""));
            }
        });
    },
    /**
     *  根据工单创建时间得到到期日期
     * @param busCreateTime
     * @param ctype
     * @param ctime
     * @private
     */
    _getBusinessTotalExpireTime :function (busCreateTime,ctype,ctime){
        busCreateTime = busCreateTime.replace(/-/g,"/");
        var busCreateDate = new Date(busCreateTime);//先转换成时间类型
        if(ctype == "min"){
            busCreateDate.setMinutes(busCreateDate.getMinutes() + parseInt(ctime));
        }else if(ctype == "hours"){
            busCreateDate.setHours(busCreateDate.getHours() + parseInt(ctime));
        }else {
            busCreateDate.setDate(busCreateDate.getDate() + parseInt(ctime));
        }
        return busCreateDate;
    }

}


var util = {
    notifyUser: function (user, type, data, session) {
        if (session.user._id != user) {
            var params = {
                user: user,
                type: type,
                data: data
            }
            syncAcs.messageNotify(params, session, function () {
            });
        }
    },
    notifyRoles: function (roles, type, data, session) {
        roles = roles || [];
        var queryRoles = [];
        for (var i = 0; i < roles.length; i++) {
            queryRoles.push(roles[i].role);
        }
        var accountId = session.user.account;
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account: accountId, product: 'cc', role: {$in: queryRoles}}).toArray(function (err, users) {
            users = users || [];

            for (var i = 0; i < users.length; i++) {
                util.notifyUser(users[i]._id, type, data, session);
            }
        });


    },
    removeEmptyAndProcessCondition: function (data) {
        for (var key in data) {
            if (!data[key] && key != "master") {
                delete data[key];
            }else if(data[key] instanceof Array  && data[key].length==0) {
                delete data[key];
            } else {
                var temp = key.split("\$");
                if (temp.length == 2 && temp[0]) {
                    if (temp[1] == "begin") {
                        if (data[temp[0]]) {
                            data[temp[0]].$gte = data[key];
                        } else {
                            data[temp[0]] = {$gte: data[key]};
                        }
                    } else if (temp[1] == "end") {
                        if (data[temp[0]]) {
                            data[temp[0]].$lte = data[key];
                        } else {
                            data[temp[0]] = {$lte: data[key]};
                        }

                    }
                    delete data[key];
                }
            }
        }
    },

    processLinkData: function (data, linkdata, key) {
        for (var i = 0; i < data.length; i++) {
            var dataItem = data[i];
            for (var j = 0; j < linkdata.length; j++) {
                var linkdataItem = linkdata[j];
                if (dataItem[key] == linkdataItem._id) {
                    for (var linkKey in linkdataItem) {
                        if (linkKey != "_id") {
                            dataItem[linkKey] = linkdataItem[linkKey];
                        }
                    }
                }
            }
        }
    },
    notifyBusinessUser : function(businessId,customerId,userId,session){
        if (session.user._id != userId) {
            var notifyInfo = {
                type:"businessUser",//
                businessId:businessId,//
                customerId:customerId,//
                userId:userId,//
                account:session.account.account
            }
            mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
                if(err){
                    logger.app.error('db insert app_notify error:' + err);
                }
            });
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne({"_id":userId},{"BUSINESS_MSG_REFUSE":1},function (err, userObj) {
                if(err){
                    logger.app.error("notifyUser query failed :", err);
                    return;
                }
                if(userObj != null){
                    var push = false;
                    if(userObj.BUSINESS_MSG_REFUSE == null){    //never set refuse push
                        push = true;
                    }else if(userObj.BUSINESS_MSG_REFUSE == false){     //set no refuse
                        push = true;
                    }else if(userObj.BUSINESS_MSG_REFUSE == "MINE" && !bulk){   //set refuse others
                        push = true;
                    }else{
                        push = false;
                    }
                    if(push){
                        var data1 = {
                            sessionId : userId
                        };
                        var url = config.uc_node_server_url + '?action=pushBusinessMsg&data=' + JSON.stringify(data1);
                        url = encodeURI(url);
                        http.sendGet(url, function(err, result){
                            if(err){
                                logger.app.error('send push request error');
                            }else{
                                logger.app.info(result.toString());
                            }
                        });
                    }else{
                        //platform_user refuse business message push
                        logger.app.info('platform_user ' + userObj._id + ' refuse business message push');
                    }
                }else{
                    logger.app.info('can not find platformUser with ID : ' + user);
                }
            });
        }
    },
    notifyBusinessRoles: function (businessId,customerId,roles,session) {
        roles = roles || [];
        var queryRoles = [];
        for (var i = 0; i < roles.length; i++) {
            queryRoles.push(roles[i].role);
        }
        var accountId = session.user.account;
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account: accountId, product: 'cc', role: {$in: queryRoles}}).toArray(function (err, users) {
            users = users || [];
            for (var i = 0; i < users.length; i++) {
                util.notifyBusinessUser(businessId,customerId,users[i]._id, session);
            }
        });
    }
}

module.exports = businessHandler;

