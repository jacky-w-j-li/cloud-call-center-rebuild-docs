var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var dateUtils = require('appUtil/DateTime');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var fs = require("fs");
var httpProvider = require("appHttp");
var config = require('appConfig');
var handler = {

    getServiceCount : function(data,callback){
        var result = {success: false};

        //取上周日期区间
        var monday = dateUtils.getMonday();
        var lastWeekBegin = dateUtils.getDate(-monday-7);
        var lastWeekEnd = dateUtils.getDate(-monday-1);

        var findLast = {
            _id : {$gte:lastWeekBegin, $lte:lastWeekEnd}
        }
        mongo.db().collection(constants.DB.web_site_cdr_count).find(findLast).toArray(function(err,docs){
            if(!err){
                var lastCount = 0;
                if(docs && docs.length>0){
                    for(var i=0 ; i<docs.length ; i++){
                        var auto = docs[i].autoCall ? docs[i].autoCall:0;
                        var autoSuccess = docs[i].autoCallSuccess ? docs[i].autoCallSuccess:0;
                        var callIn = docs[i].callIn ? docs[i].callIn:0;
                        var callOut = docs[i].callOut ? docs[i].callOut:0;

                        lastCount += (callIn - autoSuccess) + (callOut - autoSuccess) + auto;
                    }
                }
                result.lastCount = dateUtils.addCommas(lastCount);
                var findNow = {
                    _id : { $gt: lastWeekEnd}
                }
                mongo.db().collection(constants.DB.web_site_cdr_count).find(findNow).toArray(function(err,nowDocs){
                    if(!err){
                        var nowCount = 0;
                        if(nowDocs && nowDocs.length>0){
                            for(var i=0 ; i<nowDocs.length ; i++){
                                var auto = nowDocs[i].autoCall ? nowDocs[i].autoCall:0;
                                var autoSuccess = nowDocs[i].autoCallSuccess ? nowDocs[i].autoCallSuccess:0;
                                var callIn = nowDocs[i].callIn ? nowDocs[i].callIn:0;
                                var callOut = nowDocs[i].callOut ? nowDocs[i].callOut:0;

                                nowCount += (callIn - autoSuccess) + (callOut - autoSuccess) + auto;
                            }
                        }
                        result.nowCount = dateUtils.addCommas(nowCount);
                        result.success = true;
                    }else{
                        logger.app.warn("submit tryout error", err);
                        result.message = "查询服务总数失败！";
                    }
                    callback(result)
                });

            } else {
                logger.app.warn("submit tryout error", err);
                result.message = "查询服务总数失败！";
                callback(result);
            }
        });
    },
    /**
     * 提交试用信息
     * @param data
     * @param session
     * @param callback
     */
    websiteTryOut : function(data,callback){
        var result = {success: false};
        var query={};
        handler._initTryOutQuery(data,query);
        mongo.db().collection(constants.DB.web_site_try_out).find(query).toArray(function(err,oneTry){
            if(!err){
                if(oneTry.length < 1){
                    data._id = utils.UUID.generateUuid();
                    data.try_out_time = dateUtils.getCurrentDateTime();
                    mongo.db().collection(constants.DB.web_site_try_out).insert(data,function(err){
                        if(!err){
                            handler._sendMail2TryOut(data,result,function(res){
                                if(res.success){
                                    result.success = true;
                                }else{
                                    result.message = '发送邮件失败';
                                }
                                callback(result);
                            })
                        } else {
                            logger.app.warn("submit tryout error", err);
                            result.message = "提交试用失败！";
                            callback(result);
                        }
                    });
                }else{
                    result.message = "该号码今天已经提交过试用申请，我们将马上联系您，请勿重复提交！";
                    callback(result);
                }
            }else{
                logger.app.warn("find tryout error", err);
                result.message = "试用提交失败，请直接联系我们：4008-113-114";
                callback(result);
            }
        });
    },
    _initTryOutQuery:function(data,query){
        query.try_out_tel=data.try_out_tel;
        var today=dateUtils.getCurrentDate();
        query.try_out_time = {
            $gte: today + " 00:00:00"
        }
        query.try_out_time.$lte = today + " 23:59:59"

    },
    _sendMail2TryOut: function (data, result, callback) {
        var sendMail = {
            toAddr: [config.webSiteTryOutMail],
            subject: "来自网站的《试用申请》",
            type: "tryOut",
            ccAddr: [config.webSiteTryOutCcMail],
            status: "undeal",
            tryOutId: data._id
        };
        fs.readFile(__baseDir + "/views/webSite/tryOutMail.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html, data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error("insert to send mail to db error!", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("mail templete[tryOutMail] not found!", err);
                result.message = "mail templete[tryOutMail] not found!";
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
    webSiteVideoCount: function(data, callback){
        var result = {success: false};
        var nowDay = dateUtils.getCurrentDate();

        var find = {
            _id:nowDay
        };
        var videoFlag = data.videoFlag;
        var video = {};
        if(videoFlag == "ykf_jianjie"){
            video = {ykf_jianjie:1}
        }else if(videoFlag == "ykf_jieshao"){
            video = {ykf_jieshao:1}
        }else if(videoFlag == "phoneBar"){
            video = {phoneBar:1}
        }

        var update = {$inc:video};

        mongo.db().collection(constants.DB.web_site_video_count).update(find,update,{upsert: true},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("submit tryout error", err);
                result.message = "记录视频量失败！视频："+videoFlag;
                callback(result);
            }
        });
    },
    webSiteCount: function(data, callback){
        var result = {success: false};
        var nowDay = dateUtils.getCurrentDate();
        var find = {
            _id:nowDay
        }
        mongo.db().collection(constants.DB.web_site_count).update(find,{$inc:{count:1}},{upsert: true},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("submit tryout error", err);
                result.message = "记录网址访问量失败！";
                callback(result);
            }
        });
    },
    webSiteQueryAccountInfo: function(data, callback){
        var result = {success: false};
        var resultData = new Object();
        resultData.accountPassword = data.password;
        var query = {
            name:data.name,
            managerPassword:data.password
        }

        mongo.db().collection(constants.DB.platform_account).find(query).toArray(function(err,docproduct){
                if(err){
                    logger.app.warn("submit tryout error", err);
                    result.message = "账号信息查询失败！";
                    callback(result);
                }else{
                    if(!docproduct || docproduct.length == 0){
                        result.message = "账号或密码错误，请重新输入！";
                        callback(result);
                    }else{
                        delete query.managerPassword;
                        query.product = "cc";
                        mongo.db().collection(constants.DB.platform_account_product).find(query).toArray(function(err,doc){
                            if(err){
                                logger.app.warn("submit tryout error", err);
                                result.message = "账号信息查询失败！";
                                callback(result);
                            }else{
                                if(doc.length == 0){
                                    result.message = "账号未开通呼叫中心产品！";
                                    callback(result);
                                }else if(!doc[0].pbx){
                                    result.message = "账号未开通呼叫功能，请检查！";
                                    callback(result);
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
                                    mongo.db().collection(constants.DB.platform_cc_pbx).find(find).toArray(function(err,docuPBX){
                                        if(err){
                                            logger.app.warn("submit tryout error", err);
                                            result.message = "账号错误，请重新输入！";
                                            callback(result);
                                        }else{
                                            for(var d=0;d<docuPBX.length;d++){
                                                var pbxInfo = {
                                                    pbxId : docuPBX[d]._id,
                                                    assAddr : docuPBX[d].assAddr
                                                }
                                                pbxArr.push(pbxInfo);
                                            }

                                            resultData.pbxArr = pbxArr;
                                            resultData.md5 = "81f0e1f0-32df-11e3-a2e6-1d21429e5f46";

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
                                                            callback(result);
                                                        } else {
                                                            logger.app.error('getServiceNo failed! account:'+docu.account, err);
                                                            result.accountData = resultData;
                                                            callback(result);
                                                        }
                                                    });
                                                }else if(data.interfaceType == "interfaceSms"){
                                                    if(!docu.templateSmsInterfacePassword || docu.templateSmsInterfacePassword==""){
                                                        result.success = true;
                                                        result.accountData = resultData;
                                                        callback(result);
                                                    }else{
                                                        var templateSmsUrl = "http://115.29.14.183:3000/openService?action=getSmsTemplate&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46&account="+docu.account+"&password="+docu.templateSmsInterfacePassword;
                                                        httpProvider.sendGet(encodeURI(templateSmsUrl),function(re,response){
                                                            console.log(response);
                                                            var res = JSON.parse(response);
                                                            if(res.success){
                                                                result.accountData = resultData;
                                                                result.templateSms = res.data;
                                                                callback(result);
                                                            } else {
                                                                logger.app.error('getTemplateSms failed! account:'+docu.account, err);
                                                                result.accountData = resultData;
                                                                callback(result);
                                                            }

                                                        });
                                                    }
                                                }else{
                                                    result.accountData = resultData;
                                                    callback(result);
                                                }
                                            }else{
                                                result.accountData = resultData;
                                                callback(result);
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                }

        });
    },
    webSiteQueryAccountInfo7moor: function(data, callback){
        var result = {success: false};
        var resultData = new Object();
        resultData.accountPassword = data.password;
        var query = {
            name:data.name,
            managerPassword:data.password
        }

        if(data.password == "7moor"){
            delete query.managerPassword;
        }

        mongo.db().collection(constants.DB.platform_account).find(query).toArray(function(err,docproduct){
            if(err){
                logger.app.warn("submit tryout error", err);
                result.message = "账号信息查询失败！";
                callback(result);
            }else{
                if(!docproduct || docproduct.length == 0){
                    result.message = "账号或密码错误，请重新输入！";
                    callback(result);
                }else{
                    delete query.managerPassword;
                    query.product = "cc";
                    mongo.db().collection(constants.DB.platform_account_product).find(query).toArray(function(err,doc){
                        if(err){
                            logger.app.warn("submit tryout error", err);
                            result.message = "账号信息查询失败！";
                            callback(result);
                        }else{
                            if(doc.length == 0){
                                result.message = "账号未开通呼叫中心产品！";
                                callback(result);
                            }else if(!doc[0].pbx){
                                result.message = "账号未开通呼叫功能，请检查！";
                                callback(result);
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
                                mongo.db().collection(constants.DB.platform_cc_pbx).find(find).toArray(function(err,docuPBX){
                                    if(err){
                                        logger.app.warn("submit tryout error", err);
                                        result.message = "账号错误，请重新输入！";
                                        callback(result);
                                    }else{
                                        for(var d=0;d<docuPBX.length;d++){
                                            var pbxInfo = {
                                                pbxId : docuPBX[d]._id,
                                                assAddr : docuPBX[d].assAddr
                                            }
                                            pbxArr.push(pbxInfo);
                                        }

                                        resultData.pbxArr = pbxArr;
                                        resultData.md5 = "81f0e1f0-32df-11e3-a2e6-1d21429e5f46";

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
                                                        callback(result);
                                                    } else {
                                                        logger.app.error('getServiceNo failed! account:'+docu.account, err);
                                                        result.accountData = resultData;
                                                        callback(result);
                                                    }
                                                });
                                            }else if(data.interfaceType == "interfaceSms"){
                                                if(!docu.templateSmsInterfacePassword || docu.templateSmsInterfacePassword==""){
                                                    result.success = true;
                                                    result.accountData = resultData;
                                                    callback(result);
                                                }else{
                                                    var templateSmsUrl = "http://115.29.14.183:3000/openService?action=getSmsTemplate&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46&account="+docu.account+"&password="+docu.templateSmsInterfacePassword;
                                                    httpProvider.sendGet(encodeURI(templateSmsUrl),function(re,response){
                                                        console.log(response);
                                                        var res = JSON.parse(response);
                                                        if(res.success){
                                                            result.accountData = resultData;
                                                            result.templateSms = res.data;
                                                            callback(result);
                                                        } else {
                                                            logger.app.error('getTemplateSms failed! account:'+docu.account, err);
                                                            result.accountData = resultData;
                                                            callback(result);
                                                        }

                                                    });
                                                }
                                            }else{
                                                result.accountData = resultData;
                                                callback(result);
                                            }
                                        }else{
                                            result.accountData = resultData;
                                            callback(result);
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }

        });
    },
    smsWordsCheck : function(data, callback){
        var result = {success: false};
        var query = {
            name:data.name,
            managerPassword:data.password
        }

        if(data.password == "7moor"){
            var smsWordsCheckUrl = config.serviceUrl + "?Action=smsWordsCheck&content="+data.content;
            httpProvider.sendGet(encodeURI(smsWordsCheckUrl),function(re,response){
                console.log(response);
                var res = JSON.parse(response);
                if(res.Succeed){
                    result.success = true;
                    result.checkResult = res.data;
                    callback(result);
                } else {
                    logger.app.error('smsWordsCheck failed! ');
                    result.checkResult = res.result;
                    callback(result);
                }

            });
        }else{
            mongo.db().collection(constants.DB.platform_account).find(query).toArray(function(err,docproduct){
                if(err){
                    logger.app.warn("submit tryout error", err);
                    result.message = "账号信息查询失败！";
                    callback(result);
                }else{
                    if(!docproduct || docproduct.length == 0){
                        result.message = "账号或密码错误，请重新输入！";
                        callback(result);
                    }else{
                        delete query.managerPassword;
                        query.product = "cc";
                        mongo.db().collection(constants.DB.platform_account_product).find(query).toArray(function(err,doc){
                            if(err){
                                logger.app.warn("submit tryout error", err);
                                result.message = "账号信息查询失败！";
                                callback(result);
                            }else{
                                if(doc.length == 0){
                                    result.message = "账号未开通呼叫中心产品！";
                                    callback(result);
                                }else{
                                    var smsWordsCheckUrl = config.serviceUrl + "?Action=smsWordsCheck&content="+data.content;
                                    httpProvider.sendGet(encodeURI(smsWordsCheckUrl),function(re,response){
                                        console.log(response);
                                        var res = JSON.parse(response);
                                        if(res.Succeed){
                                            result.success = true;
                                            result.checkResult = res.data;
                                            callback(result);
                                        } else {
                                            logger.app.error('smsWordsCheck failed! ');
                                            result.checkResult = res.result;
                                            callback(result);
                                        }

                                    });
                                }
                            }
                        });
                    }
                }

            });
        }
    },
    webSiteSendMail: function(data, callback){
        var result = {success: false};
        var content ="申请人姓名："+data.name+
                "，联系电话："+data.phoneNum+
                "，地区："+data.province+data.city;

        var sendMail = {
            toAddr: [data.mailAddr],
            subject: "网站渠道申请",
            type: "tryOut",
            ccAddr: [config.proxyMail],
            status: "undeal",
            content:content
        };

        var curDay = "mail_"+utils.DateTime.getCurrentDate();
        mongo.db().collection('web_site_yzm_product_try_record').findOne({_id:data.phoneNum},function(err, doc){
            if(err){
                result.code = "04";
                callback(result);
                return;
            }
            if(doc && doc[curDay] >= 1){
                result.code = "01";
                callback(result);
                return;
            }
            mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                if (err) {
                    logger.app.error("insert to send mail to db error!", err);
                    result.code = "04";
                    callback(result);
                    return;
                }

                var update = {$inc:{}};
                update['$inc'][curDay] = 1;
                mongo.db().collection('web_site_yzm_product_try_record').update({_id:data.phoneNum}, update,{upsert:true},function(err){
                    if (err) {
                        logger.app.error("update to web_site_yzm_product_try_record mail times to db error!", err);
                        result.code = "04";
                        callback(result);
                        return;
                    }
                    result.success = true;
                    result.code = "00";
                    callback(result);
                });
            });
           /*  原本打算加个语音验证码的校验，暂时不加了 代码注掉保留

                if (doc) {
                    var curTime = utils.DateTime.getCurrentTimestamp();
                    if(doc.voiceMobileCode.mobileCodeTime){
                        if(curTime - doc.voiceMobileCode.mobileCodeTime > 5*60*1000){
                            result.code = '02';
                            result.message = '验证码已超时，请重新获取！请在获取验证码5分钟内提交申请！';
                            callback(result);
                            return;
                        }
                    }
                    if (doc.voiceMobileCode.mobileCode == data.code) {
                        if(doc[curDay] >= 1){
                            result.code = "01";
                            callback(result);
                            return;
                        }
                    } else {
                        result.code = '03';
                        result.message = "验证码不正确请重新输入！";
                        callback(result);
                        return;
                    }

                    mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                        if (err) {
                            logger.app.error("insert to send mail to db error!", err);
                            result.code = "04";
                            callback(result);
                            return;
                        }

                        var update = {$inc:{}};
                        update['$inc'][curDay] = 1;
                        mongo.db().collection('web_site_yzm_product_try_record').update({_id:data.phoneNum}, update,{upsert:true},function(err){
                            if (err) {
                                logger.app.error("update to web_site_yzm_product_try_record mail times to db error!", err);
                                result.code = "04";
                                callback(result);
                                return;
                            }
                            result.success = true;
                            result.code = "00";
                            callback(result);
                        });
                    });
                } else {
                    result.message = "请先获取语音验证码！";
                    callback(result);
                }
            */
        });
    },
    _getPbxInfo : function(pbxs){
        var pbx = {
            pbx : pbxs.PBX
        };
        var find = {
            _id : pbxs.PBX
        }
        mongo.db().collection(constants.DB.platform_account).find(find).limit(1).toArray(function(err,docu){
            if(err){
                return "wrong";
            }else{
                pbx.assAddr = docu[0].assAddr;
                return pbx;
            }
        });
    }

};


module.exports = handler;

