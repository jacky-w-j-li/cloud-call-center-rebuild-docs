var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig');
var fs = require("fs");
var appEvent = require("appEvent");
var financeAccountHandler = require(__baseDir + "/7moor/account/FinanceAccountHandler");
var financeAccountDBProxy = require(__baseDir + "/7moor/account/FinanceAccountDBProxy");
var Then = require('thenjs');

var AccountPayConsume = require(__baseDir + '/models/AccountPayConsume');

var handler = {
    mail:"liudl@7moor.com",
    getAddrList: function (data, session, callback) {
        var result = {success: false};
        var condition = data||{};
        condition.account=session.account._id;
        utils.removeEmptyProperty(condition);

        mongo.db().collection(constants.DB.bill_invoice_addr).find(condition,{sort:{create_time:-1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    checkNum:function(data,callback){
        var result = {success: false};
        var query={account:data.account};
        mongo.db().collection(constants.DB.bill_invoice_addr).count(query,function (err, count) {
            if (!err) {
                result.num = count;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    addAddr: function (data, session, callback) {
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        data._id=id;
        data.createTime=time;
        data.lastTime=time;
        data.account=aid;

        var isDefault=data.isDefault;
        handler.checkNum(data,function(rep){
            if(rep.success){
                var num=rep.num;
                if(num<5){
                    if(isDefault){
                        mongo.db().collection(constants.DB.bill_invoice_addr).update({account:aid,isDefault:true},{$set:{isDefault:false}},{multi:true,w:1},function (err) {
                            if (!err) {
                                mongo.db().collection(constants.DB.bill_invoice_addr).insert(data, function (err) {
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
                    }else{
                        mongo.db().collection(constants.DB.bill_invoice_addr).insert(data, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }
                }else{
                    result.message = '地址最多保存5个';
                    callback(result);
                }
            } else{
                callback(rep);
            }
        });
    },
    getAddrById:function(data,session,callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.bill_invoice_addr).findOne({_id:data._id},function(err,row){
            if(!err){
                result.success = true;
                result.row=row;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    updateAddr: function (data, session, callback) {
        var result = {success: false};
        var id=data._id;
        delete data._id
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        data.lastTime=time;

        var isDefault=data.isDefault;
        if(isDefault){
            mongo.db().collection(constants.DB.bill_invoice_addr).update({account:aid,isDefault:true},{$set:{isDefault:false}},{multi:true,w:1},function (err) {
                if (!err) {
                    mongo.db().collection(constants.DB.bill_invoice_addr).update({_id:id},{$set:data}, function (err) {
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
        }else{
            mongo.db().collection(constants.DB.bill_invoice_addr).update({_id:id},{$set:data}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        }
    },
    delAddr: function (data, session, callback) {
        var result = {success: false};
        var id=data._id;

        mongo.db().collection(constants.DB.bill_invoice_addr).remove({_id:id},function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    ////////=====info
    getInfoList: function (data, session, callback) {
        var result = {success: false};
        var condition = data||{};
        condition.account=session.account._id;
        utils.removeEmptyProperty(condition);

        mongo.db().collection(constants.DB.bill_invoice_info).find(condition,{sort:{create_time:-1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    checkInfoNum:function(data,callback){
        var result = {success: false};
        var query={account:data.account};
        mongo.db().collection(constants.DB.bill_invoice_info).count(query,function (err, count) {
            if (!err) {
                result.num = count;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    addInfo: function (data, session, callback) {
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        data._id=id;
        data.createTime=time;
        data.lastTime=time;
        data.account=aid;
        data.content='技术服务费';
        var customerType=data.customerType;
        if(customerType=='person'){
            data.invoiceTitle="个人";
            data.invoiceType="normal";
        }
        var isDefault=data.isDefault;
        handler.checkInfoNum(data,function(rep){
            if(rep.success){
                var num=rep.num;
                if(num<5){
                    if(isDefault){
                        mongo.db().collection(constants.DB.bill_invoice_info).update({account:aid,isDefault:true},{$set:{isDefault:false}},{multi:true,w:1},function (err) {
                            if (!err) {
                                mongo.db().collection(constants.DB.bill_invoice_info).insert(data, function (err) {
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
                    }else{
                        mongo.db().collection(constants.DB.bill_invoice_info).insert(data, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }
                }else{
                    result.message = '发票信息最多保存5个';
                    callback(result);
                }
            } else{
                callback(rep);
            }
        });
    },
    getInfoById:function(data,session,callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.bill_invoice_info).findOne({_id:data._id},function(err,row){
            if(!err){
                result.success = true;
                result.row=row;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    updateInfo: function (data, session, callback) {
        var result = {success: false};
        var id=data._id;
        delete data._id
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        data.lastTime=time;
        var customerType=data.customerType;
        var invoiceType=data.invoiceType;
        if(customerType=='person'){
            data.invoiceTitle="个人";
            data.invoiceType="normal";
        }
        //if(invoiceType=='professional'){
        //    result.message='增值税专用发票不能修改';
        //    callback(result);
        //    return;
        //}
        var isDefault=data.isDefault;
        if(isDefault){
            mongo.db().collection(constants.DB.bill_invoice_info).update({account:aid,isDefault:true},{$set:{isDefault:false}},{multi:true,w:1},function (err) {
                if (!err) {
                    mongo.db().collection(constants.DB.bill_invoice_info).update({_id:id},{$set:data}, function (err) {
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
        }else{
            mongo.db().collection(constants.DB.bill_invoice_info).update({_id:id},{$set:data}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        }
    },
    updateInfoDefault: function (data, session, callback) {
        var result = {success: false};
        var id=data._id;
        delete data._id
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        data.lastTime=time;
        data.isDefault=true;
        mongo.db().collection(constants.DB.bill_invoice_info).update({account:aid,isDefault:true},{$set:{isDefault:false}},{multi:true,w:1},function (err) {
            if (!err) {
                mongo.db().collection(constants.DB.bill_invoice_info).update({_id:id},{$set:data}, function (err) {
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
    },
    delInfo: function (data, session, callback) {
        var result = {success: false};
        var id=data._id;

        mongo.db().collection(constants.DB.bill_invoice_info).remove({_id:id},function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },

    /////////////get
    _initNoInvoiceQuery:function(condition){
        delete  condition.flag;
        //condition.flag={$ne:'borrow'};
        var start=condition.startPayTime;
        var end =condition.endPayTime;
        if(start && end){
            end+=+" 23:59:59";
            condition.pay_time={"$gte":start,"$lte":end};
        }else if(start){
            condition.pay_time={$gte:start};
        }else if(end){
            end+=+" 23:59:59";
            condition.pay_time={$gte:end};
        }
        if(start){
            delete condition.startPayTime;
        }
        if(end){
            delete condition.endPayTime;
        }
    },
    getNoInvoiceList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||20;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        var condition = data||{};
        utils.removeEmptyProperty(condition);
        var aid=session.account._id;
        condition.account=aid;
        condition.invoiceStatus=null;
        handler._initNoInvoiceQuery(condition);
        //console.dir(condition);
        var total=0;
        mongo.db("zj").collection(constants.DB.user_bank_pay).find({account:aid,invoiceStatus:null},{fields:{money:1}}).toArray(function (err, list) {
            if(!err){
                list=list||[];
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    var money=parseFloat(item.money||0);
                    total+=money;
                }
                total=Math.round(total*100)/100;
                result.total=total;
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
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getDealInvoiceList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||20;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        var condition = data||{};
        utils.removeEmptyProperty(condition);
        var aid=session.account._id;
        condition.account=aid;
        if(!condition.invoiceStatus){
            condition.invoiceStatus={$ne:null};
        }
        handler._initNoInvoiceQuery(condition);

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
    getInvoiceByPayId:function(data,session,callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.bill_invoice).findOne({_id:data._id},function(err,invoiceDB){
            if(!err){
                if(!invoiceDB){
                    result.message="不存在的发票信息！";
                    callback(result);
                    return;
                }
                var payIds=invoiceDB.payIds||[];
                mongo.db("zj").collection(constants.DB.user_bank_pay).find({_id:{$in:payIds}},{sort:{pay_time:-1}}).toArray(function (err, list) {
                    if(!err){
                        invoiceDB.payList = list||[];
                        result.row=invoiceDB;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                })
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },

    saveGetInvoice: function (data, session, callback) {
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var invoiceId=id;
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        var param={};
        param._id=id;
        param.account=aid;
        param.createTime=time;
        param.lastTime=time;
        param.money=data.getMoney;
        param.sendType="express";
        param.status="undeal";//undeal deal dealing cancel
        param.invoiceNo="";
        param.transport="";
        param.expressNo="";
        param.memo=data.memo;

        var checkAll=data.checkAll;
        var infoId=data.infoId;
        var addrId=data.addrId;
        var getMoney=parseFloat(data.getMoney);
        getMoney=Math.round(getMoney*100)/100;


        if(getMoney<=0){
            result.message = '申请的发票金额不能小于0';
            callback(result);
            return;
        }
/*        if(session.account.billLoginName){
            //从计费跳转过来的非渠道用户不做限制
            if(session.account.billIdentity=='proxy' && session.account.proxyType=='channel'){ //渠道代理
                if(getMoney<1000){
                    result.message = '开票额度不能低于1000元，请您累积到1000元再行开具！';
                    callback(result);
                    return;
                }
            }
        }else{
            if(getMoney<1000){
                result.message = '开票额度不能低于1000元，请您累积到1000元再行开具！';
                callback(result);
                return;
            }
        }*/
        var noFields={createTime:0,lastTime:0,account:0,isDefault:0};
        mongo.db().collection(constants.DB.bill_invoice_info).findOne({_id:infoId},{fields:noFields},function(err,infoDB){
            if(!err && infoDB){
                param.info=infoDB;
                if(session.account.billLoginName){
                    //从计费跳转过来的非渠道用户不做限制
                    if(session.account.billIdentity=='proxy' && session.account.proxyType=='channel'){ //渠道代理
                        if(getMoney<5000 && param.info.invoiceType=='professional'){
                            result.message = '增值税专用发票开票的金额不能低于5000元，特殊情况联系客服开具！';
                            callback(result);
                            return;
                        }
                    }
                }else{
                    if(getMoney<5000 && param.info.invoiceType=='professional'){
                        result.message = '增值税专用发票开票的金额不能低于5000元，特殊情况联系客服开具！';
                        callback(result);
                        return;
                    }
                }
                mongo.db().collection(constants.DB.bill_invoice_addr).findOne({_id:addrId},{fields:noFields},function(err,addrDB){
                    if(!err && addrDB){
                        param.addr=addrDB;
                        handler.checkInvoiceMoney(aid,function(rep){
                            if(rep.success){
                                if(checkAll=='1'){
                                    param.payIds=rep.allIds||[];
                                }else{
                                    param.payIds=data.ids||[];
                                }
                                var total=rep.total;
                                if(getMoney<=total){
                                    Then()
                                        .then(function (cont) {
                                            //从计费跳转过来的非渠道用户不扣
                                            if (session.account.billLoginName && session.account.proxyType!='channel') {
                                                cont(null, true);
                                            } else {
                                                cont(null, false);
                                            }
                                        })
                                        .then(function (outcont, isFromYYSystem) {
                                            if (isFromYYSystem) {
                                                outcont();
                                            } else {
                                                if(getMoney < 1000) { //如果发票金额小于1000，扣20元快递费
                                                    var fee=20;
                                                    Then()
                                                        .then(function (cont) {
                                                            mongo.db().collection(constants.DB.platform_account).findOne({_id: aid}, function (err, acc) {
                                                                if (err) {
                                                                    cont(err);
                                                                } else {
                                                                    cont (err, acc);
                                                                }
                                                            });
                                                        })
                                                        .then(function (cont, acc) {
                                                            if (acc.financeAccount) {
                                                                financeAccountDBProxy.queryFinanceAccountById(acc.financeAccount, function (err, financeAcc) {
                                                                    if (err) {
                                                                        cont(err);
                                                                    } else {
                                                                        var accBalance = acc.balance + (acc.overdraw || 0);
                                                                        var financeAccBalance = financeAcc.balance + (financeAcc.overdraw || 0);
                                                                        if (utils.formatFee(fee) > accBalance && utils.formatFee(fee) > financeAccBalance) {
                                                                            var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(accBalance) + ']，财务账户余额[' + utils.formatTrueFee(financeAccBalance) + ']，需支付余额[' + fee + ']';
                                                                            logger.app.warn(msg);
                                                                            result.message = msg;
                                                                            callback(result);
                                                                            return;
                                                                        } else {
                                                                            cont();
                                                                        }
                                                                    }
                                                                });
                                                            } else {
                                                                var trueBalance = acc.balance + (acc.overdraw || 0);
                                                                if (utils.formatFee(fee) > trueBalance) {
                                                                    var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + fee + ']';
                                                                    logger.app.warn(msg);
                                                                    result.message = msg;
                                                                    callback(result);
                                                                    return;
                                                                } else {
                                                                    cont();
                                                                }
                                                            }
                                                        })
                                                        .then(function (cont) {
                                                            var _set = {balance: -utils.formatFee(fee)};
                                                            financeAccountHandler.consumeFinanceAccountBalance(aid, _set, {}, function (err, accDB, paidAcc, hasFinanceAccount) {
                                                                if (err) {
                                                                    cont(err);
                                                                } else {
                                                                    // 消费记录
                                                                    var currentBalance = utils.formatTrueFee(accDB.balance) + "";
                                                                    utils.BusinessUtil.getPayOrderNo(aid, function (rep2) {
                                                                        if (rep2.success) {
                                                                            var id = rep2.orderNo;
                                                                            var payInfo = {
                                                                                _id: id,
                                                                                status: 'pay',
                                                                                payType: "balance",
                                                                                money: "0",
                                                                                bank: "",
                                                                                account: aid,
                                                                                create_time: time,
                                                                                pay_time: time,
                                                                                flag: "invoicExpress",//发票快递费
                                                                                totalFee: fee + "",
                                                                                balance: fee + "",
                                                                                product: "",
                                                                                sn: {
                                                                                    invoiceId: invoiceId
                                                                                },
                                                                                income: "0",
                                                                                proxy: "",
                                                                                currentBalance: currentBalance
                                                                            };
                                                                            if (hasFinanceAccount) {
                                                                                payInfo[financeAccountHandler.constant] = paidAcc._id.toString();
                                                                            }
                                                                            mongo.db("zj").collection(constants.DB.user_pay).insert(payInfo, {w: 1}, function (err) {
                                                                                if (err) {
                                                                                    logger.app.error(err);
                                                                                }
                                                                            });
                                                                        } else {
                                                                            cont(rep2);
                                                                        }
                                                                    });

                                                                    //累计消费
                                                                    AccountPayConsume.incrConsume(aid, utils.formatFee(fee));//累计消费

                                                                    //报表消费事件
                                                                    appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_OTHER, {
                                                                        account: aid,
                                                                        balance: utils.formatFee(fee),
                                                                    });

                                                                    outcont();
                                                                }
                                                            })
                                                        })
                                                        .fail(function (cont, err) {
                                                            logger.app.error(err);
                                                            callback(result);
                                                            return;
                                                        });

                                                    //     mongo.db().collection(constants.DB.platform_account).findOne({_id: aid}, function (err, acc) {
                                                    //     if (!err) {
                                                    //         var fee=20;
                                                    //         var trueBalance = acc.balance + (acc.overdraw || 0);
                                                    //         if (utils.formatFee(fee) > trueBalance) {
                                                    //             var msg = '账户的余额不够支付:实际余额[' + utils.formatTrueFee(trueBalance) + '],需支付余额[' + fee + ']';
                                                    //             logger.app.warn(msg);
                                                    //             result.message = msg;
                                                    //             callback(result);
                                                    //             return;
                                                    //         }
                                                    //         var _set = {balance: -utils.formatFee(fee)};
                                                    //         mongo.db().collection(constants.DB.platform_account).findAndModify({_id:aid}, [], {$inc: _set}, {new: true}, function (err, accDB) {
                                                    //             if (!err) {
                                                    //                 var currentBalance = utils.formatTrueFee(accDB.balance) + "";
                                                    //                 utils.BusinessUtil.getPayOrderNo(aid, function (rep2) {
                                                    //                     if (rep2.success) {
                                                    //                         var id = rep2.orderNo;
                                                    //                         var payInfo = {
                                                    //                             _id: id,
                                                    //                             status: 'pay',
                                                    //                             payType: "balance",
                                                    //                             money: "0",
                                                    //                             bank: "",
                                                    //                             account: aid,
                                                    //                             create_time: time,
                                                    //                             pay_time: time,
                                                    //                             flag: "invoicExpress",//发票快递费
                                                    //                             totalFee: fee+"",
                                                    //                             balance: fee+"",
                                                    //                             product: "",
                                                    //                             sn: {
                                                    //                                 invoiceId:invoiceId
                                                    //                             },
                                                    //                             income: "0",
                                                    //                             proxy: "",
                                                    //                             currentBalance:currentBalance
                                                    //                         }
                                                    //                         mongo.db("zj").collection(constants.DB.user_pay).insert(payInfo, {w: 1}, function (err) {
                                                    //                             if (err) {
                                                    //                                 logger.app.error(err);
                                                    //                             }
                                                    //                         });
                                                    //                     } else {
                                                    //                         callback(rep2);
                                                    //                     }
                                                    //                 });
                                                    //
                                                    //                 //累计消费
                                                    //                 AccountPayConsume.incrConsume(aid,utils.formatFee(fee));//累计消费
                                                    //                 //报表消费事件
                                                    //                 appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_OTHER,{
                                                    //                     account : aid,
                                                    //                     balance : utils.formatFee(fee),
                                                    //                 });
                                                    //             } else {
                                                    //                 logger.app.error(err);
                                                    //                 callback(result);
                                                    //             }
                                                    //         })
                                                    //     }else{
                                                    //         logger.app.error(err);
                                                    //         callback(result);
                                                    //     }
                                                    // });
                                                }
                                            }
                                        })
                                        .then(function (cont) {
                                            // 扣完钱，没问题之后，更新发票信息
                                            mongo.db().collection(constants.DB.bill_invoice).insert(param, function (err) {
                                                if (!err) {
                                                    //update pay list
                                                    mongo.db("zj").collection(constants.DB.user_bank_pay).update({_id: {$in: param.payIds}}, {
                                                        $set: {
                                                            invoiceStatus: "dealing",
                                                            invoiceId: id
                                                        }
                                                    }, {multi: true, w: 1}, function (err) {
                                                        if (err) {
                                                            logger.app.error(err);
                                                        }
                                                    });
                                                    //send mail
                                                    mongo.db().collection(constants.DB.platform_account).findOne({_id: aid}, function (err, acc) {
                                                        if (!err && acc) {
                                                            var companyName = acc.companyName;
                                                            var mailItem = {
                                                                mail: handler.mail,
                                                                loginName: acc.name,
                                                                companyName: companyName,
                                                                money: param.money,
                                                                invoiceTitle: param.info.invoiceTitle,
                                                                invoiceType: param.info.invoiceType == 'normal' ? "增值税普通发票" : "增值税专用发票",
                                                                content: param.info.content,
                                                                userName: param.addr.userName,
                                                                addr: param.addr.addr,
                                                                post: param.addr.post,
                                                                phone: param.addr.phone
                                                            };
                                                            handler._sendInvoiceMail27moor(mailItem);
                                                            result.success = true;
                                                            callback(result);
                                                            return;
                                                        } else {
                                                            logger.app.error(err || new Error('账号不存在!'));
                                                            callback(result);
                                                            return ;
                                                        }
                                                    });
                                                } else {
                                                    cont(err);
                                                }
                                            });
                                        })
                                        .fail(function (cont, err) {
                                            logger.app.error(err);
                                            callback(result);
                                        });

                                    // mongo.db().collection(constants.DB.bill_invoice).insert(param, function (err) {
                                    //     if (!err) {
                                    //         //update pay list
                                    //         mongo.db("zj").collection(constants.DB.user_bank_pay).update({_id:{$in:param.payIds}},{$set:{invoiceStatus:"dealing",invoiceId:id}},{multi:true,w:1},function (err) {
                                    //             if (err) {
                                    //                 logger.app.error(err);
                                    //             }
                                    //         });
                                    //         //send mail
                                    //         mongo.db().collection(constants.DB.platform_account).findOne({_id: aid}, function (err, acc) {
                                    //             if (!err && acc) {
                                    //                 var companyName = acc.companyName;
                                    //                 var mailItem = {
                                    //                     mail: handler.mail,
                                    //                     loginName:acc.name,
                                    //                     companyName: companyName,
                                    //                     money: param.money,
                                    //                     invoiceTitle:  param.info.invoiceTitle,
                                    //                     invoiceType: param.info.invoiceType=='normal'?"增值税普通发票":"增值税专用发票",
                                    //                     content: param.info.content,
                                    //                     userName: param.addr.userName,
                                    //                     addr: param.addr.addr,
                                    //                     post: param.addr.post,
                                    //                     phone: param.addr.phone
                                    //                 }
                                    //                 handler._sendInvoiceMail27moor(mailItem);
                                    //             }else{
                                    //                 logger.app.error(err||new Error('账号不存在!'));
                                    //                 callback(result);
                                    //             }
                                    //         });
                                    //
                                    //         //从计费跳转过来的非渠道用户不扣
                                    //         if(session.account.billLoginName && session.account.proxyType!='channel') { //非渠道用户
                                    //             result.success = true;
                                    //             callback(result);
                                    //         }else{
                                    //
                                    //         }
                                    //
                                    //         // result.success = true;
                                    //         // callback(result);
                                    //     } else {
                                    //         logger.app.error(err);
                                    //         callback(result);
                                    //     }
                                    // });
                                } else {
                                    result.message = '申请的发票金额大于了可申请发票的最大额:'+total;
                                    callback(result);
                                }
                            } else{
                                callback(rep);
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
    },
    checkInvoiceMoney:function(account,callback){
        var result = {success: false};
        var query={account:account,invoiceStatus:null};
        var total=0;
        var ids=[];
        mongo.db("zj").collection(constants.DB.user_bank_pay).find(query,{fields:{money:1}}).toArray(function (err, list) {
            if(!err){
                list=list||[];
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    var money=parseFloat(item.money||0);
                    total+=money;
                    ids.push(item._id);
                }
                total=Math.round(total*100)/100;
                result.total = total;
                result.allIds = ids;
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _sendInvoiceMail27moor: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "发票申请",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/invoice/notifyInvoice_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = utils.renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendInvoiceMail27moor] not found!", err);
            }
        });
    },

    ////////////////invoice query
    _initInvoiceQuery:function(condition){
        var start=condition.startCreateTime;
        var end =condition.endCreateTime;
        if(start && end){
            end+=+" 23:59:59";
            condition.createTime={"$gte":start,"$lte":end};
        }else if(start){
            condition.createTime={$gte:start};
        }else if(end){
            end+=+" 23:59:59";
            condition.createTime={$gte:end};
        }
        if(start){
            delete condition.startCreateTime;
        }
        if(end){
            delete condition.endCreateTime;
        }
    },
    queryInvoiceList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||20;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        var condition = data||{};
        utils.removeEmptyProperty(condition);
        var aid=session.account._id;
        condition.account=aid;
        handler._initInvoiceQuery(condition);

        mongo.db().collection(constants.DB.bill_invoice).find(condition,{sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err, list) {
            if(!err){
                result.list = list||[];
                mongo.db().collection(constants.DB.bill_invoice).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getInvoiceById:function(data,session,callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.bill_invoice).findOne({_id:data._id},function(err,invoiceDB){
            if(!err){
                var payIds=invoiceDB.payIds||[];
                mongo.db("zj").collection(constants.DB.user_bank_pay).find({_id:{$in:payIds}},{sort:{pay_time:-1}}).toArray(function (err, list) {
                    if(!err){
                        invoiceDB.payList = list||[];
                        result.row=invoiceDB;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                })
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },

    ///////////for bill system
    _initInvoiceQuery2Bill:function(condition){
        var start=condition.begin;
        var end =condition.end;
        if(start && end){
            end+=+" 23:59:59";
            condition.createTime={"$gte":start,"$lte":end};
        }else if(start){
            condition.createTime={$gte:start};
        }else if(end){
            end+=+" 23:59:59";
            condition.createTime={$gte:end};
        }
        if(start){
            delete condition.begin;
        }
        if(end){
            delete condition.end;
        }
    },
    queryInvoiceList2Bill: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||20;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        var condition = data||{};
        utils.removeEmptyProperty(condition);
        handler._initInvoiceQuery2Bill(condition);

        mongo.db().collection(constants.DB.bill_invoice).find(condition,{sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err, list) {
            if(!err){
                result.list = list||[];
                mongo.db().collection(constants.DB.bill_invoice).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    dealInvoice: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var id=data._id;
        delete data._id;
        var status=data.status;
        data.lastTime=time;
        mongo.db().collection(constants.DB.bill_invoice).findOne({_id:id},function(err,invoiceDB){
            if(!err){
                var aid=invoiceDB.account;
                var payIds=invoiceDB.payIds||[];
                var money=parseFloat(invoiceDB.money);
                mongo.db().collection(constants.DB.bill_invoice).update({_id:id},{$set:data},function(err){
                    if(!err){
                        if(status=='deal'){
                            mongo.db("zj").collection(constants.DB.user_bank_pay).update({_id:{$in:payIds}},{$set:{invoiceStatus:"deal"}},{multi:true,w:1},function (err) {
                                if (err) {
                                    logger.app.error(err);
                                }
                            });
                            result.success = true;
                            callback(result);
                        }else if(status=='cancel'){
                            mongo.db("zj").collection(constants.DB.user_bank_pay).update({_id:{$in:payIds}},{$set:{invoiceStatus:null,invoiceId:null}},{multi:true,w:1},function (err) {
                                if (err) {
                                    logger.app.error(err);
                                }else{
                                    if(money<1000){//撤消快递费用,计费跳转的没扣。
                                        mongo.db("zj").collection(constants.DB.user_pay).findOne({'sn.invoiceId':id},function (err,doc) {
                                            if (!err && doc) {
                                                var _set = {balance: utils.formatFee(20)};
                                                mongo.db().collection(constants.DB.platform_account).findAndModify({_id:aid}, [], {$inc: _set}, {new: true}, function (err, accDB) {
                                                    if (!err) {
                                                        var currentBalance = utils.formatTrueFee(accDB.balance) + "";
                                                        mongo.db("zj").collection(constants.DB.user_pay).update({_id:doc._id},{$set:{"sn.memo":"已取消"}}, function (err) {
                                                            if (err) {
                                                                logger.app.error(err);
                                                            }
                                                        });
                                                    } else {
                                                        logger.app.error(err);
                                                        callback(result);
                                                    }
                                                })
                                            }else{
                                                logger.app.error(err||"user pay notFound!");
                                            }
                                        });
                                    }
                                }
                            });
                            result.success = true;
                            callback(result);
                        }else{
                            result.message = '非法的状态！';
                            callback(result);
                        }
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
    },
    updateInvoice: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var id=data._id;
        delete data._id;
        data.lastTime=time;
        mongo.db().collection(constants.DB.bill_invoice).findOne({_id:id},function(err,invoiceDB){
            if(!err){
                var status=invoiceDB.status;
                if(status!='deal'){
                    result.message="只有开具发票的才能修改！";
                    callback(result);
                    return;
                }
                mongo.db().collection(constants.DB.bill_invoice).update({_id:id},{$set:data},function(err){
                    if(!err){
                        result.success = true;
                        callback(result);
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

};

module.exports = handler;
