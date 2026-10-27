var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var appHttp = require('appHttp');
var constants = require(__baseDir + "/7moor/utils/Constants");


var handler = {
    buildWXMenu: function (data, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_weixin_config).findOne({_id: "menu"}, function (err, menu) {
            if (!err && menu) {
                utils.WeixinUtil.getAccessToken(function(err,token){
                    if(!err){
                        var access_token = token;
                        var url = "https://api.weixin.qq.com/cgi-bin/menu/create?access_token=" + access_token;
                        appHttp.sendSSLPost(url, menu.menu, function (err, data) {
                            if (!err) {
                                data = data + "";
                                data = JSON.parse(data);
                                if (data && data.errcode == 0) {
                                    result.success = true;
                                    callback(result);
                                } else {
                                    result.message = data.errmsg;
                                    callback(result);
                                }
                            } else {
                                logger.request.warn(" weixin create menu  error", err);
                                result.message = "weixin create menu  error！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("get weixin token error", err);
                        result.message = "获取微信token数据异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("get weixin menu error", err);
                result.message = "获取微信菜单数据异常！";
                callback(result);
            }
        });
    }
};

module.exports = handler;