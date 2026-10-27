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
var emailHandler = require(__baseDir + '/dishui/app/email/EmailHandler');
var Thenjs = require("thenjs");
var redisUtils = require("m7rds");
var redisField = require(__baseDir + '/dishui/common/RedisKeyPrefix');
var esHandler = require(__baseDir + '/dishui/common/ElasticSearchHandler');
var notificationEvent = require('appEvent/NotificationEvent');

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
            data.sid = wsRes.session_sid;
            data.sessionVersion = wsRes.sessionVersion;
            data.welcome_message = wsRes.welcome_message;
            data.haveConverted = wsRes.haveConverted;
            data.isVipAssignDealing = wsRes.isVipAssignDealing;
            var msg = {eventData: {Event:'NewWebchat', Account:data.Account, Data:data}};

            // 将消息发送至索引服务器
            if (data.Content) {
                var msgId = data.MessageId;
                var msgIndex = {
                    _id: data.MessageId,
                    account: data.Account,
                    sessionId: wsRes.session_id,
                    from: 'customer',
                    when: data.when
                };
                
                try {
                    msgIndex.message = decodeURIComponent(data.Content);
                } catch (decodeErr) {
                    msgIndex.message = data.Content;
                }

                esHandler.addMsgIndex(msgIndex, function (esRes) {
                    if (esRes.success) {
                        logger.app.info('create webchat message index successfully. msgId: ' + msgId);
                    } else {
                        logger.app.info('create webchat message index failed. msgId: ' + msgId);
                    }
                });
            }

            //业务处理链,机器人,满意度评价,常见问题处理等

            //已转人工的直接返回,但是微信的不在线的要给客户判断下,因此undeal状态的继续流转下去
            if(data.MsgType == "convertManual" && wsRes.haveConverted){
                if(data.Platform=="weixin"){
                    if(wsRes.session_status == "deal"){
                        callback(wsRes);
                        return;
                    }
                }else{
                    callback(wsRes);
                    return;
                }

            }
            //推送是否已评价的消息到用户端
            if(data.MsgType == 'newConn'){
                var isInvestigate = true;
                var query = {
                    account   :data.Account,
                    sessionId : wsRes.session_id
                }
                mongo.db().collection('app_kefu_im_csr').findOne(query,function(e,res){ //判断是否已经评价过了
                    console.log("==========sql 13 find");
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
                mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).update({_id:data.MessageId},{$set:{sessionId: wsRes.session_id}},function(err){console.log("==========sql 14 update");});
            }

            //获取常见问题的答案返回
            if(data.MsgType == 'sendImQAMsg'){
                processQAMsgType(data, wsRes, msg);
                callback({success: true});
                return;
            }

            //机器人服务,获取机器人的答案
            if(wsRes.robotCid && data.MsgType != "convertManual"){
                if(wsRes.newSession){
                    var replyData = {
                        account: msg.eventData.Data.Account,
                        accessId: msg.eventData.Data.AccessId,
                        sid: msg.eventData.Data.Sid,
                        sessionId: msg.eventData.Data.sessionId,
                        platform: msg.eventData.Data.Platform,
                        content: msg.eventData.Data.welcome_message
                    };
                    exports.replyWelcomeMsg(replyData, function(err){});
                    delete msg.eventData.Data.welcome_message;
                }
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
        msg.userId = wsRes.session.user;
        msg.eventData.Data.ToPeer = wsRes.session.toPeer;
        msg.eventData.Foryou = true;
        msg.eventData.Data.startWaitTimer = 0;
        var msgInvit = utils.deepClone(msg);
        exports.pushToAgent(msg, function(pushRes){
            if(pushRes.success || (msg.userId && wsRes.session_status == "deal")){
                //被邀请人
                if(wsRes.session.invitedUser && wsRes.session.inviteUserStatus=="accept"){
                    msgInvit.userId =wsRes.session.invitedUser;
                    msgInvit.isInvitedUser = true;
                    msgInvit.eventData.Data.isInvestigate = msg.eventData.Data.isInvestigate;
                    exports.pushToAgent(msgInvit,function(){
                    });
                }
                result.success = true;
                callback(result);
                return;
            }else{
                result.success = true;
                callback(result);
            }
        })
    }else{
        delete msg.eventData.Foryou;
        msg.eventData.Data.ToPeer = wsRes.toPeer;
        msg.session = "null";
        msg.session_status = wsRes.session_status;
        msg.newSession = wsRes.newSession;
        msg.haveConverted = wsRes.haveConverted;
        msg.vipAgentId = wsRes.vipAgentId;
        exports.publishByQueue(msg, function(pRes){
            if(pRes.success){
                result.success = true;
                if(data.MsgType == 'convertManual' && wsRes.session_status == "robot"){
                    var reportData = {
                        reportTime: utils.getCurrentDate(),
                        msgData: data,
                        type: reportEvent.EventType.IM_CONVERT_MANUAL
                    };
                    if(!wsRes.newSession){
                        reportEvent.emitImReportEvent(reportData);
                    }
                    if(data.Platform == "sdk"){
                        replyMsgToApp(data, wsRes);
                    }
                    // 转人工，推送排队信息
                    if(msg.eventData.Data.ToPeer){
                        pushQueueNumToClient({
                            Sid: data.Sid,
                            ToPeer: msg.eventData.Data.ToPeer,
                            Account: data.Account,
                            manualTime: pRes.manualTime
                        });
                     }

                }
                // 新会话推送消息
                if(isNewManualSession(msg) || data.msgType == "newConn"){
                    // 推送online消息
                    var notifyData = {sid: data.Sid ,operation: 'online', userId:'system'};
                    exports.notifyDispatherServer(notifyData, {}, function(err){});
                    // 推送排队消息
                    if(data.ToPeer) {
                        pushQueueNumToClient({
                            Sid: data.Sid,
                            ToPeer: data.ToPeer,
                            Account: data.Account,
                            manualTime: wsRes.manualTime
                        });
                    }
                }

            }else{
                //座席不在线处理
                if(isNewManualSession(msg) || data.msgType == "newConn"){
                    var notifyData = {sid: data.Sid ,operation: 'offline', userId:'system'};
                    exports.notifyDispatherServer(notifyData, {}, function(err){});
                }
                if (data.Platform == "weixin") {
                    if(wsRes.newSession){
                        var reportData = {
                            type: reportEvent.EventType.IM_NEW_SESSION,
                            reportTime: utils.getCurrentDate(),
                            status: 'undeal',
                            msgData: msg.eventData.Data
                        };
                        reportEvent.emitImReportEvent(reportData);
                    }
                    if(data.MsgType == 'convertManual' && !wsRes.newSession && wsRes.session_status == "robot"){

                        var reportData = {
                            reportTime: utils.getCurrentDate(),
                            msgData: data,
                            type: reportEvent.EventType.IM_CONVERT_MANUAL
                        };
                        reportEvent.emitImReportEvent(reportData);


                    }
                    //关键字的形式不用在给粉丝回复了,因为发关键字的时候已经回复了
                    //if(data.Words){
                    //    callback(pRes);
                    //    return;
                    //}

                    var query = {account: data.Account};
                    mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne(query, function (err, row) {
                        if (!err && row && row.weixinMsg) {
                            var replyMsg = {
                                sid: data.Sid,
                                contentType: "text",
                                user: "system",
                                content: encodeURIComponent(encodeURIComponent(row.weixinMsg)),
                                platform: data.Platform,
                                accessId: data.AccessId,
                                account: data.Account,
                                sessionId: data.sessionId,
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
                        } else {
                            logger.app.error(err);
                        }
                    });
                }
            }
            callback(pRes);
        })
    }
}

//exports._checkWebchatSession = function(data, callback){
//    _checkWebchatSession(data, callback);
//}

/**
 * 会话处理,主要是对会话表的操作,并获取该会话的一些属性返回
 * @param data
 * @param callback
 * @private
 */
function _checkWebchatSession(data, callback){
    var result = {success:false};
    try{
        if(data.UrlTitle){
            data.UrlTitle = decodeURIComponent(data.UrlTitle);
        }
    }catch(e){
        logger.app.error(e);
    }

    if(data.MsgType != "leaveMessage"){
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({account:data.Account, sid: data.Sid, status:{$nin: ['finish', 'changePeer']}, leavemsg:{$ne: true}}, function(err, session){
            console.log("==========sql 1 find");
            if(err){
                result.message = 'multi channel check session failed!';
                callback(result);
                return;
            }
            //if(session && session.status == "robot" && session.platform == "weixin"){
            //    var lastTimeStamp = session.lastTimeStamp;
            //    var now = new Date().getTime();
            //    //超过10分钟没有消息记录,直接关闭该会话
            //    if(now-lastTimeStamp >= 600000){
            //        session = null;
            //    }
            //}

            //判断是否sdk版本有变化。
            if(data.platform=="sdk" && session){
                if(data.sdkAndroidVersionCode && session.sdkAndroidVersionCode!=data.sdkAndroidVersionCode){
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: session._id}, {$set:{sdkAndroidVersionCode:data.sdkAndroidVersionCode}},{w:1},function(err){
                    });
                }else if(data.sdkIosVersionCode && session.sdkIosVersionCode!=data.sdkIosVersionCode){
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: session._id}, {$set:{sdkIosVersionCode:data.sdkIosVersionCode}},{w:1},function(err){
                    });
                }
            }
            if(data.MsgType == "convertManual" && session && session.status != "robot"){
                result.robotCid = session.robotCid;
                result.robotUid = session.robotUid;
                result.robotSysNum = session.robotSysNum;
                result.session_id = session._id;
                result.session_sid = session.sid;
                result.sessionVersion = session.autoClaimVersion;
                result.session_sName = session.sName;
                result.session_status = session.status;
                result.toPeer = session.toPeer;
                result.success = true;
                result.message = "have converted";
                result.haveConverted = true;
                callback(result);
                return;

            }
            if(session && data.MsgType == "convertManual"){
                data.SeoSource = session.seoSource;
                data.SeoKeywords = session.seoKeywords;
                data.FromUrl = session.fromUrl;
                data.UrlTitle = session.urlTitle;
                var area = "";
                if(session.area){
                    var temp = session.area.split(" ");
                    area = temp[1] || temp[0];
                }
                data.area = area;
            }
            if (data.Platform == "weixin" && data.MsgType == "convertManual" && session && session.status == "robot") {
                var sBreakSet={status:"undeal",robotCid:"",robotSysNum:"",serviceMan:""}
                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id:session._id}, {$set:sBreakSet}, function(err){

                });
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
                    sBreakSet['$set'] = {userStatus: "online", ip: data.Ip};
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: session._id, status:{$ne:'finish'},leavemsg:{$ne: true}}, sBreakSet, function(err){
                        console.log("==========sql 2 update");
                    });

                    if(session.status == "undeal" && data.Platform != 'weixin'){
                        pushQueueNumToClient({Sid: data.Sid, ToPeer: data.ToPeer, Account: data.Account, manualTime: session.manualTime});
                    }
                    result.status = session.status;
                    result.isVipAssignDealing = session.isVipAssignDealing;
                }

                //断开连接处理,机器人的直接将状态改为关闭,并推送到报表
                if(data.MsgType == 'disConn'){
                    var disconnSet = {sBreakTime:utils.getCurrentDateTime(), userStatus: "offline"};
                    if(session.status == "robot"){
                        disconnSet.status = "finish";
                        disconnSet.leakNum=0;
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
                    if(session.status == "undeal"){
                        disconnSet.status = "finish";
                        disconnSet.leakNum=0;
                        disconnSet.finishUser = "system";
                        if(session.vipAgentId){
                            disconnSet.finishReason="vip assign failed";
                        }else{
                            disconnSet.finishReason="give up before queued";
                            var dataForNum = {toPeer: session.toPeer};
                            var sessionForQueuePush = {user: { account: data.Account }}
                            exports.pushQueueNumToWebChatClients(dataForNum, sessionForQueuePush,function(){});
                        }
                    }
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: session._id, status:{$nin:['finish', 'changePeer']}, leavemsg:{$ne: true}}, {$set:disconnSet},function(err){
                        console.log("==========sql 3 update");
                    });
                }

                //新消息过来统计该会话的人工消息条数以及更新最后一条消息的时间
                var oldLastTimeStamp = session.lastTimeStamp;
                if(data.MsgType == 'newMsg' && session.status != "robot"){
                    var time = utils.getCurrentDateTime();
                    var setDoc = {lastTimeStamp: time};
                    var incDoc = {leakNum:1};
                    if(data.NotShow != "true"){
                        var time = utils.getCurrentDateTime();
                        incDoc.msgCount = 1;
                        incDoc.totalMsgCount = 1;
                        setDoc.lastCustomerMsgTimeStamp = time;
                        //获取访客开始等待的起始时间戳
                        if(session.status == "deal" && (!session.lastCustomerMsgTimeStamp || session.lastCustomerMsgTimeStamp<session.lastAgentMsgTimeStamp)){
                            setDoc.startCustomerWaitTimeStamp = time;
                        }

                        // 访客回复后删除定时自动关闭事件
                        notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_REMOVE_AUTO_CLOSE, {
                            account: session.account,
                            sessionId: session._id
                        });
                        if(data.Platform == "weixin") {
                        notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_REMOVE_WEIXIN_REMIND, {
                                account: session.account,
                                sessionId: session._id
                            });
                        }
                    }
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: session._id}, {$inc:incDoc, $set: setDoc},function(err){
                        console.log("==========sql 4 update");
                    });
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
                result.robotUid = session.robotUid;
                result.robotSysNum = session.robotSysNum;
                result.session_id = session._id;
                result.session_sid = session.sid;
                result.sessionVersion = session.autoClaimVersion;
                result.session_sName = session.sName;
                result.session_status = session.status;
                result.toPeer = session.toPeer;
                result.vipAgentId = session.vipAgentId;
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
            account:data.Account,
            uid:wsRes.robotUid,
            cid:wsRes.robotCid,
            question:data.Content,
            sysNum:wsRes.robotSysNum,
            sid: data.Sid,
            accessId: data.AccessId,
            sessionId: wsRes.session_id,
            user: "robot",
            contentType: data.ContentType
        };
        robotHandler.getRobotAnswer(robotReq, function(err, robotRes) {
            if (err) {
                logger.app.warn("机器人cid失效处理-----------"+err);
                if (data.Platform == "weixin" && err == "noAnswer") {

                    //Thenjs(function (cont) {
                    //    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne({_id: data.AccessId}, cont);
                    //}).then(function (cont, wechatConfig) {
                    //    if (wechatConfig) {
                    //        var robotData = {
                    //            account: data.Account,
                    //            platform: data.Platform,
                    //            robot: wechatConfig.robot,
                    //            sid: data.Sid,
                    //            msgType: data.MsgType
                    //        };
                    //        robotHandler.initRobot(robotData, cont);
                    //    } else {
                    //        cont("wechatConfig is null")
                    //    }
                    //}).then(function (cont, robotSession) {
                    //    if (robotSession) {
                    //        var upadteData = {
                    //            robotCid: robotSession.cid,
                    //            robotSysNum: robotSession.sysNum
                    //        };
                    //        wsRes.robotCid = upadteData.robotCid;
                    //        wsRes.robotSysNum = upadteData.robotSysNum;
                    //        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({sid: data.Sid,status: "robot", leavemsg: {$ne: true}}, {$set: upadteData}, {multi: true, w: 1}, cont)
                    //    } else {
                    //        cont("robotSession is null")
                    //    }
                    //}).then(function (cont) {
                    //    processRobotMsgType(data, wsRes);
                    //}).fail(function (cont, err) {
                    //    logger.app.warn(err);
                    //});
                }
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
        //被邀请人
        if(wsRes.session.invitedUser && wsRes.session.inviteUserStatus=="accept"){
            var msgCopy = utils.deepClone(msg);
            msgCopy.userId =wsRes.session.invitedUser;
            exports.pushToAgent(msgCopy,function(){});
        }
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


                        //被邀请人
                        if(wsRes.session.invitedUser && wsRes.session.inviteUserStatus=="accept"){
                            var msgAnswerCopy = utils.deepClone(msgAnswer);
                            msgAnswerCopy.userId =wsRes.session.invitedUser;
                            exports.pushToAgent(msgAnswerCopy,function(){});
                    }

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
    //机器人,不能提交评价
    if(wsRes.robotCid){
        var replyData = {
            account: data.Account,
            accessId: data.accessId,
            sid: data.Sid,
            sessionId:wsRes.session_id,
            platform: data.Platform,
            content: '当前是机器人服务,无法进行评价哟!'};
        exports.replyInvestigateSuccessMsg(replyData, function(err){});
       return;
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
            mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).update({_id:data.MessageId},{$set:{sessionId: wsRes.session_id}},function(err){
                // 访客评价后删除定时自动关闭事件
                notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_REMOVE_AUTO_CLOSE, {
                    account: data.Account,
                    sessionId: wsRes.session_id
                });
                if(data.Platform == "weixin") {
                notificationEvent.emitEvent(notificationEvent.eventType.WEBCHAT_REMOVE_WEIXIN_REMIND, {
                        account: data.Account,
                        sessionId:wsRes.session_id
                    });
                }
            });
        }
    });

    //等待时间
    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id:wsRes.session_id,account: data.Account}, {$set:{startCustomerWaitTimeStamp:utils.getCurrentDateTime()}},  function(){
    })
}

/**
 * 获取单个会话排队人数推送到前端
 * @param data
 * @param data.Sid
 * @param data.Topeer
 * @param data.Account
 * @param data.manualTime
 */
function pushQueueNumToClient(data) {
    var notifyData = { sid: data.Sid, operation: 'queueNum', userId: 'system' };
    exports.getOpenWebchatNumFront({
        sid: data.Sid, toPeer: data.ToPeer, manualTime: data.manualTime
    }, {
        user: { account: data.Account }
    }, function (req) {
        var queueNum = 0;
        if(req && req.success) {
            queueNum = req.openNum;
        }
        notifyData.queueNum = queueNum;
        exports.notifyDispatherServer(notifyData, {}, function(err){});
    });
}
exports.pushQueueNumToClient = function(data){
    pushQueueNumToClient(data);
};
/**
 * 获取排队人数推送到前端(在线咨询类型 type：webchat)
 * 推送前100人
 *
 * @param data
 * @param data.toPeer
 * @param session
 * @param callback
 */
exports.pushQueueNumToWebChatClients = function (data, session, callback) {
    var funcName = '[MultiChannelHandler - pushQueueNumToWebChatClients]';
    if (!data.toPeer) {
        logger.app.error(funcName, 'toPeer is required');
        return callback({ success: false });
    }

    callback({ success: true });

    mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne({ account: session.user.account }, function (err, globalSet) {
        if (err) {
            logger.app.error(funcName, err);
            return;
        }

        if (!globalSet || !globalSet.queueNumSwitch || globalSet.queueNumSwitch === 'false') {
            return;
        }

        exports.getOpenWebchatNumList({
            toPeer: data.toPeer
        }, {
            user: { account: session.user.account }
        }, function(req){
            var queueNumList = [];
            var dataArr = [];
            if(req && req.success) {
                queueNumList = req.queueNumList;
            }
            for(var i =0;i<queueNumList.length;i++){
                var queueNumInfo = queueNumList[i];
                if(queueNumInfo &&  queueNumInfo.platform && queueNumInfo.platform != "weixin" && !queueNumInfo.leavemsg){
                    dataArr.push({
                        operation: 'queueNum',
                        userId:'system',
                        sid: queueNumInfo.sid,
                        queueNum: i + 1
                    });
                }
            }

            exports.notifyDispatherServerBatch(dataArr, {}, function (err) {});
        });
    });

    // exports.getOpenWebchatNumList({
    //     toPeer: data.toPeer
    // }, {
    //     user: { account: session.user.account }
    // }, function(req){
    //     var queueNumList = [];
    //     var dataArr = [];
    //     if(req && req.success) {
    //         queueNumList = req.queueNumList;
    //     }
    //     for(var i =0;i<queueNumList.length;i++){
    //         var queueNumInfo = queueNumList[i];
    //         if(queueNumInfo &&  queueNumInfo.platform && queueNumInfo.platform != "weixin" && !queueNumInfo.leavemsg){
    //             dataArr.push({
    //                 operation: 'queueNum',
    //                 userId:'system',
    //                 sid: queueNumInfo.sid,
    //                 queueNum: i + 1
    //             });
    //         }
    //     }
    //
    //     exports.notifyDispatherServerBatch(dataArr, {}, function (err) {});
    // });
};

function isNewManualSession(msg){
  return  msg.session_status != "robot" && (msg.eventData.Data.MsgType == 'newConn' || msg.eventData.Data.MsgType == 'newMsg') && msg.newSession;
}

/**
 * 通知座席
 * @param msg
 * @param docs
 */
exports.notifyAgents = function(msg, docs){
    if(docs.length <= 0){
        return;
    }
    //var randomNum = Math.floor(Math.random()* docs.length);
    //if(randomNum >= docs.length){
    //    randomNum = docs.length -1;
    //}
    var member = docs.pop();
    var tmpMsg = utils.deepClone(msg);
    tmpMsg.userId = member._id;
    tmpMsg.pushServerIp = member.pushServerIp;
    tmpMsg.pushServerPort = member.pushServerPort;
    exports.httpPushToAgent(tmpMsg,function(){
        exports.notifyAgents(msg, docs);
    });

}

exports.emitAssignTask = function(msg, wqRes){
    var task = {
        peerId: wqRes.queue.Exten,
        account: msg.eventData.Account,
        sessionVersion:  msg.eventData.Data.sessionVersion,
        sessionId:msg.eventData.Data.sessionId,
        data:msg.eventData.Data
    }
    mongo.reportDb("assign").collection("app_im_assign_task").insertOne(task, function(err){
        if(err){
            logger.app.error(err);
        }
    });
}

/**
 * 分配座席
 * @param msg
 * @param pushAgents
 * @param wqRes
 */
exports.assignAgent = function(msg, wqRes){

    redisUtils.sortset.zadd(redisField.IM_ASSIGN_QUEUE, utils.getCurrentDateTime(),msg.eventData.Account+","+wqRes.queue.Exten+","+msg.eventData.Data.sessionId+","+(msg.eventData.Data.sid || msg.eventData.Data.Sid)+","+(msg.vipAgentId||""), function(){
        logger.app.info("push to redis:"+msg.eventData.Data.sessionId+"_"+(msg.eventData.Data.sid || msg.eventData.Data.Sid));
    }, redisField.REDIS_DB1);
    //if(msg.eventData.Data.Content){
    //    msg.eventData.Data.Content = encodeURIComponent(msg.eventData.Data.Content);
    //}
    //if(msg.eventData.Data.FromUrl){
    //    msg.eventData.Data.FromUrl = encodeURIComponent(msg.eventData.Data.FromUrl);
    //}
    //
    //if(msg.eventData.Data.NickName){
    //    msg.eventData.Data.NickName = encodeURIComponent(msg.eventData.Data.NickName);
    //}
    //
    //if(msg.eventData.Data.sName){
    //    msg.eventData.Data.sName = encodeURIComponent(msg.eventData.Data.sName);
    //}
    //
    //var url = config.imAssignUrl+'?Action=getIMAgentId&_id='+uuid.generateUuid()+'&time='+ new Date().getTime() +'&peerId=' +
    //    wqRes.queue.Exten+'&account='+ msg.eventData.Account+'&sessionVersion='+msg.eventData.Data.sessionVersion+'&sessionId='+msg.eventData.Data.sessionId+'&data='+JSON.stringify(msg.eventData.Data);
    //url=encodeURI(url);
    //httpProvider.sendGet(url,function(err, res){
    //    var res1 = {};
    //    try{
    //        if(!err){
    //            res1 = JSON.parse(res);
    //        }
    //    }catch (err1){
    //        err = err1;
    //    }
    //    if(err || !res1.Succeed){
    //        logger.app.warn("request assign agent error", err);
    //    }
    //});

}

exports.publishByQueue = function(msg, callback){
    var result = {success:false};
    _checkQueue(msg, function(wqRes){
        if(!wqRes.success){
            //todo to update msg status
            if(msg.eventData.Data.MsgType == 'convertManual'
                || isNewManualSession(msg)) {
                    if(isNewManualSession(msg)){
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:{status:'finish'}},function(err){
                            console.log("==========sql 28 update");
                        });
                    }
                    result.success = false;
                    callback(result);
                    return;
            }

        }else{

            if(wqRes.queue.AssignMembers.length > 0){

                var agentIDs = [];
                //专属坐席
                if(msg.vipAgentId){
                    agentIDs.push(msg.vipAgentId);
                }
                for(var i=0 ;i<wqRes.queue.AssignMembers.length;i++){
                    agentIDs.push(wqRes.queue.AssignMembers[i].agentID);
                }

                if(msg.eventData.Data.MsgType == 'convertManual'
                    || isNewManualSession(msg) || msg.eventData.Data.operation == 'changePeer'){
                    mongo.db().collection('app_push_client').find({_id: {$in: agentIDs}}).toArray(function(err, docs){
                        var accept = false;
                        var pushAgents = [];
                        if(!err && docs && docs.length>0){
                            var tmpDocs = utils.deepClone(docs);
                            var pushMsg = {eventData: {Event:'NewNotify',
                                Data:{type:'refreshUndealNum', ToPeer:msg.eventData.Data.ToPeer, Account:msg.eventData.Account}}};
                            exports.notifyAgents(pushMsg, tmpDocs);

                            for(var i=0; i<docs.length; i++){
                                if(!docs[i].status || docs[i].status != "close"){
                                    accept = true;
                                    pushAgents.push(docs[i]);
                                }
                            }
                            if(!accept){
                                if(msg.haveConverted){
                                    result.success = false;
                                    result.message = "have converted";
                                    callback(result);
                                    return;
                                }
                                if(msg.eventData.Data.Platform!='weixin' && (msg.eventData.Data.MsgType == 'newConn' || msg.eventData.Data.MsgType == 'newMsg')){
                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:{status:'finish', leakNum:0}},function(err){
                                    });
                                    if (msg.eventData.Data.MsgType == 'newConn') {
                                        var reportData = {
                                            type: reportEvent.EventType.IM_LOST_SESSION,
                                            reportTime: utils.getCurrentDate(),
                                            msgData: msg.eventData.Data
                                        };
                                        reportEvent.emitImReportEvent(reportData);
                                    }
                                }
                                //推送给分配程序,所有的会话都交由分配程序来分配,不再自动领取了
                                if(msg.eventData.Data.Platform == 'weixin' || msg.eventData.Data.operation == 'changePeer'){
                                    if (msg.eventData.Data.Platform == "weixin" && msg.eventData.Data.MsgType == "convertManual") {
                                        var sBreakSet={status:"undeal",robotCid:"",robotSysNum:"",serviceMan:"",redisRecordDelayTime:utils.getCurrentDateTime()};
                                        sBreakSet.manualTime = utils.getCurrentDateTime();
                                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id:msg.eventData.Data.sessionId}, {$set:sBreakSet}, {w:1},function(err){
                                            exports.assignAgent(msg,wqRes);
                                            //exports.emitAssignTask(msg, wqRes)
                                        });
                                    }else{
                                        exports.assignAgent(msg,wqRes);
                                        //exports.emitAssignTask(msg, wqRes)
                                    }

                                }
                                result.success = false;
                                result.message = "agent not accept new session";
                                callback(result);
                                return;
                            }
                            if(msg.haveConverted){
                                result.success = true;
                                result.message = "have converted";
                                callback(result);
                                return;
                            }
                            if(msg.newSession){
                                var replyData = {
                                    account: msg.eventData.Data.Account,
                                    accessId: msg.eventData.Data.AccessId,
                                    sid: msg.eventData.Data.Sid,
                                    sessionId: msg.eventData.Data.sessionId,
                                    platform: msg.eventData.Data.Platform,
                                    content: msg.eventData.Data.welcome_message
                                };
                                exports.replyWelcomeMsg(replyData, function(err){});
                                delete msg.eventData.Data.welcome_message;
                            }
                            result.success = true;


                            var updateSet = {status:"undeal", serviceMan:"manual", robotCid: ""};

                            //已存在人工状态会话的manualTime不应该被更改
                            if(msg.eventData.Data.MsgType == 'convertManual'){
                                var manualTime = utils.getCurrentDateTime();
                                updateSet.manualTime = manualTime;
                                updateSet.redisRecordDelayTime = utils.getCurrentDateTime();
                                // result.manualTime传递至pushMsgToAgent方法中用于转人工的排队信息推送
                                result.manualTime = manualTime;
                            }
                            var inc = {leakNum:1};
                            //新的会话
                            var update = {$set: updateSet};
                            if(msg.eventData.Data.MsgType != "newMsg"){
                                update['$inc']={leakNum:1};
                            }
                            if(msg.eventData.Data.MsgType != 'convertManual' && msg.newSession){
                                var reportData = {
                                    type: reportEvent.EventType.IM_NEW_SESSION,
                                    reportTime: utils.getCurrentDate(),
                                    status: 'undeal',
                                    msgData: msg.eventData.Data
                                };
                                reportEvent.emitImReportEvent(reportData);
                            }
                            if (msg.eventData.Data.Platform == "weixin" && msg.newSession && msg.eventData.Data.MsgType == 'convertManual') {
                                var reportData = {
                                    type: reportEvent.EventType.IM_NEW_SESSION,
                                    reportTime: utils.getCurrentDate(),
                                    status: 'undeal',
                                    msgData: msg.eventData.Data
                                };
                                reportEvent.emitImReportEvent(reportData);
                            }
                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, update,{w:1},function(err){
                                console.log("==========sql 31 update");
                                callback(result);

                                exports.assignAgent(msg,wqRes);
                                //exports.emitAssignTask(msg, wqRes)
                            });

                        }else{
                            if(msg.haveConverted){
                                result.success = false;
                                result.message = "have converted";
                                callback(result);
                                return;
                            }
                            //web,sdk方式时座席不在线直接将会话结束掉
                            if(msg.eventData.Data.Platform!='weixin' && (msg.eventData.Data.MsgType == 'newConn' || msg.eventData.Data.MsgType == 'newMsg')){
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:{status:'finish', leakNum:0}},function(err){
                                    console.log("==========sql 32 update");
                                });
                                if (msg.eventData.Data.MsgType == 'newConn') {
                                    var reportData = {
                                        type: reportEvent.EventType.IM_LOST_SESSION,
                                        reportTime: utils.getCurrentDate(),
                                        msgData: msg.eventData.Data
                                    };
                                    reportEvent.emitImReportEvent(reportData);
                                }
                            }
                            //推送给分配程序,所有的会话都交由分配程序来分配,不再自动领取了
                            if(msg.eventData.Data.Platform == 'weixin' || msg.eventData.Data.operation == 'changePeer'){
                                if (msg.eventData.Data.Platform == "weixin" && msg.eventData.Data.MsgType == "convertManual") {
                                    var sBreakSet={status:"undeal",robotCid:"",robotSysNum:"",serviceMan:""}
                                    sBreakSet.redisRecordDelayTime = utils.getCurrentDateTime();
                                    sBreakSet.manualTime = utils.getCurrentDateTime();
                                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id:msg.eventData.Data.sessionId}, {$set:sBreakSet}, {w:1},function(err){
                                        exports.assignAgent(msg,wqRes);
                                        //exports.emitAssignTask(msg, wqRes)
                                    });
                                }else{
                                    exports.assignAgent(msg,wqRes);
                                    //exports.emitAssignTask(msg, wqRes)
                                }

                            }
                            result.success = false;
                            result.message = "not found agent";
                            callback(result);
                        }
                    });
                }else{
                    //NewWebchat的情况不需要推送
                    if(msg.eventData.Event != "NewWebchat"){
                        mongo.db().collection('app_push_client').find({_id: {$in: agentIDs}}).toArray(function(err, docs){
                            var pushAgents = [];
                            if(!err && docs && docs.length>0){
                                for(var i=0; i<docs.length; i++){
                                    if(!docs[i].status || docs[i].status != "close"){
                                        pushAgents.push(docs[i]);
                                    }
                                }
                            }
                            exports.notifyAgents(msg, pushAgents, wqRes);
                        });
                    }
                }
            }else{
                //todo to update msg status
                if(msg.eventData.Data.MsgType == 'convertManual' || isNewManualSession(msg)){
                    if(isNewManualSession(msg)){
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: msg.eventData.Data.sessionId}, {$set:{status:'finish'}},function(err){});
                        var reportData = {
                            type: reportEvent.EventType.IM_LOST_SESSION,
                            reportTime: utils.getCurrentDate(),
                            msgData: msg.eventData.Data
                        };
                        reportEvent.emitImReportEvent(reportData);
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
        console.log("==========sql 16 find");
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
        status: "undeal",
        toPeer: data.toPeer
    };
    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
        console.log("==========sql 17 find");
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
/**
 * 获取该客户之前的排队人数
 * @param data
 * @param data.sid
 * @param data.toPeer
 * @param data.manualTime
 * @param session
 * @param session.user.account
 * @param callback
 */
exports.getOpenWebchatNumFront = function(data, session, callback) {
    var funcName = '[MultiChannelHandler - getOpenWebchatNumFront]';
    var result = { success: false };
    var aid = session.user.account;

    Thenjs(function (cont) {
        var query = {
            account: aid,
            user: { $in: ['', null] },
            status: 'undeal',
            toPeer: data.toPeer,
            manualTime: { $lt: data.manualTime },
            sid: { $ne: data.sid }
        };

        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, cont);
    }).then(function (cont, count) {
        count++;
        result.success = true;
        result.openNum = count;

        return callback(result);
    }).fail(function (cont, err) {
        logger.app.error(funcName, err);
        callback(result);
    });
};
/**
 * 获取排队列表（前100）
 *
 * @param data
 * @param data.toPeer
 * @param session
 * @param session.user.account
 * @param callback
 */
exports.getOpenWebchatNumList=function(data, session, callback){
    var result = {success: false};
    var aid = session.user.account;
    var query = {
        account: aid,
        user: {$in: ['', null]},
        status: "undeal",
        toPeer: data.toPeer
    };
    // 只查询前100个
    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).find(query, {
        limit: 100,
        sort: { manualTime: 1 },
        field: { platform: 1, leavemsg: 1, sid: 1 }
    }).toArray(function (err, docs) {
        if(!err){
            //todo
            result.success=true;
            result.queueNumList=docs;
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
        status: "deal"
        //toPeer:data.toPeer
    };

    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).count(query, function (err, count) {
        console.log("==========sql 18 find");
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
    if(msg.eventData && msg.eventData.Event && (msg.eventData.Event == "NewWebchat" || msg.eventData.Data.type == "refreshUndealNum" ||  (msg.eventData.Event == "NewNotify" && msg.eventData.Data.operation=="claim"))){
        var data = {};
        var session = {user:{_id:msg.userId, account:msg.eventData.Data.Account}};

        exports.getImAccessId(data,session,function(rep){
            if(rep.peers) {
                data.toPeer = {$in: rep.peers};
                exports.getOpenNum(data,session,function(rep){
                    if(rep.success){
                        result.openNum=rep.openNum||0;
                        result.undealNum=rep.openNum||0;
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

exports.httpPushToAgent = function(msg, callback){
    var result = {success:false};
    logger.app.info("require push server userId["+msg.userId+"] msg:"+ JSON.stringify(msg));
    if(msg.eventData.Data.Content){
        msg.eventData.Data.Content = encodeURIComponent(msg.eventData.Data.Content);
    }
    if(msg.eventData.Data.FromUrl){
        msg.eventData.Data.FromUrl = encodeURIComponent(msg.eventData.Data.FromUrl);
    }
    if(msg.eventData.Data.UrlTitle){
        msg.eventData.Data.UrlTitle = encodeURIComponent(msg.eventData.Data.UrlTitle);
    }

    if(msg.eventData.Data.NickName){
        msg.eventData.Data.NickName = encodeURIComponent(msg.eventData.Data.NickName);
    }

    if(msg.eventData.Data.sName){
        msg.eventData.Data.sName = encodeURIComponent(encodeURIComponent(msg.eventData.Data.sName));
    }
    exports.refreshWebchatNum(msg, function(req){
        if(req.success){
            msg.eventData.Data.todoNum = req.todoNum;
            msg.eventData.Data.openNum = req.openNum;
            msg.eventData.Data.undealNum = req.undealNum;
        }
        var ip = msg.pushServerIp;
        var port = msg.pushServerPort;
        delete msg.pushServerIp;
        delete msg.pushServerPort;
        httpProvider.sendGet("http://"+ip+":"+port+"/push?msg="+ encodeURI(JSON.stringify(msg)), function(err, res){
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
            result.success = true;
            callback(result);
        });
    });

}

exports.pushToAgent = function(msg, callback){
    var result = {success:false};
    var setCon = {_id: msg.userId};
    if(!msg.eventData.Foryou){
        setCon.status = {$ne:'close'};
    }
    mongo.db().collection('app_push_client').findOne(setCon, function(err, doc){
        console.log("==========sql 15 find");
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

            if(msg.eventData.Data.UrlTitle){
                msg.eventData.Data.UrlTitle = encodeURIComponent(msg.eventData.Data.UrlTitle);
            }

            if(msg.eventData.Data.NickName){
                msg.eventData.Data.NickName = encodeURIComponent(msg.eventData.Data.NickName);
            }

            if(msg.eventData.Data.sName){
                msg.eventData.Data.sName = encodeURIComponent(encodeURIComponent(msg.eventData.Data.sName));
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
                    if(!msg.isInvitedUser){
                    if(msg.eventData.Data.MsgType == 'investigate'){
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({_id:msg.eventData.Data.sessionId}, function(err,sessionDoc){
                            console.log("==========sql 19 find");
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
                                        console.log("==========sql 20 update");
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
    var isRedirectPeer =false;//是否转接过技能组
    //判断是否有转接历史
    if(session.previousPeer){
        isRedirectPeer =true;
    }else{
        //查看历史
        var history = session.history;
        if(history){
            for(var i=0;i<history.length;i++){
                if(history[i] && history[i].type =="changePeer"){
                    isRedirectPeer =true;
                    break;
                }
            }
        }
    }
    if(data.ToPeer && data.ToPeer != sessionPeer && !isRedirectPeer){
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
            if(session.invitedUser){
                var pushMsg = {
                    userId: session.invitedUser, eventData: {
                        Event: 'NewNotify', Foryou: true, Account: data.Account,
                        Data: {
                            type: 'invited_changePeer',
                            toPeer: data.ToPeer,
                            _id:session._id,
                            Platform: session.platform,
                            sName: session.sName,
                            CreateTime: utils.getCurrentDate(),
                            invitedUser:session.invitedUser
                        }
                    }
                };
                exports.pushToAgent(pushMsg, function(err){});

                if(session.invitedUser && session.inviteUserStatus=="accept"){
                    updateAgentCurrImDealCount(session.invitedUser, -1);
                }

            }


            session = null;
            isNull = true;
        }else{
            update.toPeer = data.ToPeer;
            session.toPeer = data.ToPeer;
        }
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id: _id, status:{$ne:'finish'},leavemsg:{$ne: true}}, {$set:update} ,{w:1}, function(err){
            console.log("==========sql 33 find");
        });
    }
    return isNull;
}
function updateAgentCurrImDealCount(user, count){
    console.log("=========="+count);
    if(count>0){
        redisUtils.string.incrBy(redisField.AGENT_CURR_IM_DEAL_COUNT+user, count, function(){}, redisField.REDIS_DB1);
    }else if(count < 0){
        redisUtils.string.decrBy(redisField.AGENT_CURR_IM_DEAL_COUNT+user, Math.abs(count), function(){}, redisField.REDIS_DB1);
    }
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
    var sName = "";
    try{
        sName = decodeURIComponent(data.NickName);
    }catch (e){
        sName = data.NickName;
    }
    var insertDoc = {_id: uuid.generateUuid(), sid:data.Sid, type:'webchat', status: 'undeal', account:data.Account,
        createTime: utils.getCurrentDate(), createTimeStamp:utils.getCurrentDateTime(), accessId: data.AccessId, platform: data.Platform,
        autoClaimVersion: Math.random()+'_'+utils.getCurrentDateTime(), sName: sName, userStatus: "online", seoSource: data.SeoSource,
        seoKeywords: data.SeoKeywords, ip: data.Ip};
    if(data.FromUrl){
        insertDoc.fromUrl = data.FromUrl;
    }
    if(data.UrlTitle){
        insertDoc.urlTitle = data.UrlTitle;
    }
    if(data.OtherParams){
        insertDoc.otherParams = data.OtherParams;
        result.otherParams = data.OtherParams;
    }
    if(data.sdkAndroidVersionCode){
        insertDoc.sdkAndroidVersionCode = data.sdkAndroidVersionCode;
    }
    if(data.sdkIosVersionCode){
        insertDoc.sdkAndroidVersionCode = data.sdkIosVersionCode;
    }
    // 根据ip获取地区
    httpProvider.sendGet(config.ip_url + "?action=locateIP&ip=" + encodeURI(data.Ip), function(err, ipres) {
        var res = null;
        try {
            if(!err){
                res = JSON.parse(ipres.toString());
            }

        } catch (err) {

        }
        var area = "";
        if (!err && res && res.success && res.data) {
            area = res.data.nation + " " + res.data.province + (res.data.city == "*" ? "" : (" " + res.data.city));
            data.area = res.data.province || res.data.nation;
        } else {
            if(data.Platform == "sdk" || data.Platform == "weixin"){
                area = "";
            }else{
                area = "未知";
            }
            data.area = area;
        }
        insertDoc.area = area;

    if(data.Platform == "weixin"){
        mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne({_id:data.AccessId}, function(err, wechatConfig){
            console.log("==========sql 5 find weixin");
            if(!err && wechatConfig ){
                var robotData = {
                    account:data.Account,
                    platform:data.Platform,
                    robot: wechatConfig.robot,
                    sid: data.Sid,
                    msgType: data.MsgType
                };
                var peerId = getPeerId(wechatConfig.to_peer);
                peerId = data.ToPeer || peerId;
                insertDoc.toPeer = peerId;
                result.toPeer = insertDoc.toPeer;
                var welcomePushTime = wechatConfig.welcomePushTime;
                if(welcomePushTime == "claim"){
                    result.welcome_message = "";
                }else{
                    result.welcome_message = wechatConfig.welcome_msg || "";
                }
                exports.initSession(robotData, insertDoc, result, data, function(re){
                    callback(re);
                });
            }else{
                callback(result);
            }
        });
    }else{
        mongo.db().collection("app_kefu_im_config").findOne({accessId:data.AccessId}, function(err, imconfig){
            console.log("==========sql 5 find");
            if(!err && imconfig ){
                var robotData = {
                    account:data.Account,
                    platform:data.Platform,
                    robot: imconfig.robot,
                    sid: data.Sid,
                    noRobot:data.NoRobot
                };
                var peerId = getPeerId(imconfig.ToPeer);
                peerId = data.ToPeer || peerId;

                insertDoc.toPeer = peerId;
                result.toPeer = insertDoc.toPeer;
                data.ToPeer = peerId;
                result.welcome_message = imconfig.welcome;
                var vipAgent = null;
                if(data.OtherParams){
                    vipAgent =  data.OtherParams.agent;
                }
                //获取对应的agentId；
                if(vipAgent){
                    mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne({account: data.Account, exten: vipAgent}, function (err, dbUser) {
                        if(!err){
                            if(dbUser){
                                result.vipAgentId =dbUser._id;
                                insertDoc.vipAgentId =dbUser._id;
                            }
                            exports.initSession(robotData, insertDoc, result, data, function(re){
                                callback(re);
                            });
                        }else{
                            logger.app.error(err);
                            callback(re);
                        }
                    });
                }else{
                    exports.initSession(robotData, insertDoc, result, data, function(re){
                        callback(re);
                    });
                }
            }else{
                callback(result);
            }

        });

    }

    });
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
        autoClaimVersion: Math.random()+'_'+utils.getCurrentDateTime(), sName: data.NickName, leavemsg: true, msgCount:1, leakNum:1, userStatus: "offline", seoSource: data.SeoSource,
        seoKeywords: data.SeoKeywords, ip: data.Ip, manualTime: utils.getCurrentDateTime()};
    if(data.FromUrl){
        insertDoc.fromUrl = data.FromUrl;
    }
    if(data.UrlTitle){
        insertDoc.urlTitle = data.UrlTitle;
    }
    // 根据ip获取地区
    httpProvider.sendGet(config.ip_url + "?action=locateIP&ip=" + encodeURI(data.Ip), function(err, ipres) {
        var res = null;
        try {
            if(!err){
                res = JSON.parse(ipres.toString());
                }

        } catch (err) {

        }
        var area = "";
        if (!err && res && res.success && res.data) {
            area = res.data.nation + " " + res.data.province + (res.data.city == "*" ? "" : (" " + res.data.city));
            data.area = res.data.province || res.data.nation;
        }else{
            if(data.Platform == "sdk" || data.Platform == "weixin"){
                area = "";
            }else{
                area = "未知";
            }
            data.area = area;
        }
        insertDoc.area = area;


        mongo.db().collection("app_kefu_im_config").findOne({accessId:data.AccessId}, function(err, imconfig){
            console.log("==========sql 35 find");
            if(!err && imconfig ){
                var peerId = getPeerId(imconfig.ToPeer);
                peerId = data.ToPeer || peerId;
                insertDoc.toPeer = peerId;
                result.toPeer = insertDoc.toPeer;
                data.ToPeer = insertDoc.toPeer;
                data.sessionId = insertDoc._id;
                data.sid = insertDoc.sid;
                insertDoc.redisRecordDelayTime = utils.getCurrentDateTime();

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
                result.session_sid = insertDoc.sid;


                var vipAgent = null;
                if(data.OtherParams){
                    vipAgent =  data.OtherParams.agent;
                }
                //获取对应的agentId；
                if(vipAgent){
                    mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne({account: data.Account, exten: vipAgent}, function (err, dbUser) {
                        if(!err){
                            if(dbUser){
                                result.vipAgentId =dbUser._id;
                                insertDoc.vipAgentId =dbUser._id;
                            }
                            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).insert(insertDoc,{w:1},function (err) {
                                console.log("==========sql 36 insert");
                            });
                            callback(result);
                            var msg = {eventData: {Event:'NewWebchat', Account:data.Account, Data:data},vipAgentId:dbUser._id};
                            exports.assignAgent(msg, {queue:{Exten: insertDoc.toPeer}});
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).insert(insertDoc,{w:1},function (err) {
                        console.log("==========sql 36 insert");
                    });
                    callback(result);

                    var msg = {eventData: {Event:'NewWebchat', Account:data.Account, Data:data}};
                    exports.assignAgent(msg, {queue:{Exten: insertDoc.toPeer}});
                }
            }else{
                callback(result);
            }

        });



    });
    }

exports.initSession = function(robotData, insertDoc, result, data, callback){
    //没有技能组的会话不进行初始化
    if(insertDoc.toPeer){
        robotHandler.initRobot(robotData, function(err, robotSession){
            data.sessionId = insertDoc._id;
            if(err){
                var manualTime = utils.getCurrentDateTime();
                insertDoc.manualTime = manualTime;
                // result.manualTime传递至pushMsgToAgent方法中用于新会话的排队信息推送
                result.manualTime = manualTime;
                logger.app.error(err);
            }else{
                //机器人的处理
                insertDoc.status = "robot";
                insertDoc.serviceMan = "robot";
                insertDoc.robotCid = robotSession.cid;
                insertDoc.robotUid = robotSession.uid;
                insertDoc.robotSysNum = robotSession.sysNum;
                result.robotCid = robotSession.cid;
                result.robotUid = robotSession.uid;
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
            if(data.MsgType == 'newMsg' && !insertDoc.robotCid){
                if(data.NotShow != "true" && data.NotShow != true){
                    insertDoc.msgCount = 1;
                    insertDoc.totalMsgCount = 1;
                    insertDoc.lastCustomerMsgTimeStamp = utils.getCurrentDateTime()
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
            result.session_sid = insertDoc.sid;
            result.sessionVersion = insertDoc.autoClaimVersion;
            result.session_sName = insertDoc.sName;
            result.newSession = true;
            result.session_status = insertDoc.status;

            //将原来的未完成的对话都完结掉
            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
                .update({sid: data.Sid, status:{$nin:['finish','changePeer']}, leavemsg:{$ne: true}}, {$set:{status:'finish', leakNum:0}}, {multi:true, w:1}, function(err){
                    console.log("==========sql 8 update");
                    if(err){
                        result.message = 'update multi channel chat session failed!';
                        callback(result);
                        return;
                    }else{
                        //插入一条会话记录
                    if(insertDoc.status != "robot"){
                        insertDoc.redisRecordDelayTime = utils.getCurrentDateTime();
                    }
                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).insert(insertDoc, {w:1},function (err) {
                            logger.app.info("insert webchatsession :"+JSON.stringify(insertDoc));
                            console.log("==========sql 9 insert");
                            if(err){
                                result.message = 'insert multi channel chat session failed!';
                                callback(result);
                                return;
                            }
                            result.success = true;
                            callback(result);

                            ////单独更新,减少网络延迟带来的影响
                            //httpProvider.sendGet(config.ip_url + "?action=locateIP&ip=" + encodeURI(data.Ip), function(err, ipres) {
                            //    try {
                            //        console.log("========================id"+insertDoc._id);
                            //        console.log(ipres.toString());
                            //        var res = JSON.parse(ipres.toString());
                            //        if (!err && res.success && res.data != null) {
                            //            var area = res.data.nation + " " + res.data.province + (res.data.city == "*" ? "" : (" " + res.data.city));
                            //            console.log(area);
                            //            mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
                            //                .update({_id: insertDoc._id}, {$set:{area:area}}, function(err){console.log("------------");});
                            //        }
                            //    } catch (err) {}
                            //});

                            var multiChannelHistory = {
                                _id : insertDoc._id,
                                type: 'chat',
                                createTime: utils.getCurrentDate(),
                                status: 'chating',
                                platform: data.Platform
                            };
                        if(insertDoc.fromUrl){
                            multiChannelHistory.fromUrl = insertDoc.fromUrl;
                        }
                        if(insertDoc.urlTitle){
                            multiChannelHistory.urlTitle = insertDoc.urlTitle;
                        }
                            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).findOne({sid:data.Sid, account: data.Account,status: {$ne: 'delete'}}, function(err, relationDoc){
                                console.log("==========sql 10 find");
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
    }else{
        result.message = 'init failed:没有技能组信息';
        callback(result);
    }
}

function _checkQueue(msg, callback){
    var result = {success:false};
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: msg.eventData.Data.ToPeer}, function(err, queue){
            console.log("==========sql 27 find");
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
        console.log("==========sql 11 find");
        if(err || !doc){
            callback(result);
            return;
        }
        mongo.db(doc.dataDB).collection(account+"_history").insert(data, function(err){callback(result);});
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
    var update = { $set : { pushServerIp: data.ip, pushServerPort:data.port }};

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

    exports.notifyAssign(session, function(){});
    exports.pushByAccount(pushMsg, function(err){});

    //邮件处理+im会话处理
    emailHandler.countAgentDealEmailSession(session);

    var reportData = {
        reportTime: utils.getCurrentDate(),
        reportType: 'socketPushConnected',
        agentId: session.user._id,
        account: session.user.account
    };
    reportEvent.emitImReportEvent(reportData);
    result.success = true;
    callback(result);
    _dealEmailAutoClaimReport(session);

};
var _dealEmailAutoClaimReport = function(session){
    //坐席邮件相关信息入库  added by wangyn
    var find = {
        _id:session.user._id,
        account:session.user.account
    };
    mongo.db().collection(fields.APP_AGENT_AUTOCLAIM_INFO).findOne(find,function(err,agentInfo){
        if(!err){
            var currTime = utils.getCurrentDate();
            var setDoc = {
                _id:session.user._id,
                account:session.user.account,
                agentStatus:"online",
                lastClaimStatus:"close",
                connTime:currTime,
                lastClosedTime:currTime,
                lastOpenedTime:currTime
            };
            if(agentInfo && agentInfo.agentStatus == "online"){
                //挤掉后重新登录的数据处理
                var reportData = {
                    reportTime: currTime,
                    reportType: reportEvent.EventType.MAIL_AUTO_CLAIM_LENGTH,
                    agentId: session.user._id,
                    account: session.user.account,
                    status: agentInfo.lastClaimStatus== "open" ? "close" : "open" ,
                    lastMailStatusOpenedTime: agentInfo.lastOpenedTime,
                    lastMailStatusClosedTime: agentInfo.lastClosedTime
                };
                reportEvent.emitMailReportEvent(reportData);
            }
            //登录后更新数据
            mongo.db().collection(fields.APP_AGENT_AUTOCLAIM_INFO).update(find,setDoc,{upsert:true},function(err){});
        }
    });
};

exports.notifyAssign = function(session, callback){
    //登录了,则通知分配服务进行分配
    Thenjs(function(cont){
        exports.getImAccessId(null, session, function(result){
            cont(null, result);
        });
    }).then(function(cont, res){
        if(res.success && res.peers){
            var url = config.imAssignUrl+'?Action=notifyAssign&agent='+session.user._id+'&account='+session.user.account+'&peers='+ res.peers.toLocaleString();
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
};

/**
 * 批量推送
 * @param dataArr
 * @param session
 * @param callback
 */
exports.notifyDispatherServerBatch = function (dataArr, session, callback) {
    var funcName = '[MultiChannelHandler - notifyDispatherServerBatch]';
    var result = { success: false };
    var notifyArr = [];
    var postData = { type: 'webchat' };
    dataArr.forEach(function (data) {
        notifyArr.push({
            sid: data.sid,
            operation: data.operation, //值可以为 claim(领取)  redirect(转接)  finish(完结)
            user: data.userId,
            queueNum: data.queueNum || 0
        });
    });
    if (notifyArr.length === 0) {
        result.success = true;
        return callback(result);
    }
    postData.list = notifyArr;

    logger.app.info(funcName, JSON.stringify(postData));

    httpProvider.sendPost(config.multi_channel_dispatcher_url, "data=" + JSON.stringify(postData), function (err, res) {
        if (err) {
            result.message = funcName + 'Sent require to dispatcher server error: ' + JSON.stringify(postData);
            return callback(result);
        }

        result.success = true;
        return callback(result);
    });
};

exports.pushByAccount = function(msg, callback){
    var result = {success:false};
    mongo.db().collection('app_push_client').find({'user.account':msg.eventData.Account, _id: {$ne: msg.eventData.Data.userId}}).toArray(function(err, docs){
        var accept = false;
        var pushAgents = [];
        if(!err && docs && docs.length>0) {
            for (var i = 0; i < docs.length; i++) {
                if (!docs[i].status || docs[i].status != "close") {
                    accept = true;
                    pushAgents.push(docs[i]);
                }
            }
        }
        if(docs.length > 0){
            for(var i=0 ;i<docs.length;i++){
                var tmpMsg = utils.deepClone(msg);
                tmpMsg.userId = docs[i]._id;
                tmpMsg.pushServerIp = docs[i].pushServerIp;
                tmpMsg.pushServerPort = docs[i].pushServerPort;
                exports.pushLoginInfoToAgent(tmpMsg, function(){});
            }
        }
        result.success = true;
        callback(result);

    });

}

exports.pushLoginInfoToAgent = function(msg, callback){
    var result = {success:false};
    logger.app.info("require push server userId["+msg.userId+"] msg:"+ JSON.stringify(msg));
    var ip = msg.pushServerIp;
    var port = msg.pushServerPort;
    delete msg.pushServerIp;
    delete msg.pushServerPort;
    httpProvider.sendGet("http://"+ip+":"+port+"/push?msg="+ encodeURI(JSON.stringify(msg)), function(err, res){
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
            result.message = resData.message;
            callback(result);
            return;
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
    //if (data.platform == "weixin") {
        if (data.content && data.content != '') {
            data.content = encodeURIComponent(encodeURIComponent(data.content));
            httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(data), function (err, rep) {
                if (err) {
                    logger.app.warn('replyMsg to gateway failed!', err);
                    callback(result);
                } else {
                    var res = JSON.parse(rep);
                    if (res.success) {
                        result.success = true;
                        result.row = data;

                        // 将消息发送至索引服务器
                        var msgId = data._id;
                        var msgIndex = {
                            _id: data._id,
                            account: data.account,
                            sessionId: data.sessionId,
                            from: 'system',
                            when: utils.getCurrentDateTime(),
                            message: decodeURIComponent(decodeURIComponent(data.content))
                        };
                        esHandler.addMsgIndex(msgIndex, function (esRes) {
                            if (esRes.success) {
                                logger.app.info('create webchat message index successfully. msgId: ' + msgId);
                            } else {
                                logger.app.info('create webchat message index failed. msgId: ' + msgId);
                            }
                        });

                        callback(result);
                    } else {
                        logger.app.warn(result);
                        callback(result);
                    }
                }
            });
        } else {
            result.success = true;
            callback(result);
        }
    //}
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
        console.log("==========sql 21 find");
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
            mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).findOne({sid:chatSession.sid,status: {$ne: 'delete'}}, function(err, relationDoc){
                console.log("==========sql 22 find");
                if(err){

                }else{
                    if(relationDoc && relationDoc.customerId){
                        multiChannelHistory.customer = relationDoc.customerId;
                    }
                }
                setDoc['$set'] = multiChannelHistory;
                mongo.db(doc.dataDB).collection(chatSession.account+"_history").update(find, setDoc, function(err){console.log("==========sql 23 update");});
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
        console.log("==========sql 24 find");
        if(err){
            logger.app.err('查询客户满意度调查失败');

        }else{
            if(res){

            }else{
                mongo.db().collection("app_kefu_im_csr").insert(dbData,function (err) {
                    console.log("==========sql 25 insert");
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
                    console.log("==========sql 26 update");
                });
            }
        }
    });
};

exports.getImCsrConfig=function(data, callback){
    var result = {success:false};
    Thenjs(function(cont){
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne({sid: data.Sid,account:data.Account,status:{$nin: ['finish', 'changePeer']}, leavemsg:{$ne: true}}, cont);
    }).then(function(cont, session){
        if(!session){
            result.message = 'not found session';
            result.code = '10002';
            callback(result);
            return;
        }
        if(session.status == "undeal"){
            result.message = 'undeal status';
            result.code = '10007';
            callback(result);
            return;
        }
        if(session.status == "robot"){
            result.message = '机器人服务,无法评价';
            result.code = '10005';
            callback(result);
            return;
        }
        var csrCondition = {account: data.Account, sessionId:session._id};
        mongo.db().collection("app_kefu_im_csr").findOne(csrCondition, function(err, csr){
            if(err){
                result.message = err;
                result.code = '10003';//获取评价页面失败
                callback(result);
            }else{
                cont(null, csr);
            }

        });
    }).then(function(cont, csr){
        if(csr){
            result.code = "10004";
            result.message="已经评价过了";
            callback(result);
        }else{
            mongo.db().collection(fields.DB_APP_CHANNEL_DIC).findOne({type: "webchatCSR", account: data.Account}, function (err, dicInfo) {
                if (!err && dicInfo) {
                    result.csrDic = dicInfo.options;
                    result.success = true;
                    result.code = "10000";
                    callback(result);
                    return;
                } else {
                    result.code="10006";//没有配置评价项
                    callback(result);
                    return;
                }
            });
        }
    }).fail(function(cont, err){
        result.message = 'multi channel check session failed!';
        result.code = '10001';
        callback(result);
    });

}


exports.typeNoticeFromCustomer=function(data, callback){
    var result = {success:false};
    data.msgType = "typeNotice";
    var msg = {eventData: {Event:'NewWebchat', Account:data.Account, Data:data}};
    _checkWebchatSession(data, function(wsRes) {
        if (!wsRes.success) {
            callback(result);
            return;
        } else {
            //送达给座席处理
            if(wsRes.session){
                msg.eventData.Data._id = wsRes.session._id;
                pushMsgToAgent(data, wsRes, msg, result, callback);
            }else{
                callback(result);
            }
        }
    });
}
