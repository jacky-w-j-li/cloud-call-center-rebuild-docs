/**
 * 工具类
 */
var crypto = require('crypto');
var needle = require('needle');
var fs     = require('fs');
var utils  = require('appUtil/Utils');
var log    = require('appLog');
var config = require('../config');


/**
 * 获取签名
 * @param timestamp 时间戳
 * @param nonce 随机数
 * @param encrypt 加密的文本
 * @returns {*} 签名字符串
 */
exports.getSignature = function(otherToken,timestamp, nonce, encrypt) {
    var shasum = crypto.createHash('sha1');
    var arr = [otherToken, timestamp, nonce, encrypt].sort();
    shasum.update(arr.join(''));

    return shasum.digest('hex');
};

exports.load = function (stream, callback) {
    var buffers = [];
    stream.on('data', function (trunk) {
        buffers.push(trunk);
    });
    stream.on('end', function () {
        callback(null, Buffer.concat(buffers));
    });
    stream.once('error', callback);
};

/**
 * 增加表情
 * @param content
 * @returns {*}
 */
exports.adaptEmojiForWeixin = function(content){
    for (var i = 0; i < _impl.emojiFaces.length; i++) {
        for (var j = 0; j < _impl.emojiFaces[i].length; j++) {
            var pattern = new RegExp(_impl.emojiFaces[i][j], "g");
            if (content == undefined || content == null || content == "") return;
            content = content.replace(pattern, _impl.weixinEmojiCode[i][j]);
        }
    }
    return content;
};

exports.downLoadFile = function(url,type,callback){
    try {
        var fileStream = needle.get(url);
    } catch (e) {
        log.app.error('下载图片出错', e);
        return callback;
    }
    this.load(fileStream,function(err,buf){
        if(err){
            log.app.error('下载图片出错',err);
            return callback;
        }
        var tmpFile = config.tmp_file_dir + utils.UUID.generateUuid() + '.' +type;
        fs.writeFile(tmpFile, buf, function(err){
            if(err){
                log.app.error('写入临时文件出错',err)
                return callback;
            }
            callback(tmpFile);
        });
    });
};

/**
 * 表情包
 * @type {{emojiFaces: *[], weixinEmojiCode: *[]}}
 * @private
 */
var _impl = {
    emojiFaces : [
        [':smile:' , ':smiley:' , ':laughing:' , ':blush:'] ,
        [':heart_eyes:' , ':smirk:' , ':flushed:' , ':kissing_heart:'] ,
        [':grin:' , ':wink:' , ':stuck_out_tongue_winking_eye:' , ':stuck_out_tongue_closed eyes:'] ,
        [':sleeping:' , ':worried:' , ':expressionless:' , ':sweat_smile:'] ,
        [':joy:' , ':cold_sweat:' , ':sob:' , ':angry:'] ,
        [':mask:' , ':scream:' , ':sunglasses:' , ':heart:'] ,
        [':broken_heart:' , ':star:' , ':anger:' , ':exclamation:'] ,
        [':question:' , ':zzz:' , ':thumbsup:' , ':thumbsdown:'] ,
        [':ok_hand:' , ':punch:' , ':yeah:' , ':clap:'] ,
        [':muscle:' , ':pray:' , ':skull:' , ':trollface:']
    ] ,
    weixinEmojiCode : [
        ['\ue415' , '\ue057', '\ue40a', '\ue056'],
        ['\ue106', '\ue402', '\ue40d', '\ue418'],
        ['\ue404', '\ue405', '\ue105', '\ue409'],
        ['\ue408', '\ue058', '\ue403', '\ue415'],
        ['\ue412', '\ue40f', '\ue411', '\ue059'],
        ['\ue40c', '\ue107', '\ue414', '\ue022'],
        ['\ue023', '\ue32f', '\ue334', '\ue337'],
        ['\ue336', '\ue13c', '\ue00e', '\ue421'],
        ['\ue420', '\ue00d', '\ue011', '\ue41f'],
        ['\ue14c', '\ue41d', '\ue11c', '\ue10c']
    ]
}