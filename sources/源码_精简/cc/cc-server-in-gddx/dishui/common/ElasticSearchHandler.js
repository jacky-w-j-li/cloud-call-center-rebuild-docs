/**
 * @author Liu Huanqiu <liuhq@7moor.com>
 * @date 16-8-9 上午11:02
 */
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require('appHttp');
var config = require('appConfig').conf;
var mongo = require('appDb/MongoDb');
var Thenjs = require('thenjs');

var esUrl = config.esUrl;
var esIndex = 'app_kefu_im_message';

var handler = {
  /**
   * addMsgIndex
   * 添加索引
   *
   * @param {Object} data
   * @param {string} data._id
   * @param {string} data.account
   * @param {string} data.sessionId
   * @param {string} data.from
   * @param {string} data.message
   * @param {number} data.when
   * @param {Function} callback
   */
  addMsgIndex: function (data, callback) {
    var result = { success: false };
    var url = esUrl + '/' + esIndex + '/' + data.account + '/' + data._id;
    delete data._id;

    httpProvider.sendESRequest.post(url, data, function (err) {
      if (err) {
        logger.app.error('ESearchHandler.addMsgIndex failed!', err);
        return callback(result);
      }
      
      result.success = true;
      return callback(result);
    });
  },
  /**
   * searchIndex
   * 根据account和关键字搜索索引
   *
   * @param {Object} data
   * @param {number} data.limit
   * @param {number} data.page
   * @param {string} data.account
   * @param {string} data.keyword
   * @param {Function} callback
   */
  searchMsgIndex: function (data, callback) {
    var result = { success: false };
    var size = data.limit || 10000;
    var from = data.page - 1 || 0;
    var url = esUrl + '/' + esIndex + '/' + data.account + '/_search';
    var searchData = {
      size: size,
      from: from,
      query: {
        match: {
          message: {
            query: data.keyword,
            operator: 'and'
          }
        }
      },
      sort: [
        { _score: { order: 'desc' } },
        { when: { order: 'desc' } }
      ],
      _source: ['sessionId']
    };

    httpProvider.sendESRequest.get(url, searchData, function (err, foundIndexes) {
      if (err) {
        logger.app.error('ESearchHandler.searchMsgIndex failed!', err);
        return callback(result);
      }
      try{
        var _foundIndexes = JSON.parse(foundIndexes);

        result.data = _foundIndexes.hits.hits.map(function (index) {
          return index._source;
        });
        result.success = true;

        return callback(result);
      }catch (e) {
        logger.app.error(e);
        return callback(result);
      }
    });
  }
};

module.exports = handler;