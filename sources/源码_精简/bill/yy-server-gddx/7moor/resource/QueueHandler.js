var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    /**
     * 技能组查询
     * @param data
     * @param session
     * @param callback
     */
    queryQueue: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        mongo.db().collection(constants.DB.platform_queue).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_queue).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, queues) {
                    if (!err) {
                        queues = queues || [];
                        var accountIds = [];
                        for (var i = 0; i < queues.length; i++) {
                            if (queues[i].account) accountIds.push(queues[i].account);
                        }
                        mongo.db().collection(constants.DB.platform_account).find({_id: {$in: accountIds}}, {fields: {_id: 1, companyName: 1}}).toArray(function (err, accounts) {
                            if (!err) {
                                accounts = accounts || [];
                                queues = utils.ObjectUtil.linkObjects(queues, accounts, {account: "_id"}, "accountData");
                                result.success = true;
                                result.list = queues;
                                callback(result);
                            } else {
                                logger.app.warn("querySipNum link account error", err);
                                result.message = "查询sip号关联账户信息异常！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("querySipNum list error", err);
                        result.message = "查询sip号信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("querySipNum count error", err);
                result.message = "查询sip号信息异常！";
                callback(result);
            }
        });
    }
};


module.exports = handler;