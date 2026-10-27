var mongo = require('appDb/MongoDb');
var logger = require('appLog');
var utils = require('appUtil/Utils');
var httpProvider = require("appHttp");
exports.queryMyCallBill = function (data, session, callback) {
    var result = { success: false};
    var sort = {createTime: -1};
    var begin = 0;
    var pageSize = 10;
    if (data.pageSize) {
        pageSize = parseInt(data.pageSize);
    }

    if (data.beginTime || data.endTime) {
        data.createTime = {};
        if (data.beginTime) {
            data.createTime["$gte"] = data.beginTime;
            delete data.beginTime;
        }
        if (data.endTime) {
            data.createTime["$lte"] = data.endTime;
            delete data.endTime;
        }
    }

    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
//    data.owner = session.user._id;
    delete data.page;
    delete data.pageSize;
    mongo.db(session).collection(session.account.account + '_call_record').find(data, {sort: sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        mongo.db(session).collection(session.account.account + '_call_record').count(data, function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            result.count = docCount;
            callback(result);
        });
    });
}

exports.downloadRecord = function (data, session, callback) {
    var result = { success: false};
    var countLimit = data.countLimit || 1000;
    delete data.countLimit;
    if (data.beginTime || data.endTime) {
        data.createTime = {};
        if (data.beginTime) {
            data.createTime["$gte"] = data.beginTime;
            delete data.beginTime;
        }
        if (data.endTime) {
            data.createTime["$lte"] = data.endTime;
            delete data.endTime;
        }
    }
    mongo.db(session).collection(session.account.account + '_call_record').count(data, function (err, docCount) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }

        if (docCount > countLimit) {
            result.message = "001";
            result.count = docCount;
            callback(result);
            return;
        }

        mongo.db(session).collection(session.account.account + '_call_record').find(data).toArray(function (err, callRecords) {
            if (err) {
                logger.app.error("found call_record error!", err);
                result.message = "002";
                callback(result);
                return;
            }
            callRecords = callRecords || [];

            mongo.db().collection("app_account").findOne({_id: session.account.account}, function (err, dbAccount) {
                if (err) {
                    callback(result);
                    return;
                }
                dbAccount = dbAccount || {};
                var pbxId = dbAccount.pbx.PBX;
                mongo.db().collection("app_pbx").findOne({_id: pbxId}, function (err, dbPbx) {
                    if (err) {
                        callback(result);
                        return;
                    }
                    dbPbx = dbPbx || {};
                    var acsCommand = {
                        Command: "Action",
                        Action: "DownloadRecorderZip",
                        ActionID: utils.UUID.generateUuid(),
                        PBX : pbxId,
                        Account : session.account.account
                    };
                    var records = [];
                    for (var i = 0; i < callRecords.length; i++) {
                        var obj = callRecords[i];
                        if(obj.recordAddr && obj.recordAddr.indexOf("/monitor/") != -1){
                            var index = obj.recordAddr.indexOf("/monitor/");
                            records.push(obj.recordAddr.substring(index+8));
                        }
                    }
                    acsCommand.records = records;
                    var acsUrl = dbPbx.configAddr || "";

                    httpProvider.sendPost(acsUrl,acsCommand,function(err,acsResult){
                        if(err){
                            logger.app.error("request acs server error!",err);
                            callback(result);
                        } else {
                            acsResult = acsResult + "";
                            var resultObj = JSON.parse(acsResult);

                            if(resultObj && resultObj.Succeed){
                                result.success = true;
                                result.path = resultObj.url;
                                callback(result);
                            } else {
                                result.message = "003";
                                callback(result);
                            }
                        }
                    });

                });

            });


        });


    });

}