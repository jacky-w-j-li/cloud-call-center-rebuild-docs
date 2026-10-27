var handler = require('./SyncHandler')
var logger = require('appLog');
var httpProvider = require('appHttp');
var appConfig = require('appConfig').conf;

exports.handle = function (data, callback) {
    var result = {success: false};
    var eventType = data.eventType;
    if (eventType) {
        if (handler[eventType]) {
            handler[eventType](JSON.parse(data.eventMsg), callback);
        } else {
            result.message = 'event [' + eventType + '] has no handler!';
            callback(result);
        }
    } else {
        result.message = 'eventType is null!';
        callback(result);
    }


}

exports.sendBillEvent = function (type, data, callback) {
    var result = {success: false};
    var url = appConfig.billUrl + type + '?json=' + JSON.stringify(data);
    httpProvider.sendGet(url, function (err, reponseData) {
        if (!err) {
            try {
                var res = JSON.parse(reponseData);
                if (res.resultCode == '0000') {
                    res.data.status = res.data.status || 200;
                    if (res.data.success && res.data.status == 200) {
                        result.success = true;
                    } else {
                        logger.app.warn('request bill server get status :' + res.data.status + "[" + res.data.remark + "]");
                        result.message = res.data.status + "[" + res.data.remark + "]";
                    }
                } else {
                    logger.app.warn('request bill server get code :' + res.resultCode);
                    result.message = 'bill error code :' + res.resultCode;
                }
            } catch (e) {
                logger.app.error(e.stack);
                result.message = e.message;
            }

        } else {
            logger.app.error(err.stack);
            result.message = 'sync bill error!';
        }
        callback(result);
    });
}