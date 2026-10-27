var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var custHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');
var Thenjs = require("thenjs");
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var emailChannelHanlder = require(__baseDir + '/dishui/app/multiChannel/EmailChannelHandler');
var redisUtils = require("m7rds");
var redisField = require(__baseDir + '/dishui/common/RedisKeyPrefix');
var Session = require('appSession/lib/Session');
var reportEvent = require("appEvent/ReportEvent");

var handler = {
    locationCustomer: function (data, session, callback) {
        var result = {success: false};
        var cid = data.customerId;
        var id = data.callId;
        Thenjs(function (cont) {
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).findOne({_id: id}, cont);

        }).then(function (cont, doc) {
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(
                {'from.addr': doc.from.addr, account: session.user.account, customerId: null},
                {$set: {customerId: cid}},
                {multi: true, w: 1}, function (err) {
                    cont(err, doc);
                });

        }).then(function (cont, doc) {
            result.success = true;
            callback(result);
            mongo.db(session).collection(session.user.account+"_history").update({email:doc.from.addr, $or:[{customer:null},{customer:''}]}, {$set:{customer:cid}},{multi: true}, function(err){});
            //added by wangyn 定位客户时,将该回话邮箱地址,绑定到选定客户上(客户可能没有邮箱,也可能有多个邮箱)
            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).findOne({_id: cid}, function (err, custDoc) {
                if (!err && custDoc) {
                    var emailArr = custDoc.email || [];
                    var flag = true;
                    var emailResult = {};
                    for (var i = 0; i < emailArr.length; i++) {
                        if (emailArr[i].email != null) {
                            if (emailArr[i].email == doc.from.addr) {
                                ////如果客户有该邮件地址,不更新
                                flag = false;
                            }
                        }
                    }
                    if (flag) { //如果客户没有该邮件地址,更新
                        emailResult.email = doc.from.addr;
                        emailResult.memo = '';
                        emailArr.push(emailResult);
                        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update({_id:cid},{$set:{email:emailArr}},function(err){});
                    }
                }
            });
        }).fail(function (cont, err) {
            logger.app.error(err);
            result.message = err;
            callback(result);
        });

    },
    deleteCustomerImRelation: function (data, session, callback) {
        var result = {success: false};
        data.account = session.user.account;
        if (!data.customerId && !data.email) {
            result.message = "必须有customerId 以及 email";
            callback(result);
        } else {
            Thenjs(function (cont) {
                //删除关联
                var find = {'customerId': data.customerId, account: session.user.account};
                var set = {$unset: {customerId: 1,custName:1}};
                mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(find, set, {multi: true, w: 1}, cont);
            }).then(function (cont) {
                //删除该客户对应的此email
                var email = data.email;
                var aid = session.user.account;
                mongo.db(session).collection(aid + fields.DB_C5_CUSTOMER).update({_id: data.customerId}, {$pull: {email: {email: email}}}, {w: 1}, cont);
            }).then(function(cont){
                //删除对应的会话历史
                mongo.db(session).collection(session.user.account + "_history").update({customer: data.customerId}, {$set: {customer: ''}}, {multi: true}, cont);
            }).then(function (cont) {
                result.success = true;
                callback(result);
            }).fail(function (cont, err) {
                logger.app.error(err);
                result.message = err;
                callback(result);
            });
        }
    },


    queryMailInfo: function (data, session, callback) {
        var result = {success: false};
        var query = {
            _id: data._id
        }
        mongo.db().collection(fields.APP_EMAIL_MAILS).findOne(query, function (err, row) {
            if (!err) {
                result.success = true;
                result.row = row;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    dealInbox: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        var uid = session.user._id;
        var set = {
            status: 'deal'//undeal,deal
//            assign:uid
        }
        mongo.db().collection(fields.DB_APP_MAIL).update({_id: id}, {$set: set}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     *
     *         {
  "_id":"uuid",
  "msgType":"mail/weixin",
  "mailId":"",
  "to":"xxx,xxx",
  "cc":"xxx,xxx",
  "subject":"",
  "content":"",
  rid:"",//回复的邮件id
  account:"",
  uid:""//座席id
}
     * @param data
     * @param session
     * @param callback
     */
    replyInbox: function (data, session, callback) {
        var result = {success: false};
        var id = utils.UUID.generateUuid();
        var time = utils.DateTime.getCurrentDateTime();
        var aid = session.account.account;
        var uid = session.user._id;

        data.mailId = id;
        data.emailType = "reply";
        data.account = aid;
        data.agent = uid;
        data.createTime = time;
        data.action = "sendMail";
        var from = {name: ""};
        from.addr = data.from;
        try {
            data.fromName = decodeURIComponent(data.fromName);
        } catch (e) {

        }

        from.name = new Buffer(data.fromName).toString("base64");

        var to = {};
        try {
            data.toName = decodeURIComponent(data.toName);
        } catch (e) {

        }
        to.name = new Buffer(data.toName).toString("base64");
        to.addr = data.to;
        data.to = [to];
        data.from = from;
        data.cc = data.cc || [];
        data.traceId = utils.UUID.generateUuid();
        delete data.toName;
        var cc = [];
        for (var i = 0; i < data.cc.length; i++) {
            cc.push({addr: data.cc[i], name: ""});
        }
        data.cc = cc;

        //回复邮件时，默认带着座席的 格式为姓名[工号] 
        if (data.carryAgentInfo) {
            var loginName = session.user.loginName; //坐席工号
            var displayName = data.displayName; //坐席姓名
            var agentInfo = displayName + "[" + loginName + "]";
            data.agentInfo = agentInfo;
        }

        httpProvider.sendPost(config.msgUrl + "sendMail", "data=" + JSON.stringify(data), function (err, rep) {
            if (err) {
                logger.app.warn('replyInbox to gateway failed!', err);
                callback(result);
            } else {
                var res = JSON.parse(rep);
                if (res.success) {
                    result.success = true;
                    result.data = data;

                    var update = {$set:{lastEmailTimestamp: utils.getCurrentDateTime()}, $inc:{totalEmailNum:1, replyNum:1}};
                    var firstFlag = false; //首次回复标记
                    var firstReplyTimestamp = utils.getCurrentDateTime();
                    if (!data.firstReplyTime) {
                        var firstReplyTime = utils.getCurrentDate();
                        update.$set.firstReplyTime = firstReplyTime;
                        update.$set.firstReplyTimestamp = firstReplyTimestamp;
                        data.firstReplyTime = firstReplyTime;
                        firstFlag = true;
                    }
                    if (!data.agentFirstReplyTime) {
                        var agentFirstReplyTime = utils.getCurrentDate();
                        update.$set.agentFirstReplyTime = agentFirstReplyTime;
                        update.$set.agentFirstReplyTimestamp = utils.getCurrentDateTime();
                        data.agentFirstReplyTime = agentFirstReplyTime;
                    }
                    console.log(update);
                    mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update({_id: data.sessionId}, update, function (err) {});
                    handler._replyInboxReport(firstFlag,firstReplyTimestamp,data,session);
                } else {
                    logger.app.warn(result);
                }
                callback(result);
            }
        });
    },

    /**
     * 首次回复的报表处理
     */
    _replyInboxReport:function(firstFlag,firstReplyTimestamp,data,session){
        if(firstFlag){
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).findOne({_id: data.sessionId},function(err,mailSession){
                //首次响应时长计算 added by wangyn
                var reportData = {
                    reportTime: utils.getCurrentDate(),
                    //首次响应时长 = 首次回复时刻 - (最后转接时刻 || 最后领取时刻 || 接入系统时刻)
                    firstResponseTimeLength: firstReplyTimestamp - (mailSession.lastRedirectTime || mailSession.lastClaimTime || mailSession.createTimeStamp ),
                    agentId: session.user._id,
                    account: data.account
                };
                reportEvent.emitMailReportEvent(reportData);
            });
        }
        //坐席邮件回复成功 回复邮件数+1 added by wangyn
        var reportData = {
            reportTime: utils.getCurrentDate(),
            reportType: reportEvent.EventType.MAIL_NEW_OUT,
            agentId: session.user._id,
            account: session.user.account
        };
        reportEvent.emitMailReportEvent(reportData);
    },

    /**
     * 邮件转发
     * @param data
     * @param session
     * @param callback
     */
    forwardEmail: function (data, session, callback) {
        var result = {success: false};
        var id = utils.UUID.generateUuid();
        var aid = session.account.account;

        data.mailId = id;
        data.emailType = "forward"; //转发
        data.account = aid;
        data.action = "sendMail";
        try {
            data.fromName = decodeURIComponent(data.fromName);
        } catch (e) {

        }
        var from = {name: ""};
        from.addr = data.from; //发件人地址
        from.name = new Buffer(data.fromName).toString("base64"); //发件人名称
        data.from = from;

        httpProvider.sendPost(config.msgUrl + "sendMail", "data=" + JSON.stringify(data), function (err, rep) {
            if (err) {
                logger.app.warn('replyInbox to gateway failed!', err);
                callback(result);
            } else {
                var res = JSON.parse(rep);
                if (res.success) {
                    result.success = true;
                } else {
                    logger.app.warn(result);
                }
                callback(result);
            }
        });
    },

    saveRemark: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update({_id: data._id}, {$set: {remark: data.remark}}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
                mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({account:session.user.account, product: 'cc'}, function(err, doc){
                    if (err || !doc) {
                        callback(result);
                        return;
                    }
                    mongo.db(doc.dataDB).collection(session.user.account+"_history").update({_id:data._id}, {$set:{comments: data.remark}}, function(err){});
                });
            } else {
                logger.app.error(err);
                result.message = err;
                callback(result);
            }
        });
    },
    updateEmailSession: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(data.query,{$set: data.update},{multi:true, w:1},function(err){
            if (!err) {
                result.success = true;
                callback(result);
                if (data.update.status) {
                    var dispose = "";
                    if (data.update.status == "close") {
                        dispose = "关闭不处理";
                    } else if (data.update.status == "spam") {
                        dispose = "垃圾邮件,已删除";
                    }
                    mongo.db(session).collection(session.user.account+"_history").update(data.query, {$set:{status:data.update.status, agent: session.user._id, dispose: dispose}},{multi:true}, function(err){});
                }
                if (data.update.status == "close" || data.update.status == "spam") {
                    var num = -1;
                    if (typeof data.query._id == "object") {
                        num = data.query._id.$in.length;
                    }
                    mongo.db().collection(fields.DB_APP_PUSH_CLIENT).update({_id: session.user._id}, {$inc: {currDealEmailNum: num}});
                }
            } else {
                logger.app.error(err);
                result.message = err;
                callback(result);
            }
        });
    },

    /**
     * 写入联系历史
     * @param emailSession
     * @param session
     * @param callback
     * @private
     */
    _updateEmailMultiChannelHistory: function (emailSession, session, callback) {
        var result = {success: false};
        //mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({account:session.user.account, product: 'cc'}, function(err, doc){
        //
        //    if(err || !doc){
        //        callback(result);
        //        return;
        //    }
        var find = {_id: emailSession._id};
        var setDoc = {};

        var multiChannelHistory = {
            lastUpdateTime: utils.getCurrentDate()
        }
        if (emailSession.customerId) {
            multiChannelHistory.customer = emailSession.customerId;
        }
        if (emailSession.mchType == 'claim' || emailSession.mchType == 'redirect') {
            multiChannelHistory.agent = emailSession.agent;
        }
        if (emailSession.mchType == 'finish') {
            multiChannelHistory.endTime = utils.getCurrentDate();
            multiChannelHistory.dispose = emailSession.dispose;
            multiChannelHistory.status = 'finish';
        }

        setDoc['$set'] = multiChannelHistory;
            mongo.db(session).collection(session.user.account+"_history").update(find, setDoc,{upsert:true}, function(err){});
        callback(result);

        //});
    },
    _setQueryEmailCondition: function (query, session) {
        utils.removeEmptyProperty(query);
        delete query.page;
        delete query.limit;
        query.account = session.user.account;

        utils.setDateTimeCondition(query);
    },

    loadEmailHistory: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.APP_EMAIL_MAILS).find(data, {sort: {createTimeStamp: 1}}).toArray(function (err, emails) {
            if (!err) {
                result.success = true;
                result.list = emails || [];
                callback(result)
            } else {
                logger.app.error(err);
                result.message = err;
                callback(result);
            }
        });
    },



    queryAllMailList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit || 10;
        var name = data.query;
        delete data.emailType;
        delete data.limit;
        var page = data.page || 1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data || {};
        handler._setQueryEmailCondition(query, session);

        if (session.user.scope.email != fields.data_scope_all) {
            var query2 = {"agent": query.agent, "ownercom": query.ownercom, "ownerdep": query.ownerdep};
            utils.setUserLevelCondition(query2, 'agent', 'email', session);
            if (query.agent) {
                var lowUsers = session.user.moduleUsers.email;
                var flag = false;
                for (var i = 0; i < lowUsers.length; i++) {
                    var uid = lowUsers[i];
                    if (uid == query.agent) {
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    result.list = [];
                    result.count = 0;
                    result.success = true;
                    callback(result);
                    return;
                }
            } else {
                query.agent = query2.agent;
            }
            delete query.ownercom;
            delete query.ownerdep;
        } else {
            utils.setUserLevelCondition(query, 'agent', 'email', session);
        }

        if (name || query['from.addr']) {
            var str = name || query['from.addr'];
            var regex = new RegExp("^" + str, "i");
            query['from.addr'] = regex;
        }
        if (data.subject) {
            var regex = new RegExp("^" + data.subject);
            query.subject = regex;
        }
        //added by wangyn 邮件分类查询
        if(data.category){
            query.category = data.category;
        }
        delete data.query;
        if (!query.status) {
            query.status = {$ne: 'spam'};
        }

        var options = {sort: {lastReceiveTime: -1}, limit: limit, skip: skip};
        if (query.custName) {
            //根据名称查询会话id并返回
            solrHandler.queryIndex2Cust({name: query.custName}, session, function (rep) {
                if (rep.success) {
                    var ids = rep.ids || [];
                    if (ids.length > 0) {
                        //mongo.db().collection(fields.APP_EMAIL_CUSTOMER_RELATE).find({
                        //    customerId: {$in: rep.ids},
                        //    account: session.user.account
                        //}).toArray(function (err, customerRelation) {
                        //    var emails = [];
                        //    if (customerRelation) {
                        //        for (var i = 0; i < customerRelation.length; i++) {
                        //            emails.push(customerRelation[i].email);
                        //        }
                        //    }
                        //    query['from.addr'] = {$in:emails};
                        //    delete query.custName;
                        //
                        //});
                        query.customerId = {$in: ids};
                        handler.queryEmailList(query, options, session, result, callback);
                    } else {
                        result.success = true;
                        result.list = [];
                        callback(result);
                    }
                } else {
                    result.list = [];
                    result.message = "查询出错";
                    callback(result);
                }
            });
        } else {
            handler.queryEmailList(query, options, session, result, callback);
        }

    },

    queryMyDealMailList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit || 10;
        var name = data.query;
        delete data.emailType;
        delete data.limit;
        delete data.email_autoclaim_switch;
        var page = data.page || 1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data || {};
        var uid = session.user._id;
        query.agent = uid;
        query.status = "deal";
        handler._setQueryEmailCondition(query, session);
        if (name) {
            var regex = new RegExp("^" + name, "i");
            query['from.addr'] = regex;
        }
        if (data.subject) {
            var regex = new RegExp("^" + data.subject);
            query.subject = regex;
        }
        delete data.query;
        var options = {sort: {lastReceiveTime: -1}};
        handler.queryEmailList(query, options, session, result, callback);

    },

    queryEmailList: function (query, options, session, result, callback) {
        console.log(query);
        delete query.custName;
        Thenjs.parallel([
            function (cont) {
                Thenjs(function (cont1) {
                    mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).find(query, options).toArray(cont1);
                }).then(function (cont1, docs) {
                    if (docs && docs.length == 0) {
                        cont1(null, "not found doc", [], docs);
                    } else {
                        var customerIds = [];
                        for (var i = 0; i < docs.length; i++) {
                            if (utils.inArray(docs[i].customerId, customerIds) >= 0) {
                                continue;
                            }
                            customerIds.push(docs[i].customerId);
                        }
                        if (customerIds.length > 0) {
                            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find({_id: {$in: customerIds}}).toArray(function (err1, customers) {
                                cont1(null, err1, customers, docs);
                            });
                        } else {
                            cont1(null, null, [], [], docs);
                        }
                    }

                }).then(function (cont1, err, customers, docs) {
                    if (!err && customers) {
                        for (var n = 0; n < docs.length; n++) {
                            for (var m = 0; m < customers.length; m++) {
                                var customerId = docs[n].customerId;
                                if (customerId == customers[m]._id) {
                                    docs[n].custName = customers[m].name;
                                    docs[n].custId = customers[m]._id;
                                    docs[n].showCustomerName = true;
                                    break;
                                }
                            }
                        }
                    }
                    cont(null, docs);

                }).fail(function (cont1, err) {
                    logger.app.error(err);
                    cont(err);
                });
            },
            function (cont) {
                mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).count(query, function (err, count) {
                    cont(err, count);
                });
            }

        ]).then(function (cont, list) {
            result.list = list[0] || [];
            result.count = list[1];
            result.success = true;
            callback(result);
        }).fail(function (cont, err) {
            logger.app.error(err);
            result.message = err;
            callback(result);
        });
    },


    updateAutoClaimEmailSessionStatus: function (data, session, callback) {
        mongo.db().collection('app_push_client').update({_id: session.user._id},{$set:{emailStatus:data.emailStatus}}, function(err){
            if(!err){
                callback({success: true});
            }else{
                logger.app.error(err);
                callback({success: false, message: err});
            }
        });
        handler._autoClaimMonitorAndReport(data,session);//自动领取开关监控和报表
    },

    _autoClaimMonitorAndReport:function(data,session){
        var setDoc = {
            lastClaimStatus: data.emailStatus
        };
        var currTime = utils.getCurrentDate();
        if (data.emailStatus && data.emailStatus == "open") {
            setDoc.lastOpenedTime = currTime;
        } else {
            setDoc.lastClosedTime = currTime;
        }
        //监控
        var reportData = {
            reportTime: currTime,
            reportType: reportEvent.EventType.MAIL_AUTO_CLAIM_MONITOR,
            agentId: session.user._id,
            account: session.user.account,
            status: data.emailStatus
        };
        reportEvent.emitMailReportEvent(reportData);

        mongo.db().collection(fields.APP_AGENT_AUTOCLAIM_INFO).findAndModify({_id: session.user._id},[], {$set:setDoc},function(err,client){
            if(!err && client && client.agentStatus=="online"){
                //报表
                var reportData = {
                    reportTime: currTime,
                    reportType: reportEvent.EventType.MAIL_AUTO_CLAIM_LENGTH,
                    agentId: session.user._id,
                    account: session.user.account,
                    status: data.emailStatus,
                    lastMailStatusOpenedTime: client.lastOpenedTime || "",
                    lastMailStatusClosedTime: client.lastClosedTime || ""
                };
                reportEvent.emitMailReportEvent(reportData);
            }
        });
    },

    claimNewEmailSession: function (data, session, callback) {
        var result = {success: false};
        var thisClaimVersion = Math.random() + '_' + utils.getCurrentDateTime();
        var peers = [];
        Thenjs(function (cont) {
            handler.getAgentEmailPeers(session, cont);
        }).then(function (cont, rep) {
            if (rep.peers) {
                peers = rep.peers;
                var query = {};
                var maxDealCount = 10;
                if (session.user.maxEmailDealCount)
                    maxDealCount = session.user.maxEmailDealCount;
                var limit = maxDealCount - data.currDealEmailNum;
                if (limit <= 0) {
                    result.success = true;
                    result.list = [];
                    callback(result);
                    return;
                }
                query.toPeer = {$in: rep.peers};
                query.status = 'undeal';
                mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).find(query,{sort:{createTime:1},limit:limit}).toArray(cont);

            } else {
                callback(rep);
                return;
            }
        }).then(function (cont, docs) {
            var list = docs || [];
            if (list.length > 0) {
                var listIds = [];
                for (var i = 0; i < list.length; i++) {
                    listIds.push(list[i]._id);
                }
                handler._recurClaimEmailSession(list, thisClaimVersion, session, function (recurRes) {
                    if (recurRes.success) {
                        cont(null, listIds);
                    } else {
                        result.success = false;
                        callback(result);
                        return;
                    }
                });
            } else {
                result.success = true;
                result.list = [];
                callback(result);
            }
        }).then(function (cont, listIds) {
            var endFind = {_id: {$in: listIds}, autoClaimVersion: thisClaimVersion};
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION)
                .find(endFind, {sort: {createTime: -1}}).toArray(cont);


        }).then(function (cont, endDocs) {
            var endList = utils.deepClone(endDocs || []);
            result.list = endList;
            result.success = true;
            callback(result);
            //先返回给前台领取结果，异步的处理后事(写入多渠道历史)
            if (endDocs.length > 0) {
                handler.updateAgentCurrEmailDealCount(session.user._id, endList.length);
                handler._recurNotifyEmailClaim(endDocs, session, function (res) {
                });
                //通知其他座席v
                var pushAgents = function (peers) {
                    if (peers.length <= 0) {
                        return;
                    }
                    var peer = peers.pop();
                    var msg = {eventData: {Event:'NewEmail', Account:session.user.account, Data:{type:'pushUndealNum'}}};
                    msg.eventData.Data.ToPeer = peer;
                    emailChannelHanlder.pushUndealNumToAllAgents(msg, function () {
                        pushAgents(peers);
                    });
                };

                pushAgents(peers);

            }
        }).fail(function (cont, err) {
            logger.app.error(err);
            result.success = false;
            result.message = err;
            callback(result);
        });

    },

    /**
     * 写入联系历史
     * @param list
     * @param session
     * @param callback
     * @private
     */
    _recurNotifyEmailClaim: function (list, session, callback) {
        var result = {success: false};
        if (list.length == 0) {
            result.success = true;
            callback(result);
            return;
        } else {
            var curSession = list.pop();
            curSession.mchType = 'claim';
            var history = {mchType: "claim", _id: curSession._id, from: curSession.from, agent: session.user._id};
            handler._updateEmailMultiChannelHistory(history, session, function (mchRes) {});
            handler._recurNotifyEmailClaim(list, session, callback);
        }
    },
    updateAgentCurrEmailDealCount: function (agentId, count) {
        mongo.db().collection(fields.DB_APP_PUSH_CLIENT).update({_id: agentId}, {$inc: {currDealEmailNum: count}});
    },


    getAgentEmailPeers: function (session, callback) {
        var result = {success: false};

        var uid = session.user._id;
        var aid = session.user.account;

        var q1 = {
            Account: aid,
            'AssignMembers.agentID': uid
        };
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find(q1).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                if (docs.length > 0) {
                    var qIds = [];
                    for (var i = 0; i < docs.length; i++) {
                        var obj = docs[i];
                        qIds.push(obj.Exten);
                    }
                    result.success = true;
                    result.peers = qIds;
                    callback(null, result);
                } else {
                    result.list = [];
                    result.count = 0;
                    result.success = true;
                    callback(null, result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },

    _recurClaimEmailSession: function (list, curVersion, session, callback) {
        var result = {success: false};
        if (list.length == 0) {
            result.success = true;
            callback(result);
            return;
        } else {
            var curSession = list.pop();
            var find = {_id: curSession._id, autoClaimVersion: curSession.autoClaimVersion};
            var uid = session.user._id;
            var setDoc = {
                $set: {agent: uid, status: 'deal', autoClaimVersion: curVersion,lastClaimTime: utils.getCurrentDateTime()},
                $addToSet: {history: {user: uid, updateTime: utils.getCurrentDate(), type: 'claim', timestamp:utils.getCurrentDateTime()}}
            };
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).findOne(find, function (err, doc) {
                if (doc) {
                    mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(find, setDoc, {w: 1}, function (err) {
                        if (err) {
                            logger.app.error('_recurClaimSession update db has err! = ' + err);
                        } else {
                            //当该邮件回话状态设置为deal时,为该坐席的回话数+1 added by wangyn
                            var reportData = {
                                reportTime: utils.getCurrentDate(),
                                reportType: reportEvent.EventType.MAIL_ACCESS_SESSION,
                                conversationCount: 1,
                                agentId: session.user._id,
                                account: session.user.account
                            };
                            reportEvent.emitMailReportEvent(reportData);
                        }
                        handler._recurClaimEmailSession(list, curVersion, session, callback);
                    });
                }
            });
        }
    },

    refreshMenuNum: function (data, session, callback) {
        var result = {success: false};
        handler.getAgentEmailPeers(session, function (err, rep) {
            if (rep.peers) {
                data.toPeer = {$in: rep.peers};
                handler.getUndealNum(data, session, function (rep) {
                    if (rep.success) {
                        result.openNum = rep.openNum || 0;
                        handler.getTodoNum(data, session, function (rep) {
                            if (rep.success) {
                                result.todoNum = rep.todoNum || 0;
                                result.success = true;
                                callback(result);
                            } else {
                                callback(rep);
                            }
                        });
                    } else {
                        callback(rep);
                    }
                })
            } else {
                result.openNum = 0;
                result.todoNum = 0;
                result.success = true;
                callback(result);
            }
        });
    },

    getUndealNum: function (data, session, callback) {
        var result = {success: false};
        var aid = session.user.account;
        var query = {
            account: aid,
            status: "undeal",
            toPeer: data.toPeer
        };
        mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).count(query, function (err, count) {
            if (!err) {
                result.openNum = count;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },

    getTodoNum: function (data, session, callback) {
        var result = {success: false};
        var aid = session.user.account;
        var uid = session.user._id;
        var query = {
            account: aid,
            agent: uid,
            status: "deal"
        };

        mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).count(query, function (err, count) {
            if (!err) {
                result.todoNum = count;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },

    /**
     * 登录时统计当前座席的处理邮件数,以及当前处理的im会话数
     * @param session
     */
    countAgentDealEmailSession: function (session) {
        var aid = session.user._id;
        Thenjs.parallel([
            function (cont) {
                //邮件的
                mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).count({agent: aid, status: 'deal', account: session.user.account},function(err, emailcount){
                    var count = emailcount;
                    if (err) {
                        count = -1;
                    }
                    cont(null, count);
                });
            },
            function (cont) {
                //im会话的
                var imcountFind = {$or:[{user: aid, status: 'deal', account: session.user.account},{invitedUser:aid,status:'deal',inviteUserStatus:'accept',account: session.user.account}]};
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(imcountFind, function (err, imcount) {
                    var count = imcount;
                    if (err) {
                        count = -1;
                    }
                    cont(null, count);
                });
            }
        ]).then(function (cont, result) {
            var emailCount = result[0] || 0;
            var imCount = result[1] || 0;
            if (emailCount == -1) {
                emailCount = 0;
            }
            if (imCount == -1) {
                imCount = 0;
            }
            //redisUtils.string.set(redisField.AGENT_CURR_IM_DEAL_COUNT+aid, imCount, function(){}, redisField.REDIS_DB1);
            redisUtils.string.set(redisField.AGENT_CURR_EMAIL_COUNT+aid, emailCount, function(){}, redisField.REDIS_DB1);
            redisUtils.string.set(redisField.AGENT_IM_DEALED_COUNT+aid, 0, function(){}, redisField.REDIS_DB1);
            redisUtils.string.set(redisField.AGENT_EMAIL_DEALED_COUNT+aid, 0, function(){}, redisField.REDIS_DB1);
            mongo.db().collection(fields.DB_APP_PUSH_CLIENT).update(
                {_id: aid},{$set:{maxEmailDealCount: session.user.maxEmailDealCount|| 10,currDealEmailNum:emailCount,
                    'user.imDealCount': session.user.imDealCount || 5}});

        }).fail(function (cont, err) {

        });

    },

    /**
     * 刷新未读条数
     * @param data
     * @param session
     * @param callback
     */
    refreshLeakNum: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        var uid = session.user._id;
        var aid = session.user.account;
        var query2 = {
            _id: id
        }
        mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(query2, {
            $set: {
                leakNum: 0
            }
        }, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });

    },

    /**
     * 邮件解决调用方法
     * @param data
     * @param session
     * @param callback
     */
    finishEmailSession: function (data, session, callback) {
        var result = {success: false};
        var finishiArr = data.finishiArr || [];
        var ids = [];
        if (data._id) {
            finishiArr.push({_id: data._id, sid: data.sid});
        }
        for (var i = 0; i < finishiArr.length; i++) {
            ids.push(finishiArr[i]._id);
        }
        var idCondition = {$in: ids};
        var find = {_id: idCondition, status: {$ne: 'finish'}};
        var endTime = utils.getCurrentDate();
        var setDoc = {$set: {status: 'finish', finishReason: data.finishReason, finishUser: session.user._id,finishKey:data.finishKey,endTime:endTime, leakNum:0}};

        Thenjs(function (cont) {
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).find({_id: idCondition}).toArray(cont);

        }).then(function (cont, emailSessions) {
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(find, setDoc, {w: 1, multi: true},function (err) {
                cont(err, emailSessions);
            });
        }).then(function (cont, emailSessions) {
            for (var i = 0; i < emailSessions.length; i++) {
                var emailSession = emailSessions[i];
                handler._finishSessionReport(emailSession, session); //完成回话的报表
                var emailSession2 = {_id: emailSession._id, from:{addr:emailSession.from.addr}, mchType: 'finish', dispose: data.finishReason};
                handler._updateEmailMultiChannelHistory(emailSession2, session, function (mchRes) {
                });
            }
            handler.updateAgentCurrEmailDealCount(session.user._id, -emailSessions.length);
            result.success = true;
            callback(result);
        }).fail(function (cont, err) {
            logger.app.error(err);
            callback(result);
        });

    },

    /**
     * 获取邮件会话的最后一封邮件
     * @param data
     * @param session
     * @param callback
     */
    getLastEmail: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.APP_EMAIL_MAILS).findOne(data,{sort:{createTime:-1}, limit:1}, function(err, email){
            if (err) {
                result.message = err;
                callback(result);
            } else {
                result.success = true;
                result.email = email;
                callback(result);
            }
        });
    },

    /**
     * 转接会话
     * 转接给座席
     */
    redirectEmailSession: function (data, session, callback) {
        var result = {success: false};

        var find = {_id: data._id};
        var setDoc = {
            $set: {
                //sid: data.sid,
                type: 'email',
                agent: data.toUser,
                fromAgent: session.user._id,
                agentName: data.toUserName,
                leakNum: 0,
                lastRedirectTime: utils.getCurrentDateTime()
            },
            $addToSet: {history: {user: session.user._id, updateTime: utils.getCurrentDate(), type: 'redirect', timestamp: utils.getCurrentDateTime()}}
            //$unset:{agentFirstReplyTime:1}
        };
        Thenjs(function (cont) {
            Session.get(data.toUser, cont);  //是否登录
        }).then(function (cont, row) {
            mongo.db().collection(fields.DB_APP_PUSH_CLIENT).findOne({_id: data.toUser}, cont);  //是否socket连接上
        }).then(function (cont, client) {
            if (!client) {
                cont("座席不在线");
                return;
            }
            if (client.emailStatus != "open") {
                cont("该座席已关闭领取邮件");
                return;
            }
            if (client.currDealEmailNum >= client.maxEmailDealCount) {
                cont("座席当前处理邮件数已达到最大值");
                return;
            }
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).findOne(find, cont);

        }).then(function (cont, emailSession) {
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(find, setDoc, {upsert: true}, function (err1) {
                cont(err1, emailSession);
            });
        }).then(function (cont, emailSession) {
            result.success = true;
            callback(result);
            emailSession.subject = encodeURIComponent(emailSession.subject);
            if (emailSession.from.name) {
                emailSession.from.name = encodeURIComponent(emailSession.from.name);
            }
            var pushMsg = {
                userId: data.toUser, eventData: {
                    Event: 'NewEmail', Foryou: true, Account: session.user.account,
                    Data: emailSession
                }
            };
            pushMsg.eventData.Data.ToPeer = emailSession.ToPeer;
            emailChannelHanlder.pushEmailToAgent(pushMsg, function (err) {
            });
            var emailSession2 = {_id: emailSession._id, from:{addr:emailSession.from.addr}, mchType: 'redirect', agent: data.toUser};
            handler._updateEmailMultiChannelHistory(emailSession2, session, function (mchRes) {
            });
            handler.updateAgentCurrEmailDealCount(session.user._id, -1);
            handler.updateAgentCurrEmailDealCount(data.toUser, 1);
            handler.agentMailRedirectReport(emailSession,data,session);
        }).fail(function (cont, err) {
            logger.app.error(err + JSON.stringify(data));
            result.message = err;
            callback(result);
        });

    },
    //转接报表处理
    agentMailRedirectReport:function(emailSession, data,session){
        var firstTime = emailSession.lastRedirectTime || emailSession.lastClaimTime ||emailSession.createTimeStamp;
        var conversationTimeLength = emailSession.lastEmailTimestamp ? emailSession.lastEmailTimestamp - firstTime : 0;
        if (conversationTimeLength < 0) {
            conversationTimeLength = 0;
        }
        //当邮件回话成功转接后,处理两个坐席的转出和转入数量 added by wangyn
        var reportData = {
            reportTime: utils.getCurrentDate(),
            account: session.user.account,
            agentId: session.user._id,
            toUser: data.toUser,
            reportType: reportEvent.EventType.MAIL_REDIRECT_SESSION,
            conversationTimeLength:conversationTimeLength
        };
        reportEvent.emitMailReportEvent(reportData);
    },
    //当该回话的状态为finish的时候,给当前坐席完成回话数+1 added by wangyn
    _finishSessionReport: function (emailSession, session) {
        var firstTime = emailSession.lastClaimTime || emailSession.createTimeStamp;
        var conversationTimeLength = emailSession.lastEmailTimestamp ? emailSession.lastEmailTimestamp - firstTime : 0;
        var agentConversationTimeLength = emailSession.lastEmailTimestamp ? emailSession.lastEmailTimestamp - (emailSession.lastRedirectTime || firstTime) : 0;
        if (conversationTimeLength < 0) {
            conversationTimeLength = 0;
        }
        if (agentConversationTimeLength < 0) {
            agentConversationTimeLength = 0;
        }
        var reportData = {
            reportType: reportEvent.EventType.MAIL_CLOSE_SESSION,
            reportTime: utils.getCurrentDate(),
            conversationTimeLength: conversationTimeLength,
            agentConversationTimeLength: agentConversationTimeLength,
            account: session.user.account,
            agentId: session.user._id
        };
        reportEvent.emitMailReportEvent(reportData);
    },
    //给邮件打标记 未读 星标等 added by wangyn
    doMailMark: function (data, session, callback) {
        var result = {success: false};
        var find = {account:session.user.account,_id: data.sessionId};
        var setDoc = {};
        if (data.readMark) { //未读
            var leakNum = data.readMark == "unread" ? 1 : 0;
            setDoc = {$set: {leakNum: leakNum}};
        }
        if (data.starMark) { //星标
            if (data.starMark == 'mark') {
                setDoc = {$set: {mailMarks: {starMark: data.starMark}}};
            } else if (data.starMark == 'unmark') {
                setDoc = {$unset: {mailMarks: true}};
            }
        }
        mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(find, setDoc, function (err) {
            if (!err) {
                result.success = true;
            }
            callback(result);
        });
    },
    //将邮件标记为指定分类 added by wangyn
    defineMailCategory: function (data, session, callback) {
        var result = {success: false};
        var find = {account:session.user.account,_id: data.mailSessionId};
        Thenjs(function (cont) {
            mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).findOne({_id: data.categoryId}, function (err, doc) {
                cont(null, err, doc);
            });
        }).then(function (cont, err, doc) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            if (doc) {
                mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(find, {$set: {category: data.categoryId}}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                        return ;
                    } else {
                        callback(result);
                        return ;
                    }
                });
            } else {
                cont(null, err, doc);
            }
        }).then(function (cont, err, doc) {
            if (!doc) {
                if (data.categoryId === "uncategorized") {
                    mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(find, {$unset: {category: true}}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            callback(result);
                        }
                    });
                } else {
                    result.message = '该分类已被删除，刷新后重试';
                    callback(result);
                }
            }
        }).fail(function () {
            logger.app.error(err);
            result.message = err;
            callback(result);
        });
    },
    //查询该会话绑定邮箱的邮件分类信息 added by wangyn
    getMailCategory: function (data, session, callback) {
        var result = {success: false};
        Thenjs(function (cont) {
            var find = {account: session.user.account, _id: data.mailSessionId};
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).findOne(find, function (err, mailSession) {
                cont(null, err, mailSession);
            });
        }).then(function(cont,err,mailSession){
            mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).find({relateMailAddr: mailSession.to.addr}, {sort: {"createTime": 1}}).toArray(function (err, categorys) {
                cont(null, err, categorys);
            });
        }).then(function (cont, err, categorys) {
            if (!err) {
                result.list = [];
                result.success = true;
                if (categorys) {
                    for (var i = 0; i < categorys.length; i++) {
                        var doc = {_id: categorys[i]._id, name: categorys[i].categoryName};
                        result.list.push(doc);
                    }
                }
            }
            callback(result);
        }).fail(function (cont, err) {
            logger.app.error(err);
            result.message = err;
            callback(result);
        });
    }
};






module.exports = handler;

