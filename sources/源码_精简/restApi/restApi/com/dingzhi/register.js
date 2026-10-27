var util = require("appUtil/Utils");
var log = require("appLog");
var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");
var httpProvider = require("appHttp");

var service = {
    webSiteQueryAccountInfo : function(req, res, next){//查询账号信息
        var result = {success: false};
        var resultData = {};
        var data = req.params;
        resultData.accountPassword = data.password;
        var query = {
            name:data.name,
            managerPassword:data.password
        }

        mongo.ccDb().collection("platform_account").find(query).toArray(function(err,docproduct){
            if(err){
                logger.app.warn("submit tryout error", err);
                result.message = "账号信息查询失败！";
                util.sendResult(result , res, req.id());
            }else{
                if(!docproduct || docproduct.length == 0){
                    result.message = "账号或密码错误，请重新输入！";
                    util.sendResult(result , res, req.id());
                }else{
                    delete query.managerPassword;
                    query.product = "cc";
                    mongo.ccDb().collection("platform_account_product").find(query).toArray(function(err,doc){
                        if(err){
                            logger.app.warn("submit tryout error", err);
                            result.message = "账号信息查询失败！";
                            util.sendResult(result , res, req.id());
                        }else{
                            if(doc.length == 0){
                                result.message = "账号未开通呼叫中心产品！";
                                util.sendResult(result , res, req.id());
                            }else if(!doc[0].pbx){
                                result.message = "账号未开通呼叫功能，请检查！";
                                util.sendResult(result , res, req.id());
                            }else{
                                var docu = doc[0];
                                var pbxArr = [];
                                resultData.account = docu.account;
                                resultData.accountName = docu.name;
                                resultData.templateSmsInterfacePassword = docu.templateSmsInterfacePassword;

                                var pbxs = docu.pbx;
                                var idArr = [];
                                for(var i=0;i<pbxs.length;i++){
                                    idArr.push(pbxs[i].PBX)
                                }

                                var find = {}
                                find._id = {"$in" : idArr};
                                mongo.ccDb().collection("platform_cc_pbx").find(find).toArray(function(err,docuPBX){
                                    if(err){
                                        logger.app.warn("submit tryout error", err);
                                        result.message = "查询失败，请稍后重试！";
                                        util.sendResult(result , res, req.id());
                                    }else{
                                        for(var d=0;d<docuPBX.length;d++){
                                            var pbxInfo = {
                                                pbxId : docuPBX[d]._id,
                                                assAddr : docuPBX[d].assAddr
                                            }
                                            pbxArr.push(pbxInfo);
                                        }

                                        resultData.pbxArr = pbxArr;

                                        mongo.db().collection('account_secret').findOne({_id:docu.account},function(err,docSec){
                                            if(err){
                                                result.message = "get account info err";
                                                util.sendResult(result , res, req.id());
                                            }else {
                                                if (!docSec) {
                                                    var secret = util.UUID.generateUuid();
                                                    mongo.db().collection('account_secret').insert({_id:docu.account,secret:secret},{w:1},function(err){
                                                        if(err){
                                                            result.message = "get account info err";
                                                            util.sendResult(result , res, req.id());
                                                        }else{
                                                            resultData.APISecret = secret;
                                                            result.success = true;
                                                            if(data.interfaceType){
                                                                if(data.interfaceType == "Webcall"){
                                                                    var serviceNoUrl = "http://115.29.14.183:3000/openService?action=getCCServiceNoByAcc&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46&account="+docu.account;
                                                                    httpProvider.sendGet(encodeURI(serviceNoUrl),function(re,response){
                                                                        console.log(response);
                                                                        var res = JSON.parse(response);
                                                                        if(res.success){
                                                                            result.accountData = resultData;
                                                                            result.serviceNo = res.data;
                                                                            util.sendResult(result , res, req.id());
                                                                        } else {
                                                                            logger.app.error('getServiceNo failed! account:'+docu.account, err);
                                                                            result.accountData = resultData;
                                                                            util.sendResult(result , res, req.id());
                                                                        }
                                                                    });
                                                                }else if(data.interfaceType == "interfaceSms"){
                                                                    resultData.md5 = "81f0e1f0-32df-11e3-a2e6-1d21429e5f46";

                                                                    if(!docu.templateSmsInterfacePassword || docu.templateSmsInterfacePassword==""){
                                                                        result.success = true;
                                                                        result.accountData = resultData;
                                                                        util.sendResult(result , res, req.id());
                                                                    }else{
                                                                        var templateSmsUrl = "http://115.29.14.183:3000/openService?action=getSmsTemplate&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46&account="+docu.account+"&password="+docu.templateSmsInterfacePassword;
                                                                        httpProvider.sendGet(encodeURI(templateSmsUrl),function(re,response){
                                                                            console.log(response);
                                                                            var res = JSON.parse(response);
                                                                            if(res.success){
                                                                                result.accountData = resultData;
                                                                                result.templateSms = res.data;
                                                                                util.sendResult(result , res, req.id());
                                                                            } else {
                                                                                logger.app.error('getTemplateSms failed! account:'+docu.account, err);
                                                                                result.accountData = resultData;
                                                                                util.sendResult(result , res, req.id());
                                                                            }

                                                                        });
                                                                    }
                                                                }else{
                                                                    result.accountData = resultData;
                                                                    util.sendResult(result , res, req.id());
                                                                }
                                                            }else{
                                                                result.accountData = resultData;
                                                                util.sendResult(result , res, req.id());
                                                            }
                                                        }
                                                    });
                                                }else{
                                                    result.success = true;
                                                    resultData.APISecret = docSec.secret;
                                                    result.accountData = resultData;
                                                    util.sendResult(result , res, req.id());
                                                }
                                            }
                                        })
                                    }
                                });
                            }
                        }
                    });
                }
            }

        });
    },
    /**
     * 语音验证码
     * @param data {mobile:手机号码}
     * @param callback
     */
    rl7mWebSiteYZMWebCallTryMobileVoiceCode: function(req, res){
        var result = {success: false};
        var curDay = "voice_"+util.DateTime.getCurrentDate();
        var data = {};
        data = req.params;
        mongo.ccDb().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                util.sendResult(result , res, req.id());
                return;
            }
         /*   if(doc && doc[curDay] >= 3){
                result.message = '您今天已体验3次，请明天再试!：）';
                util.sendResult(result , res, req.id());
                return;
            }*/
            var curTime = util.DateTime.getCurrentTimestamp();
            if(doc && doc.mobileCodeTime){
                if(curTime - doc.mobileCodeTime < 58 *1000){
                    result.code = '02';
                    result.message = "time too short ,don't send again!";
                    util.sendResult(result , res, req.id());
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

            mongo.ccDb().collection("web_site_yzm_product_try_record").update({_id: data.mobile},{$unset:{'voiceMobileCode.mobileCode':1}}, function (err) {});

            var webcallUrl = "http://14.29.5.58/command?Action=Webcall&PBX=gz.dx.ibac.0&Account=N00000011529&ServiceNo=01011111375&Exten="+data.mobile+"&Variable=vioce:您的验证码是:"+mobileCodeVoice;
            //webcallUrl = encodeURI(webcallUrl);
            httpProvider.sendGet(encodeURI(webcallUrl),function(resp){
                console.log(resp);

                //if(res.success){
                update['$inc'] = {};
                update['$inc'][curDay] = 1;
                mongo.ccDb().collection('web_site_yzm_product_try_record').update({_id:data.mobile}, update,{upsert:true},function(err){
                    result.success = true;
                    util.sendResult(result , res, req.id());
                });
                //}else{
                //    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                //    callback(result);
                //}
            });
        })
    },
    rl7mWebSiteCryptonym: function(req, res){
        var result = {success: false};
        var data=req.params;
        var curDay = "cryptonym_"+util.DateTime.getCurrentDate();
        mongo.ccDb().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile1},function(err, doc){
            if(err){
                result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                util.sendResult(result , res, req.id());
                return;
            }
            if(doc && doc[curDay] >= 3){
                result.message = '猎头号码今天已体验3次，请明天再试!：）';
                util.sendResult(result , res, req.id());
                return;
            }
            var curTime = util.DateTime.getCurrentTimestamp();
            if(doc && doc.mobileCodeTime){
                if(curTime - doc.mobileCodeTime < 58 *1000){
                    result.code = '02';
                    result.message = "time too short ,don't send again!";
                    util.sendResult(result , res, req.id());
                    return;
                }
            }
            mongo.ccDb().collection('web_site_yzm_product_try_record').findOne({_id:data.mobile2},function(err, doc){
                if(err){
                    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                    util.sendResult(result , res, req.id());
                    return;
                }
                if(doc && doc[curDay] >= 3){
                    result.message = '求职者号码今天已体验3次，请明天再试!：）';
                    util.sendResult(result , res, req.id());
                    return;
                }
                var curTime = util.DateTime.getCurrentTimestamp();
                if(doc && doc.mobileCodeTime){
                    if(curTime - doc.mobileCodeTime < 58 *1000){
                        result.code = '02';
                        result.message = "time too short ,don't send again!";
                        util.sendResult(result , res, req.id());
                        return;
                    }
                }

                var update = {};

                var webcallUrl = "http://14.29.5.58/command?Action=Webcall&PBX=gz.dx.ibac.0&Account=N00000011529&ServiceNo=01011111376&Exten="+data.mobile1+"&Variable=phoneNum:"+data.mobile2;
                httpProvider.sendGet(webcallUrl,function(resp){
                    console.log(resp);

                    //if(res.success){
                    update['$inc'] = {};
                    update['$inc'][curDay] = 1;
                        mongo.ccDb().collection('web_site_yzm_product_try_record').update({_id:{"$in":[data.mobile1,data.mobile2]}}, update,{upsert:true},function(err){
                            result.success = true;
                            util.sendResult(result , res, req.id());
                        });
                    //}else{
                    //    result.message = '抱歉，服务端好像有点问题！暂时无法体验，我们正在努力恢复。请您致电4008-113-114，联系我们进行体验。';
                    //    callback(result);
                    //}
                });
            });
        })
    },
};

var self = {
    parsePostActionData: function(req){
        var action = {};
        if (typeof req.body == "object") {
            log.app.info(" request["+req.id()+"] body ["+JSON.stringify(req.body) +"]");
        }else{
            log.app.info(" request["+req.id()+"] body ["+req.body +"]");
        }
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            if (typeof req.body == "object") {
                action.data = query;
            }else{
                action.data = JSON.parse(query);
            }
        } catch (e) {
            action.err = e.message;
            log.app.error("json parse error:",e);
        }
        return action;
    }
}

module.exports = service;
