var util = require("appUtil/Utils");
var logger = require("appLog");
var mongo = require("appDb/MongoDb");
var httpProvider = require("appHttp");
var sha = require("crypto/sha1");
var Thenjs = require("thenjs");
var zbjUrls = {
    accessToken : 'http://openapi.zbj.com/oauth2/accesstoken',
    refreshToken : 'http://openapi.zbj.com/oauth2/refreshtoken',
    apiBase : 'http://openapi.zbj.com/router'
};
var zbjMethods = {
    getServiceUserInfo : 'zbj.user.getServiceUserInfo'
};
var constants = {
    app:{
        appKey : '201609221113134txRxP',
        appSecret : 'D8F231FB2CE1803A21235D4D3538F5E8',
        apiVersion : '1.0',
        protocol : 'http://',
        collectionName : 'zbj_auth_service_provider',
        relocateUrls : {
            success : 'http://register.7moor.com/collaborators/zbj-warrant-success.html',
            fail : 'http://register.7moor.com/collaborators/zbj-warrant-fail.html'
        },
        mail : {
            toAddr : [
                'pansy@7moor.com',
            ],
            type : 'registe',
            subject : '猪八戒服务商授权提醒',
            ccAddr : [
                'shanjc@7moor.com',
            ],
            status : 'undeal',
            content : '',
        }
    }
};

var service = {
    auth2: function (req, res, next) {
        var params = req.params;
        if(params.code){
            logger.app.info("A zbj service provider start auth our application");
            var redirect = constants.app.protocol + req.headers['host'] + req.route['path'];
            var info = null;
            // Thenjs(function(defer) {
            //     getAccessToken(params.code, redirect, defer);
            // }).then(function(defer, accessToken){
            //     if(accessToken != null) {
            //         if (accessToken.error) {
            //             logger.app.info('get zbj accessToken error --> ' + accessToken['error_description']);
            //             sendRelocation(res, constants.app.relocateUrls.fail);
            //             return;
            //         }
            //     }
            //     getServiceUserInfo(accessToken.openid, accessToken['access_token'], defer);
            // }).then(function(defer, suInfo){
            //     if(suInfo['errorToken']){
            //         logger.app.warn('get service provider info error --> ' + JSON.stringify(suInfo));
            //         sendRelocation(res, constants.app.relocateUrls.fail);
            //         return;
            //     }
            //     info = suInfo;
            //     mongo.db().collection(constants.app.collectionName).findOne({_id : suInfo.openid}, defer);
            // }).then(function(defer, doc){
            //     delete info['successToken'];
            //     if(doc == null){
            //         //The first time this service provider Auth our Application
            //         info._id = info.openid;
            //         info.firstAuthTime = new Date().getTime();
            //         info.latestAuthTime = info.firstAuthTime;
            //     }else{
            //         doc.latestAuthTime = new Date().getTime();
            //         for(var key in info){
            //             doc[key] = info[key];
            //         }
            //         info = doc;
            //     }
            //     mongo.db().collection(constants.app.collectionName).updateOne({_id : info.openid}, info, {upsert:1}, defer);
            // }).then(function(defer, msg){
            //     var mail = constants.app.mail;
            //     mail.content += '收到猪八戒合作平台服务商授权，授权信息如下：<br>';
            //     mail.content += '昵称：' + info.nickname+ '<br>';
            //     mail.content += '用户名：' + info.userName + '<br>';
            //     mail.content += '品牌名：' + info.brandname + '<br>';
            //     mail.content += '联系电话：' + info.mobile + '<br>';
            //     mail.content += '联系邮箱：' + info.email + '<br>';
            //
            //     mongo.ccDb('bill').collection('bill_system_mail_send').insert(mail, {}, defer);
            // }).then(function(defer, msg){
            //     sendRelocation(res, constants.app.relocateUrls.success);
            // }).fail(function(err){
            //     logger.app.error(err);
            //     sendRelocation(res, constants.app.relocateUrls.fail);
            //     return;
            // });
            // 原生回调方法
            getAccessToken(params.code, redirect, function(err, accessToken){
                if(accessToken != null){
                    if(accessToken.error){
                        logger.app.info('get zbj accessToken error --> ' + accessToken['error_description']);
                        sendRelocation(res, constants.app.relocateUrls.fail);
                    }else{
                        getServiceUserInfo(accessToken.openid, accessToken['access_token'], function(err, suInfo){
                            if(suInfo['errorToken']){
                                logger.app.warn('get service provider info error --> ' + JSON.stringify(suInfo));
                                sendRelocation(res, constants.app.relocateUrls.fail);
                            }else{
                                var find = {
                                    _id : suInfo.openid
                                };
                                mongo.db('interAPI').collection(constants.app.collectionName).findOne(find, function(err, doc){
                                    if(err){
                                        logger.app.error(err);
                                        sendRelocation(res, constants.app.relocateUrls.fail);
                                    }else{
                                        delete suInfo['successToken'];
                                        if(doc == null){
                                            //The first time this service provider Auth our Application
                                            suInfo._id = suInfo.openid;
                                            suInfo.firstAuthTime = new Date().getTime();
                                            suInfo.latestAuthTime = suInfo.firstAuthTime;
                                        }else{
                                            doc.latestAuthTime = new Date().getTime();
                                            for(var key in suInfo){
                                                doc[key] = suInfo[key];
                                            }
                                            suInfo = doc;
                                        }
                                        mongo.db('interAPI').collection(constants.app.collectionName).updateOne(find,suInfo,{upsert:1},function(err, msg){
                                            if(err){
                                                logger.app.error('save zbj service provider Info error' + err);
                                                sendRelocation(res, constants.app.relocateUrls.fail);
                                            }else{
                                                var mail = {};
                                                util.copyOjbData(mail, constants.app.mail, null);
                                                mail._id = util.UUID.generateUuid();
                                                mail.content += '收到猪八戒合作平台服务商授权，授权信息如下：<br>';
                                                mail.content += '昵称：' + suInfo.nickname+ '<br>';
                                                mail.content += '用户名：' + suInfo.userName + '<br>';
                                                mail.content += '品牌名：' + suInfo.brandname + '<br>';
                                                mail.content += '联系电话：' + suInfo.mobile + '<br>';
                                                mail.content += '联系邮箱：' + suInfo.email + '<br>';
                                                mongo.ccDb('bill').collection('bill_system_mail_send').insert(mail, {}, function(err){
                                                    if(err){
                                                        logger.app.error('send sp Info mail error' + err);
                                                        sendRelocation(res, constants.app.relocateUrls.fail);
                                                    }else{
                                                        sendRelocation(res, constants.app.relocateUrls.success);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    }
}

function getServiceUserInfo(openid, accessToken, callback){
    var shaParam = {
        appKey : constants.app.appKey,
        accessToken : accessToken,
        method : zbjMethods.getServiceUserInfo,
        v : constants.app.apiVersion,
        format : 'json',
        locale : 'zh_CN',
        timestamp : new Date().getTime(),
        openid : openid
    };
    shaParam.sign = zbjSha(shaParam);
    httpProvider.sendGet(zbjUrls.apiBase + jsonToString('GET', shaParam), function(err, zbjResult){
        if(err){
            logger.app.error('send getServiceUserInfo GET request failed!');
            callback('send getServiceUserInfo GET request failed!', null);
        }else{
            callback(null, JSON.parse(zbjResult));
        }
    });
}

function getAccessToken(code, redirect, callback){
    var shaParam = {
        client_id : constants.app.appKey,
        grant_type : "authorization_code",
        redirect_uri : redirect,
        code : code
    };
    shaParam.client_secret = zbjSha(shaParam);
    httpProvider.sendPost(zbjUrls.accessToken,jsonToString('POST',shaParam),function(err,zbjResult){
        if(err){
            logger.app.error('send accessToken POST request failed!');
            callback('send accessToken POST request failed!', null);
        }else{
            zbjResult = JSON.parse(zbjResult);
            callback(null, zbjResult);
        }
    });
}

function zbjSha(shaParams){
    var pKeys = [];
    for(var key in shaParams){
        pKeys.push(key);
    }
    pKeys.sort();
    var shaStr = constants.app.appSecret;
    for(var i=0; i<pKeys.length; i++){
        shaStr += (pKeys[i] + shaParams[pKeys[i]]);
    }
    shaStr += constants.app.appSecret;
    var shaStr = sha.hex_sha1(shaStr).toUpperCase();
    return shaStr;
}

function jsonToString(method, jsonObj){
    var getStr = '';
    if(method == 'GET'){
        getStr += '?';
    }
    for(var key in jsonObj){
        var kvPair = key + '=' + jsonObj[key];
        getStr += (kvPair + '&');
    }
    getStr = getStr.substr(0,getStr.length-1);
    return getStr;
}

function sendRelocation(res, relocation){
    res.writeHead(302, {
        'Location': relocation,

    });
    res.end();
}

module.exports = service;