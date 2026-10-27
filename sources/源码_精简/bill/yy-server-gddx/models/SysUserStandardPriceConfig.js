var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

/**
 * 系统用户
 *
 */
var model = {
    get: function (id, cb) {
        mongo.db().collection(constants.DB.system_user_standard_price_config).findOne({
            _id: id,
        }, function (err, record) {
            if (err) {
                return cb(err);
            }
            cb(null, record)
        });
    },
}

module.exports = model;