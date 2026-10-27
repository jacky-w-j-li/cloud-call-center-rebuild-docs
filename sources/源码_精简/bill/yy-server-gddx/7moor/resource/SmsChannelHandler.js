var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    querySmsChannel: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);
        var result = {success:false};

        _impl._querySmsChannel(condition,function(err,count,resData){
            if(!err){
                result.success = true;
                result.count = count;
                result.list = resData;
            }else{
                result.message = '查询短信通道失败,'+err.message;
                logger.app.error('query sms channel failed',err);
            }

            callback(result);
        });
    },
    updateSmsChannel: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data._id,
        };
        var update = {
            name : data.name,
            type : data.type,
            price : utils.formatFee(data.price),
            memo : data.memo,
            updateUser: session.user._id,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
        }
        _impl._updateSmsChannel(condition,update,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新短信通道失败,"+err.message ;
                logger.app.error("update sms channel failed",err);
            }
            callback(result);
        });
    },
    addSmsChannel: function(data,session,callback){
        var result = {success: false};
        var insert ={
            _id : data._id,
            name : data.name,
            type : data.type,
            price : utils.formatFee(data.price),
            memo : data.memo,
            createUser: session.user._id,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
            createTime : utils.DateTime.getCurrentDateTime(),
        };
        _impl._addSmsChannel(insert,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "添加短信通道失败,"+err.message;
                logger.app.error("add sms channel failed",err);
            }
            callback(result);
        });
    },
    removeSmsChannel: function(data,session,callback){
        var result = {success:false};
        var condition = {
            _id : data._id,
        };
        _impl._removeSmsChannel(condition,function(err){
           if(!err){
               result.success = true;
           } else{
               result.message = "删除短信通道失败,"+err.message;
               logger.app.error("remove sms channel failed",err);
           }
            callback(result);
        });
    },
    getSmsChannelCache: function (data, session, callback) {
        var data = data || {};
        mongo.db().collection(constants.DB.platform_sms_channel).find(data).toArray(function (err, smsChannels) {
            if (!err) {
                smsChannels = smsChannels || [];
                var caches = [];
                var cache = {
                    codeType: "smsChannel",
                    codeOrder: 1,
                    codeName: '--设置为空--',
                    codeValue: ''
                };
                caches.push(cache);
                var count=1;
                for (var i = 0; i < smsChannels.length; i++) {
                    var cache = {
                        codeType: "smsChannel",
                        codeOrder: count++ ,
                        codeName: smsChannels[i].name,
                        codeValue: smsChannels[i]._id,
                        smsSplitBaseNum: smsChannels[i].smsSplitBaseNum,
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
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
    _querySmsChannel : function(condition,callback) {
        mongo.db().collection(constants.DB.platform_sms_channel).count(condition.query,function(err,count){
            if(err){
                logger.app.err("query sms channel count error");
                callback(err);
                return;
            }

            mongo.db().collection(constants.DB.platform_sms_channel).find(condition.query,{sort:{_id:1},limit:condition.limit,skip:condition.skip}).toArray(function(err,records){
                if(err){
                    logger.app.err("query sms channel list error");
                    callback(err);
                    return;
                }

                callback(null,count,records);
            });
        });
    },
    _updateSmsChannel : function(condition, update,callback){
        mongo.db().collection(constants.DB.platform_sms_channel).update(condition, {$set: update}, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });
    },
    _addSmsChannel : function(insert,callback){
        mongo.db().collection(constants.DB.platform_sms_channel).insert(insert, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                if (err.code == "11000") {
                    err.message = "短信通道编号重复!";
                }
                callback(err);
            }
        });
    },
    _removeSmsChannel : function(condition,callback){
        mongo.db().collection(constants.DB.platform_sms_channel).remove(condition, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    }

};


module.exports = handler;
