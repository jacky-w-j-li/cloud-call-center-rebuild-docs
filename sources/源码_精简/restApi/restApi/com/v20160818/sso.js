var util = require("appUtil/Utils");
var md5 = require("crypto/md5");
var log = require("appLog");
var Thenjs = require("thenjs");
var restUtil = require(__baseDir + '/com/common/restUtil');
var mongo = require("appDb/MongoDb");

var service = {
    checkTokenLegal : function(req , res , next){

        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if (action.err) {
                    result = {code: 400, message: action.err};
                    util.sendResult(result, res, req.id());
                    return;
                }
                var data = action.data;
                if(!data.token || !data.tokenId){
                    result = {code : 400, message: 'Please check your parameters'};
                    util.sendResult(result , res, req.id());
                    return;
                }

                var result = {code : 200 , message :"token check success!"};//合法请求 校验成功
                if(!data.token || !data.tokenId){
                    result = {code : 400, message: 'Please check your parameters : token and tokenId'};
                    util.sendResult(result , res, req.id());
                    return;
                }
                mongo.ccDb("bill").collection("platform_token").findOne({"_id":data.tokenId},function(err, doc) {
                    if(err){
                        result = {code: 500, message: 'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }

                    if(!doc){
                        result = {code: 501, message: 'tokenId not found!'};//未查询到对应token数据
                        util.sendResult(result, res, req.id());
                        return;
                    }

                    var realToken = md5.hex_md5(doc._id+doc.account+doc.loginName+doc.password+doc.timeStamp)
                    if(realToken == data.token){

                        var nowTime = new Date().getTime();
                        var nTime = nowTime - doc.timeStamp;
                        if(nTime > 1*60*1000){
                            result = {code: 502, message: 'token is timeout!'};//很抱歉，token已经超时
                            util.sendResult(result, res, req.id());
                            return;
                        }

                        util.sendResult(result, res, req.id());
                        return;
                    }else{
                        result = {code: 503, message: 'token is illegal!'};//token不匹配，非法请求
                        util.sendResult(result, res, req.id());
                        return;
                    }
                });
            }
        })
    },
    getToken : function(req , res , next){
        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if(action.err){
                    result = {code : 400, message: action.err};
                    util.sendResult(result , res, req.id());
                    return;
                }
                var data = action.data;
                if(!data.account || !data.exten || !data.password || !data.timeStamp){
                    result = {code : 400, message: 'Please check your parameters'};
                    util.sendResult(result , res, req.id());
                    return;
                }

                var result = {};
                var token = "";
                var accountName = "";
                var loginName = "";
                var findAcc = {
                    account:data.account,
                    product:'cc'
                }
                mongo.ccDb("bill").collection("platform_account_product").findOne(findAcc,function(err,doc){
                    if(err){
                        util.send403(result, res, req.id());
                        return;
                    }
                    if(!doc){
                        result = {code:'401', message:'account not found or callcenter not opened!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    if(data.extentype != "Local" && data.extentype !="sip" && data.extentype !="gateway" && data.extentype !="null"){
                        result = {code : '405', message: 'extentype is wrong'};
                        util.sendResult(result , res, req.id());
                        return;
                    }
                    accountName = doc.name;
                    loginName = data.exten + "@" + doc.name;
                    var query = {
                        account:data.account,
                        exten:data.exten
                    }
                    mongo.ccDb("bill").collection("platform_user").findOne(query,function(err,doc){
                        if(err){
                            util.send403(result, res, req.id());
                            return;
                        }
                        if(!doc){
                            result = {code:'402', message:'exten not found!'};
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        var tokenStr = "7moor"
                        var passwordMd5 = md5.hex_md5(tokenStr+data.account+data.exten+doc.password+data.timeStamp);
                        if(passwordMd5 != data.password){
                            result = {code:'404', message:'password is wrong!'};
                            util.sendResult(result, res, req.id());
                            return;
                        }

                        var uuid = util.UUID.generateUuid();
                        var userid = doc._id;
                        var password = doc.password;
                        var exten = data.exten;
                        var extentype = data.extentype;
                        var phoneTokenInUse = (data.extentype == "null")? true : false;
                        var module = data.module;
                        var account = doc.account;
                        var nowTime = util.getCurrentDate();
                        var timeStamp = new Date().getTime();

                        token = md5.hex_md5(uuid+account+exten+password+timeStamp);

                        var dataToken = {
                            _id : uuid,
                            account : account,
                            accountName : accountName,
                            loginName : loginName,
                            tokenType:"cc",
                            state:"usable",
                            userid : userid,
                            exten:exten,
                            extenType:extentype,
                            phoneTokenInUse:phoneTokenInUse,
                            module:module,
                            password : password,
                            timeStamp : timeStamp,
                            creatTime : nowTime,
                            token : token
                        };
                        mongo.db("bill").collection("platform_token").insert(dataToken,{w:1},function(err){
                            if(err){
                                callback(null,err);
                            }
                            result = {code:'200', message:'200 ok!'};
                            result.token=token;
                            util.sendResult(result, res, req.id());
                            return;
                        });
                    });
                });
            }
        });


        //Thenjs(function(cont){
        //    var findAcc = {
        //        account:data.account,
        //        product:'cc'
        //    }
        //    mongo.ccDb("bill").collection("platform_account_product").findOne(findAcc,cont);
        //
        //}).then(function(cont , doc){
        //    if(!doc){
        //        result = {code:'401', message:'account not found or callcenter not opened!'};
        //        util.sendResult(result, res, req.id());
        //        return;
        //    }
        //    accountName = doc.name;
        //    loginName = data.exten + "@" + doc.name;
        //    var query = {
        //        account:data.account,
        //        exten:data.exten
        //    }
        //    mongo.ccDb("bill").collection("platform_user").findOne(query,cont);
        //}).then(function(cont , doc){
        //    if(!doc){
        //        result = {code:'402', message:'exten not found!'};
        //        util.sendResult(result, res, req.id());
        //        return;
        //    }
        //    var tokenStr = "7moor"
        //    var passwordMd5 = md5.hex_md5(tokenStr+data.account+data.exten+doc.password+data.timeStamp);
        //    if(passwordMd5 != data.password){
        //        result = {code:'404', message:'password is wrong!'};
        //        util.sendResult(result, res, req.id());
        //        return;
        //    }
        //
        //    var uuid = util.UUID.generateUuid();
        //    var userid = doc._id;
        //    var password = doc.password;
        //    var exten = data.exten;
        //    var extentype = data.extentype;
        //    var phoneTokenInUse = (data.extentype == "null")? true : false;
        //    var account = doc.account;
        //    var nowTime = util.getCurrentDate();
        //    var timeStamp = new Date().getTime();
        //
        //    token = md5.hex_md5(uuid+account+exten+password+timeStamp);
        //
        //    var dataToken = {
        //        _id : uuid,
        //        account : account,
        //        accountName : accountName,
        //        loginName : loginName,
        //        tokenType:"cc",
        //        state:"usable",
        //        userid : userid,
        //        exten:exten,
        //        extenType:extentype,
        //        phoneTokenInUse:phoneTokenInUse,
        //        password : password,
        //        timeStamp : timeStamp,
        //        creatTime : nowTime,
        //        token : token
        //    };
        //    mongo.db("bill").collection("platform_token").insert(dataToken,{w:1},function(err){
        //        if(err){
        //            callback(null,err);
        //        }
        //        result = {code:'200', message:'200 ok!'};
        //        result.token=token;
        //        util.sendResult(result, res, req.id());
        //        return;
        //    });
        //}).fail(function(err){
        //    util.send403(res,req.id());
        //})
    }
};

var self = {
    parsePostActionData: function(req){
        var action = {};
        //action._aid = utils.UUID.generateUuid();
        log.app.info(" request["+req.id()+"] body ["+req.body +"]");
        try {
            var data = req.params;
            if (req.method == 'POST') {
                data = req.body;
            }
            action.data = data;
        } catch (e) {
            action.err = e.message;
            log.app.error("json parse error:",e);
        }
        return action;
    }
}

module.exports = service;
