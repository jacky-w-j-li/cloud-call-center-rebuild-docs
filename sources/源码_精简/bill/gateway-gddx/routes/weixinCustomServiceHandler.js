/**
 * @author Liu Huanqiu <liuhq@7moor.com>
 * @date 16-8-18 下午1:03
 */
var handlerDir = __baseDir + '/m7';
var utils = require('appUtil/Utils');
var logger = require('appLog');
var customServiceHandler = require(handlerDir + "/weixin/CustomServiceHandler");


var actions = {
  getAllCustomService: customServiceHandler.getAllCustomService,
  addCustomService: customServiceHandler.addCustomService,
  updateCustomService: customServiceHandler.updateCustomService,
  delCustomService: customServiceHandler.delCustomService
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
};

module.exports = handler;