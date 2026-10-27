var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/common/Fields');
var SysUser = require(__baseDir + '/common/models/SysUser');
/**
 * 账户(企业客户)
 *
 */
var model ={
    get: function(accountId,cb){
        mongo.appDb("bill").collection(fields.DB_BILL_PLATFORM_ACCOUNT).findOne({_id: accountId}, function (err, record) {
            if(err){
                return cb(err);
            }
            return cb(null,record)
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

                if(createUser.identity != fields.SYS_USER_IDENTITY_PROXY){
                    return cb(null,null);
                }

                //优先返回 realProxy
                if(createUser.realProxy){
                    SysUser.get(createUser.realProxy,function(err,realProxy){
                        if(err){
                           return cb(err);
                        }
                        if(realProxy && realProxy.identity == fields.SYS_USER_IDENTITY_PROXY){
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

        model.findSomeAccounts(accountIds,function(err,accounts){
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

        model.findSomeAccounts(accountIds,function(err,accounts){
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

    findSomeAccounts : function(accountIds,cb){
        if(!accountIds){
            return cb(null,[]);
        }

        mongo.appDb("bill").collection(fields.DB_BILL_PLATFORM_ACCOUNT).find({_id:{$in : accountIds}}).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    }
}

module.exports = model;