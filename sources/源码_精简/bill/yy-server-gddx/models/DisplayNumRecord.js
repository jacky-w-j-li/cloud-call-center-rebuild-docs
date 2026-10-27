var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
/**
 * 透传号码备案
 *
 */
var model ={
    get : function(condtion,cb){
        mongo.db().collection(constants.DB.bill_display_num_record).findOne(condtion, function (err, record) {
            if(err){
                return cb(err);
            }
            return cb(null,record)
        });
    },
    update : function(condition,update,cb){
        mongo.db().collection(constants.DB.bill_display_num_record).update(condition, {$set: update}, {w: 1}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    add : function(insert,cb){
        mongo.db().collection(constants.DB.bill_display_num_record).insert(insert, {w: 1}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    remove : function(condition,cb){
        mongo.db().collection(constants.DB.bill_display_num_record).remove(condition, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    findByPage: function(condition,pageSize,page,cb){
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        mongo.db().collection(constants.DB.bill_display_num_record).find(condition,{sort:{lastUpdateTime:-1},limit: limit, skip: skip}).toArray(function (err, records) {
            if (err) {
                return cb(err);
            }
            mongo.db().collection(constants.DB.bill_display_num_record).count(condition, function (err, count) {
                if (err) {
                    return cb(err);
                }
                cb(null,records,count);
            });
        });
    }

}

module.exports = model;