var log = require('appLog');
var config = require('../../config');
var db = require('appDb/MongoDb');
var urlencode = require('urlencode');

//todo 请求授权地址的时候，要加一个参数account，用来标记哪个账户申请，暂时先写死一个测试
module.exports.getPreAuthCode = function(action, callback) {
    var appId = action.appId || config.defalutAppId;
    db.db().collection('component').findOne({_id: appId}, function(err, result){
        if(result) {
            var url = 'https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid='+ appId
                +'&pre_auth_code='+ result.pre_auth_code
                +'&redirect_uri=' + urlencode(config.redirect_uri+'/'+action.account+"_"+appId);
            callback(url);
        } else {
            log.warn(err);
            callback('404');
        }
    });
}
