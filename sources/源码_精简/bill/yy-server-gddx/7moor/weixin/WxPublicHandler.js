var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var appHttp = require("appHttp");
var constants = require(__baseDir + "/7moor/utils/Constants");
var serviceHandler = require(__baseDir + "/7moor/weixin/WxServiceHandler");

var handler = {

        newVoicemail: function (data, callback) {
            var result = {success: false};
            var id = data.id;
            mongo.db().collection(constants.DB.platform_voicemail).findOne({_id: id}, function (err, voicemail) {
                if (voicemail) {
                    mongo.db().collection(constants.DB.platform_weixin_user).findOne({user: voicemail.to, online: true}, function (err, user) {
                        if (user) {
                            var condition = {account: user.account, to: user.user, read: false};
                            mongo.db().collection(constants.DB.platform_voicemail).count(condition, function (err, count) {
                                if (!err) {
                                    serviceHandler.sendServiceTextMsg("您有一条新的电话留言来自[" + (voicemail.fromUser || voicemail.fromExten) + "],您目前还有[" + count + "]条未听取留言！", user._id);
                                    result.success = true;
                                    callback(result);
                                } else {
                                    logger.app.warn("get voice mail count  error!", err);
                                    result.message = "get voice mail count  error";
                                    callback(result);
                                }
                            });
                        } else {
                            result.success = true;
                            callback(result);
                        }
                    });
                } else {
                    logger.app.warn("can not found voicemail by id!", err || new Error());
                    result.message = "can not found voicemail by id!";
                    callback(result);
                }
            });
        }
//        ,
//        newVoicemail: function (data, callback) {
//            var result = {success: false};
//            var id = data.id;
//            mongo.db().collection(constants.DB.platform_voicemail).findOne({_id: id}, function (err, voicemail) {
//                if (voicemail) {
//                    var url = voicemail.fileServer + "/" + voicemail.recorder;
//                    appHttp.downloadFile(url, function (err, filename) {
//                        if (!err) {
//                            serviceHandler.uploadMedia(filename, "voice", ".mp3", function (err, data) {
//                                if (!err) {
//                                    data = data + "";
//                                    data = JSON.parse(data);
//                                    if (data.media_id) {
//                                        mongo.db().collection(constants.DB.platform_voicemail).update({_id: id}, {$set: {mediaId: data.media_id}}, {w: 1}, function (err) {
//                                            if (!err) {
//                                                mongo.db().collection(constants.DB.platform_weixin_user).findOne({user: voicemail.to, online: true}, function (err, user) {
//                                                    if (user) {
//                                                        serviceHandler.sendServiceTextMsg("您有一条新的留言！", user._id);
//                                                    }
//                                                    result.success = true;
//                                                    callback(result);
//                                                });
//                                            } else {
//                                                logger.app.warn("update record error!", err || new Error());
//                                                result.message = "update record error";
//                                                callback(result);
//                                            }
//                                        });
//                                    } else {
//                                        logger.app.warn("upload file error!", err || new Error());
//                                        result.message = "upload file error";
//                                        callback(result);
//                                    }
//                                } else {
//                                    logger.app.warn("upload file error!", err || new Error());
//                                    result.message = "upload file error";
//                                    callback(result);
//                                }
//                            })
//                        } else {
//                            logger.app.warn("download file error!", err || new Error());
//                            result.message = "download file error";
//                            callback(result);
//                        }
//                    });
//                } else {
//                    logger.app.warn("can not found voicemail by id!", err || new Error());
//                    result.message = "can not found voicemail by id!";
//                    callback(result);
//                }
//            });
//        }
    };

module.exports = handler;