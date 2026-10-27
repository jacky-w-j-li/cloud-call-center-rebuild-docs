var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var snHandler = require(__baseDir + "/7moor/ucenter/ServiceNoHandler");
var licenceHandler = require(__baseDir + "/7moor/ucenter/LicenceHandler");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var notifyHandler = require(__baseDir + "/7moor/notify/NotifyHandler");
var httpProvider = require("appHttp");
var config = require('appConfig');
var serviceNumHandler = require(__baseDir + '/7moor/resource/ServiceNumHandler');
var appEvent = require("appEvent");
var Account = require(__baseDir + "/models/Account");
var AccountPayConsume = require(__baseDir + "/models/AccountPayConsume");
var UserBankPay = require(__baseDir + "/models/UserBankPay");
var financeAccountHandler = require(__baseDir + "/7moor/account/FinanceAccountHandler");
var financeAccountDBProxy = require(__baseDir + "/7moor/account/FinanceAccountDBProxy");

var handler = {
    isOurSales:function(key){
        var ourSales=['mysales','hd','hn'];
        for (var i = 0; i < ourSales.length; i++) {
            var obj = ourSales[i];
            if(obj==key){
                return true;
            }
        }
        return false;
    },

    _reCalculateFee: function (data, callback) {
//        console.dir(data);
        var result = {success: false};
        var flag = data.flag;
        var payType = data.payType;
        var aid = data.account;

        var balance = parseFloat(data.balance) || 0;
        var totalFee = parseFloat(data.money);
        if (payType == constants.payType.mix) {
            totalFee = totalFee + balance;
        }
        totalFee = utils.formatMoney(totalFee);
        if (flag == constants.payFlag.pay) {
            data.totalFee = totalFee + '';
            result.success = true;
            callback(result);
        } else if (flag == constants.payFlag.buyDialMin || flag == constants.payFlag.buy400Min) {
            var trueFee = utils.formatMoney(totalFee);
            financeAccountDBProxy.queryAccountAndFinanceAccount(aid, function (err, acc, financeAcc) {
                if (!err) {

                    if (payType != constants.payType.online) {//check balance
                        var trueBalance = acc.balance + (acc.overdraw || 0);
                        if (financeAcc) {
                            var financeAccountBalance = financeAcc.balance + (financeAcc.overdraw || 0);
                            if (utils.formatFee(balance) > trueBalance && utils.formatFee(balance) > financeAccountBalance) {
                                var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],财务账户余额[' + utils.formatTrueFee(financeAccountBalance) + ']需支付余额[' + balance + ']';
                                logger.app.warn(msg);
                                result.message = msg;
                                callback(result);
                                return;
                            }
                        } else {
                            if (utils.formatFee(balance) > trueBalance) {
                                var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + balance + ']';
                                logger.app.warn(msg);
                                result.message = msg;
                                callback(result);
                                return;
                            }
                        }
                    }
                    if (trueFee) {//reset money
                        if (trueFee != totalFee) {
                            logger.app.warn('数据异常，商品总价格(' + trueFee + ')和支付金额(' + totalFee + ')不一致');
                        }
                        data.money = utils.formatMoney(trueFee - balance) + '';
                    }
                    data.totalFee = trueFee + '';
                    data.income = "0";
                    data.proxy = "";
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    result.message = '计算费用异常:' + err.message;
                    callback(result);
                }
            });
        } else {
            var query = {_id: data.serviceno};
//            if(data.serviceFlag==constants.serviceNumFlag.num400){
//            }else{
//            }
            mongo.db().collection(constants.DB.platform_serviceNum).findOne(query, function (err, row) {
                if (!err) {
                    var monthRent = utils.formatTrueFee(row.monthRent);
                    if (isNaN(row.monthRentProxy)) {
                        row.monthRentProxy = 100000;
                    }
                    var monthRentProxy = utils.formatTrueFee(row.monthRentProxy);
                    var p1 = parseInt(data.concurrent, 10) || 0;
                    var p2 = parseInt(data.month, 10) || 0;
                    var trueFee = 0;
                    if (flag == constants.payFlag.buySn) {
                        trueFee = monthRent * p1 * p2;
                    } else if (flag == constants.payFlag.snRenew) {
                        trueFee = monthRent * p1 * p2;
                    } else if (flag == constants.payFlag.buyConcurrent) {
                        var endTime = row.endTime + ' 23:59:59';
                        var currentTime = utils.DateTime.getCurrentDateTime();
                        var day = utils.DateTime.getDateDiff(currentTime, endTime, "day");
                        var month = Math.round(day / 30);
                        trueFee = monthRent * p1 * month;
                    }
                    trueFee = utils.formatMoney(trueFee);
                    financeAccountDBProxy.queryAccountAndFinanceAccount(aid, function (err, acc, financeAcc) {
                        if (!err) {
                            if (payType != constants.payType.online) {//check balance
                                var trueBalance = acc.balance + (acc.overdraw || 0);
                                if (financeAcc) {
                                    var financeAccountBalance = financeAcc.balance + (financeAcc.overdraw || 0);
                                    if (utils.formatFee(balance) > trueBalance && utils.formatFee(balance) > financeAccountBalance) {
                                        var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],财务账户余额[' + utils.formatTrueFee(financeAccountBalance) + ']需支付余额[' + balance + ']';
                                        logger.app.warn(msg);
                                        result.message = msg;
                                        callback(result);
                                        return;
                                    }
                                } else {
                                    if (utils.formatFee(balance) > trueBalance) {
                                        var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + balance + ']';
                                        logger.app.warn(msg);
                                        result.message = msg;
                                        callback(result);
                                        return;
                                    }
                                }
                            }
                            if (trueFee) {//reset money
                                if (trueFee != totalFee) {
                                    logger.app.warn('数据异常，商品总价格(' + trueFee + ')和支付金额(' + totalFee + ')不一致');
                                }
                                data.money = utils.formatMoney(trueFee - balance) + '';
                            }
                            data.totalFee = trueFee + '';


                            //calculate proxy fee
                            mongo.db().collection(constants.DB.system_user).findOne({_id: acc.createUser}, function (err, systemUser) {
                                if (!err) {
                                    var income = 0;
                                    if (systemUser && systemUser.identity == constants.systemUserIndentity.proxy) {
                                        var percent = systemUser.monthRentPercent || 0;
                                        var incomeMonth = utils.formatMoney((monthRent - monthRentProxy) * percent / 100);
                                        if (flag == constants.payFlag.buySn || flag == constants.payFlag.snRenew) {
                                            income = incomeMonth * p1 * p2;
                                        } else if (flag == constants.payFlag.buyConcurrent) {
                                            var endTime = row.endTime + ' 23:59:59';
                                            var currentTime = utils.DateTime.getCurrentDateTime();
                                            var day = utils.DateTime.getDateDiff(currentTime, endTime, "day");
                                            var month = Math.round(day / 30);
                                            income = incomeMonth * p1 * month;
                                        }
                                        income = utils.formatMoney(income);
                                        data.proxy = systemUser._id;
                                    }
                                    data.income = income + "";
                                    result.success = true;
                                    callback(result);
                                } else {
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error(err);
                            result.message = '计算费用异常:' + err.message;
                            callback(result);
                        }
                    });
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        }
    },
    _bankPay: function (data, data2, callback) {
        var result = {
            success: true,
            showView: true,
            view: "pay_blank.html",
            data: {}
        }
        var msg = '';
        handler._reCalculateFee(data2, function (rep) {
            if (rep.success) {
                utils.BusinessUtil.onlinePay(data, function (rep2) {
                    if (rep2.success) {
                        result.data = {html: rep2.html};
                        callback(result);
                    } else {
                        msg = '支付跳转淘宝异常';
                        result.data = {html: msg};
                        result.view = "error_tips.html";
                        callback(result);
                    }
                });
            } else {
                msg = (rep.message || '支付异常');
                result.data = {html: msg};
                result.view = "error_tips.html";
                callback(result);
            }
        });
    },
    bankPay: function (data, callback) {
        var accId = data.account;
        var data2 = data.params;
        var check = data.params.accbalance;
        data.params.payType = constants.payType.online;
        var balance = parseFloat(data.params.balance) || 0;
        if (check && balance) {
            data.params.payType = constants.payType.mix;
        } else {
            data.params.balance = "0";
        }
        data2.account = accId;
        var flag = data.params.flag;
        if (flag == constants.payFlag.buySn) {
            if (data2.serviceFlag == constants.serviceNumFlag.num400) {
                snHandler.check400ServiceNoExist(data2, function (rep) {
                    if (rep.success) {
                        handler._bankPay(data, data2, function (rep2) {
                            callback(rep2);
                        })
                    } else {
                        var msg = (rep.message || '检测服务号异常');
                        if (rep.code == '404') {
                            msg = '该号码已经超时释放或被其他人抢用!';
                        }
                        var result = {
                            success: true,
                            showView: true,
                            view: "error_tips.html",
                            data: {html: msg}
                        }
                        callback(result);
                    }
                });
            } else {
                snHandler.checkServiceNoExist(data2, function (rep) {
                    if (rep.success) {
                        handler._bankPay(data, data2, function (rep2) {
                            callback(rep2);
                        })
                    } else {
                        var msg = (rep.message || '检测服务号异常');
                        if (rep.code == '404') {
                            msg = '该号码已经超时释放或被其他人抢用!';
                        }
                        var result = {
                            success: true,
                            showView: true,
                            view: "error_tips.html",
                            data: {html: msg}
                        }
                        callback(result);
                    }
                });
            }

        } else {
            handler._bankPay(data, data2, function (rep2) {
                callback(rep2);
            })
        }
    },
    balancePay: function (data, session, callback) {
        var result = {success: false};
        var acc = session.account;
        var aid = acc._id;
        var pbx = utils.getProductPbx(data.product, session);
        data.account = aid;
        data.pbx = pbx;
        data.balance = data.money;
        data.payType = constants.payType.balance;

        handler._reCalculateFee(data, function (rep) {
            if (rep.success) {
                snHandler.pay2ServiceNo(data, function (rep) {
                    if (rep.success) {
                        var time = utils.DateTime.getCurrentDateTime();
                        utils.BusinessUtil.getPayOrderNo(aid, function (rep2) {
                            if (rep2.success) {
                                var id = rep2.orderNo;
                                var set = {
                                    _id: id,
                                    status: 'pay',
                                    payType: data.payType,
                                    money: data.money,
                                    bank: data.bank,
                                    account: aid,
                                    create_time: time,
                                    pay_time: time,
                                    flag: data.flag,
                                    totalFee: data.totalFee,
                                    balance: data.balance,
                                    serviceFlag: data.serviceFlag,
                                    product: data.product,
                                    sn: {
                                        serviceno: data.serviceno,
                                        month: data.month,
                                        concurrent: data.concurrent
                                    },
                                    income: data.income,
                                    proxy: data.proxy
                                }
                                if (data.serviceFlag == constants.serviceNumFlag.num400) {
                                    set.sn = {
                                        serviceno: data.serviceno,
                                        month: data.month
                                    }
                                }
                                mongo.db("zj").collection(constants.DB.user_pay).insert(set, {w: 1}, function (err) {
                                    if (!err) {
                                        handler._syncAccBalance(set);
                                        handler._syncProxyBalance(set);
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error(err);
                                        result.message = 'balancePay error!' + err.message;
                                        callback(result);
                                    }
                                });
                            } else {
                                callback(rep2);
                            }
                        });

                    } else {
                        callback(rep);
                    }
                });
            } else {
                callback(rep);
            }
        });
    },
    /**
     * 充值后账号变更为正式账号
     * @param accDB
     */
    updateAccStatus:function(accDB){
        if(!accDB)return;
        var account=accDB._id;
        var accInfo = {status: constants.accountStatus.normal,firstPayTime:utils.DateTime.getCurrentDateTime()};
        var _status = accDB.status;
        if (_status != 'normal' && _status != 'free') {
            mongo.db().collection(constants.DB.platform_account).update({_id: account},{$set:accInfo},function(err){
                if(err){
                    logger.app.error(err);
                    return;
                }
                var eventData = {
                    account : account,
                    user : accDB.createUser || ""
                };
                appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_TURN_USING,eventData);
            });
        }
    },
    _syncAccBalance: function (data, product) {
        var id = data._id;
        var payType = data.payType;
        var payFlag = data.flag;
        var balance = utils.formatFee(parseFloat(data.balance));
        var totalFee = utils.formatFee(parseFloat(data.totalFee));
        var set2 = {balance: -totalFee};
        if (payType == constants.payType.online) {
            set2.balance = 0;
        } else if (payType == constants.payType.mix) {
            set2.balance = -balance;
        }

        financeAccountHandler.consumeFinanceAccountBalance(data.account, set2, {}, function(err, acc, paidAcc, hasFinanceAccount) {
            if (err) {
                logger.app.error(err);
            } else {
                //发送报表事件
                var eventData ={
                    account: data.account,
                    product: data.product,
                    balance: balance
                }
                var eventType;
                if(payFlag == constants.payFlag.renewLicence || payFlag == constants.payFlag.buyLicence || payFlag == constants.payFlag.adjustLicenceNum) {//Licence续费,新增,调整数量
                    eventType = appEvent.EventType.CHARGE_LICENCE;
                    appEvent.emitOperationReportEvent(eventType, eventData);
                }else if(payFlag == constants.payFlag.buySn || payFlag == constants.payFlag.snRenew){//服务号购买,续费
                    eventType = appEvent.EventType.CHARGE_SERVICE_NUMBER;
                    appEvent.emitOperationReportEvent(eventType, eventData);
                }else if(payFlag == constants.payFlag.buyConcurrent){//总机调整并发数
                    eventType = appEvent.EventType.CHARGE_CONCURRENT;
                    appEvent.emitOperationReportEvent(eventType, eventData);
                }

                AccountPayConsume.incrConsume(data.account,balance);//累计消费

                var currentBalance = utils.formatTrueFee(paidAcc.balance) + "";
                var updateExp;
                if (hasFinanceAccount) {
                    currentBalance = utils.formatTrueFee(acc.balance) + "";
                    updateExp = {$set: {currentBalance: currentBalance, financeAccount: paidAcc._id}};
                } else {
                    updateExp = {$set: {currentBalance: currentBalance}};
                }
                mongo.db("zj").collection(constants.DB.user_pay).update({_id: id}, updateExp);

                var sn = data.sn;
                if (payFlag == constants.payFlag.buyDialMin) {//reset notifyNum
                    var pid = acc._id + "_cc";
                } else if (payFlag == constants.payFlag.buy400Min) {//reset notifyNum
                    if (sn) {}
                } else if (payFlag == constants.payFlag.renewLicence) {//reset notifyNum
                    if (sn) {
                        mongo.db().collection(constants.DB.platform_licence).update({_id: sn._id}, {$set: {notifyNum: 0}});
                    }
                } else {
                    //预警
                    if (product == 'zj') {
                        notifyHandler.notifyZJBalance(acc);
                    } else {
                        notifyHandler.notifyCCBalance(acc);
                    }
                }
            }
        });

        //var accInfo = {status: constants.accountStatus.normal};
//      $set:{alerted:false}
//        if (payFlag == constants.payFlag.pay) {//客户充值
//            set2 = {
//                balance: totalFee
//            };
//            mongo.db().collection(constants.DB.platform_account).findAndModify({_id: data.account}, [], {$inc: set2}, {new: true}, function (err, acc) {
//                if (err) {
//                    logger.app.error(err);
//                } else {
//                    var currentBalance = utils.formatTrueFee(acc.balance) + "";
//                    mongo.db("zj").collection(constants.DB.user_pay).update({_id: id}, {$set: {currentBalance: currentBalance}});
//                    handler.resetOweFeeInfo(acc);
//                    handler.updateAccStatus(acc);
//                }
//            });
//        } else {
            //mongo.db().collection(constants.DB.platform_account).findOne({_id: data.account}, function (err, dbAccount) {
            //    if (!err && dbAccount) {
            //        var _status = dbAccount.status;
                    //if (_status == 'free') {
                    //    accInfo = {status: 'free'};
                    //}
 /* ====== start ====== */
//                     mongo.db().collection(constants.DB.platform_account).findAndModify({_id: data.account}, [], {$inc: set2}, {new: true}, function (err, acc) {
//                         if (err) {
//                             logger.app.error(err);
//                         } else {
//                             //发送报表事件
//                             var eventData ={
//                                 account: data.account,
//                                 product: data.product,
//                                 balance: balance
//                             }
//                             var eventType;
//                             if(payFlag == constants.payFlag.renewLicence || payFlag == constants.payFlag.buyLicence || payFlag == constants.payFlag.adjustLicenceNum) {//Licence续费,新增,调整数量
//                                 eventType = appEvent.EventType.CHARGE_LICENCE;
//                                 appEvent.emitOperationReportEvent(eventType, eventData);
//                             }else if(payFlag == constants.payFlag.buySn || payFlag == constants.payFlag.snRenew){//服务号购买,续费
//                                 eventType = appEvent.EventType.CHARGE_SERVICE_NUMBER;
//                                 appEvent.emitOperationReportEvent(eventType, eventData);
//                             }else if(payFlag == constants.payFlag.buyConcurrent){//总机调整并发数
//                                 eventType = appEvent.EventType.CHARGE_CONCURRENT;
//                                 appEvent.emitOperationReportEvent(eventType, eventData);
//                             }
//
//                             AccountPayConsume.incrConsume(data.account,balance);//累计消费
//
//
//                             var sn = data.sn;
//                             var currentBalance = utils.formatTrueFee(acc.balance) + "";
//                             mongo.db("zj").collection(constants.DB.user_pay).update({_id: id}, {$set: {currentBalance: currentBalance}});
//                             if (payFlag == constants.payFlag.buyDialMin) {//reset notifyNum
//                                 var pid = acc._id + "_cc";
// //                        mongo.db().collection(constants.DB.platform_account_product).update({_id:pid},{$set:{notifyNum:0}});
// //                                handler.resetCCOweFeeInfo(constants.DB.platform_account_product,pid);
//                             } else if (payFlag == constants.payFlag.buy400Min) {//reset notifyNum
//                                 if (sn) {
// //                            mongo.db().collection(constants.DB.platform_num400).update({_id:sn._id},{$set:{notifyNum:0}});
// //                                    handler.resetCCOweFeeInfo(constants.DB.platform_num400,sn.serviceno||sn._id);
//                                 }
//                             } else if (payFlag == constants.payFlag.renewLicence) {//reset notifyNum
//                                 if (sn) {
//                                     mongo.db().collection(constants.DB.platform_licence).update({_id: sn._id}, {$set: {notifyNum: 0}});
//                                 }
//                             } else {
//                                 //预警
//                                 if (product == 'zj') {
//                                     notifyHandler.notifyZJBalance(acc);
//                                 } else {
//                                     notifyHandler.notifyCCBalance(acc);
//                                 }
//                             }
//                         }
//                     });
/* ====== end ===== */
                //} else {
                //    logger.app.error(err);
                //}
            //});
        //}
    },
    /**
     * 检查欠费记录、重置账号的欠费状态和次数、及通知次数
     * @param accDB
     */
    resetOweFeeInfo: function (accDB) {
        var balance = accDB.balance;
        var account = accDB._id;
        if (balance >= 0) {//直到缴清欠费则把欠代理的返还
            mongo.db("bill_data").collection(constants.DB.platform_account_owe_fee).find({account: account, status: 'nodeal'}).toArray(function (err, fees) {
                if (!err) {
                    fees = fees || [];
                    if (fees.length > 0) {
                        var index = 0;
                        var payProxy = function () {
                            var obj = fees[index];
                            var time = utils.DateTime.getCurrentDateTime();
                            if (obj) {
                                var _id = obj._id;
                                var type = obj.type;
                                var flag = obj.flag;
                                var proxyFee = obj.proxyFee || 0;
                                var proxy = obj.proxy;
                                var orderNo = obj.orderNo;
                                var incomeId = obj.incomeId || '';
                                var income = utils.formatTrueFee(parseFloat(proxyFee));
                                income = Math.abs(income);
                                if (income > 0) {
                                    //生成代理收入记录
                                    utils.BusinessUtil.getPayOrderNo(account, function (rep2) {
                                        if (rep2.success) {
                                            var id = "Ti" + rep2.orderNo;
                                            var set = {
                                                _id: id,
                                                status: 'pay',
                                                income: income + "",
                                                account: account,
                                                create_time: time,
                                                pay_time: time,
                                                flag: type,
                                                product: obj.product,
                                                proxy: proxy,
                                                orderNo: orderNo,
                                                source: constants.proxySource.oweFee,
                                                memo: '欠费返还',
                                                incomeId: incomeId
                                            }
                                            if (type == 'monthRent') {
                                                handler._syncProxyBalance(set);
                                                mongo.db("bill_data").collection(constants.DB.platform_account_owe_fee).update({_id: _id}, {$set: {status: 'deal'}});
                                            } else if (type == 'minConsume' && flag == 'oweProxy') {//返剩下的低消费用
                                                set.flag = "payCallZJMin";
                                                handler._syncProxyBalance(set);
                                                mongo.db("bill_data").collection(constants.DB.platform_account_owe_fee).update({_id: _id}, {$set: {status: 'deal'}});
                                            }
                                            index++;
                                            payProxy();
                                        } else {
                                            //do nothing
                                            mongo.db("bill_data").collection("platform_account_owe_fee_error").insert(obj);
                                            index++;
                                            payProxy();
                                        }
                                    });
                                } else {
                                    //更新未折算低消给代理的欠费状态
                                    mongo.db("bill_data").collection(constants.DB.platform_account_owe_fee).update({_id: _id}, {$set: {status: 'deal'}});
                                    index++;
                                    payProxy();
                                }
                            } else {
                                //end do nothing
                            }
                        }
                        payProxy();
                    }

                    //重置预停用号码
                    mongo.db().collection(constants.DB.platform_serviceNum).update({
                        account: accDB._id,
                        status: 'use',
                        planFlag: 'sysStop'
                    }, {$set: {planFlag: '', failNum: 0}}, {multi: true});
                    //重置通知次数
                    mongo.db().collection(constants.DB.platform_account).update({_id: accDB._id}, {
                        $set: {
                            notifyNum: 0,
                            failNum: 0
                        }
                    });
                } else {
                    logger.app.error(err);
                }
            })
        }

    },
    /**
     * 检查呼叫中心欠费记录、重置呼叫中心产品的欠费次数、及通知次数
     * @param collection
     * @param productId
     */
    resetCCOweFeeInfo: function (collection, productId) {
        mongo.db().collection(collection).findOne({_id: productId}, function (err, productDB) {
            if (!err) {
                if (productDB && productDB.balance >= 0) {//直到缴清欠费则把欠代理的返还
                    var account = productDB.account;
                    mongo.db("bill_data").collection(constants.DB.platform_account_owe_fee).find({
                        account: account,
                        status: 'nodeal',
                        product: 'cc'
                    }).toArray(function (err, fees) {
                        if (!err) {
                            fees = fees || [];
                            if (fees.length > 0) {
                                var index = 0;
                                var payProxy = function () {
                                    var obj = fees[index];
                                    var time = utils.DateTime.getCurrentDateTime();
                                    if (obj) {
                                        var _id = obj._id;
                                        var type = obj.type;
                                        var flag = obj.flag;
                                        var proxyFee = obj.proxyFee || 0;
                                        var proxy = obj.proxy;
                                        var orderNo = obj.orderNo;
                                        var incomeId = obj.incomeId || '';
                                        var income = utils.formatTrueFee(parseFloat(proxyFee));
                                        income = Math.abs(income);
                                        if (income > 0) {
                                            //生成代理收入记录
                                            utils.BusinessUtil.getPayOrderNo(account, function (rep2) {
                                                if (rep2.success) {
                                                    var id = "Ti" + rep2.orderNo;
                                                    var set = {
                                                        _id: id,
                                                        status: 'pay',
                                                        income: income + "",
                                                        account: account,
                                                        create_time: time,
                                                        pay_time: time,
                                                        flag: type,
                                                        product: "zj",
                                                        proxy: proxy,
                                                        orderNo: orderNo,
                                                        source: constants.proxySource.oweFee,
                                                        memo: '欠费返还',
                                                        incomeId: incomeId
                                                    }
                                                    if (type == 'monthRent') {
                                                        handler._syncProxyBalance(set);
                                                        mongo.db("bill_data").collection(constants.DB.platform_account_owe_fee).update({_id: _id}, {$set: {status: 'deal'}});
                                                    } else if (type == 'minConsume' && flag == 'oweProxy') {//返剩下的低消费用
                                                        set.flag = "payCallZJMin";
                                                        handler._syncProxyBalance(set);
                                                        mongo.db("bill_data").collection(constants.DB.platform_account_owe_fee).update({_id: _id}, {$set: {status: 'deal'}});
                                                    }
                                                    index++;
                                                    payProxy();
                                                } else {
                                                    //do nothing
                                                    mongo.db("bill_data").collection("platform_account_owe_fee_error").insert(obj);
                                                    index++;
                                                    payProxy();
                                                }
                                            });
                                        } else {
                                            //更新未折算低消给代理的欠费状态
                                            mongo.db("bill_data").collection(constants.DB.platform_account_owe_fee).update({_id: _id}, {$set: {status: 'deal'}});
                                            index++;
                                            payProxy();
                                        }
                                    } else {
                                        //end do nothing
                                    }
                                }
                                payProxy();
                            }
                            //重置产品欠费次数和提醒次数
                            mongo.db().collection(collection).update({_id: productId}, {
                                $set: {
                                    failNum: 0,
                                    notifyNum: 0
                                }
                            });
                        } else {
                            logger.app.error(err);
                        }
                    })
                }
            } else {
                logger.app.error(err);
            }
        })

    },
    _syncProxyBalance: function (data) {
        if (data.proxy) {//for proxy
            var income = utils.formatFee(parseFloat(data.income));
            var _time = utils.DateTime.getCurrentDateTime();
            mongo.db().collection(constants.DB.system_user).findAndModify({_id: data.proxy}, [], {$inc: {balance: income}}, {new: true}, function (err, proxyUser) {
                if (err) {
                    logger.app.error(err);
                } else {
                    var billPaySet = data;
                    billPaySet.create_time = _time;
                    billPaySet.timestamp = utils.DateTime.getCurrentTimestamp();
                    billPaySet.currentBalance = utils.formatTrueFee(proxyUser.balance) + "";
                    if (!billPaySet.source) {
                        if ('snRenew buyConcurrent buySn deductMonthRent'.indexOf(data.flag) != -1) {
                            billPaySet.source = constants.proxySource.serviceNo;
                        } else if ('buyLicence renewLicence adjustLicenceNum'.indexOf(data.flag) != -1) {
                            billPaySet.source = constants.proxySource.licence;
                        } else if('renewCustFee deductCustFee'.indexOf(data.flag) != -1){
                               billPaySet.source = constants.proxySource.custFee;
                        }else {
                            billPaySet.source = data.flag;
                        }
                    }
                    mongo.db().collection(constants.DB.bill_user_pay).insert(billPaySet);
                }
            })
        }
    },
    /**
     * 修改out_trade_no  gmt_payment测试
     * http://localhost:3000/alinotify?discount=0.00&payment_type=1&subject=购买服务号&trade_no=2014011063978732&buyer_email=&gmt_create=2014-01-10 23:20:25
     * &notify_type=trade_status_sync&quantity=1&out_trade_no=20140213000001&seller_id=2088011518716086&notify_time=2014-01-10 23:22:03
     * &trade_status=TRADE_SUCCESS&is_total_fee_adjust=N&total_fee=200&gmt_payment=2014-01-10 23:22:03&seller_email=hollycrmmarketing@hollycrm.com
     * &price=0.01&buyer_id=2088002554069320&notify_id=9f58d63e3fd226319dc550da5a88b05f3s&use_coupon=N&sign_type=MD5&sign=539123b04bf870673702a4f94c797945
     * @param data
     * @param callback
     */
    aliNotify: function (data, callback) {
        var orderNo = data.out_trade_no;
        var result = {success: false};
        utils.BusinessUtil.payNotify(data, function (rep) {
            if (rep.Succeed) {
                mongo.db("zj").collection(constants.DB.user_pay).findOne({_id: orderNo}, function (err, row) {
                    if (!err) {
                        var totalFee = utils.formatFee(parseFloat(row.totalFee));
                        var set2 = {
                            balance: totalFee
                        };
                        //累加余额
                        mongo.db().collection(constants.DB.platform_account).findAndModify({_id: row.account}, [], {$inc: set2}, {new: true}, function (err, accDB) {
                            if (err) {
                                logger.app.error(err);
                            } else {
                                handler.resetOweFeeInfo(accDB);
                                var eventData = {
                                    account : accDB._id,
                                    payNum : totalFee,
                                    payUser : "",
                                    payKind : "payAccByBill",
                                    bank : row.bank,
                                    useFor : constants.payFlag.payAccByBill,
                                };
                                //var isFirstPay = false;
                                //if(ccDB.status != 'normal'){
                                //    isFirstPay = true;
                                //}
                                //首次回款,或者距离首次回款时间小于30天的算作首签回款.
                                UserBankPay.isFirstPay(utils.DateTime.getCurrentDateTime(),accDB._id,function(err,isFirstPay) {
                                    if (err) {
                                        logger.app.error(err);
                                        return callback(result);
                                    }

                                    eventData.isFirst = isFirstPay;
                                    appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_PAY, eventData);
                                    AccountPayConsume.incrPay(accDB._id, totalFee);//累计充值
                                    handler.updateAccStatus(accDB);
                                    //给客户经理提成
                                    if (accDB.customerCare && accDB.isBonus2customerCare) {
                                        handler.bonus2CustomerCare(accDB._id, accDB.customerCare, totalFee);
                                    }
                                    // 给技术顾问提成
                                    if (accDB.consultant) {
                                        handler.bonus2Consultant(accDB._id, accDB.consultant, totalFee);
                                    }

                                    var currentBalance = utils.formatTrueFee(accDB.balance) + "";
                                    mongo.db("zj").collection(constants.DB.user_pay).update({_id: orderNo}, {$set: {currentBalance: currentBalance}});
                                    //生成充值记录
                                    var paySet = {
                                        _id: orderNo,
                                        account: row.account,
                                        payType: row.payType,
                                        flag: row.flag,
                                        pay_time: row.pay_time,
                                        bank: row.bank,
                                        money: row.money,
                                        proxy: accDB.createUser,
                                        product: row.product,
                                        isFirstPay: isFirstPay,
                                    }
                                    mongo.db("zj").collection(constants.DB.user_bank_pay).insert(paySet);
                                    //发送充值邮件提醒
                                    var payNotify = {
                                        orderNo: orderNo,
                                        account: row.account,
                                        product: row.product,
                                        pay_time: row.pay_time,
                                        bank: row.bank,
                                        totalFee: row.totalFee,
                                        trade_no: row.ali == null ? "" : row.ali.trade_no
                                    }
                                    notifyHandler.notifyBankPay(payNotify, function (rep) {
                                        if (!rep.success) {
                                            logger.app.error("充值提醒失败，orderNo==" + orderNo);
                                        }
                                    });

                                    result.success = true;
                                    callback(result);
                                });
                            }
                        });

                    } else {
                        logger.app.error(err);
                        result.message = 'aliNotify error!' + err.message;
                        callback(result);
                    }
                });
            } else {
                rep.success = false;
                callback(rep);
            }
        });
    },
    /**
     * http://localhost:3000/public?action=pay.notifyTimeExpired&data={"_id":"01058010003","type":"sn/400"}
     * try normal use
     * @param data
     * @param callback
     */
    notifyTimeExpired: function (data, callback) {
        var result = {success: false};
        var query = {_id: data._id};
        var type = data.type;
        if (type == 'sn') {
            mongo.db().collection(constants.DB.platform_serviceNum).findOne(query, function (err, row) {
                if (!err) {
                    var status = row.status;
                    var product = row.product;
                    var set = {status: constants.serviceNumStatus.stop, planFlag: ""};
                    if (status == constants.serviceNumStatus.try) {
                        set.status = constants.serviceNumStatus.stopTry;
                    }
                    if (product == constants.product.zj) {
                        mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, function (err) {
                            if (!err) {
                                var doc = {
                                    serviceno: row._id,
                                    pbx: row.pbx,
                                    concurrent: "0",
                                    account: row.account
                                }
                                syncAcs.updateServiceNo(doc, function (isSuccess) {
                                    if (isSuccess) {
                                        result.success = true;
                                    }
                                    callback(result);
                                });
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else if (product == constants.product.cc) {
                        mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else {
                        mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, function (err) {
                            if (!err) {
                                logger.app.warn("服务号产品字段未知，停用！");
                                result.success = true;
                                callback(result);
                            } else {
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
        } else if (type == '400') {
            var id = utils.UUID.generateUuid();
            var time = utils.DateTime.getCurrentDateTime();
            var query = {_id: data._id};
            mongo.db().collection(constants.DB.platform_num400).findOne(query, function (err, row) {
                if (!err) {
                    result.row = row;
                    var set = {
                        _id: id,
                        serviceno: data._id,
                        createTime: time,
                        account: row.account,
                        status: 'expired'
                    };
                    mongo.db().collection("temp_400_expired").insert(set, function (err) {
                        if (err) {
                            logger.app.error(err);
                        }
                    });
                    result.success = true;
                    callback(result)
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });

        }

    },
    notifyWaitPayExpired: function (data, callback) {
        var result = {success: false};
        var num = data._id;
        var query = {_id: num};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query, function (err, row) {
            if (!err) {
                var status = row.status;
                var product = row.product;
                var flag = row.flag;
                var uid = row.uid;
                var account = row.account;

                var doc = {
                    serviceno: num,
                    pbx: row.pbx,
                    account: account
                }
                syncAcs.removeServiceNo(doc, function (isSuccess) {
                    if (isSuccess) {
                        var set = {
                            status: constants.serviceNumStatus.stopWaitPay,
                            planFlag: "",
                            account: "",
                            lastAccount: account
                        };
                        mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, function (err) {
                            if (!err) {
                                var snInfo = {
                                    account: account,
                                    flag: row.flag,
                                    uid: row.uid,
                                    serviceNo: row._id
                                }
                                serviceNumHandler.freeIvrResource(snInfo, function (rep) {
                                    callback(rep);
                                });
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error("notifyWaitPayExpired同步acs失败");
                        result.message = "notifyWaitPayExpired同步acs失败";
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
     * http://localhost:3000/public?action=pay.recycleZJTryNum&data={"_id":"01058010003"}
     * try normal use
     * @param data
     * @param callback
     */
    recycleZJTryNum: function (data, callback) {
        var result = {success: false};
        var query = {_id: data._id};
        var sn = data._id;

        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query, function (err, row) {
            if (!err) {
                var account = row.account;
                var flag = row.flag;
                var uid = row.uid;
                var doc = {
                    serviceno: row._id,
                    pbx: row.pbx,
                    account: account
                }
                syncAcs.removeServiceNo(doc, function (isSuccess) {
                    if (isSuccess) {
                        var set = {
                            pbx: '',
                            account: '',
                            status: constants.serviceNumStatus.free,
                            endTime: '',
                            beginTime: '',
                            flag: '',
                            uid: '',
                            product: '',
                            lastAccount: account
                        };
                        mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, function (err) {
                            if (!err) {
                                var snInfo = {
                                    account: account,
                                    flag: row.flag,
                                    uid: row.uid,
                                    serviceNo: row._id
                                }
                                serviceNumHandler.freeIvrResource(snInfo, function (rep) {
                                    callback(rep);
                                });
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error("recycleZJTryNum 同步acs失败");
                        result.message = "recycleZJTryNum 同步acs失败";
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    //用户中心 标准版、企业版、监控版 续费更新，没有产生费用
    updateRenewLicence: function (data, session, callback) {
        var result = {success: false};
        var data2 = data;
        //console.dir(data);
        data.operator = session.account.billLoginName || session.account.name;
        handler._reCalculateLicenceFee(data, function (rep) {
            if (rep.success) {
                //console.dir(data);
                /*                if(parseInt(data.changeNum,10)<0 && parseInt(data.month,10)>0){
                 result.message = "减少数量和增加时长不能同时操作！";
                 callback(result);
                 return;
                 }*/
                var totalFee = parseFloat(data.totalFee);
                if (totalFee > 0) {
                    result.message = '数据异常，商品总价格(' + totalFee + ')和支付金额(' + data2.totalFee + ')不一致';
                    callback(result);
                } else {
                    licenceHandler.pay2Licence(data, function (rep2) {
                        if (rep2.success) {
                            // 余额续费完成之后，生成licence操作记录
                            licenceHandler.generateLicenceOpRecord(licenceHandler.generateLicenceOpData(data, session), function (err) {
                                if (err) {
                                    logger.app.error('生成licence操作记录失败', err);
                                }
                                else {}
                            });
                            result.success = true;
                            callback(result);
                        } else {
                            callback(rep2);
                        }
                    });
                }
            } else {
                callback(rep);
            }
        });
    },

    /***********************************************licence pay**********************************************************/
    _reCalculateLicenceFee: function (data, callback) { //only balance pay
//        console.dir(data);
        var result = {success: false};
        var payType = data.payType;
        var aid = data.account;
        var totalFee = parseFloat(data.totalFee);
        //var balance = parseFloat(data.balance) || 0;
        //if (payType == constants.payType.mix) {
        //    totalFee = totalFee + balance;
        //}
        totalFee = utils.formatMoney(totalFee);
        //var trueFee=utils.formatMoney(totalFee);
        var product = data.product;
        var productId = aid + "_" + product;
        var payFlag = data.flag;
        mongo.db().collection(constants.DB.platform_licence).findOne({_id: data._id}, function (err, row) {
            if (!err && row) {
                mongo.db().collection(constants.DB.platform_account_product).findOne({_id: productId}, function (err, myProduct) {
                    if (!err) {
                        var inPrice = utils.formatTrueFee(myProduct.callinLicence);
                        var monitorPrice = utils.formatTrueFee(myProduct.monitorLicence);
                        var serviceLicence = utils.formatTrueFee(myProduct.serviceLicence);
                        var endDate = row.endDate;
                        //reset to db value
                        data.endDate = endDate;
                        data.status = row.status;
                        data.licenceType = row.licenceType;

                        var licenceType = data.licenceType;
                        var num = parseInt(data.num, 10) || 0;//修改后的数量
                        var oldNum = parseInt(row.num, 10);
                        //reset to db value
                        data.oldNum = oldNum;
                        var trueFee = 0;
                        var feeNum = num;
                        var feeDate = 0;
                        if (payFlag == 'adjustLicenceNum') {
                            var _FeeHandler = function (nowDate, endDate, price, changeNum, trueFee) {//补齐
                                //若已到期返回
                                if (utils.DateTime.getBetweenDays(endDate, utils.DateTime.getDateDesc(nowDate)) < 1) {
                                    return trueFee;
                                }
                                //获取两个日期之间的月份数
                                var months = utils.DateTime.getDateMonthSub(nowDate, endDate);
                                if (months >= 1) {
                                    trueFee += changeNum * price * months;
                                    feeDate = months;
                                }
                                var date2 = utils.DateTime.dateAdd("M", months, nowDate);
                                var days = utils.DateTime.getBetweenDays(endDate, utils.DateTime.getDateDesc(date2));
                                trueFee += days / 30 * price * changeNum;
                                feeDate += days / 30;
                                return trueFee;
                            };
                            var nowDate = new Date();
                            //获取改变的数量
                            var changeNum = (num - oldNum) || 0;
                            data.changeNum = changeNum + "";
                            data.month = "0";
                            feeNum = changeNum;
                            if (data.status != "try") {
                                if (changeNum > 0) {//增加
                                    if (licenceType == "service") {
                                        trueFee = _FeeHandler(nowDate, endDate, serviceLicence, changeNum, trueFee);
                                    } else if (licenceType == "monitor") {
                                        trueFee = _FeeHandler(nowDate, endDate, monitorPrice, changeNum, trueFee);
                                    } else if (licenceType == "enterprise") {
                                        trueFee = _FeeHandler(nowDate, endDate, inPrice, changeNum, trueFee);
                                    }
                                }
                            }
                        } else {
                            data.changeNum = "0";
                            var month = parseInt(data.month, 10) || 0;
                            feeDate = month;
                            if (month >= 1) {
                                if (licenceType == "service") {
                                    trueFee = num * serviceLicence * month;
                                } else if (licenceType == "monitor") {//监控版计费
                                    trueFee = num * monitorPrice * month;
                                } else if (licenceType == "enterprise") {//企业版计费
                                    trueFee = num * inPrice * month;
                                }
                            }
                        }
                        trueFee = utils.format2Decimal(trueFee);

                        mongo.db().collection(constants.DB.platform_account).findOne({_id: aid}, function (err, acc) {
                            if (!err) {
                                financeAccountDBProxy.queryFinanceAccountById(acc.financeAccount, function (err, financeAccount) {
                                    if (!err) {
                                        //if (payType != constants.payType.online) {//check balance
                                        //判断支付的同时，是否有其他人支付导致余额不足
                                        var trueBalance = acc.balance + (acc.overdraw || 0);
                                        if (financeAccount) {
                                            var financeAccountBalance = financeAccount.balance + (financeAccount.overdraw || 0);
                                            if (utils.formatFee(trueFee) > trueBalance && utils.formatFee(trueFee) > financeAccountBalance) {
                                                var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],财务账户余额[' + utils.formatTrueFee(financeAccountBalance) + ']需支付余额[' + trueFee + ']';
                                                logger.app.warn(msg);
                                                result.message = msg;
                                                callback(result);
                                                return;
                                            }
                                        } else {
                                            if (utils.formatFee(trueFee) > trueBalance) {
                                                var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + trueFee + ']';
                                                logger.app.warn(msg);
                                                result.message = msg;
                                                callback(result);
                                                return;
                                            }
                                        }
                                        //}
                                        if (trueFee) {//reset money
                                            if (trueFee != totalFee) {
                                                logger.app.warn('数据异常，商品总价格(' + trueFee + ')和支付金额(' + totalFee + ')不一致');
                                            }
                                        }
                                        data.totalFee = trueFee + '';
                                        data.feeDate = utils.format2Decimal(feeDate) + '';
                                        data.feeNum = feeNum + '';

                                        //calculate proxy fee
                                        Account.getProxy(acc._id,function (err, systemUser) {
                                            if (!err) {
                                                var income = 0;
                                                if (systemUser && systemUser.identity == constants.systemUserIndentity.proxy) {
                                                    var percent = systemUser.agentPercent;
                                                    var proxyType = systemUser.proxyType;
                                                    if (isNaN(percent)) {
                                                        percent = 0;
                                                    }
                                                    data.proxy = systemUser._id;

                                                    if (handler.isOurSales(proxyType)) {
                                                        income = (trueFee * percent) / 100;
                                                        income = utils.format2Decimal(income);
                                                    } else {
                                                        if (!systemUser.serviceLicence) {
                                                            systemUser.serviceLicence = 0;
                                                        }
                                                        var _inPrice = utils.formatTrueFee(systemUser.callinLicence);
                                                        var _monitorPrice = utils.formatTrueFee(systemUser.monitorLicence);
                                                        var _servicePrice = utils.formatTrueFee(systemUser.serviceLicence);
                                                        //var _outPrice=utils.formatTrueFee(systemUser.calloutLicence);

                                                        if (licenceType == constants.licenceType.enterprise) {
                                                            income = (inPrice - _inPrice) * feeDate * feeNum;
                                                        } else if (licenceType == constants.licenceType.outcall) {
                                                            //income=(outPrice-_outPrice)*feeDate*num;
                                                        } else if (licenceType == constants.licenceType.monitor) {
                                                            income = (monitorPrice - _monitorPrice) * feeDate * feeNum;
                                                        } else if (licenceType == constants.licenceType.service) {
                                                            income = (serviceLicence - _servicePrice) * feeDate * feeNum;
                                                        }
                                                        income = (income * percent) / 100;
                                                        income = utils.format2Decimal(income);
                                                    }
                                                }
                                                data.income = income + "";
                                                result.success = true;
                                                callback(result);
                                            } else {
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        });
                                    } else {
                                        logger.app.error(err);
                                        result.message = '计算费用异常:' + err.message;
                                        callback(result);
                                    }
                                });
                            } else {
                                logger.app.error(err);
                                result.message = '计算费用异常:' + err.message;
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error(err);
                        result.message = '计算费用异常:' + err.message;
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                result.message = '计算费用异常:' + err.message;
                callback(result);
            }
        });
    },
    /**
     * licence调整数量和续费
     * @param data
     * @param session
     * @param callback
     * @constructor
     */
    LicenceBalancePay: function (data, session, callback) {
        var result = {success: false};
        var acc = session.account;
        var aid = acc._id;
//        var pbx=utils.getProductPbx(data.product,session);
        data.account = aid;
        data.pbx = data.pbx;

        ////以后重构去掉,money和balance已无意义
        data.money = '0';
        data.balance = data.totalFee;

        data.payType = constants.payType.balance;
        data.operator = session.account.billLoginName || session.account.name;

        handler._reCalculateLicenceFee(data, function (rep) {
            if (rep.success) {
                licenceHandler.pay2Licence(data, function (rep) {
                    if (rep.success) {
                        // 余额续费完成之后，生成licence操作记录
                        licenceHandler.generateLicenceOpRecord(licenceHandler.generateLicenceOpData(data, session), function (err) {
                           if (err) {
                               logger.app.error('生成licence操作记录失败', err);
                           }
                           else {}
                        });
                        var time = utils.DateTime.getCurrentDateTime();
                        utils.BusinessUtil.getPayOrderNo(aid, function (rep2) {
                            if (rep2.success) {
                                var id = rep2.orderNo;
                                var set = {
                                    _id: id,
                                    status: 'pay',
                                    payType: data.payType,
                                    money: data.money,
                                    bank: data.bank,
                                    account: aid,
                                    create_time: time,
                                    pay_time: time,
                                    flag: data.flag,
                                    totalFee: data.totalFee,
                                    balance: data.balance,
                                    serviceFlag: data.serviceFlag || '',
                                    product: data.product,
                                    sn: {
                                        _id: data._id || '',
                                        licenceType: data.licenceType,
                                        licencePrice: data.licencePrice,
                                        beginDate: data.beginDate,
                                        month: data.month || 0 + "",
                                        //presentMonth:data.presentMonth+"",
                                        num: data.num + "",//续费数量
                                        changeNum: data.changeNum || 0 + "",
                                        pbx: data.pbx
                                    },
                                    income: data.income,
                                    proxy: data.proxy
                                }
                                if (parseInt(data.month, 10) < 1) {
                                    set.sn.num = data.changeNum + "";
                                }
                                mongo.db("zj").collection(constants.DB.user_pay).insert(set, {w: 1}, function (err) {
                                    if (!err) {
                                        handler._syncAccBalance(set);
                                        handler._syncProxyBalance(set);
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error(err);
                                        result.message = 'licence balancePay error!' + err.message;
                                        callback(result);
                                    }
                                });
                            } else {
                                callback(rep2);
                            }
                        });

                    } else {
                        callback(rep);
                    }
                });
            } else {
                callback(rep);
            }
        });
    },
    startAutoRenew: function(data,session,callback){
        var result = {success:false};
        var acc = session.account;
        var aid = acc._id;

        var custFeeId = data.custFeeId;

        _impl.getCustFee(aid,custFeeId,function(err,custFee){
            if(err){
                log.app.error(err);
                result.message = '未找到扣费规则,启动失败';
                callback(result);
                return;
            }
            if(!custFee){
                result.message = '未找到扣费规则,启动失败';
                callback(result);
                return;
            }

            var trueFee = utils.formatTrueFee(custFee.price);
            _impl.checkBalanceAvailable(aid,trueFee,function(err,checkRes){//钱够吗?
                if(err){
                    logger.app.error(err);
                    result.message = '检查余额失败,启动失败' + err.message;
                    callback(result);
                    return;
                }
                if(!checkRes.available){
                    var msg = '账户的余额不够支付:实际余额[' + checkRes.balance + '],需支付余额[' + checkRes.needPay + ']';
                    logger.app.warn(msg);
                    result.message = msg;
                    callback(result);
                    return;
                }

                _impl.startAutoRenewCustFee(aid,custFeeId,function(err){
                    if(err){
                        logger.app.error(err);
                        result.message = '启动失败';
                        callback(result);
                        return;
                    }

                    result.success=true;
                    callback(result);

                });

            });
        });
    },
    custFeeBalancePay: function(data,session,callback){
        var result = {success:false};
        var acc = session.account;
        var aid = acc._id;

        ////以后重构去掉,money和balance已无意义
        //data.money = '0';
        //data.balance = data.totalFee;
        //
        //data.payType = constants.payType.balance;
        //data.operator = session.account.billLoginName || session.account.name;

        data.duration = parseInt(data.duration);


        _impl.calculateCustFee(data.custFeeId,acc,data.duration,function(err,feeResult){//计算费用
            if(err){
                logger.app.error(err);
                result.message = 'cust fee balancePay error!' + err.message;
                callback(result);
                return;
            }
            if(!feeResult){
                result.message = '计算费用失败';
                return;
            }
            _impl.checkBalanceAvailable(aid,feeResult.trueFee,function(err,checkRes){//钱够吗?
                if(err){
                    logger.app.error(err);
                    result.message = 'cust fee balancePay error!' + err.message;
                    callback(result);
                    return;
                }
                if(!checkRes.available){
                    var msg = '账户的余额不够支付:实际余额[' + checkRes.balance + '],需支付余额[' + checkRes.needPay + ']';
                    logger.app.warn(msg);
                    result.message = msg;
                    callback(result);
                    return;
                }
                _impl.renewCustFee(acc,data.custFeeId,data.duration, function (err) {//本着先吃饭再收钱的服务态度,先生效扣费
                    if (err) {
                        logger.app.error(err);
                        result.message = 'cust fee balancePay error!' + err.message;
                        callback(result);
                        return;
                    }
                    var currTime = utils.DateTime.getCurrentDateTime();
                    utils.BusinessUtil.getPayOrderNo(aid, function (resp) {//流水号
                        if (!resp.success) {
                            callback(resp);
                            return;
                        }

                        var payRecord = {
                            _id: resp.orderNo,
                            status: 'pay',
                            payType: constants.payType.balance,
                            money: '0',
                            account: aid,
                            create_time: currTime,
                            pay_time: currTime,
                            flag: constants.payFlag.renewCustFee,
                            totalFee: feeResult.totalFee,
                            balance: parseFloat(feeResult.totalFee),
                            serviceFlag: '',
                            product: constants.product.custFee,
                            income: feeResult.proxyIncome,
                            proxy: feeResult.proxyId,
                        };

                        _impl.addAccPayRecord(payRecord, function (err) {//记录付款
                            if (err) {
                                logger.app.error(err);
                                result.message = 'cust fee balancePay error!' + err.message;
                                callback(result);
                                return;
                            }

                            //扣余额
                            handler._syncAccBalance(payRecord);
                            //加代理收入
                            handler._syncProxyBalance(payRecord);

                            result.success = true;
                            callback(result);
                        })
                    });
                });
            });
        });


    },
    licenceBankPay: function (data, callback) {//废弃
        var accId = data.account;
        var data2 = data.params;
        var check = data.params.accbalance;
        data.params.payType = constants.payType.online;
        var balance = parseFloat(data.params.balance) || 0;
        if (check && balance) {
            data.params.payType = constants.payType.mix;
        } else {
            data.params.balance = "0";
        }
        data2.account = accId;
        var result = {
            success: true,
            showView: true,
            view: "pay_blank.html",
            data: {}
        }
        var msg = '';
        handler._reCalculateLicenceFee(data2, function (rep) {
            if (rep.success) {
                //if(parseInt(data.changeNum,10)<0 && parseInt(data.month,10)>0){
                //    result.message = "减少数量和增加时长不能同时操作！";
                //    callback(result);
                //    return;
                //}
                utils.BusinessUtil.onlinePay(data, function (rep2) {
                    if (rep2.success) {
                        result.data = {html: rep2.html};
                        callback(result);
                    } else {
                        msg = '支付跳转异常';
                        result.data = {html: msg};
                        result.view = "error_tips.html";
                        callback(result);
                    }
                });
            } else {
                msg = (rep.message || '支付异常');
                result.data = {html: msg};
                result.view = "error_tips.html";
                callback(result);
            }
        });
    },
    _updateProductAndLicence: function (data, session, callback) {
        var result = {success: false};
        var aid = data.account;
        var time = utils.DateTime.getCurrentDateTime();
        var oldLicencePriceType = data.oldLicencePriceType;
        var licencePriceType = data.licencePriceType;
        //var paidNum = data.paidNum;
        //var oldNum = data.oldNum;
        var changeNum = data.changeNum;
        var payNum = data.payNum;
        var num = data.num;
        //var giveMinuteSum = data.giveMinuteSum;
        var licenceId = data._id;
        var product = data.product;
        var productId = aid + "_" + product;

        if (data.status != constants.licenceStatus.try && licencePriceType == oldLicencePriceType && changeNum == 0) {
            result.message = "licence套餐和数量没有改变";
            callback(result);
        } else {
            var licenceSet = {
                $set: {
                    num: num,
                    lastUpdateTime: time,
                    status: constants.licenceStatus.use,
                    licencePriceTypeNew: licencePriceType
                },
                $unset: {endDate: 1}
            };
            if (payNum > 0) {
                licenceSet.$set.paidNum = num;
            }
            if (data.status == constants.licenceStatus.try) {
                licenceSet.$set.licencePriceType = licencePriceType;
            }
            mongo.db().collection(constants.DB.platform_licence).update({_id: licenceId}, licenceSet, function (err) {
                if (!err) {
                    //生成日志
                    var log = {
                        _id: utils.UUID.generateUuid(),
                        licence: licenceId,
                        licenceType: data.licenceType,
                        account: data.account,
                        num: changeNum,//增加或减少的数量
                        licencePriceType: licencePriceType,//更改后的套餐
                        type: 'priceType',//操作类型 priceType add reduce priceTypeAndAdd priceTypeAndReduce
                        createTime: utils.DateTime.getCurrentDateTime(),
                        operator: session.account.billLoginName || session.account.name
                    };
                    if (licencePriceType != oldLicencePriceType && changeNum != 0) {
                        if (changeNum > 0) {
                            log.type = "priceTypeAndAdd";
                        } else {
                            log.type = "priceTypeAndReduce"
                        }
                    } else if (licencePriceType == oldLicencePriceType && changeNum != 0) {
                        if (changeNum > 0) {
                            log.type = "add";
                        } else {
                            log.type = "reduce"
                        }
                    }
                    mongo.db().collection(constants.DB.log_adjust_licence).insert(log);
                    //获取下月
                    var date = utils.DateTime.getNextMonth1();
                    var dateArray = date.split("-");
                    var year = dateArray[0];
                    var month = dateArray[1];
                    var proSet = {
                        minConsume: data.minConsume,
                        giveMinute: parseInt(data.giveMinuteSum, 10),
                        effectYear: year,
                        effectMonth: month,
                        effectDate: year + "-" + month
                    };
                    mongo.db().collection(constants.DB.platform_account_product).update({_id: productId}, {$set: proSet}, function (err) {
                        if (!err) {
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
        }
    },
    _reOutcallCalculateLicenceFee: function (data, callback) {
        var result = {success: false};
        var payType = data.payType;
        var aid = data.account;
        var balance = parseFloat(data.balance) || 0;//余额支付金额
        var totalFee = utils.formatMoney(parseFloat(data.money));//请求中的总费用
        var product = data.product;
        var productId = aid + "_" + product;
        var licenceId = data._id;
        var licenceNum = parseInt(data.num, 10);//修改后的licence数量

        mongo.db().collection(constants.DB.platform_licence).findOne({_id: licenceId}, function (err, row) {
            if (!err) {
                mongo.db().collection(constants.DB.platform_account_product).findOne({_id: productId}, function (err, myProduct) {
                    if (!err) {
                        data.licenceType = row.licenceType;
                        data.status = row.status;
                        data.oldNum = parseInt(row.num, 10);
                        data.paidNum = parseInt(row.paidNum, 10);
                        data.licencePriceTypeNew = row.licencePriceTypeNew || row.licencePriceType;
                        var calloutLicence = myProduct.calloutLicence;
                        var oldLicencePriceType = row.licencePriceType;//旧的套餐
                        data.oldLicencePriceType = oldLicencePriceType;
                        var licencePriceType = data.licencePriceType;//新的套餐
                        var price = utils.formatTrueFee(calloutLicence[licencePriceType].price || 0);//新套餐价格
                        var minute = parseInt(calloutLicence[licencePriceType].minute || 0);//新套餐赠送分钟数
                        var leaveDay = utils.DateTime.getLastDayAway2();//获取本月剩余天数
                        data.leaveDay = leaveDay;
                        var monthDay = utils.DateTime.getCurrentMonthDay();//获取本月天数
                        data.monthDay = monthDay;
                        var changeNum = licenceNum - data.oldNum;//改变的数量
                        data.changeNum = changeNum;
                        var payNum = licenceNum - data.paidNum;//需要付费的数量
                        data.payNum = payNum;
                        var trueFee = 0;
                        var giveMinutePay = 0;
                        if (payNum > 0) {
                            if (row.status == constants.licenceStatus.try) {//试用转正用按当前选择的套餐
                                trueFee = utils.format2Decimal(payNum * price * leaveDay / monthDay);
                                //增加数量产生的赠送分钟数
                                giveMinutePay = parseInt(payNum * minute * leaveDay / monthDay);
                                data.licencePrice = price;
                            } else if (row.status == constants.licenceStatus.use) {//正用状态按照旧的套餐计费
                                var oldPrice = utils.formatTrueFee(calloutLicence[oldLicencePriceType].price || 0);//旧的价格
                                var oldMinute = parseInt(calloutLicence[oldLicencePriceType].minute || 0);//旧的赠送分钟数
                                trueFee = utils.format2Decimal(payNum * oldPrice * leaveDay / monthDay);
                                giveMinutePay = parseInt(payNum * oldMinute * leaveDay / monthDay);
                                data.licencePrice = oldPrice;
                            }
                        }
                        data.giveMinutePay = giveMinutePay;//累加到话单上
                        //低消和赠送分钟数按照旧的套餐计算，下月生效
                        data.giveMinuteSum = minute * licenceNum;//更新到产品上，下月生效
                        data.minConsume = utils.formatFee(licenceNum * price);
                        financeAccountDBProxy.queryAccountAndFinanceAccount(aid, function (err, acc, financeAcc) {
                            if (!err) {
                                var trueBalance = acc.balance + (acc.overdraw || 0);
                                if (financeAcc) {
                                    var financeAccountBalance = financeAcc.balance + (financeAcc.overdraw || 0);
                                    if (utils.formatFee(balance) > trueBalance && utils.formatFee(balance) > financeAccountBalance) {
                                        var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],财务账户余额[' + utils.formatTrueFee(financeAccountBalance) + ']需支付余额[' + balance + ']';
                                        logger.app.warn(msg);
                                        result.message = msg;
                                        callback(result);
                                        return;
                                    }
                                } else {
                                    if (utils.formatFee(balance) > trueBalance) {
                                        var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + balance + ']';
                                        logger.app.warn(msg);
                                        result.message = msg;
                                        callback(result);
                                        return;
                                    }
                                }
                                if (trueFee) {//reset money
                                    if (trueFee != totalFee) {
                                        logger.app.warn('数据异常，商品总价格(' + trueFee + ')和支付金额(' + totalFee + ')不一致');
                                    }
                                    data.money = '0';
                                }
                                data.totalFee = trueFee + '';
                                if (acc.createMethod == constants.accountCreateMethod.proxy && data.payNum > 0) {
                                    mongo.db().collection(constants.DB.system_user).findOne({_id: acc.createUser}, function (err, systemUser) {
                                        if (!err) {
                                            var income = 0;
                                            if (systemUser && systemUser.identity == constants.systemUserIndentity.proxy) {
                                                var percent = systemUser.agentPercent;
                                                if (isNaN(percent)) {
                                                    percent = 0;
                                                }
                                                income = parseFloat(trueFee) * percent / 100;
                                                income = utils.format2Decimal(income);
                                                data.proxy = systemUser._id;
                                            }
                                            data.income = income + "";
                                            result.success = true;
                                            callback(result);
                                        } else {
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    });
                                } else {
                                    data.income = "0";
                                    data.proxy = "";
                                    result.success = true;
                                    callback(result);
                                }
                            } else {
                                logger.app.error(err);
                                result.message = '计算费用异常:' + err.message;
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error(err);
                        result.message = '计算费用异常:' + err.message;
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                result.message = '计算费用异常:' + err.message;
                callback(result);
            }
        });
    },
    outcallLicenceBalancePay: function (data, session, callback) {
        var result = {success: false};
        var num = data.num;
        var a = data.licenceType;
        var updateData = {
            num: data.num,
            lastUpdateTime: utils.DateTime.getCurrentDateTime()
        };
        //get license data from db
        mongo.db().collection(constants.DB.platform_licence).findOne({_id: data._id}, function (err, dbLicense) {
            if (!err && dbLicense) {
                if (dbLicense.num != num) { //num change
                    //更改license数据
                    mongo.db().collection(constants.DB.platform_licence).update({_id: data._id}, {$set: updateData},{w:1}, function (err) {
                        if (!err) {
                            if (data.licenceType == "outcall") {
                                var sumNum = 0;
                                mongo.db().collection(constants.DB.platform_licence).find({account: data.account, status: "use", licenceType: "outcall"}).toArray(function (err,doc) {
                                    if(!err){
                                        doc=doc||[];
                                        for (var i = 0; i < doc.length; i++) {
                                            sumNum += parseInt(doc[i].num);
                                        }
                                        handler._processOutCallMinConsume(sumNum, dbLicense.account, function (success) {
                                            if (!success) {
                                                result.message = "_processOutCallMinConsume minConsume error!";
                                            }
                                        });
                                    }else{
                                        logger.app.error(err);
                                    }
                                });
                            }
                            //log
                            var log = {
                                _id: utils.UUID.generateUuid(),
                                licence: dbLicense._id,
                                licenceType: dbLicense.licenceType,
                                account: dbLicense.account,
                                num: num - dbLicense.num,//增加或减少的数量
                                type: 'change',
                                createTime: utils.DateTime.getCurrentDateTime(),
                                operator: session.user
                            };
                            mongo.db().collection(constants.DB.log_adjust_licence).insert(log);
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else {
                    result.success = true;
                    callback(result);
                }
            } else {
                result.message = "can not found license by id [" + data._id + "]";
                callback(result);
            }
        });
    },
    _processOutCallMinConsume: function (num, account, callback) {
        var id = account + "_cc";
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: id}, function (err, dbProduct) {
            if (!err && dbProduct) {
                if (dbProduct.calloutLicenceStrategy == 'licencePrice') { // if neet to calculate
                    var price = dbProduct.calloutLicence || 0;
                    var minute = dbProduct.calloutMinute || 0;
                    var minConsume = price * num;
                    var giveMinute = minute * num;
                    var update = {
                        minConsume: minConsume,
                        giveMinute: giveMinute
                    };
                    mongo.db().collection(constants.DB.platform_account_product).update({_id: id}, {$set: update}, function (err) {
                        if (!err) {
                            callback(true);
                        } else {
                            logger.app.error("reSet minConsume error!");
                            callback(false);
                        }
                    });

                } else {
                    callback(true);
                }
            } else {
                logger.app.error("not found account product !");
                callback(false);
            }
        });
    },
    outcallLicenceBalancePay_bak: function (data, session, callback) {
        var result = {success: false};
        var acc = session.account;
        var aid = acc._id;
        data.account = aid;
        data.pbx = data.pbx;
        data.balance = data.money;
        data.payType = constants.payType.balance;
        data.num = parseInt(data.num, 10);

        //重新计算外呼licence资费
        handler._reOutcallCalculateLicenceFee(data, function (rep) {
            if (rep.success) {
                var totalFee = utils.formatFee(parseFloat(data.totalFee));
                if (totalFee > 0) {
                    handler._updateProductAndLicence(data, session, function (rep2) {
                        if (rep2.success) {
                            var time = utils.DateTime.getCurrentDateTime();
                            utils.BusinessUtil.getPayOrderNo(aid, function (rep3) {
                                if (rep3.success) {
                                    var id = rep3.orderNo;
                                    var set = {
                                        _id: id,
                                        status: 'pay',
                                        payType: data.payType,
                                        money: data.money,
                                        bank: data.bank,
                                        account: aid,
                                        create_time: time,
                                        pay_time: time,
                                        flag: data.flag,
                                        totalFee: data.totalFee,
                                        balance: data.balance,
                                        serviceFlag: data.serviceFlag || '',
                                        product: data.product,
                                        sn: {
                                            _id: data._id || '',
                                            licenceType: data.licenceType,
                                            licencePrice: data.licencePrice,
                                            licencePriceType: data.oldLicencePriceType || data.licencePriceType,
                                            beginDate: data.beginDate,
                                            leaveDay: data.leaveDay,
                                            num: data.payNum,
                                            pbx: data.pbx
                                        },
                                        income: data.income,
                                        proxy: data.proxy
                                    }
                                    mongo.db("zj").collection(constants.DB.user_pay).insert(set, {w: 1}, function (err) {
                                        if (!err) {
                                            handler._syncAccBalance(set);
                                            handler._syncProxyBalance(set);
                                            handler._syncBill(data);//同步话单
                                            result.success = true;
                                            callback(result);
                                        } else {
                                            logger.app.error(err);
                                            result.message = 'licence balancePay error!' + err.message;
                                            callback(result);
                                        }
                                    });
                                } else {
                                    callback(rep3);
                                }
                            });
                        } else {
                            callback(rep2);
                        }
                    });
                } else {
                    handler._updateProductAndLicence(data, session, function (rep2) {
                        if (rep2.success) {
                            result.success = true;
                            callback(result);
                        } else {
                            callback(rep2);
                        }
                    });
                }
            } else {
                callback(rep);
            }
        });
    },
    _syncBill: function (data) {
        //if(accDB != null && accDB.get("createMethod").equals("proxy")){
        //    bill.put("proxy",accDB.get("createUser"));
        //}
        var month = utils.DateTime.getCurrentDateMonth();
        var billID = data.account + "_" + month + "_" + data.product;
        mongo.db().collection(constants.DB.bill_call_consume).findOne({_id: billID}, function (err, row) {
            if (!err) {
                var totalFee = utils.formatFee(parseFloat(data.totalFee));
                if (row) {
                    var setData = {
                        $inc: {giveMinute: parseInt(data.giveMinutePay), minConsume: totalFee, balance: totalFee}
                    };
                    mongo.db().collection(constants.DB.bill_call_consume).update({_id: billID}, setData, {w: 1}, function (err) {
                        if (err) {
                            logger.app.error(err);
                        }
                    });
                } else {
                    var dateArray = month.split("-");
                    var bill = {
                        _id: billID,
                        account: data.account,
                        accountType: "normal",
                        name: data.product,
                        displayName: "",
                        year: dateArray[0],
                        month: dateArray[1],
                        calls: 0,
                        localMinutes: 0,
                        remoteMinutes: 0,
                        localSecond6: 0,
                        remoteSecond6: 0,
                        minConsume: totalFee,
                        balance: totalFee,
                        giveMinute: parseInt(data.giveMinutePay),

                        actualConsume: 0,
                        monthRent: 0,
                        discount: 0,
                        createTime: utils.DateTime.getCurrentDateTime()
                    };
                    if (data.proxy) {
                        bill.proxy = data.proxy;
                    }
                    mongo.db().collection(constants.DB.bill_call_consume).insert(bill, {w: 1}, function (err) {
                        if (err) {
                            logger.app.error(err);
                        }
                    });
                }
            } else {
                logger.app.error(err);
            }
        });
    },

    telBalanceUpdate: function (data, callback) {
        var result = {success: false};
//        var proxyId="ed6b0780-1975-11e4-b3d5-bf12edd54f64";//test
        var proxyId = "aaa67b50-c92f-11e3-a37a-ef82078a047b";
        var endTime = data.endTime;
        mongo.db().collection(constants.DB.platform_account).find({createUser: proxyId}).toArray(function (err, accounts) {
            if (!err) {
                accounts = accounts || [];
                var ids = [];
                for (var i = 0; i < accounts.length; i++) {
                    var obj = accounts[i];
                    ids.push(obj._id);
                }
                mongo.db().collection("platform_serviceNum").find({
                    account: {$in: ids},
                    status: 'use',
                    endTime: {$lte: endTime}
                }).toArray(function (err, nums) {
                    if (!err) {
                        nums = nums || [];
                        var index = 0;
                        var updateBalance = function () {
                            var sn = nums[index];
                            if (sn) {
                                var aid = sn.account;
                                var monthRent = sn.monthRent;
                                mongo.db().collection("platform_account_product").findOne({_id: aid + "_zj"}, function (err, product) {
                                    if (!err && product) {
                                        var balance = product.balance;
                                        if (monthRent <= balance) {
                                            mongo.db().collection("platform_account_product").update({_id: aid + "_zj"}, {$inc: {balance: -monthRent}}, function (err) {
                                                if (!err) {
                                                    var set2 = {
                                                        balance: monthRent
                                                    };
                                                    mongo.db().collection(constants.DB.platform_account).findAndModify({_id: aid}, [], {$inc: set2}, {new: true}, function (err, acc) {
                                                        if (err) {
                                                            logger.app.error(err);
                                                        } else {
                                                            var currentBalance = utils.formatTrueFee(acc.balance) + "";
                                                            var time = utils.DateTime.getCurrentDateTime();
                                                            utils.BusinessUtil.getPayOrderNo(aid, function (rep2) {
                                                                if (rep2.success) {
                                                                    var id = rep2.orderNo;
                                                                    var set = {
                                                                        _id: "Tel" + id,
                                                                        account: aid,
                                                                        payType: "telBalancePay",
                                                                        flag: "telBalancePay",//话费转余额
                                                                        pay_time: time,
                                                                        money: utils.formatTrueFee(monthRent) + "",
                                                                        bank: "",
                                                                        proxy: ""
                                                                    }
                                                                    mongo.db("zj").collection(constants.DB.user_bank_pay).insert(set, {w: 1}, function (err) {
                                                                        if (!err) {
                                                                            mongo.db("zj").collection(constants.DB.user_bank_pay).update({_id: id}, {$set: {currentBalance: currentBalance}});
                                                                            index++;
                                                                            updateBalance();
                                                                        } else {
                                                                            logger.app.error(err);
                                                                            callback(result);
                                                                        }
                                                                    });
                                                                } else {
                                                                    callback(rep2);
                                                                }
                                                            });
                                                        }
                                                    });
                                                } else {
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            });
                                        } else {
                                            index++;
                                            updateBalance();
                                        }
                                    } else {
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            } else {
                                result.success = true;
                                callback(result);
                            }
                        }
                        updateBalance();
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("telBalancePay list error", err);
                callback(result);
            }
        });
    },

    /***********************************************zj  pay new**********************************************************/
    /**
     * 费用精确到分
     * @param data
     * @param callback
     * @private
     */
    _reCalculateFee2ZJMonthRent: function (data, callback) {
//        console.dir(data);
        var result = {success: false};
        var flag = data.flag;
        var aid = data.account;

        var balance = parseFloat(data.balance) || 0;
        var totalFee = parseFloat(data.money);

        var query = {_id: data.serviceno};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query, function (err, row) {
            if (!err) {
                snHandler._setDateInfo2Month(row);
                var monthRent = utils.formatTrueFee(row.monthRent);
                var concurrentFee = utils.formatTrueFee(row.concurrentFee || 0);
                if (isNaN(row.monthRentProxy)) {
                    row.monthRentProxy = 100000;
                }
                var monthRentProxy = utils.formatTrueFee(row.monthRentProxy);

                var monthDay = row.monthDay;
                var leaveDay = row.leaveDay;
                data.leaveDay = leaveDay;
                var trueFee = 0;
                var proxyFee = 0;
                if (flag == constants.payFlag.buySn) {
                    trueFee = (monthRent / monthDay) * leaveDay;
                    proxyFee = ((monthRent - monthRentProxy) / monthDay) * leaveDay;
                } else if (flag == constants.payFlag.snRenew) {
                    var _monthRent = monthRent + concurrentFee;
                    trueFee = (_monthRent / monthDay) * leaveDay;
                    proxyFee = ((monthRent - monthRentProxy + concurrentFee) / monthDay) * leaveDay;
                }
                trueFee = utils.format2Decimal(trueFee);
                proxyFee = utils.format2Decimal(proxyFee);

                financeAccountDBProxy.queryAccountAndFinanceAccount(aid, function (err, acc, financeAcc) {
                    if (!err) {
                        var trueBalance = acc.balance + (acc.overdraw || 0);
                        if (financeAcc) {
                            var financeAccountBalance = financeAcc.balance + (financeAcc.overdraw || 0);
                            if (utils.formatFee(balance) > trueBalance && utils.formatFee(balance) > financeAccountBalance) {
                                var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],财务账户余额[' + utils.formatTrueFee(financeAccountBalance) + ']需支付余额[' + balance + ']';
                                logger.app.warn(msg);
                                result.message = msg;
                                callback(result);
                                return;
                            }
                        } else {
                            if (utils.formatFee(balance) > trueBalance) {
                                var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + balance + ']';
                                logger.app.warn(msg);
                                result.message = msg;
                                callback(result);
                                return;
                            }
                        }
                        if (trueFee) {//reset money
                            if (trueFee != totalFee) {
                                logger.app.warn('数据异常，商品总价格(' + trueFee + ')和支付金额(' + totalFee + ')不一致');
                            }
                            data.money = '0';
                        }
                        data.totalFee = trueFee + '';


                        //calculate proxy fee
//                        if(isNaN(row.monthRentProxy)){//号码底价
//                            row.monthRentProxy=100000;
//                        }
//                        var monthRentMin=utils.formatTrueFee(row.monthRentProxy);
                        //if (acc.createMethod == constants.accountCreateMethod.proxy) {
                        Account.getProxy(acc._id,function(err,proxy){
                            if (!err) {
                                if (proxy) {
                                    var income = 0;

                                    var monthRentPercent = proxy.monthRentPercent;
                                    income = parseFloat(proxyFee) * monthRentPercent / 100;
                                    income = utils.format2Decimal(income);

                                    data.income = income + "";
                                    data.proxy = proxy._id;
                                }else{
                                    data.income = "0";
                                    data.proxy = "";
                                }

                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });

                    } else {
                        logger.app.error(err);
                        result.message = '计算费用异常:' + err.message;
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    balancePay2ZJMonthRent: function (data, session, callback) {
//        console.dir(data);
        var result = {success: false};
        var acc = session.account;
        var aid = acc._id;
        var pbx = utils.getProductPbx(data.product, session);
        data.account = aid;
        data.pbx = pbx;
        data.balance = data.money;
        data.payType = constants.payType.balance;

        var payFlag = data.flag;
        if (payFlag == constants.payFlag.buySn) {
            data.concurrent = 1;
        }
        handler._reCalculateFee2ZJMonthRent(data, function (rep) {
            if (rep.success) {
                snHandler.pay2ZJServiceNo(data, function (rep) {
                    if (rep.success) {
                        var time = utils.DateTime.getCurrentDateTime();
                        utils.BusinessUtil.getPayOrderNo(aid, function (rep2) {
                            if (rep2.success) {
                                var id = rep2.orderNo;
                                var set = {
                                    _id: id,
                                    status: 'pay',
                                    payType: data.payType,
                                    money: data.money,
                                    bank: data.bank,
                                    account: aid,
                                    create_time: time,
                                    pay_time: time,
                                    flag: data.flag,
                                    totalFee: data.totalFee,
                                    balance: data.balance,
                                    serviceFlag: data.serviceFlag,
                                    product: data.product,
                                    sn: {
                                        serviceno: data.serviceno,
                                        concurrent: data.concurrent,
                                        leaveDay: data.leaveDay
                                    },
                                    income: data.income,
                                    proxy: data.proxy
                                }
                                if (data.serviceFlag == constants.serviceNumFlag.num400) {
                                    set.sn = {
                                        serviceno: data.serviceno
                                    }
                                }
                                mongo.db("zj").collection(constants.DB.user_pay).insert(set, {w: 1}, function (err) {
                                    if (!err) {
                                        handler._syncAccBalance(set, "zj");
                                        handler._syncProxyBalance(set);
                                        var _totalFee = utils.formatFee(parseFloat(data.totalFee));
                                        handler.syncZJMonthConcume(aid, _totalFee, function (rep) {
                                        });
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error(err);
                                        result.message = 'balancePay error!' + err.message;
                                        callback(result);
                                    }
                                });
                            } else {
                                callback(rep2);
                            }
                        });

                    } else {
                        callback(rep);
                    }
                });
            } else {
                callback(rep);
            }
        });
    },
    _reCalculateFee2ZJConcurrent: function (data, callback) {
        var result = {success: false};
        var aid = data.account;

        var balance = parseFloat(data.balance) || 0;
        var totalFee = parseFloat(data.money);
        var concurrent = parseInt(data.concurrent, 10);

        var query = {_id: data.serviceno};
        var productId = aid + "_" + "zj";
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query, function (err, row) {
            if (!err) {
                mongo.db().collection(constants.DB.platform_account_product).findOne({_id: productId}, function (err, productDB) {
                    if (!err && productDB) {
                        data.oldConcurrent = row.concurrent;
                        snHandler._setDateInfo2Month(row);
                        var monthDay = row.monthDay;
                        var leaveDay = row.leaveDay;
                        data.leaveDay = leaveDay;
                        var concurrentPrice = utils.formatTrueFee(productDB.concurrentPrice || 100000);
                        var adjustConcurrent = concurrent - parseInt(data.oldConcurrent);
                        data.adjustConcurrent = adjustConcurrent;
                        var trueFee = (adjustConcurrent * concurrentPrice / monthDay) * leaveDay;
                        trueFee = utils.format2Decimal(trueFee);
                        var proxyFee = (adjustConcurrent * (concurrentPrice - constants.currentPriceMin) / monthDay) * leaveDay;
                        proxyFee = utils.format2Decimal(proxyFee);
                        financeAccountDBProxy.queryAccountAndFinanceAccount(aid, function (err, acc, financeAcc) {
                            if (!err) {
                                var trueBalance = acc.balance + (acc.overdraw || 0);
                                if (financeAcc) {
                                    var financeAccountBalance = financeAcc.balance + (financeAcc.overdraw || 0);
                                    if (utils.formatFee(balance) > trueBalance && utils.formatFee(balance) > financeAccountBalance) {
                                        var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],财务账户余额[' + utils.formatTrueFee(financeAccountBalance) + ']需支付余额[' + balance + ']';
                                        logger.app.warn(msg);
                                        result.message = msg;
                                        callback(result);
                                        return;
                                    }
                                } else {
                                    if (utils.formatFee(balance) > trueBalance) {
                                        var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + balance + ']';
                                        logger.app.warn(msg);
                                        result.message = msg;
                                        callback(result);
                                        return;
                                    }
                                }
                                if (trueFee) {//reset money
                                    if (trueFee != totalFee) {
                                        logger.app.warn('数据异常，商品总价格(' + trueFee + ')和支付金额(' + totalFee + ')不一致');
                                    }
                                    data.money = '0';
                                }
                                data.totalFee = trueFee + '';
                                //if (acc.createMethod == constants.accountCreateMethod.proxy && data.adjustConcurrent > 0) {
                                //  mongo.db().collection(constants.DB.system_user).findOne({_id: acc.createUser}, function (err, systemUser) {
                                Account.getProxy(acc._id,function(err,proxy){
                                    if (!err) {
                                        if (proxy && data.adjustConcurrent > 0) {
                                            var income = 0;
                                            var monthRentPercent = proxy.monthRentPercent;
                                            income = parseFloat(proxyFee) * monthRentPercent / 100;
                                            income = utils.format2Decimal(income);

                                            data.income = income + "";
                                            data.proxy = proxy._id;
                                        }else{
                                            data.income = "0";
                                            data.proxy = "";
                                        }
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error(err);
                                        result.message = '计算费用异常:' + err.message;
                                        callback(result);
                                    }
                                });
                            } else {
                                logger.app.error(err);
                                result.message = '计算费用异常:' + err.message;
                                callback(result);
                            }
                        });
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
    balancePay2ZJConcurrent: function (data, session, callback) {
//        console.dir(data);
        var result = {success: false};
        var acc = session.account;
        var aid = acc._id;
        var pbx = utils.getProductPbx(data.product, session);
        data.account = aid;
        data.pbx = pbx;
        data.balance = data.money;
        data.payType = constants.payType.balance;

        var time = utils.DateTime.getCurrentDateTime();

        var sn = data.serviceno;
        var query = {_id: sn};
        handler._reCalculateFee2ZJConcurrent(data, function (rep) {
            if (rep.success) {
                var totalFee = utils.formatFee(parseFloat(data.totalFee));
                var concurrent = parseInt(data.concurrent, 10);
                var adjustConcurrent = data.adjustConcurrent;
                if (adjustConcurrent > 0) {
                    syncAcs.updateServiceNo(data, function (isSuccess) {
                        if (isSuccess) {
                            var set = {
                                concurrent: concurrent,
                                planFlag: "",
                                lastUpdateTime: time
                            };
                            mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, function (err) {
                                if (!err) {
                                    var log = {
                                        serviceno: sn,
                                        account: data.account,
                                        num: adjustConcurrent,
                                        type: 'add',
                                        createTime: time,
                                        operator: session.account.billLoginName || session.account.name
                                    };
                                    mongo.db("zj").collection(constants.DB.log_adjust_concurrent).insert(log);

                                    utils.BusinessUtil.getPayOrderNo(aid, function (rep2) {
                                        if (rep2.success) {
                                            var id = rep2.orderNo;
                                            var set = {
                                                _id: id,
                                                status: 'pay',
                                                payType: data.payType,
                                                money: data.money,
                                                bank: data.bank,
                                                account: aid,
                                                create_time: time,
                                                pay_time: time,
                                                flag: data.flag,
                                                totalFee: data.totalFee,
                                                balance: data.balance,
                                                serviceFlag: data.serviceFlag,
                                                product: data.product,
                                                sn: {
                                                    serviceno: data.serviceno,
                                                    concurrent: adjustConcurrent,
                                                    leaveDay: data.leaveDay
                                                },
                                                income: data.income,
                                                proxy: data.proxy
                                            }

                                            mongo.db("zj").collection(constants.DB.user_pay).insert(set, {w: 1}, function (err) {
                                                if (!err) {
                                                    handler._syncAccBalance(set, "zj");
                                                    handler._syncProxyBalance(set);
//                                                    var _totalFee=utils.formatFee(parseFloat(data.totalFee));
                                                    handler.syncZJMonthConcume(aid, totalFee, function (rep) {
                                                    });
                                                    result.success = true;
                                                    callback(result);
                                                } else {
                                                    logger.app.error(err);
                                                    result.message = 'balancePay error!' + err.message;
                                                    callback(result);
                                                }
                                            });
                                        } else {
                                            callback(rep2);
                                        }
                                    });
                                } else {
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        } else {
                            callback(result);
                        }
                    });
                } else if (adjustConcurrent < 0) {
                    var set = {
                        concurrentNew: concurrent,//减少后的并发数
                        lastUpdateTime: time,
                        planFlag: "reduce"//计划操作
                    };
                    mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, function (err) {
                        if (!err) {
                            var log = {
                                serviceno: sn,
                                account: data.account,
                                num: adjustConcurrent,
                                type: 'reduce',
                                createTime: time,
                                operator: session.account.billLoginName || session.account.name
                            };
                            mongo.db("zj").collection(constants.DB.log_adjust_concurrent).insert(log);
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else {
                    result.message = "呼入并发数没有改变";
                    callback(result);
                }
            } else {
                callback(rep);
            }
        });
    },
    /**
     * public interface :计费调用
     * @param data
     * @param callback
     */
    notifySyncConcurrent: function (data, callback) {
        var result = {success: false};
        var concurrent = parseInt(data.concurrent, 10);
        var num = data.num;
        var query = {_id: num};
        var time = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query, function (err, sn) {
            if (!err && sn) {
                var info = {
                    account: sn.account,
                    pbx: sn.pbx,
                    concurrent: concurrent,
                    serviceno: num
                }
                syncAcs.updateServiceNo(info, function (isSuccess) {
                    if (isSuccess) {
                        var log = {
                            serviceno: num,
                            account: sn.account,
                            num: concurrent,
                            type: 'reduceEffect',
                            createTime: time,
                            operator: "system"
                        };
                        mongo.db("zj").collection(constants.DB.log_adjust_concurrent).insert(log);
                        result.success = true;
                        callback(result);
                    } else {
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        })

    },
    syncZJMonthConcume: function (account, monthRent, callback) {
        var url = config.serviceUrl + '?Action=syncZJMonthConcume&account=' + account + '&monthRent=' + monthRent;
        // var url = 'http://127.0.0.1:8888/service' + '?Action=syncZJMonthConcume&account=' + account + '&monthRent=' + monthRent;
        url = encodeURI(url);
        httpProvider.sendGet(url, function (err, result) {
            if (!err && result) {
                try {
                    var res = JSON.parse(result);
                    if (res.Succeed) {
                        callback(null);
                    } else {
                        callback(new Error('request service[syncZJMonthConcume] error!'));
                    }
                } catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            } else {
                var error = err || new Error('request service[syncZJMonthConcume] error!');
                logger.request.error(error);
                callback(error);
            }
        });
    },
    /***********************************************cc num  pay new**********************************************************/
    _reCalculateFee2CCMonthRent: function (data, callback) {
//        console.dir(data);
        var result = {success: false};
        var flag = data.flag;
        var aid = data.account;

        var balance = parseFloat(data.balance) || 0;
        var totalFee = parseFloat(data.money);

        var query = {_id: data.serviceno};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query, function (err, row) {
            if (!err) {
                snHandler._setDateInfo2Month(row);
                var monthRent = utils.formatTrueFee(row.monthRent);
                var concurrentFee = utils.formatTrueFee(row.concurrentFee || 0);
                if (isNaN(row.monthRentProxy)) {
                    row.monthRentProxy = 100000;
                }
                var monthRentProxy = utils.formatTrueFee(row.monthRentProxy);

                var monthDay = row.monthDay;
                var leaveDay = row.leaveDay;
                data.leaveDay = leaveDay;
                var trueFee = 0;
                var proxyFee = 0;
                if (flag == constants.payFlag.buySn) {
                    trueFee = (monthRent / monthDay) * leaveDay;
                    proxyFee = ((monthRent - monthRentProxy) / monthDay) * leaveDay;
                } else if (flag == constants.payFlag.snRenew) {
                    var _monthRent = monthRent;
                    trueFee = (_monthRent / monthDay) * leaveDay;
                    proxyFee = ((monthRent - monthRentProxy) / monthDay) * leaveDay;
                }
                trueFee = utils.format2Decimal(trueFee);
                proxyFee = utils.format2Decimal(proxyFee);
                financeAccountDBProxy.queryAccountAndFinanceAccount(aid, function (err, acc, financeAcc) {
                    if (!err) {
                        var trueBalance = acc.balance + (acc.overdraw || 0);
                        if (financeAcc) {
                            var financeAccountBalance = financeAcc.balance + (financeAcc.overdraw || 0);
                            if (utils.formatFee(balance) > trueBalance && utils.formatFee(balance) > financeAccountBalance) {
                                var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],财务账户余额[' + utils.formatTrueFee(financeAccountBalance) + ']需支付余额[' + balance + ']';
                                logger.app.warn(msg);
                                result.message = msg;
                                callback(result);
                                return;
                            }
                        } else {
                            if (utils.formatFee(balance) > trueBalance) {
                                var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + balance + ']';
                                logger.app.warn(msg);
                                result.message = msg;
                                callback(result);
                                return;
                            }
                        }
                        if (trueFee) {//reset money
                            if (trueFee != totalFee) {
                                logger.app.warn('数据异常，商品总价格(' + trueFee + ')和支付金额(' + totalFee + ')不一致');
                            }
                            data.money = '0';
                        }
                        data.totalFee = trueFee + '';


                        //calculate proxy fee
//                        if(isNaN(row.monthRentProxy)){//号码底价
//                            row.monthRentProxy=100000;
//                        }
//                        var monthRentMin=utils.formatTrueFee(row.monthRentProxy);
                        //if (acc.createMethod == constants.accountCreateMethod.proxy) {
                        //  mongo.db().collection(constants.DB.system_user).findOne({_id: acc.createUser}, function (err, systemUser) {
                        Account.getProxy(acc._id,function(err,proxy){
                            if (!err) {
                                if (proxy) {
                                    var income = 0;

                                    var monthRentPercent = proxy.monthRentPercent;
                                    income = parseFloat(proxyFee) * monthRentPercent / 100;
                                    income = utils.format2Decimal(income);

                                    data.income = income + "";
                                    data.proxy = proxy._id;
                                }else{
                                    data.income = "0";
                                    data.proxy = "";
                                }

                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error(err);
                        result.message = '计算费用异常:' + err.message;
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    balancePay2CCMonthRent: function (data, session, callback) {
//        console.dir(data);
        var result = {success: false};
        var acc = session.account;
        var aid = acc._id;
        var pbx = utils.getProductPbx(data.product, session);
        data.account = aid;
        data.pbx = pbx;
        data.balance = data.money;
        data.payType = constants.payType.balance;

        var payFlag = data.flag;
        data.concurrent = 1;
        handler._reCalculateFee2CCMonthRent(data, function (rep) {
            if (rep.success) {
                snHandler.pay2CCServiceNo(data, function (rep) {
                    if (rep.success) {
                        var time = utils.DateTime.getCurrentDateTime();
                        utils.BusinessUtil.getPayOrderNo(aid, function (rep2) {
                            if (rep2.success) {
                                var id = rep2.orderNo;
                                var set = {
                                    _id: id,
                                    status: 'pay',
                                    payType: data.payType,
                                    money: data.money,
                                    bank: data.bank,
                                    account: aid,
                                    create_time: time,
                                    pay_time: time,
                                    flag: data.flag,
                                    totalFee: data.totalFee,
                                    balance: data.balance,
                                    serviceFlag: data.serviceFlag,
                                    product: data.product,
                                    sn: {
                                        serviceno: data.serviceno,
                                        concurrent: data.concurrent,
                                        leaveDay: data.leaveDay
                                    },
                                    income: data.income,
                                    proxy: data.proxy
                                }
                                if (data.serviceFlag == constants.serviceNumFlag.num400) {
                                    set.sn = {
                                        serviceno: data.serviceno
                                    }
                                }
                                mongo.db("zj").collection(constants.DB.user_pay).insert(set, {w: 1}, function (err) {
                                    if (!err) {
                                        handler._syncAccBalance(set, "cc");
                                        handler._syncProxyBalance(set);
                                        var _totalFee = utils.formatFee(parseFloat(data.totalFee));
                                        handler.syncCCMonthConcume(aid, _totalFee, function (rep) {
                                        });
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error(err);
                                        result.message = 'balancePay error!' + err.message;
                                        callback(result);
                                    }
                                });
                            } else {
                                callback(rep2);
                            }
                        });

                    } else {
                        callback(rep);
                    }
                });
            } else {
                callback(rep);
            }
        });
    },
    syncCCMonthConcume: function (account, monthRent, callback) {
        var url = config.serviceUrl + '?Action=syncCCMonthConcume&account=' + account + '&monthRent=' + monthRent;
        // var url = 'http://127.0.0.1:8888/service' + '?Action=syncCCMonthConcume&account=' + account + '&monthRent=' + monthRent;
        url = encodeURI(url);
        httpProvider.sendGet(url, function (err, result) {
            if (!err && result) {
                try {
                    var res = JSON.parse(result);
                    if (res.Succeed) {
                        callback(null);
                    } else {
                        callback(new Error('request service[syncCCMonthConcume] error!'));
                    }
                } catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            } else {
                var error = err || new Error('request service[syncCCMonthConcume] error!');
                logger.request.error(error);
                callback(error);
            }
        });
    },
    bonus2CustomerCare:function(accId,customerCare,balance){
        if(!accId || !balance || !customerCare){
            return;
        }
        //提成比例 0.5%
        var _bonusPercent = 0.5/100;
        var bonus = Math.round(balance * _bonusPercent);

        mongo.db().collection(constants.DB.system_user).findAndModify({_id:customerCare},[],{$inc:{balance:bonus}},{new:true},function(err,theCustomerCare){
            if(err){
                logger.app.error(err);
                return;
            }
            //客户经理收支明细
            utils.BusinessUtil.getPayOrderNo(null,function(resp){
                var paySet = {
                    _id: resp.orderNo,
                    create_time:utils.DateTime.getCurrentDateTime(),
                    timestamp:utils.DateTime.getCurrentTimestamp(),
                    income:bonus,
                    totalFee:balance,
                    currentBalance:theCustomerCare.balance,
                    source:constants.customerCareSource.payAccount,
                    account : accId,
                    customerCare : customerCare,
                }
                mongo.db().collection(constants.DB.bill_customerCare_pay).insert(paySet);
            });

        });

    },
    // 技术顾问充值提成计算方法
    bonus2Consultant: function (accountId, consultantId, balance) {
        if (!accountId || !consultantId || !balance) {
            return ;
        }
        // 提成比例 0.2%
        var bonus = Math.round(2 / 1000 * balance);

        mongo.db().collection(constants.DB.system_user).findAndModify({_id: consultantId}, [], {$inc: {balance: bonus}}, {new: true}, function (err, consultant) {
            if (err) {
                logger.app.error(err);
                return;
            }
            // 技术顾问收支明细
            utils.BusinessUtil.getPayOrderNo(null, function (resp) {
                var paySet = {
                    _id: resp.orderNo,
                    create_time: utils.DateTime.getCurrentDateTime(),
                    timestamp: utils.DateTime.getCurrentTimestamp(),
                    income: bonus,
                    totalFee: balance,
                    currentBalance: consultant.balance,
                    source: constants.customerCareSource.payAccount,
                    account : accountId,
                    consultant : consultantId
                };
                mongo.db().collection(constants.DB.bill_consultant_pay).insert(paySet);
            });
        });
    }
};

var _impl = {
    addAccPayRecord: function(payRecord,callback){
        mongo.db("zj").collection(constants.DB.user_pay).insert(payRecord, {w: 1}, function (err) {
            if (err) {
                callback(err);
                return;
            }

            callback();
        });
    },
    startAutoRenewCustFee: function(accountId,custFeeId,callback){
        _impl.getCustFee(accountId,custFeeId,function(err,custFee) {
            if (err) {
                callback(err);
                return;
            }

            if(!custFee.autoRenew){//不允许续费'自动续费'
                callback(new Error('not allowed to be started,cause the specified custFee is not auto renew type'));
                return;
            }

            if(custFee.state && custFee.state != 'stop'){//不允许续费'自动续费'
                callback(new Error('cannot be started,cause the specified custFee is in use already.'));
                return;
            }

            var custFeeSet = {
                beginTime : utils.DateTime.getCurrentDateTime(),
                state : 'normal',
                updateTime : utils.DateTime.getCurrentDateTime(),
                id : custFee.id
            };
            _impl.updateCustFeeForAutoRenew(accountId + '_custFee',custFeeSet,function(err){
                if(err){
                    callback(err);
                    return;
                }

                callback();
            });


        });
    },
    renewCustFee : function(account,custFeeId,duration,callback){
        _impl.getCustFee(account._id,custFeeId,function(err,custFee){
            if(err){
                callback(err);
                return;
            }

            if(custFee.autoRenew){//不允许续费'自动续费'
                callback(new Error('auto renew custFee is not allowed to renew'));
                return;
            }

            var beginTimeStr;
            var endTime , endTimeStr;
            var baseTime;


            if(custFee.state == 'stop'){//重置起始时间为当前时间
                beginTimeStr = utils.DateTime.getCurrentDateTime();
                baseTime = new Date();
            }else{
                beginTimeStr = custFee.beginTime;
                //assert custFee.endTime != null
                baseTime = new Date(custFee.endTime);
            }
            switch(custFee.pricePeriod){
                case 'year':
                {
                    endTime = utils.DateTime.dateAdd('y',duration,baseTime);
                    break;
                }
                case 'month':
                {
                    endTime = utils.DateTime.dateAdd('M',duration,baseTime);
                    break;
                }
                case 'week':
                {
                    endTime = utils.DateTime.dateAdd('w',duration,baseTime);
                    break;
                }
                case 'day':
                {
                    endTime = utils.DateTime.dateAdd('d',duration,baseTime);
                }
                case 'hour':
                {
                    endTime = utils.DateTime.dateAdd('h',duration,baseTime);
                    break;
                }
                default:break;
            }
            endTimeStr = utils.DateTime.getDateFormat(endTime);

            var custFeeSet = {
                beginTime : beginTimeStr,
                endTime : endTimeStr,
                state : 'normal',
                updateTime : utils.DateTime.getCurrentDateTime(),
                id : custFee.id
            };
            _impl.updateCustFeeForRenew(account._id + '_custFee',custFeeSet,function(err){
                if(err){
                    callback(err);
                    return;
                }

                callback();
            });
        });

    },
    checkBalanceAvailable : function(aid,trueFee,callback){
        _impl.getAccount(aid,function(err,record){
            if(err){
                callback(err);
                return;
            }

            if (record[financeAccountHandler.constant]) {

                financeAccountDBProxy.queryFinanceAccountById(record[financeAccountHandler.constant], function (err, financeAcount) {
                   if (err) {
                       callback(err);
                       return;
                   } else {
                       var trueBalance = utils.formatTrueFee(record.balance + (record.overdraw || 0));
                       var financeAccountBalance = utils.formatTrueFee(financeAcount.balance + (financeAcount.overdraw || 0));
                       var checkResult = {available:true};
                       if(trueFee > trueBalance && trueFee > financeAccountBalance){
                           checkResult.available = false;
                           checkResult.balance = trueBalance;
                           checkResult.needPay = trueFee;
                           callback(null,checkResult);
                           return;
                       }
                       callback(null,checkResult);
                   }
                });

            } else {
                var trueBalance = utils.formatTrueFee(record.balance + (record.overdraw || 0));

                var checkResult = {available:true};
                if(trueFee > trueBalance){
                    checkResult.available = false;
                    checkResult.balance = trueBalance;
                    checkResult.needPay = trueFee;

                    callback(null,checkResult);
                    return;
                }
                callback(null,checkResult);
            }
        });
    },
    calculateCustFee : function(custFeeId,account,duration,callback){
        var feeResult = {};
        _impl.getProduct(account._id + '_custFee',function(err,product){
            if(err){
                callback(err);
                return;
            }

            _impl.getCustFee(account._id,custFeeId,function(err,custFee) {
                if (err) {
                    callback(err);
                    return;
                }

                feeResult.trueFee = utils.formatTrueFee(custFee.price) * duration;
                feeResult.totalFee = utils.format2Decimal(feeResult.trueFee);
                feeResult.proxyIncome = utils.format2Decimal(feeResult.trueFee * (100 - (product.poundage || 0)) / 100);

                Account.getProxy(account._id, function (err, user) {
                    if (err) {
                        callback(null, null);
                        return;
                    }
                    if (user.identity != constants.systemUserIndentity.proxy) {
                        callback(null, null);
                        return;
                    }
                    feeResult.proxyId = user._id;
                    callback(null, feeResult);
                });
            });
        });
    },
    getCustFee : function(accountId,custFeeId,callback){
        _impl.getCustFeeList(accountId,function(err,records) {
            if (err) {
                callback(err);
                return;
            }
            if (!records || records.length <= 0) {
                callback(null, null);
                return;
            }

            var custFee;

            var custFeeMatch = records.filter(function (item) {
                return item.id == custFeeId;
            });
            if (custFeeMatch.length == 0) {
                callback(null, null);
                return;
            }

            custFee = custFeeMatch[0];

            callback(null,custFee);
        });
    },
    getCustFeeList: function(account,callback){
        _impl.getProduct(account+'_custFee',function(err,product){
            if(err){
                callback(err);
                return;
            }
            if(!product){
                callback(null,null);
                return;
            }

            callback(null,product.custFees);
        });
    },
    getProduct : function(id,callback) {
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: id}, function (err, record) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, record);
        });
    },

    getSysUser: function(userId,callback){
        mongo.db().collection(constants.DB.system_user).findOne({_id: userId}, function (err, record) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, record);
        });
    },
    getAccount: function(acountId,callback){
        mongo.db().collection(constants.DB.platform_account).findOne({_id: acountId}, function (err, record) {
            if(err){
                callback(err);
                return;
            }
            callback(null,record)
        });
    },
    updateCustFeeForRenew:function(productId,custFee,callback){
        mongo.db().collection(constants.DB.platform_account_product).update({_id:productId,custFees:{$elemMatch: {id:custFee.id}}},{$set:{"custFees.$.beginTime":custFee.beginTime,"custFees.$.endTime":custFee.endTime,'custFees.$.state':custFee.state,'custFees.$.updateTime':custFee.updateTime}},function(err){
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    },

    updateCustFeeForAutoRenew:function(productId,custFee,callback){
        mongo.db().collection(constants.DB.platform_account_product).update({_id:productId,custFees:{$elemMatch: {id:custFee.id,state:'stop'}}},{$set:{"custFees.$.beginTime":custFee.beginTime,"custFees.$.endTime":null,'custFees.$.state':custFee.state,'custFees.$.updateTime':custFee.updateTime}},function(err){
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    },

};

module.exports = handler;
