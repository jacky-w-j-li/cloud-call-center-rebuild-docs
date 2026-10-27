var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var systemHandler = require(__baseDir + '/dishui/config/ivr/SystemHandler');

var dictionaryHandler = {
    getOptionDic:function(session, callback) {
//        var accountId = session.user.account;
        var findVar = {
            accountId:{"$in":["system",session.user.account]}
        }
        mongo.db().collection(fields.DB_APP_OPTIONDIC).find(findVar).toArray(function (err, docs) {
            if (!err) {
                callback(null, docs || []);
            } else {
                callback(err);
            }
        })
    } ,
    queryDicList:function(data,session,callback){
        var result = {success:false};
        var limit = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var skip = (page - 1) * limit;
        var condition = data||{};
        if(!data.accountId)
            data.accountId=session.user.account;
        var accountId = data.accountId;
        delete data['accountId'];
        data.accountId = {"$in":[accountId,"system"]};
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        utils.removeEmptyProperty(data);

        mongo.db().collection(fields.DB_APP_OPTIONDIC).find(condition,{sort:{$natural:-1},limit: limit, skip: skip}).toArray(function(err,docs){
            if (!err) {
                result.list = docs ||[];
                mongo.db().collection(fields.DB_APP_OPTIONDIC).count(condition,function(err,count){
                    if(!err){
                        result.count = count;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error("queryDicList count error!", err);
                        result.message = "db error!";
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error("queryDicList error!", err);
                result.message = "db error!";
                callback({success: false, list: [], count: 0});
            }
        });

    } ,
    addDic : function(data,session,callback){
        var result = {success:false};
        if(!data.accountId){
            data.accountId=session.user.account;
        }

        var id = utils.UUID.generateUuid();
        mongo.db().collection(fields.DB_APP_OPTIONDIC).findAndModify({'_id':id},null,{$set:data} ,{new:true,upsert:true}, function(err,docs){
            if(!err){
                result.data = docs;
                result.success = true;
                utils.generateCacheVersion(session.account.account,"option");
            }else{
                logger.app.error('db insert error :'+err.stack);
                result.message = 'db insert error!'+error.message;
            }
            callback(result);
        });
    },
    updateDic:function(data,session,callback){
        var result = {success:false};
        utils.removeEmptyProperty(data);
        var id = data._id;

        mongo.db().collection(fields.DB_APP_OPTIONDIC).findOne({'_id':id},function(err,docs){
            if(!err){
                var original = parseInt(docs.cascade);
                var changedCascade = parseInt(data.cascade);
                if(original > changedCascade){
                    changeCascadeAfter(docs,0,changedCascade);
                }
                docs.name = data.name;
                docs.cascade = changedCascade;
                delete docs._id;
                mongo.db().collection(fields.DB_APP_OPTIONDIC).findAndModify({'_id':id},null,{$set:docs},{new:true},function(err,docda){
                    if(!err){
                        result.success = true;
                        result.data=docda;
                        utils.generateCacheVersion(session.account.account,"option");
                    } else{
                        logger.app.error("findAndModifyDictory error!", err);
                        result.message = "db error!";
                    }
                    callback(result);
                });
            }else{
                logger.app.error("updateDic error!", err);
                result.message = "db error!";
                callback(result);
            }
        });

    } ,
    delDic:function(data,session,callback){
        var result = {success:false};
        mongo.db().collection(fields.DB_APP_OPTIONDIC).remove(data,function(err){
            if(!err){
                result.success = true;
                utils.generateCacheVersion(session.account.account,"option");
            }else{
                logger.app.error("delDictory error!", err);
                result.message = "db error!";
            }
            callback(result);
        });
    },
    removeEmptyDic:function(data){
        if(!data){return;}
        for(var i =0;i<data.length;i++ ){
            var options = data[i].options;
            if(options.length == 0){
                delete data[i].options;
            }else{
                dictionaryHandler.removeEmptyDic(data[i].options);
            }

        }
    }   ,
    findOneAppDic :function(data,session,callback){
        var result = {success:false};
        data.accountId=session.account.account;
        mongo.db().collection(fields.DB_APP_OPTIONDIC).findOne(data,function(err,docs){
            if (!err) {
                result.success = true;
                if(docs){
                    result.data = docs;
                }
            } else {
                logger.app.error("findOneAppDic error!", err);
                result.message = "db error!";
            }
            callback(result);

        });

    }  ,
    updateOneAppDic:function(data,session,callback){
        var result = {success:false};
        utils.removeEmptyProperty(data);
        var condition = data;
        var id=condition._id;
        delete condition['_id'];
        dictionaryHandler.removeEmptyDic(condition.dic);
        mongo.db().collection(fields.DB_APP_OPTIONDIC).update({'_id':id},{$set:condition},function(err){
            if(!err){
//                result.success = true;
//                callback(result);
                utils.generateCacheVersion(session.account.account,"option");
                var dicData = {_id: id};
                mongo.db().collection(fields.DB_APP_OPTIONDIC).findOne(dicData, function(err, doc){
                    if(err){
                        callback(err);
                        return;
                    }
                    if(!doc){
                        result.success = false;
                        callback(result);
                        return;
                    }else{
                        if(doc.name == '满意度调查选项'){
                            systemHandler.saveToAss(doc, session, function(saveRes){
                                if(!saveRes.success){
                                    result.success = false;
                                    callback(result);
                                    return;
                                }
                                result.success = true;
                                callback(result);
                            });
                        }else{
                            result.success = true;
                            callback(result);
                        }
                    }
                })
            }else{
                logger.app.error("addDictoryFlowFields error!", err);
                result.message = "db error!";
                callback(result);
            }

        });

    }

}
module.exports = dictionaryHandler;

function changeCascadeAfter(data,i,changed){
    var k = i+1;
    if(i == changed){
        if(data.options){
            delete data.options;

        }
    }else{
        if(data && data.options){
            for(var j=0;j<data.options.length;j++){
                var option = data.options[j];
                if(option){
                    changeCascadeAfter(option,k,changed);
                }
            }
        }
    }
}