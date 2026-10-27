var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    //点击查询按钮触发
    queryAreaWeekReport: function (data, session, callback) {
        var result = {success: false};
        delete data.limit;
        delete data.page;
        var query = data || {};
        mongo.db().collection(constants.DB.bill_report_sales_area_week).find(query, {sort: {beginTime: 1}}).toArray(function
            (err, list) {
            if (!err) {
                result.list = list || [];
                mongo.db().collection(constants.DB.bill_report_sales_area_week).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryAreaWeekReport error", err);
                        result.message = "查询区域周报详情异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryAreaWeekReport error", err);
                result.message = "查询区域周报详情异常！";
                callback(result);
            }
        });
    },
    queryAreaMonthReport: function (data, session, callback) {
        var result = {success: false};
        delete data.limit;
        delete data.page;
        var query = data || {};
        mongo.db().collection(constants.DB.bill_report_sales_area_month).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_report_sales_area_month).find(query, {
                    sort: {
                        beginTime: 1
                    }
                }).toArray(function (err, accounts) {
                    if (!err) {
                        result.list = accounts || [];
                        result.success = true;
                    } else {
                        logger.app.warn("queryAreaMonthReport list error", err);
                        result.message = "查询区域月报异常";
                    }
                    callback(result);
                });
            } else {
                logger.app.warn("queryAreaMonthReport count error", err);
                result.message = "查询区域月报异常";
                callback(result);
            }
        });
    }
};

module.exports = handler;
