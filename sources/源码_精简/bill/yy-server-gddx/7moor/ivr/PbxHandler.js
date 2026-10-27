var nodeUtil = require('util');
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/7moor/utils/Constants');
var logger = require('appLog');

exports.queryPbx = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection('pbx').find(data).toArray(function(err, doc){
        if (!err) {
            result.pbx = doc;
            result.success = true;
            callback(result);
        } else {
            result.message = 'Query pbx failure: ' + nodeUtil.inspect(data);
            logger.app.error(result.message, err);
            callback(result);
        }
    });
};

exports.getMinUserPbx = function(data, session, callback) {
    var result = {success: false};
    mongo.db().collection('pbx').findOne(data, {sort:{userCount:1}}).toArray(function(err, doc){
        if (!err) {
            result.pbx = doc;
            result.success = true;
            callback(result);
        } else {
            result.message = 'Get the pbx which user count is minimum failure: ' + nodeUtil.inspect(data);
            logger.app.error(result.message, err);
            callback(result);
        }
    });
}