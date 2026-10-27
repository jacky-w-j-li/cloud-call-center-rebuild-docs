var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

var model = {
    get: function(condition,cb){
        mongo.db(constants.DB_BILL_DATA).collection(constants.DB.bill_voiceVerify_consume).findOne(condition, function (err, record) {
            if(err){
                return cb(err);
            }
            cb(null,record)
        });
    },
}

module.exports = model;