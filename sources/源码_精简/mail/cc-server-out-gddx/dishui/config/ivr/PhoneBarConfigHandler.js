var logger = require("appLog");
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var fields = require(__baseDir + '/dishui/common/Fields');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');

exports.queryPhoneBarConfig = function (data, session, callback) {
    if (!data.Account){
        data.Account = session.user.account;
    }
    var result= {success : false};
    mongo.db().collection(fields.DB_IVR_PHONEBAR_CONFIG).find(data).toArray(function(err, docs){
        if(!err){
            result.list = docs;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err.stack);
            result.message = 'Query phone bar config failure: ' + util.inspect(data);
            result.success = false;
            callback(result);
        }
    });
}

exports.getPhoneBars = function(session, callback){
    var result = {success: false};
    var queryData = {
        Account: session.user.account,
        PBX: session.user.pbx
    }
    mongo.db().collection(fields.DB_IVR_PHONEBAR_CONFIG).find(queryData).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
}

exports.initToDo = function (data, session, callback) {
    var result = {success:false};
    if (!data.phoneBarItems){
        data.phoneBarItems = '';
    }
    var assPhoneList = data.plist;
    if(data.plist && data.plist.length > 0){
        var phonebarconfig = data.plist.shift();
        mongo.db().collection(fields.DB_IVR_PHONEBAR_CONFIG).insert(phonebarconfig, function (err, result) {
            if (err) {
                callback({success: false});
            }
            if (data.IsEnable && data.IsEnable == "1"){
                data.phoneBarItems += phonebarconfig.PhoneBarItemId +":"+ phonebarconfig.PhoneBarItemName + ",";
            }
            if (data.plist.length > 0) {
                exports.initToDo(data, session, callback);
            } else {
                var statusValue = data.phoneBarItems;
                var PbcValue = statusValue.substr(0, statusValue.length - 1);
                var PhoneBarConfigData = {
                    Action : "AccountAdd",
                    PhonebarConfig : PbcValue,
                    PBX : data.PBX,
                    Account : data.AccountId
                }
                var ivrData = {
                    nodeData : PhoneBarConfigData,
                    isStoreDB: false,
                    dbData : {
                        tableName : fields.DB_IVR_PHONEBAR_CONFIG
                    }
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function(err,acsRes){
                    if(!err){
                        result.success = true;
                        console.log('init phoneBarConfig success!');
                        callback(result);
                    }else{
                        result.message = 'init phoneBarConfig failed!';
                        callback(result);
                    }
                });
            }
        });
    }
}

exports.initPhoneBarConfig = function(data, session, callback) {
    var result = {success:false};
    var queryPhoneBarData = {
        Account: data.Account,
        PBX: data.PBX
    }
    exports.queryPhoneBarConfig(queryPhoneBarData, session, function(queryResult){
        if (!queryResult.success) {
            logger.app.error('Query phonebar config failure!');
            result.message = 'Query phonebar config failure!';
            callback(result);
            return;
        }

        if (queryResult.list && queryResult.list.length > 0) {
            result.success = true;
            callback(result);
            return;
        } else {
            var PhoneBarItemName = '';
            var IsEnable = '';
            var IsSystemConfig = '';
            var phoneBarConfigList = new Array();
            var PhoneBarItemId = '';
            var phoneBarConfig = '';
            for (var i = 0;i < 11; i++){
                if (i == 0) {
                    PhoneBarItemName = fields.PHONE_TYPE_FREE;
                    IsEnable = "1";
                    IsSystemConfig = "1";
                    PhoneBarItemId = "0";
                } else if (i == 1) {
                    PhoneBarItemName = fields.PHONE_TYPE_BUSY;
                    IsEnable = "1";
                    IsSystemConfig = "1";
                    PhoneBarItemId = "1";
                } else if (i == 2) {
                    PhoneBarItemName = fields.PHONE_TYPE_REST;
                    IsEnable = "1";
                    IsSystemConfig = "1";
                    PhoneBarItemId = "2";
                } else if (i == 10) {
                    PhoneBarItemName = fields.PHONE_SYSTEM_BUSY;
                    IsEnable = "1";
                    IsSystemConfig = "1";
                    PhoneBarItemId = "99";
                } else {
                    PhoneBarItemName = "状态" + i;
                    IsEnable = "0";
                    IsSystemConfig = "0";
                    PhoneBarItemId = i+'';
                }
                var phonebarData = {
                    _id : uuid.generateRandomId(),
                    Account : data.AccountId,
                    PBX : data.PBX,
                    PhoneBarItemName : PhoneBarItemName,
                    PhoneBarItemId : PhoneBarItemId,
                    IsEnable : IsEnable,
                    IsSystemConfig : IsSystemConfig,
                    UpdateTime : dateTimeUtil.getCurrentDate()
                }
                phoneBarConfigList.push(phonebarData);
            }
            data.plist = phoneBarConfigList;
            exports.initToDo(data, session, function(todoRes) {
                if (!todoRes.success) {
                    callback(new Error(todoRes.message));
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        }
    });
}

exports.savePhoneBarConfig = function (data, session, callback) {
    var result = {success : false};
    data.Account = session.user.account;
    var PList = '';
    var PhoneBarConfigValue = '';
    exports.queryPhoneBarConfig({Account: data.Account, PBX: data.PBX, IsEnable: '1'}, session, function(queryRes, err){
        if (err) {
            result.success = false;
            callback(result);
            return;
        }
        PList = queryRes.list;
        mongo.db().collection(fields.DB_IVR_PHONEBAR_CONFIG).findOne({Account: data.Account, PBX: data.PBX, _id: data._id},function(err, doc){
            if (err){
                logger.app.error(err.stack);
                result.message = 'Query phone bar config failure: ' + util.inspect(data);
                result.success = false;
                callback(result);
            }
            if(doc){
                var oldData = {};
                for (var i = 0; i < PList.length; i++){
                    if (data._id == PList[i]._id){
                        oldData = PList[i];
                        //PList.splice(i, 1);
                    }
                }
                if (doc.IsEnable != data.IsEnable && data.IsEnable == '0'){
                    for (var i = 0; i < PList.length; i++){
                        if (data._id == PList[i]._id){
                            PList.splice(i, 1);
                        }
                    }
                }else if(doc.IsEnable != data.IsEnable && data.IsEnable == '1'){
                    PList.push(data);
                }else{
                    for (var i = 0; i < PList.length; i++){
                        if (data._id == PList[i]._id){
                            PList.splice(i, 1);
                        }
                    }
                    PList.push(data);
                }
                for (var i = 0; i < PList.length; i++) {
                    var phoneBarItem = PList[i].PhoneBarItemId +":"+ PList[i].PhoneBarItemName + ",";
                    PhoneBarConfigValue += phoneBarItem;
                }
                var PbcValue = PhoneBarConfigValue.substr(0, PhoneBarConfigValue.length - 1);
                var PhoneBarConfigData = {
                    Action : "AccountAdd",
                    PhonebarConfig : PbcValue,
                    PBX : data.PBX,
                    Account : data.Account
                }
                var ivrData = {
                    nodeData : PhoneBarConfigData,
                    currentData : data,
                    dbData : {
                        tableName : fields.DB_IVR_PHONEBAR_CONFIG
                    }
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function(err,acsRes){
                    if(!err){
                        result.success = true;
                        if (ivrData.currentData.IsEnable == '0') {
                            ivrData.currentData.ShowIsEnable = '停用'
                        } else {
                            ivrData.currentData.ShowIsEnable = '启用'
                        }
                        result.data = ivrData.currentData;
                        console.log('exit phoneBarConfig success!');
                        callback(result);
                    }else{
                        result.message = 'edit phoneBarConfig failed!';
                        callback(result);
                    }
                });
            }
        });
    });
}

exports.savePhoneBarConfigForIvrTools = function (data, session, callback) {

    var result = {success:false};
    var PhoneBarConfigValue = '';
    for (var i = 0; i < data.list.length; i++) {
        var phoneBarItem = data.list[i].PhoneBarItemId +":"+ data.list[i].PhoneBarItemName + ",";
        PhoneBarConfigValue += phoneBarItem;
    }
    var PbcValue = PhoneBarConfigValue.substr(0, PhoneBarConfigValue.length - 1);
    var PhoneBarConfigData = {
        Action : "AccountAdd",
        PhonebarConfig : PbcValue,
        PBX : data.PBX,
        Account : data.Account
    }
    var ivrData = {
        nodeData : PhoneBarConfigData,
        isStoreDB : false
    }
    ivrHandler.saveOrUpdateIvr(ivrData, session, function(err,acsRes){
        if(!err){
            result.success = true;
            result.data = data;
            console.log('edit phoneBarConfig success!');
            callback(result);
        }else{
            result.message = 'edit phoneBarConfig failed!';
            callback(result);
        }
    });
};
