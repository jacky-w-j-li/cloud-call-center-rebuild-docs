var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var utils = require('appUtil/Utils');
var datetime = require('appUtil/DateTime');
var billRequestHandler = require(__baseDir + '/dishui/common/billInterface/BillRequestHandler');

exports.addSmsTemplate = function (data, session, callback) {
    var result = {success: false};
    var leaveCountData = {};
    leaveCountData.accountId = data.accountId;
    var getSmsLeaveCountCallback = function(result, callbackData) {
        try {
            if(result.success) {
                var count = callbackData.smsLeaveCount;
                if(count > 0) {
                    var id = utils.UUID.generateUuid();
                    data._id = id;
                    data.status = fields.APP_SMS_COMMIT;
                    data.sendCount = utils.getSmsSendCount(data.content);
                    data.updateTime = datetime.getCurrentDateTime();
                    mongo.db().collection(fields.DB_C5_SMS).insert(data, function (err) {
                        try {
                            if (!err) {
                                var addSmsCallback = function(result) {
                                    var query = {
                                        _id: data._id
                                    };
                                    if(result.success) {
                                        mongo.db().collection(fields.DB_C5_SMS).update(query, {$set: {status: fields.APP_SMS_SUCCESS}}, function(err, result){
                                        });
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        mongo.db().collection(fields.DB_C5_SMS).update(query, {$set: {status: fields.APP_SMS_FAILED}}, function(err, result){
                                        });
                                        result.success = false;
                                        result.message = 'send to bill error!';
                                        callback(result);
                                    }
                                }
                                var addSmsData = {};
                                addSmsData.accountId = data.accountId;
                                addSmsData.content = data.content;
                                addSmsData.sendCount = data.sendCount;
                                addSmsData.sendType = "interface";
                                addSmsData.updateTime = data.updateTime;
                                addSmsData.channelType = "1";
                                addSmsData.smsId = data._id;
                                addSmsData.sendNum = data.number;
                                billRequestHandler.addSms(addSmsData, result, addSmsCallback);
                            } else {
                                result.success = false;
                                result.message = "db is wrong!";
                                callback(result);
                            }
                        } catch (e) {
                            result.success = false;
                            result.message = "error!";
                            callback(result);
                        }
                    });
                } else {
                    result.success = false;
                    result.message = "no money!";
                    callback(result);
                }
            } else {
                callback(result);
            }
        } catch (e) {
            result.success = false;
            result.message = "error!";
            callback(result);
        }
    }
    billRequestHandler.getSmsLeaveCount(data, result, getSmsLeaveCountCallback);
}

exports.smsRecordQuery = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.pageSize;
    delete  data['pageSize'];
    var page = data.page;
    delete  data['page'];
    pageSize = pageSize || 5;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var query = {};
    query.accountId = data.accountId;
    if(data.number != undefined && data.number != "") {
        var pattern = new RegExp("^.*"+data.number+".*$");
        query.number = pattern;
    }
    if(data.status != undefined && data.status != "") {
        query.status = data.status;
    }
    query.updateTime = {};
    if(data.startTime != undefined && data.startTime != "") {
        query.updateTime.$gte = data.startTime
    }
    if(data.endTime != undefined && data.endTime != "") {
        query.updateTime.$lte = data.endTime;
    }
    if(query.updateTime.$gte == undefined
        && query.updateTime.$lte == undefined) {
        delete query['updateTime'];
    }
    mongo.db().collection(fields.DB_C5_SMS).find(query, {limit: limit, skip: skip, sort: {updateTime: -1}}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_C5_SMS).count(query, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err.stack);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error(err.stack);
            callback({success: false, list: [], count: 0});
        }
    });
}
