var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    //点击查询按钮触发
    queryGlobalReport: function (data, session, callback) {
        var result = {success: false};
        delete data.limit;
        delete data.page;
        var query = data || {};
        mongo.db().collection(constants.DB.bill_report_proxy_global).find(query).toArray(function (err, list) {
            if (!err) {
                for (var i = 0; i < list.length; i++) {
                    list[i].channelfee = list[i].channelfee / 10000;
                }
                result.list = list || [];
                mongo.db().collection(constants.DB.bill_report_proxy_global).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryGlobalReport error", err);
                        result.message = "查询详情异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryReport error", err);
                result.message = "查询详情异常！";
                callback(result);
            }
        });
    },
    queryAnalyseReport: function (data, session, callback) {
        var result = {success: false};
        var way = data.sortWay;
        delete data.sortWay;
        var limit = data.limit || 10;
        delete data.limit;
        delete data.page;
        var query = data || {};
        if (way == "rechargeMoney") {
            mongo.db().collection(constants.DB.bill_report_channel_analyse).find(query, {sort: {rechargeMoney: -1}, limit: limit}).toArray(function (err, list) {
                if (!err) {
                    result.list = list || [];
                    mongo.db().collection(constants.DB.bill_report_channel_analyse).count(query, function (err, count) {
                        if (!err) {
                            result.count = count;
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("queryAnalyseReport error", err);
                            result.message = "查询详情异常！";
                            callback(result);
                        }
                    });
                } else {
                    logger.app.warn("queryAnalyseReport error", err);
                    result.message = "查询详情异常！";
                    callback(result);
                }
            });
        } else {
            mongo.db().collection(constants.DB.bill_report_channel_analyse).find(query, {sort: {consumSum: -1}}).toArray(function (err, list) {
                if (!err) {
                    result.list = list || [];
                    mongo.db().collection(constants.DB.bill_report_channel_analyse).count(query, function (err, count) {
                        if (!err) {
                            result.count = count;
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("queryAnalyseReport error", err);
                            result.message = "查询详情异常！";
                            callback(result);
                        }
                    });
                } else {
                    logger.app.warn("queryAnalyseReport error", err);
                    result.message = "查询详情异常！";
                    callback(result);
                }
            });
        }

    }
};

module.exports = handler;
