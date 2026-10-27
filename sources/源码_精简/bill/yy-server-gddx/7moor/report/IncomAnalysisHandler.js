var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    //点击查询按钮触发
    queryIncomAnalysisReport: function (data, session, callback) {
        var result = {success: false};
        delete data.limit;
        delete data.page;
        var query = data || {};
        mongo.db().collection(constants.DB.bill_incomAnalysis_month).find(query, {sort: {_id: 1}}).toArray(function (err, list) {
            if (!err) {
                result.list = list || [];
                mongo.db().collection(constants.DB.bill_incomAnalysis_month).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryIncomAnalysisReport error", err);
                        result.message = "收入分析月报详情异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryIncomAnalysisReport error", err);
                result.message = "收入分析月报详情异常！";
                callback(result);
            }
        });
    }
};

module.exports = handler;
