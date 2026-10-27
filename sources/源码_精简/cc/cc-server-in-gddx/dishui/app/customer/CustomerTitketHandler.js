var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var http = require('appHttp');
var uuid = require('appUtil/UUID');
var config = require('appConfig').conf;
var syncAcs = require(__baseDir + "/dishui/app/batch/SyncAcsHandler");
var thenjs =require("thenjs");
var custHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');


var custTitketHandler = {
    queryCustTitketList : function(data,session,callback){
        var result = {success: false};
        var page = data.page||1;
        delete data['page'];
        page = page || 1;
        var limit = data.limit || 10;
        delete data['limit'];
        var skip = (page - 1) * limit;
        var queryUser = {};
        if(!data.combox){
            delete data.combox;
        }else{
            var regStr=utils.escapeRegex(data.combox);
            queryUser.displayName = new RegExp(regStr);
            queryUser.account = session.account.account;
            delete data.combox;
        }
        if(!data.status){
            delete data.status;
        }else{
            data.status = data.status;
            if(data.status == "2"){
                data.status = {$in:["2","3"]}
            }
        }
        if(!data.type){
            delete data.type;
        }else{
            data.type = data.type;
        }
        data.account = session.account.account;
        var condition = data;
        //按照用户名查询
        if(queryUser.displayName){
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(queryUser).toArray(function(err,users){
                if(users.length == 0){
                    result.list = [];
                    result.count = 0;
                    result.success = true;
                    callback(result);
                }else{
                    var userIds = [];
                    for (var i=0; i< users.length; i++) {
                        userIds.push(users[i]._id);
                    }
                    condition.user = {$in:userIds};
                    mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(condition, {sort: {time: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                        if (!err) {
                            result.list = docs;
                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).count(condition, function (err, count) {
                                if (!err) {
                                    result.count = count;
                                    result.success = true;
                                    callback(result);
                                } else {
                                    logger.app.error(err);
                                    callback({success: false, list: [], count: 0});
                                }
                            });
                        } else {
                            logger.app.error(err);
                            callback({success: false, list: [], count: 0});
                        }
                    });
                }

            });
        }else{
            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(condition, {sort: {time: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                if (!err) {
                    result.list = docs;
                    mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).count(condition, function (err, count) {
                        if (!err) {
                            result.count = count;
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback({success: false, list: [], count: 0});
                        }
                    });
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        }


    },
    queryCustTitketById : function(data,session,callback){
        var result = {success: false};
        var query = {_id:data};
        query.account = session.account.account;
        mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).findOne(query,function(err,doc){
            if(!err){
                result.success = true;
                result.custTitket = doc;
                callback(result);
            }else{
                logger.app.error('db resetStatus error:' + err.stack);
                callback(result);
            }
        });

    },
    addCustTitket : function(data,session,callback){
        var result = {success: false};
        if(data.type == "1"){ //奖券
            //罚券
            var titketQuery = {"user":data.user,"type":"0","status":"1"};
            titketQuery.account = session.account.account;
            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(titketQuery).toArray(function (err, docs) {
                if (!err) {
                    data.num = parseInt(data.num);
                    var penaltyTitketCount = docs.length || 0; //获得罚券集合
                    if(penaltyTitketCount >= data.num){//罚券数量比添加的罚券数量大,不添加,只修改状态
                        var bulkWrite =[];
                        for (var i=0; i< data.num; i++) {
                            var bulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i]._id },
                                "update": { $set : {"status":"3","lastUpdater":session.user._id,useTime:utils.getCurrentDate()} }
                            }}
                            bulkWrite.push(bulkQuery)
                        }
                        if(bulkWrite.length == 0){
                            var setData = {$inc:{"score":data.num}};
                            mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                                if (!err) {
                                    result.success = true;
                                    callback(result);
                                } else {
                                    logger.app.error('settingCustTitketFlag error:' + err.stack);
                                    result.message = "settingCustTitketFlag error";
                                    callback(result)
                                }
                            })
                        }else{
                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWrite,function(err) {
                                if (!err) {
                                    var setData = {$inc:{"score":data.num}};
                                    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                                        if (!err) {
                                            var insertArry = [];
                                            for(var i=0; i< data.num; i++){
                                                var insertData = {};
                                                var qid=uuid.generateUuid();
                                                insertData._id = qid;
                                                insertData.creator = session.user._id;
                                                insertData.time = utils.getCurrentDate();
                                                insertData.source = "system";
                                                insertData.type = data.type;
                                                insertData.account = session.account.account;
                                                insertData.num = 1;
                                                insertData.user = data.user;
                                                insertData.memo = data.memo;
                                                insertData.useTime = utils.getCurrentDate();
                                                insertData.status = "3"; //0：:作废，1：未用，2：已用 3:抵消
                                                insertData.useTime = utils.getCurrentDate();
                                                insertData.lastUpdater = session.user._id;
                                                insertArry.push(insertData);
                                            }
                                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).insertMany(insertArry,function(err) {
                                                if (!err) {
                                                    result.success = true;
                                                    callback(result);
                                                } else {
                                                    logger.app.error('db addCustTitket error:' + err.stack);
                                                    result.message = "addCustTitket error";
                                                    callback(result)
                                                }
                                            });
                                        } else {
                                            logger.app.error('settingCustTitketFlag error:' + err.stack);
                                            result.message = "settingCustTitketFlag error";
                                            callback(result)
                                        }
                                    })
                                } else {
                                    logger.app.error('db moveDept error:' + err.stack);
                                    result.message = "moveDept error";
                                    callback(result)
                                }
                            });
                        }

                    }else{//只添加多出的奖券,其余修改状态为抵消
                        var insertNum = data.num - penaltyTitketCount;
                        var bulkWrite =[];
                        for (var i=0; i<docs.length; i++) {
                            var bulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i]._id },
                                "update": { $set : {"status":"3","lastUpdater":session.user._id,useTime:utils.getCurrentDate()} }
                            }}
                            bulkWrite.push(bulkQuery)
                        }
                        if(bulkWrite.length == 0){
                            var setData = {$inc:{"score":data.num}};
                            mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                                if (!err) {
                                    var insertArry = [];
                                    for(var i=0; i< data.num; i++){
                                        var insertData = {};
                                        var qid=uuid.generateUuid();
                                        insertData._id = qid;
                                        insertData.creator = session.user._id;
                                        insertData.time = utils.getCurrentDate();
                                        insertData.source = "system";
                                        insertData.type = data.type;
                                        insertData.account = session.account.account;
                                        insertData.num = 1;
                                        insertData.user = data.user;
                                        insertData.memo = data.memo;
                                        insertData.status = "1"; //0：:作废，1：未用，2：已用 3:抵消
                                        insertData.lastUpdater = session.user._id;
                                        insertArry.push(insertData);
                                    }
                                    mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).insertMany(insertArry,function(err) {
                                        if (!err) {
                                            result.success = true;
                                            callback(result);
                                        } else {
                                            logger.app.error('db addCustTitket error:' + err.stack);
                                            result.message = "addCustTitket error";
                                            callback(result)
                                        }
                                    });
                                } else {
                                    logger.app.error('settingCustTitketFlag error:' + err.stack);
                                    result.message = "settingCustTitketFlag error";
                                    callback(result)
                                }
                            })
                        }else{
                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWrite,function(err) {
                                if (!err) {
                                    var setData = {$inc:{"score":data.num}};
                                    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                                        if (!err) {
                                            var insertArry = [];
                                            for(var i=0; i< data.num; i++){
                                                var insertData = {};
                                                var qid=uuid.generateUuid();
                                                insertData._id = qid;
                                                insertData.creator = session.user._id;
                                                insertData.time = utils.getCurrentDate();
                                                insertData.source = "system";
                                                insertData.type = data.type;
                                                insertData.num = 1;
                                                insertData.account = session.account.account;
                                                insertData.user = data.user;
                                                insertData.memo = data.memo;
                                                if(i >= insertNum){
                                                    insertData.status = "3"; //0：:作废，1：未用，2：已用 3:抵消
                                                    insertData.useTime = utils.getCurrentDate();
                                                }else{
                                                    insertData.status = "1"; //0：:作废，1：未用，2：已用 3:抵消
                                                }
                                                insertData.lastUpdater = session.user._id;
                                                insertArry.push(insertData);
                                            }
                                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).insertMany(insertArry,function(err) {
                                                if (!err) {
                                                    result.success = true;
                                                    callback(result);
                                                } else {
                                                    logger.app.error('db addCustTitket error:' + err.stack);
                                                    result.message = "addCustTitket error";
                                                    callback(result)
                                                }
                                            });
                                        } else {
                                            logger.app.error('settingCustTitketFlag error:' + err.stack);
                                            result.message = "settingCustTitketFlag error";
                                            callback(result)
                                        }
                                    })
                                } else {
                                    logger.app.error('db moveDept error:' + err.stack);
                                    result.message = "moveDept error";
                                    callback(result)
                                }
                            });
                        }

                    }
                } else {
                    logger.app.error('addCustTitket error:' + err.stack);
                    result.message = "addCustTitket error";
                    callback(result)
                }

            });
        }else if(data.type == "0"){ //罚券
            var titketQuery = {"user":data.user,"type":"1","status":"1"};
            titketQuery.account = session.account.account;
            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(titketQuery).toArray(function (err, docs) {
                if (!err) {
                    data.num = parseInt(data.num);
                    var rewardTitketCount = docs.length || 0; //获得奖券集合
                    if(rewardTitketCount >= data.num){//奖券数量比添加的罚券数量大,不添加,只修改状态
                        var bulkWrite =[];
                        for (var i=0; i< data.num; i++) {
                            var bulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i]._id },
                                "update": { $set : {"status":"3","lastUpdater":session.user._id,useTime:utils.getCurrentDate()} }
                            }}
                            bulkWrite.push(bulkQuery)
                        }
                        if(bulkWrite.length == 0){
                            var setData = {$inc:{"score":0-data.num}};
                            mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                                if (!err) {
                                    result.success = true;
                                    callback(result);
                                } else {
                                    logger.app.error('settingCustTitketFlag error:' + err.stack);
                                    result.message = "settingCustTitketFlag error";
                                    callback(result)
                                }
                            })
                        }else{
                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWrite,function(err) {
                                if (!err) {
                                    var setData = {$inc:{"score":0-data.num}};
                                    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                                        if (!err) {
                                            var insertArry = [];
                                            for(var i=0; i< data.num; i++){
                                                var insertData = {};
                                                var qid=uuid.generateUuid();
                                                insertData._id = qid;
                                                insertData.creator = session.user._id;
                                                insertData.time = utils.getCurrentDate();
                                                insertData.source = "system";
                                                insertData.type = data.type;
                                                insertData.account = session.account.account;
                                                insertData.num = 1;
                                                insertData.user = data.user;
                                                insertData.memo = data.memo;
                                                insertData.status = "3"; //0：:作废，1：未用，2：已用 3:抵消
                                                insertData.useTime = utils.getCurrentDate();
                                                insertData.lastUpdater = session.user._id;
                                                insertArry.push(insertData);
                                            }
                                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).insertMany(insertArry,function(err) {
                                                if (!err) {
                                                    result.success = true;
                                                    callback(result);
                                                } else {
                                                    logger.app.error('db addCustTitket error:' + err.stack);
                                                    result.message = "addCustTitket error";
                                                    callback(result)
                                                }
                                            });
                                        } else {
                                            logger.app.error('settingCustTitketFlag error:' + err.stack);
                                            result.message = "settingCustTitketFlag error";
                                            callback(result)
                                        }
                                    })
                                } else {
                                    logger.app.error('db moveDept error:' + err.stack);
                                    result.message = "moveDept error";
                                    callback(result)
                                }
                            });
                        }
                    }else{//只添加多出的罚券,其余修改状态为抵消
                        var insertNum = data.num - rewardTitketCount;
                        var bulkWrite =[];
                        for (var i=0; i<docs.length; i++) {
                            var bulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i]._id },
                                "update": { $set : {"status":"3","useTime":utils.getCurrentDate(),"lastUpdater":session.user._id} }
                            }}
                            bulkWrite.push(bulkQuery)
                        }
                        if(bulkWrite.length == 0){
                            var setData = {$inc:{"score":0-data.num}};
                            mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                                if (!err) {
                                    var insertArry = [];
                                    for(var i=0; i< data.num; i++){
                                        var insertData = {};
                                        var qid=uuid.generateUuid();
                                        insertData._id = qid;
                                        insertData.creator = session.user._id;
                                        insertData.time = utils.getCurrentDate();
                                        insertData.source = "system";
                                        insertData.type = data.type;
                                        insertData.num = 1;
                                        insertData.account = session.account.account;
                                        insertData.user = data.user;
                                        insertData.memo = data.memo;
                                        if(i >= insertNum){
                                            insertData.status = "3"; //0：:作废，1：未用，2：已用 3:抵消
                                            insertData.useTime = utils.getCurrentDate();
                                        }else{
                                            insertData.status = "1"; //0：:作废，1：未用，2：已用 3:抵消
                                        }
                                        insertData.lastUpdater = session.user._id;
                                        insertArry.push(insertData);
                                    }
                                    mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).insertMany(insertArry,function(err) {
                                        if (!err) {
                                            result.success = true;
                                            callback(result);
                                        } else {
                                            logger.app.error('db addCustTitket error:' + err.stack);
                                            result.message = "addCustTitket error";
                                            callback(result)
                                        }
                                    });
                                } else {
                                    logger.app.error('settingCustTitketFlag error:' + err.stack);
                                    result.message = "settingCustTitketFlag error";
                                    callback(result)
                                }
                            })
                        }else{
                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWrite,function(err) {
                                if (!err) {
                                    var setData = {$inc:{"score":0-data.num}};
                                    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                                        if (!err) {
                                            var insertArry = [];
                                            for(var i=0; i< data.num; i++){
                                                var insertData = {};
                                                var qid=uuid.generateUuid();
                                                insertData._id = qid;
                                                insertData.creator = session.user._id;
                                                insertData.time = utils.getCurrentDate();
                                                insertData.source = "system";
                                                insertData.type = data.type;
                                                insertData.num = 1;
                                                insertData.account = session.account.account;
                                                insertData.user = data.user;
                                                insertData.memo = data.memo;
                                                if(i >= insertNum){
                                                    insertData.status = "3"; //0：:作废，1：未用，2：已用 3:抵消
                                                    insertData.useTime = utils.getCurrentDate();
                                                }else{
                                                    insertData.status = "1"; //0：:作废，1：未用，2：已用 3:抵消
                                                }
                                                insertData.lastUpdater = session.user._id;
                                                insertArry.push(insertData);
                                            }
                                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).insertMany(insertArry,function(err) {
                                                if (!err) {
                                                    result.success = true;
                                                    callback(result);
                                                } else {
                                                    logger.app.error('db addCustTitket error:' + err.stack);
                                                    result.message = "addCustTitket error";
                                                    callback(result)
                                                }
                                            });
                                        } else {
                                            logger.app.error('settingCustTitketFlag error:' + err.stack);
                                            result.message = "settingCustTitketFlag error";
                                            callback(result)
                                        }
                                    })
                                } else {
                                    logger.app.error('db moveDept error:' + err.stack);
                                    result.message = "moveDept error";
                                    callback(result)
                                }
                            });
                        }
                    }

                } else {
                    logger.app.error('addCustTitket error:' + err.stack);
                    result.message = "addCustTitket error";
                    callback(result)
                }

            });
        }
    },
    updateCustTitket : function(data,session,callback){
        var result = {success: false};
        var setData = {$set:{"status":data.status,"lastTime":utils.getCurrentDate(),"lastUpdater":session.user._id}};
        var query = {"_id":data._id};
        query.account = session.account.account;
        mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).update(query,setData,function(err){
            if (!err) {
                var setData = {$inc:{"score":1}};
                if(data.type == "0"){
                    if(data.status != "0" ){
                        setData =  {$inc:{"score":1}};
                    }
                }else{
                    if(data.status == "0"){
                        setData =  {$inc:{"score":-1}};
                    }
                }
                mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":data.user},setData,function(){
                    result.success = true;
                    callback(result);
                });

            } else {
                logger.app.error('updateCustTitket error:' + err.stack);
                result.message = "updateCustTitket error";
                callback(result)
            }
        })
    },
    batchUpdateTitket : function(data,session,callback){
        var result = {success: false};
        var query = data.query || {};
        data.status =  data.status;
        var queryUser = {};
        if(query){
            if(!query.combox){
                delete query.combox;
            }else{
                var regStr=utils.escapeRegex(query.combox);
                queryUser.displayName = new RegExp(regStr);
                queryUser.account = session.account.account;
                delete query.combox;
            }
            if(!data.type){
                delete data.type;
            }else{
                query.type = query.type;
            }
        }
        if(queryUser.displayName){
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(queryUser).toArray(function(err,users){
                if(users.length == 0){
                    result.list = [];
                    result.count = 0;
                    result.success = true;
                    callback(result);
                }else{
                    var userIds = [];
                    for (var i=0; i< users.length; i++) {
                        userIds.push(users[i]._id);
                    }
                    query.user = {$in:userIds};
                    mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(query).toArray(function (err, docs) {
                        var bulkWrite =[];
                        var userBulkWrite = [];
                        for (var i=0; i< docs.length; i++) {
                            var userBulkQuery = null;
                            if(docs[i].type == 1 && docs[i].status != data.status){
                                if(data.status == "0"){
                                    userBulkQuery = { updateOne : {
                                        "filter": { "_id" : docs[i].user },
                                        "update": {$inc:{"score":-1}}
                                    }}
                                }else{
                                    userBulkQuery = { updateOne : {
                                        "filter": { "_id" : docs[i].user },
                                        "update": {$inc:{"score":1}}
                                    }}
                                }
                            }else if(docs[i].type == "0" && docs[i].status != data.status){
                                if(data.status == "0"){
                                    userBulkQuery = { updateOne : {
                                        "filter": { "_id" : docs[i].user },
                                        "update": {$inc:{"score":1}}
                                    }}
                                }else{
                                    userBulkQuery = { updateOne : {
                                        "filter": { "_id" : docs[i].user },
                                        "update": {$inc:{"score":-1}}
                                    }}
                                }
                            }
                            var bulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i]._id },
                                "update": { $set : {"status":data.status,"lastUpdater":session.user._id} }
                            }}
                            bulkWrite.push(bulkQuery);
                            if(userBulkQuery) userBulkWrite.push(userBulkQuery);
                        }
                        if(bulkWrite.length == 0){
                            result.success = true;
                            callback(result);
                        }else{
                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWrite,function(err) {
                                if (!err) {
                                    if(userBulkWrite.length == 0){
                                        result.success = true;
                                        callback(result);
                                    }else{
                                        mongo.db('bill').collection(fields.DB_PLATFORM_USER).bulkWrite(userBulkWrite,function(err){
                                            if(!err){
                                                result.success = true;
                                                callback(result);
                                            }else{
                                                logger.app.error('settingCustTitketFlag error:' + err.stack);
                                                result.message = "settingCustTitketFlag error";
                                                callback(result)
                                            }
                                        });
                                    }

                                }else{
                                    logger.app.error('settingCustTitketFlag error:' + err.stack);
                                    result.message = "settingCustTitketFlag error";
                                    callback(result)
                                }
                            })
                        }

                    })
                }
            });
        }else{
            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(query).toArray(function (err, docs) {
                var bulkWrite =[];
                var userBulkWrite = [];
                for (var i=0; i< docs.length; i++) {
                    var userBulkQuery = null;
                    if(docs[i].type == 1 && docs[i].status != data.status){
                        if(data.status == 0){
                            userBulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i].user },
                                "update": {$inc:{"score":-1}}
                            }}
                        }else{
                            userBulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i].user },
                                "update": {$inc:{"score":1}}
                            }}
                        }
                    }else if(docs[i].type == 0 && docs[i].status != data.status){
                        if(data.status == 0){
                            userBulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i].user },
                                "update": {$inc:{"score":1}}
                            }}
                        }else{
                            userBulkQuery = { updateOne : {
                                "filter": { "_id" : docs[i].user },
                                "update": {$inc:{"score":-1}}
                            }}
                        }
                    }
                    var bulkQuery = { updateOne : {
                        "filter": { "_id" : docs[i]._id },
                        "update": { $set : {"status":data.status,"lastUpdater":session.user._id} }
                    }}
                    bulkWrite.push(bulkQuery);
                    if(userBulkQuery) userBulkWrite.push(userBulkQuery);
                }
                if(bulkWrite.length == 0){
                    result.success = true;
                    callback(result);
                }else{
                    mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWrite,function(err) {
                        if (!err) {
                            if(userBulkWrite.length == 0){
                                result.success = true;
                                callback(result);
                            }else{
                                mongo.db('bill').collection(fields.DB_PLATFORM_USER).bulkWrite(userBulkWrite,function(err){
                                    if(!err){
                                        result.success = true;
                                        callback(result);
                                    }else{
                                        logger.app.error('settingCustTitketFlag error:' + err.stack);
                                        result.message = "settingCustTitketFlag error";
                                        callback(result)
                                    }
                                });
                            }

                        }else{
                            logger.app.error('settingCustTitketFlag error:' + err.stack);
                            result.message = "settingCustTitketFlag error";
                            callback(result)
                        }
                    })
                }

            })
        }
    },
    //领取商机开关  0：关，1:开
    settingCustTitketFlag : function(data,session,callback){
        var result = {success: false};
        var setData = {$set:{"getCustFlag":data}};
        if(data == "1"){
            setData= {$unset: {"getCustFlag":1} }
        }
        var query = {"_id":session.user._id};
        query.account = session.account.account;
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).update(query,setData,function(err){
            if (!err) {
                if(data=='1'){
                    custHandler.emitCustSaleWait({getCustFlag:true},session);
                }

                result.success = true;
                callback(result);
            } else {
                logger.app.error('settingCustTitketFlag error:' + err.stack);
                result.message = "settingCustTitketFlag error";
                callback(result)
            }
        })
    },
    //查询当前座席奖罚券数量
    queryCustTitketCount :  function(data,session,callback){
        var result = {success: false};
        var query = {"user":session.user._id};
        query.account = session.account.account;
        mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(query).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                result.allTitketCount = docs.length || 0; //全部数量
                result.rewardTitketCount = 0; //奖励
                result.penaltyTitketCount = 0; //处罚
                result.notusedTitketCount = 0; //未使用
                result.usedTitketCount = 0; //已使用
                result.offsetTitketCount = 0; //抵消
                for(var i=0; i<docs.length; i++) {
                    var titket = docs[i];
                    if(titket.status == "1"){
                        result.notusedTitketCount += 1;
                    }else if(titket.status == "2"){
                        result.usedTitketCount += 1;
                    }else if(titket.status == "3"){
                        result.offsetTitketCount += 1;
                    }
                    if(titket.type == "0" && titket.status == "1"){
                        result.penaltyTitketCount += 1;
                    }
                    if(titket.type == "1" && titket.status == "1"){
                        result.rewardTitketCount += 1;
                    }
                }
                callback(result);
            } else {
                logger.app.error('settingCustTitketFlag error:' + err.stack);
                result.message = "settingCustTitketFlag error";
                callback(result)
            }
        });
    },
    //转增奖罚券
    donationCustTitket : function(data,session,callback){
        var result = {success: false};
        var toUser = data.toUser;
        var donationNum = parseInt(data.donationNum);
        if(session.user._id == toUser) {
            result.message = "转赠失败,不能转赠给自己!";
            callback(result)
        }else{
            var query = {"user":session.user._id,"type":"1","status":"1"};
            query.account = session.account.account;
            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(query).toArray(function (err, docs) {
                if (!err) {
                    if(docs.length < donationNum){
                        result.message = "转赠失败,未使用的奖券数量不足!";
                        callback(result)
                    }else{
                        //先查询对方是否有开关
                        //mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne({"_id":toUser},function (err,doc){
                        //   if(doc.getCustFlag){ //未开启开关
                        //       result.message = "转赠失败,对方未开启商机券开关!";
                        //       callback(result)
                        //   } else{
                        //自己减少score数.对方增加或者抵消
                        var setData = {$inc:{"score":parseInt(0-donationNum)}};
                        mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":session.user._id},setData,function(err){
                            if (!err) {
                                //查询对方有多少罚券
                                var titketQuery = {"user":toUser,"type":"0","status":"1"};
                                titketQuery.account = session.account.account;
                                mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).find(titketQuery).toArray(function (err, titkets) {
                                    if (!err) {
                                        var penaltyTitketCount = titkets.length; //获得罚券集合
                                        var insertNum = donationNum - penaltyTitketCount;
                                        var bulkWriteFormUser = [];
                                        var bulkWriteToUser = [];
                                        if(penaltyTitketCount >= donationNum){//罚券数量比添加的奖券量大,不添加,只修改状态
                                            for(var i=0;i<donationNum;i++){
                                                var setData = {user:toUser,source:session.user._id,status:"3","time":utils.getCurrentDate(),"lastUpdater":toUser,useTime:utils.getCurrentDate()};
                                                var bulkQuery = { updateOne : {
                                                    "filter": { "_id" : docs[i]._id },
                                                    "update": { $set : setData}
                                                }}
                                                bulkWriteFormUser.push(bulkQuery)
                                            }
                                            for(var i=0;i<donationNum;i++){
                                                var setData = {user:toUser,status:"3","time":utils.getCurrentDate(),"lastUpdater":toUser,useTime:utils.getCurrentDate()};
                                                var bulkQuery = { updateOne : {
                                                    "filter": { "_id" : titkets[i]._id },
                                                    "update": { $set : setData}
                                                }}
                                                bulkWriteToUser.push(bulkQuery)
                                            }
                                            //toUser抵消
                                            mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWriteToUser,function(err) {
                                                if (!err) {
                                                    mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWriteFormUser,function(err) {
                                                        if (!err) {
                                                            var setData = {$inc:{"score":donationNum}};
                                                            mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":toUser},setData,function(err){
                                                                if (!err) {
                                                                    result.success = true;
                                                                    callback(result);
                                                                }else{
                                                                    logger.app.error('donationCustTitket error:' + err.stack);
                                                                    result.message = "donationCustTitket error";
                                                                    callback(result)
                                                                }
                                                            })
                                                        }else{
                                                            logger.app.error('donationCustTitket error:' + err.stack);
                                                            result.message = "donationCustTitket error";
                                                            callback(result)
                                                        }
                                                    })

                                                }else{
                                                    logger.app.error('donationCustTitket error:' + err.stack);
                                                    result.message = "donationCustTitket error";
                                                    callback(result)
                                                }
                                            });


                                        }else{
                                            for(var i=0;i<donationNum;i++){
                                                var setData = {user:toUser,source:session.user._id,status:"1","lastUpdater":toUser};
                                                if(i >= insertNum) setData = {user:toUser,source:session.user._id,status:"3","lastUpdater":toUser,useTime:utils.getCurrentDate()};
                                                var bulkQuery = { updateOne : {
                                                    "filter": { "_id" : docs[i]._id },
                                                    "update": { $set : setData}
                                                }}
                                                bulkWriteFormUser.push(bulkQuery)
                                            }

                                            if(insertNum <= titkets.length){
                                                for(var i=0;i<insertNum;i++){
                                                    var setData = {user:toUser,status:"3","time":utils.getCurrentDate(),"lastUpdater":toUser,useTime:utils.getCurrentDate()};
                                                    var bulkQuery = { updateOne : {
                                                        "filter": { "_id" : titkets[i]._id },
                                                        "update": { $set : setData}
                                                    }}
                                                    bulkWriteToUser.push(bulkQuery)
                                                }
                                            }
                                            //toUser抵消

                                            if(bulkWriteToUser.length > 0 ){
                                                mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWriteToUser,function(err) {
                                                    if (!err) {
                                                        mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWriteFormUser,function(err) {
                                                            if (!err) {
                                                                var setData = {$inc:{"score":donationNum}};
                                                                mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":toUser},setData,function(err){
                                                                    if (!err) {
                                                                        result.success = true;
                                                                        callback(result);
                                                                    }else{
                                                                        logger.app.error('donationCustTitket error:' + err.stack);
                                                                        result.message = "donationCustTitket error";
                                                                        callback(result)
                                                                    }
                                                                })
                                                            }else{
                                                                logger.app.error('donationCustTitket error:' + err.stack);
                                                                result.message = "donationCustTitket error";
                                                                callback(result)
                                                            }
                                                        });
                                                    }else{
                                                        logger.app.error('donationCustTitket error:' + err.stack);
                                                        result.message = "donationCustTitket error";
                                                        callback(result)
                                                    }
                                                })
                                            }else {
                                                mongo.db().collection(fields.DB_APP_CUSTOMER_TITKET).bulkWrite(bulkWriteFormUser,function(err) {
                                                    if (!err) {
                                                        var setData = {$inc:{"score":donationNum}};
                                                        mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id":toUser},setData,function(err){
                                                            if (!err) {
                                                                result.success = true;
                                                                callback(result);
                                                            }else{
                                                                logger.app.error('donationCustTitket error:' + err.stack);
                                                                result.message = "donationCustTitket error";
                                                                callback(result)
                                                            }
                                                        })
                                                    }else{
                                                        logger.app.error('donationCustTitket error:' + err.stack);
                                                        result.message = "donationCustTitket error";
                                                        callback(result)
                                                    }
                                                });
                                            }

                                        }

                                    } else {
                                        logger.app.error('donationCustTitket error:' + err.stack);
                                        result.message = "donationCustTitket error";
                                        callback(result)
                                    }

                                });

                            } else {
                                logger.app.error('donationCustTitket error:' + err.stack);
                                result.message = "donationCustTitket error";
                                callback(result)
                            }
                        })
                        //   }
                        //});
                    }
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        }
    }

};
module.exports = custTitketHandler;