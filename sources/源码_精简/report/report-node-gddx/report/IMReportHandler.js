/**
 * Created by yaxi on 2015-11-10.
 */
var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require('../common/Fields');
var reportHandler = require('./ReportHandler');
var config = require('../serverConfig.json');
var reportUtils = require('../common/ReportUtils');
var Then = require('thenjs');


exports.queryImMessageReport = function(data, callback){
    var result = {success:false};
    var timeErr = timeHandler(data);
    if (timeErr) {
        result.message = timeErr;
        return callback(result);
    }

    reportHandler.getTableHeader({reportType: data.reportType, account: data.account},function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;

        var keys = {platform: 1};
        var condition = getReportTimeID(data);
        if(data.query.selectedAccessIdList){
            var ids = data.query.selectedAccessIdList.split(",")
            condition.accessId = {$in: ids};
            keys = {accessId:1};
        }
        //console.dir(condition);
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

        mongo.db().collection(fields.DB_IM_MESSAGE_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            docs = docs||[];
            //for(var i=0; i< docs.length; i++){
            //    docs[i].averageSessionTimeLength = Math.round(docs[i].sessionTotalTimeLength / docs[i].sessionCount);
            //    docs[i].averageFirstResponseTimeLength = Math.round(docs[i].firstResponseTotalTimeLength / docs[i].sessionCount);
            //    docs[i].sessionRate = (docs[i].responseTotalCount / (docs[i].sessionCount || 1)).toFixed(3) * 100;
            //}
            //console.log(docs)
            result.data = docs;
            result.success = true;
            callback(result);
        });
    });
};

exports.queryImBusinessAnalyseReport = function(data, callback){
    var result = {success:false};
    var timeErr = timeHandler(data);
    if (timeErr) {
        result.message = timeErr;
        return callback(result);
    }

    reportHandler.getTableHeader({reportType: data.reportType, account: data.account},function(headerRes){
        if(!headerRes.success){
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        var keys = {consultType: 1};
        var condition = getReportTimeID(data);

        //使用mongodb的group查询数据
        //初始化累加器,每一个group中会有一个累加器
        var initial = {
            pc:0,
            wap:0,
            sdk:0,
            weixin:0
        };
        //聚合函数
        var aggregation = function( curr, result ){
            result.pc += curr.pc || 0;
            result.wap += curr.wap || 0;
            result.sdk += curr.sdk || 0;
            result.weixin += curr.weixin || 0;
        };

        mongo.db().collection(fields.DB_IM_BUSINESS_REPORT).group(keys,condition,initial,aggregation,function(){},{},{},function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            docs = docs || [];
            mongo.appDb("cc").collection(fields.DB_APP_CHANNEL_DIC).findOne({account:data.account, type:"webchat"}, function(err, doc){
                var options = {};
                if(!err){
                    if(doc && doc.options){
                        for(var i =0; i<doc.options.length; i++){
                            options[doc.options[i].key] = doc.options[i].name;
                        }
                    }
                }else{

                }
                for(var i=0; i<docs.length; i++){
                    docs[i].consultTypeName = options[docs[i].consultType] || docs[i].consultType;
                }
                result.data = docs;
                result.success = true;
                callback(result);

            });

        });
    });
};

exports.queryImAgentReport = function(data, callback){
    var result = {success:false};
    var timeErr = timeHandler(data);
    if (timeErr) {
        result.message = timeErr;
        return callback(result);
    }

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
            if(data != 'im_report_agent' && "selectedAgentList" in data.query && data.query.selectedAgentList != ""){
                var agents = data.query.selectedAgentList.split(',');
                if(data.user.type == "admin" || data.user.moduleUsers.chat == 'all'){
                    condition.agentId = {'$in' : agents};
                }else{
                    var lowUsers = data.user.moduleUsers.chat;
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
            };

            //完成器函数
            var finalize = function(result){
                if((result.sessionAccessCount + result.sessionRollInCount) > 0 ){
                    result.sessionCompleteRate = Math.round((result.sessionCompleteCount+result.sessionRollOutCount)* 100 / (result.sessionAccessCount + result.sessionRollInCount));
                    result.sessionRollOutRate = Math.round(result.sessionRollOutCount* 100 / (result.sessionAccessCount + result.sessionRollInCount));
                }else{
                    result.sessionCompleteRate = 0;
                    result.sessionRollOutRate = 0;
                }


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
            mongo.db().collection(fields.DB_IM_AGENT_REPORT).group(keys, condition, initial, aggregation, finalize, {}, {}, function (err, docs) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                docs = docs||[];

                //for (var i=0; i< docs.length; i++) {
                //    docs[i].sessionCompleteRate = (docs[i].sessionCompleteCount / (docs[i].sessionAccessCount>0?docs[i].sessionAccessCount:1)).toFixed(3) * 100;
                //    docs[i].sessionRollOutRate = (docs[i].sessionRollOutCount / (docs[i].sessionAccessCount>0?docs[i].sessionAccessCount:1)).toFixed(3) * 100;
                //    docs[i].sessionAverageTimeLength = Math.round(docs[i].sessionTotalTimeLength /(docs[i].sessionCompleteCount+i ||1)) ;
                //}

                result.data = docs;

                result.success = true;
                callback(result);
            });
        });
    });
};
/**
 * 客户满意度报表
 * @param data
 * @param callback
 */
exports.queryImCsrReport = function(data,callback){
    console.log('客户满意度报表查询');
    var result = {success:false};
    var tempAppr = new Array();
    reportHandler.getTableHeader({reportType: data.reportType, account: data.account},function(headerRes) {
        if (!headerRes.success) {
            callback(result);
            return;
        }
        var headerConfig = headerRes.data;

        exports.queryOption(data, function(optionRes) {
            if (!optionRes.success) {
                callback(result);
                return;
            }
            var approveArray = new Array();
            for (var i = 0; i < optionRes.list.length; i++) {
                var approveConfig = {
                    name: optionRes.list[i].key,
                    displayname: optionRes.list[i].name,
                    show: true,
                    order: 8 + i
                }
                approveArray.push(approveConfig.name);
                headerConfig.Config.push(approveConfig);
                tempAppr.push(approveConfig.name);
            }
            result.tableHeader = headerConfig;

            reportHandler.queryUser({account: data.account}, function (userRes) {
                if (!userRes.success) {
                    callback(result);
                    return;
                }
                result.agents = userRes.list;

                var keys = {agentId: 1};
                var condition = getReportTimeID(data);
                if(data != 'im_report_agent' && "selectedAgentList" in data.query && data.query.selectedAgentList != ""){
                    var agents = data.query.selectedAgentList.split(',');
                    if(data.user.type == "admin" || data.user.moduleUsers.chat == 'all'){
                        condition.agentId = {'$in' : agents};
                    }else{
                        var lowUsers = data.user.moduleUsers.chat;
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


                var group ={
                    _id:"$agentId",
                    sessionCount : {$sum:"$sessionCount"},
                    totalAppraiseCount : {$sum:"$totalAppraiseCount"}

                };
                for(var i=0;i<tempAppr.length;i++){
                    group[tempAppr[i]]={$sum:"$"+tempAppr[i]};
                }
                mongo.db().collection(fields.DB_IM_CSR_REPORT).aggregate({$match:condition},{$group:group},function(err , docs){
                    if(!err){
                        var docs = docs ||[];
                        for(var i =0;i<docs.length;i++){
                            var agentId = docs[i]._id;
                            delete docs[i]._id;
                            docs[i].agentId = agentId;

                            if(docs[i].sessionCount > 0 ){
                                docs[i].appraiseRate = ((docs[i].totalAppraiseCount/ docs[i].sessionCount) * 100).toFixed(1);
                            }else{
                                docs[i].appraiseRate = 0.0;
                            }

                        }
                        result.data = docs;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                        return;
                    }
                });
            });
        });


    });
};


/**
 * 客户满意度报表（按渠道分组显示）
 * @param data
 * @param callback
 */
exports.queryImChannelCsrReport = function(data,callback){
    var result = {success:false};
    var tempAppr = new Array();
    Then(function(cont){
        reportHandler.getTableHeader({reportType: data.reportType, account: data.account},function(headerRes){
            if (!headerRes.success) {
                callback(result);
                return;
            }
            cont(null,headerRes.data);
        });
    }).then(function(cont,headerConfig){
        exports.queryOption(data, function (optionRes){
            if (!optionRes.success) {
                callback(result);
                return;
            }
            cont(null, optionRes.list, headerConfig);
        })
    }).then(function(cont, list, headerConfig){
        var approveArray = new Array();
        for (var i = 0; i < list.length; i++) {
            var approveConfig = {
                name: list[i].key,
                displayname: list[i].name,
                show: true,
                order: 8 + i
            }
            approveArray.push(approveConfig.name);
            headerConfig.Config.push(approveConfig);
            tempAppr.push(approveConfig.name);
        }
        result.tableHeader = headerConfig;

        var channels = [{
            "channel": "pc",
            "channelName": "pc"
        }, {
            "channel": "wap",
            "channelName": "wap"
        }, {
            "channel": "sdk",
            "channelName": "app"
        }, {
            "channel": "weixin",
            "channelName": "微信"
        }];
        result.channels = channels;
        var keys = {agentId: 1};
        var condition = getReportTimeID(data);
        condition.channel = {$ne:null};
        var group = {
            _id: "$channel",
            sessionCount: {$sum: "$sessionCount"},
            totalAppraiseCount: {$sum: "$totalAppraiseCount"}

        };
        for (var i = 0; i < tempAppr.length; i++) {
            group[tempAppr[i]] = {$sum: "$" + tempAppr[i]};
        }
        mongo.db().collection(fields.DB_IM_CSR_REPORT).aggregate({$match: condition}, {$group: group}, cont);
    }).then(function(cont,docs){
        var docs = docs || [];
        for (var i = 0; i < docs.length; i++) {
            var channel = docs[i]._id;
            delete docs[i]._id;
            docs[i].channel = channel;

            if (docs[i].sessionCount > 0) {
                docs[i].appraiseRate = ((docs[i].totalAppraiseCount/ docs[i].sessionCount) * 100).toFixed(1);
            } else {
                docs[i].appraiseRate = 0.0;
            }

        }
        result.data = docs;
        result.success = true;
        callback(result);
    }).fail(function (cont, err) {
        logger.app.error(err);
        result.message = err;
        callback(result);
    });
};


/**
 * 会话数时间趋势报表
 * @param data
 * @param callback
 */
exports.queryImSessionTimeReport = function(data,callback){
    console.log('会话数时间趋势报表查询');
    var result = {success:false};
    reportHandler.getTableHeader({reportType: data.reportType, account: data.account},function(headerRes) {
        if (!headerRes.success) {
            callback(result);
            return;
        }
        result.tableHeader = headerRes.data;
        var keys = getGroupKey(data);
        var condition = getReportTimeID(data);
        //console.dir(condition);
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
        mongo.db().collection(fields.DB_IM_MESSAGE_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            //console.log(docs);
            docs = docs||[];
            var timeKey = '';
            for(var key in keys){
                timeKey = key;
            }
            var format={timeKey:timeKey,  reportType: data.query.timeType, sortType: 'asc'};
            if(docs.length){
                reportUtils.complementTimeTrendReportData(format,docs,function(res){
                    result.data = res;
                    console.log(JSON.stringify(res));
                    result.success = true;
                    callback(result);
                });
            }else{
                result.data = docs;
                result.success = true;
                callback(result);
            }

        });
    });
};
exports.queryAgentWorkbenchReport = function(data, callback){
    var result = {success : false};
    var match = {
        agentId : data.agentId,
        dayId : utils.DateTime.getCurrentDayId()
    }
    var group = {_id:"$platform",count:{$sum:"$accessSessionCount"}};

    mongo.db().collection(fields.DB_IM_AGENT_REPORT)
        .aggregate([{$match:match},{$group:group}], function (err, workRes) {
            if (!err) {
                result.data = workRes;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
}

exports.queryMonitorInitData = function(data, callback){
    var result = {success : false};
    var match = {
        account : data.account,
        dayId : utils.DateTime.getCurrentDayId()
    }
    var group = {_id:"$agentId", count:{$sum:"$accessSessionCount"}};
    mongo.db().collection(fields.DB_IM_AGENT_REPORT)
        .aggregate([{$match:match},{$group:group}], function (err, workRes) {
            if (!err) {
                result.agentList = workRes;
                var accessCondition = {
                    account : data.account,
                    dayId : utils.DateTime.getCurrentDayId()
                }
                mongo.db().collection(fields.DB_IM_ACCESS_REPORT).find(accessCondition).toArray(function(err, accessRes){
                    if(!err){
                        result.accessList = accessRes;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                })
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
}

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
            function genDayId (time) {
                if (!time) {
                    return;
                }
                var day = time.split(' ')[0];
                var arr = day.split('-');
                return dayId = arr[0] + arr[1] + arr[2];
            }
            // 只有20161012之后才有半小时的数据
            function hasHalfHourData (time) {
                if (!time) {
                    return;
                }
                var dayId = genDayId(time);

                return dayId >= 20161012;
            }

            var hasStartData = hasHalfHourData(query.StartTime);
            var hasEndData = hasHalfHourData(query.EndTime);
            var startDayId = genDayId(query.StartTime);
            var endDayId = genDayId(query.EndTime);

            if (query.StartTime !== '' && query.EndTime !== '') {
                if (hasStartData && hasEndData) {
                    condition.reportTime = { $gte: query.StartTime, $lt: query.EndTime};
                } else {
                    condition.dayId = { $gte: startDayId, $lt: endDayId };
                }
            } else if(query.StartTime !== '' && query.EndTime === '') {
                if (hasStartData) {
                    condition.reportTime = { $gte: query.StartTime };
                } else {
                    condition.dayId = { $gte: startDayId };
                }
            } else if(query.StartTime === '' && query.EndTime !== '') {
                condition.dayId = { $lt: endDayId };
            }
        }
        //console.log(condition);
    }
    return condition;
}

exports.setUserLevelCondition2Cust = function(query,field,session){
    var noExistVal="noExistVal";
    var scope=session.user.moduleUsers.chat;
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

exports.queryOption = function(data, callback){
    var result = {success: false};
    var optionData = {
        account : data.account,
        type : 'webchatCSR'
    }
    mongo.appDb(config.appDbName).collection('app_channel_dic').findOne(optionData, function(err, doc){
        if(!err){
            var reportOptions = new Array();
            if(doc){
                for (var i = 0; i < doc.options.length; i++){
                    var reportOptions1 = {};
                    reportOptions1.name = doc.options[i].name;
                    reportOptions1.key = doc.options[i].key;
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

function getGroupKey(data){
    var key ={};
    if("query" in data){
        var query = data.query;
        if(query.timeType === 'day'){
            key.hourId = 1;
        }else if(query.timeType === 'month'){
            key.dayId = 1;
        }else if(query.timeType === 'year'){
            key.monthId = 1;
        }else if(query.timeType === 'other'){
            key.dayId = 1;
        }else if(query.timeType === 'other_half_hour'){
            key.reportTime = 1;
        }
    }else{
        key.dayId = 1;
    }

    return key;
}

/**
 * 在线客服来源分析报表
 * @param data
 * @param callback
 */
exports.queryImSessionFromReport = function (data,callback) {
    console.log('在线客服来源分析报表查询');
    var result = {success:false};
    var reportType = data.reportType;
    var flag = (reportType == "im_report_session_fromUrl" || reportType == "im_report_session_seoKeywords");
    //if (flag) {
        reportHandler.getTableHeader({reportType: reportType, account: data.account},function(headerRes) {
            if (!headerRes.success) {
                callback(result);
                return;
            }
            result.tableHeader = headerRes.data;
            queryImSessionFromReportF(data,result,reportType,flag,callback);
        });

};
queryImSessionFromReportF = function(data,result,reportType,flag,callback) {
    var keys = {};
    var key = reportType.split("_")[3];
    keys[key] = 1;
    var condition = getReportTimeID(data);
    if(data.reportType=="im_report_session_seoKeywords"&&data.query.seoSource){
        if(data.query.seoSource!="全部"){
            condition["seoSource"]=data.query.seoSource
        }else{
            condition[key] = {$ne:null};
        }
    }else{
        condition[key] = {$ne:null};
    }
    if (!flag) {
        //使用mongodb的group查询数据
        //初始化累加器,每一个group中会有一个累加器
        var initial = {
            sessionCount:0,
            robotSessionCount:0,
            convertManualCount:0,
            manualSessionCount:0,
            lostSessionCount:0
        };
        //聚合函数
        var aggregation = function( curr, result ){
            result.robotSessionCount += curr.robotSessionCount || 0;
            result.convertManualCount += curr.convertManualCount || 0;
            result.manualSessionCount += curr.sessionCount || 0;
            result.lostSessionCount += curr.lostSessionCount || 0;
        };

        //完成器函数
        var finalize = function(result){
            result.sessionCount = (result.manualSessionCount + result.robotSessionCount) - result.convertManualCount;
        };
        mongo.db().collection(fields.DB_IM_MESSAGE_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.data = docs;
            callback(result);
        });
    } else {
        //增加搜索引擎字段
        var group = {
            manualSessionCount: {$sum: "$sessionCount"},
            robotSessionCount: {$sum: "$robotSessionCount"},
            convertManualCount: {$sum: "$convertManualCount"},
            lostSessionCount: {$sum: "$lostSessionCount"},
            urlTitle: {$max: "$urlTitle"},
        };
        if(data.reportType=="im_report_session_seoKeywords"){
            group._id={ _id: "$"+key, seoSource: "$seoSource" }
        }else{
            group._id="$"+key
        }
        var project = {
            sessionCount:{$subtract:[{$add:["$manualSessionCount","$robotSessionCount"]},"$convertManualCount"]},
            manualSessionCount: "$manualSessionCount",
            robotSessionCount: "$robotSessionCount",
            convertManualCount: "$convertManualCount",
            lostSessionCount:  "$lostSessionCount",
            urlTitle:"$urlTitle"
        };


        var limit = data.limit || 10;
        data.page = data.page || 1;
        var skip = (data.page - 1) * limit;
        mongo.db().collection(fields.DB_IM_MESSAGE_REPORT).aggregate({$match:condition}, {$group:group},{$project: project},{$sort:{sessionCount:-1}}, {$skip: skip}, {$limit: limit},function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            if(data.reportType=="im_report_session_seoKeywords") {
                //返回的是object,需要做处理
                docs.forEach(function (doc) {
                    doc.seoSource = doc._id.seoSource;
                    if(doc.seoSource=="undefined"||doc.seoSource==undefined){
                        doc.seoSource="---";
                    }
                    doc._id = doc._id._id;
                });
            }
            result.data = docs;
            callback(result);
        });
    }
};

function timeHandler(data) {
    var query;
    if(data.query) {
        query = data.query;
    }else{
        query = data;
    }

    if (query.timeType === 'other_half_hour') {
        var startDate;
        var startTime;
        var endDate;
        var endTime;
        if (query.StartTime) {
            startDate = query.StartTime.split(' ')[0];
            startTime = query.StartTime.split(' ')[1];
        }
        if (query.EndTime) {
            endDate = query.EndTime.split(' ')[0];
            endTime = query.EndTime.split(' ')[1];
        }

        // 开始日期小于2016-10-12且开始时间不为00:00
        var bool1 = startDate < '2016-10-12' && startTime !== '00:00';
        // 开始日期小于2016-10-12且开始时间为00:00，结束日期大于等于2016-10-12且结束时间不为00:00
        var bool2 = startDate < '2016-10-12' && startTime === '00:00' && endDate >= '2016-10-12' && endTime !== '00:00';
        // 结束日期小于2016-10-12且开始时间不为00:00
        var bool3 = endDate < '2016-10-12' && endTime !== '00:00';

        if (bool1 || bool2 || bool3) {
            return '2016年10月12日之前的数据不支持精确到半小时的查询，请在查询2016年10月12日之前的数据时将时间修改为YYYY-MM-DD 00:00';
        }
    }

    return undefined;
}