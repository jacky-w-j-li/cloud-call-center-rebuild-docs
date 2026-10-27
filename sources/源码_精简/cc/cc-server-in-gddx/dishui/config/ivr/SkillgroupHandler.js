var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var util = require('util');
var utils = require('appUtil/Utils');
var busUtil = require('appUtil/BusinessUtil');
var dateTimeUtil = require('appUtil/DateTime');
var uuid = require('appUtil/UUID');
var IvrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');

exports.getFreeQueueNo = function(data, session, callback){
    var result = {success: false};
    busUtil.getSkillGroupNum(function(err,num){
        if(!err){
            //console.log('skno====='+num);
            result.num = num;
            result.success = true;
            callback(result);
        }else{
            logger.app.error(err.stack);
            result.message = 'get free skillgroup num exception!';
            callback(result);
        }
    });
};

exports.updateIvrQueue = function(data, session, callback){
    var result = {success: false};
    if(data.Exten){
        exports.processIvrQueue(data, session, callback);
    }else{
        exports.getFreeQueueNo({}, session, function(numRes){
            if(numRes.success){
                data.Exten = numRes.num;
                exports.processIvrQueue(data, session, callback);
            }else{
                result.message = 'get free skillgroup num exception!';
                callback(result);
            }
        });
    }
};

exports.processIvrQueue = function(data, session, callback){
    var result = {success: false};
    var action = data.action;
    delete data['action'];

    if(action === 'add' || action === 'update'){
        data.SayExten = (data.SayExten=="false" || data.SayExten==false)?false:true;
        var memberArr = JSON.parse(data.MemberToken);
        delete data.MemberToken;
        var assignMember = [];
        for(var i= 0,len=memberArr.length;i<len;i++) {
            var m = memberArr[i];
            var token = m.split(':');
            assignMember.push({
                agentID: token[0],
                penalty: token[1]
            });
        }
        data.AssignMembers = assignMember;
        data.Members = memberArr.join(',');
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        if (!data.Music || data.Music === '') {
            delete data.Music;
        } else {
            data.Music = data.Music.split('.')[0];
        }
        if (!data.MusicClass ||data.MusicClass === '') {
            delete data.MusicClass;
        } else {
            data.MusicClass = data.MusicClass.split('.')[0];
        }
        //userData.UpdateUser = session.user._id;
        var ivrData = {
            nodeData : data,
            dbData : {
                tableName : fields.DB_MANAGER_IVR_SKILLGROUP,
                condition : {"Account" : data.Account , "Exten" : data.Exten}
            }
        }
        ivrData.nodeData.Action = 'PeerAdd';
        ivrData.nodeData.Peer = 'Queue';
        if(action === 'add'){
            ivrData.isAdd = true;
        }
        var relationArray = null;
        if(data.relationArray){
            relationArray = data.relationArray;
            delete data.relationArray;
        }
        IvrHandler.saveOrUpdateIvr(ivrData, session, function(err, ivrRes){
            if(!err){
                exports.useSkillGroupExten(data,function(res){
                    if(res.success){
                        //更新节点引用关系
                        nodeRelationHandler.updateNodeRelation(data,relationArray,function(relaRes){
                            utils.generateCacheVersion(session.account.account,"queue");
                            result.success = true;
                            result.data = data;
                            callback(result);
                        });
                    }else{
                        result.success = false;
                        result.message = res.message;
                        callback(result);
                    }
                })
            }else{
                result.success =  false;
                callback(result);
            }
        });
    }else{
        result.message = "no such action for processIvrQueue!";
        callback(result);
    }
};

exports.deleteQueue = function(data, session, callback){
    var result = {success:false};
    delete data.action;
    var ivrData = {
        nodeData : data,
        isStoreDB : false
    }
    ivrData.nodeData.Action = 'PeerRemove';
    ivrData.nodeData.Peer = 'ACSQueue';
    IvrHandler.saveOrUpdateIvr(ivrData, session, function(err, ivrREs){
        if(!err){
            var find = {"PBX":data.PBX  , "Account":data.Account ,
                "Exten":data.Exten , "_id":data._id};
            mongo.db().collection(fields.DB_MANAGER_IVR_SKILLGROUP).remove(find,function(dbErr,resData){
                if(!dbErr){
                    //清理此节点对其他节点的引用
                    nodeRelationHandler.afterDelNodeUpdateRelation(data,function(relaRes){
                        utils.generateCacheVersion(session.account.account,"queue");
                        result.success = true;
                        result.data = data;
                        callback(result);
                    });
                }else{
                    result.message = "delete Queue failed from DB!";
                    logger.app.error(dbErr.stack);
                    callback(result);
                }
            });
        }else{
            result.success =  false;
            result.message = "remove ivrQueue sync ACS failed!";
            logger.app.error(err.stack);
            callback(result);
            return;
        }
    });
}

exports.useSkillGroupExten = function(data,callback){
    var result ={success : false};
    var updateDoc = {"$set" : {
        "status":"using",
        "pbx": data.PBX,
        "account": data.Account,
        "product": "cc"
        }
    };
    mongo.db('bill').collection(fields.DB_PLATFORM_QUEUE).update({"_id":data.Exten},
        updateDoc , function (err, data) {
            if (err) {
                logger.app.error(err.stack);
                result.success = false;
                result.message = "using skillgroup exten for DB failure!";
            } else {
                result.success = true;
            }
            callback(result);
        }
    )
};
exports.queryIvrQueueList = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_MANAGER_IVR_SKILLGROUP).find(data).toArray(function(err,docList){
        if(!err){
            if(docList && docList.length>0){
                result.queueList = docList;
            }
            result.success = true;
            callback(result);
        }else{
            logger.app.error(err.stack);
            result.message = 'query queue list failed!';
            callback(result);
        }
    });
};
exports.queryIvrQueueByExten = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_MANAGER_IVR_SKILLGROUP).findOne(data,function(err,doc){
        if(!err){
            if(doc){
                result.queue = doc;
                //query all agent this account in the pbx.
                var findAgent = {};
                findAgent.accountId = data.Account;
                findAgent.sipConfigId = data.PBX;
                findAgent.product = 'cc';
                mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(findAgent).toArray(function (err,agentListDoc){
                    if(!err){
                        result.agentList = agentListDoc;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err.stack);
                        result.success = false;
                        result.message = 'query agents faild!';
                        callback(result);
                    }
                });
            }else{
                result.success = false;
                result.message = 'not find the queue';
                callback(result);
            }
        }else{
            logger.app.error(err.stack);
            result.message = 'query queue by exten failed!';
            callback(result);
        }
    });
};

exports.queryQueue = function(data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_MANAGER_IVR_SKILLGROUP).find(data, {sort:{Exten:-1}}).toArray(function(err, docs){
        if(err){
            logger.app.error(err.stack);
            result.message = "Query skillgroup failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.removeAgentFromQueues = function(data, session, callback) {
    var result = {success: false};
    removeQueueAgent(data, session, function(err) {
        if(err) {
            result.message = err.message;
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });
}

function removeQueueAgent(data, session, callback){
    var queue = data.queues.shift();
    if(queue) {
        var agents = queue.AssignMembers;
        var agent = null;
        var ind = -1;
        for(var i= 0,len=agents.length;i<len;i++) {
            agent = agents[i];
            if(agent.agentID == data.agentID) {
                ind = i;
                break;
            }
        }
        queue.AssignMembers.splice(ind, 1);
        queue.Members = memberArrToToken(queue.AssignMembers);
        if (!queue.Music || queue.Music === '') {
            delete queue.Music;
        }
        if (!queue.MusicClass ||queue.MusicClass === '') {
            delete queue.MusicClass;
        }
        var ivrData = {
            nodeData : queue,
            dbData : {
                tableName : fields.DB_MANAGER_IVR_SKILLGROUP,
                condition : {"Account" : queue.Account , "Exten" : queue.Exten}
            }
        }
        ivrData.nodeData.Action = 'PeerAdd';
        ivrData.nodeData.Peer = 'Queue';
        IvrHandler.saveOrUpdateIvr(ivrData, session, function(err, ivrRes){
            if(!err){
                logger.app.info('Removed queue member [' + data.agentID+ '] before remove agent.');
            } else {
                callback(new Error('Remove member from queue failure: ' + util.inspect(data)));
            }
            removeQueueAgent(data, session, callback);
        });
    } else {
        callback(null)
    }
}

function memberArrToToken(memberArr){
    var tokenArr = [];
    var member = null;
    for(var i= 0, len = memberArr.length;i<len;i++) {
        member = memberArr[i];
        tokenArr.push(member.agentID + ':' + member.penalty);
    }
    return tokenArr.join(',');
}