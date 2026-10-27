var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var financeAccountDBProxy = require('./FinanceAccountDBProxy');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    queryCcTelRecord : function(data,session,callback){
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.beginTimeDisplay = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (data.beginTimeDisplay) {
                data.beginTimeDisplay.$lte = endTime + " 23:59:59"
            } else {
                data.beginTimeDisplay = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        mongo.db("bill_data").collection(constants.DB.bill_cdr_query_cc).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("bill_data").collection(constants.DB.bill_cdr_query_cc).find(data, {sort: {beginTime: -1}, limit: limit, skip: skip}).toArray(function (err, cdrs) {
                    if (!err) {
                        cdrs = cdrs || [];
                        var accountIds = impl.getCdrAccountIds(cdrs);
                        mongo.db().collection(constants.DB.platform_account).find({_id: {$in: accountIds}}, {fields: {"companyName": 1}}).toArray(function (err, accounts) {
                            if (!err) {
                                utils.ObjectUtil.linkObjects(cdrs, accounts,{account:"_id"},"accountObj");
                                console.log(cdrs);
                                result.success = true;
                                result.list = cdrs;
                                callback(result);
                            } else {
                                logger.app.warn("query plaftorm_account  error", err);
                                result.message = "查询账户信息异常！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("queryTelRecord  error", err);
                        result.message = "查询通话记录信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryTelRecord count error", err);
                result.message = "查询通话记录信息异常！";
                callback(result);
            }
        });
    },
    queryTelRecord: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.beginTimeDisplay = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (data.beginTimeDisplay) {
                data.beginTimeDisplay.$lte = endTime + " 23:59:59"
            } else {
                data.beginTimeDisplay = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        mongo.db("bill_data").collection(constants.DB.bill_cdr_query_zj).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("bill_data").collection(constants.DB.bill_cdr_query_zj).find(data, {sort: {beginTime: -1}, limit: limit, skip: skip}).toArray(function (err, cdrs) {
                    if (!err) {
                        cdrs = cdrs || [];
                        var accountIds = impl.getCdrAccountIds(cdrs);
                        mongo.db().collection(constants.DB.platform_account).find({_id: {$in: accountIds}}, {fields: {"companyName": 1}}).toArray(function (err, accounts) {
                            if (!err) {
                                utils.ObjectUtil.linkObjects(cdrs, accounts,{account:"_id"},"accountObj");
                                console.log(cdrs);
                                result.success = true;
                                result.list = cdrs;
                                callback(result);
                            } else {
                                logger.app.warn("query plaftorm_account  error", err);
                                result.message = "查询账户信息异常！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("queryTelRecord  error", err);
                        result.message = "查询通话记录信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryTelRecord count error", err);
                result.message = "查询通话记录信息异常！";
                callback(result);
            }
        });
    },
    queryFeeRecord: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.pay_time = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (data.pay_time) {
                data.pay_time.$lte = endTime + " 23:59:59"
            } else {
                data.pay_time = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }

        var sum = function(data,next){
                mongo.db("zj").collection(constants.DB.user_bank_pay).find(data,{money:1}).toArray(function (err, allRecords) {
                    if(err){
                        logger.app.warn("queryFeeRecord total error", err);
                        result.message = "查询客户充值记录信息异常！";
                        callback(result);
                        return;
                    }
                    result.totalFee = 0;
                    if(allRecords && allRecords.length>0) {
                        for(var i=0;i<allRecords.length;i++){
                            var record = allRecords[i];
                            result.totalFee += parseInt(record.money);
                        }
                    };
                    next(data);
                });
        };

        var doQuery = function(data) {
            if (data.proxy) {
                mongo.db().collection(constants.DB.platform_account).find({createUser: data.proxy}, {
                    _id: 1,
                    name: 1,
                    companyName: 1,
                    createUser: 1,
                }).toArray(function (err, accs) {
                    if (!err) {
                        var accIds = [];
                        for (var i = 0; i < accs.length; i++) {
                            var obj = accs[i];
                            accIds.push(obj._id);
                        }
                        //var proxyId = data.proxy;
                        delete data.proxy;
                        data.account = data.account || {$in: accIds};
                        sum(data,function(data){
                            mongo.db("zj").collection(constants.DB.user_bank_pay).count(data, function (err, count) {
                                if (!err) {
                                    result.count = count;
                                    mongo.db("zj").collection(constants.DB.user_bank_pay).find(data, {
                                        sort: {pay_time: -1},
                                        limit: limit,
                                        skip: skip
                                    }).toArray(function (err, pays) {
                                        if (!err) {
                                            pays = pays || [];
                                            for (var i = 0; i < accs.length; i++) {
                                                var obj = accs[i];
                                                for (var o = 0; o < pays.length; o++) {
                                                    if (pays[o].account == obj._id) {
                                                        pays[o].accountName = obj.name;
                                                        pays[o].accCompanyName = obj.companyName;
                                                        pays[o].createUser = obj.createUser;
                                                    }
                                                }
                                            }
                                            result.list = pays;
                                            result.success = true;
                                            callback(result);
                                        } else {
                                            logger.app.warn("queryFeeRecord  error", err);
                                            result.message = "查询客户充值记录信息异常！";
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.warn("queryFeeRecord count error", err);
                                    result.message = "查询客户充值记录信息异常！";
                                    callback(result);
                                }
                            });
                        });

                    } else {
                        logger.app.warn("queryFeeRecord error", err);
                        result.message = "查询代理的账户异常！";
                        callback(result);
                    }
                });
            } else {
                //不是代理登录或不存在代理条件
                sum(data,function(data) {
                    mongo.db("zj").collection(constants.DB.user_bank_pay).count(data, function (err, count) {
                        if (!err) {
                            result.count = count;
                            mongo.db("zj").collection(constants.DB.user_bank_pay).find(data, {
                                sort: {pay_time: -1},
                                limit: limit,
                                skip: skip
                            }).toArray(function (err, pays) {
                                if (!err) {
                                    pays = pays || [];
                                    var accountIds = [];
                                    for (var i = 0; i < pays.length; i++) {
                                        var obj = pays[i];
                                        accountIds.push(obj.account);
                                    }
                                    handler.queryAccountNameByIds(accountIds, function (rep) {
                                        if (rep.success) {
                                            for (var i = 0; i < pays.length; i++) {
                                                var obj = pays[i];
                                                obj.accountName = rep.names[obj.account];
                                                obj.accCompanyName = rep.companyNames[obj.account];
                                                obj.createUser = rep.createUsers[obj.account];
                                            }
                                            result.list = pays;
                                            result.success = true;
                                            callback(result);
                                        } else {
                                            callback(rep);
                                        }
                                    });
                                } else {
                                    logger.app.warn("queryFeeRecord  error", err);
                                    result.message = "查询客户充值记录信息异常！";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.warn("queryFeeRecord count error", err);
                            result.message = "查询客户充值记录信息异常！";
                            callback(result);
                        }
                    });
                });
            }
        };

        if(!data.proxy && session.user.identity == constants.systemUserIndentity.proxy){
            impl._getUserAllLower(session.user._id,function(users) {
                data.proxy = {$in: users};
                doQuery(data);
            });
            return;
        }

        doQuery(data);

    },
    queryProxyFeeRecord: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.pay_time = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (data.pay_time) {
                data.pay_time.$lte = endTime + " 23:59:59"
            } else {
                data.pay_time = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        var sum = function(data,next){
            mongo.db().collection(constants.DB.bill_user_bank_pay).find(data,{money:1}).toArray(function (err, allRecords) {
                if(err){
                    logger.app.warn("queryProxyFeeRecord total error", err);
                    result.message = "查询代理充值记录信息异常！";
                    callback(result);
                    return;
                }
                result.totalFee = 0;
                if(allRecords && allRecords.length>0) {
                    for(var i=0;i<allRecords.length;i++){
                        var record = allRecords[i];
                        result.totalFee += parseInt(record.money);
                    }
                };
                next(data);
            });
        };

        var doQuery = function(data){
            sum(data,function(data){
                mongo.db().collection(constants.DB.bill_user_bank_pay).count(data, function (err, count) {
                    if (!err) {
                        result.count = count;
                        mongo.db().collection(constants.DB.bill_user_bank_pay).find(data, {sort: {pay_time: -1}, limit: limit, skip: skip}).toArray(function (err, pays) {
                            if (!err) {
                                pays = pays || [];
                                result.success = true;
                                result.list = pays;
                                callback(result);
                            } else {
                                logger.app.warn("queryProxyFeeRecord  error", err);
                                result.message = "查询代理充值记录信息异常！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("queryProxyFeeRecord count error", err);
                        result.message = "查询代理充值记录信息异常！";
                        callback(result);
                    }
                });
            });
        }

        data.status='pay';
        if(!data.proxy && session.user.identity == constants.systemUserIndentity.proxy){
            impl._getUserAllLower(session.user._id,function(users) {
                data.proxy = {$in: users};
                doQuery(data);
            });
            return;
        }
        doQuery(data);

    },
    queryCostRecord: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.pay_time = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (data.pay_time) {
                data.pay_time.$lte = endTime + " 23:59:59"
            } else {
                data.pay_time = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        data.status = "pay"
        if(!data.flag){
            data.flag={$ne:'pay'};
        }

        var doQuery = function(data){
            financeAccountDBProxy.queryAccountConsumeRecord(data, { limit: limit, skip: skip }, function (err, result) {
                if (!err) {
                    var count = result.count;
                    var pays = result.pays;
                    result.count = count;
                    pays = pays || [];
                    var accountIds=[];
                    for (var i = 0; i < pays.length; i++) {
                        var obj = pays[i];
                        accountIds.push(obj.account);
                    }
                    handler.queryAccountNameByIds(accountIds,function(rep){
                        if(rep.success){
                            for (var i = 0; i < pays.length; i++) {
                                var obj = pays[i];
                                obj.accountName=rep.names[obj.account];
                            }
                            result.success = true;
                            result.list = pays;
                            callback(result);
                        } else{
                            callback(rep);
                        }
                    });
                } else {
                    logger.app.warn("queryCostRecord  error", err);
                    result.message = "查询消费记录信息异常！";
                    callback(result);
                }
            });

            // mongo.db("zj").collection(constants.DB.user_pay).count(data, function (err, count) {
            //     if (!err) {
            //         result.count = count;
            //         mongo.db("zj").collection(constants.DB.user_pay).find(data, {sort: {pay_time: -1}, limit: limit, skip: skip}).toArray(function (err, pays) {
            //             if (!err) {
            //                 pays = pays || [];
            //                 var accountIds=[];
            //                 for (var i = 0; i < pays.length; i++) {
            //                     var obj = pays[i];
            //                     accountIds.push(obj.account);
            //                 }
            //                 handler.queryAccountNameByIds(accountIds,function(rep){
            //                     if(rep.success){
            //                         for (var i = 0; i < pays.length; i++) {
            //                             var obj = pays[i];
            //                             obj.accountName=rep.names[obj.account];
            //                         }
            //                         result.success = true;
            //                         result.list = pays;
            //                         callback(result);
            //                     } else{
            //                         callback(rep);
            //                     }
            //                 });
            //
            //             } else {
            //                 logger.app.warn("queryCostRecord  error", err);
            //                 result.message = "查询消费记录信息异常！";
            //                 callback(result);
            //             }
            //         });
            //     } else {
            //         logger.app.warn("queryCostRecord count error", err);
            //         result.message = "查询消费记录信息异常！";
            //         callback(result);
            //     }
            // });
        };

        if(!data.proxy && session.user.identity == constants.systemUserIndentity.proxy){
            impl._getUserAllLower(session.user._id,function(users) {
                data.proxy = {$in: users};
                doQuery(data);
            });
            return;
        }

        doQuery(data);
    },
    //没有调用过,不管
    queryProxyCostRecord: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.pay_time = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (data.pay_time) {
                data.pay_time.$lte = endTime + " 23:59:59"
            } else {
                data.pay_time = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        data.status = "pay";
        if(session.user.identity == constants.systemUserIndentity.proxy){
            data.proxy=session.user._id;
        }
        mongo.db().collection(constants.DB.bill_user_pay).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_user_pay).find(data, {sort: {pay_time: -1}, limit: limit, skip: skip}).toArray(function (err, pays) {
                    if (!err) {
                        pays = pays || [];
                        var accountIds=[];
                        for (var i = 0; i < pays.length; i++) {
                            var obj = pays[i];
                            accountIds.push(obj.account);
                        }
                        handler.queryAccountNameByIds(accountIds,function(rep){
                            if(rep.success){
                                for (var i = 0; i < pays.length; i++) {
                                    var obj = pays[i];
                                    obj.accountName=rep.names[obj.account];
                                    obj.accCompanyName=rep.companyNames[obj.account];
                                }
                                result.success = true;
                                result.list = pays;
                                callback(result);
                            } else{
                                callback(rep);
                            }
                        });
                    } else {
                        logger.app.warn("queryProxyCostRecord  error", err);
                        result.message = "查询代理消费记录信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryProxyCostRecord count error", err);
                result.message = "查询代理消费记录信息异常！";
                callback(result);
            }
        });
    },
    queryAccountNameByIds:function(ids, callback){
        var result = {success: false};
        var query={_id:{$in:ids||[]}};
        var fields={_id:1,name:1,companyName:1,createUser:1};
        mongo.db().collection(constants.DB.platform_account).find(query,fields).toArray(function (err, docs) {
            if(!err){
                var names={};
                var companyNames={};
                var createUsers = {};
                for (var i = 0; i < docs.length; i++) {
                    var obj = docs[i];
                    names[obj._id]=obj.name;
                    companyNames[obj._id]=obj.companyName;
                    createUsers[obj._id] = obj.createUser ||"";
                }
                result.names=names;
                result.companyNames=companyNames;
                result.createUsers=createUsers;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    // queryAccountTypes: function (data, session, callback) {
    //     mongo.db().collection(constants.DB.platform_account_type).find({}).toArray(function (err, types) {
    //         if (err) {
    //             callback(err);
    //         } else {
    //             var caches = [];
    //             types.forEach(function (type, i) {
    //                 caches.push({
    //                     codeType: "accountType",
    //                     codeOrder: 1+i,
    //                     codeName: type.name,
    //                     codeValue: type._id.toString()
    //                 });
    //             });
    //             callback(null, caches);
    //         }
    //     });
    // },
    queryFinanceAccount: function (data, session, callback) {
        mongo.db().collection(constants.DB.platform_account).find({}).toArray(function (err, types) {
            if (err) {
                callback(err);
            } else {
                var caches = [];
                types.forEach(function (type, i) {
                    caches.push({
                        codeType: "accountType",
                        codeOrder: 1+i,
                        codeName: type.name,
                        codeValue: type._id.toString()
                    });
                });
                callback(null, caches);
            }
        });
    }
};

var impl = {
    getCdrAccountIds: function (cdrs) {
        var ids = [];
        for (var i = 0; i < cdrs.length; i++) {
            ids.push(cdrs[i].account);
        }
        return ids;
    },
    _getUserAllLower : function (userId , callback){
        mongo.db().collection(constants.DB.system_user).find({identity:"proxy",parent:{$nin:[null,'']}},{fields:{_id:1,parent:1}}).toArray(function(err , users){
            var result = [userId];
            if(!err){
                users = users || [];
                var getUserLower = function (uid){
                    for(var i=0;i<users.length;i++){
                        var obj = users[i];
                        if(obj.parent == uid){
                            result.push(obj._id);
                            getUserLower(obj._id);
                        }
                    }
                }
                getUserLower(userId);
                callback(result);
            } else {
                callback(result);
            }

        });
    },

}

module.exports = handler;
