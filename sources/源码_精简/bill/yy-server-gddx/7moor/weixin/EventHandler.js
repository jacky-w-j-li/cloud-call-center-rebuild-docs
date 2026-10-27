var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var mongo = require('appDb/MongoDb');
var serviceHandler = require(__baseDir + "/7moor/weixin/WxServiceHandler");
var appHttp = require("appHttp");

var events = {
    /**
     * 关注
     * @param data
     * @param callback
     */
    subscribe: function (data, callback) {
        var user = {
            _id: data.FromUserName,
            createTime: utils.DateTime.getCurrentDateTime(),
            status: constants.weixinUserStatus.new
        };
        mongo.db().collection(constants.DB.platform_weixin_user).insert(user, {w: 1}, function () {
        });
        var msg = {
            ToUserName: data.FromUserName,
            FromUserName: data.ToUserName,
            CreateTime: utils.DateTime.getCurrentTimestamp(),
            MsgType: "text",
            Content: "欢迎关注合力亿捷云服务，合力亿捷让沟通更简单，更高效。您必须绑定您的合力账号，才能开通合力亿捷微信服务。"
        };

        callback(null, msg);
    },
    /**
     * 取消关注
     * @param data
     * @param callback
     */
    unsubscribe: function (data, callback) {
        mongo.db().collection(constants.DB.platform_weixin_user).remove({_id: data.FromUserName}, {w: 1}, function () {
        });
        //TODO
        callback(null);
    },
    /**
     * 点击菜单
     */
    CLICK: function (data, callback) {
        var key = data.EventKey;
        var userId = data.FromUserName;
        if (key) {
            if (key == "bind") {
                mongo.db().collection(constants.DB.platform_weixin_user).findOne({_id: userId}, function (err, dbUser) {
                    if (!err) {
                        if (dbUser.status == constants.weixinUserStatus.new) {
                            mongo.db().collection(constants.DB.platform_weixin_user).update({_id: userId}, {$set: {textStatus: "bind"}}, {w: 1}, function () {
                            });
                            var msg = {
                                ToUserName: data.FromUserName,
                                FromUserName: data.ToUserName,
                                CreateTime: utils.DateTime.getCurrentTimestamp(),
                                MsgType: "text",
                                Content: "请输入您要绑定的合力亿捷账号,直接发送账号即可！name@company"
                            };
                            callback(null, msg);
                        } else if (dbUser.status == constants.weixinUserStatus.waitValid) {
                            mongo.db().collection(constants.DB.platform_weixin_user).update({_id: userId}, {$set: {status: constants.weixinUserStatus.new, textStatus: "bind"}}, {w: 1}, function () {
                            });
                            var msg = {
                                ToUserName: data.FromUserName,
                                FromUserName: data.ToUserName,
                                CreateTime: utils.DateTime.getCurrentTimestamp(),
                                MsgType: "text",
                                Content: "请输入您要绑定的合力亿捷账号,直接发送账号即可！name@company"
                            };
                            callback(null, msg);
                        } else if (dbUser.status == constants.weixinUserStatus.valid) {
                            mongo.db().collection(constants.DB.platform_account).findOne({_id: dbUser.account}, function (err, dbAccount) {
                                if (!err && dbAccount) {
                                    mongo.db().collection(constants.DB.platform_user).findOne({_id: dbUser.user}, function (err, linkedUser) {
                                        if (!err && linkedUser) {
                                            var userName = linkedUser.exten + "@" + dbAccount.name;
                                            mongo.db().collection(constants.DB.platform_weixin_user).update({_id: userId}, {$set: {textStatus: "bind"}}, {w: 1}, function () {
                                            });
                                            var msg = {
                                                ToUserName: data.FromUserName,
                                                FromUserName: data.ToUserName,
                                                CreateTime: utils.DateTime.getCurrentTimestamp(),
                                                MsgType: "text",
                                                Content: "当前已绑定账户【" + userName + "】！,重复绑定会取消之前绑定账户，请输入您要绑定的合力亿捷账号,直接发送账号即可！name@company"
                                            };
                                            callback(null, msg);
                                        } else {
                                            logger.app.warn("get weixin user link user error", err || new Error());
                                            callback(new Error());
                                        }
                                    });
                                } else {
                                    logger.app.warn("get weixin user link account error", err || new Error());
                                    callback(new Error());
                                }
                            });

                        } else {
                            logger.app.warn("weixin user info unsupport status[" + dbUser.status + "]!", err);
                            callback(new Error());
                        }
                    } else {
                        logger.app.warn("query weixin user info error!", err);
                        callback(new Error());
                    }
                });
            } else if (key == "findbind") {
                //reset textStatus
                mongo.db().collection(constants.DB.platform_weixin_user).update({_id: userId}, {$set: {textStatus: "findbind"}}, {w: 1}, function () {
                });
                mongo.db().collection(constants.DB.platform_weixin_user).findOne({_id: userId}, function (err, findUser) {
                    if (!err && findUser) {
                        var msg = {
                            ToUserName: data.FromUserName,
                            FromUserName: data.ToUserName,
                            CreateTime: utils.DateTime.getCurrentTimestamp(),
                            MsgType: "text"
                        };
                        if (findUser.status == constants.weixinUserStatus.valid) {
                            mongo.db().collection(constants.DB.platform_account).findOne({_id: findUser.account}, function (err, dbAccount) {
                                if (!err && dbAccount) {
                                    mongo.db().collection(constants.DB.platform_user).findOne({_id: findUser.user}, function (err, linkedUser) {
                                        if (!err && linkedUser) {
                                            var userName = linkedUser.exten + "@" + dbAccount.name;
                                            msg.Content = "当前已绑定账户【" + userName + "】！";
                                            callback(null, msg);
                                        } else {
                                            logger.app.warn("get weixin user link user error", err || new Error());
                                            callback(new Error());
                                        }
                                    });
                                } else {
                                    logger.app.warn("get weixin user link account error", err || new Error());
                                    callback(new Error());
                                }
                            });
                        } else {
                            msg.Content = "您还没绑定账户，请点击绑定账户，进行绑定。";
                            callback(null, msg);
                        }
                    } else {
                        logger.app.warn("query weixin user info error!", err);
                        callback(new Error());
                    }
                });
            } else if (key == "voiceMail") {
                //reset textStatus
                mongo.db().collection(constants.DB.platform_weixin_user).update({_id: userId}, {$set: {textStatus: "voiceMail"}}, {w: 1}, function () {
                });
                mongo.db().collection(constants.DB.platform_weixin_user).findOne({_id: userId}, function (err, findUser) {
                    if (!err && findUser) {
                        var msg = {
                            ToUserName: data.FromUserName,
                            FromUserName: data.ToUserName,
                            CreateTime: utils.DateTime.getCurrentTimestamp(),
                            MsgType: "text"
                        };
                        if (findUser.status == constants.weixinUserStatus.valid) {
                            var condition = {account: findUser.account, to: findUser.user, read: false};
                            mongo.db().collection(constants.DB.platform_voicemail).count(condition, function (err, count) {
                                if (!err) {
                                    if (count) {
                                        msg.Content = "你当前共有[" + (count) + "]条未听留言,以下是最近一次留言！";
                                        mongo.db().collection(constants.DB.platform_voicemail).findOne(condition, {sort: {beginTime: -1}}, function (err, voicemail) {
                                            if (voicemail) {
                                                var fromuser = voicemail.fromUser || voicemail.fromExten;
                                                var time = voicemail.beginTime;

                                                var fileServer = voicemail.fileServer;
                                                if (fileServer.substring(fileServer.length - 1, fileServer.length) != "/") fileServer += "/";
                                                var url = fileServer + voicemail.recorder

                                                var textMsg = "来自[" + fromuser + "]在[" + time + "]给您的留言！";

                                                msg.Content += textMsg;
                                                callback(null, msg);

                                                appHttp.downloadFile(url, function (err, filename) {
                                                    if (!err) {
                                                        serviceHandler.uploadMedia(filename, "voice", ".mp3", function (err, data) {
                                                            if (!err) {
                                                                data = data + "";
                                                                data = JSON.parse(data);
                                                                if (data.media_id) {
                                                                    serviceHandler.sendServiceVoiceMsg(data.media_id, userId);
                                                                } else {
                                                                    logger.app.warn("upload file error!", err || new Error());
                                                                }
                                                            } else {
                                                                logger.app.warn("upload file error!", err || new Error());
                                                            }
                                                        });
                                                    } else {
                                                        logger.app.warn("download file error!", err || new Error());
                                                    }
                                                });
//                                                serviceHandler.sendMusicMsg(null, userId, url, url, fromuser, time);
                                                mongo.db().collection(constants.DB.platform_voicemail).update({_id: voicemail._id}, {$set: {read: true}});
                                            } else {
                                                logger.app.error("find data from db error!", err || new Error());
                                                callback(new Error());
                                            }
                                        });
                                    } else {
                                        msg.Content = "您目前没有留言！";
                                        callback(null, msg);
                                    }
                                } else {
                                    logger.app.error("find data from db error!", err);
                                    callback(new Error());
                                }
                            });
                        } else {
                            msg.Content = "您还没绑定账户，请点击绑定账户，进行绑定。";
                            callback(null, msg);
                        }
                    } else {
                        logger.app.warn("query weixin user info error!", err);
                        callback(new Error());
                    }
                });
            } else if (key == "sign") {
                //reset textStatus
                mongo.db().collection(constants.DB.platform_weixin_user).update({_id: userId}, {$set: {textStatus: "sign"}}, {w: 1}, function () {
                });
                mongo.db().collection(constants.DB.platform_weixin_user).findOne({_id: userId}, function (err, findUser) {
                    if (!err && findUser) {
                        var msg = {
                            ToUserName: data.FromUserName,
                            FromUserName: data.ToUserName,
                            CreateTime: utils.DateTime.getCurrentTimestamp(),
                            MsgType: "text"
                        };
                        if (findUser.status == constants.weixinUserStatus.valid) {
                            mongo.db().collection(constants.DB.platform_weixin_user).update({_id: userId}, {$set: {online: true, flushTime: utils.DateTime.getCurrentTimestamp()}});
                            msg.Content = "您已成功签到。";
                            callback(null, msg);
                        } else {
                            msg.Content = "您还没绑定账户，请点击绑定账户，进行绑定。";
                            callback(null, msg);
                        }
                    } else {
                        logger.app.warn("query weixin user info error!", err);
                        callback(new Error());
                    }
                });
            }
        } else {
            logger.app.warn("weixin click event: eventKey is empty!", new Error());
            callback(new Error("weixin click event: eventKey is empty!"));
        }
    }
}


var handler = {
    handle: function (data, callback) {
        var event = data.Event;
        if (events[event]) {
            events[event](data, callback);
        } else {
            logger.app.warn("can not process event[" + event + "]", new Error(""));
            callback(new Error(""));
        }
    }
};


module.exports = handler;
