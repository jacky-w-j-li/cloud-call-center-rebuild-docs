/**
 * @author Liu Huanqiu <liuhq@7moor.com>
 * @date 16-8-18 下午1:08
 */

var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var Thenjs = require('thenjs');

function customServicePost(data, callback) {
  httpProvider.sendPost(config.weixinPushUrl , JSON.stringify(data), function (err , resp) {
    if (err) {
      return callback(err);
    }

    resp = resp || "{}";
    resp = JSON.parse(resp);

    if (!resp.success) {
      return callback(new Error(resp.message));
    } else {
      return callback(null, resp);
    }
  });
}

var handler = {
  getAllCustomService: function (data, callback) {
    var funcName = '[CustomServiceHandler - getAllCustomService]';
    var result = { success: false };

    var postData = {
      appid: data.appid,
      account: data.account,
      user: data.user,
      createTime: utils.getCurrentDate(),
      action: 'getAllCustomService'
    };

    customServicePost(postData, function (err, res) {
      if (err) {
        result.message = err.message;
        logger.app.error(result.message);
        return callback(result);
      }

      result.success = true;
      result.data = res.data;
      return callback(result);
    });
  },
  addCustomService: function (data, callback) {
    var funcName = '[CustomServiceHandler - addCustomService]';
    var result = { success: false };
    
    var postData = {
      appid: data.appid,
      account: data.account,
      user: data.user,
      createTime: utils.getCurrentDate(),
      action: 'addCustomService',
      kf_account: data.kf_account,
      nickname: data.nickname
    };

    Thenjs(function (cont) {
      customServicePost(postData, function (err, res) {
        if (err) {
          return cont(err);
        }

        if (!data.imgUrl) {
          logger.app.info(funcName, res);
          return callback(res);
        } else {
          var postData2 = {
            _id: utils.UUID.generateUuid(),
            action: 'uploadCustomServiceAvatar',
            account: data.account,
            user: data.user,
            appid: data.appid,
            kf_account: data.kf_account,
            imgUrl: data.imgUrl
          };

          customServicePost(postData2, function (err2, res2) {
            if (err2) {
              return cont(err2);
            }

            result.success = true;
            logger.app.info(funcName, res);
            logger.app.info(funcName, res2);
            return callback(result);
          });
        }
      });
    }).fail(function (cont, err) {
      logger.app.error(funcName, err);
      result.message = err.message;
      return callback(result);
    });
  },
  updateCustomService: function (data, callback) {
    var funcName = '[CustomServiceHandler - updateCustomService]';
    var result = { success: false };

    var postData = {
      appid: data.appid,
      account: data.account,
      user: data.user,
      createTime: utils.getCurrentDate(),
      action: 'updateCustomService',
      kf_account: data.kf_account,
      nickname: data.nickname
    };

    Thenjs(function (cont) {
      customServicePost(postData, function (err, res) {
        if (err) {
          return cont(err);
        }

        if (!data.imgUrl) {
          logger.app.info(funcName, res);
          return callback(res);
        } else {
          var postData2 = {
            _id: utils.UUID.generateUuid(),
            action: 'uploadCustomServiceAvatar',
            account: data.account,
            user: data.user,
            appid: data.appid,
            kf_account: data.kf_account,
            imgUrl: data.imgUrl
          };

          customServicePost(postData2, function (err2, res2) {
            if (err2) {
              return cont(err2);
            }

            result.success = true;
            logger.app.info(funcName, res);
            logger.app.info(funcName, res2);
            return callback(result);
          });
        }
      });
    }).fail(function (cont, err) {
      logger.app.error(funcName, err);
      result.message = err.message;
      return callback(result);
    });
  },
  delCustomService: function (data, callback) {
    var funcName = '[CustomServiceHandler - delCustomService]';
    var result = { success: false };

    var postData = {
      appid: data.appid,
      account: data.account,
      user: data.user,
      createTime: utils.getCurrentDate(),
      action: 'delCustomService',
      kf_account: data.kf_account
    };

    customServicePost(postData, function (err, res) {
      if (err) {
        result.message = err.message;
        logger.app.error(funcName, result.message);
        return callback(result);
      }

      result.success = true;
      return callback(result);
    });
  }
};

module.exports = handler;