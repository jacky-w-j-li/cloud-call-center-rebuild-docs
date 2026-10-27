/**
 * 处理业务相关的缓存，业务所有的缓存都集中在这个文件
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');

var businessDicHandler = {
    getBusinessStepDic: function (session, callback) {
        var result = [];
        var accountId = session.user.account;
        var condition = {account: accountId};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).find(condition).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var i = 0;
                var tempFun = function () {
                    if (i < docs.length) {
                        var doc = docs[i];
                        condition = {flow_id: doc._id};
                        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).find(condition).toArray(function (err, fields) {
                            if (!err) {
                                fields = fields || [];
                                result =  result.concat(fields);
                                i++;
                                tempFun();
                            } else {
                                callback(err);
                            }
                        });
                    } else {
                        callback(null, result);
                    }
                };
                tempFun();
            } else {
                callback(err);
            }
        });
    },
    getBusinessFieldDic: function (session, callback) {
        var result = [];
        var accountId = session.user.account;
        var condition = {account: accountId};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).find(condition).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var i = 0;
                var tempFun = function () {
                    if (i < docs.length) {
                        var doc = docs[i];
                        condition = {flow_id: doc._id};
                        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_FIELD).find(condition).toArray(function (err, fields) {
                            fields = fields || [];
                            result = result.concat(fields);
                            i++;
                            tempFun();
                        });
                    } else {
                        callback(null, result);
                    }
                }
                tempFun();
            } else {
                callback(err);
            }
        });
    },


    getBusinessDic: function (session, callback) {
        var result = [];
        var accountId = session.user.account;
        var condition = {account: accountId};
        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).find(condition).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var i = 0;
                var tempFun = function () {
                    if (i < docs.length) {
                        var doc = docs[i];
                        condition = {flow_id: doc._id};
                        mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).find(condition).toArray(function (err, queryDocs) {
                            if (!err) {
                                doc.steps = queryDocs;
                                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_FIELD).find(condition).toArray(function (err, fieldDocs) {
                                    if (!err) {
                                        doc.fields = fieldDocs;
                                        result.push(doc);
                                        i++;
                                        tempFun();
                                    } else {
                                        callback(err);
                                    }
                                });

                            } else {
                                callback(err);
                            }
                        });
                    } else {
                        callback(null, result);
                    }
                }
                tempFun();
            } else {
                callback(err);
            }
        });
    }

}


module.exports = businessDicHandler;