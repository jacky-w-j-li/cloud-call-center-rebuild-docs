var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var uuid = require('appUtil/UUID');
var fields = require(__baseDir + '/dishui/common/Fields');
var thenjs =require("thenjs");

var deptHandler = {
    _setQueryCondition : function(query){
        utils.removeEmptyProperty(query);
        query.product = 'cc';
        if(query.combox){
            query.displayName=new RegExp(query.combox);
//        query.$or=[{displayName:new RegExp(query.combox)},{exten:query.combox}];
            delete query.combox;
        }
        if(query.beginExten){
            query.exten={$gte:query.beginExten};
            delete query.beginExten;
        }
        if(query.endExten){
            if(!query.exten)query.exten={};
            query.exten["$lte"]=query.endExten;
            delete query.endExten;
        }
    },
    queryDeptList : function (data,session,callback){
        var result = {success: false};
        var query = {"account":session.account.account};
        mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).find(query,{sort:{"order":-1,"createTime":1}}).toArray(function(err, docs) {
            if (!err) {
                result.success = true;
                result.depts = docs||[];
                callback(result);
            } else {
                logger.app.error('db queryDeptList error:' + err.stack);
                result.message = "queryDeptList error";
                callback(result)
            }
        });
    },
    queryUser : function (data,session,callback){
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        if(!condition.account){
            condition.account=session.user.account;
        }
        deptHandler._setQueryCondition(condition);
        if(condition.deptId == "noDept"){
            condition.deptId = {$in:[null,""]};
        }

        if(condition.status){
            if(condition.status == "enable"){
                condition.status = {$in:[null,"","enable"]}
            }
        }
        var result = {success: false};
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db('bill').collection(fields.DB_PLATFORM_USER).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        result.message = "queryUser error";
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                result.message = "queryUser error";
                callback({success: false, list: [], count: 0});
            }
        });

    },
    addDept : function (data,session,callback){
        var result = {success: false};
        var insertData = {};
        insertData._id = data._id;
        insertData.pId = data.pId;
        insertData.account = session.account.account;
        insertData.treePath = data.treePath;
        insertData.name = data.name;
        insertData.order = parseInt(data.order);
        insertData.observer = data.observer;
        insertData.note = data.note;
        insertData.createUser = session.user._id;
        insertData.createTime = utils.getCurrentDate();
        insertData.lastUpdater = session.user._id;
        insertData.lastTime = utils.getCurrentDate();
        mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).insert(insertData,function(err) {
            if (!err) {
                result.success = true;
                result.dept = insertData;
                callback(result);
            } else {
                logger.app.error('db addDept error:' + err.stack);
                result.message = "addDept error";
                callback(result)
            }
        });
    },
    updateDept : function (data,session,callback){
        var result = {success: false};
        var query = {"account":session.account.account,"_id":data._id};
        var updateData = {};
        updateData.name = data.name;
        updateData.order = parseInt(data.order);
        updateData.observer = data.observer;
        updateData.note = data.note;
        updateData.lastUpdater = session.user._id;
        updateData.lastTime = utils.getCurrentDate();
        var setData = {"$set":updateData};
        mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).update(query,setData,{w:1},function(err) {
            if (!err) {
                //返回修改后的结果
                mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).findOne(query,function(err,deptDoc){
                    result.success = true;
                    result.dept = deptDoc;
                    callback(result);
                });

            } else {
                logger.app.error('db updateDept error:' + err.stack);
                result.message = "updateDept error";
                callback(result)
            }
        });
    },
    delDept : function (data,session,callback){
        var result = {success: false};
        var query = {"_id":data.deptId};
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({"deptId":data.deptId}).count(function(err,count){
            if(!err){
                if(count > 0){
                    result.message = "请先移除部门下所有座席";
                    callback(result)
                }else{
                    mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).remove(query,function(err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error('db delDept error:' + err.stack);
                            result.message = "delDept error";
                            callback(result)
                        }
                    });
                }
            }else{
                logger.app.error('db delDept error:' + err.stack);
                result.message = "delDept error";
                callback(result)
            }

        });

    },
    moveDept : function (data,session,callback){
        var result = {success: false};
        var bulkWrite =[];
        for (var i=0,l=data.length; i<l; i++) {
            var query = { updateOne : {
                "filter": { "_id" : data[i]._id },
                "update": { $set : {"pId":data[i].pId, "treePath":data[i].treePath,"lastUpdater" : session.user._id,"lastTime": utils.getCurrentDate()} }
            }}
            bulkWrite.push(query)
        }
        mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).bulkWrite(bulkWrite,function(err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error('db moveDept error:' + err.stack);
                result.message = "moveDept error";
                callback(result)
            }
        });
    },
    initDept : function (data,callback){
        var account = data.account;
        var result = {success: false};
        if (account == "all") {
            //先查出不需要初始化的账号
            mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).distinct("account",{"pId":""},function (err,ids){
                if(!err){
                    mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT).find({"_id":{$nin:ids}},{fields:{_id:1}}).toArray(function(err, docs) {
                        if(!err){
                            var accounts = docs || [];
                            if(accounts.length>0){
                                var bulkWrite =[];
                                for(var i=0; i<accounts.length; i++){
                                    var qid=uuid.generateUuid();
                                    var insertData = {};
                                    insertData._id = qid;
                                    insertData.pId = ""
                                    insertData.account = accounts[i]._id;
                                    insertData.treePath = qid+"/";
                                    insertData.name = "全公司";
                                    insertData.order = 999;
                                    insertData.observer = [];
                                    insertData.note = "默认生成";
                                    insertData.createUser = "";
                                    insertData.createTime = utils.getCurrentDate();
                                    insertData.lastUpdater = "";
                                    insertData.lastTime = utils.getCurrentDate();
                                    var query = { insertOne : insertData};
                                    bulkWrite.push(query)
                                }

                                mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).bulkWrite(bulkWrite,function(err) {
                                    if (!err) {
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error('db initDept error:' + err.stack);
                                        callback(result)
                                    }
                                });
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        }else{
                            logger.app.error('db initDept error:' + err.stack);
                            result.message = "initDept error";
                            callback(result)
                        }
                    })
                }else{
                    logger.app.error('db distinct department error:' + err.stack);
                    callback(result)
                }
            });
        }else if(account){
            var qid=uuid.generateUuid();
            var query = {"account":account,"name":"全公司","pId":""};
            var updateData = {};
            updateData._id = qid;
            updateData.pId = ""
            updateData.account = account;
            updateData.treePath = qid+"/";
            updateData.name = "全公司";
            updateData.order = 999;
            updateData.observer = [];
            updateData.note = "默认生成";
            updateData.createUser = "";
            updateData.createTime = utils.getCurrentDate();
            updateData.lastUpdater = "";
            updateData.lastTime = utils.getCurrentDate();
            mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).update(query,{$set:updateData},{upsert:true},function(err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error('db initDept error:' + err.stack);
                    result.message = "initDept error";
                    callback(result)
                }
            });
        }else{
            result.message = "帐号或用户Id输入有误!";
            callback(result);
        }
    }

};
module.exports = deptHandler;