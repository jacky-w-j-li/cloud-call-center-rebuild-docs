var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

/**
 * 账户累计充值,累计消费
 *
 */
var model = {
    findSome : function(accountIds,cb){
        if(!accountIds){
            return cb(null,[]);
        }

        mongo.db().collection(constants.DB.platform_account_pay_consume).find({_id:{$in : accountIds}}).toArray(function (err, records) {
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

        mongo.db().collection(constants.DB.platform_account_pay_consume).find(condition).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    },
    update: function(condition,update,cb){
        mongo.db().collection(constants.DB.platform_account_pay_consume).update(condition, update, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    upsert: function(condition,update,cb){
        mongo.db().collection(constants.DB.platform_account_pay_consume).update(condition, update,{upsert:true}, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    get: function(accountId,cb){
        mongo.db().collection(constants.DB.platform_account_pay_consume).findOne({_id: accountId}, function (err, record) {
            if(err){
                return cb(err);
            }
            return cb(null,record)
        });
    },
    incrPay: function(accountId,pay){
        mongo.db().collection(constants.DB.platform_account_pay_consume).update({_id: accountId},{$inc:{totalPay:pay}},{upsert:true},function (err) {

        });
    },
    incrConsume: function(accountId,consume){
        mongo.db().collection(constants.DB.platform_account_pay_consume).update({_id: accountId},{$inc:{totalConsume:consume}},{upsert:true},function (err) {

        });
    },
}

module.exports = model;