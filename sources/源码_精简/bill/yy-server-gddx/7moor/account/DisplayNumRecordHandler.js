var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig');
var httpProvider = require("appHttp");

var DisplayNumRecord = require(__baseDir + "/models/DisplayNumRecord");
var Account = require(__baseDir + "/models/Account");


var Then = require("thenjs");

var handler = {
    queryDisplayNumRecord : function(data,session,callback){
        var limit = data.limit || 10;
        var page = data.page || 1;

        delete data.limit;
        delete data.page;

        var condition = data;

        Then(function(cont){
            DisplayNumRecord.findByPage(condition,limit,page,cont);
        })
            .then(function(cont,records,count){
                var accountIds = [];
                records = records || [];
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
                })
            })
            .fail(function(cont,err){
                logger.app.warn("queryDisplayNumRecord error", err);
                callback({
                    success : false,
                    message : "查询透传号码备案异常！",
                });
            });
    },
    addDisplayNumRecord : function(data,session,callback){
        if(!data.account){
            return callback({
                success : false,
                message : "缺失参数!",
            })
        }

        var insert = utils.collect(data,{_id : utils.UUID.generateUuid(),createTime : utils.DateTime.getCurrentDateTime(),lastUpdateTime : utils.DateTime.getCurrentDateTime(),operator : session.user._id});

        Then()
            .then(function(cont){
                Account.get(data.account,function(err,account){
                    if(err){
                        return cont(err);
                    }

                    if(!account){
                        return callback({
                            success : false,
                            message : '账户不存在!',
                        });
                    }

                    cont();
                })
            })
            .then(function(cont){
                //号码同步给云通讯
                if(data.line != '0001' || !data.displayNums || data.displayNums.length <= 0){
                    return cont();
                }

                var displayNums = data.displayNums;
                Then()
                    .eachLimit(displayNums,function(cont_,num){
                        handler.syncYtxNum(num,num,cont_);
                    },5)
                    .then(function(cont_){
                        return cont();
                    })
                    .fail(function(cont_,err){
                        return cont(err);
                    });
            })
            .then(function(cont){
                DisplayNumRecord.add(insert,cont);
            })
            .then(function(cont){
                return callback({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.warn("addDisplayNumRecord error", err);
                callback({
                    success : false,
                    message : "新增透传号码备案异常！",
                });
            });
    },

    updateDisplayNumRecord : function(data,session,callback){
        var condition = {_id : data._id};
        delete data._id;
        var update = utils.collect(data,{lastUpdateTime : utils.DateTime.getCurrentDateTime(),operator : session.user._id});

        Then()
            .then(function(cont){
                //号码同步给云通讯
                if(data.line != '0001' || !data.displayNums || data.displayNums.length <= 0){
                    return cont();
                }

                var displayNums = data.displayNums;
                Then()
                    .eachLimit(displayNums,function(cont_,num){
                        handler.syncYtxNum(num,num,cont_);
                    },5)
                    .then(function(cont_){
                    })
                    .fail(function(cont_,err){
                        return cont(err);
                    });
                return cont();
            })
            .then(function(cont){
                DisplayNumRecord.update(condition,update,cont);
            })
            .then(function(cont){
                return callback({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.warn("updateDisplayNumRecord error", err);
                callback({
                    success : false,
                    message : "新增透传号码备案异常！",
                });
            });
    },
    removeDisplayNumRecord : function(data,session,callback){
        var condition = {_id : data._id};
        Then()
            .then(function(cont){
                DisplayNumRecord.remove(condition,cont);
            })
            .then(function(cont){
                return callback({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.warn("removeDisplayNumRecord error", err);
                callback({
                    success : false,
                    message : "删除透传号码备案异常！",
                });
            });
    },
    syncYtxNum:function(begin,end,cb){
        var url = config.serviceUrl+'?Action=ytxCommitDisplayNumbers&begin=' + begin+'&end='+end;
        url=encodeURI(url);

        httpProvider.sendGet(url, function(err, result){
            if(err){
                logger.request.error(err);
                return cb(err);
            }
            if(result){
                try{
                    var res = JSON.parse(result);
                    if(res.Succeed){
                        return cb();
                    }
                }catch (e) {
                    logger.request.error(e);
                    return cb(e);
                }
            }

            return cb(new Error('request service[syncYtxNum] error!'));
        });
    }
};

module.exports = handler;
