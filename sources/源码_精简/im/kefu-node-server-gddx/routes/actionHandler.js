var handlerDir = __baseDir + '/im';
var logger = require("appLog");
var utils = require('appUtil/Utils');
var msghandler = require(handlerDir + '/MsgHandler');
var connectionHandler = require(handlerDir + '/ConnectionHandler');
var connHandler = require(handlerDir + '/ConnHandler');
var stateHandler = require(handlerDir + '/StateHandler');
var sdkSessionHandler = require(handlerDir + '/SdkSessionHandler');
var configHandler = require(handlerDir + '/ConfigHandler');
var qiniuHandler = require(handlerDir + '/qiniu/QiniuHandler');
var qaHandler = require(handlerDir + '/QAHandler');
var actions =  {
    newChat : connHandler.getNewChat,
    disconnect: connHandler.disconnectSession,
    validateAccessId:connHandler.validateAccessId,
    convertManual: connHandler.convertManual,
    newMsg : msghandler.newMsg,
    typeNotice:msghandler.typeNotice,
    getMsg : msghandler.getMsg,
    leaveMsg: msghandler.leaveMsg,
    //getLargeMsg: msghandler.getLargeMsg,
    validateEmebedState : stateHandler.validateEmebedState,
    getOnlineStates : stateHandler.getOnlineStates,
    getWebchatGlobleConfig:stateHandler.getWebchatGlobleConfig,
    getAbilityVersion: stateHandler.getAbilityVersion,
    connectionBreak: connectionHandler.connectionBreak,
    sdkNewMsg: msghandler.sdkNewMsg,
    sdkGetMsg : msghandler.sdkGetMsg,
    sdkGetInvestigate : msghandler.sdkGetInvestigate,
    sdkSubmitInvestigate : msghandler.sdkSubmitInvestigate,
    sdkBeginNewChatSession: sdkSessionHandler.sdkBeginNewChatSession,
    sdkSubmitLeaveMessage: msghandler.sdkSubmitLeaveMessage,
    sdkConvertManual: sdkSessionHandler.sdkConvertManual,
    sdkGetPeers: configHandler.sdkGetPeers,
    sdkMessageConfirm: msghandler.sdkMessageConfirm,
    sdkTypeNotice:msghandler.sdkTypeNotice,
    qiniu:{
        getUptoken: qiniuHandler.getUptoken,
        getUptokenFromCustomer: qiniuHandler.getUptokenFromCustomer
    },
    sendWebMsg: msghandler.sendWebMsg,
    sendAppMsg: msghandler.sendAppMsg,
    sendSysMsg: msghandler.sendSysMsg,
    //客户满意度
    getImCsrConfig :msghandler.getImCsrConfig,
    pushImCsrConfig:msghandler.pushImCsrConfig,
    pushWebCSRMsg  :msghandler.pushWebCSRMsg,
    sendWebCSRMsg  :msghandler.sendWebCSRMsg,
    //常见问题咨询
    pullQAMsg      :qaHandler.pullQAMsg,
    acceptOtherAgent:connHandler.acceptOtherAgent
};

exports.handleAction = function (action, res) {
    try {
        var actionFun = eval('actions.' + action.action);
        if (actionFun) {
            actionFun(action.data, function (result) {
                result.success = result.success || false;
                result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                if(action.data.callbackF){
                    var js = action.data.callbackF + "(" + JSON.stringify(result) + ")";
                    utils.callbackF(js, res, action._aid);
                }else{
                    utils.sendResult(result, res, action._aid);
                }

            });
        } else {
            processUnknowAction(action, res);
        }

    } catch (e) {
        logger.app.error(e.stack);
        utils.sendResult({Succeed: false, Message: e.message}, res);
    }
}

exports.handleSdkAction = function (action, connection, res) {
    try {
        var actionFun = eval('actions.' + action.name);
        if (actionFun) {
            actionFun(action.data, connection, function (result) {
                result.Succeed = result.Succeed || false;
                result.Message = result.Succeed ? result.Message || '200 ok!' : result.Message || 'unknow error!';
                utils.sendResult(result, res, action._aid);
            });
        } else {
            processUnknowAction(action, res);
        }

    } catch (e) {
        logger.app.error(e.stack);
        utils.sendResult({Succeed: false, Message: e.message}, res);
    }
}

function processUnknowAction(action, res) {
    var result = {};
    result.Succeed = false;
    result.Message = 'action[' + action.name + '] is not support!';
    utils.sendResult(result, res, action._aid);
}

