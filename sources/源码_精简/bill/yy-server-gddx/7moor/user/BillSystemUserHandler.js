var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    getSystemUserProxy : function (data , session,callback){
        mongo.db().collection(constants.DB.system_user).find({status: constants.systemUserSataus.enable,identity:constants.systemUserIndentity.proxy}).toArray(function(err,proxys){
            if (!err) {
                proxys = proxys || [];
                var caches = [];
                for (var i = 0; i < proxys.length; i++) {
                    var cache = {
                        codeType: "proxy",
                        codeOrder: i + 1,
                        codeName: proxys[i].name,
                        identity : proxys[i].identity,
                        codeValue: proxys[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);

            } else {
                callback(err);
            }
        });

    },
    getSystemUserProxyLeader: function(data, session,callback){
        mongo.db().collection(constants.DB.system_user).find({status: constants.systemUserSataus.enable,identity:constants.systemUserIndentity.proxy}).toArray(function(err,proxys){
            if (!err) {
                proxys = proxys || [];

                var leaders = [];
                var leaderIds = [];
                for(var i=0;i<proxys.length;i++){
                    var proxy = proxys[i];
                    var parent = proxy.parent;
                    if(parent && parent!='' && leaderIds.indexOf(parent) < 0){
                        leaderIds.push(parent);
                    }
                }
                for(var i = 0;i<leaderIds.length; i++){
                    var leaderId = leaderIds[i];
                    for(var k = 0;k<proxys.length;k++){
                        var proxy = proxys[k];
                        if(leaderId == proxy._id){
                            leaders.push(proxy);
                        }
                    }
                }

                var caches = [];
                for (var i = 0; i < leaders.length; i++) {
                    var cache = {
                        codeType: "proxyLeader",
                        codeOrder: i + 1,
                        codeName: leaders[i].name,
                        identity : leaders[i].identity,
                        codeValue: leaders[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);

            } else {
                callback(err);
            }
        });
    },
    getSystemProxyUserAllLower: function(data, session,callback){
        var userId = data.userId;
        mongo.db().collection(constants.DB.system_user).find({identity:"proxy",$or:[{parent:{$nin:[null,'']}},{_id:userId}]}).toArray(function(err , users){
            var userIds = [userId];
            if(!err){
                var caches = [];
                users = users || [];
                var getUserLower = function (uid){
                    for(var i=0;i<users.length;i++){
                        var obj = users[i];
                        if(obj.parent == uid){
                            userIds.push(obj._id);
                            getUserLower(obj._id);
                        }
                    }
                }
                getUserLower(userId);

                userIds.forEach(function(uid,i){
                    var user;
                    var userMatch = users.filter(function(user){
                        return uid == user._id;
                    });
                    if (userMatch && userMatch.length > 0){
                        user = userMatch[0];

                        var cache = {
                            codeType: "proxyUserAllLower",
                            codeOrder: 1+i,
                            codeName: user.name,
                            identity : user.identity,
                            codeValue: user._id
                        };
                        caches.push(cache);
                    }
                });

                callback(null,caches);

            } else {
                callback(err);
            }

        });
    },
    getSystemUserDic: function (data, session, callback) {
        //data.status = 'enable';
        mongo.db().collection(constants.DB.system_user).find(data, {sort: {name: 1}}).toArray(function (err, users) {
            if (!err) {
                users = users || [];
                var caches = [];
                for (var i = 0; i < users.length; i++) {
                    var cache = {
                        codeType: "systemUser",
                        codeOrder: 1+i,
                        codeName: users[i].name,
                        identity : users[i].identity,
                        proxyType : users[i].proxyType,
                        codeValue: users[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
    getSystemRoleCache : function(data,session,callback){
        mongo.db().collection(constants.DB.system_user_role).find({}).toArray(function(err,roles){
            if(!err){
                roles = roles ||[];
                var caches = [];
                for(var i=0;i< roles.length;i++){
                    var cache = {
                        codeType: "role",
                        codeOrder: i + 1,
                        codeName: roles[i].name,
                        codeValue: roles[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });



    }
};

module.exports = handler;
