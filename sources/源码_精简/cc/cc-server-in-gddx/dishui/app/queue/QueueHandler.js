var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var nodeUtil = require('util');
var logger = require('appLog');

exports.getQueueDic = function (session, callback) {
    var accountId = session.user.account;
    mongo.db().collection(fields.DB_MANAGER_IVR_SKILLGROUP).find({Account: accountId}).toArray(function (err, docs) {
        if (!err) {
            callback(null, docs || []);
        } else {
            logger.app.error(err.stack);
            callback(err);
        }
    });
}

exports.queryQueue = function(data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_MANAGER_IVR_SKILLGROUP).find(data).toArray(function(err, docs){
        if(err){
            logger.app.error(err.stack);
            result.message = "Query queue failure" + nodeUtil.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.getAgentInQueue = function(session, callback){
    var result = {success: false};
    var queryData = {
        PBX: session.user.sipConfigId,
        Account: session.user.account,
        Status:{$ne:'delete'}
        // Members: {'id': session.user._id}
    }
    mongo.db().collection(fields.DB_MANAGER_IVR_SKILLGROUP).find(queryData).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
}

exports.getAllPbxQueue = function(session, callback){
    var result = {success: false};
    var queryData = {
        Account: session.user.account,
        Status:{$ne:'delete'}
    }
    mongo.db().collection(fields.DB_MANAGER_IVR_SKILLGROUP).find(queryData).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
}