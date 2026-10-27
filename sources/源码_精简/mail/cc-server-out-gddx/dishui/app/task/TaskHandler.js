var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var syncAcs = require(__baseDir + "/dishui/app/batch/SyncAcsHandler");

var handler = {
    /**
     * 新增业务
     * @param data
     * @param session
     * @param callback
     * 添加业务数据，并创建业务历史操作数据
     */
    addTask: function (data, session, callback) {
        var result = {success: false};
        if (!data._id) {
            data._id = utils.UUID.generateUuid();
        }
        var nowDate = new Date();
        var now = utils.DateTime.getCurrentDateTime();
        data.tags = data.tags || [];
        data.createUser = session.user._id;
        data.createTime = now;
        data.lastUpdateTime = now;
        data.lastUpdateUser = session.user._id;
        data.report_year = nowDate.getFullYear();
        data.report_month = nowDate.getMonth() + 1;
        data.report_day = nowDate.getDate();
        data.report_date = now.substring(0, 10);
        data.isComplete = false;
        mongo.db(session).collection(session.account.account + "_task").insert(data, {w: 1}, function (err, doc) {
            if (!err) {
                var history = {
                    task: data._id,
                    user: session.user._id,
                    time: utils.DateTime.getCurrentDateTime(),
                    type: "act",
                    action: "create"
                };
                impl.addTaskCommentsImpl(session, history, function (err) {
                    if (!err) {
                        delete history._id;
                        history.action = "assign";
                        history.assignUser = data.master;
                        impl.addTaskCommentsImpl(session, history, function (err) {
                            if (!err) {
                                result.success = true;
                                result.data = doc[0];
                                if(data.master!=data.createUser){
                                    var params={
                                        _id:data._id,
                                        user:data.master,
                                        type:fields.TASK_NOTIFY_CREATE
                                    }
                                    impl.queryNotifyCount(params,session,function(){});
                                }
                                callback(result);
                            } else {
                                callback(result);
                            }
                        });

                    } else {
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err);
                result.message = "insert data to db error !";
                callback(result);
            }
        });
    },
    /**
     * 查询业务
     * 1、客户代办业务
     * {customer:"",isComplete:false}
     * 2、客户的业务历史
     * {customer:""}
     * 3、我的代办业务
     * {queryType:incomplete}
     * 4、我分配的业务
     * {queryType:assign}
     * 5、我参与的业务
     * {queryType:follow}
     * 6、我的所有业务
     * {queryType:all}
     * 7、高级查询
     * {}
     *
     *
     * @param data
     * @param session
     * @param callback
     */
    query: function (data, session, callback) {
        var result = {success: false};
        var queryType = data.queryType || "default";
        var query = data.query;
        if (query) {
            var times = ['createTime', 'lastUpdateTime'];
            for (var i = 0; i < times.length; i++) {
                var time = times[i];
                var beginDay = query[time+'_begin_date'] || "";
                delete query[time+'_begin_date'];
                var beginTime = query[time+'_begin_time'] || "";
                delete query[time+'_begin_time'];
                var endDay = query[time+'_end_date'] || "";
                delete query[time+'_end_date'];
                var endTime = query[time+'_end_time'] || "";
                delete  query[time+'_end_time'];

                var begin = beginDay + " " + beginTime;
                var end = endDay + " " + endTime;
                if (begin != " ") {
                    query[time] = {
                        $gt: begin
                    }
                }
                if (end != " ") {
                    if (query[time]) {
                        query[time].$lt = end;
                    } else {
                        query[time] = {
                            $lt: end
                        }
                    }
                }
            }
        }

        var option = data.option;
        var condition = query || {};
        switch (queryType) {
            case "assignedToMe" :
                condition.master = session.user._id;
                impl.queryTaskImpl(session, condition, option, true, function (err, tasks) {
                    if (!err) {
                        result.success = true;
                        result.list = tasks.list;
                        result.count = tasks.count;
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
                break;
            case "createdByMe":
                condition.createUser = session.user._id;
                impl.queryTaskImpl(session, condition, option, true, function (err, tasks) {
                    if (!err) {
                        result.success = true;
                        result.list = tasks.list;
                        result.count = tasks.count;
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
                break;
            case "follow":
                break;
            case "all":
                impl.queryTaskImpl(session, condition, option, true, function (err, tasks) {
                    if (!err) {
                        result.success = true;
//                        result.data = tasks || [];
                        result.list = tasks.list;
                        result.count = tasks.count;
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
                break;
            case "default":
                condition = data;
                impl.queryTaskImpl(session, condition, option, false, function (err, tasks) {
                    if (!err) {
                        result.success = true;
                        result.data = tasks || [];
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
                break;
        }
    },
    /**
     * {_id:""}
     * @param data
     * @param session
     * @param callback
     */
    getTaskComments: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.account.account + "_comments").find(data, {sort: {sortTime: 1}}).toArray(function (err, comments) {
            if (!err) {
                result.success = true;
                result.data = comments || [];
                console.log(comments);
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });

    },
    /**
     * {_id:""}
     * @param data
     * @param session
     * @param callback
     */
    getTaskById: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.account.account + fields.DB_TASK).findOne(data, function (err, task) {
            if (!err) {
                result.success = true;
                result.data = task;
                if(task.createUser==session.user._id && task.isComplete && !task.isRead){
                    mongo.db(session).collection(session.account.account + fields.DB_TASK).update({_id:task._id},{$set:{isRead:true}},function(err){
                        if(err){
                            logger.app.error(err);
                        }else{
                            var params={
                                _id:data._id,
                                user:task.createUser,
                                type:fields.TASK_NOTIFY_COMPLETE
                            }
                            impl.queryNotifyCount(params,session,function(){});
                        }
                    });
                }
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    /**
     * 添加业务tag
     * {_id:xxx,tag:xxx}
     */
    addTaskTag: function (data, session, callback) {
        var result = {success: false};
        var update = {
            $push: {
                tags: data.tag
            },
            $set: {
                lastUpdateTime: utils.DateTime.getCurrentDateTime(),
                lastUpdateUser: session.user._id
            }
        };
        mongo.db(session).collection(session.account.account + fields.DB_TASK).update({_id: data._id}, update, function (err) {
            if (!err) {
                var history = {
                    task: data._id,
                    user: session.user._id,
                    time: utils.DateTime.getCurrentDateTime(),
                    type: "act",
                    action: "addTag",
                    tag: data.tag
                };
                impl.addTaskCommentsImpl(session, history, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    /**
     * 删除业务tag
     * {_id:xxx,tag:xxx}
     */
    deleteTaskTag: function (data, session, callback) {
        var result = {success: false};
        var update = {
            $pull: {
                tags: data.tag
            },
            $set: {
                lastUpdateTime: utils.DateTime.getCurrentDateTime(),
                lastUpdateUser: session.user._id
            }
        };
        mongo.db(session).collection(session.account.account + fields.DB_TASK).update({_id: data._id}, update, function (err) {
            if (!err) {
                var history = {
                    task: data._id,
                    user: session.user._id,
                    time: utils.DateTime.getCurrentDateTime(),
                    type: "act",
                    action: "deleteTag",
                    tag: data.tag
                };
                impl.addTaskCommentsImpl(session, history, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },

    /**
     * 完成任务
     * @param data
     * @param session
     * @param callback
     */
    doCompleteTask: function (data, session, callback) {
        var result = {success: false};
        var update = {
            $set: {
                isComplete: true,
                lastUpdateTime: utils.DateTime.getCurrentDateTime(),
                lastUpdateUser: session.user._id,
                isRead:false
            }
        };
        mongo.db(session).collection(session.account.account + fields.DB_TASK).update(data, update, {w: 1}, function (err) {
            if (!err) {
                var history = {
                    task: data._id,
                    user: session.user._id,
                    time: utils.DateTime.getCurrentDateTime(),
                    type: "act",
                    action: "complete"
                };
                impl.addTaskCommentsImpl(session, history, function (err) {
                    if (!err) {
                        mongo.db(session).collection(session.account.account + fields.DB_TASK).findOne(data, function (err, task) {
                            if (!err) {
                                result.success = true;
                                result.data = task;
                                var params={
                                    _id:data._id,
                                    user:task.createUser,
                                    type:fields.TASK_NOTIFY_COMPLETE
                                }
                                impl.queryNotifyCount(params,session,function(){});
                                var params2={
                                    _id:data._id,
                                    user:task.master,
                                    type:fields.TASK_NOTIFY_COMPLETE
                                }
                                impl.queryNotifyCount(params2,session,function(){});
                            } else {
                                logger.app.error("", err);
                            }
                            callback(result);
                        });
                    } else {
                        callback(result);
                    }
                })
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    /**
     * 取消完成任务
     * @param data
     * @param session
     * @param callback
     */
    cancelCompleteTask: function (data, session, callback) {
        var result = {success: false};
        var update = {
            $set: {
                isComplete: false,
                lastUpdateTime: utils.DateTime.getCurrentDateTime(),
                lastUpdateUser: session.user._id,
                isRead:false
            }
        };
        mongo.db(session).collection(session.account.account + fields.DB_TASK).update(data, update, {w: 1}, function (err) {
            if (!err) {
                var history = {
                    task: data._id,
                    user: session.user._id,
                    time: utils.DateTime.getCurrentDateTime(),
                    type: "act",
                    action: "cancelComplete"
                };
                impl.addTaskCommentsImpl(session, history, function (err) {
                    if (!err) {
                        mongo.db(session).collection(session.account.account + fields.DB_TASK).findOne(data, function (err, task) {
                            if (!err) {
                                result.success = true;
                                result.data = task;
                                if(!task.isComplete){

                                    var params={
                                        _id:task._id,
                                        user:task.master,
                                        type:fields.TASK_NOTIFY_CREATE
                                    }
                                    impl.queryNotifyCount(params,session,function(){});
                                    var params1={
                                        _id:task._id,
                                        user:task.createUser,
                                        type:fields.TASK_NOTIFY_CREATE
                                    }
                                    impl.queryNotifyCount(params1,session,function(){});
                                }
                            } else {
                                logger.app.error("", err);
                            }
                            callback(result);
                        });
                    } else {
                        callback(result);
                    }
                })
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    /**
     * 添加任务comments
     * @param data
     * @param session
     * @param callback
     */
    addComments: function (data, session, callback) {
        var result = {success: false};
        data.user = session.user._id;
        data.time = utils.DateTime.getCurrentDateTime();
        data.type = "comments";
        impl.addTaskCommentsImpl(session, data, function (err) {
            if (!err) {
                impl.updateTaskByIdImpl(session, data.task, function (err) {
                    if (!err) {
                        result.success = true;
                        result.data = data;
                    }
                    callback(result);
                });

            } else {
                callback(result);
            }
        })
    },
    /**
     * 分配任务给某个用户
     * @param data
     * @param session
     * @param callback
     */
    assignToUser: function (data, session, callback) {
        var result = {success: false};
        var taskId = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateUser = session.user._id;
        mongo.db(session).collection(session.account.account + fields.DB_TASK).findAndModify({_id: taskId},[], {$set: data}, {new: true}, function (err,doc) {
            if (!err) {
                var history = {
                    task: taskId,
                    user: session.user._id,
                    time: utils.DateTime.getCurrentDateTime(),
                    type: "act",
                    action: "assign",
                    assignUser: data.master
                };
                impl.addTaskCommentsImpl(session, history, function (err) {
                    if (!err) {
                        impl.getTaskByIdImpl(session, taskId, function (err, task) {
                            if (!err) {
                                result.success = true;
                                result.data = task;

                                if(doc.master!=session.user._id && !doc.isComplete){
                                    var params={
                                        _id:taskId,
                                        user:data.master,
                                        type:fields.TASK_NOTIFY_CREATE
                                    }
                                    impl.queryNotifyCount(params,session,function(){});
                                    var params2={
                                        _id:taskId,
                                        user:session.user._id,
                                        type:fields.TASK_NOTIFY_CREATE
                                    }
                                    impl.queryNotifyCount(params2,session,function(){});
                                }
                            }
                            callback(result);
                        });
                    } else {
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    getTagsDic: function (session, callback) {
        var account = session.user.account;
        mongo.db().collection(fields.DB_BUSINESS_TAG).findOne({account: account}, function (err, docs) {
            if (!err) {
                docs = docs || {};
                callback(null, docs.status || {});
            } else {
                callback({success: false});
            }
        });
    }

};

var impl = {
    updateTaskByIdImpl: function (session, id, callback) {
        var update = {
            $set: {
                lastUpdateTime: utils.DateTime.getCurrentDateTime(),
                lastUpdateUser: session.user._id
            }
        };
        mongo.db(session).collection(session.account.account + fields.DB_TASK).update({_id: id}, update, function (err) {
            if (!err) {
                callback(null);
            } else {
                logger.app.error("", err);
                callback(err);
            }
        });
    },
    getTaskByIdImpl: function (session, id, callback) {
        mongo.db(session).collection(session.account.account + fields.DB_TASK).findOne({_id: id}, function (err, task) {
            if (!err) {
                callback(null, task);
            } else {
                logger.app.error("", err);
                callback(err);
            }
        });
    },
    queryTaskImpl: function (session, condition, options, isCount, callback) {
        var queryOptions = {sort: {lastUpdateTime: -1}};
        if (options) {
            var page = options.index || 1;
            var pageSize = options.pageSize || 10;
            var limit = pageSize;
            var skip = (page - 1) * pageSize;
            queryOptions.limit = limit;
            queryOptions.skip = skip;
        }
        var result = {};

        mongo.db(session).collection(session.account.account + "_task").find(condition, queryOptions).toArray(function (err, docs) {
            if (!err) {
//                mongo.db(session).collection(session.account.account + fields.DB_TASK).distinct("customer", condition, function (err, ids) {
//                    if (!err) {
//                        ids = ids || [];
                var ids = util.getDistinctCustomerIds(docs);
                mongo.db(session).collection(session.account.account + fields.DB_C5_CUSTOMER).find({_id: {$in: ids}}, {fields: {name: 1, status: 1, dbType: 1}}).toArray(function (err, customers) {
                    if (!err) {
                        customers = customers || [];
                        util.processLinkData(docs, customers, "customer");
                        if (isCount) {
                            result.list = docs;
                            mongo.db(session).collection(session.account.account + fields.DB_TASK).count(condition, function (err, count) {
                                if (!err) {
                                    result.count = count;
                                    callback(null, result);
                                } else {
                                    callback(err);
                                }
                            });
                        } else {
                            callback(null, docs);
                        }

                        // callback(null, docs);
                    } else {
                        logger.app.error("", err);
                        callback(err);
                    }
                });

//                    } else {
//                        logger.app.error("", err);
//                        callback(err);
//                    }
//
//                });

            } else {
                callback(err);
            }
        });
    },
    addTaskCommentsImpl: function (session, data, callback) {
        data._id = utils.UUID.generateUuid();
        data.sortTime = new Date().getTime();
        mongo.db(session).collection(session.account.account + "_comments").insert(data, function (err) {
            if (!err) {
                callback(null);
            } else {
                logger.app.error("", err);
                callback(err);
            }
        });
    },
    queryNotifyCount: function(data,session,callback){
        var query1 = {createUser:data.user,isComplete:true,isRead:false};
        var query2 = {master:data.user,isComplete:false};
        var result = {success:false};
        mongo.db(session).collection(session.account.account + "_task").count(query1,function (err, count) {
            if (!err) {
                data.createNum=count;
                mongo.db(session).collection(session.account.account + "_task").count(query2,function(err,count2){
                    if(!err){
                        data.assignNum=count2;
                        syncAcs.taskNotify(data,session,callback);
                    }else{
                        logger.app.error(err);
                        callback(err);
                    }
                });
            } else {
                logger.app.error(err);
                callback(err);
            }
        });
    }
};

var util = {
    removeEmptyCondition: function (data) {
        for (var key in data) {
            if (!data[key]) {
                delete data[key];
            }
        }
    },
    getDistinctCustomerIds: function (tasks) {
        tasks = tasks || [];
        var result = [];
        for (var i = 0; i < tasks.length; i++) {
            var tasksItem = tasks[i];
            if (!utils.ObjectUtil.arrayContainsStr(result, tasksItem.customer)) {
                result.push(tasksItem.customer);
            }
        }
        return result;
    },

    processLinkData: function (data, linkdata, key) {
        for (var i = 0; i < data.length; i++) {
            var dataItem = data[i];
            for (var j = 0; j < linkdata.length; j++) {
                var linkdataItem = linkdata[j];
                if (dataItem[key] == linkdataItem._id) {
                    var copyItem = utils.ObjectUtil.copy(linkdataItem);
                    delete copyItem._id;
                    dataItem["customerDetail"] = copyItem;
                }
            }
        }
    }
}


module.exports = handler;

