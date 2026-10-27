/**
 * Created by chenguang on 5/11/15.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/im/common/Fields');
var config = require('appConfig').conf;
var qiniuAPI = require('qiniu');

exports.getUptoken = function(data, connectionId, callback){
    var result = {Succeed: true};
    var putPolicy = {
        scope:'m7-im-resources/'
    }
//    putPolicy.callbackUrl = "http://115.29.10.194:5000/public?action=qiniu.upCallback";
//    putPolicy.callbackBody = "key=$(key)&hash=$(etag)&w=$(imageInfo.width)&h=$(imageInfo.height)";
    //putPolicy.returnUrl = returnUrl;
    //putPolicy.returnBody = returnBody;
    //putPolicy.asyncOps = asyncOps;
    //putPolicy.expires = expires;
    var putPolicy = new qiniuAPI.rs.PutPolicy(putPolicy);

    var token = putPolicy.token();
    console.log("token===="+token);
    result.uptoken = token;
    callback(result);
}
exports.getUptokenFromCustomer = function(data, callback){
    var result = {success: false};
    var putPolicy = {
        scope:'m7-im-kefu'
    }
//    putPolicy.callbackUrl = "http://115.29.10.194:5000/public?action=qiniu.upCallback";
//    putPolicy.callbackBody = "key=$(key)&hash=$(etag)&w=$(imageInfo.width)&h=$(imageInfo.height)";
    //putPolicy.returnUrl = returnUrl;
    //putPolicy.returnBody = returnBody;
    //putPolicy.asyncOps = asyncOps;
    //putPolicy.expires = expires;
    var putPolicy = new qiniuAPI.rs.PutPolicy(putPolicy);

    var token = putPolicy.token();
    if(token){
        result.success = true;
        result.uptoken = token;
    }
    callback(result);
}

exports.upCallback = function(data, connectionId, callback){
    var result = {Succeed: true};
    for(var i in data){
        result[i]=data[i];
    }

    logger.app.info('qiniu up callback['+data+'] to client: success!');
    callback(result);
}


exports.delFile = function(data,connectionId,callback){
    var result = {Succeed: true};
    var client = new qiniuAPI.rs.Client();
    var bucketName="m7-im";
    var key=data.key;
    client.remove(bucketName, key, function(err, rep) {
        if (!err) {
            result.data = rep;
            result.Succeed=true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    })
}