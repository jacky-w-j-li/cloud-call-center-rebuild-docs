var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

/**
 * 号码白名单
 *
 */
var model ={
    add: function(insert,cb){
        mongo.db().collection(constants.DB.platform_serviceNum_whitelist).insert(insert, {w: 1},function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    update: function(condition,update,cb){
        mongo.db().collection(constants.DB.platform_serviceNum_whitelist).update(condition, update, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    remove: function(id,cb){
        mongo.db().collection(constants.DB.platform_serviceNum_whitelist).remove({_id:id},function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    find : function(condition,cb){
        if(!condition){
            return cb(null,[]);
        }

        mongo.db().collection(constants.DB.platform_serviceNum_whitelist).find(condition).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    },

    findAllPbx : function(cb){
        var condition={};
        mongo.db().collection(constants.DB.platform_cc_pbx).find(condition).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    },

    findByPage : function(condition,limit,page,cb){
        if(!condition){
            return cb(null,[]);
        }
        limit = limit || 0;
        var skip = ((page || 1) - 1) * limit;

        mongo.db().collection(constants.DB.platform_serviceNum_whitelist).find(condition,
            {
                limit : limit,
                skip : skip,
                sort : {createTime:-1},
            }).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    },
    count : function(condition,cb){
        if(!condition){
            return cb(null,0);
        }

        mongo.db().collection(constants.DB.platform_serviceNum_whitelist).count(condition,function (err, count) {
            if(err){
                return cb(err);
            }
            return cb(null,count);
        });

    },
}

module.exports = model;