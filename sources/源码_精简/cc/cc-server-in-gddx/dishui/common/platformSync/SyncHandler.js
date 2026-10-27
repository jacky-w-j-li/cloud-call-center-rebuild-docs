var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var httpProvider = require('appHttp');
var appConfig = require('appConfig').conf;

exports.updateUser = function (data, callback) {
    var result = {success: false};
    removeSyncData(data);
    var action = data.action;
    delete data['action'];
    var userId = data.userId;
    delete data['userId'];
    data._id = userId;
    if(data.dataMap){
        var map = data.dataMap;
        delete data['dataMap'];
        for(var key in map){
            data[key] = map[key];
        }
    }
    var session = {};
//    console.log('--------add user from sync billing data!-----------');
//    console.log(data);
    if (action === 'add'){
        //add sip sipPeer
        ExtensionHandler.saveSip2Acs(data,session,function(sipRes){
            if(sipRes.success){
                var sipNum = sipRes.sipNum;
                //if user have mobilePhone,add local sipPeer
                var isAddLocalSip = false;
                if(data.mobile != undefined && data.mobile != ''){
                    isAddLocalSip = true;
                }else{
                    isAddLocalSip = false;
                }
                ExtensionHandler.saveLocalSip2Acs(data,session,isAddLocalSip,function(localRes){
                    if(localRes.success){
                        var localNum = localRes.localNum;
                        var userData = {};
                        userData.Action = 'PeerAdd';
                        userData.Peer = 'User';
                        userData.Account = data.accountId;
                        userData.PBX = data.sipConfigId;
                        userData.UserID = data['_id'];
                        userData.DisplayName = data.name;
                        userData.User = data.loginName;
                        userData.Exten = data.empNo;
                        userData.Password =data.password;
                        userData.OwnSipNums = fields.EXTENSION_TYPE_SIP+':'+sipNum;
                        if(data.mobile!=undefined && data.mobile != ''){
                            userData.OwnSipNums+=','+fields.EXTENSION_TYPE_LOCAL+':'+localNum;
                        }
                        userData.Local = data.mobile;
                        userData.AutoBusyTime = '0';
                        userData.Version = 'enterprise';
                        userData.Email = data.email;
                        //console.log(userData);
                        ivrData = {
                            nodeData : userData,
                            isStoreDB : false//no save to db
                        };
                        IvrHandler.saveOrUpdateIvr(ivrData,session,function(err,ivrRes){
                            if(!err){
                                data.ownSipNums = new Array();
                                data.ownSipNums.push({"Exten" : sipNum, "type" : fields.EXTENSION_TYPE_SIP});
                                if(data.mobile!=undefined && data.mobile != ''){
                                    data.ownSipNums.push({"Exten" : localNum, "type" : fields.EXTENSION_TYPE_LOCAL});
                                }
                                mongo.db('bill').collection(fields.DB_PLATFORM_USER).insert(data, {w: 1}, function (err) {
                                    if (!err) {
                                        console.log("add userPeer to acs success!");
                                        result.success = true;
                                    } else {
                                        logger.app.error(err.stack);
                                        result.message = e.message;
                                    }
                                    callback(result);
                                });
                            }else{
                                err = err || new Error('addUser to acs failed!');
                                logger.app.error(err.stack);
                                result.message = err.message;
                                callback(result);
                            }
                        });
                    }else{
                        //todo
                    }
                });
            }else{
                callback(sipRes);
            }
        });
    } else if (action === 'update') {
        delete data['_id'];
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({_id:userId},{$set:data},{w:1},function(err,updateResult){
            if(!err && updateResult == 1){
                result.success = true;
            }else{
                err = err || new Error('updateUser but user['+userId+"] not found!");
                logger.app.error(err.stack);
                result.message = err.message;
            }
            callback(result);
        });

    } else if (action === 'delete') {
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).remove({_id:userId},{w:1},function(err,result){
            if(!err){
                result.success = true;
            }else{
                logger.app.error(err.stack);
                result.message = e.message;
            }
            callback(result);
        });
    } else {
        result.message = 'updateUser unknow action!';
        callback(result);
    }
}


exports.addCallCenterAccount = function (data, callback) {
    var result = {success: false};
    removeSyncData(data);
    var accountId = data.accountId;
    delete data['accountId'];
    data._id = accountId;
    mongo.db().collection(fields.DB_C5_ACCOUNT).insert(data, {w: 1}, function (err, doc) {
        if (!err) {
            result.success = true;
        } else {
            logger.app.error(err.stack);
            result.message = e.message;
        }
        callback(result);
    });
}


exports.updateAccountInfo = function (data, callback) {
    var result = {success: false};
    removeSyncData(data);
    var accountId = data.accountId;
    delete data['accountId'];
    data.accountName = data.name;
    delete data['name'];
    mongo.db().collection(fields.DB_C5_ACCOUNT).update({_id: accountId}, {$set:data}, {w: 1}, function (err,updateResult) {
        if (!err && updateResult == 1) {
            result.success = true;
        } else {
            err = err || new Error('updateAccountInfo but account['+accountId+"] not found!");
            logger.app.error(err.stack);
            result.message = e.message;
        }
        callback(result);
    });

}


exports.udpateAccountPbx = function (data, callback) {
    if(data.dataMap){
        var map = data.dataMap;
        delete data['dataMap'];
        for(var key in map){
            data[key] = map[key];
        }
    }
    removeSyncData(data);
    accountHandler.processAccountPbxSyncEvent(data, callback);
}


exports.updateSipConfig = function (data, callback) {
    var result = {success: false};
    removeSyncData(data);
    var action = data.action;
    delete data['action'];
    data._id = data.sipConfigId;
    delete  data['sipConfigId'];
    if (action == 'add') {
        mongo.db().collection(fields.DB_TBL_SIP_CONFIG).insert(data, {w: 1}, function (err, doc) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error(err.stack);
                result.message = e.message;
            }
            callback(result);
        });
    } else if (action == 'update') {
        var _id = data._id;
        mongo.db().collection(fields.DB_TBL_SIP_CONFIG).update({_id: _id}, data, {w: 1, upsert: true}, function (err, udpateResult) {
            if (!err || udpateResult == 1) {
                result.success = true;
            } else {
                err = err || new Error('updateSipConfig but pbx['+ data.sipConfigId+"] not found!");
                logger.app.error(err.stack);
                result.message = e.message;
            }
            callback(result);
        });
    } else if (action == 'delete') {
        mongo.db().collection(fields.DB_TBL_SIP_CONFIG).remove(data, {w: 1}, function (err, docs) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error(err.stack);
                result.message = e.message;
            }
            callback(result);
        });
    } else {
        result.message = 'updateSipConfig unknow action!';
        callback(result);
    }
}

function removeSyncData(data) {
    if(data.eventID) delete data['eventID'];
    if(data.appNodeID) delete data['appNodeID'];
    if(data.eventType) delete data['eventType'];
    if(data.exceptServerId) delete data['exceptServerId'];
}

