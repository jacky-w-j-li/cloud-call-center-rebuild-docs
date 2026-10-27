/**
 * Created by sjc on 16/11/28.
 */
var util = require("appUtil/Utils");
var md5 = require("crypto/md5");
var log = require("appLog");
var Thenjs = require("thenjs");
var restUtil = require(__baseDir + '/com/common/restUtil');
var mongo = require("appDb/MongoDb");

var service = {
    getCCAgentsByAcc : function(req, res, next){
        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if (action.err) {
                    result = {code: 400, message: action.err};
                    util.sendResult(result, res, req.id());
                    return;
                }
                var result = {code : 200 , message :"account get information success!"};//
                var data = action.data;
                if(!data.account){
                    result = {code : 402, message: 'Account is null'};
                    util.sendResult(result , res, req.id());
                    return;
                }
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
                var query = {account: data.account};
                if(data.Exten){
                    query.exten = data.Exten;
                }
                    mongo.ccDb('bill').collection('platform_user').find(query, returnDoc).toArray(function(err,noList){
                    if(!err){
                        result.data = noList;
                    } else {
                        result = {code : 500, message: 'find account agents err!'};
                    }
                    util.sendResult(result , res, req.id());
                });
            }
        })
    },
    getAccountInterInfo : function(req, res, next){
        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if (action.err) {
                    result = {code: 400, message: action.err};
                    util.sendResult(result, res, req.id());
                    return;
                }

                var result = {code : 200 , message :"account get information success!"};//
                var data = action.data;
                if(!data.accountName_query){
                    result = {code : 401, message: 'Please check your parameters'};
                    util.sendResult(result , res, req.id());
                    return;
                }

                var resultData = {};
                var query = {
                    name:data.accountName_query
                }

                mongo.db().collection('account_protect').findOne({_id:data.accountName_query},function(err,protectAccount){
                    if(err || protectAccount){
                        result = {code: 402, message: "get account info err"};
                        util.sendResult(result , res, req.id());
                    }else{
                        mongo.ccDb("bill").collection('platform_account').find(query).toArray(function(err,docproduct){
                            if(err || !docproduct){
                                result = {code: 402, message: "get account info err"};
                                util.sendResult(result , res, req.id());
                            }else{
                                query.product = "cc";
                                mongo.ccDb("bill").collection('platform_account_product').findOne(query,function(err,docu){
                                    if(err){
                                        result = {code: 402, message: "get account info err"};
                                        util.sendResult(result , res, req.id());
                                    }else{
                                        if(!docu){
                                            result = {code : 406, message: '账号未开通呼叫中心产品！'};
                                            util.sendResult(result , res, req.id());
                                        }else if(!docu.pbx){
                                            result = {code : 405, message: '账号未开通呼叫功能，请检查！'};
                                            util.sendResult(result , res, req.id());
                                        }else{
                                            var pbxArr = [];
                                            var idArr = [];
                                            resultData.account = docu.account;
                                            resultData.accountName = docu.name;
                                            var pbxs = docu.pbx;
                                            for(var i=0;i<pbxs.length;i++){
                                                idArr.push(pbxs[i].PBX)
                                            }

                                            var find = {
                                                _id:{"$in" : idArr}
                                            }
                                            mongo.ccDb("bill").collection('platform_cc_pbx').find(find).toArray(function(err,docuPBX){
                                                if(err){
                                                    result = {code: 402, message: "get account info err"};
                                                    util.sendResult(result , res, req.id());
                                                }else{

                                                    var pbxInfo = {
                                                        pbxId : docuPBX[0]._id,
                                                        assAddr : docuPBX[0].assDomain?docuPBX[0].assDomain:""
                                                    }
                                                    resultData.pbx = pbxInfo;
                                                    mongo.db().collection('account_secret').findOne({_id:docu.account},function(err,docSec){
                                                        if(err){
                                                            result = {code: 402, message: "get account info err"};
                                                            util.sendResult(result , res, req.id());
                                                        }else {
                                                            if (!docSec) {
                                                                mongo.db().collection('account_secret').findOne({_id:data.account},function(err,docSec){
                                                                    if(err){
                                                                        result = {code: 402, message: "get account info err"};
                                                                        util.sendResult(result , res, req.id());
                                                                    }else{
                                                                        if(docSec){
                                                                            mongo.db().collection('account_secret').insert({_id:docu.account,secret:docSec.secret},{w:1},function(err){
                                                                                if(err){
                                                                                    result = {code: 402, message: "get account info err"};
                                                                                    util.sendResult(result , res, req.id());
                                                                                }else{
                                                                                    result.data = resultData;
                                                                                    util.sendResult(result , res, req.id());
                                                                                }
                                                                            });
                                                                        }else{
                                                                            result.data = resultData;
                                                                            util.sendResult(result , res, req.id());
                                                                        }
                                                                    }
                                                                });
                                                            }else{
                                                                result.data = resultData;
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

                        });
                    }
                });
            }
        })
    }
}


module.exports = service;