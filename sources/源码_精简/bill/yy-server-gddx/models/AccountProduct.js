var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

/**
 * 产品
 *
 */
var model = {
    get: function (productId, cb) {
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: productId}, function (err, record) {
            if (err) {
                return cb(err);
            }
            return cb(null, record)
        });
    },
    update: function (condition, update, cb) {
        mongo.db().collection(constants.DB.platform_account_product).update(condition, update, function (err) {
            if (err) {
                return cb(err);
            }
            return cb();
        });
    },
}

module.exports = model;