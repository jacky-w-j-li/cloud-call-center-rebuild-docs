var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var config = require('appConfig');
var httpProvider = require("appHttp");

var handler = {
    queryFilingHistory: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.num) {
            data.num = new RegExp(data.num);
        }

        mongo.db().collection(constants.DB.log_filingYun).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.log_filingYun).find(data, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                    if (!err) {
                        result.list = docs || [];
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryFilingHistory list error", err);
                        result.message = "查询备案历史异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryFilingHistory count error", err);
                result.message = "查询备案历史异常！";
                callback(result);
            }
        });
    },

    addFilingNum: function (data, session, callback) {
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
            mongo.db().collection(constants.DB.log_filingYun).insert(num,function (err) {
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
                    result.message = "添加备案异常！";
                    callback(result);
                }
            });


        } else {
            logger.app.warn("add filingNum type is empty!", new Error());
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
    },
    syncYtxNewAppNum:function(begin,end,callback){
        var url = config.serviceUrl+'?Action=ytxCommitDisplayNumbers&begin='+begin+'&end='+end+'&newapp=true';
        url=encodeURI(url);
        httpProvider.sendGet(url, function(err, result){
            if(!err && result){
                try{
                    var res = JSON.parse(result);
                    if(res.Succeed){
                        callback(null);
                    }else{
                        callback(new Error('request service[syncYtxNewAppNum] error!'));
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            }else{
                var error = err || new Error('request service[syncYtxNewAppNum] error!');
                logger.request.error(error);
                callback(error);
            }
        });
    }
};

module.exports = handler;

