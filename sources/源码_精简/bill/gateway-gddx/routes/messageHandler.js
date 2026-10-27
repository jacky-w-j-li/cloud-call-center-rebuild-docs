/**
 * Created by zhangyang on 15/5/4.
 */
var handlerDir = __baseDir + '/m7';
var utils = require('appUtil/Utils');
var logger = require('appLog');
var mailMessage = require(handlerDir + "/message/MailMessage");
var weixinMessage = require(handlerDir + '/message/WeixinMessage');
var imMessage = require(handlerDir + '/message/ImMessage');

var handlers = {
    /**
     * 发送邮件 参数
     * {
     *      _id : uuid,
     *      msgType : mail,
     *      mailId : "",
     *      to : "",
     *      cc : "",
     *      subject : "",
     *      content : ""
     * }
     */
    mail :  mailMessage.sendMail,
    /**
     * 发送微信消息
     * =====text
     * {
     *      _id : uuid,
     *      account : "",
     *      msgType : weixin,
     *      openID : "",    //公众号id
     *      userID : "",    //微信用户id
     *      contentType : text,
     *      content : ""
     * }
     */
    weixin : weixinMessage.sendMsg,
    /**
     * 发送IM 消息
     *
     * _id : uuid,
     * account : account
     * userID : "",  //im用户
     * user:"",  //坐席
     * msgType :"",
     * content : ""
     *
     *
     */
    im : imMessage.sendMsg,

    newIm : imMessage.sendNewImMsg,
    batchNewIm : imMessage.batchSendNewImMsg,


    pushImCSR: imMessage.pushImCSR,
    pushImCsrConfig:imMessage.pushImCsrConfig
};



var handler = {
    handle:function(message, res){
        try{
           var messageFun = eval('handlers.' + message.type);
            if(messageFun){
                messageFun(message.data, function (result) {
                    result.success = result.success || false;
                    result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                    utils.sendResult(result, res, message._id);
                });
            } else {
                _impl.processUnknowMessage(message, res);
            }
        } catch (e){
            logger.app.error(e);
            utils.sendResult({success: false, message: e.message}, res, message._id);
        }
    }
};

var _impl = {
    processUnknowMessage : function (message , res){
        var result = {};
        result.success = false;
        result.message = 'action[' + message.type + '] is not support!';
        utils.sendResult(result, res, message._id);
    }
};

module.exports = handler;
