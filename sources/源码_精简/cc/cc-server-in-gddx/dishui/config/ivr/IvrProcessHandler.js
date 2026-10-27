var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var utils = require('appUtil/Utils');

exports.saveIvrProcess = function(data, session, callback){
    var result = {success: false};
    var _id = utils.UUID.generateUuid();
    var time=utils.getCurrentDate();
    data._id = _id;
    data.CreateTime=time;
    data.UpdateTime=time;
    mongo.db().collection(fields.DB_IVR_PROCESS).insert(data, function (err) {
        if (!err) {
            result.success = true;
            result.data = data;
            callback(result);
        } else {
            logger.app.error('db insert error:' + err.stack);
            result.message = 'db insert error!' + err.message;
            callback(result);
        }
    });
};
exports.updateIvrProcess = function(data, session, callback){
    var result = {success: false};
    var time=utils.getCurrentDate();
    data.UpdateTime=time;
    var update = {
        $set: {
            DisplayName: data.DisplayName,
            FirstNodeType: data.FirstNodeType,
            FirstNode: data.FirstNode,
            UpdateTime: time
        }
    };
    var scheduleUpdate = {
        $set: {
            ToPeerType: data.FirstNodeType,
            ToPeer: data.FirstNode,
            UpdateTime: time
        }
    };
    mongo.db().collection(fields.DB_IVR_PROCESS).update({_id: data._id}, update, function (err) {
        if (!err) {
            mongo.db().collection(fields.DB_IVR_SCHEDULE).update({IvrProcessId: data._id}, scheduleUpdate,{multi:true},function (err) {
                if (!err) {
                    mongo.db().collection(fields.DB_IVR_SCHEDULE).find({IvrProcessId: data._id}).toArray(function (err, docs) {
                        if (!err) {
                            var param = {
                                operation:'update',
                                type:'ivr_schedule',
                                data:docs
                            };
                            result.success = true;
                            result.data = update.$set;
                            result.data._id = data._id;
                            result.param = param;
                            callback(result);
                        } else {
                            logger.app.error('find schedule err:' + err.stack);
                            result.message = 'find schedule error!' + err.message;
                            callback(result);
                        }
                    });
                } else {
                    logger.app.error('db update error:' + err.stack);
                    result.message = 'db update error!' + err.message;
                    callback(result);
                }
            });
        } else {
            logger.app.error('db update error:' + err.stack);
            result.message = 'db update error!' + err.message;
            callback(result);
        }
    });
};
exports.delIvrProcess = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_PROCESS).findOne({_id:data._id},function(err,doc){
        if(!err){
            if(doc){
                mongo.db().collection(fields.DB_IVR_PROCESS).remove({_id: data._id}, function (err) {
                    if (!err) {
                        result.success = true;
                        result.data = data;
                        callback(result);
                    } else {
                        logger.app.error('db deleteIvrProcess error:' + err.stack);
                        result.message = '404 ivrProcess not found!';
                        callback(result);
                    }
                });
            }else{
                result.message = '404 ivrProcess not found!';
                callback(result);
            }
        }else{
            result.message = 'find this ivrProcess failed!';
            callback(result);
        }
    });
};
exports.queryIvrProcessList = function(data, session, callback){
    var result = {success: false};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 5;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = data;
    if(!condition.Account){
        condition.Account = session.user.account;
    }
    if(condition.DisplayName){
        condition.DisplayName = new RegExp(condition.DisplayName);
    }
    utils.removeEmptyProperty(condition);
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_PROCESS).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_IVR_PROCESS).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err.stack);
                    result.message = 'query ivrProcess list failed!';
                    callback(result);
                }
            });
        } else {
            logger.app.error(err.stack);
            result.message = 'query ivrProcess list failed!';
            callback(result);
        }
    });
};
exports.queryIvrProcessById = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_PROCESS).findOne(data, function (err,doc) {
        if (!err) {
            result.success = true;
            result.data = doc;
            callback(result);
        } else {
            logger.app.error('db queryIvrProcessById error:' + err.stack);
            result.message = '404 ivrProcess not found!';
            callback(result);
        }
    });
};
exports.queryAllProcessList = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_PROCESS).find(data, {sort:{"$natural": -1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query ivrProcess failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
};

