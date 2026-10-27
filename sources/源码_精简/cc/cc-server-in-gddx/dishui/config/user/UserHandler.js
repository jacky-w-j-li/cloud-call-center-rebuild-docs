var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var handlerDir = __baseDir + '/dishui';
var app_user_handler = require(handlerDir + '/app/user/UserHandler');
var redisUtils = require("m7rds");
var redisField = require(__baseDir + '/dishui/common/RedisKeyPrefix');
var Session = require('appSession/lib/Session');

var webchatHandler =  require(handlerDir + '/app/webchat/WebchatHandler');
var _setQueryCondition=function(query){
    utils.removeEmptyProperty(query);
    query.product = 'cc';
    if(query.combox){
        query.displayName=new RegExp(query.combox);
//        query.$or=[{displayName:new RegExp(query.combox)},{exten:query.combox}];
        delete query.combox;
    }
    if(query.beginExten){
        query.exten={$gte:query.beginExten};
        delete query.beginExten;
    }
    if(query.endExten){
        if(!query.exten)query.exten={};
        query.exten["$lte"]=query.endExten;
        delete query.endExten;
    }
}

exports.queryUser = function (data, session, callback) {
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = data||{};
    if(!condition.account){
        condition.account=session.user.account;
    }
    _setQueryCondition(condition);
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).count(condition, function (err, count) {
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

var _checkIsChild=function(data,session,callback){
    var result = {success: false};
    var pId=data.parentId;
    var account=session.user.account;

    if(pId==data._id){
        result.num = 1;
        result.success = true;
        callback(result);
        return;
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account: account,product:'cc',status:'enable',parentId:{$nin:[null,'']}},{fields:{_id:1,parentId:1}}).toArray(function (err, docs) {
        if (!err) {
            var users=docs||[];
            var num=0;
            var checkParent=function(id){
                for (var i = 0; i < users.length; i++) {
                    var user = users[i];
                    if(id==user._id){
                        if(user.parentId==data._id){
                            num++;
                            break;
                        }else{
                            checkParent(user.parentId);
                        }
                        break;
                    }
                }
            }
            checkParent(pId);
            result.num = num;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
}
exports.updateUser = function (data, session, callback) {
    var result = {success: false};
    var query = {"_id": data._id};
    var ivrInfo = null;
    if(data.ivrInfo){
        ivrInfo = data.ivrInfo;
        delete data.ivrInfo;
    }
    _checkIsChild(data,session,function(rep){
        if(rep.success){
            if(rep.num>0){
                result.message="不能选择自己或您的下级座席作为上级";
                callback(result);
            }else{
                delete data["_id"];
                mongo.db('bill').collection(fields.DB_PLATFORM_USER).update(query, {$set: data}, function (err) {
                    if (!err) {
                        if(ivrInfo == null){
                            result.success = true;
                            callback(result);
                        }else{
                            app_user_handler.editUser(ivrInfo, session, function(res){
                                if(res.success){
                                    result.success = true;
                                    utils.generateCacheVersion(session.account.account,"agent");
                                    callback(result);
                                }else{
                                    result.message = '更新用户IVR信息失败！';
                                    result.success = false;
                                    callback(result);
                                }
                            })
                        }
                    } else {
                        logger.app.error('db update error:' + err.stack);
                        result.message = '修改用户信息异常';
                        callback(result);
                    }
                });
            }
        }else{
            callback(rep);
        }
    });
}
exports.getUserById = function (id, session, callback) {
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne({_id: id}, function (err, row) {
        if (!err) {
            result.success = true;
            result.user = row;
            callback(result);
        } else {
            logger.app.error('db getUserById error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }
    });
}

//更新当前登录用户信息
exports.updataCurrentUser = function (data,session, callback) {
    var result = {success: false};
    var query = {"_id": session._id};
    var imDealCount  = data.imDealCount;
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update(query, {$set: data}, function (err, row) {
        if (!err) {
            Session.updateUser(session._id,
                {imDealCount:imDealCount}, function(err){});
            result.success = true;
            result.user = row;
            callback(result);
            mongo.db().collection(fields.DB_APP_PUSH_CLIENT).update({_id:session.user._id},{$set: {'user.imDealCount':imDealCount}},{w:1}, function(err){
                if(!err){
                    mongo.db().collection(fields.DB_APP_PUSH_CLIENT).findOne({_id:session.user._id}, function(err, doc){
                        redisUtils.string.setObj(redisField.ONLINE_AGENT_INFO+session.user._id, doc, function(){},redisField.REDIS_DB1);
                        webchatHandler.notifyAssign(session, function(){});
                    });
                }
            });

        } else {
            logger.app.error('db getCurrentUser error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }
    });
}
exports.updateImFont = function (data,session, callback) {
    var result = {success: false};
    var query = {"_id": session._id};
    data.imFontSize = data.imFontSize;
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).update(query, {$set: data}, function (err, row) {
        if (!err) {
            result.success = true;
            callback(result);
        } else {
            logger.app.error('db getCurrentUser error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }
    });
}

//获取当前登录用户信息
exports.getCurrentUser = function (id,session, callback) {
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_USER).findOne({_id: session._id}, function (err, row) {
        if (!err) {
            result.success = true;
            result.user = row;
            callback(result);
        } else {
            logger.app.error('db getCurrentUser error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }
    });
}
exports.getCallInternation = function(data,session,callback){
    var result = {success:false,iscallinternation:false};
    mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).find({_id : data + "_cc"},{fields:{intlFeeSet:1}}).toArray(function (err, row){
        if (!err) {
            result.success = true;
            if(row.length==0){
                result.iscallinternation = false;
            }else{
                result.iscallinternation = true;
            }
            callback(result);
        } else {
            logger.app.error('db getCallInternation error:' + err.stack);
            result.message = '404 isCallInternation not found!';
            callback(result);
        }
    });
}
exports.batchUpdateUser = function(data,session,callback){
    var total=data.total;
    var set=data.set;
    var flag=set.flag;
    delete set.flag;
    var query=data.query||{};
    if(!query.account){
        query.account=session.user.account;
    }
    _setQueryCondition(query);
    if(query.deptId == "noDept"){
        query.deptId = {$in:[null,""]};
    }
    var result = {success:false};
    mongo.db("bill").collection(fields.DB_PLATFORM_USER).find(query, {sort:{exten:1}}).toArray(function(err, docs) {
        if (!err) {
            if(total==docs.length){
                var list=docs||[];
                if(list.length==0){
                    result.success=true;
                    callback(result);
                    return;
                }
                if(flag=='parentId'){
                    var index=0;
                    var noUpdateUser=[];
                    var updateUser=[];
                    var updateParentId=function(){
                        if(index<list.length){
                            var user = list[index];
                            var param={_id:user._id,parentId:set.parentId};
                            _checkIsChild(param,session,function(rep){
                                if(rep.success){
                                    if(rep.num>0){
                                        noUpdateUser.push(user.exten);
                                    }else{
                                        updateUser.push(user._id);
                                    }
                                    index++;
                                    updateParentId();
                                }else{
                                    callback(rep);
                                }
                            });
                        }else{
                            if(noUpdateUser.length>0){
                                result.code="1002";
                                result.message=noUpdateUser.join(",")+"座席更新不成功，不能选择自己或您的下级座席作为其上级!";
                            }
                            if(updateUser.length>0){
                                var _query={_id:{$in:updateUser}};
                                mongo.db("bill").collection(fields.DB_PLATFORM_USER).update(_query,{$set:set},{multi: true},function(err){
                                    if(!err){
                                        result.success=true;
                                        callback(result);
                                    }else{
                                        logger.app.error('batchUpdateUser error:' + err.stack);
                                        callback(result);
                                    }
                                });
                            }else{
                                result.success=true;
                                callback(result);
                            }
                        }
                    }
                    updateParentId();
                }else if(flag == "dept"){
                    mongo.db("bill").collection(fields.DB_PLATFORM_USER).update(query,{$set:set},{multi: true},function(err){
                        if(!err){
                            result.success=true;
                            callback(result);
                        }else{
                            logger.app.error('batchUpdateUser error:' + err.stack);
                            callback(result);
                        }
                    });
                }else if(flag == "loginWay"){
                    mongo.db("bill").collection(fields.DB_PLATFORM_USER).update(query,{$set:set},{multi: true},function(err){
                        if(!err){
                            result.success=true;
                            callback(result);
                        }else{
                            logger.app.error('batchUpdateUser error:' + err.stack);
                            callback(result);
                        }
                    });
                }else{
                    var uids=[];
                    for (var i = 0; i < list.length; i++) {
                        var user = list[i];
                        uids.push(user._id);
                    }
                    var _query={_id:{$in:uids}};
                    mongo.db("bill").collection(fields.DB_PLATFORM_USER).update(_query,{$set:set},{multi: true},function(err){
                        if(!err){
                            result.success=true;
                            callback(result);
                        }else{
                            logger.app.error('batchUpdateUser error:' + err.stack);
                            callback(result);
                        }
                    });
                }

            }else{
                logger.app.error('batchUpdateUser data is change');
                result.code = '1001';
                callback(result);
            }
        }else{
            logger.app.error('batchUpdateUser error:' + err.stack);
            result.message = 'batchUpdateUser error!';
            callback(result);
        }
    });
}
