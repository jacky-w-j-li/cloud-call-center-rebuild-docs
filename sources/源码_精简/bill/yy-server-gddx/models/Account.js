var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
var SysUser = require(__baseDir + "/models/SysUser");
/**
 * 账户(企业客户)
 *
 */
var model ={
    get: function(accountId,cb){
        mongo.db().collection(constants.DB.platform_account).findOne({_id: accountId}, function (err, record) {
            if(err){
                return cb(err);
            }
            return cb(null,record)
        });
    },
    update: function(condition,update,cb){
        mongo.db().collection(constants.DB.platform_account).update(condition, update, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    getProxy: function(id,cb){
        model.get(id,function(err,account){
            if(err){
                return cb(err);
            }
            if(!account){
                return cb(null,null);
            }

            SysUser.get(account.createUser,function(err,createUser){
                if(err){
                    return cb(err);
                }

                if(!createUser){
                    return cb(null,null);
                }

                if(createUser.identity != constants.identity.proxy){
                    return cb(null,null);
                }

                //优先返回 realProxy
                if(createUser.realProxy){
                    SysUser.get(createUser.realProxy,function(err,realProxy){
                        if(err){
                           return cb(err);
                        }
                        if(realProxy && realProxy.identity == constants.identity.proxy){
                            return cb(null,realProxy);
                        }
                        return cb(null,createUser);
                    });
                }else{
                    return cb(null,createUser);
                }
            });
        });
    },

    findSomeAccountNames : function(accountIds,cb){
        if(!accountIds){
            return cb(null,{});
        }

        model.findSome(accountIds,function(err,accounts){
            if(err){
                return cb(err);
            }

            var accountNames = {};
            accounts.forEach(function(item){
                accountNames[item._id] = item.name;
            });

            return cb(null,accountNames);
        });
    },
    findSomeAccountAccounts : function(accountIds,cb){
        if(!accountIds){
            return cb(null,{});
        }

        model.findSome(accountIds,function(err,accounts){
            if(err){
                return cb(err);
            }

            var accountNames = {};
            accounts.forEach(function(item){
                accountNames[item._id] = item;
            });

            return cb(null,accountNames);
        });
    },

    findSome : function(accountIds,cb){
        if(!accountIds){
            return cb(null,[]);
        }

        mongo.db().collection(constants.DB.platform_account).find({_id:{$in : accountIds}}).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    },

    find : function(condition,cb){
        if(!condition){
            return cb(null,[]);
        }

        mongo.db().collection(constants.DB.platform_account).find(condition).toArray(function (err, records) {
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

        mongo.db().collection(constants.DB.platform_account).find(condition,
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

        mongo.db().collection(constants.DB.platform_account).count(condition,function (err, count) {
            if(err){
                return cb(err);
            }
            return cb(null,count);
        });
    }
}

module.exports = model;