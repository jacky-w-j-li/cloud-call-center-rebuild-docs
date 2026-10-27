/**
 * Created by zhangyang on 15/3/5.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var dateTimeUtils = require('appUtil/DateTime');
var appHttp = require('appHttp');
var config = require('appConfig');
var filingYunHandler = require(__baseDir + '/7moor/resource/FilingYunHandler');
var IPPool = require(__baseDir + '/models/IPPool');
var AccountProduct = require(__baseDir + '/models/AccountProduct');
var Intl = require(__baseDir + '/models/Intl');
var Agent = require(__baseDir + '/models/Agent');
var Then = require('thenjs');

var handler = {
    query400Status : function (data , callback){
        var result = {success: false};
        var account = data.account || ""; //代理账户
        var num = data.num || "";

        mongo.db().collection(constants.DB.system_user).findOne({loginName:account},function(err,dbAccount){
            if(!err && dbAccount){
                var owner = dbAccount._id;
                var condition = {
                    owner:owner,
                    _id : new RegExp(num)
                };

                mongo.db().collection(constants.DB.platform_num400).find(condition,{_id:1,status : 1}).toArray(function(err,nums){
                    if(!err){
                        nums = nums || [];
                        var data = {
                            count : nums.length,
                            num : nums
                        };
                        result.success = true;
                        result.data = data;
                        callback(result);
                    } else {
                        logger.app.warn("find proxy num400 error!",err);
                        result.message = "can not found valid num!";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("can not found valid account!",err);
                result.message = "can not found valid account!";
                callback(result);
            }
        });
    },
    getCCAccountsByProxy : function (data, callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.system_user).findOne({loginName:data.proxyName, identity:constants.systemUserIndentity.proxy},function(err,proxyer){
            if(!err && proxyer){
                var owner = proxyer._id;
                var condition = {
                    createUser: owner,
                    createMethod: 'proxy'
                };
                var returnDoc = {
                    _id:1,
                    name:1,
                    companyName:1,
                    managerPassword:1,
                    linkManEmail: 1,
                    linkManName: 1,
                    linkManPhone: 1,
                    balance:1
                }
                mongo.db().collection(constants.DB.platform_account).find(condition, returnDoc).toArray(function(err,accs){
                    if(!err){
                        if(accs.length > 0){
                            var endList = [];
                            handler._curgetCCInfoByAcc(accs, endList, function(res){
                                if(res.success){
                                    result.success = true;
                                    result.data = res.data;
                                    callback(result);
                                }else{
                                    callback(res);
                                }
                                return;
                            });
                        }
                    } else {
                        result.message = "401 this proxy["+data.proxyName+"] not has children account!";
                        callback(result);
                    }
                });
            } else {
                result.message = "400 not found this proxy proxyName["+data.proxyName+"] !";
                callback(result);
            }
        });
    },
    _curgetCCInfoByAcc: function(list, endList ,callback){
        var result = {
            success: false
        }
        if(list.length>0){
            var cur = list.shift();
            var returnDoc = {
                balance:1,
                'pbx.PBX':1,
                'pbx.NickName':1,
                'pbx.IsDialoutIntegration':1,
                'pbx.IsTransferIntegration':1,
                'pbx.DispatcherResend':1
            };
            mongo.db().collection(constants.DB.platform_account_product).findOne({_id: cur._id+'_cc'},returnDoc ,function(err,accCC){
                if(!err){
                    if(accCC){
                        cur.callBalance = accCC.balance;
                        cur.pbx = accCC.pbx;
                        endList.push(cur);
                    }
                    handler._curgetCCInfoByAcc(list, endList, callback);
                } else {
                    result.message = "501 find account cc product err!";
                    callback(result);
                }
            });
        }else{
            result.success = true;
            result.data = endList;
            callback(result);
        }
    },
    getCCServiceNoByAcc : function(data, callback){
        var result = {success:false};
        var returnDoc = {
            "DisplayName" : 1,
            "Exten" : 1,
            "PBX" : 1
        }
        mongo.db('cc').collection('manager_ivr_service_no').find({Account: data.account}, returnDoc).toArray(function(err,noList){
            if(!err){
                result.success = true;
                result.data = noList;
            } else {
                result.message = "501 find account service no err!";
            }
            callback(result);
        });
    },
    getCCAgentsByAcc : function(data, callback){
        var result = {success:false};
        var returnDoc = {
            "AutoBusyTime" : 1,
            "callerIDNum" : 1,
            "displayName" : 1,
            "email" : 1,
            "exten" : 1,
            "loginName" : 1,
            "mobile" : 1,
            "parentId" : 1,
            "password" : 1,
            "pbx" : 1,
            "role" : 1,
            "status" : 1,
            "type" : 1,
            "uversion" : 1
        }
        mongo.db().collection('platform_user').find({account: data.account}, returnDoc).toArray(function(err,noList){
            if(!err){
                result.success = true;
                result.data = noList;
            } else {
                result.message = "501 find account agents err!";
            }
            callback(result);
        });
    },
    getCCBalance:function(data,callback){
        var result = {success:false};
        var username = data.loginName || "";
        var password = data.password || "";
        var condition = {managerPassword:password,status:{$in:[constants.accountStatus.newTry,constants.accountStatus.normal]}};
        if(username.indexOf("@") !== -1){
            condition.linkManEmail = username;
        }else {
            condition.name = username;
        }
        mongo.db().collection(constants.DB.platform_account).findOne(condition,function(err,dbAccount) {
            if (!err && dbAccount) {
                var accountId = dbAccount._id;
                mongo.db().collection(constants.DB.platform_account_product).findOne({_id:accountId+"_cc"},function(err,dbProduct) {
                    if(!err && dbProduct){
                        var balance = utils.formatTrueFee(dbProduct.balance);
                        var data = {
                            accountId:dbProduct.account,
                            loginName:username,
                            //product:dbProduct.product,
                            balance:balance
                        };
                        result.success = true;
                        result.message = "操作成功!";
                        result.result = "200";//状态码：成功
                        result.data = data;
                        callback(result);
                    }else{
                        result.message = '请求的账户没有开通呼叫中心产品!';
                        result.result = "404";
                        callback(result);
                    }
                });
            } else {
                result.message = '请检查登录名或密码是否正确!';
                result.result = "401";
                callback(result);
            }
        });
    },
    getCCCdr:function(data,callback){
        var result = {success:false};
        if(!data.account){
            result.message = "account must need!";
            callback(result);
            return;
        }
        if(!data.beginTime || !data.endTime){
            result.message = "beginTime and endTime must need!";
            callback(result);
            return;
        }
        var sort = {OFFERING_TIME: -1};
        utils.removeEmptyProperty(data);
        mongo.db().collection('openService_request_log').findOne({account:data.account, type:'getCCCdr'}, function (err, doc) {
            if(err || !doc){
                var insertDoc = {_id: utils.UUID.generateUuid(),account:data.account, type:'getCCCdr',
                    createTime: dateTimeUtils.getCurrentDate(), lastUpdateTime: dateTimeUtils.getCurrentTimestamp()};
                mongo.db().collection('openService_request_log').insert(insertDoc, function (err, doc) {});
            }else{
                if(dateTimeUtils.getCurrentTimestamp() - doc.lastUpdateTime < 60 * 1000){
                    result.message = "Request is too frequent, 60s once request!";
                    callback(result);
                    return;
                }
                mongo.db().collection('openService_request_log').update({_id:doc._id}, {$set:{lastUpdateTime:dateTimeUtils.getCurrentTimestamp()}}, function (err, doc) {});
            }
            mongo.db().collection(constants.DB.platform_account_product).findOne({_id:data.account+'_cc'}, function(err, account){
                if(err || !account){
                    result.message = "account not found!";
                    callback(result);
                    return;
                }
                var find = {};
                if(!Date.parse(data.beginTime) || !Date.parse(data.endTime)){
                    result.message = "beginTime or endTime format error!";
                    callback(result);
                    return;
                }
                if(dateTimeUtils.getDifferenceTime(data.endTime, data.beginTime) > 7*24*60*60){
                    result.message = "beginTime and endTime must within a week!";
                    callback(result);
                    return;
                }
                find.OFFERING_TIME  = {$gte:data.beginTime, $lte: data.endTime};
                if(data.callNo && data.callNo!=''){
                    find.CALL_NO = data.callNo;
                }
                if(data.calledNo && data.calledNo!=''){
                    find.CALLED_NO = data.calledNo;
                }
                if(data.connectType && data.connectType!=''){
                    find.CONNECT_TYPE = data.connectType;
                }
                if(data.status && data.status!=''){
                    find.STATUS = data.status;
                }
                var returnDoc = {
                    "CALL_SHEET_ID": 1,
                    "CALL_NO": 1,
                    "STATUS": 1,
                    "DISPOSAL_AGENT": 1,
                    "BEGIN_TIME": 1,
                    "END_TIME": 1,
                    "CALLED_NO": 1,
                    "OFFERING_TIME": 1,
                    "CONNECT_TYPE": 1,
                    "RECORD_FILE_NAME": 1,
                    "CUSTOMER_NAME": 1,
                    "REF_CALL_SHEET_ID": 1,
                    "PBX": 1,
                    "QUEUE_NAME": 1,
                    "FILE_SERVER": 1,
                    "PROVINCE": 1,
                    "DISTRICT": 1,
                    "DISTRICT_CODE": 1,
                    "KEY_TAG": 1,
                    "CALL_TIME_LENGTH": 1,
                    "PREMEDIA_MEMO" : 1,
                    "PREMEDIA_KEY" : 1
                };
                if(data.cdrVar){
                    returnDoc[data.cdrVar] = 1;
                }
                mongo.db(account.dataDB).collection(data.account + '_c5_call_sheet').find(find,returnDoc, {sort:sort}).toArray(function (err, docs) {
                    if (err) {
                        logger.app.error(err);
                        callback(result);
                        return;
                    }
                    result.success = true;
                    result.data = docs;
                    callback(result);
                });
            });
        });
    },
    flowPackage: function(data, callback){
        var result = {success:false};
        if(!data.account){
            result.message = 'account字段必传';
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:data.account+'_ll'}, function(err, doc){
            if(err){
                result.message = '服务端异常';
                callback(result);
                return;
            }
            if(!doc){
                result.message = 'account字段有误或账户未开通流量产品';
                callback(result);
                return;
            }
            var time = utils.DateTime.getDateFormat2(new Date());
            var sigParameter = utils.md5("aaf98f894ecd7d6a014ed906116b12bcbe7d06a2c2314ec9bae18c9655b9798d"+time);
            var url = "https://app.cloopen.com:8883/2013-12-26/Accounts/aaf98f894ecd7d6a014ed906116b12bc/flowPackage/flowPackage?sig="+sigParameter.toUpperCase();
            var sendData = {"phoneNum":data.phoneNum};
            appHttp.sendYTXSSLPost(url, sendData, time, function(err, res){
                if(err){
                    result.message = '服务端异常';
                    callback(result);
                    return;
                }
                res = JSON.parse(res + "");
                if(res.statusCode == '000000'){
                    var insertDoc = {_id:utils.UUID.generateUuid(),account:data.account,sendData:sendData,resData:res,time:utils.DateTime.getDateFormat(new Date())};
                    mongo.db().collection('flowPackage_query_record').insert(insertDoc);
                }else{
                    var insertDoc = {_id:utils.UUID.generateUuid(),account:data.account,sendData:sendData,resData:res,time:utils.DateTime.getDateFormat(new Date()),type:'flowPackage'};
                    mongo.db().collection('flowPackage_failed_record').insert(insertDoc);
                }
                result.data = res;
                result.success = true;
                callback(result);
            });
        });
    },
    flowRecharge: function(data, callback){
        var result = {success:false};
        if(!data.account){
            result.message = 'account字段必传';
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:data.account+'_ll'}, function(err, doc){
            if(err){
                result.message = '服务端异常';
                callback(result);
                return;
            }
            if(!doc){
                result.message = 'account字段有误或账户未开通流量产品';
                callback(result);
                return;
            }
            mongo.db().collection(constants.DB.platform_account).findOne({_id:data.account}, function(err, accDoc){
                if(err){
                    result.message = '服务端异常';
                    callback(result);
                    return;
                }
                //取出等待回调的充值请求，消费金额
                mongo.db().collection('flowPackage_recharging_record').find({account:data.account}).toArray(function(err, docs){
                    if(err){
                        result.message = '服务端异常';
                        callback(result);
                        return;
                    }
                    var rechargingFee = 0;
                    if(docs && docs.length > 0){
                        for(var i=0;i<docs.length;i++){
                            rechargingFee += docs[i].fee;
                        }
                    }
                    var realBalance = accDoc.balance;
                    if(accDoc.overdraw){
                        realBalance = realBalance + accDoc.overdraw;
                    }
                    if(doc.fee[data.sn]+rechargingFee > realBalance){
                        result.message = '账户余额不足,不能充值流量';
                        callback(result);
                        return;
                    }
                    var time = utils.DateTime.getDateFormat2(new Date());
                    var sigParameter = utils.md5("aaf98f894ecd7d6a014ed906116b12bcbe7d06a2c2314ec9bae18c9655b9798d"+time);
                    var url = "https://app.cloopen.com:8883/2013-12-26/Accounts/aaf98f894ecd7d6a014ed906116b12bc/flowPackage/flowRecharge?sig="+sigParameter.toUpperCase();
                    var sendData = {appId:'aaf98f8950e15fc10150ef88f9c32147',
                        phoneNum:data.phoneNum,
                        sn:data.sn,
                        packet:data.packet,
                        reason:data.reason||'',
                        customId:data.customId,
                        callbackUrl:config.ytxFlowPackageCallbackUrl
                    };
                    var originalCallbackUrl = data.callbackUrl;
                    appHttp.sendYTXSSLPost(url, sendData, time, function(err, res){
                        if(err){
                            result.message = '服务端异常';
                            callback(result);
                            return;
                        }
                        res = JSON.parse(res + "");
                        if(res.statusCode == '000000'){
                            var insertDoc = {
                                _id:res.rechargeId,
                                account:data.account,
                                sendData:sendData,
                                resData:res,
                                time:utils.DateTime.getDateFormat(new Date()),
                                fee:doc.fee[data.sn],
                                originalCallbackUrl:originalCallbackUrl
                            };
                            mongo.db().collection('flowPackage_recharge_record').insert(insertDoc);
                            mongo.db().collection('flowPackage_recharging_record').insert(insertDoc);
                        }else{
                            var insertDoc = {_id:utils.UUID.generateUuid(),account:data.account,sendData:sendData,resData:res,time:utils.DateTime.getDateFormat(new Date()),type:'flowRecharge'};
                            mongo.db().collection('flowPackage_failed_record').insert(insertDoc);
                        }
                        result.data = res;
                        result.success = true;
                        callback(result);
                    });
                });
            })
        });
    },
    flowRechargeStatus: function(data, callback){
        var result = {success:false};
        if(!data.account){
            result.message = 'account字段必传';
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:data.account+'_ll'}, function(err, doc){
            if(err){
                result.message = '服务端异常';
                callback(result);
                return;
            }
            if(!doc){
                result.message = 'account字段有误或账户未开通流量产品';
                callback(result);
                return;
            }
            var time = utils.DateTime.getDateFormat2(new Date());
            var sigParameter = utils.md5("aaf98f894ecd7d6a014ed906116b12bcbe7d06a2c2314ec9bae18c9655b9798d"+time);
            var url = "https://app.cloopen.com:8883/2013-12-26/Accounts/aaf98f894ecd7d6a014ed906116b12bc/flowPackage/flowRechargeStatus?sig="+sigParameter.toUpperCase();
            var sendData = {appId:'aaf98f8950e15fc10150ef88f9c32147',
                rechargeId:data.rechargeId,
                customId:data.customId
            };
            appHttp.sendYTXSSLPost(url, sendData, time, function(err, res){
                if(err){
                    result.message = '服务端异常';
                    callback(result);
                    return;
                }
                res = JSON.parse(res + "");
                if(res.statusCode == '000000'){
                    var insertDoc = {_id:utils.UUID.generateUuid(),account:data.account,sendData:sendData,resData:res,time:utils.DateTime.getDateFormat(new Date())};
                    mongo.db().collection('flowPackage_rechargeStatus_record').insert(insertDoc);
                }else{
                    var insertDoc = {_id:utils.UUID.generateUuid(),account:data.account,sendData:sendData,resData:res,time:utils.DateTime.getDateFormat(new Date()),type:'flowRechargeStatus'};
                    mongo.db().collection('flowPackage_failed_record').insert(insertDoc);
                }
                result.data = res;
                result.success = true;
                callback(result);
            });
        })
    },
    flowRechargeNotify : function(data, callback){
        //data = {Request:{appId:'',rechargeId:'',phoneNum:'',status:'',msg:'',customId:''}}
        logger.app.info("recived ytx flowRecharge notify : rechargeId="+ data.Request.rechargeId+"  status " + data.Request.status);
        var newData = {
            _id : data.Request.rechargeId,
            recivedTime : utils.DateTime.getDateFormat(new Date()),
            Request :{
                appId:data.Request.appId,
                rechargeId:data.Request.rechargeId,
                phoneNum:data.Request.phoneNum,
                status:data.Request.status,
                msg:data.Request.msg,
                customId:data.Request.customId
            }
        }
        mongo.db().collection("flowPackage_recharge_notify_record").insert(newData,function(err){

            mongo.db().collection("flowPackage_recharging_record").findOne({_id:data.Request.rechargeId}, function(err,doc){
                if(err){
                    logger.app.warn("recived ytx flowRecharge notify has err!: rechargeId="+ data.Request.rechargeId+"  status " + data.Request.status,err);
                    callback({Response:{Result:'FAIL'}});
                    return;
                }
                if(!doc){
                    mongo.db().collection("flowPackage_recharge_notify_record")
                        .update({_id:data.Request.rechargeId},{$set:{errReason:'not found recharging record1'}}, function(){});
                    callback({Response:{Result:'SUCC'}});
                    return;
                }
                mongo.db().collection("flowPackage_recharge_record").update({_id:data.Request.rechargeId},{$set:{notify:data.Request,notifyRecivedTime:utils.DateTime.getDateFormat(new Date())}},function(err){
                    if(err){
                        logger.app.warn("recived ytx flowRecharge update flowPackage_recharge_record has err!: rechargeId="+ data.Request.rechargeId+"  status " + data.Request.status,err);
                        callback({Response:{Result:'FAIL'}});
                        return;
                    }
                    mongo.db().collection("flowPackage_recharging_record").remove({_id:data.Request.rechargeId},function(err){});
                    if(data.Request.status == '3'){
                        mongo.db('bill_data').collection('bill_flowPackage').insert(doc,function(err){});
                    }
                    var notify = {account:doc.account,rechargeId:data.Request.rechargeId,phoneNum:data.Request.phoneNum,status:data.Request.status,msg:data.Request.msg,customId:data.Request.customId};
                    appHttp.sendPost(doc.originalCallbackUrl, notify, function(err, res){});
                    callback({Response:{Result:'SUCC'}});
                });
            });
        });
    },

    ivrYtxCommitDisplayNum : function(data, callback){
        mongo.db().collection(constants.DB.log_filingYun).findOne({num: data.num},function (err, doc) {
            if (!err) {
                if(!doc){
                    var numVo = {
                        type : 'single',
                        num: data.num,
                        memo: data.memo,
                        operator : 'interface',
                        createTime: utils.DateTime.getCurrentDateTime()
                    };
                    mongo.db().collection(constants.DB.log_filingYun).insert(numVo,function (err) {
                        if(err){
                            callback('500');
                            return;
                        }
                        filingYunHandler.syncYtxNum(data.num,data.num,function(rep){
                            if(!rep){
                                callback('200');
                            }else{
                                callback('500');
                            }
                        })
                    });
                }else{
                    callback('300');
                }
            } else {
                callback('500');
            }
        });
    },
    ivrYtxNewAppCommitDisplayNum : function(data, callback){
        mongo.db().collection(constants.DB.log_filingYun).findOne({num: data.num,ytxApp:'8a48b5515262482501527bbd65ee2e03'},function (err, doc) {
            if (!err) {
                if(!doc){
                    var numVo = {
                        type : 'single',
                        num: data.num,
                        memo: data.memo,
                        operator : 'interface',
                        createTime: utils.DateTime.getCurrentDateTime(),
                        ytxApp: '8a48b5515262482501527bbd65ee2e03'
                    };
                    mongo.db().collection(constants.DB.log_filingYun).insert(numVo,function (err) {
                        if(err){
                            callback('500');
                            return;
                        }
                        filingYunHandler.syncYtxNewAppNum(data.num,data.num,function(rep){
                            if(!rep){
                                callback('200');
                            }else{
                                callback('500');
                            }
                        })
                    });
                }else{
                    callback('300');
                }
            } else {
                callback('500');
            }
        });
    },

    voiceVerifyStandard: function(data, callback){
        var result = {success:false};
        if(!data.account){
            result.message = 'account字段必传';
            callback(result);
            return;
        }

        mongo.db().collection(constants.DB.platform_account).findOne({_id:data.account}, function(err, accDoc) {
            if (err) {
                result.message = '服务端异常';
                callback(result);
                return;
            }
            mongo.db().collection(constants.DB.platform_account_product).findOne({_id:data.account+'_yy'}, function(err, doc){
                if(err){
                    result.message = '服务端异常';
                    callback(result);
                    return;
                }
                if(!doc){
                    result.message = 'account字段有误或账户未开通语音验证码产品';
                    callback(result);
                    return;
                }

                var realBalance = accDoc.balance;
                if(accDoc.overdraw){
                    realBalance = realBalance + accDoc.overdraw;
                }
                if(realBalance < 0){
                    result.message = '账户余额不足!';
                    callback(result);
                    return;
                }

                if(!data.exten){
                    result.message = 'exten 参数缺失，请检查接收号码';
                    callback(result);
                    return;
                }
                if(data.playTimes < 1 || data.playTimes > 3){
                    result.message = '播放次数只能是1-3';
                    callback(result);
                    return;
                }

                var time = utils.DateTime.getDateFormat2(new Date());
                var sigParameter = utils.md5("aaf98f894ecd7d6a014ed906116b12bcbe7d06a2c2314ec9bae18c9655b9798d"+time);
                var url = "https://app.cloopen.com:8883/2013-12-26/Accounts/aaf98f894ecd7d6a014ed906116b12bc/Calls/VoiceVerify?sig="+sigParameter.toUpperCase();

                mongo.db().collection(constants.DB.voiceVerify_displayNum).findOne({_id:data.account}, function(err, displayDoc){

                    if(err){
                        result.message = '服务端异常';
                        callback(result);
                        return;
                    }
                    //var displayNum = "125909001346";

                    var originalCallbackUrl = '';
                    if(data.callbackUrl){
                        originalCallbackUrl = data.callbackUrl;
                    }
                    var actionID = utils.UUID.generateUuid();
                    var sendData = {
                        appId:'aaf98f89520fca9e015210ad64f90388',
                        lang:"zh",
                        verifyCode:data.verifyCode,
                        to:data.exten,
                        playTimes:data.playTimes ? data.playTimes:1,
                        respUrl:config.ytxVoicePackageCallbackUrl,
                        userData:data.actionID ? data.actionID:actionID
                    };
                    if(displayDoc && displayDoc.displayNum){
                        sendData.displayNum = displayDoc.displayNum
                    }
                    if(data.welcomePrompt){
                        sendData.welcomePrompt = data.welcomePrompt;
                    }
                    if(data.maxCallTime){
                        sendData.maxCallTime = data.maxCallTime;
                    }

                    appHttp.sendYTXSSLPost(url, sendData, time, function(err, res){
                        if(err){
                            result.message = '服务端异常';
                            callback(result);
                            return;
                        }
                        res = JSON.parse(res + "");
                        var insertDoc = {};
                        if(res.statusCode == '000000'){

                            insertDoc = {
                                _id:actionID,
                                account:data.account,
                                sendData:sendData,
                                resData:res,
                                time:utils.DateTime.getDateFormat(new Date()),
                                originalCallbackUrl:originalCallbackUrl
                            };

                            mongo.db().collection('voiceVerify_sending_record').insert(insertDoc);

                        }else{
                            insertDoc = {
                                _id:utils.UUID.generateUuid(),
                                account:data.account,
                                sendData:sendData,
                                resData:res,
                                time:utils.DateTime.getDateFormat(new Date()),
                                originalCallbackUrl:originalCallbackUrl,
                                type:'voiceVerifyCallBack'
                            };
                        }
                        mongo.db().collection('voiceVerify_send_record').insert(insertDoc);
                        result.data = res;
                        result.success = true;
                        callback(result);
                    });

                });

            });
        });
    },

    voiceVerifyCallBack: function(data, callback){
        logger.app.info("recived ytx voiceVerifyStandardCallBack notify : actionID="+ data.request.userData+"  state " + data.request.state);

        mongo.db().collection("voiceVerify_sending_record").findOne({_id:data.request.userData}, function(err,doc){
            if(err){
                logger.app.warn("recived ytx voiceVerifyStandardCallBack notify has err!: actionID="+ data.request.userData+"  state " + data.request.state,err);
                callback({Response:{Result:'FAIL'}});
                return;
            }
            if(!doc){
                callback({Response:{Result:'SUCC'}});
                return;
            }
            mongo.db().collection("voiceVerify_send_record").update({_id:data.request.userData},{$set:{notify:data.request,notifyRecivedTime:utils.DateTime.getDateFormat(new Date())}},function(err){
                if(err){
                    logger.app.warn("recived ytx voiceVerifyStandardCallBack update voiceVerify_send_record has err!: actionID="+ data.request.userData+"  state " + data.request.state,err);
                    callback({Response:{Result:'FAIL'}});
                    return;
                }
                mongo.db().collection("voiceVerify_sending_record").remove({_id:data.request.userData},function(err){});
                if(data.request.state == '0'){
                    doc.callback_request = data.request;
                    mongo.db('bill_data').collection('bill_voiceVerify').insert(doc,function(err){});
                }
                var notify = {
                    account:doc.account,
                    action:data.request.action,
                    callSid:data.request.callSid,
                    exten:data.request.number,
                    state:data.request.state,
                    actionID:data.request.userData,
                    duration:data.request.duration
                };
                if(typeof(doc.originalCallbackUrl) == 'string'){
                    if(doc.originalCallbackUrl.length > 0){
                        appHttp.sendPost(doc.originalCallbackUrl, notify, function(err, res){});
                    }
                }else{
                    logger.app.error('illegal url:' + JSON.stringify(doc));
                }
                callback({Response:{Result:'SUCC'}});
            });
        });
    },

    locateIP: function(data,callback){
        var result = {success:false};

        if(!data.ip || data.ip == ''){
            result.message = 'ILLEGAL IP';
            return callback(result);
        }

        data.ip = data.ip.trim();

        if(!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(data.ip)){
            result.message = 'ILLEGAL IP';
            return callback(result);
        }

        //ip补0
        var segArr = data.ip.split('.');
        var ip = '';
        segArr.forEach(function(seg){
            ip += utils.pad(seg,3);
            ip+='.';
        });

        ip = ip.slice(0,-1);

        var condition = {
            ip_start : {$lte:ip},
            ip_end : {$gte:ip}
        };

        IPPool.get(condition,function(err,location){
            if(err){
                logger.app.error('ip库查询失败',err);
                result.message = err.message;
                return callback(result);
            }

            if(!location){
                result.message = 'UNKOWN IP';
                return callback(result);
            }

            result.success = true;
            result.data = location;

            callback(result);
        });
    },
    isNumberAllowedIntl: function(data,callback){
        if(!data.account || !data.product || ['cc','zj'].indexOf(data.product) == -1 || !data.cid || !data.agentId){
            return callback({
                success : false,
                message : 'ILLEGAL PARAM',
            })
        }

        if(!data.did || data.did.lastIndexOf('00', 0) != 0){
            return callback({
                success : false,
                message : 'ILLEGAL NUMBER',
            })
        }

        var number = data.did.substr(2);
        var productId = data.account + '_' + data.product;
        var cid = data.cid;
        var agentId = data.agentId;

        Then(function(cont){
            AccountProduct.get(productId,cont);
        })
            .then(function(cont,product) {
                if (!product) {
                    return callback({
                        success: true,
                        allowed: false,
                        message: 'product not open',
                    })
                }

                //是否开通.
                if (!product.intlFeeSet || !product.intlFeeSet.isOpenIntl) {
                    return callback({
                        success: true,
                        allowed: false,
                        message: 'intl not open.'
                    })
                }

                //是否允许号码拨打国际长途
                var cids = product.intlFeeSet.cids;
                if (cids && cids.length > 0 && cids.indexOf(cid) < 0) {
                    return callback({
                        success: true,
                        allowed: false,
                        message: 'call number forbidden',
                    })
                }

                cont(null,product);
            })
            .then(function(cont,product){
                //是否允许坐席拨打国际长途
                Agent.get(agentId,function(err,agent){
                    if(err){
                        return cont(err);
                    }
                    if(agent && agent.iscallinternation == false){
                        return callback({
                            success: true,
                            allowed: false,
                            message: 'agent forbidden',
                        })
                    }

                    cont(null,product);

                });
            })
            .then(function(cont,product){

                var intlFeeSet = product.intlFeeSet;
                //找到配置的国际长途资费设置
                var matchFee;

                if (intlFeeSet.fees) {
                    var fees = intlFeeSet.fees;
                    var matchLength = 0;
                    for (var i = 0; i < fees.length; i++){
                        var fee = fees[i];
                        if(fee.code && number.lastIndexOf(fee.code,0) == 0 && matchLength < fee.code.length){
                            matchFee = fee;
                            matchLength = fee.code.length;
                        }
                    }
                }

                if(matchFee){
                    matchFee.line = intlFeeSet.line;
                    Intl.find({code:matchFee.code,line:intlFeeSet.line},function(err,intls){
                        if(err){
                            return cont(err);
                        }
                        if(!intls || intls.length == 0){
                            return callback({
                                success: true,
                                allowed: false,
                                message: 'intl of specified number not found.'
                            })
                        }
                        matchFee.dest = intls[0].dest;

                        return cont(null,matchFee);
                    });
                }else{
                    //若没有配置该号码对应资费,检查是否允许其他为配置的国际长途号码
                    if(intlFeeSet.allowOther){
                        Intl.getByNumberAndLine(data.did,intlFeeSet.line,function(err,intl){
                            if(err){
                                return cont(err);
                            }
                            if(!intl){
                                return callback({
                                    success: true,
                                    allowed: false,
                                    message: 'intl of specified number not found.'
                                });
                            }

                            matchFee = {line : intlFeeSet.line, price : intlFeeSet.otherPrice, code : intl.code, dest : intl.dest};

                            return cont(null,matchFee);
                        })
                    }else{
                        return callback({
                            success: true,
                            allowed: false,
                            message: 'intl of specified number forbidden.',
                        });
                    }
                }
            })
            .then(function(cont,matchFee){
                if(!matchFee){
                    return callback({
                        success: true,
                        allowed: false,
                        message: 'intl of specified number not set.',
                    })
                }
                return callback({
                    success: true,
                    allowed: true,
                    intl : matchFee,
                });
            })
            .fail(function(cont,err){
                return callback({
                    success: false,
                    message: err.message,
                });
            });

    }

};

module.exports = handler;
