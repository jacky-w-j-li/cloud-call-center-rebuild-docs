/**
 * Created by chenguang on 5/11/15.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');

var config = require('appConfig');
var qiniuAPI = require('qiniu');
var fs = require('fs');


exports.getUptoken = function(data,callback){
    var result = {success: true};
    var putPolicy = {
        scope:'m7-test/'
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

exports.upCallback = function(data,callback){
    var result = {success: true};
    for(var i in data){
        result[i]=data[i];
    }

    logger.app.info('qiniu up callback['+data+'] to client: success!');
    callback(result);
}

exports.getUptokenByClient = function(data,session,callback){
    var result = {success: true};
    var putPolicy = {
        scope:'m7-test/'
    }
    var putPolicy = new qiniuAPI.rs.PutPolicy(putPolicy);

    var token = putPolicy.token();
    console.log("getUptokenByClient  token===="+token);
    result.uptoken = token;
    callback(result);
}
exports.delFile = function(data,session,callback){
    var result = {success: true};
    var client = new qiniuAPI.rs.Client();
    var bucketName="m7-test";
    var key=data.key;
    client.remove(bucketName, key, function(err, rep) {
        if (!err) {
            result.data = rep;
            result.success=true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    })
}



