/**
 * Created by yaxi on 2015-11-10.
 */

var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require('../common/Fields');
var reportHandler = require('./ReportHandler');

/**
 * 工单整体分析报表
 * @param data
 * @param callback
 */
exports.queryBusinessAnalyseReport = function(data, callback){
    var result = {success: false};
    reportHandler.getTableHeader({reportType: data.query.reportType, account: data.account},function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;


        var keys = {flow: 1};
        var condition = getReportTimeCondition(data.query);
        condition.account = data.account;
        //使用mongodb的group查询数据
        //初始化累加器,每一个group中会有一个累加器
        var initial = {
            create:0,
            finish:0,
            finishTimeCount:0,
            processCount:0,
            processTimeCount:0,
            pickCount:0,
            waitTimeCount:0,
            finishRate:0,
            finishTimeAvg : 0,
            processTimeAvg : 0,
            waitTimeAvg : 0
        };
        //聚合函数
        var aggregation = function( curr, result ){
            result.create += curr.create || 0;
            result.finish += curr.finish || 0;
            result.finishTimeCount += curr.finishTimeCount || 0;
            result.processCount += curr.processCount || 0;
            result.processTimeCount += curr.processTimeCount || 0;
            result.pickCount += curr.pickCount || 0;
            result.waitTimeCount += curr.waitTimeCount || 0;

        };

        //完成器函数
        var finalize = function(result){
            if(result.create > 0 ){
                var rate = result.finish / result.create;
                result.finishRate = Math.round(rate.toFixed(2) * 100 );
            }else{
                result.finishRate = 0
            }
            if(result.finish > 0){
                result.finishTimeAvg = Math.round(result.finishTimeCount / result.finish);
            }else{
                result.finishTimeAvg= 0;
            }
            if(result.processCount > 0){
                result.processTimeAvg = Math.round(result.processTimeCount / result.processCount);
            }else{
                result.processTimeAvg = 0;
            }

            if(result.pickCount > 0){
                result.waitTimeAvg = Math.round(result.waitTimeCount / result.pickCount);
            }else{
                result.waitTimeAvg = 0;
            }

        };

        mongo.db().collection(fields.DB_BUSINESS_ANALYSE_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err,docs){
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
    });
};

function getReportTimeCondition(query){
    var query = query || {};
    var condition = {};
    if(query.timeType == 'day'){
        var year = query.yearReport || "";
        var month = query.monthReport || "";
        var day = query.dayReport || "";
        condition.day = year+""+month+""+day;
    } else if (query.timeType == "month"){
        var year = query.yearReport || "";
        var month = query.monthReport || "";
        condition.month = year+""+month;
    } else if(query.timeType == "year"){
        var year = query.yearReport || "";
        condition.year = year+"";
    } else if(query.timeType == "other"){
        var startTime = query.StartTime || "";
        var endTime = query.EndTime || "";
        condition.day = {
            $gte: startTime,
            $lte : endTime
        };
    }
    return condition;
}


exports.setUserLevelCondition2Cust = function(query,field,session){
    var noExistVal="noExistVal";
    var scope=session.user.moduleUsers.business;
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

exports.queryBusinessAgentReport = function(data, callback){
    var result = {success: false};
    reportHandler.getTableHeader({reportType: data.query.reportType, account: data.account},function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;


        var keys = {agent: 1};
        var condition = getReportTimeCondition(data.query);
        condition.account = data.account;
        if(data.query.selectedAgentList){
            var agents = data.query.selectedAgentList.split(",");
            condition.agent = {
                $in : agents || []
            };

            if(data.user.type == "admin" || data.user.moduleUsers.business == 'all'){
                condition.agent = {'$in' : agents};
            }else{
                var lowUsers = data.user.moduleUsers.business||[];
                if(lowUsers && lowUsers.length >0){
                    var inAgents = [];
                    for(var i=0 ;i<agents.length;i++){
                        for(var j=0;j<lowUsers.length;j++){
                            if(lowUsers[j] == agents[i]){
                                inAgents.push(agents[i]);
                            }
                        }
                    }
                    condition.agent = {'$in' : inAgents};
                }
            }
        }else{
            exports.setUserLevelCondition2Cust(condition,'agent',data);
        }


        //使用mongodb的group查询数据
        //初始化累加器,每一个group中会有一个累加器
        var initial = {
            create:0,
            pick:0,
            process:0,
            processTimeCount:0,
            assign:0
        };
        //聚合函数
        var aggregation = function( curr, result ){
            result.create += curr.create || 0;
            result.pick += curr.pick || 0;
            result.process += curr.process || 0;
            result.processTimeCount += curr.processTimeCount || 0;
            result.assign += curr.assign || 0;
        };

        //完成器函数
        var finalize = function(result){
            if(result.process > 0 ){
                result.processTimeAvg = Math.round(result.processTimeCount / result.process) ;
            }else{
                result.processTimeAvg = 0;
            }

        };

        mongo.db().collection(fields.DB_BUSINESS_AGENT_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err,docs){
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
    });
};
