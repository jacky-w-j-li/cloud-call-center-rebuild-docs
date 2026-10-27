var handlerDir = __baseDir + '/assign';
var logger = require("appLog");
var utils = require('appUtil/Utils');
var assignHandler = require(handlerDir + '/AssignHandler');
var actions =  {
    emailAssginByRound: assignHandler.emailAssginByRound,  //邮件轮流分配给座席
    emailAssginByRound2: assignHandler.emailAssginByRound2  //邮件轮流分配给座席
};

exports.handleAction = function (action, res) {
    try {
        var actionFun = eval('actions.' + action.name);
        if (actionFun) {
            actionFun(action.data, function (result,isExport) {
                result.success = result.success || false;
                result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                if(!isExport) {
                    utils.sendResult(result, res, action._aid);
                }else{
                    utils.sendExcel(result,res,action._aid);
                }
            });
        } else {
            processUnknowAction(action, res);
        }

    } catch (e) {
        logger.app.error(e.stack);
        utils.sendResult({success: false, message: e.message}, res);
    }
}

function processUnknowAction(action, res) {
    var result = {};
    result.success = false;
    result.message = 'action[' + action.name + '] is not support!';
    utils.sendResult(result, res, action._aid);
}

