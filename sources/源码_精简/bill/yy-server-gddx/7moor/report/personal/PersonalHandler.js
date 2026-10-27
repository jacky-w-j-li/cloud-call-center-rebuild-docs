var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    //点击查询按钮触发
    queryPersonalMonthReport: function (data, session, callback) {
        var result = {success: false};
        delete data.limit;
        delete data.page;
        var query = data || {};
        mongo.db().collection(constants.DB.bill_sales_personal_month).find(query).toArray(function (err, list) {
            if (!err) {
                result.list = list || [];
                mongo.db().collection(constants.DB.bill_sales_personal_month).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryPersonalMonthReport error", err);
                        result.message = "查询销售个人月报详情异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryPersonalMonthReport error", err);
                result.message = "查询销售个人月报详情异常！";
                callback(result);
            }
        });
    },
    queryPersonalSeasonReport: function (data, session, callback) {
        var result = {success: false};
        delete data.limit;
        delete data.page;
        var query = data || {};
        mongo.db().collection(constants.DB.bill_sales_personal_season).find(query).toArray(function (err, list) {
            if (!err) {
                result.list = list || [];
                mongo.db().collection(constants.DB.bill_sales_personal_season).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("bill_sales_personal_season error", err);
                        result.message = "查询销售个人月报详情异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("bill_sales_personal_season error", err);
                result.message = "查询销售个人月报详情异常！";
                callback(result);
            }
        });
    }
};

module.exports = handler;
