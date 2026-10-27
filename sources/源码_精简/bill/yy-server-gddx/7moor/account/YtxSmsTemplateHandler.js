var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var YTXSmsTemplate = require(__baseDir + '/models/YTXSmsTemplate');
var Account = require(__baseDir + '/models/Account');
var Then = require("thenjs");
var config = require('appConfig');
var http = require("appHttp");

var handler = {
    queryYtxSmsTemplate: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);
        if(condition.query.ytxverification){
            condition.query.ytxverification = parseInt(condition.query.ytxverification);
        }

        Then()
            .parallel([
                function(cont){
                    YTXSmsTemplate.findByPage(condition.query,condition.limit,condition.page,cont);
                },
                function(cont){
                    YTXSmsTemplate.count(condition.query,cont);
                }
            ])
            .then(function(cont,res){
                var accountIds = [];
                var records = res[0];
                var count = res[1];

                records.forEach(function(record){
                    if(accountIds.indexOf(record.account) < 0){
                        accountIds.push(record.account);
                    }
                });
                Account.findSomeAccountAccounts(accountIds,function(err,accountAccounts){
                    if(err){
                        return cont(err);
                    }

                    records.forEach(function(record){
                        record.accountName = (accountAccounts[record.account] || {}).companyName;
                    });
                    cont(null,records,count);
                });
            })
            .then(function(cont,records,count){
                return callback({
                    success : true,
                    count : count,
                    list : records,
                });
            })
            .fail(function(cont,err){
                logger.app.error('query ytx sms template failed',err);
                return callback({
                    success : false,
                    message : '查询云通讯短信备案失败,'+err.message,
                })
            })
    },
    syncYtxSmsTemplate:function(data,session,callback) {
        var templateid = data.templateid;
        var appid = data.appid;
        var url = config.serviceUrl + '?Action=YTXtemplateSelect&templateid='+templateid+"&appid="+appid;
        http.sendGet(url, function (err, res) {
            if (!err && res) {
                try {
                    var res = JSON.parse(res);
                    if (res.Succeed) {
                        callback({
                            success:true
                        });
                    } else {
                        callback({
                            success:false,
                            message:'同步云通讯短信备案失败',
                        });
                    }
                } catch (e) {
                    logger.request.error("equest service error!", url, e);
                    callback({
                        success:false,
                        message:'同步云通讯短信备案失败',
                    });
                }
            } else {
                var err = err || new Error("request service error!");
                logger.request.error("", url, err);
                callback({
                    success:false,
                    message:'同步云通讯短信备案失败'
                });
            }
        });
    }
};

var _impl = {
    _extractGridCondition : function(data){
        var condition = {
            limit : data.limit || 10,
            page  : data.page || 1,
            query : function(){
                delete data.limit;
                delete data.page;

                return data;
            }()};

        return condition;
    },
}

module.exports = handler;
