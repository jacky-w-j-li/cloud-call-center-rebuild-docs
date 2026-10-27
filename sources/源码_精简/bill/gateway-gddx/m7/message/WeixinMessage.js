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

    sendMsg : function (data , callback){
        var result = {success: false};
        var type = data.contentType || "text";
        switch (type){
            case "text":
                handler.sendText(data,result,callback);
                break;
            case "image":
                handler.sendImage(data ,result ,  callback);
                break;
            default :
                result.message = "unknown contentType [" + type + "]";
                callback(result);
        }
    },
    sendText: function (data, result, callback) {
        //入库
        var dbMessage = {
            _id : data._id,
            account : data.account,
            openID : data.openID,
            userID : data.userID,
            msgType : "text",
            type : "out",
            user : data.user,
            createTime : utils.getCurrentDate(),
            content : data.content,
            status : "undeal"
        };
        mongo.db().collection(fields.DB_APP_WEIXIN).insert(dbMessage,function(err){
            if(!err){
                //发送
                _impl.sendTextMessage(data,function(success){
                    if (success) {
                        mongo.db().collection(fields.DB_APP_WEIXIN).update({_id:data._id},{$set:{status:"deal"}});
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "微信发送异常！";
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
            _id : data._id,
            account : data.account,
            openID : data.openID,
            userID : data.userID,
            msgType : "image",
            type : "out",
            user : data.user,
            createTime : utils.getCurrentDate(),
            filePath : data.filePath,
            status : "undeal"
        }
        mongo.db().collection(fields.DB_APP_WEIXIN).insert(dbMessage,function(err){
            if(!err){
                _impl.sendImageMessage(data,function(success){
                    if (success) {
                        mongo.db().collection(fields.DB_APP_WEIXIN).update({_id:data._id},{$set:{status:"deal"}});
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "微信发送异常！";
                        callback(result);
                    }
                });
            } else {
                result.message = "消息存储异常";
                callback(result);
            }
        });
    }
};

var _impl = {
    sendImageMessage : function (data , callback) {
        var url = config.weixinUrl || "";
        var image = {
            openID : data.openID,
            userID : data.userID,
            msgType : "image",
            filePath : data.filePath
        };
        httpProvider.sendPost(url , JSON.stringify(image), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.statusCode == "000000"){
                callback(true);
            } else {
                callback(false);
            }
        });
    },

    sendTextMessage : function (data , callback){
        var url = config.weixinUrl || "";
        var text = {
            openID : data.openID,
            userID : data.userID,
            msgType : "text",
            content : encodeURIComponent(data.content)
        };
        httpProvider.sendPost(url , JSON.stringify(text), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.statusCode == "000000"){
                callback(true);
            } else {
                callback(false);
            }
        });
    }
};

module.exports = handler;
