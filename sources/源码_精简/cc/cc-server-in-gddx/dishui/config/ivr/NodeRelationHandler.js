/**
 * Created with JetBrains WebStorm.
 * User: chenguang
 * Date: 13-8-6
 * Time: 下午5:46
 * To change this template use File | Settings | File Templates.
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');

exports.updateNodeRelation = function(data,relationArray,callback){
    var result = {success:false};
    if(relationArray && relationArray.length>0){
        var relation = relationArray.shift();
        var find = { Account : data.Account,
                     PBX : data.PBX,
                     ToPeerType : relation.ToPeerType,
                     ParentExten : data.Exten
                    }
        var doc = {
                    Account : data.Account,
                    PBX : data.PBX,
                    ToPeerType : relation.ToPeerType,
                    ChildExten : relation.Exten,
                    ParentExten : data.Exten
                }
        mongo.db().collection(fields.DB_IVR_NODE_RELATION).update(find,{"$set":doc},{upsert:true},function(err){
            if(err){
                logger.app.info("更新节点引用关系失败！ParentExten="+data.Exten);
                logger.app.error(err);
                callback(result);
                return;
            }
            if (relationArray.length > 0) {
                exports.updateNodeRelation(data, relationArray, callback);
            } else {
                result.success = true;
                callback(result);
            }
        });
    }else{
        result.success = true;
        callback(result);
    }
}

exports.proDelNodeCheckRelation = function(data,session,callback){
    var result = {success: false};
    var parentNodes = new Array();
    var parentFlows = new Array();
    mongo.db().collection(fields.DB_IVR_NODE_RELATION).find(data).toArray(function(err,docs){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        if(docs.length > 0){
            for(var i=0 ; i < docs.length ; i++){
                parentNodes.push(docs[i].ParentExten);
            }
            result.ParentNodes = parentNodes;
            result.isCanDel = false;
        }else{
            result.isCanDel = true;
        }
        //检查这个节点是否被流程做为了首节点
        var findFlow ={
            PBX : data.PBX,
            Account : data.Account,
            FirstNodeExten : data.ChildExten
        }
        mongo.db().collection(fields.DB_IVR_FLOW).find(findFlow).toArray(function(err,flowDocs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            if(flowDocs.length > 0){
                for(var i=0 ; i < flowDocs.length ; i++){
                    parentFlows.push(flowDocs[i].FlowName);
                }
                result.ParentFlows = parentFlows;
                result.isCanDel = false;
                callback(result);
            }else{
                callback(result);
            }
        });
    })
}

exports.afterDelNodeUpdateRelation = function(data,callback){
    var result = {success: false};
    var find = {
            Account : data.Account,
            PBX : data.PBX,
            ParentExten : data.Exten
    }
    mongo.db().collection(fields.DB_IVR_NODE_RELATION).remove(find,function(err){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    })
}

exports.afterDelNodeUpdateRelationForIvrKey = function(ivr,key,callback){
    var result = {success: false};
    var find = {
        Account : ivr.Account,
        PBX : ivr.PBX,
        ParentExten : ivr.Exten,
        ToPeerType : key+"ToPeer"
    }
    mongo.db().collection(fields.DB_IVR_NODE_RELATION).remove(find,function(err){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    })
}