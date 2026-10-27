var WXBizMsgCrypt = require('wechat-crypto');
var config        = require('../../config');
var meadia        = require('./media');
var utils         = require('appUtil/Utils');
var http          = require('appHttp');
var db            = require('appDb/MongoDb');
var log           = require('appLog');
var wechatAPI     = require('appWechat/index');
var api           = new wechatAPI();
var Thenjs        = require('thenjs');
/*
<xml>
<ToUserName><![CDATA[toUser]]></ToUserName>
<FromUserName><![CDATA[fromUser]]></FromUserName>
<CreateTime>12345678</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[你好]]></Content>
</xml>
*/

/*
    只有被动回复用户时才需要加密
 */
module.exports.reply = function(text, fromUser, toUser, req, res) {
    var cryptor;
    Thenjs(function(cont){
        var appId = req.dbAppId;
        console.log(appId+"=============================>>>>>>>>>>>>>>>>>>>>>");
        if(appId){
            db.db().collection('component').findOne({_id:appId},cont);
        } else {
            cryptor = new WXBizMsgCrypt(config.token, config.encodingKey, config.appId);
            cont();
        }
    }).then(function(cont , dbApp){
        if(dbApp){
            cryptor =  new WXBizMsgCrypt(dbApp.token, dbApp.encodingKey, dbApp._id);
        }
        cont();
    }).then(function(cont){
        var xml = '<xml>'+
            '<ToUserName>'+toUser+'</ToUserName>'+
            '<FromUserName>'+fromUser+'</FromUserName>'+
            '<CreateTime>'+parseInt(utils.getCurrentDateTimeInt())+'</CreateTime>'+
            '<MsgType>text</MsgType>'+
            '<Content>'+text+'</Content>'+
            '</xml>';

        console.dir(xml);
        var timestamp = new Date().getTime();
        var nonce = parseInt((Math.random() * 100000000000), 10);
        var encrypt = cryptor.encrypt(xml);
        var signature = cryptor.getSignature(timestamp, nonce, encrypt);

        var msg = '<xml><Encrypt><![CDATA['+encrypt+']]></Encrypt>' +'<Nonce><![CDATA['+nonce+']]></Nonce>'+
            '<TimeStamp>'+timestamp+'</TimeStamp><MsgSignature><![CDATA['+signature+']]></MsgSignature>'+
            '</xml>';
        console.dir(msg);
        res.end(msg);
    });
}

module.exports.sendText = function(content, appId, toUser, accessToken) {
    var contentData = content;
    try {
       contentData = decodeURIComponent(content);
    } catch (e) {

    }
    var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+accessToken;
    var postData = {
        touser : toUser,
        msgtype :"text",
        text: {
            content: contentData
        }
    };
    console.log(postData);
    http.sendHttpsPost(url, postData, function(err, result){
        if(result) {
            var _result = JSON.parse(result);
            log.app.info(_result);
        } else {
            log.app.warn(err);
        }
    });
}
/**
 * 向微信推送图片
 * @param imagePath
 * @param appId
 * @param toUser
 * @param accessToken
 */
module.exports.sendImg = function(imagePath,appId, openid, accessToken,callback){
    meadia.uploadMedia(imagePath,'image',accessToken,function(err,result){
        if(!err){
            log.app.info(result);
            //this._sendImage(openid,result.media_id,accessToken);
            api._sendImage(openid,result.media_id,accessToken,function(err){
                if(err){
                    log.app.warn(err);
                }
            });
        }else{
            log.app.warn(err);
        }
        callback;
    });
};
exports._sendImage = function(openid,media_id,accessToken){
    api._sendImage(openid,media_id,accessToken,function(err){
        if(err){
            log.app.warn(err);
        }
    });
};
/**
 * 客服消息，发送图文消息（点击跳转到外链）
 * @param {Array} articles 图文列表
 * @param {String} openid 用户的openid
 * @param accessToken
 * @param {Function} callback 回调函数
 */
module.exports.sendNews = function(articles,openid, accessToken,callback){

    api._sendNews(openid, articles,accessToken, callback);
};
/**
 * 客服消息，发送图文消息（点击跳转到图文消息页面）
 * @param {String} openid 用户的openid
 * @param {String} news 图文消息
 * @param accessToken
 * @param {Function} callback 回调函数
 */
module.exports.sendMpNews = function(openid, news,accessToken, callback){
    meadia.uploadNewsMaterial(accessToken,news,callback,function(err,result){
        if(!err){
            var mediaId = result.media_id;
            //this._sendMpNews(openid, mediaId,accessToken, callback);
            api._sendMpNews(openid, mediaId,accessToken, callback);
        }else{
            log.app.warn(err);
            callback(err);
        }
    });

}

exports._sendMpNews = function(openid, mediaId,accessToken, callback){
    api._sendMpNews(openid, mediaId,accessToken, callback);
};




/*
 {
 "touser":"OPENID",
 "msgtype":"voice",
 "voice":
 {
 "media_id":"MEDIA_ID"
 }
 }
 */
exports.sendVoice = function(mediaId, appId, toUser, accessToken) {
    var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+accessToken;
    var postData = {
        touser : toUser,
        msgtype :"voice",
        voice: {
            media_id: mediaId
        }
    };
    http.sendHttpsPost(url, postData, function(err, result){
        if(result) {
            var _result = JSON.parse(result);
            log.app.info(_result);
        } else {
            log.app.warn(err);
        }
    });
}






module.exports.getMessage = function() {
    var cryptor = new WXBizMsgCrypt(config.token, config.encodingKey, config.appId);
    var xml = '<xml>'+
        '<ToUserName>oMpomt4RMawHqwo2cH5arDFmTocw</ToUserName>'+
        '<FromUserName>gh_209f26c96681</FromUserName>'+
        '<CreateTime>1443771352</CreateTime>'+
        '<MsgType>text</MsgType>'+
        '<Content>q</Content>'+
        '</xml>';

    console.dir(xml);
    var timestamp = 1443771352207;
    var nonce = 97531755222;
    var encrypt = cryptor.encrypt(xml);
    var signature = cryptor.getSignature(timestamp, nonce, encrypt);
    console.dir('====1: '+signature);
    console.dir('====2: '+encrypt);
    var msg = '<xml><Encrypt>'+encrypt+'</Encrypt>' +'<Nonce>'+nonce+'</Nonce>'+
        '<TimeStamp>'+timestamp+'</TimeStamp><MsgSignature>'+signature+'</MsgSignature>'+
        '</xml>';
    console.dir(msg);
    //res.end(msg);
}

/**
 * 使用客服身份发送文本消息
 * 
 * @param {Object} data
 * @param {string} data.content
 * @param {string} data.toUser
 * @param {string} data.accessToken
 * @param {string} data.kf_account
 */
module.exports.sendCustomServiceText = function(data) {
    var contentData = data.content;
    try {
        contentData = decodeURIComponent(data.content);
    } catch (e) {

    }
    var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + data.accessToken;
    var postData = {
        touser: data.toUser,
        msgtype: 'text',
        text: {
            content: contentData
        },
        customservice: {
            kf_account: data.kf_account
        }
    };

    http.sendHttpsPost(url, postData, function(err, result){
        if(result) {
            var _result = JSON.parse(result);
            log.app.info(_result);
        } else {
            log.app.warn(err);
        }
    });
};

/**
 * 使用客服身份发送图片消息
 * 
 * @param data
 * @param data.imagePath
 * @param data.toUser
 * @param data.accessToken
 * @param data.kf_account
 * @param callback
 */
module.exports.sendCustomServiceImg = function(data, callback) {
    meadia.uploadMedia(data.imagePath, 'image', data.accessToken, function(err, result) {
        console.log('111111');
        console.log(result);
        if (err) {
            console.log('xxxxx');
            console.log(err);
            log.app.warn('uploadMedia', err);
            return callback();
        }

        var url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + data.accessToken;
        var postData = {
            touser: data.toUser,
            msgtype: 'image',
            image: {
                media_id: result.media_id
            },
            customservice: {
                kf_account: data.kf_account
            }
        };

        http.sendHttpsPost(url, postData, function(err, postRes) {
            if(postRes) {
                var _result = JSON.parse(postRes);
                console.log(_result);
                log.app.info(_result);
            } else {
                log.app.warn('sendHttpsPost', err);
            }
        });
        
        callback();
    });
};