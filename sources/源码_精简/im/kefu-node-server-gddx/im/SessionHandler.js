var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/im/common/Fields');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var crypto = require('crypto');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;

exports.disconnectSession = function (data, callback) {
    var condition = {
        socketId: data.socketId,
        port: data.port +"",
        serverIp: data.serverIp
    };
    //if(data.manual && data.sid){
    //    condition = {_id: data.sid};
    //}
    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne(condition, function (err, doc) {
        try {
            condition._id = doc._id;
            mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).updateOne(condition,{$set:{disconnTime:utils.getCurrentDate(),breakTime: utils.getCurrentDateTime(), isBreak: true}}, function (err1) {
                if (!err1) {
                    if(doc){
                        var reqData = {
                            sid: doc._id,
                            account: doc.account,
                            accessId: doc.accessId,
                            platform: doc.platform
                        };
                        callback(null, reqData);
                    }else{
                        callback("404 not found record[socketId:" + data.socketId + ",port:" + data.port + ",serverIp:" + data.serverIp);
                    }
                } else {

                    logger.app.error("disconnect a session error[socketId:" + data.socketId + ",port:" + data.port + ",serverIp:" + data.serverIp+"---->"+err1);
                    callback("disconnect a session error[socketId:" + data.socketId + ",port:" + data.port + ",serverIp:" + data.serverIp);
                }
            });
        } catch (e) {
            logger.app.error("disconnect a session err:"+e);
        }
    });
};



exports.createSession = function (data, callback) {
    var accessId = data.accessId;
    var condition = {
        accessId: accessId
    };
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne(condition, function (err, imconfig) {
        try {
            if (!err && imconfig && imconfig.account) {
                if (data.sid && data.sid != "undefined") {
                    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne(
                        {_id: data.sid},function (err, r) {
                            if (!err) {
                                if(r){
                                    var diffTime = utils.DateTime.getDifferenceTime(utils.getCurrentDate(), r.loginTime);
                                    if(!data.isSelfDefine && diffTime > 7 * 24 * 3600){
                                        var result = {
                                            success: false,
                                            message: "session is invalid[" + data.sid + "]"
                                        };
                                        callback(result);
                                    }else{
                                        mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).updateOne({_id: data.sid},
                                            {$set: {socketId: data.socketId, port:data.port,serverIp: data.serverIp, isBreak: false, updatedTime: utils.getCurrentDate()}},{w:1}, function(err){
                                                if(!err){
                                                    var result = {
                                                        success: true,
                                                        message: "update session success",
                                                        sid: r._id,
                                                        socketId: r.socketId,
                                                        account: imconfig.account,
                                                        accessId: r.accessId,
                                                        companyName: imconfig.companyName,
                                                        showAgentName:imconfig.showAgentName,
                                                        cssStyle:imconfig.cssStyle,
                                                        companyLogo:imconfig.companyLogo,
                                                        robot:imconfig.robot,
                                                        nickName:r.username,
                                                        seoSource: data.seoSource,
                                                        seoKeywords: data.seoKeywords,
                                                        ip: data.ip
                                                    };
                                                    callback(result);
                                                    //完结上一个未结束的会话
                                                    if(!data.lastSocketId){
                                                        var finishOldSession = {};
                                                        finishOldSession.sid = r.sid;
                                                        finishOldSession.socketId = r.socketId;
                                                        finishOldSession.port = r.port;
                                                        finishOldSession.type = "finish";
                                                        var url = config.imUrl || "";
                                                        url = url.replace("\$1", r.serverIp);
                                                        url = url.replace("\$2", r.port);
                                                        httpProvider.sendPost(url, "json=" + JSON.stringify(finishOldSession), function (err, response) {
                                                            if (err) {
                                                                logger.app.error("push sysmsg error:"+err);
                                                            }
                                                        });
                                                    }
                                                }else{
                                                    var result = {
                                                        success: false,
                                                        message: "update session socketid err[" + data.sid + "]"
                                                    };
                                                    callback(result);
                                                    logger.app.error("update session socketid err[" + data.sid + "]",err);
                                                }
                                            });
                                    }

                                }else{
                                    if(data.isSelfDefine){
                                        createNewSession(data,imconfig, callback);
                                    }else{
                                        var result = {
                                            success: false,
                                            message: "not found session[" + data.sid + "]"
                                        };
                                        callback(result);
                                    }
                                }
                            } else {
                                var result = {
                                    success: false,
                                    message: "update session socketid err[" + data.sid + "]"
                                };
                                callback(result);
                                logger.app.error("find session error[" + data.sid + "]" ,err);
                            }
                        });
                } else {
                    createNewSession(data,imconfig,callback);
                }

            } else {
                logger.app.error("not found account by accessId[" + accessId + "]", err);
                callback({success: false, message: "invalid accessId"});
            }
        } catch (e) {
            logger.app.error("[func createSession]", e);
        }
    });
};


function createNewSession(data, imconfig, callback) {
    console.log(data);
    var sid = undefined;
    var username = undefined;
    var otherParams = {};
    if(data.otherParams){
        otherParams = JSON.parse(data.otherParams);
    }

    if(data.isSelfDefine){
        sid = data.sid;
        username = otherParams.nickName || data.sid;
    }else{
        sid = utils.UUID.generateUuid();
        username = createRandomUserName(imconfig.account);
    }
    var insertData = {
        _id: sid,
        platform: data.platform,
        loginTime: utils.getCurrentDate(),
        account: imconfig.account,
        accessId: data.accessId,
        socketId: data.socketId,
        port: data.port,
        serverIp: data.serverIp, //分配给客户的socket服务ip
        isBreak: false,
        ip:data.ip, //客户ip
        updatedTime: utils.getCurrentDate(),
        username: decodeURIComponent(username)
    };
    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).insertOne(insertData, function (err) {
        if (err) {
            var result = {
                success: false,
                message: "create session err"
            };
            callback(result);
        } else {
            var result = {
                success: true,
                message: "create session success",
                sid: sid,
                socketId: data.socketId,
                account: imconfig.account,
                accessId: data.accessId,
                companyName: imconfig.companyName,
                showAgentName:imconfig.showAgentName,
                cssStyle:imconfig.cssStyle,
                companyLogo:imconfig.companyLogo,
                robot:imconfig.robot,
                nickName:encodeURIComponent(insertData.username),
                isNewVisitor: true,
                seoSource: data.seoSource,
                seoKeywords: data.seoKeywords,
                ip: data.ip
            };
            callback(result);
        }
    });
}

function createRandomUserName(account){
    var username = "";
    var numbersAndChars = "0123456789abcdefghjlnprstuvwxyzABCDEFGHIKLMNPQRSTUVWXYZ~_-";
    var accountChars = "qimoOrkejI";

    var pattern = new RegExp("^N(0{0,})");
    var result = pattern.exec(account);
    var accountNum = account.replace(result[0],"");

    for(var i=0; i<accountNum.length; i++){
        username = username + accountChars.charAt(accountNum[i]);
    }

    for(var j=0; j<6; j++){
        var id = Math.ceil(Math.random() * 54);
        username = username + numbersAndChars.charAt(id);
    }
    return username;
}

function cipher(algorithm, key, data) {
    var encrypted = "";
    var cip = crypto.createCipher(algorithm, key);
    encrypted += cip.update(data, 'binary', 'hex');
    encrypted += cip.final('hex');
    return encrypted;
}

exports.checkSession = function (sid, callback) {
    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne({_id: sid}, function (err, result) {
        if (!err && result && result._id == sid) {
            if(result.isBreak == true){
                if(utils.DateTime.getDifferenceTime(utils.getCurrentDate(), result.updatedTime) < 300){
                    mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).updateOne({_id: sid}, {$set:{isBreak: false}},function(err){
                        if(!err){
                            callback(null, result);
                        }else{
                            logger.app.error("update session field[isBreak=false] error", err);
                            callback(err);
                        }
                    });
                }else{
                    callback("会话失效，请重新打开窗口进行咨询");
                }
            }else{
                callback(null, result);
            }

        } else {
            logger.app.error("not found session", err);
            callback(err || new Error("not found session"));
        }
    });
};


exports.checkConnection = function (id, callback) {


    //mongo.db().collection(fields.DB_CONNECTION_SESSION).findOne({_id: id}, function (err, result) {
    //    if (!err && result && result._id == id) {
    //        if (result.isBreak) {
    //            if (utils.getCurrentDateTime() - result.breakTime > 60000 * 60 * 24) {
    //                mongo.db().collection(fields.DB_CONNECTION_SESSION).remove({_id: id});
    //                callback(err || new Error("404 Connection not found!"));
    //                return;
    //            }
    //        }
    //        callback(null, result);
    //        mongo.db().collection(fields.DB_CONNECTION_SESSION).update({_id: id}, {$set: {timeFlush: utils.DateTime.getCurrentTimestamp()}});
    //    } else {
    //        callback(err || new Error("404 Connection not found!"));
    //    }
    //});
}


exports.breakConnection = function (data, connection, callback) {
    var result = {
        Succeed: false
    }
    mongo.db().collection(fields.DB_CONNECTION_SESSION)
        .update({_id: connection._id}, {$set: {isBreak: true, breakTime: utils.getCurrentDateTime()}}, function (err) {
            if (!err) {
                result.Succeed = true;
                callback(result);
            } else {
                result.Message = 'break session failed!';
                callback(result);
            }
        });
}

exports.breakConnectionByIoSession = function (data, callback) {
    var result = {
        Succeed: false
    }
    mongo.db().collection(fields.DB_CONNECTION_SESSION)
        .update({ioSessionId: data.IoSessionId}, {
            $set: {
                isBreak: true,
                breakTime: utils.getCurrentDateTime()
            }
        }, function (err) {
            if (!err) {
                result.Succeed = true;
                callback(result);
            } else {
                result.Message = 'break session by ioSession failed!';
                callback(result);
            }
        });
}


exports.getConnection = function (data, connection, callback) {
    var result = {
        Succeed: false
    }
    mongo.db().collection(fields.DB_CONNECTION_SESSION).findOne({userId: data.userId}, function (err, doc) {
        if (!err) {
            if (doc) {
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

module.exports.logoff = function (action, connection, callback) {
    var result = {
        Succeed: false
    }
    var find = {
        _id: connection.user._id
    }
    var update = {
        $unset: {
            im_apnsDeviceId: 1
        }
    }
    mongo.platformDb().collection(fields.DB_PLATFORM_USER).update(find, update, function (err) {
        if (err) {
            result.Message = 'logoff failed!';
        } else {
            result.Succeed = true;
        }
        callback(result);
    })
};