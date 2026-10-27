var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
/**
 * IP定位
 *
 */
var model ={
    get: function(condtion,cb){
        mongo.db(constants.DB_IP).collection(constants.DB.ip.ip_pool).findOne(condtion, function (err, record) {
            if(err){
                return cb(err);
            }
            return cb(null,record)
        });
    }
}

module.exports = model;