var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    querySp: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);
        mongo.db().collection(constants.DB.platform_sp).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_sp).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, lines) {
                    if (!err) {
                        lines = lines || [];
                        result.success = true;
                        result.list = lines;
                        callback(result);
                    } else {
                        logger.app.warn("querySp list error", err);
                        result.message = "查询运营商信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("querySp count error", err);
                result.message = "查询运营商信息异常！";
                callback(result);
            }
        });
    },
    addSp: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_sp).insert(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("addSp err!", err);
                result.message = "添加运营商异常！";
                if (err.code == "11000") {
                    result.message = "运营商编号已经存在！";
                }
                callback(result);
            }
        });
    },
    deleteSp: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_sp).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteSp  error", err);
                result.message = "删除运营商信息异常！";
                callback(result);
            }
        });

    },
    updateSp: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(constants.DB.platform_sp).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateSp  error", err);
                result.message = "更新运营商信息异常！";
                callback(result);
            }
        });
    },
    getSpCache: function (data, session, callback) {
        mongo.db().collection(constants.DB.platform_sp).find(data).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var caches = [];
                for (var i = 0; i < docs.length; i++) {
                    var cache = {
                        codeType: "sp",
                        codeOrder: i + 1,
                        codeName: docs[i].name,
                        codeValue: docs[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
    getSpInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_sp).findOne(data, function (err, dbLine) {
            if (!err) {
                dbLine = dbLine || {};
                result.success = true;
                result.data = dbLine;
                callback(result);
            } else {
                logger.app.warn("getSpInfo  error", err);
                result.message = "查询运营商信息异常！";
                callback(result);
            }
        });
    }


};


module.exports = handler;
