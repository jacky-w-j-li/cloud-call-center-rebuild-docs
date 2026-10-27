var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var http = require('appHttp');
var config = require('appConfig').conf;
var syncAcs = require(__baseDir + "/dishui/app/batch/SyncAcsHandler");
var thenjs =require("thenjs");

var custTaskHandler = {
    getTaskDic:function(session,callback){
        var query = {
            account: session.user.account
        };
        mongo.db().collection(fields.DB_CUSTOMER_TASK).find(query,{sort:{createTime:-1}}).toArray(function(err, docs){
            if (!err) {
                callback(null, docs || []);
            } else {
                callback(err);
            }
        });
    },
    //管理员-查询未关闭的任务
    queryDialTaskList:function(data,session,callback){
        var result = {success: false};
        var page = data.page||1;
        delete data['page'];
        page = page || 1;
        var limit = data.limit || 10;
        delete data['limit'];
        var skip = (page - 1) * limit;
        var condition = data;
        condition.status = "dealing";

        utils.removeEmptyProperty(condition);
        if(!condition.account){
            condition.account = session.user.account;
        }
        //增加数据权限
        if(session.user.type == "admin" || session.user.scope.custTask == 'all'){

        }else{
            utils.setUserLevelCondition(condition,'createUser','custTask',session);
        }

        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).find(condition, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).count(condition, function (err, count) {
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
    },
    //管理员-查询已关闭的任务
    queryCloseDialTaskList:function(data,session,callback){
        var result = {success: false};
        var page = data.page ||1;
        delete data['page'];
        var limit = data.limit||10;
        delete data['limit'];
        var skip = (page - 1) * limit;
        var condition = data;
        utils.removeEmptyProperty(condition);
        if(!condition.account){
            condition.account = session.user.account;
        }
        if(!condition.status){
            condition.status = "close";
        }
        //增加数据权限
        if(session.user.type == "admin" || session.user.scope.custTask == 'all'){

        }else{
            utils.setUserLevelCondition(condition,'createUser','custTask',session);
        }

        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).find(condition, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs||{};
                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).count(condition, function (err, count) {
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
    },
    //管理员-已拨号码
    queryDialedNumberTaskList: function(data,session,callback){
        var query =  {};
        var result = {success: false};
        if(data.phone){
            query.phone = new RegExp(data.phone);
        }
        if(data.dialTag){
            query.dialTag = data.dialTag;
        }
        if(data.custStatus){
            if(data.custStatus == 1){
                query.custStatus = {"$ne" : null};
            }else if(data.custStatus ==2){
                query.custStatus = null;
            }
        }

        if(data.ownercom){
            query.ownercom = data.ownercom;
        }
        if(data.ownerdep){
            query.ownerdep = data.ownerdep;
        }

        if(data.owner){
            query.owner = data.owner;
        }

            //增加数据权限
        if(session.user.type == "admin" || session.user.scope.custTask == 'all'){
            if(query.owner || query.ownercom || query.ownerdep){
                utils.setUserLevelCondition(query, 'owner', 'custTask', session);
            }else{
                utils.setUserLevelCondition(query, 'owner', 'custTask', session,false,"custTask");
            }
        }else {
            utils.setUserLevelCondition(query, 'owner', 'custTask', session);
        }
        if(data.taskName){
            var taskQuery = {account:session.user.account,total:{"$gt":0}};
            taskQuery.taskName = new RegExp(data.taskName);
            //如果有任务名称先从任务表查
            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).find(taskQuery).toArray(function (err, tasks) {
                if(!err){
                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).count(taskQuery,function (err, count) {
                        if(count > 0){
                            var taskIds =  [];
                            for(var i=0;i<tasks.length;i++){
                                taskIds.push(tasks[i]._id);
                            }
                            query.taskId = {"$in":taskIds};
                            query.owner = {"$ne":"NA"};
                            var sort = {lastTime: -1};
                            var limit =  data.limit || 10;
                            delete data['limit'];
                            var page =  data.page || 1;
                            delete data['page'];
                            var skip = (page - 1) * limit;
                            mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).count(query, function (err, count) {
                                if (!err) {
                                    result.count = count;
                                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).find(query, {
                                        sort: sort,
                                        limit: limit,
                                        skip: skip
                                    }).toArray(function (err, docs) {
                                        if (!err) {
                                            result.list = docs||{};
                                            var callIds = [];
                                            //查出有当前座席有哪些任务,筛选出样板号码对应的任务
                                            for(var h =0;h<result.list.length;h++){
                                                var callIdL = result.list[h].callId||[];
                                                if(callIdL!=""){
                                                    for(var y =0;y<callIdL.length;y++){
                                                        callIds.push(callIdL[y]);
                                                    }
                                                }

                                            }
                                            var queryTaskList ={account:session.user.account,total:{"$gt":0},_id:{$in:taskIds}};
                                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).find(queryTaskList).toArray(function (err, taskList) {
                                                if(!err){
                                                    for(var i=0; i<result.list.length;i++){
                                                        var rr = result.list[i];
                                                        for(var j=0; j<tasks.length;j++){
                                                            if(rr.taskId == tasks[j]._id){
                                                                rr.taskName = tasks[j].taskName;
                                                                rr.taskStatus = tasks[j].status;
                                                                rr.createTime = tasks[j].createTime;
                                                                rr.createUser = tasks[j].createUser;
                                                                rr.source = tasks[j].source;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).find({_id:{$in:callIds}}).toArray(function(err,docs){
                                                        if(!err){
                                                            for(var i=0;i<result.list.length;i++){
                                                                var rr = result.list[i];
                                                                for(var j=0;j<docs.length;j++){
                                                                    var callIdL =rr.callId||[];
                                                                    if(callIdL!=""){
                                                                        var callId = callIdL[callIdL.length-1];
                                                                        if(callId == docs[j]._id){
                                                                            rr.shortTime = docs[j].OFFERING_TIME;
                                                                            rr.timeLen = docs[j].CALL_TIME_LENGTH;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                            result.success = true;
                                                            callback(result);
                                                        }
                                                    })
                                                }
                                            });

                                        } else {
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.error('queryDialedNumberTaskList error:' + err.stack);
                                    result.message = 'queryDialedNumberTaskList error!' + err.message;
                                    callback(result);
                                }
                            });
                        }else{
                            result.list = [];
                            result.count = 0;
                            result.success = true;
                            callback(result);
                        }
                    })
                }else{
                    logger.app.error('queryDialedNumberTaskList error:' + err.stack);
                    result.message = 'queryDialedNumberTaskList error!' + err.message;
                    callback(result);
                }

            });
        }else{
            var sort = {lastTime: -1};
            var limit =  data.limit || 10;
            delete data['limit'];
            var page =  data.page || 1;
            delete data['page'];
            var skip = (page - 1) * limit;
            mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).count(query, function (err, count) {
                if (!err) {
                    result.count = count;
                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).find(query, {
                        sort: sort,
                        limit: limit,
                        skip: skip
                    }).toArray(function (err, docs) {
                        if (!err) {
                            result.list = docs||{};
                            var ids = [];
                            var callIds = [];
                            //查出有当前座席有哪些任务,筛选出样板号码对应的任务
                            for(var h =0;h<result.list.length;h++){
                                ids.push(result.list[h].taskId);
                                var callIdL = result.list[h].callId||[];
                                if(callIdL!=""){
                                    for(var y =0;y<callIdL.length;y++){
                                        callIds.push(callIdL[y]);
                                    }
                                }

                            }
                            var queryTaskList ={account:session.user.account,total:{"$gt":0},_id:{$in:ids}};
                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).find(queryTaskList).toArray(function (err, taskList) {
                                if(!err){
                                    for(var i=0; i<result.list.length;i++){
                                        var rr = result.list[i];
                                        for(var j=0; j<taskList.length;j++){
                                            if(rr.taskId == taskList[j]._id){
                                                rr.taskName = taskList[j].taskName;
                                                rr.taskStatus = taskList[j].status;
                                                rr.createTime = taskList[j].createTime;
                                                rr.createUser = taskList[j].createUser;
                                                rr.source = taskList[j].source;
                                                break;
                                            }
                                        }
                                    }
                                    mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).find({_id:{$in:callIds}}).toArray(function(err,docs){
                                        if(!err){
                                            for(var i=0;i<result.list.length;i++){
                                                var rr = result.list[i];
                                                for(var j=0;j<docs.length;j++){
                                                    var callIdL =rr.callId||[];
                                                    if(callIdL!=""){
                                                        var callId = callIdL[callIdL.length-1];
                                                        if(callId == docs[j]._id){
                                                            rr.shortTime = docs[j].OFFERING_TIME;
                                                            rr.timeLen = docs[j].CALL_TIME_LENGTH;
                                                        }
                                                    }
                                                }
                                            }
                                            result.success = true;
                                            callback(result);
                                        }
                                    })
                                }
                            });
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else {
                    logger.app.error('queryDialedNumberTaskList error:' + err.stack);
                    result.message = 'queryDialedNumberTaskList error!' + err.message;
                    callback(result);
                }
            });
        }
    },
    //管理员-根据任务和号码查找到通话记录
    queryCallSheet : function(data,session,callback) {
        var result = {success: false};
        var query = {"phone.tel":data.phone};
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query).toArray(function (err, docs) {
            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                if(!err){
                    result.success = true;
                    result.count = count;
                    if(count == 0){
                        result.isNewCustomer = true;

                    }else if(count == 1){
                        result.isNewCustomer = false;
                        result.customer = docs[0]||{};
                    }else{
                        result.list = docs||[];
                    }
                    //查找通话记录ID
                    var querySample ={"phone":data.phone};
                    querySample.taskId = data._id;
                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).findOne(querySample,function (err,docs){
                        if(!err){
                            //根据id查出通话记录
                            if(docs.owner){
                                result.owner = docs.owner;
                            }
                            if(docs.taskId){
                                var taskId = docs.taskId;
                                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne({_id:taskId},function(err,doc){
                                    if(!err){
                                        result.taskName= doc.taskName;
                                        result.createUser = doc.createUser;
                                        result.taskStatus = doc.status;
                                        result.phone = data.phone;
                                        result.memo = doc.memo;
                                        result.source = doc.source;
                                        result.taskId = doc._id;
                                    }else{
                                        logger.app.error('queryCallSheet error:' + err.stack);
                                        result.message = 'queryCallSheet error !';
                                        callback(result);
                                    }
                                });
                            }
                            if(docs && docs.callId){
                                var queryCallSheet = {"_id":docs.callId[docs.callId.length-1]}
                                mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).findOne(queryCallSheet,function (err,callSheet){
                                    if(!err){
                                        result.sample = docs;
                                        result.callSheet = callSheet;
                                        callback(result);
                                    }else{
                                        logger.app.error('queryCallSheet error:' + err.stack);
                                        result.message = 'queryCallSheet error !';
                                    }
                                });
                            }else{
                                logger.app.error('queryCallSheet error:' + err.stack);
                                result.message = 'queryCallSheet error !';
                                callback(result);
                            }
                        }else{
                            logger.app.error('queryCallSheet error:' + err.stack);
                            result.message = 'queryCallSheet error !';
                            callback(result);
                        }
                    });
                }else{
                    logger.app.error('queryCallSheet error:' + err.stack);
                    result.message = 'queryCallSheet error !';
                    callback(result) ;
                }
            });
        });

    },
    //添加外呼任务
    saveDialTask:function(data, session, callback){
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.getCurrentDate();
        //data.lastTime=utils.getCurrentDate();
        data.account = session.user.account;
        data.createUser = session.user._id;
        data.total = 0;
        data.assigned = data.agents.length||0;
        data.status = "dealing";
        data.lastTime = utils.getCurrentDate();
        var dailyTask = data.dailyTask||[];
        delete data['dailyTask'];
        var query = {account:data.account,taskName:data.taskName};
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne(query,function(err,onetask){
            if(!err && !onetask){
                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).insert(data,function(err){
                    if(!err){
                        var addData = {
                            account:data.account,
                            taskId:data._id,
                            agents:data.agents,
                            dailyTask:dailyTask
                        };
                        custTaskHandler._addDialTaskAgent(addData,session,function(res){
                            if(res.success){
                                result.success=true;
                                callback(result);
                            }else{
                                logger.app.error("saveDialTask _addDialTaskAgent failed!");
                                result.message = res.message || "saveDialTask failed!";
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err.stack);
                        result.message = 'saveDialTask insert to db error!';
                        callback(result);
                    }
                });
            }else{
                //logger.app.error(err?err.stack:"");
                result.message = '任务名称已存在，请重新输入';
                callback(result);
            }
        });
    },
    _addDialTaskAgent:function(data,session,callback){
        var result = {success: false};
        var agents = data.agents;
        var dailyTask = data.dailyTask;
        var index = 0;
        var insertHandler = function(){
            if(index == agents.length){
                result.success = true;
                callback(result);
                return;
            }else{
                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).count({_id:data.taskId+"_"+agents[index]},function(err,count){
                    if(!err){
                        if(count==1){
                            var setData = {
                                $set:{status:"normal",lastUpdateTime:utils.getCurrentDate(),lastUpdater:session.user._id},
                            };
                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).update({_id:data.taskId+"_"+agents[index]},setData,function(err){
                                if(!err){
                                    index++;
                                    insertHandler();
                                }else{
                                    result.message="_addDialTaskAgent update to db failed!"+err.stack;
                                    callback(result);
                                    return;
                                }
                            });
                        }else{
                            var info = {
                                _id: data.taskId+"_"+agents[index],
                                account:data.account,
                                taskId:data.taskId,
                                creator:session.user._id,
                                agent:agents[index],
                                dailyTask:dailyTask[index],
                                createTime:utils.getCurrentDate(),
                                status:"normal"
                            };
                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).insert(info,function(err){
                                if(!err){
                                    index++;
                                    insertHandler();
                                }else{
                                    result.message="_addDialTaskAgent insert to db failed!"+err.stack;
                                    callback(result);
                                    return;
                                }
                            });
                        }
                    }
                });
                }
        };
        insertHandler();
    },
    //关闭任务
    closeDialTask:function(data,session,callback){
        var result = {success:false};
        var taskId = data.taskId;
        var setData = {
            $set:{status:"close",lastUpdateTime:utils.getCurrentDate(),lastUpdater:session.user._id},
        };
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).update({_id:taskId},setData,function(err){
            if(!err){
                result.success = true;
                callback(result);
            }else{
                result.message = '任务关闭失败';
                callback(result);
            }
        });
    },

    queryDialTaskById:function(data,session,callback){
        var result = {success: false};
        var query = {_id:data};
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne(query, function (err, task) {
            if(!err){
                if(task){
                    result.success = true;
                    result.data = task;
                    var agents = task.agents;
                    var taskId = task._id;
                    var ids = [];
                    for(var i = 0;i<agents.length;i++) {
                        var uId = taskId + "_" + agents[i];
                        ids.push(uId);
                    }
                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).find({_id:{$in:ids}}).toArray(function(err,docs){
                        if(!err){
                            var calledStat = 0;
                            var linkedStat = 0;
                            for(var j =0;j<docs.length;j++){
                                if(docs[j].called){
                                    calledStat += docs[j].called;
                                }
                                if(docs[j].linked){
                                    linkedStat += docs[j].linked;
                                }
                            }
                            result.calledStat = calledStat;
                            result.linkedStat = linkedStat;
                            callback(result);
                        }else{
                            logger.app.error('queryDialTaskById failed!');
                            result.message = '404 task not found!';
                            callback(result);
                        }
                    });
                }else{
                    logger.app.error('queryDialTaskById failed!');
                    result.message = '404 task not found!';
                    callback(result);
                }
            } else {
                logger.app.error('db queryDialTaskById error:' + err.stack);
                result.message = '数据库查询异常';
                callback(result);
            }
        });
    },
    //导出录音
    exportDialSound: function(data, session, callback){
    var result = { success: false};
    var taskId = data.taskId;
    var sort = {OFFERING_TIME: -1};
        mongo.db(session).collection(session.account.account+fields.DB_CUSTOMER_SAMPLE).find({taskId:taskId}).toArray(function(err, docs){
            if(err){
               logger.app.error(err);
                callback(result);
                return;
            }
            var ids=[];
            for(var i=0;i<docs.length;i++){
                var doc = docs[i];
                if(doc.callId){
                    var callIdS = doc.callId || [];
                    for(var j = 0;j<callIdS.length;j++){
                        ids.push(callIdS[j]);
                    }
                }
            }
            var data=null;
            if(ids.length>0){
                data={_id:{$in:ids}};
            }else{
                data={_id:"NA"};
            }
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(data, {sort:sort}).toArray(function (err, docs) {
                if (!err) {
                    var len=docs.length;
                    if(len == 0){
                        result.message = "404";
                        callback(result);
                        return;
                    }
                    var last=len%1000;
                    var total=last==0?len/1000:len/1000+1;
//                      console.log("len==="+len+",total==="+total+",last==="+last);
                    for (var i = 0; i < total; i++) {
                        var start=i*1000;
                        var end=start+1000;
                        if(i==total-1 && last>0){
                            end=start+last;
                        }
                        var docSs = docs.slice(start,end);
                        var records = {};
                        var count = 0;
                        for(var i=0 ; i<docSs.length ; i++){
                            if(docSs[i].STATUS == 'dealing' || docSs[i].STATUS == 'voicemail'){
                                var pbx = docSs[i].PBX.replace(/\./g,"-");
                                if(records[pbx]){
                                    records[pbx].push(docSs[i].RECORD_FILE_NAME);
                                    count++;
                                }else{
                                    records[pbx] = [];
                                    records[pbx].push(docSs[i].RECORD_FILE_NAME);
                                    count++;
                                }
                            }
                        }
                        if(count == 0){
                            result.message = "404";
                            callback(result);
                            return;
                        }
                        var doc = {
                            _id: utils.UUID.generateUuid(),
                            records: records,
                            account: session.user.account,
                            status: 'ready',
                            createTime: utils.getCurrentDate(),
                            downloadUrlList: {},
                            recordsCount: count
                        }
                        mongo.db().collection('app_call_sheet_batch_download_task').insert(doc, function(err){
                            if(err){
                                logger.app.error(err);
                                callback(result);
                                return;
                            }
                        });
                    }
                    result.success = true;
                    callback(result);
                }else{
                    logger.app.error(err);
                    callback(result);
                    return;
                }
            });
        });

    },
    removeDialTaskAgent:function(data,session,callback){
        var result = {success: false};
        var taskId=data.taskId;
        var agentId= data.agentId;
        thenjs(function(cont) {
            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).findOne({_id: taskId + "_" + agentId}, cont);
        }).then(function(cont,doc){
            if(doc){
                if(doc.called){
                    var setData = {
                        $set:{status:"remove",lastUpdateTime:utils.getCurrentDate(),lastUpdater:session.user._id},
                    };
                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).update({_id:taskId+"_"+agentId},setData,function(err){
                      cont(err,doc);
                    })
                }else{
                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).remove({_id:taskId+"_"+agentId},function(err){
                        cont(err,doc);
                    })
                }
            }
        }).then(function(cont,doc){
            var setParam = {
                $set:{owner:"NA"}
            };
            mongo.db(session).collection(session.account.account+fields.DB_CUSTOMER_SAMPLE).update({taskId:taskId,owner:agentId,dialTag:"NA"},setParam,function(err){
                cont(err,doc);
            })
        }).then(function(cont,doc){
            var param={
                $pull:{agents:agentId},
                $set:{lastTime:utils.getCurrentDate(),lastUpdater:session.user._id}
            };
                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).update({_id:taskId},param,function(err){
                    result.success = true;
                    callback(result);
                })
        }).fail(function(cont,err){
            logger.app.error('db removeTaskAgent error:' + err.stack);
            result.message = '移除座席失败';
            callback(result);
        })
    },
    //增加参与座席
    saveAgentsAssign:function(data, session, callback) {
        var result = {success: false};
        var id = data._id;
        var addAgents = data.agents || [];
        var addDailyTask = [];
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne({_id:id}, function (err, task) {
            if(!err){
                if(task){
                    var account =task.account;
                    var dailyTaskAllAgent = task.dailyTaskAllAgent;
                    for(var i=0;i<addAgents.length;i++){
                        addDailyTask.push(dailyTaskAllAgent);
                    }
                    var setData={
                        $pushAll:{agents:addAgents},
                        $set:{lastTime:utils.getCurrentDate(),lastUpdater:session.user._id}
                    };
                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).update({_id:id},setData,function(err){
                        if(!err){
                            var addData = {
                                account:account,
                                taskId:id,
                                agents:addAgents,
                                dailyTask:addDailyTask
                            };
                            custTaskHandler._addDialTaskAgent(addData,session,function(res){
                                if(res.success){
                                    result.success=true;
                                    callback(result);
                                }else{
                                    logger.app.error("saveAgentsAssign _addDialTaskAgent failed!");
                                    result.message = res.message || "saveAgentsAssign failed!";
                                    callback(result);
                                }
                            });
                        }else{
                            logger.app.error(err.stack);
                            result.message = 'saveAgentsAssign error!';
                            callback(result);
                        }
                    });
                }
                else{
                    logger.app.error('saveAgentsAssign failed!');
                    result.message = '404 task not found!';
                    callback(result);
                }
            } else {
                logger.app.error('db saveAgentsAssign error:' + err.stack);
                result.message = '数据库查询异常';
                callback(result);
            }
        });
    },
    //展示日均任务信息
    showDailyTask:function(data,session,callback){
        var result = {success:false};
        var taskId = data.taskId;
        var agents = data.agents.split(",")||[];
        var idS = [];
        for(var i=0;i<agents.length;i++) {
            var agent = agents[i];
            var id = taskId + "_" + agent;
            idS.push(id);
        }
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne({_id:taskId},function(err,doc){
            if(!err){
                result.effective = doc.effective;
                result.dailyTaskAllAgent = doc.dailyTaskAllAgent;
                result.unit = doc.unit;
                result.memo = doc.memo;
                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).find({_id:{"$in":idS}}).toArray(function (err, docs) {
                    if(!err){
                        result.list = docs||[];
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error('showDailyTask error:' + err.stack);
                        callback(result);
                    }
                });
            }else{
                logger.app.error('showDailyTask error:' + err.stack);
                callback(result);
            }
        });


    },
    //修改日均任务
    saveDailyTask:function(data,session,callback){
        var result = {success:false};
        var owners=data.owners;
        var taskId=data.taskId;
        var effective = data.effective;
        var dailyTaskAllAgent = data.dailyTaskAllAgent;
        var memo = data.memo;
        var unit = data.unit;
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne({_id:taskId},function(err,doc){
           if(!err){
               var setData = {
                   $set:{effective:effective,dailyTaskAllAgent:dailyTaskAllAgent,unit:unit,memo:memo,lastUpdateTime:utils.getCurrentDate(),lastUpdater:session.user._id}
               };
               mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).update({_id:taskId},setData,function(err){
                   if(!err) {
                       var query={taskId:taskId};
                       query.owner={$in:['',null]};
                       mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).find(query, {sort:{createTime:-1}}).toArray(function (err, docs) {
                           if (!err) {
                               result.success = true;
                               for(var i=0;i<owners.length;i++){
                                   var count=owners[i].count;//座席分配的客户数量
                                   var owner= owners[i].owner;//座席id
                                   var setData={
                                       $set: {dailyTask:count,lastUpdateTime:utils.getCurrentDate(),lastUpdater:session.user._id}
                                   };
                                   mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).update({_id:taskId+"_"+owner},setData,function(err){
                                       if(err){
                                           logger.app.error('saveDailyTask error:' + err.stack);
                                       }
                                   });
                               }
                               callback(result);
                           }else{
                               logger.app.error(err);
                               result.message = "数据库异常，分配失败";
                               callback(result);
                           }
                       });
                   }else{
                       logger.app.error('saveDailyTask error:' + err.stack);
                   }
               })
           }
        });
    },
    //分配客户给座席
    saveCustAssign:function(data,session,callback){
        var result = {success:false};
        var total=data.total;
        var owners=data.owners;
        var taskId=data.taskId;
        var status=data.status;
        var query={taskId:taskId};
        query.owner={$in:['',null]};
        var timeStamp=utils.DateTime.getCurrentTimestamp();
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort:{createTime:-1}}).toArray(function (err, docs) {
            if (!err) {
                if (total == docs.length){
                    var ids=[];//分配给座席的客户id
                    var skip=0;
                    var oldOwnerNum={};
                    for(var i=0;i<owners.length;i++){
                        var count=owners[i].count;//座席分配的客户数量
                        var owner= owners[i].owner;//座席id

                        for (var j = skip; j < skip+count; j++) {
                            var doc = docs[j];
                            ids.push(doc._id);
//                            console.dir(doc);
                            if(!oldOwnerNum[doc.owner]){
                                oldOwnerNum[doc.owner]={num:1,custIds:[doc._id]};
                            }else{
                                oldOwnerNum[doc.owner].num++;
                                oldOwnerNum[doc.owner].custIds.push(doc._id);
                            }
                        }
                        var q1={"_id":{"$in":ids}};
                        //var d1={owner:owner,assigned:true};
                        var d1={owner:owner};
                        custTaskHandler.updateOwner(q1,d1,session,count,timeStamp,taskId,status);
                        ids=[];
                        skip+=count;
                    }
                    result.success=true;
                }else{
                    logger.app.error('task saveCustAssign data is change');
                    result.code = '1001';
                }
                callback(result);
            }else{
                logger.app.error(err);
                result.message = "数据库异常，分配失败";
                callback(result);
            }
        });
    },
    //更新客户所属人
    updateOwner:function(query,data,session,count,timeStamp,taskId,status){
        var time=utils.getCurrentDate();
        var uid=session.user._id;
        data.lastUpdateTime=time;
        data.lastUpdater=uid;
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,{$set:data},{multi: true},function(err){
            if(err){
                logger.app.error('task updateOwner error:' + err.stack);
            }else{
                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query).toArray(function(err,custs) {
                    if (err) {
                        logger.app.error('task updateOwner error:' + err.stack);
                    } else {
                        //更新座席分配数量
                        //统计分配的各客户状态数量
                        var statusCount={total:count};
                        for(var i in status){
                            statusCount[i]=0;
                            for(var j=0;j<custs.length;j++){
                                var obj = custs[j];
                                if(obj.status == i){
                                    statusCount[i]++;
                                }
                            }
                        }
                        var setUserData={
                            $inc:statusCount,
                            $set: {lastUpdateTime:time,lastUpdater:session.user._id}
                        };
                        mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).update({ _id:taskId+"_"+data.owner},setUserData,function(err) {
                            if (err) {
                                logger.app.error('task update agent total error:' + err.stack);
                            }
                        });
                    }
                });
                //更新任务已分配数量
                var setTaskData = {
                    $inc:{assigned:count},
                    $set:{lastTime:time,lastUpdater:session.user._id}
                };
                mongo.db().collection(fields.DB_CUSTOMER_TASK).update({_id:taskId},setTaskData, function (err) {
                    if(err){
                        logger.app.error('task update assigned error:' + err.stack);
                    }
                });
                //客户分配提醒
                var params={
                    user:data.owner,
                    type:fields.CUSTOMER_NOTIFY_ASSIGN,
                    data:{
                        assignNum:count
                    }
                };
                syncAcs.messageNotify(params,session,function(){});
            }
        });
    },
    //查询导入客户批次详情
    queryImportDetail:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        utils.removeEmptyProperty(data);
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).count(data,function(err,count){
            if(!err){
                mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(data,{sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err, batches) {
                    if(!err){
                        result.success = true;
                        result.list = batches;
                        result.count = count;
                        callback(result);
                    }else{
                        logger.app.error('db queryImportDetail error:' + err.stack);
                        callback({success: false, list: [], count: 0});
                    }
                });
            }else{
                logger.app.error('db queryImportDetail error:' + err.stack);
                callback({success: false, list: [], count: 0});
            }
        });
    },
    //查询未拨号码
    queryNADataDetail:function(data,session,callback){
        var result = {success: false};
        var taskId = data.taskId;
        mongo.db(session).collection(session.user.account + fields.DB_CUSTOMER_SAMPLE).count({taskId:taskId,dialStatus:"NA"},function(err,count){
            if(!err){
                mongo.db(session).collection(session.user.account + fields.DB_CUSTOMER_SAMPLE).find({taskId:taskId,dialStatus:"NA"}).toArray(function(err,docs){
                    if(!err){
                        result.success = true;
                        result.list = docs;
                        result.count = count;
                        callback(result);
                    }else{
                        logger.app.error('db queryNADataDetail error:' + err.stack);
                        callback({success: false, list: [], count: 0});
                    }
                });
            }
        });
    },
    //查询重复客户数据详情
    queryDuplicateDataDetail:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        utils.removeEmptyProperty(data);
        mongo.db().collection(fields.DB_CUSTOMER_SAMPLE_REPEAT).count(data,function(err,count){
            if(!err){
                mongo.db().collection(fields.DB_CUSTOMER_SAMPLE_REPEAT).find(data,{sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err, datas) {
                    if(!err){
                        result.success = true;
                        result.list = datas;
                        result.count = count;
                        callback(result);
                    }else{
                        logger.app.error('db queryDuplicateDataDetail error:' + err.stack);
                        callback({success: false, list: [], count: 0});
                    }
                });
            }else{
                logger.app.error('db queryDuplicateDataDetail error:' + err.stack);
                callback({success: false, list: [], count: 0});
            }
        });
    },
    //查询归档任务是否已经创建
    archiveTask:function(data,session,callback){
        var result = {success:false};
        var taskId = data.taskId;
        var account = session.user.account;
        mongo.db().collection("app_customer_archive_task").count({account:account,taskId:taskId,status:"wait"},function(err,count){
            if(!err){
                result.success = true;
                result.count = count;
                callback(result);
            }else{
                logger.app.error('archiveTask error:' + err);
                result.message = 'archiveTask error!';
                callback(result);
            }
        });
    },
    //归档任务
    archiveCustomer: function(data,session,callback){
    var result = {success:false};
    var time=utils.getCurrentDate();
    var uid=session.user._id;
    var account=session.user.account;
    var taskId = data.taskId;
        mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).count({taskId:taskId},function (err, count) {
            if (!err) {

                if(count>10000){

                    var url = config.ccServiceUrl+'?Action=archiveCustomer&Method=customer&taskId='+taskId+'&account='+account+"&uid="+session.user._id;
                    url=encodeURI(url);
                    http.sendGet(url,function(err,res){
                        if(!err && res){
                            try{
                                //console.dir(res);
                                var res = JSON.parse(res);
                                if(res.Succeed){
                                    result.success = true;
                                    callback(result);
                                }else{
                                    callback(result);
                                }
                            }catch (e) {
                                logger.request.error(e);
                                callback(e);
                            }
                        }else{
                            var error = err || new Error('request archiveCustomer error!');
                            logger.request.error(error);
                            callback(error);
                        }
                    });
                }else{
                    var q0={taskId:taskId};
                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).find(q0,{sort:{createTime:-1}}).toArray(function (err, customerList) {
                        if(!err){
                            customerList=customerList||[];
                                var len=customerList.length;
                                var total=Math.ceil(len/1000);
                                var last=len%1000;
                                var bakIdx=0;
                                //console.info("total=="+total+",last===="+last);
                                var backup=function(){
                                    if(bakIdx<total){
                                        var start=bakIdx*1000;
                                        var end=start+1000;
                                        if(bakIdx==total-1 && last>0){
                                            end = start+last;
                                        }
                                        var subList=[];
                                        for (var i = start; i < end; i++) {
                                            subList.push(customerList[i]);
                                        }
                                        //console.dir(subList)
                                        mongo.db().collection(fields.DB_CUSTOMER_SAMPLE_ARCHIVE).insert(subList,function(err){
                                            if(!err){
                                                bakIdx++;
                                                backup();
                                            }else{
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        });
                                    }else{
                                        console.info("backup end");
                                        var setUserData={
                                            $set: {lastUpdateTime:time,lastUpdater:uid,status:"archive"}
                                        };
                                        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).update({_id:taskId},setUserData,function(err) {
                                            if (!err) {
                                                mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).remove(q0, function(err){
                                                    if(err){
                                                        logger.app.error('archiveCustomer error:' + err);
                                                        result.message = 'archiveCustomer error!';
                                                        callback(result);
                                                    }
                                                });
                                            }else{
                                                logger.app.error('task archive error:' + err.stack);
                                            }
                                        });
                                    }
                                }
                                backup();
                                result.success = true;
                                callback(result);

                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }
            }else{
                logger.app.error('archiveCustomer error:' + err);
                result.message = 'archiveCustomer error!';
                callback(result);
            }
        });
    },
    _addTaskAgent:function(data,session,callback){
        var result = {success: false};
        var agents = data.agents;
        var index = 0;
        var insertHandler = function(){
            if(index == agents.length){
                result.success = true;
                callback(result);
                return;
            }else{
                var info = {
                    _id: data.taskId+"_"+agents[index],
                    account:data.account,
                    taskId:data.taskId,
                    creator:session.user._id,
                    agent:agents[index],
                    createTime:utils.getCurrentDate()
                };
                mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).insert(info,function(err){
                    if(!err){
                        index++;
                        insertHandler();
                    }else{
                        result.message="_addTaskAgent insert to db failed!";
                        callback(result);
                        return;
                    }
                });
            }
        };
        insertHandler();
    },

    statUserData:function(data,session,callback){
        var result = {success: false};
        var taskId=data.taskId;
        mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).find({taskId:taskId}).toArray(function(err,docs){
           if(!err){
               result.data = docs;
               result.success = true;
               callback(result);
           } else{
               logger.app.error('db statUserData error:' + err.stack);
               result.message = '数据库查询异常';
               callback(result);
           }
        });
    },
    removeTaskAgent:function(data,session,callback){
        var result = {success: false};
        var taskId=data.taskId;
        var agentId= data.agentId;
        mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).findOne({_id:taskId+"_"+agentId},function(err,user){
            if(!err){
                var total=user.total || 0;//获取座席分配的客户数量
                mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).remove({_id:taskId+"_"+agentId},function(err){
                    if(!err){
                        var query={
                            owner:agentId,
                            taskId:taskId
                        };
                        var setData = {
                            $set:{owner:"",lastUpdateTime:utils.getCurrentDate(),lastUpdater:session.user._id},
                            $unset:{taskCalled:1}
                        };
                        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,setData,{multi: true},function (err) {
                            if(!err){
                                var param={
                                    $pull:{agents:agentId},
                                    $inc:{assigned:-total},
                                    $set:{lastTime:utils.getCurrentDate(),lastUpdater:session.user._id}
                                };
                                mongo.db().collection(fields.DB_CUSTOMER_TASK).update({_id:taskId},param,function(err){
                                    if(!err){
                                        result.success = true;
                                        callback(result);
                                    }else{
                                        logger.app.error('db removeTaskAgent error:' + err.stack);
                                        result.message = '移除座席失败';
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error('db removeTaskAgent error:' + err.stack);
                                result.message = '移除座席失败';
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error('db removeTaskAgent error:' + err.stack);
                        result.message = '移除座席失败';
                        callback(result);
                    }
                });
            }else{
                logger.app.error('db removeTaskAgent error:' + err.stack);
                result.message = '移除座席失败';
                callback(result);
            }
        });
    },
    //为座席减少未拨打客户
    reduceCustForAgent:function(data,session,callback){
        var result = {success: false};
        var taskId=data.taskId;
        var agentId= data.agentId;
        var reduceNum = data.reduceNum || 0;
        var noCall = data.noCall;
        var status = data.status;

        var query={taskId:taskId,owner:agentId};
        query.taskCalled={$exists:false};
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort:{createTime:-1}}).toArray(function (err, docs) {
            if (!err) {
                if (noCall == docs.length) {
                    var ids = [];
                    var statusCount={total:-reduceNum};//客户状态数量统计,用于更新座席分配数量和客户状态数量
                    for(var j in status){
                        statusCount[j] = 0;
                        for (var i = 0; i < reduceNum; i++) {
                            var obj = docs[i];
                            ids.push(obj._id);
                            if(obj.status == j){
                                statusCount[j]--;
                            }
                        }
                    }
                    var setData = {
                        owner:"",
                        lastUpdater:session.user._id,
                        lastUpdateTime:utils.getCurrentDate()
                    };
                    //释放客户
                    mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update({_id: {$in: ids}}, {$set: setData}, {multi: true}, function (err) {
                        if(!err){
                            var setData2={
                                $set:{lastUpdater:session.user._id,lastUpdateTime:utils.getCurrentDate()},
                                $inc:statusCount
                            };
                            mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).update({_id:taskId+"_"+agentId},setData2,function(err){
                                if(!err){
                                    var param={
                                        $set:{lastUpdater:session.user._id, lastTime:utils.getCurrentDate()},
                                        $inc:{assigned:-reduceNum}
                                    };
                                    mongo.db().collection(fields.DB_CUSTOMER_TASK).update({_id:taskId},param,function(err){
                                        if(!err){
                                            result.success = true;
                                            callback(result);
                                        }else{
                                            logger.app.error('db reduceCustForAgent error:' + err.stack);
                                            result.message = "数据库异常，调整数量失败";
                                            callback(result);
                                        }
                                    });
                                }else{
                                    logger.app.error('db reduceCustForAgent error:' + err.stack);
                                    result.message = "数据库异常，调整数量失败";
                                    callback(result);
                                }
                            });
                        }else{
                            logger.app.error('db reduceCustForAgent error:' + err.stack);
                            result.message = "数据库异常，调整数量失败";
                            callback(result);
                        }
                    });
                }else {
                    logger.app.error('task reduceCustForAgent data is change');
                    result.code = '1001';
                }
                callback(result);
            } else {
                logger.app.error(err);
                result.message = "数据库异常，调整数量失败";
                callback(result);
            }
        });
    },
    //导入明细菜单
    _setQueryCondition:function(query,session){
        utils.removeEmptyProperty(query);
        query.type='customerTask';
        if(!query.accountId){
            query.accountId=session.user.account;
        }
        utils.setDateCondition(query);
    },
    getTaskImportBatch:function(data,session,callback) {
        var result = {success: false};
        var query = data.query;
        var option = data.option;
        var sort = {createTime: -1};
        custTaskHandler._setQueryCondition(query, session);
        utils.setUserLevelCondition(query, 'creator','custTask', session);

        var limit = option.pageSize || 10;
        var page = option.index || 1;
        var skip = (page - 1) * limit;

        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(query, {
            sort: sort,
            limit: limit,
            skip: skip
        }).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error('getTaskImportBatch error:' + err.stack);
                result.message = 'getTaskImportBatch error!' + err.message;
                callback(result);
            }
        });
    },

    //座席-查询我参与的任务
    //wyktest
    queryAgentTaskList : function(data,session,callback) {
        var query ={agents:{$in:[data.agentId]},"status" : "dealing"};
        var result = {success: false};
        if(data.taskName){
            var regStr=utils.escapeRegex(data.taskName);
            query.taskName = new RegExp(regStr);
        }
        var sort = {lastTime: -1};
        var limit =  data.limit;
        var page =  data.page;
        var skip = (page - 1) * limit;

        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).find(query, {
            sort: sort,
            limit: limit,
            skip: skip
        }).toArray(function (err, docs) {
            if (!err) {
                result.list = docs || [];
                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        if(docs.length >0){
                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).find({"agent":session.user._id}).toArray(function (err,taskUser){
                                if(!err){
                                    for(var i=0; i<result.list.length;i++){
                                        for(var j=0; j<taskUser.length;j++){
                                            if(result.list[i]._id == taskUser[j].taskId){
                                                result.list[i].dailyTask = taskUser[j].dailyTask;
                                                break;
                                            }
                                        }
                                    }
                                    result.success = true;
                                    callback(result);
                                }else{
                                    logger.app.error('queryAgentTaskList error:' + err.stack);
                                    callback(result);
                                }

                            });
                        }else{
                            result.success = true;
                            callback(result);
                        }
                    } else {
                        logger.app.error('queryAgentTaskList error:' + err.stack);
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error('queryAgentTaskList error:' + err.stack);
                result.message = 'queryAgentTaskList error!' + err.message;
                callback(result);
            }
        });
    },
    //座席-任务详情
    queryTaskDetail : function(data,session,callback) {
        var result = {success: false};
        //根据ID查询任务
        var query = {"_id" :data};
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne(query, function (err, doc) {
            if(!err){
                if(doc){
                    result.task = doc;
                    //先判断有没有查到未结束或未拨号码
                    var queryUncalledNumber = {"owner":session.user._id,"taskId":data,"dialTag":"NA"};
                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).findOne(queryUncalledNumber,function (err,custSample){
                        if(custSample){
                            result.success = true;
                            result.sample = custSample;
                            callback(result) ;
                        }else{
                            //座席任务统计
                            statQuery = {};
                            statQuery.taskId = data;
                            statQuery.agent = session.user._id;
                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).findOne(statQuery, function (taskUserErr, statDoc) {
                                if(!err){
                                    if(statDoc){
                                        result.taskUser = statDoc;
                                        if(result.taskUser && !result.taskUser.called) result.taskUser.called = 0;
                                        //每日明细和总量查询
                                        var dailyQuery = {};
                                        dailyQuery.date = utils.DateTime.getFormatDateStr(new Date());
                                        dailyQuery.taskId = data;
                                        dailyQuery.agent = session.user._id;
                                        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).findOne(dailyQuery, function (dialTaskUserErr, dailyDoc) {
                                            if(!err){
                                                if(dailyDoc){
                                                    result.success = true;
                                                    result.taskUserDaily = dailyDoc;
                                                    callback(result);
                                                }else{
                                                    result.success = true;
                                                    result.taskUserDaily = new Object();
                                                    result.taskUserDaily.called = 0;
                                                    callback(result);
                                                }
                                            }else{
                                                logger.app.error('queryTaskDetail error:' + dialTaskUserErr.stack);
                                                result.message = 'queryTaskDetail error !';
                                                callback(result) ;
                                            }
                                        });
                                    }else{
                                        result.message = '未找到任务统计记录!';
                                        callback(result)
                                    }
                                }else{
                                    logger.app.error('queryTaskDetail error:' + taskUserErrstack);
                                    result.message = 'queryTaskDetail error !';
                                    callback(result) ;
                                }
                            });
                        }
                    });
                }else{
                    result.message = '未找到任务!';
                    callback(result)
                }
            }else{
                logger.app.error('queryTaskDetail error:' + err.stack);
                result.message = 'queryTaskDetail error !';
                callback(result) ;
            }
        });
    },
    //座席-已拨号码详情
    queryCalledDetail : function(data,session,callback) {
        var result = {success: false};
        var query = {"phone.tel":data.phone};
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,function (err,doc){
            if(!err){
                result.success = true;
                if(doc){
                    result.isNewCustomer = false;
                    result.customer = doc;
                }else{
                    result.isNewCustomer = true;
                }
                callback(result);
            }else{
                logger.app.error('queryCustByPhone error:' + err.stack);
                result.message = 'queryCustByPhone error !';
                callback(result) ;
            }
        });
    },
    //座席-根据任务号码查找客户
    queryCustByPhone : function(data,session,callback) {
        var result = {success: false};
        var query = {"phone.tel":data.phone};

        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query).toArray(function (err, docs) {

            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                if(!err){
                    result.success = true;
                    result.count = count;
                    if(count == 0){
                        result.isNewCustomer = true;

                    }else if(count == 1){
                        result.isNewCustomer = false;
                        result.customer = docs[0];
                    }else{
                        result.list = docs;
                    }
                    if(data.custId != ""){
                        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({"_id":data.custId},function (err,doc){
                            if(!err){
                                if(doc){
                                    result.success = true;
                                    result.count = 1;
                                    result.isNewCustomer = false;
                                    result.customer = doc;
                                    callback(result);
                                }else{
                                    result.success = true;
                                    callback(result);
                                }
                            }else{
                                logger.app.error('queryCustByPhone error:' + err.stack);
                                result.message = 'queryCustByPhone error !';
                                callback(result);
                            }

                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                }else{
                    logger.app.error('queryCustByPhone error:' + err.stack);
                    result.message = 'queryCustByPhone error !';
                    callback(result) ;
                }
            });
        });
    },
    //座席-根据任务和号码查找到通话记录
    queryCallSheetByCustSample : function(data,session,callback) {
        var result = {success: false};
        var query = {"phone.tel":data.phone};
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query).toArray(function (err, docs) {

            mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                if(!err){
                    result.count = count;
                    if(count == 0){
                        result.isNewCustomer = true;

                    }else if(count == 1){
                        result.isNewCustomer = false;
                        result.customer = docs[0]||[];
                    }else{
                        result.isNewCustomer = false;
                        result.list = docs||[];
                    }
                    //查找通话记录ID
                    var querySample ={"phone":data.phone};
                    querySample.taskId = data._id;
                    querySample.owner = data.owner;
                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).findOne(querySample,function (err,custSample){
                            result.sample = custSample || [];

                            if(!err){
                                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne({_id:data._id},function(err,doc){
                                    if(!err){
                                        result.taskName= doc.taskName;
                                        result.createUser = doc.createUser;
                                        result.taskStatus = doc.status;
                                        result.createTime = doc.createTime;
                                        result.phone = data.phone;
                                        result.memo = doc.memo;
                                        result.source = doc.source;
                                        result.taskId = doc._id;
                                        //根据id查出通话记录
                                        if(custSample && custSample.callId){
                                            queryCallSheet = {"_id":custSample.callId[custSample.callId.length-1]}
                                            mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).findOne(queryCallSheet,function (err,callSheet){
                                                result.callSheet = callSheet;
                                                if(!err){
                                                    if(result.sample.custId){
                                                        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({"_id":result.sample.custId},function (err,doc){
                                                            if(!err){
                                                                if(doc){
                                                                    result.success = true;
                                                                    result.count = 1;
                                                                    result.isNewCustomer = false;
                                                                    result.customer = doc;
                                                                    callback(result);
                                                                }else{
                                                                    result.success = true;
                                                                    callback(result);
                                                                }
                                                            }else{
                                                                logger.app.error('queryCallSheetByCustSample error:' + err.stack);
                                                                result.message = 'queryCallSheetByCustSample error !';
                                                                callback(result);
                                                            }

                                                        });
                                                    }else{
                                                        result.success = true;
                                                        callback(result);
                                                    }
                                                }else{
                                                    logger.app.error('queryCallSheetByCustSample error:' + err.stack);
                                                    result.message = 'queryCallSheetByCustSample error !';
                                                    callback(result);
                                                }
                                            });
                                        }else{
                                            if(result.sample.custId){
                                                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({"_id":result.sample.custId},function (err,doc){
                                                    if(!err){
                                                        if(doc){
                                                            result.success = true;
                                                            result.count = 1;
                                                            result.isNewCustomer = false;
                                                            result.customer = doc;
                                                            callback(result);
                                                        }else{
                                                            result.success = true;
                                                            callback(result);
                                                        }
                                                    }else{
                                                        logger.app.error('queryCallSheetByCustSample error:' + err.stack);
                                                        result.message = 'queryCallSheetByCustSample error !';
                                                        callback(result);
                                                    }

                                                });
                                            }else{
                                                result.success = true;
                                                callback(result);
                                            }
                                        }
                                    }else{
                                        logger.app.error('queryCallSheet error:' + err.stack);
                                        result.message = 'queryCallSheet error !';
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error('queryCallSheetByCustSample error:' + err.stack);
                                result.message = 'queryCallSheetByCustSample error !';
                                callback(result);
                            }
                    });
                }else{
                    logger.app.error('queryCustByPhone error:' + err.stack);
                    result.message = 'queryCustByPhone error !';
                    callback(result) ;
                }
            });
        });
    },
    //座席-已拨号码查询
    queryAgentCalledTaskList : function(data,session,callback) {
        var query =  {"owner":data.owner};
        var result = {success: false};
        if(data.phone){
            query.phone = new RegExp(data.phone);
        }
        if(data.dialStatus){
            query.dialStatus = data.dialStatus;
        }
        if(data.custStatus){
            if(data.custStatus == 1){
                query.custStatus = {"$ne" : null};
            }else if(data.custStatus ==2){
                query.custStatus = null;
            }
        }
        var sort = {createTime: 1};
        var limit =  data.limit;
        var page =  data.page;
        var skip = (page - 1) * limit;

        if(data.taskName){
            var queryTask ={agents:{$in:[session.user._id]}};
            var regStr=utils.escapeRegex(data.taskName);saveTaskId;
            data.taskName = new RegExp(regStr);
            queryTask.taskName = data.taskName;
            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).find(queryTask, {
                sort: sort,
                limit: limit,
                skip: skip
            }).toArray(function (err, docs) {
               if(!err){
                   result.list = docs;
                   if(docs.length > 0){
                       var taskIds = [];
                       for(var i=0;i<docs.length;i++){
                           taskIds[i] = docs[i]._id;
                       }
                       query.taskId = {$in:taskIds};
                       custTaskHandler._queryAgentCalledList(session,data,query,callback);

                   }else{
                       result.success = true;
                       callback(result);
                   }
               }else{
                   result.message = 'queryAgentCalledTaskList error!' + err.message;
                   callback(result);
               }
            });

        }else{
            custTaskHandler._queryAgentCalledList(session,data,query,callback);
        }
    },
    _queryAgentCalledList : function (session,data,query,callback){
        var result = {success: false};
        var sort = {createTime: 1};
        var limit =  data.limit;
        var page =  data.page;
        var skip = (page - 1) * limit;
        mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).find(query, {
            sort: sort,
            limit: limit,
            skip: skip
        }).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        //查出有当前座席有哪些任务,筛选出样板号码对应的任务
                        var queryTaskList ={agents:{$in:[session.user._id]}};
                        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).find(queryTaskList).toArray(function (err, taskList) {

                            for(var i=0; i<result.list.length;i++){
                                for(var j=0; j<taskList.length;j++){
                                    if(result.list[i].taskId == taskList[j]._id){
                                        result.list[i].taskName = taskList[j].taskName;
                                        result.list[i].taskStatus = taskList[j].status;
                                        result.list[i].createTime = taskList[j].createTime;
                                        result.list[i].createUser = taskList[j].createUser;
                                        result.list[i].source = taskList[j].source;
                                        break;
                                    }
                                }
                            }
                            result.success = true;
                            callback(result);
                        });

                    } else {
                        logger.app.error(err);
                        result.message = 'queryAlreadyNumber error!' + err.message;
                        callback(result);
                    }
                });
            } else {
                logger.app.error('queryAlreadyNumber error:' + err.stack);
                result.message = 'queryAlreadyNumber error!' + err.message;
                callback(result);
            }
        });
    },
    //座席-获得自动呼叫的号码
    queryAutoCallPhone : function(data,session,callback) {
        var result = {success:false};
        //查出任务信息
        var query = {"_id" :data.taskId};
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne(query, function (err, doc) {
            if(!err){
                if(doc){
                    result.task = doc;
                    //任务已关闭
                    if(doc && doc.status !="dealing"){
                        result.message = '当前任务已关闭!';
                        callback(result) ;
                    }else{
                        var url = config.ccServiceUrl+'?Action=updateCustSample&Method=updateCustSample'
                            +'&account='+session.account.account+'&ownerId='+session.user._id
                            +'&taskId='+data.taskId;
                        url=encodeURI(url);
                        http.sendGet(url,function(err,res){
                            if(!err && res){
                                try{
                                    var res = JSON.parse(res);
                                    if(res.Succeed){
                                        result.sample = res.sample;
                                        result.success = true;
                                        result.isNewFlag = res.isNewFlag;
                                        result.notFindNumber = false;
                                        callback(result);
                                    }else{
                                        result.success = true;
                                        result.isNewFlag = res.isNewFlag;
                                        result.notFindNumber = true;
                                        callback(result);
                                    }
                                }catch (e) {
                                    logger.request.error(e);
                                    result.message = 'queryAutoCallPhone error!';
                                    callback(result);
                                }
                            }else{
                                logger.request.error(err);
                                result.message = 'queryAutoCallPhone error!' + err.message;
                                callback(result);
                            }
                        });
                    }
                }else{
                    result.message = '获取任务信息失败';
                    callback(result);
                }
            }else{
                result.message = '获取任务信息失败';
                callback(result);
            }
        });
    },
    //座席-电话转换为用户信息
    convertDataByPhone : function(data,session,callback) {
        var result = {success: false};
        var query = {};
        query._id =data.cid;
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(query,function (err,doc) {
            if(!err){
                result.success = true;
                result.customer = doc;
                callback(result);
            }else{
                logger.app.error('convertDataByPhone error:' + err.stack);
                result.message = 'convertDataByPhone error !';
                callback(result) ;
            }
        });
    },
    updateSampleAndDailyDialInfo : function (data,session,callback){
        var result = {success: false};
        //占线号码放回样本表
        if(data.dialTag =="outOfService"){
            var query = {"_id":data.sampleId};
            var setData = {
                $set:{owner:"NA",lastTime:utils.getCurrentDateTime()}
            };
            mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).update(query,setData,function(err){
                if(!err){
                    result.success = true;
                    callback(result);
                }else{
                    logger.request.error(err);
                    result.message = 'updateSampleAndDailyDialInfo outOfService error!';
                    callback(result);
                }
            });
        }else{
            //更新dailTag到样本表
            var query = {"_id":data.sampleId};
            var setData = {
                $set:{dialTag:data.dialTag}
            };
            mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).update(query,setData,function(err){
                if(!err){

                    if(data.unit == 2){
                        //查询sample表查处通话id
                        mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).findOne(query,function(err,sample){
                            if(!err){
                                if(sample){
                                    //查询通话记录表
                                    if(!sample.callId || sample.callId.length == 0){ //没有通话记录
                                        result.success = true;
                                        callback(result);
                                    }else{
                                        var queryCallSheet = {"_id":sample.callId[sample.callId.length-1]}
                                        mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).findOne(queryCallSheet,function (err,callSheet){
                                            if(!err){
                                                if(callSheet){
                                                    //座席任务统计表
                                                    var effective = callSheet.CALL_TIME_LENGTH;
                                                    var dailyTaskAgent = 0;
                                                    if(effective < 30) {
                                                        effective = 0;
                                                        dailyTaskAgent = 0;
                                                    }else{
                                                        effective = callSheet.CALL_TIME_LENGTH;
                                                        dailyTaskAgent = Math.round(callSheet.CALL_TIME_LENGTH/60);
                                                    }

                                                    var statQuery ={taskId:data.taskId,agent:session.user._id};
                                                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).findOne(statQuery,function (statErr,doc) {
                                                        if(!statErr){
                                                            if(doc){
                                                                var statUpdateData = {$inc:{"called":1,"linked":1,effective:effective,dailyTaskAgent:dailyTaskAgent}};
                                                                if(data.dialTag == "dealing"){
                                                                    statUpdateData = {$inc:{"called":1,"linked":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                }else if(data.dialTag == "emptyNumber"){
                                                                    statUpdateData = {$inc:{"called":1,"emptyNumber":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                }else if(data.dialTag == "noAnswer"){
                                                                    statUpdateData = {$inc:{"called":1,"noAnswer":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                }else if(data.dialTag == "outOfService"){
                                                                    statUpdateData = {$inc:{"called":1,"outOfService":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                }else if(data.dialTag == "stop"){
                                                                    statUpdateData = {$inc:{"called":1,"stop":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                }else if(data.dialTag == "other"){
                                                                    statUpdateData = {$inc:{"called":1,"other":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                }else if(data.dialTag == "nobody"){
                                                                    statUpdateData = {$inc:{"called":1,"nobody":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                }
                                                                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).update(statQuery,statUpdateData,function(err){
                                                                    if(!err){
                                                                        var dailQuery = {};
                                                                        dailQuery.date = utils.DateTime.getFormatDateStr(new Date());
                                                                        dailQuery.taskId = data.taskId;
                                                                        dailQuery.agent = session.user._id;
                                                                        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).findOne(dailQuery,function (err,taskUserDaily){
                                                                            if(!err){
                                                                                if(taskUserDaily){
                                                                                    var dailUpdateData = {$inc:{"called":1,"linked":1,effective:effective,dailyTaskAgent:dailyTaskAgent}};
                                                                                    if(data.dialTag == "dealing"){
                                                                                        dailUpdateData = {$inc:{"called":1,"linked":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                                    }else if(data.dialTag == "emptyNumber"){
                                                                                        dailUpdateData = {$inc:{"called":1,"emptyNumber":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                                    }else if(data.dialTag == "noAnswer"){
                                                                                        dailUpdateData = {$inc:{"called":1,"noAnswer":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                                    }else if(data.dialTag == "outOfService"){
                                                                                        dailUpdateData = {$inc:{"called":1,"outOfService":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                                    }else if(data.dialTag == "stop"){
                                                                                        dailUpdateData = {$inc:{"called":1,"stop":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                                    }else if(data.dialTag == "other"){
                                                                                        dailUpdateData = {$inc:{"called":1,"other":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                                    }else if(data.dialTag == "nobody"){
                                                                                        dailUpdateData = {$inc:{"called":1,"nobody":1,effective:effective,dailyTaskAgent:dailyTaskAgent}}
                                                                                    }
                                                                                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).update(dailQuery,dailUpdateData,function (err){
                                                                                        if(!err){
                                                                                            var queryUpdateSample = {"_id":data.sampleId};
                                                                                            mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).update(queryUpdateSample,{$inc:{ffective:effective,dailyTaskAgent:dailyTaskAgent}},function(err){
                                                                                                if(!err){
                                                                                                    result.success = true;
                                                                                                    callback(result);
                                                                                                }else{
                                                                                                    result.message = 'updateSampleAndDailyDialInfo error!';
                                                                                                    callback(result);
                                                                                                }
                                                                                            })

                                                                                        }else{
                                                                                            logger.request.error(err);
                                                                                            result.message = 'updateSampleAndDailyDialInfo error!';
                                                                                            callback(result);
                                                                                        }
                                                                                    });
                                                                                }else{
                                                                                    //新增座席每日任务统计表记录
                                                                                    var dailInsertData = {};
                                                                                    dailInsertData.account = session.account.account;
                                                                                    dailInsertData.taskId = data.taskId;
                                                                                    dailInsertData.agent = session.user._id;
                                                                                    dailInsertData.createTime = utils.getCurrentDate();
                                                                                    if(data.dialTag == "dealing"){
                                                                                        dailInsertData.called = 1;
                                                                                        dailInsertData.linked = 1;
                                                                                        dailInsertData.effective = effective;
                                                                                        dailInsertData.dailyTaskAgent =dailyTaskAgent;
                                                                                    }else{
                                                                                        dailInsertData.called = 1;
                                                                                        dailInsertData[data.dialTag] = 1;
                                                                                        dailInsertData.effective = effective;
                                                                                        dailInsertData.dailyTaskAgent =dailyTaskAgent;
                                                                                    }
                                                                                    dailInsertData.date = utils.DateTime.getFormatDateStr(new Date());
                                                                                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).insert(dailInsertData,function (dailyErr,dailyData) {
                                                                                        if(!dailyErr){
                                                                                            result.success = true;
                                                                                            callback(result);
                                                                                        }else{
                                                                                            logger.request.error(dailyErr);
                                                                                            result.message = 'updateSampleAndDailyDialInfo error!';
                                                                                            callback(result);
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }else{
                                                                                logger.request.error(err);
                                                                                result.message = 'updateSampleAndDailyDialInfo error!';
                                                                                callback(result);
                                                                            }
                                                                        });
                                                                    }else{
                                                                        logger.request.error(err);
                                                                        result.message = 'updateSampleAndDailyDialInfo error!';
                                                                        callback(result);
                                                                    }
                                                                });
                                                            }else{
                                                                //已经被移除当前任务
                                                                result.message = '您已被移除当前任务!';
                                                                callback(result);
                                                            }
                                                        }else{
                                                            logger.request.error(err);
                                                            result.message = 'updateSampleAndDailyDialInfo error!';
                                                            callback(result);
                                                        }
                                                    });
                                                }else{
                                                    logger.app.error('未找到通话记录 error:' + err.stack);
                                                    result.message = '未找到通话记录 error !';
                                                    callback(result);
                                                }
                                            }else{
                                                logger.app.error('queryCallSheet error:' + err.stack);
                                                result.message = 'queryCallSheet error !';
                                                callback(result);
                                            }
                                        });
                                    }
                                }else{
                                    logger.app.error('query sample error:' + err.stack);
                                    result.message = 'query sample error !';
                                    callback(result);
                                }
                            }else{
                                logger.app.error('queryCallSheet error:' + err.stack);
                                result.message = 'queryCallSheet error !';
                                callback(result);
                            }
                        });
                    }else{
                        //座席任务统计表
                        var statQuery ={taskId:data.taskId,agent:session.user._id};
                        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).findOne(statQuery,function (statErr,doc) {
                            if(!statErr){
                                if(doc){
                                    var statUpdateData =  {$inc:{"called":1,"linked":1}}
                                    if(data.dialTag == "dealing"){
                                        statUpdateData = {$inc:{"called":1,"linked":1}}
                                    }else if(data.dialTag == "emptyNumber"){
                                        statUpdateData = {$inc:{"called":1,"emptyNumber":1}}
                                    }else if(data.dialTag == "noAnswer"){
                                        statUpdateData = {$inc:{"called":1,"noAnswer":1}}
                                    }else if(data.dialTag == "other"){
                                        statUpdateData = {$inc:{"called":1,"other":1}}
                                    }else if(data.dialTag == "nobody"){
                                        statUpdateData = {$inc:{"called":1,"nobody":1}}
                                    }else if(data.dialTag == "stop"){
                                        statUpdateData = {$inc:{"called":1,"stop":1}}
                                    }else if(data.dialTag == "outOfService"){
                                        statUpdateData = {$inc:{"called":1,"outOfService":1}}
                                    }
                                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).update(statQuery,statUpdateData,function(err){
                                        if(!err){
                                            var dailQuery = {};
                                            dailQuery.date = utils.DateTime.getFormatDateStr(new Date());
                                            dailQuery.taskId = data.taskId;
                                            dailQuery.agent = session.user._id;
                                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).findOne(dailQuery,function (err,doc){
                                                if(!err){
                                                    if(doc){
                                                        var dailUpdateData = {$inc:{"called":1}};
                                                        if(data.dialTag == "dealing"){
                                                            dailUpdateData = {$inc:{"called":1,"linked":1}}
                                                        }else if(data.dialTag == "emptyNumber"){
                                                            dailUpdateData = {$inc:{"called":1,"emptyNumber":1}}
                                                        }else if(data.dialTag == "noAnswer"){
                                                            dailUpdateData = {$inc:{"called":1,"noAnswer":1}}
                                                        }else if(data.dialTag == "other"){
                                                            dailUpdateData = {$inc:{"called":1,"other":1}}
                                                        }else if(data.dialTag == "nobody"){
                                                            dailUpdateData = {$inc:{"called":1,"nobody":1}}
                                                        }else if(data.dialTag == "stop"){
                                                            dailUpdateData = {$inc:{"called":1,"stop":1}}
                                                        }else if(data.dialTag == "outOfService"){
                                                            dailUpdateData = {$inc:{"called":1,"outOfService":1}}
                                                        }
                                                        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).update(dailQuery,dailUpdateData,function (err){
                                                            if(!err){
                                                                result.success = true;
                                                                callback(result);
                                                            }else{
                                                                logger.request.error(err);
                                                                result.message = 'updateSampleAndDailyDialInfo error!';
                                                                callback(result);
                                                            }
                                                        });
                                                    }else{
                                                        //新增座席每日任务统计表记录
                                                        var dailInsertData = {};
                                                        dailInsertData.account = session.account.account;
                                                        dailInsertData.taskId = data.taskId;
                                                        dailInsertData.agent = session.user._id;
                                                        dailInsertData.createTime = utils.getCurrentDate()
                                                        if(data.dialTag == "dealing"){
                                                            dailInsertData.called = 1;
                                                            dailInsertData.linked = 1;
                                                        }else{
                                                            dailInsertData.called = 1;
                                                            dailInsertData[data.dialTag] = 1;
                                                        }
                                                        dailInsertData.date = utils.DateTime.getFormatDateStr(new Date());
                                                        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).insert(dailInsertData,function (dailyErr) {
                                                            if(!dailyErr){
                                                                result.success = true;
                                                                callback(result);
                                                            }else{
                                                                logger.request.error(err);
                                                                result.message = 'updateSampleAndDailyDialInfo error!';
                                                                callback(result);
                                                            }
                                                        });
                                                    }
                                                }else{
                                                    logger.request.error(err);
                                                    result.message = 'updateSampleAndDailyDialInfo error!';
                                                    callback(result);
                                                }
                                            });
                                        }else{
                                            logger.request.error(err);
                                            result.message = 'updateSampleAndDailyDialInfo error!';
                                            callback(result);
                                        }
                                    });
                                }else{
                                    //坐席已被移除
                                    result.message = '您已被移除当前任务!';
                                    callback(result);
                                }
                            }else{
                                logger.request.error(err);
                                result.message = 'updateSampleAndDailyDialInfo error!';
                                callback(result);
                            }
                        });
                    }
                }else{
                    logger.app.error('updateSampleAndDailyDialInfo updateSamle error:' + err.stack);
                    result.message = 'updateSampleAndDailyDialInfo updateSamle error !';
                    callback(result) ;
                }
            });
        }

    } ,
    //保存用户成功后修改信息
    updateSampleAndDaily : function(data,session,callback){
        var result = {success: false};
        var query = {};
        query._id = data.sampleId;
        query.taskId = data.taskId;
        var setData = {
            $set:{custId:data.custId}
        };
        mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).findOne(query,function(err,doc){
            if(!err){
                if(doc){
                    mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).update(query,setData,function (err) {
                        if(!err){
                            var  dailyQuery = {};
                            dailyQuery.taskId = data.taskId;
                            dailyQuery.agent = session.user._id;
                            var dailySetData = {$inc:{"transfer":1}};

                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).update(dailyQuery,dailySetData,function (err) {
                                if(!err){
                                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).update(dailyQuery,dailySetData,function (err) {
                                        if(!err){
                                            result.success = true;
                                            callback(result) ;
                                        }else{
                                            logger.app.error('updateSampleAndDaily error:' + err.stack);
                                            result.message = 'updateSampleAndDaily error !';
                                            callback(result) ;
                                        }
                                    });
                                }else{
                                    logger.app.error('updateSampleAndDaily error:' + err.stack);
                                    result.message = 'updateSampleAndDaily error !';
                                    callback(result) ;
                                }
                            });

                        }else{
                            logger.app.error('updateSampleAndDaily error:' + err.stack);
                            result.message = 'updateSampleAndDaily error !';
                            callback(result) ;
                        }
                    });
                }else{
                    result.success = true;
                    callback(result) ;
                }
            }else{
                result.message = 'updateSampleAndDaily error !';
                callback(result);
            }
        });
    },
    //查询拨打统计记录
    currentPhoneErr : function(data,session,callback){
        var result = {success: false};
        var query = {"_id" :data.sampleId};
        var setData = {$set:{"dialTag":"err"}};
        mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_SAMPLE).update(query,setData,function (err) {
            if(!err){
                result.success = true;
                callback(result);
            }else{
                logger.app.error('currentPhoneErr error:' + err.stack);
                result.message = 'currentPhoneErr error !';
                callback(result) ;
            }
        });
    },
    //查询拨打统计记录
    queryDailyStats : function(data,session,callback){
        var result = {success: false};
        var query = {"_id" :data.taskId};
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne(query, function (err, doc) {
            if(!err){
                if(doc){
                    result.task = doc;
                    //座席任务统计
                    statQuery = {};
                    statQuery.taskId = data.taskId;
                    statQuery.agent = session.user._id;
                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).findOne(statQuery, function (taskUserErr, statDoc) {
                        if(!err){
                            if(statDoc){
                                result.taskUser = statDoc;
                                if(result.taskUser && !result.taskUser.called) {
                                    result.taskUser.called = 0;
                                    result.taskUser.dailyTaskAgent = 0;
                                }
                                //每日明细和总量查询
                                var dailyQuery = {};
                                dailyQuery.date = utils.DateTime.getFormatDateStr(new Date());
                                dailyQuery.taskId = data.taskId;
                                dailyQuery.agent = session.user._id;
                                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).findOne(dailyQuery, function (dialTaskUserErr, dailyDoc) {
                                    if(!err){
                                        if(dailyDoc){
                                            result.success = true;
                                            result.taskUserDaily = dailyDoc;
                                            callback(result) ;
                                        }else{
                                            result.success = true;
                                            result.taskUserDaily = new Object();
                                            result.taskUserDaily.called = 0;
                                            result.taskUserDaily.dailyTaskAgent = 0;
                                            callback(result) ;
                                        }
                                    }else{
                                        logger.app.error('queryTaskDetail error:' + dialTaskUserErr.stack);
                                        result.message = 'queryTaskDetail error !';
                                        callback(result) ;
                                    }
                                });
                            }else{
                                result.message = '未找到任务统计记录!';
                                callback(result)
                            }
                        }else{
                            logger.app.error('queryTaskDetail error:' + taskUserErrstack);
                            result.message = 'queryTaskDetail error !';
                            callback(result) ;
                        }
                    });

                }else{
                    result.message = '未找到任务信息!';
                    callback(result) ;
                }
            }else{
                logger.app.error('queryDailyStats error:' + dialTaskUserErr.stack);
                result.message = 'queryDailyStats error !';
                callback(result) ;
            }
        })
    },
    exportCustomerTask:function(data,session,callback){
        var query = data.Query;
        var method=data.Method;
        if(!query.account){
            query.account=session.user.account;
        }
        var result = {Succeed:false};
        var taskId = query.taskId;
        mongo.db(session).collection(session.account.account+fields.DB_CUSTOMER_SAMPLE).count({taskId:taskId,dialTag:"NA"},function(err,count){
            if(!err){
                if(count==0){
                    result.message = 404;
                    callback(result);
                    return;
                }else{
                    query.dialTag = "NA";
                    var queryJson=JSON.stringify(query);
                    queryJson=queryJson.replace(/&/gm, "amp;");
                    var url = config.ccServiceUrl+'?Action=export&Method='+method+'&Query=' + queryJson;

                    url=encodeURI(url);
                    http.sendGet(url,function(err,res){
                        if(!err && res){
                            try{
                                var res = JSON.parse(res);
                                if(res.Succeed){
                                    callback(res);
                                }else{
                                    callback(new Error('request service error!'));
                                }
                            }catch (e) {
                                logger.request.error(e);
                                callback(e);
                            }
                        }else{
                            var error = err || new Error('request service error!');
                            logger.request.error(error);
                            callback(error);
                        }
                    });
                }
            }
        });
    },
    _arryMerge: function (arry, account) {
        var newArray = [];
        var flag = false;
        for (var i = 0; i < arry.length; i++) {
            var obj = {};
            var keyStatus = arry[i].status;
            var findIndex = 0;
            //查询是否有userId数据
            for (var j = 0; j < newArray.length; j++) {
                if (arry[i].owner == newArray[j].user) {
                    flag = true;
                    findIndex = j;
                }
            }
            //如果查询到新数组中有用户id,只增加status字段
            if (flag) {
                newArray[findIndex][keyStatus] = arry[i].count;
            } else {
                obj.account = account;
                obj.user = arry[i].owner;
                obj[keyStatus] = arry[i].count;
                newArray.push(obj);
            }

            flag = false;
        }

        return newArray;
    }



};
module.exports = custTaskHandler;