/**
 * 客服管理
 * 提供修改微信公众账号的客服方法
 * @author Liu Huanqiu <liuhq@7moor.com>
 * @date 16-8-16 上午10:50
 */

var config = require('../../config');
var utils = require('appUtil/Utils');
var appHttp = require('appHttp');
var logger = require('appLog');
var needle = require('needle');
var fs = require('fs');
var formstream = require('formstream');
var urllib = require('urllib');

function commonCallback(funcName, callback) {
  return function (err, resp) {
    if (err) {
      logger.app.error(funcName, err);
      return callback(err);
    }

    var result = undefined;
    try {
      result = JSON.parse(resp);
    } catch (e) {
      logger.app.error(funcName, e);
      return callback(e);
    }

    if (result.errcode === 0){
      return callback(null);
    } else {
      logger.app.error(funcName, result);

      if (result.errcode === 48001 || result.errcode === 65400) {
        return callback(new Error('该公众号没有开通微信客服功能，请到微信后台功能插件中添加客服功能；如您已开通，请稍等一会再试'));
      } else if (result.errcode === 65404) {
        return callback(new Error('客服帐号不合法'));
      } else if (result.errcode === 65403) {
        return callback(new Error('客服昵称不合法'));
      } else if (result.errcode === 65405) {
        return callback(new Error('帐号数目已达到上限，不能继续添加'));
      }

      return callback(new Error(result.errmsg));
    }
  }
}

var customService = {
  /**
   * 获取客服列表
   * 
   * @param {string} accessToken 调用接口凭证
   * @param {Function} callback
   */
  getAll: function (accessToken, callback) {
    var funcName = '[customService - getAll]';
    var url = 'https://api.weixin.qq.com/cgi-bin/customservice/getkflist?access_token=' + accessToken;
    
    appHttp.sendHttps(url, function (err, resp) {
      if (err) {
        logger.app.error(funcName, err);
        return callback(err);
      }

      var result = undefined;
      try {
        result = JSON.parse(resp);
      } catch (e) {
        logger.app.error(funcName, e);
        return callback(e);
      }

      if (result.errcode && result.errcode !== 0) {
        logger.app.error(funcName, result);

        if (result.errcode === 48001) {
          return callback(new Error('该微信号没有开通微信客服功能，请到微信后台功能插件中添加客服功能'));
        }

        return callback(new Error(result.errmsg));
      } else {
        return callback(null, result.kf_list);
      }
    });
  },
  /**
   * 添加客服账号
   *
   * @param {string} accessToken 调用接口凭证
   * @param {Object} data
   * @param {string} data.kf_account 完整客服账号，格式为：账号前缀@公众号微信号
   * @param {string} data.nickname 客服昵称，最长16个字
   * @param {Function} callback
   */
  add: function (accessToken, data, callback) {
    var funcName = '[customService - add]';
    var url = 'https://api.weixin.qq.com/customservice/kfaccount/add?access_token=' + accessToken;
    
    appHttp.sendHttpsPost(url, data, commonCallback(funcName, callback));
  },
  /**
   * 修改客服账号
   *
   * @param {string} accessToken 调用接口凭证
   * @param {Object} data
   * @param {string} data.kf_account 完整客服账号，格式为：账号前缀@公众号微信号
   * @param {string} data.nickname 客服昵称，最长16个字
   * @param {Function} callback
   */
  update: function (accessToken, data, callback) {
    var funcName = '[customService - update]';
    var url = 'https://api.weixin.qq.com/customservice/kfaccount/update?access_token=' + accessToken;

    appHttp.sendHttpsPost(url, data, commonCallback(funcName, callback));
  },
  /**
   * 上传客服头像
   *
   * @param {string} accessToken 调用接口凭证
   * @param {Object} data
   * @param {string} data.kf_account 完整客服账号，格式为：账号前缀@公众号微信号
   * @param {string} data.imgUrl 头像地址
   * @param callback
   * @returns {*}
   */
  uploadAvatar: function (accessToken, data, callback) {
    var funcName = '[customService - upldadAvatar]';
    var url = 'https://api.weixin.qq.com/customservice/kfaccount/uploadheadimg?access_token=' + accessToken + '&kf_account=' + data.kf_account;
    try {
      var imgStream = needle.get(data.imgUrl);
    } catch (e) {
      logger.app.error(funcName, e);
      return callback(e);
    }

    var buffers = [];
    imgStream.on('data', function (trunk) {
      buffers.push(trunk);
    });
    imgStream.on('end', function () {
      var imgBuffer = Buffer.concat(buffers);
      var filename = utils.UUID.generateUuid() + '.jpg';

      needle.post(url, {
        media: {
          buffer: imgBuffer,
          filename: filename,
          content_type: 'image/jpeg'
        },
        x: 'x'  // key/value任意填写，如果去掉微信会返回 { "errcode": 41005, "errmsg": "media data missing" }
      }, { multipart: true }, function (postErr, resp, body) {
        if (postErr) {
          logger.app.error(funcName, '上传客服头像失败', postErr);
          return callback(postErr);
        }

        if (body.errcode === 0){
          logger.app.info(funcName, '上传客服头像成功', body);
          return callback(null);
        } else {
          logger.app.error(funcName, '上传客服头像失败', body);
          return callback(new Error(body.errmsg));
        }
      });
    });

    imgStream.once('error', function (streamErr) {
      logger.app.error(funcName, streamErr);
      return callback(streamErr);
    });
  },
  /**
   * 删除客服账号
   *
   * @param {string} accessToken 调用接口凭证
   * @param {Object} data
   * @param {string} data.kf_account 完整客服账号，格式为：账号前缀@公众号微信号
   * @param {Function} callback
   */
  del: function (accessToken, data, callback) {
    var funcName = '[customService - del]';
    var url = 'https://api.weixin.qq.com/customservice/kfaccount/del?access_token=' + accessToken + '&kf_account=' + data.kf_account;

    appHttp.sendHttps(url, commonCallback(funcName, callback));
  }
};

module.exports = customService;