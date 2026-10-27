var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var httpProvider = require("appHttp");
var constants = require(__baseDir + "/7moor/utils/Constants");
var appHttp = require('appHttp');
var ivrHandler = require(__baseDir + "/7moor/ivr/IvrHandler");
var systemHander = require(__baseDir + "/7moor/system/SystemHandler");
var accountDbHandler = require(__baseDir + "/7moor/account/AccountDbHandler");
var fs = require("fs");
var serviceHandler = require(__baseDir + '/7moor/service/ServiceHandler');
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var config = require('appConfig');
var notifyHandler = require(__baseDir + '/7moor/notify/NotifyHandler');
var appEvent = require("appEvent");
var http = require("appHttp");
var SysUser = require(__baseDir + "/models/SysUser");
var Account = require(__baseDir + "/models/Account");
var AccountProduct = require(__baseDir + "/models/AccountProduct");
var AccountPayConsume = require(__baseDir + "/models/AccountPayConsume");
var financeAccountDBProxy = require(__baseDir + "/7moor/account/FinanceAccountDBProxy");

var Then = require("thenjs");


var handler = {
    /**
     * 添加账户网关sip号
     * @param data
     * @param session
     * @param callback
     */
    addGatewaySipNum: function (data, session, callback) {
        var result = {success: false};
        var account = data.account, number = data.number, rule = data.ruleConfig.successional, code = data.codeConfig.code;
        if (code && !utils.ObjectUtil.isArray(code)) {
            code = [code];
        }
        if (rule) {
            utils.BusinessUtil.getSeriesSipNum(number, function (err, numbers) {
                if (!err) {
                    impl.effectSipNum(numbers, account, code, function (err) {
                        if (!err) {
                            result.success = true;
                        } else {
                            result.message = err.message;
                        }
                        callback(result);
                    });
                } else {
                    logger.app.error("getSeriesSipNum error!", err);
                    result.message = "获取sip号资源失败！";
                    callback(result);
                }
            });
        } else {
            utils.BusinessUtil.getSipNum(number, function (err, numbers) {
                if (!err) {
                    impl.effectSipNum(numbers, account, code, function (err) {
                        if (!err) {
                            result.success = true;
                        } else {
                            result.message = err.message;
                        }
                        callback(result);
                    });
                } else {
                    logger.app.error("getSipNum error!", err);
                    result.message = "获取sip号资源失败！";
                    callback(result);
                }
            });
        }
    },
    //查询账号拨号计数
    queryCallAccountSum: function(data,session,callback) {
        var condition ={
            _id:data
        }
        var result = {success:false};

        _impl._queryCallAccountSum(condition,function(err,resData){
            if(!err){
                result.success = true;
                result.list = resData;
            }else{
                result.message = '查询拨号计数失败,'+err.message;
                logger.app.error('query  call sum failed',err);
            }

            callback(result);
        });
    },
    //查询该账号是否存在含有pbx的产品
    queryPbxByAccountId: function(data,session,callback) {
        //  db.getCollection('platform_account_product').find({"pbx" : {"$exists":true},"product" : "cc"})
        var condition ={
            product: "cc",
            pbx:{$exists:true},
            account:data._id
        }
        var result = {success:false};

        _impl._queryPbxByAccountId(condition,function(err,resData){
            if(!err){
                result.success = true;
                result.list = resData;
            }else{
                result.message = '查询拨号计数失败,'+err.message;
                logger.app.error('query  call sum failed',err);
            }
            callback(result);
        });
    },

    addGatewaySipNumByUcenter: function (data, session, callback) {
        var result = {success: false};
        var account = data.account, number = data.number, rule = data.successional, isFax = data.isFax, code = data.code;
        if (code && !utils.ObjectUtil.isArray(code)) {
            code = [code];
        }
        var product = data.product;
        if (rule) {
            utils.BusinessUtil.getSeriesSipNum(number, function (err, numbers) {
                if (!err) {
                    impl.effectSipNumByUcenter(product, numbers, account, code, session, isFax, function (err) {
                        if (!err) {
                            result.success = true;
                        } else {
                            result.message = err.message;
                        }
                        callback(result);
                    });
                } else {
                    logger.app.error("getSeriesSipNum error!", err);
                    result.message = "获取sip号资源失败！";
                    callback(result);
                }
            });
        } else {
            utils.BusinessUtil.getSipNum(number, function (err, numbers) {
                if (!err) {
                    impl.effectSipNumByUcenter(product, numbers, account, code, session, isFax, function (err) {
                        if (!err) {
                            result.success = true;
                        } else {
                            result.message = err.message;
                        }
                        callback(result);
                    });
                } else {
                    logger.app.error("getSipNum error!", err);
                    result.message = "获取sip号资源失败！";
                    callback(result);
                }
            });
        }

    },
    updateZJSipNumByUcenter: function (data, session, callback) {
        var result = {success: false};
        var secret = data.secret;
        var _id = data._id;
        mongo.db().collection(constants.DB.platform_sipNum).findOne({_id: _id}, function (err, dbSipNum) {
            if (dbSipNum) {
                mongo.db().collection(constants.DB.platform_pbx).findOne({_id: dbSipNum.pbx}, function (err, dbPbx) {
                    if (dbPbx) {
                        var url = dbPbx.configAddr;
                        var postData = {
                            Command: "Action",
                            Action: "GatewaySipsUpdate",
                            ActionID: utils.UUID.generateUuid(),
                            sipNo: _id,
                            codecs: dbSipNum.codes,
                            account: dbSipNum.account,
                            pbx: dbSipNum.pbx,
                            secret: secret
                        };
                        appHttp.sendPost(url, postData, function (err, data) {
                            if (!err) {
                                data = JSON.parse(data + "");
                                if (data.Succeed) {
                                    mongo.db().collection(constants.DB.platform_sipNum).update({_id: _id}, {$set: {secret: secret}});
                                    result.success = true;
                                    callback(result);
                                } else {
                                    callback(result);
                                }
                            } else {
                                logger.app.error("request acs server error!", err);
                                result.message = "request acs server error!";
                                callback(result);
                            }
                        });
                    } else {
                        callback(result);
                    }
                });

            } else {
                callback(result);
            }
        });
    },
    updateZJSipNumCodesByUcenter: function (data, session, callback) {
        var result = {success: false};
        var _id = data._id;
        var isFax = data.isFax;
        var codes = data.code;
        if (codes && !utils.ObjectUtil.isArray(codes)) {
            codes = [codes];
        }
        mongo.db().collection(constants.DB.platform_sipNum).findOne({_id: _id}, function (err, dbSipNum) {
            if (dbSipNum) {
                mongo.db().collection(constants.DB.platform_pbx).findOne({_id: dbSipNum.pbx}, function (err, dbPbx) {
                    if (dbPbx) {
                        var url = dbPbx.configAddr;
                        var postData = {
                            Command: "Action",
                            Action: "GatewaySipsUpdate",
                            ActionID: utils.UUID.generateUuid(),
                            sipNo: _id,
                            codecs: codes,
                            isFax: isFax,
                            account: dbSipNum.account,
                            pbx: dbSipNum.pbx,
                            secret: dbSipNum.secret
                        };
                        appHttp.sendPost(url, postData, function (err, data) {
                            if (!err) {
                                data = JSON.parse(data + "");
                                if (data.Succeed) {
                                    mongo.db().collection(constants.DB.platform_sipNum).update({_id: _id}, {
                                        $set: {
                                            isFax: isFax,
                                            codes: codes
                                        }
                                    });
                                    result.success = true;
                                    callback(result);
                                } else {
                                    callback(result);
                                }
                            } else {
                                logger.app.error("request acs server error!", err);
                                result.message = "request acs server error!";
                                callback(result);
                            }
                        });
                    } else {
                        callback(result);
                    }
                });

            } else {
                callback(result);
            }
        });
    },
    /**
     * 创建新账户
     * @param data
     * @param session
     * @param callback
     */
    createNewAccount: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account).findOne({name: data.name}, function (err, oneAccount) {
            if (!err) {
                if (!oneAccount) {
                    utils.BusinessUtil.getAccountId(function (err, id) {
                        if (!err) {
                            data._id = id;
                            data.createTime = utils.DateTime.getCurrentDateTime();
                            data.billTime = utils.DateTime.getCurrentDateMonth();
                            if (data.createMethod == '计费创建') {
                                data.createMethod = constants.accountCreateMethod.bill;
                            }
                            data.imMaxDealCount = 10;
                            //data.createMethod = data.createMethod || constants.accountCreateMethod.bill;
                            if (data.createUser) {
                                //data.createMethod=constants.accountCreateMethod.proxy;
                                mongo.db().collection(constants.DB.system_user).findOne({_id: data.createUser}, function (err, createUser) {
                                    if (!err) {
                                        if (!createUser) {
                                            result.message = "选择所属人错误！";
                                            callback(result);
                                            return;
                                        }
                                        if(data.customerCare){
                                            if((createUser.proxyType == constants.proxyType.channel || createUser.proxyType == constants.proxyType.zj)){
                                                data.isBonus2customerCare = false; //渠道,总机代理 创建的账户客户经理没有提成.
                                            }else{
                                                data.isBonus2customerCare = true;
                                            }
                                        }
                                        if (data.createMethod == constants.accountCreateMethod.proxy && createUser.identity != constants.systemUserIndentity.proxy) {
                                            logger.app.error("add new account to db error!", err);
                                            result.message = "账户来源为代理创建时，所属人身份必须是代理！";
                                            callback(result);
                                        } else if (data.createMethod == constants.accountCreateMethod.bill && createUser.identity == constants.systemUserIndentity.proxy) {
                                            logger.app.error("add new account to db error!", err);
                                            result.message = "账户来源为计费创建时，所属人身份不能是代理！";
                                            callback(result);
                                        } else {
                                            data.createMethod = data.createMethod || constants.accountCreateMethod.bill;
                                            if (session.user.identity == constants.systemUserIndentity.proxy) {
                                                data.createMethod = constants.accountCreateMethod.proxy;
                                            }

                                            data.creator = session.user._id;
                                            data.status = constants.accountStatus.newTry;
                                            if (data.createMethod == 'www') {
                                                data.status = constants.accountStatus.free;
                                            }
                                            data.balance = 0;//余额
                                            data.outCallAlert = 0;//外呼预警值
                                            data.serviceNumAlert = 15;//服务号预警值

                                            mongo.db().collection(constants.DB.platform_account).insert(data, {w: 1}, function (err) {
                                                if (!err) {
                                                    if(data.status == constants.accountStatus.newTry) {
                                                        appEvent.emitOperationReportEvent(appEvent.EventType.NEW_ACCOUNT, data);
                                                    }
                                                    //初始化组织机构
                                                    var senData ={"account":data._id,"userId":session.user._id};
                                                    _impl.initDept(senData,function (res){
                                                        if(res.success){
                                                            result.success = true;
                                                            result.account = data;
                                                            callback(result);
                                                        }else{
                                                            logger.app.error("insert department to db error!", err);
                                                            callback(result);
                                                        }
                                                    })
                                                } else {
                                                    logger.app.error("insert account to db error!", err);
                                                    callback(result);
                                                }
                                            });
                                        }
                                    } else {
                                        logger.app.error("add new account to db error!", err);
                                        result.message = "数据库查询数据异常";
                                        callback(result);
                                    }
                                });
                            } else {//不存在创建人
                                data.createMethod = data.createMethod || constants.accountCreateMethod.bill;
                                if (data.createMethod == constants.accountCreateMethod.proxy) {//防止出现代理创建但所属人是系统管理员的情况
                                    logger.app.error("add new account to db error!", err);
                                    result.message = "账户来源为代理创建时，所属人不能为空！";
                                    callback(result);
                                } else {
                                    data.createUser = session.user._id ? session.user._id : "system";

                                    data.creator = session.user._id;
                                    data.status = constants.accountStatus.newTry;
                                    if (data.createMethod == 'www') {
                                        data.status = constants.accountStatus.free;
                                    }
                                    data.balance = 0;//余额
                                    data.outCallAlert = 0;//外呼预警值
                                    data.serviceNumAlert = 15;//服务号预警值

                                    if(data.customerCare){
                                        if((session.user.proxyType == constants.proxyType.channel || session.user.proxyType == constants.proxyType.zj)){
                                            data.isBonus2customerCare = false; //渠道,总机代理 创建的账户客户经理没有提成.
                                        }else{
                                            data.isBonus2customerCare = true;
                                        }
                                    }

                                    if (session.user.identity == constants.systemUserIndentity.proxy) {
                                        data.createMethod = constants.accountCreateMethod.proxy;
                                    }
                                    mongo.db().collection(constants.DB.platform_account).insert(data, {w: 1}, function (err) {
                                        if (!err) {
                                            if(data.status == constants.accountStatus.newTry) {
                                                appEvent.emitOperationReportEvent(appEvent.EventType.NEW_ACCOUNT, data);
                                            }
                                            //初始化组织机构
                                            var senData ={"account":data._id,"userId":session.user._id};
                                            _impl.initDept(senData,function (res){
                                                if(res.success){
                                                    result.success = true;
                                                    result.account = data;
                                                    callback(result);
                                                }else{
                                                    logger.app.error("insert department to db error!", err);
                                                    callback(result);
                                                }
                                            })
                                        } else {
                                            logger.app.error("insert account to db error!", err);
                                            callback(result);
                                        }
                                    });
                                }
                            }
                        } else {
                            logger.app.error("get account id error!", err);
                            callback(result);
                        }
                    });
                } else {
                    result.message = "账户登录名【" + data.name + "】已经存在，请换一个账户进行注册！";
                    callback(result);
                }
            } else {
                logger.app.warn("addAccount check name err!", err);
                callback(result);
            }
        });
    },

    openAccountCustFeeProduct: function(data,session,callback){
        var result = {success:false};
        var custFees = data.custFees;

        if(!custFees || custFees.length == 0){
            result.message = '非法参数!!';
            callback(result);
            return;
        }
        //处理新增扣费设置
        custFees.forEach(function(item){
            item.price = utils.formatFee(item.price);
            item.state = 'stop';
            item.id = utils.UUID.generateUuid();
            item.createTime = utils.DateTime.getCurrentDateTime();
        });

        //初始字段
        data._id = data.account + "_" + data.product;
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.createUser = session.user._id;

        _impl.openAccountCustFeeProduct(data,function(err){
            if(err){
                logger.app.error('开通新产品失败[account:'+data.account+",product:"+data.product+"]\r\n"+err.message);
                if(err.code==11000){
                    result.message = '产品已存在';
                }else{
                    result.message = "开通新产品失败";
                }
                callback(result);
                return;
            }
            appEvent.emitOperationReportEvent(appEvent.EventType.OPEN_PRODUCT,data);
            result.success = true;
            callback(result);
        })

    },

    /**
     * 账户开通产品
     * @param data
     * @param session
     * @param callback
     */
    openAccountProduct: function (data, session, callback) {
        var result = {success: false};
        data._id = data.account + "_" + data.product;
        data.createTime = utils.DateTime.getCurrentDateTime();
        if (!data.balance) {
            data.balance = 0;
        }
        if (data.dialFee) {
            for (var i in data.dialFee) {
                data.dialFee[i] = utils.formatFee(data.dialFee[i]);
            }
        }
        if (data.fee) {
            for (var i in data.fee) {
                data.fee[i] = utils.formatFee(data.fee[i]);
            }
        }
        if (data.transferFee) {
            for (var i in data.transferFee) {
                data.transferFee[i] = utils.formatFee(data.transferFee[i]);
            }
        }
        if (data.voiceFee) {
            data.voiceFee = utils.formatFee(data.voiceFee);
        }
        //新加国际长途
        //if (data.internationalFee) {
        //    for (var i in data.internationalFee) {
        //        data.internationalFee[i] = utils.formatFee(data.internationalFee[i]);
        //    }
        //}
        if(data.intlFeeSet && data.intlFeeSet.isOpenIntl){
            if(data.intlFeeSet.fees && data.intlFeeSet.fees.length > 0){
                data.intlFeeSet.fees.forEach(function(item) {
                    item.price = utils.formatFee(item.price);
                });
            }

            if(data.intlFeeSet.otherPrice){
                data.intlFeeSet.otherPrice = utils.formatFee(data.intlFeeSet.otherPrice);
            }
        }

        if (data.smsFee) data.smsFee = utils.formatFee(data.smsFee);

        if (data.concurrentPrice) data.concurrentPrice = utils.formatFee(data.concurrentPrice);
        if (data.minConsume) data.minConsume = utils.formatFee(parseFloat(data.minConsume));
        if (data.discount) data.discount = utils.formatFee(data.discount);
        if (data.smsDiscount) data.smsDiscount = utils.formatFee(data.smsDiscount);
        if (data.callinLicence) data.callinLicence = utils.formatFee(data.callinLicence);
        //if (data.calloutLicence) data.calloutLicence = utils.formatFee(data.calloutLicence);
        if (data.monitorLicence) data.monitorLicence = utils.formatFee(data.monitorLicence);
        if (data.serviceLicence) data.serviceLicence = utils.formatFee(data.serviceLicence);
        if (data.giveMinute) data.giveMinute = parseInt(data.giveMinute, 10);
        if (data.calloutLicence) {
            data.calloutLicence = utils.formatFee(data.calloutLicence);
            //for(var key in data.calloutLicence){
            //    data.calloutLicence[key].price = utils.formatFee(data.calloutLicence[key].price);
            //}
        }

        var node = data.node;
        mongo.db().collection(constants.DB.platform_account).findOne({_id: data.account}, function (err, dbAccount) {
            if (!err && dbAccount) {
                if (data.product == "zj") {
                    var ivrData = impl._createIvrData(dbAccount);
                    ivrData.pbx = node;
                    ivrHandler.addAccount(ivrData, function (isSuccess) {
                        if (isSuccess) {
                            if (!data.pbx) data.pbx = [];
                            data.pbx.push({pbx: node});
                            data.billTime = "0000-00";
                            delete data.fee;
                            //data.node 换成机柜
                            _impl.getPBX(node,function(err,pbx){
                                if(err){
                                    logger.app.error("找不到pbx !!", err);
                                    callback(result);
                                    return;
                                }
                                data.node = pbx.board;
                                mongo.db().collection(constants.DB.platform_account_product).insert(data, {w: 1}, function (err) {
                                    if (!err) {
                                        appEvent.emitOperationReportEvent(appEvent.EventType.OPEN_PRODUCT,data);
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error("保存账户产品信息异常！!", err);
                                        callback(result);
                                    }
                                });

                            });
                        } else {
                            result.message = "pbx生成账户信息异常！";
                            logger.app.error("pbx生成账户信息异常! [" + dbAccount._id + "]");
                            callback(result);
                        }
                    });

                } else if (data.product == "cc") {
                    mongo.db().collection(constants.DB.db_master).findOne({master_key: "db_status"}, function (err, master) {
                        if (master) {
                            data.dataDB = master.db_current;
                            data.name = dbAccount.name;

                            if (data.effectYear && data.effectMonth) {
                                data.effectDate = data.effectYear + "-" + data.effectMonth;
                            } else {
                                data.effectYear = "";
                                data.effectMonth = "";
                                data.effectDate = "";
                            }
                            delete data.fee;
                            mongo.db().collection(constants.DB.platform_account_product).insert(data, {w: 1}, function (err) {

                                if (!err) {
                                    appEvent.emitOperationReportEvent(appEvent.EventType.OPEN_PRODUCT,data);
                                    systemHander.initApproveSurvey({_id: data.account}, session, function (proResult) {
                                        if (proResult.success) {
                                            systemHander.initQualityCheckOption({_id: data.account}, session, function (proResult) {
                                                if (proResult.success) {
//                                                accountDbHandler.initDb(data.account,data.dataDB);
                                                    handler.addCCDefaultRole(data, session, function (addResult) {
                                                        if (addResult.success) {
                                                            //生成公海数据
                                                            var commonPoolData = {"account":data.account};
                                                            _impl.initCommonPool(commonPoolData,function(poolRes){
                                                                if(poolRes.success){
                                                                    //生成客户状态审核数据
                                                                    var approvalBusinessData = {"account":data.account};
                                                                    setTimeout(function(){
                                                                        _impl.initApprovalBusiness(approvalBusinessData,function(businessRes){
                                                                        })
                                                                    },1000)
                                                                    result.success = true;
                                                                    callback(result);
                                                                }else{
                                                                    result.message = "生成默认的商机池失败";
                                                                    callback(result);
                                                                }
                                                            })
                                                        } else {
                                                            result.message = "生成默认的用户角色失败!";
                                                            callback(result);
                                                        }
                                                    });

                                                } else {
                                                    result.message = "初始化质检项失败!";
                                                    callback(result);
                                                }
                                            });
                                        } else {
                                            result.message = "初始化满意度调查失败!";
                                            callback(result);
                                        }
                                    });

                                } else {
                                    result.message = "添加产品信息失败!";
                                    callback(result);
                                }
                            });
                        } else {
                            result.message = "can not init account db!";
                            callback(result);
                        }
                    });
                } else if (data.product == "ll") {
                    delete data.transferFee;
                    delete data.dialFee;
                    delete data.internationalFee;
                    delete data.dialFeeStrategy;
                    delete data.balance;
                    delete data.pbx;
                    delete data.operatorsResource;
                    delete data.node;
                    mongo.db().collection(constants.DB.platform_account_product).insert(data, {w: 1}, function (err) {
                        if (!err) {
                            appEvent.emitOperationReportEvent(appEvent.EventType.OPEN_PRODUCT,data);
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("保存账户产品信息异常！!", err);
                            callback(result);
                        }
                    });
                } else if (data.product == 'yy') {
                    delete data.transferFee;
                    delete data.dialFee;
                    delete data.internationalFee;
                    delete data.fee;
                    delete data.dialFeeStrategy;
                    delete data.balance;
                    delete data.pbx;
                    delete data.operatorsResource;
                    delete data.node;
                    mongo.db().collection(constants.DB.platform_account_product).insert(data, {w: 1}, function (err) {
                        if (!err) {
                            appEvent.emitOperationReportEvent(appEvent.EventType.OPEN_PRODUCT,data);
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("保存账户产品信息异常！!", err);
                            callback(result);
                        }
                    });
                    } else {
                    result.message = "未知的产品信息！！";
                    callback(result);
                }

            } else {
                logger.app.error("获取账户信息异常!", err);
                result.message = "获取账户信息异常!";
                callback(result);
            }
        });

    },
    _initProductFields: function (product, result) {
        result.success = true;
        result.data = product;
        var data = product;
        if (data.dialFee) {
            for (var i in data.dialFee) {
                data.dialFee[i] = utils.formatTrueFee(data.dialFee[i]);
            }
        }
        if (data.fee) {
            for (var i in data.fee) {
                data.fee[i] = utils.formatTrueFee(data.fee[i]);
            }
        }
        if (data.transferFee) {
            for (var i in data.transferFee) {
                data.transferFee[i] = utils.formatTrueFee(data.transferFee[i]);
            }
        }
        if (data.internationalFee) {
            for (var i in data.internationalFee) {
                data.internationalFee[i] = utils.formatTrueFee(data.internationalFee[i]);
            }
        }
        if (data.smsFee) data.smsFee = utils.formatTrueFee(data.smsFee);
        if (data.voiceFee) data.voiceFee = utils.formatTrueFee(data.voiceFee);

        if (data.minConsume) data.minConsume = utils.formatTrueFee(data.minConsume);
        if (data.concurrentPrice) data.concurrentPrice = utils.formatTrueFee(data.concurrentPrice);
        if (data.discount) data.discount = utils.formatTrueFee(data.discount);
        if (data.smsDiscount) data.smsDiscount = utils.formatTrueFee(data.smsDiscount);
        if (data.serviceLicence) data.serviceLicence = utils.formatTrueFee(data.serviceLicence);
        if (data.calloutLicence) data.calloutLicence = utils.formatTrueFee(data.calloutLicence);
        if (data.callinLicence) data.callinLicence = utils.formatTrueFee(data.callinLicence);
        if (data.monitorLicence) data.monitorLicence = utils.formatTrueFee(data.monitorLicence);
        //if (data.enterpriseLicence) data.enterpriseLicence = utils.formatTrueFee(data.enterpriseLicence);
        //if (data.calloutLicence){
        //    for(var key in data.calloutLicence){
        //        data.calloutLicence[key].price = utils.formatTrueFee(data.calloutLicence[key].price);
        //    }
        //}

        if (data.custFees) {
            data.custFees.forEach(function (item) {
                item.price = utils.formatTrueFee(item.price);
            });
        }

        if (data.intlFeeSet) {
            if (data.intlFeeSet.fees) {
                data.intlFeeSet.fees.forEach(function (item) {
                    item.price = utils.formatTrueFee(item.price);
                });
            }
            if (data.intlFeeSet.otherPrice) {
                data.intlFeeSet.otherPrice = utils.formatTrueFee(data.intlFeeSet.otherPrice);
            }
        }
    },
    getProductAndLicenceById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account_product).findOne(data, function (err, product) {
            if (!err) {

                handler._initProductFields(product, result);
                callback(result);

                //if(product.product == constants.product.cc){
                //    var query = {
                //        account:product.account,
                //        licenceType:constants.licenceType.outcall,
                //        status:constants.licenceStatus.use
                //    };
                //    mongo.db().collection(constants.DB.platform_licence).findOne(query,function(err,row){
                //        if(!err){
                //            if(row){
                //                product.licencePriceType = row.licencePriceType;
                //                product.calloutLicenceNum = row.num;
                //                product.calloutLicenceId = row._id;
                //            }else{
                //                //product.licencePriceType = "无";
                //                product.calloutLicenceNum = 0;
                //            }
                //            handler._initProductFields(product,result);
                //            callback(result);
                //        }else{
                //            logger.app.error(err.stack);
                //            callback(result);
                //        }
                //    });
                //}else{
                //    handler._initProductFields(product,result);
                //    callback(result);
                //}
            } else {
                logger.app.error("get product data from db error!", err);
                callback(result);
            }
        });
    },
    getAccountProductById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account_product).findOne(data, function (err, product) {
            if (!err) {
                if(product){
                    handler._initProductFields(product, result);
                }else{
                    result.success=false;
                    callback(result);
                }


                callback(result);
            } else {
                logger.app.error("get product data from db error!", err);
                callback(result);
            }
        });
    },
    updateAccountProduct: function (data, session, callback) {
        var result = {success: false};
        if(!data.wechatAppId){
            data.wechatAppId=null;
        }
        var id = data._id;
        delete data._id;

        if (data.dialFee) {
            for (var i in data.dialFee) {
                data.dialFee[i] = utils.formatFee(data.dialFee[i]);
            }
        }
        if (data.fee) {
            for (var i in data.fee) {
                data.fee[i] = utils.formatFee(data.fee[i]);
            }
        }
        if (data.transferFee) {
            for (var i in data.transferFee) {
                data.transferFee[i] = utils.formatFee(data.transferFee[i]);
            }
        }
        //新加国际长途
        //if (data.internationalFee) {
        //    for (var i in data.internationalFee) {
        //        data.internationalFee[i] = utils.formatFee(data.internationalFee[i]);
        //    }
        //}
        if(data.intlFeeSet && data.intlFeeSet.isOpenIntl){
            if(data.intlFeeSet.fees && data.intlFeeSet.fees.length > 0){
                data.intlFeeSet.fees.forEach(function(item) {
                    item.price = utils.formatFee(item.price);
                });
            }

            if(data.intlFeeSet.otherPrice){
                data.intlFeeSet.otherPrice = utils.formatFee(data.intlFeeSet.otherPrice);
            }

            //兼容老数据
            if(data.internationalStrategy){
                data.internationalFee = null;
                data.internationalStrategy = null;
            }
        }

        if (data.smsFee) data.smsFee = utils.formatFee(data.smsFee);
        if (data.voiceFee) data.voiceFee = utils.formatFee(data.voiceFee);

        if (data.minConsume) data.minConsume = utils.formatFee(parseFloat(data.minConsume));
        if (data.concurrentPrice) data.concurrentPrice = utils.formatFee(data.concurrentPrice);
        if (data.discount) data.discount = utils.formatFee(data.discount);
        if (data.smsDiscount) data.smsDiscount = utils.formatFee(data.smsDiscount);
        if (data.serviceLicence) data.serviceLicence = utils.formatFee(data.serviceLicence);
        if (data.callinLicence) data.callinLicence = utils.formatFee(data.callinLicence);
        if (data.calloutLicence) data.calloutLicence = utils.formatFee(data.calloutLicence);
        if (data.monitorLicence) data.monitorLicence = utils.formatFee(data.monitorLicence);
        if (data.calloutMinute) data.calloutMinute = parseInt(data.calloutMinute, 10);
        //if (data.standardLicence) data.standardLicence = utils.formatFee(data.standardLicence);
        if (data.giveMinute) data.giveMinute = parseInt(data.giveMinute, 10);
        //if (data.calloutLicence){
        //    for(var key in data.calloutLicence){
        //        data.calloutLicence[key].price = utils.formatFee(data.calloutLicence[key].price);
        //    }
        //}

        if (id.indexOf("cc") != -1) {
            if (data.effectYear && data.effectMonth) {
                data.effectDate = data.effectYear + "-" + data.effectMonth;
            } else {
                data.effectYear = "";
                data.effectMonth = "";
                data.effectDate = "";
            }
        }

        delete data.licencePriceType;
        delete data.calloutLicenceId;
        if (id.indexOf("cc") != -1 && data.calloutLicenceStrategy == 'licencePrice') {  //neet update minConsume
            var calloutLicence = data.calloutLicence || 0;
            var calloutMinute = data.calloutMinute || 0;
            var account = id.split("_")[0];
            mongo.db().collection(constants.DB.platform_licence).find({account: account, licenceType: "outcall"}).toArray(function (err, dbLicense) {
                if (!err) {
                    dbLicense=dbLicense||{};
                    var sumNum = 0;
                    for (var i = 0; i < dbLicense.length; i++) {
                        sumNum += parseInt(dbLicense[i].num);
                    }
                    data.minConsume = sumNum * calloutLicence;
                    data.giveMinute = sumNum * calloutMinute;
                    mongo.db().collection(constants.DB.platform_account_product).update({_id: id}, {$set: data}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("update product data to db error!", err);
                            callback(result);
                        }
                    });

                } else {
                    logger.app.error("update product data to db error!", err);
                    callback(result);
                }
            });

        } else if (id.indexOf("ll") != -1) {
            delete data.dialFeeStrategy;
            delete data.dialFee;
            delete data.transferFee;
            delete data.internationalFee;
            delete data.operatorsResource;
            mongo.db().collection(constants.DB.platform_account_product).update({_id: id}, {$set: data}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error("update product data to db error!", err);
                    callback(result);
                }
            });
        } else {
            mongo.db().collection(constants.DB.platform_account_product).update({_id: id}, {$set: data}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error("update product data to db error!", err);
                    callback(result);
                }
            });
        }

        //var updateProduct = function(id,data){

        //};
        //if(data.calloutLicenceId && data.calloutLicenceId!=""){
        //    var licenceId = data.calloutLicenceId;
        //    mongo.db().collection(constants.DB.platform_licence).findOne({_id: licenceId},function(err,row){
        //        if(!err){
        //            if(row.status!=constants.licenceStatus.try  && data.licencePriceType!=row.licencePriceType){
        //                var set = {
        //                    licencePriceTypeNew :data.licencePriceType
        //                };
        //                mongo.db().collection(constants.DB.platform_licence).update({_id: licenceId}, {$set: set}, function (err) {
        //                    if (!err) {
        //                        var log={
        //                            _id:utils.UUID.generateUuid(),
        //                            licence:licenceId,
        //                            licenceType:data.licenceType,
        //                            account:data.account,
        //                            num:0,//增加或减少的数量
        //                            licencePriceType:data.licencePriceType,//更改后的套餐
        //                            type:'priceType',//操作类型
        //                            createTime:utils.DateTime.getCurrentDateTime(),
        //                            operator:session.account.billLoginName||session.account.name
        //                        };
        //                        mongo.db().collection(constants.DB.log_adjust_licence).insert(log);
        //                        updateProduct(id,data);
        //                    } else {
        //                        logger.app.error("update licence data to db error!", err);
        //                        callback(result);
        //                    }
        //                });
        //            }else{
        //                updateProduct(id,data);
        //            }
        //        }else{
        //            logger.app.error("db find error!", err);
        //            callback(result);
        //        }
        //    });
        //}else{
        //    updateProduct(id,data);
        //}
    },
    updateAccountCustFeeProduct : function(data,session,callback){
        var result = {success:false};
        var custFees = data.custFees;

        if(!custFees || custFees.length == 0){
            result.message = '非法参数!!';
            callback(result);
            return;
        }
        //处理数字
        custFees.forEach(function(item){
            item.price = utils.formatFee(item.price);
        });

        var productId = data.productId;

        _impl.getProduct(productId,function(err,product) {
            if (err) {
                result.message = "查询产品失败";
                callback(result);
                return;
            }

            var updateCustFees = [];
            var addCustFees = [];
            var openedCustFeeIds = [];
            var deleteCustFeeIds = openedCustFeeIds;

            var custFees = product.custFees;
            if (custFees) {
                custFees.forEach(function (item) {
                    if(item){
                        openedCustFeeIds.push(item.id);
                    }
                });
            }

            data.custFees.forEach(function (item) {
                if (item.id) {
                    var itemIndex = openedCustFeeIds.indexOf(item.id);
                    if (itemIndex > -1) {
                        openedCustFeeIds.splice(itemIndex, 1);
                        updateCustFees.push(item);
                    }
                } else {
                    item.state = 'stop';
                    item.id = utils.UUID.generateUuid();
                    item.createTime = utils.DateTime.getCurrentDateTime();

                    addCustFees.push(item);
                }
            });

            var updateCustFeeLoop = function (cb) {
                var custFee = updateCustFees.pop();
                if(!custFee){
                    cb();
                    return;
                }
                _impl.updateCustFee(productId,custFee, function (err) {
                    if (err) {
                        result.message = "更新产品失败";
                        callback(result);
                        return;
                    }
                    if(custFee){
                        updateCustFeeLoop(cb);
                    }else{
                        cb();
                    }
                })
            };

            var addCustFeeLoop = function (cb) {
                var custFee = addCustFees.pop();
                if(!custFee){
                    cb();
                    return;
                }
                _impl.addCustFee(productId,custFee, function (err) {
                    if (err) {
                        result.message = "更新产品失败";
                        callback(result);
                        return;
                    }
                    if(custFee){
                        addCustFeeLoop(cb);
                    }else{
                        cb();
                    }
                })
            };

            //更新 添加 删除 最后更新费率
            updateCustFeeLoop(function(){
                addCustFeeLoop(function(){
                    _impl.deleteCustFees(productId,deleteCustFeeIds,function(err){
                        if (err) {
                            result.message = "更新产品失败";
                            callback(result);
                            return;
                        }
                        _impl.updateAccountProduct({_id:productId},{$set:{poundage:data.poundage}},function(err){
                            if (err) {
                                result.message = "更新产品失败";
                                callback(result);
                                return;
                            }
                            result.success = true;
                            callback(result);
                        });
                    });
                });
            });
        });
    },
    getSystemUserInfoById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.system_user).findOne(data, function (err, dbUser) {
            if (!err && dbUser) {
                result.success = true;
                result.data = dbUser;
                callback(result);
            } else {
                result.message = "404";
                callback(result);
            }
        });
    },
    getAccountProductInfoById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account_product).findOne(data, function (err, Account) {
            if (!err && Account) {
                result.success = true;
                result.data = Account;
                callback(result);
            } else {
                result.message = "404";
                callback(result);
            }
        });
    },
    getAccountInfoById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account).findOne(data, function (err, dbAccount) {
            if (!err && dbAccount) {
                result.success = true;
                result.data = dbAccount;
                callback(result);
            } else {
                result.message = "404";
                callback(result);
            }
        });
    },
    getFinanceAccountInfoById: function (data, session, callback) {
        var result = { success: false };
        // mongo.db().collection(constants.DB.platform_account_type).findOne({name: '财务账户'}, function (err, typeInfo) {
        //     if (err) {
        //         logger.app.error(err);
        //         callback(result);
        //     } else {
        //         data.accountType = typeInfo._id.toString();
        //         mongo.db().collection(constants.DB.platform_account).findOne(data, function (err, dbAccount) {
        //             if (err) {
        //                 logger.app.error(err);
        //                 callback(result);
        //             } else {
        //                 result.success = true;
        //                 result.data = dbAccount;
        //                 callback(result);
        //             }
        //         });
        //     }
        // });
        data.accountType = 'finance';
        mongo.db().collection(constants.DB.platform_account).findOne(data, function (err, dbAccount) {
            if (err) {
                logger.app.error(err);
                callback(result);
            } else {
                result.success = true;
                result.data = dbAccount;
                callback(result);
            }
        });
    },
    queryAccount : function(data,session,callback){
        var limit = data.limit || 10;
        var page = data.page || 1;
        var arr;
        if(data.businessTag && data.businessTag.indexOf("NULL") < 0){
            arr=new Array();
            for(var i=0;i<data.businessTag.length;i++){
                var businessTagStr={
                    businessTag:data.businessTag[i]
                }
                arr.push(businessTagStr)
            }
        }

        var condition = {
            _id :  data._id,
            name : data.name ? new RegExp(data.name) : null,//模糊查询
            companyName : data.companyName ? new RegExp(data.companyName) : null,//模糊查询
            status : data.status,
            createMethod : data.createMethod,
            createUser : data.createUser,
            customerCare : data.customerCare, //|| (session.user.identity === 'customerCare' ? session.user._id : null),
            consultant: data.consultant ,//|| (session.user.identity === 'consultant' ? session.user._id : null),
            //businessTag : data.businessTag,
            $and: data.businessTag ? arr : null,
            balance : function (){
                //余额低于多少
                return data.balanceCeiling != null ? {$lt:utils.formatFee(data.balanceCeiling)} : null;
            }(),
            createTime : function(){
                //创建日期区间
                if(!data.createTimeBegin && !data.createTimeEnd){
                    return null;
                }
                return utils.collect(
                    data.createTimeBegin ? {$gte : data.createTimeBegin + " 00:00:00"} : null ,
                    data.createTimeEnd ? {$lte : data.createTimeEnd + " 23:59:59"} : null
                );
            }()
        }

        if(data.industry){
            condition.$or = [{industry:data.industry},{subIndustry:data.industry}];
        }

        if (data.accountType) {
            condition.accountType = data.accountType;
        }

        if (data.financeAccount) {
            condition.financeAccount = data.financeAccount;
        }

        utils.removeEmptyProperty(condition);

        if(data.businessTag && data.businessTag.indexOf("NULL") >= 0){
            delete condition.$and;
            condition.businessTag = null;
        }

        var groupFinances = [];
        // var accountTypes = {};
        Then()
            //集团财务初始化
            .then(function(cont){
                SysUser.getAllGroupFinance(function(err,groupFinaces){
                    groupFinances = groupFinaces || [];
                    cont();
                });
            })
            //如果是代理查询
            .then(function(cont){
                if(session.user.identity != constants.systemUserIndentity.proxy) {
                    return cont();
                }

                //查询他的手下代理创建的账户
                if(!condition.createUser) {
                    return SysUser.getAllUserLowerIgnoreStatus(session.user._id,function(err,userIds){
                        condition.createUser = {$in : userIds};
                        cont(err);
                    });
                }
                cont();
            })
            //加入集团财务
            .then(function(cont){
                if(!condition.createUser){
                    return cont();
                }

                var userIds = [];
                if(typeof(condition.createUser) == 'string'){
                    userIds = [condition.createUser];
                }else{
                    userIds = condition.createUser.$in;
                }

                //如果要查询的创建者(们)有创建过集团账户,
                // 则需要把集团账户所属的财务加到创建者查询条件中.
                var matchFinanceIds = [];
                groupFinances.forEach(function (finance) {
                    userIds.forEach(function(userId){
                        if (userId == finance.realProxy) {
                            matchFinanceIds.push(finance._id);
                        }
                    });
                });

                condition.createUser = {$in : userIds.concat(matchFinanceIds)};
                cont();
            })
            // // 查询账户类型
            // .then(function (cont) {
            //     mongo.db().collection(constants.DB.platform_account_type).find({}).toArray(function (err, types) {
            //        if (err) {
            //            cont(err);
            //        } else {
            //            types.forEach(function (type) {
            //                accountTypes[type._id.toString()] = type.name;
            //            });
            //            cont();
            //        }
            //     });
            // })
            //最后查询
            .parallel(
                [
                    //数据
                    function(cont){
                        Then()
                            .then(function(cont_){
                                Account.findByPage(condition,limit,page,cont_);
                            })
                            .then(function(cont_,records){
                                //加上集团财务
                                records = records || [];
                                groupFinances.forEach(function (finance) {
                                    records.forEach(function (account) {
                                        if (finance._id == account.createUser) {
                                            account.realProxy = finance.realProxy;
                                        }
                                    });
                                });

                                cont_(null,records);
                            })
                            .then(function(cont_,records){
                                //查询累计充值 累计消费
                                var accountIds = [];
                                records.forEach(function(item){
                                    accountIds.push(item._id);
                                });

                                AccountPayConsume.findSome(accountIds,function(err,accountPayConsumes){
                                    if (err){
                                        return cont(null,records);
                                    }
                                    records.forEach(function(account){
                                       accountPayConsumes.forEach(function(accountPayConsume){
                                           if(account._id == accountPayConsume._id){
                                               account.totalPay = accountPayConsume.totalPay;
                                               account.totalConsume = accountPayConsume.totalConsume;
                                           }
                                        });
                                        // account.accountType = accountTypes[account.accountType] || '';
                                    });

                                    cont(null,records);
                                })
                            })
                    },
                    //总数
                    function(cont){
                        Account.count(condition,cont);
                    },
                    //应付款,预付款 统计
                    function(cont){
                        Account.find(condition,function(err,records){
                            records = records || [];

                            var due=0,prepay=0;//应付款,预付款
                            records.forEach(function(item){
                                var balance = item.balance;
                                if(balance > 0){
                                    prepay += balance || 0;
                                }else{
                                    due += Math.abs(balance) || 0;
                                }
                            });

                            cont(err,{prepay:prepay,due:due});
                        });
                    }
                ])
            .then(function(cont,res){
                var result = {
                    success : true,
                    count : res[1],
                    list : res[0],
                    prepay : res[2].prepay,
                    due : res[2].due,
                };
                return callback(result);
            })
            .fail(function(cont,err){
                var result = {
                    success : false,
                    message : "查询账户信息异常！",
                }

                logger.app.warn("query account error", err);
                callback(result);
            });
    },
    _syncCCAcs: function (aid, data, session, callback) {
        var result = {success: false};
        var name = data.name;
        var url = config.ccServerUrl + "service?action=modifyAccountName&data=" + JSON.stringify({
                "account": aid,
                "name": name
            });
        url = encodeURI(url);
        httpProvider.sendGet(url, function (err, result2) {
            if (err) {
                logger.app.warn('_syncCCAcs failed!', err);
                result.message = "调用接口修改数据异常，请重试！";
                callback(result);
            } else {
                var res = JSON.parse(result2);
                if (res.success) {
                    mongo.db().collection(constants.DB.platform_account_product).findOne({_id: aid + "_" + constants.product.cc}, function (err, proCC) {
                        if (!err) {
                            var pbxInfo = proCC.pbx;
                            for (var i = 0; i < pbxInfo.length; i++) {
                                pbxInfo[i].DisplayName = name;
                            }
                            mongo.db().collection(constants.DB.platform_account_product).update({_id: aid + "_cc"}, {
                                $set: {
                                    name: name,
                                    pbx: pbxInfo
                                }
                            }, {w: 1}, function (err) {
                                if (!err) {
                                    result.success = true;
                                    callback(result);
                                } else {
                                    logger.app.error("update account product name to db error!", err);
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error("find product info error!", err);
                            result.message = "数据库查询数据异常";
                            callback(result);
                        }
                    });
                } else {
                    logger.app.warn(result2);
                    callback(result);
                }
            }
        });
    },

    /**
     * 计费更改cc账户名
     * http://localhost:4000/service?action=modifyAccountName&data={“account”:”N00000000143”,”name”:”abc”}
     * 计费更改zj账户名
     * * SyncAcsHandler.jsupdateAccount
     * @param data
     * @param session
     * @param callback
     */
    updateAccountInfo: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
//        var ary = [];
//        ary.push({"name": data.name});
//        ary.push({"linkManEmail": data.linkManEmail});
//        var query = {$or: ary, _id: {$ne: id}};
        var query = {name: data.name, _id: {$ne: id}};

        data.operator = session.user._id ? session.user._id : "system";
        mongo.db().collection(constants.DB.platform_account).findOne(query, function (err, oneAccount) {
            if (!err) {
                if (!oneAccount) {
                    if (!data.createUser) { //无所属人则默认设为当前用户
                        data.createMethod = constants.accountCreateMethod.bill;
                        data.createUser = session.user._id ? session.user._id : "system";
                    }
                    mongo.db().collection(constants.DB.system_user).findOne({_id: data.createUser}, function (err, createUser) {
                        if (!err) {
                            if (!createUser) {
                                result.message = "选择所属人错误！";
                                callback(result);
                                return;
                            }

                            if(data.customerCare){
                                if((createUser.proxyType == constants.proxyType.channel || createUser.proxyType == constants.proxyType.zj)){
                                    data.isBonus2customerCare = false; //渠道,总机代理 创建的账户客户经理没有提成.
                                }else{
                                    data.isBonus2customerCare = true;
                                }
                            }

                            if (data.createMethod == constants.accountCreateMethod.proxy && createUser.identity != constants.systemUserIndentity.proxy) {
                                result.message = "账户来源为代理创建时，所属人身份必须是代理！";
                                callback(result);
                            } /*else if (data.createMethod == constants.accountCreateMethod.bill && createUser.identity == constants.systemUserIndentity.proxy) {
                                result.message = "账户来源为计费创建时，所属人身份不能是代理！";
                                callback(result);
                            }*/ else {
                                //判断用户名是否改变
                                mongo.db().collection(constants.DB.platform_account).findOne({_id: id}, function (err, accountDB) {
                                    if (!err) {
                                        if (accountDB.createUser !== data.createUser){ //代理或者创建人改变了
                                            var eventData = {
                                                account : accountDB._id,
                                                newUser : data.createUser,
                                                oldUser : accountDB.createUser
                                            };
                                            appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_CHANGE_PXOXY,eventData);
                                        }
                                        if (accountDB.name == data.name) {//用户名没有改变
                                            mongo.db().collection(constants.DB.platform_account).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                                                if (!err) {
                                                    result.success = true;
                                                    callback(result);
                                                } else {
                                                    logger.app.error("update account to db error!", err);
                                                    result.message = "数据库修改数据异常";
                                                    callback(result);
                                                }
                                            });
                                        } else {//用户名改变
                                            //根据账户开通的产品调用不同接口，两个产品都开通需要调两个接口
                                            mongo.db().collection(constants.DB.platform_account_product).find({account: id}).toArray(function (err, accProduct) {
                                                if (!err) {
                                                    accProduct = accProduct || [];
                                                    var index = 0;
                                                    var _updateAccountName = function () {
                                                        var _product = accProduct[index];
                                                        if (_product) {
                                                            if (_product.product == constants.product.cc) {//开通了产品cc
                                                                handler._syncCCAcs(id, data, session, function (rep) {
                                                                    if (rep.success) {
                                                                        index++;
                                                                        _updateAccountName();
                                                                    } else {
                                                                        callback(rep);
                                                                    }
                                                                });
                                                            } else if (_product.product == constants.product.zj) {//开通总机
                                                                var info = {
                                                                    account: id,
                                                                    pbx: _product.pbx[0].pbx,
                                                                    displayName: data.companyName,
                                                                    name: data.name
                                                                };
                                                                syncAcs.updateAccount(info, function (isSuccess) {
                                                                    if (isSuccess) {
                                                                        index++;
                                                                        _updateAccountName();
                                                                    } else {
                                                                        logger.app.warn('syncZjAcs failed!');
                                                                        result.message = "调用接口修改数据异常，请重试！";
                                                                        callback(result);
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            mongo.db().collection(constants.DB.platform_account).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                                                                if (!err) {
                                                                    result.success = true;
                                                                    callback(result);
                                                                } else {
                                                                    logger.app.error("update account to db error!", err);
                                                                    result.message = "数据库修改数据异常";
                                                                    callback(result);
                                                                }
                                                            });
                                                        }
                                                    }
                                                    _updateAccountName();
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
                            }
                        } else {
                            logger.app.error("update account to db error!", err);
                            result.message = "数据库修改数据异常";
                            callback(result);
                        }
                    });
                } else {
//                    result.message = "账户名【" + data.name + "】或邮箱【" + data.linkManEmail + "】已经存在！";
                    result.message = "账户名【" + data.name + "】已经存在！";
                    callback(result);
                }
            } else {
                logger.app.warn("updateAccount check name err!", err);
                result.message = "检查用户名异常！";
                callback(result);
            }
        });
    },
    /**
     *
     * 获取账户信息，费用信息（关联在账户上），服务号信息
     * @param data
     * @param session
     * @param callback
     */
    getAccountSetInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account).findOne(data, function (err, dbAccount) {
            if (!err) {
                if (dbAccount) {
                    if (dbAccount.balance) dbAccount.balance = utils.formatTrueFee(dbAccount.balance);
                    if (dbAccount.overdraw) dbAccount.overdraw = utils.formatTrueFee(dbAccount.overdraw);
                    var data = {
                        account: dbAccount
                    };
                    mongo.db().collection(constants.DB.platform_serviceNum).find({account: dbAccount._id}).toArray(function (err, serviceNums) {
                        if (!err) {
                            data.serviceNum = serviceNums || [];
                            mongo.db().collection(constants.DB.platform_num400).find({account: dbAccount._id}).toArray(function (err, num400s) {
                                if (!err) {
                                    data.num400 = num400s || [];
                                    // 查询关联的财务账户
                                    financeAccountDBProxy.queryFinanceAccountByNormalAccountId(dbAccount._id, function (err, financeAccount) {
                                        if (err) {
                                            logger.app.error("获取账户关联财务账户失败", err);
                                            result.message = "获取账户关联财务账户失败！";
                                            callback(result);
                                        } else {
                                            data.account.financeAccountName = financeAccount ? financeAccount.linkManName : '';
                                            result.success = true;
                                            result.data = data;
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.error("getAccountSetInfo:get num400 info from db error! ", err);
                                    result.message = "获取账户400信息失败！";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error("getAccountSetInfo:get serviceNum info from db error! ", err);
                            result.message = "获取账户服务号信息失败！";
                            callback(result);
                        }
                    });
                } else {
                    logger.app.error("getAccountSetInfo:get account info from db error! ", err);
                    result.message = "获取账户信息失败！";
                    callback(result);
                }
            } else {
                logger.app.error("getAccountSetInfo:get account info from db error! ", err);
                result.message = "获取账户信息失败！";
                callback(result);
            }
        });
    },
    /**
     * 获取账户的产品信息
     * @param data
     * @param session
     * @param callback
     */
    getAccountProductInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account_product).find(data).toArray(function (err, products) {
            if (!err) {
                result.success = true;
                result.data = products || [];
                for (var i = 0; i < products.length; i++) {
                    var data = products[i];
                    if (data.dialFee) {
                        for (var key in data.dialFee) {
                            data.dialFee[key] = utils.formatTrueFee(data.dialFee[key]);
                        }
                    }
                    if (data.fee) {
                        for (var key in data.fee) {
                            data.fee[key] = utils.formatTrueFee(data.fee[key]);
                        }
                    }
                    if (data.transferFee) {
                        for (var key in data.transferFee) {
                            data.transferFee[key] = utils.formatTrueFee(data.transferFee[key]);
                        }
                    }
                    //新加国际长途
                    if (data.internationalFee) {
                        for (var i in data.internationalFee) {
                            data.internationalFee[i] = utils.formatTrueFee(data.internationalFee[i]);
                        }
                    }
                    if (data.minConsume) data.minConsume = utils.formatTrueFee(data.minConsume);
                    if (data.discount) data.discount = utils.formatTrueFee(data.discount);
                    if (data.smsDiscount) data.smsDiscount = utils.formatTrueFee(data.smsDiscount);
                    if (data.callinLicence) data.callinLicence = utils.formatTrueFee(data.callinLicence);
                    if (data.calloutLicence) data.calloutLicence = utils.formatTrueFee(data.calloutLicence);
                }

                //过滤zj pbx
                var identity=session.user.identity;
                var numScope=session.user.numScope;
                var uid=session.user._id;
                if(identity==constants.systemUserIndentity.proxy){
                    var q={$in:[uid,null,'']};
                    mongo.db().collection(constants.DB.platform_board).find({owner:q}).toArray(function (err, boards) {
                        if(!err){
                            boards=boards||[];
                            var _boards=[];
                            if(numScope=='me'){
                                for (var i = 0; i < boards.length; i++) {
                                    var obj = boards[i];
                                    if(obj.owner==uid){
                                        _boards.push(obj._id);
                                    }
                                }
                            }else{
                                for (var i = 0; i < boards.length; i++) {
                                    var obj = boards[i];
                                    _boards.push(obj._id);
                                }
                            }
                            result.zjBoards=_boards||[];
                            callback(result);
                        }else{
                            result.success=false;
                            logger.app.error(err);
                            callback(result);
                        }
                    })
                }else{
                    //var q={$in:[null,'']};
                    mongo.db().collection(constants.DB.platform_board).find({}).toArray(function (err, boards) {
                        if(!err){
                            boards=boards||[];
                            var _boards=[];
                            for (var i = 0; i < boards.length; i++) {
                                var obj = boards[i];
                                _boards.push(obj._id);
                            }
                            result.zjBoards=_boards||[];
                            callback(result);
                        }else{
                            result.success=false;
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }

            } else {
                logger.app.error("getAccountProductInfo:get product info from db error! ", err);
                result.message = "获取产品信息异常！";
                callback(result);
            }
        });
    },
    /**
     * 获取账户的业务标记信息
     * @param data
     * @param session
     * @param callback
     */
    getAccountBusinessTagInfo : function(data, session, callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account).findOne(data,function(err ,dbAccount){
            if(!err && dbAccount){
                var tags = dbAccount.businessTag || [];
                result.success = true;
                result.tags = tags;
                callback(result);
            } else {
                logger.app.error("getAccountBusinessTagInfo businessTag info error!",err || new Error(""));
                result.message = "获取账户的业务标记信息失败";
                callback(result);
            }
        });
    },
    updateAccountBusinessTag : function(data, session , callback){
        var result = {success: false};
        var setData = {
            businessTag : data.businessTag.tag || []
        };
        mongo.db().collection(constants.DB.platform_account).update({_id: data.account},{$set:setData},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.error("updateAccountBusinessTag businessTag info error!",err || new Error(""));
                result.message = "更新账户的业务标记信息失败";
                callback(result);
            }
        });
    },
    updateAccountSetCallSum : function(data, session , callback){
        var result = {success: false};
        var setData = {
            callSum : parseInt(data.callSum)
           // freeCallSum:parseInt(data.callSum)
        };
        mongo.db().collection(constants.DB.platform_account).update({_id: data.account},{$set:setData},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.error("updateAccountSetCallSum callSum info error!",err || new Error(""));
                result.message = "设置账号拨号次数失败";
                callback(result);
            }
        });
    },
    queryAccountSetLog: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        if (data.time) {
            data.time = new RegExp(data.time);
        }

        mongo.db().collection(constants.DB.bill_operate_log).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_operate_log).find(data, {
                    sort: {time: -1},
                    limit: limit,
                    skip: skip
                }).toArray(function (err, logs) {
                    if (!err) {
                        logs = logs || [];
                        result.list = logs;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryAccountSetLog  error", err);
                        result.message = "查询账户操作记录信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryAccountSetLog count error", err);
                result.message = "查询账户操作记录信息异常！";
                callback(result);
            }
        });

    },
    savaOverdrawConfig: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.overdraw = require('mongodb3').Long.fromNumber(utils.formatFee(data.overdraw));

        mongo.db().collection(constants.DB.platform_account).findOne({_id: id}, function (err, dbAccount) {
            if (!err && dbAccount) {
                if (!dbAccount.overdraw || (dbAccount.overdraw && dbAccount.overdraw != data.overdraw)) {
                    mongo.db().collection(constants.DB.platform_account).update({_id: id}, {$set: data}, function (err) {
                        if (!err) {
                            var history = {
                                _id: utils.UUID.generateUuid(),
                                time: utils.DateTime.getCurrentDateTime(),
                                account: dbAccount._id,
                                user: session.user._id,
                                type: constants.operateLog.overdraw,
                                content: "账户透支由[" + (dbAccount.overdraw || 0) + "] 更改为 [" + data.overdraw + "]"
                            }
                            mongo.db().collection(constants.DB.bill_operate_log).insert(history);
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("savaOverdrawConfig error! ", err);
                            result.message = "保存透支失败！";
                            callback(result);
                        }
                    });
                } else {
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error("savaOverdrawConfig error! ", err);
                result.message = "保存透支失败！";
                callback(result);
            }
        });


        /*  mongo.db().collection(constants.DB.platform_account).findOne({_id: id}, function (err, dbAccount) {
         if (!err) {
         if (dbAccount && (dbAccount.outCallPrice != data.outCallPrice || dbAccount.payFlag != data.payFlag)) {
         mongo.db().collection(constants.DB.platform_account).update({_id: id}, {$set: data}, {w: 1}, function (err) {
         if (!err) {
         var history = {
         _id: utils.UUID.generateUuid(),
         time: utils.DateTime.getCurrentDateTime(),
         account: dbAccount._id,
         user: session.user._id,
         type: constants.operateLog.outCallPrice,
         content: ""
         }
         if (dbAccount.outCallPrice != data.outCallPrice) {
         history.content += "通话单价由【" + (dbAccount.outCallPrice || 0) + "】改为【" + data.outCallPrice + "】";
         }
         if (dbAccount.payFlag != data.payFlag) {
         history.content += " 禁用充值由【" + (dbAccount.payFlag || false) + "】改为【" + data.payFlag + "】";
         }
         mongo.db().collection(constants.DB.bill_operate_log).insert(history);
         result.success = true;
         callback(result);
         } else {
         logger.app.error("savaPriceConfig error! ", err);
         result.message = "保存配置失败！";
         callback(result);
         }
         });
         } else {
         result.success = true;
         callback(result);
         }
         } else {
         logger.app.error("savaPriceConfig: get db account error! ", err);
         result.message = "保存配置失败！";
         callback(result);
         }
         });*/
    },
    saveAlertConfig: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.dialAlert = data.dialAlert || 0;
        data.dialAlert = parseInt(data.dialAlert, 10);
        mongo.db().collection(constants.DB.platform_account).findOne({_id: id}, function (err, dbAccount) {
            if (!err) {
                if (dbAccount && (dbAccount.dialAlert != data.dialAlert)) {
                    mongo.db().collection(constants.DB.platform_account).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                        if (!err) {
                            var history = {
                                _id: utils.UUID.generateUuid(),
                                time: utils.DateTime.getCurrentDateTime(),
                                account: dbAccount._id,
                                user: session.user._id,
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
    /**
     * 增加cc默认角色
     * @param data
     * @param session
     * @param callback
     */
    addCCDefaultRole: function (data, session, callback) {
        var result = {success: false};
        var aid = data.account;
        var time = utils.DateTime.getCurrentDateTime();
        var agent = {
            _id: utils.UUID.generateUuid(),
            accountId: aid,
            display_name: '座席',
            memo: '系统生成',
            type: "system",
            identity: "agent",
            createTime: time,
            lastTime: time
        };
        var leader = {
            _id: utils.UUID.generateUuid(),
            accountId: aid,
            display_name: '组长',
            memo: '系统生成',
            type: "system",
            identity: "leader",
            createTime: time,
            lastTime: time
        };
        var manager = {
            _id: utils.UUID.generateUuid(),
            accountId: aid,
            display_name: '管理员',
            memo: '系统生成',
            type: "system",
            identity: "manager",
            createTime: time,
            lastTime: time
        };
        mongo.db("cc").collection(constants.DB.cc_app_default_role).find({}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                for (var i = 0; i < docs.length; i++) {
                    var obj = docs[i];
                    if (obj.type == 'agent') {
                        agent.limits = obj.limits;
                        agent.limits_in = obj.limits_in;
                        agent.limits_out = obj.limits_out;
                        agent.scope = obj.scope;
                        agent.scope_in = obj.scope_in;
                        agent.scope_out = obj.scope_out;
                    } else if (obj.type == 'leader') {
                        leader.limits = obj.limits;
                        leader.limits_in = obj.limits_in;
                        leader.limits_out = obj.limits_out;
                        leader.scope = obj.scope;
                        leader.scope_in = obj.scope_in;
                        leader.scope_out = obj.scope_out;
                    } else if (obj.type == 'manager') {
                        manager.limits = obj.limits;
                        manager.limits_in = obj.limits_in;
                        manager.limits_out = obj.limits_out;
                        manager.scope = obj.scope;
                        manager.scope_in = obj.scope_in;
                        manager.scope_out = obj.scope_out;
                    }
                }
                mongo.db("cc").collection(constants.DB.cc_app_role).insert(agent, function (err) {
                    if (err) {
                        logger.app.error('addDefaultRole error:' + err.stack);
                    }
                });
                mongo.db("cc").collection(constants.DB.cc_app_role).insert(leader, function (err) {
                    if (err) {
                        logger.app.error('addDefaultRole error:' + err.stack);
                    }
                });
                mongo.db("cc").collection(constants.DB.cc_app_role).insert(manager, function (err) {
                    if (err) {
                        logger.app.error('addDefaultRole error:' + err.stack);
                    }
                });

                result.success = true;
                callback(result);
            } else {
                logger.app.error(err.stack);
                result.message = 'default role query error!';
                callback(result);
            }
        });
    },
    updateCCConcurrent: function (data, session, callback) {
        var result = {success: false};
        var time = utils.DateTime.getCurrentDateTime();

        Then()
            .then(function(cont) {
                AccountProduct.update({_id: data._id}, {$set: {agentCallerIDNumSame: data.agentCallerIDNumSame,maxInMultiple: data.maxInMultiple}}, cont);
            })
            .then(function(cont){
                mongo.db().collection(constants.DB.platform_account_product).findOne({_id: data._id}, function (err, product) {
                    if (!err && product) {
                        var pbxs = product.pbx || [];
                        var set = {};
                        for (var i = 0; i < pbxs.length; i++) {
                            var obj = pbxs[i];
                            if (obj.PBX == data.pbx) {
                                set = obj;
                                break;
                            }
                        }

                        set.maxInbound = data.maxInbound;
                        set.maxOutbound = data.maxOutbound;
                        set.maxIn = data.maxIn;
                        mongo.db().collection(constants.DB.platform_account_product).update({
                            _id: data._id,
                            'pbx.PBX': data.pbx
                        }, {$set: {'pbx.$': set}}, function (err) {
                            if (!err) {
                                var aid = product.account;
                                serviceHandler.notifyAssUpdateLicense(aid, data.pbx, function (err, res) {
                                    if (!err && res.Succeed) {
                                        result.success = true;
                                    } else {
                                        result.message = "数据修改成功，同步ass失败，请再试！";
                                    }
                                    return callback(result);
                                });
                            } else {
                                logger.app.error(err.stack);
                                result.message = 'updateCCConcurrent error!';
                                return callback(result);
                            }
                        });
                    } else {
                        logger.app.error(err.stack);
                        result.message = 'updateCCConcurrent error!';
                        return callback(result);
                    }
                });
            })
            .fail(function(cont,err){
                logger.app.error(err.stack);
                result.message = 'updateCCConcurrent error!';
                return callback(result);
            });

    },
    stopAccount2: function (data, session, callback) {
        var result = {success: false};
        var set = {
            status: constants.accountStatus.stop,
            stopReason: data.stopReason
        }
        mongo.db().collection(constants.DB.platform_account).update({_id: data._id}, {$set: set}, function (err) {
            if (!err) {
                data.account = data._id;
                if(data.currSatus && data.currSatus == 'normal'){
                    appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_TURN_STOP,data);
                }
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err.stack);
                result.message = 'stopAccount error!';
                callback(result);
            }
        });
    },
    /**
     * 账户停用
     *
     * @param data
     * @param session
     * @param callback
     * @returns {*}
     */
    stopAccount: function(data,session,callback) {
        var accountId = data._id;
        var stopReason = data.stopReason;

        if(!accountId){
            result.message = '非法的参数';
            return callback(result);
        }

        Then(function(cont){
            Account.get(accountId,cont);
        })
            .then(function(cont,account){
                if(!account){
                    return callback({
                        success : false,
                        message : '未找到账户',
                    })
                }
                Account.update({_id : accountId},{$set:{status : constants.accountStatus.stop ,stopTime:utils.DateTime.getCurrentDateTime() ,stopReason : stopReason, statusBeforeStop : account.status}},function(err){
                    if(err){
                        return cont(err);
                    }
                    if(account.status == constants.accountStatus.normal){
                        appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_TURN_STOP,{account : accountId , currSatus : account.status});//报表加流失
                    }

                    cont();
                });
            })
            .then(function(cont){
                return callback({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.warn("stop account error", err);
                return callback({
                    success : false,
                    message : "停用账户异常！",
                });
            });
    },
    /**
     * 账户重开
     *
     * @param data
     * @param session
     * @param callback
     */
    reopenAccount: function(data,session,callback){
        var accountId = data.account;

        if(!accountId){
            result.message = '非法的参数';
            return callback(result);
        }

        Then(function(cont){
            Account.get(accountId,cont);
        })
            .then(function(cont,account){
                if(!account){
                    return callback({
                        success : false,
                        message : '未找到账户',
                    })
                }

                if(!account.statusBeforeStop){
                    return callback({
                        success : false,
                        message : '重开失败,请联系管理员',
                    })
                }

                Account.update({_id : accountId},{$set:{status : account.statusBeforeStop , statusBeforeStop : null, stopReason : null}},function(err){
                    if(err){
                        return cont(err);
                    }
                    if(account.statusBeforeStop == constants.accountStatus.normal){
                        appEvent.emitOperationReportEvent(appEvent.EventType.ACCOUNT_REOPEN,{account : accountId , operator : session.user._id});//报表减流失
                    }

                    cont();
                });
            })
            .then(function(cont){
                return callback({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.warn("reopen account error", err);
                return callback({
                    success : false,
                    message : "重开账户异常！",
                });
            });
    },
    setIsRecord: function (data, session, callback) {
        var result = {success: false};
        var set = {
            isRecord: data.isRecord.isRecord
        }
        mongo.db().collection(constants.DB.platform_account_product).update({_id: data._id}, {$set: set}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err.stack);
                result.message = 'setIsRecord error!';
                callback(result);
            }
        });
    },
    setProductMinConsume: function (data, session, callback) {
        var result = {success: false};
        var set = {
            minConsume: utils.formatFee(data.minConsume)
        };
        mongo.db().collection(constants.DB.platform_account_product).update({_id: data._id}, {$set: set}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err.stack);
                result.message = 'setProductMinConsume error!';
                callback(result);
            }
        });
    },
    setCCRecord: function (data, session, callback) {
        var result = {success: false};
        var set = {
            recordStore: data.recordStore,
            isRecording:data.isRecording.isRecord
        }
        var store = data.recordStore;
        var query = {_id: data._id};
        mongo.db().collection(constants.DB.platform_account_product).findOne(query, function (err, product) {
            if (!err && product) {
                var pbxs = product.pbx || [];
                var aid = product.account;
                var idx = 0;
                if (pbxs.length > 0) {
                    var syncACS = function () {
                        var pbx = pbxs[idx];
                        if (pbx) {
                            if (store == 90) {
                                store = -1;
                            }
                            serviceHandler.setCCRecord(store, aid, pbx.PBX, function (err, res) {
                                if (!err && res.Succeed) {
                                    mongo.db().collection(constants.DB.platform_account_product).update(query, {$set: set}, function (err) {
                                        if (!err) {
                                            idx++;
                                            syncACS();
                                        } else {
                                            logger.app.error(err.stack);
                                            result.message = 'setCCRecord update product error!';
                                            callback(result);
                                        }
                                    });
                                } else {
                                    result.message = "同步ass失败，请再试！";
                                    callback(result);
                                }
                            });
                        } else {
                            result.success = true;
                            callback(result);
                        }

                    };
                    syncACS();
                } else {
                    result.message = '账号错误，pbx为空';
                    callback(result)
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'setCCRecord error!';
                callback(result);
            }
        });
    },
    //设置录音权限
    setCCRecordRights : function(data,session,callback){
        var result = {success: false};
        var url2="";
        //url2="http://127.0.0.1:8888/service"
        url2=config.serviceUrl;
        var flag=data.isRecording.isRecord;
        if(flag=="true"){
            flag="false";
        }else{
            flag="true";
        }

        var url = url2 +'?Action=setCCRecordRights&account='+data._id.replace("_cc","")+'&isRecording='+flag;
        httpProvider.sendGet(url, function (err, res) {
            if (err) {
                result.message = "设置录音失败! " + err.message;
                return callback(result);
            }
            if(!res){
                result.message = "设置录音失败! no response";
                return callback(result);
            }
            var res = JSON.parse(res);
            if (res.Succeed) {
                result.success = true;
                return callback(result);
            }else if(res.result==500){
                result.message = "设置录音失败! 请检查pbx设置";
                return callback(result);
            }else {
                result.message = "设置录音失败! " + res.Message;
                return callback(result);
            }
        });
    },

    setCCCdrDay: function (data, session, callback) {
        var result = {success: false};
        var set = {
            cdrClearDuration: data.cdrClearDuration,
            cdrClearKeepDealing: data.cdrClearKeepDealing.cdrClearKeepDealing == 'true' ? true : false
        }
        mongo.db().collection(constants.DB.platform_account_product).update({_id: data._id}, {$set: set}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err.stack);
                result.message = 'setCCCdrDay error!';
                callback(result);
            }
        });
    },
    setSmsChannel: function (data, session, callback) {
        var result = {success: false};
        if (!data.smsChannel) {//短信通道设置为空
            //mongo.db('cc').collection(constants.DB.app_session).update({"account._id": data._id}, {$unset: {'account.smsChannel': 1}}, {multi: true}, function (err) {
            //});
            mongo.db().collection(constants.DB.platform_account_product).update({_id: data._id}, {$unset: {smsChannel: 1}}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err.stack);
                    result.message = 'setCCSmsChannel error!';
                    callback(result);
                }
            });
        } else {
            var set = {
                smsChannel: data.smsChannel
            }
            //mongo.db('cc').collection(constants.DB.app_session).update({"account._id": data._id}, {$set: {'account.smsChannel': data.smsChannel}}, {multi: true}, function (err) {
            //});
            mongo.db().collection(constants.DB.platform_account_product).update({_id: data._id}, {$set: set}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err.stack);
                    result.message = 'setCCSmsChannel error!';
                    callback(result);
                }
            });
        }
    },
    setZJLine: function(data, session, callback){
        var result = {success: false};
        var condition = {
            _id : data._id
        };


        _impl.updateAccountProduct(condition,{$set:{zjOutRoute:data.zjOutRoute,zjTransferRoute:data.zjTransferRoute}},function(err){
            if(err){
                logger.app.error(err.stack);
                result.message = 'setZJLine error!';
                callback(result);
                return;
            }
            _impl.notifyAssZJLineSet(data.account,data.pbx,data.zjOutRoute,data.zjTransferRoute,function(err){
                if(err){
                    logger.app.error(err.stack);
                    result.message = 'notify ass zj line set error!';
                    callback(result);
                    return;
                }
                result.success = true;
                callback(result);
            });
        })
    },
    setSmsPwd: function(data,session,callback){
        var condition = {
            _id : data._id,
        };

        Then()
            .then(function(cont){
                AccountProduct.update(condition,{$set:{templateSmsInterfacePassword:data.templateSmsInterfacePassword}},cont);
            })
            .then(function(cont){
                return callback({
                    success:true,
                })
            })
            .fail(function(cont,err){
                logger.app.error(err);

                return callback({
                    success:false,
                    message:'设置短信接口密码失败'
                })
            })
    },
    setSmsDispatch: function(data,session,callback){
        var condition = {
            _id : data._id,
        };

        Then()
            .then(function(cont){
                AccountProduct.update(condition,{$set:{sms_dispatch_url:data.sms_dispatch_url,open_sms_dispatch:data.open_sms_dispatch}},cont);
            })
            .then(function(cont){
                return callback({
                    success:true,
                })
            })
            .fail(function(cont,err){
                logger.app.error(err);

                return callback({
                    success:false,
                    message:'设置短信推送失败'
                })
            })
    },
    setZJMoreSn: function (data, session, callback) {
        var result = {success: false};
        var set = {
            isMoreSn: data.isMoreSn.isMoreSn == 'true' ? true : false
        }
        mongo.db().collection(constants.DB.platform_account_product).update({_id: data._id}, {$set: set}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err.stack);
                result.message = 'setZJMoreSn error!';
                callback(result);
            }
        });
    },
    updateSmsTemplete : function (data , session , callback){
        //console.dir("into updateSmsTemplete function-------------------------");
        //console.log("operatorStrategy111==="+data.operatorStrategy);
        var _id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        var content = data.content || "";
        var matchRs = content.match(/\{\d+\}/g) || [];
        data.vars = matchRs.length;
        var signContent = data.sign;
        var isYtxChannel = data.smsChannel && (data.smsChannel.indexOf("ytxyx") >= 0 || data.smsChannel.indexOf("ytx") >= 0);

        Then()
            .then(function(cont){
                mongo.db("cc").collection(constants.DB.app_sms_sign).findOne({_id: data.sign}, cont);
            })
            .then(function(cont,dbSign){
                if(dbSign){
                    signContent = dbSign.name;
                    return cont();
                }
                var signData = {account: data.account, name: data.sign};
                module.exports.addSmsSign(signData, session, function (signResult) {
                    if (signResult.success) {
                        data.sign = signResult.signInfo._id;
                        cont();
                    } else {
                        return callback({
                            success:false,
                            message:"保存短信签名失败！"
                        });
                    }
                });
            })
            .then(function(cont){
                mongo.db("cc").collection(constants.DB.app_sms_template).findOne({_id:_id},function(err,record){
                    if(err){
                        return cont(err);
                    }
                    //如果原模板使用云通讯通道
                    var isOldYtxChannel = record.smsChannel && (record.smsChannel.indexOf("ytxyx") >= 0 || record.smsChannel.indexOf("ytx") >= 0);
                    if(isOldYtxChannel){
                        return callback({
                            success: false,
                            message: "云通讯短信模板不能修改"
                        })
                    }
                    //如果要改成云通讯接口
                    if(isYtxChannel){
                        //云通讯短信模板备案
                        var params = utils.collect(data,{signContent:signContent,_id:_id});
                        return utils.BusinessUtil.addYTXSmsTemplate(params, cont);
                    }
                    cont();
                })
            })
            .then(function (cont){
                //如果选项为否，则清空分运行商报备通道
                if(!data.operatorStrategy){
                    var result = {success: false};
                    var datas={yd_smsChannel: 1,dx_smsChannel :1,lt_smsChannel:1};
                    //mongo.db('cc').collection(constants.DB.app_sms_template).update({_id: _id}, {$set: {yd_smsChannel: '222222'}}, function (err) {
                   mongo.db('cc').collection(constants.DB.app_sms_template).update({_id: _id},{$unset: datas}, function (err) {
                        if (!err) {
                            if(data.yd_smsChannel){
                               // data.remove(yd_smsChannel);
                                delete data.yd_smsChannel;
                            }
                            if(data.lt_smsChannel){
                               // data.remove(lt_smsChannel);
                                delete data.lt_smsChannel;

                            }
                            if(data.dx_smsChannel){
                                delete data.dx_smsChannel;
                               // data.remove(dx_smsChannel);
                            }
                            mongo.db("cc").collection(constants.DB.app_sms_template).update({_id:_id},{$set:data});
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err.stack);
                            result.message = 'updateSmsTemplete  unset xx_smsChannel error!';
                            callback(result);
                        }
                    });
                }else{
                    cont();
                }
            })
            .then(function(cont) {
                if (isYtxChannel) {
                    return callback({
                        success: true,
                    })
                }
                cont();
            })
            .then(function(cont){
               // console.log("operatorStrategy222==="+data.operatorStrategy);
                mongo.db("cc").collection(constants.DB.app_sms_template).update({_id:_id},{$set:data},cont);
            })
            .then(function(cont){
                return callback({
                    success:true
                })
            })
            .fail(function(cont,err){
                logger.app.error(err);
                return callback({
                    message:"更新短信模板失败"+err.message,
                    success:false,
                })
            });

    },
    updateSmsSign: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        mongo.db("cc").collection(constants.DB.app_sms_sign).findOne({
            _id: {$ne: id},
            subcode: data.subcode
        }, function (err, subcodeSmsSign) {
            if (!err) {
                if (subcodeSmsSign) {
                    result.message = '该subcode已经被使用!';
                    callback(result);
                } else {
                    var set = {
                        name: "【" + data.name + "】",
                        subcode: data.subcode
                    }
                    mongo.db("cc").collection(constants.DB.app_sms_sign).update({_id: id}, {$set: set}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err.stack);
                            result.message = 'updateSmsSign error!';
                            callback(result);
                        }
                    });
                }
            } else {
                logger.app.error(err);
                result.message = 'updateSmsSign error!';
                callback(result);
            }
        });
    },
    updateSmsEdit: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        mongo.db("cc").collection(constants.DB.app_sms_edit).findOne({
            _id: {$ne: id},
            name: data.name
        }, function (err, nameSmsEdit) {
            if (!err) {
                if (nameSmsEdit) {
                    result.message = '该模版名字已经被使用!';
                    callback(result);
                } else {
                    var set = {
                        name: "【" + data.name + "】",
                        content: data.content
                    }
                    mongo.db("cc").collection(constants.DB.app_sms_edit).update({_id: id}, {$set: set}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err.stack);
                            result.message = 'updateSmsEdit error!';
                            callback(result);
                        }
                    });
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'updateSmsEdit error!';
                callback(result);
            }
        });
    },

    deleteSmsTemplete: function (data, session, callback) {
        var result = {success: false};
        mongo.db("cc").collection(constants.DB.app_sms_template).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteSmsTemplete  error", err);
                result.message = "删除短信模板异常！";
                callback(result);
            }
        });
    },

    deleteSmsSign: function (data, session, callback) {
        var result = {success: false};
        mongo.db("cc").collection(constants.DB.app_sms_sign).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteSmsSign  error", err);
                result.message = "删除短信签名异常！";
                callback(result);
            }
        });

    },

    deleteSmsEdit: function (data, session, callback) {
        var result = {success: false};
        mongo.db("cc").collection(constants.DB.app_sms_edit).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteSmsEdit  error", err);
                result.message = "删除短信模版异常！";
                callback(result);
            }
        });
    },

    querySmsSignList: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query = data || {};
        if (query.name) {
            query.name = "【" + query.name + "】";
        }

        mongo.db("cc").collection(constants.DB.app_sms_sign).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("cc").collection(constants.DB.app_sms_sign).find(query, {
                    sort: {$natural: -1},
                    limit: limit,
                    skip: skip
                }).toArray(function (err, list) {
                    if (!err) {
                        result.success = true;
                        result.list = list || [];
                        callback(result);
                    } else {
                        logger.app.error("querySmsSignList  error", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("querySmsSignList query count error", err);
                callback(result);
            }
        });
    },
    querySmsTempleteList: function (data, seesion, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        data.status=1;
        var query = data || {};
        mongo.db("cc").collection(constants.DB.app_sms_template).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("cc").collection(constants.DB.app_sms_template).find(query, {sort: {num: -1}, limit: limit, skip: skip}).toArray(function (err, list) {
                    if (!err) {
                        result.success = true;
                        result.list = list || [];
                        callback(result);
                    } else {
                        logger.app.error("querySmsTempleteList  error", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("querySmsTempleteList error !", err);
                callback(result);
            }
        });
    },
    querySmsEditList: function (data, session, callback) {//查询短信模版
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query = data || {};
        if (query.name) {
            query.name = "【" + query.name + "】";
        }
        mongo.db("cc").collection(constants.DB.app_sms_edit).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("cc").collection(constants.DB.app_sms_edit).find(query, {
                    sort: {$natural: -1},
                    limit: limit,
                    skip: skip
                }).toArray(function (err, list) {
                    if (!err) {
                        result.success = true;
                        result.list = list || [];
                        callback(result);
                    } else {
                        logger.app.error("querySmsEditList  error", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("querySmsEditList query count error", err);
                callback(result);
            }
        });
    },
    addSmsTemplete : function (data , session , callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account).findOne({_id:data.account},function(err , oneAccount){
            if(!err){
                if(oneAccount){
                    utils.BusinessUtil.getSmsTempleteId(data.account , function(err , num ) {
                        data._id = data.account + "_" + num;
                        data.num = num + "";
                        var content = data.content || "";
                        var matchRs = content.match(/\{\d+\}/g) || [];
                        data.vars = matchRs.length;
                        data.createTime = utils.DateTime.getCurrentDateTime()
                        var sign = data.sign || "";
                        var signContent = sign;
                        var isYtxChannel = data.smsChannel && (data.smsChannel.indexOf("ytx") >= 0 || data.smsChannel.indexOf("ytxyx") >= 0);
                        //如果不是已有签名，则新增签名。
                        mongo.db("cc").collection(constants.DB.app_sms_sign).findOne({_id: sign}, function (err, dbSign) {
                            if (!err) {
                                Then()
                                    .then(function (cont) {
                                        if (!dbSign) {
                                            var signData = {
                                                account: data.account,
                                                name: sign
                                            };
                                            module.exports.addSmsSign(signData, session, function (signResult) {
                                                if (signResult.success) {
                                                    data.sign = signResult.signInfo._id;
                                                    cont();
                                                } else {
                                                    result.message = "保存短信签名失败！";
                                                    return callback(result);
                                                }
                                            });
                                        } else {
                                            signContent = dbSign.name;
                                            cont();
                                        }
                                    })
                                    .then(function (cont) {
                                        if (isYtxChannel) {
                                            //云通讯短信模板备案
                                            var params = utils.collect(data,{signContent:signContent,_id:data._id});
                                            utils.BusinessUtil.addYTXSmsTemplate(params, cont);
                                        } else {
                                            cont();
                                        }
                                    })
                                    .then(function(cont){
                                        if (isYtxChannel) {
                                            result.success = true;
                                            return callback();
                                        }
                                        data.status=1;
                                        mongo.db("cc").collection(constants.DB.app_sms_template).insert(data, function (err) {
                                            if (!err) {
                                                result.success = true;
                                                callback(result);
                                            } else {
                                                result.message = "保存短信模板失败！";
                                                callback(result);
                                            }
                                        });
                                    })
                                    .fail(function(cont,err){
                                        logger.app.error(err);
                                        result.message = "保存短信模板失败！"+err.message;
                                        callback(result);
                                    });
                            } else {
                                result.message = "保存短信模板失败！";
                                callback(result);
                            }
                        });
                    });
                } else {
                    result.message = '该账户不存在！';
                    callback(result);
                }
            } else {
                logger.app.error(err);
                result.message = 'addSmsTemplete error!';
                callback(result);
            }
        });
    },
    addSmsSign: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account).findOne({_id: data.account}, function (err, oneAccount) {
            if (!err) {
                if (oneAccount) {//账户存在
                    utils.BusinessUtil.getSmscodeId(function (err, num) {//调用短信签名的方法
                        if (!err) {
                            var num = num;
                            mongo.db("cc").collection(constants.DB.app_sms_sign).findOne({subcode: num}, function (err, subcodeSmsSign) {
                                if (!err) {
                                    if (subcodeSmsSign) {
                                        result.message = 'subcode已经被使用！';
                                        callback(result);
                                    } else {
                                        var smsSigninfo = {
                                            _id: utils.UUID.generateUuid(),
                                            account: data.account,
                                            name: "【" + data.name + "】",
                                            subcode: num
                                        }
                                        mongo.db("cc").collection(constants.DB.app_sms_sign).insert(smsSigninfo, {w: 1}, function (err) {
                                            if (!err) {
                                                result.success = true;
                                                result.signInfo = smsSigninfo;
                                                callback(result);
                                            } else {
                                                logger.app.error("insert smsSign to db error!", err);
                                                callback(result);
                                            }
                                        });
                                    }
                                } else {
                                    logger.app.error(err.stack);
                                    result.message = 'addSmsSign error!';
                                    callback(result);
                                }
                            });
                        }
                    });
                    //mongo.db("cc").collection(constants.DB.app_sms_sign).findOne({subcode: data.subcode}, function (err, subcodeSmsSign) {
                    //    if (!err) {
                    //        if(subcodeSmsSign){
                    //            result.message = 'subcode已经被使用！';
                    //            callback(result);
                    //        }else{
                    //            var smsSigninfo={
                    //                _id:utils.UUID.generateUuid(),
                    //                account:data.account,
                    //                name:"【"+data.name+"】",
                    //                subcode:data.subcode
                    //            }
                    //            mongo.db("cc").collection(constants.DB.app_sms_sign).insert(smsSigninfo, {w: 1}, function (err) {
                    //                if (!err) {
                    //                    result.success = true;
                    //                    callback(result);
                    //                } else {
                    //                    logger.app.error("insert smsSign to db error!", err);
                    //                    callback(result);
                    //                }
                    //            });
                    //        }
                    //    }else{
                    //        logger.app.error(err.stack);
                    //        result.message = 'addSmsSign error!';
                    //        callback(result);
                    //    }
                    //});
                } else {
                    result.message = '该账户不存在！';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'addSmsSign error!';
                callback(result);
            }
        });
    },
    addSmsEdit: function (data, session, callback) { //新增短信模版
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_account).findOne({_id: data.account}, function (err, oneAccount) {
            if (!err) {
                if (oneAccount) { //用户必须存在
                    mongo.db("cc").collection(constants.DB.app_sms_edit).findOne({name: data.name}, function (err, nameSmsEdit) {
                        if (!err) {
                            if (nameSmsEdit) {
                                result.message = '模版名称已经被使用！';
                                callback(result);
                            } else {
                                var smsEditinfo = {
                                    _id: utils.UUID.generateUuid(),
                                    account: data.account,
                                    name: "【" + data.name + "】",
                                    content: data.content
                                }
                                mongo.db("cc").collection(constants.DB.app_sms_edit).insert(smsEditinfo, {w: 1}, function (err) {
                                    if (!err) {
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error("insert smsEdit to db error!", err);
                                        callback(result);
                                    }
                                });
                            }
                        } else {
                            logger.app.error(err.stack);
                            result.message = 'addSmsEdit error!';
                            callback(result);
                        }
                    });
                } else {
                    result.message = '该账户不存在！';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'addSmsEdit error!';
                callback(result);
            }
        });
    },


    getSmsSignByAccount: function (data, session, callback) {
        var result = {success: false};
        mongo.db('cc').collection(constants.DB.app_sms_sign).findOne(data, function (err, oneSmsSign) {
            if (!err) {
                if (oneSmsSign) {
                    oneSmsSign.name = oneSmsSign.name.replace("【", "");
                    oneSmsSign.name = oneSmsSign.name.replace("】", "");
                } else {
                    oneSmsSign = {};
                }
                result.success = true;
                result.data = oneSmsSign;
                callback(result);
            } else {
                result.message = "404";
                callback(result);
            }
        });
    },
    getSmsTempleteById: function (data, session, callback) {
        var result = {success: false};
        mongo.db("cc").collection(constants.DB.app_sms_template).findOne({_id: data._id}, function (err, dbTemplete) {
            if (!err) {
                result.success = true;
                result.data = dbTemplete;
                callback(result);
            } else {
                result.message = "not found ";
                callback(result);
            }
        });
    },
    getSmsEditByAccount: function (data, session, callback) {
        var result = {success: false};
        mongo.db('cc').collection(constants.DB.app_sms_edit).findOne(data, function (err, oneSmsEdit) {
            if (!err) {
                if (oneSmsEdit) {
                    oneSmsEdit.name = oneSmsEdit.name.replace("【", "");
                    oneSmsEdit.name = oneSmsEdit.name.replace("】", "");
                } else {
                    oneSmsEdit = {};
                }
                result.success = true;
                result.data = oneSmsEdit;
                callback(result);
            } else {
                result.message = "404";
                callback(result);
            }
        });
    },
    _initGAQuery: function (query) {
        var beginTime = query.begin;
        var endTime = query.end;
        var account = query.account;

        if (beginTime) {
            query.createTime = {
                $gte: beginTime + " 00:00:00"
            }
            delete query.begin;
        }
        if (endTime) {
            if (query.createTime) {
                query.createTime.$lte = endTime + " 23:59:59"
            } else {
                query.createTime = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete query.end;
        }
        if (account) {
            query.accountList = {
                $all: [account]
            };
            delete query.account;
        }

    },
    queryGroupAccount: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query = data || {};
        handler._initGAQuery(query);

        mongo.db().collection(constants.DB.platform_group_account_relation).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_group_account_relation).find(query, {
                    sort: {createTime: -1},
                    limit: limit,
                    skip: skip
                }).toArray(function (err, docs) {
                    if (!err) {
                        result.list = docs || [];
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("query groupAccount list error", err);
                        result.message = "查询集团账户列表异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("query groupAccount count error", err);
                result.message = "查询集团账户列表异常！";
                callback(result);
            }
        });
    },
    addGroupAccount: function (data, session, callback) {
        var result = {success: false};
        var createTime = utils.DateTime.getCurrentDateTime();
        data.createTime = createTime;
        data._id = utils.UUID.generateUuid();
        mongo.db().collection(constants.DB.platform_group_account_relation).insert(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn(err);
                result.message = "添加集团账户失败！";
                callback(result);
            }
        });

    },
    updateGroupAccount: function (data, session, callback) {
        var result = {success: false};
        var query = {
            _id: data._id
        };
        var set = {
            memo: data.memo,
            accountList: data.accountList
        };
        mongo.db().collection(constants.DB.platform_group_account_relation).update(query, {$set: set}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn(err);
                result.message = "更新集团账户关系失败！";
                callback(result);
            }
        });

    },
    deleteGroupAccount: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_group_account_relation).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn(err);
                result.message = "删除集团账户失败！";
                callback(result);
            }
        });
    },
    getAccountInfo: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account._id;
        mongo.db().collection(constants.DB.platform_account).findOne({_id: aid}, function (err, acc) {
            if (!err && acc) {
                result.row = acc;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * identityStatus:deal,failure,success
     * @param data
     * @param session
     * @param res
     */
    saveIdentity: function (data, session, res) {
        delete data._id;
        var aid = session.account._id;
        data.identityStatus = "deal";
        //console.dir(data);
        mongo.db().collection(constants.DB.platform_account).update({_id: aid}, {$set: data}, function (err) {
            var result = '';
            if (!err) {
                result = '<script>parent.handler.account.uploadSuccess("success")</script>';
                var param = {
                    companyName: session.account.companyName,
                    loginName: session.account.name
                }
                notifyHandler.sendAccountIdentity27moor(param);
            } else {
                result = '<script>parent.handler.account.uploadSuccess("fail")</script>';
            }
            res.send(result);
        });
    },
    auditIdentity: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account._id;
        var flag = data.flag;
        delete data.flag;
        data.identityStatus = "failure";
        if (flag == "1") {
            data.identityStatus = "success";
        }
        mongo.db().collection(constants.DB.platform_account).update({_id: aid}, {$set: data}, function (err) {
            if (!err) {
                var param = {
                    mail: session.account.linkManEmail,
                    companyName: session.account.companyName,
                    loginName: session.account.name,
                    content: ""
                }
                var txt = "您提交的企业认证资料，已经审核通过，账号可以正常使用了。";
                if (data.identityStatus == "failure") {
                    txt = "您提交的企业认证资料，审核失败，失败原因：" + (data.auditMemo || "") + "，请登录到用户中心重新认证！";
                }
                param.content = txt;
                notifyHandler.sendAuditIdentity27moor(param);
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    saveInvoiceSet: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        var set={
            isInvoice:data.isInvoice==null?false:true
        }
        mongo.db().collection(constants.DB.platform_account).update({_id: id}, {$set: set}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error("saveInvoiceSet error! ", err);
                result.message = "保存配置失败！";
                callback(result);
            }
        });
    },
    deductCCMinConsume : function(data,session,callback){
        var result = {success: false};
        var url = config.serviceUrl + '?Action=deductCCMinConsume&account='+data.account;
        http.sendGet(url, function (err, res) {
            if (err) {
                result.message = "补扣低消失败! " + err.message;
                return callback(result);
            }
            if(!res){
                result.message = "补扣低消失败! no response";
                return callback(result);
            }

            var res = JSON.parse(res);
            if (res.Succeed) {
                result.success = true;
                return callback(result);
            } else {
                result.message = "补扣低消失败! " + res.Message;
                return callback(result);
            }
        });
    },
    openSingleCallSum : function(data,session,callback){
        var result = {success: false};
        var url2="";
        //url2="http://127.0.0.1:8888/service"
        url2=config.serviceUrl;
        var url = url2 +'?Action=changeSingleCallSumToPbx&account='+data.data.account+'&CallNumber='+data.data.callSum;
        http.sendGet(url, function (err, res) {
            if (err) {
                result.message = "设置拨号限制失败! " + err.message;
                return callback(result);
            }
            if(!res){
                result.message = "设置拨号限制失败! no response";
                return callback(result);
            }
            var res = JSON.parse(res);
            if (res.Succeed) {
                result.success = true;
                return callback(result);
            } else if(res.result==500){
                result.message = "设置拨号限制失败! 请检查pbx设置";
                return callback(result);
            }else {
                result.message = "设置拨号限制失败! " + res.Message;
                return callback(result);
            }
        });
    },
    openAccountCallSum : function(data,session,callback){
        var result = {success: false};
        var url2="";
        //url2="http://127.0.0.1:8888/service"
        url2=config.serviceUrl;
        var url = url2 +'?Action=changeCallSumByAccount&account='+data.data.account;
        http.sendGet(url, function (err, res) {
            if (err) {
                result.message = "设置拨号限制失败! " + err.message;
                return callback(result);
            }
            if(!res){
                result.message = "设置拨号限制失败! no response";
                return callback(result);
            }
            var res = JSON.parse(res);
            if (res.Succeed) {
                result.success = true;
                return callback(result);
            } else if(res.result==403){
                result.message = "该账户没有拨号记录! " + res.Message;
                return callback(result);
            }else if(res.result==500){
                result.message = "设置拨号限制失败! 请检查pbx设置";
                return callback(result);
            }else {
                result.message = "设置拨号限制失败! " + res.Message;
                return callback(result);
            }
        });
    },
    backoutCCMinConsume : function(data,session,callback){
        var result = {success: false};
        var url = config.serviceUrl + '?Action=backoutCCMinConsume&account='+data.account;
        http.sendGet(url, function (err, res) {
            if (err) {
                result.message = "撤销低消失败! " + err.message;
                return callback(result);
            }
            if(!res){
                result.message = "撤销低消失败! no response";
                return callback(result);
            }

            var res = JSON.parse(res);
            if (res.Succeed) {
                result.success = true;
                return callback(result);
            } else {
                result.message = "撤销低消失败! " + res.Message;
                return callback(result);
            }
        });
    }

};


var impl = {
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
    _createIvrData: function (account) {
        var ivrData = {
            _id: account._id,
            name: account.name,
            companyName: account.companyName,
            linkManPhone: account.linkManPhone
        };
        return ivrData;
    },
    effectSipNum: function (numbers, account, codes, callback) {
        mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, dbAccount) {
            if (dbAccount) {
                var pbx = dbAccount.pbx[0].pbx;
                if (pbx) {
                    mongo.db().collection(constants.DB.platform_pbx).findOne({_id: pbx}, function (err, dbPbx) {
                        if (dbPbx) {
                            var url = dbPbx.configAddr;
                            var secret = utils.BusinessUtil.generatePassword(6);
                            var postData = {
                                Command: "Action",
                                Action: "GatewaySipsAdd",
                                ActionID: utils.UUID.generateUuid(),
                                sips: numbers,
                                codecs: codes,
                                account: account,
                                pbx: pbx,
                                secret: secret
                            };
                            appHttp.sendPost(url, postData, function (err, data) {
                                if (!err) {
                                    data = JSON.parse(data + "");
                                    if (data.Succeed) {
                                        var index = 0;
                                        var dbFun = function (currentIndex) {
                                            if (currentIndex < numbers.length) {
                                                var currentNum = numbers[currentIndex];
                                                mongo.db().collection(constants.DB.platform_sipNum).update({_id: currentNum}, {
                                                    $set: {
                                                        account: account,
                                                        pbx: pbx,
                                                        status: 'using',
                                                        type: "gateway",
                                                        exten: currentNum,
                                                        secret: secret,
                                                        codes: codes
                                                    }
                                                }, function (err) {
                                                    if (!err) {
                                                        dbFun(++index);
                                                    }
                                                });
                                            } else {
                                                callback(null);
                                            }
                                        }
                                        dbFun(index);
                                    } else {
                                        callback(new Error("call config server error!"));
                                    }
                                } else {
                                    callback(err);
                                }
                            });
                        } else {
                            callback(err || new Error("query db error!"));
                        }
                    });
                } else {
                    callback(new Error("account pbx is null!"));
                }
            } else {
                callback(err || new Error("query db error!"));
            }
        });
    },
    effectSipNumByUcenter: function (product, numbers, account, codes, session, isFax, callback) {
        var pbx = utils.getProductPbx(product, session);
        if (pbx) {
            mongo.db().collection(constants.DB.platform_pbx).findOne({_id: pbx}, function (err, dbPbx) {
                if (dbPbx) {
                    var url = dbPbx.configAddr;
//                    url='http://localhost:7789/';
                    var secret = utils.BusinessUtil.generatePassword(6);
                    var postData = {
                        Command: "Action",
                        Action: "GatewaySipsAdd",
                        ActionID: utils.UUID.generateUuid(),
                        sips: numbers,
                        codecs: codes,
                        isFax: isFax,
                        account: account,
                        pbx: pbx,
                        secret: secret
                    };
                    appHttp.sendPost(url, postData, function (err, data) {
                        if (!err) {
                            data = JSON.parse(data + "");
                            if (data.Succeed) {
                                var index = 0;
                                var dbFun = function (currentIndex) {
                                    if (currentIndex < numbers.length) {
                                        var currentNum = numbers[currentIndex];
                                        mongo.db().collection(constants.DB.platform_sipNum).update({_id: currentNum}, {
                                            $set: {
                                                account: account,
                                                product: product,
                                                pbx: pbx,
                                                status: 'using',
                                                type: "gateway",
                                                exten: currentNum,
                                                secret: secret,
                                                isFax: isFax,
                                                codes: codes
                                            }
                                        }, function (err) {
                                            if (!err) {
                                                dbFun(++index);
                                            }
                                        });
                                    } else {
                                        callback(null);
                                    }
                                }
                                dbFun(index);
                            } else {
                                callback(new Error("call config server error!"));
                            }
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    callback(err || new Error("query db error!"));
                }
            });
        } else {
            callback(new Error("account pbx is null!"));
        }
    }

};

var _impl = {
    deleteCustFees:function(productId,custFeeIds,callback){
        mongo.db().collection(constants.DB.platform_account_product).update({_id:productId},{$pull:{custFees:{id:{$in:custFeeIds}}}}, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    },
    _queryCallAccountSum: function(condition,callback) {
        mongo.db().collection(constants.DB.platform_account).find(condition).toArray(function(err,resData){
            if(err){
                logger.app.err("query call sum  list error");
                callback(err);
                return;
            }
            callback(null,resData);
        });
    },
    _queryPbxByAccountId: function(condition,callback) {
        mongo.db().collection(constants.DB.platform_account_product).find(condition).toArray(function(err,resData){
            if(err){
                logger.app.err("query call sum  list error");
                callback(err);
                return;
            }
            callback(null,resData);
        });
    },
    updateCustFee:function(productId,custFee,callback){
        mongo.db().collection(constants.DB.platform_account_product).update({_id:productId,custFees:{$elemMatch: {id:custFee.id,state:'stop'}}},{$set:{"custFees.$.price":custFee.price,"custFees.$.pricePeriod":custFee.pricePeriod,'custFees.$.name':custFee.name,'custFees.$.autoRenew':custFee.autoRenew,'custFees.$.memo':custFee.memo}},function(err){
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    },
    addCustFee:function(productId,custFee,callback){
        mongo.db().collection(constants.DB.platform_account_product).update({_id:productId},{$push:{custFees:custFee}}, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    },
    openAccountCustFeeProduct: function(product,callback){
        mongo.db().collection(constants.DB.platform_account_product).insert(product,{w: 1}, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
        });
    },
    updateAccountProduct: function (condition, update, callback) {
        mongo.db().collection(constants.DB.platform_account_product).update(condition, update, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null);
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
    getPBX : function (pbxId, callback) {
        mongo.db().collection(constants.DB.platform_pbx).findOne({_id: pbxId}, function (err, record) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, record);
        });
    },
    getBoard : function(boardId,callback) {
        mongo.db().collection(constants.DB.platform_board).findOne({_id: boardId}, function (err, record) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, record);
        });
    },
    notifyAssZJLineSet: function (accountId,pbxId, zjOutRouteId, zjTransferRouteId, callback) {
        var getOutRoute = function (outRouteId, callback) {
            mongo.db().collection(constants.DB.platform_board_outRoute).findOne({_id: outRouteId}, function (err, record) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, record);
            });
        };

        var notifyASS = function (isOutRoute,pbx,outRouteNumber,callback) {
            var addr = pbx.configAddr;

            var action = {
                Dialout: isOutRoute,
                Exten: outRouteNumber,
                Account: accountId,
                PBX: pbx._id,
                Action: "DialLineAdd",
                Command: "Action",
                ActionID: "DialLineAdd" + utils.UUID.generateUuid()
            };

            console.log(action);

            http.sendPost(addr, action, function (err, data) {
                var response = JSON.parse(data || '{}');
                console.log(response);
                if (response.Succeed) {
                    callback();
                } else {
                    callback(new Error("同步ass失败！" + outRouteNumber));
                }
            });
        }

        _impl.getPBX(pbxId,function(err,pbx){
            if(err){
                callback(err);
                return;
            }
            getOutRoute(zjOutRouteId,function(err,zjOutRoute){
                if(err){
                    callback(err);
                    return;
                }
                getOutRoute(zjTransferRouteId,function(err,zjTransferRoute){
                    if(err){
                        callback(err);
                        return;
                    }
                    notifyASS(true,pbx,zjOutRoute.number,function(err){
                        if(err){
                            callback(err);
                            return;
                        }
                        notifyASS(false,pbx,zjTransferRoute.number,function(err){
                            if(err){
                                callback(err);
                                return;
                            }
                            callback();
                        });
                    });
                })
            })
        });
    },
    /**
     * 初始化组织机构
     * @param data
     * @param callback
     */
    initDept : function (data,callback){
        var account = data.account;
        var userId = data.userId;
        var result = {success: false};
        if (account == "all") {
            mongo.db("bill").collection(constants.DB.platform_department).find({},{fields:{_id:1}}).toArray(function(err, docs) {
                if(!err){
                    var accounts = docs || [];
                    var bulkWrite =[];
                    for(var i=0; i<accounts.length; i++){
                        var qid = utils.UUID.generateUuid();
                        var updateData = {};
                        updateData._id = qid;
                        updateData.pId = ""
                        updateData.account = accounts[i]._id;
                        updateData.treePath = qid+"/";
                        updateData.name = "全公司";
                        updateData.order = "999";
                        updateData.observer = [];
                        updateData.note = "默认生成";
                        updateData.createUser = "";
                        updateData.createTime = utils.DateTime.getCurrentDateTime();
                        updateData.lastUpdater = "";
                        updateData.lastTime = utils.DateTime.getCurrentDateTime();
                        var query = { updateOne : {
                            "filter": { "account" : accounts[i]._id,"name":"全公司","pId":"" },
                            "update": { $set : updateData},
                            "upsert" : true
                        }}
                        bulkWrite.push(query)
                    }

                    mongo.db("bill").collection(constants.DB.platform_department).bulkWrite(bulkWrite,function(err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error('db initDept error:' + err.stack);
                            callback(result)
                        }
                    });

                }else{
                    logger.app.error('db initDept error:' + err.stack);
                    result.message = "initDept error";
                    callback(result)
                }
            })
        }else if(account && userId){
            var qid = utils.UUID.generateUuid();
            var query = {"account":account,"name":"全公司","pId":""};
            var updateData = {};
            updateData._id = qid;
            updateData.pId = ""
            updateData.account = account;
            updateData.treePath = qid+"/";
            updateData.name = "全公司";
            updateData.order = "999";
            updateData.observer = [];
            updateData.note = "默认生成";
            updateData.createUser = userId;
            updateData.createTime = utils.DateTime.getCurrentDateTime();
            updateData.lastUpdater = userId;
            updateData.lastTime = utils.DateTime.getCurrentDateTime();
            mongo.db("bill").collection(constants.DB.platform_department).update(query,{$set:updateData},{upsert:true},function(err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error('db initDept error:' + err.stack);
                    result.message = "initDept error";
                    callback(result)
                }
            });
        }else{
            result.message = "帐号或用户Id输入有误!";
            callback(result);
        }
    },
    /**
     * 初始化客户状态审核 角色及模板
     * @param data
     * @param callback
     */
    initApprovalBusiness : function (data,callback) {
        var result = {success: false};
        var roleId = utils.UUID.generateUuid();
        var insertData = {};
        insertData._id = roleId;
        insertData.display_name = "客户状态审核员"
        insertData.memo = "系统生成";
        insertData.scope = "level";
        insertData.scope_in = {
            "call" : "level",
            "customer" : "level",
            "business" : "level",
            "chat" : "level",
            "email" : "level",
            "sms" : "level",
            "qc" : "level",
            "question" : "level"
        };
        insertData.scope_out = {
            "call" : "level",
            "customer" : "level",
            "business" : "level",
            "custTask" : "level",
            "custApproval" : "level",
            "sms" : "level"
        };
        insertData.type = "system";
        insertData.limits_out = ["nav_cust_approval_business"];
        insertData.accountId = data.account;
        insertData.limits = [];
        insertData.limits_in = [];
        insertData.createTime = utils.DateTime.getCurrentDateTime();
        insertData.lastTime = utils.DateTime.getCurrentDateTime();
        mongo.db("cc").collection(constants.DB.cc_app_role).insert(insertData, function (err) {
            if (!err) {
                //插入4条模板
                var bulkWrite =[];
                var role = [];
                role.push(roleId);

                for(var i=0; i<4; i++){
                    var apprInserData = {};
                    apprInserData._id = utils.UUID.generateUuid();
                    apprInserData.account = data.account;
                    if(i == 0) {
                        apprInserData.name = "无效审核";
                        apprInserData.type = "2";
                    }else if(i == 1){
                        apprInserData.name = "丢单审核";
                        apprInserData.type = "4";
                    } else if(i == 2){
                        apprInserData.name = "成单审核";
                        apprInserData.type = "3";
                    } else if(i == 3) {
                        apprInserData.name = "续费审核";
                        apprInserData.type = "8";
                    }
                    apprInserData.createTime = utils.DateTime.getCurrentDateTime();
                    apprInserData.createUser = "system";
                    apprInserData.lastTime = utils.DateTime.getCurrentDateTime();
                    apprInserData.role = role;
                    var query = { insertOne : apprInserData};
                    bulkWrite.push(query);
                }

                mongo.db("cc").collection(constants.DB.cc.app_customer_approval).bulkWrite(bulkWrite,function(err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error('db initApprovalBusiness error:' + err.stack);
                        callback(result)
                    }
                });

            } else {
                logger.app.error('db initApprovalBusiness error:' + err.stack);
                result.message = "initApprovalBusiness error";
                callback(result)
            }
        });
    },
    /**
     *  初始化商机池
     * @param data
     * @param callback
     */
    initCommonPool:function(data,callback){
        var result = {success:false};
        var account = data.account;
        var query = {category:{"$in":["0","1","2"]},account:account};
        mongo.db("cc").collection(constants.DB.cc.app_customer_pool).find(query).toArray(function(err,commonList){
            if(!err){
                if(commonList.length == 0){
                    var insertData = [];
                    var insertOne = {};
                    insertOne._id = utils.UUID.generateUuid();
                    insertOne.createTime = utils.DateTime.getCurrentDateTime();
                    insertOne.account = account;
                    insertOne.managers = [];
                    insertOne.recycle = {};
                    insertOne.ruleNum = "50";
                    insertOne.category = "0";
                    insertOne.cName = "默认公海";
                    //mongo.db().collection(constants.DB.platform_user).find({account:account},{fields:{displayName:1}}).toArray(function (err, uList) {
                    //    if (!err) {
                    //        uList=uList||[];
                    //        var ary = [];
                    //        for (var i = 0; i < uList.length; i++) {
                    //            ary.push(uList[i]._id);
                    //        }
                    //    }else{
                    //        logger.app.error('initCustomerCommon error:' + err);
                    //        callback(result);
                    //    }
                    //});
                    insertOne.members = [];
                    insertData.push(insertOne);
                    var insertTwo = {};
                    insertTwo._id = utils.UUID.generateUuid();
                    insertTwo.createTime = utils.DateTime.getCurrentDateTime();
                    insertTwo.account =account;
                    insertTwo.managers = [];
                    insertTwo.members = [];
                    insertTwo.category = "1";
                    insertTwo.cName = "无效商机公海";
                    insertData.push(insertTwo);
                    var insertS = {};
                    insertS._id = utils.UUID.generateUuid();
                    insertS.createTime = utils.DateTime.getCurrentDateTime();
                    insertS.account = account;
                    insertS.managers = [];
                    insertS.members = [];
                    insertS.category = "2";
                    insertS.cName = "丢单商机公海";
                    insertData.push(insertS);
                    mongo.db("cc").collection(constants.DB.cc.app_customer_pool).insert(insertData,{w:1},function(err){
                        if(!err){
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.error('initCustomerCommon error:' + err);
                            callback(result);
                        }
                    });
                }else{
                    result.message = '系统公海已经存在，请确认后再进行添加!';
                    callback(result);
                }
            }else{
                logger.app.error('initCustomerCommon error:' + err);
                callback(result);
            }
        })
    }
}

module.exports = handler;
