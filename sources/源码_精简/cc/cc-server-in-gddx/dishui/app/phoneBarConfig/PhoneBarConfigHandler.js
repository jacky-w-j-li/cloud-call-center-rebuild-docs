var logger = require("appLog");
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var util = require('util');
var fields = require(__baseDir + '/dishui/common/Fields');

exports.queryConfig = function (data, session, callback) {
    data.Account = session.user.account;
    var result= {success : false};
    mongo.db().collection(fields.DB_IVR_PHONEBAR_CONFIG).find(data).toArray(function(err, docs){
        if(!err){
            result.list = docs;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err.stack);
            result.message = 'Query phone bar config failure: ' + util.inspect(data);
            result.success = false;
            callback(result);
        }
    });
}

exports.getPhoneBars = function(session, callback){
    var result = {success: false};
    var queryData = {
        Account: session.user.account,
        PBX: session.user.sipConfigId
    }
    mongo.db().collection(fields.DB_IVR_PHONEBAR_CONFIG).find(queryData).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
}
