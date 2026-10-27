var httpProvvider = require('appHttp');
var appConfig = require('appConfig').conf;
var fields = require(__baseDir + '/dishui/common/Fields');

exports.getServiceNoState = function (data, session, callback) {
    get("getServiceNoStatus", data, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if (result.services) {
            callback(null, fields.SERVICENO_USED);
        } else {
            callback(null, fields.SERVICENO_IDLE);
        }
    });
};


exports.addServiceNo = function(data, session, callback){
    get("addAccountServiceNum",data,function(err,result){
       if(err){
           callback(err);
           return;
       }
       callback(null,result);
    });
}

exports.delServiceNo = function(data, session, callback){
    get("deleteAccountServiceNum", data, function (err, result) {
        if(err){
            callback(err);
            return;
        }
        callback(null,result);
    });
};

exports.getSmsLeaveCount = function(data, result, callback) {
    get("getSmsLeaveCount", data, function (err, callbackData) {
        try {
            if(err) {
                result.success = false;
                result.message = "getSmsLeaveCount error!";
                callback(result, null);
            } else {
                result.success = true;
                callback(result, callbackData);
            }
        } catch (e) {
            result.success = false;
            result.message = "getSmsLeaveCount error!";
            callback(result, null);
        }
    });
};

exports.addSms = function(data, result, callback) {
    get("addSms", data, function (err, callbackData) {
        try {
            if(err) {
                result.success = false;
                result.message = "addSms error!";
                callback(result);
            } else {
                result.success = true;
                callback(result);
            }
        } catch (e) {
            result.success = false;
            result.message = "addSms error!";
            callback(result);
        }
    });
};

function get(interfaceName, data, callback) {
    var url = appConfig.billUrl + interfaceName + "?json=" + JSON.stringify(data);
    httpProvvider.sendGet(url, function (err, callbackData) {
        if (err) {
            callback(err);
            return;
        }
        callbackData = JSON.parse(callbackData.toString());
        if (callbackData.resultCode && callbackData.resultCode == '0000') {
            var returnData = callbackData.data;
            if (returnData && returnData.success) {
//                if (!returnData.status || returnData.status == '200') {
//                    callback(null, returnData.info);
//                    return;
//                }
                callback(null, returnData);
                return;
            }
        }
        callback(new Error('Require bill interface failure: %s', url));
    });
};