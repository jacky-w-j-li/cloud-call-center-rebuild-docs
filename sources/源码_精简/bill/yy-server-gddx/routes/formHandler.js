var utils = require('appUtil/Utils');
var logger = require('appLog');
var ivrHandler = require(__baseDir + '/7moor/ivr/IvrHandler');
var batchDialHandler = require(__baseDir + '/7moor/ucenter/BatchDialHandler');
var batchFaxHandler = require(__baseDir + '/7moor/ucenter/BatchFaxHandler');
var logoHandler=require(__baseDir + '/7moor/system/LogoHandler');
var accountHandler=require(__baseDir + '/7moor/account/AccountHandler');

var actions = {
    test: function (data, session, res) {
        console.log(data);
    },
    importNum: batchDialHandler.importNum,
    importFaxNum: batchFaxHandler.importNum,
    changeFaxFile : batchFaxHandler.changeFaxFile,
    addLogo:logoHandler.addLogo,
    updateLogo:logoHandler.updateLogo,
    saveIdentity:accountHandler.saveIdentity,
    app: {
        tel: {
            setW: ivrHandler.setW,
            setOW: ivrHandler.setOW
        }
    }
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
            logger.app.error(e);
            utils.sendResult({success: false, message: e.message}, res , action._aid);
        }
    }
}

module.exports = handler;
