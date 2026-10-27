var handlerDir = __baseDir + '/report';
var logger = require("appLog");
var utils = require('appUtil/Utils');
var imReportHandler = require(handlerDir + '/IMReportHandler');
var mailReportHandler = require(handlerDir + '/MailReportHandler');
var customerReportHandler = require(handlerDir + '/CustomerReportHandler');
var businessReportHandler = require(handlerDir + '/BusinessReportHandler');
var qualitycheckHandler = require(handlerDir + '/QualitycheckHandler');
var quesReportHandler = require(handlerDir + '/QuesReportHandler');
var salesReportHandler = require(handlerDir + '/bill/SalesReportHandler');
var operationReportHandler = require(handlerDir + '/bill/OperationReportHandler');
var channelProxyReportHandler = require(handlerDir + '/bill/ChannelProxyReportHandler');
var maintenanceReportHandler = require(handlerDir + '/bill/MaintenanceReportHandler')
var actions =  {
    imReport:{
        queryImMessageReport: imReportHandler.queryImMessageReport,  //在线客服消息报表
        queryImBusinessAnalyseReport: imReportHandler.queryImBusinessAnalyseReport, //在线客服业务分析报表
        queryImAgentReport: imReportHandler.queryImAgentReport, //在线客服坐席工作量报表,
        queryImCsrReport: imReportHandler.queryImCsrReport, //在线客服坐席满意度报表,
        queryImChannelCsrReport: imReportHandler.queryImChannelCsrReport, //在线客服渠道满意度报表,
        queryImSessionTimeReport: imReportHandler.queryImSessionTimeReport, //在线客服坐席满意度报表
        queryImSessionFromReport: imReportHandler.queryImSessionFromReport  // 在线客服来源分析报表
    },

    mailReport:{
        queryMailAgentReport: mailReportHandler.queryMailAgentReport, //邮件客服坐席工作量报表,
    },

    customerReport:{
        queryCustomerIncreaseReport: customerReportHandler.queryCustomerIncreaseReport, //客户分析报表
        queryCustomerStatusReport: customerReportHandler.queryCustomerStatusReport,
        queryChangeLogReport: customerReportHandler.queryChangeLogReport,
        queryCustomerSaleAgentReport: customerReportHandler.queryCustomerSaleAgentReport,
        queryCustomerSaleReport: customerReportHandler.queryCustomerSaleReport,
        queryCustomerCommonReport:customerReportHandler.queryCustomerCommonReport,
        queryCustomerCommonAgentReport:customerReportHandler.queryCustomerCommonAgentReport
    },

    businessReport:{
        queryBusinessAnalyseReport: businessReportHandler.queryBusinessAnalyseReport, //工单整体分析
        queryBusinessAgentReport: businessReportHandler.queryBusinessAgentReport  //工单的座席工作量报表
    },
    workbench: {
        queryAgentWorkbenchReport: imReportHandler.queryAgentWorkbenchReport
    },
    monitor: {
        queryMonitorInitData: imReportHandler.queryMonitorInitData
    },
    bill :{
        sales : {
            querySalesCheckReport : salesReportHandler.querySalesCheckReport,//销售考核报表
            exportSalesCheckReport : salesReportHandler.exportSalesCheckReport,//导出销售考核报表
            querySalesPersonalReport : salesReportHandler.querySalesPersonalReport, //销售个人报表
            exportSalesPersonalReport : salesReportHandler.exportSalesPersonalReport, //导出销售个人报表
        },
        operation : {
            queryMonthReport : operationReportHandler.queryMonthReport,//运营月报
            exportMonthReport: operationReportHandler.exportMonthReport,//导出月报
            queryConsumeReport : operationReportHandler.queryConsumeReport, //消费分析报表
            exportConsumeReport : operationReportHandler.exportConsumeReport,//导出消费分析报表
            queryAccountPayChargeReport : operationReportHandler.queryAccountPayChargeReport, //账户充值消费报表
            exportAccountPayChargeReport : operationReportHandler.exportAccountPayChargeReport,//账户充值消费报表
        },
        proxy: {
            queryChannelAllReport : channelProxyReportHandler.queryChannelAllReport,//渠道整体报表
            exportChannelAllReport : channelProxyReportHandler.exportChannelAllReport,//导出渠道整体报表
            queryChannelAnalyseReport : channelProxyReportHandler.queryChannelAnalyseReport,//渠道分析报表
            exportChannelAnalyseReport : channelProxyReportHandler.exportChannelAnalyseReport,//渠道分析报表
        },
        maintenance: {
            queryMaintenanceTeletrafficReport : maintenanceReportHandler.queryMaintenanceTeletrafficReport,//查询话务量报表
            exportMaintenanceTeletrafficReport : maintenanceReportHandler.exportMaintenanceTeletrafficReport,//导出话务量报表
        },
    },
    qualitycheck:{
        queryCycleReport : qualitycheckHandler.queryCycleReport
    },
    quesReport:{
        queryQuesResultReport: quesReportHandler.queryQuesResultReport, //问卷调查回访状态报表
        queryQuesAnwserReport:quesReportHandler.queryQuesAnwserReport
    }
};

exports.handleAction = function (action, res) {
    try {
        var actionFun = eval('actions.' + action.name);
        if (actionFun) {
            actionFun(action.data, function (result,isExport) {
                result.success = result.success || false;
                result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                if(!isExport) {
                    utils.sendResult(result, res, action._aid);
                }else{
                    utils.sendExcel(result,res,action._aid);
                }
            });
        } else {
            processUnknowAction(action, res);
        }

    } catch (e) {
        logger.app.error(e.stack);
        utils.sendResult({success: false, message: e.message}, res);
    }
}

function processUnknowAction(action, res) {
    var result = {};
    result.success = false;
    result.message = 'action[' + action.name + '] is not support!';
    utils.sendResult(result, res, action._aid);
}

