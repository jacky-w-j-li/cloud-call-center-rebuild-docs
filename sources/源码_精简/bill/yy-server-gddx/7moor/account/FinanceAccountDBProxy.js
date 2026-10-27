/**
 * Created by kivi on 2016/10/31.
 */
var mongo = require('appDb/MongoDb');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var Then = require('thenjs');
var extend = require('util')._extend;
var financeAccountUtils = require(__baseDir + "/7moor/account/FinanceAccountUtils");
var proxy = {};

/**
 * 查询账户类型
 * @param id
 * @param callback
 */
// proxy.queryAccountTypes = function (callback) {
//     mongo.db().collection(constants.DB.platform_account_type).find({}).toArray(function (err, results) {
//        callback(err, results);
//     });
// };

/**
 * 判断是否是财务账户，如果是，返回
 * @param accountId
 * @param callback
 */
proxy.isFinanceAccount = function (accountId, callback) {
    mongo.db().collection(constants.DB.platform_account).findOne({
        _id: accountId,
        accountType: 'finance'
    }, function (err, result) {
       callback(err, result);
    });
};

/**
 * 根据用户id查找用户
 * @param accountId
 * @param callback
 */
proxy.queryAccountById = function (accountId, callback) {
    mongo.db().collection(constants.DB.platform_account).findOne({_id: accountId}, function (err, account) {
        callback(err, account);
    });
};

/**
 * 根据财务账户id获取财务账户
 * @param id
 * @param callback
 */
proxy.queryFinanceAccountById = function (id, callback) {
    mongo.db().collection(constants.DB.platform_account).findOne({_id: id}, function (err, account) {
        callback(err, account);
    });
};

/**
 * 根据普通用户id获取这个用户的财务账户
 * @param normalAccountId
 * @param callback
 */
proxy.queryFinanceAccountByNormalAccountId = function (normalAccountId, callback) {
    mongo.db().collection(constants.DB.platform_account).findOne({_id: normalAccountId}, function (err, account) {
        if (err) {
            callback(err);
        } else {
            if (account.financeAccount) {
                mongo.db().collection(constants.DB.platform_account).findOne({_id: account.financeAccount}, function (err, financeAccount) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, financeAccount);
                    }
                });
            } else {
                callback(null, null);
            }
            
        }
    });
};

/**
 * 返回当前账户和其财务账户
 * @param normalAccountId
 * @param callback
 */
proxy.queryAccountAndFinanceAccount = function (normalAccountId, callback) {
    mongo.db().collection(constants.DB.platform_account).findOne({_id: normalAccountId}, function (err, account) {
        if (err) {
            callback(err);
        } else {
            if (account.financeAccount) {
                mongo.db().collection(constants.DB.platform_account).findOne({_id: account.financeAccount}, function (err, financeAccount) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, account, financeAccount);
                    }
                });
            } else {
                callback(null, account, null);
            }
        }
    });
};

/**
 * 查询账户消费记录（如果自身是财务账户，则会把相关联的所有消费记录全部查出来）
 * @param data
 * @param opt
 * @param callback
 */
proxy.queryAccountConsumeRecord = function (data, opt, callback) {
    Then()
        .then(function (cont) {
            // 查询账户类型
            // proxy.queryAccountTypes(function (err, types) {
            //     if (err) {
            //         cont(err);
            //     } else  {
            //         var financeTypeId;
            //         types.forEach(function (type) {
            //             if (type.name == '财务账户') {
            //                 financeTypeId = type._id;
            //             }
            //         });
            //         cont(null, financeTypeId);
            //     }
            // })
            cont(null, 'finance');
        })
        .then(function (cont, financeTypeId) {
            // 如果条件中有用户id，则判断这个人是不是财务账户
            if (data.account) {
                proxy.queryAccountById(data.account, function (err, account) {
                   if (err) {
                       cont(err);
                   } else {
                       if (account.accountType == financeTypeId) {
                           cont(null, true, account);
                       } else {
                           cont(null, false);
                       }
                   }
                });
            } else {
                cont(null, false);
            }
        })
        .then(function (cont, isFinanceAccount, account) {
            if (isFinanceAccount) {
                var relatedConditions = extend({}, data);
                delete relatedConditions.account;
                relatedConditions['financeAccount'] = account._id;
                var conditions = {
                    $or: [
                        data,
                        relatedConditions
                    ]
                };
                cont(null, conditions, isFinanceAccount);
            } else {
                cont(null, data, isFinanceAccount);
            }
        })
        .then(function (cont, conditions, isFinanceAccount) {
            // 查询结果总数
            var result = { success: false };
            mongo.db("zj").collection(constants.DB.user_pay).count(conditions, function (err, count) {
                if (err) {
                    cont(err);
                } else {
                    mongo.db("zj").collection(constants.DB.user_pay).find(conditions, {
                        sort: {pay_time: -1},
                        limit: opt.limit,
                        skip: opt.skip
                    }).toArray(function (err, pays) {
                        callback(err, {
                            isFinanceAccount: isFinanceAccount,
                            count: count,
                            pays: pays
                        });
                    });
                }
            });
        })
        .fail(function (cont, err) {
            callback(err);
        });
};

/**
 * 查找一个用户的月账单
 * @param data
 * @param opt
 * @param callback
 */
proxy.queryAccountBill = function (data, opt, callback) {
    Then()
        .then(function (cont) {
            // 查询账户类型
            // proxy.queryAccountTypes(function (err, types) {
            //     if (err) {
            //         cont(err);
            //     } else  {
            //         var financeTypeId;
            //         types.forEach(function (type) {
            //             if (type.name == '财务账户') {
            //                 financeTypeId = type._id;
            //             }
            //         });
            //         cont(null, financeTypeId);
            //     }
            // })
            cont(null, 'finance');
        })
        .then(function (cont, financeTypeId) {
            // 如果条件中有用户id，则判断这个人是不是财务账户
            if (data.account) {
                proxy.queryAccountById(data.account, function (err, account) {
                    if (err) {
                        cont(err);
                    } else {
                        if (account.accountType == financeTypeId) {
                            cont(null, true, account);
                        } else {
                            cont(null, false);
                        }
                    }
                });
            } else {
                cont(null, false);
            }
        })
        .then(function (cont, isFinanceAccount, account) {
            if (isFinanceAccount) {
                // 生成获取当前关联着这个财务账户的所有账单的查询条件
                var relatedConditions = extend({}, data);
                delete relatedConditions.account;
                relatedConditions['financeAccount'] = account._id;

                // 生成获取备份中关联这个财务账户的账单的查询条件
                var backupConditions = extend({}, data);
                delete backupConditions.account;
                backupConditions.backup = {
                    $elemMatch: { financeAccount: account._id}
                };

                // 生成最终的查询条件
                var conditions = {
                    $or: [
                        data,
                        relatedConditions,
                        backupConditions
                    ]
                };
                cont(null, conditions, isFinanceAccount);
            } else {
                cont(null, data, isFinanceAccount);
            }
        })
        .then(function (cont, conditions, isFinanceAccount) {
            // 查询结果总数
            mongo.db("bill_data").collection(opt.table).count(conditions, function (err, count) {
                if (err) {
                    cont(err);
                } else {
                    // 查询账单数据
                    mongo.db("bill_data").collection(opt.table).find(conditions, {
                        sort: {_id: -1},
                        limit: opt.limit,
                        skip: opt.skip
                    }).toArray(function (err, bills) {
                        // 重新整理返回的账单数据
                        if (conditions['$or']) {
                            bills = financeAccountUtils.transferBillData(bills, data.account);
                            count = bills.length;
                        }

                        // 因为这里查询出来的账单很有可能是一个人的，不必每次去数据库找
                        var tmpAccountStore = {};
                        var retBills = [];

                        // 查询账单关联账户的数据
                        Then()
                            .eachSeries(bills, function (cont, bill) {
                                if (tmpAccountStore[bill.account]) {
                                    bill.account = tmpAccountStore[bill.account];
                                    retBills.push(bill);
                                    cont();
                                } else {
                                    proxy.queryAccountById(bill.account, function (err, account) {
                                       if (err) {
                                           cont(err);
                                       } else {
                                           tmpAccountStore[bill.account] = account;
                                           bill.account = account;
                                           retBills.push(bill);
                                           cont();
                                       }
                                    });
                                }
                            })
                            .then(function (cont) {
                                callback(null, {
                                    isFinanceAccount: isFinanceAccount,
                                    count: count,
                                    bills: retBills
                                });
                            })
                            .fail(function (cont,err) {
                                callback(err);
                            });
                    });
                }
            });
        })
        .fail(function (cont, err) {
            callback(err);
        });
};

module.exports = proxy;