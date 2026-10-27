/**
 * xulk 2015-11-17
 * 处理微信菜单的消息
 * @type {exports|module.exports}
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var fields = require(__baseDir + '/m7/common/Fields');

var handler = {
    getMenu:function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid : data._id,
            account : data.account,
            user : data.user,
            createTime : utils.getCurrentDate(),
            action : "getMenu"
        };
        //发送
        _impl.getMenuMessage(sendMessage,function(status,menus){
            if (status) {
                result.success = true;
                result.menus = menus;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });

    },
    saveMenu:function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid : data._id,
            account : data.account,
            user : data.user,
            createTime : utils.getCurrentDate(),
            action : "saveMenu",
            menus  : data.menus,
            events  : data.events
        };
        logger.app.info(JSON.parse(decodeURIComponent(data.events)));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.saveMenuMessage(sendMessage,function(status){
            if (status) {
                result.success = true;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    },
    saveMaterial: function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid       : data._id,
            account     : data.account,
            user        : data.user,
            type        : data.type,
            content     : data.url,
            contentType : data.contentType,
            createTime  : utils.getCurrentDate(),
            action      : "saveMaterial"
        };
        logger.app.info(JSON.stringify(data));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.saveMaterialMessage(sendMessage,function(status,rep){
            if (status) {
                result.success = true;
                result.data = rep;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    },
    uploadImage: function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid       : data._id,
            account     : data.account,
            user        : data.user,
            content     : data.content,
            contentType : data.contentType,
            createTime  : utils.getCurrentDate(),
            action      : "uploadImage"
        };
        logger.app.info(JSON.stringify(data));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.uploadImageMessage(sendMessage,function(status){
            if (status) {
                result.success = true;
                result.data = res;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    },
    saveNewsMaterial: function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid       : data._id,
            account     : data.account,
            user        : data.user,
            news        : data.news,
            createTime  : utils.getCurrentDate(),
            action      : "saveNewsMaterial"
        };
        logger.app.info(JSON.stringify(data));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.saveNewsMaterialMessage(sendMessage,function(status,rep){
            if (status) {
                result.success = true;
                result.data = rep;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    },
    getMaterialCount: function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid       : data._id,
            account     : data.account,
            user        : data.user,
            createTime  : utils.getCurrentDate(),
            action      : "getMaterialCount"
        };
        logger.app.info(JSON.stringify(data));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.getMaterialCountMessage(sendMessage,function(status){
            if (status) {
                result.success = true;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    },
    updateNewsMaterial: function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid       : data._id,
            account     : data.account,
            user        : data.user,
            mediaId     : data.mediaId,
            index       : data.index || 0,
            news        : data.news,
            createTime  : utils.getCurrentDate(),
            action      : "updateNewsMaterial"
        };
        logger.app.info(JSON.stringify(data));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.updateNewsMaterialMessage(sendMessage,function(status){
            if (status) {
                result.success = true;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    },
    removeMaterial: function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid       : data._id,
            account     : data.account,
            user        : data.user,
            mediaId     : data.mediaId,
            createTime  : utils.getCurrentDate(),
            action      : "removeMaterial"
        };
        logger.app.info(JSON.stringify(data));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.removeMaterialMessage(sendMessage,function(status){
            if (status) {
                result.success = true;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    },
    getMaterial: function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid       : data._id,
            account     : data.account,
            user        : data.user,
            mediaId     : data.mediaId,
            createTime  : utils.getCurrentDate(),
            action      : "getMaterial"
        };
        logger.app.info(JSON.stringify(data));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.getMaterialMessage(sendMessage,function(status,data){
            if (status) {
                result.success = true;
                result.data = data;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    },
    getMaterials: function(data,callback){
        var result = {success: false};
        var sendMessage = {
            appid       : data._id,
            account     : data.account,
            user        : data.user,
            type        : data.type,
            offset      : data.offset,
            count       : data.count,
            createTime  : utils.getCurrentDate(),
            action      : "getMaterials"
        };
        logger.app.info(JSON.stringify(data));
        //var  sendData = utils.deepClone(dbMessage);
        //发送
        _impl.getMaterialsMessage(sendMessage,function(status,res){
            if (status) {
                result.success = true;
                result.data = res;
                callback(result);
            } else {
                result.message = "微信发送异常！";
                callback(result);
            }
        });
    }


};
/**
 * 处理发送消息和接受消息的接口
 * @type {{getMenuMessage: Function, createMenuMessage: Function, deleteMenuMessage: Function}}
 * @private
 */
var _impl = {
    getMenuMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err){
                callback(true,response);
            } else {
                callback(false,err);
            }
        });
    },
    saveMenuMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.success){
                callback(true);
            } else {
                callback(false);
            }
        });
    },
    saveMaterialMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = JSON.parse(response || "{}");
            if(!err && response.success){
                callback(true,response.data);
            } else {
                callback(false);
            }
        });
    },
    uploadImageMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.success){
                callback(true,response.data);
            } else {
                callback(false);
            }
        });
    },
    saveNewsMaterialMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = JSON.parse(response || "{}");
            if(!err && response.success){
                callback(true,response.data);
            } else {
                callback(false);
            }
        });
    },
    getMaterialCountMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.success){
                callback(true,response.data);
            } else {
                callback(false);
            }
        });
    },
    updateNewsMaterialMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.success){
                callback(true,response.data);
            } else {
                callback(false);
            }
        });
    },
    removeMaterialMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.success){
                callback(true,response.data);
            } else {
                callback(false);
            }
        });
    },
    getMaterialMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.success){
                callback(true,response.data);
            } else {
                callback(false);
            }
        });
    },
    getMaterialsMessage:function(data,callback){
        var url = config.weixinPushUrl || "";
        httpProvider.sendPost(url , JSON.stringify(data), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.success){
                callback(true,response.data);
            } else {
                callback(false);
            }
        });
    }

};

module.exports = handler;
