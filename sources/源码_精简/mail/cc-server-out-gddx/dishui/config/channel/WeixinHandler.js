var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');

exports.queryWeixin = function (data, session, callback) {
    var result = {success: false};
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
    utils.removeEmptyProperty(condition);
    if (condition.openID)
        condition.openID = new RegExp(condition.openID);
    mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
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
exports.addWeixinCfg = function(data,session,callback){
    var result = {success: false};
    var id = utils.UUID.generateUuid();

    var aid=session.user.account;
    var time=utils.getCurrentDate();
    data._id = id;
    data.account=aid;
    data.createTime=time;

    var aid=session.user.account;
    var isDefault=data.isDefault;
    mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).findOne({openID:data.openID},function(err,weixin){
        if(!err){
            if(!weixin){
                var ivrData = {};
                ivrData.Action = "PeerAdd";
                ivrData.Peer = "WeixinAddr";
                ivrData.DisplayName = data.openID;
                ivrData.Exten = data.openID;
                ivrData.synAcsSign = "1";
                ivrData.Account = session.user.account;
                ivrData.PBX = session.user.pbx;
                ivrData.ToPeer = data.ToPeer;
                var ivrData = {
                    nodeData: ivrData
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = "Add mail Addr failure:" + data.Exten;
                        result.success = false;
                        callback(result);
                        return;
                    }
                    data.accountSID = utils.UUID.generateUuid();
                    mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).insert(data, function (err) {
                        if (!err) {
                            if(isDefault=="1"){
                                mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).update({account:aid,_id:{$ne:id}},{$set:{isDefault:'0'}},{multi: true});
                            }
                            _impl._addOrUpdateWeixinConfig(data,function(success){
                               if(success){
                                   result.success = true;
                                   callback(result);
                               } else {
                                   result.message = "同步微信服务失败！";
                                   callback(result);
                               }
                            });

                        } else {
                            logger.app.error('db insert error:' + err.stack);
                            result.message = 'db insert error!' + err.message;
                            callback(result);
                        }
                    });
                });
            }else{
                result.message = '微信服务号已经存在！';
                callback(result);
            }
        }else{
            logger.app.error('db query error:' + err.stack);
            result.message = 'db query error!' + err.message;
            callback(result);
        }
    });
}
exports.queryWeixinCfgById = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).findOne(data, function (err,weixin) {
        if (!err) {
            result.success = true;
            result.data = weixin;
            callback(result);
        } else {
            logger.app.error('db queryWeixinCfgById error:' + err.stack);
            result.message = '404 weixincfg not found!';
            callback(result);
        }
    });
}
exports.updateWeixinCfg = function(data,session,callback){
    var result = {success: false};
    var id = data._id;
    delete data._id;
    var aid=session.user.account;
    var isDefault=data.isDefault;
    mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).findOne({openID:data.openID},function(err,weixin){
        if(!err){
            if(weixin){
                var ivrData = {};
                ivrData.Action = "PeerAdd";
                ivrData.Peer = "WeixinAddr";
                ivrData.DisplayName = data.openID;
                ivrData.Exten = data.openID;
                ivrData.synAcsSign = "1";
                ivrData.Account = session.user.account;
                ivrData.PBX = session.user.pbx;
                ivrData.ToPeer = data.ToPeer;
                var ivrData = {
                    nodeData: ivrData
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = "update mail Addr failure:" + data.Exten;
                        result.success = false;
                        callback(result);
                        return;
                    }
                    delete data.oldMailId;
                    mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).update({_id:id},{$set:data}, function (err) {
                        if (!err) {
                            if(isDefault=="1"){
                                mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).update({account:aid,_id:{$ne:id}},{$set:{isDefault:'0'}},{multi: true});
                            }
                            data.accountSID = weixin.accountSID;
                            _impl._addOrUpdateWeixinConfig(data,function(success){
                                if(success){
                                    result.success = true;
                                    callback(result);
                                } else {
                                    result.message = "同步微信服务失败！";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error('db insert error:' + err.stack);
                            result.message = 'db insert error!' + err.message;
                            callback(result);
                        }
                    });
                });
            }else{
                result.message = '未找到该服务号！';
                callback(result);
            }
        }else{
            logger.app.error('db query error:' + err.stack);
            result.message = 'db query error!' + err.message;
            callback(result);
        }
    });
}

exports.deleteWeixinCfg = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).findOne({_id:data._id},function(err,weixin){
        if(!err){
            if(weixin){
                var ivrData = {};
                ivrData.Action = "PeerRemove";
                ivrData.Peer = "WeixinAddr";
                ivrData.Exten = weixin.openID;
                ivrData.synAcsSign = "1";
                ivrData.Account = session.user.account;
                ivrData.PBX = session.user.pbx;
                var ivrData = {
                    nodeData: ivrData
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = "Add mail Addr failure:" + data.Exten;
                        result.success = false;
                        callback(result);
                        return;
                    }
                    mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).remove({_id: data._id}, function (err) {
                        if (!err) {
                            _impl._deleteWeixinConfig(weixin,function(success){
                                if(success){
                                    result.success = true;
                                    callback(result);
                                } else {
                                    result.message = "同步邮件服务失败！";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error('db deleteEmailCfg error:' + err.stack);
                            result.message = '404 mail not found!';
                            callback(result);
                        }
                    });
                });
            }else{
                result.message = '404 weixin not found!';
                callback(result);
            }
        }else{
            result.message = 'find this weixin failed!';
            callback(result);
        }
    });
}

var _impl = {
    _deleteWeixinConfig : function (data ,callback){
        var url = config.weixinConfigUrl;
        var requestData = {
            action : "deleteAccount",
            actionId : utils.UUID.generateUuid(),
            openID : data.openID
        };
        httpProvider.sendPost(url,requestData,function(err , response){
            if(!err){
                response = response || "{}";
                response = JSON.parse(response);
                if(response.Succeed){
                    callback(true);
                }else{
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    },
    _addOrUpdateWeixinConfig : function(data,callback){
        var url = config.weixinConfigUrl;
        var requestData = {
            action : "addOrUpdateAccount",
            actionId : utils.UUID.generateUuid(),
            appID : data.appID,
            appSecret : data.appSecret,
            openID : data.openID,
            accountSID : data.accountSID
        };
        httpProvider.sendPost(url,requestData,function(err , response){
            if(!err){
                response = response || "{}";
                response = JSON.parse(response);
                if(response.statusCode=='000000' || response.Succeed){
                    callback(true);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        });

    }
};


exports.queryWechat = function(data,session,callback){
    var result = {success: false};

    var condition = {};
    condition.from = 'weixin';
    if(!condition.account){
        condition.account = session.user.account;
    }
    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).find(condition, {sort: {"$_id": -1}}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).count(condition, function (err, count) {
                if (!err) {
                    console.log(config.wechat_url);
                    result.wechatUrl = config.wechat_url;
                    result.success = true;
                    result.count = count;
                    callback(result);
                } else {
                    result.msg = true;
                    result.success = true;
                    result.wechatUrl = config.wechat_url;
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            result.message = err;
            callback(result);
        }
    });


};

exports.updateWechat = function (data,session,callback){
    var condition = {_id: data._id,account: session.user.account};
    var updateSet = {robot: data.robot, to_peer: data.to_peer};
    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).update(condition, {$set:updateSet}, function(err){
            if(!err){
                callback({success: true});
            }else{
                logger.app.error("更新微信信息失败：" + err);
                callback({success: false, message: err});
            }
        }
    );
};

exports.deleteWechat = function (data,session,callback){
    var condition = {_id: data._id,account: session.user.account};
    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).remove(condition,function(err){
            if(!err){
                callback({success: true});
            }else{
                logger.app.error("删除微信信息失败：" + err);
                callback({success: false, message: err});
            }
        }
    );
};
//微信菜单
/**
 * 获取微信菜单
 * @param data
 * @param session
 * @param callback
 */
exports.getWeixinMenu = function(data,session,callback){

    var result = {success: false};
    data.account = session.account.account;
    data.user = session.user._id;
    data.action = 'getMenu';
    httpProvider.sendPost(config.msgUrl + "weixinMenu", "data=" + JSON.stringify(data), function (err, rep) {
        if (err) {
            logger.app.warn('replyMsg to ass failed!', err);
            callback(result);
        } else {
            var res = JSON.parse(rep);
            if (res.success) {
                result.success = true;
                result.row = data;
                result.menus = res.menus;
                callback(result);
            } else {
                logger.app.warn(result);
                callback(result);
            }
        }
    });

}
/**
 * 保存微信菜单
 * @param data
 * @param session
 * @param callback
 */
exports.createWeixinMenu = function(data,session,callback){
    var result = {success: false};
    data.account = session.account.account;
    data.user = session.user._id;
    data.action = 'saveMenu';
    for(var i = 0;i<data.events.length;i++){
        data.events[i].account = data.account;
    }
    data.menus = encodeURIComponent(encodeURIComponent(JSON.stringify(data.menus)));
    data.events = encodeURIComponent(encodeURIComponent(JSON.stringify(data.events)));
    httpProvider.sendPost(config.msgUrl + "weixinMenu", "data=" +JSON.stringify(data) , function (err, rep) {
        if (err) {
            logger.app.warn('replyMsg to gateway failed!', err);
            callback(result);
        } else {
            var res = JSON.parse(rep);
            if (res.success) {
                result.success = true;
                result.row = data;
                callback(result);
            } else {
                logger.app.warn(result);
                callback(result);
            }
        }
    });
}
/**
 * 检查微信是否设置菜单
 * @param data
 * @param session
 * @param callback
 */
exports.checkWeixinMenu = function(data,session,callback){
    var result = {success: false};
    data.account = session.account.account;
    data.user = session.user._id;
    data.action = 'getMenu';
    httpProvider.sendPost(config.msgUrl + "weixinMenu", "data=" + JSON.stringify(data), function (err, rep) {
        if (err) {
            logger.app.warn('replyMsg to ass failed!', err);
            callback(result);
        } else {
            var res = JSON.parse(rep);
            if (res.success) {
                if(res.menus && res.menus.button.length>0){
                    result.success = true;
                    callback(result);
                }else{
                    callback(result);
                }
            } else {
                logger.app.warn(result);
                callback(result);
            }
        }
    });
};
/**
 * 保存微信对接信息
 * @param data
 * @param session
 * @param callback
 */
exports.saveDockWeixin = function(data,session,callback){
    data._id = data.authorizer_appid;
    data.account = session.user.account;
    data.from = 'Icallback';
    data.authorizer_access_token = utils.UUID.generateUuid().replace(new RegExp("-","gm"),'').substring(0,16);
    var condition = {_id: data._id};
    //查看是否有记录（微信/接口）
    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne(condition,function(err,res){
       if(res){
           callback({success: false, message: '已经存在该微信公众号id'});
       }else{
           //没有记录直接插入
           mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).insert(data, function(err){
               if(!err){
                   callback({success: true});
               }else{
                   logger.app.error("保存微信对接信息失败：" + err);
                   callback({success: false, message: '保存微信对接信息失败'});
               }
           });
       }
    });
};
/**
 * 查询微信对接信息
 * @param data
 * @param session
 * @param callback
 */
exports.getDockWeixin = function(data,session,callback){
    var result = {success: false};
    var condition = {_id: data._id,account: session.user.account};
    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne(condition, function(err, doc){
        if(!err){
            result.success = true;
            result.data = doc;
            callback(result);
        }else{
            result.message = err;
            callback(result);
        }
    });
};
/**
 * 查询微信对接信息列表
 * @param data
 * @param session
 * @param callback
 */
exports.queryDockWeiXinList = function(data,session,callback){
    console.log(utils.UUID.generateRandomId());
    var result = {success: false};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = {account: session.user.account,from:'Icallback'};
    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).find(condition,{limit: limit, skip: skip}).toArray(function(err, docs){
        if(!err){
            mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).count(condition,function(err,count){
                if(!err){
                    result.success = true;
                    result.list = docs;
                    result.count = count;
                    result.wechatUrl = config.wechat_url;
                    callback(result);
                }else{
                    logger.app.warn(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        }else{
            logger.app.warn(err);
            callback({success: false, list: [], count: 0, wechatUrl: config.wechat_url});
        }
    });
};
/**
 * 更新微信对接信息
 * @param data
 * @param session
 * @param callback
 */
exports.updateDockWeixin = function (data,session,callback){
    var condition = {_id: data._id};
    var updateSet = {to_peer: data.to_peer,nick_name:data.nick_name,sendUrl:data.sendUrl};
    if(data._id == data.authorizer_appid){
        mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).update(condition, {$set:updateSet}, function(err){
                if(!err){
                    callback({success: true});
                }else{
                    logger.app.error("更新微信对接信息失败：" + err);
                    callback({success: false, message: err});
                }
            }
        );
    }else{
        mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne(condition,function(err,weixin){//查出当前用户的token
            var token = weixin.authorizer_access_token;
            updateSet.authorizer_access_token = token;
            mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).findOne({_id:data.authorizer_appid},function(err,res){
                if(res){
                    callback({success: false, message: '已经存在该微信公众号id'});
                }else{
                    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).remove(condition,{w:1},function(err){
                        if(!err){
                            data._id = data.authorizer_appid;
                            data.authorizer_access_token = token;
                            data.account = session.user.account;
                            data.from = 'Icallback';
                            mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).insert(data,function(err){
                                if(!err){
                                    callback({success: true});
                                }else{
                                    logger.app.error("更新微信对接信息失败：" + err);
                                    callback({success: false, message: err});
                                }
                            });
                        }else{
                            logger.app.error("更新微信对接信息失败：" + err);
                            callback({success: false, message: err});
                        }
                    });
                }
            });
        });
    }
};
/**
 * 删除微信对接信息
 * @param data
 * @param session
 * @param callback
 */
exports.delDockWeixin = function (data,session,callback){
    var condition = {_id: data._id,account: session.user.account};
    mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).remove(condition, function(err){
            if(!err){
                callback({success: true});
            }else{
                logger.app.error("删除微信对接信息失败：" + err);
                callback({success: false, message: '删除微信对接信息失败'});
            }
        }
    );
};

