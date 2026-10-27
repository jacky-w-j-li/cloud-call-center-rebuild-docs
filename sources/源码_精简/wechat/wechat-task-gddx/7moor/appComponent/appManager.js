var config = require(__baseDir + '/config');
var log = require('appLog');
var http = require('appHttp');
var utils = require('appUtil/Utils');
var db = require('appDb/MongoDb');
var Thenjs = require("thenjs");
var WXBizMsgCrypt = require('wechat-crypto');

var appCache = {};



var handler = {
    /**
     * 由于监测应用上线,无法知道到底是监测哪个应用,所有返回所有应用解密器
     * @param callback
     */
    getAllComponentCryptor : function(callback){
        var cryptors = [];
        Thenjs(function(cont){
            db.db().collection("component").find({}).toArray(cont);
        }).then(function(cont , dbApps){
            dbApps = dbApps || [];
            for(var i=0 ; i<dbApps.length;i++){
                var dbApp = dbApps[i];
                if(appCache[dbApp._id] && appCache[dbApp._id].cryptor && appCache[dbApp._id].cryptor.dbAppId){
                    cryptors.push(appCache[dbApp._id].cryptor);
                } else {
                    var cryptor = new WXBizMsgCrypt(dbApp.token, dbApp.encodingKey, dbApp._id);
                    cryptor.dbAppId = dbApp._id;
                    cryptors.push(cryptor);
                    appCache[dbApp._id] = appCache[dbApp._id] || {};
                    appCache[dbApp._id].cryptor = cryptor;
                }
            }
            callback(null ,cryptors);
        }).fail(function(cont , err){
            log.app.warn(err);
            callback(err);
        });
    },

    /**
     * 获取相应app的解密器
     * appId 有两种情况, 公众号  或者  第三方应用
     * 大多数情况属于公众号消息和事件,所以先判断是否是公众号
     */
    getAppCryptor : function(appId , callback){
        Thenjs(function(cont){
            db.db().collection("wxaccount").findOne({_id:appId},function(err , dbAccount){
                cont(err , dbAccount);
            });
        }).then(function(cont , dbAccount){
            if(dbAccount){
                appId = dbAccount.appId || config.defalutAppId;
            }
            if(appCache[appId] && appCache[appId].cryptor){
                callback(null , appCache[appId].cryptor);
            } else {
                db.db().collection("component").findOne({_id:appId},cont);
            }
        }).then(function(cont , dbApp){
            if(dbApp){
                var cryptor = new WXBizMsgCrypt(dbApp.token, dbApp.encodingKey, appId);
                callback(null , cryptor);
                appCache[appId] = appCache[appId] || {};
                appCache[appId].cryptor = cryptor;
            } else {
                cont(new Error("can not found appConfig by id [" + appId + "]"));
            }
        }).fail(function(cont , err){
            log.app.warn(err);
            callback(err);
        });
    }
};


module.exports = handler;





