var log = require('appLog');
var https = require('appHttp');
var utils = require('appUtil/Utils');
var db = require('appDb/MongoDb');
var Thenjs = require("thenjs");
var http = require('appHttp');
exports.updateUserInfo = function(appId, userName, accessToken,data,callback) {
    var userResult = {};
    db.db().collection('wx_user').findOne({_id: userName}, function(err, doc){
        if(doc) {
            userResult.isNewVisitor = false;
            callback(userResult);
            //todo 需要根据时间来更新用户信息，比如超过一个月，那就更新一下
            if(doc.last_update< utils.getCurrentDateTime() - 24 * 3600 * 1000 && doc.openid && doc.appid){
                var url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + accessToken + '&openid=' + doc.openid + '&lang=zh_CN';
                Thenjs(function (cont) {
                    http.sendHttps(url, cont);
                }).then(function (cont, result) {
                    log.app.info('获取用户信息返回值: ' + result);
                    var res = JSON.parse(result);
                    if (res.errcode && res.errcode != 0) {
                        cont(new Error(result));
                    }
                    if (res.subscribe) {
                        var setData = {
                            nickname: res.nickname || "",
                            last_update: utils.getCurrentDateTime()
                        };
                        db.db().collection('wx_user').update({openid: doc.openid, appid: doc.appid}, {$set: setData}, {w:1}, function(){});
                        cont(null);
                    } else {
                        cont(null);
                    }
                }).fail(function (cont, err) {
                    log.app.warn(err);
                });
            }
        } else {
            var flag = data.MsgType == 'event' ? false : true;
            if (data.MsgType == 'event' && data.EventKey == 'robot') {
                flag = true;
            }
            if (flag) {
                var url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + accessToken + '&openid=' + userName + '&lang=zh_CN';
                https.sendHttps(url, function (err, result) {
                    if (result) {
                        log.app.info(result.toString());
                        var temp = result.toString();
                        temp = temp.replace(/\n/g, "");
                        try {
                            var _result = JSON.parse(temp);
                        } catch (e) {
                            log.app.error(e);
                            log.app.error(temp);
                            userResult.isNewVisitor = false;
                            callback(userResult);
                            return;
                        }

                        /*
                         {
                         subscribe: 1,
                         openid: 'oMpomt4RMawHqwo2cH5arDFmTocw',
                         nickname: '蔡质彬',
                         sex: 1,
                         language: 'zh_CN',
                         city: '海淀',
                         province: '北京',
                         country: '中国',
                         headimgurl: 'http://wx.qlogo.cn/mmopen/zrz4NSUlzq79w0r4daeygGTVsQNzMg0s7qh1w5LqYumiaQoYVlX5XB8dxGQiadwO0P6aWoMjHGZEJ36RRh6L2wRw/0',
                         subscribe_time: 1431663551,
                         remark: '',
                         groupid: 0 }
                         */
                        if (_result.errcode && _result.errcode != 0) {
                            userResult.isNewVisitor = false;
                            callback(userResult);
                            return;
                        }
                        _result._id = _result.openid;
                        _result.last_update = utils.getCurrentDateTime();
                        _result.appid = appId;
                        db.db().collection('wx_user').insert(_result,{w:1}, function(err){
                            userResult.isNewVisitor = true;
                            callback(userResult);
                        });

                    } else {
                        log.app.warn(err);
                        userResult.isNewVisitor = false;
                        callback(userResult);
                    }

                });
            } else {
                userResult.isNewVisitor = false;
                callback(userResult);
            }
        }
    });
}