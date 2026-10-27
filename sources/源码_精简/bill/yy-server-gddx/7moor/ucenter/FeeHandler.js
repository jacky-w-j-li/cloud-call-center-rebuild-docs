var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var financeAccountDBProxy = require(__baseDir + "/7moor/account/FinanceAccountDBProxy");
var config = require('appConfig');

var handler = {
    getPayList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        utils.removeEmptyProperty(condition);
        var flag=condition.flag;
        delete condition.flag;
        if(flag=='1'){
            condition.status='pay';
            condition.payType={$in:['online','mix']};
        }else if(flag=='2'){
            condition.status='pay';
            condition.flag={$ne:'pay'};
        }
//        var fields={ali:0};
        financeAccountDBProxy.queryAccountConsumeRecord(data, { limit: limit, skip: skip }, function (err, results) {
            if (err) {
                logger.app.error(err);
                callback(result);
            } else {
                result.count = results.count;
                result.list = results.pays;
                result.success = true;
                callback(result);
            }
        });

//         mongo.db("zj").collection(constants.DB.user_pay).find(condition,{sort:{pay_time:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
//             if (!err) {
//                 result.list = docs;
//                 mongo.db("zj").collection(constants.DB.user_pay).count(condition, function (err, count) {
//                     if (!err) {
//                         result.count = count;
//                         result.success = true;
//                         callback(result);
//                     } else {
//                         logger.app.error(err);
//                         callback(result);
//                     }
//                 });
//             } else {
//                 logger.app.error(err);
//                 callback(result);
//             }
//         });
    },

    getBankPayList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        var condition = data||{};
        condition.account=session.account._id;
        utils.removeEmptyProperty(condition);
        var flag=condition.flag;
        delete condition.flag;
        mongo.db("zj").collection(constants.DB.user_bank_pay).find(condition,{sort:{pay_time:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db("zj").collection(constants.DB.user_bank_pay).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
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
    __initQuery:function(condition){
        var start=condition.startOfferingTime;
        var end =condition.endOfferingTime;
        if(start && end){
            condition.offeringTime={"$gte":start,"$lte":end};
        }else if(start){
            condition.offeringTime={$gte:start};
        }else if(end){
            condition.offeringTime={$gte:end};
        }
        if(start){
            delete condition.startOfferingTime;
        }
        if(end){
            delete condition.endOfferingTime;
        }

        var tel=condition.combox;
        if(tel){
            var ary=[];
            ary.push({"cid":tel});
            ary.push({"did":tel});
            condition.$or = ary;
            delete condition.combox;
        }
    },
    getCallsheetList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        utils.removeEmptyProperty(condition);
        delete condition.flag;
        handler.__initQuery(condition);
        mongo.db("zj_data").collection(constants.DB.platform_cdr).find(condition,{sort:{offeringTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db("zj_data").collection(constants.DB.platform_cdr).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
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
    /**
     * for cc cdr
     * @param data
     * @param session
     * @param callback
     */
    queryCallSheet2CC :function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        utils.removeEmptyProperty(condition);
        handler.__initCCQuery(condition);
        var db=utils.getProductDB(constants.product.cc,session);
        mongo.db(db).collection(session.account._id + constants.DB.cc_c5_call_sheet).find(data, {sort:{OFFERING_TIME: -1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            mongo.db(db).collection(session.account._id + constants.DB.cc_c5_call_sheet).count(data, function (err, docCount) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                result.success = true;
                result.list = docs;
                result.count = docCount;
                callback(result);
            });
        });
    },
    __initCCQuery:function(condition){
        var start=condition.startOfferingTime;
        var end =condition.endOfferingTime;
        if(start && end){
            condition.OFFERING_TIME={"$gte":start,"$lte":end};
        }else if(start){
            condition.OFFERING_TIME={$gte:start};
        }else if(end){
            condition.OFFERING_TIME={$gte:end};
        }
        if(start){
            delete condition.startOfferingTime;
        }
        if(end){
            delete condition.endOfferingTime;
        }

        var tel=condition.combox;
        if(tel){
            var ary=[];
            ary.push({"CALL_NO":tel});
            ary.push({"CALLED_NO":tel});
            condition.$or = ary;
            delete condition.combox;
        }
    },
    backoutSysPay:function(data,session,callback){
        var result = {success: false};
        var aid=session.account._id;
        var billLoginName=session.account.billLoginName;
        var billIdentity=session.account.billIdentity;

        var query={_id:data._id};
        mongo.db("zj").collection(constants.DB.user_bank_pay).findOne(query,function (err, doc) {
            if (!err && doc) {
                if(doc.flag==constants.payFlag.payAccount){
                    if(doc.isBackOut){
                        result.message="已撤销";
                        logger.app.error(result.message);
                        callback(result);
                        return;
                    }
                    mongo.db().collection(constants.DB.system_user).findOne({loginName:billLoginName},function (err, proxy) {
                        if (!err && proxy) {
                            if(doc.proxy==proxy._id){
                                mongo.db().collection(constants.DB.platform_account).findOne({_id:aid},function (err, acc) {
                                    if (!err && acc) {
                                        var balance=acc.balance;
                                        var money=utils.formatFee(doc.money);
                                        if(balance<money){
                                            result.message="您充入的资金已经被使用，不能撤销此操作";
                                            logger.app.error(result.message);
                                            callback(result);
                                        }else{
                                            mongo.db().collection(constants.DB.platform_account).findAndModify({_id:aid},[],{$inc:{balance:-money}},{new:true},function(err,acc2){
                                                if(!err){
                                                    mongo.db().collection(constants.DB.system_user).findAndModify({_id:proxy._id},[],{$inc:{balance:money}},{new:true},function(err,proxyUser){
                                                        if(!err){
                                                            var time=utils.DateTime.getCurrentDateTime();
                                                            utils.BusinessUtil.getPayOrderNo(null,function(rep2){
                                                                if(rep2.success){
                                                                    var orderNo="BP"+rep2.orderNo;
                                                                    var payset={
                                                                        _id:orderNo,
                                                                        status:'pay',
                                                                        payType:constants.payType.balance,
                                                                        money:doc.money+"",
                                                                        income:doc.money+"",
                                                                        account:doc.account,
                                                                        create_time:time,
                                                                        pay_time:time,
                                                                        flag:constants.proxySource.backoutPay,
                                                                        proxy:proxy._id,
                                                                        currentBalance:utils.formatTrueFee(proxyUser.balance)+"",
                                                                        source:constants.proxySource.backoutPay,
                                                                        timestamp:utils.DateTime.getCurrentTimestamp()
                                                                    }
                                                                    mongo.db().collection(constants.DB.bill_user_pay).insert(payset);
                                                                    var paySet2={
                                                                        _id:orderNo,
                                                                        account:doc.account,
                                                                        payType:constants.payType.balance,
                                                                        flag:constants.payFlag.backoutPay,
                                                                        pay_time:time,
                                                                        bank:"",
                                                                        money:"-"+doc.money+"",
                                                                        proxy:proxy._id,
                                                                        currentBalance:utils.formatTrueFee(acc2.balance)+"",
                                                                        sourceId:doc._id
                                                                    }
                                                                    mongo.db("zj").collection(constants.DB.user_bank_pay).insert(paySet2);

                                                                    mongo.db("zj").collection(constants.DB.user_bank_pay).update(query,{$set:{isBackOut:true}});
                                                                    result.success = true;
                                                                    callback(result);
                                                                }else{
                                                                    callback(rep2);
                                                                }
                                                            });
                                                        }else{
                                                            logger.app.error(err);
                                                            callback(result);
                                                        }
                                                    });
                                                }else{
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            });
                                        }
                                    } else {
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                result.message="非法的用户";
                                logger.app.error(result.message);
                                callback(result);
                            }
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    result.message="错误的支付类型";
                    logger.app.error(result.message);
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    }


};

module.exports = handler;
