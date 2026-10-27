var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var appHttp = require("appHttp");
var constants = require(__baseDir + "/7moor/utils/Constants");
var fs = require("fs");
var parse = require('url').parse;
var mime = require('mime');


var impl = {
    sendMusicMsgImpl: function (mediaId, toUser, url, hdUrl, title, des) {
        utils.WeixinUtil.getAccessToken(function (err, token) {
            if (!err) {
                var url = "https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=" + token;
                var msg = {
                    "touser": toUser,
                    "msgtype": "music",
                    "music": {
                        "title": title,
                        "description": des,
                        "musicurl": url,
                        "hqmusicurl": hdUrl,
                        "thumb_media_id": mediaId
                    }
                };
                appHttp.sendSSLPost(url, msg, function (err, data) {
                    if (err) {
                        logger.app.error("sendServiceVoiceMsg error! ", err);
                    }
                });
            } else {
                logger.app.error("get weixin token error!", err);
            }
        });
    }
};


var handler = {

    sendServiceVoiceMsg: function (mediaId, toUser) {
        utils.WeixinUtil.getAccessToken(function (err, token) {
            if (!err) {
                var url = "https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=" + token;
                var msg = {
                    "touser": toUser,
                    "msgtype": "voice",
                    "voice": {
                        "media_id": mediaId
                    }
                };
                appHttp.sendSSLPost(url, msg, function (err, data) {
                    if (err) {
                        logger.app.error("sendServiceVoiceMsg error! ", err);
                    }
                });
            } else {
                logger.app.error("get weixin token error!", err);
            }
        });
    },
    sendMusicMsg: function (mediaId, toUser, url, hdUrl, userName, time) {
        if (mediaId) {
            impl.sendMusicMsgImpl(mediaId, toUser, url, hdUrl, userName, time);
        } else {
            utils.WeixinUtil.getDefaultThumb(function (err, thumdId) {
                if (!err) {
                    impl.sendMusicMsgImpl(thumdId, toUser, url, hdUrl, userName, time);
                }
            });
        }

    },
    sendServiceTextMsg: function (msg, toUser) {
        utils.WeixinUtil.getAccessToken(function (err, token) {
            if (!err) {
                var url = "https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=" + token;
                var msgdata = {
                    "touser": toUser,
                    "msgtype": "text",
                    "text": {
                        "content": msg
                    }
                };
                appHttp.sendSSLPost(url, msgdata, function (err, data) {
                    if (err) {
                        logger.app.error("sendServiceTextMsg error! ", err);
                    }
                });
            } else {
                logger.app.error("get weixin token error!", err);
            }
        });
    },
    uploadMedia: function (fileName, type, fileExt, callback) {
        utils.WeixinUtil.getAccessToken(function (err, token) {
            if (!err) {
                var url = "http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token=__token&type=__type";
                url = url.replace(/__token/g, token);
                url = url.replace(/__type/g, type);
                fs.readFile(fileName, function (err, mediaData) {
                    if (!err) {
                        var boundary = 'dishui';
                        var max = 9007199254740992;
                        var dec = Math.random() * max;
                        var hex = boundary + dec.toString(36);
                        var mimeType = mime.lookup(fileExt);
                        var boundaryKey = '----WebKitFormBoundary' + hex;
                        var name = new Date().getTime() + fileExt;
                        var payload = '\r\n\r\n--' + boundaryKey + '\r\n'
                            + 'Content-Disposition: form-data; name="uploadfile"; filename="' + name + '"\r\n'
                            + 'Content-Type: ' + mimeType + '\r\n\r\n';
                        var enddata = '\r\n--' + boundaryKey + '\r\n'
                            + 'Content-Disposition: form-data; name="formId"\r\n\r\n'
                            + '--' + boundaryKey + '--';
                        var contentLength = Buffer.byteLength(payload, 'utf8') + mediaData.length + Buffer.byteLength(enddata, 'utf8');
                        var info = parse(url);
                        var path = info.pathname + (info.search || '');

                        var options = {
                            host: info.hostname,
                            port: info.port || 80,
                            path: path,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'multipart/form-data; boundary=' + boundaryKey,
                                'Content-Length': contentLength
                            }
                        };
                        var req = require("http").request(options,function (res) {
                            var chunks = [], length = 0;
                            res.on('data',function (chunk) {
                                length += chunk.length;
                                chunks.push(chunk);
                            }).on('end',function () {
                                    var data = new Buffer(length);
                                    var pos = 0;
                                    var l = chunks.length;
                                    for (var i = 0; i < l; i++) {
                                        chunks[i].copy(data, pos);
                                        pos += chunks[i].length;
                                    }
                                    logger.request.info("get response :[" + data + ']');
                                    callback(null, data);
                                }).on('error', function (err) {
                                    logger.request.warn("file pipe request error:[" + err.message + "]");
                                    callback(err);
                                });
                        }).on('error', function (err) {
                                logger.request.warn("http sendFile request error:[" + err.message + "]");
                                callback(err);
                            });
                        req.write(payload, 'utf8');
                        req.write(mediaData, 'binary');
                        req.write(enddata, 'utf8');
                        req.end();
                    } else {
                        callback(err);
                    }
                });
            } else {
                logger.app.error("get weixin token error!", err);
                callback(err);
            }
        });
    }



};

module.exports = handler;