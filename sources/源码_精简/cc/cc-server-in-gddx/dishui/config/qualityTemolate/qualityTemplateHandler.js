var fields = require(__baseDir + '/dishui/common/Fields');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var qualityTemplateHandler = {
    getQualityTemplates : function (session, callback) {
        var sort = {time: -1};
        var query = {
            account:session.user.account
        }

        mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).find(query,{sort:sort}).toArray(function(err,doc){
            if(!err) {
                callback(null, doc || []);
            } else {
                logger.app.error("", err);
                callback(err);
            }
        });
    }
}
module.exports = qualityTemplateHandler;