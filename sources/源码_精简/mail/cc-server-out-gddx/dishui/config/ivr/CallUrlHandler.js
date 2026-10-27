var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var fields = require(__baseDir + '/dishui/common/Fields');
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.queryCallUrl = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_CALLURL).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query url failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.addOrUpdateCallUrl = function (data, session, callback) {
    var result = {success: false};
    getCallUrlExten(data, function(err, extenData) {
        if (err) {
            callback(err);
            return;
        }

        data.Exten = extenData.Exten;
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        if (!data._id) {
            data._id = uuid.generateRandomId();
        }
        data.Action = "PeerAdd";
        data.Peer = "callurl";
//        data.ToPeer = '';
//        data.ToPeerType = '';
//        data.ToPeerWhenTimeOut = '';
//        data.ToPeerTypeWhenTimeOut = '';
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_CALLURL,
                condition: {
                    Account: data.Account,
                    PBX: data.PBX,
                    Exten: data.Exten,
                    _id: data._id
                }
            }
        }
        var relationArray = null;
        if(data.relationArray){
            relationArray = data.relationArray;
            delete data.relationArray;
        }
        ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
            if (err) {
                logger.app.error(err.stack);
                result.message = "Add or update callurl node failure:" + data.Exten;
                result.success = false;
                callback(result);
                return;
            }
            //更新节点引用关系
            nodeRelationHandler.updateNodeRelation(data,relationArray,function(relaRes){
                logger.app.info("CallUrl node add or update: " + data.DisplayName);
                result.success = true;
                result.data = data;
                callback(result);
            });
        });
    });
}

exports.deleteCallUrl = function (data, session, callback) {
    var result = {success: false};
    data.Action = "PeerRemove";
    data.Peer = "callurl";
    var id = data['_id'];
    delete data['_id'];
    var ivrData = {
        nodeData: data,
        dbData: {
            tableName: fields.DB_IVR_NODE_CALLURL,
            condition: {
                Account: data.Account,
                PBX: data.PBX,
                Exten: data.Exten
            }
        }
    }
    ivrHandler.deleteIvr(ivrData, session, function(delRes){
        if (!delRes.success) {
            result.message = "delete callurl node failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        //清理此节点对其他节点的引用
        nodeRelationHandler.afterDelNodeUpdateRelation(data,function(relaRes){
            logger.app.info("callurl node delete: [" + data.Exten + "] ");
            data._id = id;
            result.data = data;
            result.success = true;
            callback(result);
        });
    });
}

function getCallUrlExten(data, callback) {
    if (data._id) {
        var queryData = {
            Account: data.Account,
            PBX: data.PBX,
            _id: data._id
        }
        mongo.db().collection(fields.DB_IVR_NODE_CALLURL).findOne(queryData, function (err, doc) {
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