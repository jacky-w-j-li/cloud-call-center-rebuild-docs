var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var businessUtil = require('appUtil/BusinessUtil');
var objectUtil = require('appUtil/ObjectUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.queryTextAnnouncement = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_TEXT_ANNOUNCEMENT).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query text announcement failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.addOrUpdateTextAnnouncement = function(data, session, callback) {
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        TableName: fields.DB_IVR_NODE_TEXT_ANNOUNCEMENT
    }
    if(data._id) {
        extenParam._id = data._id;
    }
    ivrHandler.getIvrExten(extenParam, session, function(err,extendata){
        if(err){
            result.message = 'Get text announcement node exten failure.';
            result.success = false;
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
        data.Peer = "textannouncement";
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        data.UpdateUser = session.user._id;
        data.IsMoney = data.IsMoney ? "1" : "0";
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_TEXT_ANNOUNCEMENT
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
                result.message = "Add or update text announcement node failure:" + data.Exten;
                result.success = false;
                callback(result);
                return;
            }
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

exports.deleteTextAnnouncement = function(data,session,callback){
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        _id: data._id,
        TableName: fields.DB_IVR_NODE_TEXT_ANNOUNCEMENT
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
            data.Peer = "textannouncement";
            var ivrData = {
                nodeData: data,
                dbData: {
                    tableName: fields.DB_IVR_NODE_TEXT_ANNOUNCEMENT,
                    condition: {
                        Account: data.Account,
                        PBX: data.PBX,
                        Exten: data.Exten
                    }
                }
            }
            ivrHandler.deleteIvr(ivrData, session, function (res) {
                if (!res.success) {
                    logger.app.error("delete text announcement node failure:" + data.Exten);
                    result.message = "delete text announcement node failure:" + data.Exten;
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