/**
 * Created by zhangyang on 15/5/7.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var fields = require(__baseDir + '/m7/common/Fields');

var handler = {
    sendNewImMsg: function (data, callback) {
        var result = {success: false};
        var type = data.contentType || "text";
        if(!data.sid || data.sid == "undefined"){
            callback(result);
            return;
        }
        switch (type) {
            case "text":
                handler.sendNewText(data, result, callback);
                break;
            case "image":
                handler.sendNewImage(data, result, callback);
                break;
            case "file":
                handler.sendNewImage(data, result, callback);
                break;
            default :
                //result.message = "unknown contentType [" + type + "]";
                //callback(result);
        }
    },
    batchSendNewImMsg: function(data, callback){
        callback({success: true});
        var sids = data.sid;

        for(var i=0; i<sids.length; i++){
            var pushData = utils.deepClone(data);
            var sessionidUid = sids[i].split(",");

            pushData.sid = sessionidUid[0];
            pushData.sessionId = sessionidUid[1];
            handler.sendNewImMsg(pushData, function(){});
        }

    },
    sendNewText: function (data, result, callback) {
        //入库
        var dbMessage = {
            _id: data._id ||  utils.UUID.generateUuid(),
            sid: data.sid,
            contentType: data.contentType,
            type: "out",
            user: data.user || "",
            content: data.content,
            platform: data.platform,
            when: utils.getCurrentDateTime(),
            dateTime: utils.getCurrentDate(),
            status: "undeal",
            accessId: data.accessId || "",
            account: data.account || "",
            sessionId: data.sessionId || "",
            kefu: data.kefu || "",
            showHtml: data.showHtml || false
        };

                //发送
        var url = "";
        var sendData = undefined;
        if(data.platform == "pc" || data.platform == "wap" || data.platform == null){
            dbMessage.action="sendWebMsg";
            url = config.imPushUrl;
            dbMessage.content  = encodeURIComponent(data.content);
            sendData = "data="+JSON.stringify(dbMessage);
        }else if(data.platform == "sdk"){
            dbMessage.action="sendAppMsg";
            url = config.imPushUrl;
            dbMessage.content  = encodeURIComponent(data.content);
            sendData = "data="+JSON.stringify(dbMessage);
        } else if (data.platform == 'weixin') {
            dbMessage.action="sendMsg";
            dbMessage.kf_account = data.kf_account;
            url = config.weixinPushUrl;
            sendData = utils.deepClone(dbMessage);
            var content = _impl.adaptEmojiForWeixin(decodeURIComponent(sendData.content));
            sendData.content = encodeURIComponent(content);
        }
        dbMessage.message = decodeURIComponent(data.content);
        console.log("+++++++++++++++++++");
        delete dbMessage.content;
        delete dbMessage.action;
        mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).insert(dbMessage, function(err){
            _impl.sendNewTextMsg(url, sendData, function(data){
                if (data) {
                    logger.app.info("sendMsg:"+JSON.stringify(dbMessage));
                    result.success = true;
                    callback(result);
                } else {
                    result.message = "["+dbMessage.action+"]消息发送异常！";
                    callback(result);
                }
            });
        });
    },
    sendNewImage: function (data, result, callback) {
        //入库
        var dbMessage = {
            _id: data._id || utils.UUID.generateUuid(),
            sid: data.sid,
            contentType: data.contentType,
            content:decodeURIComponent(data.content),
            type: "out",
            user: data.user || "",
            platform: data.platform,
            when: utils.getCurrentDateTime(),
            dateTime: utils.getCurrentDate(),
            status: "undeal",
            accessId: data.accessId || "",
            account: data.account || "",
            sessionId: data.sessionId || "",
            kefu: data.kefu || "",
            showHtml: data.showHtml || false
        };

                //发送
        var url = "";
        var sendData = undefined;
        if(data.platform == "pc" || data.platform == "wap" || data.platform == null){
            dbMessage.action="sendWebMsg";
            url = config.imPushUrl;
            sendData = "data="+JSON.stringify(dbMessage);
        }else if(data.platform == "sdk"){
            dbMessage.action="sendAppMsg";
            url = config.imPushUrl;
            sendData = "data="+JSON.stringify(dbMessage);
        } else if (data.platform == 'weixin') {
            dbMessage.action="sendMsg";
            dbMessage.kf_account = data.kf_account;
            url = config.weixinPushUrl;
            sendData = utils.deepClone(dbMessage);
        }
        dbMessage.message = dbMessage.content;
        delete dbMessage.content;
        mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).insert(dbMessage, function(err){
            if(!err){
                _impl.sendNewTextMsg(url, sendData, function(data){
                    if (data) {
                        logger.app.info("sendMsg:"+JSON.stringify(dbMessage));
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "["+dbMessage.action+"]消息发送异常！";
                        callback(result);
                    }
                });
            }else{
                logger.app.error("sendMsg err:"+err);
                callback(err);
            }

        });
    },

    sendMsg: function (data, callback) {
        var result = {success: false};
        var type = data.contentType || "text";
        switch (type) {
            case "text":
                handler.sendText(data, result, callback);
                break;
            case "image":
                handler.sendImage(data, result, callback);
                break;
            default :
                result.message = "unknown contentType [" + type + "]";
                callback(result);
        }
    },
    sendText: function (data, result, callback) {
        //入库
        var dbMessage = {
            _id: data._id,
            account: data.account,
            userID: data.userID,
            user: data.user,
            msgType: "text",
            type: "out",
            createTime: utils.getCurrentDate(),
            content: data.content,
            status: "undeal"
        };
        mongo.db().collection(fields.DB_APP_IM).insert(dbMessage, function (err) {
            if (!err) {
                //发送
                _impl.sendTextMessage(data, function (success) {
                    if (success) {
                        mongo.db().collection(fields.DB_APP_IM).update({_id: data._id}, {$set: {status: "deal"}});
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "IM发送异常！";
                        callback(result);
                    }
                });
            } else {
                result.message = "消息存储异常";
                callback(result);
            }
        });

    },
    sendImage: function (data, result, callback) {
        var dbMessage = {
            _id: data._id,
            account: data.account,
            userID: data.userID,
            user: data.user,
            msgType: "image",
            type: "out",
            createTime: utils.getCurrentDate(),
            filePath: data.filePath,
            status: "undeal"
        }
        mongo.db().collection(fields.DB_APP_IM).insert(dbMessage, function (err) {
            if (!err) {
                _impl.sendImageMessage(data, function (success) {
                    if (success) {
                        mongo.db().collection(fields.DB_APP_IM).update({_id: data._id}, {$set: {status: "deal"}});
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "IM发送异常！";
                        callback(result);
                    }
                });
            } else {
                result.message = "消息存储异常";
                callback(result);
            }
        });
    },

    pushImCsrConfig:function(data,callback){
        var result = {success: false};
        var myData = {
            sid           : data.sid,
            isInvestigate : data.isInvestigate
        };
        myData.action="pushImCsrConfig";
        url = config.imPushUrl;
        var sendData = "data="+JSON.stringify(myData);
        _impl.pushImCSRMessage(url, sendData, function(res){
        });
    },

    /**
     * 主动向客户推送满意度调查
     * @param data
     * @param callback
     */
    pushImCSR:function(data,callback){
        var result = {success: false};
        var myData = {
            account   : data.account||"",
            user      : data.user || "",
            accessId  : data.accessId,
            sessionId : data.sessionId || "",
            platform  : data.platform,
            sid       : data.sid,
            action: 'sendSysMsg',
            operation: 'investigate'
        };

        //发送
        var url = config.imPushUrl;
        var sendData = "data="+JSON.stringify(myData);
        if (data.platform == 'weixin') {
            url = config.weixinPushUrl;
            myData.action = "pushImCSRInfo";
            sendData = utils.deepClone(myData);
        }

        //if(data.platform == "pc" || data.platform == "wap" || data.platform == null){
        //    myData.action="pushWebCSRMsg";
        //
        //}else if(data.platform == "sdk"){
        //
        //} else if (data.platform == 'weixin') {
        //
        //}
        _impl.pushImCSRMessage(url, sendData, function(res){
            if (res) {
                logger.app.info("sendMsg:"+JSON.stringify(myData));
                result.success = true;

                //var pushServiceUrl = config.pushServiceUrl;
                ////推送给状态服务器
                //var postData = {
                //    Action     : "NewWebchat",
                //    MessageId  : utils.UUID.generateUuid() ,
                //    message    : '评价已发出',
                //    Account    : data.account,
                //    Sid        : data.sid,
                //    AccessId   : data.accessId,
                //    MsgType    : "saveImCSRInfo",
                //    Platform   : data.platform,
                //    when       : utils.getCurrentDateTime(),
                //    createTime : utils.getCurrentDate()
                //};
                //var action = postData.Action;
                //delete postData.Action;
                //_impl.pushImCSRMessage(pushServiceUrl,"action=" + action + "&data=" + JSON.stringify(postData) , function(res){
                //
                //});

                callback(result);
            } else {
                result.message = "["+sendData.action+"]消息发送异常！";
                callback(result);
            }
        });
    }
};

var _impl = {
    emojiFaces : [
        [':smile:' , ':smiley:' , ':laughing:' , ':blush:'] ,
        [':heart_eyes:' , ':smirk:' , ':flushed:' , ':kissing_heart:'] ,
        [':grin:' , ':wink:' , ':stuck_out_tongue_winking_eye:' , ':stuck_out_tongue_closed eyes:'] ,
        [':sleeping:' , ':worried:' , ':expressionless:' , ':sweat_smile:'] ,
        [':joy:' , ':cold_sweat:' , ':sob:' , ':angry:'] ,
        [':mask:' , ':scream:' , ':sunglasses:' , ':heart:'] ,
        [':broken_heart:' , ':star:' , ':anger:' , ':exclamation:'] ,
        [':question:' , ':zzz:' , ':thumbsup:' , ':thumbsdown:'] ,
        [':ok_hand:' , ':punch:' , ':yeah:' , ':clap:'] ,
        [':muscle:' , ':pray:' , ':skull:' , ':trollface:']
    ] ,

    weixinEmojiCode : [
        ['\ue415' , '\ue057', '\ue40a', '\ue056'],
        ['\ue106', '\ue402', '\ue40d', '\ue418'],
        ['\ue404', '\ue405', '\ue105', '\ue409'],
        ['\ue408', '\ue058', '\ue403', '\ue415'],
        ['\ue412', '\ue40f', '\ue411', '\ue059'],
        ['\ue40c', '\ue107', '\ue414', '\ue022'],
        ['\ue023', '\ue32f', '\ue334', '\ue337'],
        ['\ue336', '\ue13c', '\ue00e', '\ue421'],
        ['\ue420', '\ue00d', '\ue011', '\ue41f'],
        ['\ue14c', '\ue41d', '\ue11c', '\ue10c']
    ],

    adaptEmojiForWeixin: function(content){
        for (var i = 0; i < _impl.emojiFaces.length; i++) {
            for (var j = 0; j < _impl.emojiFaces[i].length; j++) {
                var pattern = new RegExp(_impl.emojiFaces[i][j], "g");
                if (content == undefined || content == null || content == "") return;
                content = content.replace(pattern, _impl.weixinEmojiCode[i][j]);
            }
        }
        return content;
    },
    getSidByAccount: function (account, callback) {
        var condition = {
            _id: account + "_cc"
        };
        mongo.db('bill').collection(fields.DB_APP_ACCOUNT_PRODUCT).findOne(condition, function (err, accountObj) {
            if (!err && accountObj) {
                callback(accountObj.sid || "");
            } else {
                logger.app.error("not found sid by account[" + account + "]");
                callback(null);
            }
        });
    },

    sendImageMessage: function (data, callback) {
        var account = data.account;
        _impl.getSidByAccount(account, function (sid) {
            if (sid) {
                var url = config.imUrl || "";
                var image = {
                    _id: data._id,
                    sid: sid,
                    user: data.userID,
                    msgType: "image",
                    fileName: data.fileName,
                    content: data.filePath
                };
                httpProvider.sendPost(url, JSON.stringify(image), function (err, response) {
                    response = response || "{}";
                    response = JSON.parse(response);
                    if (!err && response.success) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                });
            } else {
                callback(false);
            }
        });
    },

    sendWeixinText: function(data, callback){
        var url = config.weixinPushUrl;
        data.action = "sendMsg";
        httpProvider.sendPost(url, data, function (err, response) {
            try {
                response = JSON.parse(response);
            } catch (e) {
                logger.app.error("parse response from pushServer error[" + JSON.stringify(data) + "]");
                callback(false);
                return;
            }

            if (!err && response == "success") {
                callback(true);
            } else {
                logger.app.error("push states error[" + data.sid + "]");
                callback(false);
            }
        });

    },

    sendNewTextMsg: function (url, data, callback) {
        httpProvider.sendPost(url, data, function (err, response) {
            if (!err) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    if(response == "success"){
                        callback(true);
                    }else{
                        callback(false);
                    }
                    return;
                }
                if(response.success){
                    callback(true);
                }else{
                    callback(false);
                }

            } else {
                logger.app.error("push states error");
                callback(false);
            }
        });
    },

    sendTextMessage: function (data, callback) {
        var account = data.account;
        _impl.getSidByAccount(account, function (sid) {
            if (sid) {
                var url = config.imUrl || "";
                var text = {
                    _id: data._id,
                    sid: sid,
                    user: data.userID,
                    msgType: "text",
                    content: data.content
                };
                httpProvider.sendPost(url, JSON.stringify(text), function (err, response) {
                    response = response || "{}";
                    response = JSON.parse(response);
                    if (!err && response.success) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                });
            } else {
                callback(false);
            }
        });
    },
    pushImCSRMessage: function (url,data, callback) {
        httpProvider.sendPost(url, data, function (err, response) {
            response = response || "{}";
            response = JSON.parse(response);
            if (!err && response.success) {
                callback(true);
            } else {
                callback(false);
            }
        });
    }


};

module.exports = handler;
