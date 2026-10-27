var logger = require("appLog");
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var dateTimeUtil = require('appUtil/DateTime');
var uuid = require('appUtil/UUID');
var fields = require(__baseDir + '/dishui/common/Fields');

exports.initVar = function (data, session, callback) {
    data.Account = session.user.account;
    var result= {success : false};
    mongo.db().collection(fields.DB_IVR_VAR).find({"$or":[{"Account":"admin"},data]}).toArray(function(err, docs){
        if(!err){
            result.list = docs;
            result.success = true;
            callback(result);
        } else {
            result.success = false;
            callback(result);
        }
    });
}

exports.queryVar = function (data, session, callback) {
    var result= {success : false};
    mongo.db().collection(fields.DB_IVR_VAR).find(data, {sort:{VarType:1, VarName:1}}).toArray(function(err, docs){
        if(!err){
            result.list = docs;
            result.success = true;
            callback(result);
        } else {
            result.success = false;
            callback(result);
        }
    });
}

exports.refreshVar = function(data, session, callback){
    var queryData = {
        '$or': [{Account:'admin'}, {Account:data.Account, PBX:data.PBX}]
    };
    exports.queryVar(queryData, session, callback);
}

exports.saveVar = function (data, session, callback) {
    var result= {success : false};
    var varId = '';
    if (!data._id) {
        varId = uuid.generateRandomId();
    } else {
        varId = data._id;
    }
    data.PopVar = data.PopVar?true:false;
    delete data['_id'];
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    //data.UpdateUser = session.user._id;
    mongo.db().collection(fields.DB_IVR_VAR).update({"_id": varId}, {$set: data}, {upsert: true}, function (err, res) {
        if (err) {
            result.success = false;
            result.message = 'Save ivr var failure: ' + data.DisplayName;
            callback(result);
        } else {
            data._id = varId;
            result.data = data;
            result.success = true;
            callback(result);
        }
    });
}

exports.delVar = function (data, session, callback) {
    var result= {success : false};
    mongo.db().collection(fields.DB_IVR_VAR).remove({"_id": data._id}, function(err, res){
        if(!err){
            result.data = data;
            result.success = true;
            callback(result);
        }else{
            logger.app.error('db delVar error:' + err.stack);
            callback(result);
        }
    });
}
