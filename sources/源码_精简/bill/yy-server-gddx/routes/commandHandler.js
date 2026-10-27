var utils = require('appUtil/Utils');
var logger = require('appLog');

var testHandler = require(__baseDir + "/7moor/test/WeixinTestHandler");
var weixinHandler = require(__baseDir + "/7moor/weixin/CommandHandler");
var mainDbIndexHandler = require(__baseDir + "/7moor/common/MaintDbIndexHandler");
var zjAcsHandler = require(__baseDir + "/7moor/common/ZjAcsHandler");
var serviceNumHandler = require(__baseDir + "/7moor/resource/ServiceNumHandler");
var feeStatHandler = require(__baseDir + "/7moor/common/FeeStatHandler");

var commands = {
    test : testHandler.test,
    build_wx_menu : weixinHandler.buildWXMenu,
    ensureIndex : mainDbIndexHandler.ensureIndex,
    ensureIndexTest : mainDbIndexHandler.ensureIndexTest,
    dropIndex : mainDbIndexHandler.dropIndex,
    batchFreeNum : serviceNumHandler.batchFreeNum,
//    repaireCustData : mainDbIndexHandler.repaireCustData,
    zjacs:{
        generateZJIvrFlow:zjAcsHandler.generateZJIvrFlow,
        deleteZJDefaultIvr:zjAcsHandler.deleteZJDefaultIvr
    },

    //statFee : feeStatHandler.statFee,
    //statFee2 : feeStatHandler.statFee2,
    //statNewAcc : feeStatHandler.statNewAcc,
    //statLeaveFee : feeStatHandler.statLeaveFee,
    //stat400LeaveFee : feeStatHandler.stat400LeaveFee,
    //statAccountLeaveFee : feeStatHandler.statAccountLeaveFee,
    statAccountMonthFee : feeStatHandler.statAccountMonthFee
};


exports.handleCommand = function (command, res ,_aid) {
    try {
        var actionFun = eval('commands.' + command.name);
        if (actionFun) {
            actionFun(command.data, function (result) {
                result.success = result.success || false;
                result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                utils.sendResult(result, res ,_aid);
            });
        } else {
            processUnknowCommand(command, res , _aid);
        }
    } catch (e) {
        logger.app.error("",e);
        utils.sendResult({success: false, message: e.message}, res ,_aid);
    }


}


function processUnknowCommand(command, res , _aid) {
    var result = {};
    result.success = false;
    result.message = 'command[' + command.name + '] is not support!';
    utils.sendResult(result, res , _aid);
}
