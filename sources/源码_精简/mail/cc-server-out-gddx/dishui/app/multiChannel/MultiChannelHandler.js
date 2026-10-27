/**
 * Created by chenguang on 9/1/15.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var nodeUtil = require('util');
var uuid = require('appUtil/UUID');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var reportEvent = require("appEvent/ReportEvent");
var kmCatalogHandler = require(__baseDir + '/dishui/app/km/KmCatalogHandler');
var robotHandler = require(__baseDir + '/dishui/app/multiChannel/RobotHandler');


exports.receiveWebchat = function (data, callback) {
    //{"Account":"N00000000143","Sid":"aba1c560-55dc-11e5-ad3f-57ad9ce5da7e",
    // "MessageId":"284f3c70-56bc-11e5-ab87-4712315ff4a3",
    // "CreateTime":"2015-09-09 14:29:43","MsgType":"newMsg"
    // ,"AccessId":"79fa56a0-40d1-11e5-8bcb-f3d7d2578a5f","Content":"222","Platform":"sdk"}}
    var result = {success:false};

    /**
     * 1 会话session的处理,获取会话的一系列属性,包括其状态,所属技能组
     * 2 根据上述获取的一些属性进行机器人,满意度评价,常见问题的处理等
     * 3 将消息传达给座席端
     */
    _checkWebchatSession(data, function(wsRes){
        if(!wsRes.success){
            callback(wsRes);
            return;
        }else{
            data._id = wsRes.session_id;
            data.sName = wsRes.session_sName;
            data.sessionId = wsRes.session_id;
            var msg = {eventData: {Event:'NewWebchat', Account:data.Account, Data:data}};

            //业务处理链,机器人,满意度评价,常见问题处理等

            //已转人工的直接返回
            if(data.MsgType == "convertManual" && wsRes.haveConverted){
                callback(wsRes);
                return;
            }
            //推送是否已评价的消息到用户端
            if(data.MsgType == 'newConn'){
                var isInvestigate = true;
                var query = {
                    account   :data.Account,
                    sessionId : wsRes.session_id
                }
                mongo.db().collection('app_kefu_im_csr').findOne(query,function(e,res){ //判断是否已经评价过了
                    if(!e && res){
                        isInvestigate = false;
                    }
                    pushImCsrConfig(data,isInvestigate);
                });
            }

            //处理用户发来的评价
            if(data.MsgType == "saveImCSRInfo" ){
                processImInvestigate(data, wsRes);
            }else{
                //更新这条消息的所属会话
                mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).update({_id:data.MessageId},{$set:{sessionId: wsRes.session_id}},function(err){});
            }

            //获取常见问题的答案返回
            if(data.MsgType == 'sendImQAMsg'){
                processQAMsgType(data, wsRes, msg);
                callback({success: true});
                return;
            }

            //机器人服务,获取机器人的答案
            if(wsRes.robotCid && data.MsgType != "convertManual"){
                processRobotMsgType(data, wsRes);
                callback({success: true});
                return;
            }

            //送达给座席处理
            pushMsgToAgent(data, wsRes, msg, result, callback);
        }
    })
};


/**
 * 将消息推送给座席处理
 */
function pushMsgToAgent(data, wsRes, msg, result, callback){
    if(wsRes.session){
        //如果是sdk,newConn的形式过来,但是会话已经是deal的状态,不用推给座席端.
        if(data.MsgType == 'newConn' && wsRes.session.status == 'deal' && wsRes.session.platform && wsRes.session.platform == 'sdk'){
            result.success = true;
            callback(result);
            return;
        }
        msg.userId = wsRes.session.user;
        msg.eventData.Data.ToPeer = wsRes.session.toPeer;
        msg.eventData.Foryou = true;
        exports.pushToAgent(msg, function(pushRes){
            if(pushRes.success || (msg.userId && wsRes.session_status == "deal")){
                result.success = true;
                callback(result);
                return;
            }else{
                delete msg.eventData.Foryou;
                exports.publishByQueue(msg, function(pRes){
                    if(pRes.success){
                        result.success = true;
                        if(data.MsgType == 'convertManual' && wsRes.session_status == "robot"){
                            data.ToPeer = wsRes.session.toPeer;
                            //mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: wsRes.session_id}, {$set:{status:"undeal", serviceMan:"manual", robotCid: ""}, $inc:{msgCount:1,leakNum:1}},{w:1},function(err){});
                            var reportData = {
                                reportTime: utils.getCurrentDate(),
                                msgData: data,
                                type: reportEvent.EventType.IM_CONVERT_MANUAL
                            };
                            reportEvent.emitImReportEvent(reportData);

                            if(data.Platform == "sdk" || data.Platform == "weixin"){
                                replyMsgToApp(data, wsRes);
                            }
                            if(msg.eventData.Data.ToPeer){
                                pushQueueNumToClient({Sid: data.Sid, ToPeer: msg.eventData.Data.ToPeer, Account: data.Account});
                            }

                        }

                    }
                    callback(pRes);
                })
            }
        })
    }else{
        delete msg.eventData.Foryou;
        msg.eventData.Data.ToPeer = wsRes.toPeer;
        msg.session = "null";
        msg.session_status = wsRes.session_status;
        msg.newSession = wsRes.newSession;
        exports.publishByQueue(msg, function(pRes){
            if(pRes.success){
                result.success = true;
                if(data.MsgType == 'convertManual' && wsRes.session_status == "robot"){
                    var reportData = {
                        reportTime: utils.getCurrentDate(),
                        msgData: data,
                        type: reportEvent.EventType.IM_CONVERT_MANUAL
                    };
                    reportEvent.emitImReportEvent(reportData);
                    if(data.Platform == "sdk"){
                        replyMsgToApp(data, wsRes);
                    }
                    if(msg.eventData.Data.ToPeer){
                        pushQueueNumToClient({Sid: data.Sid, ToPeer: msg.eventData.Data.ToPeer, Account: data.Account});
                    }

                }
                if(isNewManualSession(msg)){
                    var notifyData = {sid: data.Sid ,operation: 'online', userId:'system'};
                    exports.notifyDispatherServer(notifyData, {}, function(err){});
                    if(data.ToPeer){
                        pushQueueNumToClient(data);
                    }
                }

            }else{
                if(isNewManualSession(msg)){
                    var notifyData = {sid: data.Sid ,operation: 'offline', userId:'system'};
                    exports.notifyDispatherServer(notifyData, {}, function(err){});
                }
            }
            callback(pRes);
        })
    }
}

/**
 * 会话处理,主要是对会话表的操作,并获取该会话的一些属性返回
 * @param data
 * @param callback
 * @private
 */
function _checkWebchatSession(data, callback){
    var result = {success:false};
    if(data.MsgType != "leaveMessage"){
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({sid: data.Sid, status:{$nin: ['finish', 'changePeer']}, leavemsg:{$ne: true}}, function(err, session){
            if(err){
                result.message = 'multi channel check session failed!';
                callback(result);
                return;
            }
            if(data.MsgType == "convertManual" && session && session.status != "robot"){
                result.success = true;
                result.message="have converted";
                result.haveConverted = true;
                callback(result);
                return;
            }

            if(session){
                //转技能组处理
                var isNull = changeSessionPeer(data, session);
                if(isNull){
                    session = null;
                }
            }
            if(session){
                var sBreakSet = {};
                //此处session的状态可能为:deal undeal robot
                if(data.MsgType == "newConn" && session.status != "undeal"){
                    //当前状态是机器人服务
                    if(session.robotCid && session.status == "robot"){
                        var robotMsg = { sid: data.Sid, operation: "robot", platform: data.Platform, user: "robot", initSuccess : true};
                        robotHandler.sendRobotInitMsg(robotMsg, function(err){
                            if(err){
                                logger.app.info("send robot sysmsg success");
                            }else{
                                logger.app.warn("send robot sysmsg fail");
                            }
                        });
                    }else if(session.user){
                        //人工服务,推送座席服务提示过去
                        var notifyData = {sid: data.Sid ,operation: 'claim', userId: session.user};
                        exports.notifyDispatherServer(notifyData, {}, function(err){});
                    }

                }

                //用户在线离线状态的更新
                if(data.MsgType == 'newConn'){
                    if(session.sBreakTime){
                        sBreakSet["$unset"] = {sBreakTime:1};
                    }
                    sBreakSet['$set'] = {userStatus: "online"};
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({sid: data.Sid, status:{$ne:'finish'},leavemsg:{$ne: true}}, sBreakSet, function(err){
                        console.log("update not finish session:"+JSON.stringify(sBreakSet));
                    });
                }

                //断开连接处理,机器人的直接将状态改为关闭,并推送到报表
                if(data.MsgType == 'disConn'){
                    var disconnSet = {sBreakTime:utils.getCurrentDateTime(), userStatus: "offline"};
                    if(session.status == "robot"){
                        disconnSet.status = "finish";
                        var reportData = {
                            type: reportEvent.EventType.IM_CLOSE_SESSION,
                            reportTime: utils.getCurrentDate(),
                            conversationTimeLength: 0,
                            account: data.Account,
                            platform: data.Platform,
                            accessId: data.AccessId,
                            toPeer: session.toPeer,
                            sessionId:session._id
                        };
                        reportEvent.emitImReportEvent(reportData);
                    }
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({sid: data.Sid, status:{$nin:['finish', 'changePeer']}, leavemsg:{$ne: true}}, {$set:disconnSet},function(err){console.log("update not finish session set  sBreakTime")});
                }

                //新消息过来统计该会话的人工消息条数以及更新最后一条消息的时间
                if(data.MsgType == 'newMsg' && session.status != "robot"){
                    var time = utils.getCurrentDateTime();
                    var setDoc = {lastTimeStamp: time};
                    var incDoc = {leakNum:1};
                    if(data.NotShow != "true"){
                        incDoc.msgCount = 1;
                        incDoc.totalMsgCount = 1;
                    }
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: session._id}, {$inc:incDoc, $set: setDoc},function(err){console.log("update session inc msgCount:"+JSON.stringify(setDoc))});
                }

                //消息报表推送,其中不显示在用户端的不计数
                if(data.MsgType == 'newMsg' && (data.NotShow!="true" && data.NotShow != true)){
                    var reportData = {
                        reportTime: utils.getCurrentDate(),
                        status: session.status,
                        msgData: data,
                        type: reportEvent.EventType.IM_NEW_MSG_IN
                    }
                    reportEvent.emitImReportEvent(reportData);
                }

                //result赋值,在session可能置空前赋值
                result.robotCid = session.robotCid;
                result.robotSysNum = session.robotSysNum;
                result.session_id = session._id;
                result.session_sName = session.sName;
                result.session_status = session.status;
                result.toPeer = session.toPeer;

                //座席端断开处理,如果座席端断开了至少一分钟,则将该会话转为待领取状态
                if(session.agentBreakTime){
                    if(utils.getCurrentDateTime() - session.agentBreakTime > 60 * 1000){
                        var agentBreakUpdate = {$set:{status:'undeal'},$unset:{user:1,agentBreakTime:1},
                            $addToSet: {history: {user: session.user, time: utils.getCurrentDate(), type: 'break'}}};

                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
                            .update({_id: session._id,status:'deal', leavemsg:{$ne: true}}, agentBreakUpdate,function(err){
                                console.log("update session agentBreakUpdate:"+JSON.stringify(agentBreakUpdate))
                            });
                        session = null;
                    }
                }
                if(session && !session.user){
                    session = null;
                }
                result.success = true;
                result.session = session;
                logger.app.info("have session :"+JSON.stringify(result));
                callback(result);
            }else{
                createNewSession(data, result, callback);
            }

        });
    }else{
        //留言处理
        processLeaveMsg(data, result, callback);
    }
}

/**
 * 推送消息到app端
 */
function replyMsgToApp(data, wsRes){
    var replyMsg = {
        sid: data.Sid,
        contentType: "text",
        user: "system",
        content: "已通知系统为您转接到人工服务",
        platform: data.Platform,
        accessId: data.AccessId,
        account: data.Account,
        sessionId: wsRes.session_id,
        msgType: "newIm",
        _id:utils.UUID.generateUuid()
    };
    exports.replySystemMsg(replyMsg, function(response){
        if(response){
            logger.app.info("send msg success");
        }else{
            logger.app.warn("send msg error");
        }
    });
}

exports.replySystemMsg =function (data, callback) {
    httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(data), function (err, rep) {
        if (err) {
            logger.app.warn('replyMsg to gateway failed!', err);
            callback(false);
        } else {
            var res = JSON.parse(rep);
            if (res.success) {
                callback(true);
            } else {
                logger.app.warn('replyMsg to gateway failed!', err);
                callback(false);
            }
        }
    });
};

function processRobotMsgType(data, wsRes){
    if(data.MsgType == 'newMsg' && data.NotShow !== "true"){
        var robotReq = {
            platform:data.Platform,
            uid:data.Account,
            cid:wsRes.robotCid,
            question:data.Content,
            sysNum:wsRes.robotSysNum,
            sid: data.Sid,
            accessId: data.AccessId,
            sessionId: wsRes.session_id,
            user: "robot",
            contentType: data.ContentType
        };
        robotHandler.getRobotAnswer(robotReq, function(err, robotRes){
            if(err){
                logger.app.warn(err);
            }else{
                logger.app.info("get robot reply success");
            }
        });
    }
}

function processQAMsgType(data, wsRes, msg){
    //推送问题
    if(wsRes.session){
        msg.userId = wsRes.session.user;
        msg.eventData.Data.ToPeer = wsRes.session.toPeer;
        msg.eventData.Foryou = true;

        exports.pushToAgent(msg, function(pushRes){
            if(!pushRes.success){
                delete msg.eventData.Foryou;
                exports.publishByQueue(msg, function(res){});
            }
        });
    }else{
        exports.publishByQueue(msg, function(res){});
    }

    var replyData = {
        account: data.Account,
        accessId: data.AccessId,
        sid: data.Sid,
        sessionId:wsRes.session_id,
        platform: data.Platform,
        showHtml: true
    };
    kmCatalogHandler.getKmDetailInf({ _id: data.QAMsgId},function(res){
        if(res.success){
            var content = res.row.content.replace(/&nbsp;/ig,'').trim();
            if(!content.length){
                res.row.content = content;
            }
            replyData.content = encodeURIComponent(res.row.content || "暂时没有内容");
            for(var key in replyData){
                replyData[key] = encodeURIComponent(replyData[key]);
            }
            exports.replyInvestigateSuccessMsg(replyData, function(res2){
                if(res2){
                    if(wsRes.session){
                        var msgAnswer = utils.deepClone(msg);
                        //推送答案
                        msgAnswer.eventData.Data.Content =  encodeURIComponent(res.row.content || "暂时没有内容");
                        msgAnswer.eventData.Data.type = "out";
                        msgAnswer.eventData.Data.ShowHtml = true;
                        msgAnswer.eventData.Data.user = "system";
                        exports.pushToAgent(msgAnswer,function(){});
                    }
                    logger.app.info("send msg success");
                }else{
                    logger.app.warn("send msg error");
                }
            });
        }else{
            logger.app.warn('not found Catalog ');
        }
    });
}

/**
 * 处理评价
 */
function processImInvestigate(data, wsRes){
    data.isInvestigate = true;
    var query = {
        account   :data.Account,
        sessionId : wsRes.session_id
    }
    mongo.db().collection('app_kefu_im_csr').findOne(query,function(e,res){ //判断是否已经评价过了
        if(!e && res){
            data.isInvestigate = false;
            var replyData = {
                account: data.Account,
                accessId: data.accessId,
                sid: data.Sid,
                sessionId:wsRes.session_id,
                platform: data.Platform,
                content: '您已提交过评价'};
            exports.replyInvestigateSuccessMsg(replyData, function(err){});
            logger.app.info('=============您已提交过评价============');
            return;
        }else{
            mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).update({_id:data.MessageId},{$set:{sessionId: wsRes.session_id}},function(err){});
        }
    });
}

/**
 * 获取排队人数推送到前端
 * @param data
 */
function pushQueueNumToClient(data){
    var notifyData = {sid: data.Sid ,operation: 'queueNum', userId:'system'};
    exports.getOpenNum({toPeer: data.ToPeer},{user:{account:data.Account}}, function(req){
        var queueNum = 0;
        if(req && req.success) {
            queueNum = req.openNum;
        }
        notifyData.queueNum = queueNum;
        exports.notifyDispatherServer(notifyData, {}, function(err){});
    });
}

function isNewManualSession(msg){
  return  msg.session_status != "robot" && (msg.eventData.Data.MsgType == 'newConn' ||
      (msg.eventData.Data.MsgType == 'newMsg' && msg.eventData.Data.Platform == "weixin")) && msg.session == "null";
}

exports.pushToAgentWithRandom = function(msg, wqRes){
    var randomNum = Math.floor(Math.random()* wqRes.queue.AssignMembers.length);
    if(randomNum >= wqRes.queue.AssignMembers.length){
        randomNum = wqRes.queue.AssignMembers.length -1;
    }
    console.log("wqRes.queue.AssignMembers.length:"+wqRes.queue.AssignMembers.length);
    while(wqRes.queue.AssignMembers.length>0){
        var member = wqRes.queue.AssignMembers.splice(randomNum, 1);
        var tmpMsg = utils.deepClone(msg);
        tmpMsg.userId = member[0].agentID;
        exports.pushToAgent(tmpMsg,function(){});
        randomNum = Math.floor(Math.random()* wqRes.queue.AssignMembers.length);
        if(randomNum >= wqRes.queue.AssignMembers.length){
            randomNum = wqRes.queue.AssignMembers.length -1;
        }
    }
}

exports.publishByQueue = function(msg, callback){
    var result = {success:false};
    _checkQueue(msg, function(wqRes){
        if(!wqRes.success){
            //todo to update msg status
            if(msg.eventData.Data.MsgType == 'convertManual'
                || isNewManualSession(msg)) {
                    if(isNewManualSession(msg)){
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:{status:'finish'}},function(err){console.log("update a session to finish")});
                    }
                    result.success = false;
                    callback(result);
                    return;
            }

        }else{
            if(wqRes.queue.AssignMembers.length > 0){
                if(msg.eventData.Data.MsgType == 'convertManual'
                    || isNewManualSession(msg)){
                    var agentIDs = [];
                    for(var i=0 ;i<wqRes.queue.AssignMembers.length;i++){
                        agentIDs.push(wqRes.queue.AssignMembers[i].agentID);
                    }
                    mongo.db().collection('app_push_client').find({_id: {$in: agentIDs}}).toArray(function(err, docs){
                        var accept = false;
                        if(!err && docs && docs.length>0){
                            for(var i=0; i<docs.length; i++){
                                if(!docs[i].status || docs[i].status != "close"){
                                    accept = true;
                                    break;
                                }
                            }
                            if(!accept){
                                if(msg.eventData.Data.Platform!='weixin' && msg.eventData.Data.Platform!='sdk' && msg.eventData.Data.MsgType == 'newConn'){
                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:{status:'finish', leakNum:0}},function(err){console.log("update a session to finish which has queue")});
                                }
                                result.success = false;
                                result.message = "agent not accept new session";
                                callback(result);
                                return;
                            }
                            result.success = true;
                            var updateSet = {status:"undeal", serviceMan:"manual", robotCid: "", manualTime: utils.getCurrentDateTime()};
                            var inc = {msgCount:1,leakNum:1,totalMsgCount:1};
                            //新的会话
                            console.log("get msg data:"+JSON.stringify(msg.eventData.Data));
                            if(msg.eventData.Data.MsgType != 'convertManual' && msg.newSession){
                                var reportData = {
                                    type: reportEvent.EventType.IM_NEW_SESSION,
                                    reportTime: utils.getCurrentDate(),
                                    status: 'undeal',
                                    msgData: msg.eventData.Data
                                };
                                reportEvent.emitImReportEvent(reportData);
                            }
                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:updateSet, $inc:inc},{w:1},function(err){
                                console.log("update a session to a new session:"+JSON.stringify(updateSet));
                                callback(result);
                                exports.pushToAgentWithRandom(msg, wqRes);

                            });

                        }else{
                            //web方式时座席不在线直接将会话结束掉
                            if(msg.eventData.Data.Platform!='weixin'  && msg.eventData.Data.Platform!='sdk' && msg.eventData.Data.MsgType == 'newConn'){
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:{status:'finish', leakNum:0}},function(err){console.log("update session to finish not weixin and not found agents");});
                            }
                            result.success = false;
                            result.message = "not found agent";
                            callback(result);
                        }
                    });
                }else{
                    exports.pushToAgentWithRandom(msg, wqRes);
                }

            }else{
                //todo to update msg status
                if(msg.eventData.Data.MsgType == 'convertManual' || isNewManualSession(msg)){
                    if(isNewManualSession(msg)){
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:{status:'finish'}},function(err){});
                    }
                    result.success = false;
                    result.message = "not found agent2";
                    callback(result);
                }
            }
        }
        if(msg.eventData.Data.MsgType != 'convertManual' && !isNewManualSession(msg)){
            result.success = true;
            callback(result);
        }
    });
}
exports.getImAccessId=function(data,session,callback){
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
}

exports.getOpenNum=function(data, session, callback){
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
}

exports.getTodoNum=function(data, session, callback){
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
}

exports.refreshWebchatNum = function(msg, callback){
    var result = {success: false};
    if(msg.eventData && msg.eventData.Event && msg.eventData.Event == "NewWebchat"){
        var data = {};
        var session = {user:{_id:msg.userId, account:msg.eventData.Data.Account}};

        exports.getImAccessId(data,session,function(rep){
            if(rep.peers) {
                data.toPeer = {$in: rep.peers};
                exports.getOpenNum(data,session,function(rep){
                    if(rep.success){
                        result.openNum=rep.openNum||0;
                        result.peerGroup = rep.peerGroup;
                        exports.getTodoNum(data,session,function(rep){
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
    }else{
        callback(result);
    }

}
exports.pushToAgent = function(msg, callback){
    var result = {success:false};

    mongo.db().collection('app_push_client').findOne({_id: msg.userId, status:{$ne:'close'}}, function(err, doc){
        if(err){
            callback(result);
            return;
        }
        if(doc){
            logger.app.info("require push server userId["+msg.userId+"] msg:"+ JSON.stringify(msg));
            if(msg.eventData.Data.Content){
                msg.eventData.Data.Content = encodeURIComponent(msg.eventData.Data.Content);
            }
            if(msg.eventData.Data.FromUrl){
                msg.eventData.Data.FromUrl = encodeURIComponent(msg.eventData.Data.FromUrl);
            }

            if(msg.eventData.Data.NickName){
                msg.eventData.Data.NickName = encodeURIComponent(msg.eventData.Data.NickName);
            }

            if(msg.eventData.Data.sName){
                msg.eventData.Data.sName = encodeURIComponent(msg.eventData.Data.sName);
            }
            exports.refreshWebchatNum(msg, function(req){
                if(req.success){
                    msg.eventData.Data.todoNum = req.todoNum;
                    msg.eventData.Data.openNum = req.openNum;
                }
                httpProvider.sendGet("http://"+doc.pushServerIp+":"+doc.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg)), function(err, res){
                    if(err) {
                        result.message = 'Sent require to push server error: ' + msg;
                        callback(result);
                        return;
                    }
                    var resData = {};
                    try{
                        resData = JSON.parse(res.toString());
                    }catch(e){
                        logger.app.error(e);
                    }

                    if(!resData.success){
                        if(msg.eventData.Data.MsgType == 'investigate'){
                            result.success = true;
                        }
                        result.message = resData.message;
                        callback(result);
                        return;
                    }

                    if(msg.eventData.Data.MsgType == 'investigate'){
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({_id:msg.eventData.Data.sessionId}, function(err,sessionDoc){
                            if(!err && sessionDoc && sessionDoc.investigate){
                                var replyData = {
                                    account: msg.eventData.Data.Account,
                                    accessId: msg.eventData.Data.AccessId,
                                    sid: msg.eventData.Data.Sid,
                                    sessionId: msg.eventData.Data.sessionId,
                                    platform: msg.eventData.Data.Platform,
                                    content: '您已提交过评价'};
                                exports.replyInvestigateSuccessMsg(replyData, function(err){});
                            }else{
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id:msg.eventData.Data.sessionId},
                                    {$set: {investigateResult: '客户满意度评价' ,investigate:msg.eventData.Data.Investigate, endTime:utils.getCurrentDate()}}
                                    , function(err){
                                        if(!err){
                                            logger.app.info("save investigate ok msg:"+ JSON.stringify(msg));
                                            var replyData = {
                                                account: msg.eventData.Data.Account,
                                                accessId: msg.eventData.Data.AccessId,
                                                sid: msg.eventData.Data.Sid,
                                                sessionId: msg.eventData.Data.sessionId,
                                                platform: msg.eventData.Data.Platform,
                                                content: '评价已提交',
                                                agentId: doc._id,
                                                type: reportEvent.EventType.IM_INVESTIGAGE,
                                            investigate: msg.eventData.Data.Investigate,
                                                reportTime: utils.getCurrentDate()};
                                            exports.replyInvestigateSuccessMsg(replyData, function(err){});
                                            reportEvent.emitImReportEvent(replyData);
                                            var chatSession = {_id: msg.eventData.Data.sessionId,
                                                sid:msg.eventData.Data.Sid,
                                                mchType:'finish',
                                                dispose:'客户满意度评价',
                                                investigate: msg.eventData.Data.Investigate,
                                                account: msg.eventData.Account,
                                                user: 'system'};
                                            exports.updateMultiChannelHistory(chatSession, function(res){});
                                        }else{
                                            logger.app.info("save investigate err msg:"+ JSON.stringify(msg));
                                        }
                                    });
                            }
                        });

                    }
                    if(msg.eventData.Data.MsgType == 'saveImCSRInfo'){
                        saveImCSRInfo(msg,doc._id);
                        //return;
                    }
                    result.success = true;
                    callback(result);
                });
            });

        }else{
            if(msg.eventData.Data.MsgType == 'investigate'){
                result.success = true;
            }
            result.message = 'agent not logined';
            callback(result);
            return;
        }
    })
}

function changeSessionPeer(data, session){
    var sessionPeer = session.toPeer;
    var isNull = false;
    if(data.ToPeer && data.ToPeer != sessionPeer){
        var update = {};
        var _id = session._id;
        if(session.status == "deal"){
            update.status = "changePeer";
            if(session.user){
                var pushMsg = {
                    userId: session.user, eventData: {
                        Event: 'NewNotify', Foryou: true, Account: data.Account,
                        Data: {
                            type: 'changePeer',
                            toPeer: data.ToPeer,
                            _id:session._id,
                            Platform: session.platform,
                            sName: session.sName,
                            CreateTime: utils.getCurrentDate()
                        }
                    }
                };
                exports.pushToAgent(pushMsg, function(err){});
            }
            session = null;
            isNull = true;
        }else{
            update.toPeer = data.ToPeer;
            session.toPeer = data.ToPeer;
        }
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: _id, status:{$ne:'finish'},leavemsg:{$ne: true}}, {$set:update} ,{w:1}, function(err){
        });
    }
    return isNull;
}

/**
 * 建立一个新的聊天会话
 * @param data
 * @param result
 * @param callback
 */
function createNewSession(data, result, callback){
    if(data.MsgType == 'disConn'){
        result.success = true;
        result.session = null;
        callback(result);
        return;
    }

    var insertDoc = {_id: uuid.generateUuid(), sid:data.Sid, type:'webchat', status: 'undeal', account:data.Account,
        createTime: utils.getCurrentDate(), createTimeStamp:utils.getCurrentDateTime(), accessId: data.AccessId, platform: data.Platform,
        autoClaimVersion: Math.random()+'_'+utils.getCurrentDateTime(), sName: data.NickName, userStatus: "online"};
    if(data.FromUrl){
        insertDoc.fromUrl = data.FromUrl;
    }
    if(data.Platform == "weixin"){
        mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne({_id:data.AccessId}, function(err, wechatConfig){
            if(!err && wechatConfig ){
                var robotData = {
                    account:data.Account,
                    platform:data.Platform,
                    robot: wechatConfig.robot,
                    sid: data.Sid
                };
                var peerId = getPeerId(wechatConfig.to_peer);
                peerId = data.ToPeer || peerId;
                insertDoc.toPeer = peerId;
                result.toPeer = insertDoc.toPeer;
                exports.initSession(robotData, insertDoc, result, data, function(re){
                    callback(re);
                });

            }else{
                callback(result);
            }
        });
    }else{
        mongo.db().collection("app_kefu_im_config").findOne({accessId:data.AccessId}, function(err, imconfig){
            if(!err && imconfig ){
                var robotData = {
                    account:data.Account,
                    platform:data.Platform,
                    robot: imconfig.robot,
                    sid: data.Sid
                };
                var peerId = getPeerId(imconfig.ToPeer);
                peerId = data.ToPeer || peerId;

                insertDoc.toPeer = peerId;
                result.toPeer = insertDoc.toPeer;
                data.ToPeer = peerId;
                exports.initSession(robotData, insertDoc, result, data, function(re){
                    callback(re);
                });

            }else{
                callback(result);
            }

        });

    }
}

function getPeerId(peer){
    var peerId = "";
    if(typeof peer == "string"){
        peerId = peer;
    }else{
        peerId = peer.id || peer[0].id;
    }
    return peerId;
}



function processLeaveMsg(data,result, callback){
    var insertDoc = {_id: uuid.generateUuid(), sid:data.Sid, type:'webchat', status: 'undeal', account:data.Account,
        createTime: utils.getCurrentDate(),createTimeStamp: utils.getCurrentDateTime(), accessId: data.AccessId, platform: data.Platform,
        autoClaimVersion: Math.random()+'_'+utils.getCurrentDateTime(), sName: data.NickName, leavemsg: true, msgCount:1, leakNum:1, userStatus: "offline"};
    if(data.FromUrl){
        insertDoc.fromUrl = data.FromUrl;
    }
    if(data.Platform == "weixin"){
        mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne({_id:data.AccessId}, function(err, weixinConfig){
            if(!err && weixinConfig ){
                insertDoc.toPeer = data.ToPeer || weixinConfig.to_peer;
                result.toPeer = insertDoc.toPeer;
                data.ToPeer = inserDoc.toPeer;
                data.sessionId = insertDoc._id;
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).insert(insertDoc, function (err) {});
                var reportData = {
                    reportTime: utils.getCurrentDate(),
                    status: "manual",
                    msgData: data,
                    type: reportEvent.EventType.IM_NEW_SESSION
                }
                reportEvent.emitImReportEvent(reportData);
                result.success = true;
                result.session_id = insertDoc._id;
                callback(result);
            }else{
                callback(result);
            }
        });

    }else{
        mongo.db().collection("app_kefu_im_config").findOne({accessId:data.AccessId}, function(err, imconfig){
            if(!err && imconfig ){
                var peerId = getPeerId(imconfig.ToPeer);
                peerId = data.ToPeer || peerId;
                insertDoc.toPeer = peerId;
                result.toPeer = insertDoc.toPeer;
                data.ToPeer = insertDoc.toPeer;
                data.sessionId = insertDoc._id;
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).insert(insertDoc, function (err) {});
                var reportData = {
                    reportTime: utils.getCurrentDate(),
                    status: "manual",
                    msgData: data,
                    type: reportEvent.EventType.IM_NEW_SESSION
                }
                reportEvent.emitImReportEvent(reportData);
                var msgReportData = utils.deepClone(reportData);
                msgReportData.type = reportEvent.EventType.IM_NEW_MSG_IN;
                reportEvent.emitImReportEvent(msgReportData);
                result.success = true;
                result.session_id = insertDoc._id;
                callback(result);
            }else{
                callback(result);
            }

        });

    }
}

exports.initSession = function(robotData, insertDoc, result, data, callback){
    robotHandler.initRobot(robotData, function(err, robotSession){
        data.sessionId = insertDoc._id;
        if(err){
            logger.app.error(err);
        }else{
            //机器人的处理
            insertDoc.status = "robot";
            insertDoc.serviceMan = "robot";
            insertDoc.robotCid = robotSession.cid;
            insertDoc.robotSysNum = robotSession.sysNum;
            result.robotCid = robotSession.cid;
            result.robotSysNum = robotSession.sysNum;
            var reportData = {
                type: reportEvent.EventType.IM_NEW_SESSION,
                reportTime: insertDoc.createTime,
                status: insertDoc.status,
                msgData: data
            };
            reportEvent.emitImReportEvent(reportData);
        }

        //人工时会话的消息条数的统计
        if(data.MsgType == 'newMsg' && !err && !insertDoc.robotCid){
            if(data.NotShow != "true" && data.NotShow != true){
                insertDoc.msgCount = 1;
                insertDoc.totalMsgCount = 1;
            }
            insertDoc.leakNum = 1;
        }

        //消息条数 报表数据的处理
        if(data.MsgType == 'newMsg'  && !data.NotShow){
            var reportData = {
                type: reportEvent.EventType.IM_NEW_MSG_IN,
                reportTime: insertDoc.createTime,
                status: insertDoc.status,
                msgData: data
            };
            reportEvent.emitImReportEvent(reportData);
        }

        result.session_id = insertDoc._id;
        result.session_sName = insertDoc.sName;
        result.newSession = true;
        //将原来的未完成的对话都完结掉
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
            .update({sid: data.Sid, status:{$nin:['finish','changePeer']}, leavemsg:{$ne: true}}, {$set:{status:'finish', leakNum:0}}, {multi:true, w:1}, function(err){
                console.log("update not finish session to finish ");
                if(err){
                    result.message = 'update multi channel chat session failed!';
                    callback(result);
                    return;
                }else{
                    //插入一条会话记录
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).insert(insertDoc, function (err) {
                        console.log("insert one session");
                        if(err){
                            result.message = 'insert multi channel chat session failed!';
                            callback(result);
                            return;
                        }
                        if(data.MsgType == 'newConn'){
                            var replyData = {
                                account: data.Account,
                                accessId: data.AccessId,
                                sid: data.Sid,
                                sessionId: insertDoc._id,
                                platform: data.Platform
                            };
                            exports.replyWelcomeMsg(replyData, function(err){});
                        }
                        result.success = true;
                        callback(result);

                        var multiChannelHistory = {
                            _id : insertDoc._id,
                            type: 'chat',
                            createTime: utils.getCurrentDate(),
                            status: 'chating',
                            platform: data.Platform
                        };

                        mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).findOne({sid:data.Sid}, function(err, relationDoc){
                            if(err){

                            }else{
                                if(relationDoc && relationDoc.customerId){
                                    multiChannelHistory.customer = relationDoc.customerId;
                                }
                            }
                            _insertMultiChannelHistory(multiChannelHistory, data.Account, function(err){});

                        });

                    });
                }


            });
    });
}

function _checkQueue(msg, callback){
    var result = {success:false};
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: msg.eventData.Data.ToPeer}, function(err, queue){
        if(err || !queue){
            result.message = 'webcaht config queue not found';
            callback(result);
            return;
        }
        result.queue = queue;
        result.success = true;
        callback(result);
    });
}

function _insertMultiChannelHistory(data, account, callback){
    console.log("======insertMultichannelhistory=====");
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({account:account, product: 'cc'}, function(err, doc){
        if(err || !doc){
            callback(result);
            return;
        }
        mongo.db(doc.dataDB).collection(account+"_history").insert(data, function(err){});
    })

}

exports.updateMultiChannelHistoryForLocateCust = function(data, session, callback){
    var result = {success: false};
    mongo.db(session).collection(session.user.account+"_history").update({_id: data.chatId},{$set:{customer: data.custId}}, function(err){
        if(err){
            result.message = "insertMultiChannelHistoryForLocateCust failed!";
        }else{
            result.success = true;
        }
        callback(result);
    });
}

exports.pushSocketLogined = function(data, session, callback){
    var result = {success: false};
    var find = {_id: session.user._id, socketId: data.socketId};
    var update = { $set : { pushServerIp: data.ip, pushServerPort:data.port }}

    var pushMsg = {
        eventData: {
            Event: 'NewNotify', Account: session.user.account,
            Data: {
                type: 'agentPushStatus',
                online: true,
                userId: session.user._id,
                time: utils.getCurrentDate()
            }
        }
    };
    exports.pushByAccount(pushMsg, function(err){});

    var reportData = {
        reportTime: utils.getCurrentDate(),
        reportType: 'socketPushConnected',
        agentId: session.user._id,
        account: session.user.account
    };
    reportEvent.emitImReportEvent(reportData);
    result.success = true;
    callback(result);

};

exports.notifyDispatherServer = function (data, session, callback) {
    var result = {success: false};
    var notifyVo = {
        sid: data.sid,
        type: 'webchat',
        operation: data.operation, //值可以为 claim(领取)  redirect(转接)  finish(完结)
        user: data.userId,
        queueNum: data.queueNum || 0
    }
    logger.app.info("notifyDispatherServer :"+JSON.stringify(notifyVo));
    httpProvider.sendPost(config.multi_channel_dispatcher_url, "data=" + JSON.stringify(notifyVo), function (err, res) {
        if (err) {
            result.message = 'Sent require to dispatcher server error: ' + data;
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });
}

exports.pushByAccount = function(msg, callback){
    var result = {success:false};
    var findUsers = {
        account: msg.eventData.Account,
        product: 'cc',
        status: 'enable',
        _id: {$ne: msg.eventData.Data.userId}
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(findUsers).toArray(function(err, docs){
        if(err){
            callback(result);
            return;
        }else{
            if(docs.length > 0){
                for(var i=0 ;i<docs.length;i++){
                    var tmpMsg = utils.deepClone(msg);
                    tmpMsg.userId = docs[i]._id;
                    exports.pushToAgent(tmpMsg, function(){});
                }
            }
        }
        result.success = true;
        callback(result);
    });
}

exports.replyWelcomeMsg = function (data, callback) {
    var result = {success: false};
    var id = utils.UUID.generateUuid();
    var time = utils.DateTime.getCurrentDateTime();
    data._id = id;
    data.msgType = "newIm";

    data.user = 'system';
    data.createTime = time;
    data.lastTime = time;
    data.contentType = "text";
    data.msgType = "newIm";

    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, function(err, imconfig){
        if(err || !imconfig){
            result.message = 'webchat imconfig not found';
            callback(result);
            return;
        }
        data.content = imconfig.welcome;
        if(imconfig.welcome && imconfig.welcome != ''){
            httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(data), function (err, rep) {
                if (err) {
                    logger.app.warn('replyMsg to gateway failed!', err);
                    callback(result);
                } else {
                    var res = JSON.parse(rep);
                    if (res.success) {
                        result.success = true;
                        result.row = data;
                        callback(result);
                    } else {
                        logger.app.warn(result);
                        callback(result);
                    }
                }
            });
        }else{
            result.success = true;
            callback(result);
        }
    })
}


exports.replyInvestigateSuccessMsg = function (data, callback) {
    var result = {success: false};
    var id = utils.UUID.generateUuid();
    var time = utils.DateTime.getCurrentDateTime();
    data._id = id;
    data.msgType = "newIm";

    data.user = 'system';
    data.createTime = time;
    data.lastTime = time;
    data.contentType = "text";
    httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(data), function (err, rep) {
        if (err) {
            logger.app.warn('replyMsg to gateway failed!', err);
            callback(result);
        } else {
            var res = JSON.parse(rep);
            if (res.success) {
                result.success = true;
                result.row = data;
                callback(result);
            } else {
                logger.app.warn(result);
                callback(result);
            }
        }
    });
}

exports.updateMultiChannelHistory = function(chatSession, callback){
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({account:chatSession.account, product: 'cc'}, function(err, doc){
        if(err || !doc){
            callback(result);
            return;
        }
        var find = {_id : chatSession._id};
        var setDoc = {};
        //mongo.db().collection('app_kefu_im_session').findOne({_id:chatSession.sid}, function(err, sUser){
            var multiChannelHistory = {
                agent: chatSession.user,
                lastUpdateTime: utils.getCurrentDate()
            }
            if(chatSession.mchType == 'claim'){
                multiChannelHistory.beginTime = utils.getCurrentDate();
            }
            if(chatSession.mchType == 'finish'){
                multiChannelHistory.endTime = utils.getCurrentDate();
                multiChannelHistory.dispose = chatSession.dispose;
                multiChannelHistory.status = 'finish';
                if(chatSession.investigate){
                    multiChannelHistory.investigate = chatSession.investigate;
                }
            }
            //if(sUser.customerId){
            //    multiChannelHistory.customer = sUser.customerId;
            //}
            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).findOne({sid:chatSession.sid}, function(err, relationDoc){
                if(err){

                }else{
                    if(relationDoc && relationDoc.customerId){
                        multiChannelHistory.customer = relationDoc.customerId;
                    }
                }
                setDoc['$set'] = multiChannelHistory;
                mongo.db(doc.dataDB).collection(chatSession.account+"_history").update(find, setDoc, function(err){});
            });

        });
    //})
};





var pushImCsrConfig  = function(data,isInvestigate){
    var pushData = {
        _id : utils.UUID.generateUuid(),
        msgType :"pushImCsrConfig",
        sid : data.Sid,
        isInvestigate:isInvestigate
    }
    httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(pushData), function (err, rep) {

    });

}

/**
 * 保存客户满意度调查信息
 * @param data
 * @param session
 * @param callback
 */
var saveImCSRInfo = function(data,agentId){
    var info = data.eventData.Data;
    if(info.appraise == undefined){
        return false;
    }
    var result = {success: false};
    var dbData = {
        account: info.Account,
        user:data.userId,
        sessionId:info.sessionId,
        platform: info.Platform,
        sid: info.Sid,
        when:info.when,
        createTime:info.createTime,
        appraise:info.appraise
    };
    var query = {
        account  : dbData.account,
        user     : dbData.user,
        sessionId: dbData.sessionId
    };

    var replyData = utils.deepClone(dbData)
    replyData.accessId = info.AccessId;
    replyData.reportTime= utils.getCurrentDate();
    replyData.agentId = agentId;
    replyData.type = reportEvent.EventType.IM_CSR;
    replyData.reportTime = utils.getCurrentDate();

    mongo.db().collection("app_kefu_im_csr").findOne(query,function(err,res){
        if(err){
            logger.app.err('查询客户满意度调查失败');

        }else{
            if(res){

            }else{
                mongo.db().collection("app_kefu_im_csr").insert(dbData,function (err) {
                    if (!err) {
                        result.success = true;
                        replyData.appraiseKey = info.appraise.appraiseKey;
                        replyData.way = info.appraise.way;
                        reportEvent.emitImReportEvent(replyData);
                    } else {
                        logger.app.error("保存客户满意度调查失败   "+err);
                    }
                });
                var setDoc = {
                    appraiseKey : info.appraise.appraiseKey
                };
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: info.sessionId}, {$set: setDoc},function(err){
                    console.log(info.sessionId+ "update session appraiseKey :"+JSON.stringify(setDoc))
                });
            }
        }
    });
}