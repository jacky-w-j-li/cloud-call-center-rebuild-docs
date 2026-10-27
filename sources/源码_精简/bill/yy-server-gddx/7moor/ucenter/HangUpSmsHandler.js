var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");

var handler = {
    getHangUpSmsTemplateAndSet:function(data, session, callback) {
        var result = {success: false,productInfo:null};
        var account = session.account._id;
        var product = data.product;
        var query={
            account : account,
            product : product
        };
        mongo.db().collection(constants.DB.platform_hangUp_sms_template).find(query).toArray(function (err, docs) {
            if (!err) {
                if(docs && docs.length >0){//存在模板
                    var signIds = new Array();
                    for(var i=0;i<docs.length;i++){
                        var id = docs[i].sign;
                        docs[i].signName = '';
                        docs[i].signSubcode =  '';
                        signIds.push(id);
                    }
                    mongo.db("cc").collection(constants.DB.app_sms_sign).find({_id:{$in:signIds}}).toArray(function(err,signs){
                        if(!err){
                            for(var i=0;i<signs.length;i++){
                                var sign = signs[i];
                                for(var index=0;index<docs.length;index++){
                                    var doc = docs[index];
                                    if(doc.sign == sign._id){
                                        docs[index].signName = sign.name || "";
                                        docs[index].signSubcode = sign.subcode || "";
                                    }
                                }
                            }
                            mongo.db().collection(constants.DB.platform_account_product).findOne({_id:account+"_"+product},function(err,product){
                                if(!err){
                                    result.productInfo=product || [];

                                    result.list = docs||[];
                                    result.success=true;
                                    callback(result);
                                }else{
                                    logger.app.error(err);
                                    result.message = '获取挂机短信信息失败！';
                                    callback(result);
                                }
                            });
                        }else{
                            logger.app.error(err);
                            result.message = '获取短信签名信息失败！';
                            callback(result);
                        }
                    });
                }else{//模板不存在
                    mongo.db().collection(constants.DB.platform_account_product).findOne({_id:account+"_"+product},function(err,product){
                        if(!err){
                            result.productInfo=product || [];

                            result.list = [];
                            result.success=true;
                            callback(result);
                        }else{
                            logger.app.error(err);
                            result.message = '获取挂机短信信息失败！';
                            callback(result);
                        }
                    });
                }

            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    saveHangUpSmsSet:function(data, session, callback){
        var result = {success: false};
        var set={
            hangUpSms:{
                callIn:data.callIn,
                callOut:data.callOut
            }
        };
        var id=data._id;
        mongo.db().collection(constants.DB.platform_account_product).findAndModify({_id:id},[],{$set:set},{new:true},function(err,row){
            if(!err){
                var doc={
                    pbx:row.pbx[0].pbx,
                    account:row.account,
                    smsIn:data.callIn||false,
                    smsOut:data.callOut||false
                }
                syncAcs.setHangupSms(doc,function(isSuccess){
                    if(isSuccess){
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error("saveHangUpSmsSet同步acs失败");
                        result.message="同步acs失败";
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.message = '挂机短信设置失败！';
                callback(result);
            }
        });
    },
    updateDefaultTemplate : function(data,session,callback){
        var result = {success: false};
        var id=data._id;
        var account=data.account;
        var product=data.product;

        var set={
            isDefault:true
        };
        mongo.db().collection(constants.DB.platform_hangUp_sms_template).update({_id:id}, {$set:set}, function (err) {
            if(!err){
                var query = {isDefault: true,account:account,product:product, _id: {$ne: id}};
                mongo.db().collection(constants.DB.platform_hangUp_sms_template).update(query, {$set:{isDefault:false}}, function (err) {
                    if(!err){
                        mongo.db().collection(constants.DB.platform_account_product).update({_id:account+"_"+product}, {$set:{hangUpSmsTemplate:id}}, function (err) {
                            if(!err){
                                result.success=true;
                                callback(result);
                            }else{
                                logger.app.error(err);
                                result.message = '设置默认挂机短信模板异常！';
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err);
                        result.message = '设置默认挂机短信模板异常！';
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.message = '设置默认挂机短信模板异常！';
                callback(result);
            }
        });
    },
    deleteTemplate : function(data,session,callback){
        var result = {success: false};
        var id=data;
        mongo.db().collection(constants.DB.platform_hangUp_sms_template).findOne({_id:id},function(err,template) {
            if (!err && template) {
                if(template.isDefault == true){
                    result.message = '不能删除默认模板！';
                    callback(result);
                }else{
                    mongo.db().collection(constants.DB.platform_hangUp_sms_template).remove({_id:id},function(err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("deleteTemplate  error", err);
                            result.message = "删除挂机短信模板异常！";
                            callback(result);
                        }
                    });
                }
            } else {
                logger.app.error(err);
                result.message = '删除模板失败！';
                callback(result);
            }
        });
    },
    getSmsSignCache: function (session,callback){
        var account=session.account._id;
        mongo.db("cc").collection(constants.DB.app_sms_sign).find({account:account,status:1}).toArray(function(err,signs){
            if (!err) {
                var signs = signs || [];
                callback(null, signs);
            } else {
                callback(err);
            }
        });

    },
    addHangUpSmsTemplate:function(data,session,callback){
        var result = {success: false};
        var sign = data.sign;
        var signAry = sign.split("_");
        var signSubcode = signAry[0];
        var signName = signAry[1];
        var account = session.account._id;
        var product = data.product;
        mongo.db("cc").collection(constants.DB.app_sms_sign).findOne({account:account,name:signName,subcode:signSubcode},function(err,onesign){
            if (!err && onesign) {
                data.sign = onesign._id;

                data.account = account;
                var isDefault = data.isDefault;
                data.isDefault = false;

                var id = utils.UUID.generateUuid();
                data._id = id;

                mongo.db().collection(constants.DB.platform_hangUp_sms_template).insert(data,function(err){
                    if(!err){
                        if(isDefault != 'true'){
                            result.success = true;
                            callback(result);
                        }else{
                            var info = {
                                _id : id,
                                account : account,
                                product : product
                            };
                            handler.updateDefaultTemplate(info,session,function(rep){
                                if(rep.success){
                                    result.success = true;
                                    callback(result);
                                }else{
                                    result.message = rep.message;
                                    callback(result);
                                }
                            });
                        }
                    }else{
                        logger.app.error(err);
                        result.message = '添加模板异常！';
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                result.message = '短信签名异常：找不到该签名！';
                callback(result);
            }
        });
    },
    getTemplateById : function(data,session,callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_hangUp_sms_template).findOne({_id:data},function(err,template) {
            if (!err && template) {
                result.success = true;
                result.template=template;
                callback(result);
            }else{
                logger.app.error(err);
                result.message = '获取模板信息异常！';
                callback(result);
            }
        });
    },
    updateHangUpSmsTemplate : function(data,session,callback){
        var result = {success: false};
        var sign = data.sign;
        var signAry = sign.split("_");
        var signSubcode = signAry[0];
        var signName = signAry[1];
        var account = session.account._id;
        mongo.db("cc").collection(constants.DB.app_sms_sign).findOne({account:account,name:signName,subcode:signSubcode},function(err,onesign){
            if (!err && onesign) {
                var isDefault = data.isDefault;
                if(isDefault == 'true'){
                    data.isDefault = true;
                }else{
                    data.isDefault = false;
                }
                var set={
                    title:data.title,
                    content:data.content,
                    sign:onesign._id,
                    num:data.num,
                    length:data.length,
                    product:data.product,
                    isDefault:data.isDefault
                };

                mongo.db().collection(constants.DB.platform_hangUp_sms_template).update({_id:data._id},{$set:set},function(err){
                    if(!err){
                        if(isDefault != 'true'){
                            result.success = true;
                            callback(result);
                        }else{
                            var info = {
                                _id : data._id,
                                account : account,
                                product : data.product
                            };
                            handler.updateDefaultTemplate(info,session,function(rep){
                                if(rep.success){
                                    result.success = true;
                                    callback(result);
                                }else{
                                    result.message = rep.message;
                                    callback(result);
                                }
                            });
                        }
                    }else{
                        logger.app.error(err);
                        result.message = '添加模板异常！';
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.message = '短信签名异常：找不到该签名！';
                callback(result);
            }
        });

    }

};

module.exports = handler;