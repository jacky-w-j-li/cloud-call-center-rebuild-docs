var config = require('../../config');
var utils = require('appUtil/Utils');
var http = require('appHttp');
var db = require('appDb/MongoDb');
var log = require('appLog');
var wechatUtils = require('../wechatUtils');


/**
 * 发送其它接口的文本消息
 * @param content
 * @param toUser
 * @param sendUrl
 */
module.exports.sendText = function(content, toUser,sendUrl,otherToken) {
    log.app.info('发送给接口用的的信息  '+otherToken);
    var timestamp = utils.getCurrentDateTime();
    var  nonce = utils.UUID.generateUuid();
    var signature = wechatUtils.getSignature(otherToken,timestamp,nonce,toUser);
    var postData = {
        open_id : toUser,
        msgType :"text",
        content: decodeURIComponent(content),
        timestamp :timestamp,
        nonce : nonce,
        msg_signature : signature
    };
    log.app.info(JSON.stringify(postData));
    retrySendMsg(sendUrl, postData, 0);
};



/**
 * 发送其它接口的图片消息
 * @param imageUrl
 * @param toUser
 * @param sendUrl
 */
module.exports.sendImage = function(imageUrl, toUser,sendUrl,otherToken) {
    log.app.info('发送给接口用的的图片  ' + toUser);
    var timestamp = utils.getCurrentDateTime();
    var nonce = utils.UUID.generateUuid();
    var signature = wechatUtils.getSignature(otherToken,timestamp, nonce, toUser);
    var postData = {
        open_id: toUser,
        msgType: "image",
        content: imageUrl,
        timestamp: timestamp,
        nonce: nonce,
        msg_signature: signature
    };
    log.app.info(JSON.stringify(postData));
    retrySendMsg(sendUrl, postData, 0);
};

/**
 * 重试3次
 * @param url
 * @param postData
 * @param retryTimes
 */
function retrySendMsg(url , postData, retryTimes){
    if(retryTimes >= 3){
        log.app.warn("retry 3 times");
        return;
    }
    if(url.match("^https://")){
        http.sendHttpsPostJSON(url, postData, function(err, result){
            if(!err) {

            } else {
                log.app.warn(err);
                retryTimes++;
                retrySendMsg(url, postData, retryTimes);
            }
        });
    }else{
        http.sendPostJSON(url, postData, function(err, result){
            if(!err) {

            } else {
                log.app.warn(err);
                retryTimes++;
                retrySendMsg(url, postData, retryTimes);
            }
        });
    }

}

