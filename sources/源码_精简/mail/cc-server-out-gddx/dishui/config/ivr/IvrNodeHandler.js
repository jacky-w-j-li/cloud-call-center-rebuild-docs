/**
 * Created with JetBrains WebStorm.
 * User: chenguang
 * Date: 13-7-31
 * Time: 上午11:30
 * To change this template use File | Settings | File Templates.
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var businessUtil = require('appUtil/BusinessUtil');
var objectUtil = require('appUtil/ObjectUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var ivrFlowHandler = require(__baseDir + '/dishui/config/ivr/IvrFlowHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.addOrUpdateIvr = function(data,session,callback){
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        TableName: fields.DB_IVR_NODE_IVR
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
            if(!data.IvrKey){
                data.IvrKey = extendata.doc.IvrKey;
            }
            if(!data.IvrKey) {
                delete data.IvrKey;
                data.IvrKeys = [];
            }
        }
        data.Action = "IVRAdd";
        data.RetryTime = "3";
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        data.UpdateUser = session.user._id;
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_IVR,
                condition: {
                    Account: data.Account,
                    PBX: data.PBX,
                    Exten: data.Exten
                }
            }
        }
        var currentId = null;
        if (data._id) {
            ivrData.dbData.condition._id = data._id;
            currentId = data._id;
            delete data._id;
        }
        ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
            if (err) {
                logger.app.error(err.stack);
                result.message = "Add or update ivr node failure:" + data.Exten;
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
            logger.app.info("ivr node add or update: [" + data.Exten + "] " + data.DisplayName);
            result.success = true;
            callback(result);
        });
    });
}

exports.delIvr = function (data,session,callback){
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        _id: data._id,
        TableName: fields.DB_IVR_NODE_IVR
    }
    ivrHandler.getIvrExten(extenParam,session,function(err,extendata){
        if(err){
            logger.app.info(err.stack);
            callback(result);
            return;
        }
        data.Exten = extendata.Exten;
        data.Action = "PeerRemove";
        data.Peer = "ivr";
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_IVR,
                condition: {
                    Account: data.Account,
                    PBX: data.PBX,
                    Exten: data.Exten
                }
            }
        }
        ivrHandler.deleteIvr(ivrData, session, function (res) {
            if (!res.success) {
                logger.app.error("delete ivr node failure:" + data.Exten);
                result.message = "delete ivr node failure:" + data.Exten;
                result.success = false;
                callback(result);
                return;
            }
            //清理此节点对其他节点的引用
            nodeRelationHandler.afterDelNodeUpdateRelation(data,function(relaRes){
                logger.app.info("ivr node delete: [" + data.Exten + "] " + data.DisplayName);
                result.success = true;
                result.data = data;
                callback(result);
            });
        });
    });
}

exports.queryIvrNode = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_IVR).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query ivr node failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.getIvrNodeIvrDic = function (session, callback){
    mongo.db().collection(fields.DB_IVR_NODE_IVR).find({Account:session.user.account}, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            callback(null, []);
        }else{
            var resultData = {};
            for(var i=0 ; i<docs.length ; i++){
                var exten = docs[i].Exten;
                resultData[exten] = {};
                if(docs[i].IvrKeys && docs[i].IvrKeys.length>0){
                    var ivrKeys = docs[i].IvrKeys;
                    for(var j=0 ; j<ivrKeys.length ; j++){
                        if(ivrKeys[j].KeyMemo){
                            resultData[exten][ivrKeys[j].Key] = ivrKeys[j].KeyMemo;
                        }
                    }
                }
            }
            callback(null, resultData || []);
        }
    });
}

exports.addOrUpdateIvrKey = function(data,session,callback){
    var result = {success: false};
    var findIvr = {_id:data._id};
    exports.queryIvrNode(findIvr,session,function(ivrRes){
        if(!ivrRes.success){
            callback(ivrRes);
            return;
        }
        var ivrVo = ivrRes.list[0];
        if(!data.IvrKeys) {
            ivrVo.IvrKeys = [];
        } else {
            ivrVo.IvrKeys = data.IvrKeys;
        }

        var IvrKeyStr = '';
        if(ivrVo.IvrKeys && ivrVo.IvrKeys.length>0){
            var ivrKey = null;
            for(var i= 0, len = ivrVo.IvrKeys.length; i<len ; i++){
                ivrKey = ivrVo.IvrKeys[i];
               IvrKeyStr += ivrKey.Key+"@"+ivrKey.ToPeer+",";
           }
        }
        ivrVo.IvrKey = IvrKeyStr;

        exports.addOrUpdateIvr(ivrVo,session,function(updateRes){
            if(!updateRes.success){
                logger.app.error('save ivr node failed!');
                result.success = false;
                callback(result);
            }
            result.data = updateRes.data;
            //更新节点引用关系
            nodeRelationHandler.updateNodeRelation(result.data,data.relationArray,function(relaRes){
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.delIvrKey = function(data,session,callback){
    var result = {success: false};
    var findIvr = {_id:data._id};
    exports.queryIvrNode(findIvr,session,function(ivrRes){
        var ivrVo = ivrRes.list[0];
        var IvrKeyStr = '';

        if(ivrVo.IvrKeys && ivrVo.IvrKeys.length>0){
            for(var i=0 ; i<ivrVo.IvrKeys.length ; i++){
                if(data.key === ivrVo.IvrKeys[i].Key){
                    ivrVo.IvrKeys.splice(i,1);
                }else{
                    IvrKeyStr += ivrVo.IvrKeys[i].Key+"@"+ivrVo.IvrKeys[i].ToPeer+",";
                }
            }
        }else{
            result.message = 'this key is not exits!';
            callback(result);
            return;
        }
        ivrVo.IvrKey = IvrKeyStr;
        exports.addOrUpdateIvr(ivrVo,session,function(updateRes){
            if(!updateRes.success){
                logger.app.error('save ivr node for delete ivr key failed!');
                callback(result);
            }
            //清理此节点对其他节点的引用
            nodeRelationHandler.afterDelNodeUpdateRelationForIvrKey(ivrVo,data.key,function(relaRes){
                logger.app.info("ivr node delete: [" + ivrVo.Exten + "] " + ivrVo.DisplayName);
                result.success = true;
                result.data = ivrVo;
                callback(result);
            });
        });
    });
}
