var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    queryHpLine: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.bill_hp_line).find(data, {sort: {_id: 1}}).toArray(function (err, lines) {
            if (!err) {
                lines = lines || [];
                result.success = true;
                result.list = lines;
                callback(result);
            } else {
                logger.app.warn("queryHpLine list error", err);
                result.message = "查询hp线路信息异常！";
                callback(result);
            }
        });
    },
    getHpLineInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.bill_hp_line).findOne(data, function (err, dbLine) {
            if (!err) {
                dbLine = dbLine || {};
                result.success = true;
                result.data = dbLine;
                callback(result);
            } else {
                logger.app.warn("getHpLineInfo  error", err);
                result.message = "查询hp线路信息异常！";
                callback(result);
            }
        });
    },
    getHpLineCache: function (data, session, callback) {
        mongo.db().collection(constants.DB.bill_hp_line).find(data).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var caches = [];
                for (var i = 0; i < docs.length; i++) {
                    var cache = {
                        codeType: "hpLine",
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
    }
};


module.exports = handler;