/**
 * 对外提供永久素材的操作
 */
var fs = require('fs');
var log = require('appLog');
var db = require('appDb/MongoDb');
var meadia = require('../weixin/media');
var wechatUtils = require('../wechatUtils');

/**
 * 上传永久素材
 * @param action
 * @param callback
 */
module.exports.saveMaterial = function(action,callback){
    var result = {success: false};
    var query = {
        _id:action.appid
    }
    db.db().collection('wxaccount').findOne(query,function(err,doc){
        if(err){
            log.app.error('没有该微信公众号',err);
            return callback(result);
        }
        if(doc){
            var accessToken = doc.authorizer_access_token;
            var type = action.type;
            var url = action.content;
            var urlType = action.contentType;
            wechatUtils.downLoadFile(url,urlType,function(tmpFile){
                if(tmpFile){
                    meadia.uploadMaterial(tmpFile,type,accessToken,function(err,data){
                        if(err){
                            log.app.error(err);
                            result.error = err;
                            return callback(JSON.stringify(result));
                        }
                        log.app.info('返回值：   '+JSON.stringify(data));
                        var DBData = {
                            _id : data.media_id,
                            url : data.url,
                            appid: action.appid,
                            created_at:data.created_at,
                            type : type,
                            contentType:urlType
                        }
                        _impl.saveMaterialDB(DBData,function(doc1){
                            if(!doc1){
                                return callback(result)
                            }
                            log.app.info('返回值:  '+JSON.stringify(data));
                            result.success = true;
                            result.data = data;
                            callback(JSON.stringify(result));
                        });
                        try{
                            fs.unlink(tmpFile, function(err){
                                if(err){
                                    log.app.error(err);
                                    throw err;
                                }
                            });
                        }catch(e){
                            log.app.error("删除文件异常");
                        }
                    });
                }
            });
        }
    });
};
/**
 * 上传图文消息内的图片获取URL
 * @param action
 * @param callback
 */
module.exports.uploadImage = function(action,callback){
    var result = {success: false};
    var query = {
        _id:action.appid
    }
    db.db().collection('wxaccount').findOne(query,function(err,doc){
        if(err){
            log.app.error('没有该微信公众号',err);
            return callback(result);
        }
        if(doc){
            var accessToken = doc.authorizer_access_token;
            var url = action.content;
            var urlType = action.contentType;
            wechatUtils.downLoadFile(url,urlType,function(tmpFile){
                if(tmpFile){
                    meadia.uploadImage(tmpFile,accessToken,function(err,data){
                        if(err){
                            log.app.error(err);
                            result.error = err;
                            return callback(JSON.stringify(result));
                        }
                        log.app.info('返回值：   '+JSON.stringify(data));
                        result.success = true;
                        result.data = data;
                        callback(JSON.stringify(result));
                        try{
                            fs.unlink(tmpFile, function(err){
                                if(err){
                                    log.app.error(err);
                                    throw err;
                                }
                            });
                        }catch(e){
                            log.app.error("删除文件异常");
                        }
                    });
                }
            });
        }
    });
};

/**
 * 新增永久图文素材
 * @param action
 * @param callback
 */
module.exports.saveNewsMaterial = function(action,callback){
    var result = {success: false};
    var query = {
        _id:action.appid
    }
    db.db().collection('wxaccount').findOne(query,function(err,doc){
        if(err){
            log.app.error('没有该微信公众号',err);
            return callback(result);
        }
        if(doc){
            var accessToken = doc.authorizer_access_token;
            var articles = action.news;
            meadia.uploadNewsMaterial(articles,accessToken,function(err,data){
                if(err){
                    log.app.error(err);
                    result.error = err;
                    return callback(JSON.stringify(result));
                }
                log.app.info('返回值：   '+JSON.stringify(data));
                var DBData = {
                    _id : data.media_id,
                    appid: action.appid,
                    created_at:data.created_at,
                    type : 'news'
                }
                _impl.saveMaterialDB(DBData,function(doc1){
                    if(!doc1){
                        return callback(result)
                    }
                    log.app.info('返回值:  '+JSON.stringify(data));
                    result.success = true;
                    result.data = data;
                    callback(JSON.stringify(result));
                });
            });
        }
    });
};
/**
 *
 * @param action
 * @param callback
 */
module.exports.getMaterial = function(action,callback){
    log.app.info('获取永久素材  '+action.mediaId);
    var result = {success: false};
    var query = {
        _id:action.appid
    }
    db.db().collection('wxaccount').findOne(query,function(err,doc){
        if(err){
            log.app.error('没有该微信公众号',err);
            return callback(result);
        }
        if(doc){
            var mediaId = action.mediaId;
            var accessToken = doc.authorizer_access_token;
            meadia.getMaterial(mediaId,accessToken,function(err,data,res){
                if(err){
                    log.app.error(err);
                    result.error = err;
                    return callback(JSON.stringify(result));
                }
                log.app.info('Get post action string: '+JSON.stringify(res));
                result.success = true;
                result.data = data;
                return callback(JSON.stringify(result));
            });
        }
    });
};

/**
 * 更新永久图文素材
 * @param action
 * @param callback
 */
module.exports.updateNewsMaterial = function(action,callback){
    var result = {success: false};
    var query = {
        _id:action.appid
    }
    db.db().collection('wxaccount').findOne(query,function(err,doc){
        if(err){
            log.app.error('没有该微信公众号',err);
            return callback(result);
        }
        if(doc){
            var accessToken = doc.authorizer_access_token;
            var articles = action.news;
            meadia.updateNewsMaterial(articles,accessToken,function(err,data){
                if(err){
                    log.app.error(err);
                    result.error = err;
                    return callback(JSON.stringify(result));
                }
                log.app.info('返回值：   '+JSON.stringify(data));
                result.success = true;
                result.data = data;
                callback(JSON.stringify(result));
            });
        }
    });
};
/**
 * 删除永久素材
 * @param action
 * @param callback
 */
module.exports.removeMaterial = function(action,callback){
    var result = {success: false};
    var query = {
        _id:action.appid
    }
    db.db().collection('wxaccount').findOne(query,function(err,doc){
        if(err){
            log.app.error('没有该微信公众号',err);
            return callback(result);
        }
        if(doc){
            var mediaId = action.mediaId;
            var accessToken = doc.authorizer_access_token;
            meadia.removeMaterial(mediaId,accessToken,function(err,data){
                if(err){
                    log.app.error(err);
                    result.error = err;
                    return callback(JSON.stringify(result));
                }
                log.app.info('返回值：   '+JSON.stringify(data));
                result.success = true;
                result.data = data;
                callback(JSON.stringify(result));
            });
        }
    });
};
/**
 *
 * @param action
 * @param callback
 */
module.exports.getMaterialCount = function(action,callback){
    var result = {success: false};
    var query = {
        _id:action.appid
    }
    db.db().collection('wxaccount').findOne(query,function(err,doc){
        if(err){
            log.app.error('没有该微信公众号',err);
            return callback(result);
        }
        if(doc){
            var accessToken = doc.authorizer_access_token;
            meadia.getMaterialCount(accessToken,function(err,data){
                if(err){
                    log.app.error(err);
                    result.error = err;
                    return callback(JSON.stringify(result));
                }
                log.app.info('返回值:  '+JSON.stringify(data));
                result.success = true;
                result.data = data;
                callback(JSON.stringify(result));
            });
        }
    });
};

/**
 *
 * @param action
 * @param callback
 */
module.exports.getMaterials = function(action,callback){
    var result = {success: false};
    var query = {
        _id:action.appid
    }
    db.db().collection('wxaccount').findOne(query,function(err,doc){
        if(err){
            log.app.error('没有该微信公众号',err);
            return callback(result);
        }
        if(doc){
            var type = action.type;
            var offset = action.offset;
            var count = action.count;
            var accessToken = doc.authorizer_access_token;
            meadia.getMaterials(type, offset, count,accessToken,function(err,data){
                if(err){
                    log.app.error(err);
                    result.error = err;
                    return callback(JSON.stringify(result));
                }
                log.app.info('返回值:  '+JSON.stringify(data));
                result.success = true;
                result.data = data;
                result.success = true;
                callback(JSON.stringify(result));
            });
        }
    });
};



var _impl = {
    saveMaterialDB:function(data,callback){
        db.db().collection('material').insert(data,function(err){
            if(err){
                log.app.error('保存其它素材出错',err);
                return callback(false)
            }
            callback(true);
        });
    }
}