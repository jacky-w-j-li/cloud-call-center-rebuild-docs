var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var thenjs = require('thenjs');

exports.queryWebchat = function (data, session, callback) {
    var result = {success: false, webchatUrl: config.webchat_url};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = data;

    if(!condition.account){
        condition.account = session.user.account;
    }
    if (condition.name)
        condition.name = new RegExp(condition.name);
    utils.removeEmptyProperty(condition);
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    mongo.db().collection(fields.DB_APP_SDK_VERSIONS).findOne({isNew:true}, function (err, version) {
                        result.version = version || {};
                        callback(result);
                    });

                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });

}
exports.addWebchatCfg = function(data,session,callback){
    var result = {success: false};
    var id = utils.UUID.generateUuid();
    var aid=session.user.account;
    var time=utils.getCurrentDate();
    data._id = id;
    data.account=aid;
    data.createTime=time;
    data.PBX = session.user.pbx;
    data.cssStyle = {};
    data.cssStyle.onlineText = data.onlineText;
    data.cssStyle.offlineText = data.offlineText;
    data.cssStyle.styleColor = data.styleColor;
    delete data.styleColor;
    delete data.onlineText;
    delete data.offlineText;
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).insert(data, function (err) {
        if (!err) {
            result.success = true;
            result.webchatUrl = config.webchat_url;
            callback(result);
        } else {
            logger.app.error('db insert error:' + err.stack);
            result.message = 'db insert error!' + err.message;
            callback(result);
        }
    });
}
exports.queryWebchatCfgById = function(data,session,callback){
    var result = {success: false, webchatUrl: config.webchat_url};
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne(data, function (err,weixin) {
        if (!err) {
            result.success = true;
            result.data = weixin;
            callback(result);
        } else {
            logger.app.error('db queryWebchatCfgById error:' + err.stack);
            result.message = '404 webchat not found!';
            callback(result);
        }
    });
}
exports.updateWebchatCfg = function(data,session,callback){
    var result = {success: false};
    var id = data._id;
    delete data._id;
    var aid=session.user.account;
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({_id:id},function(err,webchat){
        if(!err){
            if(webchat){
                data.cssStyle = {};
                data.cssStyle.onlineText = data.onlineText;
                data.cssStyle.offlineText = data.offlineText;
                data.cssStyle.styleColor = data.styleColor;
                delete data.styleColor;
                delete data.onlineText;
                delete data.offlineText;
                data.updateTime = utils.getCurrentDate();
                mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).update({_id:id},{$set:data}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error('db insert error:' + err.stack);
                        result.message = 'db insert error!' + err.message;
                        callback(result);
                    }
                });
            }else{
                result.message = '未找到该接入号！';
                callback(result);
            }
        }else{
            logger.app.error('db query error:' + err.stack);
            result.message = 'db query error!' + err.message;
            callback(result);
        }
    });
}

exports.deleteWebchatCfg = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({_id:data._id},function(err,webchat){
        if(!err){
            if(webchat){
                mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).remove({_id: data._id}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error('db deleteWebchatCfg error:' + err.stack);
                        result.message = '404 webchat not found!';
                        callback(result);
                    }
                });
            }else{
                result.message = '404 webchat not found!';
                callback(result);
            }
        }else{
            result.message = 'find this webcaht failed!';
            callback(result);
        }
    });
};

exports.checkWebSiteEmebedScript = function(data, session, callback){
    var result = {success: false};

    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, function(err, webchatConfig){
        if(!err){
            if(webchatConfig){
                var location = webchatConfig.location || [];
                for(var i=0; i< location.length; i++){
                    if(data.location){
                        if(location[i] == data.location){
                            result.success=true;
                            callback(result);
                            return;
                        }
                    }else{
                        if(location[i].indexOf("webchat.7moor.com") == -1){
                            result.success=true;
                            callback(result);
                            return;
                        }
                    }

                }
                result.message="网站植入脚本失败，请确认网站是否有植入上述脚本，并确保脚本中的accessId参数没有更改过！";
                callback(result);

            }else{
                result.message = '还未配置过在线客服!';
                callback(result);
            }
        }else{
            result.message="查找在线客服配置信息失败!";
            callback(result);
        }
    });
};

exports.queryAllAccessId = function(session, callback){
        thenjs.parallel(
            [
                function(cont){
                    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).find({account: session.user.account},{fields:{accessId:1, name:1, ToPeer:1, platform:1},sort:{platform:1}}).toArray(function(err, docs){
                        if(err || !docs){
                            cont(null,[]);
                        }else{
                            for(var i=0; i<docs.length; i++){
                                docs[i]._id = docs[i].accessId;
                            }
                            cont(null, docs);
                        }
                    });
                },
                function(cont){
                    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).find({account: session.user.account},{fields:{_id:1, nick_name:1, to_peer:1}}).toArray(function(err, docs){
                        if(err || !docs){
                            cont(null, []);
                        }else{
                            for(var i=0; i<docs.length; i++){
                                docs[i].name = docs[i].nick_name;
                                delete docs[i].nick_name;
                                docs[i].ToPeer = docs[i].to_peer;
                                delete docs[i].to_peer;
                                docs[i].platform = "weixin"
                            }
                            cont(null,docs);
                        }
                    });
                }
            ]).then(function(cont, result) {
                var docs = [];
                while(result.length > 0){
                    var ele = result.pop();
                    docs = docs.concat(ele);
                }
                callback(null, docs);
            }).fail(function(cont, error){
                callback(error);
        });





};

