var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');


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
    utils.removeEmptyProperty(condition);
    if(condition.display_name)
        condition.display_name = new RegExp(condition.display_name);
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_ROLE).find(condition, {sort:{"$natural":-1},limit: limit, skip: skip}).toArray(function (err, docs) {
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

}

exports.queryRoleAll = function (data , session , callback){
    var condition = data;
    utils.removeEmptyProperty(condition);
    var result = {success:false};
    mongo.db().collection(fields.DB_APP_ROLE).find(condition).toArray(function(err,docs){
        if(!err){
            result.list = docs;
            result.success = true;
            callback(result);
        }else{
            logger.app.error(err);
            callback({success:false,list:[],count:0});
        }
    })

}

exports.addRole = function (data, session,callback) {
    var result = {success: false};
    var id=utils.UUID.generateUuid();
    data._id=id;
    mongo.db().collection(fields.DB_APP_ROLE).find({display_name: data.display_name}).toArray(function (err, docs) {
        if (!err) {
            if (docs && docs.length == 0) {
                mongo.db().collection(fields.DB_APP_ROLE).insert(data, function (err) {
                    if (!err) {
                        result.success = true;
                    } else {
                        logger.app.error('db insert error:' + err.stack);
                        result.message = 'db insert error!'+err.message;
                    }
                    callback(result);
                });
            } else {
                result.message = 'role is exists!';
                callback(result);
            }
        } else {
            logger.app.error(err.stack);
            result.message = 'role query error!';
            callback(result);
        }
    });

}

exports.updateRole = function (data, session,callback) {
    var result = {success: false};
    var query={"_id":data._id};
    delete data["_id"];
    var info=JSON.stringify(data);
    logger.app.error('======================--'+info);

    mongo.db().collection(fields.DB_APP_ROLE).update(query,{$set:data},function(err,row){
        if(!err){
            result.success = true;
            callback(result);
        }else{
            logger.app.error('db update error:' + err.stack);
            result.message = 'role update error!';
            callback(result);
        }
    });
}
exports.getRoleById = function (data, session,callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_ROLE).findOne({_id:data._id},function(err,row){
        if(!err){
            result.success = true;
            result.data=row;
            callback(result);
        }else{
            logger.app.error('db getRoleById error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }
    });
}
exports.showRoleAdd = function (data, session,callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_MENU).findOne({type:"agent"}, function(err, menu){
        if(!err) {
            result.success = true;
            result.data=!menu?'':menu.menu;
            callback(result);
        } else {
            logger.app.error('db showRoleAdd error:' + err.stack);
            result.message = '404 function not found!';
            callback(result)
        }
    });

}

//修改
exports.showRoleEdit= function (data, session,callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_ROLE).findOne({_id:data._id},function(err,row){
        if(!err){
            //查询到的行数据传给result.role
            result.role=row;
            mongo.db().collection(fields.DB_APP_MENU).findOne({type:"agent"}, function(err, menu){
                if(!err) {
                    result.success = true;
                    result.data=!menu?'':menu.menu;
                    callback(result);
                } else {
                    logger.app.error('db showRoleEdit error:' + err.stack);
                    result.message = '404 function not found!';
                    callback(result)
                }
            });
        }else{
            logger.app.error('db showRoleEdit error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }
    });


}

//删除
exports.delRole= function (data, session,callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_ROLE).remove({_id:data._id},function(err){
        if(!err){
            result.success = true;
            callback(result);
        }else{
            logger.app.error('db delRole error:' + err.stack);
            result.message = '404 role not found!';
            callback(result);
        }

    });

}