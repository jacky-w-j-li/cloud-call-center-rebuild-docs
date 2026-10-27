var config = require("appConfig");
var logger = require("appLog");
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var http = require("appHttp");
var config = require("appConfig");
var accountHandler = require(__baseDir + "/7moor/account/AccountHandler");
var ivrHandler = require(__baseDir + "/7moor/ivr/IvrHandler");
var billLoginHandler = require(__baseDir + "/7moor/ucenter/BillLoginHandler");


var handler = {
    handle: function (req, res) {
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        var code = query.code;
        if (code) {
            var url = config.serviceUrl + "?Action=taobao&code=" + code;
            http.sendGet(url, function (err, response) {
                if (!err && response) {
                    var resData = JSON.parse(response);
                    if (resData.Succeed) {
                        var u_id = resData.taobao_user_id;
                        var u_nick = resData.taobao_user_nick;
                        if (u_id && u_nick) {
                            mongo.db().collection("platform_account").findOne({t_id : u_id},function(err,dbAccount){
                                if(dbAccount){
                                    billLoginHandler.getTbSessionId(dbAccount,res);
                                } else {
                                    var accountData = {
                                        companyName: u_nick,
                                        createMethod: "taobao",
                                        linkManEmail: "",
                                        linkManName: "",
                                        linkManPhone: "",
                                        name: "taobao_"+utils.UUID.generateUuid(),
                                        managerPassword: "taobao",
                                        t_status : false,
                                        t_id : u_id
                                    };
                                    accountHandler.createNewAccount(accountData,{user:{_id:"system"}},function(accountResult){
                                        if(accountResult.success){
                                            var ivrData = {
                                                _id: accountResult.account._id,
                                                name: accountResult.account.name,
                                                companyName: accountResult.account.companyName
                                            };
                                            ivrHandler.addAccount(ivrData,function(isSuccess){
                                                if(isSuccess){
                                                    billLoginHandler.getTbSessionId(dbAccount,res);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            logger.app.error("taobao grand faild!",new Error(""));
                            billLoginHandler.getTbSessionId(null,res);
                        }
                    } else {
                        logger.app.error("request java service for taobao not success!", new Error(""));
                        billLoginHandler.getTbSessionId(null,res);
                    }
                } else {
                    logger.app.error("request java service error!", err || new Error(""));
                    billLoginHandler(null,res);
                }
            });
        }

    }
}

module.exports = handler;
