var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');

var businessHandler = {

    queryAccountBusinessFlow: function (data, session, callback) {
        var result = {success: false};
        var condition = {account: session.user.account};
        var option = {fields: {_id: 1, name: 1, status: 1}, sort: {status: -1, createTime: 1}};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).find(condition, option).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                result.success = true;
                result.data = docs;
            } else {
                logger.app.error("queryBusinessFlow from db error! ", err);
                result.message = "queryBusinessFlow from db error！";
            }
            callback(result);
        });
    },
    addBusinessFlow: function (data, session, callback) {
        var result = {success: false};
        data.account = session.user.account;
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.createUser = session.user._id;
        data._id = utils.UUID.generateUuid();
        data.status = "enable";
        data.version = utils.generateVersion();
        if(!data.ctime || data.ctime == "0"){
            delete data.ctime;
            delete data.ctype;
        }


        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne({account:session.account.account,name: data.name}, function (err, oneFlow) {
            if (!oneFlow) {
                impl.__addBusinessFlow(data, function (err) {
                    if (!err) {
                        var completeStep = {
                            _id: utils.UUID.generateUuid(),
                            flow_id: data._id,
                            name: "业务完成",
                            isBegin: false,
                            master: '',
                            custom_fields: [],
                            actions: [],
                            type: "sys",
                            systemFn: "complete",
                            createUser: session.user._id,
                            createTime: utils.DateTime.getCurrentDateTime(),
                            lastUpdateTime: utils.DateTime.getCurrentDateTime()
                        };
                        impl.__addBusinessFlowStep(completeStep, function (err) {
                            if (!err) {
                                data.flows = [];
                                data.flows.push(completeStep);
                                var cancelStep = {
                                    _id: utils.UUID.generateUuid(),
                                    flow_id: data._id,
                                    name: "业务取消",
                                    isBegin: false,
                                    master: '',
                                    type: "sys",
                                    systemFn: "cancel",
                                    custom_fields: [],
                                    actions: [],
                                    createUser: session.user._id,
                                    createTime: utils.DateTime.getCurrentDateTime(),
                                    lastUpdateTime: utils.DateTime.getCurrentDateTime()
                                };
                                impl.__addBusinessFlowStep(cancelStep, function (err) {
                                    if (!err) {
                                        data.flows.push(cancelStep);
                                        result.success = true;
                                        result.data = data;
                                    } else {
                                        logger.app.error('insert db collection' + fields.DB_ACCOUNT_BUSINESS_FLOW + 'error!', err);
                                        result.message = 'insert data to db  error!';
                                    }
                                    utils.generateCacheVersion(session.account.account,"business");
                                    callback(result);
                                });
                            } else {
                                callback(result);
                            }
                        });
                    } else {
                        callback(result);
                    }
                });
            } else {
                result.success = false;
                result.message = "流程名称已经存在！";
                callback(result);
            }

        });
    },
    queryBusinessFlowSteps: function (data, session, callback) {
        var result = {success: false};
        var option = {sort: {createTime: 1}};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).find(data, option).toArray(function (err, docs) {
            if (!err) {
                //查询流程
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne({"_id":docs[0].flow_id}, function (err, oneFlow) {
                    if(!err){
                        result.success = true;
                        result.data = docs || [];
                        result.flowInfo = oneFlow
                        callback(result);
                    }else{
                        logger.app.error('find from db [' + fields.DB_ACCOUNT_BUSINESS_FLOW + '] error!', err);
                        result.message = 'find data from db error!';
                    }
                });
            } else {
                logger.app.error('find from db [' + fields.DB_ACCOUNT_BUSINESS_FLOW_STEP + '] error!', err);
                result.message = 'find data from db error!';
            }
        });
    },
    queryBusinessFlowStep: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne(data, function (err, doc) {
            if (!err) {
                //查出上一步工单的字段
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({"actions.jumpTo":data._id}, function (err, lastSetp) {
                    if(!err){
                        if(lastSetp){
                            if(lastSetp.isBegin){ //如果是开始步骤,直接读取步骤字段
                                result.lastStepFields =  lastSetp.stepFields;
                            }else{//读取步骤动作字段
                                var actions = lastSetp.actions;
                                if(actions && actions[0] && actions[0].actionFields.length > 0){
                                    result.lastStepFields =  actions[0].actionFields;
                                }
                            }
                        }
                        result.success = true;
                        result.data = doc;
                        callback(result);
                    }else{
                        result.message = 'find lastSetp data from db error!';
                        callback(result);
                    }
                })
            } else {
                logger.app.error('find from db [' + fields.DB_ACCOUNT_BUSINESS_FLOW_STEP + '] error!', err);
                result.message = 'find data from db error!';
                callback(result);
            }

        });
    },
    addBusinessFlowStep: function (data, session, callback) {
        var result = {success: false};

        var step = {
            _id: utils.UUID.generateUuid(),
            flow_id: data._id,
            name: data.name,
            isBegin: false,
            master: '',
            stepFields: [],
            actions: [],
            type: "user",
            createUser: session.user._id,
            createTime: utils.DateTime.getCurrentDateTime(),
            lastUpdateTime: utils.DateTime.getCurrentDateTime()
        };

        if(data.ctime && data.ctime != "0"){
            step.ctime = data.ctime;
            step.ctype =  data.ctype;
        }
        if(data.notifyUser){
            step.notifyUser = data.notifyUser.split(",")
        }
        impl.__addBusinessFlowStep(step, function (err) {
            if (!err) {
                result.success = true;
                result.data = step;
            } else {
                logger.app.error('update db [' + fields.DB_ACCOUNT_BUSINESS_FLOW_STEP + '] error!', err);
                result.message = 'update db error!';
            }
            callback(result);
        });
    },
    updateBusinessFlowStep: function (data, session, callback) {
        var result = {success: false};
        var condition = {_id: data._id};
        delete data._id;
        if(!data.ctime || data.ctime == "0"){
            delete data.ctime;
            delete data.ctype;
        }
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update(condition, {$set: data}, function (err) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error('update db [' + fields.DB_ACCOUNT_BUSINESS_FLOW_STEP + '] error!', err);
                result.message = 'update db error!';
            }
            callback(result);
        });
    },
    addBusinessStepAction: function (data, session, callback) {
        var result = {success: false};
        var actionName =data.name;
        var stepId = data._id;

        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id:stepId,"actions.name":actionName},function(err,doc){
            if(doc){
                result.message = "动作名称已经存在！";
                callback(result);
            }else{
                var condition = {_id: data._id};
                delete data._id;
                data._id = utils.UUID.generateUuid();
                data.actionFields = [];
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update(condition, {$push: {actions: data}}, {w: 1}, function (err) {
                    if (!err) {
                        impl._udpateBusinessRoles(session, stepId, function (err) {
                            if (!err) {
                                result.success = true;
                                result.data = data;
                            } else {
                                logger.app.error("", err);
                            }
                            callback(result);
                        });

                    } else {
                        logger.app.error("addBusinessStepAction error!", err);
                        result.message = "db error!";
                        callback(result);
                    }

                });
            }
        });

    },
    addBusinessStepField: function (data, session, callback) {
        var result = {success: false};
        var condition = {_id: data._id};
        delete data._id;
        data._id = utils.UUID.generateUuid();
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update(condition, {$push: {stepFields: data}}, function (err) {
            if (!err) {
                result.success = true;
                result.data = data;
            } else {
                logger.app.error("addBusinessStepField error!", err);
                result.message = "db error!";
            }
            callback(result);
        });
    },
    deleteBusinessStepField: function (data, session, callback) {
        var result = {success: false};
        var condition = {_id: data._id};
        var field = data.fieldId;
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update(condition, {$pull: {stepFields: {_id: field}}}, function (err) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error("deleteBusinessStepField error!", err);
                result.message = "db error!";
            }
            callback(result);
        });
    },
    updateBusinessStepInfo: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        var flow_id = data.flow_id;
        delete data.flow_id;
        if(data.notifyUser){
            data.notifyUser = data.notifyUser.split(",")
        }
        if (data.isBegin) {
            mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update({flow_id: flow_id}, {$set: {isBegin: false}}, {multi: true,w:1}, function (err) {
                if (!err) {
                    mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update({_id: id}, {$set: data}, function (err) {
                        if (!err) {
                            result.success = true;
                            utils.generateCacheVersion(session.account.account,"business");
                            impl._generateVersion(flow_id,function(err){
                                if(err){
                                    logger.app.error("update business flow version error!", err);
                                }
                            });
                        } else {
                            logger.app.error("updateBusinessStepInfo error!", err);
                            result.message = "db error!";
                        }
                        callback(result);
                    });
                } else {
                    logger.app.error("updateBusinessStepInfo error!", err);
                    result.message = "db error!";
                }
            });
        } else {
            mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update({_id: id}, {$set: data}, function (err) {
                if (!err) {
                    result.success = true;
                    utils.generateCacheVersion(session.account.account,"business");
                    impl._generateVersion(flow_id,function(err){
                        if(err){
                            logger.app.error("update business flow version error!", err);
                        }
                    });
                } else {
                    logger.app.error("updateBusinessStepInfo error!", err);
                    result.message = "db error!";
                }
                callback(result);
            });
        }
    },
    updateBusinessStepFields: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete   data._id;
        data.stepFields = impl._processFieldsData(data.stepFields);
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update({_id: id}, {$set: data}, function (err) {
            if (!err) {
                result.steps=data.stepFields;
                result.success = true;
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: id},function(err,step){
                    if(!err && step){
                        var flow_id = step.flow_id;
                        utils.generateCacheVersion(session.account.account,"business");
                        impl._generateVersion(flow_id,function(err){
                            if(err){
                                logger.app.error("update business flow version error!", err);
                            }
                        });
                    }else{
                        logger.app.error("updateBusinessStepFields find step error!", err);
                    }
                })
            } else {
                logger.app.error("updateBusinessStepFields error!", err);
                result.message = "db error!";
            }
            callback(result);
        });
    },
    queryBusinessStepAction: function (data, session, callback) {
        var result = {success: false};
        var stepId = data._id;
        var actionId = data.actionId;

        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: stepId, "actions._id": actionId}, {"actions.$": 1}, function (err, doc) {
            if (!err) {
                result.success = true;
                if (doc)
                    result.data = doc.actions[0];
            } else {
                logger.app.error("queryBusinessStepAction error!", err);
                result.message = "db error!";
            }
            callback(result);
        });
    },
    udpateBusinessStepAction: function (data, session, callback) {
        var result = {success: false};
        var update = data.update;
        update.actionFields = impl._processFieldsData(update.actionFields);
        for (var key in update) {
            update["actions.$." + key] = update[key];
            delete update[key];
        }
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update({_id: data._id, "actions._id": data.actionId}, {$set: data.update}, {w: 1}, function (err) {
            if (!err) {
                impl._udpateBusinessRoles(session, data._id, function (err) {
                    if (!err) {
                        result.success = true;
                        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: data._id},function(err,step){
                            if(!err && step){
                                var flow_id = step.flow_id;
                                utils.generateCacheVersion(session.account.account,"business");
                                impl._generateVersion(flow_id,function(err){
                                    if(err){
                                        logger.app.error("update business flow version error!", err);
                                    }
                                });
                            }else{
                                logger.app.error("updateBusinessStepFields find step error!", err);
                            }
                        })

                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });

            } else {
                logger.app.error("udpateBusinessStepAction error!", err);
                result.message = "db error!";
                callback(result);
            }

        });
    },
    deleteBusinessStepAction: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).update({_id: data._id}, {$pull: {actions: {_id: data.actionId}}}, {w: 1}, function (err) {
            if (!err) {
                impl._udpateBusinessRoles(session, data._id, function (err) {
                    if (!err) {
                        result.success = true;
                        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: data._id},function(err,step){
                            if(!err && step){
                                var flow_id = step.flow_id;
                                utils.generateCacheVersion(session.account.account,"business");
                                impl._generateVersion(flow_id,function(err){
                                    if(err){
                                        logger.app.error("update business flow version error!", err);
                                    }
                                });
                            }else{
                                logger.app.error("updateBusinessStepFields find step error!", err);
                            }
                        })
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
            } else {
                logger.app.error("deleteBusinessStepAction error!", err);
                result.message = "db error!";
                callback(result);
            }

        });
    },
    addBusinessFlowFields: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_FIELD).findOne({flow_id: data.flow_id, name: data.name}, function (err, oneFields) {
            if (oneFields && oneFields._id != data._id) {
                result.message = "字段名称已经存在！";
                callback(result);
            } else {
                if (!data._id) {
                    data._id = utils.UUID.generateUuid();
                    mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_FIELD).insert(data, function (err) {
                        if (!err) {
                            result.success = true;
                        } else {
                            logger.app.error("addBusinessFlowFields error!", err);
                            result.message = "db error!";
                        }
                        callback(result);
                    });
                } else {
//                    var id = data._id;
//                    delete data._id;
                    console.log(data);
                    mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_FIELD).save(data, function (err) {
                        if (!err) {
                            result.success = true;
                        } else {
                            logger.app.error("addBusinessFlowFields error!", err);
                            result.message = "db error!";
                        }
                        callback(result);
                    });
                }

                utils.generateCacheVersion(session.account.account,"business");
                impl._generateVersion(data.flow_id,function(err){
                    if(err){
                        logger.app.error("update business flow version error!", err);
                    }
                });
            }
        });
    },
    queryAllBusinessFlowFields: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_FIELD).find(data).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                result.data = docs;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    queryBusinessFlowFields: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete  data.query;
        if (query) {
            data.name = new RegExp(query);
        }
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_FIELD).find(data, {limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_FIELD).count(data, function (err, count) {
                    if (!err) {
                        result.success = true;
                        result.list = docs || [];
                        result.count = count;
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
            } else {
                logger.app.error("queryBusinessFlowFields error!", err);
                result.message = "db error!";
                callback(result);
            }

        });
    },
    getBusinessFolwById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne(data, function (err, doc) {
            if (!err) {
                result.data = doc;
                if(doc){
                    mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).find({"flow_id": doc._id}).toArray(function(err,steps){
                        if(!err){
                            result.success = true;
                            result.steps = steps
                            callback(result);
                        }else{
                            logger.app.error("", err);
                            callback(result);
                        }
                    });
                }
            } else {
                logger.app.error("", err);
                callback(result);
            }

        });
    },
    updateBusinessFlowInfo: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete  data._id;
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne({name: data.name,account:session.account.account}, function (err, oneFlow) {
            if (oneFlow && oneFlow._id != id) {
                result.message = "流程名称已经存在！";
                callback(result);
            } else {
                data.version = utils.generateVersion(data.version);//添加版本号
                utils.generateCacheVersion(session.account.account,"business");
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                    if (!err) {
                        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne({_id: id}, function (err, data) {
                            if (!err) {
                                result.success = true;
                                result.data = data;
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
            }

        });


    },
    changeStatusBusinessFlow: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        var update = {
            $set: data
        };
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).update({_id: id}, update, {w: 1}, function (err) {
            if (!err) {
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne({_id: id}, function (err, flow) {
                    if (!err) {
                        result.success = true;
                        result.data = flow;

                        utils.generateCacheVersion(session.account.account,"business");
                        impl._generateVersion(id,function(err){
                            if(err){
                                logger.app.error("update business flow version error!", err);
                            }
                        });
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
    queryBusinessReport : function( data , session , callback){
        var result = {success : false};
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        if(data.name){
            data.name = new RegExp(data.name);
        }
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_REPORT).find(data, {limit: limit, skip: skip}).toArray(function(err,docs){
           if(!err){
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_REPORT).count(data,function(err,count){
                    if(!err){
                        result.success = true;
                        result.list = docs || [];
                        result.count = count;
                    } else {
                        result.message = "获取报表配置信息失败";
                    }
                    callback(result);
                });

           } else {
               logger.app.error("queryBusinessReport error!", err);
               result.message = "获取报表配置信息失败!";
               callback(result);
           }
        });
    },
    saveBusinessReportInfo: function (data, session, callback) {
        var result = {success : false};
        var name = data.name || "";
        if(data._id){
            var id = data._id;
            delete data._id;
            mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_REPORT).find({name:name}).toArray(function(err,docs){
                if(!err){
                    if(docs.length == 0 || (docs.length == 1 && docs[0]._id == id)){
                        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_REPORT).update({_id:id},data,function(err){
                            if(!err){
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error("saveBusinessReportInfo error",err);
                                result.message = "保存报表信息失败！";
                                callback(result);
                            }
                        });
                    } else {
                        result.message = "报表["+name+"]已经存在！";
                        callback(result);
                    }
                } else {
                    logger.app.error("saveBusinessReportInfo error",err);
                    result.message = "保存报表信息失败!";
                    callback(result);
                }
            });
        } else {
            mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_REPORT).findOne({name:name},function(err,doc){
                if(!err && !doc){
                    data._id = utils.UUID.generateUuid();
                    mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_REPORT).insert(data,function(err){
                        if(!err){
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("saveBusinessReportInfo error",err);
                            result.message = "保存报表信息失败！";
                            callback(result);
                        }
                    });
                } else {
                    result.message = "报表["+name+"]已经存在！";
                    callback(result);
                }
            });
        }
    },
    getBusinessReportConfigById : function(data,session,callback){
        var result = {success : false};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_REPORT).findOne(data,function(err,doc){
            if(!err){
                result.success = true;
                result.data = doc || {};
                callback(result);
            } else {
                logger.app.error("getBusinessReportConfigById error!",err);
                result.message = "获取报表配置信息失败！";
                callback(result);
            }
        });
    },
    addBusinessReportField : function(data,session,callback){
        var result = {success : false};
        var reportId = data.reportId;
        delete data.reportId;
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_REPORT).update();
    }
}

var impl = {
    _processFieldsData: function (data) {
        data = data || [];
        for (var i = 0; i < data.length; i++) {
            for (var m = 0; m < data[i].cols.length; m++) {
                for (var n = 0; n < data[i].cols[m].fields.length; n++) {
                    var field = data[i].cols[m].fields[n];
                    if (!field._id) {
                        field._id = utils.UUID.generateUuid();
                    }
                }
            }
        }
        return data;
    },
    __addBusinessFlowStep: function (step, callback) {
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).insert(step, function (err) {
            if (!err) {
                callback(null);
            } else {
                callback(err);
            }
        });
    },
    __addBusinessFlow: function (flow, callback) {
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).insert(flow, function (err) {
            if (!err) {
                callback(null);
            } else {
                callback(err);
            }
        });
    },
    _udpateBusinessRoles: function (session, stepId, callback) {
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
                mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_BUSINESS).update({account: session.account.account, step: stepId}, {$set: {roles: roles}}, {multi: true}, function (err) {
                    if (!err) {
                        callback(null);
                    } else {
                        callback(err);
                    }
                });
            } else {
                callback(err);
            }
        });
    },
    _generateVersion : function (flowId,callback){
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne({"_id":flowId},function(err,flow){
            if(!err){
                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).update({"_id":flowId},{$set:{"version":utils.generateVersion(flow.version)}},function(err){
                    if(err){
                        callback(err)
                    }else{
                        callback(null)
                    }
                });
            }else{
                callback(err)
            }
        });
    }
}

module.exports = businessHandler;
