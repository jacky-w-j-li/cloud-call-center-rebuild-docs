var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;

var handler={
    getMyPbxInfo:function(pbxId,callback){
        var result = {success: false};
        mongo.db('bill').collection(fields.DB_PLATFORM_CC_PBX).findOne({_id:pbxId},function (err, pbx) {
            if (!err) {
                if(pbx){
//                    pbx.configAddr='http://localhost:7789/';
                    result.myPbx=pbx;
                    result.success=true;
                }else{
                    logger.app.warn('getMyPbxInfo: pbx not found');
                }
                callback(result);
            } else {
                logger.app.warn('getMyPbxInfo failed!', err);
                callback(result);
            }
        });
    },
    startDial:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var actionID='AutoCall'+utils.UUID.generateUuid();
                var addr=rep.myPbx.configAddr;
//                var url=addr+'/action?Action=AutoCall&ActionID='+actionID+'&account='+data.account+'&pbx='+data.pbx+'&start=yes';
                var url=addr;
                var postData = {
                    Command: 'Action',
                    Action: 'AutoCall',
                    ActionID:actionID,
                    account:data.account,
                    pbx:data.pbx,
                    start:data.start//yes or no
                }
                httpProvider.sendPost(url, postData,function(err, result){
                    if(err) {
                        logger.app.warn('startDial to ass failed!', err);
                        callback(false);
                    } else {
                        var res = JSON.parse(result);
                        if(res.Succeed){
                            callback(true);
                        } else {
                            logger.app.warn(result);
                            callback(false);
                        }
                    }
                });
            }else{
                callback(false);
            }
        });
    },
    startTaskDial:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var actionID='StartAutoCallTask'+utils.UUID.generateUuid();
                var addr=rep.myPbx.configAddr;
//                var url=addr+'/action?Action=AutoCall&ActionID='+actionID+'&account='+data.account+'&pbx='+data.pbx+'&start=yes';
                var url=addr;
                var postData = {
                    Command: 'Action',
                    Action: 'StartAutoCallTask',
                    ActionID:actionID,
                    account:data.account,
                    pbx:data.pbx,
                    taskId:data.taskId,
                    start:data.start//yes or no
                }
                httpProvider.sendPost(url, postData,function(err, result){
                    if(err) {
                        logger.app.warn('startDial to ass failed!', err);
                        callback({success:false});
                    } else {
                        var res = JSON.parse(result);
                        if(res.Succeed){
                            res.success=true;
                            callback(res);
                        } else {
                            logger.app.warn(result);
                            callback(res);
                        }
                    }
                });
            }else{
                callback({success:false});
            }
        });

    },
    updateBdTask:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var actionID='AutoCall'+utils.UUID.generateUuid();
                var addr=rep.myPbx.configAddr;
//                var url=addr+'/action?Action=AutoCall&ActionID='+actionID+'&account='+data.account+'&pbx='+data.pbx+'&start=yes';
                var url=addr;
                var postData = {
                    Command: 'Action',
                    Action: 'AddAutoCallTask',
                    ActionID:actionID,
                    pbx:data.pbx,
                    account:data.account,
                    taskId:data._id,
                    displayName:data.name,
                    taskType:data.taskType,
                    serviceNo:data.serviceNo,
                    numType:data.numType,
                    timeType:data.timeType,
                    taskDate:data.taskDate,
                    taskTime:data.timeArea,
                    taskQueue:data.taskQueue
                }

                httpProvider.sendPost(url, postData,function(err, result){
                    if(err) {
                        logger.app.warn('updateBdTask to ass failed!', err);
                        callback({success:false});
                    } else {
                        var res = JSON.parse(result);
                        if(res.Succeed){
                            res.success=true;
                            callback(res);
                        } else {
                            logger.app.warn(result);
                            callback(res);
                        }
                    }
                });
            }else{
                callback({success:false});
            }
        });
    },
    deleteBdTask:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var actionID='AutoCall'+utils.UUID.generateUuid();
                var addr=rep.myPbx.configAddr;
//                var url=addr+'/action?Action=AutoCall&ActionID='+actionID+'&account='+data.account+'&pbx='+data.pbx+'&start=yes';
                var url=addr;
                var postData = {
                    Command: 'Action',
                    Action: 'DeleteAutoCallTask',
                    ActionID:actionID,
                    pbx:data.pbx,
                    account:data.account,
                    taskId:data._id
                }
                httpProvider.sendPost(url, postData,function(err, result){
                    if(err) {
                        logger.app.warn('deleteBdTask to ass failed!', err);
                        callback({success:false});
                    } else {
                        var res = JSON.parse(result);
                        if(res.Succeed){
                            res.success=true;
                            callback(res);
                        } else {
                            logger.app.warn(result);
                            callback(res);
                        }
                    }
                });
            }else{
                callback({success:false});
            }
        });
    },
    taskNotify:function(data,session,callback){
        var pbx=session.user.pbx;
        var params={
            createNum:data.createNum,
            assignNum:data.assignNum
        }
        handler.getMyPbxInfo(pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
                var action = {
                    Command: 'Action',
                    Action: 'Notify',
                    ActionID: 'Notify'+utils.UUID.generateUuid(),
                    PBX: pbx,
                    Account:session.account.account,
                    Event:data.type,
                    From:session.user._id,
                    To:[data.user],
                    Data:JSON.stringify(params)
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('taskNotify to ass failed!', err);
                        callback(false);
                    } else {
                        var res = JSON.parse(result);
                        if(res.Succeed){
                            callback(true);
                        } else {
                            logger.app.warn(result);
                            callback(false);
                        }
                    }
                });
            }else{
                logger.app.err(rep);
                callback(rep);
            }
        });
    },
    messageNotify:function(data,session,callback){
        var pbx=session.user.pbx;
        handler.getMyPbxInfo(pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
                var action = {
                    Command: 'Action',
                    Action: 'Notify',
                    ActionID: 'Notify'+utils.UUID.generateUuid(),
                    PBX: pbx,
                    Account:session.account.account,
                    Event:data.type,
                    From:session.user._id,
                    To:[data.user],
                    Data:JSON.stringify(data.data)
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('messageNotify to ass failed!', err);
                        callback(false);
                    } else {
                        var res = JSON.parse(result);
                        if(res.Succeed){
                            callback(true);
                        } else {
                            logger.app.warn(result);
                            callback(false);
                        }
                    }
                });
            }else{
                logger.app.err(rep);
                callback(rep);
            }
        });
    }

};

module.exports=handler;
