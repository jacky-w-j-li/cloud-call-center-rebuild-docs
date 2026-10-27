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

exports.initRobot = function(data, callback){
    if(!data.robot){
        callback("not open robot");
        return;
    }
    var url = config.robot_initUrl;
    var source = data.platform == "sdk" || data.platform == "weixin"? 1:2;
    var condition = {};
    if(typeof data.robot == "string"){
        condition._id= data.robot;
    }else{
        condition.account = data.account;
        condition.robot_type = "智齿";
    }
    mongo.db("cc").collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).findOne(condition, function(err, robot){

        if(err){
            callback("not found robot config:"+err);
        }else{
            if(robot && robot.robot_sysNum){
                url = url+"?sysNum="+robot.robot_sysNum+"&source="+source+"&partnerId="+ data.account;
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
            account: data.uid,
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
    var source = data.platform == "sdk" || data.platform == "weixin"? 1:2;

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
                        var answer = "回复序号即可得到对应问题的答案</br>";
                        for(var i = 1; i <= sugguestions.length; i++){
                            answer += i+":"+sugguestions[i-1]+"</br>";
                        }
                        result.answer = answer;
                        callback(null, "get robot answer success");
                    }

                }else{
                    callback("no answer");
                }

            }catch(e){
                logger.app.error(e);
            }
            if(result.answer){
                var replyMsg = {
                    sid: data.sid,
                    contentType: "text",
                    user: data.user,
                    content: result.answer,
                    platform: data.platform,
                    accessId: data.accessId,
                    account: data.uid,
                    sessionId: data.sessionId,
                    msgType: "newIm",
                    _id:utils.UUID.generateUuid(),
                    showHtml: true
                };
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
                callback(true);
            } else {
                logger.app.warn('replyMsg to gateway failed!', err);
                callback(false);
            }
        }
    });
};