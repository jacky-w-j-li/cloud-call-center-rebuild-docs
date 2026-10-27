var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/common/Fields');

/**
 * 系统用户
 *
 */
var model = {
    get: function(id,cb){
        mongo.appDb("bill").collection(fields.DB_BILL_SYSTEM_USER).findOne({_id: id,status:fields.SYS_USER_STATUS_ENABLE}, function (err, record) {
            if(err){
                return cb(err);
            }
            cb(null,record)
        });
    },
    update: function (condition, update, cb) {
        mongo.appDb("bill").collection(fields.DB_BILL_SYSTEM_USER).update(condition, update, function (err) {
            if (err) {
                return cb(err);
            }
            cb(null);
        });
    },
    getAllGroupFinance: function(cb){
        mongo.appDb("bill").collection(fields.DB_BILL_SYSTEM_USER).find({realProxy:{$nin:['',null]}}).toArray(function (err,records) {
            if (err) {
                return cb(err);
            }
            cb(null,records);
        });
    }
}

module.exports = model;