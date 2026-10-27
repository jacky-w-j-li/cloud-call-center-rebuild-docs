var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var agentDic = require(__baseDir + "/7moor/ucenter/AgentHandler");
var hangUpSmsHandler = require(__baseDir + '/7moor/ucenter/HangUpSmsHandler');
var smsTemplateToCheckHandler = require(__baseDir + "/7moor/sms/SmsTemplateToCheckHandler");

var gloabCacheConf = {
    agents: agentDic.getAgentDic,
    ivrNums: agentDic.queryMyIvrServiceNo,
    smsSign:hangUpSmsHandler.getSmsSignCache,
}


var cacheHandler = {
    getDicCache: function (data, session, callback) {
        var result = {success: false};
        var cacheType = data.type;
        if (cacheType) {
            if (gloabCacheConf[cacheType]) {
                gloabCacheConf[cacheType](session, function (err, data) {
                    if (!err) {
                        result.success = true;
                        result.data = data;
                        callback(result);
                    } else {
                        logger.app.error('getCache[' + cacheType + '] error!', err);
                        result.message = 'getCache[' + cacheType + '] error!';
                        callback(result);
                    }
                });
            }
        } else {
            impl.getGeneralCodesCache(session, function (err, map) {
                if (!err) {
                    result.success = true;
                    result.dicMap = map;
                    callback(result);
                } else {
                    logger.app.error('dicCache error!', err);
                    result.message = 'getGeneralCodesCache error!';
                    callback(result);
                }
            });
        }
    }

}

var impl = {
    getGeneralCodesCache: function (session, callback) {
        mongo.db().collection(constants.DB.system_general_codes).find({}, {sort: {codeType: -1, codeOrder: 1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var dicMap = impl.proceeCodeForMap(docs);
                callback(null, dicMap);
            } else {
                callback(err);
            }
        });
    },
    proceeCodeForMap: function (docs) {
        docs = docs || [];
        var result = {};
        var keys = [];
        for (var i = 0; i < docs.length; i++) {
            var data = docs[i];
            if (keys.contains(data.codeType)) {
                result[data.codeType].push(data);
            } else {
                keys.push(data.codeType);
                result[data.codeType] = [data];
            }
        }
        return result;
    }

}

module.exports = cacheHandler;
