var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var http = require('appHttp');
var config = require('appConfig').conf;
var syncAcs = require(__baseDir + "/dishui/app/batch/SyncAcsHandler");

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
    //增加参与座席
    saveAgentsAssign:function(data, session, callback) {
        var result = {success: false};
        var id = data._id;
        var addAgents = data.agents;
        mongo.db().collection(fields.DB_CUSTOMER_TASK).findOne({_id:id}, function (err, task) {
            if(!err){
                if(task){
                    var account =task.account;
                    var setData={
                        $pushAll:{agents:addAgents},
                        $set:{lastTime:utils.getCurrentDate(),lastUpdater:session.user._id}
                    };
                    mongo.db().collection(fields.DB_CUSTOMER_TASK).update({_id:id},setData,function(err){
                        if(!err){
                            var addData = {
                                account:account,
                                taskId:id,
                                agents:addAgents
                            };
                            custTaskHandler._addTaskAgent(addData,session,function(res){
                                if(res.success){
                                    result.success=true;
                                    callback(result);
                                }else{
                                    logger.app.error("saveCustAssign _addTaskAgent failed!");
                                    result.message = res.message || "saveCustAssign failed!";
                                    callback(result);
                                }
                            });
                        }else{
                            logger.app.error(err.stack);
                            result.message = 'saveCustAssign error!';
                            callback(result);
                        }
                    });
                }
                else{
                    logger.app.error('saveCustAssign failed!');
                    result.message = '404 task not found!';
                    callback(result);
                }
            } else {
                logger.app.error('db saveCustAssign error:' + err.stack);
                result.message = '数据库查询异常';
                callback(result);
            }
        });
    },
    //添加外呼任务
    saveCustTask:function(data, session, callback){
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.getCurrentDate();
        //data.lastTime=utils.getCurrentDate();
        data.account = session.user.account;
        data.createUser = session.user._id;
        data.total = 0;
        data.assigned = 0;
        data.status = "dealing";

        var query = {account:data.account,taskName:data.taskName};
        mongo.db().collection(fields.DB_CUSTOMER_TASK).findOne(query,function(err,onetask){
            if(!err && !onetask){
                mongo.db().collection(fields.DB_CUSTOMER_TASK).insert(data,function(err){
                    if(!err){
                        var addData = {
                            account:data.account,
                            taskId:data._id,
                            agents:data.agents
                        };
                        custTaskHandler._addTaskAgent(addData,session,function(res){
                            if(res.success){
                                result.success=true;
                                callback(result);
                            }else{
                                logger.app.error("saveCustTask _addTaskAgent failed!");
                                result.message = res.message || "saveCustTask failed!";
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err.stack);
                        result.message = 'saveCustTask insert to db error!';
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
    queryTaskList:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data;

        utils.removeEmptyProperty(condition);
        if(!condition.account){
            condition.account = session.user.account;
        }
        if (condition.taskName){
            condition.taskName = new RegExp(condition.taskName);
        }
        mongo.db().collection(fields.DB_CUSTOMER_TASK).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_CUSTOMER_TASK).count(condition, function (err, count) {
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
    queryTaskById:function(data,session,callback){
        var result = {success: false};
        var query = {_id:data};
        mongo.db().collection(fields.DB_CUSTOMER_TASK).findOne(query, function (err, task) {
            if(!err){
                if(task){
                    result.success = true;
                    result.data = task;
                    callback(result);
                }else{
                    logger.app.error('queryTaskById failed!');
                    result.message = '404 task not found!';
                    callback(result);
                }
            } else {
                logger.app.error('db queryTaskById error:' + err.stack);
                result.message = '数据库查询异常';
                callback(result);
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
                //var _ids=query._id.$in||[];
                //var id=utils.UUID.generateUuid();
                //var time=utils.getCurrentDate() ;
                //var uid=session.user._id;
                //var timeStamp=utils.DateTime.getCurrentTimestamp();
                //var set={
                //    _id:id,
                //    createTime:time,
                //    time:timeStamp,
                //    type:fields.custLog_assign,
                //    oldStatus:'',
                //    newStatus:fields.custLog_assign,
                //    operator:uid,
                //    owner:data.owner,
                //    num:count,
                //    custId:_ids
                //}
                //mongo.db(session).collection(session.user.account+fields.DB_CUSTOMER_OWNER_LOG).insert(set,function(err){
                //    if(err){
                //        logger.app.error('record customer updateOwner log error:' + err.stack);
                //    }
                //});
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
    //查询参与座席列表
    //getUserDialList:function(data,session,callback){
    //    var result = {success: false};
    //    var pageSize = data.limit;
    //    var page = data.page;
    //    pageSize = pageSize || 10;
    //    page = page || 1;
    //    var limit = pageSize;
    //    var skip = (page - 1) * pageSize;
    //    utils.removeEmptyProperty(data);
    //    var query={};
    //    if(!data.account){
    //        query.account=session.account.account;
    //    }
    //    if(data.displayName){
    //        query.displayName=new RegExp(data.displayName)
    //    }
    //    mongo.db("bill").collection(fields.DB_PLATFORM_USER).find(query).toArray(function(err,users){
    //        if(!err){
    //            var ids=[];
    //            for(var i=0;i<users.length;i++){
    //                ids.push(users[i]._id);
    //            }
    //            var query2={
    //                taskId:data.taskId,
    //                agent:{$in:ids}
    //            };
    //            mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).count(query2,function(err,count){
    //                if(!err){
    //                    result.count=count;
    //                    mongo.db().collection(fields.DB_CUSTOMER_TASK_USER).find(query2,{sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err,docs) {
    //                        if(!err){
    //                            for(var i=0;i<docs.length;i++){
    //                                for(var j=0;j<users.length;j++){
    //                                    if(users[j]._id == docs[i].agent){
    //                                        docs[i].displayName = users[j].displayName;
    //                                    }
    //                                }
    //                            }
    //                            result.success=true;
    //                            result.list=docs;
    //                            callback(result);
    //                        }else{
    //                            logger.app.error('db getUserDialList error:' + err.stack);
    //                            callback({success: false, list: [], count: 0});
    //                        }
    //                    });
    //                }else{
    //                    logger.app.error('db getUserDialList error:' + err.stack);
    //                    callback({success: false, list: [], count: 0});
    //                }
    //            });
    //        }else{
    //            logger.app.error('db getUserDialList error:' + err.stack);
    //            callback({success: false, list: [], count: 0});
    //        }
    //    });
    //
    //},
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
        utils.setUserLevelCondition(query, 'creator', session);

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
    }

};
module.exports = custTaskHandler;