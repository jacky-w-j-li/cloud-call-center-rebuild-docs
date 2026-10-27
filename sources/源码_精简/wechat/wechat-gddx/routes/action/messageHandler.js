var log         = require('appLog');
var config      = require('../../config');
var db          = require('appDb/MongoDb');
var utils       = require('appUtil/Utils');
var urlencode   = require('urlencode');
var message     = require('../weixin/message');
var Imessage    = require('../other/Imessage');
var needle      = require('needle');
var fs          = require('fs');
var wechatUtils = require('../wechatUtils');


/*
 {
 action:'sendMsg',
 sid:'xxxxx',
 contentType:'text/image/\video',
 kefu:'6001',
 when:'144358491044'，
 content:'xxxxxx',
 dateTime:'yyyy-MM-dd HH:mm:ss',
 kf_account: 'xxx@xxxx'
 }
 */
module.exports.sendMsg = function(action, callback) {
    db.db().collection('wx_user').findOne({_id: action.sid}, ['appid'], function(err, result){
        if(result) {
            var query = {
                _id: result.appid
            }
            db.db().collection('wxaccount').findOne(query, ['from','authorizer_access_token','sendUrl'], function(err, doc) {
                if (doc) {
                    if(doc.from == 'Icallback'){//接口发的消息
                        if(action.contentType == 'text') {
                            Imessage.sendText(action.content || action.message, action.sid,doc.sendUrl,doc.authorizer_access_token);
                        }else if(action.contentType == 'image'){
                            Imessage.sendImage(action.content || action.message, action.sid,doc.sendUrl,doc.authorizer_access_token);
                        }
                    }else{
                        var accessToken = doc.authorizer_access_token;
                        if(action.contentType == 'text') {
                            if (!action.kf_account) {
                                message.sendText(action.content || action.message, result.appid, action.sid, accessToken);
                            } else {
                                message.sendCustomServiceText({
                                    content: action.content || action.message,
                                    toUser: action.sid,
                                    accessToken: accessToken,
                                    kf_account: action.kf_account
                                });
                            }
                        }else if (action.contentType == 'voice') {

                        }else if (action.contentType == 'video') {

                        }else if (action.contentType == 'image') {
                            var tmpFile = config.tmp_file_dir +utils.UUID.generateUuid()+'.png';
                            //var out = fs.createWriteStream(tmpFile);
                            //needle.get(action.content).pipe(out);
                            try {
                                var picStream = needle.get(action.content);
                            } catch (e) {
                                throw e;
                            }
                            wechatUtils.load(picStream,function(err,buf){
                                    if(!err){
                                        fs.writeFile(tmpFile, buf, function(err){
                                            if(!err){
                                                if (!action.kf_account) {
                                                    message.sendImg(tmpFile,result.appid, action.sid, accessToken,function(){
                                                        fs.unlink(tmpFile, function(err){
                                                            if(err){
                                                                log.app.error(err);
                                                                throw err;
                                                            }
                                                        });
                                                    });
                                                } else {
                                                    message.sendCustomServiceImg({
                                                        imagePath: tmpFile,
                                                        toUser: action.sid,
                                                        accessToken: accessToken,
                                                        kf_account: action.kf_account
                                                    }, function () {
                                                        fs.unlink(tmpFile, function(err) {
                                                            if (err) {
                                                                log.app.error(err);
                                                                throw err;
                                                            }
                                                        });
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            );
                        }else if(action.contentType == 'news'){

                        }
                    }
                }
            });
            callback('success')
        } else {
            log.app.warn(err);
            callback('404');
        }
    });
}
