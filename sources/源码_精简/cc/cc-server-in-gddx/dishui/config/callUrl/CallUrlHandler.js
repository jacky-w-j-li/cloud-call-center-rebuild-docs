var fields = require(__baseDir + '/dishui/common/Fields');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');

var CallUrlHandler = {
    //添加外呼弹屏地址保存
    addDialoutUrlFields: function(data, session, callback) {
        var result = {success:false};
        var id = utils.UUID.generateUuid();
        data._id = id;
        data.accountId = session.user.account;
        data.lastUpdate = utils.getCurrentDateTime();
        if(data.url.substr(0, 7) != "http://" && data.url.substr(0, 8) != "https://"){
            data.url = "http://" + data.url;
        }
        mongo.db().collection(fields.DB_DIALOUT_URL).find({"accountId":session.user.account}).toArray(function (err, docs) {
            if (!err) {
                mongo.db().collection(fields.DB_DIALOUT_URL).insert(data , function(err){
                    if(!err){
                        result.success = true;
                    } else{
                        logger.app.error('db insert error :'+err.stack);
                        result.message = 'db insert error!'+err.message;
                    }
                    callback(result);
                });
            } else {
                callback(result);
            }
        });
    },
    addCallUrlFields: function(data, session, callback) {
        var result = {success:false};
        var id = utils.UUID.generateUuid();
        data._id = id;
        data.accountId = session.user.account;
        data.lastUpdate = utils.getCurrentDateTime();
        if(data.url.substr(0, 7) != "http://" && data.url.substr(0, 8) != "https://"){
            data.url = "http://" + data.url;
        }
        mongo.db().collection(fields.DB_CALL_URL).find({"accountId":session.user.account}).toArray(function (err, docs) {
            if (!err) {
                mongo.db().collection(fields.DB_CALL_URL).insert(data , function(err){
                    if(!err){
                        result.success = true;
                    } else{
                        logger.app.error('db insert error :'+err.stack);
                        result.message = 'db insert error!'+err.message;
                    }
                    callback(result);
                });
            } else {
                callback(result);
            }
        });
    },
    queryDialoutUrlFields: function(data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_DIALOUT_URL).find({"accountId":session.user.account},{sort:{lastUpdate:-1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                result.success = true;
                result.data = docs;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    queryCallUrlFields: function(data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_CALL_URL).find({"accountId":session.user.account},{sort:{lastUpdate:-1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                result.success = true;
                result.data = docs;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    editCallUrlFields: function(data, session, callback) {
        var result = {success: false};
        if(data.url.substr(0, 7) != "http://" && data.url.substr(0, 8) != "https://"){
            data.url = "http://" + data.url;
        }
        var update = {
            $set: {
                type: data.type,
                url: data.url,
                name: data.name,
                lastUpdate: utils.getCurrentDateTime()
            }
        };
        if(data.outOpenType){
            update['$set']['outOpenType'] = data.outOpenType;
        }
        mongo.db().collection(fields.DB_CALL_URL).update({_id: data._id}, update, function (err) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    editDialoutUrlFields: function(data, session, callback) {
        var result = {success: false};
        if(data.url.substr(0, 7) != "http://" && data.url.substr(0, 8) != "https://"){
            data.url = "http://" + data.url;
        }
        var update = {
            $set: {
                type: data.type,
                url: data.url,
                name: data.name,
                lastUpdate: utils.getCurrentDateTime()
            }
        };
        if(data.outOpenType){
            update['$set']['outOpenType'] = data.outOpenType;
        }
        mongo.db().collection(fields.DB_DIALOUT_URL).update({_id: data._id}, update, function (err) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    delCallUrlFields: function(data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_CALL_URL).remove(data, function(err, docs){
            if (!err) {
                result.success = true;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    userDialoutScreen: function(data, session, callback) {
        var result = {success: false};
        var accountId = session.account.account;
        var enableValue = "false";
        var useenamble = "true";
        var update ={
            $set: {
                enable:enableValue
            }
        };
        mongo.db().collection(fields.DB_DIALOUT_URL).update({accountId:accountId},update,{upsert:true,multi: true}, function(err){
            if (!err) {
                update.$set.enable=useenamble;
                mongo.db().collection(fields.DB_DIALOUT_URL).update({_id:data._id},update,function(err){
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }

        });
    },
    stopuserDialoutScreen: function(data, session, callback) {
        var result = {success: false};
        var useenamble = "false";
        var update ={
                enable:useenamble
        };
        mongo.db().collection(fields.DB_DIALOUT_URL).update({_id:data._id},{'$set':update},function(err){
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    delDialoutUrlFields: function(data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_DIALOUT_URL).remove(data, function(err, docs){
            if (!err) {
                result.success = true;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    queryCallUrls:function(session, callback){
            var result = {success: false};
        var query={accountId:session.user.account};
        mongo.db().collection(fields.DB_CALL_URL).find(query).toArray(function(err,docs){
            if (!err) {
                result.success = true;
                callback(null,docs||[]);
            } else {
                logger.app.error('queryCallUrls:' + err.stack);
                result.message = 'queryCallUrls error!'+err.message;
                callback(err);
            }
        });
    },
    queryDialoutUrls:function(session, callback){
        var result = {success: false};
        var query={accountId:session.user.account};
        mongo.db().collection(fields.DB_DIALOUT_URL).find(query).toArray(function(err,docs){
            if (!err) {
                result.success = true;
                callback(null,docs||[]);
            } else {
                logger.app.error('queryCallUrls:' + err.stack);
                result.message = 'queryCallUrls error!'+err.message;
                callback(err);
            }
        });
    }

}

module.exports = CallUrlHandler;
