/**
 * Created by Phil Guo on 2014-12-29.
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var objectUtil = require('appUtil/ObjectUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.queryEncryptMd5 = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_ENCRYPT_MD5).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query encrypt node failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        console.log(data);
        result.list = docs;
        result.success = true;
        callback(result);
    });
};

exports.addOrUpdateEncryptMd5 = function(data, session, callback) {
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        TableName: fields.DB_IVR_NODE_ENCRYPT_MD5
    };
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
        data.Peer = "encryptmd5";
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        //data.NotSynAcs = true;
        console.log(data);
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_ENCRYPT_MD5
            }
        };
        console.log(data);
        var currentId = data._id;

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
            result.success = true;
            callback(result);
        });
    });
};

exports.getEncryptMd5Dic = function(session, callback){
    var result = {success: false};
    var query = {
        Account: session.user.account,
        PBX: session.user.pbx
    };
    mongo.db().collection(fields.DB_IVR_NODE_ENCRYPT_MD5).find(query).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};

/*exports.deleteEncryptMd5 = function(data, session, callback){
 var result= {success : false};
 data.Action = "PeerRemove";
 data.Peer = "ivr-menu";
 var ivrData = {
 nodeData: data,
 dbData: {
 tableName: fields.DB_IVR_NODE_ENCRYPT_MD5,
 condition: {
 Account: data.Account,
 PBX: data.PBX,
 Exten: data.Exten
 }
 }
 };
 ivrHandler.deleteIvr(ivrData, session, function(delRes){
 if (!delRes.success) {
 logger.app.error(err.stack);
 result.message = "delete encrypt node failure:" + data.Exten;
 result.success = false;
 callback(result);
 return;
 }
 *//* //清理此节点对其他节点的引用
 nodeRelationHandler.afterDelNodeUpdateRelation(data,function(relaRes){
 logger.app.info("encrypt_md5 node delete: [" + data.Exten + "] ");
 result.success = true;
 result.data = data;
 callback(result);
 });*//*
 });
 };*/

exports.deleteEncryptMd5 = function(data,session,callback){
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        _id: data._id,
        TableName: fields.DB_IVR_NODE_ENCRYPT_MD5
    };
    ivrHandler.getIvrExten(extenParam,session,function(err,extenData){
        if(err){
            logger.app.info(err.stack);
            callback(result);
            return;
        }
        if(extenData.isExists){
            data.Exten = extenData.Exten;
            data.Action = "PeerRemove";
            data.Peer = "encryptmd5";
            var ivrData = {
                nodeData: data,
                dbData: {
                    tableName: fields.DB_IVR_NODE_ENCRYPT_MD5
                }
            };
            ivrHandler.deleteIvr(ivrData, session, function (res) {
                if (!res.success) {
                    logger.app.error("delete encrypt node failure:" + data.Exten);
                    result.message = "delete encrypt node failure:" + data.Exten;
                    result.success = false;
                    callback(result);
                    return;
                }
                result.data = data;
                result.success=true;
                callback(result);
            });
        } else {
            logger.app.warn('Node not found.');
            result.success = true;
            result.data = data;
            callback(result);
        }
    });
};
