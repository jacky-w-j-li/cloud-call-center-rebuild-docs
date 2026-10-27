var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var businessUtil = require('appUtil/BusinessUtil');
var fields = require(__baseDir + '/dishui/common/Fields');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');

exports.queryExtensionPeer = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_EXTENSION_PEER).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query announcement failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.addOrUpdateExtensionPeer = function (data, session, callback) {
    var result = {success: false};
    getExtensionPeerExten(data, function(err, extenData) {
        if (err) {
            callback(err);
            return;
        }

        data.Exten = extenData.Exten;
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        if (!data._id) {
            data._id = uuid.generateRandomId();
            data.DialPlan = getNodeContent(data);
        }
        data.Action = "PeerAdd";
        data.Peer = "ExtensionPeer";
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_EXTENSION_PEER,
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
                result.message = "Add or update extensionpeer node failure:" + data.Exten;
                result.success = false;
                callback(result);
                return;
            }
            logger.app.info("extensionpeer node add or update: " + data.DisplayName);
            result.success = true;
            result.data = data;
            callback(result);
        });
    });
}

exports.deleteExtensionPeer = function (data, session, callback) {
    var result = {success: false};
    data.Action = "PeerRemove";
    data.Peer = "ExtensionPeer";
    var id = data._id;
    delete data['_id'];
    var ivrData = {
        nodeData: data,
        dbData: {
            tableName: fields.DB_IVR_NODE_EXTENSION_PEER,
            condition: {
                Account: data.Account,
                PBX: data.PBX,
                Exten: data.Exten
            }
        }
    }
    ivrHandler.deleteIvr(ivrData, session, function(delRes){
        if (!delRes.success) {
            result.message = "delete extensionpeer node failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        logger.app.info("extensionpeer node delete: [" + data.Exten + "] ");
        data._id = id;
        result.data = data;
        result.success = true;
        callback(result);
    });
}

function getExtensionPeerExten(data, callback) {
    if (data._id) {
        var queryData = {
            Account: data.Account,
            PBX: data.PBX,
            _id: data._id
        }
        mongo.db().collection(fields.DB_IVR_NODE_EXTENSION_PEER).findOne(queryData, function (err, doc) {
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

function getNodeContent(data) {
    var initContent = '';
    initContent = "context " + data.Account + "-" + data.Exten + "-ExtensionPeer {\r\n\t" +
        "s => {\r\n\t\tHangup;\r\n\t}\r\n}";
    return initContent;
}

