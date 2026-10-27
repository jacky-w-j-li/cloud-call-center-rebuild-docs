var logger = require("appLog");
var fields = require(__baseDir + '/dishui/common/Fields');
var http = require('appHttp');
var config = require('appConfig').conf;
var userHandler = require(__baseDir + '/dishui/app/user/UserHandler');
var utils = require('appUtil/Utils');
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var custHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');
var mongo = require('appDb/MongoDb');

exports.exportXls = function(data, session, callback){
    var query =data.Query;
    var menu = query.menu;
    var method=data.Method;
    if(!query.accountId){
        query.accountId=session.user.account;
    }

    var findAgent = {
        account: session.user.account
    }
    userHandler.queryUser(findAgent, session, function(userRes) {
        if (!userRes.success) {
            callback(userRes);
            return;
        }

        if(method=="exportCustomer"){
            utils.setUserLevelCondition(query,"owner",'customer',session);
        }else if(method=="exportAccountInfo"){

        }else if(method=="exportCustomer2In"){
            data.Method="exportCustomer";
            method="exportCustomer";
            var dbType = query.dbType;
            custHandler.setExportQueryPageCondition(query,session);
            query.dbType = dbType;
        }else if(method=="exportCdr"){
            utils.setUserLevelCondition(query,"DISPOSAL_AGENT",'call',session,true);
            //if(query.DISPOSAL_AGENT && query.DISPOSAL_AGENT['$in']){
            //    query.DISPOSAL_AGENT['$in'].push(null);
            //}
        }else if(method=="exportAgent" || method=="exportApproveSurveyReport" || method == "exportImAgent" || method == "exportImCSR"){//云客服的分开写
            if("selectedAgentList" in query && query.selectedAgentList != ""){
                var agents = query.selectedAgentList.split(',');

                if(query.includeSubordinate){
                    var agentChooseList = query.selectedAgentList.split(',');
                    var agentList = userRes.list;

                    for(var i=0 ;i<agentChooseList.length;i++){
                        var agent_id = agentChooseList[i];
                        utils.getLowUserArrayByParentId(agent_id,agentList,agents);
                    }
                }

                if(session.user.type == "admin" || session.user.scope.call == fields.data_scope_all){
                    query.AgentID = {'$in' : agents};
                }else{
                    var lowUsers = session.user.moduleUsers.call||[];
                    if(lowUsers && lowUsers.length >0){
                        var inAgents = [];
                        for(var i=0 ;i<agents.length;i++){
                            for(var j=0;j<lowUsers.length;j++){
                                if(lowUsers[j] == agents[i]){
                                    inAgents.push(agents[i]);
                                }
                            }
                        }
                        query.AgentID = {'$in' : inAgents};
                    }
                }
            }else{
                    utils.setUserLevelCondition(query,'AgentID','call',session);
            }
            if(query.AgentID == ''){
                delete  query.AgentID;
            }
        }else if(method=="exportCdrPeer" || method=="exportCdrPeerDetail"){
            utils.setUserLevelCondition(query,"AGENT",'call',session);
        }else if(method=="exportCustomerCommon"){
            if(query.selectedPoolList && query.selectedPoolList!=""){
                var pools = query.selectedPoolList.split(',');
                query.categoryId = {'$in':pools};
            }
        }else if(method=="exportCustomerSaleAgent"||method=="exportCustomerCommonAgent"){
            if(query.selectedAgentList && query.selectedAgentList != ""){
                var agents = query.selectedAgentList.split(',');

                if(query.includeSubordinate){
                    var agentChooseList = query.selectedAgentList.split(',');
                    var agentList = userRes.list;

                    for(var i=0 ;i<agentChooseList.length;i++){
                        var agent_id = agentChooseList[i];
                        utils.getLowUserArrayByParentId(agent_id,agentList,agents);
                    }
                }

                if(session.user.type == "admin" || session.user.scope.customer == fields.data_scope_all){
                    query.user = {'$in' : agents};
                }else{
                    var lowUsers = session.user.moduleUsers.customer||[];
                    if(lowUsers && lowUsers.length >0){
                        var inAgents = [];
                        for(var i=0 ;i<agents.length;i++){
                            for(var j=0;j<lowUsers.length;j++){
                                if(lowUsers[j] == agents[i]){
                                    inAgents.push(agents[i]);
                                }
                            }
                        }
                        query.user = {'$in' : inAgents};
                    }
                }
            }else{
                utils.setUserLevelCondition(query,'user','customer',session);
            }
        }else if(method=="exportCustomerStatus"){
            utils.setUserLevelCondition2Other(query,'user','customer',session);
        }else if(method=="exportBusinessAgent"){
            if(query.selectedAgentList && query.selectedAgentList != ""){
                var agents = query.selectedAgentList.split(',');

                if(session.user.type == "admin" || session.user.scope.business == fields.data_scope_all){
                    query.agent = {'$in' : agents};
                }else{
                    var lowUsers = session.user.moduleUsers.business||[];
                    if(lowUsers && lowUsers.length >0){
                        var inAgents = [];
                        for(var i=0 ;i<agents.length;i++){
                            for(var j=0;j<lowUsers.length;j++){
                                if(lowUsers[j] == agents[i]){
                                    inAgents.push(agents[i]);
                                    break;
                                }
                            }
                        }
                        query.agent = {'$in' : inAgents};
                    }
                }
            }else{
                utils.setUserLevelCondition(query,'agent','business',session);
            }
        }
        if(method == "exportImAgent" && query.AgentID){
            query.agentId = query.AgentID;
            delete query.AgentID;
        }
        if(method == "exportImCSR" && query.AgentID){
            query.agentId = query.AgentID;
            delete query.AgentID;
        }
        var sendExport=function(){
            var queryJson=JSON.stringify(query);
            queryJson=queryJson.replace(/&/gm, "amp;");
            var url = config.ccServiceUrl+'?Action=export&Method='+method+'&Query=' + queryJson;

            url=encodeURI(url);
            http.sendGet(url,function(err,res){
                if(!err && res){
                    try{
                        var res = JSON.parse(res);

                        if(res.Succeed){
                            callback(res);
                        }else{
                            callback(new Error('request service error!'));
                        }
                    }catch (e) {
                        logger.request.error(e);
                        callback(e);
                    }
                }else{
                    var error = err || new Error('request service error!');
                    logger.request.error(error);
                    callback(error);
                }
            });
        }

        if(method=="exportCustomer"){
            if(query.combox||query.name){
                solrHandler.queryIndex2Cust(query,session,function(rep){
                    if(rep.success){
                        delete query.combox;
                        delete query.name;
                        var ids=rep.ids;
                        query._id={$in:ids};
                        console.info("solr =========")
                        sendExport();
                    }else{
                        logger.app.error("query solr index error");
                        callback({success: false});
                    }
                });
            }else{
                sendExport();
            }
        }else{
            sendExport();
        }

    });
}


exports.exportMoreXls = function(data, session, callback){
    var result = {success: false};
    var query =data.Query;
    var method=data.Method;
    var aid=session.user.account;
    var uid=session.user._id;
    if(!query.accountId){
        query.accountId=aid;
    }
    if(method=="exportCustomer"){
        var dbType = query.dbType;
        custHandler.setExportQueryPageCondition(query,session);
        query.dbType = dbType;
    }
    var sendExport=function(){
        var queryJson=JSON.stringify(query);
        var id=utils.UUID.generateUuid();
        var time=utils.getCurrentDate();
        var dbObj={};
        dbObj._id=id;
        dbObj.createTime= time;
        dbObj.creator =uid ;
        dbObj.accountId=aid;
        dbObj.flag="start";
        dbObj.type="customer";
        dbObj.query=queryJson;
        mongo.db().collection(fields.DB_CUSTOMER_EXPTASK).insert(dbObj,{w:1},function(err){
            if (!err) {
                result.success = true;
            } else {
                logger.app.error(err);
            }
            callback(result);
        })
    }

    if(method=="exportCustomer"){
        if(query.combox||query.name){
            solrHandler.queryIndex2Cust(query,session,function(rep){
                if(rep.success){
                    delete query.combox;
                    delete query.name;
                    var ids=rep.ids;
                    query._id={$in:ids};
                    sendExport();
                }else{
                    logger.app.error("query solr index error");
                    callback({success: false});
                }
            });
        }else{
            sendExport();
        }
    }else{
        sendExport();
    }
}