var config = require('../../config');
var log = require('appLog');
var http = require('appHttp');
var utils = require('appUtil/Utils');
var db = require('appDb/MongoDb');
//var schedule = require("node-schedule");
var Thenjs = require("thenjs");
var customService = require('./customService');

module.exports.init = function() {
    refreshAuth();
    refreshPreAuthCode();
}

/**
 * 公众号授权给第三方平台后，微信会回调指定的URL，发送auth_code和expires_in
 *
 *
 */
module.exports.authCode = function (req, res) {
    log.app.info(req.query);
    var accountStr = req.params.account;
    var account = accountStr.split("_")[0];
    var appId = accountStr.split("_")[1];
    Thenjs(function (cont) {
        if (req.query.auth_code) {
            res.render('redirect', {code: "success"});
            log.app.info("redirect");
            var authCode = req.query.auth_code;
            console.log('获得的授权码  ' + authCode);
            db.db().collection("component").findOne({_id: appId}, function (err, dbApp) {
                cont(err, dbApp, authCode);
            });
        } else {
            res.render('redirect', {code: "fail"});
            log.app.warn('no auth code!!!!!!!');
        }
    }).then(function (cont, dbApp, authCode) {
        if(dbApp){
            getPreAuthCode(dbApp);
            /*
             使用授权码换取公众号的授权信息
             */
            var url = 'https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token=' + dbApp.component_access_token;
            var data = {
                component_appid: appId,
                authorization_code: authCode
            }
            http.sendHttpsPost(url , data , function(err , result ){
                cont(err , result , dbApp);
            });
        } else {
            log.app.warn('can not found dbApp by [' + appId + "]");
        }
    }).then(function(cont , result ,dbApp){
        try{
            var doc = JSON.parse(result);
            if(doc.errcode){
                cont(new Error("parse [api_query_auth] data error!"));
            } else {
                var myData = {
                    account: account,
                    appId : appId,
                    authorizer_appid: doc.authorization_info.authorizer_appid,
                    authorizer_access_token: doc.authorization_info.authorizer_access_token,
                    expires_in: doc.authorization_info.expires_in,
                    authorizer_refresh_token: doc.authorization_info.authorizer_refresh_token,
                    func_info: doc.authorization_info.func_info,
                    from:'weixin',
                    menu:'',
                    last_update: utils.getCurrentDateTime(),
                    last_update_time: utils.getCurrentDate()
                }
                log.app.info('授权的公众号信息  ' +doc.authorization_info.authorizer_appid );
                db.db().collection('wxaccount').findOne({_id: doc.authorization_info.authorizer_appid}, function(err , data){
                    cont(err , data , myData , dbApp);
                });
            }
        } catch (e){
            cont(e);
        }
    }).then(function(cont , data , myData , dbApp){
        if(data){
            db.db().collection('wxaccount').update({_id: data._id}, {$set: myData});
            // 更改客户账号的所属
            if (data.account !== myData.account) {
                db.db().collection('wx_customservice').update({
                    account: data.account,
                    appid: data._id
                }, { $set: { account: myData.account } }, { multi: true });
            }
        } else {
            myData._id = myData.authorizer_appid;
            db.db().collection('wxaccount').insert(myData);
            // 获取客服账号并保存至数据库
            customService.getAll(myData.authorizer_access_token, function (err, kfList) {
                if (err) {
                    log.app.error('error import custom service accounts', err);
                } else {
                    kfList.forEach(function (ele) {
                        var insertData = {
                            _id: ele.kf_account,
                            account: myData.account,
                            appid: myData._id,
                            kf_account: ele.kf_account,
                            nickname: ele.kf_nick,
                            imgUrl: ele.kf_headimgurl
                        };

                        db.db().collection('wx_customservice').update({ _id: ele.kf_account }, insertData, { upsert: true });
                    });
                }
            });
        }
        //获取授权账户的详细信息
        getAuthInfo(myData.authorizer_appid , dbApp);
    }).fail(function(cont , err){
        log.app.warn("process [authCode] error !!", err || new Error(""));
    });
}
//https://api.weixin.qq.com/cgi-bin/component/api_component_token
//https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
//获取第三方平台access_token
module.exports.getAccessToken = function (appId , ticket) {
    var currentTime = utils.getCurrentDateTime();
    Thenjs(function(cont){
        db.db().collection('component').findOne({_id:appId},function(err , dbApp){
            dbApp = dbApp || {};
            cont(err,dbApp);
        });
    }).then(function(cont,dbApp){
        if(dbApp.last_update && (currentTime - dbApp.last_update < 100*60000) ){
            //未过期，不用处理
        } else {
            var url = 'https://api.weixin.qq.com/cgi-bin/component/api_component_token';
            var data = {
                component_appid: appId,
                component_appsecret: dbApp.component_appsecret,
                component_verify_ticket: ticket || dbApp.component_verify_ticket
            };
            http.sendHttpsPost(url , data , function(err , result){
                cont(err , result ,dbApp);
            });
        }
    }).then(function(cont, result , dbApp){
        console.log("get result========="+result);
        var res = JSON.parse(result);
        if(res.component_access_token){
            var doc = {
                component_verify_ticket: ticket || dbApp.component_verify_ticket,
                component_access_token: res.component_access_token,
                expires_in: res.expires_in,
                last_update: utils.getCurrentDateTime(),
                last_update_time: utils.getCurrentDate()
            }
            db.db().collection("component").update({_id:appId},{$set:doc},function(err){
                dbApp.component_verify_ticket = doc.component_verify_ticket;
                dbApp.component_access_token = doc.component_access_token;
                dbApp.expires_in = doc.expires_in;
                dbApp.last_update = doc.last_update;
                dbApp.last_update_time = doc.last_update_time;
                cont(err , dbApp);
            });
        } else {
            log.app.warn('get  access_tokenfailed: '+result);
        }
    }).then(function(cont , dbApp){
        if(!dbApp.pre_auth_code_expires_in){
            getPreAuthCode(dbApp);
        }
    }).fail(function(cont , err ){
        log.app.warn("process [getAccessToken] error !!", err || new Error(""));
    });
}
/**
 * 微信公众号取消授权
 * 修改公众号
 */
module.exports.unauthorized = function (authorizerAppid) {

    db.db().collection('wxaccount').remove({_id: authorizerAppid},function(err){
        if(err){
            log.app.error(err);
        }
    });
}

// 获取预授权码
var getPreAuthCode = function (dbApp) {
    var url = 'https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token='+dbApp.component_access_token;
    var data = {
        component_appid: dbApp.component_appid
    };

    http.sendHttpsPost(url, data, function(err, result){
        if(err) {
            log.app.info(err);
            console.dir(err);
        } else {
            console.dir('got pre_auth_code: '+result);
            /**
             * {
                "pre_auth_code":"Cx_Dk6qiBE0Dmx4EmlT3oRfArPvwSQ-oa3NL_fwHM7VI08r52wazoZX2Rhpz1dEw",
                "expires_in":600
                }
             */
            var res = JSON.parse(result);
            if(res.pre_auth_code) {
                var doc = {
                    pre_auth_code: res.pre_auth_code,
                    pre_auth_code_expires_in: res.expires_in,
                    pre_auth_code_last_update: utils.getCurrentDateTime(),
                    pre_auth_code_last_update_time: utils.getCurrentDate()
                }
                db.db().collection('component').update({_id: dbApp.component_appid}, {$set: doc});
            } else {
                log.app.warn('get PreAuthCode failed: '+result);
            }
        }
    });
}

//https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token=xxx
var refreshPreAuthCode = function() {
    var rule = new schedule.RecurrenceRule();
    rule.second = 20;
    var j = schedule.scheduleJob(rule, function(){
        log.app.info("开始检查 refreshPreAuthCode......");
        var currentTime = utils.getCurrentDateTime();
        Thenjs(function(cont){
            db.db().collection("component").find({}).toArray(function(err , apps){
                cont(err , apps);
            });
        }).then(function(cont , apps){
            apps = apps || [];
           for(var i =0;i<apps.length;i++){
               var app = apps[i];
               if(app.pre_auth_code_expires_in && (app.pre_auth_code_expires_in*1000 + app.pre_auth_code_last_update - currentTime < 3 * 60000)){
                   log.app.info("开始进行["+app._id+"] refreshPreAuthCode......");
                   getPreAuthCode(app);
               }
           }
        }).fail(function(cont , err){
            log.app.warn("process [refreshPreAuthCode] error !!", err || new Error(""));
        });
    });

}

/**
 * 定时执行任务，从数据库查询授权账户，根据到期时间来刷新授权公众号的令牌
 */
var refreshAuth = function() {
    var rule = new schedule.RecurrenceRule();
    rule.second = 1;
    var j = schedule.scheduleJob(rule, function(){
        log.app.info("开始检查 refreshAuth......");
        Thenjs(function(cont){
            var currentTime = utils.getCurrentDateTime();
            var needRefresh = currentTime - 6600000;
            log.app.info('执行刷新公众号令牌任务: 现在[' + currentTime + '] ' + needRefresh);
            db.db().collection("wxaccount").find({last_update: {$lt: needRefresh},from:'weixin'},['authorizer_appid', 'authorizer_refresh_token','appId']).sort({last_update: -1}).toArray(cont);
        }).then(function(cont , docs){
            docs = docs || [];
            var url = 'https://api.weixin.qq.com/cgi-bin/component/api_authorizer_token?component_access_token=';
            Thenjs()
                .each(docs,function(cont , value , index , array){
                    var appId = value.appId || config.defalutAppId;
                    db.db().collection("component").findOne({_id:appId},function(err , dbApp){
                        if(dbApp){
                            refreshOneAccessToken(url + dbApp.component_access_token,value);
                        } else {
                            log.app.warn(new Error("can not found dbApp by id [" + appId + "]"));
                        }
                    });
                });
        });
    });
}

function refreshOneAccessToken(url , data){
    Thenjs(function(cont){
        var postData = {
            component_appid: data.appId || config.defalutAppId,
            authorizer_appid: data.authorizer_appid,
            authorizer_refresh_token: data.authorizer_refresh_token
        }
        http.sendHttpsPost(url, postData, cont);
    }).then(function(cont , result){
        log.app.info('刷新令牌返回值: ' + result);
        var res = JSON.parse(result);
        if (res.authorizer_access_token) {
            var setData = {
                authorizer_access_token: res.authorizer_access_token,
                last_update: utils.getCurrentDateTime(),
                last_update_time: utils.getCurrentDate(),
                expires_in: res.expires_in
            };
            db.db().collection('wxaccount').update({_id: data.authorizer_appid},{$set: setData});
            cont(null);
        } else {
            cont(new Error("get authorizer_access_token error!"));
        }
    }).fail(function(cont,err){
        log.app.warn(err);
    });

}

/**
 * 查询授权公众号的详细信息
 */
var getAuthInfo = function(appId , dbApp) {
    var url = 'https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?component_access_token='+dbApp.component_access_token;
    var postData = {
        component_appid : dbApp._id,
        authorizer_appid: appId
    }
    http.sendHttpsPost(url, postData, function(err, result){
        if(err) {
            log.app.warn(err);
            console.dir(err);
        } else {
            console.dir('got pre_auth_code: '+result);
            /**
             * {
                "authorizer_info": {
                "nick_name": "微信SDK Demo Special",
                "head_img": "http://wx.qlogo.cn/mmopen/GPyw0pGicibl5Eda4GmSSbTguhjg9LZjumHmVjybjiaQXnE9XrXEts6ny9Uv4Fk6hOScWRDibq1fI0WOkSaAjaecNTict3n6EjJaC/0",
                "service_type_info": { "id": 2 },
                "verify_type_info": { "id": 0 },
                "user_name":"gh_eb5e3a772040",
                "alias":"paytest01"
                },
                "qrcode_url":"URL",
                "authorization_info": {
                "appid": "wxf8b4f85f3a794e77",
                "func_info": [
                { "funcscope_category": { "id": 1 } },
                { "funcscope_category": { "id": 2 } },
                { "funcscope_category": { "id": 3 } }
                ]
                }
                }
             */
            var res = JSON.parse(result);
            var doc = {
                nick_name: res.authorizer_info.nick_name,
                head_img: res.authorizer_info.head_img,
                service_type_info: res.authorizer_info.service_type_info,
                verify_type_info: res.authorizer_info.verify_type_info,
                user_name: res.authorizer_info.user_name,
                alias: res.authorizer_info.alias,
                qrcode_url: res.qrcode_url
            }
            db.db().collection('wxaccount').update({_id: appId}, {$set: doc});
        }
    });
}

