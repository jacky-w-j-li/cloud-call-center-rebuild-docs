/**
 * Created by zengyx on 16/3/10.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var nodeUtil = require('util');
var uuid = require('appUtil/UUID');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var esHandler = require(__baseDir + '/dishui/common/ElasticSearchHandler');

exports.initRobot = function(data, callback){
    if(!data.robot){
        callback("not open robot");
        return;
    }
    if(data.noRobot=="true"){
        callback("vip accept otherPeer");
        return;
    }
    //处理直接转人工会话 未处理
    if(data.platform == "weixin" && data.msgType=="convertManual"){
        callback("转人工会话操作");
        return;
    }
    var url = config.robot_initUrl;
    var source = data.platform == "sdk" || data.platform == "weixin"? 2:1;
    var condition = {};
    if(typeof data.robot == "string"){
        condition._id= data.robot;
    }else{
        condition.account = data.account;
        condition.robot_type = "智齿";
    }
    mongo.db("cc").collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).findOne(condition, function(err, robot){
        console.log("==========sql 7 find");

        if(err){
            callback("not found robot config:"+err);
        }else{
            if(robot && robot.robot_sysNum){
                url = url+"?sysNum="+robot.robot_sysNum+"&source="+source+"&partnerId="+ data.sid;
                console.log(url);
                httpProvider.sendPost(url, "", function (err, rep) {
                    var robotMsg = {
                        sid: data.sid,
                        operation: "robot",
                        platform: data.platform,
                        user: "robot"
                    };
                    if (err || !rep) {
                        logger.app.warn('init robot failed!', err);
                        callback("init robot failed");
                        robotMsg.initSuccess = false;
                    } else {
                        var res = undefined;
                        try{
                            res = JSON.parse(rep);
                        }catch (e){
                            logger.app.error(e);
                        }
                        if(!res){
                            callback("init robot failed");
                            return;
                        }
                        if (res.cid) {
                            callback(null, {cid:res.cid, uid:res.uid, sysNum:robot.robot_sysNum});
                        } else {
                            logger.app.warn("not get cid");
                            callback("not get cid");
                        }
                        robotMsg.initSuccess = true;
                    }
                    exports.sendRobotInitMsg(robotMsg, function(err){
                        if(err){
                            logger.app.info("send robot sysmsg success");
                        }else{
                            logger.app.warn("send robot sysmsg fail");
                        }
                    });
                });
            }else{
                callback("not found robot config");
            }
        }
    });
};


exports.getRobotAnswer = function(data, callback){
    if(!data.question){
        callback(true);
        return;
    }
    if(data.contentType != "text"){
        var replyMsg = {
            sid: data.sid,
            contentType: "text",
            user: data.user,
            content: "小智现在只支持文本的回答",
            platform: data.platform,
            accessId: data.accessId,
            account: data.account,
            sessionId: data.sessionId,
            msgType: "newIm",
            _id:utils.UUID.generateUuid(),
            showHtml: false
        };
        exports.replyRobotMsg(replyMsg, function(response){
            if(response){
                logger.app.info("send msg success");
            }else{
                logger.app.warn("send msg error");
            }
        });
        return;
    }
    var url = config.robot_sendUrl;
    var source = data.platform == "sdk" || data.platform == "weixin" ? 2 : 1;

    var question = data.question;
    url = url + "?sysNum="+data.sysNum+"&requestText="+question+"&cid="+data.cid+"&uid="+data.uid+"&source="+source;
    logger.app.info(url);
    httpProvider.sendPost(url, "", function (err, rep) {
        if (err && !rep) {
            logger.app.warn('init robot failed!', err);
            callback("not get answer");
        } else {
            var result = {};
            try{
                var res = JSON.parse(rep);
                var answerType = res.answerType;
                if(answerType == 1){
                    result.answer = res.answer;
                    callback(null, result);
                }else if(answerType == 2){
                    result.answer = res.answer;
                    callback(null, result);
                }else if(answerType == 3 || answerType == 4){
                    var sugguestions = res.sugguestions;
                    if(!sugguestions){
                        result.answer = res.answer;
                        callback(null, "get robot answer success");
                    }else{
                        var lineChar = "</br>";
                        if(data.platform == "sdk" || data.platform == "weixin"){
                            lineChar = "\n";
                        }
                        var title = "回复序号即可得到对应问题的答案";
                        if(answerType == 4){
                            title = "根据您的问题,为您推荐以下关联问题,回复序号即可得到对应问题的答案";
                        }
                        var answer = res.answer+lineChar+title+lineChar;
                        for(var i = 1; i <= sugguestions.length; i++){
                            answer += i+":"+sugguestions[i-1]+lineChar;
                        }
                        result.answer = answer;
                        callback(null, "get robot answer success");
                    }
                }else{
                    //由于机器人的cid会失效，来自微信的会话需要单独处理
                    /*if (data.platform == "weixin") {
                        var replyMsg = {
                            sid: data.sid,
                            contentType: "text",
                            user: "system",
                            content: "由于您长时间没有跟机器人进行会话，机器人服务已断开，请进行转人工操作",
                            platform: data.platform,
                            accessId: data.accessId,
                            account: data.uid,
                            sessionId: data.sessionId,
                            msgType: "newIm",
                            _id: utils.UUID.generateUuid(),
                            showHtml: false
                        };
                        exports.replyRobotMsg(replyMsg, function (response) {
                            if (response) {
                                logger.app.info("send msg success");
                            } else {
                                logger.app.warn("send msg error");
                            }
                        });
                    }*/
                    callback("noAnswer");
                }
            }catch(e){
                logger.app.error(e);
            }
            if(result.answer){
                var replyMsg = {
                    sid: data.sid,
                    contentType: "text",
                    user: data.user,
                    content: encodeURIComponent(encodeURIComponent(result.answer)),
                    platform: data.platform,
                    accessId: data.accessId,
                    account: data.account,
                    sessionId: data.sessionId,
                    msgType: "newIm",
                    _id:utils.UUID.generateUuid(),
                    showHtml: true
                };
                console.log(replyMsg);
                exports.replyRobotMsg(replyMsg, function(response){
                    if(response){
                        logger.app.info("send msg success");
                    }else{
                        logger.app.warn("send msg error");
                    }
                });
            }
        }
    });

};


exports.sendRobotInitMsg = function(data, callback){
    data.type = "webchat";
    httpProvider.sendPost(config.multi_channel_dispatcher_url, "data=" + JSON.stringify(data), function (err, rep) {
        if (err) {
            logger.app.warn('replyRobotMsg to dispatcher failed!', err);
            callback(false);
        } else {
            var res = JSON.parse(rep);
            if (res.success) {
                callback(true);
            } else {
                logger.app.warn('replyRobotMsg to dispatcher failed!', res.message);
                callback(false);
            }
        }
    });
};


exports.replyRobotMsg =function (data, callback) {
    httpProvider.sendPost(config.msgUrl + "sendMessage", "data=" + JSON.stringify(data), function (err, rep) {
        if (err) {
            logger.app.warn('replyMsg to gateway failed!', err);
            callback(false);
        } else {
            var res = JSON.parse(rep);
            if (res.success) {
                // 将消息发送至索引服务器
                var msgId = data._id;
                var msgIndex = {
                    _id: data._id,
                    account: data.account,
                    sessionId: data.sessionId,
                    from: 'robot',
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

                callback(true);
            } else {
                logger.app.warn('replyMsg to gateway failed!', err);
                callback(false);
            }
        }
    });
};