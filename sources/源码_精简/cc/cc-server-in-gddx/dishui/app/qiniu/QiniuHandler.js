/**
 * Created by chenguang on 5/11/15.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var qiniuAPI = require('qiniu');
var fs = require('fs');
var httpProvider = require("appHttp");

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
        scope:fields.QINIU_TEST_BUCKET+'/'
    }
    var putPolicy = new qiniuAPI.rs.PutPolicy(putPolicy);

    var token = putPolicy.token();
    console.log("getUptokenByClient  token===="+token);
    result.uptoken = token;
    callback(result);
}
exports.getKmUptoken = function(data,session,callback){
    var result = {success: true};
    var putPolicy = {
        scope:'m7-km/'
    }
    var putPolicy = new qiniuAPI.rs.PutPolicy(putPolicy);

    var token = putPolicy.token();
    console.log("getKmUptoken  token===="+token);
    result.uptoken = token;
    callback(result);
}
exports.uploadEmailImageToQN = function(fileUrl, callback) {
    var putPolicy = new qiniuAPI.rs.PutPolicy({scope: fields.QINIU_EMAIL_BUCKET});
    var extra = new qiniuAPI.io.PutExtra();
    var date= utils.getCurrentDate();
    var today = new Date();
    var time=today.getTime();
    var fileSuffix = fileUrl.substr(fileUrl.lastIndexOf("."));
    var key ="email/"+time+"/" + utils.UUID.generateUuid() + fileSuffix;

    console.info("fileUrl=="+fileUrl+",fileSuffix==="+fileSuffix)
    qiniuAPI.io.putFile(putPolicy.token(), key, fileUrl, extra, function(err, ret) {
        if(!err) {
            // 上传成功， 处理返回值
            console.log(ret.key, ret.hash);
            callback(null, fields.QINIU_EMAIL_DOMAIN+key);
        } else {
            // 上传失败， 处理返回代码
            console.log('上传七牛失败');
            console.log(err);
            // http://developer.qiniu.com/docs/v6/api/reference/codes.html
            callback(err);
        }
    });
}

exports.getImUpTokenByClient = function(data,session,callback){
    var result = {success: true};
    var putPolicy = {
        scope:fields.QINIU_IM_BUCKET+'/'
    }
    if(data.scope){
        putPolicy.scope = data.scope;
    }
    var putPolicy = new qiniuAPI.rs.PutPolicy(putPolicy);

    var token = putPolicy.token();
    console.log("getImUpTokenByClient  token===="+token);
    result.uptoken = token;
    callback(result);
}

exports.delKmFile = function(data,session,callback){
    var result = {success: true};
    var client = new qiniuAPI.rs.Client();
    var bucketName="m7-km";
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
exports.delFile = function(data,session,callback){
    var result = {success: true};
    var client = new qiniuAPI.rs.Client();
    var bucketName=fields.QINIU_TEST_BUCKET;
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

exports.delImFile = function(data,session,callback){
    var result = {success: true};
    var client = new qiniuAPI.rs.Client();
    var bucketName=fields.QINIU_IM_BUCKET;
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

exports.getIvrMusicUptoken = function(data,session,callback){
    var result = {success: true};
    var putPolicy = {
        scope:'m7-ivr-music/',
        persistentOps: 'avthumb/wav/ab/128k/ar/8000',//转码操作
        persistentPipeline: 'IvrMusic'+utils.getRandomNum(1,3),//转码队列名
        persistentNotifyUrl: config.qiniu_mps_notify_url//转码成功后回调地址
    }
    var putPolicy = new qiniuAPI.rs.PutPolicy(putPolicy);

    var token = putPolicy.token();
    result.uptoken = token;
    callback(result);
};
exports.getKmAttachUrl = function(data,session, callback) {
    var result = {success: true};
    //console.dir(data)
    //构建私有空间的链接
    var url=fields.QINIU_KM_DOMAIN + data.fileName+"?attname="+data.trueName;
    var policy = new qiniuAPI.rs.GetPolicy();
    ////生成下载链接url
    var downloadUrl = policy.makeRequest(url);
    //console.info("downloadUrl========"+downloadUrl);
    result.downloadUrl=downloadUrl;
    callback(result);
}
exports.uploadKmImageToQN = function(fileUrl,fileSuffix,session, callback) {
    var putPolicy = new qiniuAPI.rs.PutPolicy({scope: "m7-km"});
    var extra = new qiniuAPI.io.PutExtra();
    var date= utils.DateTime.getCurrentDate();
    //var today = new Date();
    //var time=today.getTime();
    //console.info("fileUrl=="+fileUrl+",fileSuffix==="+fileSuffix)
    var key = session.user.account+"/km/"+date+"/"+utils.UUID.generateUuid()+fileSuffix;

    qiniuAPI.io.putFile(putPolicy.token(), key, fileUrl, extra, function(err, ret) {
        if(!err) {
            //构建私有空间的链接
            var url=fields.QINIU_KM_DOMAIN + key;
            var policy = new qiniuAPI.rs.GetPolicy(1892160000);//60年过期
            ////生成下载链接url
            var downloadUrl = policy.makeRequest(url);
            console.info("downloadUrl========"+downloadUrl);
            callback(null, downloadUrl);
        } else {
            // 上传失败， 处理返回代码
            console.log('上传七牛失败');
            console.log(err);
            // http://developer.qiniu.com/docs/v6/api/reference/codes.html
            callback(err);
        }
    });
}



exports.mpsNotify = function(data, callback){
    var result = {success: true};
    mongo.db().collection('manager_ivr_sound_qiniu_transfer').findOne({qiniuPersistentId: data.id}, function(err, doc){
        if(!err && doc){
            mongo.db().collection('manager_ivr_sound_qiniu_transfer').update({qiniuPersistentId: data.id}, {$set:{qiniuNotify:data}}, function(err){
                if(err){
                    logger.app.error(err);
                }
                mongo.db().collection('app_push_client').findOne({_id:doc.userId},function(err, pClient){
                    if(!err && pClient){
                        var pushMsg = {
                            userId: doc.userId,
                            eventData: {
                                Event: 'IvrSoundTransferNotify', Account: doc.account,
                                Data: {
                                    code : data.items[0].code,
                                    persistentId : doc.qiniuPersistentId
                                }
                            }
                        };
                        if(data.code == 0 && data.items[0].code == 0){
                            pushMsg.eventData.Data.url = 'http://7xo2y7.com2.z0.glb.qiniucdn.com/'+data.items[0].key;
                        }
                        logger.app.info("require push server userId["+doc.userId+"] msg:"+ JSON.stringify(pushMsg));
                        httpProvider.sendGet("http://"+pClient.pushServerIp+":"+pClient.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(pushMsg)), function(err, res) {
                            if (err) {
                                result.message = 'Sent require to push server error: ' + msg;
                                //callback(result);
                                return;
                            }
                        });
                    }
                })

            });
        }
    });
    callback(result);
}

