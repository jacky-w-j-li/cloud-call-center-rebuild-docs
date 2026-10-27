/**
 * Created by zengyx on 16/5/9.
 */

var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require('../common/Fields');
var config = require('../serverConfig.json');
var Thenjs = require("thenjs");

//exports.emailAssginByRound = function(data, callback){
//    test(data, callback);
//
//}
//
//function test(data, callback){
//    var result = {success: false};
//    var onlineAgents = data.onlineAgents;
//    var EmailCurrentVersion = Math.random()+"_"+utils.getCurrentDateTime();
//    Thenjs(function (cont) {
//        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: data.peer}, cont);
//    }).then(function (cont, queue) {
//        if (queue) {
//            var agents = queue.EmailAssignMembers || queue.AssignMembers;   //邮件分配座席
//            if(agents.length > 0){
//                var agentIds = [];
//                for(var i=0; i< agents.length; i++){
//                    agentIds.push(agents[i].agentID);
//                }
//                //cont(null, agents, data.onlineAgents);
//                mongo.db().collection(fields.DB_APP_PUSH_CLIENT).find({_id: {$in: agentIds}}).toArray(function(err, agentClients){
//                    var onlineAgents = {};
//                    for(var i=0; i<agentClients.length; i++){
//                        onlineAgents[agentClients[i]._id] = agentClients[i];
//                    }
//                    var currentAgentIndex = queue.CurrentEmailAssignAgentIndex;
//                    var emailLastVersion = queue.EmailCurrentVersion;
//                    if(currentAgentIndex == undefined) currentAgentIndex = -1;
//                    if(currentAgentIndex == agents.length){
//                        currentAgentIndex = 0;
//                    }
//                    if(currentAgentIndex <-1){
//                        currentAgentIndex =-1;
//                    }
//                    var temp = currentAgentIndex;
//
//                    while (true) {
//                        currentAgentIndex = (currentAgentIndex +1) % agents.length;
//                        var currentAgentId = agents[currentAgentIndex].agentID;
//                        if (onlineAgents[currentAgentId]) {
//                            mongo.db().collection(fields.DB_APP_MAIL_QUEUE).updateOne(
//                                {
//                                    Exten: data.peer,
//                                    Account: data.account,
//                                    EmailCurrentVersion: emailLastVersion
//                                },{
//                                    $set: {
//                                        EmailCurrentVersion: EmailCurrentVersion,
//                                        CurrentEmailAssignAgentIndex: currentAgentIndex
//                                    }
//                                }
//                                ,
//                                function (err, doc) {
//                                    if(err){
//                                        callback(result);
//                                        return;
//                                    }
//                                    if (doc.result.nModified ==1) {
//                                        result.success = true;
//                                        result.agent = currentAgentId;
//                                        callback(result);
//                                        return;
//                                    }else{
//                                        test(data, callback);
//                                    }
//                                });
//
//                            break;
//                        }
//                        if(temp == currentAgentIndex){
//                            callback(result);
//                            break;
//                        }
//                        if(temp == -1 && currentAgentIndex == agents.length-1) {
//                            callback(result);
//                            break;
//                        }
//                    }
//                });
//            }
//
//
//
//        } else {
//            cont("not found peer queue " + data.peer,1);
//        }
//    }).fail(function (cont, err) {
//        logger.app.error(err);
//        result.message = err;
//        callback(result);
//
//    });
//}

/**
 * 轮询分配
 * @param data
 * @param callback
 */
exports.emailAssginByRound = function (data, callback) {
    var peerQueue = reqCallbacks[data.peer];
    if (peerQueue && peerQueue.queue) {
        peerQueue.queue.push({data: data, callback: callback});
    } else {
        reqCallbacks[data.peer] = {queue: [{data: data, callback: callback}], flag: 0};
    }
    for (var peer in reqCallbacks) {
        var reqs = reqCallbacks[peer];
        if (reqs.queue.length == 0 && reqs.flag == 0) {
            delete reqCallbacks[peer];
        } else {
            exports.processAssign(reqs, data.peer);
        }

    }
}
exports.processAssign = function (reqs, peer, errorFlag) {
    var reqQueue = reqs.queue;
    if (reqQueue.length > 0) {
        if (reqs.flag == 0) {
            reqs.flag = 1;
            var result = {success: false};
            var req = reqQueue.shift();
            var data = req.data;
            var callback = req.callback;
            if (errorFlag == 1) {
                callback(result);
                exports.processAssign(reqs, peer, errorFlag);
                return;
            }
            Thenjs(function (cont) {
                mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: data.peer}, cont);
            }).then(function (cont, queue) {
                if (queue) {
                    var agents = queue.EmailAssignMembers || queue.AssignMembers;   //邮件分配座席

                    console.log(agents);
                    if (agents.length > 0) {
                        var agentIds = [];
                        for (var i = 0; i < agents.length; i++) {
                            agentIds.push(agents[i].agentID);
                        }
                        console.log(agentIds);
                        mongo.db().collection(fields.DB_APP_PUSH_CLIENT).find({_id: {$in: agentIds}}).toArray(function (err, agentClients) {
                            var onlineAgents = {};
                            for (var i = 0; i < agentClients.length; i++) {
                                onlineAgents[agentClients[i]._id] = agentClients[i];
                            }
                            cont(err, agents, onlineAgents);
                        });
                    } else {
                        cont("not found peer agents");
                    }
                } else {
                    cont("not found peer queue " + data.peer);
                }
            }).then(function (cont, agents, onlineAgents) {
                if (agents.length > 0) {
                    var resultQueue = [];
                    var resultAgent = "";
                    console.log(onlineAgents);
                    if (onlineAgents) {
                        while (agents.length > 0) {
                            var agent = agents.shift();
                            var onlineAgent = onlineAgents[agent.agentID];

                            //在线,打开领取开光,并且当前处理的数量小于最大接待数
                            if (onlineAgent && onlineAgent.emailStatus == "open" && onlineAgent.currDealEmailNum < onlineAgent.maxEmailDealCount) {
                                resultAgent = agent.agentID;
                                resultQueue.push(agent);
                                break;
                            }
                            resultQueue.push(agent);
                        }
                        var resultAgents = agents.concat(resultQueue);
                        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).update({
                            Exten: data.peer
                        }, {$set: {EmailAssignMembers: resultAgents}}, {w: 1}, function (err) {
                            if(resultAgent){
                                mongo.db().collection(fields.DB_APP_PUSH_CLIENT).update({_id: resultAgent},{$inc:{currDealEmailNum:1}},function(err){
                                    result.agent = resultAgent;
                                    result.success = true;
                                    callback(result);
                                    reqs.flag = 0;
                                    exports.processAssign(reqs, peer);
                                });
                            }else{
                                result.agent = resultAgent;
                                result.success = true;
                                callback(result);
                                reqs.flag = 0;
                                exports.processAssign(reqs, peer);
                            }

                        });
                    } else {
                        cont("not found login agent", 1);
                    }
                } else {
                    cont("not found peer agents", 1);
                }

            }).fail(function (cont, err, flag) {
                logger.app.error(err);
                result.message = err;
                callback(result);
                reqs.flag = 0;
                exports.processAssign(reqs, peer, flag);
            });

        }
    } else {
        if (reqs.flag == 0) {
            delete reqCallbacks[peer];
        }
    }

}


//exports.emailAssginByRound2 = function(data, callback){
//    sessionCallback.push({data:data, callback:callback});
//    exports.processAssign2();
//}
//
//exports.processAssign2 = function(){
//    while(sessionCallback.length > 0 && flag == 0){
//        flag = 1;
//        var result = {success: false};
//        var session = sessionCallback.shift();
//        var data = session.data;
//        var callback = session.callback;
//
//        Thenjs(function(cont){
//            mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: data.peer}, cont);
//
//        }).then(function(cont, queue){
//            if(queue){
//                var agents = queue.AssignMembers;   //邮件分配座席
//                if(agents.length>0){
//                    var agentIds = [];
//                    for(var i=0; i< agents.length; i++){
//                        agentIds.push(agents[i].agentID);
//                    }
//                    cont(null, agents, data.onlineAgents);
//                    //mongo.db().collection(fields.DB_APP_PUSH_CLIENT).find({_id: {$in: agentIds}}).toArray(function(err, agentClients){
//                    //    var onlineAgents = {};
//                    //    for(var i=0; i<agentClients.length; i++){
//                    //        onlineAgents[agentClients[i]._id] = agentClients[i];
//                    //    }
//                    //    cont(err, agents, onlineAgents);
//                    //});
//                }else{
//                    cont("not found peer agents");
//                }
//            }else{
//                cont("not found peer queue " + data.peer);
//            }
//        }).then(function(cont, agents, onlineAgents){
//            var resultQueue = [];
//            var resultAgent = "";
//            if(onlineAgents){
//                while(agents.length > 0){
//                    var agent = agents.shift();
//                    if(onlineAgents[agent.agentID]){
//                        resultAgent = agent.agentID;
//                        resultQueue.push(agent);
//                        break;
//                    }
//                    resultQueue.push(agent);
//                }
//                var resultAgents = agents.concat(resultQueue);
//                mongo.db().collection(fields.DB_APP_MAIL_QUEUE).update({Exten:data.peer, Account: data.account},{$set:{EmailAssignMembers: resultAgents}},{w:1},function(err){
//                    result.agent = resultAgent;
//                    result.success = true;
//                    callback(result);
//                    flag = 0;
//                    exports.processAssign2();
//                });
//
//
//            }else{
//                cont("not found login agent");
//            }
//
//        }).fail(function(cont,err){
//            logger.app.error(err);
//            result.message = err;
//            callback(result);
//            flag = 0;
//            exports.processAssign2();
//        });
//
//
//    }
//
//}


exports.emailAssginByLeast = function (data, callback) {

}