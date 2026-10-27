var ccm7rds = require("m7rds");
var rediscli = ccm7rds.connect;
var _ = require('underscore');
var constants = require(__baseDir + "/7moor/utils/Constants");

var _APP_SESSION_PREFIX = "appsession.";

exports.updateUser = function(id,update,cb){
    rediscli.getClient(constants.DB.cc.redis_db0).hget(_key(id),"user",function(err,res){
        if(err){
            log.app.error(err);
            return cb(err);
        }
        var user = JSON.parse(res);
        var newUser = _.extend({},user,update);

        rediscli.getClient(constants.DB.cc.redis_db0).hset(_key(id),"user",JSON.stringify(newUser),cb);
    });
}

exports.get = function(id,cb){
    rediscli.getClient(constants.DB.cc.redis_db0).hgetall(_key(id),function(err,res){
        if(err || !res){
            return cb(err || new Error("session not found!"));
        }

        res.user = JSON.parse(res.user);
        res.account = JSON.parse(res.account);

        return cb(null,res);
    });
};

function _key(id){
    return _APP_SESSION_PREFIX+id;
}