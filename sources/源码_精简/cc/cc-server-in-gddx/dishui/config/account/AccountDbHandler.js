var mongo = require('appDb/MongoDb');
var logger = require('appLog');
var handler = {
    initDb: function ( accountId, db) {
        mongo.db().collection("account_db_index_config").find({enable: true}).toArray(function (err, configs) {
            if (!err) {
                configs = configs || [];
                for (var i = 0; i < configs.length; i++) {
                    var config = configs[i];
                    var table = config._id;
                    var indexs = config.index || [];
                    var collection = mongo.db(db).collection(accountId + "_" + table);
                    for (var m = 0; m < indexs.length; m++) {
                        var index = indexs[m];
                        collection.ensureIndex(index, {background: true, w: 1}, function (err) {
                            if (err) {
                                logger.app.error("create account db [" + accountId + "_" + table + "] index error!", err);
                            }
                        });
                    }
                }
            } else {
                logger.app.error("create account db index error!", err);
            }
        });
    },
    rebuildIndex: function ( callback) {
        var result = {success: false};
        mongo.db().collection("app_account").find().toArray(function (err, accounts) {
            if (!err) {
                accounts = accounts || [];
                for (var i = 0; i < accounts.length; i++) {
                    var account = accounts[i];
                    handler.initDb( account._id, account.dataDB);
                }
                result.success = true;
                callback(result);
            } else {
                logger.app.error("query app_account error!", err);
                result.message = "query app_account error!";
            }
        });
    }
};


module.exports = handler;