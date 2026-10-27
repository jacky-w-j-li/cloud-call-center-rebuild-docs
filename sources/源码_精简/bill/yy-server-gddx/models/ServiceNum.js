var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
/**
 * 服务号
 *
 */
var model ={
    get : function(condtion,cb){
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(condtion, function (err, record) {
            if(err){
                return cb(err);
            }
            return cb(null,record)
        });
    },
    update : function(condition,update,cb){
        mongo.db().collection(constants.DB.platform_serviceNum).update(condition, {$set: update}, {w: 1,multi:true}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    find : function(condtion,cb) {
        mongo.db().collection(constants.DB.platform_serviceNum).find(condtion).toArray(function (err, records) {
            if (err) {
                return cb(err);
            }
            return cb(null, records);
        });
    },
    findByPage : function(condition,limit,page,cb) {
        if (!condition) {
            return cb(null, []);
        }
        limit = limit || 0;
        var skip = ((page || 1) - 1) * limit;

        mongo.db().collection(constants.DB.platform_serviceNum).find(condition,
            {
                limit: limit,
                skip: skip,
                sort: {_id: 1},
            }).toArray(function (err, records) {
            if (err) {
                return cb(err);
            }
            return cb(null, records);
        });
    },
    count : function(condition,cb){
        if(!condition){
            return cb(null,0);
        }

        mongo.db().collection(constants.DB.platform_serviceNum).count(condition,function (err, count) {
            if(err){
                return cb(err);
            }
            return cb(null,count);
        });
    }

}

module.exports = model;