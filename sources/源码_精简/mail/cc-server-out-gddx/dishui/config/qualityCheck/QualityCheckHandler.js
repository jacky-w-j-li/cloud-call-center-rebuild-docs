/**
 * Created by chenguang on 8/21/14.
 */
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var dateTimeUtil = require('appUtil/DateTime');
var uuid = require('appUtil/UUID');
var nodeUtil = require('util');

exports.queryQualityCheckTemplate = function(data, session, callback) {
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
        callback(result);
    });
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