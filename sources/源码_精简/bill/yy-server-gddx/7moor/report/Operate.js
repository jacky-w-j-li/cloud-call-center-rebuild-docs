var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    //点击查询按钮触发
    queryWeekReport: function (data, session, callback) {
        var result = {success: false};
        delete data.limit;
        delete data.page;
        var query = data || {};
        mongo.db().collection(constants.DB.bill_report_business_week).find(query, {sort: {beginTime: 1}}).toArray(function (err, list) {
            if (!err) {
                result.list = list || [];
                mongo.db().collection(constants.DB.bill_report_business_week).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryReport error", err);
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
    queryMonthReport: function (data, session, callback) {
        var result = {success: false};
        delete data.limit;
        delete data.page;
        var query = data || {};
        mongo.db().collection(constants.DB.bill_report_business_month).count(query, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_report_business_month).find(query, {sort: {_id: 1}}).toArray(function (err, accounts) {
                    if (!err) {
                        for (var i = 0; i < accounts.length; i++) {
                            accounts[i].payUse = accounts[i].payUse / 10000;
                        }
                        result.list = accounts || [];
                        result.success = true;
                    } else {
                        logger.app.warn("queryMonth list error", err);
                        result.message = "查询运营月报异常";
                    }
                    callback(result);
                });
            } else {
                logger.app.warn("queryMonth count error", err);
                result.message = "查询运营月报异常";
                callback(result);
            }
        });
    }
};

module.exports = handler;
