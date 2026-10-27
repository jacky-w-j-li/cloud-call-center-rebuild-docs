var util = require("appUtil/Utils");
var log = require("appLog");
var mongo = require("appDb/MongoDb");
var restUtil = require(__baseDir + '/com/common/restUtil');
var http = require('appHttp');

var service = {
    updateUser:function(req, res, next) {
        var result = {};
        restUtil.restAuthorization(req, res, function (authorization) {
            if (authorization) {
                var account = req.params.account;
                var exten = req.params.exten;
                if (account == null || account == "" || exten == null || exten == "") {
                    result.code = 400;
                    result.message = "please check your parametes";
                    util.sendResult(result);
                }

                var query = {account:account,exten:exten};
                mongo.ccDb("bill").collection("platform_user").findOne(query,function (err, doc) {
                    if (err) {
                        log.app.error(err.stack);
                        result.message = "Internal Server Error";
                        result.code = 500;
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    if(doc == null){
                        result.code = 210;
                        result.message = "user not found";
                        util.sendResult(result,res,req.id());
                        return ;
                    }
                    var update = {$set:{}};
                    if (!req.params.displayName && !req.params.email && !req.params.password && !req.params.mobile) {
                        result.code = 400;
                        result.message = "please check your parameters";
                        util.sendResult(result,res,req.id());
                        return ;
                    }
                    if(req.params.displayName){
                        update.$set.displayName = req.params.displayName;
                    }
                    if(req.params.email){
                        update.$set.email = req.params.email;
                    }
                    if(req.params.password){
                        update.$set.password = req.params.password;
                    }
                    if(req.params.mobile){
                        update.$set.mobile = req.params.mobile;
                    }
                    mongo.ccDb("bill").collection("platform_user").update(query,update,function(err) {
                        if (err) {
                            log.app.error(err.stack);
                            result.message = "Internal Server Error";
                            result.code = 500;
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        result.code = 200;
                        result.message = "200 OK";
                        util.sendResult(result,res,req.id());
                        return ;
                    });
                });
            }

        });
    },
    queryUserState:function(req, res, next) {
        var result = {};
        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var account = req.params.account;
                var actionId = 'queryExtenState'+Math.random();
                var exten = req.params.exten;
                var pbx = "";
                var assAddr = "";
                if(account == null || exten == null){
                    result.code = 400;
                    result.message = 'please check your parameters';
                    util.sendResult(result , res, req.id());
                }else{
                    mongo.ccDb('bill').collection('platform_user').findOne({account:account,exten:exten}, function (err, doc) {
                        if (err) {
                            result.message = '500 Server error';
                            log.app.error('queryUserState interface find pbx error!' + err);
                            util.sendResult(result, res, req.id());
                        } else {
                            if(doc == null){
                                result.code = 210;
                                result.message = "user not found";
                                util.sendResult(result,res,req.id());
                                return;
                            }
                            pbx = doc.pbx;
                            mongo.ccDb('bill').collection('platform_cc_pbx').findOne({_id:pbx},function(err,doc){
                                if (err) {
                                    result.message = '500 Server error';
                                    log.app.error('queryUserState interface find assAddr error!' + err);
                                    util.sendResult(result, res, req.id());
                                } else {
                                    assAddr = doc.assAddr;
                                    var configAddr = doc.configAddr;
                                    assAddr = configAddr.substring(0, assAddr.lastIndexOf(":")) + assAddr.substring(assAddr.lastIndexOf(":"));
                                    var queryUserStateUrl = assAddr+"/app?Action=QueryExtenState&ActionID="+actionId+"&Account="+account+"&Exten="+exten+"&PBX="+pbx;
                                    http.sendGet(queryUserStateUrl, function(err, httpResult){
                                        httpResult = JSON.parse(httpResult);
                                        if(err){
                                            log.app.error('queryUserState interface send http request to pbx error!');
                                            result.code = 500;
                                            result.message = 'Internal Server Error';
                                            util.sendResult(result , res, req.id());
                                        }else{
                                            if(httpResult.Flag){
                                                result.code = 200;
                                                result.data = {flag:httpResult.Flag,state:httpResult.Message}
                                            }else{
                                                result.code = 210;
                                                result.message = 'user not exist';
                                            }
                                            util.sendResult(result , res, req.id());
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    }
};
module.exports = service;