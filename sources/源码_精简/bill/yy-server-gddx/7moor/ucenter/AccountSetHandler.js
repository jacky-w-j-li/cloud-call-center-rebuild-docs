var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    updatePwd: function (data,session, callback) {
        var result = {success: false};
        var aid=session.account._id;
        var query={_id:aid};

        mongo.db().collection(constants.DB.platform_account).findOne(query,function(err,row){
            if(!err){
                if(row){
                    if(row.managerPassword==data.oldPwd){
                        var set={managerPassword:data.newPwd};
                        mongo.db().collection(constants.DB.platform_account).update(query,{$set:set},function(err){
                            if(!err){
                                result.success = true;
                                callback(result);
                            }else{
                                logger.app.error(err.stack);
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error('当前的密码输入错误');
                        result.message="当前的密码输入错误！";
                        callback(result);
                    }
                }else{
                    logger.app.error('不存在的账号');
                    result.message="不存在的账号！";
                    callback(result);
                }
            }else{
                logger.app.error(err.stack);
                callback(result);
            }
        });
    },
    queryAccProduct: function (data, session, callback) {
        var result = {success: false};
        var condition = data||{};
        condition.account=session.account._id;
        utils.removeEmptyProperty(condition);
        mongo.db().collection(constants.DB.platform_account_product).find(condition).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(constants.DB.platform_product).find().toArray(function (err, products) {
                    if (!err) {
                        result.products = products;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },


    saveNotifyConfig: function (data, session, callback) {
        var result = {success: false};
        var id =session.account._id;
        data.dialAlert=data.dialAlert||0;
        data.dialAlert=parseInt(data.dialAlert,10);
        mongo.db().collection(constants.DB.platform_account).findOne({_id: id}, function (err, dbAccount) {
            if (!err) {
                if (dbAccount && (dbAccount.dialAlert != data.dialAlert)) {
                    mongo.db().collection(constants.DB.platform_account).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                        if (!err) {
                            var history = {
                                _id: utils.UUID.generateUuid(),
                                time: utils.DateTime.getCurrentDateTime(),
                                account: dbAccount._id,
                                user: dbAccount._id,
                                type: constants.operateLog.balanceAlert
                            };
                            var content = "";
                            if (dbAccount.dialAlert != data.dialAlert) {
                                content += "账号余额预警由【" + (dbAccount.dialAlert || 0) + "】改为【" + data.dialAlert + "】";
                            }
                            history.content = content;
                            mongo.db().collection(constants.DB.bill_operate_log).insert(history);
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("saveAlertConfig error! ", err);
                            result.message = "保存配置失败！";
                            callback(result);
                        }
                    });
                } else {
                    result.success = true;
                    callback(result);
                }

            } else {
                logger.app.error("saveAlertConfig error! ", err);
                result.message = "保存配置失败！";
                callback(result);
            }
        });
    },
    getAccProductFee:function (data,session, callback) {
        var result={success:false};
        var aid = session.account._id;
        var product=data.product;
        var currentMonth=utils.DateTime.getCurrentDateMonth();
        var key=aid+"_"+currentMonth+"_"+product;
        var productId=aid+"_"+product;
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: productId},function(err, productDB) {
            if (!err) {
                //var minConsume=productDB.minConsume;
                if(!productDB){
                    return callback(result);
                }
                result.row=productDB;
                mongo.db("bill_data").collection(constants.DB.bill_call_consume).findOne({_id: key},{fields:{balance:1,actualConsume:1,minConsume:1,giveMinute:1,presentMinute:1}},function(err, billDB) {
                    if (!err) {
                        productDB.minConsumeObj=billDB||{};
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        })
    }

};

module.exports = handler;
