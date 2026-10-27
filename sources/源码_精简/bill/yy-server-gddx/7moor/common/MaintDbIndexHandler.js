var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    /**
     * 索引如果存在的话就会忽略
     * http://127.0.0.1:3000/command?command=ensureIndex&key=7moorCommand&data={"suffix":"customer","indexFields":{"batchNo":1,"createTime":-1},"indexName":"idx_customer_batchNo","background":true}
     * suffix:表后缀，如business,business_history,c5_call_sheet,c5_call_sheet_leak,cdr_peer,customer,customer_change_log,questionnaire等值
     * indexFields:索引字段
     * indexName:可选，默认系统生成
     * background：可选，默认false,尽量用true，要不会锁整个库（ref:Non-background indexing operations will block all other operations on a database.）
     * @param data
     * @param callback
     */
    ensureIndex: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var suffix=data.suffix;
        var indexFields=data.indexFields;
        var indexName=data.indexName||null;
        var background=data.background||false;

        mongo.db().collection("db_master").findOne({},function (err, row) {
            if (!err && row) {
                var dbs=row.db_names||[];
                var index=0;
                var findCollections=function(){
                    var db=dbs[index];
                    if(db){
                        mongo.db(db).collections(function(err,collections){
                            if(!err){
                                collections=collections||[];
                                var index2=0;
                                var ensureDBIndex=function(){
                                    var c1=collections[index2];
                                    if(c1){
                                        var collectionName=c1.collectionName;
                                        var _suffix=collectionName.substring(collectionName.indexOf("_")+1);
                                        if(_suffix==suffix){
                                            if(indexName){
                                                mongo.db(db).collection(collectionName).ensureIndex(indexFields,{name:indexName,background:background,w:1},function(err){
                                                    if(!err){
                                                        index2++;
                                                        ensureDBIndex();
                                                    }else{
                                                        logger.app.error(err);
                                                        callback(result);
                                                    }
                                                })
                                            }else{
                                                mongo.db(db).collection(collectionName).ensureIndex(indexFields,{background:background,w:1},function(err){
                                                    if(!err){
                                                        index2++;
                                                        ensureDBIndex();
                                                    }else{
                                                        logger.app.error(err);
                                                        callback(result);
                                                    }
                                                })
                                            }

                                        }else{
                                            index2++;
                                            ensureDBIndex()
                                        }
                                    }else{
                                        index++;
                                        findCollections();
                                    }
                                }
                                ensureDBIndex();
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                };
                findCollections();
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 删除索引
     * http://127.0.0.1:3000/command?command=dropIndex&key=7moorCommand&data={"suffix":"customer","indexName":"idx_customer_batchNo"}
     * suffix:表后缀，如business,business_history,c5_call_sheet,c5_call_sheet_leak,cdr_peer,customer,customer_change_log,questionnaire等值
     * indexName:必需
     * @param data
     * @param callback
     */
    dropIndex: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var suffix=data.suffix;
        var indexName=data.indexName||null;
        if(!indexName){
            result.message="索引的名称不能为空！";
            callback(result);
            return;
        }
        mongo.db().collection("db_master").findOne({},function (err, row) {
            if (!err && row) {
                var dbs=row.db_names||[];
                var index=0;
                var findCollections=function(){
                    var db=dbs[index];
                    if(db){
                        mongo.db(db).collections(function(err,collections){
                            if(!err){
                                collections=collections||[];
                                var index2=0;
                                var dropDBIndex=function(){
                                    var c1=collections[index2];
                                    if(c1){
                                        var collectionName=c1.collectionName;
                                        var _suffix=collectionName.substring(collectionName.indexOf("_")+1);
                                        if(_suffix==suffix){
                                            mongo.db(db).collection(collectionName).dropIndex(indexName,function(err){
                                                if(!err){
                                                    index2++;
                                                    dropDBIndex();
                                                }else{
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            })
                                        }else{
                                            index2++;
                                            dropDBIndex()
                                        }
                                    }else{
                                        index++;
                                        findCollections();
                                    }
                                }
                                dropDBIndex();
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                };
                findCollections();
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    ensureIndexTest: function (data,callback) {
        var result = {success: false};
        data=JSON.parse(data);
        var suffix=data.suffix;
        var indexFields=data.indexFields;
        var indexName=data.indexName||null;
        var background=data.background||false;

        var ensureDBIndex=function(){
            var db='cc_data_20141021';
            var collectionName="N00000000432_c5_call_sheet";
            if(indexName){
                mongo.db(db).collection(collectionName).ensureIndex(indexFields,{name:indexName,background:background,w:1},function(err){
                    if(!err){
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                })
            }else{
                mongo.db(db).collection(collectionName).ensureIndex(indexFields,{background:background,w:1},function(err){
                    if(!err){
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                })
            }
        }
        ensureDBIndex();
    },
    _updateCustoemr:function(dataDB,account,list){
        list=list||[];
        for (var i = 0; i < list.length; i++) {
            var obj = list[i];
            mongo.db(dataDB).collection(account+"_customer").update({_id:obj._id},{$set:{birth:obj.birthday}},function(err){
               if(err){
                   logger.app.error(err);
               }
            });
        }
    },
    /**
     * 修复生日字段bug导致的数据错误
     *  http://127.0.0.1:3000/command?command=repaireCustData&key=7moorCommand&data={}
     * @param data
     * @param callback
     */
    repaireCustData: function (data,callback) {
        var result = {success: false};
//        data=JSON.parse(data);

        mongo.db("cc").collection("customer_template").find({"stable_fields.birthday":{$exists:true}}).toArray(function(err,docs){
            if(!err){
                docs=docs||[];
                var idx=0;
                var repaire=function(){
                    var tmpl = docs[idx];
                    if(tmpl){
                        var aid=tmpl.account;
                        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:aid+"_cc"},function (err,product) {
                            if(!err && product){
                                mongo.db(product.dataDB).collection(aid+"_customer").find({birthday:{$nin:['',null]}},{fields:{birthday:1}}).toArray(function(err,list){
                                    if(!err){
                                        handler._updateCustoemr(product.dataDB,aid,list);
                                        idx++;
                                        repaire();
                                    }else{
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                }
                repaire();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    testMongoCursor: function (data,callback) {
        var result = {success: false};
        mongo.db("bill").collection("customer_template").find({}).toArray(function(err,docs){
            if(!err){
                docs=docs||[];
                var idx=0;
                var repaire=function(){
                    var tmpl = docs[idx];
                    if(tmpl){
                        var aid=tmpl.account;
                        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:aid+"_cc"},function (err,product) {
                            if(!err && product){
                                mongo.db(product.dataDB).collection(aid+"_customer").find({birthday:{$nin:['',null]}},{fields:{birthday:1}}).toArray(function(err,list){
                                    if(!err){
                                        handler._updateCustoemr(product.dataDB,aid,list);
                                        idx++;
                                        repaire();
                                    }else{
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                }
                repaire();
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }

};

module.exports = handler;