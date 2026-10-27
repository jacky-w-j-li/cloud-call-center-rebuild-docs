var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var config = require("appConfig");
var fs = require("fs");
var ivrHandler = require(__baseDir + "/7moor/ivr/IvrHandler");
var accountHandler = require(__baseDir + "/7moor/account/AccountHandler");
var constants = require(__baseDir + "/7moor/utils/Constants");
var interfaceSmsService = require(__baseDir + '/7moor/sms/InterfaceSmsHandler');
var httpProvider = require("appHttp");
var appEvent = require("appEvent");

var handler = {
    email: function (data, callback) {
        var result = {success: false};
        var mail = data.email || "";
        logger.app.info("process register:" + mail);
        if (utils.ValidateUtil.isEmail(mail)) {
            var mailDomain = mail.split("@")[1];
            var mailDomainArr = mailDomain.split(".");
            if(mailDomainArr.length == 3 && mailDomainArr[2] != 'cn'){
                mailDomain = mailDomainArr[1]+"."+mailDomainArr[2];
            }
            mongo.db().collection(constants.DB.bill_platform_mail_exclude).findOne({_id:mailDomain} , function (err , dbDomain){
                if(!dbDomain){
                    mongo.db().collection(constants.DB.bill_platform_mail_register).findOne({domain: mailDomain}, function (err, dbMail) {
                        if (!err) {
                            if (!dbMail) {
                                dbMail = {
                                    _id: mail,
                                    domain: mailDomain,
                                    key: utils.UUID.generateUuid(),
                                    time: utils.DateTime.getCurrentDateTime(),
                                    timestamp: utils.DateTime.getCurrentTimestamp(),
                                    status: "ready"
                                };
                                dbMail.md5 = utils.md5(mail + dbMail.key);
                                mongo.db().collection(constants.DB.bill_platform_mail_register).insert(dbMail, function (err) {
                                    if (!err) {
                                        impl._processMailRegister(dbMail, result, callback);
                                    } else {
                                        logger.app.error("insert mail to db error!", err);
                                        result.message = "系统异常，无法处理该请求！";
                                        result.code = "04";
                                        callback(result);
                                    }
                                });

                            } else if(dbMail._id == mail){
                                logger.app.warn(mail + "：已经存在！");
                                result.message = "邮箱已经注册！";
                                result.code = "05";
                                callback(result);
                            } else {
                                logger.app.warn(mailDomain + "：已经存在！");
                                result.message = "邮箱域名已被["+dbMail._id+"]注册！";
                                result.code = "03";
                                callback(result);
                            }
                        } else {
                            logger.app.error("check mail from db error!", err);
                            result.message = "系统异常，无法检查邮箱地址！";
                            result.code = "04";
                            callback(result);
                        }
                    });
                } else {
                    logger.app.error("[" + mail + "] is not allow email!");
                    result.message = "不允许的邮箱地址！";
                    result.code = "01";
                    callback(result);
                }
            });
        } else {
            logger.app.error("[" + mail + "] is not valid email!");
            result.message = "不是有效的邮箱地址！";
            result.code = "02";
            callback(result);
        }
    },
    reEmail : function (data , callback){
        var result = {success: false};
        var mail = data.email || "";
        logger.app.info("process remail:" + mail);
        mongo.db().collection(constants.DB.bill_platform_mail_register).findOne({_id:mail},function(err , dbMail){
            if(!err && dbMail){
                impl._processMailRegister(dbMail, result, callback);
            } else {
                logger.app.error("[" + mail + "] is not found in db!");
                result.message = "无效邮箱";
                result.code = "01";
                callback(result);
            }
        });
    },
    submitData : function (data , callback){
        var result = {success: false};
        if (impl._checkValidData(data)) {
            impl._validMailId(data.email , data.key , function (dbMail){
                if(dbMail){
                    impl._updateRegisterInfo(data , function (success){
                        if(success){
                            result.success = true;
                            callback(result);
                        } else {
                            result.message = "save data error!";
                            callback(result);
                        }
                    });
                } else {
                   result.message = "非法的邮件地址";
                   callback(result);
                }
            });
        } else {
            result.message = "提交数据异常！";
            callback(result);
        }
    },
    getAccount : function (data , callback){
        var result = {success: false};
        impl._validMailId(data.email , data.key , function (dbMail){
            if(dbMail){
                var regData = dbMail.subData || {};
                regData._id = data.email;
                regData.domain = dbMail.domain;
                impl._selectAvailableAcc(regData,function ( account){
                    if(account){
                        result.account = account._id;
                        impl._initAccountResource(account,function(success){
                            if(success){
                                result.success = true;
                                callback(result);
                            } else {
                                result.message = "init account resource error!";
                                callback(result);
                            }
                        });
                    } else {
                        result.message = "get available account error!";
                        callback(result);
                    }
                });
            } else {
                result.message = "非法的邮件地址";
                callback(result);
            }
        });
    },
    /**
     * 同步账户名称，同步坐席手机号
     * @param data
     * @param callback
     */
    initAccount : function (data , callback){
        var result = {success: false};
        impl._validMailId(data.email , data.key , function (dbMail){
            if(dbMail){
                impl._syncCCAcs(dbMail.bingAcc,function(success){
                    if(success){
                        impl._sysnAgentInfo(dbMail , function(success){
                            if(success){
                                mongo.db().collection(constants.DB.bill_platform_mail_register).update({_id: data.email}, {$set: {status : 'initAccount',lastUpdateTime:utils.DateTime.getCurrentDateTime()}}, function (err) {
                                    if (!err) {
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        result.message = "save regiest status  error!";
                                        callback(result);
                                    }
                                });
                            }else{
                                result.message = "sync agent info  error!";
                                callback(result);
                            }
                        });
                    } else {
                        result.message = "sync account name error!";
                        callback(result);
                    }
                });
            } else {
                result.message = "非法的邮件地址";
                callback(result);
            }
        });
    },
    /**
     * 获取账户信息，生成开户通知单
     * @param data
     * @param callback
     */
    getAccountInfo : function (data , callback){
        var result = {success: false};
        impl._validMailId(data.email , data.key , function (dbMail){
                if(dbMail){
                    impl._getAccountInfo(dbMail,function(accountInfo){
                        if(accountInfo){
                            mongo.db().collection(constants.DB.bill_platform_mail_register).update({_id: data.email}, {$set: {status : 'sendAccountInfo',lastUpdateTime:utils.DateTime.getCurrentDateTime()}}, function (err) {
                                if (!err) {
                                    result.success = true;
                                    result.info = accountInfo;
                                    callback(result);
                                    impl._sendKtdToAccount(data.email , data.key , accountInfo);
                                } else {
                                    result.message = "save regiest status  error!";
                                    callback(result);
                                }
                            });
                        }else{
                            result.message = "query account info  error!";
                            callback(result);
                        }
                    });
                } else {
                    result.message = "非法的邮件地址";
                    callback(result);
                }
        });

    },
    completeRegiste: function (data, callback) {
        var result = {showView: true};
        var key = data.key;
        if (key) {
            mongo.db().collection(constants.DB.bill_platform_mail_register).findOne({key: key}, function (err, doc) {
                if (!err && doc) {
                    if (impl._isValidTime(doc)) {
                        result.view = "register/completeRegNew.html";
                        result.data = doc;
                        callback(result);
                    } else {
                        logger.app.warn("mail complete is out date!key[" + key + "]");
                        result.view = "register/error.html";
                        result.data = {message: "您的连接已经失效！请重新注册！"};
                        callback(result);
                    }
                    var clickInsertDoc = {
                        info: doc,
                        time: utils.DateTime.getCurrentDateTime()
                    };
                    mongo.db().collection(constants.DB.bill_platform_mail_register_url_click_log).insert(clickInsertDoc,function(){});
                } else {
                    logger.app.warn("mail complete is out date!key[" + key + "]");
                    result.view = "register/error.html";
                    result.data = {message: "您的连接已经失效！请重新注册！"};
                    callback(result);
                }
            });
        } else {
            callback(result);
        }
    },
    /**
     * 提交企业信息
     * 1、把注册信息更新到用户注册信息表
     * 2、根据地区找到一个空闲的账户（创建账户时可以指定账户添加互联网账户标示，默认为空闲状态）
     * 3、把公司信息、账户名、联系人、联系人电话、邮箱 更新到选定账户上，并更改账户状态为互联网注册。
     * 4、同步账户名到状态服务器，联系人手机号绑定为坐席直线。
     * 5、账户信息送给前台，发送账户信息邮件到注册邮件。
     * @param data
     * @param callback
     */
    submitRegister: function (data, callback) {
        var result = {success: false};
        if (impl._checkValidData(data)) {
            var mail  = data.email;
            impl._updateRegisterInfo(data , function (success){
                if(success){
                    impl._selectAvailableAcc(data , function (success , account){
                        if(success && account){
                            impl._updateAccountInfo(data , account , function(success){
                                if(success){
                                    impl._syncMnagerInfo(data , account , function (success){
                                        if(success){
                                            //TODO

                                        } else {
                                            result.message = "sync account info error!";
                                            result.code = "04";
                                            callback(result);
                                        }
                                    });
                                } else {
                                    result.message = "update account status error!";
                                    result.code = "04";
                                    callback(result);
                                }
                            });
                        } else {
                            result.message = "get available account error!";
                            result.code = "02";
                            callback(result);
                        }
                    });
                } else {
                    result.message = "save submit data error!";
                    result.code = "04";
                    callback(result);
                }
            });
        } else {
            result.message = "提交数据异常！";
            result.code = "01";
            callback(result);
        }
    },
    addAccountViaProxy: function (data, session,callback) {
        var result = {success: false};
        var mail=data.linkManEmail;
        var pbx=data.pbx;
        data.pbx=[{pbx: pbx}];
        mongo.db().collection(constants.DB.bill_platform_mail_register).findOne({_id: mail}, function (err, dbMail) {
            if (!err) {
                if (!dbMail) {
                    dbMail = {
                        _id: mail,
                        key: utils.UUID.generateUuid(),
                        time: utils.DateTime.getCurrentDateTime(),
                        timestamp: utils.DateTime.getCurrentTimestamp(),
                        status: "proxy"//for proxy
                    };
                    mongo.db().collection(constants.DB.bill_platform_mail_register).insert(dbMail, function (err) {
                        if (!err) {
                            if(session.user.identity==constants.systemUserIndentity.proxy ||session.user.identity==constants.systemUserIndentity.hp){
                                data.createMethod=constants.accountCreateMethod.proxy;
                                data.payFlag=true;
                            }
                            accountHandler.createNewAccount(data, session,function (accountResult) {
                                if (accountResult.success){
                                    var ivrData = impl._createIvrData(accountResult.account);
                                    ivrData.pbx=pbx;
                                    ivrHandler.addAccount(ivrData, function (isSuccess) {
                                        if (isSuccess) {
                    //                        impl._updateRegisterStatus(data.email, "complete");
                                            result.success = true;
                                            callback(result);
                                            logger.app.info("proxy create account["+data.name+"] complete  success!");
                                        } else {
                                            result.message = "生成ivr信息异常！";
                                            logger.app.error("carete account ivr exception! account[" + accountResult._id + "]");
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.error("proxy create account error!", new Error(""));
                                    callback(accountResult);
                                }
                            });
                        } else {
                            logger.app.error("insert mail to db error!", err);
                            result.message = "系统异常，无法处理该请求！";
                            callback(result);
                        }
                    });
                } else {
                    logger.app.warn(mail + "：已经存在！");
                    result.message = "邮箱已被注册！";
                    callback(result);
                }
            } else {
                logger.app.error("check mail from db error!", err);
                result.message = "系统异常，无法检查邮箱地址！";
                callback(result);
            }
        });
    },
    findEmailByKey: function (data, callback){
        var result = {success: false};
        var find = {key: data.key};
        mongo.db().collection(constants.DB.bill_platform_mail_register).findOne(data, function (err,doc){
            console.log(err);
            console.log(doc);
            if(err){
                callback(result);
            }else{
                if(doc){
                    result.succes = true;
                    result.doc = doc;
                    callback(result);
                    return;
                }else{
                    callback(result);
                }
            }
        });
    },
    rl7mWebSiteMobileCode: function(data, callback){
        var result = {success:false};
        console.log(utils.DateTime.getCurrentTimestamp());
        console.log(data);
        var find = {_id: data.id};
        mongo.db().collection(constants.DB.bill_platform_mail_register).findOne(find, function(err, doc){
            if(err || !doc){
                result.code = '01'
                result.message = "resgister not found!";
                callback(result);
                return;
            }
            var curTime = utils.DateTime.getCurrentTimestamp();
            if(doc.mobileCodeTime){
               if(curTime - doc.mobileCodeTime < 58 *1000){
                   result.code = '02';
                   result.message = "time too short ,don't send again!";
                   callback(result);
                   return;
               }
            }
            var mobileCode = "";
            for(var i=0;i<6;i++)
            {
                mobileCode += Math.floor(Math.random()*10);
            }
            var update = {$set: {mobileCode: mobileCode, mobileCodeTime: curTime}};
            mongo.db().collection(constants.DB.bill_platform_mail_register).update(find, update, function(err){
                if(err){
                   result.code = '05';
                   result.message = 'server error!';
                   callback(result);
                   return;
                }
                var smsData = {
                    account: 'N00000002272',
                    password: 'bvff334f3x5ids',
                    num: data.mobile,
                    sign: '七陌科技',
                    content: "您的验证码是"+mobileCode
                }
                interfaceSmsService.sendInterfaceSms(smsData, function(res){
                    if(res.success){
                        result.code = '00';
                        result.success = true;
                        callback(result);
                    }else{
                        callback(result);
                    }
                });
            });
        });
    },
    /**
     * @param data {mobile:手机号码}
     * @param callback
     */
    rl7mWebSiteYZMSmsTry: function(data, callback){
        var result = {success: false};
        var curDay = utils.DateTime.getCurrentDate();
        mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                callback(result);
                return;
            }
            if(doc && doc[curDay] >= 3){
                result.message = '您今天已体验3次，请明天再试!：）';
                callback(result);
                return;
            }
            var smsData = {
                account: 'N00000002272',
                //account: 'N00000000143',
                //password: '123abc',
                password: 'bvff334f3x5ids',
                num: data.mobile,
                sign: '七陌科技',
                content: "您于"+utils.DateTime.getCurrentTime()+" 体验了容联七陌短信验证码。"
            }
            console.log(smsData);
            interfaceSmsService.sendInterfaceSms(smsData, function(res){
                if(res.success){
                    var updateDoc = {$inc:{}};
                    updateDoc['$inc'][curDay] = 1;
                    mongo.db().collection('web_site_yzm_product_try_record').update({_id:data.mobile}, updateDoc,{upsert:true},function(err){
                        result.success = true;
                        callback(result);
                    });
                }else{
                    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                    callback(result);
                }
            });
        })
    },
    /**
     * 短信验证码/预约通知
     * @param data {mobile:手机号码}
     * @param callback
     */
    rl7mWebSiteYZMWebCallTryMobileCode: function(data, callback){
        var result = {success: false};

        var curDay = "pln_"+utils.DateTime.getCurrentDate();
        //var curDay = "";
        //if(data.msg){
        //    curDay = "msg_"+utils.DateTime.getCurrentDate();
        //}else{
        //    curDay = "pln_"+utils.DateTime.getCurrentDate();
        //}

        mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                callback(result);
                return;
            }
            if(doc && doc[curDay] >= 3){
                result.message = '您今天已体验3次，请明天再试!：）';
                callback(result);
                return;
            }
            var curTime = utils.DateTime.getCurrentTimestamp();
            if(doc && doc.mobileCodeTime){
                if(curTime - doc.mobileCodeTime < 58 *1000){
                    result.code = '02';
                    result.message = "time too short ,don't send again!";
                    callback(result);
                    return;
                }
            }

            var mobileCode = "";
            var content = "";
            if(data.msg){
                //content = data.msg;
            }else{
                for(var i=0;i<6;i++){
                    mobileCode += Math.floor(Math.random()*10);
                }
                content = "您的验证码是 "+mobileCode;
            }
            var update = {$set:{voiceMobileCode:{mobileCode: mobileCode, mobileCodeTime: curTime}}};
            var smsData = {
                account: 'N00000002272',
                //account: 'N00000000143',
                //password: '123abc',
                password: 'bvff334f3x5ids',
                num: data.mobile,
                sign: '七陌科技',
                content:content
            }
            interfaceSmsService.sendInterfaceSms(smsData, function(res){
                if(res.success){
                    update['$inc'] = {};
                    update['$inc'][curDay] = 1;
                    mongo.db().collection('web_site_yzm_product_try_record').update({_id:data.mobile}, update,{upsert:true},function(err){
                        result.success = true;
                        callback(result);
                    });
                }else{
                    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                    callback(result);
                }
            });
        })
    },
    /**
     * 语音验证码
     * @param data {mobile:手机号码}
     * @param callback
     */
    rl7mWebSiteYZMWebCallTryMobileVoiceCode: function(data, callback){
        var result = {success: false};
        var curDay = "voice_"+utils.DateTime.getCurrentDate();
        mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                callback(result);
                return;
            }
            if(doc && doc[curDay] >= 3){
                result.message = '您今天已体验3次，请明天再试!：）';
                callback(result);
                return;
            }
            var curTime = utils.DateTime.getCurrentTimestamp();
            if(doc && doc.mobileCodeTime){
                if(curTime - doc.mobileCodeTime < 58 *1000){
                    result.code = '02';
                    result.message = "time too short ,don't send again!";
                    callback(result);
                    return;
                }
            }
            var mobileCode = "";
            var mobileCodeVoice = "";
            for(var i=0;i<6;i++){
                var num = Math.floor(Math.random()*10);
                mobileCode += num.toString()
                mobileCodeVoice += num.toString()+"，";
            }
            var update = {$set:{voiceMobileCode:{mobileCode: mobileCode, mobileCodeTime: curTime}}};

            mongo.db().collection("web_site_yzm_product_try_record").update({_id: data.mobile},{$unset:{'voiceMobileCode.mobileCode':1}}, function (err) {});

            var webcallUrl = "http://121.40.230.165/command?Action=Webcall&PBX=bj.ykf.1.3&Account=N00000002272&ServiceNo=01011111235&Exten="+data.mobile+"&Variable=vioce:您的验证码是:"+mobileCodeVoice;
            //webcallUrl = encodeURI(webcallUrl);
            httpProvider.sendGet(encodeURI(webcallUrl),function(res){
                console.log(res);

                //if(res.success){
                    update['$inc'] = {};
                    update['$inc'][curDay] = 1;
                    mongo.db().collection('web_site_yzm_product_try_record').update({_id:data.mobile}, update,{upsert:true},function(err){
                        result.success = true;
                        callback(result);
                    });
                //}else{
                //    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                //    callback(result);
                //}
            });
        })
    },
    /**
     * 验证码验证
     * @param data {mobile:手机号码, code:收到的短信验证码}
     * @param callback
     */
    rl7mWebSiteYZMWebCallTry: function(data, callback){
        var result = {success: false};
        var code = data.code || "";
        mongo.db().collection("web_site_yzm_product_try_record").findOne({_id: data.mobile}, function (err, doc) {
            if (!err && doc) {
                var curTime = utils.DateTime.getCurrentTimestamp();
                if(doc.voiceMobileCode.mobileCodeTime){
                    if(curTime - doc.voiceMobileCode.mobileCodeTime > 5*60*1000){
                        result.code = '01';
                        result.message = '验证码已超时，请重新获取！请在获取验证码5分钟内点击体验！';
                        callback(result);
                        return;
                    }
                }
                if (doc.voiceMobileCode.mobileCode == code) {
                    var curDay = "voice_"+utils.DateTime.getCurrentDate();
                    if(doc[curDay] >= 3){
                        result.message = '您今天已体验3次，请明天再试!：）';
                        callback(result);
                        return;
                    }
                    result.success = true;
                    callback(result);

                    //mongo.db().collection("web_site_yzm_product_try_record").update({_id: data.mobile},{$unset:{'voiceMobileCode.mobileCode':1}}, function (err) {});
                    //
                    //var webcallUrl = "http://120.55.72.213:7780/command?Action=Webcall&PBX=1.1.1.101&Account=N00000000143&ServiceNo=01058010159&Exten="+data.mobile;
                    //httpProvider.sendGet(webcallUrl,function(res){
                    //    console.log(res);
                    //});
                } else {
                    result.code = '03';
                    result.message = "验证码不正确请重新输入！";
                    callback(result);
                }
            } else {
                result.message = "请先获取短信验证码！";
                callback(result);
            }
        });
    },
    /**
     * 自助充值流程
     * @param data {mobile:手机号码}
     * @param callback
     */
    rl7mWebSiteYZMWebCallTryCard: function(data, callback){
        var result = {success: false};
        var curDay = "card_"+utils.DateTime.getCurrentDate();
        mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                callback(result);
                return;
            }
            if(doc && doc[curDay] >= 3){
                result.message = '您今天已体验3次，请明天再试!：）';
                callback(result);
                return;
            }
            var curTime = utils.DateTime.getCurrentTimestamp();
            if(doc && doc.mobileCardTime){
                if(curTime - doc.mobileCardTime < 58 *1000){
                    result.code = '02';
                    result.message = "time too short ,don't send again!";
                    callback(result);
                    return;
                }
            }
            var update = {$set:{voiceMobileCode:{mobileCardTime: curTime}}};

            mongo.db().collection("web_site_yzm_product_try_record").update({_id: data.mobile},{$unset:{'voiceMobileCode.mobileCardTime':1}}, function (err) {});

            var webcallUrl = "http://121.40.230.165/command?Action=Webcall&PBX=bj.ykf.1.3&Account=N00000002272&WebCallType=asynchronous&CallBackUrl=http://www.7moor.com/&ServiceNo=01011111371&Exten="+data.mobile;
            //webcallUrl = encodeURI(webcallUrl);
            httpProvider.sendGet(encodeURI(webcallUrl),function(res){
                console.log(res);
                //if(res.success){
                update['$inc'] = {};
                update['$inc'][curDay] = 1;
                mongo.db().collection('web_site_yzm_product_try_record').update({_id:data.mobile}, update,{upsert:true},function(err){
                    result.success = true;
                    callback(result);
                });
            });
        })
    },
    /**
     * 匿名通话
     * @param data {mobile1:猎头者号码,mobile2:求职者号码}
     * @param callback
     */
    rl7mWebSiteCryptonym: function(data, callback){
        var result = {success: false};
        var curDay = "cryptonym_"+utils.DateTime.getCurrentDate();
        mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile1},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                callback(result);
                return;
            }
            if(doc && doc[curDay] >= 3){
                result.message = '猎头号码今天已体验3次，请明天再试!：）';
                callback(result);
                return;
            }
            var curTime = utils.DateTime.getCurrentTimestamp();
            if(doc && doc.mobileCodeTime){
                if(curTime - doc.mobileCodeTime < 58 *1000){
                    result.code = '02';
                    result.message = "time too short ,don't send again!";
                    callback(result);
                    return;
                }
            }
            mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile2},function(err, doc){
                if(err){
                    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                    callback(result);
                    return;
                }
                if(doc && doc[curDay] >= 3){
                    result.message = '求职者号码今天已体验3次，请明天再试!：）';
                    callback(result);
                    return;
                }
                var curTime = utils.DateTime.getCurrentTimestamp();
                if(doc && doc.mobileCodeTime){
                    if(curTime - doc.mobileCodeTime < 58 *1000){
                        result.code = '02';
                        result.message = "time too short ,don't send again!";
                        callback(result);
                        return;
                    }
                }

                var update = {};

                var webcallUrl = "http://121.40.230.165/command?Action=Webcall&PBX=bj.ykf.1.3&Account=N00000002272&ServiceNo=01011111236&Exten="+data.mobile1+"&Variable=phoneNum:"+data.mobile2;
                httpProvider.sendGet(webcallUrl,function(res){
                    console.log(res);

                    //if(res.success){
                        update['$inc'] = {};
                        update['$inc'][curDay] = 1;
                        var or =
                        mongo.db().collection('web_site_yzm_product_try_record').update({_id:{"$in":[data.mobile1,data.mobile2]}}, update,{upsert:true},function(err){
                            result.success = true;
                            callback(result);
                        });
                    //}else{
                    //    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                    //    callback(result);
                    //}
                });
            });
        })
    },
    /**
     * 预约语音确认功能
     * @param data {mobile:手机号码,msg:语音确认内容,place:选的店铺}
     * @param callback
     */
    rl7mWebSiteYZMWebCallTryMobileVoiceMakeSure: function(data, callback){
        var result = {success: false};
        var curDay = "msg_"+utils.DateTime.getCurrentDate();
        mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                callback(result);
                return;
            }
            if(doc && doc[curDay] >= 3){
                result.message = '求职者号码今天已体验3次，请明天再试!：）';
                callback(result);
                return;
            }
            var curTime = utils.DateTime.getCurrentTimestamp();
            if(doc && doc.mobileCodeTime){
                if(curTime - doc.mobileCodeTime < 58 *1000){
                    result.code = '02';
                    result.message = "time too short ,don't send again!";
                    callback(result);
                    return;
                }
            }

            var update = {};
            mongo.db().collection("web_site_yzm_product_try_record").update({_id: data.mobile},{$unset:{'voiceMobileCode.mobileCode':1}}, function (err) {});

            var webcallUrl = "http://121.40.230.165/command?Action=Webcall&PBX=bj.ykf.1.3&Account=N00000002272&ServiceNo=01011111237&Exten="+data.mobile+"&Variable=msg:"+data.msg+",place:"+data.place;
            //webcallUrl = encodeURI(webcallUrl);
            httpProvider.sendGet(encodeURI(webcallUrl),function(res){
                console.log(res);

                //if(res.success){
                update['$inc'] = {};
                update['$inc'][curDay] = 1;
                mongo.db().collection('web_site_yzm_product_try_record').update({_id:data.mobile}, update,{upsert:true},function(err){
                    result.success = true;
                    callback(result);
                });
                //}else{
                //    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                //    callback(result);
                //}
            });
        })
    },
    /**
     * 免费客服电话体验
     * @param data {phone:体验者号码}
     * @param callback
     */
    rl7mWebSiteWbcallTry: function(data, callback){
        var result = {success: false};
        var curDay = "webcall_"+utils.DateTime.getCurrentDate();
        mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.phone},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                callback(result);
                return;
            }
            if(doc && doc[curDay] >= 3){
                result.message = '免费客服电话今天已体验3次，请明天再试!：）';
                callback(result);
                return;
            }
            var curTime = utils.DateTime.getCurrentTimestamp();
            if(doc && doc.mobileCodeTime){
                if(curTime - doc.mobileCodeTime < 58 *1000){
                    result.code = '02';
                    result.message = "time too short ,don't send again!";
                    callback(result);
                    return;
                }
            }

            var update = {};

            var webcallUrl = "http://119.254.80.104/command?Action=Webcall&Account=N00000000011&WebCallType=asynchronous&CallBackUrl=http://www.7moor.com/&PBX=dh.pbx.3.0&ServiceNo=01050854164&Exten="+data.phone;
            httpProvider.sendGet(webcallUrl,function(res){
                console.log(res);

                update['$inc'] = {};
                update['$inc'][curDay] = 1;
                mongo.db().collection('web_site_yzm_product_try_record').update({_id:data.phone}, update,{upsert:true},function(err){
                    result.success = true;
                    callback(result);
                });
            });
        })
    }
};

var impl = {
    _getAccountInfo : function (dbMail , callback){
        var info = {};
        var accountId = dbMail.bingAcc;
        mongo.db().collection(constants.DB.platform_account).findOne({_id:accountId},function(err , dbAccount){
                if(!err && dbAccount){
                    info.companyName = dbAccount.companyName;
                    mongo.db().collection(constants.DB.platform_serviceNum).findOne({account:dbAccount._id,product:'cc'},function(err , dbServiceNo){
                        if(!err && dbServiceNo){
                            info.servcieNo = dbServiceNo._id;
                            mongo.db().collection(constants.DB.platform_user).find({account:dbAccount._id},{sort:{exten:1}}).toArray(function(err , agents){
                                if(!err && agents){
                                    if(agents.length > 0){
                                        info.manager = {
                                            user : agents[0].exten + "@" + dbAccount.name,
                                            passWd : agents[0].password
                                        };
                                        if(agents.length > 1){
                                            if(agents.length =2){
                                                info.agents = {
                                                    user : agents[1].exten + "@" + dbAccount.name,
                                                    passWd: agents[1].password
                                                }
                                            } else {
                                                info.agents = {
                                                    user : agents[1].exten + "@" + dbAccount.name + " ~ " + agents[agents.length -1].exten + "@" + dbAccount.name,
                                                    passWd: agents[1].password + " ~ " + agents[agents.length -1].password
                                                }
                                            }
                                        }
                                        info.loginUrl = "http://cc.7moor.com";
                                        callback(info);
                                    } else {
                                        logger.app.error("not found account ["+dbAccount._id + "] agents!");
                                        callback(false);
                                    }
                                } else {
                                    logger.app.error("not found account ["+dbAccount._id + "] agents!");
                                    callback(false);
                                }
                            });
                        } else {
                            logger.app.error("not found account ["+dbAccount._id + "] serviceNo!");
                            callback(false);
                        }
                    });
                } else {
                    logger.app.error("not found account by id :[" + accountId + "]");
                    callback(false);
                }
        });


    },
    _sysnAgentInfo : function (dbMail , callback){
        var urlData = {
            account : dbMail.bingAcc,
            exten : "8000",
            displayName : dbMail.subData.linkManName,
            email : dbMail._id,
            mobile : dbMail.subData.linkManPhone
        };
        var url=config.ccServerUrl+"service?action=openThirdPartyEditUser&data="+JSON.stringify(urlData);
        url=encodeURI(url);
        httpProvider.sendGet(url, function(err, result){
            if(!err){
                var res = JSON.parse(result);
                if(res.success){
                    callback(true);
                } else {
                    logger.app.error(' _syncAgentInfo process failed!', err);
                    callback(false);
                }
            } else {
                logger.app.error(' _syncAgentInfo net access failed!', err);
                callback(false);
            }
        });
    },

    _syncCCAcs: function (account, callback) {
       mongo.db().collection(constants.DB.platform_account).findOne({_id:account},function(err , dbAccount){
           if(!err && dbAccount){
               var name = dbAccount.name || "";
               var url=config.ccServerUrl+"service?action=modifyAccountName&data="+JSON.stringify({"account":account,"name":name});
               url=encodeURI(url);
               httpProvider.sendGet(url, function(err, result){
                   if(!err){
                       var res = JSON.parse(result);
                       if(res.success){
                           mongo.db().collection(constants.DB.platform_account_product).findOne({_id:account + "_cc"},function(err,dbProduct){
                                if(!err){
                                    var pbxInfo = dbProduct.pbx;
                                    for (var i = 0; i < pbxInfo.length; i++) {
                                        pbxInfo[i].DisplayName = name;
                                    }
                                    mongo.db().collection(constants.DB.platform_account_product).update({_id: account + "_cc"}, {$set:{name:name,pbx:pbxInfo}},{w: 1}, function (err) {
                                        if (!err) {
                                            callback(true);
                                        } else {
                                            logger.app.error("update account product name to db error!", err);
                                            callback(false);
                                        }
                                    });
                                } else {
                                    logger.app.error(' update account product name to db error!', err);
                                    callback(false);
                                }
                           });
                       } else {
                           logger.app.error(' _syncCCAccName process failed!', err);
                           callback(false);
                       }
                   } else {
                       logger.app.error(' _syncCCAccName net access failed!', err);
                       callback(false);
                   }
               });
           } else {
               logger.app.error("not found account by id :[" + account + "]");
               callback(false);
           }
       });
    },
    _initAccountResource : function (account , callback){
        var accountId = account._id;
        var now = utils.DateTime.getCurrentDate();
        var endTime = impl._addDateMonth(now , 1);
        mongo.db().collection(constants.DB.platform_serviceNum).update({account:accountId},{$set:{status:constants.serviceNumStatus.try,endTime:endTime}},function(err){
            if(!err){
                callback(true);
            } else {
                logger.app.error("not found account [" + accountId + "] service num!");
                callback(false);
            }
        });
    },
    _addDateMonth : function (date , num){
        var dates = date.split("-");
        var year = dates[0];
        var month = dates[1];
        var day = dates[2];

        if(month.substring(0,1) == '0'){
            month = month.substring(1);
        }
        if((Number(month) + num) > 12){
            year = Number(year) + 1;
            month = (Number(month) + num)-12;
        } else {
            month = Number(month) + num;
        }
        month = month > 9 ? month : '0' + month;
        return year + "-" + month + "-" + day;
    },
    _selectAvailableAcc : function ( data , callback){
        var area = data.area;
        mongo.db().collection(constants.DB.platform_account).findAndModify({status:"free",createMethod:'www',area:area},{_id:1},{$set:{status:"try"}},null,function(err , dbAccount){
            if(!err && dbAccount){
                var update = {
                    linkManEmail : data._id,
                    linkManName : data.linkManName,
                    linkManPhone : data.linkManPhone,
                    companyName : data.companyName,
                    name : data.domain,
                    initTime : utils.DateTime.getCurrentDateTime()
                };
                mongo.db().collection(constants.DB.platform_account).update({_id:dbAccount._id},{$set: update},function(err){
                    if(!err){
                        appEvent.emitOperationReportEvent(appEvent.EventType.NEW_ACCOUNT, data);

                        mongo.db().collection(constants.DB.bill_platform_mail_register).update({_id: data._id}, {$set: {status : 'selectAccount',bingAcc:dbAccount._id,lastUpdateTime:utils.DateTime.getCurrentDateTime()}}, function (err) {
                            if (!err) {
                                callback(dbAccount);
                            } else {
                                logger.app.error("save regiester account error!" , err);
                                callback(false);
                            }
                        });
                    } else {
                        logger.app.error("update account info error!", err);
                        callback(false);
                    }
                });
            } else {
                logger.app.error("slect available account error!");
                callback(false);
            }
        });
    },


    _updateRegisterInfo: function (data, callback) {
        var mail = data.email;
        var update = {
            companyName : data.companyName,
            linkManName : data.linkManName,
            linkManPhone : data.linkManPhone,
            area : data.area
        };
        mongo.db().collection(constants.DB.bill_platform_mail_register).update({_id: mail}, {$set: {subData:update , status : 'submit',lastUpdateTime:utils.DateTime.getCurrentDateTime()}}, function (err) {
            if (!err) {
                callback(true);
            } else {
                logger.app.error("save submit data error!" , err);
                callback(false);
            }
        });
        var sendMail = {
            toAddr: ['service@7moor.com'],
            ccAddr:['service@7moor.com'],
            subject: "容联七陌.云客服提交注册信息",
            type: "registe",
            status: "undeal"
        };
        var submitData = data;
        fs.readFile(__baseDir + "/views/mailTmp/submitData.html", function (err, data) {
            if (!err) {
                data = new String(data);
                data = data.replace(/_#companyName#_/,submitData.companyName );
                data = data.replace(/_#linkMan#_/,submitData.linkManName );
                data = data.replace(/_#phone#_/,submitData.linkManPhone );
                data = data.replace(/_#area#_/,submitData.area );
                sendMail.content = data;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                    if (err) {
                        logger.app.error("send submit into mail error!");
                    }
                });
            } else {
                logger.app.error("mail templete[submitData] not found!", err);
            }
        });


    },
    _createIvrData: function (account) {
        var ivrData = {
            _id: account._id,
            name: account.name,
            companyName: account.companyName,
            linkManPhone:account.linkManPhone
        };
        return ivrData;
    },
    _createAccountData: function (data) {
        var account = {
            companyName: data.companyName,
            createMethod: "register",
            linkManEmail: data.email,
            linkManName: data.userName,
            linkManPhone: data.mobile,
            name: data.domain,
            managerPassword: data.password
        }
        return account;
    },
    _createRegisterSession: function (data) {
        var session = {
            _id: data.email,
            user: {
                _id: data.email,
                name: data.userName
            }
        };
        return session;
    },
    _checkValidData: function (data) {
        if (data.email && data.key && data.companyName && data.linkManName && data.linkManPhone && data.area) {
            //TODO
            return true;
        }
        return false;
    },
    _validMailId : function (mail , key , callback){
        mongo.db().collection(constants.DB.bill_platform_mail_register).findOne({_id:mail},function(err , dbMail){
            if(!err && dbMail){
                if(utils.md5(mail+key) == dbMail.md5){
                    callback(dbMail);
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        });
    },
    _isValidTime: function (mail) {
        var sendTime = mail.timestamp;
        var now = new Date().getTime();
        var time = now - sendTime;
        if (time > 24 * 60 * 60 * 1000 || mail.status != "ready") {
            return false;
        } else {
            return true;
        }
    },
    _sendKtdToAccount : function (mail , key, accountInfo){
        var sendMail = {
            toAddr: [mail],
            subject: "欢迎开通容联七陌.云客服",
            type: "registe",
            ccAddr: [config.proxyMail],
            status: "undeal",
            registeKey: key
        };
        fs.readFile(__baseDir + "/views/mailTmp/ktd.html", function (err , data ){
            if(!err){
                data = new String(data).toString();
                data = data.replace(/#\{companyName\}/g,accountInfo.companyName);
                data = data.replace("#{servcieNo}",accountInfo.servcieNo);
                data = data.replace(/#\{loginUrl\}/g,accountInfo.loginUrl);
                data = data.replace("#{manager.user}",accountInfo.manager.user);
                data = data.replace("#{manager.passWd}",accountInfo.manager.passWd);
                data = data.replace("#{agents.user}",accountInfo.agents.user);
                data = data.replace("#{agents.passWd}",accountInfo.agents.passWd);
                sendMail.content = data;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                    if (!err) {
                          logger.app.info("insert to send mail to db success!");
//                        result.success = true;
//                        result.code = "00";
//                        callback(result);
                    } else {
                        logger.app.error("insert to send mail to db error!", err);
//                        result.code = "04";
//                        callback(result);
                    }
                });
            } else {
                logger.app.error("mail templete[ktd] not found!", err);
            }
        });
    },
    _processMailRegister: function (mail, result, callback) {
        var sendMail = {
            toAddr: [mail._id],
            subject: "欢迎注册容联七陌.云客服",
            type: "registe",
            ccAddr: [config.proxyMail],
            status: "undeal",
            registeKey: mail.key
        };
        fs.readFile(__baseDir + "/views/mailTmp/regMail.html", function (err, data) {
            if (!err) {
                //var url = config.registeUrl + '/public?action=register.completeRegiste&data={"key":"' + mail.key + '"}';
                var url = config.registeUrl + '/rest/v1/register/completeRegiste/'+mail.key;
                data = new String(data);
                data = data.replace(/_#url#_/g, encodeURI(url));
                sendMail.content = data;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        result.code = "00";
                        callback(result);
                    } else {
                        logger.app.error("insert to send mail to db error!", err);
                        result.code = "04";
                        callback(result);
                    }
                });
            } else {
                logger.app.error("mail templete[completeReg] not found!", err);
                result.message = "mail templete[completeReg] not found!";
                result.code = "04";
                callback(result);
            }
        });

    }
}


module.exports = handler;
