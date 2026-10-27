var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var dateUtil = require('appUtil/DateTime')
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var queueHandler = require(__baseDir + '/dishui/app/queue/QueueHandler');
var userHandler = require(__baseDir + '/dishui/app/user/UserHandler');
var skillgroupHandler = require(__baseDir + '/dishui/config/ivr/SkillgroupHandler');


exports.getTableHeader = function(data,session,callback){
    var result = {success:false};
    var find = {
        Account : session.user.account,
        Type : data
    }
    mongo.db().collection(fields.DB_REPORT_TABLE_HEADER_CONFIG).findOne(find,function(err, doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        if(doc){
            result.data = doc ;
            result.success = true;
            callback(result);
        }else{
            var findSystenm = {
                Account : 'system',
                Type : data
            }
            mongo.db().collection(fields.DB_REPORT_TABLE_HEADER_CONFIG).findOne(findSystenm,function(err, sysdoc){
                if(err){
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                result.data = sysdoc;
                result.success = true;
                callback(result);
            });
        }
    });
}

exports.saveTableHeader = function(data,session,callback){
    var result = {success:false};
    var delFind = {
        Account : session.user.account,
        Type : data.reportType
    }
    mongo.db().collection(fields.DB_REPORT_TABLE_HEADER_CONFIG).remove(delFind,function(err){
        if(err){
           logger.app.error(err);
           callback(result);
            return;
        }
        var doc = {
            Account: session.user.account,
            Type : data.reportType,
            ReportName : data.reportName,
            Config : new Array()
        }
        delete data.reportType;
        delete data.reportName;
        for(var i=0 ; i < data.headers.length ; i++){
            var one = {
                order : data.headers[i].order+'',
                name : data.headers[i].name.split("@")[0],
                displayname : data.headers[i].name.split("@")[1],
                show : data.headers[i].show
            }
            doc.Config.push(one);
        }
        mongo.db().collection(fields.DB_REPORT_TABLE_HEADER_CONFIG).insert(doc,function(err){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            callback(result);
        });
    });
}

exports.queryOption = function(data, session, callback){
    var result = {success: false};
    var optionData = {
        accountId : session.user.account,
        name : '满意度调查选项'
    }
    mongo.db().collection(fields.DB_APP_OPTIONDIC).findOne(optionData, function(err, doc){
        if(!err){
            var reportOptions = new Array();
            for (var i = 0; i < doc.options.length; i++){
                var reportOptions1 = {};
                if(doc.options[i].state){
                    if(doc.options[i].state == '2'){
                        reportOptions1.name = doc.options[i].name;
                        reportOptions1.key = doc.options[i].options[0].name;
                        reportOptions.push(reportOptions1);
                    }
                }else{
                    reportOptions1.name = doc.options[i].name;
                    reportOptions1.key = doc.options[i].options[0].name;
                    reportOptions.push(reportOptions1);
                }
            }
            result.list = reportOptions;
            result.success = true;
            callback(result);
        } else {
            result.success = false;
            callback(result);
        }
    });
}

exports.openQueue = function(data,session,callback){
    var result = {success:false};
    exports.getTableHeader(data.reportType,session,function(headerRes){
        if(!headerRes.success){
            callback(result);
        }
        result.tableHeader = headerRes.data;

        var findQueue = {
            Account : session.user.account
        }
        queueHandler.queryQueue(findQueue,session,function(queueRes){
            if(!queueRes.success){
                callback(result);
                return;
            }
            result.queues = queueRes.list;

            var condition = getReportTimeID(data, session);
            if("query" in data){
                var query = data.query;
                if("selectedQueueList" in query){
                    if(query.selectedQueueList != ""){
                        var queues = query.selectedQueueList.split(',');
                        condition.QueueID = {'$in' : queues};
                    }
                }
//                if(query.TimeType === 'day'){
//                    condition.DayID = ''+query.yearReport+query.monthReport+query.dayReport;
//                }else if(query.TimeType === 'month'){
//                    condition.MonthID = ''+query.yearReport+query.monthReport;
//                }else if(query.TimeType === 'year'){
//                    condition.YearID = ''+query.yearReport;
//                }else if(query.TimeType === 'time'){
//                    condition.ReportTime = ''+query.timeReport;
//                }
            }
//            else{
//                var curDate = new Date();
//                var curYear = curDate.getFullYear();    //获取完整的年份(4位,1970-????)
//                var curMonth = curDate.getMonth();       //获取当前月份(0-11,0代表1月)
//                var curDay = curDate.getDate();        //获取当前日(1-31)
//                if(curMonth < 10){
//                    curMonth = '0' + (curMonth+1);
//                }
//                if(curDay < 10){
//                    curDay = '0' + curDay;
//                }
//                condition.DayID = '' + curYear + curMonth + curDay;
//            }
            //使用mongodb的group查询数据
            var keys ={
                QueueID:1
            }
            //初始化累加器,每一个group中会有一个累加器
            var initial = {
                AccessCount:0,
                AcceptCount:0,
                AcceptIn20Count:0,
                AbandonIn6SumQueueLeak:0,
                AbandonMaxQueueTimeLength:0,
                AbandonMinQueueTimeLength:0,
                AbandonSumQueueTimeLength:0,
                AcceptMaxQueueTimeLength:0,
                AcceptMinQueueTimeLength:0,
                AcceptSumCallInTimeLength:0,
                AcceptSumQueueTimeLength:0
            }
            //聚合函数
            var reduce = function( curr, result ){
                result.AccessCount += curr.AccessCount;
                result.AcceptCount += curr.AcceptCount;
                result.AcceptIn20Count += curr.AcceptIn20Count;
                result.AbandonIn6SumQueueLeak += curr.AbandonIn6SumQueueLeak;
                if(curr.AbandonMaxQueueTimeLength > result.AbandonMaxQueueTimeLength){
                    result.AbandonMaxQueueTimeLength = curr.AbandonMaxQueueTimeLength;
                }
                if(result.AbandonMinQueueTimeLength === 0){
                    result.AbandonMinQueueTimeLength = curr.AbandonMinQueueTimeLength;
                }
                if(curr.AbandonMinQueueTimeLength <  result.AbandonMinQueueTimeLength){
                    result.AbandonMinQueueTimeLength = curr.AbandonMinQueueTimeLength;
                }
                result.AbandonSumQueueTimeLength += curr.AbandonSumQueueTimeLength;
                if(curr.AcceptMaxQueueTimeLength > result.AcceptMaxQueueTimeLength){
                    result.AcceptMaxQueueTimeLength = curr.AcceptMaxQueueTimeLength;
                }
                if(result.AcceptMinQueueTimeLength === 0){
                    result.AcceptMinQueueTimeLength = curr.AcceptMinQueueTimeLength;
                }
                if(curr.AcceptMinQueueTimeLength <  result.AcceptMinQueueTimeLength){
                    result.AcceptMinQueueTimeLength = curr.AcceptMinQueueTimeLength;
                }
                result.AcceptSumCallInTimeLength += curr.AcceptSumCallInTimeLength;
                result.AcceptSumQueueTimeLength += curr.AcceptSumQueueTimeLength;
            }
            //完成器函数
            var finalize = function(result){
                result.AcceptRate = Math.round(result.AcceptCount/result.AccessCount*100) + "%";
                result.AcceptAverageQueueTimeLength = result.AcceptSumQueueTimeLength/result.AcceptCount;
                if(result.AccessCount-result.AcceptCount === 0){
                    result.AbandonAverageQueueTimeLength = 0;
                }else{
                    result.AbandonAverageQueueTimeLength = result.AbandonSumQueueTimeLength/(result.AccessCount-result.AcceptCount);
                }
                result.AcceptAverageCallInTimeLength = result.AcceptSumCallInTimeLength/result.AcceptCount;
                result.ServiceLevel = Math.round(result.AcceptIn20Count/result.AccessCount*10)/10;
                if( result.AccessCount-result.AbandonIn6SumQueueLeak === 0){
                    result.AcceptRateNotIn6Leak = "0%";
                }else{
                    result.AcceptRateNotIn6Leak = Math.round(result.AcceptCount/(result.AccessCount-result.AbandonIn6SumQueueLeak)*100) +"%";
                }
            }
            //collection().group(keys, condition, initial, reduce, finalize, command, options, callback)
            //mongo.db().collection(fields.DB_REPORT_QUEUE_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            mongo.reportDb().collection(fields.DB_NEW_REPORT_QUEUE_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
                    if(err){
                    callback(result);
                    return;
                }
                //console.log(docs);
                result.data = docs;
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.openQueueTime = function(data,session,callback){
    var result = {success:false};
    exports.getTableHeader(data.reportType,session,function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        var findQueue = {
            Account : session.user.account
        }
        skillgroupHandler.queryQueue(findQueue,session,function(queueRes){
            if(!queueRes.success){
                callback(result);
                return;
            }
            result.queues = queueRes.list;
            var keys = getGroupKey(data);
            var condition = getReportTimeID(data, session);
            if('query' in data){
                if(data.query.currentQueue!=""){
                    condition.QueueID = data.query.currentQueue;
                }
            }
            //使用mongodb的group查询数据
            //初始化累加器,每一个group中会有一个累加器
            var initial = {
                AccessCount:0,
                AcceptCount:0,
                AcceptIn20Count:0,
                AbandonIn6SumQueueLeak:0,
                AbandonMaxQueueTimeLength:0,
                AbandonMinQueueTimeLength:0,
                AbandonSumQueueTimeLength:0,
                AcceptMaxQueueTimeLength:0,
                AcceptMinQueueTimeLength:0,
                AcceptSumCallInTimeLength:0,
                AcceptSumQueueTimeLength:0
            }
            //聚合函数
            var reduce = function( curr, result ){
                result.AccessCount += curr.AccessCount;
                result.AcceptCount += curr.AcceptCount;
                result.AcceptIn20Count += curr.AcceptIn20Count;
                result.AbandonIn6SumQueueLeak += curr.AbandonIn6SumQueueLeak;
                if(curr.AbandonMaxQueueTimeLength > result.AbandonMaxQueueTimeLength){
                    result.AbandonMaxQueueTimeLength = curr.AbandonMaxQueueTimeLength;
                }
                if(result.AbandonMinQueueTimeLength === 0){
                    result.AbandonMinQueueTimeLength = curr.AbandonMinQueueTimeLength;
                }
                if(curr.AbandonMinQueueTimeLength <  result.AbandonMinQueueTimeLength){
                    result.AbandonMinQueueTimeLength = curr.AbandonMinQueueTimeLength;
                }
                result.AbandonSumQueueTimeLength += curr.AbandonSumQueueTimeLength;
                if(curr.AcceptMaxQueueTimeLength > result.AcceptMaxQueueTimeLength){
                    result.AcceptMaxQueueTimeLength = curr.AcceptMaxQueueTimeLength;
                }
                if(result.AcceptMinQueueTimeLength === 0){
                    result.AcceptMinQueueTimeLength = curr.AcceptMinQueueTimeLength;
                }
                if(curr.AcceptMinQueueTimeLength <  result.AcceptMinQueueTimeLength){
                    result.AcceptMinQueueTimeLength = curr.AcceptMinQueueTimeLength;
                }
                result.AcceptSumCallInTimeLength += curr.AcceptSumCallInTimeLength;
                result.AcceptSumQueueTimeLength += curr.AcceptSumQueueTimeLength;
            }
            //完成器函数
            var finalize = function(result){
                result.AcceptRate = Math.round(result.AcceptCount/result.AccessCount*100) + "%";
                result.AcceptAverageQueueTimeLength = Math.round(result.AcceptSumQueueTimeLength/result.AcceptCount);
                if(result.AccessCount-result.AcceptCount === 0){
                    result.AbandonAverageQueueTimeLength = 0;
                }else{
                    result.AbandonAverageQueueTimeLength = result.AbandonSumQueueTimeLength/(result.AccessCount-result.AcceptCount);
                }
            }
            mongo.reportDb().collection(fields.DB_NEW_REPORT_QUEUE_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            //mongo.db().collection(fields.DB_REPORT_QUEUE_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
                if(err){
                    logger.app.error('query queueTime report group failed!',err);
                    callback(result);
                    return;
                }
                result.data = docs;
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.openAgent = function(data, session, callback){
    var result = {success: false};
    var reportType = '';
    if (data == 'call_report_agent'){
        reportType = data;
        var findAgent = {
            account: session.user.account
        }
    }else{
        reportType = data.reportType;
        var findAgent = {
            account: session.user.account
        }
    }
    exports.getTableHeader(reportType, session, function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        userHandler.queryUser(findAgent, session, function(userRes){
            if(!userRes.success){
                callback(result);
                return;
            }
            result.agents = userRes.list;
            var keys ={
                AgentID:1
            }
            var condition = getReportTimeID(data, session);

            if(data != 'call_report_agent' && "selectedAgentList" in data && data.selectedAgentList != ""){
                var agents = data.selectedAgentList.split(',');

                if(data.includeSubordinate){
                    var agentChooseList = data.selectedAgentList.split(',');
                    var agentList = userRes.list;

                    for(var i=0 ;i<agentChooseList.length;i++){
                        var agent_id = agentChooseList[i];
                        utils.getLowUserArrayByParentId(agent_id,agentList,agents);
                    }

                }
                if(session.user.type == "admin" || session.user.scope.call == fields.data_scope_all){
                    condition.AgentID = {'$in' : agents};
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
                        condition.AgentID = {'$in' : inAgents};
                    }
                }
            }else{
                utils.setUserLevelCondition(condition,'AgentID','call',session);
            }
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
                    result.CallInAverageTimeLength = result.CallInTimeLength/result.CallInAcceptCount;
                }
                if (result.CallOutAcceptCount ==0){
                    result.CallOutAverageTimeLength = result.CallOutTimeLength/1;
                }else{
                    result.CallOutAverageTimeLength = result.CallOutTimeLength/result.CallOutAcceptCount;
                }
                if (result.LOGIN_TIME_LENGTH==0 || (result.CallInAcceptCount + result.CallOutAcceptCount) == 0) {
                    result.AverageHourCallCount = 0;
                    result.AgentUtilization = "0%";
                }else if(result.LOGIN_TIME_LENGTH <= 1800){
                    result.AverageHourCallCount = result.CallInAcceptCount + result.CallOutAcceptCount;
                }
//                else if (result.LOGIN_TIME_LENGTH < (result.CallInTimeLength + result.CallOutTimeLength)){
//                    result.AverageHourCallCount =
//                        Math.round((result.CallInAcceptCount + result.CallOutAcceptCount) * 1800/(result.CallInTimeLength + result.CallOutTimeLength));
//                    //result.AgentUtilization = Math.round((result.CallInTimeLength + result.CallOutTimeLength)/1* 100) + '%';
//                }
                else{
                    result.AverageHourCallCount = Math.round((result.CallInAcceptCount + result.CallOutAcceptCount) * 1800/result.LOGIN_TIME_LENGTH);
                    result.AgentUtilization = Math.round((result.CallInTimeLength + result.CallOutTimeLength + result.STATE99_TIME_LENGTH)/(result.LOGIN_TIME_LENGTH + result.STATE2_TIME_LENGTH + result.STATE3_TIME_LENGTH
                            + result.STATE4_TIME_LENGTH + result.STATE5_TIME_LENGTH + result.STATE6_TIME_LENGTH + result.STATE7_TIME_LENGTH + result.STATE8_TIME_LENGTH + result.STATE9_TIME_LENGTH)* 100) + '%';
                }
            }
            mongo.reportDb().collection(fields.DB_NEW_REPORT_AGENT_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            //mongo.db().collection(fields.DB_REPORT_AGENT_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
                if(err){
                    callback(result);
                    return;
                }
                result.data = docs;
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.queryAgentTime = function(data, session, callback){
    var result = {success: false};
    exports.getTableHeader('call_report_agent_time', session, function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        var keys = {};
        if (data.YearID){
            keys.MonthID = 1;
        } else if (data.MonthID){
            keys.DayID = 1;
        } else if (data.TimeID){
            keys.DayID = 1;
        }else{
            keys.ReportTime = 1;
        }
        var condition = getReportTimeID(data, session);
        condition.AgentID = data.AgentID;
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
                result.CallInAcceptRate = "0%";
            }else{
                result.CallInAcceptRate = Math.round(result.CallInAcceptCount/result.CallInAccessCount*100) + "%";
            }
            if (result.CallInAcceptCount == 0){
                result.CallInAverageTimeLength = 0;
            }else{
                result.CallInAverageTimeLength = Math.round(result.CallInTimeLength/result.CallInAcceptCount);
            }
            if (result.CallOutAcceptCount ==0){
                result.CallOutAverageTimeLength = 0;
            }else{
                result.CallOutAverageTimeLength = Math.round(result.CallOutTimeLength/result.CallOutAcceptCount);
            }
            if (result.LOGIN_TIME_LENGTH == 0){
                result.AverageHourCallCount = 0;
                result.AgentUtilization = '0%';
            }else if(result.LOGIN_TIME_LENGTH <= 1800){
                result.AverageHourCallCount = result.CallInAcceptCount + result.CallOutAcceptCount;
            }else{
                result.AverageHourCallCount = Math.round((result.CallInAcceptCount + result.CallOutAcceptCount) * 1800/result.LOGIN_TIME_LENGTH);
//                result.AgentUtilization = Math.round((result.CallInTimeLength + result.STATE99_TIME_LENGTH + result.BUSY_TIME_LENGTH  + result.CallOutTimeLength)/result.LOGIN_TIME_LENGTH* 100) + '%';
//                if(parseInt(result.AgentUtilization) > 100){
//                    result.AgentUtilization = '100%';
//                }
            }
            result.CallInNotDealCount = result.CallInAccessCount - result.CallInAcceptCount;
        }
        mongo.reportDb().collection(fields.DB_NEW_REPORT_AGENT_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
        //mongo.db().collection(fields.DB_REPORT_AGENT_HOUR).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error('get agent time report failed!',err);
                callback(result);
                return;
            }
            console.log(docs);
            result.data = docs;
            result.success = true;
            callback(result);
        });
    });
}

exports.openApproveSurvey = function(data, session, callback){
    var result = {success: false};
    var reportType = '';
    if (data == 'call_report_approve_survey'){
        reportType = data;
    }else{
        reportType = data.reportType;
    }
    exports.getTableHeader(reportType, session, function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        var headerConfig = headerRes.data;
        exports.queryOption(data, session, function(optionRes){
            if(!optionRes.success){
                callback(result);
                return;
            }
            var approveArray = new Array();
            for (var i=0; i<optionRes.list.length; i++){
                var approveConfig = {
                    name: 'approveSurvey' + optionRes.list[i].key,
                    displayname: optionRes.list[i].name,
                    show: true,
                    order: 8 + i
                }
                approveArray.push(approveConfig.name);
                headerConfig.Config.push(approveConfig);
            }
            result.tableHeader = headerConfig;
            var keys ={
                AgentID:1
            }
            var condition = getReportTimeID(data, session);
            if (data != 'call_report_approve_survey' && "selectedAgentList" in data && data.selectedAgentList != ""){
                var agents = data.selectedAgentList.split(',');
                if(session.user.type == "admin" || session.user.scope.call == fields.data_scope_all){
                    condition.AgentID = {'$in' : agents};
                }else{
                    var lowUsers = session.user.moduleUsers.call;
                    var inAgents = [];
                    if(lowUsers && lowUsers.length >0){
                        for(var i=0 ;i<agents.length;i++){
                            for(var j=0;j<lowUsers.length;j++){
                                if(lowUsers[j] == agents[i]){
                                    inAgents.push(agents[i]);
                                }
                            }
                        }
                        condition.AgentID = {'$in' : inAgents};
                    }
                }
            }else{
                utils.setUserLevelCondition(condition,'AgentID','call',session);
            }
            var agentInitial = {
                CallInAcceptCount: 0,
                CallOutAcceptCount: 0
            }
            var agentReduce = function( curr, result ){
                result.CallInAcceptCount += curr.CallInAcceptCount;
                result.CallOutAcceptCount += curr.CallOutAcceptCount;
            }
            mongo.reportDb().collection(fields.DB_NEW_REPORT_AGENT_HOUR).group(keys,condition,agentInitial,agentReduce,{},{},{},function(err,docs){
                if(err){
                    callback(result);
                    return;
                }
                result.agentReportData = docs;
                if (data.callType != '' && data.callType != null){
                    condition.Type = data.callType;
                }
                var initial = {};
                for (var i = 0; i < approveArray.length; i++){
                    if (approveArray[i] == 'approveSurvey1'){
                        initial.approveSurvey1 = 0;
                    }else if (approveArray[i] == 'approveSurvey2'){
                        initial.approveSurvey2 = 0;
                    }else if (approveArray[i] == 'approveSurvey3'){
                        initial.approveSurvey3 = 0;
                    }else if (approveArray[i] == 'approveSurvey4'){
                        initial.approveSurvey4 = 0;
                    }else if (approveArray[i] == 'approveSurvey5'){
                        initial.approveSurvey5 = 0;
                    }else if (approveArray[i] == 'approveSurvey6'){
                        initial.approveSurvey6 = 0;
                    }else if (approveArray[i] == 'approveSurvey7'){
                        initial.approveSurvey7 = 0;
                    }else if (approveArray[i] == 'approveSurvey8'){
                        initial.approveSurvey8 = 0;
                    }else if (approveArray[i] == 'approveSurvey9'){
                        initial.approveSurvey9 = 0;
                    }else{
                        initial.approveSurvey0 = 0;
                    }
                }
                var reduce = function( curr, result ){
                    if("approveSurvey1" in result && !isNaN(curr.approveSurvey1)){
                        result.approveSurvey1 += curr.approveSurvey1;
                    }
                    if("approveSurvey2" in result && !isNaN(curr.approveSurvey2)){
                        result.approveSurvey2 += curr.approveSurvey2;
                    }
                    if("approveSurvey3" in result && !isNaN(curr.approveSurvey3)){
                        result.approveSurvey3 += curr.approveSurvey3;
                    }
                    if("approveSurvey4" in result && !isNaN(curr.approveSurvey4)){
                        result.approveSurvey4 += curr.approveSurvey4;
                    }
                    if("approveSurvey5" in result && !isNaN(curr.approveSurvey5)){
                        result.approveSurvey5 += curr.approveSurvey5;
                    }
                    if("approveSurvey6" in result && !isNaN(curr.approveSurvey6)){
                        result.approveSurvey6 += curr.approveSurvey6;
                    }
                    if("approveSurvey7" in result && !isNaN(curr.approveSurvey7)){
                        result.approveSurvey7 += curr.approveSurvey7;
                    }
                    if("approveSurvey8" in result && !isNaN(curr.approveSurvey8)){
                        result.approveSurvey8 += curr.approveSurvey8;
                    }
                    if("approveSurvey9" in result && !isNaN(curr.approveSurvey9)){
                        result.approveSurvey9 += curr.approveSurvey9;
                    }
                    if("approveSurvey0" in result && !isNaN(curr.approveSurvey0)){
                        result.approveSurvey0 += curr.approveSurvey0;
                    }
                }
                var Finalize = function(result){
                    if("approveSurvey1" in result){
                        result.approveSurveyCount = result.approveSurvey1;
                    }
                    if("approveSurvey2" in result){
                        result.approveSurveyCount += result.approveSurvey2;
                    }
                    if("approveSurvey3" in result){
                        result.approveSurveyCount += result.approveSurvey3;
                    }
                    if("approveSurvey4" in result){
                        result.approveSurveyCount += result.approveSurvey4;
                    }
                    if("approveSurvey5" in result){
                        result.approveSurveyCount += result.approveSurvey5;
                    }
                    if("approveSurvey6" in result){
                        result.approveSurveyCount += result.approveSurvey6;
                    }
                    if("approveSurvey7" in result){
                        result.approveSurveyCount += result.approveSurvey7;
                    }
                    if("approveSurvey8" in result){
                        result.approveSurveyCount += result.approveSurvey8;
                    }
                    if("approveSurvey9" in result){
                        result.approveSurveyCount += result.approveSurvey9;
                    }
                    if("approveSurvey0" in result){
                        result.approveSurveyCount += result.approveSurvey0;
                    }
                }
//                scopeHandler.addScopeCondition("AgentID", condition, session);
//                mongo.db().collection(fields.DB_REPORT_APPROVE_SURVEY).group(keys,condition,initial,reduce,Finalize,{},{},function(err, dataRes){
                mongo.reportDb().collection(fields.DB_NEW_REPORT_APPROVE_SURVEY).group(keys,condition,initial,reduce,Finalize,{},{},function(err, dataRes){
                    if(err){
                        logger.app.error('query ApproveSurvey report group failed!',err);
                        callback(result);
                        return;
                    }
                    result.data = dataRes;
                    result.success = true;
                    callback(result);
                });
            });
        })
    });
}

exports.approveSurveyToCallSheet = function(data, session, callback){
    var result = {success: false};
    var begin = 0;
    var pageSize = data.pageSize;
    delete data.pageSize;
    data.PBX = session.user.sipConfigId;
    if('page' in data){
        begin = (data.page-1)*pageSize;
        delete data.page;
    }
    mongo.db(session).collection(session.account.account+'_c5_call_sheet').find(data).limit(pageSize).skip(begin).toArray(function(err, docs){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        var callSheetList = docs;
        mongo.db(session).collection(session.account.account+'_c5_call_sheet').find(data).count(function(err,docCount){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = callSheetList;
            result.count = docCount;
            callback(result);
        });
    });
}

exports.openRelayTime = function(data, session, callback){
    var result = {success:false};
    exports.getTableHeader(data.reportType,session,function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;

        var keys = getGroupKey(data);
        var condition = getReportTimeID(data, session);

        var serviceNos = new Array();
        var servcieNosFalse = new Array();
        if("query" in data){
            for(var itemKey in data.query){
                if(itemKey.substr(0,10) == 'ServiceNo_'){
                    if(data.query[itemKey] == true || data.query[itemKey] == 'true'){
                        serviceNos.push(itemKey.split('_')[1]);
                    }else{
                        servcieNosFalse.push(itemKey.split('_')[1]);
                    }
                }
            }
        }
        if(serviceNos.length > 0 || servcieNosFalse.length >0){
            condition.Service = {$in:serviceNos};
        }

        //使用mongodb的group查询数据
        //初始化累加器,每一个group中会有一个累加器
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
        mongo.reportDb().collection(fields.DB_NEW_REPORT_SERVICE_CALL_IN).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
        //mongo.db().collection(fields.DB_REPORT_SERVICE_CALL_IN).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            result.data = docs;
            result.success = true;
            callback(result);
        });
    });
}

exports.openCalloutTime = function(data, session, callback){
    var result = {success:false};
    exports.getTableHeader(data.reportType,session,function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        var keys = getGroupKey(data);
        var condition = getReportTimeID(data, session);
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
//            result.AccessCount = result.DealingCount+result.NotDealCount+result.LeakCount;
//            result.DealingRate = Math.round(result.DealingCount / result.AccessCount * 100);
//            result.CallTimeLengthAvg = Math.round(result.CallTimeLength / result.DealingCount);
        }
        mongo.reportDb().collection(fields.DB_NEW_REPORT_CALL_OUT).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
        //mongo.db().collection(fields.DB_REPORT_CALL_OUT).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            result.data = docs;
            result.success = true;
            callback(result);
        });
    });
}

exports.openRelayArea = function(data, session, callback){
    var result = {success:false};
    exports.getTableHeader(data.reportType,session,function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        var keys = {Province:1};
        var condition = getReportTimeID(data, session);
        //选择了省份和服务号条件
        var provinces = new Array();
        var provincesFalse = new Array();
        var serviceNos = new Array();
        var servcieNosFalse = new Array();
        if("query" in data){
            for(var itemKey in data.query){
                if(itemKey.substr(0,9) == 'Province_'){
                    if(data.query[itemKey] == true || data.query[itemKey] == 'true'){
                        provinces.push(itemKey.split('_')[1]);
                    }
                    else{
                        provincesFalse.push(itemKey.split('_')[1]);
                    }
                }
                if(itemKey.substr(0,10) == 'ServiceNo_'){
                    if(data.query[itemKey] == true || data.query[itemKey] == 'true'){
                        serviceNos.push(itemKey.split('_')[1]);
                    }else{
                        servcieNosFalse.push(itemKey.split('_')[1]);
                    }
                }
            }
        }
        if(provinces.length > 0 || provincesFalse.length > 0){
            condition.Province = {$in:provinces};
        }
        if(serviceNos.length > 0 || servcieNosFalse.length >0){
            condition.Service = {$in:serviceNos};
        }
        //使用mongodb的group查询数据
        //初始化累加器,每一个group中会有一个累加器
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
        mongo.reportDb().collection(fields.DB_NEW_REPORT_SERVICE_CALL_IN).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
        //mongo.db().collection(fields.DB_REPORT_SERVICE_CALL_IN).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error('query relayArea report group failed!',err);
                callback(result);
                return;
            }
            result.data = docs;
            result.success = true;
            callback(result);
        });
    });
}

exports.openRelayAreaCity = function(data, session, callback){
    var result = {success:false};
    exports.getTableHeader(data.reportType,session,function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        var keys = {City:1};
        var condition = getReportTimeID(data, session);
        //选择了省份和服务号条件
        var provinces = new Array();
        var provincesFalse = new Array();
        var serviceNos = new Array();
        var servcieNosFalse = new Array();
        if("query" in data){
            for(var itemKey in data.query){
                if(!('relayAreaCityCurrentProvince' in data.query)){
                    if(itemKey.substr(0,9) == 'Province_'){
                        if(data.query[itemKey] == true || data.query[itemKey] == 'true'){
                            provinces.push(itemKey.split('_')[1]);
                        }
                        else{
                            provincesFalse.push(itemKey.split('_')[1]);
                        }
                    }
                }
                if(itemKey.substr(0,10) == 'ServiceNo_'){
                    if(data.query[itemKey] == true || data.query[itemKey] == 'true'){
                        serviceNos.push(itemKey.split('_')[1]);
                    }else{
                        servcieNosFalse.push(itemKey.split('_')[1]);
                    }
                }
            }
        }
        if('relayAreaCityCurrentProvince' in data.query){
            provinces.push(data.query.relayAreaCityCurrentProvince);
        }
        if(provinces.length > 0 || provincesFalse.length > 0){
            condition.Province = {$in:provinces};
        }
        if(serviceNos.length > 0 || servcieNosFalse.length >0){
            condition.Service = {$in:serviceNos};
        }
        //使用mongodb的group查询数据
        //初始化累加器,每一个group中会有一个累加器
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
        mongo.reportDb().collection(fields.DB_NEW_REPORT_SERVICE_CALL_IN).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
        //mongo.db().collection(fields.DB_REPORT_SERVICE_CALL_IN).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error('query relayAreaCity report group failed!',err);
                callback(result);
                return;
            }
            result.data = docs;
            result.success = true;
            callback(result);
        });
    });
}

exports.openDialoutArea = function(data, session, callback){
    var result = {success:false};
    exports.getTableHeader(data.reportType,session,function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        var keys = {Province:1};
        var condition = getReportTimeID(data, session);
        //选择了省份条件
        var provinces = new Array();
        var provincesFalse = new Array();
        if("query" in data){
            for(var itemKey in data.query){
                if(itemKey.substr(0,9) == 'Province_'){
                    if(data.query[itemKey] == true || data.query[itemKey] == 'true'){
                        provinces.push(itemKey.split('_')[1]);
                    }else{
                        provincesFalse.push(itemKey.split('_')[1]);
                    }
                }
            }
        }
        if(provinces.length > 0 || provincesFalse.length > 0){
            condition.Province = {$in:provinces};
        }
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
                result.CallOutAcceptRate = 0;
            }else{
                result.CallOutAcceptRate = Math.round(result.DealingCount/result.AccessCount*100) + "%";
            }
            if(result.DealingCount == 0){
                result.CallOutAverageTimeLength = 0;
            }else{
                result.CallOutAverageTimeLength = Math.round(result.CallTimeLength/result.DealingCount);
            }
        }
        mongo.reportDb().collection(fields.DB_NEW_REPORT_CALL_OUT).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
        //mongo.db().collection(fields.DB_REPORT_CALL_OUT).group(keys,condition,initial,reduce,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error('query DialoutArea report group failed!',err);
                callback(result);
                return;
            }
            result.data = docs;
            result.success = true;
            callback(result);
        });
    });
}

function getReportTimeID(data, session){
    var condition = {
        AccountID : session.user.account
    }
    if(data.query){
        data = data.query;
    }
    if(!data.TimeType){
        var curDate = new Date();
        if ((curDate.getDate()) < 10){
            if ((curDate.getMonth() + 1) < 10){
                condition.DayID = curDate.getFullYear() + '0' + (curDate.getMonth() + 1) + '0' + curDate.getDate();
            }else{
                condition.DayID = '' + curDate.getFullYear() + (curDate.getMonth() + 1) + '0' + curDate.getDate();
            }
        }else{
            if ((curDate.getMonth() + 1) < 10){
                condition.DayID = curDate.getFullYear() + '0' + (curDate.getMonth() + 1)  + curDate.getDate();
            }else{
                condition.DayID = '' + curDate.getFullYear() + (curDate.getMonth() + 1) + curDate.getDate();
            }
        }
    }else{
        if (data.TimeType == 'year'){
            condition.YearID = data.yearReport;
        } else if (data.TimeType == 'month'){
            condition.MonthID = data.yearReport + data.monthReport
//            if (data.monthReport < 10){
//                condition.MonthID = data.yearReport + '0' + data.monthReport;
//            }else{
//                condition.MonthID = data.yearReport + data.monthReport;
//            }
        } else if (data.TimeType == 'day'){
            if (data.dayReport < 10){
                condition.DayID = data.yearReport + data.monthReport + data.dayReport;
//                if (data.monthReport < 10){
//                    condition.DayID = data.yearReport + '0' + data.monthReport + '0' + data.dayReport;
//                }else{
//                    condition.DayID = data.yearReport + data.monthReport + '0' + data.dayReport;
//                }
            }else{
                condition.DayID = data.yearReport + data.monthReport + data.dayReport;
//                if (data.monthReport < 10){
//                    condition.DayID = data.yearReport + '0' + data.monthReport + data.dayReport;
//                }else{
//                    condition.DayID = '' + data.yearReport + data.monthReport + data.dayReport;
//                }
            }
        }else if (data.TimeType == 'other'){
            var startArray = new Array();
            var endArray = new Array();
            var startDayID = '';
            var endDayID = '';
            if (data.StartTime != ''){
                startArray = data.StartTime.split('-');
                startDayID = startArray[0]+startArray[1]+startArray[2];
            }
            if (data.EndTime != ''){
                endArray = data.EndTime.split('-');
                endDayID = endArray[0]+endArray[1]+endArray[2];
            }
            if (data.StartTime != '' && data.EndTime != ''){
                condition.DayID = {"$gte":startDayID, "$lte":endDayID};
            }else if(data.StartTime != '' && data.EndTime == ''){
                condition.DayID = {"$gte":startDayID};
            }else if(data.StartTime == '' && data.EndTime != ''){
                condition.DayID = {"$lte":endDayID};
            }
        }else if (data.TimeType == 'other_half_hour'){

            if (data.StartTime != '' && data.EndTime != ''){
                condition.ReportTime = {"$gte":data.StartTime, "$lte":data.EndTime};
            }else if(data.StartTime != '' && data.EndTime == ''){
                condition.ReportTime = {"$gte":data.StartTime};
            }else if(data.StartTime == '' && data.EndTime != ''){
                condition.ReportTime = {"$lte":data.EndTime};
            }
        }
    }
    return condition;
}

function getGroupKey(data){
    var key ={};
    if("query" in data){
        var query = data.query;
        if(query.TimeType === 'day'){
            key.ReportTime = 1;
        }else if(query.TimeType === 'month'){
            key.DayID = 1;
        }else if(query.TimeType === 'year'){
            key.MonthID = 1;
        }else if(query.TimeType === 'other'){
            key.DayID = 1;
        }else if(query.TimeType === 'other_half_hour'){
            key.ReportTime = 1;
        }
    }else{
        key.ReportTime = 1;
    }

    return key;
}
