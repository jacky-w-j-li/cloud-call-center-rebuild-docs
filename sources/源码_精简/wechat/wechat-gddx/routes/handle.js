var accessToken = require('./weixin/access_token');
var message     = require('./weixin/message');
var wechatUtils = require('./wechatUtils');
var log         = require('appLog');
var config      = require('../config');
var userHandler = require('./weixin/user');
var http        = require('appHttp');
var db          = require('appDb/MongoDb');
var utils       = require('appUtil/Utils');
var media       = require('./weixin/media');
var fs          = require('fs');
var exec        = require('child_process').exec;
var qiniu       = require('qiniu');
var needle      = require('needle');
var Thenjs      = require('thenjs');

module.exports = function(type, msg, req, res, appId) {
    /**
     * 授权事件接收URL
     * { AppId: 'wx074122fd167b81b9',
  CreateTime: '1443245451',
  InfoType: 'component_verify_ticket',
  ComponentVerifyTicket: 'ticket@@@DWp1bF7vgW6rto1nJex6kV4dU3xTqRj9CBG4gJDOsDq6XqZJdZMGpt7vz5yNwSUZHXG2O3H2Q9BQSvu-cgDsYw' }
     { AppId: 'wx074122fd167b81b9',
  CreateTime: '1443412250',
  InfoType: 'component_verify_ticket',
  ComponentVerifyTicket: 'ticket@@@3Du7zgA1Mr-9139M406ypb3jG-H9yd1ugMf4CbyHn0yEDaPocLzJ8sHOI7flP5yerKLi2gnO2yn2HqlKxx87ig' }
     */
    if(type == 'authback') {
        res.end('success');
        if(msg.InfoType == 'component_verify_ticket') { //推送component_verify_ticket协议
            var ticket = msg.ComponentVerifyTicket;
            var appId = msg.AppId;
            accessToken.getAccessToken(appId , ticket);
        }else if(msg.InfoType == 'unauthorized'){ //推送取消授权通知
            accessToken.unauthorized(msg.AuthorizerAppid);
        }

    }

    /**
     * 公众号消息与事件接收URL
     */
    else if (type == 'callback') {
        //res.end('success');
        /*
         * 公众号信息
         */
        console.log("type:callback==> msg:");
        console.dir(msg);
        if(appId == "wx570bc396a51b8ff8") { //发布检测
            console.log("appId : wx570bc396a51b8ff8   发布检测数据");
            var event = msg.Event;
            if(event){
                message.reply(event+"from_callback", msg.ToUserName, msg.FromUserName, req, res);
            }else if(msg.Content == "TESTCOMPONENT_MSG_TYPE_TEXT"){
                message.reply("TESTCOMPONENT_MSG_TYPE_TEXT_callback", msg.ToUserName, msg.FromUserName, req, res);
                //res.end("");
            }else{
                console.log("回复空=========");
                res.end("");
                var content = msg.Content;
                var authCodeIndex = content.indexOf(":") + 1;
                var authCode = content.substr(authCodeIndex);
                var dbAppId = req.dbAppId;
                console.log("============================>" + dbAppId);
                Thenjs(function(cont){
                    db.db().collection("component").findOne({_id:dbAppId},cont);
                }).then(function(cont , dbApp){
                    if(dbApp){
                        var url = 'https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token=' + dbApp.component_access_token;
                        var data = {
                            component_appid: dbApp._id,
                            authorization_code: authCode
                        }
                        http.sendHttpsPost(url, data, cont);
                    } else {
                      log.app.warn("can not found dbApp by id [" + dbAppId + "]");
                    }
                }).then(function(cont , result){
                    var doc = JSON.parse(result);
                    console.log(doc);
                    message.sendText(authCode+"_from_api", msg.ToUserName, msg.FromUserName, doc.authorization_info.authorizer_access_token);
                }).fail(function(cont , err){
                    log.app.warn(err);
                });
            }
            //res.end('success');
        } else if(appId) {
            onMessage(appId, msg, req, res);
        } else {
            res.end('success');
        }
    }else if(type == 'Icallback'){
        IonMessage(appId,msg,req, res);
    }else {
        log.app.warn('未知POST请求，无法处理：'+req.query);
    }
}

/*
 { ToUserName: 'gh_209f26c96681',
 FromUserName: 'oMpomt4RMawHqwo2cH5arDFmTocw',
 CreateTime: '1443767878',
 MsgType: 'text',
 Content: '嗨',
 MsgId: '6200935819235409838' }
 */
var onMessage = function(appId, msg, req, res) {
    res.end('success');
    log.app.info('收到公众号'+ appId +'消息：');
    log.app.info(msg);
    if (msg.MsgType == 'event' && msg.Event != 'CLICK') {
        return;
    }
    var query = {
        _id: appId,
        from: 'weixin'
    };

    db.db().collection('wxaccount').findOne(query, function(err, doc) {
        if (doc) {
            var accessToken = doc.authorizer_access_token;
            userHandler.updateUserInfo(appId, msg.FromUserName, accessToken, msg, function (userResult) {
                //message.sendText('调试信息（信息已收到，转发给gateway处理）', appId, msg.FromUserName, accessToken);
                //message.reply(msg.Content, msg.ToUserName, msg.FromUserName, req, res);

                    if (msg.MsgType == 'voice') {
                        media.getMedia(accessToken, msg.MediaId, function (err, data, res) {
                            if (!err) {
                                _ImessageImpl.sendVoice(appId, msg, data, userResult.isNewVisitor);
                            } else {
                                console.dir(err);
                            }
                        });
                        return;
                    } else if (msg.MsgType == 'text') {
                        if(doc.convert_words && doc.convert_words!= "" && msg.Content == doc.convert_words){
                            sendToGWConvertManual(msg.FromUserName, appId, 'convertManual', userResult.isNewVisitor, doc.convert_words);
                        }else{
                            sendToGW(msg.FromUserName, appId, msg.Content, 'text', userResult.isNewVisitor);
                        }

                        return;
                    } else if (msg.MsgType == 'image') {
                        media.getMedia(accessToken, msg.MediaId, function (err, data, res) {
                            if (!err) {
                                _ImessageImpl.sendImage(appId, msg, data, userResult.isNewVisitor);
                            } else {
                                console.dir(err);
                            }
                        });
                        return;
                    } else if (msg.MsgType == 'event') {
                        if (msg.Event == 'CLICK') {
                            log.app.info('收到点击事件' + msg.EventKey);
                            var query = {
                                eventKey: msg.EventKey,
                                appid: appId
                            };
                            db.db().collection('click').findOne(query, ['content', 'contentType', 'eventKey'], function (err, doc) {
                                if (doc) {
                                    if (doc.contentType == 'text') {
                                        if(doc.content){
                                            var content = wechatUtils.adaptEmojiForWeixin(doc.content);
                                            message.sendText(content, appId, msg.FromUserName, accessToken);
                                        }
                                        if (doc.eventKey == 'robot') {//转人工的消息类型定义为：convertManual
                                            sendToGWConvertManual(msg.FromUserName, appId, 'convertManual', userResult.isNewVisitor);
                                        }
                                    } else if (doc.contentType == 'news') {
                                        message._sendMpNews(msg.FromUserName, doc.content, accessToken);
                                    } else {
                                        message._sendImage(msg.FromUserName, doc.content, accessToken);
                                    }
                                }
                            });
                        }

                    }

            });
        }
    });
}
/**
 * 接受对外的消息接口
 * @param appId
 * @param msg
 * @param req
 * @param res
 */
var IonMessage = function(appId, msg, req, res) {
    res.end('success');
    log.app.info('收到接口'+ appId +'消息：');
    var query = {
        _id: appId,
        from: 'Icallback'
    };
    msg.FromUserName=msg.open_id;
    msg.MsgType = msg.msgType;
    log.app.info(msg);
    db.db().collection('wxaccount').findOne(query, function(err, doc) {
        if (doc) {
            var query1 = {
                _id : msg.FromUserName
            }
            db.db().collection('wx_user').findOne(query1, function(err, doc) {
                if(!doc){
                    db.db().collection('wx_user').insert({_id:msg.FromUserName,openid:msg.FromUserName,nickname:msg.nick_name,appid:appId},{w:1},function(err){
                            if(msg.MsgType == 'voice') {
                                msg.Format = msg.format;
                                msg.MediaId = utils.UUID.generateUuid();
                                _ImessageImpl.sendVoice(appId,msg,msg.media,false);
                                return;
                            } else if(msg.MsgType == 'text') {
                                sendToGW(msg.FromUserName, appId, msg.content, msg.MsgType,false);
                                return;
                            } else if(msg.MsgType == 'image'){
                                try {
                                    var picStream = needle.get(msg.picUrl);
                                } catch (getPicErr) {
                                    log.app.warn(getPicErr);
                                    return;
                                }
                                _ImessageImpl.load(picStream, function(err,buf){
                                    if(!err){
                                        _ImessageImpl.sendImage(appId,msg,buf,false);
                                    }
                                });
                                return;
                            }
                    })
                }else{
                    if(msg.MsgType == 'voice') {
                        msg.Format = msg.format;
                        msg.MediaId = utils.UUID.generateUuid();
                        _ImessageImpl.sendVoice(appId,msg,msg.media,false);
                        return;
                    } else if(msg.MsgType == 'text') {
                        sendToGW(msg.FromUserName, appId, msg.content, msg.MsgType,false);
                        return;
                    } else if(msg.MsgType == 'image'){
                        msg.MediaId = utils.UUID.generateUuid();
                        try {
                            var picStream = needle.get(msg.picUrl);
                        } catch (getPicErr) {
                            log.app.warn(getPicErr);
                            return;
                        }
                        _ImessageImpl.load(picStream, function(err,buf){
                            if(!err){
                                _ImessageImpl.sendImage(appId,msg,buf,false);
                            }
                        });
                        return;
                    }
                }
            });
        }
    });
};

/**
 * 处理接受微信的消息
 * @type {{getFile: Function, getImage: Function}}
 * @private
 */
var _ImessageImpl = {
    sendVoice : function(appId,msg,data,isNewVisitor){
        var tmpFile = config.tmp_file_dir + utils.UUID.generateUuid();
        fs.writeFile(tmpFile+'.'+msg.Format,data, function(err){
            if(!err) {
                var time1 = utils.getCurrentDateTime();
                log.app.info('ffmpeg -i '+tmpFile+'.'+msg.Format +' '+tmpFile+'.mp3');
                var last = exec('ffmpeg -i '+tmpFile+'.'+msg.Format +' '+tmpFile+'.mp3');
                last.on('exit', function (code) {
                    if(code != 0){
                        fs.exists(tmpFile+'.'+msg.Format,function(exists){
                            if(!exists){
                                log.app.error('目标文件不存在 ' +tmpFile+'.'+msg.Format);
                            }
                        });
                        fs.exists(tmpFile+'.mp3',function(exists){
                            if(!exists){
                                log.app.error('转换mp3失败 ' +tmpFile+'.mp3');
                            }
                        });
                    }else{
                        var time2 = utils.getCurrentDateTime();
                        log.app.info('语音转换完成：' + (time2 - time1));
                        //上传文件到七牛
                        uploadToQN(tmpFile+'.mp3', function(err, key){
                            if(err){
                                log.app.info(err);
                            }
                            if(key) {
                                log.app.info('生成的key值：  '+key);
                                sendToGW(msg.FromUserName, appId, config.qiniu_domain+key, msg.MsgType,isNewVisitor);
                            }
                            try{
                                fs.unlink(tmpFile+'.mp3', function(err){
                                    if(err){
                                        log.app.error(err);
                                        throw err;
                                    }
                                });
                                fs.unlink(tmpFile+'.amr', function(err){
                                    if(err){
                                        log.app.error(err);
                                        throw err;
                                    }
                                });
                            }catch(e){
                                log.app.error("删除文件异常");
                            }
                        });
                    }
                });
            } else {
                console.dir(err);
            }
        })
    },
    sendImage:function(appId,msg,data,isNewVisitor){
        console.log("上传图片   "+appId);
        var tmpFile = config.tmp_file_dir + msg.MediaId+'.png';
        fs.writeFile(tmpFile, data, function(err){
            if(!err){
                //上传文件到七牛
                uploadToQN(tmpFile, function(err, key){
                    if(err){
                        log.app.error(err);
                    }
                    if(key) {
                        log.app.info(key);
                        sendToGW(msg.FromUserName, appId, config.qiniu_domain+key, msg.MsgType,isNewVisitor);
                    }
                    try{
                        fs.unlink(tmpFile, function(err){
                            if(err){
                                log.app.error(err);
                                throw err;
                            }
                        });
                    }catch(e){
                        log.app.error("删除文件异常");
                    }
                });
            }else{
                console.log('出错了');
                console.dir(err);
            }
        });
    },
    load : function (stream, callback) {
        var buffers = [];
        stream.on('data', function (trunk) {
            buffers.push(trunk);
        });
        stream.on('end', function () {
            callback(null, Buffer.concat(buffers));
        });
        stream.once('error', callback);
    }
};
/**
 * 发送给getway的方法
 * @param fromUser
 * @param appId
 * @param content
 * @param contentType
 * @param isNewVisitor
 */
var sendToGW = function(fromUser, appId, content, contentType,isNewVisitor) {
    db.db().collection('wx_user').findOne({_id: fromUser}, ['nickname'], function(err, doc1) {
        if(doc1) {
            db.db().collection('wxaccount').findOne({_id: appId}, ['_id', 'account','to_peer'], function(err, doc) {
                if(doc) {
                    if(doc.to_peer){
                        try{
                            var url = config.gateway_uri;
                            //var nickname = doc1.nickname.replace(/\\/g, "\\\\");
                            var nickname = doc1.nickname;
                            nickname = nickname.replace(/\n/g, "");
                            nickname = nickname.replace(/\t/g, "");
                            nickname = nickname.replace(/\r/g, "");
                            //content = content.replace(/\n/g, "%0A");
                            //content = content.replace(/\\/g, "%5C");
                            var data = {
                                action: 'newMsg',
                                account: doc.account,
                                accessId: doc._id,
                                sid: fromUser,
                                nickName: encodeURIComponent(encodeURIComponent(nickname)),
                                dateTime: utils.getCurrentDate(),
                                timestamp: utils.getCurrentDateTime(),
                                message: encodeURIComponent(encodeURIComponent(content)),
                                platform: 'weixin',
                                contentType: contentType,
                                isNewVisitor:isNewVisitor
                            }
                            var str = 'data='+JSON.stringify(data);
                            log.app.info('消息发送给gateway: '+str);
                            http.sendPost(url, str, function(e, result){
                                log.app.info('收到gateway回复：'+result);
                            });
                        }catch (e){
                            log.app.error(e);
                        }

                    }else{
                        log.app.warn('没有配置技能组: '+appId);
                    }

                } else {
                    log.app.warn('account not found: '+appId);
                }

            });
        }
    });
}/**
 * 发送给getway的方法
 * @param fromUser
 * @param appId
 * @param content
 * @param contentType
 * @param isNewVisitor
 */
var sendToGWConvertManual = function(fromUser, appId, action,isNewVisitor, words) {
    db.db().collection('wx_user').findOne({_id: fromUser}, ['nickname'], function(err, doc1) {
        if(doc1) {
            db.db().collection('wxaccount').findOne({_id: appId}, ['_id', 'account','to_peer'], function(err, doc) {
                if(doc) {
                    if(doc.to_peer){
                        var url = config.gateway_uri;
                        var nickname = doc1.nickname ? doc1.nickname.replace(/\\/g, "\\\\") : '';
                        var data = {
                            action: action,
                            account: doc.account,
                            accessId: doc._id,
                            sid: fromUser,
                            nickName: encodeURIComponent(encodeURIComponent(nickname)),
                            platform: 'weixin',
                            isNewVisitor: isNewVisitor
                        }
                        if(words){
                            data.words = true;
                        }
                        var str = 'data='+JSON.stringify(data);
                        log.app.info('转人工消息发送给gateway: '+str);
                        http.sendPost(url, str, function(e, result){
                            log.app.info('收到gateway回复：'+result);
                            if(words){
                                sendToGW(fromUser, appId, words, "text", false);
                            }
                        });
                    }else{
                        log.app.warn('没有配置技能组: '+appId);
                    }

                } else {
                    log.app.warn('account not found: '+appId);
                }

            });
        }
    });
}
/**
 * 上传七牛服务器
 * @param fileUrl 文件路径
 * @param callback
 */
var uploadToQN = function(fileUrl, callback) {
    var putPolicy = new qiniu.rs.PutPolicy({scope: config.qiniu_bucketName});
    var extra = new qiniu.io.PutExtra();
    var key = utils.UUID.generateUuid();

    qiniu.io.putFile(putPolicy.token(), key, fileUrl, extra, function(err, ret) {
        if(!err) {
            // 上传成功， 处理返回值
            console.log(ret.key, ret.hash);
            // ret.key & ret.hash
            callback(null, key);
        } else {
            // 上传失败， 处理返回代码
            console.log('上传七牛失败');
            console.log(err);
            // http://developer.qiniu.com/docs/v6/api/reference/codes.html
            callback(err);
        }
    });
}




