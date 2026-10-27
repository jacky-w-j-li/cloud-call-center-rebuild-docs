var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var skillgroupHandler = require(__baseDir + '/dishui/config/ivr/SkillgroupHandler');
var clinetMenuHandler = require(__baseDir + "/dishui/common/clientMenu/ClientMenuHandler");
var dataAuthorityRank = {
    "all": 0,
    "dept":1,
    "deptLevel":2,
    "level":3,
}

var MobileReportHandler = {
    getCallInReport:function(funcIds, condition, callback){
        var result = {success:false};
        if(funcIds.indexOf('callin_report') == -1){
            console.log('callIn func is not auth to this user');
            result.success = true;
            result.data = [];
            callback(result);
        }else{
            var keys = condition.keys;
            var mycond = JSON.parse(JSON.stringify(condition));
            delete mycond.keys;
            var initial = {
                DealingCount:0,
                NotDealCount:0,
                LeakCount:0,
                QueueLeakCount:0,
                BlackListCount:0,
                VoicemailCount:0
            }
            //聚合函数
            var reduce = function( curr, result ){
                result.DealingCount += curr.DealingCount;
                result.NotDealCount += curr.NotDealCount;
                result.LeakCount += curr.LeakCount;
                result.QueueLeakCount += curr.QueueLeakCount;
                result.BlackListCount += curr.BlackListCount;
                result.VoicemailCount += curr.VoicemailCount;
            }
            //完成器函数
            var finalize = function(result){
                result.AccessCount = result.DealingCount+result.NotDealCount+result.LeakCount+result.QueueLeakCount+result.BlackListCount+result.VoicemailCount;
            }
            mongo.reportDb().collection(fields.DB_NEW_REPORT_SERVICE_CALL_IN).group(keys,mycond,initial,reduce,finalize,{},{},function(err,docs){
                if(err){
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                var X_axis = "";
                for(var item in keys){
                    X_axis = item;
                }
                for(var i=0; i<docs.length; i++){
                    docs[i].X_axis = docs[i][X_axis];
                }
                result.data = datasort(docs, 'X_axis');
                result.success = true;
                callback(result);
            });
        }
    },

    getCallOutReport:function(funcIds, condition, callback){
        var result = {success:false};
        if(funcIds.indexOf('callout_report') == -1){
            console.log('callOut func is not auth to this user');
            result.success = true;
            result.data = [];
            callback(result);
        }else{
            var keys = condition.keys;
            var mycond = JSON.parse(JSON.stringify(condition));
            delete mycond.keys;
            //使用mongodb的group查询数据
            //初始化累加器,每一个group中会有一个累加器
            var initial = {
                DealingCount:0,
                NotDealCount:0,
                LeakCount:0,
                CallTimeLength:0
            }
            //聚合函数
            var reduce = function( curr, result ){
                result.DealingCount += curr.DealingCount;
                result.NotDealCount += curr.NotDealCount;
                result.LeakCount += curr.LeakCount;
                result.CallTimeLength += curr.CallTimeLength;
            }
            //完成器函数
            var finalize = function(result){
                result.AccessCount = result.DealingCount+result.NotDealCount+result.LeakCount;
                if(result.AccessCount == 0){
                    result.DealingRate = 0;
                }else{
                    result.DealingRate = Math.round(result.DealingCount/result.AccessCount*100);
                }
                if(result.DealingCount == 0){
                    result.CallTimeLengthAvg = 0;
                }else{
                    result.CallTimeLengthAvg = Math.round(result.CallTimeLength/result.DealingCount);
                }
            }
            mongo.reportDb().collection(fields.DB_NEW_REPORT_CALL_OUT).group(keys,mycond,initial,reduce,finalize,{},{},function(err,docs){
                if(err){
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                var X_axis = "";
                for(var item in keys){
                    X_axis = item;
                }
                for(var i=0; i<docs.length; i++){
                    docs[i].X_axis = docs[i][X_axis];
                }
                result.data = datasort(docs, 'X_axis');
                result.success = true;
                callback(result);
            });
        }
    },

    getSkillGroupReport:function(funcIds, condition, callback){
        var result = {success:false};
        if(funcIds.indexOf('queue_report') == -1){
            console.log('queue_report func is not auth to this user');
            result.success = true;
            result.data = [];
            callback(result);
        }else{
            var keys = {QueueID:1};
            var mycond = JSON.parse(JSON.stringify(condition));
            delete mycond.keys;
            //使用mongodb的group查询数据
            //初始化累加器,每一个group中会有一个累加器
            var initial = {
                AccessCount:0,
                AcceptCount:0,
                AcceptIn20Count:0,
                AbandonIn6SumQueueLeak:0,
            }
            //聚合函数
            var reduce = function( curr, result ){
                result.AccessCount += curr.AccessCount;
                result.AcceptCount += curr.AcceptCount;
                result.AcceptIn20Count += curr.AcceptIn20Count;
                result.AbandonIn6SumQueueLeak += curr.AbandonIn6SumQueueLeak;
            }
            //完成器函数
            var finalize = function(result){
                if(result.AccessCount > 0){
                    result.AcceptRate = Math.round(result.AcceptCount/result.AccessCount*100) + "%";
                }else{
                    result.AcceptRate = "0%";
                }
            }
            mongo.reportDb().collection(fields.DB_NEW_REPORT_QUEUE_HOUR).group(keys,mycond,initial,reduce,finalize,{},{},function(err,docs){
                if(err){
                    logger.app.error('query queueTime report group failed!',err);
                    callback(result);
                    return;
                }
                var findQueue = {
                    Account : condition.AccountID
                }
                skillgroupHandler.queryQueue(findQueue,null,function(queueRes){
                    if(!queueRes.success){
                        callback(result);
                        return;
                    }
                    for(var i=0; i<docs.length; i++){
                        docs[i].QueueName = "";
                        for(var j=0; j<queueRes.list.length; j++){
                            if(docs[i].QueueID == queueRes.list[j]._id){
                                docs[i].QueueName = queueRes.list[j].DisplayName;
                            }
                        }
                    }
                    result.data = docs;
                    result.success = true;
                    callback(result);
                });
            });
        }
    },

    getIMMessageReport:function(funcIds, condition, callback){
        var result = {success:false};
        if(funcIds.indexOf('im_report_msg') == -1){
            console.log('im_report_msg func is not auth to this user');
            result.success = true;
            result.data = [];
            callback(result);
        }else{
            var keys = {platform: 1};
            //使用mongodb的group查询数据
            //初始化累加器,每一个group中会有一个累加器
            var initial = {
                sessionCount:0,
                visitorCount:0,
                messageCount:0,
                robotMessageCount:0,
                robotVisitorCount:0,
                robotSessionCount:0,
                sessionTotalTimeLength:0,
                firstResponseTotalTimeLength:0,
                responseTotalCount:0,
                finishSessionCount:0
            };
            //聚合函数
            var aggregation = function( curr, result ){
                result.sessionCount += curr.sessionCount || 0;
                result.visitorCount += curr.visitorCount || 0;
                result.messageCount += curr.messageCount || 0;
                result.robotMessageCount += curr.robotMessageCount || 0;
                result.robotVisitorCount += curr.robotVisitorCount || 0;
                result.robotSessionCount += curr.robotSessionCount || 0;
                result.sessionTotalTimeLength += curr.sessionTotalTimeLength || 0;
                result.firstResponseTotalTimeLength += curr.firstResponseTotalTimeLength || 0;
                result.responseTotalCount += curr.responseCount || 0;
                result.finishSessionCount += curr.finishSessionCount || 0;

            };

            //完成器函数
            var finalize = function(result){
                if(result.sessionCount > 0 ){
                    result.sessionRate = Math.round(result.responseTotalCount* 100 / result.sessionCount);
                }else{
                    result.sessionRate = 0;
                }

                if(result.finishSessionCount > 0 ){
                    result.averageSessionTimeLength = Math.round(result.sessionTotalTimeLength / result.finishSessionCount);
                }else{
                    result.averageSessionTimeLength = 0;
                }

                if(result.responseTotalCount > 0 ){
                    result.averageFirstResponseTimeLength = Math.round(result.firstResponseTotalTimeLength / result.responseTotalCount);
                }else{
                    result.averageFirstResponseTimeLength = 0;
                }

            };

            mongo.reportDb().collection(fields.DB_IM_MESSAGE_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err,docs){
                if(err){
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                docs = docs||[];
                result.data = docs;
                result.success = true;
                callback(result);
            });
        }
    },

    getIMSessionTimeReport:function(funcIds, condition, callback){
        var result = {success:false};
        var keys = condition.keys;
        delete condition.keys;
        //使用mongodb的group查询数据
        //初始化累加器,每一个group中会有一个累加器
        var initial = {
            sessionCount:0,
            robotSessionCount:0,
            convertManualCount:0,
            manualSessionCount:0,
            goodCount:0,
            badCount:0,
            mediumCount:0,
            lostSessionCount:0
        };
        //聚合函数
        var aggregation = function( curr, result ){
            result.robotSessionCount += curr.robotSessionCount || 0;
            result.convertManualCount += curr.convertManualCount || 0;
            result.manualSessionCount += curr.sessionCount || 0;
            result.goodCount += curr.goodCount || 0;
            result.badCount += curr.badCount || 0;
            result.mediumCount += curr.mediumCount || 0;
            result.lostSessionCount += curr.lostSessionCount || 0;
        };

        //完成器函数
        var finalize = function(result){
            result.sessionCount = (result.manualSessionCount + result.robotSessionCount) - result.convertManualCount;
        };
        mongo.reportDb().collection(fields.DB_IM_MESSAGE_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            docs = docs||[];
            var X_axis = "";
            for(var item in keys){
                X_axis = item;
            }
            for(var i=0; i<docs.length; i++){
                docs[i].X_axis = docs[i][X_axis];
            }
            result.data = datasort(docs, 'X_axis');
            result.success = true;
            callback(result);
        });
    },

    getCustomerIncreaseReport:function(funcIds, condition, callback){
        var result = {success:false};
        if(funcIds.indexOf('customer_report_increase') == -1){
            console.log('customer_report_increase func is not auth to this user');
            result.success = true;
            result.data = [];
            callback(result);
        }else{
            mongo.reportDb().collection(fields.DB_CUSTOMER_INCREASE_REPORT).find(condition).toArray(function (err, docs) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                var option = {
                    sort:{create_date:1},
                    limit: 1
                };
                var query = {
                    account: condition.account
                };
                mongo.db().collection('customer_template').find(query, {"source":1}, option).toArray(function(err, src){
                    if(err) {
                        logger.app.error(err);
                        callback(result);
                        return;
                    } else {
                        for(var i=0; i<docs.length; i++){
                            docs[i].counts = [];
                            for(var j=0; j<=src[0].source.length; j++){
                                var pushData = {};
                                if(j<src[0].source.length){
                                    var item = src[0].source[j];
                                    pushData = {
                                        "srcId" : item.key,
                                        "srcName" : item.name,
                                        "srcCount" : docs[i][item.key]==null?0:docs[i][item.key]
                                    };
                                    delete docs[i][item.key];
                                }else{
                                    pushData = {
                                        "srcId" : "unknown",
                                        "srcName" : "未知来源",
                                        "srcCount" : typeof docs[i]["unknow"] == 'undefined'?0:docs[i]["unknow"]
                                    };
                                    delete docs[i]["unknow"]
                                }
                                docs[i].counts.push(pushData);
                            }
                        }
                        result.data = datasort(docs, 'day');
                        result.success = true;
                        callback(result);
                    }
                });
            });
        }
    },

    getAgentWorkloadReport:function(funcIds, condition, callback){
        var result = {success:false};
        result.data = {};
        console.log(funcIds.indexOf('call_report_agent'));
        if(funcIds.indexOf('call_report_agent') == -1){
            console.log('callOut func is not auth to this user');
            result.success = true;
            result.data.agents = [];
            result.data.workload = [];
            callback(result);
        }else{
            var keys = {AgentID:1};
            if(condition.sessionUser){
                var sessionUser = condition.sessionUser;
                delete condition.sessionUser;
                var my_agents = [];
                mongo.db().collection(fields.DB_APP_ROLE).find({_id: {$in: sessionUser.role}},{scope_in:1}).toArray(function(err, roles){
                    if(err || roles == null){
                        console.log("find session_user's roles fails");
                        result.success = true;
                        result.data.agents = [];
                        result.data.workload = [];
                        callback(result);
                    }else{
                        var myAuthority = 3; //level for default
                        for(var i=0; i<roles.length; i++){
                            var tempAu = dataAuthorityRank[roles[i].scope_in.call];
                            if(tempAu < myAuthority){
                                myAuthority = tempAu;
                            }
                        }
                        var my_find = {"account" : sessionUser.account};
                        mongo.db('bill').collection(fields.DB_PLATFORM_USER).find(my_find).toArray(function(err, agents){
                            if(err || agents == null){
                                console.log("find account user fails accountid:" + sessionUser.account);
                                result.success = true;
                                result.data.agents = [];
                                result.data.workload = [];
                                callback(result);
                            }else{
                                var su_DeptId = "";
                                for(var i=0; i<agents.length; i++){
                                    if(agents[i]._id == sessionUser._id){
                                        su_DeptId = agents[i].deptId==null?"":agents[i].deptId;
                                    }
                                }
                                var my_observe = {
                                    $or: [
                                        {"observer":
                                            {$in : [sessionUser._id]}
                                        },
                                        {"treePath":
                                            {$regex: su_DeptId}
                                        }
                                    ]
                                }
                                mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).find(my_observe, {_id:1,observer:1}).toArray(function(err, my_all_depts){
                                    if(err || my_all_depts == null){
                                        console.log("find account user all authorityDepts fails accountid:" + sessionUser.account);
                                        result.success = true;
                                        result.data.agents = [];
                                        result.data.workload = [];
                                        callback(result);
                                    }else{
                                        var authority_depts = [];
                                        if(myAuthority == 0){
                                            for(var i=0; i<agents.length; i++){
                                                my_agents.push(agents[i]._id);
                                            }
                                        }else if(myAuthority == 1){
                                            for(var i=0; i<my_all_depts.length; i++){
                                                var temp_dept = my_all_depts[i];
                                                var temp_dept_ob = temp_dept.observer;
                                                if(temp_dept._id == su_DeptId || (temp_dept_ob != null && temp_dept_ob.indexOf(sessionUser._id) > -1)){
                                                    authority_depts.push(temp_dept._id);
                                                }
                                            }

                                            for(var i=0; i<agents.length; i++){
                                                if(authority_depts.indexOf(agents[i].deptId) > -1){
                                                    my_agents.push(agents[i]._id);
                                                }
                                            }
                                        }else if(myAuthority == 2){
                                            for(var i=0; i<my_all_depts.length; i++){
                                                authority_depts.push(my_all_depts[i]._id);
                                            }
                                            for(var i=0; i<agents.length; i++){
                                                if(authority_depts.indexOf(agents[i].deptId) > -1){
                                                    my_agents.push(agents[i]._id);
                                                }
                                            }
                                        }else if(myAuthority == 3){
                                            for(var i=0; i<agents.length; i++){
                                                if(agents[i]._id == sessionUser._id || agents[i].parentId == sessionUser._id){
                                                    my_agents.push(agents[i]._id);
                                                }
                                            }
                                            for(var i=0; i<my_all_depts.length; i++){
                                                var temp_dept = my_all_depts[i];
                                                var temp_dept_ob = temp_dept.observer;
                                                if(temp_dept_ob != null && temp_dept_ob.indexOf(sessionUser._id) > -1){
                                                    authority_depts.push(temp_dept._id);
                                                }
                                            }

                                            for(var i=0; i<agents.length; i++){
                                                if(authority_depts.indexOf(agents[i].deptId) > -1 && my_agents.indexOf(agents[i]._id) == -1){
                                                    my_agents.push(agents[i]._id);
                                                }
                                            }
                                        }else{
                                            console.log("no such kind of scope");
                                            result.success = true;
                                            result.data.agents = [];
                                            result.data.workload = [];
                                            callback(result);
                                            return;
                                        }

                                        condition.AgentID = {$in: my_agents};
                                        getDataForAgentWorkloadFunc(keys, condition, function(agent_workload){
                                            if(!agent_workload.success){
                                                result.success = true;
                                                result.data.agents = [];
                                                result.data.workload = [];
                                            }else{
                                                var my_authority_agents = [];
                                                for(var i=0; i<agents.length; i++){
                                                    var temp_agent = agents[i];
                                                    if(my_agents.indexOf(temp_agent._id) > -1){
                                                        my_authority_agents.push(agents[i]);
                                                    }
                                                }
                                                while(agent_workload.data.length > 4){
                                                    agent_workload.data.pop();
                                                }
                                                result.data.agents = my_authority_agents;
                                                result.data.workload = agent_workload.data;
                                                result.success = true;
                                            }
                                            callback(result);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }else{
                getDataForAgentWorkloadFunc(keys, condition, function(agent_workload){
                    if(!agent_workload.success){
                        result.success = true;
                        result.data.agents = [];
                        result.data.workload = [];
                    }else{
                        var all_agents = condition.AgentID.$in;
                        var no_data_apply = [];
                        if(agent_workload.data.length < all_agents.length){
                            for(var i=0; i<all_agents.length; i++ ){
                                var has_data = false;
                                for(var j=0; j<agent_workload.data.length; j++){
                                    if(agent_workload.data[j].AgentID == all_agents[i]){
                                        has_data = true;
                                    }
                                }
                                if(!has_data){
                                    no_data_apply.push(JSON.parse('{"AgentID": "' + all_agents[i] + '", "CallInAcceptCount": 0, "CallInAccessCount": 0, "CallOutAccessCount": 0, "CallOutAcceptCount": 0, "TransferAcceptCount": 0, "CallInTimeLength": 0, "CallOutTimeLength": 0, "LOGIN_TIME_LENGTH": 0, "BUSY_TIME_LENGTH": 0, "IDLE_TIME_LENGTH": 0, "STATE2_TIME_LENGTH": 0, "STATE3_TIME_LENGTH": 0, "STATE4_TIME_LENGTH": 0, "STATE5_TIME_LENGTH": 0, "STATE6_TIME_LENGTH": 0, "STATE7_TIME_LENGTH": 0, "STATE8_TIME_LENGTH": 0, "STATE9_TIME_LENGTH": 0, "STATE99_TIME_LENGTH": 0, "CallInAcceptRate": "0%", "CallInAverageTimeLength": 0, "CallOutAverageTimeLength": 0, "AverageHourCallCount": 0, "AgentUtilization": "0%"}'));
                                }
                            }
                        }
                        result.data.agents = condition.AgentID.$in;
                        result.data.workload = agent_workload.data.concat(no_data_apply);
                        result.success = true;
                    }
                    callback(result);
                });
            }
        }
    }
};


exports.getMobileReport = function(data, session, callback){
    var result = {success: false};
    clinetMenuHandler.getUserFunc(session.user.role, function(funcs){
        // console.log(funcs);
        if(!funcs.success){
            result.message = "query user funcs failed";
            callback(result);
        }else{
            funcIds = funcs.allFun;
            // console.log(funcIds);
            result.serverCurrentTime = utils.DateTime.getCurrentTimestamp();
            var funcs = {
                callin:"getCallInReport",
                callout:"getCallOutReport",
                skillgroup:"getSkillGroupReport",
                immessage:"getIMMessageReport",
                imsession:"getIMSessionTimeReport",
                customerinc:"getCustomerIncreaseReport",
                agentwork:"getAgentWorkloadReport"
            };
            var condition = {};
            if(data.report_type != null){
                if(data.report_type == "queryall"){
                    //query for the first time or refresh
                    data.time_type = 'day';
                    var timeInterval = getTimeInterval(data);
                    condition = {
                        'ReportTime':{$gte:timeInterval.beginTime,$lt:timeInterval.endTime},
                        'AccountID':session.user.account,
                        'keys' : {ReportTime:1}
                    };
                    console.log(condition);
                    MobileReportHandler.getCallInReport(funcIds, condition, function(callin){
                        result.callin = callin;
                        if(!callin.success){
                            logger.app.log = "query callin failed";
                        }
                        MobileReportHandler.getCallOutReport(funcIds, condition, function(callout){
                            result.callout = callout;
                            if(!callout.success){
                                logger.app.log = "query callout failed";
                            }
                            MobileReportHandler.getSkillGroupReport(funcIds, condition, function(skillgroup){
                                result.skillgroup = skillgroup;
                                if(!skillgroup.success){}else{
                                    logger.app.log = "query skillgroup failed";
                                }
                                var imMessageCond = {
                                    "account": condition.AccountID,
                                    "dayId" : {
                                        $lt : formatToDayId(condition.ReportTime.$lt),
                                        $gte : formatToDayId(condition.ReportTime.$gte)
                                    }
                                }
                                MobileReportHandler.getIMMessageReport(funcIds, imMessageCond, function(immessage){
                                    result.immessage = immessage;
                                    if(!immessage.success){
                                        logger.app.log = "query immessage failed";
                                    }
                                    imMessageCond.keys = {hourId:1};
                                    MobileReportHandler.getIMSessionTimeReport(funcIds, imMessageCond, function(imsession){
                                        result.imsession = imsession;
                                        if(imsession.success){
                                            logger.app.log = "query imsession failed";
                                        }
                                        imMessageCond.day = imMessageCond.dayId;
                                        delete imMessageCond.dayId;
                                        MobileReportHandler.getCustomerIncreaseReport(funcIds, imMessageCond, function(customerinc){
                                            result.customerinc = customerinc;
                                            if(!customerinc.success){
                                                logger.app.log = "query customerinc failed";
                                            }
                                            condition.sessionUser = {
                                                _id: session.user._id,
                                                role: session.user.role,
                                                account: session.user.account
                                            };
                                            if(data.agents){
                                                condition.AgentID = {$in:data.agents};
                                                delete condition.sessionUser;
                                            }
                                            delete condition.keys;
                                            MobileReportHandler.getAgentWorkloadReport(funcIds, condition, function(agent_workload){
                                                result.agentwork = agent_workload;
                                                if(!agent_workload.success){
                                                    logger.app.log = "query agent_workload failed";
                                                }
                                                result.success = true;
                                                callback(result);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }else{
                    //query for every single report
                    if(funcs[data.report_type] != null){
                        var timeInterval = getTimeInterval(data);
                        if(timeInterval != null){
                            if(data.report_type == 'immessage'){
                                condition = {
                                    "account": session.user.account,
                                    "dayId" : {
                                        $lt : formatToDayId(timeInterval.endTime),
                                        $gte : formatToDayId(timeInterval.beginTime)
                                    }
                                };
                            }else if(data.report_type == 'imsession'){
                                condition = {
                                    "account": session.user.account,
                                    "dayId" : {
                                        $lt : formatToDayId(timeInterval.endTime),
                                        $gte : formatToDayId(timeInterval.beginTime)
                                    }
                                };
                                if(data.time_type == 'day'){
                                    condition.keys = {hourId:1};
                                }else{
                                    condition.keys = {dayId:1};
                                }
                            }else if(data.report_type == 'customerinc'){
                                condition = {
                                    "account": session.user.account,
                                    "day" : {
                                        $lt : formatToDayId(timeInterval.endTime),
                                        $gte : formatToDayId(timeInterval.beginTime)
                                    }
                                };
                            }else if(data.report_type == 'agentwork'){
                                condition = {
                                    "ReportTime": {$gte: timeInterval.beginTime, $lt: timeInterval.endTime},
                                    "sessionUser": {
                                        _id: session.user._id,
                                        role: session.user.role,
                                        account: session.user.account
                                    }
                                };
                                if(data.agents){
                                    condition.AgentID = {$in:data.agents};
                                    delete condition.sessionUser;
                                }
                            }else{
                                condition = {
                                    'ReportTime' : {$gte:timeInterval.beginTime,$lt:timeInterval.endTime},
                                    'AccountID' : session.user.account,
                                    'keys' : timeInterval.keys
                                };
                            }
                            var evalFunc = "MobileReportHandler" + "." + funcs[data.report_type] + "(funcIds, "
                                + JSON.stringify(condition) + ", "
                                + "function(reportData){if(reportData.success){result." + data.report_type
                                + " = reportData;result.success = true;}else{result.message = 'query " + data.report_type
                                + " data failed!';}callback(result);});";
                            eval(evalFunc);
                        }else{
                            result.message = "param time_type only accept day|week|month!";
                            callback(result);
                        }
                    }else{
                        result.message = "invalid report_type : " + data.report_type;
                        callback(result);
                    }
                }
            }else{
                result.message = "parameter report_type and time_type are indispensable ";
                callback(result);
            }
        }
    });
}

function getTimeInterval(data) {
    var timeInterval = {};
    var today = new Date();
    today.setDate(today.getDate() + 1);
    var tmonth = (today.getMonth()+1)<10?("0" + (today.getMonth()+1)):(today.getMonth()+1);
    var tdate = today.getDate()<10?("0"+today.getDate()):today.getDate();
    timeInterval.endTime = today.getFullYear() + "-" + tmonth + "-" + tdate + " 00:00:00";

    if (data.time_type == 'day') {
        today.setDate(today.getDate() - 1);
        var tmonth = (today.getMonth()+1)<10?("0" + (today.getMonth()+1)):(today.getMonth()+1);
        var tdate = today.getDate()<10?("0"+today.getDate()):today.getDate();
        timeInterval.beginTime = today.getFullYear() + "-" + tmonth + "-" + tdate + " 00:00:00";
        timeInterval.keys = {ReportTime:1};
    }else if(data.time_type == 'week'){
        today.setDate(today.getDate() - 7);
        var tmonth = (today.getMonth()+1)<10?("0" + (today.getMonth()+1)):(today.getMonth()+1);
        var tdate = today.getDate()<10?("0"+today.getDate()):today.getDate();
        timeInterval.beginTime = today.getFullYear() + "-" + tmonth + "-" + tdate + " 00:00:00";
        timeInterval.keys = {DayID:1};
    }else if(data.time_type == 'month'){
        today.setMonth(today.getMonth() - 1);
        var tmonth = (today.getMonth()+1)<10?("0" + (today.getMonth()+1)):(today.getMonth()+1);
        timeInterval.beginTime = today.getFullYear() + "-" + tmonth + "-" + tdate + " 00:00:00";
        timeInterval.keys = {DayID:1};
    }else{
        timeInterval = null;
    }
    return timeInterval;
}

function formatToDayId(date){
    var temp = new Date(Date.parse(date));

    var tmonth = (temp.getMonth()+1)<10?("0" + (temp.getMonth()+1)):(temp.getMonth()+1);
    var tdate = temp.getDate()<10?("0"+temp.getDate()):temp.getDate();
    var dayId = temp.getFullYear()+ tmonth + tdate;

    return dayId
}

function datasort(data,key){
    data.sort(function (a, b) {
        if (a[key] > b[key]) {
            return 1;
        } else if (a[key] == b[key]) {
            return 0;
        } else {
            return -1;
        }
    });
    return data;
}

function getDataForAgentWorkloadFunc(keys, condition, callback){
    var result = {success:false};
    var initial = {
        CallInAcceptCount: 0,
        CallInAccessCount: 0,
        CallOutAccessCount: 0,
        CallOutAcceptCount: 0,
        TransferAcceptCount: 0,
        CallInTimeLength: 0,
        CallOutTimeLength: 0,
        LOGIN_TIME_LENGTH: 0,
        BUSY_TIME_LENGTH: 0,
        IDLE_TIME_LENGTH: 0,
        STATE2_TIME_LENGTH: 0,
        STATE3_TIME_LENGTH: 0,
        STATE4_TIME_LENGTH: 0,
        STATE5_TIME_LENGTH: 0,
        STATE6_TIME_LENGTH: 0,
        STATE7_TIME_LENGTH: 0,
        STATE8_TIME_LENGTH: 0,
        STATE9_TIME_LENGTH: 0,
        STATE99_TIME_LENGTH: 0
    }
    var reduce = function( curr, result ){
        result.CallInAcceptCount += curr.CallInAcceptCount;
        result.CallInAccessCount += curr.CallInAccessCount;
        result.CallOutAccessCount += curr.CallOutAccessCount;
        result.CallOutAcceptCount += curr.CallOutAcceptCount;
        result.TransferAcceptCount += curr.TransferAcceptCount;
        result.CallInTimeLength += curr.CallInTimeLength;
        result.CallOutTimeLength += curr.CallOutTimeLength;
        result.LOGIN_TIME_LENGTH += curr.LOGIN_TIME_LENGTH;
        result.BUSY_TIME_LENGTH += curr.BUSY_TIME_LENGTH;
        result.IDLE_TIME_LENGTH += curr.IDLE_TIME_LENGTH;
        result.STATE2_TIME_LENGTH += curr.STATE2_TIME_LENGTH;
        result.STATE3_TIME_LENGTH += curr.STATE3_TIME_LENGTH;
        result.STATE4_TIME_LENGTH += curr.STATE4_TIME_LENGTH;
        result.STATE5_TIME_LENGTH += curr.STATE5_TIME_LENGTH;
        result.STATE6_TIME_LENGTH += curr.STATE6_TIME_LENGTH;
        result.STATE7_TIME_LENGTH += curr.STATE7_TIME_LENGTH;
        result.STATE8_TIME_LENGTH += curr.STATE8_TIME_LENGTH;
        result.STATE9_TIME_LENGTH += curr.STATE9_TIME_LENGTH;
        result.STATE99_TIME_LENGTH += curr.STATE99_TIME_LENGTH;
    }
    var finalize = function(result){
        if (result.CallInAccessCount == 0){
            result.CallInAcceptRate = Math.round(result.CallInAcceptCount/1*100) + "%";
        }else{
            result.CallInAcceptRate = Math.round(result.CallInAcceptCount/result.CallInAccessCount*100) + "%";
        }
        if (result.CallInAcceptCount == 0){
            result.CallInAverageTimeLength = result.CallInTimeLength/1;
        }else{
            result.CallInAverageTimeLength = Math.round(result.CallInTimeLength/result.CallInAcceptCount);
        }
        if (result.CallOutAcceptCount ==0){
            result.CallOutAverageTimeLength = result.CallOutTimeLength/1;
        }else{
            result.CallOutAverageTimeLength = Math.round(result.CallOutTimeLength/result.CallOutAcceptCount);
        }
        if (result.LOGIN_TIME_LENGTH==0 || (result.CallInAcceptCount + result.CallOutAcceptCount) == 0) {
            result.AverageHourCallCount = 0;
            result.AgentUtilization = "0%";
        }else if(result.LOGIN_TIME_LENGTH <= 1800){
            result.AverageHourCallCount = result.CallInAcceptCount + result.CallOutAcceptCount;
            result.AgentUtilization = Math.round((result.CallInTimeLength + result.CallOutTimeLength + result.STATE99_TIME_LENGTH)/(result.LOGIN_TIME_LENGTH - (result.STATE2_TIME_LENGTH + result.STATE3_TIME_LENGTH
                    + result.STATE4_TIME_LENGTH + result.STATE5_TIME_LENGTH + result.STATE6_TIME_LENGTH + result.STATE7_TIME_LENGTH + result.STATE8_TIME_LENGTH + result.STATE9_TIME_LENGTH))* 100) + '%';
        }else{
            result.AverageHourCallCount = Math.round((result.CallInAcceptCount + result.CallOutAcceptCount) * 1800/result.LOGIN_TIME_LENGTH);
            result.AgentUtilization = Math.round((result.CallInTimeLength + result.CallOutTimeLength + result.STATE99_TIME_LENGTH)/(result.LOGIN_TIME_LENGTH - (result.STATE2_TIME_LENGTH + result.STATE3_TIME_LENGTH
                    + result.STATE4_TIME_LENGTH + result.STATE5_TIME_LENGTH + result.STATE6_TIME_LENGTH + result.STATE7_TIME_LENGTH + result.STATE8_TIME_LENGTH + result.STATE9_TIME_LENGTH))* 100) + '%';
        }
    };
    mongo.reportDb().collection(fields.DB_NEW_REPORT_AGENT_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
        if(err){
            callback(result);
            return;
        }
        result.data = docs;
        result.success = true;
        callback(result);
    });
}