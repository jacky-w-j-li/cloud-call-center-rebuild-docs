/**
 * Created by chenguang on 8/21/14.
 */
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var dateTimeUtil = require('appUtil/DateTime');
var uuid = require('appUtil/UUID');
var nodeUtil = require('util');
var utils = require('appUtil/Utils');

exports.queryQualityCheckTemplate = function(data, session, callback) {
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
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).find(condition, {sort: {"updateTime": -1}, limit: limit, skip: skip}).toArray(function(err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).count(condition, function (err, count) {
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

exports.queryQualityTaskTemplateConfig = function (data, session, callback) {
    var result = {success: false};
    mongo.db(session).collection(session.account.account + '_c5_call_sheet').findOne({"_id" : data.callId}, function (err, call) {
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).findOne({"_id" : call.TASK_ID[0]},function(err, docs) {
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).findOne({"_id" : docs.query.TASK_TEMPLATE},function(err, doc) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                result.config = doc;
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.queryQualityCheckConfig = function(data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).find(data).toArray(function(err, docs) {
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.queryQualityCheckConfigOneConfig = function(data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).findOne(data,function(err, doc) {
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        if(doc){
            result.type = doc.type;
            result.list = doc.config;
        }else{
            result.list = [];
        }
        result.success = true;
        callback(result);
    });
}

exports.saveQualityCheckTemplate = function(data, session, callback) {
    var result = {success: false};
    data.account = session.user.account;
    data.updateUser = session.user._id;
    data.updateTime = dateTimeUtil.getDateFormat(new Date());
    var id = null;
    if(!data._id || data._id==''){
        id = uuid.generateUuid();
    }else{
        id = data._id;
    }
    if(!data.enable){
        data.enable = true;
    }else{
        if(data.enable=='true'){
            data.enable = true;
        }
    }
    delete data._id;
    var templateName = {}
    templateName.name= data.name;
    templateName._id= { $ne: id};
    templateName.account = session.user.account
    utils.removeEmptyProperty(templateName);
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).findOne(templateName,function(err, tem) {
        if (tem) {
            result.success = false;
            result.message ="质检模板名称已存在，请更改后重新保存"
            callback(result);
            return
        } else {
            mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).update({'_id':id}, {$set:data}, {upsert:true}, function(err){
                if(!err) {
                    result.success = true;
                    callback(result);
                }else{
                    result.success = false;
                    result.message ="保存失败"
                    callback(result);
                }
            })
        }
    });
}
//质检模板2
exports.saveQualityCheckTemplateTwo = function(data, session, callback) {
    var result = {success: false};
    data.account = session.user.account;
    data.updateUser = session.user._id;
    data.updateTime = dateTimeUtil.getDateFormat(new Date());
    var id = null;
    if(!data._id || data._id==''){
        id = uuid.generateUuid();
    }else{
        id = data._id;
    }
    if(!data.enable){
        data.enable = true;
    }else{
        if(data.enable=='true'){
            data.enable = true;
        }
    }
    delete data._id;
    var templateName = {}
    templateName.name = data.name;
    templateName.account = session.user.account
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).findOne(templateName,function(err, tem) {
        if (tem) {
            result.success = false;
            result.message = "质检模板名称已存在，请更改后重新保存"
            callback(result);
            return
        } else {
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).update({'_id':id}, {'$set':data}, {upsert:true}, function(err){
        if(err) {
            logger.app.error(err);
            result.message = 'Save quality check config failure: ' + nodeUtil.inspect(data);
            callback(result);

        }
        result.success = true;
        result.data = data;
        logger.app.info('Save account ['+data.ACCOUNT+'] quality check config success:' + nodeUtil.inspect(data));
        callback(result);
      });
        }
    })
}

exports.saveQualityCheckConfig = function(data, session, callback) {
    var result = {success: false};
    var isUpdate = false;
    var queryData = {};
    var id = null;
    var accountId = null;
    var userId = null;
    if(data.ACCOUNT) {
        accountId = data.ACCOUNT;
        userId = 'admin';
    } else {
        accountId = session.user.accountId;
        userId = session.user._id;
    }
    if(data._id) {
        queryData._id = data._id;
        id = data._id;
        isUpdate = true;
    } else {
        queryData.ACCOUNT = accountId;
        id = uuid.generateUuid();
    }
    delete data._id;
    exports.queryQualityCheckConfig(queryData, session, function(queryRes) {
        if(!queryRes.success) {
            callback(queryRes);
            return;
        }
        var configs = queryRes.list;
        if(!isUpdate) {
            var thisOrder = 1;
            if(configs.length > 0) {
                configs = configs.sort(function(a, b) {
                    return parseInt(b.ORDER) - parseInt(a.ORDER);
                });
                thisOrder = parseInt(configs[0].ORDER) + 1;
            }
            data.ACCOUNT = accountId;
            data.ORDER = thisOrder + '';
        }
        data.UPDATE_USER = userId;
        data.UPDATE_TIME = dateTimeUtil.getCurrentDate();
        mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).update({'_id':id}, {'$set':data}, {upsert:true}, function(err){
            if(err) {
                logger.app.error(err);
                result.message = 'Save quality check config failure: ' + nodeUtil.inspect(data);
                callback(result);
                return;
            }
            result.success = true;
            result.data = data;
            logger.app.info('Save account ['+data.ACCOUNT+'] quality check config success:' + nodeUtil.inspect(data));
//            logger.operate.log(session||'admin', 'CdrHandler.saveQualityCheckConfig','Save account ['+data.ACCOUNT+
//                '] quality check config success:' + nodeUtil.inspect(data));
            callback(result);
        });
    });
}

exports.deleteQualityCheckConfig = function(data, session, callback){
    var result = {success: false};
    if(data._id) {
        mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).remove({'_id': data._id}, function(err){
            if(err) {
                logger.app.error(err);
                result.message = 'Delete quality check config failure: ' + nodeUtil.inspect(data);
                callback(result);
                return;
            }
            logger.app.info(session, 'CdrHandler.deleteQualityCheckConfig','Delete account ['+session.user.accountId+
                '] quality check config success:' + nodeUtil.inspect(data));
            result.success = true;
            callback(result);
        });
    } else {
        result.message = 'Quality check config id not found.';
        callback(result);
    }
}

exports.getQualityCheckTemplateDic = function(session, callback) {
    var dicData = {
        account: session.user.account,
        enable: true
    }
    exports.queryQualityCheckConfig(dicData, session, function(dicRes) {
        if(!dicRes.success) {
            logger.app.error('Load quality check config dictionary failure.');
            callback(new Error('Load quality check config dictionary failure.'));
            return;
        }
        callback(null, dicRes.list);
    });
}

exports.changeQualityCheckTemplateStatus = function(data, session, callback){
    var result = {success: false};
    data.account = session.user.account;
    data.updateUser = session.user._id;
    data.updateTime = dateTimeUtil.getDateFormat(new Date());
    var updateData = {};
    if(data.currentStatus == 'true'){
        updateData.enable = false;
    }else{
        updateData.enable = true;
    }
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).update({'_id':data._id}, {'$set':updateData}, function(err){
        if(err) {
            logger.app.error(err);
            result.message = 'change quality check template status failure: ' + nodeUtil.inspect(data);
            callback(result);
            return;
        }
        result.success = true;
        logger.app.info('Save account ['+data.ACCOUNT+'] quality check template config success:' + nodeUtil.inspect(data));
        callback(result);
    });
}

exports.queryQualityCheckCycle = function(data, session, callback){
    var result = {success : false};
    var selector = {"account": session.user.account};
    var limit = data.pageSize;
    var skip = (data.page - 1)*limit;
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CYCLE_CONFIG).count(selector, function(err, count){
        if(err){
            logger.app.error(err);
            logger.report.info(data);
            result.message = "query quality check cycle count failure";
            callback(result);
        }else{
            result.count = count;
            mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CYCLE_CONFIG).find(selector).limit(limit).sort({'cycleBegins':1}).skip(skip).toArray(function (err, cycles) {
                if(err){
                    logger.app.error(err);
                    logger.report.info(data);
                    result.message = "query quality check cycle list failure";
                }else{
                    result.success = true;
                    result.data = cycles;
                }
                callback(result);
            });
        }
    });

}

exports.saveQualityCheckCycle = function(data, session, callback){
    var result = {success : false};
    data.account = session.user.account;
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CYCLE_CONFIG).count({"account": data.account}, function(err, count){
        if(err){
            logger.app.error(err);
            result.message = "save quality check cycle failure";
            callback(result);
        }else{
            if(count != null && count < 5){
                mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CYCLE_CONFIG).count({"account": data.account,"cycleName":data.cycleName}, function(err, dumpName){
                    if(err){
                        logger.app.error(err);
                        result.message = "save quality check cycle failure";
                        callback(result);
                    }else{
                        if(dumpName != null && dumpName == 0){
                            data._id = uuid.generateUuid();
                            data.updateUser = session.user._id;
                            data.updateTime = dateTimeUtil.getCurrentDateTime();
                            data.active = true;
                            mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CYCLE_CONFIG).insertOne(data, function(err){
                                if(err){
                                    logger.app.error(err);
                                    result.message = "save quality check cycle failure";
                                }else{
                                    result.success = true;
                                }
                                callback(result);
                            });
                        }else{
                            result.message = "您已经设置过一个名称为【" + data.cycleName + "】的质检周期了";
                            callback(result);
                        }
                    }
                });
            }else{
                result.message = "质检周期设置数量已经达到上限";
                callback(result);
            }
        }
    });
}
exports.changeQualityCheckCycleStatus = function(data, session, callback){
    var result = {success : false};
    var selector = {'_id': data.cycleId,'account': session.user.account};
    var updater = {'$set': {'active': data.active,'updateUser':session.user._id,'updateTime':dateTimeUtil.getCurrentDateTime()}};
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CYCLE_CONFIG).update(selector, updater, function(err){
        if(err){
            logger.app.error(err);
            result.message = "change quality check cycle status failure";
        }else{
            result.success = true;
            result.message = "200 ok!";
        }
        callback(result);
    });
}
exports.queryQualityCheckedCycle = function(data,session,callback){
    var result = {success : false};
    var selector = {"account": session.user.account,"active" : true};
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CYCLE_CONFIG).find(selector).toArray( function(err, cycles){
        if(!err){
            result.success = true;
            result.cycles = cycles;
            result.message = "query quality check cycle count failure";
            callback(result);
        }

    });
}
exports.queryQualityCheckedtabletitle = function(data,session,callback){
    var result = {success : false};
    var selector = {"account": session.user.account,
        "type":"pass",
        "enable" : true,
    };
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_CONFIG).find(selector).toArray( function(err, docs){
        if(!err){
            result.success = true;
            result.docs = docs;
            result.message = "query quality check cycle count failure";
            callback(result);
        }

    });
}