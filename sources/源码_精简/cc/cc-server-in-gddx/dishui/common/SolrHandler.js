var logger = require("appLog");
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var thenjs =require("thenjs");

var handler = {
    _processPhone:function(data){
        var _ary=[];
        var phone=data.phone||[];
        if(phone.length>0){
            for(var i=0;i<phone.length;i++){
                var obj=phone[i];
                _ary.push(obj.tel);
            }
        }
        data.phone= _ary;
    },
    addIndex2Cust : function(data, callback){
        var result = {success:false};
        handler._processPhone(data);
        var url=config.solr_url+'customer/update/json?commit=true';
        url=encodeURI(url);
        var postData = {
            add:{
                doc:data
            }
        }
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('addIndex failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    batchAddIndex2Cust : function(/*Array*/data, callback){
        var result = {success:false};
        var url=config.solr_url+'customer/update/json?commit=true';
        url=encodeURI(url);
        var postData = {
            add:data
        }
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('batchAddIndex2Cust failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    updateIndex2Cust : function(data, callback){
        var result = {success:false};
        handler._processPhone(data);
        var url=config.solr_url+'customer/update/json?commit=true';
        url=encodeURI(url);
        var postData = [
            data
        ]
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('updateIndex2Cust failed!', err);
                callback(result);
            } else {
                //{"responseHeader":{"status":0,"QTime":4}}
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    updatePartsIndex2Cust : function(data, callback){
        var result = {success:false};
        handler._processPhone(data);
        var url=config.solr_url+'customer/update/json?commit=true';
        url=encodeURI(url);
        var postData = [
            {
                _id:data._id,
                name:{set:data.name},
                phone:{set:data.phone},
                notifyTime:{set:data.notifyTime}
            }
        ]
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('updatePartsIndex2Cust failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    deleteIndex2Cust:function(data,callback){
        var result = {success:false};
        var url=config.solr_url+'customer/update/json?commit=true';
        url=encodeURI(url);
        var postData = {
            //delete: { _id:"10" }
            //delete: "07e156f0-0c55-11e5-97ef-f38c03963fc8"
            //delete: { query:"_id:10"}
            delete:data.ids||[]
        }
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('deleteIndex2Cust failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;

                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    queryIndex2Cust:function(data,session,callback){
        var result = {success:false};
        var maxNum=10000;
        //indent=on&omitHeader=true
        var url=config.solr_url+'customer/select/?wt=json';
        var aid=session.user.account;
        var _query="&q=account:"+aid+" AND ";
        if(data.combox){
            var _val =encodeURIComponent(data.combox);
            _val=utils.escapeSolrRegex(_val);
            _query+="(name:\""+_val+"\" OR phone:"+_val+")";
        }else{
            var _val =encodeURIComponent(data.name);
            _val=utils.escapeSolrRegex(_val);
            _query+="name:\""+_val+"\"";
        }

        //console.info("_query==="+_query);
        var postData=_query+"&fl=_id&rows="+maxNum;
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('queryIndex2Cust failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    var repData=_rep.response||{};
                    var docs=repData.docs||[];
                    var total=repData.numFound;
                    var ids=[];
                    if(docs.length>0){
                        docs.forEach(function (doc) {
                            ids.push(doc._id);
                        })
                    }
                    var notify=false;
                    if(total>maxNum){
                        notify=true;
                    }
                    result.ids=ids;
                    result.notify=notify;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        },'application/x-www-form-urlencoded');
    },
    dataImport:function(data,callback){
        var result = {success: false};
        var suffix="customer";
        var limit=10000;

        mongo.db("bill").collection("db_master_test").findOne({},function (err, row) {
            if (!err && row) {
                var dbs=row.db_names||[];
                dbs.forEach(function(db){
                    mongo.db(db).collections(function(err,collections){
                        if(!err){
                            collections=collections||[];
                            var index2=0;
                            var findCollections=function(){
                                var c1=collections[index2];
                                if(c1){
                                    var collectionName=c1.collectionName;
                                    var _suffix=collectionName.substring(collectionName.indexOf("_")+1);
                                    var account=collectionName.substring(0,collectionName.indexOf("_"));
                                    var page=1;
                                    if(_suffix==suffix){
                                        var buildIndex=function(){
                                            var skip = (page - 1) * limit;
                                            mongo.db(db).collection(collectionName).find({},{limit:limit,skip:skip,fields:{name:1,phone:1,createTime:1,notifyTime:1}}).toArray(function(err,docs){
                                                if(!err){
                                                    docs=docs||[];
                                                    if(docs.length>0){
                                                        for (var i = 0; i < docs.length; i++) {
                                                            var obj = docs[i];
                                                            obj.account=account;
                                                            handler._processPhone(obj);
                                                        }
                                                        handler.batchAddIndex2Cust(docs,function(rep){
                                                            if(rep.success){
                                                                page++;
                                                                buildIndex();
                                                            }else{
                                                                callback(rep);
                                                            }
                                                        })
                                                    }else{
                                                        index2++;
                                                        findCollections()
                                                    }
                                                }else{
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            })
                                        }
                                        buildIndex();
                                    }else{//其他表
                                        index2++;
                                        findCollections()
                                    }
                                }else{
                                    console.info("db==="+db+",all table is indexed.");
                                    logger.app.info("db==="+db+",all table is indexed.");
                                    //result.success=true;
                                    //callback(result);
                                }
                            }
                            findCollections();

                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                })
                result.success=true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=solr.dataImportTest&data={"db":"cc_data_20140728","collectionName":"N00000000143_customer"}
     * @param data
     * @param callback
     */
    dataImportTest:function(data,callback){
        var result = {success: false};
        var db=data.db;
        var collectionName=data.collectionName;
        if(!db||!collectionName){
            callback(result);
            return;
        }
        //var db='cc_data_20140728';
        //var collectionName="N00000000143_customer";
        var limit=10000;
        var page=1;
        var account=collectionName.substring(0,collectionName.indexOf("_"));
        var buildIndex=function(){
            var skip = (page - 1) * limit;
            //console.info("page==="+page+",skip==="+skip);
            mongo.db(db).collection(collectionName).find({},{limit:limit,skip:skip,fields:{name:1,phone:1,createTime:1,notifyTime:1}}).toArray(function(err,docs){
                if(!err){
                    docs=docs||[];
                    if(docs.length>0){
                        for (var i = 0; i < docs.length; i++) {
                            var obj = docs[i];
                            obj.account=account;
                            handler._processPhone(obj);
                        }
                        handler.batchAddIndex2Cust(docs,function(rep){
                            if(rep.success){
                                page++;
                                buildIndex();
                            }else{
                                callback(rep);
                            }
                        })
                    }else{
                        logger.app.info("db==="+db+",collectionName==="+collectionName+",all data is indexed.");
                        result.success=true;
                        callback(result);
                    }
                }else{
                    logger.app.error(err);
                    callback(result);
                }
            })
        }
        buildIndex();
    },
    dataBatchImportTest:function(data,callback){
        var result = {success: false};
        var aids=[
            'N00000003900'
        ];

        var idx=0;
        var addAccountIndex=function(){
            if(aids[idx]){
                var account=aids[idx];
                mongo.db("bill").collection("platform_account_product").findOne({_id: account + "_cc"}, function (err, doc) {
                    if (!err && doc) {
                        var dbName = doc.dataDB;
                        var limit=10000;
                        var page=1;
                        var buildIndex=function(){
                            var skip = (page - 1) * limit;
                            mongo.db(dbName).collection(account + fields.DB_C5_CUSTOMER).find({},{limit:limit,skip:skip,fields:{name:1,phone:1,createTime:1,notifyTime:1}}).toArray(function(err,docs){
                                if(!err){
                                    docs=docs||[];
                                    if(docs.length>0){
                                        for (var i = 0; i < docs.length; i++) {
                                            var obj = docs[i];
                                            obj.account=account;
                                            handler._processPhone(obj);
                                        }
                                        handler.batchAddIndex2Cust(docs,function(rep){
                                            if(rep.success){
                                                page++;
                                                buildIndex();
                                            }else{
                                                callback(rep);
                                            }
                                        })
                                    }else{
                                        logger.app.info("db==="+dbName+",collectionName==="+account+",all data is indexed.");
                                        idx++;
                                        addAccountIndex();
                                    }
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            })
                        }
                        buildIndex();
                    }else{
                        logger.app.error(err);
                        idx++;
                        addAccountIndex();
                    }
                })
            }else{
                logger.app.info("all data is indexed.");
                result.success=true;
                callback(result);
            }
        }
        addAccountIndex();
    },

    /***************************************km index***************************************/
    addIndex2Km : function(data, callback){
        var result = {success:false};
        var url=config.solr_url+'kmdoc/update/json?commit=true';
        url=encodeURI(url);
        data.content=utils.escapeSolrHtml(data.content);
        var postData = {
            add:{
                doc:data
            }
        }
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('addIndex failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    updateIndex2Km : function(data, callback){
        var result = {success:false};
        var url=config.solr_url+'kmdoc/update/json?commit=true';
        url=encodeURI(url);
        data.content=utils.escapeSolrHtml(data.content.set);
        var postData = [
            data
        ]
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('updateIndex2Km failed!', err);
                callback(result);
            } else {
                //{"responseHeader":{"status":0,"QTime":4}}
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    deleteIndex2Km:function(data,callback){
        var result = {success:false};
        var url=config.solr_url+'kmdoc/update/json?commit=true';
        url=encodeURI(url);
        var postData = {
            delete:data.ids||[]
        }
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('deleteIndex2Km failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    queryIndex2Km:function(data,session,callback){
        var result = {success:false};
        //indent=on&omitHeader=true
        var url=config.solr_url+'kmdoc/select/?wt=json';
        var aid=data.accountId;
        var kmType=data.kmType;
        var _query="&q=accountId:"+aid+" AND "+"kmType:"+kmType+" AND ";
        if(data.combox){
            var _val =encodeURIComponent(data.combox);
            _val=utils.escapeSolrRegex(_val);
            _query+="(title:\""+_val+"\" OR content:\""+_val+"\")";
        }
        //fl:返回的字段  &hl.fragsize=200 摘要长度
        var postData=_query+"&fl=_id,title,cid,accountId,lastTime&rows="+data.limit+"&start="+data.skip+"&sort=lastTime desc&hl=true"+
            "&hl.fl=title,content&hl.simple.pre=<strong style='color:red'>"+"&hl.simple.post=</strong>";

        //console.info("_query==="+postData);
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('queryIndex2Km failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    var repData=_rep.response||{};
                    var highlights=_rep.highlighting||{};

                    var docs=repData.docs||[];
                    var total=repData.numFound;
                    //console.dir(highlights)
                    if(docs.length>0){
                        docs.forEach(function (doc) {
                            var obj=highlights[doc._id];
                            doc.content="";
                            if(obj){
                                obj.content=obj.content||[];
                                if(obj.content.length>0){
                                    doc.content=obj.content[0];
                                }
                                obj.title=obj.title||[];
                                if(obj.title.length>0){
                                    doc.title=obj.title[0];
                                }
                            }
                        })
                    }
                    //console.dir(docs)
                    result.list=docs;
                    result.count=total;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        },'application/x-www-form-urlencoded');
    },
  /**
   * 查询知识库（整篇）
   * @param data
   * @param session
   * @param callback
   */
    queryWholeIndex2Km:function(data,session,callback){
        var funcName = '[SolrHandler - queryWholeIndex2Km]';
        var result = { success:false };
        var url = config.solr_url + 'kmdoc/select/?wt=json';
        var aid = data.accountId;
        var kmType = data.kmType;
        var _query = "&q=accountId:" + aid + " AND " + "kmType:" + kmType + " AND ";
        if(data.combox) {
            var _val = utils.escapeSolrRegex(data.combox);
            _val = encodeURIComponent(_val);
            _val = utils.escapeSolrRegex(_val);
            _query += "(title:" + _val + " OR content:" + _val + ")";
        }
        //fl:返回的字段  &hl.fragsize=0 取整篇文章
        var postData = _query + '&fl=_id,title,cid,accountId,lastTime,content&rows=' + data.limit +
            '&start=' + data.skip + '&sort=title desc,content desc' +
            '&hl=true&hl.fl=title,content' +
            '&hl.simple.pre=<strong style="color:#e86b64">&hl.simple.post=</strong>';

        httpProvider.sendSolrPost(url, postData, function(err, rep) {
            if (err) {
                logger.app.error(funcName, 'query km failed!', err);
                return callback(result);
            }

            try{
                var _rep = JSON.parse(rep);
                var repData = _rep.response || {};
                var highlights = _rep.highlighting || {};

                var docs = repData.docs || [];
                var total = repData.numFound;

                docs.forEach(function (doc) {
                    var obj = highlights[doc._id];
                    if (obj) {
                        // 提取高亮content
                        obj.content = obj.content || [];
                        if (obj.content.length > 0) {
                            doc.highlight = obj.content[0];
                        } else {
                            doc.highlight = doc.content.substring(0, 100);
                        }
                        // 替换高亮title
                        obj.title = obj.title || [];
                        if (obj.title.length > 0) {
                            doc.title = obj.title[0];
                        }
                    }
                });

                result.list = docs;
                result.count = total;
                result.success = true;
                callback(result);
            }catch (e) {
                logger.app.error(funcName, e);
                return callback(result);
            }
        },'application/x-www-form-urlencoded');
    },
    batchAddIndex2Km : function(/*Array*/data, callback){
        var result = {success:false};
        var url=config.solr_url+'kmdoc/update/json?commit=true';
        url=encodeURI(url);
        var postData = {
            add:data
        }
        httpProvider.sendSolrPost(url, postData,function(err, rep){
            if(err) {
                logger.app.error('batchAddIndex2Km failed!', err);
                callback(result);
            } else {
                try{
                    var _rep = JSON.parse(rep);
                    result.data=_rep;
                    result.success=true;
                    callback(result);
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=solr.dataImport2Km&data={"kmType":"inner"}
     * @param data
     * @param callback
     */
    dataImport2Km:function(data,callback){
        var result = {success: false};
        var kmType=data.kmType;
        if(!kmType){
            callback(result);
            return;
        }

        var tb=fields.DB_APP_KM_ITEM;
        if(kmType=='outer'){
            tb=fields.DB_APP_KM_OUTER_ITEM;
        }
        var tb2=fields.DB_APP_KM_CONTENT;
        if(kmType=='outer'){
            tb2=fields.DB_APP_KM_OUTER_CONTENT;
        }

        var limit=1000;
        var page=1;
        var buildIndex=function(){
            var skip = (page - 1) * limit;
            mongo.db("cc").collection(tb).find({},{limit:limit,skip:skip,fields:{_id:1,title:1,cid:1,accountId:1,lastTime:1}}).toArray(function(err,docs){
                if(!err){
                    docs=docs||[];
                    var idxs=[];
                    if(docs.length>0){
                        for (var i = 0; i < docs.length; i++) {
                            var obj = docs[i];
                            idxs.push(obj._id);
                        }
                        mongo.db("cc").collection(tb2).find({_id:{$in:idxs}}).toArray(function(err,contents){
                            if(!err){
                                contents=contents||[];
                                var map={};
                                for (var i = 0; i < contents.length; i++) {
                                    var obj = contents[i];
                                    map[obj._id]=utils.escapeSolrHtml(obj.content);
                                }
                                for (var i = 0; i < docs.length; i++) {
                                    var obj = docs[i];
                                    obj.content=map[obj._id]||'';
                                    obj.kmType=kmType;
                                }

                                handler.batchAddIndex2Km(docs,function(rep){
                                    if(rep.success){
                                        page++;
                                        buildIndex();
                                    }else{
                                        callback(rep);
                                    }
                                })
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        })
                    }else{
                        logger.app.info("kmType==="+kmType+",all data is indexed.");
                        result.success=true;
                        callback(result);
                    }
                }else{
                    logger.app.error(err);
                    callback(result);
                }
            })
        }
        buildIndex();
    },
    /**
     * http://127.0.0.1:4000/public?action=solr.dataImport2KmByAccount&data={"account":"N00000000143","kmType":"inner"}
     * kmType:inner,outer
     * @param data
     * @param callback
     */
    dataImport2KmByAccount:function(data,callback){
        var result = {success: false};
        var account=data.account;
        var kmType=data.kmType;
        if(!kmType){
            callback(result);
            return;
        }

        var tb=fields.DB_APP_KM_ITEM;
        if(kmType=='outer'){
            tb=fields.DB_APP_KM_OUTER_ITEM;
        }
        var tb2=fields.DB_APP_KM_CONTENT;
        if(kmType=='outer'){
            tb2=fields.DB_APP_KM_OUTER_CONTENT;
        }

        var limit=1000;
        var page=1;
        var buildIndex=function(){
            var skip = (page - 1) * limit;
            mongo.db("cc").collection(tb).find({accountId:account},{limit:limit,skip:skip,fields:{_id:1,title:1,cid:1,accountId:1,lastTime:1}}).toArray(function(err,docs){
                if(!err){
                    docs=docs||[];
                    var ids=[];
                    if(docs.length>0){
                        for (var i = 0; i < docs.length; i++) {
                            var obj = docs[i];
                            ids.push(obj._id);
                        }
                        mongo.db("cc").collection(tb2).find({_id:{$in:ids}}).toArray(function(err,contents){
                            if(!err){
                                contents=contents||[];
                                var map={};
                                for (var i = 0; i < contents.length; i++) {
                                    var obj = contents[i];
                                    map[obj._id]=utils.escapeSolrHtml(obj.content);
                                }
                                for (var i = 0; i < docs.length; i++) {
                                    var obj = docs[i];
                                    obj.content=map[obj._id]||'';
                                    obj.kmType=kmType;
                                    //console.dir(obj);
                                }

                                handler.batchAddIndex2Km(docs,function(rep){
                                    if(rep.success){
                                        page++;
                                        buildIndex();
                                    }else{
                                        callback(rep);
                                    }
                                })
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        })
                    }else{
                        logger.app.info("kmType==="+kmType+",account==="+account+",all data is indexed.");
                        result.success=true;
                        callback(result);
                    }
                }else{
                    logger.app.error(err);
                    callback(result);
                }
            })
        }
        buildIndex();
    },

    //////////////////////for test
    querySolr : function(data, callback){
        var url='http://121.40.122.105:8090/solr/customer/select/?q=name:微&fq=account:11&indent=on&wt=json';
        //q=content_test:搜索&indent=on&wt=json
        url=encodeURI(url);
        httpProvider.sendGet(url,function(err, result){
            if(err) {
                logger.app.warn('querySolr failed!', err);
                callback(false);
            } else {
                var res = JSON.parse(result);
                callback(res);
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=solr.querySolrPost&data={}
     * @param data
     * @param callback
     */
    querySolrPost :function(data, callback){
        var url='http://121.40.122.105:8090/solr/customer/select?wt=json';
        //q=content_test:搜索&indent=on&wt=json
        url=encodeURI(url);
        //var postData = {
        //    q: 'account:N00000000143 AND name:微',
        //    indent: 'on',
        //    fl: '_id',
        //    rows: 1000,
        //    wt:"json"
        //}
        var postData="&q=account:N00000000143 AND name:微&indent=on&fl=_id&rows=1000";
        httpProvider.sendPost(url, postData,function(err, result){
            if(err) {
                logger.app.warn('querySolrPost failed!', err);
                callback(false);
            } else {
                var res = JSON.parse(result);
                callback(res);
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=solr.updateSolr&data={}
     * @param data
     * @param callback
     */
    updateSolr : function(data, callback){
        var url='http://121.40.122.105:8090/solr/customer/update/json?commit=true';
        url=encodeURI(url);
        var postData = {
            add:[
                {
                    _id : "07e156f0-0c55-11e5-xmef-xx8c03963fc8",
                    account:'N00000000143',
                    name: '士大夫',
                    phone:['123','456'],
                    notifyTime:'2015-12-03 20:00',
                    createTime:'2015-06-06 22:05:04'
                }
            ]
        }
        httpProvider.sendSolrPost(url, postData,function(err, result){
            if(err) {
                logger.app.warn('testSolr failed!', err);
                callback(false);
            } else {

                var res = JSON.parse(result);
                console.dir(res);
                callback(res);
                //callback(true);
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=solr.deleteSolr&data={}
     * @param data
     * @param callback
     */
    deleteSolr : function(data, callback){
        var url='http://121.40.122.105:8090/solr/customer/update?commit=true';
        url=encodeURI(url);
        var postData = {
            //delete: { _id:"10" }
            //delete: "07e156f0-0c55-11e5-97ef-f38c03963fc8"
            //delete: { query:"*:*"}
            delete: { query:"account:N00000000143"}
        }
        httpProvider.sendSolrPost(url, postData,function(err, result){
            if(err) {
                logger.app.warn('testSolr failed!', err);
                callback(false);
            } else {
                var res = JSON.parse(result);
                //console.dir(res);
                callback(res);
                //callback(true);
            }
        });
    },
    /**
     * http://127.0.0.1:4000/public?action=solr.deleteKmSolr&data={}
     * @param data
     * @param callback
     */
    deleteKmSolr : function(data, callback){
        var url=config.solr_url+'kmdoc/update/json?commit=true';
        url=encodeURI(url);
        var postData = {
            delete: { query:"*:*"}
            //delete: { query:"account:N00000000143"}
        }
        httpProvider.sendSolrPost(url, postData,function(err, result){
            if(err) {
                logger.app.warn('deleteKmSolr failed!', err);
                callback(false);
            } else {
                var res = JSON.parse(result);
                //console.dir(res);
                callback(res);
                //callback(true);
            }
        });
    }

};



module.exports = handler;


