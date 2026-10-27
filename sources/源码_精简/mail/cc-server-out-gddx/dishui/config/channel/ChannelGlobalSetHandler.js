var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var fs = require("fs");

var handler = {
    getGlobalSetById: function (data, session, callback) {
        var result = {success: false};
        var aid=session.user.account;
        var query={account:aid};
        mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne(query, function (err, row) {
            if (!err) {
                result.success = true;
                result.row = row;
            } else {
                logger.app.error(err);
            }
            callback(result);
        });
    },

    saveGlobalSet: function (data, session, callback) {
        var result = {success: false};
        var aid=session.user.account;
        data.account=aid;
        if(!data._id){
            data._id=utils.UUID.generateUuid();
        }
        mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).save(data, function(err){
            if(!err){
                result.row = data;
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }

}

module.exports = handler;
