var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    _initFinanceDetail:function(query){
        var beginTime = query.begin;
        var endTime = query.end;

        if (beginTime) {
            query.pay_time = {
                $gte: beginTime + " 00:00:00"
            }
            delete query.begin;
        }
        if (endTime) {
            if (query.pay_time) {
                query.pay_time.$lte = endTime + " 23:59:59"
            } else {
                query.pay_time = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete query.end;
        }

        if(query.financeType){
            if(query.financeType=="in"){//buyDialMin为兼容旧的数据
                query.source={$in:["buyDialMin",constants.proxySource.serviceNo,constants.proxySource.supplementDuction,constants.proxySource.licence,constants.proxySource.payCallFee,constants.proxySource.backoutPay,
                    constants.proxySource.payCall400Fee,constants.proxySource.payCallMin,constants.proxySource.pay,constants.proxySource.systemPay,constants.proxySource.paySmsFee,constants.proxySource.oweFee]};
            }else if(query.financeType=="out"){
                query.source={$in:[constants.proxySource.payAccount,constants.proxySource.revocationMinConsume,constants.proxySource.proxyWithDraw]}
            }
            delete query.financeType;
        }
    },
    queryProxyFinanceDetail: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query=data||{};
        query.status = "pay";
        query.proxy=session.user._id;
        handler._initFinanceDetail(query);

        mongo.db().collection(constants.DB.bill_user_pay).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_user_pay).find(query, {sort: {timestamp: -1}, limit: limit, skip: skip}).toArray(function (err, pays) {
                    if (!err) {
                        pays = pays || [];
                        var accountIds=[];
                        for (var i = 0; i < pays.length; i++) {
                            var obj = pays[i];
                            accountIds.push(obj.account);
                        }
                        handler._queryAccountNameByIds(accountIds,function(rep){
                            if(rep.success){
                                for (var i = 0; i < pays.length; i++) {
                                    var obj = pays[i];
                                    obj.accountName=rep.names[obj.account];
                                }
//                                handler.queryFinanceStat(query,session,function(err,rep2){
//                                    if(rep2.success){
//                                        result.success = true;
//                                        result.list = pays;
//                                        result.stat=rep2.list[0]||{};
//                                        callback(result);
//                                    }else{
//                                        callback(rep2);
//                                    }
//                                })
                                result.success = true;
                                result.list = pays;
                                callback(result);
                            } else{
                                callback(rep);
                            }
                        });
                    } else {
                        logger.app.warn("queryProxyFinanceDetail  error", err);
                        result.message = "查询代理收支明细信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryProxyFinanceDetail count error", err);
                result.message = "查询代理收支明细信息异常！";
                callback(result);
            }
        });
    },
    queryFinanceStat: function (data, session, callback) {
        var result = {success: false};
        var query=data||{};
        query.status = "pay";
        query.proxy=session.user._id;
        handler._initFinanceDetail(query);
        var keys = [];
        var init = {income:0,incomeNum:0,outlay:0,outlayNum:0};
        var reduce = function (obj, prev) {
            var flag = obj.source;
            var income=parseFloat(obj.income||0);
            if(flag=='payAccount' || flag=='proxyWithDraw'|| flag=='revocationMinConsume'){
                prev['outlay']+=income;
                prev['outlayNum']++;
            }else{
                prev['income']+=income;
                prev['incomeNum']++;
            }
        };
        mongo.db().collection(constants.DB.bill_user_pay).group(keys, query, init, reduce, function (err, list) {
            if(!err){
                list=list||[];
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    item.income=Math.round(item.income*100)/100;
                    item.outlay=Math.round(item.outlay*100)/100;
                }
                var stat={};
                if(list.length==0){
                    stat={income:0,incomeNum:0,outlay:0,outlayNum:0}
                }else{
                    stat=list[0];
                }
                result.stat=stat;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });

    },
    _initCallDetail:function(query){
        utils.removeEmptyProperty(query);
        var beginTime = query.begin;
        var endTime = query.end;

        if (beginTime) {
            query.endTimeDisplay = {
                $gte: beginTime + " 00:00:00"
            }
            delete query.begin;
        }
        if (endTime) {
            if (query.endTimeDisplay) {
                query.endTimeDisplay.$lte = endTime + " 23:59:59"
            } else {
                query.endTimeDisplay = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete query.end;
        }
        var tel=query.combox;
        if(tel){
            /*var ary=[];
            ary.push({"cid":tel});
            ary.push({"did":tel});
            query.$or = ary;*/
            query.did=tel;
            delete query.combox;
        }
    },
    queryProxyCallDetail: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query=data||{};
        query.proxy=session.user._id;
        handler._initCallDetail(query);

        mongo.db("bill_data").collection(constants.DB.bill_call_proxy_detail).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("bill_data").collection(constants.DB.bill_call_proxy_detail).find(query, {sort: {endTimeDisplay: -1}, limit: limit, skip: skip}).toArray(function (err, list) {
                    if (!err) {
                        result.success = true;
                        result.list = list||[];
                        callback(result);
                    } else {
                        logger.app.error("queryProxyCallDetail  error", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("queryProxyCallDetail count error", err);
                callback(result);
            }
        });
    },
    _initSmsDetail:function(query){
        var beginTime = query.begin;
        var endTime = query.end;

        if (beginTime) {
            query.submitTime = {
                $gte: beginTime + " 00:00:00"
            }
            delete query.begin;
        }
        if (endTime) {
            if (query.submitTime) {
                query.submitTime.$lte = endTime + " 23:59:59"
            } else {
                query.submitTime = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete query.end;
        }
    },
    queryProxySmsDetail:function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query=data||{};
        handler._initSmsDetail(query);
        query.proxy=session.user._id;
        mongo.db("bill_data").collection(constants.DB.bill_sms_proxy_detail).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("bill_data").collection(constants.DB.bill_sms_proxy_detail).find(query, {sort: {submitTime: -1}, limit: limit, skip: skip}).toArray(function (err, list) {
                    if (!err) {
                        result.success = true;
                        result.list = list||[];
                        callback(result);
                    } else {
                        logger.app.error("queryProxySmsDetail  error", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("queryProxySmsDetail count error", err);
                callback(result);
            }
        });
    },
    _initCall400Detail:function(query){
        utils.removeEmptyProperty(query);
        var beginTime = query.begin;
        var endTime = query.end;

        if (beginTime) {
            query.endTimeDisplay = {
                $gte: beginTime + " 00:00:00"
            }
            delete query.begin;
        }
        if (endTime) {
            if (query.endTimeDisplay) {
                query.endTimeDisplay.$lte = endTime + " 23:59:59"
            } else {
                query.endTimeDisplay = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete query.end;
        }

        var tel=query.combox;
        if(tel){
//            var ary=[];
//            ary.push({"cid":tel});
//            ary.push({"did":tel});
//            query.$or = ary;
            query.cid=tel;
            delete query.combox;
        }
    },
    queryProxyCall400Detail: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query=data||{};
        query.proxy=session.user._id;
        handler._initCall400Detail(query);

        mongo.db("bill_data").collection(constants.DB.bill_400_proxy_detail).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("bill_data").collection(constants.DB.bill_400_proxy_detail).find(query, {sort: {endTimeDisplay: -1}, limit: limit, skip: skip}).toArray(function (err, list) {
                    if (!err) {
                        result.success = true;
                        result.list = list||[];
                        callback(result);
                    } else {
                        logger.app.error("queryProxyCall400Detail  error", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("queryProxyCall400Detail count error", err);
                callback(result);
            }
        });
    },
    _queryAccountNameByIds:function(ids, callback){
        var result = {success: false};
        var query={_id:{$in:ids||[]}};
        var fields={_id:1,name:1/*,companyName:1*/};
        mongo.db().collection(constants.DB.platform_account).find(query,fields).toArray(function (err, docs) {
            if(!err){
                var names={};
                for (var i = 0; i < docs.length; i++) {
                    var obj = docs[i];
                    names[obj._id]=obj.name;
                }
                result.names=names;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }
};



module.exports = handler;
