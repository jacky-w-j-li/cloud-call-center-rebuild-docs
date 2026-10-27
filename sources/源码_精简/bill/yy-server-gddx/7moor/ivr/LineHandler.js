var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + '/7moor/utils/Constants');
var logger = require('appLog');
var nodeUtil = require('util');
var ivrHandler = require(__baseDir + '/7moor/ivr/IvrHandler');
var dateTimeUtil = require('appUtil/DateTime');
var uuid = require('appUtil/UUID');

/**
 * Init account dialout line and transfer line.
 * If lines has init, ignore this process and return true
 * @param data
 * @param session
 * @param callback
 */
exports.initAccountLine = function(data, session, callback){
    var result = {success: false};
    result.list = [];
    var line = {
        "Account": data.Account,
        "Dialout": true,
        "PBX": data.PBX
    }
    initLine(line, session, function(dialoutLineInitRes){
        if (!dialoutLineInitRes.success) {
            callback(dialoutLineInitRes);
            return;
        }
        result.list.push(dialoutLineInitRes.data);
        line.Dialout = false;
        initLine(line, session, function(transferLineInitRes){
            if (!transferLineInitRes.success) {
                callback(transferLineInitRes);
                return;
            }
            result.success = true;
            result.list.push(transferLineInitRes.data);
            callback(result);
        });
    });
}

/**
 * Init account line
 * @param data
 * @param session
 * @param callback
 */
function initLine(data, session, callback){
    var result = {success: false};
    var queryLineData = {
        Account: data.Account,
        PBX: data.PBX,
        Dialout: data.Dialout
    }

    exports.queryAccountLine(queryLineData, session, function(queryRes){
        if (!queryRes.success) {
            callback(queryRes);
            return;
        }

        var lineType = data.Dialout ? 'dialout' : 'transfer';
        if (queryRes.list && queryRes.list.length > 0) {
            logger.app.info(data.Account + lineType + ' line has init, ignore this init process.');
            result.success = true;
            result.data = queryRes.list[0];
            callback(result);
            return;
        }

        queryLineData._id = uuid.generateUuid();
        exports.queryDefaultLine(data, session, function(queryDefalutLineResult){
            if (!queryDefalutLineResult.success) {
                callback(queryDefalutLineResult);
                return;
            }

            var line = queryDefalutLineResult.line;
            var accountLineData = {
                Account: data.Account,
                PBX: data.PBX,
                Exten: line._id,
                Dialout: data.Dialout
            }

            exports.saveLine(accountLineData, session, function(saveAccountLineResult) {
                if (!saveAccountLineResult) {

                }
            });
        });

    });
}

exports.queryAccountLine = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_ACCOUNT_LINE).find(data, {sort:{Dialout:-1}}).toArray(function (err, docs) {
        if (err) {
            result.success = false;
            result.message = 'Query line failure!';
            callback(result);
            return;
        }

        result.list = docs;
        result.success = true;
        callback(result);
    });
};

exports.queryDefaultLine = function (data, session, callback) {
    var result = {success: false};
    var defaultLineData = {
        isDefault : true
    }
    exports.queryLine(defaultLineData, session, function(defaultLineResult){
        if (!defaultLineResult.success) {
            callback(defaultLineResult);
            return;
        }

        if (defaultLineResult.list.length < 1) {
            result.message = 'Default line not found, set a line as default first!!!';
            logger.app.error(result.message);
            callback(result);
            return;
        }

        result.line = defaultLineResult.list[0];
        result.success = true;
        callback(result);
    });
};

exports.saveLine = function (data, session, callback) {
    var result = {success: false};
    //data.UpdateUser = session.user._id;
    mongo.db().collection(fields.DB_MANAGER_DIALOUT_LINE).findOne({_id: data.Exten}, function (err, lineDoc) {
        if (err) {
            callback(result);
            return;
        }
        data.Action = "DialLineAdd";
        data.Exten = lineDoc._id;
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        data.NeedPrefix = false;
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_ACCOUNT_LINE,
                condition: {"_id":data._id}
            }
        }
        ivrHandler.saveOrUpdateIvr(ivrData, session, function (err, doc) {
            if (err) {
                result.message = 'Synchronize account line to ACS failed: \n' + nodeUtil.inspect(data);
                logger.app.error(result.message, err);
                callback(result);
                return;
            }
            //reload ivr
            ivrHandler.reloadIvr(data, session, function (reloadRes) {
                if (reloadRes.success) {
                    result.success = true;
                    result.data = data;
                    callback(result);
                } else {
                    result.message = 'reload Ivr when save line failed!';
                    callback(result);
                }
            });
        });
    });
}
