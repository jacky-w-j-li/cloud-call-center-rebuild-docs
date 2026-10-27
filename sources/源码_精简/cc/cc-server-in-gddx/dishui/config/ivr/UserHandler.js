var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var cnToSpellUtil = require('appUtil/CNToSpellUtil');
var logger = require('appLog');
var nodeUtil = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var objectUtil = require('appUtil/ObjectUtil');
var fields = require(__baseDir + '/dishui/common/Fields');
var IvrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var extensionHandler = require(__baseDir + '/dishui/config/ivr/ExtensionHandler');
var skillGroupHandler = require(__baseDir + '/dishui/config/ivr/SkillgroupHandler');


//var handler = {
//    getUserDic: function (session, callback) {
//
//        mongo.db().collection("manager_user").find({status: 'enable'}).toArray(function (err, docs) {
//            if (!err) {
//                docs = docs || [];
//                callback(null, docs);
//            } else {
//                logger.app.error("", err);
//                callback(err);
//            }
//        });
//
//
//    },
//    queryUser: function (data, session, callback) {
//        var result = {success: false};
//        mongo.db().collection(fields.DB_APP_USER).find(data).toArray(function (err, docs) {
//            if (err) {
//                logger.app.error(err.stack);
//                result.message = "Query user failure" + util.inspect(data);
//                result.success = false;
//                callback(result);
//                return;
//            }
//            result.list = docs;
//            result.success = true;
//            callback(result);
//        });
//    },
//
//    updateUser: function (data, session, callback) {
//        var result = {success: false};
//        var action = data.action;
//        delete data['action'];
//        var userId = data._id;
////    if(data.dataMap){
////        var map = data.dataMap;
////        delete data['dataMap'];
////        for(var key in map){
////            data[key] = map[key];
////        }
////    }
//        var session = {};
//        if (action === 'add') {
//            //add sip sipPeer
//            data._id = uuid.generateUuid();
//            extensionHandler.saveSip2Acs(data, session, function (sipRes) {
//                if (sipRes.success) {
//                    var sipNum = sipRes.sipNum;
//                    //if user have mobilePhone,add local sipPeer
//                    var isAddLocalSip = false;
//                    if (data.Local) {
//                        isAddLocalSip = true;
//                    } else {
//                        isAddLocalSip = false;
//                    }
//                    extensionHandler.saveLocalSip2Acs(data, session, isAddLocalSip, function (localRes) {
//                        if (localRes.success) {
//                            var localNum = localRes.localNum;
//                            var userData = {};
//                            userData.Action = 'PeerAdd';
//                            userData.Peer = 'User';
//                            userData.Account = data.Account;
//                            userData.PBX = data.PBX;
//                            userData.UserID = data['_id'];
//                            userData._id = data['_id'];
//                            userData.DisplayName = data.DisplayName;
//                            userData.User = data.User;
//                            userData.Exten = data.Exten;
//                            userData.Password = data.Password;
//                            userData.IsManager = data.IsManager;
//                            userData.OwnSipNums = fields.EXTENSION_TYPE_SIP + ':' + sipNum;
//                            if (data.Local) {
//                                userData.OwnSipNums += ',' + fields.EXTENSION_TYPE_LOCAL + ':' + localNum;
//                            }
//                            userData.Local = data.Local;
//                            userData.AutoBusyTime = '0';
//                            userData.Version = 'enterprise';
//                            userData.Email = data.Email;
//                            userData.UpdateTime = dateTimeUtil.getCurrentDate();
//                            //userData.UpdateUser = session.user._id;
//                            //console.log(userData);
//                            var ivrData = {
//                                nodeData: userData,
//                                dbData: {
//                                    tableName: fields.DB_APP_USER
//                                }
//                            };
//                            IvrHandler.saveOrUpdateIvr(ivrData, session, function (err, ivrRes) {
//                                if (!err) {
//                                    console.log("add user success!");
//                                    result.data = userData;
//                                    result.success = true;
//                                    callback(result);
//                                } else {
//                                    err = err || new Error('addUser to acs failed!');
//                                    logger.app.error(err.stack);
//                                    result.success = false;
//                                    result.message = err.message;
//                                    callback(result);
//                                }
//                            });
//                        } else {
//                            result.success = false;
//                            result.message = 'Add user local sip failure!';
//                            callback(result);
//                        }
//                    });
//                } else {
//                    result.success = false;
//                    result.message = 'Add user soft phone sip failure!';
//                    callback(result);
//                }
//            });
//        } else if (action === 'update') {
//            data.Action = 'PeerAdd';
//            data.Peer = 'User';
//            data.UpdateTime = dateTimeUtil.getCurrentDate();
////        userData.UpdateUser = session.user._id;
//            var updateData = {
//                nodeData: data,
//                dbData: {
//                    tableName: fields.DB_APP_USER
//                }
//            };
//            IvrHandler.saveOrUpdateIvr(updateData, session, function (err, ivrRes) {
//                if (!err) {
//                    console.log("update user success!");
//                    result.data = data;
//                    result.success = true;
//                    callback(result);
//                } else {
//                    err = err || new Error('update to acs failed!');
//                    logger.app.error(err.stack);
//                    result.success = false;
//                    result.message = err.message;
//                    callback(result);
//                }
//            });
//
////        delete data['_id'];
////        mongo.db().collection(fields.DB_APP_USER).update({_id:userId},{$set:data},{w:1},function(err,updateResult){
////            if(!err && updateResult == 1){
////                result.success = true;
////            }else{
////                err = err || new Error('updateUser but user['+userId+"] not found!");
////                logger.app.error(err.stack);
////                result.message = err.message;
////            }
////            callback(result);
////        });
//
//        } else if (action === 'delete') {
//            mongo.db().collection(fields.DB_APP_USER).remove({_id: userId}, {w: 1}, function (err, result) {
//                if (!err) {
//                    result.success = true;
//                } else {
//                    logger.app.error(err.stack);
//                    result.message = e.message;
//                }
//                callback(result);
//            });
//        } else {
//            result.message = 'updateUser unknow action!';
//            callback(result);
//        }
//    }
//
//};

exports.getUserDic = function (session, callback) {

    mongo.db().collection("manager_user").find({status: 'enable'}).toArray(function (err, docs) {
        if (!err) {
            docs = docs || [];
            callback(null, docs);
        } else {
            logger.app.error("", err);
            callback(err);
        }
    });


}


exports.queryUser = function (data, session, callback) {
    var result = {success: false};
    if(!data.product){
        data.product = 'cc';
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(data, {sort:{exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query user failure" + nodeUtil.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.saveAccountUserToAcs = function(data , session , callback) {
    var result = {success: false};
    data.Action = "PeerAdd";
    data.Peer = "User";
    data.PBX = data.pbx;
    data.Account = data.account;
    data.UserID = data._id;
    data.Exten = data.exten;
    data.User = data.loginName;
    data.DisplayName = data.displayName;
    data.Version = data.uversion || 'enterprise';
    data.CallerIDNum = data.callerIDNum;
    if(data.mobile && data.mobile != ''){
        data.Local = data.mobile;
    }
    var sipNumStr = "";
    if(data.sipExten){
        sipNumStr += fields.EXTENSION_TYPE_SIP + ':' + data.sipExten + ",";
    }
    if(data.mobileExten){
        sipNumStr += fields.EXTENSION_TYPE_LOCAL + ':' + data.mobileExten + ",";
    }
    if(data.gatewayExten){
        sipNumStr += fields.EXTENSION_TYPE_GATEWAY + ':' + data.gatewayExten + ",";
    }
    if (sipNumStr.substr(-1, 1) == ",") {
        sipNumStr = sipNumStr.substr(0, sipNumStr.length - 1);
    }
    data.OwnSipNums = sipNumStr;
    if(data.AutoBusyTime == ''){
        delete data.AutoBusyTime;
    }
    delete data.sipExten;
    delete data.mobileExten;
    delete data.gatewayExten;
    delete data.empNo;
    delete data.accountId;
    delete data.role;
    delete data.LastLoginTime;
    delete data.LastUpdate;
    var ivrData = {
        nodeData: data,
        isStoreDB: false
    }
    IvrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Add or update account_user failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        result.data = data;
        result.success = true;
        callback(result);
    });
}

exports.refreshUser = function (data, session, callback) {
    var queryData = {
        account: data.Account,
        pbx: data.PBX,
        product: 'cc'
    }
    exports.queryUser(queryData, session, function(queryRes){
        callback(queryRes);
    });
}

exports.checkUserInfoRepeat = function(data,session,callback){
    var response = {
        success : false,
        repeatList : []
    };
    var find = {
        account: data.Account  || data.accountId || data.account,
        $or : [
            {displayName:data.displayName},
            {exten:data.exten}
//            {loginName:data.loginName}
        ]
    }
    if(data.email && data.email!=''){
        find.$or.push({email:data.email});
    }
    if(data._id){
        find._id = {$ne : data._id};
    }
    if(data.callerIDNum && data.callerIDNum!=''){
        find.$or.push({callerIDNum:data.callerIDNum});
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(find).toArray(function(err,docs){
        if(err){
            response.message='checkUserInfoRepeat find db error!';
            callback(response);
            return;
        }
        if(docs.length>0){
            var repeatUser = docs[0];
            response.code='400';
            if(repeatUser.displayName == data.displayName){
                response.repeatList.push('name');
            }
            if(repeatUser.exten == data.exten){
                response.repeatList.push('exten');
            }
//            if(repeatUser.loginName == data.loginName){
//                response.repeatList.push('loginName');
//            }
            if(repeatUser.email != ''){
                if(repeatUser.email == data.email){
                    response.repeatList.push('email');
                }
            }
            if(data.callerIDNum && data.callerIDNum!=''){
                var repeatNum = 0;
                for(var i=0;i<docs.length;i++){
                    var repeatU = docs[i];
                    if(repeatU.callerIDNum == data.callerIDNum){
                        repeatNum++;
                    }
                }
                if(repeatNum == 0){
                    if(response.repeatList.length <= 0){
                        response.code='200';
                    }
                    response.success = true;
                    callback(response);
                }else{
                    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({account: data.Account  || data.accountId || data.account,product : "cc"},function(err,oneDoc){
                        if(err){
                            response.message='checkUserInfoRepeat find platform_account_product error!';
                            callback(response);
                            return;
                        }
                        if(!oneDoc.agentCallerIDNumSame || oneDoc.agentCallerIDNumSame <= repeatNum){
                            response.repeatList.push('callerIDNum');
                        }
                        if(response.repeatList.length <= 0){
                            response.code='200';
                        }
                        response.success = true;
                        callback(response);
                    });
                }
            }else{
                if(response.repeatList.length <= 0){
                    response.code='200';
                }
                response.success = true;
                callback(response);
            }
        }else{
            response.code='200';
            response.success = true;
            callback(response);
        }
    });
}

exports.updateUser = function (data, session, callback) {
    var result = {success: false};
    var action = data.action;
    delete data['action'];
    var userId = data._id;
//    if(data.dataMap){
//        var map = data.dataMap;
//        delete data['dataMap'];
//        for(var key in map){
//            data[key] = map[key];
//        }
//    }
    //检查是否有重复的信息（工号，登录名，邮箱，姓名）
    exports.checkUserInfoRepeat(data,session,function(checkRes){
        if(checkRes.code != '200'){
            result.repeatList = checkRes.repeatList;
            callback(result);
            return;
        }
        var session = {};
        if (action === 'add') {
            //add sip sipPeer
            data._id = uuid.generateUuid();
//            data.sipNum = {};
            var userData = {};
            userData.Action = 'PeerAdd';
            userData.Peer = 'User';
            userData.Account = data.Account;
            userData.PBX = data.PBX;
            userData.UserID = data['_id'];
            userData.DisplayName = data.displayName;
//            userData.User = data.loginName;
            data.loginName = data.exten;
            userData.User = data.exten;
            userData.Exten = data.exten;
            userData.Password = data.password;
            data.passwordLastUpdate = new Date().getTime();
            data.passwordLastUpdateTime = utils.getCurrentDate();
            userData.Type = data.type;
            userData.Local = data.mobile;
            userData.AutoBusyTime = '0';
            userData.Version = data.uversion || 'enterprise';
            userData.Email = data.email;
            userData.sipNum = {};
            userData.CallerIDNum = data.callerIDNum;
            if(data.displayName) {
                data.pinyin = cnToSpellUtil.getSpell(data.displayName);
            } else {
                data.pinyin = '';
            }
            if(data.addRole){
                data.role = [data.addRole];
                delete data.addRole;
            }
            data.product = 'cc';

            extensionHandler.saveSip2Acs(userData, session, function (sipRes) {
                if (sipRes.success) {
                    var sipNum = sipRes.sipNum;
                    data.sipExten = sipNum;
//                    data.sipNum.sip = sipNum;
                    //if user have mobilePhone,add local sipPeer
                    var isAddLocalSip = false;
                    if (userData.Local) {
                        isAddLocalSip = true;
                    } else {
                        isAddLocalSip = false;
                    }
                    userData.isAddLocalSip = isAddLocalSip;
                    extensionHandler.saveLocalSip2Acs(userData, session, function (localRes) {
                        if (localRes.success) {
                            var localNum = localRes.localNum;

                            userData.OwnSipNums = fields.EXTENSION_TYPE_SIP + ':' + sipNum;
                            if (userData.Local) {
                                userData.OwnSipNums += ',' + fields.EXTENSION_TYPE_LOCAL + ':' + localNum;
//                                data.sipNum.local = localNum;
                                data.mobileExten = localNum;
                            }

                            data.pbx = data.PBX;
                            delete data.PBX;
//                            data.accountId = data.Account;
                            data.account = data.Account;
                            delete data.Account;
                            data.lastUpdate = Date.parse(new Date());
                            data.imDealCount = 5;
                            data.maxImDealCount = 10;
                            data.minImDealCount = 1;
                            data.maxEmailDealCount = 10;
                            var ivrData = {
                                nodeData: userData,
                                dbData: {
                                    db:'bill',
                                    tableName: fields.DB_PLATFORM_USER,
                                    condition: {
                                        "_id": data._id
                                    },
                                    updateData: data
                                }
                            };
                            IvrHandler.saveOrUpdateIvr(ivrData, session, function (err, ivrRes) {
                                if (!err) {
                                    IvrHandler.reloadIvr({PBX: data.pbx ,Account: data.account, Type:3}, session, function(reloadRes){});
                                    mongo.db('bill').collection(fields.DB_IM_CONTACTS_VERSION).update(
                                        {Account:ivrData.nodeData.Account},{$set:{Account:ivrData.nodeData.Account,Version:utils.getCurrentDateTime()}},{upsert:true});
                                    console.log("add user success!");
                                    result.data = data;
                                    result.success = true;
                                    utils.generateCacheVersion(ivrData.nodeData.Account,"agent");
                                    callback(result);
                                } else {
                                    err = err || new Error('addUser to acs failed!');
                                    logger.app.error(err.stack);
                                    result.success = false;
                                    result.message = err.message;
                                    callback(result);
                                }
                            });
                        } else {
                            result.success = false;
                            result.message = 'Add user local sip failure!';
                            callback(result);
                        }
                    });
                } else {
                    result.success = false;
                    result.message = 'Add user soft phone sip failure!';
                    callback(result);
                }
            });
        } else if (action === 'update') {
            var userData = {};
            userData.Action = 'PeerAdd';
            userData.Peer = 'User';
            userData.Account = data.Account  || data.accountId || data.account;
            userData.PBX = data.PBX || data.pbx;
            userData.UserID = data['_id'];
            userData.DisplayName = data.displayName;
//            userData.User = data.loginName;
            data.loginName = data.exten;
            userData.User = data.exten;
            userData.Exten = data.exten;
            userData.Password = data.password;
            userData.Type = data.type;
            userData.Local = data.mobile;
            userData.Email = data.email;
            userData.CallerIDNum = data.callerIDNum;
            userData.Version = data.uversion|| 'enterprise';
            userData.AutoBusyTime = data.AutoBusyTime;
            data.product = 'cc';

            if(data.displayName) {
                data.pinyin = cnToSpellUtil.getSpell(data.displayName);
            } else {
                data.pinyin = '';
            }

            data.accountId = userData.Account;
            delete data.Account;
            data.pbx = userData.PBX;
            delete data.PBX;
            data.lastUpdate = Date.parse(new Date());

            exports.queryUser({_id: data._id}, session, function (findUserRes) {
                if (!findUserRes.success || findUserRes.list.length < 1) {
                    result.success = false;
                    result.message = 'User not found: ' + data._id;
                    logger.app.error(result.message);
                    return;
                }
                var oldUser = findUserRes.list[0];
                var isAddLocalSip = false;
                var isUpdateLocal = false;
                if (!oldUser.mobileExten && data.mobile) {
                    isAddLocalSip = true;
                } else if(oldUser.mobile != data.mobile){
                    isUpdateLocal = true;
                }
                userData.isAddLocalSip = isAddLocalSip;
                userData.isUpdateLocal = isUpdateLocal;
                userData.sipExten = oldUser.sipExten;
                if(oldUser.gatewayExten){
                    userData.gatewayExten = oldUser.gatewayExten;
                }
                if(oldUser.mobileExten){
                    userData.mobileExten = oldUser.mobileExten;
                }
                extensionHandler.saveLocalSip2Acs(userData, session, function (localRes) {
                    if (!localRes.success) {
                        result.success = false;
                        result.message = 'Add user local sip num failure.';
                        logger.app.error(result.message);
                        callback(result);
                        return;
                    }

                    if (localRes.localNum) {
                        oldUser.mobileExten = localRes.localNum;
//                        oldUser.sipNum.local = localRes.localNum;
                    }
                    var sipNumStr = "";
                    if(oldUser.sipExten){
                        sipNumStr += fields.EXTENSION_TYPE_SIP + ':' + oldUser.sipExten + ",";
                        data.sipExten = oldUser.sipExten;
                    }
                    if(oldUser.mobileExten){
                        sipNumStr += fields.EXTENSION_TYPE_LOCAL + ':' + oldUser.mobileExten + ",";
                        data.mobileExten = oldUser.mobileExten;
                    }
                    if(oldUser.gatewayExten){
                        sipNumStr += fields.EXTENSION_TYPE_GATEWAY + ':' + oldUser.gatewayExten + ",";
                        data.gatewayExten = oldUser.gatewayExten;
                    }
                    if (sipNumStr.substr(-1, 1) == ",") {
                        sipNumStr = sipNumStr.substr(0, sipNumStr.length - 1);
                    }
                    userData.OwnSipNums = sipNumStr;

                    var userId = data._id;
                    delete data._id;
                    utils.removeEmptyProperty(userData);
                    if(!userData.CallerIDNum){
                        userData.CallerIDNum = "";
                    }
                    var updateData = {
                        nodeData: userData,
                        dbData: {
                            db:'bill',
                            tableName: fields.DB_PLATFORM_USER,
                            condition: {
                                "_id": userId
                            },
                            updateData: {'$set':data}
                        }
                    };
                    IvrHandler.saveOrUpdateIvr(updateData, session, function (err, ivrRes) {
                        if (!err) {
                            userData.Type = 3;
                            IvrHandler.reloadIvr(userData, session, function(reloadRes){});
                            mongo.db('bill').collection(fields.DB_IM_CONTACTS_VERSION).update(
                                {Account:userData.Account},{$set:{Account:userData.Account,Version:utils.getCurrentDateTime()}},{upsert:true});
                            console.log("update user success: " + userId);
                            data._id = userId;
                            result.data = data;
                            result.success = true;
                            utils.generateCacheVersion(userData.Account,"agent");
                            callback(result);
                        } else {
                            logger.app.error('update to acs failed: ' + userId, err);
                            result.success = false;
                            result.message = err.message;
                            callback(result);
                        }
                    });
                });
            });
        } else if (action === 'disable') {

        } else {
            result.message = 'unknow user action!';
            callback(result);
        }
    });
}

exports.editUser = function(data, callback) {
    var result = {success:false};
    exports.queryUser({_id:data._id}, null, function(queryResult){
        if(!queryResult.success) {
            callback(queryResult);
            return;
        }
        if(!queryResult.list || queryResult.list.length < 1){
            result.message = 'User not found: ' + nodeUtil.inspect(data);
            callback(result);
            return;
        }
        var user = queryResult.list[0];
        objectUtil.mixin(user, data);
        user.action = 'update';
        exports.updateUser(user, null, function(updateResult){
            if(!updateResult.success){
                callback(updateResult);
                return;
            }
            result.success = true;
            callback(result);
        });
    });
}

exports.enableAgent = function(data, session, callback) {
    var result = {success: false};
    exports.queryUser({_id: data._id}, session, function (findUserRes) {
        if (!findUserRes.success || findUserRes.list.length < 1) {
            result.success = false;
            result.message = 'User not found: ' + data._id;
            return;
        }
        var user = findUserRes.list[0];
        user.status = 'enable';
        user.action = 'update';
        exports.updateUser(user, session, function(enableResult){
            if(!enableResult.success){
                callback(enableResult);
                return;
            }

            result.data = enableResult.data;
            result.success = true;
            utils.generateCacheVersion(session.account.account,"agent");
            callback(result);
        });
    });
}

exports.disableAgent = function(data, session, callback) {
    var result = {success: false};
    exports.queryUser({_id: data._id}, session, function (findUserRes) {
        if (!findUserRes.success || findUserRes.list.length < 1) {
            result.success = false;
            result.message = 'User not found: ' + data._id;
            return;
        }
        var user = findUserRes.list[0];

        if(!user) {
            logger.app.warn('User not found when disable:' + nodeUtil.inspect(data));
            result.success = false;
            return;
        }

        var queryQueueData = {
            Account: data.Account,
            PBX: data.PBX,
            'AssignMembers.agentID': data._id
        }
        skillGroupHandler.queryQueue(queryQueueData, session, function(queueQueryRes) {
            if (!queueQueryRes.success) {
                callback(queueQueryRes);
                return;
            }
            var removeData = {
                agentID: data._id,
                queues: queueQueryRes.list
            }
            skillGroupHandler.removeAgentFromQueues(removeData, session, function(removeRes){
                if(!removeRes.success) {
                    callback(removeRes);
                    return;
                }
                user.status = 'disable';
                var userData = {};
                userData.Action = 'UserRemove';
                userData.Account = user.account;
                userData.PBX = user.pbx;
                userData.User = data._id;

                data.updateTime = dateTimeUtil.getCurrentDate();
                data.status = 'disable';
                var ivrData ={
                    nodeData: userData,
                    dbData: {
                        db:'bill',
                        tableName: fields.DB_PLATFORM_USER,
                        condition: {
                            "_id": data._id
                        },
                        updateData: {'$set':{'status': data.status,
                            updateTime : data.updateTime, lastUpdate:Date.parse(new Date())}}
                    }
                }
                IvrHandler.saveOrUpdateIvr(ivrData, session, function(err, ivrRes){
                    if (err) {
                        logger.app.error(err);
                        result.message = err.message;
                        callback(result);
                        return;
                    }else{
                        data.lastUpdate = Date.parse(new Date());
                        result.data = data;
                        result.success = true;
                        utils.generateCacheVersion(user.account,"agent");
                        callback(result);
                    }
                });
            });
        });
    });
}

exports.checkBatchAddAgentInfoRepeat = function(data,session,callback){
    var response = {
        success : false
    };
    var find = {
        account : data.Account,
        exten : {
            $gte:data.exten,
            $lte:parseInt(data.exten)+(parseInt(data.count)-1)+''
        }
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(find).toArray(function(err,docs){
        if(err){
            response.message='checkUserInfoRepeat find db error!';
            callback(response);
            return;
        }
        if(docs.length>0){
            response.code='400';
        }else{
            response.code='200';
        }
        response.success = true;
        callback(response);
    });
}

exports.batchAddAgent = function(data, session, callback) {
    var result = {success: false};
    exports.checkBatchAddAgentInfoRepeat(data,session, function(checkRes){
        if(!checkRes.success){
            result.reason = checkRes.message;
            callback(result);
            return;
        }
        if(checkRes.code != '200'){
            result.reason = '新增的工号区间与现有座席重复，请修改！';
            callback(result);
            return;
        }else{
            // batch add agent on background, response redirectly.
            result.success = true;
            result.code = 'agent.batchRequested';
            utils.generateCacheVersion(data.Account,"agent");
            callback(result);

            // batch add agent
            var count = parseInt(data.count);
            var userDBData = {
                account: data.Account,
                pbx: data.PBX,
                type: 'agent',
                mobile: '',
                email: '',
                status: 'enable',
                product: 'cc',
                uversion: data.uversion,
                role: [data.batchRole],
                lastUpdate: Date.parse(new Date()),
                imDealCount : 5,
                maxImDealCount : 10,
                minImDealCount : 1,
                maxEmailDealCount: 10
            }
            var userData = {};
            userData.Peer = 'User';
            userData.Account = userDBData.account;
            userData.PBX = userDBData.pbx;
            userData.Type = userDBData.type;
            userData.Local = userDBData.mobile;
            userData.AutoBusyTime = '0';
            userData.Version = userDBData.uversion||'enterprise';
            userData.Email = userDBData.email;
//            if (data.callerIDNum) {
//                data.callerIDNum = parseInt(data.callerIDNum);
//            } else {
//                data.callerIDNum = '';
//            }
            data.exten = parseInt(data.exten);
            data.userData =  userData,
            data.userDBData = userDBData;
            data.count = count;
            data.ind = 0;

            logger.app.info("Batch add user start.");
            recursionAddUser(data, session, function(){
                logger.app.info("Batch add user finished.");
                IvrHandler.reloadIvr({PBX: userData.PBX ,Account: userData.Account,Type:3}, session, function(reloadRes){});
                mongo.db('bill').collection(fields.DB_IM_CONTACTS_VERSION).update(
                    {Account:data.userData.Account},{$set:{Account:data.userData.Account,Version:utils.getCurrentDateTime()}},{upsert:true});
            });
        }
    });
}

exports.removeGatewaySipNum = function (data, session, callback) {
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({'gatewayExten': data.sip}, {'$unset': {'gatewayExten': 1}},
        {w:1, multi:true}, function (err, dbRes) {
            if (err) {
                result.message = 'Remove gateway sip num failure: ' + data.sip;
                logger.app.error(result.message, err);
                callback(result);
                return;
            }
            result.success = true;
            callback(result);
        });
}

exports.addGatewaySipNum = function (data ,session, callback) {
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({"_id": data.userID}, {"$set": {'gatewayExten': data.sip}}, function (err, dbRes) {
        if (err) {
            result.message = 'Add gateway sip num failure: ' + data.sip;
            logger.app.error(result.message, err);
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });
}

function recursionAddUser(data, session, callback) {
    var userDBData = data.userDBData;
    var userData = data.userData;

    if (data.ind >= data.count) {
        callback();
    } else {
        userDBData._id = uuid.generateUuid();
        if (data.callerIDNum) {
            var hasZero = '';
            if(data.callerIDNum.substr(0,1) == '0'){
                hasZero = '0';
            }
            userDBData.callerIDNum = hasZero + (parseInt(data.callerIDNum) + data.ind);
        } else {
            userDBData.callerIDNum = '';
        }
        userDBData.exten = (data.exten + data.ind) + '';
        userDBData.password = userDBData.exten;
        userDBData.displayName = userDBData.exten;
        userDBData.loginName = userDBData.exten;
        userDBData.pinyin = cnToSpellUtil.getSpell(userDBData.displayName);
//        userDBData.sipNum = {};

        userData.Action = 'PeerAdd';
        userData.UserID = userDBData['_id'];
        userData.DisplayName = userDBData.displayName;
        userData.User = userDBData.loginName;
        userData.Exten = userDBData.exten;
        userData.Password = userDBData.password;
        userData.CallerIDNum = userDBData.callerIDNum;
        extensionHandler.saveSip2Acs(userData, session, function (sipRes) {
            if (sipRes.success) {
                var sipNum = sipRes.sipNum;
//                userDBData.sipNum.sip = sipNum;
                userDBData.sipExten = sipNum;
                userData.OwnSipNums = fields.EXTENSION_TYPE_SIP + ':' + sipNum;
                var ivrData = {
                    nodeData: userData,
                    dbData: {
                        db:'bill',
                        tableName: fields.DB_PLATFORM_USER,
                        condition: {
                            "_id": userDBData._id
                        },
                        updateData: userDBData
                    }
                };
                IvrHandler.saveOrUpdateIvr(ivrData, session, function (err, ivrRes) {
                    if (!err) {
                        logger.app.info("User [" + userDBData.name + "] of account [" + userDBData.accountId + "] added.");
                    } else {

                        logger.app.error("User [" + userDBData.name + "] of account [" + userDBData.accountId + "] add failure!");
                    }
                    data.ind += 1;
                    recursionAddUser(data, session, callback);
                });
            }
        });
    }
}

exports.editUserForIm = function (data, callback) {
    var result = {success:false};
    exports.queryUser({_id:data._id}, null, function(queryResult){
        if(!queryResult.success) {
            callback(queryResult);
            return;
        }
        if(!queryResult.list || queryResult.list.length < 1){
            result.message = 'User not found: ' + nodeUtil.inspect(data);
            callback(result);
            return;
        }
        var user = queryResult.list[0];
        objectUtil.mixin(user, data);
        user.action = 'update';
        exports.updateUser(user, null, function(updateResult){
            if(!updateResult.success){
                callback(updateResult);
                return;
            }
            result.success = true;
            callback(result);
        });
    });
}

exports.openThirdPartyEditUser = function (data, callback) {
    var result = {success:false};
    if(!data.account || !data.exten){
        result.message = 'account or exten not found!';
        callback(result);
        return;
    }
    exports.queryUser({account: data.account, exten:data.exten}, null, function(queryResult){
        if(!queryResult.success) {
            callback(queryResult);
            return;
        }
        if(!queryResult.list || queryResult.list.length < 1){
            result.message = 'User not found: ' + nodeUtil.inspect(data);
            callback(result);
            return;
        }
        var newUser = {};
        if(data.displayName)
            newUser.displayName = data.displayName;
        if(data.mobile || data.mobile == "")
            newUser.mobile = data.mobile;
        if(data.email)
            newUser.email = data.email;
        if(data.password)
            newUser.password = data.password;
        if(data.AutoBusyTime)
            newUser.AutoBusyTime = data.AutoBusyTime;
        var user = queryResult.list[0];
        objectUtil.mixin(user, newUser);
        user.action = 'update';
        exports.updateUser(user, null, function(updateResult){
            if(!updateResult.success){
                callback(updateResult);
                return;
            }
            data.logTime = utils.getCurrentDate();
            mongo.db('cc').collection('cc_server_openThirdPartyEditUser_log').insert(data);
            result.success = true;
            callback(result);
        });
    });
}