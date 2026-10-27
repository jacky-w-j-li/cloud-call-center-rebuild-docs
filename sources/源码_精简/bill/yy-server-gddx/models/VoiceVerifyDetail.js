var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

var model = {
    get: function(condition,cb){
        mongo.db(constants.DB_BILL_DATA).collection(constants.DB.bill_voiceVerify_detail).findOne(condition, function (err, record) {
            if(err){
                return cb(err);
            }
            cb(null,record)
        });
    },
    findByPage: function(condition,pageSize,page,cb){
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        mongo.db(constants.DB_BILL_DATA).collection(constants.DB.bill_voiceVerify_detail).find(condition,{sort:{time:-1},limit: limit, skip: skip}).toArray(function (err, records) {
            if (err) {
                return cb(err);
            }
            mongo.db(constants.DB_BILL_DATA).collection(constants.DB.bill_voiceVerify_detail).count(condition, function (err, count) {
                if (err) {
                    return cb(err);
                }
                cb(null,records,count);
            });
        });
    }
}

module.exports = model;