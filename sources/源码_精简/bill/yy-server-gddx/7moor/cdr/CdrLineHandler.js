var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    _initLineFee:function(query){
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
    _initLineDetail:function(query){
        var beginTime = query.begin;
        var endTime = query.end;

        if (beginTime) {
            query.endTimeDisplay = {
                $gte: beginTime + " 00:00:00"
            }
            delete query.begin;
        }
        if (endTime) {
            if (query.endTimeDisplay) {
                query.endTimeDisplay.$lte = endTime + " 23:59:59"
            } else {
                query.endTimeDisplay = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete query.end;
        }
    },
    //lineFee.js    点击查询按钮触发
    queryCdrLineFeeDetail: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query=data||{};
        handler._initLineFee(query);
        mongo.db().collection(constants.DB.bill_call_line).find(query,{sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, list) {
            if(!err){
                list=list||[];
                result.list=list;
                mongo.db().collection(constants.DB.bill_call_line).count(query, function (err, count) {
                    if(!err){
                        result.count = count;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.warn("queryCdrLineFeeDetail error", err);
                        result.message = "查询线路成本数量异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryCdrLineFeeDetail error", err);
                result.message = "查询线路成本列表异常！";
                callback(result);
            }
        });
    },
    //lineDetail.js     点击查询按钮触发
    queryCdrLineDetail: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var query=data||{};
        handler._initLineDetail(query);

        mongo.db("bill_data").collection(constants.DB.bill_call_line_detail).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("bill_data").collection(constants.DB.bill_call_line_detail).find(query, {sort: {endTimeDisplay: -1}, limit: limit, skip: skip}).toArray(function (err, list) {
                    if (!err) {
                        result.success = true;
                        result.list = list||[];
                        callback(result);
                    } else {
                        logger.app.error("queryCdrLineDetail  error", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("queryCdrLineDetail query error", err);
                callback(result);
            }
        });
    }



};

module.exports = handler;
