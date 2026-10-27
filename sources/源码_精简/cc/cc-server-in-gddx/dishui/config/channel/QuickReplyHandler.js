var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;

exports.queryAllTitle = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    var name = "其它";
    var condition = {account: account,moduleType: data.moduleType};
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).find(condition).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            //处理
            var i =0;
            var countFunction = function(tagsList){
                exports.fixSysQuickReplayTagsCount(tagsList[i], session, function(err){
                    i++;
                    if(tagsList[i]){
                        countFunction(docs);
                    }else{
                        //处理数据小于1的情况
                        var newList = [];
                        if(result.list.length>0){
                            for(var j = 0 ;j<result.list.length;j++){
                                var tagitem = result.list[j];
                                if(tagitem.count>0){
                                    newList.push(tagitem);
                                }
                            }
                            result.list = newList;
                        }

                        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).count(condition, function (err, count) {
                            if (!err) {
                                result.count = count;
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback({success: false, list: [], count: 0});
                            }
                        })
                    }
                });
            }
            countFunction(docs);

        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });
}

exports.addQuickReply = function (data, session, callback) {
    var result = {success: false};
    var id = utils.UUID.generateUuid();
    var aid = session.user.account;
    var time = utils.getCurrentDate();
    data._id = id;
    data.account = aid;
    data.updatedTime = time;
    var tagsArray = new Array();
    var tagsIdArray = new Array();
    if (data.tags.length > 0) {
        for (var i = 0; i < data.tags.length; i++) {
            (function (i) {
                var tagsId = data.tags[i].id;
                var tagsName = data.tags[i].name;
                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).findOne({
                    name: tagsName,
                    account: aid,
                    moduleType: data.moduleType
                }, function (err, title) {
                    if (title != null) {
                        tagsArray.push({_id: title._id, name: title.name});
                        tagsIdArray.push(title._id);
                        dataTagsDeal(data, tagsArray, tagsIdArray, callback);
                    } else {
                        var id = utils.UUID.generateUuid();
                        var account = data.account;
                        var updatedTime = data.updatedTime;
                        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).insert({
                            _id: id,
                            account: account,
                            name: tagsName,
                            count: 0,
                            updatedTime: updatedTime,
                            moduleType: data.moduleType
                        }, function (err) {
                            if (!err) {
                                tagsArray.push({_id: id, name: tagsName});
                                tagsIdArray.push(id);
                                dataTagsDeal(data, tagsArray, tagsIdArray, callback);
                            } else {
                                callback({result: false});
                            }
                        })
                    }
                })
            })(i);
        }
    } else {//has no tag,insert into quickreply table
        data._id = utils.UUID.generateUuid();
        var name = "其它";
        var otherTagsId;
        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).findOne({
            name: name,
            account: data.account,
            moduleType: data.moduleType
        }, function (err, otherTags) {
            if (otherTags != null) {
                otherTagsId = otherTags._id;
                data.name = name;
                data.tags = [{_id: otherTagsId, name: name}];
                dealOtherTagsId(data, otherTagsId, callback);
            } else {
                otherTagsId = utils.UUID.generateUuid();
                data.tags = [{_id: otherTagsId, name: name}];
                data.name = name;
                dealOtherTagsId(data, otherTagsId, callback);
            }
        })
    }
}

function dataTagsDeal(data, tagsArray, tagsIdArray, callback) {
    var result = {success: false};
    if (data.tags.length == tagsArray.length) {
        data.tags = tagsArray;
        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).update({
            _id: data._id,
            account: data.account
        }, {$set: data}, {upsert: true}, function (err) {
            if (!err) {
                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).update({
                    _id: {$in: tagsIdArray},
                    account: data.account
                }, {$inc: {count: 1}}, {multi: true}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        result.success = false;
                        callback(result);
                    }
                })
            } else {
                result.success = false;
                callback(result);
            }
        })
    }
}

function dealOtherTagsId(data, otherTagsId, callback) {
    var result = {success: false};
    var name = data.name;
    delete data.name;
    //判断是否已经在数据库中有了
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).findOne({
        content: data.content,
        account: data.account,
        moduleType: data.moduleType
    }, function (err, quickreply) {
        if (!err) {
            if (quickreply == null) {
                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).insert(data, function (err) {
                    if (!err) {
                        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).update({
                            _id: otherTagsId,
                            account: data.account,
                            name: name,
                            moduleType: data.moduleType
                        }, {$inc: {count: 1},$set:{updatedTime:data.updatedTime}}, {upsert: true}, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error('db updateCount error:');
                                result.success = false;
                                callback(result);
                            }
                        })
                    } else {
                        logger.app.error('db updateCount error:');
                        result.message = 'db updateCount error!';
                        callback(result);
                    }
                })
            } else {
                result.success = false;
                result.message = '系统快捷回复中已经存在了该条数据';
                callback(result);
            }
        }else {
            logger.app.error('db findOne error:');
            result.success = false;
            result.message = 'db findOne error!';
            callback(result);
        }

    })





}
exports.queryQuickReplyByTitle = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.limit;
    var account = session.user.account;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var tagsId = data.id;
    var condition;
    if (tagsId == "allTitle") {
        tagsId = "";
    }
    if (tagsId) {
        condition = {'tags._id': {$all: [tagsId]}, account: account,moduleType:data.moduleType};
    } else {
        condition = {account: account,moduleType:data.moduleType};
    }
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).find(condition, {
        sort: {"updateTime": -1},
        limit: limit,
        skip: skip
    }).toArray(function (err, quickReply) {
        if (!err) {
            mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).count(condition, function (err, count) {
                if (!err) {
                    result.list = quickReply;
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    result.success = false;
                    callback(result);
                }
            })
        } else {
            logger.app.error('db queryQuickReplyByTitle error:' + err.stack);
            result.message = '404 quickReply not found!';
            callback(result);
        }
    });
}
exports.queryQuickReplyById = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).find({
        _id: data._id,
        account: account
    }).toArray(function (err, quickReply) {
        if (!err) {
            result.success = true;
            result.list = quickReply;
            callback(result);
        } else {
            logger.app.error('db queryQuickReplyById error:' + err.stack);
            result.message = '404 QuickReplyById not found!';
            callback(result);
        }
    });
}

exports.updateQuickReply = function (data, session, callback) {
    var result = {success: false};
    var id = data._id;
    var account = session.user.account;
    data.account = account;
    var tagsArrayUpdate = data.tags;
    var tagsIdArray = new Array();
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).findOne({
        _id: id,
        account: account,
        moduleType:data.moduleType
    }, function (err, QuickReply) {
        if (!err) {
            if (QuickReply != null) {
                data.updatedTime = utils.getCurrentDate();
                var tagsArray = QuickReply.tags;
                for (var j = 0; j < tagsArray.length; j++) {
                    (function (j) {
                        tagsIdArray.push(tagsArray[j]._id);
                    })(j);
                }
                dealAddTagsCount(data, tagsArrayUpdate, tagsIdArray, callback);
            } else {
                result.message = '未找到该快捷回复！';
                callback(result);
            }
        } else {
            logger.app.error('db query error:' + err.stack);
            result.message = 'db query error!' + err.message;
            callback(result);
        }
    });
}
function dealAddTagsCount(data, tagsArrayUpdate, tagsIdArray, callback) {
    var tagsIdEdit = new Array();
    var account = data.account;
    if (tagsArrayUpdate.length > 0) {
        for (var m = 0; m < tagsArrayUpdate.length; m++) {
            (function (m) {
                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).findOne({
                    name: tagsArrayUpdate[m].name,
                    account: account,
                    moduleType:data.moduleType
                }, function (err, tags) {
                    if (tags != null) {
                        tagsIdEdit.push(tags._id);
                        tagsArrayUpdate[m]._id = tags._id;
                        dealTagsCountEdit(data, tagsIdEdit, tagsArrayUpdate, tagsIdArray, callback);
                    } else {
                        var id = utils.UUID.generateUuid();
                        //var account = data.account;
                        var content = data.content;
                        var updateTime = utils.getCurrentDate();
                        var tagsName = tagsArrayUpdate[m].name;
                        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).insert({
                            _id: id,
                            account: account,
                            name: tagsName,
                            count: 0,
                            updatedTime: updateTime,
                            moduleType:data.moduleType
                        }, function (err) {
                            if (!err) {
                                tagsArrayUpdate[m]._id = id;
                                tagsIdEdit.push(id);
                                dealTagsCountEdit(data, tagsIdEdit, tagsArrayUpdate, tagsIdArray, callback);
                            } else {
                                callback({result: false});
                            }
                        })
                    }
                })
            })(m);
        }
    } else {
        var name = "其它";
        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).findOne({
            name: name,
            account: account,
            moduleType:data.moduleType
        }, function (err, tags) {
            if (tags != null) {
                tagsIdEdit.push(tags._id);
                tagsArrayUpdate.push({_id: tags._id, name: name});
                dealTagsCountEdit(data, tagsIdEdit, tagsArrayUpdate, tagsIdArray, callback);
            } else {
                var id = utils.UUID.generateUuid();
                //var account = data.account;
                var content = data.content;
                var updateTime = utils.getCurrentDate();
                var tagsName = name;
                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).insert({
                    _id: id,
                    account: account,
                    name: tagsName,
                    count: 0,
                    updatedTime: updateTime,
                    moduleType:data.moduleType
                }, function (err) {
                    if (!err) {
                        tagsArrayUpdate.push({_id: id, name: tagsName});
                        tagsIdEdit.push(id);
                        dealTagsCountEdit(data, tagsIdEdit, tagsArrayUpdate, tagsIdArray, callback);
                    } else {
                        callback({result: false});
                    }
                })
            }
        })
    }
}

function dealTagsCountEdit(data, tagsIdEdit, tagsArrayUpdate, tagsIdArray, callback) {
    var result = {success: false};
    var account = data.account;
    if (data.tags.length == tagsIdEdit.length) {
        data.updatedTime = utils.getCurrentDate();
        data.tags = tagsArrayUpdate;
        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).update({
            _id: data._id,
            account: account,
            moduleType:data.moduleType
        }, {$set: data}, function (err) {
            if (!err) {
                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).update({
                    _id: {$in: tagsIdArray},
                    account: account,
                    moduleType:data.moduleType
                }, {$inc: {count: -1}}, {multi: true}, function (err) {
                    if (!err) {
                        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).update({
                            _id: {$in: tagsIdEdit},
                            account: account,
                            moduleType:data.moduleType
                        }, {$inc: {count: 1}}, {multi: true}, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).remove({count:0});
                            } else {
                                logger.app.error('db insert error:' + err.stack);
                                result.message = 'db insert error!' + err.message;
                                callback(result);
                            }
                        })
                    } else {
                        logger.app.error('db insert error:' + err.stack);
                        result.message = 'db insert error!' + err.message;
                        callback(result);
                    }
                })
            } else {
                result.success = false;
                callback(result);
            }
        })
    }
}

exports.deleteQuickReply = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    var tagsIdArray = new Array();
    var condition = {_id: data._id,account: account,moduleType:data.moduleType};
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).findOne(condition, function (err, quickReply) {
        if (!err) {
            if (quickReply != null) {
                var tagsArray = quickReply.tags;
                for (var i = 0; i < tagsArray.length; i++) {
                    (function (i) {
                        tagsIdArray[i] = tagsArray[i]._id;
                    })(i);
                }
                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).remove(condition, function (err) {
                    if (!err) {
                        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).update({
                            _id: {$in: tagsIdArray},
                            account: account,
                            moduleType:data.moduleType
                        }, {$inc: {count: -1}}, {multi: true}, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                                mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).remove({count:0});
                            } else {
                                result.success = false;
                                callback(result);
                            }
                        })
                    } else {
                        logger.app.error('db deleteQuickReply error:' + err.stack);
                        result.message = '404 quickReply not found!';
                        callback(result);
                    }
                });
            } else {
                result.message = '404 quickReply not found!';
                callback(result);
            }
        } else {
            result.message = 'find this quickReply failed!';
            callback(result);
        }
    });
}
exports.queryTagsArray = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).find({account: account}).toArray(function (err, tagsArray) {
        if (!err) {
            result.success = true;
            result.list = tagsArray;
            callback(result);
        } else {
            logger.app.error('db queryTagsArray error:' + err.stack);
            result.message = '404 queryTagsArray not found!';
            callback(result);
        }
    });
}

exports.queryTagsByName = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).find({
        name: data.content,
        account: account
    }).toArray(function (err, tagsArray) {
        if (!err) {
            result.success = true;
            result.list = tagsArray;
            callback(result);
        } else {
            logger.app.error('db queryTagsByName error:' + err.stack);
            result.message = '404 queryTagsByName not found!';
            callback(result);
        }
    });
}

exports.queryQuickReplyByTagsName = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    var name = data.name;
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).find({
        "$or": [{content: {$regex: name,$options:'i'}}, {'tags.name': {$regex: name,$options:'i'}}],
        account: account
    }, {sort: {"updateTime": -1}, limit: limit, skip: skip}).toArray(function (err, tagsArray) {
        if (!err) {
            mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).count({
                "$or": [{content: {$regex: name,$options:'i'}}, {'tags.name': {$regex: name,$options:'i'}}],
                account: account
            }, function (err, count) {
                if (!err) {
                    result.list = tagsArray;
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    result.success = false;
                    callback(result);
                }
            })
        } else {
            logger.app.error('db queryQuickReplyByTagsName error:' + err.stack);
            result.message = '404 queryQuickReplyByTagsName not found!';
            callback(result);
        }
    });
}

exports.queryQuickReplyByContent = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    var content = data.content;
    var tagsId = data.tagsId;
    var pageSize = data.limit;
    var condition;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    if (!tagsId || tagsId == "allTitle") {
        condition = {content: {$regex: content,$options:'i'}, account: account};
    } else {
        condition = {content: {$regex: content,$options:'i'}, 'tags._id': tagsId, account: account};
    }
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).find(condition, {
        sort: {"updateTime": -1},
        limit: limit,
        skip: skip
    }).toArray(function (err, tagsArray) {
        if (!err) {
            result.list = tagsArray;
            mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    result.success = false;
                    callback(result);
                }
            })
        } else {
            logger.app.error('db queryQuickReplyByContent error:' + err.stack);
            result.message = '404 queryQuickReplyByContent not found!';
            callback(result);
        }
    });
}

exports.queryWebChatAllTags = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    var tagCondition = {'count': {'$gte': 1},account: account,moduleType: data.moduleType};
    var condition = {account: account,moduleType: data.moduleType};
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).find(tagCondition).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            })

            /*result.list = docs;
            //处理
            var i =0;
            var countFunction = function(tagsList){
                exports.fixSysQuickReplayTagsCount(tagsList[i], session, function(err){
                    i++;
                    if(tagsList[i]){
                        countFunction(docs);
                    }else{
                        //处理数据小于1的情况
                        var newList = [];
                        if(result.list.length>0){
                            for(var j = 0 ;j<result.list.length;j++){
                                var tagitem = result.list[j];
                                if(tagitem.count>0){
                                    newList.push(tagitem);
                                }
                            }
                            result.list = newList;
                        }
                        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).count({account: account}, function (err, count) {
                            if (!err) {
                                result.count = count;
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback({success: false, list: [], count: 0});
                            }
                        })
                    }
                });
            }
            countFunction(docs);*/
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });
}

exports.queryWebChatTagsById = function (data, session, callback) {
    var result = {success: false};
    var account = session.user.account;
    var tagsId = data.id;
    var condition;
    if (tagsId) {
        condition = {'tags._id': {$all: [tagsId]}, account: account};
    } else {
        condition = {account: account, moduleType: data.moduleType};
    }
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).find(condition).toArray(function (err, quickReply) {
        if (!err) {
            result.list = quickReply;
            result.success = true;
            callback(result);
        } else {
            result.success = false;
            callback(result);
        }
    });
};

/**
 * 获取所有的快捷回复
 * @param data
 * @param session
 * @param callback
 */
exports.queryAllSysQuickReply = function (data, session, callback) {
    var result = {success: false};
    var condition = {account:session.user.account,moduleType:data.moduleType};
    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).find(condition).toArray(function (err, quickReply) {
        if (!err) {
            result.list = quickReply;
            result.success = true;
            callback(result);
        } else {
            result.success = false;
            callback(result);
        }
    });
};

/**
 * 暂时修复由于之前的bug引起的tag表count不准的bug
 * @param data tag对象
 * @param session
 * @param callback
 */
exports.fixSysQuickReplayTagsCount = function (data, session, callback) {
    if(data){
        var condition = {"tags._id":{ $all :[data._id]}};
        var err;
        mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY).count(condition, function (err, count) {
            if (!err) {
                data.count = count;
                if(count != data.count){
                    mongo.db('cc').collection(fields.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS).update({
                        _id: data._id
                    }, {$set: {count: count}},  function (err) {
                        if (!err) {
                            callback(err);
                        } else {
                            callback(err);
                        }
                    })
                }else{
                    callback(err);
                }
            } else {
                callback(err);
            }
        })

    }else{
        callback(err);
    }
};


