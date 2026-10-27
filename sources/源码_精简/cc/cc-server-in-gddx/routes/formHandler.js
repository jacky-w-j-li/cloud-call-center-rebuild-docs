var utils = require('appUtil/Utils');
var logger = require('appLog');
var batchDialHandler = require(__baseDir + "/dishui/app/batch/BatchDialHandler");
var batchTaskDialHandler = require(__baseDir + "/dishui/app/batch/BatchTaskHandler");
var kmItemHandler = require(__baseDir + "/dishui/app/km/KmItemHandler");
var newSmsHandler = require(__baseDir + '/dishui/app/sms/NewSmsHandler');

var actions = {
    importNum: batchDialHandler.importNum,
    importTaskNum: batchTaskDialHandler.importTaskNum,
    uploadRichImage: kmItemHandler.uploadRichImage,
    importSms: newSmsHandler.importSms,
    importTemplateSms: newSmsHandler.importTemplateSms
};

var impl = {
    processUnknowAction: function (action, res) {
        var result = {};
        result.success = false;
        result.message = 'action[' + action.action + '] is not support!';
        utils.sendResult(result, res , action._aid);
    }
}

var handler = {
    handle: function (action, session, res) {
        try {
            var actionFun = eval('actions.' + action.action);
            if (actionFun) {
                actionFun(action.data, session, res);
            } else {
                impl.processUnknowAction(action, res);
            }

        } catch (e) {
            logger.app.error(e.stack);
            utils.sendResult({success: false, message: e.message}, res , action._aid);
        }
    }
}

module.exports = handler;
