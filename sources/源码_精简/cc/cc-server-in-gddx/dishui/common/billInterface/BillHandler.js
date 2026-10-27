var handler = require('./BillHandlerImpl');
var logger = require('appLog');
var httpProvider = require('appHttp');

exports.handle = function(data,callback){
    var result = {success: false};
    var interType = data.interType;
    if (interType) {
        if (handler[interType]) {
            handler[interType](data.data, callback);
        } else {
            result.message = 'interType [' + interType + '] has no handler!';
            callback(result);
        }
    } else {
        result.message = 'interType is null!';
        callback(result);
    }
    var result = {success: false};
}