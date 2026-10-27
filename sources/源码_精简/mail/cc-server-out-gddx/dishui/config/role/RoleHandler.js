var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');

exports.getRoleDicCache = function (session, callback) {
    var condition = {
        accountId: session.user.account
    };
    mongo.db().collection(fields.DB_APP_ROLE).find(condition).toArray(function (err, docs) {
        if (!err) {
            docs = docs || [];
            callback(null, docs);
        } else {
            logger.app.error("", err);
            callback(err);
        }
    });
}
exports.queryRole = function (data, session, callback) {
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = data;
    if(!condition.accountId){
        condition.accountId=session.user.account;
    }
    utils.removeEmptyProperty(condition);
    if (condition.display_name)
        condition.display_name = new RegExp(condition.display_name);
    var result = {success: false};
    var type=session.user.type;
    if(type=='admin'){
        mongo.db().collection(fields.DB_APP_ROLE).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_APP_ROLE).count(condition, function (err, count) {
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
    }else{
        callback({success: false, list: [], count: 0});
    }

}

exports.queryRoleAll = function (data, session, callback) {
    var condition = data;
    if(!condition.accountId){
        condition.accountId=session.user.account;
    }
    utils.removeEmptyProperty(condition);
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_ROLE).find(condition).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    })

}

exports.addRole = function (data, session, callback) {
    var result = {success: false};
    var id = utils.UUID.generateUuid();
    var aid=session.user.account;
    data._id = id;
    if(!data.accountId){
        data.accountId=session.user.account;
    }
    data.accountId=aid;
    var time=utils.getCurrentDate();
    data.createTime=time;
    data.lastTime=time;
    var type=session.user.type;

    if(!data.limits){
        data.limits=[];
    }
    if(!data.limits_in){
        data.limits_in=[];
    }
    if(!data.limits_out){
        data.limits_out=[];
    }
    if(type=='admin'){
        mongo.db().collection(fields.DB_APP_ROLE).find({'accountId':session.user.account,display_name: data.display_name}).toArray(function (err, docs) {
            if (!err) {
                if (docs && docs.length == 0) {
                    mongo.db().collection(fields.DB_APP_ROLE).insert(data, function (err) {
                        if (!err) {
                            result.success = true;
                            result.data = data;
                        } else {
                            logger.app.error('db insert error:' + err.stack);
                            result.message = 'db insert error!' + err.message;
                        }
                        callback(result);
                    });
                } else {
                    result.message = '角色已经存在！';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'role query error!';
                callback(result);
            }
        });
    }else{
        result.message = '无权限!';
        callback(result);
    }
}

exports.updateRole = function (data, session, callback) {
    var result = {success: false};
    var query = {"_id": data._id};
    delete data["_id"];
    var time=utils.getCurrentDate();
    data.lastTime=time;
    mongo.db().collection(fields.DB_APP_ROLE).update(query, {$set: data}, function (err) {
        if (!err) {
            result.success = true;
            callback(result);
        } else {
            logger.app.error('db update error:' + err.stack);
            result.message = 'role update error!';
            callback(result);
        }
    });
}
exports.getRoleById = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_ROLE).findOne({_id: data._id}, function (err, row) {
        if (!err) {
            result.success = true;
            result.data = row;
            callback(result);
        } else {
            logger.app.error('db getRoleById error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }
    });
}
exports.showRoleAdd = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_CC_USER_LIMIT_OUT).findOne({}, function (err, row) {
        if (!err) {
            result.success = true;
            result.funcs = row.limits||[];
            callback(result);
        } else {
            logger.app.error('db showRoleAdd error:' + err.stack);
            result.message = '404 function not found!';
            callback(result)
        }
    });
}

//修改
exports.showRoleEdit = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_ROLE).findOne({_id: data._id}, function (err, row) {
        if (!err) {
            result.role = row;
            mongo.db().collection(fields.DB_CC_USER_LIMIT_OUT).findOne({}, function (err, limit) {
                if (!err) {
                    result.success = true;
                    result.funcs = limit.limits||[];
                    callback(result);
                } else {
                    logger.app.error('db showRoleEdit error:' + err.stack);
                    result.message = '404 function not found!';
                    callback(result)
                }
            });
        } else {
            logger.app.error('db showRoleEdit error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }
    });


}

//删除
exports.delRole = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_ROLE).remove({_id: data._id}, function (err) {
        if (!err) {
            result.success = true;
            callback(result);
        } else {
            logger.app.error('db delRole error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }

    });

}