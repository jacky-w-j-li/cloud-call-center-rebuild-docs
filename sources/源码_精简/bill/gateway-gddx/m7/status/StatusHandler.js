/**
 * Created by zhangyang on 15/5/4.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig').conf;
var fields = require(__baseDir + '/m7/common/Fields');
var httpProvider = require("appHttp");
var async = require('async');

var handler = {
    mailStatus: function (data, callback) {
        var result = {success: false};
        var _id = data._id;
        var update = {};
        if (data.status) update.status = data.status;
        if (data.user) update.user = data.user;
        mongo.db().collection(fields.DB_APP_MAIL).update({_id: _id}, {$set: update}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                result.message = "update status exception!";
                callback(result);
            }
        });
    },
    weixinStatus: function (data, callback) {
        var result = {success: false};
        var _id = data._id;
        var update = {};
        if (data.status) update.status = data.status;
        if (data.user) update.user = data.user;
        if (update.user) {
            _impl.flushUserStatus(_id, "undeal");
        } else {
            _impl.flushUserStatus(_id, "leak");
        }

        mongo.db().collection(fields.DB_APP_WEIXIN).update({_id: _id}, {$set: update}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                result.message = "update status exception!";
                callback(result);
            }
        });
    },
    imStatus: function (data, callback) {
        var result = {success: false};
        var _id = data._id;
        var update = {};
        if (data.status) update.status = data.status;
        if (data.user) update.user = data.user;
        mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).update({_id: _id}, {$set: update}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                result.message = "update status exception!";
                callback(result);
            }
        });
    },

    webImStatus: function (data, callback) {
        if (data.list && data.list.length > 0) {
            _impl.pushSysMsgToCustomerBatch(data.list);
        } else if (data.operation && data.user) {
            _impl.pushSysMsgToCustomer(data);
        }
        callback({success: true});
        //if(update.user){
        //    _impl.flushWebImUserStatus(update, "undeal");
        //}else{
        //    _impl.flushWebImUserStatus(update, "leak");
        //}
        //
        //mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).update({_id: _id}, {$set: update}, function (err) {
        //    if (!err) {
        //        result.success = true;
        //        callback(result);
        //    } else {
        //        result.message = "update status exception!";
        //        callback(result);
        //    }
        //});
    }


};

var _impl = {
    flushUserStatus: function (id, status) {
        mongo.db().collection(fields.DB_APP_WEIXIN).findOne({_id: id}, function (err, dbWx) {
            if (!err && dbWx) {
                var userId = dbWx.userID + "_" + dbWx.account;
                mongo.db().collection(fields.DB_APP_WEIXIN_USER).update({_id: userId}, {
                    $set: {status: status},
                    $inc: {msgNum: 1}
                });
            } else {
                logger.app.warn("weixin [" + id + "] not found !", new Error());
            }
        });
    },

    flushWebImUserStatus: function (data, status) {
        var updateFields = {
            status: status
        };
        if (data.user) {
            updateFields.owner = data.user;
        }
        mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).update({_id: data.sid}, {
                $set: updateFields,
                $inc: {msgNum: 1}
            }
        );
    },

    pushSysMsgToCustomer: function (data) {
        var url = config.imPushUrl;
        var msg = data;
        msg.action = "sendSysMsg";
        if (data.operation == "robot") {
            if (data.initSuccess) {
                msg.displayName = "机器人小智";
                msg.exten = "机器人小智";
            }
            httpProvider.sendPost(url, "data=" + JSON.stringify(msg), function (err, response) {
                if (err) {
                    logger.app.error("push sysmsg error:" + err);
                }
            });
            return;
        }

        if(data.operation == "offline" || data.operation == "online" || data.operation == "queueNum" || data.operation == "typeNotice"){
            httpProvider.sendPost(url, "data=" + JSON.stringify(msg), function (err, response) {
                if (err) {
                    logger.app.error("push sysmsg error:" + err);
                }
            });
            return;
        }
        mongo.db("bill").collection(fields.DB_APP_PLATFORM_USER).findOne({_id: data.user}, function (err, user) {
            if (!err && user) {
                var url = config.imPushUrl;
                msg.exten = user.exten;
                msg.displayName = user.displayName;
                logger.app.info("push sysmsg url:" + url + JSON.stringify(msg));
                httpProvider.sendPost(url, "data=" + JSON.stringify(msg), function (err, response) {
                    if (err) {
                        logger.app.error("push sysmsg error:" + err);
                    }
                });

            } else {
                logger.app.error("没有找到座席：" + err);
            }
        });
        //async.waterfall([
        //    function(callback){
        //        mongo.db("bill").collection(fields.DB_APP_PLATFORM_USER).findOne({_id: data.user}, function(err, user){
        //            if(!err && user){
        //                callback(null, user);
        //            }else{
        //                callback("not found user");
        //            }
        //        });
        //    },
        //    function(user, callback){
        //        mongo.db("cc").collection(fields.DB_APP_KEFU_IM_SESSION).findOne({_id: data.sid}, function(err, session) {
        //            if(!err && session){
        //                var result = {
        //                    accessId: session.accessId,
        //                    displayName: user.displayName,
        //                    exten: user.exten,
        //                    serverIp: session.serverIp,
        //                    port: session.port,
        //                    sid: session._id,
        //                    socketId: session.socketId
        //                };
        //                callback(null, result);
        //            }else{
        //                callback("not found session");
        //            }
        //        });
        //    },
        //    function(result, callback){
        //        mongo.db("cc").collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId:result.accessId}, function(err, imConfig){
        //            if(!err && imConfig){
        //                result.showAgentName = imConfig.showAgentName;
        //                callback(null, result);
        //            }else{
        //                callback("not found im config by accessId["+ result.accessId+"]");
        //            }
        //        });
        //
        //    }
        //], function(err, result){
        //    if(err){
        //        logger.app.error(err);
        //    }else{
        //        var msg = {};
        //        if(result.showAgentName == "1"){
        //            msg.displayName = result.displayName;
        //        }else{
        //            msg.displayName = result.exten;
        //        }
        //        msg.sid = result.sid;
        //        msg.socketId = result.socketId;
        //        msg.port = result.port;
        //        msg.type = data.operation;
        //        var url = config.imUrl || "";
        //        url = url.replace("\$1", result.serverIp);
        //        url = url.replace("\$2", result.port);
        //        httpProvider.sendPost(url, "json=" + JSON.stringify(msg), function (err, response) {
        //
        //            if (err) {
        //                logger.app.error("push sysmsg error:"+err);
        //            }
        //        });
        //    }
        //});


        //mongo.db("bill").collection(fields.DB_APP_PLATFORM_USER).findOne({_id: data.user}, function(err, user){
        //
        //    if(!err && user){
        //        var msg = {};
        //        mongo.db("cc").collection(fields.DB_APP_KEFU_IM_SESSION).findOne({_id: data.sid}, function(err, session){
        //            if(!err && session){
        //                mongo.db("cc").collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId:session.accessId}, function(err, imConfig){
        //                    if(!err && imConfig){
        //                        if(imConfig.showAgentName == "1"){
        //                            msg.displayName = user.displayName;
        //                        }else{
        //                            msg.displayName = user.exten;
        //                        }
        //                        msg.sid = session.sid;
        //                        msg.socketId = session.socketId;
        //                        msg.port = session.port;
        //                        msg.type = "sysMsg";
        //                        var url = config.imUrl || "";
        //                        url = url.replace("\$1", session.serverIp);
        //                        url = url.replace("\$2", session.port);
        //                        httpProvider.sendPost(url, "json=" + JSON.stringify(msg), function (err, response) {
        //                            if (err) {
        //                                logger.app.error("push sysmsg error:"+err);
        //                            }
        //                        });
        //                    }else{
        //                        logger.app.error("not found im config by accessId["+ session.accessId+"]");
        //                    }
        //                });
        //            }else{
        //                logger.app.error("[pushSysMsgToCustomer]not found session");
        //            }
        //        });
        //    }else{
        //        logger.app.error("[pushSysMsgToCustomer]push sysmsg error");
        //    }
        //
        //});


    },

    /**
     * 批量推送
     * @param {Array} arr
     */
    pushSysMsgToCustomerBatch: function (arr) {
        arr.forEach(function (data) {
            if (data.operation && data.user) {
                _impl.pushSysMsgToCustomer(data);
            }
        });
    }
};


module.exports = handler;
