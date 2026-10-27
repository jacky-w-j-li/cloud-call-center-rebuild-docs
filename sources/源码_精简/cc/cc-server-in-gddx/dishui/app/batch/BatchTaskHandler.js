var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var syncAcs = require(__baseDir + "/dishui/app/batch/SyncAcsHandler");


var handler = {
    getNumList2: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        var aid=session.account.account;
//        condition.account=aid;
        utils.removeEmptyProperty(condition);
//        if(condition.called && typeof(condition.called)=='string'){
//            if(condition.called=='true'){
//                condition.called=true;
//            }else{
//                condition.called=false;
//            }
//        }
        if(condition.reason && condition.reason=='0'){
            condition.reason={$ne:'4'}
        }
        if(condition.taskName){
//            condition.taskName=new RegExp(condition.taskName);
            var _query={account:aid,name:condition.taskName};
            delete condition.taskName;
            mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).findOne(_query, function (err, doc) {
                if (!err) {
                    if (doc) {
                        condition.taskId=doc._id;
                        mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL_NEW).find(condition,{sort:{beginTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
                            if (!err) {
                                result.list = docs;
                                mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL_NEW).count(condition, function (err, count) {
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
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else {
                        result.list = [];
                        result.count = 0;
                        result.success = true;
                        callback(result);
                    }
                } else {
                    logger.app.error(err.stack);
                    callback(result);
                }
            });
        }else{
            condition.account=aid;
            mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL_NEW).find(condition,{sort:{beginTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
                if (!err) {
                    result.list = docs;
                    mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL_NEW).count(condition, function (err, count) {
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
                    logger.app.error(err);
                    callback(result);
                }
            });
        }
    },

    getBdTaskList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account.account;
//        condition.createUser=session.user._id;
        condition.status={$in:[fields.task_status_finish]};
        utils.removeEmptyProperty(condition);
        if(condition.name){
            condition.name=new RegExp(condition.name);
        }

        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).find(condition,{sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).count(condition, function (err, count) {
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
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getDealBdTaskList: function (data, session, callback) {
        var result = {success: false};
        var condition = data||{};
        condition.account=session.account.account;
//        condition.createUser=session.user._id;
        condition.status={$in:[fields.task_status_ready,fields.task_status_start]};
        condition.pbx=session.user.pbx;
        utils.removeEmptyProperty(condition);

        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).find(condition,{sort:{createTime:-1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                result.success = true;
                result.currentTimeStamp=utils.DateTime.getCurrentTimestamp();
                result.currentDate=utils.DateTime.getCurrentDate();
                callback(result)
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    //my service dic
    getSnByUser:function(session,callback){
        var result = {success: false};
        var aid = session.account.account;
        var userPbx=session.user.pbx;
        var query={
            Account:aid,
            PBX:userPbx
        }
        mongo.db().collection("manager_ivr_service_no").find(query).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                callback(null, docs || []);
            } else {
                logger.app.error("getSnByUser error", err);
                callback(err);
            }
        });
    },
    //my group dic
    getSkillGroupByUser:function(session,callback){
        var result = {success: false};
        var aid = session.account.account;
        var userPbx=session.user.pbx;
        var query={
            Account:aid,
            PBX:userPbx,
            State:"enable"
        }
        mongo.db().collection("manager_ivr_skillgroup").find(query).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                callback(null, docs || []);
            } else {
                logger.app.error("getSkillGroupByUser error", err);
                callback(err);
            }
        });
    },
    _checkName:function(data,session,callback){
        var result = {success: false};
        var aid = session.account.account;
        if(!data.name){
            result.success=true;
            callback(result);
            return;
        }
        var query={account:aid,name:data.name};
        if(data.isUpdae)query._id={"$ne":data._id};
        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).count(query, function (err, count) {
            if (!err) {
                if (count==0) {
                    result.success=true;
                    callback(result);
                } else {
                    result.message = '任务名称重复';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'checkName error!';
                callback(result);
            }
        });
    },
    _checkQueue:function(data,session,callback){
        var result = {success: false};
        var aid = session.account.account;
        var query={Account:aid,DisplayName:data.serviceNo};
        mongo.db().collection("manager_ivr_skillgroup").findOne(query, function (err, doc) {
            if (!err) {
                if (doc) {
                    result.success=true;
                    callback(result);
                } else {
                    result.message = '没有找到服务号同名的技能组';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = '_checkQueue error!';
                callback(result);
            }
        });
    },
    /**
     添加任务 message= 401 没有服务号同名的技能组。
     开始/暂停任务 message = 404 ，未找到该任务。  message = 401 ，已经有一个在执行的手动任务，不能再开始。
     删除任务 message = 404 未找到该任务
     * @param data
     * @param session
     * @param callback
     */
    saveBdTask : function(data,session,callback){
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        var uid=session.user._id;
        data._id=id;
        data.account=aid;
        data.pbx=session.user.pbx;
        data.createTime= time;
        data.lastTime= time;
        data.createUser= uid;
        data.status=fields.task_status_ready;
//        if(data.numType==fields.task_numType_import){
//            delete  data.beginNum;
//            delete  data.endNum;
//        }
        if(data.numType==fields.task_numType_generate){
            data.currentNum=data.beginNum;
            var num=parseFloat(data.endNum)-parseFloat(data.beginNum);
            data.total=parseInt(num)+1;
        }
        handler._checkName(data,session,function(checkRep){
            if(checkRep.success){
//                handler._checkQueue(data,session,function(checkRep2){
//                    if(checkRep2.success){
                        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).insert(data,function(err){
                            if (!err) {
                                syncAcs.updateBdTask(data,function(acsRep){
                                    if(acsRep.success){
                                        result.success = true;
                                        callback(result);
                                    }else{
                                        callback(acsRep);
                                    }
                                });
/*                                if(data.numType==fields.task_numType_generate){
                                    handler._insertImpNumArea(data,session,function(rep){
                                        if(rep.success){
                                            syncAcs.updateBdTask(data,function(acsRep){
                                                if(acsRep.success){
                                                    result.success = true;
                                                    callback(result);
                                                }else{
                                                    callback(acsRep);
                                                }
                                            });
                                        }else{
                                            callback(rep);
                                        }
                                    })
                                }else{
                                    syncAcs.updateBdTask(data,function(acsRep){
                                        if(acsRep.success){
                                            result.success = true;
                                            callback(result);
                                        }else{
                                            callback(acsRep);
                                        }
                                    });
                                }*/
                            } else {
                                logger.app.error('saveBdTask error:' + err.stack);
                                result.message = 'saveBdTask error!'+err.message;
                                callback(result);
                            }
                        })
//                    }else{
//                        callback(checkRep2);
//                    }
//                });

            } else{
                callback(checkRep);
            }
        });

    },
    updateBdTask: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account.account;
        var userPbx=session.user.pbx;
        var query={_id:data._id};
        var time=utils.DateTime.getCurrentDateTime();
        data.lastTime= time;
        data.isUpdae='update';
        handler._checkName(data,session,function(checkRep){
            if(checkRep.success){
                delete data.isUpdae;
                delete data._id;
//                handler._checkQueue(data,session,function(checkRep2){
//                    if(checkRep2.success){
                        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).findAndModify(query,[],{$set:data},{new: true},function (err,doc) {
                            if (!err) {
                                syncAcs.updateBdTask(doc,callback);
                            }else{
                                logger.app.error(err.stack);
                                result.message = 'updateBdTask error!';
                                callback(result);
                            }
                        });
//                    }else{
//                        callback(checkRep2);
//                    }
//                });
            } else{
                callback(checkRep);
            }
        });

    },
    removeBdTask: function (data, session, callback) {
        var result = {success: false};
        var condition = {_id:data._id};
        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).findOne(condition,function (err, doc) {
            if (!err) {
                var query={
                    accountId:session.account.account,
                    taskId:data._id,
                    flag:"start"
                }
                mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).count(query,function (err, count) {
                    if (!err) {
                        if(count>0){
                            result.message="号码正在导入中，请在导入完成后再进行此操作！"
                            callback(result);
                        }else{
                            mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).update(condition,{$set:{status:fields.task_status_delete}},function (err) {
                                if(!err){
                                    syncAcs.deleteBdTask(doc,callback);
                                } else {
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });

            } else {
                logger.app.error("removeBdTask error", err);
                callback(result);
            }
        });

    },
    getTaskById:function(data,session,callback){
        var result = {success: false};
        var query={
            _id:data._id
        }
        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).findOne(query,function (err, doc) {
            if (!err) {
                result.success = true;
                result.row = doc;
                callback(result);
            } else {
                logger.app.error("getTaskById error", err);
                callback(result);
            }
        });
    },
    __getDateNo:function(){
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var str = year + '' + (month > 9 ? month : "0" + month) + '' + (day > 9 ? day : "0" + day);
        var h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
        str += (h > 9 ? h : "0" + h) + '' + (m > 9 ? m : "0" + m) + '' + (s > 9 ? s : "0" + s);
        return str;
    },
   /* _generateImpTask:function(data,session){//废弃
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        data._id=id;
        data.createTime= time;
        data.accountId=aid;
        data.batchNo=data.batchNo;
        data.flag="finish";
        data.type="telTaskArealist";
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data,function(err){
            if (err) {
                logger.app.error('task numArea import task error:' + err.stack);
            }
        });
    },*/
   /* _insertImpNumArea : function(data,session,callback){//废弃
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        var set={};
        set._id=id;
//        data.createTime= time;
        set.account=aid;
        set.batchNo=handler.__getDateNo();
//        set.called=false;
        set.current=data.beginNum;
        set.num=data.beginNum+"-"+data.endNum;
        set.taskId=data._id;
        set.taskName=data.name;

        mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL_IMPORT).insert(set,{w:1},function(err){
            if (!err) {
                var _set={batchNo:set.batchNo};
                handler._generateImpTask(_set,session);
                result.success = true;
                callback(result);
            } else {
                logger.app.error('_insertImpNumArea error:' + err.stack);
                result.message = '_insertImpNumArea error!'+err.message;
                callback(result);
            }
        })
    },*/
    getImpTaskById: function (data, session, callback) {
        var result = {success: false};
        var condition = {};
        condition.accountId=session.account.account;
        condition.taskId=data.taskId;
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(condition,{sort:{createTime:-1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                result.success = true;
                callback(result)
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _getImpTaskCount: function (data, session, callback) {
        var result = {success: false};
        var condition = {};
        condition.accountId=session.account.account;
        condition.taskId=data.taskId;
        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).findOne({_id:data.taskId}, function (err, doc) {
            if (!err && doc) {
                if(doc.numType==fields.task_numType_import){
                    mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).count(condition, function (err, count) {
                        if (!err) {
                            if(count==0){
                                result.message = '请先导入号码后再开始任务';
                                callback(result);
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    startDialTask:function(data,session,callback){
        var result = {success: false};
        data=data||{};
        data.account=session.account.account;
        if(!data.pbx){
            data.pbx=session.user.pbx;
        }
        if(data.start=="yes" ){
            var start=utils.DateTime.getCurrentDate()+" 09:00:00";
            var end=utils.DateTime.getCurrentDate()+" 21:00:00";
            var isInDate=utils.isInDate(start,end);
            if(!isInDate){
                result.message = '请在上午9点到晚上9点之间开始任务';
                callback(result);
                return;
            }
            handler._getImpTaskCount(data,session,function(_rep){
                if(_rep.success){
                    syncAcs.startTaskDial(data,function(rep){
                        if(rep.success){
                            var set={};
                            set.status=fields.task_status_start;
                            mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).update({_id:data.taskId,status:{$ne:fields.task_status_finish}},{$set:set},function (err) {
                                if (err) {
                                    logger.app.error(err.stack);
                                    result.message = 'startTaskDial error!';
                                    callback(result);
                                }
                            });
                            callback(rep);
                        }else{
                            callback(rep);
                        }
                    })
                }else{
                    callback(_rep);
                }
            });
        }else{
            syncAcs.startTaskDial(data,function(rep){
                if(rep.success){
                    var set={};
                    set.status=fields.task_status_ready;
                    mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).update({_id:data.taskId},{$set:set},function (err) {
                        if (err) {
                            logger.app.error(err.stack);
                            result.message = 'startTaskDial error!';
                            callback(result);
                        }
                    });
                    callback(rep);
                }else{
                    callback(rep);
                }
            })
        }
    },
    updateTaskCallStrategy: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account.account;
        var userPbx=session.user.pbx;
        var query={_id:session.account._id};
        mongo.db("bill").collection("platform_account_product").findOne(query,function (err,product) {
            if (!err && product) {
                var pbxs=product.pbx||[];
                var set={};
                for (var i = 0; i < pbxs.length; i++) {
                    var obj = pbxs[i];
                    if(obj.PBX==userPbx){
                        set=obj;
                        break;
                    }
                }
                if(data.AutoCallStrategy=="static"){
                    var maxIn=set.maxIn;
                    var limit=parseInt(data.limit,10);
                    if(limit==-1){
                        if(!isNaN(maxIn) && maxIn!=-1){
                            result.message = '呼入并发不能设为-1';
                            callback(result);
                            return;
                        }
                    }else{
                        if(!isNaN(maxIn) && maxIn!=-1 && maxIn<limit){
                            result.message = '最大并发数为【'+maxIn+'】';
                            callback(result);
                            return;
                        }
                    }
                }

                if(data.AutoCallStrategy){
                    set.AutoCallStrategy=data.AutoCallStrategy;
                }
                if(data.SmartAutoCallCount){
                    set.SmartAutoCallCount=parseInt(data.SmartAutoCallCount||1,10);
                }

                mongo.db("bill").collection("platform_account_product").update({_id:session.account._id,'pbx.PBX':userPbx},{$set:{'pbx.$':set}},function (err) {
                    if (!err) {
                        var param={
                            account:aid,
                            pbx:userPbx,
                            autoCallStrategy:data.AutoCallStrategy
                        }
                        if(data.AutoCallStrategy=="smart"){
                            param.smartAutoCallCount=parseInt(data.SmartAutoCallCount||'1',10);
                        }else{
                            param.limit=parseInt(data.limit||'2',10);
                        }
                        var action = 'action=service.updateCallLimit&data=' + JSON.stringify(param);
                        httpProvider.sendGet(config.yyBillUrl + "?" + action, function(err, res){
                            if(err) {
                                result.message = 'Sent require to manager server error: ' + data;
                                callback(result);
                                return;
                            }
                            var resData = JSON.parse(res.toString());
                            if(!resData.success){
                                result.message = resData.message;
                                callback(result);
                                return;
                            }
                            result.success = true;
                            callback(result);
                        });
                    }else{
                        logger.app.error(err.stack);
                        result.message = 'updateTaskCallStrategy error!';
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err.stack);
                result.message = 'updateTaskCallStrategy error!';
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
    importTaskNum:function(data,session,res){
        var doc={fileName:data.file.fileId,trueName:data.file.name,isPhone:data.isPhone==null?false:true,taskId:data.taskId,taskName:data.taskName};
        handler._insertImpTask(doc,session,function(err){
            var result='';
            if(!err){
                result='<script>parent.handler.batch2.uploadSuccess("success")</script>';
            }else{
                result='<script>parent.handler.batch2.uploadSuccess("fail")</script>';
            }
            res.send(result);
        });
    },
    _insertImpTask : function(data,session,callback){
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        data._id=id;
        data.createTime= time;
        data.accountId=aid;
        data.batchNo=handler.__getDateNo();
        data.flag="start";
        data.type="telTasklist";
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data,{w:1},function(err){
            if (!err) {
                result.success = true;
                handler.__sendTask(aid,callback);
            } else {
                logger.app.error('db imp task error:' + err.stack);
                result.message = 'db imp task error!'+err.message;
                callback(result);
            }
        })
    },
    __sendTask:function(accountId,callback){
        var url = config.ccServiceUrl+'?Action=import&Method=import&Account=' + accountId;
        url=encodeURI(url);
        httpProvider.sendGet(url, function(err, result){
            if(!err && result){
                try{
                    var res = JSON.parse(result);
                    if(res.Succeed){
                        callback(null);
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
    },
    __getDateNo:function(){
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var str = year + '' + (month > 9 ? month : "0" + month) + '' + (day > 9 ? day : "0" + day);
        var h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
        str += (h > 9 ? h : "0" + h) + '' + (m > 9 ? m : "0" + m) + '' + (s > 9 ? s : "0" + s);
        return str;
    }
};

module.exports = handler;
