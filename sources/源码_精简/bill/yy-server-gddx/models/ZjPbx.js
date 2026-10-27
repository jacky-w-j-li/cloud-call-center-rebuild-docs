var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
/**
 * 总机PBX
 *
 */
var model ={
    get : function(condtion,cb){
        mongo.db().collection(constants.DB.platform_pbx).findOne(condtion, function (err, record) {
            if(err){
                return cb(err);
            }
            return cb(null,record)
        });
    },
    update : function(condition,update,cb){
        mongo.db().collection(constants.DB.platform_pbx).update(condition, {$set: update}, {w: 1}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    add : function(insert,cb){
        mongo.db().collection(constants.DB.platform_pbx).insert(insert, {w: 1}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    }
}

module.exports = model;