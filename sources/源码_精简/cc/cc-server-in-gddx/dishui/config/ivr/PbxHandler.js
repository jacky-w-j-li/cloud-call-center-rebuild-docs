var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');

exports.queryPbx = function(data, session, callback){
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_CC_PBX).find(data).toArray(function(err, doc){
        if (!err) {
            result.pbx = doc;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err.stack);
            result.message = 'db find pbx exception!';
            callback(result);
        }
    });
};