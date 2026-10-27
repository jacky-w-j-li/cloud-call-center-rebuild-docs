/**
 * Created by wangyn on 2016-09-06.
 */
var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require('../common/Fields');
var reportHandler = require('./ReportHandler');
var config = require('../serverConfig.json');
var reportUtils = require('../common/ReportUtils');

//邮件坐席工作量报表
exports.queryMailAgentReport = function(data, callback){
    var result = {success:false};
    reportHandler.getTableHeader({reportType: data.reportType, account: data.account},function(headerRes) {
        if (!headerRes.success) {
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        reportHandler.queryUser({account: data.account}, function (userRes) {
            if (!userRes.success) {
                callback(result);
                return;
            }
            result.agents = userRes.list;

            var keys = {agentId: 1};
            var condition = getReportTimeID(data);
            if(data != 'mail_report_agent' && "selectedAgentList" in data.query && data.query.selectedAgentList != ""){
                var agents = data.query.selectedAgentList.split(',');
                if(data.user.type == "admin" || data.user.moduleUsers.email == 'all'){
                    condition.agentId = {'$in' : agents};
                }else{
                    var lowUsers = data.user.moduleUsers.email;
                    if(lowUsers && lowUsers.length >0){
                        var inAgents = [];
                        for(var i=0 ;i<agents.length;i++){
                            for(var j=0;j<lowUsers.length;j++){
                                if(lowUsers[j] == agents[i]){
                                    inAgents.push(agents[i]);
                                }
                            }
                        }
                        condition.agentId = {'$in' : inAgents};
                    }
                }
            }else{
                exports.setUserLevelCondition2Cust(condition,'agentId',data);
            }

            //console.log(condition);
            //使用mongodb的group查询数据
            //初始化累加器,每一个group中会有一个累加器
            var initial = {
                replyCount: 0,
                sessionAccessCount: 0,
                sessionCompleteCount: 0,
                sessionRollOutCount: 0,
                sessionRollInCount: 0,
                sessionTotalTimeLength: 0,
                firstResponseTotalTimeLength:0,
                responseTotalCount:0,
                mailAutoClaimOpenTimeLength:0,
                mailAutoClaimCloseTimeLength:0
            };
            //聚合函数
            var aggregation = function (curr, result) {
                result.replyCount += curr.replyCount || 0;
                result.sessionAccessCount += curr.accessSessionCount || 0;
                result.sessionCompleteCount += curr.sessionCompleteCount || 0;
                result.sessionRollOutCount += curr.sessionRollOutCount || 0;
                result.sessionRollInCount += curr.sessionRollInCount || 0;
                result.sessionTotalTimeLength += curr.sessionToTalTimeLength || 0;
                result.firstResponseTotalTimeLength += curr.firstResponseTotalTimeLength || 0;
                result.responseTotalCount += curr.responseCount || 0;
                result.mailAutoClaimOpenTimeLength +=curr.mailAutoClaimOpenTimeLength ||0;
                result.mailAutoClaimCloseTimeLength +=curr.mailAutoClaimCloseTimeLength ||0
            };

            //完成器函数
            var finalize = function(result){
                if((result.sessionCompleteCount+ result.sessionRollOutCount) > 0){
                    result.sessionAverageTimeLength = Math.round(result.sessionTotalTimeLength /(result.sessionCompleteCount+ result.sessionRollOutCount)) ;
                }else{
                    result.sessionAverageTimeLength = 0;
                }

                if(result.responseTotalCount > 0 ){
                    result.averageFirstResponseTimeLength = Math.round(result.firstResponseTotalTimeLength / result.responseTotalCount);
                }else{
                    result.averageFirstResponseTimeLength = 0;
                }
            };
            mongo.db().collection(fields.DB_MAIL_AGENT_REPORT).group(keys, condition, initial, aggregation, finalize, {}, {}, function (err, docs) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                docs = docs||[];
                result.data = docs;

                result.success = true;
                callback(result);
            });
        });
    });
};

function getReportTimeID(data){
    var condition = {
        account : data.account
    };
    var query = {};
    if(data.query){
        query= data.query;
    }else{
        query = data;
    }
    //console.log(query);
    var curDate = new Date();
    if(!query.timeType){

        if ((curDate.getDate()) < 10){
            if ((curDate.getMonth() + 1) < 10){
                condition.dayId = curDate.getFullYear() + '0' + (curDate.getMonth() + 1) + '0' + curDate.getDate();
            }else{
                condition.dayId = '' + curDate.getFullYear() + (curDate.getMonth() + 1) + '0' + curDate.getDate();
            }
        }else{
            if ((curDate.getMonth() + 1) < 10){
                condition.dayId = curDate.getFullYear() + '0' + (curDate.getMonth() + 1)  + curDate.getDate();
            }else{
                condition.dayId = '' + curDate.getFullYear() + (curDate.getMonth() + 1) + curDate.getDate();
            }
        }
    }else{
        if (query.timeType == 'year'){
            condition.yearId = query.yearReport;
        } else if (query.timeType == 'month'){
            condition.monthId = query.yearReport + query.monthReport;
        } else if (query.timeType == 'day'){
            condition.dayId = query.yearReport + query.monthReport + query.dayReport;
        }else if (query.timeType == 'other'){
            var startArray = new Array();
            var endArray = new Array();
            var startDayID = '';
            var endDayID = '';
            if (query.StartTime){
                startArray = query.StartTime.split('-');
                startDayID = startArray[0]+startArray[1]+startArray[2];
            }
            if (query.EndTime){
                endArray = query.EndTime.split('-');
                endDayID = endArray[0]+endArray[1]+endArray[2];
            }
            if (query.StartTime && query.EndTime){
                condition.dayId = {"$gte":startDayID, "$lte":endDayID};
            }else if(!query.StartTime && query.EndTime){
                condition.dayId = {"$lte":endDayID};
            }else if(query.StartTime && !query.EndTime){
                condition.dayId = {"$gte":startDayID};
            }
        } else if (query.timeType == 'other_half_hour'){
            if (query.StartTime !== '' && query.EndTime !== '') {
                condition.reportTime = { $gte: query.StartTime, $lte: query.EndTime};
            }else if(query.StartTime !== '' && query.EndTime === '') {
                condition.reportTime = { $gte: query.StartTime };
            }else if(query.StartTime === '' && query.EndTime !== '') {
                condition.reportTime = { $lte: query.EndTime };
            }
        }
        //console.log(condition);
    }
    return condition;
}

exports.setUserLevelCondition2Cust = function(query,field,session){
    var noExistVal="noExistVal";
    var scope=session.user.moduleUsers.email;
    var lowUsers=scope||[];
    if(scope!="all"){
        if(query[field]){//指定所属范围查询条件
            if(typeof query[field] =='string') {
                var count = 0;
                for (var i = 0; i < lowUsers.length; i++) {
                    var uid = lowUsers[i];
                    if (uid == query[field]) {
                        count++;
                        break;
                    }
                }
                if (count == 0) {//没有权限则查不到结果
                    query[field] = noExistVal;
                }
            }else{
                query[field]=noExistVal;
            }
        }else{
            query[field]={$in:lowUsers};
        }
    }
}

