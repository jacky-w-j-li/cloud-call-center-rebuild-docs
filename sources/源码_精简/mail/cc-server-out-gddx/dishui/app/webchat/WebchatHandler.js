var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var multiChannelHandler = require(__baseDir + '/dishui/app/multiChannel/MultiChannelHandler');
var reportEvent = require('appEvent/ReportEvent');

var handler = {
    locationCustomer: function (data, session, callback) {
        var result = {success: false};
        var cid = data.customerId;
        var id = data.callId;
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({_id: id}, function (err, row) {
            if (!err && row) {
                mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).update({sid: row.sid, account: session.user.account}, {
                    $set: {
                        customerId: cid,
                        sid:row.sid,
                        account: session.user.account,
                    },
                    $unset:{
                        status: 1
                    }
                }, {w: 1, upsert: true}, function (err) {
                    if (!err) {
                        //mongo.db(session).collection(session.user.account+"_history").update({_id:row._id}, {$set:{customer:cid}}, function(err){});
                        mongo.db(session).collection(session.user.account+"_history").update({sid:row.sid}, {$set:{customer:cid}},{multi: true}, function(err){});
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });

    },

    updateCustomerImRelation: function(data, session, callback){
        var condition = {
            customerId: data.customerId,
            account: session.user.account
        };
        data.account = session.user.account;
        mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).update(condition, {
            $set: {
                custName: data.custName
            },
            $unset:{
                status:1
            }
        }, {multi: true});
    },

    deleteCustomerImRelation: function(data, session, callback){
        data.account = session.user.account;
        mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).update(data, {$set: {status:"delete"}}, {multi: true});
    },

    queryWebchatById: function (data, session, callback) {
        var result = {success: false};
        var query = {
            _id: data._id
        }
        mongo.db().collection(fields.DB_APP_WEBCHAT).findOne(query, function (err, row) {
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
    dealMsg: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        var uid = session.user._id;
        var aid = session.user.account;

        //var query = {account: aid, sid: id, status: {$in: ['undeal', 'leak', 'assign']}};
        //var set = {
        //    status: 'deal'//undeal,deal,leak
        //}
        //mongo.db().collection(fields.DB_APP_WEBCHAT).update(query, {$set: set}, {w: 1, multi: true}, function (err) {
        //    if (!err) {
                var query2 = {
                    _id: id
                }
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(query2, {
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
            //} else {
            //    logger.app.error(err);
            //    callback(result);
            //}
        //});
    },
    /**
     *
     * @param data
     * @param session
     * @param callback
     */
    replyMsg: function (data, session, callback) {

        var result = {success: false};
        var id = utils.UUID.generateUuid();
        var time = utils.DateTime.getCurrentDateTime();
        var aid = session.account.account;
        var uid = session.user._id;
        data._id = id;
        data.msgType = "newIm";

        data.account = aid;
        data.user = uid;
//        data.uid=uid;
        data.createTime = time;
        data.lastTime = time;
        data.content=encodeURIComponent(data.content);
        var setDoc = {lastTimeStamp: utils.getCurrentDateTime()};
        if(data.firstReply){
            var firstReplyTime = utils.getCurrentDateTime();
            var reportData = {
                reportTime: time,
                firstResponseTimeLength: firstReplyTime - (data.lastRedirectTime || data.manualTime),
                agentId:session.user._id,
                account:aid,
                platform:data.platform,
                accessId: data.accessId,
                lastRedirectTime: data.lastRedirectTime
            };
            reportEvent.emitImReportEvent(reportData);
            setDoc.firstReplyTime = firstReplyTime;
            setDoc.agentFirstReplyTime = firstReplyTime;
        }

        var reportData = {
            reportTime: time,
            agentId:session.user._id,
            account:aid,
            platform:data.platform,
            accessId: data.accessId,
            reportType: "reply"
        };
        reportEvent.emitImReportEvent(reportData);

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: data.sessionId},{$set:setDoc,$inc:{replyMsgCount:1, totalMsgCount: 1}},function(err){});

        httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(data), function (err, rep) {
            if (err) {
                logger.app.warn('replyMsg to gateway failed!', err);
                callback(result);
            } else {
                var res = JSON.parse(rep);
                if (res.success) {
                    result.success = true;
                    data.content = decodeURIComponent(data.content);
                    result.row = data;
                    callback(result);
                } else {
                    logger.app.warn(result);
                    callback(result);
                }
            }
        });
    },
    queryHistory: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data['limit'];
        var page = data.page || 1;
        delete data['page'];
        var skip = (page - 1) * limit;


        var query = data || {};
        var aid = session.user.account;
        query.account = aid;
        utils.removeEmptyProperty(query);
        if (query.dateTime) {
            query.dateTime = {$lt: query.dateTime};
        }

        mongo.db().collection(fields.DB_APP_WEBCHAT).find(query, {
            sort: {dateTime: -1},
            limit: limit,
            skip: skip
        }).toArray(function (err, docs) {
            if (!err) {
                result.list = docs || [];
                result.success = true;
                callback(result)
            } else {
                logger.app.error(err);
                callback(result);
            }
        })
    },
    queryUserHistory: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data['limit'];
        var page = data.page || 1;
        delete data['page'];
        var skip = (page - 1) * limit;

        var query = data || {};
        var aid = session.user.account;
        query.account = aid;
        if (!query.sessionId) {
            query.sessionId = "NA";
        }
        utils.removeEmptyProperty(query);
        mongo.db().collection(fields.DB_APP_WEBCHAT).find(query, {
            sort: {when: -1},
            limit: limit,
            skip: skip
        }).toArray(function (err, docs) {
            if (!err) {
                result.list = docs || [];
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        })
    },

    queryUserByCustId: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        var aid = session.user.account;
        var query = {customerId: data.customerId};
        mongo.db().collection(fields.DB_APP_WEBCHAT_USER).find(query, {
            sort: {$natural: -1},
            limit: limit,
            skip: skip
        }).toArray(function (err, list) {
            if (!err) {
                list = list || [];
                result.list = list;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    queryUserById: function (data, session, callback) {
        var result = {success: false};
        var query = {_id: data.sid};
        mongo.db().collection(fields.DB_APP_WEBCHAT_USER).findOne(query, function (err, row) {
            if (!err) {
                result.user = row;
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
     * @param data 只需一个参数{_id: 会话的_id}
     * @param session
     * @param callback
     */
    claimWebchatSession: function (data, session, callback) {
        var result = {success: false};

        var find = {_id: data._id};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
            if (err) {
                result.message = 'query db failed!';
                callback(result);
                return;
            }
            if (!chatSession) {
                result.message = 'chatSession not founded!';
                callback(result);
                return;
            }
            var uid=session.user._id;
            data.sid=chatSession.sid;
            var setDoc = {
                $set: {type: 'webchat', user: uid, status: 'deal' /*leakNum: 0*/},
                $addToSet: {history: {user: uid, time: utils.getCurrentDate(), type: 'claim'}}
            };
            if (!chatSession.beginTime) {
                setDoc['$set'].beginTime = utils.getCurrentDate()
            }
            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, {upsert: true}, function (err) {
                if (!err) {
                    data.userId = session.user._id;
                    data.operation = 'claim';
                    data.platform = chatSession.platform;
                    multiChannelHandler.notifyDispatherServer(data, session, function (notifyRes) {
                    });
                    chatSession.mchType = 'claim';
                    handler._updateMultiChannelHistory(chatSession, session, function (mchRes) {});
                    result.success = true;

                    var pushMsg = {eventData: {Event:'NewNotify', Account:session.user.account,
                        Data:{type:'webchat', operation:'claim', _id: data._id, sid: chatSession.sid, AccessId: chatSession.accessId}}};
                    multiChannelHandler.publishByQueue(pushMsg, function(err){});

                    chatSession.user = uid;
                    chatSession.status = 'deal';
                    result.row=chatSession;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });

        })
    },
    /**
     *
     * @param data 只需一个参数{curDealCount: 我当前处理的数量, maxDealCount: 我最大处理的数量}
     * @param session
     * @param callback
     */
    autoClaimWebchatSession: function (data, session, callback) {
        var result = {success: false};

        var thisClaimVersion = Math.random()+'_'+utils.getCurrentDateTime();
        handler.getImAccessId(data,session,function(rep){

            if(rep.peers) {
                var query = {};
                var maxDealCount = 5;
                if(session.user.imDealCount)
                    maxDealCount = session.user.imDealCount;
                var limit = maxDealCount-data.curDealCount;
                query.toPeer = {$in: rep.peers};
                //query.user = {$in: ['', null]};
                query.status = 'undeal';
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query,{sort:{createTime:1},limit:limit}).toArray(function (err, docs) {

                    if (!err) {
                        var list = docs || [];
                        if(list.length > 0){
                            var listIds = [];
                            for(var i=0;i<list.length;i++){
                                listIds.push(list[i]._id);
                            }
                            handler._recurClaimSession(list , thisClaimVersion, session ,function(recurRes){
                                if(recurRes.success){
                                    var endFind = {_id:{$in: listIds}, autoClaimVersion: thisClaimVersion};
                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
                                        .find(endFind,{sort:{createTime:-1}}).toArray(function (err, endDocs){
                                        if(err){
                                            logger.app.error('autoClaimWebchatSession has err! = '+err);
                                            result.success = false;
                                            callback(result);
                                            return;
                                        }else{
                                            var endList = utils.deepClone(endDocs||[]);
                                            var sids = [];
                                            for(var i =0; i< endList.length; i++){
                                                sids.push(endList[i].sid);
                                                var reportData = {
                                                    reportTime: utils.getCurrentDate(),
                                                    reportType: "agentConversation",
                                                    conversationCount: 1,
                                                    agentId: session.user._id,
                                                    account:session.user.account,
                                                    accessId: endList[i].accessId,
                                                    platform: endList[i].platform,
                                                    toPeer:endList[i].toPeer,
                                                    sessionId:endList[i]._id
                                                };
                                                reportEvent.emitImReportEvent(reportData);
                                            }
                                            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).find({sid:{$in:sids}, status:{$ne:'delete'}}).toArray(function(err, customerRelations){
                                                var ids = [];
                                                var relations = {};
                                                if(!err && customerRelations && customerRelations.length > 0){
                                                    while(customerRelations.length>0){
                                                        var customerIdDoc = customerRelations.pop();
                                                        ids.push(customerIdDoc.customerId);
                                                        relations[customerIdDoc.sid] = customerIdDoc.customerId;
                                                    }
                                                }
                                                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find({_id: {$in:ids}}).toArray(function(err, customers){
                                                    if(!err && customers){
                                                        for(var n = 0; n < endList.length; n++){
                                                            for(var m = 0; m < customers.length; m++){
                                                                var customerId  = relations[endList[n].sid];
                                                                if(customerId == customers[m]._id){
                                                                    endList[n].sourceName = endList[n].sName;
                                                                    endList[n].sName = customers[m].name;
                                                                    endList[n].custId = customers[m]._id;
                                                                    endList[n].showCustomerName = true;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }
                                                    result.list = endList;
                                                    result.success = true;
                                                    callback(result);


                                                });
                                            });

                                            //先返回给前台领取结果，异步的处理后事(写入多渠道历史，通知其他座席)
                                            if(endDocs.length > 0){
                                                handler._recurNotifyAutoClaim(endDocs, session, function(res){});
                                            }
                                        }
                                    });
                                }else{
                                    result.success = false;
                                    callback(result);
                                    return;
                                }
                            });
                        }else{
                            result.success = true;
                            callback(result);
                            return;
                        }
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                result.success = true;
                result.list = [];
                callback(result);
                return;
            }
        });
    },

    /**
     *
     * 客服关闭领取后，将判断其为不在处理会话，新接入的会话转留言
     * @param data
     * @param session
     * @param callback
     */
    updateAutoClaimWebchatSessionStatus: function(data, session, callback){
        mongo.db().collection('app_push_client').update({_id: session.user._id},{$set:{status:data.status}}, function(err){
            if(!err){
                callback({success: true});
            }else{
                logger.app.error(err);
                callback({success: false, message: err});
            }
        });
        var reportData = {
            reportTime: utils.getCurrentDate(),
            reportType: "autoClaimStatus",
            agentId: session.user._id,
            account:session.user.account,
            status: data.status
        };
        reportEvent.emitImReportEvent(reportData);
    },

    /**
     * 被 atuoClaimWebchatSession 调用，递归的逐条领取，可以被领取的session
     * @param list -- 可被领取的列表
     * @param curVersion -- 修改session版本号
     * @param session
     * @param callback
     */
    _recurClaimSession: function(list, curVersion, session, callback){
        var result = {success : false};
        if(list.length == 0){
            result.success = true;
            callback(result);
            return;
        }else{
            var curSession = list.pop();
            var find = {_id: curSession._id, autoClaimVersion:curSession.autoClaimVersion};
            var uid = session.user._id;
            var setDoc = {
                $set: {type: 'webchat', user: uid, status: 'deal', autoClaimVersion: curVersion},
                $addToSet: {history: {user: uid, time: utils.getCurrentDate(), type: 'claim'}}
            };
            if (!curSession.beginTime) {
                setDoc['$set'].beginTime = utils.getCurrentDate()
            }
            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, {w:1}, function (err) {
                if(err){
                    logger.app.error('_recurClaimSession update db has err! = '+err);
                }
                handler._recurClaimSession(list, curVersion, session, callback);
            });
        }
    },
    /**
     * 被 atuoClaimWebchatSession 调用, 自动领取几条成功后，直接返回前台结果，然后通过此方法逐条记录去<通知分发器>和<渠道历史>和<通知其他座席>
     * @param list
     * @param session
     * @param callback
     * @private
     */
    _recurNotifyAutoClaim: function(list, session, callback){
        var result = {success : false};
        if(list.length == 0){
            result.success = true;
            callback(result);
            return;
        }else{
            var curSession = list.pop();
            var data = {};
            data.userId = session.user._id;
            data.operation = 'claim';
            data.platform = curSession.platform;
            data.sid = curSession.sid;
            multiChannelHandler.notifyDispatherServer(data, session, function (notifyRes) {
            });
            curSession.mchType = 'claim';
            handler._updateMultiChannelHistory(curSession, session, function (mchRes) {});

            var pushMsg = {eventData: {Event:'NewNotify', Account:session.user.account,
                Data:{type:'webchat', operation:'claim', _id: data._id, sid: curSession.sid, AccessId: curSession.accessId, ToPeer:curSession.toPeer}}};

            multiChannelHandler.publishByQueue(pushMsg, function(err){});

            handler._recurNotifyAutoClaim(list, session, callback);
        }
    },
    /**
     * @param data 需�个参数{_id: 会话的_id, toUser:被转接座席的id, toUserName:被转接座席的姓名 }
     * @param session
     * @param callback
     */
    redirectWebchatSession: function (data, session, callback) {
        var result = {success: false};

        var find = {_id: data._id};
        var setDoc = {
            $set: {
                //sid: data.sid,
                type: 'webchat',
                user: data.toUser,
                fromUser: session.user._id,
                username: data.toUserName,
                leakNum: 0,
                lastRedirectTime: utils.getCurrentDateTime()
            },
            $addToSet: {history: {user: session.user._id, time: utils.getCurrentDate(), type: 'redirect'}},
            $unset:{agentFirstReplyTime:1}
        };

        if(!data.toUser){
            setDoc.$set.status='undeal';
            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, {upsert: true}, function (err) {
                if (!err) {
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
                        if (!err) {
                            data.operation = 'redirect';
                            data.userId = data.toUser;
                            data.platform = chatSession.platform;
                            multiChannelHandler.notifyDispatherServer(data, session, function (notifyRes) {
                            });
                            var pushMsg = {
                                eventData: {
                                    Event: 'NewNotify', Account: session.user.account,
                                    Data: {
                                        type: 'webchat',
                                        operation: 'redirect',
                                        from: session.user._id,
                                        to: null,
                                        AccessId: chatSession.accessId,
                                        _id: data._id,
                                        Sid: data.sid,
                                        sName: chatSession.sName,
                                        CreateTime: chatSession.createTime
                                    }
                                }
                            };

                            logger.app.info('NewNotify ------ byqueue' + JSON.stringify(pushMsg));
                            multiChannelHandler.publishByQueue(pushMsg, function (err) {
                            });
                            var reportData = {
                                reportTime: utils.getCurrentDate(),
                                account: session.user.account,
                                agentId: session.user._id,
                                toUser: "pool",
                                reportType: "redirectSession",
                                accessId: chatSession.accessId,
                                platform: chatSession.platform
                            };
                            reportEvent.emitImReportEvent(reportData);
                        }
                    });

                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        }else{
            mongo.db().collection(fields.DB_APP_SESSION).findOne({_id:data.toUser}, function(err, row){
                if(!err && row){
                    mongo.db().collection(fields.DB_APP_PUSH_CLIENT).findOne({_id: data.toUser}, function(err, client){
                        if(err || !client){
                            result.success = false;
                            result.message = "该座席不在线";
                            callback(result);
                        }else{
                            if(client && client.status == "close"){
                                result.success = false;
                                result.message = "该座席已关闭领取会话";
                                callback(result);
                            }else{
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count({user:  data.toUser, status: "deal"}, function(err, dealCount){
                                    if(!err){
                                        if(row.user.imDealCount > dealCount){
                                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
                                                if (!err) {
                                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, {upsert: true}, function (err1) {
                                                        if(!err1){
                                                            result.success = true;
                                                            callback(result);

                                                            data.operation = 'redirect';
                                                            data.userId = data.toUser;
                                                            data.platform = chatSession.platform;
                                                            multiChannelHandler.notifyDispatherServer(data, session, function (notifyRes) {
                                                            });
                                                            var pushMsg = {
                                                                userId: data.toUser, eventData: {
                                                                    Event: 'NewNotify', Foryou: true, Account: session.user.account,
                                                                    Data: {
                                                                        type: 'webchat',
                                                                        operation: 'redirect',
                                                                        from: session.user._id,
                                                                        to: data.toUser,
                                                                        _id: data._id,
                                                                        Sid:data.sid,
                                                                        sName:chatSession.sName,
                                                                        CreateTime:chatSession.createTime,
                                                                        Platform: chatSession.platform,
                                                                        FromUrl:chatSession.fromUrl,
                                                                        userStatus:chatSession.userStatus,
                                                                        sBreakTime:chatSession.sBreakTime,
                                                                        ToPeer:chatSession.toPeer,
                                                                        user:data.toUser
                                                                    }
                                                                }
                                                            };
                                                            multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                                            });
                                                            var firstTime = chatSession.lastRedirectTime || (chatSession.manualTime || chatSession.createTimeStamp);
                                                            var conversationTimeLength = chatSession.leavemsg ? 0 : (chatSession.lastTimeStamp ? chatSession.lastTimeStamp - firstTime : 0);
                                                            console.log(firstTime+"--------------");
                                                            console.log(chatSession);
                                                            var reportData = {
                                                                reportTime: utils.getCurrentDate(),
                                                                account:session.user.account,
                                                                agentId:session.user._id,
                                                                toUser: data.toUser,
                                                                reportType:"redirectSession",
                                                                accessId: chatSession.accessId,
                                                                platform: chatSession.platform,
                                                                conversationTimeLength : conversationTimeLength
                                                            };
                                                            reportEvent.emitImReportEvent(reportData);

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
                                        }else {
                                            result.success = false;
                                            result.message = "该座席的处理会话数已到上限值，请稍后再试";
                                            callback(result);
                                        }
                                    }
                                });
                            }
                        }
                    });

                }else{
                    result.success = false;
                    result.message = "该座席不在线";
                    callback(result);
                }
            });

        }

    },

    /**
     *
     * @param data  {id: 会话id , sid: sid,finishReason: 完成结果 }
     * @param session
     * @param callback
     */
    finishWebchatSession: function (data, session, callback) {
        var result = {success: false};
        var finishiArr = data.finishiArr || [];
        var ids = [];
        if(data._id){
            finishiArr.push({_id:data._id, sid: data.sid});
        }
        for(var i=0; i<finishiArr.length; i++){
            ids.push(finishiArr[i]._id);
        }
        var idCondition = {$in: ids};
        var find = {_id: idCondition, status:{$ne:'finish'}};
        var endTime = utils.getCurrentDate();
        var setDoc = {$set: {status: 'finish', finishReason: data.finishReason, finishUser: session.user._id,finishKey:data.finishKey,endTime:endTime, leakNum:0}};

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find({_id: idCondition}).toArray(function (err, chatSessions) {

            if (!err) {
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, {w: 1, multi: true},function (err) {
                    if (!err) {
                        for(var i=0; i< chatSessions.length; i++){
                            var chatSession = chatSessions[i];
                            var data2 = {_id:chatSession._id, sid: chatSession.sid, finishReason: data.finishReason, finishKey: data.finishKey};
                            
                            //关闭流转的不需要通知到前端
                            if(chatSession.status != "changePeer"){
                                data2.operation = 'finish';
                                data2.userId = session.user._id;
                                data2.platform = chatSession.platform;
                                multiChannelHandler.notifyDispatherServer(data2, session, function (notifyRes) {
                                });
                            }

                            if (chatSession.leavemsg) {
                                var reportData = {
                                    type: reportEvent.EventType.IM_FIRST_REPLY,
                                    reportTime: endTime,
                                    firstResponseTimeLength: 1000,
                                    agentId: session.user._id,
                                    account: session.account.account,
                                    platform: chatSession.platform,
                                    accessId: chatSession.accessId,
                                    toPeer:chatSession.toPeer,
                                    sessionId:chatSession._id

                                };
                                reportEvent.emitImReportEvent(reportData);
                            }
                            var firstTime = chatSession.manualTime || chatSession.createTimeStamp;
                            var agentTime = chatSession.lastRedirectTime || (chatSession.manualTime || chatSession.createTimeStamp);
                            var conversationTimeLength = chatSession.leavemsg ? 0 : (chatSession.lastTimeStamp ? chatSession.lastTimeStamp - firstTime : 0);
                            var agentConversationTimeLength = chatSession.leavemsg ? 0 : (chatSession.lastTimeStamp ? chatSession.lastTimeStamp - agentTime : 0);
                            var reportData = {
                                type: reportEvent.EventType.IM_CLOSE_SESSION,
                                reportTime: endTime,
                                conversationTimeLength: conversationTimeLength,
                                agentConversationTimeLength: agentConversationTimeLength,
                                agentId: session.user._id,
                                account: session.account.account,
                                platform: chatSession.platform,
                                accessId: chatSession.accessId,
                                consultType: data2.finishKey,
                                toPeer: chatSession.toPeer,
                                sessionId:chatSession._id
                            };
                            reportEvent.emitImReportEvent(reportData);

                            var chatSession2 = {_id: data2._id, sid: data2.sid, mchType: 'finish', dispose: data2.finishReason};
                            handler._updateMultiChannelHistory(chatSession2, session, function (mchRes) {
                            });
                        }
                        result.success = true;
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
    },

    _setQueryWebchatCondition: function (query, session) {
        delete query.page;
        delete query.limit;
        utils.removeEmptyProperty(query);
        query.account = session.user.account;
//        utils.setDateTimeCondition(query);
    },
    queryWebchatUser2In: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data || {};
        handler._setQueryWebchatCondition(query, session);
        var aid = session.user.account;
        var uid = session.user._id;
        var menu = query.submenu;
        delete query.submenu;
        if (menu == 'webchat_open') {
            query.status = 'leak';
            mongo.db().collection(fields.DB_APP_WEBCHAT_USER).find(query, {
                sort: {updatedTime: -1},
                limit: limit,
                skip: skip
            }).toArray(function (err, docs) {
                if (!err) {
                    result.list = docs || [];
                    mongo.db().collection(fields.DB_APP_WEBCHAT_USER).count(query, function (err, count) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    });
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        } else if (menu == 'webchat_todo') {
            //query.status='undeal';
            query.owner = uid;
            mongo.db().collection(fields.DB_APP_WEBCHAT_USER).find(query, {
                sort: {updatedTime: -1},
                limit: limit,
                skip: skip
            }).toArray(function (err, docs) {
                if (!err) {
                    result.list = docs || [];
                    mongo.db().collection(fields.DB_APP_WEBCHAT_USER).count(query, function (err, count) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    });
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        } else {
            var scope = session.user.scope;
            if (scope == fields.data_scope_level) {
                var query2 = {};
                utils.setUserLevelCondition(query2, 'user','chat', session);
                mongo.db().collection(fields.DB_APP_WEBCHAT).distinct("sid", query2, function (err, docs) {
                    if (!err) {
                        docs = docs || [];
                        query._id = {$in: docs};
                        mongo.db().collection(fields.DB_APP_WEBCHAT_USER).find(query, {
                            sort: {updatedTime: -1},
                            limit: limit,
                            skip: skip
                        }).toArray(function (err, list) {
                            if (!err) {
                                result.list = list || [];
                                mongo.db().collection(fields.DB_APP_WEBCHAT_USER).count(query, function (err, count) {
                                    result.count = count;
                                    result.success = true;
                                    callback(result);
                                });
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                mongo.db().collection(fields.DB_APP_WEBCHAT_USER).find(query, {
                    sort: {updatedTime: -1},
                    limit: limit,
                    skip: skip
                }).toArray(function (err, docs) {
                    if (!err) {
                        result.list = docs || [];
                        mongo.db().collection(fields.DB_APP_WEBCHAT_USER).count(query, function (err, count) {
                            result.count = count;
                            result.success = true;
                            callback(result);
                        });
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }
        }
    },

    updateSessionOwner: function (data, session, callback) {
        var result = {success: false};
        var query = {_id: data._id};
        var setData = {user: data.owner};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(query, {$set: setData}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },

    queryChatSessionById: function (data, session, callback) {
        var result = {success: false};
        var query = {_id: data._id};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(query, function (err, row) {
            if (!err) {
                result.chatSession = row;
                //var sid=row.sid;
                //
                //mongo.db().collection(fields.DB_APP_WEBCHAT_USER).findOne({_id:sid}, function (err, user) {
                //    if (!err && user) {
                //        //result.chatSession.accessId=user.accessId;
                //        result.user = user;
                //        result.success = true;
                //        callback(result);
                //    } else {
                //        logger.app.error(err);
                //        callback(result);
                //    }
                //});
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _setQuerySessionCondition: function (query, session) {
        utils.removeEmptyProperty(query);
        query.account = session.user.account;
        query.type = "webchat";
        if(query.beginTime){
            query.beginTime={$gte:query.beginTime};
        }
        if(query.endTime){
            query.endTime={$lte:query.endTime};
        }

        if(query.msgCountType && query.msgCount){
            var msgCount = parseInt(query.msgCount);
            if(query.msgCountType == "gt"){
                query.totalMsgCount = {$gt:msgCount}
            }else if(query.msgCountType == "lt"){
                query.totalMsgCount = {$lt:msgCount}
            }else if(query.msgCountType == "eq"){
                query.totalMsgCount = msgCount;
            }
        }
        delete query.msgCount;
        delete query.msgCountType;
    },

    //todo getPeers
    getImAccessId:function(data,session,callback){
        var result = {success: false};

        var uid = session.user._id;
        var aid = session.user.account;

        var q1 = {
            Account: aid,
            'AssignMembers.agentID':uid
        };
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find(q1).toArray(function(err, docs){
            if (!err) {
                docs=docs||[];
                if(docs.length>0){
                    var qIds=[];
                    for(var i=0;i<docs.length;i++){
                        var obj=docs[i];
                        qIds.push(obj.Exten);
                    }
                    result.success = true;
                    result.peers = qIds;
                    callback(result);
                }else{
                    result.list = [];
                    result.count = 0;
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    queryWebchatSession: function (data, session, callback) {
        var menu = data.submenu;
        delete data.submenu;

        var result = {success: false};
        var pageSize = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data || {};
        handler._setQuerySessionCondition(query, session);
        var uid = session.user._id;
        var aid = session.user.account;

        if (menu == 'webchat_all') {
            var scope = session.user.scope;
            if (scope == fields.data_scope_level) {
                var query2 = {};
                utils.setUserLevelCondition(query2, 'user','chat', session);

                if(query.user){
                    var lowUsers = session.user.lowUsers;
                    var flag = false;
                    for (var i = 0; i < lowUsers.length; i++) {
                        var uid = lowUsers[i];
                        if(uid == query.user){
                            flag = true;
                            break;
                        }
                    }
                    if(!flag){
                        result.list = [];
                        result.count = 0;
                        result.success = true;
                        callback(result);
                        return;
                    }
                }else{
                    query.user = query2.user;
                }
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query, {
                    sort: {createTime: -1},
                    limit: limit,
                    skip: skip
                }).toArray(function (err, list) {

                    if (!err) {
                        var sids = [];
                        for(var i =0; i< list.length; i++){
                            sids.push(list[i].sid);
                        }
                        mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).find({sid:{$in:sids}, status:{$ne:'delete'}}).toArray(function(err, customerRelations){
                            var ids = [];
                            var relations = {};
                            if(!err && customerRelations && customerRelations.length > 0){
                                while(customerRelations.length>0){
                                    var customerIdDoc = customerRelations.pop();
                                    ids.push(customerIdDoc.customerId);
                                    relations[customerIdDoc.sid] = customerIdDoc.customerId;
                                }
                            }
                            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find({_id: {$in:ids}}).toArray(function(err, customers){
                                if(!err && customers){

                                        //var sid = customers[m].sid;
                                    for(var n = 0; n < list.length; n++){
                                        for(var m = 0; m < customers.length; m++){
                                            var customerId  = relations[list[n].sid];
                                            if(customerId == customers[m]._id){
                                                list[n].sourceName = list[n].sName;
                                                list[n].sName = customers[m].name;
                                                list[n].custId = customers[m]._id;
                                                list[n].showCustomerName = true;
                                                break;
                                            }
                                        }
                                    }
                                }

                                result.list = list || [];
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
                                    result.count = count;
                                    result.success = true;
                                    callback(result);
                                });

                            });

                        });

                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });

            } else {
                utils.setUserLevelCondition(query, 'user','chat', session);
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query, {
                    sort: {createTime: -1},
                    limit: limit,
                    skip: skip
                }).toArray(function (err, docs) {
                    if (!err) {
                        var sids = [];
                        for(var i =0; i< docs.length; i++){
                            sids.push(docs[i].sid);
                        }
                        mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).find({sid:{$in:sids},status:{$ne:'delete'}}).toArray(function(err, customerRelations){
                            var ids = [];
                            var relations = {};
                            if(!err && customerRelations && customerRelations.length > 0){
                                while(customerRelations.length>0){
                                    var customerIdDoc = customerRelations.pop();
                                    ids.push(customerIdDoc.customerId);
                                    relations[customerIdDoc.sid] = customerIdDoc.customerId;
                                }
                            }
                            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find({_id: {$in:ids}}).toArray(function(err, customers){
                                if(!err && customers){
                                    for(var n = 0; n < docs.length; n++){
                                        for(var m = 0; m < customers.length; m++){
                                            var customerId  = relations[docs[n].sid];
                                            if(customerId == customers[m]._id){
                                                docs[n].sourceName = docs[n].sName;
                                                docs[n].sName = customers[m].name;
                                                docs[n].custId = customers[m]._id;
                                                docs[n].showCustomerName = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                result.list = docs || [];
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
                                    result.count = count;
                                    result.success = true;
                                    callback(result);
                                });
                            });

                        });
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }
        }else{
            handler.getImAccessId(data,session,function(rep){
                if(rep.peers){
                    query.toPeer={$in:rep.peers};
                    if (menu == 'webchat_open') {
                        query.user = {$in: ['', null]};
                        query.status='undeal';

                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query, {
                            sort: {createTime: -1},
                            limit: limit,
                            skip: skip
                        }).toArray(function (err, docs) {
                            if (!err) {
                                result.list = docs || [];
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
                                    result.count = count;
                                    result.success = true;
                                    callback(result);
                                });
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else if (menu == 'webchat_todo') {
                        query.user = uid;
                        query.status={$in:['deal', 'changePeer']};
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query, {
                            sort: {createTime: -1}
                            //limit: limit,
                            //skip: skip
                        }).toArray(function (err, docs) {
                            if (!err) {
                                var sids = [];
                                for(var i =0; i< docs.length; i++){
                                    sids.push(docs[i].sid);
                                }
                                mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).find({sid:{$in:sids},status:{$ne:'delete'}}).toArray(function(err, customerRelations){
                                    var ids = [];
                                    var relations = {};
                                    if(!err && customerRelations && customerRelations.length > 0){
                                        while(customerRelations.length>0){
                                            var customerIdDoc = customerRelations.pop();
                                            ids.push(customerIdDoc.customerId);
                                            relations[customerIdDoc.sid] = customerIdDoc.customerId;
                                        }
                                    }
                                    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find({_id: {$in:ids}}).toArray(function(err, customers){
                                        if(!err && customers){
                                            for(var n = 0; n < docs.length; n++){
                                                for(var m = 0; m < customers.length; m++){
                                                    var customerId  = relations[docs[n].sid];
                                                    if(customerId == customers[m]._id){
                                                        docs[n].sourceName = docs[n].sName;
                                                        docs[n].sName = customers[m].name;
                                                        docs[n].custId = customers[m]._id;
                                                        docs[n].showCustomerName = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        result.list = docs || [];
                                        result.count = docs.length;
                                        result.success = true;
                                        callback(result);
                                    });

                                });

                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }
                }else{
                    callback(rep);
                }
            });
        }
    },

    updateWebchatSessionRemark: function (data, session, callback) {
        var result = {success: false};
        var condition = {_id: data.sid};
        var setData = {remark: data.content};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(condition,
            {$set: setData}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({account:session.user.account, product: 'cc'}, function(err, doc){
                        if(err || !doc){
                            callback(result);
                            return;
                        }
                        mongo.db(doc.dataDB).collection(session.user.account+"_history").update(condition, {$set:{comments: data.content}}, function(err){});
                    });
                } else {
                    logger.app.error(err);
                    result.message = "更新备注失败";
                    callback(result);
                }
            });
    },

    saveQuickReply: function(data, session, callback){
        var result = {success: false};
        var condition = {account: session.user.account, owner: session.user._id};
        var setData = data.quickreplys;

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY).findOne(condition, function(err, doc){
            if(!err){
                if(doc){
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY).update(condition,{$set:{quickreplys: setData, updatedTime: utils.getCurrentDate()}});
                }else{
                    var insertData = {
                        account: session.user.account,
                        quickreplys:setData,
                        owner:session.user._id,
                        updatedTime:utils.getCurrentDate()
                    };
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY).insert(insertData);
                }
                result.success = true;
                callback(result);
            }else{
                result.message="db error,保存快捷回复失败";
                callback(result);
                logger.app.error("["+session.user._id+"]saveQuickReply fail", err);
            }
        })
    },

    getQuickReplyList: function(data, session, callback){
        var result = {success: false};
        var condition = {account: session.user.account, owner: session.user._id};

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY).findOne(condition, function(err, doc){
            if(!err){
                result.success = true;
                if(doc){
                    result.success = true;
                    result.quickreplys = doc.quickreplys || [];
                }else{
                    result.quickreplys = [];
                }
                callback(result);
            }else{
                result.message="查找快捷回复失败";
                callback(result);
                logger.app.error("["+session.user._id+"]getQuickReplyList fail", err);
            }
        });
    },

    getOpenNum:function(data, session, callback){
        var result = {success: false};
        var aid = session.user.account;
        var query = {
            account: aid,
            user: {$in: ['', null]},
            status: "undeal",
            toPeer: data.toPeer
        };
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
            if(!err){
                result.openNum=count;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });

    },
    getTodoNum:function(data, session, callback){
        var result = {success: false};
        var aid = session.user.account;
        var uid = session.user._id;
        var query = {
            account: aid,
            user: uid,
            status: "deal",
            toPeer:data.toPeer
        };

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
            if(!err){
                result.todoNum=count;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    refreshMenuNum:function(data, session, callback){
        var result = {success: false};
        handler.getImAccessId(data,session,function(rep){
            if(rep.peers) {
                data.toPeer = {$in: rep.peers};
                handler.getOpenNum(data,session,function(rep){
                    if(rep.success){
                        result.openNum=rep.openNum||0;
                        handler.getTodoNum(data,session,function(rep){
                            if(rep.success){
                                result.todoNum=rep.todoNum||0;
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
            }else{
                result.openNum=0;
                result.todoNum=0;
                result.success=true;
                callback(result);
            }
        });

    },
    _updateMultiChannelHistory: function(chatSession, session, callback){
        var result = {success: false};
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({account:session.user.account, product: 'cc'}, function(err, doc){
            if(err || !doc){
                callback(result);
                return;
            }
            var find = {_id : chatSession._id};
            var setDoc = {};

            var multiChannelHistory = {
                agent: session.user._id,
                lastUpdateTime: utils.getCurrentDate(),
                sid : chatSession.sid
            }
            if(chatSession.mchType == 'claim'){
                multiChannelHistory.beginTime = utils.getCurrentDate();
            }
            if(chatSession.mchType == 'finish'){
                multiChannelHistory.endTime = utils.getCurrentDate();
                multiChannelHistory.dispose = chatSession.dispose;
                multiChannelHistory.status = 'finish';
            }

            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).findOne({sid:chatSession.sid}, function(err, relationDoc){
                if(err){

                }else{
                    if(relationDoc && relationDoc.customerId){
                        multiChannelHistory.customer = relationDoc.customerId;
                    }
                }
                setDoc['$set'] = multiChannelHistory;
                mongo.db(doc.dataDB).collection(session.user.account+"_history").update(find, setDoc, function(err){});
            });

        });
    },
    //for dic
    getOnlineAgentDic : function (session, callback){
        var aid = session.user.account;
        var query={'user.account':aid};
        mongo.db().collection("app_push_client").find(query, {fields: {_id: 1}}).toArray(function (err, list) {
            if (!err) {
                callback(null, list || []);
            } else {
                logger.app.error(err);
                callback(err);
            }
        });
    },

    /**
     * for dic
     * 获取接入号的agent
     */
    getAccessAgentDic: function(session, callback){
        var aid = session.user.account;
        var query = {Account: aid, Peer:'MailQueue'};
        var result = [];
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find(query, {fields: {Exten: 1, AssignMembers :1}}).toArray(function (err, list) {
            if (!err) {
                list = list || [];
                for(var i=0; i<list.length; i++){
                    result.push({_id: list[i].Exten, agents:list[i].AssignMembers});
                }
                callback(null, result);
            } else {
                logger.app.error(err);
                callback(err);
            }
        });
    },

    //for dic
    getWebchatAndSdkConfigDic : function (session, callback){
        var aid = session.user.account;
        var query={'account':aid};
        mongo.db().collection("app_kefu_im_config").find(query).toArray(function (err, list) {
            if (!err) {
                mongo.db('weixin').collection("wxaccount").find(query).toArray(function (err, wxList){
                    if(err){
                        logger.app.error(err);
                        callback(err);
                    }
                    if(wxList && wxList.length > 0){
                       list = list.concat(wxList);
                    }
                    callback(null, list || []);
                });
            } else {
                logger.app.error(err);
                callback(err);
            }
        });
    },

    /*******************************满意度调查**********************************************/
    pushImCSRInfo: function(data,session,callback){
        var result = {success: false};
        var query = {
            accessId: data.accessId
        }
        mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne(query,function (err, doc) {
            if(!err){
                if(doc){
                    if(!doc.webchat_csr== true){
                        result.message = '该网站在线客服没有开启客户满意度调查';
                        return callback(result);
                    }else{
                        var query1 = {
                            sessionId: data.sessionId,
                            account  : session.account.account
                        }
                        mongo.db().collection('app_kefu_im_csr').findOne(query1,function (err1, doc1) {
                            if(!err1 && doc1){
                                result.message = '已经评价过了，不能重复评价';
                                return callback(result);
                            }else{
                                data._id = utils.UUID.generateUuid();
                                data.msgType = "pushImCSR";
                                data.account = session.account.account;
                                data.user = session.user._id;
                                httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(data), function (err, rep) {
                                    if (err) {
                                        logger.app.warn('pushImCSRInfo to gateway failed!', err);
                                        callback(result);
                                    } else {
                                        var res = JSON.parse(rep);
                                        if (res.success) {
                                            result.time = utils.getCurrentDate();
                                            result.success = true;
                                            callback(result);
                                        } else {
                                            logger.app.warn(result);
                                            callback(result);
                                        }
                                    }
                                });
                            }
                        });
                    }
                }else{
                    result.message = '该网站在线客服没有开启客户满意度调查';
                    return callback(result);
                }
            }else{
                logger.app.error(err);
                return callback(result);
            }
        });
    }
};





module.exports = handler;

