var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

/**
 * 系统用户
 *
 */
var model = {
    get: function(id,cb){
        mongo.db().collection(constants.DB.system_user).findOne({_id: id,status:constants.systemUserSataus.enable}, function (err, record) {
            if(err){
                return cb(err);
            }
            cb(null,record)
        });
    },
    save: function(user,cb){
        user.status = constants.systemUserSataus.enable;
        mongo.db().collection(constants.DB.system_user).insert(user, {w: 1}, function (err) {
            if(err){
                return cb(err);
            }
            cb();
        });
    },
    findOne: function(condition,cb){
        condition.status = constants.systemUserSataus.enable;
        mongo.db().collection(constants.DB.system_user).findOne(condition, function (err, record) {
            if(err){
                return cb(err);
            }
            cb(null,record)
        });
    },
    duplicateLoginName : function(loginName,cb){
        model.findOne({loginName:loginName},function(err,user){
            if(err){
                return cb(err);
            }
            return cb(null,user != null);
        })
    },
    update: function (condition, update, cb) {
        mongo.db().collection(constants.DB.system_user).update(condition, update, function (err) {
            if (err) {
                return cb(err);
            }
            cb();
        });
    },
    getAllGroupFinance: function(cb){
        mongo.db().collection(constants.DB.system_user).find({realProxy:{$nin:['',null]},status:constants.systemUserSataus.enable}).toArray(function (err,records) {
            if (err) {
                return cb(err);
            }
            cb(null,records);
        });
    },
    getAllUserLower: function(userId,cb){
        mongo.db().collection(constants.DB.system_user).find({identity:constants.identity.proxy,parent:{$nin:[null,'']},status:constants.systemUserSataus.enable},{fields:{_id:1,parent:1}}).toArray(function(err , users){
            var result = [userId];
            if(err) {
                return cb(err ,result);
            }

            users = users || [];
            var getUserLower = function (uid){
                for(var i=0;i<users.length;i++){
                    var obj = users[i];
                    if(obj.parent == uid){
                        result.push(obj._id);
                        getUserLower(obj._id);
                    }
                }
            }
            getUserLower(userId);

            return cb(null , result);
        });
    },
    /**
     * 加上停用状态的用户
     *
     * @param userId
     * @param cb
     */
    getAllUserLowerIgnoreStatus: function(userId,cb){
        mongo.db().collection(constants.DB.system_user).find({identity:constants.identity.proxy,parent:{$nin:[null,'']}},{fields:{_id:1,parent:1}}).toArray(function(err , users){
            var result = [userId];
            if(err) {
                return cb(err ,result);
            }

            users = users || [];
            var getUserLower = function (uid){
                for(var i=0;i<users.length;i++){
                    var obj = users[i];
                    if(obj.parent == uid){
                        result.push(obj._id);
                        getUserLower(obj._id);
                    }
                }
            }
            getUserLower(userId);

            return cb(null , result);
        });
    }
}

module.exports = model;