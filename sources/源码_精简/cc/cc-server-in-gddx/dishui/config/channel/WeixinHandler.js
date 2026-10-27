var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var _ = require('underscore');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var Thenjs = require('thenjs');

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
    var updateSet = data;
    delete updateSet._id;
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
    var condition2 = { appid: data._id, account: session.user.account };
    var condition3 = { wx_appid: data._id, account: session.user.account };

    Thenjs.parallel([
        // 删除微信配置
        function (cont) {
            mongo.db("weixin").collection(fields.DB_APP_WECHAT_CONFIG).remove(condition, cont);
        },
        // 删除微信客服账号
        function (cont) {
            mongo.db('weixin').collection(fields.DB_APP_WECHAT_CUSTOM_SERVICE).remove(condition2, cont);
        },
        // 删除与微信客服账号绑定的坐席中的信息
        function (cont) {
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).update(condition3, {
                $unset: { wx_appid: true, wx_kf_account: true }
            }, { multi: true, w: 1 }, cont)
        }
    ]).then(function (cont) {
        callback({success: true});
    }).fail(function (cont, err) {
        logger.app.error("删除微信信息失败：" + err);
        callback({success: false, message: err});
    });
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
 * 上传微信其他类型素材
 * @param data
 * @param session
 * @param callback
 */
exports.saveWeixinMaterial = function(data,session,callback){
    var result = {success: false};
    data.account = session.account.account;
    data.user = session.user._id;
    data.action = 'saveMaterial';
    var fileType = data.url.substring(data.url.lastIndexOf(".")+1,data.url.length).toLowerCase();
    data.type=fileType;
    data.contentType ="image/"+fileType;
    if (data.type != "jpg" && data.type != "png") {
        logger.app.warn('saveWeixinMaterial data type is error!' + data.type);
        return callback(result);
    }
    httpProvider.sendPost(config.msgUrl + "saveMaterial", "data=" +JSON.stringify(data) , function (err,rep) {
        rep = rep || "{}";
        rep = JSON.parse(rep);
        if(!err && rep.success){
            result.success = true;
            result.media_id = rep.data.media_id;
            result.url = rep.data.url;
            callback(result);
        } else {
            logger.app.warn('replyMsg to gateway failed!');
            callback(result);
        }
    });
}
/**
 * 新增图文永久素材
 * @param data
 * @param session
 * @param callback
 */
exports.saveNewsMaterial = function(data,session,callback){
    var result = {success: false};
    data.account = session.account.account;
    data.user = session.user._id;
    if(data.mediaId){
        data.action = 'updateNewsMaterial';
        data.index=0;
        httpProvider.sendPost(config.msgUrl + "updateNewsMaterial", "data=" +JSON.stringify(data) , function (err,rep) {
            rep = JSON.parse(rep || "{}");
            if(!err && rep.success){
                result.success = true;
                result.media_id = data.mediaId;
                callback(result);
            } else {
                logger.app.warn('replyMsg to gateway failed!');
                callback(result);
            }
        });
    }else{
        data.action = 'saveNewsMaterial';
        httpProvider.sendPost(config.msgUrl + "saveNewsMaterial", "data=" +JSON.stringify(data) , function (err,rep) {
            rep = JSON.parse(rep || "{}");
            if(!err && rep.success){
                result.success = true;
                result.media_id = rep.data.media_id;
                callback(result);
            } else {
                logger.app.warn('replyMsg to gateway failed!');
                callback(result);
            }
        });
    }
}
/**
 * 修改图文永久素材
 * @param data
 * @param session
 * @param callback
 */
exports.updateNewsMaterial = function(data,session,callback){
    var result = {success: false};
    data.account = session.account.account;
    data.user = session.user._id;
    data.action = 'updateNewsMaterial';
    if (!data || _.isEmpty(data) || _.isEmpty(data.mediaId)) {
        result.message = '参数不完整！';
        return callback(result);
    }
    httpProvider.sendPost(config.msgUrl + "updateNewsMaterial", "data=" +JSON.stringify(data) , function (err,rep) {
        rep = JSON.parse(rep || "{}");
        if(!err && rep.success){
            result.success = true;
            callback(result);
        } else {
            logger.app.warn('replyMsg to gateway failed!');
            callback(result);
        }
    });
}

/**
 * 通过media_id获取素材内容
 * @param data
 * @param session
 * @param callback
 */
exports.getMaterial = function (data, session, callback) {
    var result = {success: false};
    if (!data || _.isEmpty(data) || _.isEmpty(data.mediaId)) {
        result.message = '参数不完整！';
        return callback(result);
    }
    data.account = session.account.account;
    data.user = session.user._id;
    data.action = 'getMaterial';
    httpProvider.sendPost(config.msgUrl + "getMaterial", "data=" +JSON.stringify(data) , function (err,rep) {
        rep = JSON.parse(rep || "{}");
        if(!err && rep.success){
            result.success = true;
            result.data = rep.data;
            callback(result);
        } else {
            logger.app.warn('replyMsg to gateway failed!');
            callback(result);
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

/**
 * 微信客服设置的post方法
 *
 * @param data
 * @param callback
 */
function customServicePost(data, callback) {
    var url = config.msgUrl + 'weixinCustomService';

    httpProvider.sendPost(url, 'data=' + JSON.stringify(data), function (err, resp) {
        if (err) {
            return callback(err);
        }

        try {
            var res = JSON.parse(resp);
        } catch (e) {
            return callback(e);
        }

        return callback(null, res);
    });
}
/**
 * 获取微信客服账号列表
 *
 * @param {Object} data
 * @param {Object} session
 * @param {Function} callback
 */
exports.getAllCustomService = function (data, session, callback) {
    var funcName = '[WeixinHandler - getAllCustomService]';
    var result = { success: false };
    var page = data.page || 1;
    var limit = data.limit || 10;
    var skip = (page - 1) * limit;
    var query = {
        account: session.user.account
    };

    Thenjs.parallel([
        function (cont) {
            mongo.db('weixin').collection(fields.DB_APP_WECHAT_CUSTOM_SERVICE).count(query, cont);
        },
        function (cont) {
            mongo.db('weixin').collection(fields.DB_APP_WECHAT_CUSTOM_SERVICE).find(query).skip(skip).limit(limit).toArray(cont);
        }
    ]).then(function (cont, results) {
        var count = results[0];
        var docs = results[1];

        result.success = true;
        result.count = count;
        result.data = docs;

        return callback(result);
    }).fail(function (cont, err) {
        if (err) {
            logger.app.error(funcName, err);
            result.message = err.message;
            return callback(result);
        }
    });
};
/**
 * 添加微信公众号客服账号
 *
 * @param {Object} data
 * @param {string} data.appid
 * @param {string} data.nickname
 * @param {string} data.imgUrl
 * @param {Object} session
 * @param {Function} callback
 */
exports.addCustomService = function (data, session, callback) {
    var funcName = '[WeixinHandler - addCustomService]';
    var result = { success: false };

    Thenjs(function (cont) {
        mongo.db('weixin').collection(fields.DB_APP_WECHAT_CONFIG).findOne({ _id: data.appid }, cont);
    }).then(function (cont, wxConf) {
        if (!wxConf) {
            return cont(new Error('未找到微信授权信息'));
        }

        var kf_account = Math.ceil(utils.getCurrentDateTime() / 1000) + '@' + wxConf.alias;
        var postData = {
            _id: utils.UUID.generateUuid(),
            action: 'addCustomService',
            account: session.user.account,
            user: session.user._id,
            appid: data.appid,
            kf_account: kf_account,
            nickname: encodeURIComponent(data.nickname),
            imgUrl: encodeURIComponent(data.imgUrl || '')
        };

        customServicePost(postData, function (err, wxRes) {
            if (err) {
                return cont(err);
            }

            if (!wxRes.success) {
                if (wxRes.message === '客服帐号不合法' && !wxConf.alias) {
                    return cont(new Error('该公众号没有设置微信号，请到微信后台设置并重新授权'));
                }

                return cont(wxRes);
            }

            cont(null, kf_account);
        });
    }).then(function (cont, kf_account) {
        var insertData = {
            _id: kf_account,
            appid: data.appid,
            account: session.user.account,
            kf_account: kf_account,
            nickname: data.nickname,
            createdTime: utils.getCurrentDateTime(),
            updatedTime: utils.getCurrentDateTime()
        };
        if (data.imgUrl) {
            insertData.imgUrl = data.imgUrl;
        }
        mongo.db('weixin').collection(fields.DB_APP_WECHAT_CUSTOM_SERVICE).insert(insertData, function (err) {
            if (err) {
                return cont(err);
            }

            return cont(null, insertData);
        });
    }).then(function (cont, insertedData) {
        result.success = true;
        result.data = insertedData;

        return callback(result);
    }).fail(function (cont, err) {
        if (err) {
            logger.app.error(funcName, err);
            result.message = err.message;
            return callback(result);
        }
    });
};
/**
 * 更新微信公众号客服账号信息
 *
 * @param {Object} data
 * @param {string} data.appid
 * @param {string} data.kf_account
 * @param {string} data.nickname
 * @param {string} data.imgUrl
 * @param {Object} session
 * @param {Function} callback
 */
exports.updateCustomService = function (data, session, callback) {
    var funcName = '[WeixinHandler - updateCustomService]';
    var result = { success: false };

    Thenjs(function (cont) {
        var postData = {
            _id: utils.UUID.generateUuid(),
            action: 'updateCustomService',
            account: session.user.account,
            user: session.user._id,
            appid: data.appid,
            kf_account: data.kf_account,
            nickname: encodeURIComponent(data.nickname),
            imgUrl: encodeURIComponent(data.imgUrl || '')
        };

        customServicePost(postData, function (err, wxRes) {
            if (err) {
                return cont(err);
            }

            if (!wxRes.success) {
                return callback(wxRes);
            }

            cont(null);
        });
    }).then(function (cont) {
        var query = {
            _id: data.kf_account,
            appid: data.appid,
            account: session.user.account,
            kf_account: data.kf_account
        };
        var updateData = {
            nickname: data.nickname,
            updatedTime: utils.getCurrentDateTime()
        };
        if (data.imgUrl) {
            updateData.imgUrl = data.imgUrl;
        }
        mongo.db('weixin').collection(fields.DB_APP_WECHAT_CUSTOM_SERVICE).findAndModify(query, [], { $set: updateData }, { new: true, w: 1 }, function (err, updatedData) {
            if (err) {
                return cont(err);
            }

            return cont(null, updatedData);
        });
    }).then(function (cont, updatedData) {
        result.success = true;
        result.data = updatedData;

        return callback(result);
    }).fail(function (cont, err) {
        if (err) {
            logger.app.error(funcName, err);
            result.message = err.message;
            return callback(result);
        }
    });
};
/**
 * 删除微信公众号客服账号
 *
 * @param {Object} data
 * @param {string} data.appid
 * @param {string} data.kf_account
 * @param {Object} session
 * @param {Function} callback
 */
exports.delCustomService = function (data, session, callback) {
    var funcName = '[WeixinHandler - delCustomService]';
    var result = { success: false };

    Thenjs(function (cont) {
        var postData = {
            _id: utils.UUID.generateUuid(),
            action: 'delCustomService',
            account: session.user.account,
            user: session.user._id,
            appid: data.appid,
            kf_account: data.kf_account
        };

        customServicePost(postData, function (err, wxRes) {
            if (err) {
                return cont(err);
            }

            if (!wxRes.success) {
                return callback(wxRes);
            }

            cont(null);
        });
    }).parallel([
        // 删除客服账号
        function (cont) {
            var query = {
                _id: data.kf_account,
                account: session.user.account,
                appid: data.appid,
                kf_account: data.kf_account
            };
            mongo.db('weixin').collection(fields.DB_APP_WECHAT_CUSTOM_SERVICE).remove(query, cont);
        },
        // 删除客服账号绑定的坐席中的kf_account字段
        function (cont) {
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({
                account: session.user.account,
                wx_kf_account: data.kf_account
            }, { $unset: { wx_kf_account: true } }, { multi: true, w: 1 }, cont);
        }
    ]).then(function (cont) {
        result.success = true;

        return callback(result);
    }).fail(function (cont, err) {
        if (err) {
            logger.app.error(funcName, err);
            result.message = err.message;
            return callback(result);
        }
    });
};
/**
 * 获取与微信公众号客服账号绑定的坐席
 *
 * @param {Object} data
 * @param {string} data.kf_account
 * @param {Object} session
 * @param {Function} callback
 */
exports.getCustomServiceBindUsers = function (data, session, callback) {
    var funcName = '[WeixinHandler - getCustomServiceBindUsers]';
    var result = { success: false };

    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({
        account: session.user.account,
        wx_kf_account: data.kf_account
    }, ['_id']).toArray(function (err, users) {
        if (err) {
            logger.app.error(funcName, err);
            result.message = err.message;
            return callback(result);
        }

        result.success = true;
        result.data = users.map(function (user) {
            return user._id;
        });
        return callback(result);
    });
};
/**
 * 坐席与微信公众号客服账号绑定
 *
 * @param {Object} data
 * @param {string} data.kf_account
 * @param {Array} data.users
 * @param {Object} session
 * @param {Function} callback
 */
exports.bindUsersToCustomService = function (data, session, callback) {
    var funcName = '[WeixinHandler - bindUsersToWeixinCustomService]';
    var result = { success: false };

    Thenjs(function (cont) {
        mongo.db('weixin').collection(fields.DB_APP_WECHAT_CUSTOM_SERVICE).findOne({
            account: session.user.account,
            _id: data.kf_account
        }, cont);
    }).then(function (cont, kfAccount) {
        if (!kfAccount) {
            return cont({ message: '客服账号不存在! 请刷新列表!' });
        }

        data.appid = kfAccount.appid;
        // 移除之前绑定的坐席的kf_account和wx_appid字段
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({
            account: session.user.account,
            wx_kf_account: data.kf_account
        }, { $unset: { wx_kf_account: true, wx_appid: true } }, { multi: true, w: 1 }, cont);
    }).then(function (cont) {
        // 重新设置绑定的坐席
        mongo.db('bill').collection(fields.DB_PLATFORM_USER).update({
            account: session.user.account,
            _id: { $in: data.users }
        }, { $set: { wx_kf_account: data.kf_account, wx_appid: data.appid } }, { multi: true, w: 1 }, cont);
    }).then(function () {
        result.success = true;

        return callback(result);
    }).fail(function (cont, err) {
        if (err) {
            logger.app.error(funcName, err);
            result.message = err.message;
            return callback(result);
        }
    });
};