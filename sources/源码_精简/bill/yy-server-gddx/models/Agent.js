var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

/**
 * 坐席
 *
 */
var model = {
    get: function (id, cb) {
        mongo.db().collection(constants.DB.platform_user).findOne({_id : id}, function (err, record) {
            if (err) {
                return cb(err);
            }
            cb(null, record)
        });
    },
}

module.exports = model;