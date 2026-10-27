var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var config = require('appConfig');
var httpProvider = require("appHttp");

var handler = {
    deleteIntlFee:function(data, session, callback){
        var result = {success: false};
        delete data._id;
        mongo.db().collection(constants.DB.bill_open_intlfee).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteLine  error", err);
                result.message = "删除服务号国际长途业务异常！";
                callback(result);
            }
        });

    },
    _initConditionTime:function(query){
        var beginTime = query.begin;
        var endTime = query.end;

        if (beginTime) {
            query.createTime = {
                $gte: beginTime + " 00:00:00"
            }
            delete query.begin;
        }
        if (endTime) {
            if (query.createTime) {
                query.createTime.$lte = endTime + " 23:59:59"
            } else {
                query.createTime = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete query.end;
        }

    },
    queryOpenIntlFeeHistory: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.num) {
            data.num = new RegExp(data.num);
        }
        handler._initConditionTime(data);
        mongo.db().collection(constants.DB.bill_open_intlfee).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_open_intlfee).find(data, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                    if (!err) {
                        result.list = docs || [];
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryOpenIntlFeeHistory list error", err);
                        result.message = "查询开通国际长途历史异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryOpenIntlFeeHistory count error", err);
                result.message = "查询开通国际长途历史异常！";
                callback(result);
            }
        });
    },

    addIntlFeeNum: function (data, session, callback) {
        var result = {success: false};
        var uid=session.user._id;
        var type = data.serviceNumAddType.serviceNumAddType;
        if (type) {
            var num = {
                type :type,
                num: data.num,
                memo: data.memo,
                operator : uid,
                createTime: utils.DateTime.getCurrentDateTime()
            };
            var begin="";
            var end="";
            if (type == "single") {
                begin=data.num;
                end=data.num;
            } else {
                begin = data.beginServiceNum + "";
                end = data.endServiceNum + "";
                num.num=begin+"-"+end;
            }
            mongo.db().collection(constants.DB.bill_open_intlfee).findOne({num:data.num},function (err,oneNum) {
                if(!err){
                    if(oneNum){
                        result.message = "该服务号已开通国际长途！";
                        callback(result);
                    }else{
                        mongo.db().collection(constants.DB.bill_open_intlfee).insert(num,function (err) {
                            if (!err) {
                                handler.syncYtxNum(begin,end,function(rep){
                                    if(!rep){
                                        result.success = true;
                                        callback(result);
                                    }else{
                                        callback(rep);
                                    }
                                })
                            } else {
                                logger.app.warn(err);
                                result.message = "开通国际长途异常！";
                                callback(result);
                            }
                        });
                    }
                }else{
                    logger.app.warn(err);
                    result.message = "查询！";
                    callback(result);
                }

            });
        } else {
            logger.app.warn("add intlFee type is empty!", new Error());
            result.message = "添加类型不能为空！";
            callback(result);
        }
    },

    syncYtxNum:function(begin,end,callback){
        var url = config.serviceUrl+'?Action=ytxCommitDisplayNumbers&begin=' + begin+'&end='+end;
        url=encodeURI(url);
        httpProvider.sendGet(url, function(err, result){
            if(!err && result){
                try{
//                    console.info("1111====="+result.toString());
                    var res = JSON.parse(result);
                    if(res.Succeed){
                        callback(null);
                    }else{
                        callback(new Error('request service[syncYtxNum] error!'));
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            }else{
                var error = err || new Error('request service[syncYtxNum] error!');
                logger.request.error(error);
                callback(error);
            }
        });
    }
};


module.exports = handler;

