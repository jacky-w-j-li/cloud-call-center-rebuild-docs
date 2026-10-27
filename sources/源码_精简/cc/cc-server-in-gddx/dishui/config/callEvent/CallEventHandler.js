/**
 * Created with JetBrains WebStorm.
 * User: chenguang
 * Date: 13-9-25
 * Time: 下午2:59
 * To change this template use File | Settings | File Templates.
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');

exports.addOrUpdateCallEvent = function(data,session,callback){
    var result = {success:false};
    //add callEvent
    data.Action = "EventInterfaceAdd";
    data.EventType = "CallEvent";
    if(!data.Account)
        data.Account = session.account.account;

    if(data._id == null || data._id == ''){
        data._id = uuid.generateUuid();
        data.Update = false;
        data.UrlKey = data._id;
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_INTERFACE_CONFIG_EVENT
            }
        }
    }else{
        //update callEvent
        data.Update = true;
        data.UrlKey = data._id;
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_INTERFACE_CONFIG_EVENT,
                condition:{
                    _id : data._id
                }
            }
        }
    }
    ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Add call Event failure:" + data._id;
            result.success = false;
            callback(result);
            return;
        }
        result.success = true;
        result.data = data;
        logger.app.info(session.account.account + ' add interface [callEvent] to ' + data.PBX + ' success!');
        callback(result);
    });
}

exports.queryCallEvent = function(data,session,callback){
    var result = {success:false};
    var find = {
        Account : session.account.account
    }
    mongo.db().collection(fields.DB_INTERFACE_CONFIG_EVENT).find(find).toArray(function(err,docs){
        if(err){
           logger.app.error(err.stack);
           result.success = false;
           callback(result);
           return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.getCallEventById = function(data,session,callback){
    var result = {success:false};
    var find = {
        _id : data
    }
    mongo.db().collection(fields.DB_INTERFACE_CONFIG_EVENT).findOne(find,function(err,doc){
        if(err){
            logger.app.error(err.stack);
            result.success = false;
            callback(result);
            return;
        }
        result.doc = doc;
        result.success = true;
        callback(result);
    });
}

exports.delCallEvent = function(data,session,callback){
    var result = {success:false};
    exports.getCallEventById(data,session,function(res){
        if(!res.success || !res.doc){
            callback(result);
            return;
        }
        var callEvent = res.doc;
        var ivrData = {
            nodeData: {
                Action : 'EventInterfaceRemove',
                Name : callEvent._id,
                PBX : callEvent.PBX,
                Account : callEvent.Account
            },
            dbData: {
                tableName : fields.DB_INTERFACE_CONFIG_EVENT,
                condition : {
                    _id : callEvent._id
                }
            }
        }
        ivrHandler.deleteIvr(ivrData, session, function (res) {
            if (!res.success) {
                logger.app.error(err.stack);
                result.message = "Delete call Event failure:" + data;
                result.success = false;
                callback(result);
                return;
            }
            result.success = true;
            logger.app.info(session.account.account + ' Delete interface [callEvent] ' + data + ' success!');
            callback(result);
        });

    });
}

exports.queryCallEventForIvrTools = function(data,session,callback){
    var result = {success:false};
    mongo.db().collection(fields.DB_INTERFACE_CONFIG_EVENT).find(data).toArray(function(err,docs){
        if(err){
            logger.app.error(err.stack);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
};