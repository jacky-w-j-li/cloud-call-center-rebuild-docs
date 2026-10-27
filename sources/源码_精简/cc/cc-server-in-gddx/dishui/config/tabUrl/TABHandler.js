var fields = require(__baseDir + '/dishui/common/Fields');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');

var TABHandler = {
    addTABFields: function(data, session, callback) {
        var result = {success:false};
        var id = utils.UUID.generateUuid();
        data._id = id;
        data.accountId = session.user.account;
        data.order = 0;
        mongo.db().collection(fields.DB_TAB_URL).find({"accountId":session.user.account}, {sort: {order: -1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                if(docs.length > 0) {
                    data.order = docs.length;
                }
                mongo.db().collection(fields.DB_TAB_URL).insert(data , function(err){
                    if(!err){
                        result.success = true;
                    } else{
                        logger.app.error('db insert error :'+err.stack);
                        result.message = 'db insert error!'+err.message;
                    }
                    callback(result);
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },
    queryTABFields: function(data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_TAB_URL).find({"accountId":session.user.account},{sort: {order: 1}}).toArray(function (err, docs) {
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
    getTABFields: function(session, callback) {
        mongo.db().collection(fields.DB_TAB_URL).find({"accountId":session.user.account},{sort: {order: 1}}).toArray(function (err, docs) {
            if (!err) {
                callback(null, docs || []);
            } else {
                logger.app.error("", err);
                callback(err);
            }
        });
    },
    getUrlsDic:function(session, callback) {
        mongo.db().collection(fields.DB_INTERFACE_URL).find({"accountId":session.user.account},{sort: {order: 1}}).toArray(function (err, docs) {
            if (!err) {
                callback(null, docs || []);
            } else {
                callback(err);
            }
        });
    },
    delTABFields: function(data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_TAB_URL).remove(data, function(err, docs){
            if (!err) {
                result.success = true;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    editTABFields: function(data, session, callback) {
        var result = {success: false};
        var update = {
            $set: {
                name: data.name,
                url: data.url
            }
        };
        mongo.db().collection(fields.DB_TAB_URL).update({_id: data._id}, update, function (err) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error("", err);
            }
            callback(result);
        });
    },
    moveTABField: function(data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_TAB_URL).find({"accountId":session.user.account},{sort: {order: 1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                if(docs.length <= 1) {
                    result.success = false;
                    callback(result);
                    return;
                }
                var purObj;
                var curObj;
                for(var i=0;i<docs.length;i++){
                    if(docs[i]._id == data._id) {
                        curObj = docs[i];
                        if(data.moveup){
                            purObj = docs[i - 1];
                        } else {
                            purObj = docs[i + 1];
                        }
                        break;
                    }
                }
                if(purObj && curObj) {
                    mongo.db().collection(fields.DB_TAB_URL).update({_id: curObj._id}, {$set: {"order":purObj.order}}, function (err) {
                        if (!err) {
                            mongo.db().collection(fields.DB_TAB_URL).update({_id: purObj._id}, {$set: {"order":curObj.order}}, function (err1) {
                                if(!err1) {
                                    result.success = true;
                                }
                                callback(result);
                            })
                        } else {
                            logger.app.error("", err);
                            callback(result);
                        }
                    });
                } else {
                    callback(result);
                }
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    }
}

module.exports = TABHandler;