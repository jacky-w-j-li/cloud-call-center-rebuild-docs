var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    queryLicense : function(data, session, callback){
        var result = {success : false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        mongo.db().collection(constants.DB.platform_license).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_license).find(data, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, licenses) {
                    if (!err) {
                        result.list = licenses || [];
                        result.success = true;
                    } else {
                        logger.app.warn("queryLicense:queryLicense list error", err);
                        result.message = "查询license信息异常！";
                    }
                    callback(result);
                });
            } else {
                logger.app.warn("queryLicense:queryLicense count error", err);
                result.message = "查询license信息异常！";
                callback(result);
            }
        });
    }
};

module.exports = handler;