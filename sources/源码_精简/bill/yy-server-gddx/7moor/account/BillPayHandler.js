var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var billServiceNoHandler = require(__baseDir + "/7moor/account/BillServiceNoHandler");
var serviceNoHandler = require(__baseDir + "/7moor/ucenter/ServiceNoHandler");
var fs = require("fs");
var notifyHandler = require(__baseDir + "/7moor/notify/NotifyHandler");
var payHandler = require(__baseDir + '/7moor/ucenter/PayHandler');
var appEvent = require("appEvent");
var financeAccountHandler = require(__baseDir + "/7moor/account/FinanceAccountHandler");
var financeAccountDBProxy = require(__baseDir + "/7moor/account/FinanceAccountDBProxy");
var financeAccountUtils = require(__baseDir + "/7moor/account/FinanceAccountUtils");

var Account = require(__baseDir + '/models/Account');
var AccountPayConsume = require(__baseDir + "/models/AccountPayConsume");
var UserBankPay = require(__baseDir + "/models/UserBankPay");

var Then = require('thenjs');
var _ = require('underscore');

var handler = {
    _reCalculateFee:function(data,callback){
        var result = {success: false};
        var flag=data.flag;
        var payType=data.payType;
        var aid=data.account;
        data.money=data.money+'';
        var totalFee=parseFloat(data.money);
//        var billFee=parseFloat(data.billMoney)||0;
        if(flag==constants.payFlag.pay){
            result.success=true;
            callback(result);
        }else{
            /*******暂不用*******/
        }
    },
    bankPay:function(data,callback){
        var param=data.data;
        param.payType=constants.payType.online;
        var result={
            success:true,
            showView:true,
            view:"pay_blank.html",
            data:{}
        }
        var msg='';
        handler._reCalculateFee(param,function(rep){
            if(rep.success){
                utils.BusinessUtil.billOnlinePay(param,function(rep2){
                    if(rep2.success){
                        result.data={html:rep2.html};
                        callback(result);
                    }else{
                        msg='<span style="color:red;">支付跳转淘宝异常</span>';
                        result.data={html:msg};
                        callback(result);
                    }
                });
            }else{
                msg='<span style="color:red;">'+(rep.message||'支付异常')+'</span>';
                result.data={html:msg};
                callback(result);
            }
        });
    },

    _syncProxyBalance:function(data){
        var fee=utils.formatFee(parseFloat(data.money));
        var _time=utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.system_user).findAndModify({_id:data.proxy},[],{$inc:{balance:fee}},{new:true},function(err,proxyUser){
            if(err){
                logger.app.error(err);
            }else{
                var billPaySet=data;
                billPaySet.create_time=_time;
                billPaySet.timestamp=utils.DateTime.getCurrentTimestamp();
                billPaySet.currentBalance=utils.formatTrueFee(proxyUser.balance)+"";
                billPaySet.income=data.money;
                billPaySet.source=data.flag;
                mongo.db().collection(constants.DB.bill_user_pay).insert(billPaySet);
            }
        })
    },
    /**
     * http://localhost:3000/alinotify?discount=0.00&payment_type=1&subject=购买服务号&trade_no=2014011063978732&buyer_email=&gmt_create=2014-01-10 23:20:25
     * &notify_type=trade_status_sync&quantity=1&out_trade_no=20140213000001&seller_id=2088011518716086&notify_time=2014-01-10 23:22:03
     * &trade_status=TRADE_SUCCESS&is_total_fee_adjust=N&total_fee=200&gmt_payment=2014-01-10 23:22:03&seller_email=hollycrmmarketing@hollycrm.com
     * &price=0.01&buyer_id=2088002554069320&notify_id=9f58d63e3fd226319dc550da5a88b05f3s&use_coupon=N&sign_type=MD5&sign=539123b04bf870673702a4f94c797945
     * @param data
     * @param callback
     */
    aliNotify:function(data,callback){
        var orderNo=data.out_trade_no;
        var result = {success: false};
        utils.BusinessUtil.payNotify(data,function(rep){
            if(rep.Succeed){
                mongo.db().collection(constants.DB.bill_user_bank_pay).findOne({_id:orderNo}, function (err,row){
                    if (!err) {
                        handler._syncProxyBalance(row);
                        var eventData = {
                            proxy : row.proxy,
                            bank : row.bank,
                            payNum : parseInt(row.money),
                            payUser : ""
                        };
                        appEvent.emitOperationReportEvent(appEvent.EventType.PROXY_PAY,eventData);
                        var payNotify={
                            orderNo:orderNo,
                            proxy:row.proxy,
                            bank:row.bank,
                            totalFee:row.money,
                            trade_no:row.ali==null?"":row.ali.trade_no
                        }
                        notifyHandler.notifyBankPay2Bill(payNotify,function(rep){
                            if(!rep.success){
                                logger.app.error("充值提醒失败，orderNo=="+orderNo);
                            }
                        });
                        result.success=true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        result.message = 'aliNotify error!'+err.message;
                        callback(result);
                    }
                });
            }else{
                rep.success=false;
                callback(rep);
            }
        },"BillPaymentNotify");
    },
/*
    hpPay:function(data,session,callback){
        var result = {success: false};
        var uid=session.user._id;
        var set={
            totalFee:100000000  //10W
        };
        mongo.db().collection(constants.DB.system_user).update({_id:uid},{$inc:set},{w:1},function (err){
            if(!err){
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },*/
    _renderView: function (view, data, dir) {
        var oldDir = null;
        if (dir) {
            dir = dir + '.';
        } else {
            dir = '';
        }
        for (var i in data) {
            if (typeof data[i] == 'object' && typeof data[i] != null) {
                oldDir = dir;
                dir = dir + i;
                view = handler._renderView(view, data[i], dir);
                dir = oldDir;
                oldDir = null;
            } else {
                view = view.replace(new RegExp('_#' + dir + i + '#_', 'g'), data[i]);
            }
        }
        return view;
    },
    _sendNotifyPayMail: function (data,session) {
        var mail=session.user.linkManEmail;
        var name=session.user.name;
        var uid=session.user._id;
        if(!mail){
            logger.app.error('['+name+']的邮箱为空，发送充值提醒失败');
            return;
        }

        var sendMail = {
            toAddr: [mail],
            subject: "充值提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal",
            registeKey: utils.UUID.generateUuid(),
            account:uid
        };
        fs.readFile(__baseDir + "/views/proxy/sendNotifyPay.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    name: name,
                    companyName:data.companyName,
                    money:data.money
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }else{
                        logger.app.info('给代理【'+name+'】发送充值提醒,充值金额'+data.money+'元');
                    }
                });
            } else {
                logger.app.error("mail templete[_sendNotifyPayMail] not found!", err);

            }
        });
    },
    pay2AccByProxy:function(data,session,callback){
        var result = {success: false};
        var uid=session.user._id;
        var balance=utils.formatFee(data.money);
        var set={
            balance:-balance
        };
        mongo.db().collection(constants.DB.system_user).findAndModify({_id:uid},[],{$inc:set},{new:true},function(err,proxyUser){
            if(!err){
                mongo.db().collection(constants.DB.platform_account).findAndModify({_id:data.account},[],{$inc:{balance:balance}},{new:true},function(err,acc){
                    if(!err){
                        var eventData = {
                            account : data.account,
                            payNum : balance,
                            proxy : uid,
                            useFor : constants.payFlag.payAccByBill
                        };
                        //var isFirstPay = false;
                        //if(acc.status != 'normal'){ //非正式客户,首次付费
                        //    isFirstPay = true;
                        //}
                        //首次回款,或者距离首次回款时间小于30天的算作首签回款.
                        UserBankPay.isFirstPay(utils.DateTime.getCurrentDateTime(),data.account,function(err,isFirstPay) {
                            if (err) {
                                logger.app.error(err);
                                return callback(result);
                            }

                            eventData.isFirst = isFirstPay;
                            appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_PROXY_PAY, eventData);
                            AccountPayConsume.incrPay(data.account, balance);//累计充值
                            //新增逻辑
                            payHandler.updateAccStatus(acc);
                            //给客户经理提成
                            if (acc.customerCare && acc.isBonus2customerCare) {
                                payHandler.bonus2CustomerCare(acc._id, acc.customerCare, balance);
                            }
                            // 给技术顾问提成
                            if (acc.consultant) {
                                payHandler.bonus2Consultant(acc._id, acc.consultant, balance);
                            }
                            var time = utils.DateTime.getCurrentDateTime();
                            utils.BusinessUtil.getPayOrderNo(null, function (rep2) {
                                if (rep2.success) {
                                    var orderNo = "BP" + rep2.orderNo;
                                    var payset = {
                                        _id: orderNo,
                                        status: 'pay',
                                        payType: constants.payType.balance,
                                        money: data.money + "",
                                        income: data.money + "",
                                        account: data.account,
                                        create_time: time,
                                        pay_time: time,
                                        flag: constants.proxySource.payAccount,
                                        proxy: uid,
                                        currentBalance: utils.formatTrueFee(proxyUser.balance) + "",
                                        source: constants.proxySource.payAccount,
                                        timestamp: utils.DateTime.getCurrentTimestamp()
                                    }
                                    mongo.db().collection(constants.DB.bill_user_pay).insert(payset);
                                    var paySet2 = {
                                        _id: orderNo,
                                        account: data.account,
                                        payType: constants.payType.balance,
                                        flag: constants.payFlag.payAccount,
                                        pay_time: time,
                                        bank: "",
                                        money: data.money + "",
                                        proxy: uid,
                                        currentBalance: utils.formatTrueFee(acc.balance) + "",
                                        isFirstPay: isFirstPay,
                                    }
                                    mongo.db("zj").collection(constants.DB.user_bank_pay).insert(paySet2);
//                                mongo.db("zj").collection(constants.DB.user_pay).insert(paySet2);
                                    var _mail = {
                                        companyName: acc.companyName,
                                        money: data.money
                                    }
                                    handler._sendNotifyPayMail(_mail, session);
                                    payHandler.resetOweFeeInfo(acc);
                                    result.success = true;
                                    callback(result);
                                } else {
                                    callback(rep2);
                                }
                            });
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
    balanceRefund:function(data,session,callback){
        var result = {success: false};
        var uid=data.createUser;
        var balance=utils.formatFee(data.refundMoney); //清退金额
        var set={
            balance:-balance
        };
        //todo 需检查此金额是否已开过发票。
        if(balance>0){
            mongo.db().collection(constants.DB.system_user).findAndModify({_id:uid},[],{$inc:{balance:balance}},{new:true},function(err,proxyUser){
                if(!err){
                    mongo.db().collection(constants.DB.platform_account).findAndModify({_id:data.account},[],{$inc:set},{new:true},function(err,acc){
                        if(!err){
                            var time=utils.DateTime.getCurrentDateTime();
                            AccountPayConsume.incrPay(data.account,-balance);//减去累计充值
                            //冲一个负的.
                            var isFirst = (acc.firstPayTime && utils.DateTime.getDiffOfNowFrom(acc.firstPayTime,'day') <= 30) || false;
                            appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_PAY,{account : data.account,payNum:-balance,isFirst:isFirst});

                            utils.BusinessUtil.getPayOrderNo(null,function(rep2){
                                if(rep2.success){
                                    var orderNo="BP"+rep2.orderNo;
                                    var payset={
                                        _id:orderNo,
                                        status:'pay',
                                        payType:constants.payType.balance,
                                        money:data.refundMoney+"",
                                        income:data.refundMoney+"",
                                        account:data.account,
                                        create_time:time,
                                        pay_time:time,
                                        proxy:uid,
                                        currentBalance:utils.formatTrueFee(proxyUser.balance)+"",
                                        source:"refund",
                                        timestamp:utils.DateTime.getCurrentTimestamp()
                                    }
                                    //代理明细记录
                                    mongo.db().collection(constants.DB.bill_user_pay).insert(payset);
                                    var paySet2={
                                        _id:orderNo,
                                        account:data.account,
                                        payType:constants.payType.balance,
                                        flag:"refund",
                                        pay_time:time,
                                        bank:"",
                                        money:-data.refundMoney+"",
                                        proxy:uid,
                                        currentBalance:utils.formatTrueFee(acc.balance)+""
                                    }
                                    //充值记录
                                    mongo.db("zj").collection(constants.DB.user_bank_pay).insert(paySet2);
                                    //log
                                    var history = {
                                        _id: utils.UUID.generateUuid(),
                                        time: utils.DateTime.getCurrentDateTime(),
                                        account: acc._id,
                                        user: uid,
                                        type:"refund",
                                        content:acc._id+"账户清退到代理"+proxyUser.name+"账户【"+data.refundMoney+"】元"
                                    }
                                    mongo.db().collection(constants.DB.bill_operate_log).insert(history);
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
        }else{
            result.message="账户余额为0，无需清退余额";
            callback(result);
        }
    },
    supplementDeductionMinConsume:function(data,session,callback){
        var result = {success: false};
        var uid=session.user._id;
        var balance=utils.formatFee(data.ductionMoney);//补扣低消金额
        var set={
            balance:-balance
        };
            mongo.db().collection(constants.DB.system_user).findAndModify({_id:uid},[],{$inc:{balance:balance}},{new:true},function(err,proxyUser){
                if(!err){
                    mongo.db().collection(constants.DB.platform_account).findAndModify({_id:data.account},[],{$inc:set},{new:true},function(err,acc){
                        if(!err){
                            mongo.db("bill_data").collection(constants.DB.bill_call_consume).findOne({_id:data.monthId},function(err,Account){
                                if(!err){
                                    var updateSet={
                                        balance:balance,
                                        minConsume:parseInt(data.calloutLicence),
                                        giveMinute:data.calloutMinute-Account.localMinutes-Account.remoteMinutes,
                                        presentMinute:parseInt(data.calloutMinute)
                                    };
                                    mongo.db("bill_data").collection(constants.DB.bill_call_consume).update({_id:data.monthId},{$set:updateSet},{w:1},function(err){
                                        if(!err){
                                            var time=utils.DateTime.getCurrentDateTime();
                                            utils.BusinessUtil.getPayOrderNo(null,function(rep2){
                                                if(rep2.success){
                                                    var orderNo="BP"+rep2.orderNo;
                                                    var payset={
                                                        _id:orderNo,
                                                        status:'pay',
                                                        payType:constants.payType.balance,
                                                        money:data.ductionMoney+"",
                                                        income:data.ductionMoney+"",
                                                        account:data.account,
                                                        create_time:time,
                                                        pay_time:time,
                                                        produc:"cc",
                                                        proxy:uid,
                                                        currentBalance:utils.formatTrueFee(proxyUser.balance)+"",
                                                        source:constants.proxySource.supplementDuction,
                                                        timestamp:utils.DateTime.getCurrentTimestamp()
                                                    }
                                                    //明细记录
                                                    mongo.db().collection(constants.DB.bill_user_pay).insert(payset);
                                                    //log
                                                    var history = {
                                                        _id: utils.UUID.generateUuid(),
                                                        time: utils.DateTime.getCurrentDateTime(),
                                                        account: acc._id,
                                                        user: uid,
                                                        type:constants.proxySource.supplementDuction,
                                                        content:session.user.name+"补扣"+acc._id+"账户低消【"+data.ductionMoney+"】元"
                                                    }
                                                    mongo.db().collection(constants.DB.bill_operate_log).insert(history);
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
    turnBalance: function(data,session,callback){
        var result = {success: false};
        var uid=session.user._id;
        var account = data.account;
        var money = utils.formatFee(data.money);//退费金额
        var memo = data.memo;
        if(money<=0){
            result.message = "非法请求";
            callback(result);
            return;
        }

        //把退费加到余额中
        mongo.db().collection(constants.DB.platform_account).findAndModify({_id:account},[],{$inc:{balance:money}},{new:true},function(err,newAcc){
            if(err){
                result.message = '退费异常';
                callback(result);
                return;
            }
            //消费记录
            var time=utils.DateTime.getCurrentDateTime();
            utils.BusinessUtil.getPayOrderNo(null,function(response){
                if(response.success) {
                    var orderNo = response.orderNo;
                    var paySet={
                        _id:orderNo,
                        account:data.account,
                        payType:constants.payType.balance,
                        flag:constants.payFlag.turnBalance,
                        pay_time:time,
                        product:"",
                        proxy:newAcc.createUser,
                        status:"pay",
                        totalFee:"-"+data.money+"",
                        currentBalance:utils.formatTrueFee(newAcc.balance) + "",
                    }
                    //消费记录
                    mongo.db("zj").collection(constants.DB.user_pay).insert(paySet);
                }
            });

            AccountPayConsume.incrConsume(data.account,-money);//累计消费


            //操作记录
            var history = {
                _id: utils.UUID.generateUuid(),
                time: utils.DateTime.getCurrentDateTime(),
                account: newAcc._id,
                user: uid,
                type:constants.payFlag.turnBalance,
                content:newAcc._id + ' 账户退费 '+ data.money +"元"
            }
            mongo.db().collection(constants.DB.bill_operate_log).insert(history);

            result.success = true;
            callback(result);
        });
    },
    borrowAccount:function(data,session,callback){
        var result = {success: false};
        var uid=session.user._id;
        var balance=utils.formatFee(data.borrowMoney); //拆借金额
        var set={
            balance:-balance
        };
        //查询出拆借账户余额
        mongo.db().collection(constants.DB.platform_account).findOne({_id:data.account},function(err,sta){
            if(!err){
                if(data.name==sta.name){
                    result.message="请拆借到其他账户";
                    callback(result);
                }else{
                    if(balance==0){
                        result.message="拆借金额应大于0";
                        callback(result);
                    }else{
                        //var balanceMoney=sta.balance;//账户余额
                        if(sta.balance>=balance){
                            mongo.db().collection(constants.DB.platform_account).findAndModify({_id:data.account},[],{$inc:set},{new:true},function(err,doc){
                                if(!err){
                                    AccountPayConsume.incrPay(data.account,-balance);
                                    mongo.db().collection(constants.DB.platform_account).findAndModify({name:data.name},[],{$inc:{balance:balance}},{new:true},function(err,acc){
                                        if(!err){
                                            AccountPayConsume.incrPay(acc._id,balance);
                                            var time=utils.DateTime.getCurrentDateTime();
                                            utils.BusinessUtil.getPayOrderNo(null,function(rep2){
                                                if(rep2.success){
                                                    var orderNo=rep2.orderNo;
                                                    var paySet={
                                                        _id:"BM"+orderNo,
                                                        account:acc._id,
                                                        flag:"borrow",
                                                        pay_time:time,
                                                        bank:"",
                                                        money:data.borrowMoney+"",
                                                        currentBalance:utils.formatTrueFee(acc.balance)+"",
                                                        invoiceStatus:'invalid'//拆借为无效的充值单
                                                    }
                                                    //充值记录
                                                    mongo.db("zj").collection(constants.DB.user_bank_pay).insert(paySet);

                                                    var paySet2={
                                                        _id:orderNo,
                                                        account:data.account,
                                                        payType:constants.payType.balance,
                                                        flag:"borrow",
                                                        pay_time:time,
                                                        product:"",
                                                        status:"pay",
                                                        totalFee:data.borrowMoney+"",
                                                        currentBalance:utils.formatTrueFee(doc.balance)+"",
                                                    }
                                                    //消费记录
                                                    mongo.db("zj").collection(constants.DB.user_pay).insert(paySet2);

                                                    //log
                                                    var history = {
                                                        _id: utils.UUID.generateUuid(),
                                                        time: utils.DateTime.getCurrentDateTime(),
                                                        account: doc._id,
                                                        user: uid,
                                                        type:"borrow",
                                                        content:doc._id+"账户拆借给"+acc._id+"账户【"+data.borrowMoney+"】元"
                                                    }
                                                    mongo.db().collection(constants.DB.bill_operate_log).insert(history);
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
                        }else{
                            result.message="拆借金额不应大于账户余额";
                            callback(result);
                        }
                    }
                }

            }else{
                logger.app.error(err);
                callback(result);
            }
        });

    },
    /**
     * 绑定财务账户
     * @param data
     * @param callback
     */
    bindFinanceAccount: function (data, session, callback) {
        if (data.account === data.financeAccount) {
            callback({
                success: false,
                message: '不能绑定财务账户自身'
            });
            return;
        }
        Then()
            .then(function (cont) {
                // 判断是否已经绑定的账户和当前带绑定的财务账户是不是一个
                financeAccountDBProxy.queryFinanceAccountByNormalAccountId(data.account, function (err, financeAccount) {
                    if (err) {
                        cont(err);
                    }
                    else {
                        if (financeAccount && financeAccount._id == data.financeAccount) {
                            callback({
                                success: true
                            })
                            return;
                        }
                        else {
                            cont();
                        }
                    }
                })
            })
            .each([constants.DB.bill_call_consume, constants.DB.bill_sms_consume, constants.DB.bill_flow_consume, constants.DB.bill_voiceVerify_consume], function (cont, collection) {
                // 绑定财务账户之前先备份当前月账单数据
                var dateString = (new Date()).format('yyyy-MM');
                var billIdReg = new RegExp(data.account + '_' + dateString);
                try {
                    mongo.db(constants.DB_BILL_DATA).collection(collection).find({_id: billIdReg}).forEach(function (bill) {
                        if (!bill) return;
                        bill.backupTime = Date.now();
                        var condition = { '$set': {}};
                        condition['$set']['backup'] = financeAccountUtils.generateBillBackup(bill);
                        condition['$set']['financeAccount'] = data.financeAccount;
                        mongo.db(constants.DB_BILL_DATA).collection(collection).update({_id: bill._id}, condition, function (err, result) {
                            if (err) {
                                logger.app.error(err);
                                cont(err);
                            }
                        })
                    });
                    cont();
                } catch (err) {
                    cont(err);
                }
            })
            .then(function (cont) {
                mongo.db().collection(constants.DB.platform_account).update({_id: data.account}, {$set: {financeAccount: data.financeAccount}}, function (err, result) {
                    if (err) {
                        cont(err);
                    } else {
                        callback({ success: true });
                    }
                });
            })
            .fail(function (cont, err) {
                logger.app.error(err);
                callback({
                    success: false,
                    message: '绑定财务账户失败'
                });
            });
    },
    /**
     * 解绑财务账户
     * @param data
     * @param session
     * @param callback
     */
    unbindFinanceAccount: function (data, session, callback) {
        Then()
            .then(function (cont) {
                // 判断是否绑定财务账户
                financeAccountDBProxy.queryFinanceAccountByNormalAccountId(data.account, function (err, financeAccount) {
                    if (err) {
                        cont(err);
                    }
                    else {
                        if (financeAccount) {
                            // 已经绑定财务账户，继续进行
                            cont();
                        }
                        else {
                            callback({
                                success: false,
                                message: '该账户没有绑定财务账户'
                            });
                            return;
                        }
                    }
                })
            })
            .each([constants.DB.bill_call_consume, constants.DB.bill_sms_consume, constants.DB.bill_flow_consume, constants.DB.bill_voiceVerify_consume], function (cont, collection) {
                // 解绑之前先备份当前月账单数据
                var dateString = (new Date()).format('yyyy-MM');
                var billIdReg = new RegExp(data.account + '_' + dateString);
                try {
                    mongo.db(constants.DB_BILL_DATA).collection(collection).find({_id: billIdReg}).forEach(function (bill) {
                        if (!bill) return;
                        bill.backupTime = Date.now();
                        var condition = { '$set': {}};
                        condition['$set']['backup'] = financeAccountUtils.generateBillBackup(bill);
                        condition['$set']['financeAccount'] = '';
                        mongo.db(constants.DB_BILL_DATA).collection(collection).update({_id: bill._id}, condition, function (err, result) {
                            if (err) {
                                logger.app.error(err);
                                cont(err);
                            }
                        })
                    });
                    cont();
                } catch (err) {
                    cont(err);
                }
            })
            .then(function (cont) {
                mongo.db().collection(constants.DB.platform_account).update({_id: data.account}, {$set: {financeAccount: ''}}, function (err, result) {
                    if (err) {
                        cont(err);
                    } else {
                        callback({ success: true });
                    }
                });
            })
            .fail(function (cont, err) {
                logger.app.error(err);
                callback({
                    success: false,
                    message: '绑定财务账户失败'
                });
            });
    },
    deductionFeeByUser:function(data,session,callback){//管理员扣费
        var result = {success: false};
        var uid=session.user._id;
        var balance=utils.formatFee(data.money);

        financeAccountHandler.consumeFinanceAccountBalance(data.account, {balance: -balance}, {}, function(err, acc, paidAcc, hasFinanceAccount) {
            if(!err){
                //报表事件
                var eventData = {
                    account : data.account,
                    balance : balance
                };

                if(data.userPayType == constants.dedcutUserPayType.work){
                    appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_WORK,eventData);
                }else if(data.userPayType == constants.dedcutUserPayType.hardware){
                    appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_HARDWARE,eventData);
                }else if (data.userPayType == constants.dedcutUserPayType.tape){
                    appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_TAPE,eventData);
                }else if (data.userPayType == constants.dedcutUserPayType.other){
                    appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_OTHER,eventData);
                }else if (data.userPayType == constants.dedcutUserPayType.backout){
                    //冲一个负的.
                    var isFirst = (acc.firstPayTime && utils.DateTime.getDiffOfNowFrom(acc.firstPayTime,'day') <= 30) || false;
                    appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_PAY,{account : data.account,payNum:-balance,isFirst:isFirst});
                }

                if(data.userPayType == constants.dedcutUserPayType.backout){
                    AccountPayConsume.incrPay(data.account,-balance);//减去累计充值

                    //给客户经理提成
                    if (acc.customerCare && acc.isBonus2customerCare) {
                        payHandler.bonus2CustomerCare(acc._id, acc.customerCare, -balance);
                    }
                    // 给技术顾问提成
                    if (acc.consultant) {
                        payHandler.bonus2Consultant(acc._id, acc.consultant, -balance);
                    }
                }else{
                    AccountPayConsume.incrConsume(data.account,balance);//累计消费
                }

                var time=utils.DateTime.getCurrentDateTime();
                Account.getProxy(acc._id,function(err,proxy) {
                    if(err){
                        logger.app.error(err);
                        return callback(result);
                    }
                    utils.BusinessUtil.getPayOrderNo(null, function (rep2) {
                        if (rep2.success) {
                            var orderNo = "BM" + rep2.orderNo;
                            var paySet = {
                                _id: orderNo,
                                account: data.account,
                                payType: constants.payType.balance,
                                flag: data.userPayType,
                                pay_time: time,
                                bank: "",
                                status: "pay",
                                totalFee: data.money + "",
                                sn: {
                                    memo: data.memo || ''
                                },
                                currentBalance: utils.formatTrueFee(acc.balance) + "",
                                proxy : proxy ? proxy._id : '',
                            }
                            if (hasFinanceAccount) {
                                paySet[financeAccountHandler.constant] = paidAcc._id.toString();
                            }
                            mongo.db("zj").collection(constants.DB.user_pay).insert(paySet);
                            //log
                            var history = {
                                _id: utils.UUID.generateUuid(),
                                time: utils.DateTime.getCurrentDateTime(),
                                account: acc._id,
                                user: uid,
                                type: "deduction",
                                content: session.user.name + "向" + acc._id + "账户扣费【" + data.money + "】元"
                            }
                            mongo.db().collection(constants.DB.bill_operate_log).insert(history);
                            result.success = true;
                            callback(result);
                        } else {
                            callback(rep2);
                        }
                    });
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });

        // mongo.db().collection(constants.DB.platform_account).findAndModify({_id:data.account},[],{$inc:{balance:-balance}},{new:true},function(err,acc){
        //     if(!err){
        //         //报表事件
        //         var eventData = {
        //             account : data.account,
        //             balance : balance,
        //         }
        //
        //         if(data.userPayType == constants.dedcutUserPayType.work){
        //             appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_WORK,eventData);
        //         }else if(data.userPayType == constants.dedcutUserPayType.hardware){
        //             appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_HARDWARE,eventData);
        //         }else if (data.userPayType == constants.dedcutUserPayType.tape){
        //             appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_TAPE,eventData);
        //         }else if (data.userPayType == constants.dedcutUserPayType.other){
        //             appEvent.emitOperationReportEvent(appEvent.EventType.CHARGE_OTHER,eventData);
        //         }else if (data.userPayType == constants.dedcutUserPayType.backout){
        //             //冲一个负的.
        //             var isFirst = (acc.firstPayTime && utils.DateTime.getDiffOfNowFrom(acc.firstPayTime,'day') <= 30) || false;
        //             appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_PAY,{account : data.account,payNum:-balance,isFirst:isFirst});
        //         }
        //
        //         if(data.userPayType == constants.dedcutUserPayType.backout){
        //             AccountPayConsume.incrPay(data.account,-balance);//减去累计充值
        //
        //             //给客户经理提成
        //             if (acc.customerCare && acc.isBonus2customerCare) {
        //                 payHandler.bonus2CustomerCare(acc._id, acc.customerCare, -balance);
        //             }
        //             // 给技术顾问提成
        //             if (acc.consultant) {
        //                 payHandler.bonus2Consultant(acc._id, acc.consultant, -balance);
        //             }
        //         }else{
        //             AccountPayConsume.incrConsume(data.account,balance);//累计消费
        //         }
        //
        //         var time=utils.DateTime.getCurrentDateTime();
        //         Account.getProxy(acc._id,function(err,proxy) {
        //             if(err){
        //                 logger.app.error(err);
        //                 return callback(result);
        //             }
        //             utils.BusinessUtil.getPayOrderNo(null, function (rep2) {
        //                 if (rep2.success) {
        //                     var orderNo = "BM" + rep2.orderNo;
        //                     var paySet = {
        //                         _id: orderNo,
        //                         account: data.account,
        //                         payType: constants.payType.balance,
        //                         flag: data.userPayType,
        //                         pay_time: time,
        //                         bank: "",
        //                         status: "pay",
        //                         totalFee: data.money + "",
        //                         sn: {
        //                             memo: data.memo || ''
        //                         },
        //                         currentBalance: utils.formatTrueFee(acc.balance) + "",
        //                         proxy : proxy ? proxy._id : '',
        //                     }
        //                     mongo.db("zj").collection(constants.DB.user_pay).insert(paySet);
        //                     //log
        //                     var history = {
        //                         _id: utils.UUID.generateUuid(),
        //                         time: utils.DateTime.getCurrentDateTime(),
        //                         account: acc._id,
        //                         user: uid,
        //                         type: "deduction",
        //                         content: session.user.name + "向" + acc._id + "账户扣费【" + data.money + "】元"
        //                     }
        //                     mongo.db().collection(constants.DB.bill_operate_log).insert(history);
        //                     result.success = true;
        //                     callback(result);
        //                 } else {
        //                     callback(rep2);
        //                 }
        //             });
        //         });
        //     }else{
        //         logger.app.error(err);
        //         callback(result);
        //     }
        // });
    },
    _sendNotifyPayMailByBillUser: function (data,session) {
        var mail=data.proxyMail;
        var name=session.user.name;
        var uid=session.user._id;
        if(!mail){
            logger.app.error('['+data.proxyName+']的邮箱为空，发送充值提醒失败');
            return;
        }
        var sendMail = {
            toAddr: [mail],
            subject: "运营系统充值提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal",
            registeKey: utils.UUID.generateUuid(),
            account:uid
        };
        fs.readFile(__baseDir + "/views/notify/notifyBillPay.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    opertor: name,
                    companyName:data.companyName,
                    proxyName:data.proxyName,
                    money:data.money,
                    remark:data.remark||"",
                    isFirstDesc:data.isFirstPay?"是":"否"
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }else{
                        logger.app.info('给客户【'+data.companyName+'】充值,充值金额'+data.money+'元');
                    }
                });
            } else {
                logger.app.error("mail templete[_sendNotifyPayMailByBillUser] not found!", err);

            }
        });
    },
    pay2AccByUser:function(data,session,callback){//管理员充值
        var result = {success: false};
        var uid=session.user._id;
        var balance=utils.formatFee(data.money);
        var time=utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_account).findAndModify({_id:data.account},[],{$inc:{balance:balance}},{new:true},function(err,acc){
            if(!err){
                //var accMail=acc.linkManEmail;
                var companyName=acc.companyName;
                //var createMethod=acc.createMethod;
                var createUser=acc.createUser;

                var eventData = {
                    account : data.account,
                    payNum : balance,
                    payUser : uid,
                    payKind : constants.payFlag.payAccByBill,
                    bank : "",
                    useFor : constants.payFlag.payAccByBill
                };

                //var isFirstPay = false;
                //if(acc.status != 'normal'){
                //    isFirstPay = true;
                //}
                //if(data.isFirst){
                //    isFirstPay = true;
                //}
                //首次回款,或者距离首次回款时间小于30天的算作首签回款.
                UserBankPay.isFirstPay(time,data.account,function(err,isFirstPay) {
                    if(err){
                        logger.app.error(err);
                        return callback(result);
                    }
                    eventData.isFirst = isFirstPay;
                    appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_PAY, eventData);
                    AccountPayConsume.incrPay(data.account, balance);//累计充值
                    //新加逻辑
                    payHandler.updateAccStatus(acc);
                    //给客户经理提成
                    if (acc.customerCare && acc.isBonus2customerCare) {
                        payHandler.bonus2CustomerCare(acc._id, acc.customerCare, balance);
                    }
                    // 给技术顾问提成
                    if (acc.consultant) {
                        payHandler.bonus2Consultant(acc._id, acc.consultant, balance);
                    }
                    utils.BusinessUtil.getPayOrderNo(null, function (rep2) {
                        if (rep2.success) {
                            var orderNo = "BM" + rep2.orderNo;
                            var paySet = {
                                _id: orderNo,
                                account: data.account,
                                payType: constants.payType.balance,
                                flag: constants.payFlag.payAccByBill,
                                pay_time: time,
                                bank: "",
                                money: data.money + "",
                                memo: data.memo,
                                proxy: uid,
                                isFirstPay: isFirstPay
                            }
                            mongo.db("zj").collection(constants.DB.user_bank_pay).insert(paySet);
                            payHandler.resetOweFeeInfo(acc);

                            mongo.db().collection(constants.DB.system_user).findOne({_id: createUser}, function (err, proxy) {
                                if (!err) {
                                    var proxyType = proxy.proxyType;
                                    var proxyName = proxy.name || "";
                                    var proxyMail = proxy.linkManEmail || "";
                                    if (!utils.isOurSales(proxyType)) {
                                        proxyMail = "";
                                    }
                                    var _mail = {
                                        proxyName: proxyName,
                                        proxyMail: proxyMail,
                                        companyName: companyName,
                                        money: data.money,
                                        remark: data.memo,
                                        isFirstPay: isFirstPay
                                    }
                                    //console.dir(_mail);

                                    handler._sendNotifyPayMailByBillUser(_mail, session);
                                } else {
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });


                            result.success = true;
                            callback(result);
                        } else {
                            callback(rep2);
                        }
                    });
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    pay2ProxyByUser:function(data,session,callback){//管理员给代理充值
        var result = {success: false};
        var uid=session.user._id;
        var balance=utils.formatFee(data.money);
        var memo=data.memo;
        var id=data._id;
        mongo.db().collection(constants.DB.system_user).findAndModify({_id:id},[],{$inc:{balance:balance}},{new:true},function(err,proxyUser){
            if(!err){
                var eventData = {
                    proxy : id,
                    payNum : balance,
                    bank : "",
                    payUser : uid
                };
                appEvent.emitOperationReportEvent(appEvent.EventType.PROXY_PAY,eventData);
                var time=utils.DateTime.getCurrentDateTime();
                utils.BusinessUtil.getPayOrderNo(null,function(rep2){
                    if(rep2.success){
                        var orderNo="BM"+rep2.orderNo;
                        var payset={
                            _id:orderNo,
                            status:'pay',
                            payType:constants.payType.balance,
                            money:data.money+"",
                            income:data.money+"",
                            account:"",
                            create_time:time,
                            pay_time:time,
                            flag:constants.proxySource.systemPay,
                            proxy:id,
                            operator:uid,
                            currentBalance:utils.formatTrueFee(proxyUser.balance)+"",
                            source:constants.proxySource.systemPay,
                            memo:memo,
                            timestamp:utils.DateTime.getCurrentTimestamp()
                        }
                        mongo.db().collection(constants.DB.bill_user_pay).insert(payset);
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
    },

    /**
     * 判断该产品是否满足扣低消的条件
     * @param data
     * @param session
     * @param callback
     */
    getAccConsumeInfo: function (data, session, callback) {
        var result = {success: false};
        var account=data.account;
        var pId=account+"_cc";
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: pId}, function (err, productDB) {
            if (!err) {
                if(productDB){
                    var minConsume=productDB.minConsume;
                    var giveMinute=productDB.giveMinute;
                    if(minConsume>0){
                        var date=utils.DateTime.getCurrentDateMonth();
                        var time=utils.DateTime.getCurrentDateTime();
                        var _ary=date.split("-");
                        var year=_ary[0],month=_ary[1];
                        var _id=account+"_"+date+"_cc";
                        mongo.db("bill_data").collection(constants.DB.bill_call_consume).findOne({_id:_id},function(err,row){
                            if(!err){
                                if(row && row.minConsume==0){
                                    result.data=row;
                                    result.success = true;
                                    callback(result);
                                }else{
                                    result.message="未生成账单或账单已扣低消！";
                                    callback(result);
/*                                    var _data={
                                        _id:_id,
                                        account : account,
                                        accountType : "normal",
                                        name : "cc",
                                        "displayName" : "",
                                        year : year,
                                        month :month,
                                        calls : 0,
                                        localMinutes : 0,
                                        remoteMinutes : 0,
                                        localSecond6 : 0,
                                        remoteSecond6 : 0,
                                        minConsume : minConsume,
                                        balance : minConsume,
                                        giveMinute : giveMinute,
                                        presentMinute :giveMinute,
                                        actualConsume : 0,
                                        monthRent : 0,
                                        discount : 0,
                                        createTime : time,
                                        proxy : ""
                                    }*/
                                }
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.message="还未设置低消";
                    }
                }else{
                    result.message="还未开通呼叫中心产品";
                    callback(result);
                }
            }else{
                logger.app.error(err);
                callback(result);
            }
        })

    }

};

// 格式化时间
// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

module.exports = handler;
