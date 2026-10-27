var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var objectUtil = require('appUtil/ObjectUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.queryVoiceMail = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_VOICE_MAIL).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query voice mail node failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.addOrUpdateVoiceMail = function(data, session, callback) {
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        TableName: fields.DB_IVR_NODE_VOICE_MAIL
    }
    if(data._id) {
        extenParam._id = data._id;
    }
    ivrHandler.getIvrExten(extenParam,session,function(err,extendata){
        if(err){
            logger.app.info(err.stack);
            callback(result);
            return;
        }
        data.Exten = extendata.Exten;
        if (!extendata.isExists) {
            data._id = uuid.generateUuid();
        } else {
            data._id = extendata.doc._id;
        }
        data.Action = "PeerAdd";
        data.Peer = "voicemail";
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_VOICE_MAIL
            }
        }
        var currentId = data._id;
        var relationArray = null;
        if(data.relationArray){
            relationArray = data.relationArray;
            delete data['relationArray'];
        }
        ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
            if (err) {
                logger.app.error(err.stack);
                result.message = "Add or update validation node failure:" + data.Exten;
                result.success = false;
                callback(result);
                return;
            }
            data._id = currentId;
            if(extendata.isExists){
                result.data = objectUtil.mixin(extendata.doc,data);
            }else{
                result.data = data;
            }
            //更新节点引用关系
            nodeRelationHandler.updateNodeRelation(result.data,relationArray,function(relaRes){
                logger.app.info("ivr node add or update: [" + data.Exten + "] " + data.DisplayName);
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.deleteVoiceMail = function(data,session,callback){
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        _id: data._id,
        TableName: fields.DB_IVR_NODE_VOICE_MAIL
    }
    ivrHandler.getIvrExten(extenParam,session,function(err,extenData){
        if(err){
            logger.app.info(err.stack);
            callback(result);
            return;
        }
        if(extenData.isExists){
            data.Exten = extenData.Exten;
            data.Action = "PeerRemove";
            data.Peer = "voicemail";
            var ivrData = {
                nodeData: data,
                dbData: {
                    tableName: fields.DB_IVR_NODE_VOICE_MAIL
                }
            }
            ivrHandler.deleteIvr(ivrData, session, function (res) {
                if (!res.success) {
                    logger.app.error("delete voice mail node failure:" + data.Exten);
                    result.message = "delete voice mail node failure:" + data.Exten;
                    result.success = false;
                    callback(result);
                    return;
                }
                //清理此节点对其他节点的引用
                nodeRelationHandler.afterDelNodeUpdateRelation(extenData,function(relaRes){
                    logger.app.info("ivr node delete: [" + extenData.Exten + "] " + extenData.DisplayName);
                    result.success = true;
                    result.data = data;
                    callback(result);
                });
            });
        } else {
            logger.app.warn('Node not found.');
            result.success = true;
            result.data = data;
            callback(result);
        }
    });
}