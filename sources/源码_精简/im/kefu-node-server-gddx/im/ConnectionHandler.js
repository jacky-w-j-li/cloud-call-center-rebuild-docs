var sdkSessionHandler = require(__baseDir + '/im/SdkSessionHandler');

var handler = {

    connectionBreak : function(data, connection, callback){
        var result = {Succeed: false};
        sdkSessionHandler.breakConnection(data, connection, function(res){
            if(res.Succeed){
                result.Succeed = true;
                callback(result);
            }else{
                result.Message = res.Message;
                callback(result);
            }
        })
    }

};

module.exports = handler;
