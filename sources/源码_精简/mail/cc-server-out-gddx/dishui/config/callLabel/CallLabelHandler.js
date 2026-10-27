/**
 * Created with JetBrains WebStorm.
 * User: wanggang
 * Date: 16-8-2
 *
 *
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var utils = require('appUtil/Utils');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');

exports.addCallLabel = function(data,session,callback){
    var result = {success:false};
    data.accountId = session.account.account;
    data.lastUpdate = utils.getCurrentDateTime();
    var find={
        "name": data.name,
        "accountId":data.accountId
    }
    if(!data._id){
        var id = utils.UUID.generateUuid();
        data._id = id;
        mongo.db().collection(fields.MANAGER_CALL_LABEL).findOne(find,function(err,docs){
            if(!err){
                if(docs==null || docs.length<1 ){
                    mongo.db().collection(fields.MANAGER_CALL_LABEL).insert(data,function(err){
                        if(err){
                            logger.app.error(err.stack);
                            callback(result);
                            return;
                        }
                        result.message ="标签保存成功！" ;
                        result.success = true;
                        callback(result);
                    });
                }else{
                    result.success = false;
                    result.message = "标签已存在，请修改后重新保存。";
                    callback(result);
                }
            }else{
                result.success = false;
                result.message = "保存超时，请重新保存";
                callback(result);
            }
        });
    }else {
        var id = data._id;
        var find={
            "_id":{$ne:id},
            "name": data.name,
            "accountId":data.accountId
        }
        var update = {
           $set:{
               name:data.name,
               lastUpdate:data.lastUpdate
           }
        }
        mongo.db().collection(fields.MANAGER_CALL_LABEL).findOne(find,function(err,docs){
            if(!err) {
                if(docs){
                    result.success = false;
                    result.message = "标签已存在，请修改后重新保存。";
                    callback(result);
                }else{
                    mongo.db().collection(fields.MANAGER_CALL_LABEL).update({_id: data._id}, update, function (err) {
                        if (err) {
                            logger.app.error(err.stack);
                            result.success = false;
                            callback(result);
                            return;
                        }
                        result.message ="标签修改成功！" ;
                        result.success = true;
                        callback(result);
                    });
                }
            }else{
                result.success = false;
                result.message = "保存超时，请重新保存";
                callback(result);
            }

        });
    };
}
exports.queryCallLabel = function(data,session,callback){
    var result = {success: false};
    data = {accountId:session.account.account};
    mongo.db().collection(fields.MANAGER_CALL_LABEL).find(data).toArray(function(err,docs){
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
exports.updateCallLabelState = function(data,session,callback) {
    var result = {success: false};
    data.lastUpdate = utils.getCurrentDateTime();
    var update = {
        $set: {
            name: data.name,
            lastUpdate: data.lastUpdate,
            enable: data.enable
        }
    };
    mongo.db().collection(fields.MANAGER_CALL_LABEL).update({_id: data._id}, update, function (err) {
        if (err) {
            logger.app.error(err.stack);
            result.success = false;
            callback(result);
            return;
        }
        result.message = "修改标签状态成功"
        result.success = true;
        callback(result);
    });
}