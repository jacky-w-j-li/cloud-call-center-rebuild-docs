var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var fields = require(__baseDir + '/dishui/common/Fields');
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');

exports.queryAssignment = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_ASSIGNMENT).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query assignment failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.addOrUpdateAssignment = function (data, session, callback) {
    var result = {success: false};
    getAssignmentExten(data, function(err, extenData) {
        if (err) {
            callback(err);
            return;
        }

        data.Exten = extenData.Exten;
        data.UpdateTime = dateTimeUtil.getCurrentDate();

        if (!data._id) {
            data._id = uuid.generateRandomId();
        }
        var SetVar = '';
        if (data.VarConditions && data.VarConditions.length > 0){
            for (var i = 0; i < data.VarConditions.length; i++) {
                SetVar += data.VarConditions[i].VarName + '=' + data.VarConditions[i].VarValue + '&';
            }
        }
        var lastIndex = SetVar.lastIndexOf('&');
        if (lastIndex > -1) {
            SetVar = SetVar.substring(0, lastIndex) + SetVar.substring(lastIndex + 1, SetVar.length);
        }
        data.SetVar = SetVar;
        //account exten items nodeId nodeName PBX toPeer toPeerType
        data.Action = "AssignmentNodeAdd";
//        data.ToPeer = '';
//        data.ToPeerType = '';
//        data.VarId = '';
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_ASSIGNMENT,
                condition: {
                    Account: data.Account,
                    PBX: data.PBX,
                    Exten: data.Exten,
                    _id: data._id
                }
            }
        }
        ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
            if (err) {
                logger.app.error(err.stack);
                result.message = "Add or update assignment node failure:" + data.Exten;
                result.success = false;
                callback(result);
                return;
            }
            logger.app.info("Assignment node add or update: " + data.DisplayName);
            result.success = true;
            result.data = data;
            callback(result);
        });
    });
}

exports.deleteAssignment = function (data, session, callback) {
    var result = {success: false};
    data.Action = "PeerRemove";
    data.Peer = "assignment";
    var id = data['_id'];
    delete data['_id'];
    var ivrData = {
        nodeData: data,
        dbData: {
            tableName: fields.DB_IVR_NODE_ASSIGNMENT,
            condition: {
                Account: data.Account,
                PBX: data.PBX,
                Exten: data.Exten
            }
        }
    }
    ivrHandler.deleteIvr(ivrData, session, function(delRes){
        if (!delRes.success) {
            result.message = "delete assignment node failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        logger.app.info("Assignment node delete: [" + data.Exten + "] ");
        result.success = true;
        data._id = id;
        result.data = data;
        callback(result);
    });
}

function getAssignmentExten(data, callback) {
    if (data._id) {
        var queryData = {
            Account: data.Account,
            PBX: data.PBX,
            _id: data._id
        }
        mongo.db().collection(fields.DB_IVR_NODE_ASSIGNMENT).findOne(queryData, function (err, doc) {
            if (err) {
                logger.app.error(err.stack);
                callback(err);
                return;
            }
            if (!doc) {
                businessUtil.getIvrId(data.Account, function (err, IvrIdData) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, {Exten: IvrIdData.ivrId, isExists: false});
                });
            } else {
                callback(null, {Exten: doc.Exten, isExists: true});
            }
        });
    } else {
        businessUtil.getIvrId(data.Account, function (err, IvrIdData) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, {Exten: IvrIdData.ivrId, isExists: false});
        });
    }
}