var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var httpProvider = require("appHttp");
var config = require('appConfig');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler={
    getMyPbxInfo:function(pbxId,callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_pbx).findOne({_id:pbxId},function (err, pbx) {
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

    addUser:function(user,sips,callback){
        handler.getMyPbxInfo(user.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url="http://127.0.0.1:7789/";
                var action = {
                    Command: 'Action',
                    Action: 'addUser',
                    ActionID: 'addUser'+utils.UUID.generateUuid(),
                    sips: sips,
                    _id: user._id,
                    account:user.account,
                    pbx:user.pbx,
                    exten:user.exten,
                    password:user.password,
                    displayName:user.displayName,
                    mobile:user.mobile,
                    email:user.email,
                    isAdmin:user.isAdmin,
                    sipExten:user.sipExten,
                    mobileExten:user.mobileExten,
                    callerIDNum:user.callerIDNum
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('addUser to ass failed!', err);
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
    batchAddUser:function(account,pbx,users,callback){
        handler.getMyPbxInfo(pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url="http://127.0.0.1:7789/";
                var action = {
                    Command: 'Action',
                    Action: 'BatchAddUser',
                    ActionID: 'BatchAddUser'+utils.UUID.generateUuid(),
                    users: users,
                    account:account,
                    pbx:pbx
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('batchAddUser to ass failed!', err);
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
    updateUser:function(user,callback){
        handler.getMyPbxInfo(user.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url="http://127.0.0.1:7789/";
                var action = {
                    Command: 'Action',
                    Action: 'updateUser',
                    ActionID: 'updateUser'+utils.UUID.generateUuid(),
                    _id: user._id,
                    account:user.account,
                    pbx:user.pbx,
                    exten:user.exten,
                    password:user.password,
                    displayName:user.displayName,
                    mobile:user.mobile,
                    email:user.email,
                    callerIDNum:user.callerIDNum
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('updateUser to ass failed!', err);
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
    batchUpdateCallerNum:function(account,pbx,callerIDNum,users,callback){
        handler.getMyPbxInfo(pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url="http://127.0.0.1:7789/";
                var action = {
                    Command: 'Action',
                    Action: 'BatchUpdateCallerNum',
                    ActionID: 'BatchUpdateCallerNum'+utils.UUID.generateUuid(),
                    users: users,
                    account:account,
                    pbx:pbx,
                    callerIDNum:callerIDNum
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('batchUpdateCallerNum to ass failed!', err);
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
    addServiceNo:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url='http://localhost:7789/';
                var action = {
                    Command: 'Action',
                    Action: 'ServiceNoAdd',
                    ActionID: 'ServiceNoAdd'+utils.UUID.generateUuid(),
                    account: data.account,
                    pbx: data.pbx,
                    type:data.type,
                    exten:data.serviceno,
                    maxCall:data.maxCall,
                    flow:data.flow
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('addServiceNo to ass failed!', err);
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
    updateServiceNo:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
                var action = {
                    Command: 'Action',
                    Action: 'ServiceNoUpdate',
                    ActionID: 'ServiceNoUpdate'+utils.UUID.generateUuid(),
                    account: data.account,
                    pbx: data.pbx,
                    maxCall:data.concurrent,
                    exten:data.serviceno
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('updateServiceNo to ass failed!', err);
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
    removeServiceNo:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url="http://127.0.0.1:7789"
                var action = {
                    Command: 'Action',
                    Action: 'ServiceNoRemove',
                    ActionID: 'ServiceNoRemove'+utils.UUID.generateUuid(),
                    account: data.account,
                    pbx: data.pbx,
                    exten:data.serviceno
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('removeServiceNo to ass failed!', err);
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
    startDial:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var actionID='AutoCall'+utils.UUID.generateUuid();
                var addr=rep.myPbx.configAddr;
                var url=addr+'/action?Action=AutoCall&ActionID='+actionID+'&account='+data.account+'&pbx='+data.pbx+'&start=yes';
                httpProvider.sendGet(url, function(err, result){
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
    bindDidNum:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
                var action = {
                    Command: 'Action',
                    Action: 'DidNumBind',
                    ActionID: 'DidNumBind'+utils.UUID.generateUuid(),
                    account: data.account,
                    pbx: data.pbx,
                    exten:data.serviceno,
                    uid:data.uid,
                    maxCall:data.maxCall
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('bindDidNum to ass failed!', err);
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
        })
    },
    updateAccount:function(account,callback){
        handler.getMyPbxInfo(account.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
                var action = {
                    Command: 'Action',
                    Action: 'AccountUpdate',
                    ActionID: 'AccountUpdate'+utils.UUID.generateUuid(),
                    account:account.account,
                    pbx:account.pbx,
                    displayName:account.displayName,
                    name:account.name
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('updateAccount to ass failed!', err);
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
    generateIvrFlow:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url='http://localhost:7789/';
                var action = {
                    Command: 'Action',
                    Action: 'AddIvrFlow',
                    ActionID: 'AddIvrFlow'+utils.UUID.generateUuid(),
                    account: data.account,
                    pbx: data.pbx,
                    startTimeHour: data.startTimeHour,
                    startTimeMinute: data.startTimeMinute,
                    endTimeHour: data.endTimeHour,
                    endTimeMinute: data.endTimeMinute,
                    day:data.day,
                    agent: data.agent||[],
                    queue: data.queue,
                    serviceAgent: data.serviceAgent||[],
                    serviceQueue: data.serviceQueue,
                    ivr: data.ivr,
                    serviceNo:data.serviceNo,
                    wId:data.w?data.w.id:"",
                    owId:data.ow?data.ow.id:""

                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('generateIvrFlow to ass failed!', err);
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
    removeDefaultIvr:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url="http://127.0.0.1:7789"
                var action = {
                    Command: 'Action',
                    Action: 'DeleteIvrQueue',
                    ActionID: 'DeleteIvrQueue'+utils.UUID.generateUuid(),
                    account: data.account,
                    pbx: data.pbx,
                    extens:data.extens
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('removeDefaultIvr to ass failed!', err);
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
    setHangupSms:function(data,callback){
        handler.getMyPbxInfo(data.pbx,function(rep){
            if(rep.success){
                var url=rep.myPbx.configAddr;
//                url="http://127.0.0.1:7789"
                var action = {
                    Command: 'Action',
                    Action: 'SetAccHangupSms',
                    ActionID: 'SetAccHangupSms'+utils.UUID.generateUuid(),
                    account: data.account,
                    pbx: data.pbx,
                    smsIn:data.smsIn,
                    smsOut:data.smsOut
                };
                httpProvider.sendPost(url, action, function(err, result){
                    if(err) {
                        logger.app.warn('removeServiceNo to ass failed!', err);
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
    }
};

module.exports=handler;
