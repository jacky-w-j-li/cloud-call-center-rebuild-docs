/**
 * Created by Panshuyang on 2016/12/6 0006.
 */
var util = require("appUtil/Utils");
var log = require("appLog");
var http = require('appHttp');
var mongo = require("appDb/MongoDb");
var restUtil = require(__baseDir + '/com/common/restUtil');

var service = {
    hangup:function (req, res, next) {
        restUtil.restAuthorization(req, res,function(authorization) {
            if(authorization){
                var actionId = req.params.ActionID;
                if(actionId == null || actionId == 'null'){
                    actionId = 'Hangup'+Math.random();
                }
                var result = {
                    Succeed : false,
                    ActionId : actionId,
                    Response : 'Hangup'
                };
                var account = req.params.Account;
                var callID = req.params.CallID;
                var agent = req.params.Agent;
                if(account == null || (callID == null && agent == null)){
                    result.Message = '400 Error action';
                    util.sendResult(result , res, req.id());
                } else {
                    mongo.ccDb('bill').collection('platform_user').findOne({account:account}, function (err, extenInfo) {
                        if(err){
                            result.Message = '500 Server error';
                            log.app.error('Hangup interface find account error!' + err);
                            util.sendResult(result , res, req.id());
                        } else {
                            if(extenInfo == null){
                                result.Message = '404 account not found';
                                util.sendResult(result , res, req.id());
                            } else {
                                var extenPbx = extenInfo.pbx;
                                mongo.ccDb('bill').collection('platform_cc_pbx').findOne({_id:extenPbx, status:'enable'}, function (err, pbxInfo) {
                                    if(err){
                                        result.Message = '500 Server error';
                                        log.app.error('Hangup interface find pbx error!' + err);
                                        util.sendResult(result , res, req.id());
                                    }else{
                                        if(pbxInfo == null){
                                            result.Message = '401 PBX not found';
                                            util.sendResult(result , res, req.id());
                                        }else{
                                            var configAddr = pbxInfo.configAddr;
                                            var assAddr = pbxInfo.assAddr;
                                            assAddr = configAddr.substring(0, assAddr.lastIndexOf(":")) + assAddr.substring(assAddr.lastIndexOf(":"));
                                            var dialOutUrl;
                                            if (callID) {
                                                dialOutUrl = assAddr + '/app?Action=Hangup&ActionID=' + actionId
                                                    + '&Account=' + account + '&CallID=' + callID
                                                    + '&PBX=' + pbxInfo._id;
                                            } else {
                                                dialOutUrl = assAddr + '/app?Action=Hangup&ActionID=' + actionId
                                                    + '&Account=' + account + '&Agent=' + agent
                                                    + '&PBX=' + pbxInfo._id;
                                            }
                                            http.sendGet(dialOutUrl, function(err, httpResult){
                                                httpResult = JSON.parse(httpResult);
                                                if(err){
                                                    log.app.error('Hangup interface send http request to pbx[' + pbxInfo._id + '] error!');
                                                    result.Message = '500 Server error';
                                                    util.sendResult(result , res, req.id());
                                                }else{
                                                    util.sendResult(httpResult , res, req.id());
                                                }
                                            });
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
    dialout:function(req, res, next) {
        restUtil.restAuthorization(req, res,function(authorization) {
            if(authorization){
                var actionId = req.params.ActionID;
                if(actionId == null || actionId == 'null'){
                    actionId = 'Dialout'+Math.random();
                }
                var result = {
                    Succeed : false,
                    ActionId : actionId,
                    Response : 'Dialout'
                };
                var account = req.params.Account;
                var fromExten = req.params.FromExten;
                var exten = req.params.Exten;
                var extenType = req.params.ExtenType;
                if(account == null || fromExten == null || exten == null){
                    result.Message = '400 Error action';
                    util.sendResult(result , res, req.id());
                }else{
                    mongo.ccDb('bill').collection('platform_user').findOne({account:account,exten:fromExten}, function (err, extenInfo) {
                        if(err){
                            result.Message = '500 Server error';
                            log.app.error('Dialout interface find exten error!' + err);
                            util.sendResult(result , res, req.id());
                        }else{
                            if(extenInfo == null){
                                result.Message = '404 Agent not found';
                                util.sendResult(result , res, req.id());
                            }else{
                                var extenPbx = extenInfo.pbx;
                                mongo.ccDb('bill').collection('platform_cc_pbx').findOne({_id:extenPbx, status:'enable'}, function (err, pbxInfo) {
                                    if(err){
                                        result.Message = '500 Server error';
                                        log.app.error('Dialout interface find pbx error!' + err);
                                        util.sendResult(result , res, req.id());
                                    }else{
                                        if(pbxInfo == null){
                                            result.Message = '401 PBX not found';
                                            util.sendResult(result , res, req.id());
                                        }else{
                                            var configAddr = pbxInfo.configAddr;
                                            var assAddr = pbxInfo.assAddr;
                                            var dialOutUrl = configAddr.substring(0, configAddr.lastIndexOf(":"))
                                                + assAddr.substring(assAddr.lastIndexOf(':')) +
                                                '/app?Action=Dialout&ActionID=' + actionId
                                                + '&Account=' + account + '&Exten=' + exten
                                                + '&FromExten=' + fromExten + '&PBX=' + pbxInfo._id;
                                            if(extenType != null && extenType != 'null'){
                                                dialOutUrl += ("&ExtenType=" + extenType);
                                            }
                                            http.sendGet(dialOutUrl, function(err, httpResult){
                                                httpResult = JSON.parse(httpResult);
                                                if(err){
                                                    log.app.error('Dialout interface send http request to pbx[' + pbxInfo._id + '] error!');
                                                    result.Message = '500 Server error';
                                                    util.sendResult(result , res, req.id());
                                                }else{
                                                    util.sendResult(httpResult , res, req.id());
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        })
    }
};

module.exports = service;