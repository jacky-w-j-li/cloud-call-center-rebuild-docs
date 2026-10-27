var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var httpProvider = require("appHttp");
var constants = require(__baseDir + "/7moor/utils/Constants");
var appHttp = require('appHttp');
var fs = require("fs");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var config = require('appConfig');
var payHandler = require(__baseDir + '/7moor/ucenter/PayHandler');
var appEvent = require("appEvent");

var Account = require(__baseDir + '/models/Account');
var AccountPayConsume = require(__baseDir + '/models/AccountPayConsume');
var UserBankPay = require(__baseDir + "/models/UserBankPay");

var handler = {
    emailReg: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,

    _queryIdHandler:function(query,begin,end){
        if (begin) {
            query._id = {
                $gte: begin
            }
        }
        if (end) {
            if (query._id) {
                query._id.$lte = end;
            } else {
                query._id = {
                    $lte: end
                }
            }
        }
        return query;
    },
    _queryMinConIdHandler:function(query,begin,end){
        if (begin) {
            query.minConsume = {
                $gte: utils.formatFee(begin)
            }
        }
        if (end) {
            if (query.minConsume) {
                query.minConsume.$lte = utils.formatFee(end);
            } else {
                query.minConsume = {
                    $lte: utils.formatFee(end)
                }
            }
        }
        return query;
    },
    //查询代理所有下属的呼叫中心产品信息
    queryProxyAccInfo: function (data, session, callback) {
        var result = {success: false};
        var query = {
            createUser:session.user._id
        };
        var beginNum = data.beginNum;
        var endNum = data.endNum;
        handler._queryIdHandler(query,beginNum,endNum);
        var accData = [];
        var product = data.product;
        mongo.db().collection(constants.DB.platform_account).find(query).toArray(function (err, accs) {
            if (!err && accs) {
                if(accs.length <= 0){
                    result.message = '没有下属账户！';
                    callback(result);
                }else {
                    //将账户id存入数组
                    var ids = [];
                    for(var i = 0;i<accs.length;i++){
                        var acc = accs[i];
                        ids.push(acc._id+'_'+product);
                    }
                    var queryData = {
                        _id:{$in:ids}
                    };
                    var beginCost = data.beginCost;
                    var endCost = data.endCost;
                    handler._queryMinConIdHandler(queryData,beginCost,endCost);
                    mongo.db().collection(constants.DB.platform_account_product).find(queryData).toArray(function(err,accpros){
                        if(!err){
                            if(accpros && accpros.length > 0){
                                for(var i = 0;i<accpros.length;i++){
                                    var accpro = accpros[i];
                                    var info = {
                                        account: accpro.account,
                                        name: '',
                                        companyName: '',
                                        balance: 0,
                                        minConsume: utils.formatTrueFee(accpro.minConsume),
                                        money: utils.formatTrueFee(accpro.minConsume)
                                    };
                                    for(var index = 0;index<accs.length;index++){
                                        var acc = accs[index];
                                        if(acc._id == accpro.account){
                                            info.name = acc.name;
                                            info.companyName = acc.companyName;
                                            info.balance=utils.formatTrueFee(acc.balance)
                                            break;
                                        }
                                    }
                                    accData.push(info);
                                }
                                result.success = true;
                                result.list = accData;
                                callback(result);
                            } else{
                                result.message = '下属账户没有开通该产品！';
                                callback(result);
                            }
                        }else{
                            logger.app.error(err.stack);
                            result.message = '查询账户产品信息失败！';
                            callback(result);
                        }
                    });
                }
            } else {
                logger.app.error(err.stack);
                result.message = '获取下属账户信息失败！';
                callback(result);
            }
        });
    },
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
    _sendNotifyBatchPayMail: function (data, session) {
        var mail = session.user.linkManEmail;
        var name = session.user.name;
        var uid = session.user._id;
        if (!mail || !handler.emailReg.test(mail)) {
            logger.app.error('[' + name + ']的邮箱为空，发送充值提醒失败');
            return;
        }
        var sendMail = {
            toAddr: [mail],
            subject: "批量充值提醒",
            type: "bankPay",
            ccAddr: [],
            status: "undeal",
            account: uid
        };
        fs.readFile(__baseDir + "/views/proxy/sendNotifyBatchPay.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj = {
                    proxyName: name,
                    payFee: data.payFee,
                    payTypeDesc: data.payTypeDesc,
                    snContent: data.snContent,
                    currentBalance: data.currentBalance
                }
                html = handler._renderView(html, obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    } else {
                        logger.app.info('给代理【' + name + '】发送充值提醒,充值金额' + data.payFee + '元');
                    }
                });
            } else {
                logger.app.error("mail templete[_sendNotifyBatchPayMail] not found!", err);

            }
        });

    },
    //呼叫中心批量充值（话费余额，低消余额）
    batchPay: function (data, session, callback) {
        var result = {success: false};
        var payData = data.payData;
        var payFee = utils.formatFee(data.payFee);
        //var payType = data.payType;
        var uid = session.user._id;
        //var flag = payType == "0" ? constants.proxySource.payCallFee : constants.proxySource.payCallMin;
        var flag = constants.proxySource.payAccount;
        var product = data.product;
        if(data.payFee == 0){
            result.message = '充值失败:充值金额不能全部为0';
            callback(result);
        }
        mongo.db().collection(constants.DB.system_user).findOne({_id: uid}, function (err, sys) {
            if (!err && sys) {
                //判断可支付余额
                if (payFee <= sys.balance + (sys.overdraw || 0)) {
                    var index = 0;
                    var _mailData = [];//用于发送邮件
                    var _batchPayHandler = function () {
                        var payAcc = payData[index];
                        var account = payAcc.account;
                        var money = payAcc.money;//未格式化
                        var companyName = payAcc.companyName;
                        _mailData.push({
                            account: account,
                            companyName: companyName,
                            money: money
                        });
                        var set = {
                            balance: -utils.formatFee(money)
                        };
                        mongo.db().collection(constants.DB.system_user).findAndModify({_id: uid}, [], {$inc: set}, {new: true}, function (err, proxyUser) {
                            if (err) {
                                logger.app.error(err.stack);
                                result.message = '充值失败！';
                                callback(result);
                            } else {
                                var set = {};
                                //if (payType == '0') {
                                    set.balance = utils.formatFee(money);
                                //} else {
                                //    set.minConsumeBalance = utils.formatFee(money);
                                //}
                                mongo.db().collection(constants.DB.platform_account).findAndModify({_id: account}, [], {$inc: set}, {new: true}, function (err, acc) {
                                    if (err) {
                                        logger.app.error(err.stack);
                                        result.message = '充值失败！';
                                        callback(result);
                                    } else {
                                        var eventData = {
                                            account : account,
                                            payNum : set.balance,
                                            useFor : constants.payFlag.payAccByBill
                                        };
                                        //var isFirstPay = false;
                                        //if(acc.status != 'normal'){ //非正式客户,首次付费
                                        //    isFirstPay = true;
                                        //}
                                        //首次回款,或者距离首次回款时间小于30天的算作首签回款.
                                        UserBankPay.isFirstPay(utils.DateTime.getCurrentDateTime(),account,function(err,isFirstPay) {
                                            if (err) {
                                                logger.app.error(err);
                                                return callback(result);
                                            }

                                            eventData.isFirst = isFirstPay;
                                            if (session.user.identity == 'proxy') {
                                                eventData.proxy = uid;
                                                appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_PROXY_PAY, eventData);
                                            } else {
                                                eventData.payUser = uid;
                                                eventData.payKind = flag;
                                                eventData.bank = "";
                                                appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_PAY, eventData);
                                            }
                                            AccountPayConsume.incrPay(account, set.balance);//累计充值

                                            //新加逻辑
                                            payHandler.updateAccStatus(acc);

                                            //给客户经理提成
                                            if (acc.customerCare && acc.isBonus2customerCare) {
                                                payHandler.bonus2CustomerCare(acc._id, acc.customerCare, set.balance);
                                            }

                                            // 给技术顾问提成
                                            if (acc.consultant) {
                                                payHandler.bonus2Consultant(acc._id, acc.consultant, set.balance);
                                            }
                                            var time = utils.DateTime.getCurrentDateTime();
                                            utils.BusinessUtil.getPayOrderNo(null, function (rep2) {
                                                if (rep2.success) {
                                                    var orderNo = "BP" + rep2.orderNo;
                                                    var payset = {
                                                        _id: orderNo,
                                                        status: 'pay',
                                                        payType: constants.payType.balance,
                                                        money: money + '',
                                                        income: money + '',
                                                        account: account,
                                                        create_time: time,
                                                        pay_time: time,
                                                        flag: flag,
                                                        product: product,
                                                        proxy: uid,
                                                        currentBalance: utils.formatTrueFee(proxyUser.balance) + "",
                                                        source: flag,
                                                        timestamp: utils.DateTime.getCurrentTimestamp()
                                                    }
                                                    mongo.db().collection(constants.DB.bill_user_pay).insert(payset);

                                                    var currentBalance = acc.balance;
                                                    //if (payType == '1') {
                                                    //    currentBalance = acc.minConsumeBalance;
                                                    //}
                                                    var paySet2 = {
                                                        _id: orderNo,
                                                        account: account,
                                                        payType: constants.payType.balance,
                                                        flag: flag,
                                                        pay_time: time,
                                                        bank: "",
                                                        money: money + "",
                                                        product: product,
                                                        proxy: uid,
                                                        currentBalance: utils.formatTrueFee(currentBalance) + "",
                                                        isFirstPay: isFirstPay,
                                                    }
                                                    mongo.db("zj").collection(constants.DB.user_bank_pay).insert(paySet2);
                                                    //检查呼叫中心欠费记录、重置呼叫中心产品的欠费次数、及通知次数
                                                    //payHandler.resetCCOweFeeInfo(constants.DB.platform_account_product, account + '_'+product);
                                                    if (index == payData.length - 1) {
                                                        //给代理发送一个汇总的邮件
                                                        var html = [];
                                                        var tmpl = "<tr><td>_#account#_</td><td>_#companyName#_</td><td>_#money#_元</td></tr>";
                                                        var payTypeDesc = '外呼余额';
                                                        //if (payType == '1') {
                                                        //    payTypeDesc = "低消余额";
                                                        //}
                                                        var _mail = {
                                                            snContent: '',
                                                            payFee: data.payFee,
                                                            payTypeDesc: payTypeDesc,
                                                            currentBalance: utils.formatTrueFee(proxyUser.balance) + ""
                                                        };
                                                        for (var i = 0; i < _mailData.length; i++) {
                                                            var obj = _mailData[i];
                                                            html.push(handler._renderView(tmpl, obj));
                                                        }
                                                        _mail.snContent = html.join("");
                                                        handler._sendNotifyBatchPayMail(_mail, session);

                                                        result.success = true;
                                                        callback(result);
                                                    } else {
                                                        index++;
                                                        _batchPayHandler();
                                                    }
                                                } else {
                                                    callback(rep2);
                                                }
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    };
                    _batchPayHandler();
                } else {
                    result.message = '您的余额不足，充值失败！';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = '充值失败！';
                callback(result);
            }
        });

    },
    batchSetMinConsume: function (data, session, callback) {
        var result = {success: false};
        var index = 0;
        var _batchSetHandler = function () {
            var column = data[index];
            var account = column.account;
            var minConsume = utils.formatFee(column.minConsume);
            var set = {
                minConsume: minConsume
            };
            mongo.db().collection(constants.DB.platform_account_product).update({_id: account + '_cc'}, {$set: set}, function (err) {
                if (!err) {
                    if (index == data.length - 1) {
                        result.success = true;
                        callback(result);
                    } else {
                        index++;
                        _batchSetHandler();
                    }
                } else {
                    logger.app.error(err.stack);
                    result.message = 'batch set product cc MinConsume error!';
                    callback(result);
                }
            });
        };
        _batchSetHandler();
    }
};
module.exports = handler;