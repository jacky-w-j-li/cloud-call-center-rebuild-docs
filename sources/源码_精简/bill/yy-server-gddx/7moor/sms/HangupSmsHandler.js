var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var dateUtils = require('appUtil/DateTime');
var logger = require('appLog');
var config = require('appConfig');
var constants = require(__baseDir + "/7moor/utils/Constants");
var handler = {
    sendZJHangupSms : function(data,callback){
        var result = {success: false};
        var findSms = {
            account : data.account,
            product : 'zj',
            isDefault : true
        }
        mongo.db().collection(constants.DB.platform_hangUp_sms_template).findOne(findSms, function(err,smsdoc){
            if(!err){
                if(smsdoc){
                    var findSign = {_id:smsdoc.sign};
                    mongo.db('cc').collection(constants.DB.cc.app_sms_sign).findOne(findSign, function(err,signDoc){
                        if(!err){
                            if(signDoc){
                                mongo.db().collection(constants.DB.platform_account).findOne({_id:data.account}, function(err,accDoc){
                                    if(err){
                                        result.message = "send sms check cc balance failed!";
                                        callback(result);
                                        return;
                                    }
                                    mongo.db().collection(constants.DB.platform_account_product).findOne({_id:data.account+'_zj'}, function(err,accProDoc){
                                        if(err){
                                            result.message = "获取账号总机产品失败!";
                                            callback(result);
                                            return;
                                        }
                                        if(accProDoc){
                                            var smsFee = 1000;
                                            if(accProDoc.smsFee){
                                                smsFee = accProDoc.smsFee;
                                            }
                                            var money = smsdoc.num * smsFee;
                                            if(money > accDoc.balance + accDoc.overdraw){
                                                result.message = "外呼资费不足，无法发送挂机短信！";
                                                callback(result);
                                                return;
                                            }

                                            mongo.db().collection(constants.DB.platform_sms_channel).findOne({forceSelect: true}, function(err, doc){
                                                if(doc){
                                                    smsdoc.smsChannel = doc._id;
                                                }else{
                                                    if(accProDoc.smsChannel){
                                                        smsdoc.smsChannel = accProDoc.smsChannel;
                                                    }else{
                                                        smsdoc.smsChannel = 'gdty';
                                                    }
                                                }

                                                smsdoc.splitCount = smsdoc.num;
                                                delete smsdoc.num;
                                                delete smsdoc['length'];
                                                delete smsdoc.title;
                                                delete smsdoc.isDefault;
                                                smsdoc._id = utils.UUID.generateUuid();
                                                smsdoc.createUser = 'system';
                                                smsdoc.account = data.account;
                                                smsdoc.m7Status = "ready";
                                                smsdoc.signDisplay = signDoc.name;
                                                smsdoc.sign = signDoc.subcode;
                                                smsdoc.submitTime = utils.DateTime.getCurrentDateTime();
                                                smsdoc.product = "zj";
                                                smsdoc.type = "send";
                                                smsdoc.num = data.num;
                                                mongo.db('cc').collection(constants.DB.cc.app_sms_send).insert(smsdoc, function(err){
                                                    if(err){
                                                        result.message = "sms insert cc db failed!";
                                                    }else{
                                                        result.success = true;
                                                        callback(result);
                                                    }
                                                });
                                            });
                                        }else{
                                            result.message = "未找到这个账号的总机产品!";
                                            callback(result);
                                            return;
                                        }
                                    });
                                });
                            }else{
                                result.message = "未找到这个签名!";
                                callback(result);
                                return;
                            }
                        }else{
                            result.message = "获取签名错误!";
                            callback(result);
                            return;
                        }
                    });
                }else{
                    logger.app.warn("该账号未配置总机的挂机短信！", err);
                    result.message = "该账号未配置总机的挂机短信！";
                    callback(result);
                }
            } else {
                logger.app.warn("取挂机短信内容失败！", err);
                result.message = "取挂机短信内容失败！";
                callback(result);
            }
        });
    }
};
module.exports = handler;

