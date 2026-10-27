var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var objectUtil = require('appUtil/ObjectUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.queryIvrMenu = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_IVR_MENU).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query ivr menu node failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
};

exports.addOrUpdateIvrMenu = function(data, session, callback) {
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        TableName: fields.DB_IVR_NODE_IVR_MENU
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
        data.Peer = "IvrMenu";
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        //data.NotSynAcs = true;
        /*data.*/
        //console.log(data);
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_IVR_MENU
            }
        };
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

exports.getIvrMenuDic = function(session, callback){
    var result = {success: false};
    var query = {
        Account: session.user.account,
        PBX: session.user.pbx
    };
    mongo.db().collection(fields.DB_IVR_NODE_IVR_MENU).find(query).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};

/*exports.deleteIvrMenu = function(data, session, callback){
    var result= {success : false};
    data.Action = "PeerRemove";
    data.Peer = "ivrMenu";
    var ivrData = {
        nodeData: data,
        dbData: {
            tableName: fields.DB_IVR_NODE_IVR_MENU,
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
            result.message = "delete ivr_menu node failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
       *//* //清理此节点对其他节点的引用
        nodeRelationHandler.afterDelNodeUpdateRelation(data,function(relaRes){
            logger.app.info("ivr_menu node delete: [" + data.Exten + "] ");
            result.success = true;
            result.data = data;
            callback(result);
        });*//*
    });
};*/

exports.deleteIvrMenu = function(data,session,callback){
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        _id: data._id,
        TableName: fields.DB_IVR_NODE_IVR_MENU
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
            data.Peer = "ivr-menu";
            var ivrData = {
                nodeData: data,
                dbData: {
                    tableName: fields.DB_IVR_NODE_IVR_MENU
                }
            };
            ivrHandler.deleteIvr(ivrData, session, function (res) {
                if (!res.success) {
                    logger.app.error("delete ivr menu node failure:" + data.Exten);
                    result.message = "delete ivr menu node failure:" + data.Exten;
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
