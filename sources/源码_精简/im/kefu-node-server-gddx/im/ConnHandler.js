/**
 * Created by yaxi on 2015-07-27.
 */

var httpProvider = require("appHttp");
var utils = require('appUtil/Utils');
var config = require('appConfig').conf;
var logger = require('appLog');
var sessionHandler = require(__baseDir + '/im/SessionHandler');
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/im/common/Fields');
var crypto = require('crypto');
var stateHandler = require(__baseDir + '/im/StateHandler');

var connHandler = {
    validateAccessId: function (data, callback) {
        mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, function (err, imconfig) {
            if (!err && imconfig && imconfig.account) {
                callback({success: true});
            } else {
                callback({success: false});
            }
        });
    },

    disconnectSession: function (data, callback) {
        var result = {
            success: false
        };
        sessionHandler.disconnectSession(data, function (err, r) {
            if (err) {
                logger.app.error(err);
                result.message = err;
                callback(result);
            } else {
                //if(data.manual){
                //    console.log("==========");
                    var url = config.gatewayServiceUrl;
                    r.action = "imDisconnect";
                    r.actionId = utils.UUID.generateUuid();
                    logger.app.info("[disconnectSession][" + data._aid + "]request to dispather:" + JSON.stringify(r));
                    for(var key in r){
                        r[key] = encodeURIComponent(r[key]);
                    }
                    httpProvider.sendPost(url, "data=" + JSON.stringify(r), function (err, response) {
                        if (!err && response) {
                            logger.app.info("[disconnectSession][" + data._aid + "]success from dispather");
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("[disconnectSession][" + data._aid + "]error from dispather");
                            result = {success: false, message: "error from dispather"};
                            callback(result);
                        }
                    });
                //}else{
                //    console.log("----------");
                //    result.success = true;
                //    callback(result);
                //}

            }

        });
    },

    getNewChat: function (data, callback) {
        var key = data.key;
        utils.decipher(config.cryptoAlgorithm, config.cryptoKey, key, function (decryptedData) {
            data.port = decryptedData.split(":")[1];
            data.serverIp = decryptedData.split(":")[0];
            sessionHandler.createSession(data, function (sessionData) {
                if (!sessionData.success) {
                    callback(sessionData);
                    return;
                }
                var url = config.gatewayServiceUrl;
                var postData = {
                    action: "imConn",
                    sid: sessionData.sid,
                    account: sessionData.account,
                    actionId: utils.UUID.generateUuid(),
                    accessId: data.accessId,
                    platform: data.platform,
                    nickName: sessionData.nickName,
                    fromUrl: data.fromUrl,
                    urlTitle:data.urlTitle,
                    isNewVisitor: sessionData.isNewVisitor || false,
                    toPeer: data.toPeer || "",
                    seoSource: sessionData.seoSource,
                    seoKeywords: sessionData.seoKeywords,
                    ip: sessionData.ip,
                    noRobot:data.noRobot
                };
                for(var key in postData){
                    postData[key] = encodeURIComponent(postData[key]);
                }
                if(data.otherParams){
                    postData.otherParams = JSON.parse(data.otherParams);
                }
                logger.app.info("[getNewChat][" + data._aid + "]request to dispather:" + JSON.stringify(postData));
                sessionData.createTimeStamp = utils.getCurrentDateTime();
                httpProvider.sendPost(url, "data=" + JSON.stringify(postData), function (err, response) {
                    if (!err && response) {
                        var result = sessionData;
                        delete result.account;
                        callback(result);
                    } else {
                        logger.app.error("[getNewChat][" + data._aid + "]error from dispather");
                        var result = {success: false, message: "error from dispather"};
                        callback(result);
                    }
                });
            });
        });

    },

    convertManual: function (data, callback) {
        var result = {success: false};
        var url = config.gatewayServiceUrl;
        var postData = {
            action: "convertManual",
            sid: data.sid,
            actionId: utils.UUID.generateUuid()
        };
        mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne({_id: data.sid}, function (err, doc) {
            if (err || !doc) {
                result.message = "not found session";
                callback(result);
            } else {
                logger.app.info("[convertManual][" + data._aid + "]request to dispather:" + JSON.stringify(postData));
                postData.platform = doc.platform;
                postData.accessId = doc.accessId;
                postData.account = doc.account;
                postData.nickName = doc.username;
                for(var key in postData){
                    postData[key] = encodeURIComponent(postData[key]);
                }
                httpProvider.sendPost(url, "data=" + JSON.stringify(postData), function (err, response) {
                    if (!err && response) {
                        var res = JSON.parse(response);
                        if (res.success) {
                            result.success = true;
                        }
                        callback(result);
                    } else {
                        logger.app.error("[getNewChat][" + data._aid + "]error from dispather", err);
                        result.success = false;
                        result.message = "error from dispather";
                        callback(result);
                    }
                });
            }
        });
    },
    acceptOtherAgent: function (data, callback) {
        var result = {success: false};
        var sid = data.sid;
        var accessId = data.accessId;
        var condition = {
            sid:sid,
            status:"undeal",
            leavemsg:{$ne: true}
        };
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(condition, function (err, ws) {
            if(!err){
                if(ws){
                    //关闭上一次vip会话
                    var disconnSet = {sBreakTime:utils.getCurrentDateTime(), userStatus: "offline"};
                    disconnSet.status = "finish";
                    disconnSet.leakNum=0;
                    disconnSet.finishUser = "system";
                    disconnSet.finishReason="vip assign failed";
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({_id:ws._id ,account: ws.account, status:"undeal", leavemsg:{$ne: true}}, {$set:disconnSet},{w:1},function(err){
                        if(!err){
                            result.success =true;
                            callback(result);
                        }else{
                            callback(result);
                        }
                    });
                }else{
                    result.success =true;
                    callback(result);
                }

            }else{
                callback(result);
            }
        })
    }

};

module.exports = connHandler;

