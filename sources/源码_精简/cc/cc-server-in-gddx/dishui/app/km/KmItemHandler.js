var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var http = require('appHttp');
var config = require('appConfig').conf;
var fs = require('fs');
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var qiniuHandler = require(__baseDir + '/dishui/app/qiniu/QiniuHandler');
var Thenjs = require('thenjs');

var kmitemhandler = {
    uploadDoc : function(data,session,callback){
        var timeout=120000;
        var url = config.kmdoc_url+'?Action=km&Method=transferFile&file='+data.fileName+'&trueName='+data.trueName;
        url=encodeURI(url);
        http.sendGet2(url,timeout,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        res.success = true;
                        callback(res);
                    }else{
                        callback(res);
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            }else{
                var error = err || new Error('request uploadDoc error!');
                logger.request.error(error);
                callback(error);
            }
        });
    },
    syncKmDic: function(data,session,callback){
        var accountId = session.user.account;
        var kmType=data.kmType;
        var url = config.ccServiceUrl+'?Action=km&Method=generateDic&itemId='+data._id+'&flag='+data.flag+'&accountId='+accountId+'&kmType='+kmType;
        url=encodeURI(url);
        if(!callback){
            callback=function(rep){};
        }
        http.sendGet(url,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        res.success = true;
                        callback(res);
                    }else{
                        callback(res);
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            }else{
                var error = err || new Error('request uploadDoc error!');
                logger.request.error(error);
                callback(error);
            }
        });
    },
    queryKmDic : function(data,session,callback){
        var result = {success: false};
        var limit = data.limit||10;
        var page = data.page||1;
        var skip = (page - 1) * limit;
        data.skip=skip;
        var accountId=session.user.account;
        var kmType=data.kmType;
        var query ={accountId:accountId,kmType:kmType,combox:data.key,skip:skip,limit:limit};
        solrHandler.queryIndex2Km(query,session,function(rep){
            if(rep.success){
                //var list=rep.list;
                //var count=rep.count;
                callback(rep);
            }else{
                logger.app.error("query solr index error");
                callback({success: false, list: [], count: 0});
            }
        });

/*        var url = config.ccServiceUrl+'?Action=km&Method=searchDic&accountId='+accountId+'&page='+page+'&pageSize='+pageSize+'&kmType='+kmType;;
        url=encodeURI(url);
        http.sendPost(url,{key:data.key},function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        res.success = true;
                        callback(res);
                    }else{
                        callback(res);
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            }else{
                var error = err || new Error('request queryKmDic error!');
                logger.request.error(error);
                callback(error);
            }
        });*/
    },
  /**
   * 查询知识库（返回整篇内容）
   * @param data
   * @param data.key
   * @param data.kmType
   * @param data.limit
   * @param data.page
   * @param session
   * @param callback
   */
    queryWholeKmDic: function(data, session, callback) {
        var funcName = '[KmItemHandler - queryWholeKmDic]';
        var result = { success: false };
        var limit = data.limit || 10;
        var page = data.page || 1;
        var skip = (page - 1) * limit;
        data.skip = skip;
        var accountId = session.user.account;
        var kmType = data.kmType || 'outer';
        var query = { accountId: accountId, kmType: kmType, combox: data.key, skip: skip, limit: limit };
        Thenjs(function (cont) {
            solrHandler.queryWholeIndex2Km(query, session, function(rep) {
                if (rep.success) {
                    callback(rep);
                    cont(null);
                } else {
                    cont('query solr index error');
                }
            });
        }).then(function (cont) {
            // 保存搜索热词
            mongo.db().collection(fields.DB_APP_KM_SEARCH_HOT_WORDS).update({
                accountId: accountId,
                kmType: kmType,
                key: data.key
            }, {
                $inc: { times: 1 },
                $set: { when: utils.getCurrentDateTime() }
            }, { upsert: true, w: 1 }, cont);
        }).then(function (cont) {
            // 查询出查询次数最多的200个热词之后的文档
            mongo.db().collection(fields.DB_APP_KM_SEARCH_HOT_WORDS).find({
                accountId: accountId
            }, {
                fields: { _id: 1 },
                sort: { times: -1, when: -1 },
                skip: 200
            }).toArray(cont);
        }).then(function (cont, toBeRemovedDocs) {
            var ids = [];

            toBeRemovedDocs.forEach(function (toBeRemovedDoc) {
                ids.push(toBeRemovedDoc._id);
            });

            if (ids.length > 0) {
                // 删除，保留前200个
                mongo.db().collection(fields.DB_APP_KM_SEARCH_HOT_WORDS).remove({
                    _id: { $in: ids }
                }, cont);
            } else {
                cont(null);
            }
        }).fail(function (cont, err) {
            logger.app.error(funcName, err);
            callback({ success: false, list: [], count: 0 });
        });
    },
  /**
   * 获取知识库搜索热词
   * @param data
   * @param session
   * @param callback
   */
    queryKmHotWords: function (data, session, callback) {
        var funcName = '[KmItemHandler - queryKmHotWords]';
        var result = { success: false };
        var accountId = session.user.account;
        var kmType = data.kmType || 'outer';
        
        Thenjs(function (cont) {
            mongo.db().collection(fields.DB_APP_KM_SEARCH_HOT_WORDS).find({
                accountId: accountId,
                kmType: kmType
            }, {
                sort: { times: -1, when: -1 },
                limit: 5
            }).toArray(cont);
        }).then(function (cont, list) {
            result.success = true;
            result.list = list;

            return callback(result);
        }).fail(function (cont, err) {
            logger.app.error(funcName, err);
            return callback(result);
        });
    },
    queryRecentList : function(data,session,callback){
        var result = {success: false};
        var page = 1;
        var limit = 10;
        var query ={accountId:session.user.account};
        var tb=myfun.getItemTable(data);
        mongo.db().collection(tb).find(query,{sort:{lastTime:-1},limit: limit}).toArray(function (err, docs) {
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
    batchDelItemList : function(data,session,callback){
        var result = {success: false};
        var kmType=data.kmType;
        var query ={accountId:session.user.account,cid:{$in:data.ids}};
        var tb=myfun.getItemTable(data);
        var tb2=myfun.getContentTable(data);
        mongo.db().collection(tb).find(query,{_id:true}).toArray(function (err, docs) {
            if (!err) {
                if(!docs || docs.length==0){
                    result.success=true;
                    callback(result);
                    return;
                }
                var id=utils.UUID.generateUuid();
                var time=utils.getCurrentDate();
                var ids=[];
                for(var j=0;j<docs.length;j++){
                    ids.push(docs[j]._id);
                }
                var cids={_id:{$in:ids}};
                var row={_id:id,createTime:time,ids:ids};
                mongo.db().collection(fields.DB_APP_KM_DELID).insert(row,{w:1},function(err){
                    if (!err) {
                        mongo.db().collection(tb).remove(cids,function(err){
                            if(!err){
                                mongo.db().collection(tb2).remove(cids,function(err){
                                    if(!err){
                                        //var dic={flag:"batchDel",_id:id,kmType:kmType};
                                        //kmitemhandler.syncKmDic(dic,session,callback);

                                        var idxData={
                                            ids : ids
                                        }
                                        solrHandler.deleteIndex2Km(idxData,function(rep){
                                            callback(rep);
                                        });
                                    } else {
                                        logger.app.error(err.stack);
                                        result.message = 'batchDelItemList error!';
                                        callback(result);
                                    }
                                });
                            } else {
                                logger.app.error(err.stack);
                                result.message = 'batchDelItemList error!';
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error(err.stack);
                        result.message = 'batchDelItemList error!'+err.message;
                        callback(result);
                    }

                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    queryItemList : function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        var page = data.page||1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query ={accountId:session.user.account,cid:data.cid};
        var tb=myfun.getItemTable(data);
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
    _writeHtml:function(data,session,callback){
        var result = {success: false};
        var item={_id:data._id,content:data.content};
        var tb=myfun.getContentTable(data);
        mongo.db().collection(tb).insert(item,{w:1}, function (err){
            if (!err) {
                //kmitemhandler.syncKmDic(data,session,callback);
                var idxData={
                    _id : data._id,
                    accountId:data.accountId,
                    title: data.title,
                    content:data.content,
                    cid:data.cid,
                    lastTime:data.lastTime,
                    kmType:data.kmType
                }
                solrHandler.addIndex2Km(idxData,function(rep){
                    callback(rep);
                });
            } else {
                logger.app.error('writeHtml error:' + err.stack);
                result.message = 'writeHtml error!'+err.message;
                callback(result);
            }
        });
    },
    saveItem:function(data,session,callback) {
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        data._id=id;
        data.accountId=session.user.account;
        data.publisher=session.user._id;
        var time=utils.getCurrentDate();
        data.lastTime=time;
        data.createTime=time;
        data.hits=0;

        var content=data.content;
        delete data.content;
        var tb=myfun.getItemTable(data);
        mongo.db().collection(tb).insert(data,{w:1}, function (err){
            if (!err) {
                data.content=content;
                data.flag="insert";
                kmitemhandler._writeHtml(data,session,callback);
            } else {
                logger.app.error('saveItem error:' + err.stack);
                result.message = 'saveItem error!'+err.message;
                callback(result);
            }

        });
    } ,
    _updateHtml:function(data,session,callback){
        var result = {success: false};
        var tb=myfun.getContentTable(data);
        var aid=session.user.account;
        mongo.db().collection(tb).update({_id:data._id},{$set:{content:data.content}},{w:1}, function (err){
            if (!err) {
                //kmitemhandler.syncKmDic(data,session,callback);
                //console.dir(data);
                var idxData={
                    _id : data._id,
                    accountId:{set:aid},
                    title: {set:data.title},
                    content:{set:data.content},
                    cid:{set:data.cid},
                    kmType:{set:data.kmType},
                    lastTime:{set:data.lastTime}
                }
                solrHandler.updateIndex2Km(idxData,function(rep){
                    callback(rep);
                });
            } else {
                logger.app.error('_updateHtml error:' + err.stack);
                result.message = '_updateHtml error!'+err.message;
                callback(result);
            }

        });
    },
    updateItem:function(data,session,callback){
        var result = {success: false};
        var time=utils.getCurrentDate();
        data.lastTime=time;
        var id=data._id;
        var content=data.content;
        delete data.content;
        delete data._id;
        var tb=myfun.getItemTable(data);
        mongo.db().collection(tb).update({_id:id},{$set:data},{w:1}, function (err){
            if (!err) {
                result.success = true;
                data._id=id;
                data.content=content;
                data.flag="update";
                kmitemhandler._updateHtml(data,session,callback);
            } else {
                logger.app.error('updateItem error:' + err.stack);
                result.message = 'updateItem error!'+err.message;
                callback(result);
            }
        });
    },
    _updateHits:function(itemId,kmType,session){
        var time=utils.getCurrentDate();
        var tb=myfun.getItemTable({kmType:kmType});
        if(kmType=='outer')return;
        mongo.db().collection(tb).update({_id:itemId},{$inc:{hits:1}}, function (err){
            if(err) {
                logger.app.error('_updateHits error:' + err.stack);
            }else{
//                var dic={flag:"updateHits",_id:itemId};
//                kmitemhandler.syncKmDic(dic,session,null);
            }
        });
    },
    delItem:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        var tb=myfun.getItemTable(data);
        mongo.db().collection(tb).findOne(query,function(err,doc){
            if(!err) {
                var attachs=doc.attachs||{};
                mongo.db().collection(tb).remove(query,function(err){
                    if(!err){
                        kmitemhandler.delContent(data,session,callback);
                        for(var key in attachs){
                            qiniuHandler.delKmFile({key:key},session,function(){});
                        }
                    } else {
                        logger.app.error('km delItem error:' + err.stack);
                        result.message = 'km delItem error!';
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });

    },
    delContent:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        var tb=myfun.getContentTable(data);
        mongo.db().collection(tb).remove(query,function(err){
            if(!err){
                //data.flag="delete";
                //kmitemhandler.syncKmDic(data,session,callback);
                var idxData={
                    ids : [data._id]
                }
                solrHandler.deleteIndex2Km(idxData,function(rep){
                    callback(rep);
                });
            } else {
                logger.app.error('km delContent error:' + err.stack);
                result.message = 'km delContent error!';
                callback(result);
            }
        });
    },
    showItemEdit:function(data,session,callback){
        var result = {success:false};
        var query ={_id:data._id};
        var flag=data.flag;
        var kmType=data.kmType;
        var tb=myfun.getItemTable(data);
        var tb2=myfun.getContentTable(data);
        var tb3=myfun.getCatalogTable(data);
        mongo.db().collection(tb).findOne(query,function(err,doc){
            if (!err) {
                if(!doc) {
                    result.message = 'km is not exist!';
                    result.code='1001';
                    callback(result);
                    return;
                }
                var row=doc;
                mongo.db().collection(tb2).findOne(query,function(err,item){
                    if (!err) {
                        row.content=item.content;
                        mongo.db().collection(tb3).findOne({_id:row.cid},function(err,catalog){
                            if (!err) {
                                result.success = true;
                                row.catalog= catalog;
                                result.row=row;
                                if(flag=='view'){
                                    kmitemhandler._updateHits(data._id,kmType,session);
                                }
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
    } ,

    delAttach:function(data,session,callback){
        var result = {success: false};
        var fileId=data.delId;
        var tb=myfun.getItemTable(data);

        var _set={attachs:data.attachs};
        mongo.db().collection(tb).update({_id:data._id},{$set:_set}, function (err){
            if (!err) {
                qiniuHandler.delKmFile({key:fileId},session,function(){});
                result.success = true;
                callback(result);
            } else {
                logger.app.error( err.stack);
                result.message = 'delAttach error:'+err.message;
                callback(result);
            }
        });
    },
    /**
     *  { file:
            { fileId: '5e262a90-9316-11e3-92d3-ff4d218bdb55',
            name: '0test_yy.xls' } }
     * @param data
     * @param session
     * @param res
     */
    uploadRichImage:function(data,session,rep){
        var fileId=data.fileId;
        var timeout=60000;
        var url = config.kmdoc_url+'?Action=km&Method=uploadImg&file='+fileId+'&trueName='+data.trueName;
        url=encodeURI(url);
        http.sendGet2(url,timeout,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        res.success = true;
                        rep.jsonp({error: 0, message: "上传成功",url:res.url});
                    }else{
                        rep.jsonp({error: 1, message: "上传失败",url:""});
                    }
                }catch (e) {
                    logger.request.error(e);
                    rep.jsonp({error: 1, message: "上传失败",url:""});
                }
            }else{
                var error = err || new Error('request uploadRichImage error!');
                logger.request.error(error);
                rep.jsonp({error:1, message: "上传失败",url:""});
            }
        });

    },
    isHasItemsByCatalog : function(data,session,callback){
        var result = {success: false};
        var query ={accountId:session.user.account,cid:data.id};
        var tb=myfun.getItemTable(data);
        mongo.db().collection(tb).count(query,function (err, count) {
            if (!err) {
                if(count>0) {
                    result.code = "1001";
                    callback(result);
                    return;
                }else{
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error(err);
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
    getItemTable:function(data){
        var kmType=data.kmType;
        var tb=fields.DB_APP_KM_ITEM;
        if(kmType=='outer'){
            tb=fields.DB_APP_KM_OUTER_ITEM;
        }
        return tb;
    },
    getContentTable:function(data){
        var kmType=data.kmType;
        var tb=fields.DB_APP_KM_CONTENT;
        if(kmType=='outer'){
            tb=fields.DB_APP_KM_OUTER_CONTENT;
        }
        return tb;
    }
}
module.exports = kmitemhandler;
