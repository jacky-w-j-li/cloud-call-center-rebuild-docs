var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var sessionHandler = require(__baseDir + '/im/SessionHandler');
var fields = require(__baseDir + '/im/common/Fields');
var connectionHandler = require(__baseDir + '/im/ConnectionHandler');

exports.getUserInfo = function(data, connection, callback) {
    var result = {
        Succeed: false
    }
    result.UserInfo = connection.user;
    if(result.UserInfo.product == 'cc'){
        mongo.platformDb().collection(fields.DB_PLATFORM_CC_PBX).findOne({_id: connection.user.pbx}, function(err, doc){
            if(!err){
                if(doc){
                    result.UserInfo.pbxSipAddr = doc.sipAddr;
                    mongo.platformDb().collection(fields.DB_PLATFORM_SIPNUM).findOne({_id: connection.user.sipExten}, function(err, sipDoc){
                        if(!err){
                            if(sipDoc){
                                result.UserInfo.sipExtenSecret = sipDoc.secret;
                                result.Succeed = true;
                                callback(result);
                            }else{
                                result.Message = 'get user sipExten not found';
                                callback(result);
                            }
                        }else{
                            result.Message = 'get user sipExten failed';
                            callback(result);
                        }
                    });
                }else{
                    result.Message = 'user pbx not found';
                    callback(result);
                }
            }else{
                result.Message = 'get user pbx failed';
                callback(result);
            }
        });
    }else if(result.UserInfo.product == 'zj'){
        mongo.platformDb().collection(fields.DB_PLATFORM_PBX).findOne({_id: connection.user.pbx}, function(err, doc){
            if(!err){
                if(doc){
                    result.UserInfo.pbxSipAddr = doc.sipAddr;
                    mongo.platformDb().collection(fields.DB_PLATFORM_SIPNUM).findOne({_id: connection.user.sipExten}, function(err, sipDoc){
                        if(!err){
                            if(sipDoc){
                                result.UserInfo.sipExtenSecret = sipDoc.secret;
                                result.Succeed = true;
                                callback(result);
                            }else{
                                result.Message = 'get user sipExten not found';
                                callback(result);
                            }
                        }else{
                            result.Message = 'get user sipExten failed';
                            callback(result);
                        }
                    });
                }else{
                    result.Message = 'user pbx not found';
                    callback(result);
                }
            }else{
                result.Message = 'get user pbx failed';
                callback(result);
            }
        });
    }
};

exports.editUserInfo = function(data, connection, callback){
    var result = {
        Succeed: false
    }
    if(data.Product ==  'cc'){
        var postData = 'action=editUserForIm&json={"_id":"'+data._id+'","displayName":"'+data.DisplayName+'","email":"'
            +data.Email+'","mobile":"'+data.Mobile+'"}';
        httpProvider.sendPost(config.cc_server_url, postData, function (err, resData) {
            if (err) {
                logger.app.error(err);
                callback(err);
                return;
            }
            resData = JSON.parse(resData.toString());
            if (!resData.success) {
                var errorMessage = "Synchronize cc-server failure: " + resData.message;
                logger.app.error(errorMessage);
                if(resData.repeatList){
                    result.RepeatList = resData.repeatList;
                    result.Message = '408';
                }else{
                    result.Message = errorMessage;
                }
                callback(result);
                return;
            }else{
                result.Succeed = true;
                callback(result);
            }
        });
    }else if(data.Product == 'zj'){
        var postData = 'action=im.editAgentForIm&data={"_id":"'+data._id+'","displayName":"'+data.DisplayName+'","email":"'
            +data.Email+'","mobile":"'+data.Mobile+'"}';
        httpProvider.sendPost(config.yy_server_url, postData, function (err, resData) {
            if (err) {
                logger.app.error(err);
                callback(err);
                return;
            }
            resData = JSON.parse(resData.toString());
            if (!resData.success) {
                var errorMessage = "Synchronize yy-server failure: " + resData.message;
                logger.app.error(errorMessage);
                result.Message = errorMessage;
                callback(result);
                return;
            }else{
                result.Succeed = true;
                callback(result);
            }
        });
    }else{
        result.Message = 'user product not found';
        callback(result);
    }
};

exports.uploadIcon = function(data, connection, callback){
    var result = {
        Succeed: false
    }
    mongo.platformDb().collection(fields.DB_PLATFORM_USER).update({_id: connection.userId}, {$set:{im_icon:data.IconUrl}}, function(err){
        if(err){
            result.Message = err;
            callback(result);
            return;
        }
        mongo.db().collection(fields.DB_CONNECTION_SESSION).update({_id: connection._id}, {$set:{'user.im_icon':data.IconUrl}}, function(err){
            if(err){
                result.Message = err;
                callback(result);
                return;
            }
            mongo.platformDb().collection(fields.DB_IM_CONTACTS_VERSION).update(
                {Account:connection.account.account}
                ,{$set:{Account:connection.account.account,Version:utils.DateTime.getCurrentTimestamp()}}
                ,{upsert:true});
            result.Succeed = true;
            callback(result);
        });
    })
}