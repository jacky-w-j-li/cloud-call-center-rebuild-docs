var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/im/common/Fields');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var connectionHandler = require(__baseDir + '/im/ConnectionHandler');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;

exports.checkConnection = function (id, callback) {
    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne({connectionId:id},function(err,result){
        if(!err && result && result.connectionId == id ){
            if(result.isBreak){
                if(utils.getCurrentDateTime() - result.breakTime > 60000*60*24){
                    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).remove({connectionId:id});
                    callback(err || new Error("404 Connection not found!"));
                    return;
                }
            }
            callback(null,result);
        } else {
            callback(err || new Error("404 Connection not found!"));
        }
    });
}

exports.breakConnection = function(data, connection, callback){
    var result = {
        Succeed: false
    }
    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION)
        .update({connectionId: connection.connectionId, _id: connection._id},{$set:{isBreak:true,breakTime:utils.getCurrentDateTime()}},function(err){
        if(!err){
            var notifyData = {
                action: "imDisconnect",
                sid: connection._id,
                account: connection.account,
                actionId: utils.UUID.generateUuid(),
                accessId: connection.accessId,
                platform: 'sdk'
            };
            exports.notifyToDispatcher(notifyData, function(res){})
            result.Succeed = true;
            callback(result);
        } else {
            result.Message = 'break session failed!';
            callback(result);
        }
    });
}

exports.breakConnectionByIoSession = function(data, callback){
    var result = {
        Succeed: false
    }
    var find = {};
    if(data.ConnectionId){
        find.connectionId = data.ConnectionId;
    }
    if(data.IoSessionId){
        find.ioSessionId = data.IoSessionId;
    }
    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne({ioSessionId: data.IoSessionId}, function(err, doc){
        if(doc){
            mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION)
                .updateOne({ioSessionId: data.IoSessionId, _id: doc._id} ,{$set:{isBreak:true,breakTime:utils.getCurrentDateTime()}} ,function(err){
                    if(!err){
                        result.Succeed = true;
                        callback(result);
                    } else {
                        result.Message = 'break session by ioSession failed!';
                        callback(result);
                    }
                });
        }else{
            callback(result);
        }

    });

}


exports.getConnection = function(data, connection, callback){
    var result = {
        Succeed: false
    }
    mongo.db().collection(fields.DB_MOBILE_SDK_CONNECTION_SESSION).findOne({userId: data.userId},function(err,doc){
        if(!err){
            if(doc){
                result.connection = doc;
                result.Succeed = true;
            }
            callback(result);
        } else {
            result.Message = 'find session failed!';
            callback(result);
        }
    });
}

module.exports.logoff = function(action, connection, callback) {
    var result = {
        Succeed: false
    }
    var find ={
        _id: connection.user._id
    }
    var update = {
        $unset : {
            im_apnsDeviceId : 1
        }
    }
    mongo.platformDb().collection(fields.DB_PLATFORM_USER).update(find, update, function(err){
        if(err){
            result.Message = 'logoff failed!';
        }else{
            result.Succeed = true;
        }
        callback(result);
    })
};

exports.sdkLogin = function(action, callback){
    var result = {
        Succeed: false
    }
    var data = action.data;
    if (data && data.AccessId) {
        mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.AccessId}, function (err, ImConfig) {
            if (!err && ImConfig) {
                mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT)
                    .findOne({account: ImConfig.account ,product: 'cc'}, function (err, dbAccount) {
                        if (!err && dbAccount) {
                            if(data.UserId && data.UserId != '' && data.UserId.substring(0,6) == '7moor@'){
                                var custId = data.UserId.substring(6);
                            }else{
                                if(data.NewVersion){
                                    var custId = data.DeviceId+'@'+utils.generateShortUuid(data.AccessId);
                                }else{
                                    var custId = data.DeviceId;
                                }
                                if(data.UserId && data.UserId != ''){
                                    custId += "@"+data.UserId;
                                }
                                custId += "@"+data.Platform;
                            }
                            mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne({_id: custId}, function (err, sdkCust) {
                                if(err){
                                    logger.app.info("500 find sdk customer failed!");
                                    result.Message = '500 find sdk customer failed！';
                                    callback(result);
                                    return;
                                }
                                if (sdkCust) {
                                    var setDoc = {$set:
                                    {
                                        loginTime : utils.getCurrentDateTime(),
                                        ioSessionId: data.IoSessionId,
                                        apnsDeviceId: data.ApnsDeviceId,
                                        connectionId: data.Key,
                                        connectServer : data.ConnectServer,
                                        isBreak: false
                                    }
                                    };
                                    if(data.UserId)
                                        setDoc['$set'].thirdPartyUserId = data.UserId;
                                    if(data.UserName){
                                        setDoc['$set'].username = data.UserName;
                                    }else{
                                        if(data.UserId && data.UserId != '' && data.UserId.substring(0,6) == '7moor@'){
                                            setDoc['$set'].username = data.UserId.substring(6);
                                        }else{
                                            setDoc['$set'].username = utils.generateShortUuid(data.DeviceId);
                                        }
                                    }
                                    if(data.AccessId != sdkCust.accessId){
                                        var endTime = utils.getCurrentDate();
                                        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).update({sid:sdkCust._id,status:{$ne: 'finish'},leavemsg:{$ne: true}},
                                            {$set: {status: 'finish',finishReason:'user change accessId',finishUser:'system',finishKey:'system',endTime:endTime, leakNum:0}},function(err){
                                                mongo.db().collection(fields.DB_APP_KEFU_IM_NOTIFY).removeMany({tonotify:sdkCust._id}, function(err){
                                                    setDoc['$set'].accessId = data.AccessId;
                                                    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).update({_id:custId}, setDoc, function(dbErr){
                                                        if(dbErr){
                                                            result.Message = '500 init session failed!';
                                                            callback(result);
                                                            return;
                                                        }
                                                        result.Succeed = true;
                                                        result.SessionId = custId;
                                                        callback(result);
                                                    });
                                                });
                                            });
                                    }else{
                                        mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).update({_id:custId}, setDoc, function(dbErr){
                                            if(dbErr){
                                                result.Message = '500 init session failed!';
                                                callback(result);
                                                return;
                                            }
                                            result.Succeed = true;
                                            result.SessionId = custId;
                                            callback(result);
                                        });
                                    }
                                }else{
                                    var cust = {
                                        _id: custId,
                                        platform : 'sdk',
                                        account : dbAccount.account,
                                        connectServer : data.ConnectServer,
                                        connectionId : data.Key,
                                        ioSessionId : data.IoSessionId,
                                        apnsDeviceId : data.ApnsDeviceId,
                                        deviceId : data.DeviceId,
                                        accessId : data.AccessId,
                                        loginTime : utils.getCurrentDateTime()
                                    };
                                    if(data.UserId)
                                        cust.thirdPartyUserId = data.UserId;
                                    if(data.UserName){
                                        cust.username = data.UserName;
                                    }else{
                                        if(data.UserId && data.UserId != '' && data.UserId.substring(0,6) == '7moor@'){
                                            cust.username = data.UserId.substring(6);
                                        }else{
                                            cust.username = utils.generateShortUuid(data.DeviceId);
                                        }
                                    }
                                    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).insertOne(cust, function(dbErr){
                                        if(dbErr){
                                            logger.app.info('500 insert sdk customer failed!');
                                            result.Message = '500 insert sdk customer failed!';
                                            callback(result);
                                            return;
                                        }
                                        result.Succeed = true;
                                        result.SessionId = custId;
                                        callback(result);
                                    })
                                }
                            });
                        }else{
                            logger.app.info(data.Account +"500 account_product not found!");
                            result.Message = '500 账号产品未找到!';
                            callback(result);
                        }
                    });
                }else{
                    logger.app.info(data.AccessId +"404 AccessId not found!");
                    result.Message = '404 AccessId not found!';
                    callback(result);
                }
            });
    }else{
        result.Message = '登陆信息不完整! ';
        callback(result);
    }
};

exports.sdkBeginNewChatSession = function(data, connection, callback){
    var result = {
        Succeed: false
    }
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId:connection.accessId}, function(dbErr, config) {
        if (dbErr || !config) {
            logger.app.info('find app_kefu_im_config failed!');
            result.Message = 'find app_kefu_im_config failed!';
            callback(result);
            return;
        }
        result.Succeed = true;
        result.Config = config;
        delete result.Config.account;
        callback(result);
        console.log(connection);
        var notifyData = {
            action: "imConn",
            sid: connection._id,
            account: connection.account,
            actionId: utils.UUID.generateUuid(),
            accessId: connection.accessId,
            platform: 'sdk',
            nickName: connection.username,
            isNewVisitor: data.IsNewVisitor,
            toPeer: data.ToPeer || ""
        };
        if(data.sdkAndroidVersionCode){
            notifyData.sdkAndroidVersionCode = data.sdkAndroidVersionCode;
        }
        if(data.sdkIosVersionCode){
            notifyData.sdkIosVersionCode = data.sdkIosVersionCode;
        }
        exports.notifyToDispatcher(notifyData, function (res) {});

        mongo.db().collection(fields.DB_APP_KEFU_IM_NOTIFY).count({tonotify:connection._id}, function(err, count){
            if(count && count >0){
                var notify = {
                    Action: "NewMessage",
                    ActionId: utils.UUID.generateUuid(),
                    ConnectionId: connection.connectionId,
                    IoSessionId: connection.ioSessionId
                };
                logger.app.info(JSON.stringify(notify));
                httpProvider.sendPost(connection.connectServer, notify, function (err, response) {
                    logger.app.info('sdkBeginNewChatSession to find notify has send 100 to sdk. response:'+response.toString());
                });
            }
        });
    });
};

exports.checkOnlineAgent = function(data, connection, callback){
    var result = {
        success: false
    }
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: connection.accessId}, function(err, imconfig){
        if(!imconfig.ToPeer){
            callback(result);
            return;
        }
        if(imconfig.ToPeer == ''){
            callback(result);
            return;
        }
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: imconfig.ToPeer}, function(err, queue){
            if(err || !queue){
                callback(result);
                return;
            }
            if(queue.AssignMembers.length > 0){
                var agentIds = [];
                for(var i=0 ;i<queue.AssignMembers.length;i++){
                    agentIds.push(queue.AssignMembers[i].agentID)
                }
                mongo.db().collection(fields.DB_APP_PUSH_CLIENT).find({_id:{$in: agentIds},status:{$ne:'close'}}).toArray(function(err,docs){
                    if(!err && docs && docs.length > 0){
                        result.success = true;
                    }
                    callback(result);
                });
            }
        })
    })
};

exports.notifyToDispatcher = function(postData,callback){
    var url = config.gatewayServiceUrl;
    logger.app.info("[getNewChat]request to dispather:" + JSON.stringify(postData));
    for(var key in postData){
        postData[key] = encodeURIComponent(postData[key]);
    }
    httpProvider.sendPost(url, "data=" + JSON.stringify(postData), function (err, response) {
        if (!err && response) {
            var result = {success: true};
            callback(result);
        } else {
            logger.app.error("[getNewChat]error from dispather");
            var result = {success: false, message: "error from dispather"};
            callback(result);
        }
    });
};

exports.sdkConvertManual = function(data, connection, callback) {
    var result = {Succeed: false};
    var url = config.gatewayServiceUrl;
    var postData = {
        action: "convertManual",
        sid: connection._id,
        actionId: utils.UUID.generateUuid(),
        account: connection.account,
        accessId: connection.accessId,
        platform: 'sdk',
        nickName: connection.username
    };
    logger.app.info("[sdkconvertManual][" + data._aid + "]request to dispather:" + JSON.stringify(postData));
    for(var key in postData){
        postData[key] = encodeURIComponent(postData[key]);
    }
    httpProvider.sendPost(url, "data=" + JSON.stringify(postData), function (err, response) {
        if (!err && response) {
            var res = JSON.parse(response);
            if (res.success) {
                result.Succeed = true;
            }
            callback(result);
        } else {
            logger.app.error("[getNewChat][" + data._aid + "]error from dispather", err);
            result.Succeed = false;
            result.Message = "error from dispather";
            callback(result);
        }
    });



}