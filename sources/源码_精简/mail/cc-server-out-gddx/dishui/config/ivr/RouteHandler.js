var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var objectUtil = require('appUtil/ObjectUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.addOrUpdateRoute = function(data,session,callback){
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        TableName: fields.DB_IVR_NODE_ROUTE
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
        data.Action = "DynamicRouteNodeAdd";
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        //data.UpdateUser = session.user._id;
        var ruleVO = generateRouteRulesArry(data);
        data.RouteRules = ruleVO.RouteRules;
        data.Conjunctions = ruleVO.Conjunctions;
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_ROUTE,
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

exports.queryRoute = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_ROUTE).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query route node failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.delRoute = function(data,session,callback){
    var result = {success:false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX,
        _id: data._id,
        TableName: fields.DB_IVR_NODE_ROUTE
    }
    ivrHandler.getIvrExten(extenParam,session,function(err,extendata){
        if(err){
            logger.app.info(err.stack);
            callback(result);
            return;
        }
        data.Exten = extendata.Exten;
        data.Action = "PeerRemove";
        data.Peer = "dynamic-route";
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_IVR_NODE_ROUTE,
                condition: {
                    Account: data.Account,
                    PBX: data.PBX,
                    Exten: data.Exten
                }
            }
        }
        ivrHandler.deleteIvr(ivrData, session, function (res) {
            if (!res.success) {
                logger.app.error("delete route node failure:" + data.Exten);
                result.message = "delete route node failure:" + data.Exten;
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

function generateRouteRulesArry(data){
    var route = null;
    var ruleStr = '';
    var conjunctions = '';
    if (data.Routes && data.Routes.length > 0){
        ruleStr = '0&'+data.ToPeer;
        for(var j= 0, len = data.Routes.length; j < len;j++){
            route = data.Routes[j];
            ruleStr += '&'+route.VarName+':'+route.Operation+':'+route.Value;

            if (j != len -1){
                conjunctions += route.Logic + '&';
            }
        }
        conjunctions = conjunctions.substring(0, conjunctions.length -1);
    } else {
        data.Routes = [];
    }
    return {"RouteRules": ruleStr , "Conjunctions": conjunctions};
}