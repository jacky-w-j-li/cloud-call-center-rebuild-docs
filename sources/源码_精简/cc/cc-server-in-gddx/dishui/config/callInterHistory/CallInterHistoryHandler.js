var fields = require(__baseDir + '/dishui/common/Fields');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var uuid = require('appUtil/UUID');

//新增或修改业务流程的对接地址--------修改的为不需要根据业务流程保存的情况
//exports.addOrEditCallInter = function(data, session, callback){
//    var result = {success: false};
//    exports.queryCallInter({'_id': data._id}, session, function(queryRes){
//        if(!queryRes.success){
//            result.message = queryRes.message;
//            logger.app.error(result.message);
//            callback(result);
//            return;
//        }
//        if(queryRes.listData && queryRes.listData.length > 0){
//            if(queryRes.listData[0].callInterItem){
//                data.callInterItem = queryRes.listData[0].callInterItem;
//            }else{
//                data.callInterItem = new Array();
//            }
//        }else{
//            data._id = uuid.generateRandomId();
//            data.createTime = utils.getCurrentDate();
//            data.createUser = session.user._id;
//            data.accountId = session.user.account;
//            data.callInterItem = new Array();
//        }
//        var itemName = data.itemName;
//        var itemUrl = data.itemUrl;
//        var itemId = "";
//        if(data.itemId == "itemId"){
//            itemId = uuid.generateRandomId();
//        }else{
//            itemId = data.itemId;
//        }
//        data.callInterItem.push({
//            itemName: itemName,
//            itemUrl: itemUrl,
//            itemId: itemId
//        });
//        delete data.itemName;
//        delete data.itemUrl;
//        delete data.itemId;
//        var callInterId = data._id;
//        delete data._id;
//        data.updateTime = utils.getCurrentDate();
//        data.updateUser = session.user._id;
//        mongo.db().collection(fields.DB_CALL_INTERFACE_HISTORY).update({'_id': callInterId}, {$set: data}, {upsert: true}, function (err) {
//            if(err){
//                result.message = "保存对接地址失败!";
//                logger.app.error(result.message + ": " + data);
//                callback(result);
//                return;
//            }
//            result.itemName= itemName;
//            result.itemUrl = itemUrl;
//            result.callInterId = callInterId;
//            result.itemId = itemId;
//            result.success = true;
//            callback(result);
//        });
//    });
//}
//
//exports.queryCallInterItem = function(data, session, callback){
//    var result = {success: false};
//    var queryData = {
//        accountId: session.user.account,
//        'callInterItem.itemId': data
//    }
//    mongo.db().collection(fields.DB_CALL_INTERFACE_HISTORY).findOne(queryData, function (err, doc){
//        if(err){
//            callback(result);
//            return;
//        }
//        var item = "";
//        for(var i=0; i<doc.callInterItem.length; i++){
//            if(data == doc.callInterItem[i].itemId){
//                item = doc.callInterItem[i];
//            }
//        }
//        result.data = item;
//        result.success = true;
//        callback(result);
//    });
//}
//---------the old version------------

exports.queryCallInter = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_CALL_INTER_HISTORY).find(data).toArray(function (err, docs) {
        if(err){
            result.message = "查询弹屏对接历史失败!";
            logger.app.error(result.message);
            callback(result);
            return;
        }else{
            result.listData = docs;
            result.success = true;
            callback(result);
        }
    });
}

exports.addOrEditCallInter = function(data, session, callback){
    var result = {success: false};
    if(!data._id){
        data._id = uuid.generateRandomId();
        data.createTime = utils.getCurrentDate();
        data.createUser = session.user._id;
        data.accountId = session.user.account;
    }
    data.updateUser = session.user._id;
    data.updateTime = utils.getCurrentDate();
    var callInterId = data._id;
    delete data._id;
    mongo.db().collection(fields.DB_CALL_INTER_HISTORY).update({'_id': callInterId}, {$set: data}, {upsert: true}, function (err) {
        if(err){
            result.message = "保存对接地址失败!";
            logger.app.error(result.message + ": " + data);
            callback(result);
            return;
        }
        data._id = callInterId;
        result.data= data;
        result.success = true;
        callback(result);
    });
}

exports.delCallInter = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_CALL_INTER_HISTORY).remove(data, function(err){
        if (!err) {
            result.success = true;
            callback(result);
        } else {
            result.message = "del callInter fail: "+data._id;
            logger.app.error(result);
            callback(result);
            return;
        }
    });
}

exports.getCallInters = function(session, callback){
    var result = {success: false};
    var query={accountId:session.user.account};
    mongo.db().collection(fields.DB_CALL_INTER_HISTORY).find(query).toArray(function(err,docs){
        if (!err) {
            result.success = true;
            callback(null,docs||[]);
        } else {
            logger.app.error('queryCallInters fail');
            result.message = 'queryCallUrls error!';
            callback(err);
        }
    });
}
