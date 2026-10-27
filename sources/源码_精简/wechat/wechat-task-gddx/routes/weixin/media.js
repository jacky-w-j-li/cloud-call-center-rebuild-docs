var path       = require('path');
var fs         = require('fs');
var formStream = require('formstream');
var http       = require('urllib');
var appHttp    = require('appHttp');
var wechatAPI  = require('appWechat');
var config     = require('../../config');
var api        = new wechatAPI();

exports.uploadFile = function(accessToken, filePath, type, callback) {
    fs.stat(filePath, function (err, stat) {
        if (err) {
            return callback(err);
        }
        var form = formStream();
        form.file('media', filePath, path.basename(filePath), stat.size);
        var url = 'http://file.api.weixin.qq.com/cgi-bin/media/upload?access_token=' + accessToken + '&type=' + type;
        var opts = {
            dataType: 'json',
            type: 'POST',
            timeout: 60000,
            headers: form.headers(),
            stream: form
        };
        http.request(url, opts, callback);
    });
}

/**
 * 上传临时素材
 * @param accessToken
 * @param mediaId
 * @param callback
 */
exports.uploadMedia = function (filepath,type,accessToken,callback) {

    api._uploadMedia(filepath,type,accessToken,callback);
};


/**
 * 获取临时素材
 * @param accessToken
 * @param mediaId
 * @param callback
 */
exports.getMedia = function (accessToken, mediaId, callback) {

    api._getMedia(mediaId,accessToken,callback);
};


/**
 * 新增永久素材-其它素材
 * @param filepath
 * @param type
 * @param accessToken
 * @param callback
 */
exports.uploadMaterial = function(filepath, type,accessToken,callback){

    api._uploadMaterial(filepath, type,accessToken, callback);
};
/**
 * 上传图文消息内的图片获取URL
 * @param filepath
 * @param accessToken
 * @param callback
 */
exports.uploadImage = function(filepath,accessToken, callback){

    api._uploadImage(filepath,accessToken, callback);
}

/**
 * 新增永久素材-图文素材
 * @param accessToken
 * @param news
 * @param callback
 */
exports.uploadNewsMaterial = function(news,accessToken,callback){

    api._uploadNewsMaterial(news,accessToken,callback);
};
/**
 * 更新永久图文素材
 * @param news
 * @param accessToken
 * @param callback
 */
exports.updateNewsMaterial = function(news,accessToken,callback){
    api._updateNewsMaterial(news,accessToken,callback);
};
/**
 * 删除永久图文素材
 * @param mediaId
 * @param accessToken
 * @param callback
 */
exports.removeMaterial = function(mediaId,accessToken, callback){
    api._removeMaterial(mediaId,accessToken, callback);
};

/**
 * 获取永久素材
 * @param accessToken
 * @param mediaId
 * @param callback
 */
exports.getMaterial = function(mediaId,accessToken, callback){

    api._getMaterial(mediaId,accessToken,callback);
};

/**
 * 获取素材总数
 * @param accessToken
 * @param callback
 */
exports.getMaterialCount = function(accessToken,callback){

    api._getMaterialCount(accessToken,callback);
}
/**
 * 获取永久素材列表
 * @param type
 * @param offset
 * @param count
 * @param accessToken
 * @param callback
 */
exports.getMaterials = function(type, offset, count,accessToken, callback){

    api._getMaterials(type, offset, count,accessToken, callback);
}



