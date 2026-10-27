/**
 * 自定义菜单管理
 * 提供修改微信公众账号的菜单设置
 */
var config = require('../../config');
var utils = require('appUtil/Utils');
var http = require('appHttp');
var log = require('appLog');

var wechat = require('wechat-enterprise');

/**
 * 自定义菜单查询接口
 * @param accessToken
 */
module.exports.get = function(accessToken,callback){

    var url = 'https://api.weixin.qq.com/cgi-bin/menu/get?access_token='+accessToken;

    http.sendHttps(url,function(err, result){
        if(result) {
            var _result = JSON.parse(result);
            log.app.info(_result);
            if(_result.errcode == 0){
                callback(_result);
            }else{
                callback({menu:''});
            }
        } else {
            log.app.warn(err);
            callback({menu:''});
        }
    });

}

/**
 * 自定义菜单创建接口
 * @param postData
 * @param accessToken
 */
module.exports.create = function(postData, accessToken,callback){
    var url = ' https://api.weixin.qq.com/cgi-bin/menu/create?access_token='+accessToken;
    http.sendHttpsPost(url, postData, function(err, result){
        if(result) {
            var _result = undefined;
            try{
                _result = JSON.parse(result);
            }catch(e){
                log.app.error(e);
                _result.errcode = -1;
            }
            if(_result.errcode == 0){
                callback(true);
            }else{
                callback(false);
            }
            log.app.info(_result);
        } else {
            log.app.warn(err);
            callback(false);
        }
    });

}
/**
 * 自定义菜单删除接口
 * @param accessToken
 */
module.exports.delete = function(accessToken,callback){
    var url = 'https://api.weixin.qq.com/cgi-bin/menu/delete?access_token='+accessToken;
    http.sendHttps(url, function(err, result){
        if(result) {
            var _result = undefined;
            try{
                _result = JSON.parse(result);
            }catch(e){
                log.app.error(e);
                _result.errcode = -1;
            }
            if(_result.errcode == 0){
                callback(true);
            }else{
                callback(false);
            }
            log.app.info(_result);
        } else {
            log.app.warn(err);
            callback(false);
        }
    });

}
/**
 * 获取自定义菜单配置接口
 * @param accessToken
 */
module.exports.get_current_selfmenu_info = function(accessToken,callback){

    var url = 'https://api.weixin.qq.com/cgi-bin/get_current_selfmenu_info?access_token='+accessToken;

    http.sendHttps(url, function(err, result){
        if(result) {
            var _result = JSON.parse(result);
            log.app.info(_result);
            callback(_result);
        } else {
            log.app.warn(err);
            callback({success: false});
        }
    });

}




