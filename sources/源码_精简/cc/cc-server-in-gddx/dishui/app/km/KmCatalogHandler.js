var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var http = require('appHttp');
var config = require('appConfig').conf;
var kmHandler = require(__baseDir + '/dishui/app/km/KmItemHandler');


var kmcataloghandler = {
    queryCatalogList : function(data,session,callback){
        var tb=myfun.getCatalogTable(data);
        var result = {success: false};
        var query ={accountId:session.user.account};
        mongo.db().collection(tb).find(query,{sort:{pid:1,order:-1}}).toArray(function (err, docs) {
            if (!err) {
                var tree=[];
                var map=myfun.splitData(docs);
                myfun.getTree(tree,/*root node*/'0',map);
                result.tree = tree;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },

    addCatalog:function(data,session,callback) {
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        data._id=id;
        data.pid=data.pid+"";
        data.accountId=session.user.account;
        myfun.checkCatalogName(data,session,function(rep){
            if(rep.success){
                var tb=myfun.getCatalogTable(data);
                mongo.db().collection(tb).insert(data, function (err){
                    if (!err) {
                        result.success = true;
                        result.id=id;
                        myfun.insertOrder(data,session);
                    } else {
                        logger.app.error('db insert error:' + err.stack);
                        result.message = 'db insert error!'+err.message;
                    }
                    callback(result);
                });
            }else{
                callback(rep);
            }
        });
    } ,
    updateCatalog:function(data,session,callback){
        var result = {success: false};
        var query=data;
        data.pid=data.pid+"";
        data.accountId=session.user.account;
        var index=data.index;
        var order=data.order;
        delete data.index;
        query.isUpdae=true;
        var tb=myfun.getCatalogTable(data);
        myfun.checkCatalogName(query,session,function(rep){
            if(rep.success){
                var id=data._id;
                delete data._id;
                mongo.db().collection(tb).update({_id:id},{$set:data}, function (err){
                    if (!err) {
                        result.success = true;
                        result.id=id;
                        if(index!=order){
                            data._id=id;
                            myfun.updateOrder(data,session);
                        }
                    } else {
                        logger.app.error('db insert error:' + err.stack);
                        result.message = 'db insert error!'+err.message;
                    }
                    callback(result);
                });
            }else{
                callback(rep);
            }
        });
    },
    delCatalog:function(data,session,callback){//只能删除空目录
        var result = {success: false};
//        var query={$or:[{_id:data._id},{pid:data._id}]};
        var tb=myfun.getCatalogTable(data);
        var cid=data.id;
        var query={pid:cid};

        mongo.db().collection(tb).count(query,function (err, num) {
            if (!err) {
                if(num>0){
                    result.code = "1001";
                    callback(result);
                    return;
                }else{
                    kmHandler.isHasItemsByCatalog(data,session,function(rep){
                        if(rep.success){
                            mongo.db().collection(tb).remove({_id:cid},function(err){
                                if(!err){
                                    result.success = true;
                                    callback(result);
                                } else {
                                    logger.app.error(err);
                                    result.message = 'km catalog remove error!';
                                    callback(result);
                                }
                            });
                        }else{
                            callback(rep);
                        }
                    });
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
        //mongo.db().collection(tb).remove(query,function(err){
        //    if(!err){
        //        kmHandler.batchDelItemList(data,session,callback);
        //    } else {
        //        logger.app.error(err.stack);
        //        result.message = 'km catalog remove error!';
        //        callback(result);
        //    }
        //});
    },
    showCatalogEdit:function(data,session,callback){
        var result = {success:false};
        var query ={_id:data._id};
        var tb=myfun.getCatalogTable(data);
        mongo.db().collection(tb).findOne(query,function(err,doc){
            if (!err) {
                result.success = true;
                result.row=doc;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },




    /********************public inteface****************************/
    /**
     * http://127.0.0.1:4000/public?action=km.queryCatalogListInf&data={"account":"N00000000143"}
     * @param data
     * @param callback
     */
    queryCatalogListInf : function(data, callback){
        var aid=data.account;
        var result = {success: false};
        var query ={accountId:aid};
        mongo.db().collection(fields.DB_APP_KM_OUTER_CATALOG).find(query,{sort:{pid:1,order:-1}}).toArray(function (err, docs) {
            if (!err) {
                var tree=[];
                var map=myfun.splitData(docs);
                myfun.getTree(tree,/*root node*/'0',map);
                result.list = tree;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=km.queryItemListInf&data={"account":"N00000000143","cid":"0aa016d0-d54d-11e5-9066-45ce58aec16f","page":1,"limit":10}
     * @param data
     * @param callback
     */
    queryItemListInf : function(data, callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        var page = data.page||1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        var aid=data.account;
        var query ={accountId:aid,cid:data.cid};
        var tb=fields.DB_APP_KM_OUTER_ITEM;
        mongo.db().collection(tb).find(query,{sort:{lastTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(tb).count(query,function(err,count){
                    result.count=count;
                    result.success = true;
                    callback(result);
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=km.getKmDetailInf&data={"_id":"1f7668c0-d54d-11e5-9066-45ce58aec16f"}
     * @param data
     * @param callback
     */
    getKmDetailInf : function(data, callback){
        var result = {success:false};
        var query ={_id:data._id};
        mongo.db().collection(fields.DB_APP_KM_OUTER_ITEM).findOne(query,function(err,doc){
            if (!err) {
                if(!doc) {
                    result.message = '该资源不存在或已删除！';
                    result.code='1001';
                    callback(result);
                    return;
                }
                var row=doc;
                mongo.db().collection(fields.DB_APP_KM_OUTER_CONTENT).findOne(query,function(err,item){
                    if (!err) {
                        row.content=item.content;
                        mongo.db().collection(fields.DB_APP_KM_OUTER_CATALOG).findOne({_id:row.cid},function(err,catalog){
                            if (!err) {
                                mongo.db().collection(fields.DB_APP_KM_OUTER_ITEM).update({_id:data._id},{$inc:{hits:1}}, function (err){
                                    if(err) {
                                        logger.app.error('_updateHits error:' + err);
                                    }
                                })

                                result.success = true;
                                row.catalog= catalog;
                                result.row=row;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=km.queryDicListInf&data={"account":"N00000000143","key":"11","page":1,"limit":10}
     * @param data
     * @param callback
     */
    queryDicListInf : function(data, callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        var page = data.page||1;
        var limit = pageSize;
        var aid=data.account;
        var kmType="outer";
        var url = config.ccServiceUrl+'?Action=km&Method=searchDic&accountId='+aid+'&page='+page+'&pageSize='+limit+'&kmType='+kmType;;
        url=encodeURI(url);
        http.sendPost(url,{key:data.key},function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        result.success = true;
                        result.list=res.list||[];
                        result.count=res.count;
                        callback(result);
                    }else{
                        callback(result);
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }else{
                var error = err || new Error('request queryDicListInf error!');
                logger.request.error(error);
                callback(result);
            }
        });
    }

};

var myfun={
    getCatalogTable:function(data){
        var kmType=data.kmType;
        var tb=fields.DB_APP_KM_CATALOG;
        if(kmType=='outer'){
            tb=fields.DB_APP_KM_OUTER_CATALOG;
        }
        return tb;
    },
    queryLevelCatalog:function(data,session,callback){
        var result = {success: false};
        var query ={accountId:session.user.account,pid:data.pid};
        var tb=myfun.getCatalogTable(data);
        mongo.db().collection(tb).find(query,{sort:{order:1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    updateLevel:function(data){
        var id=data._id;
        delete  data._id;
        var tb=myfun.getCatalogTable(data);
        mongo.db().collection(tb).update({"_id":id},{$set:data},function(err){
            if(!err){

            } else {
                logger.app.error('updateLevel error:' + err.stack);
            }
        });
    },
    insertOrder:function(data,session) {
        myfun.queryLevelCatalog(data,session,function(rep){
            if(rep.success){
                for(var i=0;i<rep.list.length;i++){
                    var t=rep.list[i];
                    if(t._id!=data._id){
                        t.order++;
                        myfun.updateLevel(t);
                    }
                }
            }
        });
    },
    updateOrder: function(data,session) {
        myfun.queryLevelCatalog(data,session,function(rep){
            if(rep.success){
                for(var i=0;i<rep.list.length;i++){
                    var t=rep.list[i];
                    if(t._id!=data._id && t.order>=data.order){
                        t.order++;
                        myfun.updateLevel(t);
                    }
                }
            }
        });
    },
    checkCatalogName:function(data,session,callback){
        var result = {success: false};
        var query ={accountId:session.user.account,name:data.name,pid:data.pid};
        if(data.isUpdae)query._id={"$ne":data._id};
        var tb=myfun.getCatalogTable(data);
        mongo.db().collection(tb).count(query,function (err, count) {
            if (!err) {
                if(count==0){
                    result.success = true;
                }else{
                    result.code='1001';
                    result.message='catalog name is repeat';
                }
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
     splitData:function(list){
        var map={};
         for(var i=0;i<list.length;i++){
             var t=list[i];
             if(map[new String(t.pid)]){
                 map[new String(t.pid)].push(t);
             }else{
                 map[new String(t.pid)]=[t];
             }
         }
         return map;
     },
     getTree:function(tree,pid,map){
        var node=map[pid];
         if(node&&node.length>0){
             for(var i=0;i<node.length;i++){
                 var t=node[i];
                 if(t.pid==pid){
                     t.childs=[];
                     tree.push(t);
                     myfun.getTree(t.childs,t._id,map);
                 }
             }
         }

     }
}
module.exports = kmcataloghandler;
