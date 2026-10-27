var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var multiChannelHandler = require(__baseDir + '/dishui/app/multiChannel/MultiChannelHandler');
var quickReplyHandler = require(__baseDir + '/dishui/config/channel/QuickReplyHandler');
var reportEvent = require('appEvent/ReportEvent');
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var Thenjs = require("thenjs");
var redisUtils = require("m7rds");
var redisField = require(__baseDir + '/dishui/common/RedisKeyPrefix');
var esHandler = require(__baseDir + '/dishui/common/ElasticSearchHandler');
var Session = require('appSession/lib/Session');
var notificationEvent = require('appEvent/NotificationEvent');
var nodeUtil = require('util');

var handler = {
    locationCustomer: function (data, session, callback) {
        var result = {success: false};
        var cid = data.customerId;
        var id = data.callId;
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({_id: id,account:session.user.account}, function (err, row) {
            if (!err && row) {
                mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).update({
                    sid: row.sid,
                    account: session.user.account
                }, {
                    $set: {
                        customerId: cid,
                        sid: row.sid,
                        account: session.user.account,
                    },
                    $unset: {
                        status: 1
                    }
                }, {w: 1, upsert: true}, function (err) {
                    if (!err) {
                        //mongo.db(session).collection(session.user.account+"_history").update({_id:row._id}, {$set:{customer:cid}}, function(err){});
                        mongo.db(session).collection(session.user.account + "_history").update({sid: row.sid}, {$set: {customer: cid}}, {multi: true}, function (err) {
                        });
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

    updateCustomerImRelation: function (data, session, callback) {
        var condition = {
            customerId: data.customerId,
            account: session.user.account
        };
        data.account = session.user.account;
        mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).update(condition, {
            $set: {
                custName: data.custName
            },
            $unset: {
                status: 1
            }
        }, {multi: true});
    },

    deleteCustomerImRelation: function (data, session, callback) {
        var result = {success:false};
        data.account = session.user.account;
        var relationBeforeUpdata = null;
        Thenjs(function(cont){
            if(!data.customerId){
                result.message = "必须有customerId";
                callback(result);
            }else{
                mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).findOne({customerId:data.customerId,status:{$ne:"delete"}}, cont);
            }
        }).then(function(cont,relation){
            //找到是否有关联坐席
            relationBeforeUpdata = relation;
            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).update({customerId:data.customerId}, {$set: {status: "delete"}}, {multi: true},cont);
        }).then(function(cont){
            var sid = null;
            if(relationBeforeUpdata){
                sid = relationBeforeUpdata.sid;
            }
            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({sid: sid, status:{$nin: ['finish', 'changePeer']}, leavemsg:{$ne: true}, inviteUserStatus : "accept"}, cont);
        }).then(function(cont,chatSession){
            if(chatSession){
                var invitedUser = chatSession.invitedUser;
                if(invitedUser){
                    //给该坐席发送消息
                    var needsenduser = chatSession.invitedUser;
                    if(chatSession.invitedUser == session.user._id){
                        needsenduser = chatSession.user;
                    }
                    var invited_delete_relation_Msg = {
                        userId: needsenduser, eventData: {
                            Event: 'NewNotify',
                            Foryou: true,
                            Account: session.user.account,
                            Data: {
                                type: 'delete_relation',
                                from: session.user._id,
                                _id: chatSession._id,
                                Sid: chatSession.sid,
                                sName: chatSession.sName,
                                CreateTime: chatSession.createTime,
                                Platform: chatSession.platform,
                                FromUrl: chatSession.fromUrl,
                                UrlTitle: chatSession.urlTitle,
                                userStatus: chatSession.userStatus,
                                sBreakTime: chatSession.sBreakTime,
                                ToPeer: chatSession.toPeer,
                                invitedUser:chatSession.invitedUser
                            }
                        }
                    };
                    multiChannelHandler.pushToAgent(invited_delete_relation_Msg, function(result){

                    });
                }
            }
            result.success = true;
            callback(result);
        }).fail(function(cont,err){
            logger.app.error(err);
            callback(result);
        })
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
            _id: id,
            account:aid
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
        var contentUnEncode = data.content;
        data.content = encodeURIComponent(data.content);
        var currTimeStamp = utils.getCurrentDateTime();
        var setDoc = {
            lastTimeStamp: currTimeStamp,
            lastAgentMsgTimeStamp: currTimeStamp
        };
        var unSet = {startCustomerWaitTimeStamp:1};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({sid: data.sid, status:{$nin: ['finish', 'changePeer']}, leavemsg:{$ne: true}}, function(err, wsRes){
            if(!err){
                //如果是file类型，需要判断sdk版本
                if(data.contentType=="file" && wsRes.platform=="sdk"){
                    if((wsRes.sdkIosVersionCode && wsRes.sdkIosVersionCode>1)||(wsRes.sdkAndroidVersionCode || wsRes.sdkAndroidVersionCode>1)){

                    }else{
                        result.message = "客户端的sdk版本不支持文件上传";
                        callback(result);
                        return;
                    }
                }

                var isInvitedUser = false;
                var isHasInvitedUser = false;
                if(wsRes && wsRes.invitedUser  && wsRes.inviteUserStatus=="accept"){
                    isHasInvitedUser = true;
                    if(wsRes.invitedUser == session.user._id){
                        isInvitedUser = true;
                    }
                }
                if(!isInvitedUser){
                    if (data.firstReply) {
                        var firstReplyTime = currTimeStamp;
                        var reportData = {
                            reportTime: time,
                            // 首次响应时长 = 首次回复时间 - （转接座席时间 || 领取时间 || 转接时间 || 转人工时间）
                            // 转接座席后lastClaimTime不更新，优先使用lastRedirectUserTime
                            firstResponseTimeLength: firstReplyTime - (data.lastRedirectUserTime || data.lastClaimTime || data.lastRedirectTime || data.manualTime),
                            agentId:session.user._id,
                            account:aid,
                            platform:data.platform,
                            accessId: data.accessId,
                            lastRedirectTime: data.lastRedirectTime
                        };
                        // 如果没有首次响应
                        // 1. 更新会话firstReplyTime
                        // 2. 报表数据删除lastRedirectTime，添加sessionFirstResponseTimeLength，以保证消息报表的首次响应时长正确性
                        if (!wsRes.firstReplyTime) {
                            setDoc.firstReplyTime = firstReplyTime;
                            // 会话首次响应时长 = 首次回复时间 - 转人工时间
                            reportData.sessionFirstResponseTimeLength = firstReplyTime - data.manualTime;
                            delete reportData.lastRedirectTime;
                        }
                        reportEvent.emitImReportEvent(reportData);
                        setDoc.agentFirstReplyTime = firstReplyTime;
                    }

                    var reportData = {
                        reportTime: time,
                        agentId: session.user._id,
                        account: aid,
                        platform: data.platform,
                        accessId: data.accessId,
                        reportType: "reply"
                    };
                    reportEvent.emitImReportEvent(reportData);
                }
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: data.sessionId, account:session.user.account}, {
                    $set: setDoc,
                    $inc: {replyMsgCount: 1, totalMsgCount: 1},
                    $unset:unSet
                }, function (err) {
                });

                // 如果平台是微信，data中添加kf_account
                if (data.platform === 'weixin') {
                    data.kf_account = session.user.wx_kf_account;
                }

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

                            // 将消息发送至索引服务器
                            var msgId = data._id;
                            var msgIndex = {
                                _id: data._id,
                                account: data.account,
                                sessionId: data.sessionId,
                                from: 'user',
                                when: utils.getCurrentDateTime(),
                                message: decodeURIComponent(data.content)
                            };

                            esHandler.addMsgIndex(msgIndex, function (esRes) {
                                if (esRes.success) {
                                    logger.app.info('create webchat message index successfully. msgId: ' + msgId);
                                } else {
                                    logger.app.warn('create webchat message index failed. msgId: ' + msgId);
                                }
                            });
                            //设置微信消息提醒事件
                            if (data.platform === 'weixin') {
                                    var query={account:aid};
                                    mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne(query, function (err, row) {
                                        if (!err && row && row.setWarnMsg>0) {
                                            console.log("设置微信消息提醒事件");
                                            notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_SET_WEIXIN_REMIND, {
                                                currTimeStamp: currTimeStamp,
                                                account: data.account,
                                                sessionId: data.sessionId
                                            });
                                        }
                                    })
                            }

                            //给被邀请人推送消息

                            if(isHasInvitedUser){
                                data.username=session.user.displayName;
                                data._id=wsRes._id;
                                data.content = decodeURIComponent(data.content);
                                var msg = {eventData: {Event:'GroupMsg', Account:data.Account, Data:data}};
                                if(isInvitedUser){
                                    //发送给user
                                    msg.userId = wsRes.user;
                                }else{
                                    msg.userId = wsRes.invitedUser;
                                }
                                msg.eventData.Data.startWaitTimer = -1;
                                multiChannelHandler.pushToAgent(msg, function(pushRes){});
                            }

                            // 坐席回复后添加定时自动关闭事件
                            notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_SET_AUTO_CLOSE, {
                                currTimeStamp: currTimeStamp,
                                account: data.account,
                                sessionId: data.sessionId
                            });

                        } else {
                            logger.app.warn(result);
                            callback(result);
                        }
                    }
                });
            }else{
                logger.app.error(err);
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

        var endDateTimeStr = query.dateTime.replace(/\-/g, "/");
        var date = new Date( new Date(endDateTimeStr).getTime()-7*24*60*60*1000 );
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var hour = date.getHours();
        var minites = date.getMinutes();
        var second = date.getSeconds();
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        day = day > 9 ? day : '0' + day;
        hour = hour > 9 ? hour : '0' + hour;
        minites = minites > 9 ? minites : '0' + minites;
        second = second > 9 ? second : '0' + second;
        var endDateTime =  year + "-" + month + "-" + day + " " + hour + ":" + minites + ":" + second;

        if (query.dateTime) {
            query.dateTime = {$lt: query.dateTime,$gt:endDateTime};
        }

        mongo.db().collection(fields.DB_APP_WEBCHAT).find(query, {
            sort: {when: -1},
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
            var uid = session.user._id;
            data.sid = chatSession.sid;
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
                    handler._updateMultiChannelHistory(chatSession, session, function (mchRes) {
                    });
                    result.success = true;

                    var pushMsg = {
                        eventData: {
                            Event: 'NewNotify', Account: session.user.account,
                            Data: {
                                type: 'webchat',
                                operation: 'claim',
                                _id: data._id,
                                sid: chatSession.sid,
                                AccessId: chatSession.accessId
                            }
                        }
                    };
                    multiChannelHandler.publishByQueue(pushMsg, function (err) {
                    });

                    chatSession.user = uid;
                    chatSession.status = 'deal';
                    result.row = chatSession;
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
        result.success = true;
        result.list = [];
        callback(result);
        return;
    //
    //    var thisClaimVersion = Math.random() + '_' + utils.getCurrentDateTime();
    //    handler.getImAccessId(data, session, function (rep) {
    //
    //        if (rep.peers) {
    //            var query = {};
    //            var maxDealCount = 5;
    //            if (session.user.imDealCount){
    //                maxDealCount = session.user.imDealCount;
    //            }
    //            logger.app.info('autoClaimWebchatSession session.user.imDealCount ' + session.user.imDealCount);
    //            redisUtils.string.get(redisField.AGENT_CURR_IM_DEAL_COUNT + session.user._id,function(err, redisResult){
    //                var currDealCount = data.curDealCount;
    //                if(!err && redisResult != null){
    //                    currDealCount = redisResult;
    //                }
    //                var limit = maxDealCount - currDealCount;
    //
    //                if(!limit || limit<=0){
    //                    result.success = true;
    //                    result.list = [];
    //                    callback(result);
    //                    return;
    //                }
    //                if(limit>maxDealCount){
    //                    limit = maxDealCount;
    //                }
    //                query.account = session.user.account;
    //                query.toPeer = {$in: rep.peers};
    //                //query.user = {$in: ['', null]};
    //                query.status = 'undeal';
    //                //不可以领取自己转发给别人的
    //                query.fromUser = {$ne:session.user._id};
    //                logger.app.info('autoClaimWebchatSession query ' + JSON.stringify(limit));
    //                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query, {
    //                    sort: {createTime: 1},
    //                    limit: limit
    //                }).toArray(function (err, docs) {
    //                    logger.app.info('autoClaimWebchatSession findresult ' + docs.length);
    //                    if (!err) {
    //                        var list = docs || [];
    //                        if (list.length > 0) {
    //                            var listIds = [];
    //                            for (var i = 0; i < list.length; i++) {
    //                                listIds.push(list[i]._id);
    //                            }
    //                            handler._recurClaimSession(list, thisClaimVersion, session, function (recurRes) {
    //                                if (recurRes.success) {
    //                                    var endFind = {_id: {$in: listIds}, autoClaimVersion: thisClaimVersion,account:session.user.account};
    //                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
    //                                        .find(endFind, {sort: {lastCustomerMsgTimeStamp:1,createTime: 1}}).toArray(function (err, endDocs) {
    //                                        if (err) {
    //                                            logger.app.error('autoClaimWebchatSession has err! = ' + err);
    //                                            result.success = false;
    //                                            callback(result);
    //                                            return;
    //                                        } else {
    //                                            var claimSize = endDocs.length;
    //                                            if(claimSize > 0){
    //                                                handler.updateAgentCurrImDealCount(session.user._id, claimSize);
    //                                                handler.updateAgentDealedCount(session.user._id, claimSize);
    //                                            }
    //
    //                                            var endList = utils.deepClone(endDocs || []);
    //                                            var sids = [];
    //                                            var endPeers = [];//领取到的技能组
    //                                            for (var i = 0; i < endList.length; i++) {
    //                                                sids.push(endList[i].sid);
    //
    //                                                var reportData = {
    //                                                    reportTime: utils.getCurrentDate(),
    //                                                    reportType: "agentConversation",
    //                                                    conversationCount: 1,
    //                                                    agentId: session.user._id,
    //                                                    account: session.user.account,
    //                                                    accessId: endList[i].accessId,
    //                                                    platform: endList[i].platform,
    //                                                    toPeer: endList[i].toPeer,
    //                                                    sessionId: endList[i]._id
    //                                                };
    //                                                reportEvent.emitImReportEvent(reportData);
    //
    //                                                if(endPeers.indexOf(endList[i].toPeer)<0){
    //                                                    endPeers.push(endList[i].toPeer);
    //                                                }
    //                                                multiChannelHandler.pushQueueNumToClient({Sid: endList[i].sid, ToPeer: endList[i].toPeer, Account: session.user.account});
    //                                            }
    //                                            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).find({
    //                                                sid: {$in: sids},
    //                                                status: {$ne: 'delete'}
    //                                            }).toArray(function (err, customerRelations) {
    //                                                var ids = [];
    //                                                var relations = {};
    //                                                if (!err && customerRelations && customerRelations.length > 0) {
    //                                                    while (customerRelations.length > 0) {
    //                                                        var customerIdDoc = customerRelations.pop();
    //                                                        ids.push(customerIdDoc.customerId);
    //                                                        relations[customerIdDoc.sid] = customerIdDoc.customerId;
    //                                                    }
    //                                                }
    //                                                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find({_id: {$in: ids}}).toArray(function (err, customers) {
    //                                                    if (!err && customers) {
    //                                                        for (var n = 0; n < endList.length; n++) {
    //                                                            for (var m = 0; m < customers.length; m++) {
    //                                                                var customerId = relations[endList[n].sid];
    //                                                                if (customerId == customers[m]._id) {
    //                                                                    endList[n].sourceName = endList[n].sName;
    //                                                                    endList[n].sName = customers[m].name;
    //                                                                    endList[n].custId = customers[m]._id;
    //                                                                    endList[n].showCustomerName = true;
    //                                                                    break;
    //                                                                }
    //                                                            }
    //                                                        }
    //                                                    }
    //                                                    result.list = endList;
    //                                                    result.success = true;
    //                                                    callback(result);
    //
    //
    //                                                });
    //                                            });
    //
    //                                            //先返回给前台领取结果，异步的处理后事(写入多渠道历史，通知其他座席)
    //                                            if (endDocs.length > 0) {
    //                                                handler._recurNotifyAutoClaim(endDocs, session, function (res) {
    //                                                });
    //                                                handler.notifyOtherAgent(endPeers, session, function(){});
    //                                            }
    //                                            //发送排队人数信息
    //                                            for(var i =0;i<endPeers.length;i++){
    //                                                var findQueueData = {};
    //                                                findQueueData.toPeer = endPeers[i];
    //                                                findQueueData.Account = session.user.account;
    //                                                multiChannelHandler.pushQueueNumToWebChatClient(findQueueData);
    //                                            }
    //                                        }
    //                                    });
    //                                } else {
    //                                    result.success = false;
    //                                    callback(result);
    //                                    return;
    //                                }
    //                            });
    //                        } else {
    //                            result.success = true;
    //                            callback(result);
    //                            return;
    //                        }
    //                    } else {
    //                        logger.app.error(err);
    //                        callback(result);
    //                    }
    //                });
    //            }, redisField.REDIS_DB1);
    //
    //
    //        } else {
    //            result.success = true;
    //            result.list = [];
    //            callback(result);
    //            return;
    //        }
    //    });
    },

    /**
     *
     * 客服关闭领取后，将判断其为不在处理会话，新接入的会话转留言
     * @param data
     * @param session
     * @param callback
     */
    updateAutoClaimWebchatSessionStatus: function (data, session, callback) {
        mongo.db().collection('app_push_client').update({_id: session.user._id}, {$set: {status: data.status}},{w:1}, function (err) {
            if (!err) {

                mongo.db().collection(fields.DB_APP_PUSH_CLIENT).findOne({_id:session.user._id}, function(err, doc){
                    redisUtils.string.setObj(redisField.ONLINE_AGENT_INFO+session.user._id, doc, function(){},redisField.REDIS_DB1);
                    if(data.status == "open"){
                        handler.notifyAssign(session, function(){});
                    }
                });

                callback({success: true});
            } else {
                logger.app.error(err);
                callback({success: false, message: err});
            }
        });
        var reportData = {
            reportTime: utils.getCurrentDate(),
            reportType: "autoClaimStatus",
            agentId: session.user._id,
            account: session.user.account,
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
    _recurClaimSession: function (list, curVersion, session, callback) {
        var result = {success: false};
        if (list.length == 0) {
            result.success = true;
            callback(result);
            return;
        } else {
            var curSession = list.pop();
            var find = {_id: curSession._id, autoClaimVersion: curSession.autoClaimVersion,account:session.user.account};
            var uid = session.user._id;
            var setDoc = {
                $set: {type: 'webchat', user: uid, status: 'deal', autoClaimVersion: curVersion , lastClaimTime: utils.getCurrentDateTime()},
                $addToSet: {history: {user: uid, time: utils.getCurrentDate(), type: 'claim'}}
            };
            if (!curSession.beginTime) {
                setDoc['$set'].beginTime = utils.getCurrentDate();
                setDoc['$set'].agentClaimTime = utils.getCurrentDateTime();
            }
            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, {w: 1}, function (err) {
                if (err) {
                    logger.app.error('_recurClaimSession update db has err! = ' + err);
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
    _recurNotifyAutoClaim: function (list, session, callback) {
        var result = {success: false};
        if (list.length == 0) {
            result.success = true;
            callback(result);
            return;
        } else {
            var curSession = list.pop();
            var data = {};
            data.userId = session.user._id;
            data.operation = 'claim';
            data.platform = curSession.platform;
            data.sid = curSession.sid;
            //处理技能组领取
            if(curSession.history.length>1){
                data.operation = 'redirect';
                multiChannelHandler.notifyDispatherServer(data, session, function (notifyRes) {
                });
                curSession.mchType = 'changePeer';
            }else{
                multiChannelHandler.notifyDispatherServer(data, session, function (notifyRes) {
                });
                curSession.mchType = 'claim';
            }

            handler._updateMultiChannelHistory(curSession, session, function (mchRes) {});

            handler._recurNotifyAutoClaim(list, session, callback);
        }
    },

    /**
     * 通知其他座席
     * @param list
     * @param session
     * @param callback
     */
    notifyOtherAgent: function(peers, session, callback){
        if(peers.length ==0){
            callback({success:true});
            return;
        }
        var peer = peers.pop();
        var pushMsg = {eventData: {Event:'NewNotify',
            Data:{type:'webchat', operation:'claim', ToPeer:peer, Account:session.user.account}}};

        multiChannelHandler.publishByQueue(pushMsg, function(err){});
        handler.notifyOtherAgent(peers, session, callback);

    },

    /**
     * 唤醒分配服务,有待处理的任务,可以分配给状态符合<会话不饱和><打开开关><登录了><发生转接了><被抢接了><关闭会话了><修改会话上限>的座席了
     * @param session
     * @param callback
     */
    notifyAssign: function(session, callback, peer, account){
        callback();
        if(peer){
            var peers = [];
            peers.push(peer);
            var url = config.imAssignUrl+'?Action=notifyAssign&account='+account+'&peers='+peers.toLocaleString();
            url=encodeURI(url);
            httpProvider.sendGet(url,function(err, res){
                var res1 = {};
                try{
                    if(!err){
                        res1 = JSON.parse(res);
                    }
                }catch (err1){
                    err = err1;
                }
                if(err || !res1.Succeed){
                    logger.app.warn("request assign agent error", err);
                }
            });
        }else{
            //登录了,则通知分配服务进行分配
            Thenjs(function(cont){
                handler.getImAccessId(null, session, function(result){
                    cont(null, result);
                });
            }).then(function(cont, res){
                if(res.success && res.peers){
                    var url = config.imAssignUrl+'?Action=notifyAssign&agent='+session.user._id+'&account='+session.user.account+'&peers='+res.peers.toLocaleString();
                    url=encodeURI(url);
                    httpProvider.sendGet(url,cont);
                }
            }).then(function(cont, res){
                var res1 = {};
                try{
                    res1 = JSON.parse(res);
                }catch (err1){
                    logger.app.warn("request assign agent error", res);
                }
            }).fail(function(cont, err){
                logger.app.error(err);
            });
        }


    },

    updateAgentCurrImDealCount:function(user, count){
        console.log("=========="+count);
        if(count>0){
            redisUtils.string.incrBy(redisField.AGENT_CURR_IM_DEAL_COUNT+user, count, function(){}, redisField.REDIS_DB1);
        }else if(count < 0){
            redisUtils.string.decrBy(redisField.AGENT_CURR_IM_DEAL_COUNT+user, Math.abs(count), function(){}, redisField.REDIS_DB1);
        }

        //mongo.db().collection(fields.DB_APP_PUSH_CLIENT).update({_id:user},{$inc:{currImDealCount:count}},{w:1});
    },

    /**
     * 累加从上线到现在的处理会话数
     * @param user
     * @param count
     */
    updateAgentDealedCount: function(user, count){
        redisUtils.string.incrBy(redisField.AGENT_IM_DEALED_COUNT+user, count, function(){}, redisField.REDIS_DB1);
    },

    setMemoryAgentToRedis: function (session, chatSession, data) {
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({
            Account: session.user.account,
            Exten: chatSession.toPeer
        }, function (queueErr, peerQueue) {
            if (peerQueue && peerQueue.IsMemory) {
                var memorySeconds = peerQueue.MemoryTime * 60;
                if (memorySeconds > 0) {
                    redisUtils.string.setEX(redisField.IM_ASSIGN_MEMORY + chatSession.sid, data.toUser, memorySeconds, function () {
                    }, redisField.REDIS_DB1);
                }
            }

        });
    }, /**
     * @param data 需�个参数{_id: 会话的_id, toUser:被转接座席的id, toUserName:被转接座席的姓名 }
     * @param session
     * @param callback
     */
    redirectWebchatSession: function (data, session, callback) {
        var result = {success: false};
        if(!data.toUser){
            var find = {_id: data._id,account:session.user.account};
            var setDoc = {
                $set: {
                    //sid: data.sid,
                    type: 'webchat',
                    user: "",
                    fromUser: session.user._id,
                    toPeer:data.toPeer,
                    //username: data.toUserName,
                    leakNum: 0,
                    lastRedirectTime: utils.getCurrentDateTime(),
                    status : 'undeal'
                },
                $addToSet: {history: {user: session.user._id, time: utils.getCurrentDate(), type: 'changePeer',toPeer:data.toPeer}},
                $unset:{agentFirstReplyTime:1,invitedUser:1,invitedUserName:1,inviteUserStatus:1, lastRedirectUserTime: 1}
            };
            mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({_id:data.queueId}, function(err, row){
                if (!err) {
                    if(row){
                        var AssignMembers = row.AssignMembers;
                        if(AssignMembers && AssignMembers.length>0){
                            //判断该技能组内的人是否全部都不能领取
                            var checkMembersIfOnline = function(memberList,callback){
                                if(memberList.length>0){
                                    var member = memberList.pop();
                                    Session.get(member.agentID, function(err, row){
                                        //var isDeal = false;//是否正在处理处理
                                        //是否是自己
                                        if(!err && row && session.user._id != row.user._id){
                                            mongo.db().collection(fields.DB_APP_PUSH_CLIENT).findOne({_id: member.agentID}, function(err, client){
                                                if(!err && client && client.status != "close"){
                                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count({
                                                        $or:[{user: member.agentID},{invitedUser: member.agentID,inviteUserStatus:"accept"}],
                                                        status: "deal",
                                                        account:session.user.account
                                                    }, function(err, dealCount){
                                                        if(!err && row.user.imDealCount > dealCount){
                                                            result.success = true;
                                                            callback(result);
                                                        }else{
                                                            checkMembersIfOnline(memberList,callback);//不符合条件
                                                        }
                                                    })
                                                }else{
                                                    checkMembersIfOnline(memberList,callback);//不符合条件
                                                }
                                            })
                                        }else{
                                            checkMembersIfOnline(memberList,callback);//不符合条件
                                        }
                                    })
                                }else{
                                    result.success = false;
                                    result.message = "该技能组成员均已关闭领取回话或者都已达会话上限";//
                                    callback(result);
                                }

                            }
                            checkMembersIfOnline(AssignMembers,function(result){
                                if(result.success){
                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSessionBeforeUpdate) {
                                        setDoc.$set.previousPeer = chatSessionBeforeUpdate.toPeer;
                                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, function (err) {
                                            if (!err) {
                                                handler.updateAgentCurrImDealCount(session.user._id, -1);
                                                handler.notifyAssign(session, function(){});
                                                handler.notifyAssign(null, function(){}, data.toPeer, session.user.account);
                                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
                                                    if (!err) {
                                                        var pushMsg = {
                                                            eventData: {
                                                                Event: 'NewNotify', Account: session.user.account,
                                                                Data: {
                                                                    type: 'webchat',
                                                                    operation: 'changePeer',
                                                                    from: session.user._id,
                                                                    to: null,
                                                                    AccessId: chatSession.accessId,
                                                                    _id: data._id,
                                                                    sessionId: data._id,
                                                                    Sid: data.sid,
                                                                    sName: chatSession.sName,
                                                                    CreateTime: chatSession.createTime,
                                                                    Platform: chatSession.platform,
                                                                    FromUrl:chatSession.fromUrl,
                                                                    UrlTitle: chatSession.urlTitle,
                                                                    userStatus:chatSession.userStatus,
                                                                    sBreakTime:chatSession.sBreakTime,
                                                                    ToPeer:data.toPeer,
                                                                    sessionVersion: chatSession.autoClaimVersion,
                                                                    lastAgentMsgTimeStamp:chatSession.lastAgentMsgTimeStamp,
                                                                    lastCustomerMsgTimeStamp:chatSession.lastCustomerMsgTimeStamp,
                                                                    startCustomerWaitTimeStamp:utils.getCurrentDateTime(),
                                                                    lastClaimTime:chatSession.lastClaimTime,
                                                                    createTimeStamp:chatSession.createTimeStamp
                                                                }
                                                            }
                                                        };
                                                        logger.app.info('NewNotify ------ byqueue' + JSON.stringify(pushMsg));
                                                        multiChannelHandler.publishByQueue(pushMsg, function (err) {
                                                        });

                                                        if(chatSessionBeforeUpdate.invitedUser){
                                                            var invited_redirect_Msg = {
                                                                userId: chatSessionBeforeUpdate.invitedUser, eventData: {
                                                                    Event: 'NewNotify',
                                                                    Foryou: true,
                                                                    Account: session.user.account,
                                                                    Data: {
                                                                        type: 'webchat',
                                                                        operation: 'invited_redirect',//推送给协作坐席，该会话被转接了
                                                                        from: session.user._id,
                                                                        _id: data._id,
                                                                        Sid: data.sid,
                                                                        sName: chatSession.sName,
                                                                        CreateTime: chatSession.createTime,
                                                                        createTimeStamp: chatSession.createTimeStamp,
                                                                        Platform: chatSession.platform,
                                                                        FromUrl: chatSession.fromUrl,
                                                                        UrlTitle: chatSession.urlTitle,
                                                                        userStatus: chatSession.userStatus,
                                                                        sBreakTime: chatSession.sBreakTime,
                                                                        ToPeer: chatSession.toPeer,
                                                                        invitedUser:chatSessionBeforeUpdate.invitedUser,
                                                                        startCustomerWaitTimeStamp:utils.getCurrentDateTime()
                                                                    }
                                                                }
                                                            };
                                                            multiChannelHandler.pushToAgent(invited_redirect_Msg, function (err) {
                                                            });

                                                            //更新当前处理会话数
                                                            if(chatSessionBeforeUpdate.invitedUser && chatSessionBeforeUpdate.inviteUserStatus=="accept"){
                                                                handler.updateAgentCurrImDealCount(chatSessionBeforeUpdate.invitedUser, -1);
                                                            }
                                                        }

                                                        var firstTime =chatSession.lastClaimTime || chatSession.lastRedirectTime || (chatSession.manualTime || chatSession.createTimeStamp);
                                                        var conversationTimeLength = chatSession.leavemsg ? 0 : (chatSession.lastTimeStamp ? chatSession.lastTimeStamp - firstTime : 0);
                                                        if(conversationTimeLength<0){
                                                            conversationTimeLength=0;
                                                        }
                                                        console.log(firstTime+"--------------");
                                                        console.log(chatSession);
                                                        var reportData = {
                                                            reportTime: utils.getCurrentDate(),
                                                            account:session.user.account,
                                                            agentId:session.user._id,
                                                            toUser: "pool",
                                                            reportType:"redirectSession",
                                                            accessId: chatSession.accessId,
                                                            platform: chatSession.platform,
                                                            conversationTimeLength : conversationTimeLength
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
                                    });
                                }else{
                                    callback(result);
                                }

                            });
                        }
                    }else{
                        result.success = false;
                        result.message = "未找到该技能组";
                        callback(result);
                    }
                }else{
                    logger.app.error(err);
                    callback(result);
                }
            })




        }else{
            var find = {_id: data._id, account:session.user.account};
            var currTime = utils.getCurrentDateTime();
            var setDoc = {
                $set: {
                    //sid: data.sid,
                    type: 'webchat',
                    user: data.toUser,
                    fromUser: session.user._id,
                    username: data.toUserName,
                    leakNum: 0,
                    lastRedirectTime: currTime,
                    lastRedirectUserTime: currTime,
                    startCustomerWaitTimeStamp: currTime
                },
                $addToSet: {history: {user: session.user._id, time: utils.getCurrentDate(), type: 'redirect'}},
                $unset:{agentFirstReplyTime:1,invitedUser :1,invitedUserName :1,inviteUserStatus :1}
            };


            Session.get(data.toUser, function(err, row){
                if(!err && row){
                    mongo.db().collection(fields.DB_APP_PUSH_CLIENT).findOne({_id: data.toUser}, function(err, client){
                        if(err || !client){
                            result.success = false;
                            result.message = "该座席不在线";
                            callback(result);
                        } else {
                            if (client && client.status == "close") {
                                result.success = false;
                                result.message = "该座席已关闭领取会话";
                                callback(result);
                            } else {
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count({
                                    $or:[{user: data.toUser},{invitedUser: data.toUser,inviteUserStatus:"accept"}],
                                    status: "deal",
                                    account:session.user.account
                                }, function (err, dealCount) {
                                    if (!err) {
                                        if (row.user.imDealCount > dealCount) {
                                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
                                                if (!err) {
                                                    //判断是不是转接给协作坐席,判断是不是有未处理的邀请
                                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, function (err1) {
                                                        if (!err1) {
                                                            result.success = true;
                                                            callback(result);
                                                            handler.setMemoryAgentToRedis(session, chatSession, data);

                                                            data.operation = 'redirect';
                                                            data.userId = data.toUser;
                                                            data.platform = chatSession.platform;
                                                            multiChannelHandler.notifyDispatherServer(data, session, function (notifyRes) {
                                                            });
                                                            var pushMsg = {
                                                                userId: data.toUser, eventData: {
                                                                    Event: 'NewNotify',
                                                                    Foryou: true,
                                                                    Account: session.user.account,
                                                                    Data: {
                                                                        type: 'webchat',
                                                                        operation: 'redirect',
                                                                        from: session.user._id,
                                                                        to: data.toUser,
                                                                        _id: data._id,
                                                                        Sid: data.sid,
                                                                        sName: chatSession.sName,
                                                                        CreateTime: chatSession.createTime,
                                                                        Platform: chatSession.platform,
                                                                        FromUrl: chatSession.fromUrl,
                                                                        UrlTitle: chatSession.urlTitle,
                                                                        userStatus: chatSession.userStatus,
                                                                        sBreakTime: chatSession.sBreakTime,
                                                                        ToPeer: chatSession.toPeer,
                                                                        user: data.toUser,
                                                                        invitedUser:chatSession.invitedUser,
                                                                        lastAgentMsgTimeStamp:chatSession.lastAgentMsgTimeStamp,
                                                                        lastCustomerMsgTimeStamp:chatSession.lastCustomerMsgTimeStamp,
                                                                        lastClaimTime:chatSession.lastClaimTime,
                                                                        createTimeStamp:chatSession.createTimeStamp
                                                                    }
                                                                }
                                                            };
                                                            if(!chatSession.lastAgentMsgTimeStamp || chatSession.lastCustomerMsgTimeStamp > chatSession.lastAgentMsgTimeStamp){
                                                                pushMsg.eventData.Data.startWaitTimer = 0;
                                                            }else{
                                                                pushMsg.eventData.Data.startWaitTimer = -1;
                                                            }
                                                            multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                                            });
                                                            if(chatSession.invitedUser){
                                                                var pushMsg = {
                                                                    userId: chatSession.invitedUser, eventData: {
                                                                        Event: 'NewNotify',
                                                                        Foryou: true,
                                                                        Account: session.user.account,
                                                                        Data: {
                                                                            type: 'webchat',
                                                                            operation: 'invited_redirect',//推送给协作坐席，该会话被转接了
                                                                            from: session.user._id,
                                                                            to: data.toUser,
                                                                            _id: data._id,
                                                                            Sid: data.sid,
                                                                            sName: chatSession.sName,
                                                                            CreateTime: chatSession.createTime,
                                                                            Platform: chatSession.platform,
                                                                            FromUrl: chatSession.fromUrl,
                                                                            UrlTitle: chatSession.urlTitle,
                                                                            userStatus: chatSession.userStatus,
                                                                            sBreakTime: chatSession.sBreakTime,
                                                                            ToPeer: chatSession.toPeer,
                                                                            user: data.toUser,
                                                                            invitedUser:chatSession.invitedUser
                                                                        }
                                                                    }
                                                                };
                                                                if(!chatSession.lastAgentMsgTimeStamp || chatSession.lastCustomerMsgTimeStamp > chatSession.lastAgentMsgTimeStamp){
                                                                    pushMsg.eventData.Data.startWaitTimer = 0;
                                                                }else{
                                                                    pushMsg.eventData.Data.startWaitTimer = -1;
                                                                }
                                                                multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                                                });
                                                            }

                                                            var firstTime = chatSession.lastRedirectTime || (chatSession.manualTime || chatSession.createTimeStamp);
                                                            var conversationTimeLength = chatSession.leavemsg ? 0 : (chatSession.lastTimeStamp ? chatSession.lastTimeStamp - firstTime : 0);
                                                            console.log(firstTime + "--------------");
                                                            console.log(chatSession);
                                                            var reportData = {
                                                                reportTime: utils.getCurrentDate(),
                                                                account: session.user.account,
                                                                agentId: session.user._id,
                                                                toUser: data.toUser,
                                                                reportType: "redirectSession",
                                                                accessId: chatSession.accessId,
                                                                platform: chatSession.platform,
                                                                conversationTimeLength: conversationTimeLength
                                                            };
                                                            reportEvent.emitImReportEvent(reportData);

                                                            //更新当前处理会话数
                                                            handler.updateAgentCurrImDealCount(session.user._id, -1);
                                                            handler.notifyAssign(session, function(){});
                                                            if(chatSession.invitedUser != data.toUser ||  chatSession.inviteUserStatus!="accept"){
                                                                handler.updateAgentCurrImDealCount(data.toUser, 1);
                                                            }
                                                            handler.updateAgentDealedCount(data.toUser, 1);

                                                        } else {
                                                            logger.app.error(err1);
                                                            result.message = "更新数据异常";
                                                            callback(result);
                                                        }
                                                    });
                                                } else {
                                                    logger.app.error(err);
                                                    result.message = "会话查询异常";
                                                    callback(result);
                                                }
                                            });
                                        } else {
                                            result.success = false;
                                            result.message = "该座席的处理会话数已到上限值，请稍后再试";
                                            callback(result);
                                        }
                                    }else{
                                        logger.app.error(err);
                                        result.message = "查询异常";
                                        callback(result);
                                    }
                                });
                            }
                        }
                    });

                } else {
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
        if (data._id) {
            finishiArr.push({_id: data._id, sid: data.sid});
        }
        for (var i = 0; i < finishiArr.length; i++) {
            ids.push(finishiArr[i]._id);
        }
        var idCondition = {$in: ids};
        var find = {_id: idCondition, status: {$ne: 'finish'},user:session.user._id,account:session.user.account};
        var endTime = utils.getCurrentDate();
        var setDoc = {
            $set: {
                status: 'finish',
                finishReason: data.finishReason,
                finishUser: session.user._id,
                finishKey: data.finishKey,
                endTime: endTime,
                leakNum: 0
            }
        };

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find({_id: idCondition,user:session.user._id,account:session.user.account}).toArray(function (err, chatSessions) {

            if (!err) {
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, {
                    w: 1,
                    multi: true
                }, function (err) {
                    if (!err) {
                        var closeSize = 0;
                        for (var i = 0; i < chatSessions.length; i++) {
                            var chatSession = chatSessions[i];
                            var data2 = {
                                _id: chatSession._id,
                                sid: chatSession.sid,
                                finishReason: data.finishReason,
                                finishKey: data.finishKey
                            };
                            console.log("------------====="+chatSession.status);
                            if(chatSession.status == "deal" || chatSession.status == "changePeer"){
                                closeSize++;
                                console.log("------------"+closeSize);
                            }
                            //关闭流转的不需要通知到前端
                            if (chatSession.status != "changePeer") {

                                if(chatSession.platform == "weixin"){
                                    //var cloneSession = utils.deepClone(chatSession);
                                    //handler.notifyFinishMsgToWeixinFan(cloneSession);
                                }else{
                                    data2.operation = 'finish';
                                    data2.userId = session.user._id;
                                    data2.platform = chatSession.platform;
                                    multiChannelHandler.notifyDispatherServer(data2, session, function (notifyRes) {
                                    });
                                }
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
                                    toPeer: chatSession.toPeer,
                                    sessionId: chatSession._id

                                };
                                reportEvent.emitImReportEvent(reportData);
                            }

                            //完结会话的报表
                            handler.setFinishSessionReport(chatSession, session, data2, endTime);

                            var chatSession2 = {
                                _id: data2._id,
                                sid: data2.sid,
                                mchType: 'finish',
                                dispose: data2.finishReason
                            };
                            handler._updateMultiChannelHistory(chatSession2, session, function (mchRes) {
                            });

                            //通知被邀请的座席在前端关闭会话
                            if (chatSession.invitedUser) {
                                var pushMsg = {
                                    userId:  chatSession.invitedUser,
                                    eventData: {
                                        Event: 'NewNotify',
                                        Foryou: true,
                                        Account: session.user.account,
                                        Data: {
                                            type: 'webchat',
                                            operation: 'invite_close',
                                            accept:true,
                                            from: session.user._id,
                                            to: chatSession.invitedUser,
                                            _id: chatSession._id,
                                            Sid: chatSession.sid,
                                            sName: chatSession.sName,
                                            invitedUserName:chatSession.invitedUserName,
                                            CreateTime: chatSession.createTime,
                                            Platform: chatSession.platform,
                                            FromUrl: chatSession.fromUrl,
                                            UrlTitle: chatSession.urlTitle,
                                            userStatus: chatSession.userStatus,
                                            sBreakTime: chatSession.sBreakTime,
                                            ToPeer: chatSession.toPeer,
                                            user: chatSession.invitedUser,
                                            username:chatSession.username
                                        }
                                    }
                                };
                                multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                });
                            }

                            if(chatSession.invitedUser && chatSession.inviteUserStatus=="accept"){
                                handler.updateAgentCurrImDealCount(chatSession.invitedUser, -1);
                            }

                            // 结束会话后删除定时自动关闭事件
                            notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_REMOVE_AUTO_CLOSE, {
                                account: session.user.account,
                                sessionId: chatSession._id
                            });
                        }
                        handler.updateAgentCurrImDealCount(session.user._id, -closeSize);
                        if(closeSize>0){
                            handler.notifyAssign(session, function(){});
                        }
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
    notifyFinishMsgToWeixinFan:function(chatSession){
        var id = utils.UUID.generateUuid();
        var time = utils.DateTime.getCurrentDateTime();
        var replyData = {
            account: chatSession.account,
            accessId: chatSession.accessId,
            sid: chatSession.sid,
            sessionId: chatSession._id,
            platform: chatSession.platform,
            user:'system',
            createTime: time,
            lastTime:time,
            contentType:'text',
            msgType:'newIm',
            _id:id
        };


        mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne({_id:chatSession.accessId}, function(err, wechatConfig){
            if(wechatConfig && wechatConfig.finish_msg){
                replyData.content = encodeURIComponent(encodeURIComponent(wechatConfig.finish_msg));
                httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(replyData), function (err, rep) {

                });
            }
        });

    },
    setFinishSessionReport: function (chatSession, session, data2, endTime) {
        var msgCount = chatSession.msgCount || 0;
        mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne({account: session.user.account}, function (err, globalSet) {
            var goodNum = 0;
            var badNum = 0;
            var flag = "";
            if (globalSet && globalSet.chatCheck == "1") {
                if (globalSet.goodNum > 0) {
                    goodNum = globalSet.goodNum;
                    badNum = globalSet.badNum >= 0 ? globalSet.badNum : 0;

                    if (msgCount >= goodNum) {
                        flag = "good";
                    } else if (msgCount <= badNum) {
                        flag = "bad";
                    } else {
                        flag = "medium";
                    }
                }
            }

            var firstTime = chatSession.manualTime || chatSession.createTimeStamp;
            var conversationTimeLength = chatSession.leavemsg ? 0 : (chatSession.lastTimeStamp ? chatSession.lastTimeStamp - firstTime : 0);
            var agentConversationTimeLength = chatSession.leavemsg ? 0 : (chatSession.lastTimeStamp ? chatSession.lastTimeStamp - (chatSession.lastRedirectTime || firstTime) : 0);
            if(conversationTimeLength<0){
                conversationTimeLength=0;
            }
            if(agentConversationTimeLength<0){
                agentConversationTimeLength=0;
            }

            var reportData = {
                type: reportEvent.EventType.IM_CLOSE_SESSION,
                reportTime: endTime,
                conversationTimeLength: conversationTimeLength,
                agentId: session.user._id,
                account: session.account.account,
                platform: chatSession.platform,
                accessId: chatSession.accessId,
                consultType: data2.finishKey,
                toPeer: chatSession.toPeer,
                sessionId: chatSession._id,
                agentConversationTimeLength: agentConversationTimeLength,
                flag: flag
            };
            reportEvent.emitImReportEvent(reportData);
            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: chatSession._id,account:session.user.account}, {$set: {quality: flag}});
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
            var scope = session.user.scope.chat;
            if (scope != fields.data_scope_all) {
                var query2 = {"user":query["user"],"ownerdep":query["ownerdep"],"ownercom":query["ownercom"]};
                //删除常用查询条件
                delete query.ownercom;
                delete query.ownerdep;
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
                if(query.user || query.ownercom || query.ownerdep){
                    utils.setUserLevelCondition(query, 'user','chat', session);
                }
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
        var query = {_id: data._id, account: session.user.account};
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
        var query = {_id: data._id, account: session.user.account};
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
        if (query.createTimeBegin&&!query.createTimeEnd) {
            query.createTime = {$gte: query.createTimeBegin};
        }
        if (query.createTimeEnd&&!query.createTimeBegin) {
            query.createTime = {$lte: query.createTimeEnd};
        }
        if (query.createTimeBegin&&query.createTimeEnd) {
            query.createTime = {$gte: query.createTimeBegin,$lte: query.createTimeEnd};
        }
        if (query.beginTimeBegin&&!query.beginTimeEnd) {
            query.beginTime = {$gte: query.beginTimeBegin};
        }
        if (query.beginTimeEnd&&!query.beginTimeBegin) {
            query.beginTime = {$lte: query.beginTimeEnd};
        }
        if (query.beginTimeBegin&&query.beginTimeEnd) {
            query.beginTime = {$gte: query.beginTimeBegin,$lte: query.beginTimeEnd};
        }
        if (query.endTimeBegin&&!query.endTimeEnd) {
            query.endTime = {$gte: query.endTimeBegin};
        }
        if (query.endTimeEnd&&!query.endTimeBegin) {
            query.endTime = {$lte: query.endTimeEnd};
        }
        if (query.endTimeBegin&&query.endTimeEnd) {
            query.endTime = {$gte: query.endTimeBegin,$lte: query.endTimeEnd};
        }
        if (query.manualTimeBegin&&!query.manualTimeEnd) {
            query.manualTime = {$gte: new Date(query.manualTimeBegin).getTime()};
        }
        if (query.manualTimeEnd&&!query.manualTimeBegin) {
            query.manualTime = {$lte: new Date(query.manualTimeEnd).getTime()};
        }
        if (query.manualTimeBegin&&query.manualTimeEnd) {
            query.manualTime = {$gte: new Date(query.manualTimeBegin).getTime(),$lte: new Date(query.manualTimeEnd).getTime()};
        }
        delete query.beginTimeBegin;
        delete query.beginTimeEnd;
        delete query.createTimeBegin;
        delete query.createTimeEnd;
        delete query.endTimeBegin;
        delete query.endTimeEnd;
        delete query.manualTimeBegin;
        delete query.manualTimeEnd;
        if (query.msgCountType && query.msgCount) {
            var msgCount = parseInt(query.msgCount);
            if (query.msgCountType == "gt") {
                query.totalMsgCount = {$gt: msgCount}
            } else if (query.msgCountType == "lt") {
                query.totalMsgCount = {$lt: msgCount}
            } else if (query.msgCountType == "eq") {
                query.totalMsgCount = msgCount;
            }
        }
        delete query.msgCount;
        delete query.msgCountType;
    },
//客户条件查询更换查询对象
    _customerQueryCondition: function (query, queryReplace) {
        if (query.appraiseKey) {
            queryReplace.appraiseKey = query.appraiseKey;
        }
        if (query.beginTime) {
            queryReplace.beginTime = query.beginTime;
        }
        if (query.endTime) {
            queryReplace.endTime = query.endTime;
        }
        if (query.finishKey) {
            queryReplace.finishKey = query.finishKey;
        }
        if (query.status) {
            queryReplace.status = query.status;
        }
        if (query.toPeer) {
            queryReplace.toPeer = query.toPeer;
        }
        if (query.totalMsgCount) {
            queryReplace.totalMsgCount = query.totalMsgCount;
        }
        if (query.user) {
            queryReplace.user = query.user;
        }
        delete query.appraiseKey;
        delete query.beginTime;
        delete query.endTime;
        delete query.finishKey;
        delete query.status;
        delete query.toPeer;
        delete query.totalMsgCount;
        delete query.user;
    },
    //todo getPeers
    getImAccessId: function (data, session, callback) {
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
                    callback(result);
                } else {
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

    //获取查询条件
    processQueryCondition: function(menu, query, session, result, callback){
        if (menu == 'webchat_all') {
            var scope = session.user.scope.chat;
            if (scope != fields.data_scope_all) {
                var query2 = {"user":query["user"],"ownerdep":query["ownerdep"],"ownercom":query["ownercom"]};
                //删除常用查询条件
                delete query.ownercom;
                delete query.ownerdep;
                utils.setUserLevelCondition(query2, 'user','chat', session);
                if (query.user) {
                    //查询的处理座席不在权限范围内,则直接返回空list
                    var lowUsers = session.user.moduleUsers.chat;
                    var flag = false;
                    for (var i = 0; i < lowUsers.length; i++) {
                        var uid = lowUsers[i];
                        if (uid == query.user) {
                            flag = true;
                            break;
                        }
                    }
                    if (!flag) {
                        result.list = [];
                        result.count = 0;
                        result.success = true;
                        callback(true, result);
                        return;
                    }
                } else {
                    query.user = query2.user;
                }
            }else{
                if(query.user || query.ownercom || query.ownerdep){
                    utils.setUserLevelCondition(query, 'user','chat', session);
                }
            }
            callback(false, query);
        }else{
            query.user = session.user._id;
            query.status = {$in: ['deal', 'changePeer']};
            callback(false, query);

        };
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
        if (data.area != "" && data.area != undefined) {
            data.area = {$regex: eval("/" + data.area + "/i")};
        }
        var query = data || {};
        handler._setQuerySessionCondition(query, session);
        var uid = session.user._id;
        handler.processQueryCondition(menu, query, session, result,function(isReturn, query){
            if(isReturn){
                callback(query);
            }else{
                Thenjs.parallel([
                    function (cont) {
                        if (query.sName) {
                            //根据名称查询会话id并返回
                            solrHandler.queryIndex2Cust({name: query.sName}, session, function (rep) {
                                if (rep.success) {
                                    var ids = rep.ids || [];
                                    if (ids.length > 0) {
                                        mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).find({
                                            customerId: {$in: rep.ids},
                                            account: session.user.account,
                                            status: {$ne: 'delete'}
                                        }).toArray(function (err, customerRelation) {
                                            var sids = [];
                                            if (customerRelation) {
                                                for (var i = 0; i < customerRelation.length; i++) {
                                                    sids.push(customerRelation[i].sid);
                                                }
                                            }
                                            cont(err, sids);
                                        });
                                    } else {
                                        cont(null, []);
                                    }

                                } else {
                                    logger.app.error("query solr index error");
                                    cont(null, []);
                                }
                            });
                        } else {
                            cont(null, []);
                        }
                    },
                    function (cont) {
                        if (query.mKeyword) {
                            // 根据消息关键字查询会话id并返回
                            esHandler.searchMsgIndex({
                                account: session.user.account,
                                keyword: query.mKeyword
                            }, function (resp) {
                                if (resp.success) {
                                    var hash = {};
                                    var resultData = [];
                                    resp.data.forEach(function (msg) {
                                        var sid = msg.sessionId;
                                        if (!hash[sid]) {
                                            resultData.push(sid);
                                            hash[sid] = true;
                                        }
                                    });
                                    cont(null, resultData);
                                } else {
                                    logger.app.error('query elasticsearch index error');
                                    cont(null, []);
                                }
                            });
                        } else {
                            cont(null, []);
                        }
                    }
                ]).then(function (cont, results) {
                    var sids = results[0];
                    var sessionIds = results[1];
                    var orQuery = null;
                    query['$and'] = [];
                    if (query.sName) {
                        var pattern = new RegExp(query.sName, "i");
                        orQuery = [{sName:pattern},{sid:{$in:sids}}];
                    }
                    if(orQuery){
                        delete query.sName;
                        query['$and'].push({$or:orQuery});
                    }
                    if (query.mKeyword) {
                        delete query.mKeyword;
                        query['$and'].push({ _id: { $in: sessionIds } });
                    }
                    var options = {sort:{createTime: -1}};
                    if(menu == "webchat_todo"){
                        options.sort={lastCustomerMsgTimeStamp:-1,createTime: -1};
                    }
                    if(menu == "webchat_all"){
                        options.limit = limit;
                        options.skip = skip;
                    }

                    //还要加入被邀请的会话
                    if(query.user){
                        var userOr =[{user:query.user},{invitedUser:query.user,inviteUserStatus : "accept",status:"deal"}];
                        delete query.user;
                        query['$and'].push({$or:userOr});
                    }
                    //最后回复时间的判断
                    if (query.visitorsReply) {
                        var min = query.visitorsReply;
                        var newTime = new Date().getTime() - min * 60 * 1000;
                        query.lastCustomerMsgTimeStamp = {$lte: newTime};
                        if(query.unReply){
                            query.leakNum={$gt:0};
                        }else{
                            query.leakNum=0;
                        }
                        delete query.visitorsReply;
                    }
                    if (query.clientReply) {
                        var min = query.clientReply;
                        var newTime = new Date().getTime() - min * 60 * 1000;
                        query.lastAgentMsgTimeStamp = {$lte: newTime};
                        if(query.unReply){
                            query.leakNum={$gt:0};
                        }else{
                            query.leakNum=0;
                        }
                        delete query.clientReply;
                    }
                    if(query.unReply){
                        query.leakNum={$gt:0};
                    }
                    delete query.unReply;

                    if( query.$and.length==0){
                        delete query.$and;
                    }
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query, options).toArray(cont);

                }).then(function (cont, list) {
                    if(!list || list.length == 0){
                        result.list = [];
                        result.count = 0;
                        result.success = true;
                        callback(result);
                        return;
                    }
                    var sids = [];
                    for (var i = 0; i < list.length; i++) {
                        var chatSession = list[i];
                        sids.push(chatSession.sid);
                        //当重新去访问列表时,设定初始计时器,秒为单位
                        if(chatSession.status == "deal" && !chatSession.leavemsg && (!chatSession.lastAgentMsgTimeStamp || chatSession.lastCustomerMsgTimeStamp > chatSession.lastAgentMsgTimeStamp)){
                            chatSession.startWaitTimer = chatSession.startCustomerWaitTimeStamp? Math.floor((utils.getCurrentDateTime()-chatSession.startCustomerWaitTimeStamp)/1000) :
                                Math.floor((utils.getCurrentDateTime()-chatSession.lastClaimTime)/1000);
                        }

                    }
                    //获取地区
                    mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).find({
                        sid: {$in: sids},
                        account: session.user.account,
                        status: {$ne: 'delete'}
                    }).toArray(function (err, customerRelations) {
                        cont(err, customerRelations, list);
                    });

                }).then(function (cont, customerRelations, list) {
                    var ids = [];
                    var relations = {};
                    if (customerRelations && customerRelations.length > 0) {
                        while (customerRelations.length > 0) {
                            var customerIdDoc = customerRelations.pop();
                            ids.push(customerIdDoc.customerId);
                            relations[customerIdDoc.sid] = customerIdDoc.customerId;
                        }
                    }
                    mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find({_id: {$in: ids}}).toArray(function (err, customers) {
                        cont(err, customers, list, relations);
                    });
                }).then(function (cont, customers, list, relations) {
                    if (customers) {
                        //var sid = customers[m].sid;
                        for (var n = 0; n < list.length; n++) {
                            for (var m = 0; m < customers.length; m++) {
                                var customerId = relations[list[n].sid];
                                if (customerId == customers[m]._id) {
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

                }).fail(function (cont, err) {
                    logger.app.error(err);
                    result.message = err;
                    callback(result);
                });

            }
        });




        //待处理
        //handler.getImAccessId(data, session, function (rep) {
        //    if (rep.peers) {
        //        query.toPeer = {$in: rep.peers};
        //        query.user = uid;
        //        query.status = {$in: ['deal', 'changePeer']};
        //
        //        Thenjs(function(cont){
        //            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query, {
        //                sort: {createTime: -1}
        //            }).toArray(cont);
        //
        //        }).then(function (cont, list) {
        //            var sids = [];
        //            for (var i = 0; i < list.length; i++) {
        //                sids.push(list[i].sid);
        //            }
        //            //获取地区
        //            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).find({
        //                sid: {$in: sids},
        //                account: session.user.account,
        //                status: {$ne: 'delete'}
        //            }).toArray(function (err, customerRelations) {
        //                cont(err, customerRelations, list);
        //            });
        //
        //        }).then(function (cont, customerRelations, list) {
        //            var ids = [];
        //            var relations = {};
        //            if (customerRelations && customerRelations.length > 0) {
        //                while (customerRelations.length > 0) {
        //                    var customerIdDoc = customerRelations.pop();
        //                    ids.push(customerIdDoc.customerId);
        //                    relations[customerIdDoc.sid] = customerIdDoc.customerId;
        //                }
        //            }
        //            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find({_id: {$in: ids}}).toArray(function (err, customers) {
        //                cont(err, customers, list, relations);
        //            });
        //        }).then(function (cont, customers, list, relations) {
        //            if (customers) {
        //                //var sid = customers[m].sid;
        //                for (var n = 0; n < list.length; n++) {
        //                    for (var m = 0; m < customers.length; m++) {
        //                        var customerId = relations[list[n].sid];
        //                        if (customerId == customers[m]._id) {
        //                            list[n].sourceName = list[n].sName;
        //                            list[n].sName = customers[m].name;
        //                            list[n].custId = customers[m]._id;
        //                            list[n].showCustomerName = true;
        //                            break;
        //                        }
        //                    }
        //                }
        //            }
        //            result.list = list || [];
        //            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
        //                result.count = count;
        //                result.success = true;
        //                callback(result);
        //            });
        //
        //        }).fail(function (cont, err) {
        //            logger.app.error(err);
        //            result.message = err;
        //            callback(result);
        //        });
        //
        //    } else {
        //        callback(rep);
        //    }
        //});

    },

    updateWebchatSessionRemark: function (data, session, callback) {
        var result = {success: false};
        var condition = {_id: data.sid,account: session.user.account};
        var setData = {remark: data.content};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(condition,
            {$set: setData}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({
                        account: session.user.account,
                        product: 'cc'
                    }, function (err, doc) {
                        if (err || !doc) {
                            callback(result);
                            return;
                        }
                        delete condition.account;
                        mongo.db(doc.dataDB).collection(session.user.account + "_history").update(condition, {$set: {comments: data.content}}, function (err) {
                        });
                    });
                } else {
                    logger.app.error(err);
                    result.message = "更新备注失败";
                    callback(result);
                }
            });
    },

    saveQuickReply: function (data, session, callback) {
        var result = {success: false};
        var condition = {account: session.user.account, owner: session.user._id,moduleType:data.moduleType};
        var setData = data.quickreplys;

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY).findOne(condition, function (err, doc) {
            if (!err) {
                if (doc) {
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY).update(condition, {
                        $set: {
                            quickreplys: setData,
                            updatedTime: utils.getCurrentDate()
                        }
                    });
                } else {
                    var insertData = {
                        account: session.user.account,
                        quickreplys: setData,
                        owner: session.user._id,
                        updatedTime: utils.getCurrentDate(),
                        moduleType:data.moduleType
                    };
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY).insert(insertData);
                }
                result.success = true;
                callback(result);

            } else {
                result.message = "db error,保存快捷回复失败";
                callback(result);
                logger.app.error("[" + session.user._id + "]saveQuickReply fail", err);
            }
        })
    },

    getQuickReplyList: function (data, session, callback) {
        var result = {success: false};
        var condition = {account: session.user.account, owner: session.user._id,moduleType:data.moduleType};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY).findOne(condition, function (err, doc) {
            if (!err) {
                result.success = true;
                if (doc) {
                    result.success = true;
                    result.quickreplys = doc.quickreplys || [];
                } else {
                    result.quickreplys = [];
                }
                callback(result);
            } else {
                result.message = "查找快捷回复失败";
                callback(result);
                logger.app.error("[" + session.user._id + "]getQuickReplyList fail", err);
            }
        });
    },
    /**
     * 查询出所有的快捷回复标签(自定义的和系统的)
     * @param data
     * @param session
     * @param callback
     */
    getAllQuickReplyList: function (data, session, callback) {
        var result = {success: false};
        var quickreplys = [];
        quickReplyHandler.queryAllSysQuickReply(data, session, function (sysResult) {
            if (sysResult.list) {
                quickreplys = sysResult.list;
            }
            handler.getQuickReplyList(data, session, function (qpResult) {
                result.success = true;
                result.list = qpResult.quickreplys;
                //合并
                if (quickreplys.length > 0) {
                    for (var item in quickreplys) {
                        result.list.push(quickreplys[item].content);
                    }
                }
                callback(result);
            });
        });
    },

    getOpenNum: function (data, session, callback) {
        var result = {success: false};
        var aid = session.user.account;
        var query = {
            account: aid,
            user: {$in: ['', null]},
            status: "undeal",
            toPeer: data.toPeer
        };
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
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
            user: uid,
            status: "deal"
            //toPeer: data.toPeer
        };

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
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
    refreshMenuNum: function (data, session, callback) {
        var result = {success: false};
        handler.getImAccessId(data, session, function (rep) {
            if (rep.peers) {
                data.toPeer = {$in: rep.peers};
                handler.getOpenNum(data, session, function (rep) {
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
    _updateMultiChannelHistory: function (chatSession, session, callback) {
        var result = {success: false};
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({
            account: session.user.account,
            product: 'cc'
        }, function (err, doc) {
            if (err || !doc) {
                callback(result);
                return;
            }
            var find = {_id: chatSession._id};
            var setDoc = {};

            var multiChannelHistory = {
                agent: session.user._id,
                lastUpdateTime: utils.getCurrentDate(),
                sid: chatSession.sid
            }
            if (chatSession.mchType == 'claim') {
                multiChannelHistory.beginTime = utils.getCurrentDate();
            }
            if (chatSession.mchType == 'finish') {
                multiChannelHistory.endTime = utils.getCurrentDate();
                multiChannelHistory.dispose = chatSession.dispose;
                multiChannelHistory.status = 'finish';
            }

            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).findOne({sid: chatSession.sid,status: {$ne: 'delete'}}, function (err, relationDoc) {
                if (err) {

                } else {
                    if (relationDoc && relationDoc.customerId) {
                        multiChannelHistory.customer = relationDoc.customerId;
                    }
                }
                setDoc['$set'] = multiChannelHistory;
                mongo.db(doc.dataDB).collection(session.user.account + "_history").update(find, setDoc, function (err) {
                });
            });

        });
    },
    //for dic
    getOnlineAgentDic: function (session, callback) {
        var aid = session.user.account;
        var query = {'user.account': aid};
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
    getAccessAgentDic: function (session, callback) {
        var aid = session.user.account;
        var query = {Account: aid, Peer: 'MailQueue'};
        var result = [];
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find(query, {
            fields: {
                Exten: 1,
                AssignMembers: 1
            }
        }).toArray(function (err, list) {
            if (!err) {
                list = list || [];
                for (var i = 0; i < list.length; i++) {
                    result.push({_id: list[i].Exten, agents: list[i].AssignMembers});
                }
                callback(null, result);
            } else {
                logger.app.error(err);
                callback(err);
            }
        });
    },

    //for dic
    getWebchatAndSdkConfigDic: function (session, callback) {
        var aid = session.user.account;
        var query = {'account': aid};
        mongo.db().collection("app_kefu_im_config").find(query).toArray(function (err, list) {
            if (!err) {
                mongo.db('weixin').collection("wxaccount").find(query).toArray(function (err, wxList) {
                    if (err) {
                        logger.app.error(err);
                        callback(err);
                    }
                    if (wxList && wxList.length > 0) {
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
    queryChatInfoById: function (data, session, callback) {
        var result = {success: false};
        var query = {_id: data._id, account: session.user.account};

        Thenjs(function(cont){
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(query, cont);
        }).then(function(cont,row){
            if (!row) {
                result.message = "不存在的会话！";
                callback(result);
                return;
            }
            result.chatSession = row;
                mongo.db().collection("app_kefu_im_csr").findOne({sessionId: data._id}, cont);

        }).then(function(cont,csr){
            var investigate = {};
            if (csr) {
                if (!csr.appraise)csr.appraise = {};
                investigate.value = csr.appraise.satisfaction;
                investigate.label = csr.appraise.label || [];
                investigate.content = csr.appraise.proposal;
            }
            result.chatSession.investigate = investigate;
            mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: result.chatSession.toPeer},cont);

        }).then(function(cont,queue){
            queue = queue || {};
            result.chatSession.queueName = queue.DisplayName;
            if(data.queryHistory){
                //获取访问历史
                var condition = {sid : result.chatSession.sid,cust_id:data.cust_id};
                handler.queryWebchatSessionHistory(condition, session, function(rs){
                    if(rs.success){
                        result.historyList = rs.data;
                        result.success = true;
                    }
                    callback(result);
                });
            }else{
                result.success = true;
                callback(result);
            }
        }).fail(function (cont, err) {
            logger.app.error(err);
            result.message = err;
            callback(result);
        });
    },

    /*******************************满意度调查**********************************************/
    pushImCSRInfo: function (data, session, callback) {
        var result = {success: false};
        Thenjs(function(cont){
            if (data.platform == "weixin") {
                mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne({authorizer_appid: data.accessId}, cont);
            } else {
                mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, cont);
            }
        }).then(function(cont,doc){
            if (doc) {
                if (!doc.webchat_csr == true) {
                    result.message = '该网站在线客服没有开启客户满意度调查';
                    return cont( result.message);
                } else {
                    var query1 = {
                        sessionId: data.sessionId,
                        account: session.account.account
                    }
                    mongo.db().collection('app_kefu_im_csr').findOne(query1, function (err1, doc1) {
                        if (!err1 && doc1) {
                            result.message = '已经评价过了，不能重复评价';
                            return cont(result.message);
                        } else {
                            data._id = utils.UUID.generateUuid();
                            data.msgType = "pushImCSR";
                            data.account = session.account.account;
                            data.user = session.user._id;
                            httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(data), function (err, rep) {
                                if (err) {
                                    logger.app.warn('pushImCSRInfo to gateway failed!', err);
                                    return cont(err);
                                } else {
                                    var res = JSON.parse(rep);
                                    if (res.success) {
                                        // 坐席推送满意度调查后添加定时自动关闭事件
                                        notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_SET_AUTO_CLOSE, {
                                            currTimeStamp: utils.getCurrentDateTime(),
                                            account: session.user.account,
                                            sessionId: data.sessionId
                                        });
                                        if (data.platform == "weixin") {
                                            //坐席推送满意度调查后添加weixin提醒事件
                                            var query={account:session.user.account};
                                            mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne(query, function (err, row) {
                                                if (!err && row && row.setWarnMsg>0) {
                                                    notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_SET_WEIXIN_REMIND, {
                                                        currTimeStamp: utils.getCurrentDateTime(),
                                                        account: session.user.account,
                                                        sessionId: data.sessionId
                                                    });
                                                }
                                            })
                                        }
                                        result.time = utils.getCurrentDate();
                                        result.success = true;
                                        callback(result);
                                        //等待时间
                                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id:data.sessionId,account:session.account.account}, {$unset:{startCustomerWaitTimeStamp:1}},  function(){
                                        })
                                    } else {
                                        logger.app.warn(result);
                                        callback(result);
                                    }
                                }
                            });
                        }
                    });
                }
            } else {
                result.message = '该网站在线客服没有开启客户满意度调查';
                cont(result.message);
            }
        }).fail(function(cont,err){
            logger.app.error(err);
            return callback(result);
        });
    },
    showAllSkillGroup:function(data,session,callback){
        var result = {success:false};
        var account = session.user.account;
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find({'Account':account}).toArray(function(err,docs){
            if(!err){
                result.success = true;
                result.data = docs || [];
                callback(result);
            }else {
                logger.app.error("数据查询失败："+err);
                callback({success: false, list: [], count: 0});
            }

        });
    },
    /**
     * 会话抢接
     * @param data
     * @param session
     * @param callback
     */
    grabWebchatSession:function(data,session,callback){
        var result = {success: false};
        var find = {_id: data._id,user:data.currUser, account: session.user.account};
        Session.get(session.user._id, function(err, row){
            if(!err && row){
                mongo.db().collection(fields.DB_APP_PUSH_CLIENT).findOne({_id: session.user._id}, function(err, client){
                    if(err || !client){
                        result.success = false;
                        result.message = "抢接会话错误";
                        callback(result);
                    } else {
                        if (client && client.status == "close") {
                            result.success = false;
                            result.message = "您已关闭领取会话";
                            callback(result);
                        } else {
                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count({
                                $or:[{user: session.user._id},{invitedUser: session.user._id,inviteUserStatus:"accept"}],
                                status: "deal",
                                account:session.user.account
                            }, function (err, dealCount) {
                                if (!err) {
                                    if (row.user.imDealCount > dealCount) {
                                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
                                            if (!err) {
                                                if(chatSession){
                                                    var currUser = data.currUser;
                                                    if(currUser==chatSession.user){
                                                        var currTime = utils.getCurrentDateTime();
                                                        var setDoc = {
                                                            $set: {
                                                                type: 'webchat',
                                                                user: session.user._id,
                                                                fromUser: chatSession.user,
                                                                username: session.user.displayName,
                                                                leakNum: 0,
                                                                lastRedirectTime: currTime,
                                                                lastRedirectUserTime: currTime,
                                                                startCustomerWaitTimeStamp: currTime
                                                            },
                                                            $addToSet: {history: {user: session.user._id, time: utils.getCurrentDate(), type: 'grab_redirect'}},
                                                            $unset:{agentFirstReplyTime:1,invitedUser : 1,invitedUserName : 1,inviteUserStatus:1}
                                                        };

                                                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc,  function (err1) {
                                                            if (!err1) {
                                                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({_id: data._id,user:session.user._id}, function (err, sessionAfterUpdate){
                                                                    if(!err ){
                                                                        if(sessionAfterUpdate){
                                                                            result.success = true;
                                                                            callback(result);
                                                                            handler.updateAgentDealedCount(session.user._id, 1);
                                                                            handler.updateAgentCurrImDealCount(session.user._id, 1);
                                                                            handler.updateAgentCurrImDealCount(chatSession.user, -1);
                                                                            handler.notifyAssign({user:{_id:chatSession.user, account: session.user.account}}, function(){});
                                                                            handler.setMemoryAgentToRedis(session, sessionAfterUpdate, {toUser: session.user._id});
                                                                            data.operation = 'redirect';
                                                                            data.userId = session.user._id;
                                                                            data.platform = chatSession.platform;
                                                                            multiChannelHandler.notifyDispatherServer(data, session, function (notifyRes) {
                                                                            });
                                                                            //通知自己领取
                                                                            var pushMsg = {
                                                                                userId: session.user._id, eventData: {
                                                                                    Event: 'NewNotify',
                                                                                    Foryou: true,
                                                                                    Account: session.user.account,
                                                                                    Data: {
                                                                                        type: 'webchat',
                                                                                        operation: 'redirect',
                                                                                        from: chatSession.user,
                                                                                        to: session.user._id,
                                                                                        _id: data._id,
                                                                                        Sid: data.sid,
                                                                                        sName: chatSession.sName,
                                                                                        CreateTime: utils.getCurrentDate(),
                                                                                        Platform: chatSession.platform,
                                                                                        FromUrl: chatSession.fromUrl,
                                                                                        UrlTitle: chatSession.urlTitle,
                                                                                        userStatus: chatSession.userStatus,
                                                                                        sBreakTime: chatSession.sBreakTime,
                                                                                        ToPeer: chatSession.toPeer,
                                                                                        user: session.user._id,
                                                                                        username:chatSession.username,
                                                                                        invitedUser:chatSession.invitedUser,
                                                                                        lastAgentMsgTimeStamp:chatSession.lastAgentMsgTimeStamp,
                                                                                        lastCustomerMsgTimeStamp:chatSession.lastCustomerMsgTimeStamp,
                                                                                        lastClaimTime:chatSession.lastClaimTime,
                                                                                        createTimeStamp:chatSession.createTimeStamp
                                                                                    }
                                                                                }
                                                                            };
                                                                            if(!chatSession.lastAgentMsgTimeStamp || chatSession.lastCustomerMsgTimeStamp > chatSession.lastAgentMsgTimeStamp){
                                                                                pushMsg.eventData.Data.startWaitTimer = 0;
                                                                            }else{
                                                                                pushMsg.eventData.Data.startWaitTimer = -1;
                                                                            }
                                                                            multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                                                            });
                                                                            //通知被抢接座席，处理界面
                                                                            var pushMsg = {
                                                                                userId: chatSession.user, eventData: {
                                                                                    Event: 'NewNotify',
                                                                                    Foryou: true,
                                                                                    Account: session.user.account,
                                                                                    Data: {
                                                                                        type: 'webchat',
                                                                                        operation: 'grab_redirect',
                                                                                        from: chatSession.user,
                                                                                        to: session.user._id,
                                                                                        toUserName:session.user.displayName,
                                                                                        _id: data._id,
                                                                                        Sid: data.sid,
                                                                                        sName: chatSession.sName,
                                                                                        CreateTime: utils.getCurrentDate(),
                                                                                        Platform: chatSession.platform,
                                                                                        FromUrl: chatSession.fromUrl,
                                                                                        UrlTitle: chatSession.urlTitle,
                                                                                        userStatus: chatSession.userStatus,
                                                                                        sBreakTime: chatSession.sBreakTime,
                                                                                        ToPeer: chatSession.toPeer,
                                                                                        user: session.user._id,
                                                                                        username:chatSession.username,
                                                                                        invitedUser:chatSession.invitedUser
                                                                                    }
                                                                                }
                                                                            };

                                                                            multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                                                            });

                                                                            if(chatSession.invitedUser){
                                                                                var pushMsg = {
                                                                                    userId: chatSession.invitedUser, eventData: {
                                                                                        Event: 'NewNotify',
                                                                                        Foryou: true,
                                                                                        Account: session.user.account,
                                                                                        Data: {
                                                                                            type: 'webchat',
                                                                                            operation: 'invited_redirect',//推送给协作座席，该会话被转接了
                                                                                            from: session.user._id,
                                                                                            to: data.toUser,
                                                                                            _id: data._id,
                                                                                            Sid: data.sid,
                                                                                            sName: chatSession.sName,
                                                                                            CreateTime: chatSession.createTime,
                                                                                            Platform: chatSession.platform,
                                                                                            FromUrl: chatSession.fromUrl,
                                                                                            UrlTitle: chatSession.urlTitle,
                                                                                            userStatus: chatSession.userStatus,
                                                                                            sBreakTime: chatSession.sBreakTime,
                                                                                            ToPeer: chatSession.toPeer,
                                                                                            user: session.user._id,
                                                                                            invitedUser:chatSession.invitedUser
                                                                                        }
                                                                                    }
                                                                                };
                                                                                if(!chatSession.lastAgentMsgTimeStamp || chatSession.lastCustomerMsgTimeStamp > chatSession.lastAgentMsgTimeStamp){
                                                                                    pushMsg.eventData.Data.startWaitTimer = 0;
                                                                                }else{
                                                                                    pushMsg.eventData.Data.startWaitTimer = -1;
                                                                                }
                                                                                multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                                                                });

                                                                                if(chatSession.invitedUser && chatSession.inviteUserStatus=="accept"){
                                                                                    handler.updateAgentCurrImDealCount(chatSession.invitedUser, -1);
                                                                                }

                                                                            }
                                                                            var firstTime = chatSession.lastRedirectTime || (chatSession.manualTime || chatSession.createTimeStamp);
                                                                            var conversationTimeLength = chatSession.leavemsg ? 0 : (chatSession.lastTimeStamp ? chatSession.lastTimeStamp - firstTime : 0);
                                                                            console.log(firstTime + "--------------");
                                                                            console.log(chatSession);
                                                                            var reportData = {
                                                                                reportTime: utils.getCurrentDate(),
                                                                                account: session.user.account,
                                                                                agentId: chatSession.user,
                                                                                toUser: session.user._id,
                                                                                reportType: "redirectSession",
                                                                                accessId: chatSession.accessId,
                                                                                platform: chatSession.platform,
                                                                                conversationTimeLength: conversationTimeLength
                                                                            };
                                                                            reportEvent.emitImReportEvent(reportData);


                                                                        }else{
                                                                            result.message = "该会话所属座席已发生变化，请刷新列表";
                                                                            callback(result);
                                                                        }
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
                                                    }else{
                                                        result.message = "该会话所属座席已发生变化，请刷新列表";
                                                        callback(result);
                                                    }
                                                }else{
                                                    result.message = "没有找到该会话";
                                                    callback(result);
                                                }
                                            } else {
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        });
                                    } else {
                                        result.success = false;
                                        result.message = "您的处理会话数已到上限值，请稍后再试";
                                        callback(result);
                                    }
                                }
                            });
                        }
                    }
                });
            } else {
                result.success = false;
                result.message = "该座席不在线";
                callback(result);
            }
        });
    },
    /**
     * 邀请某人建立多方会话
     * @param data
     * @param session
     * @param callback
     */
    inviteGroupSession:function(data,session,callback){
        var find = {_id: data._id, account:session.user.account};
        var result = {success: false};
        var setDoc = {
            $set: {
                invitedUser:data.invitedUser,
                invitedUserName:data.invitedUserName,
                inviteUserStatus:"undeal"//undeal 未处理  accept 已经接受
            },
            $addToSet: {history: {user: session.user._id, time: utils.getCurrentDate(), type: 'invite',invitedUser:data.invitedUser,deal:"undeal"}},
        };

        var account = session.user.account;
        //1 判断是否在线，是否合法，是否开启了领取会话等
        Session.get(data.invitedUser, function(err, row){
            if(!err && row){
                mongo.db().collection(fields.DB_APP_PUSH_CLIENT).findOne({_id: data.invitedUser}, function(err, client){
                    if(err || !client){
                        result.success = false;
                        result.message = "该座席不在线";
                        callback(result);
                    } else {
                        if (client && client.status == "close") {
                            result.success = false;
                            result.message = "该座席已关闭领取会话";
                            callback(result);
                        } else {
                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count({
                                $or:[{user: data.invitedUser},{invitedUser: data.invitedUser,inviteUserStatus:"accept"}],
                                status: "deal",
                                account:session.user.account
                            }, function (err, dealCount) {
                                if (!err) {
                                    if (row.user.imDealCount > dealCount) {
                                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
                                            if (!err) {
                                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, function (err1) {
                                                    if (!err1) {
                                                        result.success = true;
                                                        result.session=chatSession;
                                                        callback(result);
                                                        var pushMsg = {
                                                            userId: data.invitedUser, eventData: {
                                                                Event: 'NewNotify',
                                                                Foryou: true,
                                                                Account: session.user.account,
                                                                Data: {
                                                                    type: 'webchat',
                                                                    operation: 'invited',
                                                                    from: session.user._id,
                                                                    to: data.invitedUser,
                                                                    _id: data._id,
                                                                    Sid: data.sid,
                                                                    sName: chatSession.sName,
                                                                    "CreateTime": utils.getCurrentDate(),
                                                                    Platform: chatSession.platform,
                                                                    FromUrl: chatSession.fromUrl,
                                                                    UrlTitle: chatSession.urlTitle,
                                                                    userStatus: chatSession.userStatus,
                                                                    sBreakTime: chatSession.sBreakTime,
                                                                    ToPeer: chatSession.toPeer,
                                                                    user: chatSession.user,
                                                                    username:session.user.displayName
                                                                }
                                                            }
                                                        };

                                                        multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                                        });
                                                        var pushMsg2 = {
                                                            userId: chatSession.user,
                                                            eventData: {
                                                                "Event": "NewWebchat",
                                                                "Account": session.user.account,
                                                                "Data": {
                                                                    "Account": session.user.account,
                                                                    "Sid": data.sid,
                                                                    "MsgType": "invited",
                                                                    "CreateTime": utils.getCurrentDate(),
                                                                    "AccessId": chatSession.accessId,
                                                                    "Platform": chatSession.platform,
                                                                    "_id": data._id,
                                                                    "sName":  chatSession.sName,
                                                                    "ToPeer": chatSession.toPeer,
                                                                    username:session.user.displayName,
                                                                    invitedUserName:data.invitedUserName,
                                                                    userStatus: chatSession.userStatus,
                                                                    sBreakTime:chatSession.sBreakTime
                                                                },
                                                                "Foryou": true
                                                            }
                                                        };
                                                        multiChannelHandler.pushToAgent(pushMsg2, function (err) {
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
                                        result.success = false;
                                        result.message = "该座席的处理会话数已到上限值，请稍后再试";
                                        callback(result);
                                    }
                                }
                            });
                        }
                    }
                });

            } else {
                result.success = false;
                result.message = "该座席不在线";
                callback(result);
            }
        });


        //2 push请求,设置邀请状态
        //3 push的结果，前端进行等待

    },
    /**
     * 同意建立多方会话
     * @param data
     * @param session
     * @param callback
     */
    acceptGroupSession:function(data,session,callback){
        var account = session.user.account;
        //1 判断是否已经被领取，已经被关闭等
        var find = {_id: data._id, account: account};
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
            if (!err) {
                if(chatSession &&  chatSession.status == "deal"){
                    if(chatSession.invitedUser==session.user._id  ){
                        if(chatSession.inviteUserStatus=="undeal"){
                            //2 修改session结构，加入invitedUser
                            //3 给座席端push请求，给客户端push请求，
                            var setDoc = {
                                $set: {
                                    inviteUserStatus:"accept"//undeal 未处理  accept 已经接受
                                },
                                $addToSet: {history: {user: session.user._id, time: utils.getCurrentDate(), type: 'invite',invitedUser:chatSession.invitedUser,deal:"accept"}},
                            };
                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, function (err1) {
                                if (!err1) {
                                    result.success = true;
                                    if(!chatSession.lastAgentMsgTimeStamp || chatSession.lastCustomerMsgTimeStamp > chatSession.lastAgentMsgTimeStamp){
                                        chatSession.startWaitTimer = 0;
                                    }else{
                                        chatSession.startWaitTimer = -1;
                                    }
                                    result.session = chatSession;
                                    callback(result);
                                    var pushMsg = {
                                        userId:  chatSession.user,
                                        eventData: {
                                            Event: 'NewNotify', Account: session.user.account,
                                            Data: {
                                                type: 'webchat',
                                                operation: 'invite_handle',
                                                accept:true,
                                                from: session.user._id,
                                                to: chatSession.user,
                                                AccessId: chatSession.accessId,
                                                _id: chatSession._id,
                                                Sid: chatSession.sid,
                                                sName: chatSession.sName,
                                                CreateTime: utils.getCurrentDate(),
                                                Platform: chatSession.platform,
                                                FromUrl:chatSession.fromUrl,
                                                UrlTitle: chatSession.urlTitle,
                                                userStatus:chatSession.userStatus,
                                                sBreakTime:chatSession.sBreakTime,
                                                ToPeer:chatSession.toPeer,
                                                lastAgentMsgTimeStamp:chatSession.lastAgentMsgTimeStamp,
                                                lastCustomerMsgTimeStamp:chatSession.lastCustomerMsgTimeStamp,
                                                startCustomerWaitTimeStamp:chatSession.startCustomerWaitTimeStamp,
                                                lastClaimTime:chatSession.lastClaimTime,
                                                createTimeStamp:chatSession.createTimeStamp
                                            }
                                        }
                                    };

                                    multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                    });


                                    var pushMsg2 = {
                                        userId: chatSession.user,
                                        eventData: {
                                            "Event": "NewWebchat",
                                            "Account": session.user.account,
                                            "Data": {
                                                "Account": session.user.account,
                                                "Sid": chatSession.sid,
                                                "MsgType": "invite_accept",
                                                "CreateTime": utils.getCurrentDate(),
                                                "AccessId": chatSession.accessId,
                                                "Platform": chatSession.platform,
                                                "_id": chatSession._id,
                                                "sName":  chatSession.sName,
                                                "ToPeer": chatSession.toPeer,
                                                invitedUserName:chatSession.invitedUserName,
                                                userStatus: chatSession.userStatus,
                                                sBreakTime:chatSession.sBreakTime
                                            },
                                            "Foryou": true
                                        }
                                    };
                                    multiChannelHandler.pushToAgent(pushMsg2, function (err) {
                                    });
                                    //处理会话数累加1
                                    handler.updateAgentDealedCount(session.user._id, 1);

                                    //当前会话数加1
                                    handler.updateAgentCurrImDealCount(session.user._id, 1);
                                } else {
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }else{
                            result.success = false;
                            result.message = "您已经接受了该邀请";
                            callback(result);
                        }
                    }else{
                        result.success = false;
                        result.message = "该邀请已过期";
                        callback(result);
                    }
                }else{
                    result.success = false;
                    result.message = "没有找到该会话或该会话已经不在处理中";
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 拒绝建立多方会话
     * @param data
     * @param session
     * @param callback
     */
    refusedGroupSession:function(data,session,callback){
        var account = session.user.account;
        //1 判断是否已经被领取，已经被关闭等
        var find = {_id: data._id,account: account};
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
            if (!err) {
                if(chatSession &&  chatSession.status == "deal"){
                    if(chatSession.invitedUser==session.user._id  ){
                        if(chatSession.inviteUserStatus=="undeal"){
                            //2 修改session结构，加入invitedUser
                            //3 给座席端push请求，给客户端push请求
                            var setDoc = {
                                $unset:{inviteUserStatus:1,invitedUser:1,invitedUserName:1},
                                $addToSet: {history: {user: session.user._id, time: utils.getCurrentDate(), type: 'invite',invitedUser:chatSession.invitedUser,deal:"refused"}},
                            };
                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, function (err1) {
                                if (!err1) {
                                    result.success = true;
                                    result.session=chatSession;
                                    callback(result);
                                    var pushMsg = {
                                        userId:  chatSession.user, eventData: {
                                            Event: 'NewNotify',
                                            Foryou: true,
                                            Account: session.user.account,
                                            Data: {
                                                type: 'webchat',
                                                operation: 'invite_handle',
                                                accept:false,
                                                from: session.user._id,
                                                to: chatSession.user,
                                                _id: data._id,
                                                Sid: data.sid,
                                                sName: chatSession.sName,
                                                invitedUserName:chatSession.invitedUserName,
                                                CreateTime: utils.getCurrentDate(),
                                                Platform: chatSession.platform,
                                                FromUrl: chatSession.fromUrl,
                                                UrlTitle: chatSession.urlTitle,
                                                userStatus: chatSession.userStatus,
                                                sBreakTime: chatSession.sBreakTime,
                                                ToPeer: chatSession.toPeer,
                                                user: data.toUser,
                                                username:chatSession.username
                                            }
                                        }
                                    };
                                    multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                    });


                                    var pushMsg2 = {
                                        userId: chatSession.user,
                                        eventData: {
                                            "Event": "NewWebchat",
                                            "Account": session.user.account,
                                            "Data": {
                                                "Account": session.user.account,
                                                "Sid": chatSession.sid,
                                                "MsgType": "invite_refuesd",
                                                "CreateTime": utils.getCurrentDate(),
                                                "AccessId": chatSession.accessId,
                                                "Platform": chatSession.platform,
                                                "_id": chatSession._id,
                                                "sName":  chatSession.sName,
                                                "ToPeer": chatSession.toPeer,
                                                invitedUserName:chatSession.invitedUserName,
                                                userStatus: chatSession.userStatus,
                                                sBreakTime:chatSession.sBreakTime
                                            },
                                            "Foryou": true
                                        }
                                    };
                                    multiChannelHandler.pushToAgent(pushMsg2, function (err) {
                                    });
                                } else {
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }else{
                            result.success = false;
                            result.message = "您已经接受了该邀请";
                            callback(result);
                        }
                    }else{
                        result.success = false;
                        result.message = "该邀请已过期";
                        callback(result);
                    }
                }else{
                    result.success = false;
                    result.message = "没有找到该会话或该会话已经不在处理中";
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 取消建立多方会话
     * @param data
     * @param session
     * @param callback
     */
    cancelGroupSession:function(data,session,callback){
        var account = session.user.account;
        //1 判断是否已经被领取，已经被关闭等
        var find = {_id: data._id, account: account};
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
            if (!err) {
                if(chatSession &&  chatSession.status == "deal"){
                    if(chatSession.inviteUserStatus=="undeal"){
                        //2 修改session结构，加入invitedUser
                        //3 给座席端push请求，给客户端push请求
                        var setDoc = {
                            $unset:{inviteUserStatus:1,invitedUser:1,invitedUserName:1},
                        };
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, function (err1) {
                            if (!err1) {
                                result.success = true;
                                result.session=chatSession;
                                callback(result);
                                var pushMsg = {
                                    userId: chatSession.invitedUser, eventData: {
                                        Event: 'NewNotify',
                                        Foryou: true,
                                        Account: session.user.account,
                                        Data: {
                                            type: 'webchat',
                                            operation: 'invited_cancel',
                                            from: session.user._id,
                                            to: chatSession.invitedUser,
                                            _id: chatSession._id,
                                            Sid: chatSession.sid,
                                            sName: chatSession.sName,
                                            CreateTime: utils.getCurrentDate(),
                                            Platform: chatSession.platform,
                                            FromUrl: chatSession.fromUrl,
                                            UrlTitle: chatSession.urlTitle,
                                            userStatus: chatSession.userStatus,
                                            sBreakTime: chatSession.sBreakTime,
                                            ToPeer: chatSession.toPeer,
                                            user: chatSession.user,
                                            username:chatSession.username,
                                            sBreakTime:chatSession.sBreakTime
                                        }
                                    }
                                };
                                multiChannelHandler.pushToAgent(pushMsg, function (err) {
                                });

                                var pushMsg2 = {
                                    userId: chatSession.user,
                                    eventData: {
                                        "Event": "NewWebchat",
                                        "Account": session.user.account,
                                        "Data": {
                                            "Account": session.user.account,
                                            "Sid": chatSession.sid,
                                            "MsgType": "invite_cancel",
                                            "CreateTime": utils.getCurrentDate(),
                                            "AccessId": chatSession.accessId,
                                            "Platform": chatSession.platform,
                                            "_id": chatSession._id,
                                            "sName":  chatSession.sName,
                                            "ToPeer": chatSession.toPeer,
                                            invitedUserName:chatSession.invitedUserName,
                                            userStatus: chatSession.userStatus
                                        },
                                        "Foryou": true
                                    }
                                };
                                multiChannelHandler.pushToAgent(pushMsg2, function (err) {
                                });

                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.success = false;
                        result.session=chatSession;
                        result.message = "对方已经接受了该邀请";
                        callback(result);
                    }
                }else{
                    result.success = false;
                    result.session=chatSession;
                    result.message = "没有找到该会话或该会话已经不在处理中";
                    callback(result);
                }
            } else {
                result.session=chatSession;
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 踢出多方会话
     * @param data
     * @param session
     * @param callback
     */
    kickGroupSession:function(data,session,callback){
        var account = session.user.account;
        var find = {_id: data._id, account: account};
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(find, function (err, chatSession) {
            if (!err) {
                if(chatSession &&  chatSession.status == "deal"){
                    var setDoc = {
                        $unset:{inviteUserStatus:1,invitedUser:1,invitedUserName:1},
                        $addToSet: {history: {user: session.user._id, time: utils.getCurrentDate(), type: 'invite',invitedUser:chatSession.invitedUser,deal:"kick"}},
                    };
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update(find, setDoc, function (err1) {
                        if (!err1) {
                            result.success = true;
                            result.session=chatSession;
                            callback(result);
                            var pushMsg = {
                                userId:  chatSession.invitedUser, eventData: {
                                    Event: 'NewNotify',
                                    Foryou: true,
                                    Account: session.user.account,
                                    Data: {
                                        type: 'webchat',
                                        operation: 'invite_kick',
                                        accept:true,
                                        from: session.user._id,
                                        to: chatSession.invitedUser,
                                        _id: data._id,
                                        Sid: data.sid,
                                        sName: chatSession.sName,
                                        invitedUserName:chatSession.invitedUserName,
                                        CreateTime: utils.getCurrentDate(),
                                        Platform: chatSession.platform,
                                        FromUrl: chatSession.fromUrl,
                                        UrlTitle: chatSession.urlTitle,
                                        userStatus: chatSession.userStatus,
                                        sBreakTime: chatSession.sBreakTime,
                                        ToPeer: chatSession.toPeer,
                                        user: chatSession.invitedUser,
                                        username:chatSession.username
                                    }
                                }
                            };
                            multiChannelHandler.pushToAgent(pushMsg, function (err) {
                            });

                            var pushMsg2 = {
                                userId: chatSession.user,
                                eventData: {
                                    "Event": "NewWebchat",
                                    "Account": session.user.account,
                                    "Data": {
                                        "Account": session.user.account,
                                        "Sid": chatSession.sid,
                                        "MsgType": "invite_kick",
                                        "CreateTime": utils.getCurrentDate(),
                                        "AccessId": chatSession.accessId,
                                        "Platform": chatSession.platform,
                                        "_id": chatSession._id,
                                        "sName":  chatSession.sName,
                                        "ToPeer": chatSession.toPeer,
                                        invitedUserName:chatSession.invitedUserName,
                                        userStatus: chatSession.userStatus,
                                        sBreakTime:chatSession.sBreakTime
                                    },
                                    "Foryou": true
                                }
                            };
                            multiChannelHandler.pushToAgent(pushMsg2, function (err) {
                            });

                            //更新当前处理会话数
                            if(chatSession.invitedUser && chatSession.inviteUserStatus=="accept"){
                                handler.updateAgentCurrImDealCount(chatSession.invitedUser, -1);
                            }

                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    result.success = false;
                    result.message = "没有找到该会话或该会话已经不在处理中";
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 初始登陆的时候，检查是否有未接受的邀请
     * @param data
     * @param session
     * @param callback
     */
    getUndealInvitation:function(data,session,callback){
        var account = session.user.account;
        var find = {invitedUser:session.user._id,inviteUserStatus : "undeal",status : "deal", account: account};
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(find).toArray(function (err, chatSessions) {
            if (!err) {
                var dataList = [];
                var makeResult = function(list){
                    if(list.length == 0){
                        result.success = true;
                        result.data = dataList;
                        callback(result);
                    }else{
                        var chatSession = list.pop();
                        //查找邀请人的userName
                        Session.get(chatSession.user, function (err, session) {
                            if (!err) {
                                var user = session.user;
                                var itemSession = {
                                    to: chatSession.invitedUser,
                                    _id: chatSession._id,
                                    Sid: chatSession.sid,
                                    sName: chatSession.sName,
                                    CreateTime: utils.getCurrentDate(),
                                    Platform: chatSession.platform,
                                    FromUrl: chatSession.fromUrl,
                                    UrlTitle: chatSession.urlTitle,
                                    userStatus: chatSession.userStatus,
                                    sBreakTime: chatSession.sBreakTime,
                                    ToPeer: chatSession.toPeer,
                                    user: chatSession.user
                                }
                                if(user){
                                    itemSession.username=user.displayName;
                                }
                                dataList.push(itemSession);
                                makeResult(list);
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }
                }
                makeResult(chatSessions);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 客服正在输入的通知
     */
    typeNotice:function(data,session,callback){
        var notifyData = {sid: data.sid ,operation: 'typeNotice', userId:'system'};
        multiChannelHandler.notifyDispatherServer(notifyData, {}, function(result){
            callback(result);
        });
    },
    getServerTimeDiff:function(data,session,callback){
        var result = {success:false};
        result.serverTime = utils.getCurrentDateTime();
        var localTimestamp = data;
        var diff =0;
        if(localTimestamp){
            diff = new Date().getTime()-localTimestamp;
            result.data=diff;
            result.success = true;
            callback(result);
        }else{
            result.message = "没有传Timestamp参数";
            callback(result);
        }
    },
    /**
     * weixin消息提醒
     */
    weixinRemindMsg:function (data,callback) {
        var funcName = '[WebchatHandler - weixinRemindMsg]';
        callback({ success: true });
        var val = data._id;
        var account = val.split(',')[0];
        var sessionId = val.split(',')[1];
            var query = {account: account};//账号id
            mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne(query, function (err, row) {
                if (!err && row && row.weixinWarnLen > 0) {
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({
                        _id: sessionId,
                        status: {$nin: ['finish', 'changePeer']},
                        leavemsg: {$ne: true}
                    }, function (err, wsRes) {
                        console.log("查询到的会话表信息:------ "+JSON.stringify(wsRes));
                        if(!wsRes||err){
                            logger.app.error(funcName, err);
                        } else if(wsRes.platform=="weixin") {
                            var replyMsg = {
                                sid: wsRes.sid,
                                contentType: "text",
                                user: "system",
                                content: encodeURIComponent(encodeURIComponent(row.weixinWarnMsg)),
                                platform: wsRes.platform,
                                accessId: wsRes.accessId,
                                account: account,
                                sessionId: sessionId,
                                msgType: "newIm",
                                _id: utils.UUID.generateUuid(),
                                showHtml: false
                            };
                            httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(replyMsg), function (err, rep) {
                                if (err) {
                                    logger.app.warn('replyMsg to gateway failed!', err);
                                } else {
                                    var res = JSON.parse(rep);
                                    if (!res.success) {
                                        logger.app.warn('replyMsg to gateway failed!', rep);
                                    }
                                }
                            });
                            var dataMsg={};
                            dataMsg._id = wsRes._id;
                            dataMsg.sName = wsRes.sName;
                            dataMsg.sessionId = sessionId;
                            dataMsg.sid = wsRes.sid;
                            var msg = {eventData: {Event:'NewWebchat', Account:account, Data:dataMsg}};
                            msg.userId = wsRes.user;
                            msg.eventData.Data.ToPeer = wsRes.toPeer;
                            msg.eventData.Foryou = true;
                            var msgAnswer = utils.deepClone(msg);
                            msgAnswer.eventData.Data.Content =  encodeURIComponent(row.weixinWarnMsg);
                            msgAnswer.eventData.Data.MsgType = "newSystem";
                            msgAnswer.eventData.Data.ContentType = "text";
                            msgAnswer.eventData.Data.type = "out";
                            msgAnswer.eventData.Data.ShowHtml = true;
                            msgAnswer.eventData.Data.user = "system";
                            multiChannelHandler.pushToAgent(msgAnswer,function(){});
                            //被邀请人
                            if(wsRes.invitedUser && wsRes.inviteUserStatus=="accept"){
                                var msgAnswerCopy = utils.deepClone(msgAnswer);
                                msgAnswerCopy.userId =wsRes.invitedUser;
                                multiChannelHandler.pushToAgent(msgAnswerCopy,function(){});
                            }
                        }
                    })
                }else{
                    logger.app.error(funcName, err);
                }
            });

    },


    /**
     * 获取待处理页面自定义展示项设置
     */
    getWebchatTodoShowConfig : function(data,session,callback){
        var result = {success:false};
        mongo.db().collection(fields.DB_APP_KEFU_IM_TODO_SHOW_CONFIG).findOne({"_id":session.user._id}, function (err, config) {
            if (!err) {
                result.success = true;
                result.data = config;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 保存待处理页面自定义展示项设置
     */
    saveWebchatTodoShowConfig : function(data,session,callback){
        var result = {success:false};
        var find = {_id:session.user._id,account:session.user.account};
        var setDoc = {
            $set: {
                status:data.status,
                source:data.source,
                skillGroup:data.skillGroup,
                updateTime:utils.getCurrentDateTime()
            }
        };
        mongo.db().collection(fields.DB_APP_KEFU_IM_TODO_SHOW_CONFIG).update(find,setDoc, {w: 1, upsert: true}, function (err)  {
            if (!err) {
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 查询联系历史
     */
    queryWebchatSessionHistory:function(data,session,callback){
        var result = {success:false};
        var cust_id = data.cust_id;
        var sid = data.sid;
        if(sid){
            //根据联系历史查询
            var find ={
                type:"chat",
                sid:sid
            };
            if(cust_id){
                find.customer=cust_id;
            }
            mongo.db(session).collection(session.user.account + "_history").find(find,{sort:{createTime : -1}}).toArray(function(err , docs){
                if(!err){
                    //封装数据
                    var resultList = [];
                    docs.forEach(function(history){
                        var obj = {
                            urlTitle:history.urlTitle,
                            platform:history.platform,
                            time:history.createTime
                        };
                        var regUrl = /^http:/;
                        if(history.fromUrl && history.fromUrl.match(regUrl)){
                            obj.fromUrl = history.fromUrl
                        }

                        resultList.push(obj);
                    })
                    result.success = true;
                    result.data = resultList;
                    callback(result);

                }else{
                    logger.app.error(err);
                    callback(result);
                }
            });
        }else{
            result.message = "请求参数异常"
            callback(result);
        }
    },
    /**
     * 自动关闭会话
     * @param data
     * @param data._id 'account,sessionId'
     * @param callback
     */
    autoCloseWebchatSession: function (data, callback) {
        var funcName = '[WebchatHandler - autoCloseWebchatSession]';
        callback({ success: true });
        var val = data._id;
        var account = val.split(',')[0];
        var sessionId = val.split(',')[1];
        var finishObj;

        Thenjs(function (cont) {
            // 查询全局设置
            mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne({ account: account }, cont);
        }).then(function (cont, globalSet) {
            if (!globalSet || !globalSet.autoCloseSessionType) {
                return cont('not set auto close type');
            }

            finishObj = {
                finishKey: globalSet.autoCloseSessionType,
                finishReason: globalSet.autoCloseSessionName
            };

            return cont(null);
        }).then(function (cont) {
            // 查询会话
            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({
                _id: sessionId,
                status: { $nin: ['finish', 'changePeer'] }
            }, function (err, chatSession) {
                return cont(err, chatSession)
            });
        }).then(function (cont, chatSession) {
            if (!chatSession) {
                return cont('no webchat session found');
            }

            // 关闭会话
            var data2 = {
                _id: sessionId,
                sid: chatSession.sid,
                finishReason: finishObj.finishReason,
                finishKey: finishObj.finishKey
            };
            var session = {
                user: { _id: chatSession.user, account: account },
                account: { account: account }
            };
            handler.finishWebchatSession(data2, session, function (rep) {
                if (!rep.success) {
                    return cont(new Error('error finish webchat session'));
                }

                cont(null, chatSession);
            });
        }).then(function (cont, chatSession) {
            // 通知坐席会话被自动关闭
            var pushMsg = {
                userId:  chatSession.user,
                eventData: {
                    Event: 'NewNotify',
                    Foryou: true,
                    Account: account,
                    Data: {
                        type: 'webchat',
                        operation: 'autoClose',
                        from: 'system',
                        to: chatSession.user,
                        _id: chatSession._id,
                        Sid: chatSession.sid,
                        sName: chatSession.sName,
                        invitedUserName: chatSession.invitedUserName,
                        CreatpushQueueNumToWebChatClientseTime: chatSession.createTime,
                        Platform: chatSession.platform,
                        FromUrl: chatSession.fromUrl,
                        UrlTitle: chatSession.urlTitle,
                        userStatus: chatSession.userStatus,
                        sBreakTime: chatSession.sBreakTime,
                        ToPeer: chatSession.toPeer,
                        user: chatSession.user,
                        username:chatSession.username
                    }
                }
            };
            multiChannelHandler.pushToAgent(pushMsg, function (err) {});

            cont(null);
        }).fail(function (cont, err) {
            logger.app.error(funcName, err);

            // 未找到session、未找到自动关闭设置等问题不按错误处理
            // 发生错误重新添加提醒事件
            if (nodeUtil.isError(err)) {
                notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_SET_AUTO_CLOSE, {
                    account: account,
                    sessionId: sessionId,
                    currTimeStamp: utils.getCurrentDateTime()
                });
            }
        });
    }
};

module.exports = handler;

