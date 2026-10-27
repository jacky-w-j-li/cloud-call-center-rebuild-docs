var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
var Utils = require('appUtil/Utils');

var model = {
    upsert: function(condition,update,cb){
        mongo.db().collection(constants.DB.ytx_sms_template).update(condition, update,{upsert:true}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    findByPage : function(condition,limit,page,cb){
        if(!condition){
            return cb(null,[]);
        }
        limit = limit || 0;
        var skip = ((page || 1) - 1) * limit;

        mongo.db().collection(constants.DB.ytx_sms_template).find(condition,
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

        mongo.db().collection(constants.DB.ytx_sms_template).count(condition,function (err, count) {
            if(err){
                return cb(err);
            }
            return cb(null,count);
        });

    },
}

module.exports = model;