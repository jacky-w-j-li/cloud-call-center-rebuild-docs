/**
 * 对外提供的客服操作接口
 *
 * @author Liu Huanqiu <liuhq@7moor.com>
 * @date 16-8-16 上午10:59
 */

var logger = require('appLog');
var config = require('../../config');
var mongo = require('appDb/MongoDb');
var urlencode = require('urlencode');
var customService = require('../weixin/customService');

var handler = {
  /**
   * 获取客服列表
   * 
   * @param {Object} action
   * @param {string} action.appid
   * @param {Function} callback
   */
  getAll: function (action, callback) {
    var funcName = '[customServiceHandler - getAll]';
    var query = { _id: action.appid };
    var result = { success: false };

    mongo.db().collection('wxaccount').findOne({ _id: action.appid }, ['authorizer_access_token'], function (err, doc) {
      if (err) {
        result.message = err.message;
        logger.app.error(funcName, err);
        return callback(JSON.stringify(result));
      }

      if (!doc) {
        result.message = 'No wechat account found';
        logger.app.warn(funcName, result);
        return callback(JSON.stringify(result));
      }
      
      customService.getAll(doc.authorizer_access_token, function (err, list) {
        if (err) {
          result.message = err.message;
          return callback(JSON.stringify(result));
        }

        result.success = true;
        result.data = list;
        logger.app.info(funcName, result);
        return callback(JSON.stringify(result));
      });
    });
  },
  /**
   * 添加客服账号
   *
   * @param {Object} action
   * @param {string} action.appid
   * @param {string} action.kf_account
   * @param {string} action.nickname
   * @param {Function} callback
   */
  add: function (action, callback) {
    var funcName = '[customServiceHandler - add]';
    var query = { _id: action.appid };
    var result = { success: false };

    mongo.db().collection('wxaccount').findOne({ _id: action.appid }, ['authorizer_access_token'], function (err, doc) {
      if (err) {
        result.message = err.message;
        logger.app.error(funcName, err);
        return callback(JSON.stringify(result));
      }

      if (!doc) {
        result.message = 'No wechat account found';
        logger.app.warn(funcName, result);
        return callback(JSON.stringify(result));
      }

      customService.add(doc.authorizer_access_token, {
        kf_account: action.kf_account,
        nickname: action.nickname
      }, function (err) {
        if (err) {
          result.message = err.message;
          return callback(JSON.stringify(result));
        }

        result.success = true;
        logger.app.info(funcName, result);
        return callback(JSON.stringify(result));
      });
    });
  },
  /**
   * 修改客服账号
   *
   * @param {Object} action
   * @param {string} action.appid
   * @param {string} action.kf_account
   * @param {string} action.nickname
   * @param {Function} callback
   */
  update: function (action, callback) {
    var funcName = '[customServiceHandler - update]';
    var query = { _id: action.appid };
    var result = { success: false };

    mongo.db().collection('wxaccount').findOne({ _id: action.appid }, ['authorizer_access_token'], function (err, doc) {
      if (err) {
        result.message = err.message;
        logger.app.error(funcName, err);
        return callback(JSON.stringify(result));
      }

      if (!doc) {
        result.message = 'No wechat account found';
        logger.app.warn(funcName, result);
        return callback(JSON.stringify(result));
      }

      customService.update(doc.authorizer_access_token, {
        kf_account: action.kf_account,
        nickname: action.nickname
      }, function (err) {
        if (err) {
          result.message = err.message;
          return callback(JSON.stringify(result));
        }

        result.success = true;
        logger.app.info(funcName, result);
        return callback(JSON.stringify(result));
      });
    });
  },
  /**
   * 上传客服头像
   *
   * @param {Object} action
   * @param {string} action.appid
   * @param {string} action.kf_account
   * @param {string} action imgUrl
   * @param {Function} callback
   */
  uploadAvatar: function (action, callback) {
    var funcName = '[customServiceHandler - update]';
    var query = { _id: action.appid };
    var result = { success: false };

    mongo.db().collection('wxaccount').findOne({ _id: action.appid }, ['authorizer_access_token'], function (err, doc) {
      if (err) {
        result.message = err.message;
        logger.app.error(funcName, err);
        return callback(JSON.stringify(result));
      }

      if (!doc) {
        result.message = 'No wechat account found';
        logger.app.warn(funcName, result);
        return callback(JSON.stringify(result));
      }

      customService.uploadAvatar(doc.authorizer_access_token, {
        kf_account: action.kf_account,
        imgUrl: action.imgUrl
      }, function (err) {
        if (err) {
          result.message = err.message;
          return callback(JSON.stringify(result));
        }

        result.success = true;
        logger.app.info(funcName, result);
        return callback(JSON.stringify(result));
      });
    });
  },
  /**
   * 删除客服账号
   *
   * @param {Object} action
   * @param {string} action.appid
   * @param {string} action.kf_account
   * @param {Function} callback
   */
  del: function (action, callback) {
    var funcName = '[customServiceHandler - del]';
    var query = { _id: action.appid };
    var result = { success: false };

    mongo.db().collection('wxaccount').findOne({ _id: action.appid }, ['authorizer_access_token'], function (err, doc) {
      if (err) {
        result.message = err.message;
        logger.app.error(funcName, err);
        return callback(JSON.stringify(result));
      }

      if (!doc) {
        result.message = 'No wechat account found';
        logger.app.warn(funcName, result);
        return callback(JSON.stringify(result));
      }

      customService.del(doc.authorizer_access_token, {
        kf_account: action.kf_account
      }, function (err) {
        if (err) {
          result.message = err.message;
          logger.app.error(funcName, result);
          return callback(JSON.stringify(result));
        }

        result.success = true;
        logger.app.info(funcName, result);
        return callback(JSON.stringify(result));
      });
    });
  }
};

module.exports = handler;