/**
 * Created by shenjc on 2016/12/23.
 */
var util = require("appUtil/Utils");
var log = require("appLog");
var http = require('appHttp');
var mongo = require("appDb/MongoDb");
var config = require('appConfig');
var restUtil = require(__baseDir + '/com/common/restUtil');

var service = {
    voiceVerifyStandard:function (req, res, next) {
        restUtil.restAuthorization(req, res,function(authorization) {
            if(authorization){
                var action = restUtil.parseRestPostActionData(req);
                if (action.err) {
                    result = {code: 400, message: action.err};
                    util.sendResult(result, res, req.id());
                    return;
                }

                var result = {success:false};
                var data = action.data;
                if(!data.account){
                    result.message = 'account字段必传';
                    util.sendResult(result, res, req.id());
                    return;
                }
                mongo.ccDb().collection("platform_account").findOne({_id:data.account}, function(err, accDoc) {
                    if (err) {
                        result.message = '服务端异常';
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    mongo.ccDb().collection("platform_account_product").findOne({_id:data.account+'_yy'}, function(err, doc){
                        if(err){
                            result.message = '服务端异常';
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        if(!doc){
                            result.message = 'account字段有误或账户未开通语音验证码产品';
                            util.sendResult(result, res, req.id());
                            return;
                        }

                        var realBalance = accDoc.balance;
                        if(accDoc.overdraw){
                            realBalance = realBalance + accDoc.overdraw;
                        }
                        if(realBalance < 0){
                            result.message = '账户余额不足!';
                            util.sendResult(result, res, req.id());
                            return;
                        }

                        if(!data.exten){
                            result.message = 'exten 参数缺失，请检查接收号码';
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        if(data.playTimes < 1 || data.playTimes > 3){
                            result.message = '播放次数只能是1-3';
                            util.sendResult(result, res, req.id());
                            return;
                        }

                        var time = util.DateTime.getDateFormat2(new Date());
                        var sigParameter = util.md5("aaf98f894ecd7d6a014ed906116b12bcbe7d06a2c2314ec9bae18c9655b9798d"+time);
                        var url = "https://app.cloopen.com:8883/2013-12-26/Accounts/aaf98f894ecd7d6a014ed906116b12bc/Calls/VoiceVerify?sig="+sigParameter.toUpperCase();

                        mongo.ccDb().collection("voiceVerify_displayNum").findOne({_id:data.account}, function(err, displayDoc){

                            if(err){
                                result.message = '服务端异常';
                                util.sendResult(result, res, req.id());
                                return;
                            }
                            //var displayNum = "125909001346";

                            var originalCallbackUrl = '';
                            if(data.callbackUrl){
                                originalCallbackUrl = data.callbackUrl;
                            }
                            var actionID = util.UUID.generateUuid();
                            var sendData = {
                                appId:'aaf98f89520fca9e015210ad64f90388',
                                lang:"zh",
                                verifyCode:data.verifyCode,
                                to:data.exten,
                                respUrl:config.ytxVoicePackageCallbackUrl
                            };
                            if(data.playTimes){
                                sendData.playTimes = data.playTimes;
                            }else{
                                sendData.playTimes = 1;
                            }
                            if(data.actionID){
                                sendData.userData = data.actionID;
                            }else{
                                sendData.userData = actionID;
                            }
                            if(displayDoc && displayDoc.displayNum){
                                sendData.displayNum = displayDoc.displayNum
                            }
                            if(data.welcomePrompt){
                                sendData.welcomePrompt = data.welcomePrompt;
                            }
                            if(data.maxCallTime){
                                sendData.maxCallTime = data.maxCallTime;
                            }

                            http.sendYTXSSLPost(url, sendData, time, function(err, resp){
                                if(err){
                                    result.message = '服务端异常';
                                    util.sendResult(result, res, req.id());
                                    return;
                                }
                                resp = JSON.parse(resp);
                                var insertDoc = {};
                                if(resp.statusCode == '000000'){

                                    insertDoc = {
                                        _id:actionID,
                                        account:data.account,
                                        sendData:sendData,
                                        resData:resp,
                                        time:util.DateTime.getDateFormat(new Date()),
                                        originalCallbackUrl:originalCallbackUrl
                                    };

                                    mongo.ccDb().collection('voiceVerify_sending_record').insert(insertDoc);

                                }else{
                                    insertDoc = {
                                        _id:util.UUID.generateUuid(),
                                        account:data.account,
                                        sendData:sendData,
                                        resData:resp,
                                        time:util.DateTime.getDateFormat(new Date()),
                                        originalCallbackUrl:originalCallbackUrl,
                                        type:'voiceVerifyCallBack'
                                    };
                                }
                                mongo.ccDb().collection('voiceVerify_send_record').insert(insertDoc);
                                result.data = resp;
                                result.success = true;
                                util.sendResult(result, res, req.id());
                            });

                        });

                    });
                });
            }
        });
    }
};

module.exports = service;