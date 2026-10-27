var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
/**
 * CC IP白名单
 *
 */
var model ={
    get : function(condtion,cb){
        mongo.db("cc").collection(constants.DB.cc.access_ip).findOne(condtion, function (err, record) {
            if(err){
                return cb(err);
            }
            return cb(null,record)
        });
    },
    update : function(condition,update,cb){
        mongo.db("cc").collection(constants.DB.cc.access_ip).update(condition, {$set: update}, {w: 1}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    add : function(insert,cb){
        mongo.db("cc").collection(constants.DB.cc.access_ip).insert(insert, {w: 1}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    }

}

module.exports = model;