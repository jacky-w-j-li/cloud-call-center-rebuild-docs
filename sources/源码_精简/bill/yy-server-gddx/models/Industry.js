var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");

/**
 * 账户(企业客户)
 *
 */
var model ={
    add: function(insert,cb){
        mongo.db().collection(constants.DB.platform_industry).insert(insert, {w: 1},function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    update: function(condition,update,cb){
        mongo.db().collection(constants.DB.platform_industry).update(condition, update, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    update: function(condition,update,cb){
        mongo.db().collection(constants.DB.platform_industry).update(condition, update, function (err) {
            if(err){
                return cb(err);
            }
            return cb();
        });
    },
    remove: function(id,cb){
        mongo.db().collection(constants.DB.platform_industry).remove({_id:id},function (err) {
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

        mongo.db().collection(constants.DB.platform_industry).find(condition).toArray(function (err, records) {
            if(err){
                return cb(err);
            }
            return cb(null,records);
        });
    },
    getByNumberAndLine : function(number,line,cb){
        if(!number || number.lastIndexOf('00', 0) != 0 || !line){
            return cb();
        }
        var sNumber = number.substr(2);
        //切出所有可能的区域代码
        var possibleCodes = [];
        for(var i = 0;i < sNumber.length; i++){
            possibleCodes.push(sNumber.substr(0,i+1));
        }

        var condition = {code:{$in:possibleCodes},line : line};

        model.find(condition,function(err,records){
            if(err){
                return cb(err);
            }
            if(!records || records.length == 0){
                return cb();
            }

            //找出最长的区域代码.
            var matchRecord;
            var matchLength=0;
            for(var i = 0;i < records.length; i++){
                var record = records[i] || {};
                if(record.code && record.code.length > matchLength){
                    matchRecord = record;
                    matchLength = record.code.length;
                }
            }

            return cb(null,matchRecord);
        });

    },
    findByPage : function(condition,limit,page,cb){
        if(!condition){
            return cb(null,[]);
        }
        limit = limit || 0;
        var skip = ((page || 1) - 1) * limit;

        mongo.db().collection(constants.DB.platform_industry).find(condition,
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

        mongo.db().collection(constants.DB.platform_industry).count(condition,function (err, count) {
            if(err){
                return cb(err);
            }
            return cb(null,count);
        });

    },
    getCache : function(data, session, callback){
        mongo.db().collection(constants.DB.platform_industry).find(data,{sort:{name:1}}).toArray(function (err, docs) {
            if (err) {
                return callback(err);
            }
            docs = docs || [];
            var caches = [];
            for (var i = 0; i < docs.length; i++) {
                var cache = {
                    codeType: "industry",
                    codeOrder: i + 1,
                    codeName: docs[i].name,
                    codeValue: docs[i]._id,
                };
                caches.push(cache);

            }
            return callback(null, caches);
        });
    },
}

module.exports = model;