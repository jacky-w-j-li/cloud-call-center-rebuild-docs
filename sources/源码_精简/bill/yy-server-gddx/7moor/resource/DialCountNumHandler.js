var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig')
var redis = require("redis"),
    client = redis.createClient(config.ccRedisPort, config.ccRedisIp);
    client.auth(config.ccRedisPwd);

var handler = {
    queryCallSum:function(key,session,callback){
        client.select(2);
        var result = {success:false};
            client.get(key, function(err, reply){
                if(!err){
                    result.success = true;
                    result.list = reply;
                    callback(result);
                }else{
                    result.message = '查询拨号计数失败,'+err.message;
                    logger.app.error('query dial count failed',err);
                    callback(result);
                }

            });

    },
    queryDialCount: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);
        var result = {success:false};

        _impl._queryDialCount(condition,function(err,count,resData){
            if(!err){
                result.success = true;
                result.count = count;
                result.list = resData;
            }else{
                result.message = '查询拨号计数失败,'+err.message;
                logger.app.error('query dial count failed',err);
            }
            callback(result);
        });
    },
    //账号唯一验证
    queryDialId: function(data,session,callback) {
        var condition={
            _id:data
        }
        var result = {success:false};

        _impl._queryDialId(condition,function(err,count,resData){
            if(!err){
                result.success = true;
                result.count = count;
                result.list = resData;
            }else{
                result.message = '查询拨号计数失败,'+err.message;
                logger.app.error('query dial count failed',err);
            }
            callback(result);
        });
    },
    queryAccountCount: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);
        var result = {success:false};

        _impl._queryAccountCount(condition,function(err,count,resData){
            if(!err){
                result.success = true;
                result.count = count;
                result.list = resData;
            }else{
                result.message = '查询拨号计数失败,'+err.message;
                logger.app.error('query dial count failed',err);
            }

            callback(result);
        });
    },
    queryCompanyName: function(data,session,callback) {
        var result = {success:false};

        var condition={
            _id:data
        }

        _impl._queryAccountCountSet(condition,function(err,resData){
            if(!err){
                result.success = true;
                result.list = resData;
            }else{
                result.message = '查询拨号计数失败,'+err.message;
                logger.app.error('query dial count failed',err);
            }

            callback(result);
        });
    },
    updateDialCount: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data._id,
        };
        var update = {
            callCount : data.callCount,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
        }
        _impl._updateDialCount(condition,update,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新拨号计数失败,"+err.message ;
                logger.app.error("update dial count  failed",err);
            }
            callback(result);
        });
    },
    //设置账户拨号
    updateDialCountAcc: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data.account,
        };
        //[name: "3", companyName: "无", accountCount: "1", accountResidualCount: "0"]
        var update={
            _NIndex:utils.UUID.generateUuid(),
            name:data.name,
            companyName:data.companyName,
            accountCount:data.accountCount,
            accountResidualCount:data.accountResidualCount
        };
        _impl._updateDialCountAcc(condition,update,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新拨号计数失败,"+err.message ;
                logger.app.error("update dial count  failed",err);
            }
            callback(result);
        });
    },

    //修改账户限制
    updateDialCountAccSet: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data.account,
            "account._NIndex":data._NIndex
        };
        //$set:{"account.$.companyName":"7moorsss","account.$.accountCount": "1"}
        var update={
            "account.$.name":data.name,
            "account.$.companyName":data.companyName,
            "account.$.accountCount":data.accountCount,
            "account.$.accountResidualCount":data.accountResidualCount
        };
        _impl._updateDialCountAccSet(condition,update,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新拨号计数失败,"+err.message ;
                logger.app.error("update dial count  failed",err);
            }
            callback(result);
        });
    },



    //添加拨号计数失败列表
    addDialCountNum: function(data,session,callback){
        var result = {success: false};
        var insert ={
            _id : data._id,
            callCount : data.callCount,
            residualCount : data.callCount,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
            createTime : utils.DateTime.getCurrentDateTime(),
        };
        _impl._addDialCountNum(insert,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = ","+err.message;
                logger.app.error("add dial count failed",err);
            }
            callback(result);
        });
    },
    removeDialCount: function(data,session,callback){
        var result = {success:false};
        var condition = {
            _id : data._id,
        };
        _impl._removeDialCount(condition,function(err){
            if(!err){
                result.success = true;
            } else{
                result.message = "删除拨号计数失败,"+err.message;
                logger.app.error("remove dial count failed",err);
            }
            callback(result);
        });
    },
    //删除拨号计数中的数组元素
    removeAccountCount: function(data,session,callback){
        var result = {success:false};
        var condition = {
            _id : data.id,
        };
        var update ={
            name : data.name
        }
        _impl._removeAccountCount(condition,update,function(err){
            if(!err){
                result.success = true;
            } else{
                result.message = "删除账户计数失败,"+err.message;
                logger.app.error("remove dial count failed",err);
            }
            callback(result);
        });
    }


};

var _impl = {
    _extractGridCondition : function(data){
        var condition = {
            limit : data.limit || 10,
            skip  : ((data.page || 1) - 1) * (data.limit || 10),
            query : function(){
                delete data.limit;
                delete data.page;

                return data;
            }()};

        return condition;
    },
    _queryDialCount : function(condition,callback) {
        mongo.db().collection(constants.DB.call_count_set).count(condition.query,function(err,count){
            if(err){
                logger.app.err("query dial_count count error");
                callback(err);
                return;
            }

            mongo.db().collection(constants.DB.call_count_set).find(condition.query,{sort:{_id:1},limit:condition.limit,skip:condition.skip}).toArray(function(err,records){
                if(err){
                    logger.app.err("query sms dial_count  list error");
                    callback(err);
                    return;
                }

                callback(null,count,records);
            });
        });
    },
    _queryDialId : function(condition,callback) {
        mongo.db().collection(constants.DB.call_count_set).find(condition).toArray(function(err,records){
            if(err){
                logger.app.err("query sms dial_count  list error");
                callback(err);
                return;
            }
            callback(null,records);
        });
    },
    _queryAccountCount : function(condition,callback) {
        mongo.db().collection(constants.DB.call_count_set).count(condition.query,function(err,count){
            if(err){
                logger.app.err("query dial_count count error");
                callback(err);
                return;
            }

            mongo.db().collection(constants.DB.call_count_set).find(condition.query,{sort:{_id:1},limit:condition.limit,skip:condition.skip}).toArray(function(err,records){
                if(err){
                    logger.app.err("query sms dial_count  list error");
                    callback(err);
                    return;
                }
                callback(null,count,records[0].account);
            });
        });
    },
    _queryAccountCountSet : function(condition,callback) {
        mongo.db().collection(constants.DB.platform_account).find(condition).toArray(function(err,records){
            if(err){
                logger.app.err("query sms dial_count  list error");
                callback(err);
                return;
            }
            callback(null,records);
        });
    },
    _updateDialCount : function(condition, update,callback){
        mongo.db().collection(constants.DB.call_count_set).update(condition, {$set: update}, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });
    },
    _updateDialCountAcc:function (condition, update,callback) {
        mongo.db().collection(constants.DB.call_count_set).update(condition, {$push: {account:update}}, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    },
    _updateDialCountAccSet:function (condition, update,callback) {
        //db.getCollection('call_count_set').update({"_id":"1024744689","account._NIndex" : "94333320-9440-11e6-be32-61a2896df793"},{$set:{"account.$.companyName":"7moorsss","account.$.accountCount": "1"}})
        mongo.db().collection(constants.DB.call_count_set).update(condition, {$set:update}, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    },
    _addDialCountNum : function(insert,callback){
        mongo.db().collection(constants.DB.call_count_set).insert(insert, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });
    },
    _removeDialCount : function(condition,callback){
        mongo.db().collection(constants.DB.call_count_set).remove(condition, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    },
    _removeAccountCount : function(condition,update,callback){
        //db.getCollection('call_count_set').update({ _id:'234' },{$pull : {'account' :{'name' :'6'} }})
        mongo.db().collection(constants.DB.call_count_set).update(condition,{$pull: {account:update}}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    }

};


module.exports = handler;
