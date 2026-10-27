var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.querySuperDialJobNum = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_SUPERDIALJOBNUM).find(data).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query superDialJobNum failure: " + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.addOrUpdateSuperDialJobNum = function (data, session, callback) {
    var result = {success: false};
    getSuperDialJobNum(data, function(err, extenData) {
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
        data.Peer = "SuperDialJobNum";
        data.ToPeer = data.ToPeerWhenEmpnoNotExist;
        data.AgentBusyToPeer = data.ToPeerWhenEmpnoAgentBusy;
        data.LogoffToPeer = data.ToPeerWhenEmpnoLogoff;
        data.FrontOfficeToPeer = data.ToPeerWhenFrontOffice;
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_SUPERDIALJOBNUM
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
                result.message = "Add or update SuperDialJobNum node failure:" + data.Exten;
                result.success = false;
                callback(result);
                return;
            }
            //更新节点引用关系
            nodeRelationHandler.updateNodeRelation(data,relationArray,function(relaRes){
                logger.app.info("SuperDialJobNum node add or update: " + data.DisplayName);
                result.success = true;
                result.data = data;
                callback(result);
            });
        });
    });
}

exports.deleteSuperDialJobNum = function(data, session, callback){
    var result= {success : false};
    data.Action = "PeerRemove";
    data.Peer = "superDialJobNum";
    var ivrData = {
        nodeData: data,
        dbData: {
            tableName: fields.DB_IVR_NODE_SUPERDIALJOBNUM,
            condition: {
                Account: data.Account,
                PBX: data.PBX,
                Exten: data.Exten
            }
        }
    }
    ivrHandler.deleteIvr(ivrData, session, function(delRes){
        if (!delRes.success) {
            logger.app.error(err.stack);
            result.message = "delete SuperDialJobNum node failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        //清理此节点对其他节点的引用
        nodeRelationHandler.afterDelNodeUpdateRelation(data,function(relaRes){
            logger.app.info("SuperDialJobNum node delete: [" + data.Exten + "] ");
            result.success = true;
            result.data = data;
            callback(result);
        });
    });
}

function getSuperDialJobNum(data, callback) {
    if (data._id) {
        var queryData = {
            Account: data.Account,
            PBX: data.PBX,
            _id: data._id
        }
        mongo.db().collection(fields.DB_IVR_NODE_SUPERDIALJOBNUM).findOne(queryData, function (err, doc) {
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