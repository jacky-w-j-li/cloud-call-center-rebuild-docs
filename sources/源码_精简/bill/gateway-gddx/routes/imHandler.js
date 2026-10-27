/**
 * Created by zhangyang on 15/5/6.
 */
var handlerDir = __baseDir + '/m7';
var utils = require('appUtil/Utils');
var logger = require('appLog');
var imHandler = require(handlerDir +'/im/ImHandler');

var actions = {
    newIm: imHandler.newIm,
    imConn: imHandler.imConn,
    newMsg: imHandler.newMsg,
    imDisconnect: imHandler.imDisconnect,
    getMsg : imHandler.getMsg,
    //newSdkMessage: imHandler.newSdkMessage,
    //imSdkConn: imHandler.imSdkConn,
    //imSdkDisconnect: imHandler.imSdkDisconnect,
    investigate: imHandler.investigate,
    convertManual: imHandler.convertManual,
    leaveMessage:imHandler.leaveMessage,
    sendImCSRInfo : imHandler.sendImCSRInfo,
    sendImQAMsg :imHandler.sendImQAMsg,
    getCsrConfig: imHandler.getCsrConfig,
    typeNotice:imHandler.typeNotice
};

var handler = {
    handle: function (action, res) {
        try {
            var actionFun = eval('actions.' + action.name);
            if (actionFun) {
                actionFun(action.data, function (result) {
                    result.success = result.success || false;
                    result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';

                    utils.sendResult(result, res, action._id);
                });
            } else {
                _impl.processUnknowAction(action, res);
            }
        } catch (e) {
            logger.app.error(e);
            utils.sendResult({success: false, message: e.message}, res, action._id);
        }
    }
};

var _impl = {
    processUnknowAction: function (action, res) {
        var result = {};
        result.success = false;
        result.message = 'action[' + action.name + '] is not support!';
        utils.sendResult(result, res, action._id);
    }
}


module.exports = handler;
