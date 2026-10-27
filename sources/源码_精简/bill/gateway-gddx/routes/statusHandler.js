/**
 * Created by zhangyang on 15/5/4.
 */
var handlerDir = __baseDir + '/m7';
var utils = require('appUtil/Utils');
var logger = require('appLog');
var statusHandler = require(handlerDir + "/status/StatusHandler");

var handlers = {
    mail :  statusHandler.mailStatus,
    weixin : statusHandler.weixinStatus,
    im : statusHandler.imStatus,
    webchat: statusHandler.webImStatus
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
