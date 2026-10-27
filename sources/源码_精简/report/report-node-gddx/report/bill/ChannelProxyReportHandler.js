var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir+'/common/Fields');
var excelExporter = require("excel/ExcelExporter");
var buzUtils = require(__baseDir+'/common/BuzUtils');


var handler ={
    queryChannelAllReport : function(data,callback){
        var result = {success: false};

        var condition ={
            yearId : data.year.toString()
        }
        _impl._queryChannelAllReport(condition,function(data){
            result.success = true;
            result.list =data;
            callback(result);
        });
    },

    exportChannelAllReport : function(data,callback){
        var result = {success: false};
        handler.queryChannelAllReport(data,function(queryResult){
            if(queryResult.success){
                var datas = queryResult.list;
                _impl._exportChannelAllReport(datas, function (excelData, success) {
                    if (success) {
                        callback(excelData, true);
                    } else {
                        callback(result);
                    }
                });
            }else{
                callback(result);
            }
        });
    },
    queryChannelAnalyseReport : function(data,callback){
        var result = {success: false};

        var condition ={
            monthId : data.year.toString() + data.month.toString()
        };
        var sortCondition = {};
        if(data.sort && data.sort == 'actualConsume'){
            sortCondition['actualConsume'] = -1;
        }else{
            sortCondition['totalPay'] = -1;
        }

        _impl._queryChannelAnalyseReport(condition,sortCondition,function(data){
            result.success = true;
            result.list =data;
            callback(result);
        });
    },

    exportChannelAnalyseReport : function(data,callback) {
        var result = {success: false};

        var condition ={
            monthId : data.year.toString() + data.month.toString()
        };

        var sortCondition = {};
        if(data.sort && data.sort == 'actualConsume'){
            sortCondition['actualConsume'] = -1;
        }else{
            sortCondition['totalPay'] = -1;
        }
        _impl._exportChannelAnalyseReport(condition,sortCondition,function (data, success) {
            if (success) {
                callback(data, true);
            } else {
                callback(result);
            }
        });
    }
}


var _impl = {
    _queryChannelAllReport : function(condition,callback){
        mongo.db().collection(fields.DB_BILL_CHANNEL_PROXY_ALL_REPORT).find(condition).toArray(function(err,datas){
                if(!err) {
                    var resRecords = [];
                    for (var i = 0; i < datas.length; i++) {
                        var data = datas[i];
                        var resRecord = {};
                        resRecord.monthId = data.monthId;
                        resRecord.channelTotalCount = data.channelTotalCount || 0;//渠道总数

                        resRecord.payChannelTotalCount = data.payChannelTotalCount || 0;//付费渠道总数

                        var payChannelCount = 0;
                        if(data.proxyPay){
                            payChannelCount = data.proxyPay.length || 0;
                        }
                        resRecord.payChannelCount = payChannelCount;//当月付费渠道总数

                        resRecord.actualConsume = data.actualConsume || 0;//实际消费总计

                        resRecord.licenceConsume = data.licenceConsume || 0;//Licence费用

                        var _OutCallConsume = 0;
                        var _400Consume = 0;
                        if(data.callConsume){
                            for(var k=0;k<data.callConsume.length;k++){
                                var productCallConsume = data.callConsume[k];
                                if(!productCallConsume){
                                    continue;
                                }
                                if(productCallConsume.product == 'zj'|| productCallConsume.product == 'cc'){
                                    _OutCallConsume += productCallConsume.callConsume || 0;
                                }else{
                                    _400Consume += productCallConsume.callConsume || 0;
                                }
                            }
                        }
                        resRecord.outCallConsume = _OutCallConsume || 0;//外呼费用

                        resRecord.smsConsume = data.smsConsume || 0;//短信费用

                        var serviceNumberPay = 0;
                        if(data.numberPay){
                            for(var k=0; k<data.numberPay.length; k++){
                                serviceNumberPay += data.numberPay[k].numberPay || 0;
                            }
                        }

                        var concurrentPay = data.concurrentPay || 0;

                        var rent = 0;
                        if(data.rent){
                            for(var k=0; k<data.rent.length; k++){
                                rent += data.rent[k].rent || 0;
                            }
                        }

                        resRecord.snConsume = (serviceNumberPay +concurrentPay + rent);//号码费用包括: 购买服务号 + 总机增加并发数 + 月租

                        resRecord._400Consume = _400Consume;//400呼入费用

                        resRecord.flowConsume = data.flowConsume || 0;//流量费用

                        resRecord.voiceConsume = data.voiceConsume || 0;//语音验证码费用

                        var minConsume = 0;
                        if(data.minConsume){
                            for(var k=0; k<data.minConsume.length; k++){
                                minConsume += data.minConsume[k].minConsume || 0;
                            }
                        }

                        resRecord.minConsume = minConsume;// 低消费用

                        resRecord.workPay = data.workPay || 0;//实施费用

                        resRecord.hardwarePay = data.hardwarePay || 0;//硬件费用

                        resRecord.tapePay = data.tapePay || 0;//录音费用

                        resRecord.otherPay = data.otherPay || 0;//其他费用

                        resRecords.push(resRecord);
                    }

                    callback(resRecords || []);
                }else{
                    callback([]);
                }
            });
    },

    _exportChannelAllReport : function(resRecords,callback){
        if (!resRecords) {
            callback(null, false);
            return;
        }

        var rows = [];
        for (var i = 0; i < resRecords.length; i++) {
            var record = resRecords[i];
            var row = [record.monthId, record.channelTotalCount, record.payChannelTotalCount, record.payChannelCount,
                record.actualConsume, record.licenceConsume, record.outCallConsume, record.smsConsume, record.snConsume, record._400Consume, record.flowConsume, record.voiceConsume
                ,record.minConsume,record.workPay,record.hardwarePay,record.tapePay,record.otherPay];

            rows.push(row);
        }

        var excelData = excelExporter.export([
            {
                caption: '月份',
                type:'string',
                beforeCellWrite: function (row, cellData) {
                    return cellData.slice(0, 4) + '-' + cellData.slice(4 + Math.abs(0));
                }
            },
            {
                type:'number',
                caption: '渠道总数'
            },
            {
                type:'number',
                caption: '付费渠道总数'
            },
            {
                type:'number',
                caption: '本月付费渠道数',
            },
            {
                type : 'number',
                caption: '本月实际消费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月Licence消费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月外呼话费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月短信消费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月号码消费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月400话费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月流量消费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月语音验证码消费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月话费低消',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月实施费用',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月硬件费用',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月录音费用',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月其他费用',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            }
        ].map(function(cell){
            cell.width = 15;
            return cell;
        }),rows);


        var result ={
            excel : excelData,
            excelName : "渠道整体报表.xlsx"
        }
        callback(result,true);
    },

    _queryChannelAnalyseReport : function(condition,sortCondition,callback){
        mongo.db().collection(fields.DB_BILL_CHANNEL_PROXY_ANALYSE_REPORT).find(condition,{sort:sortCondition}).toArray(function(err,datas){
            if(!err) {
                var resRecords = [];
                for (var i = 0; i < datas.length; i++) {
                    var data = datas[i];
                    var resRecord = {};
                    resRecord.rank = i+1;
                    resRecord.userId = data.userId;
                    resRecord.actualConsume = data.actualConsume || 0;
                    resRecord.totalPay = data.totalPay || 0;

                    resRecords.push(resRecord);
                }

                buzUtils.getSystemUserDic(function(err,users){
                    if(!err){
                        for(var i = 0; i<resRecords.length;i++){
                            if(users[resRecords[i].userId]){
                                resRecords[i].channelName = users[resRecords[i].userId].name;
                            }else{
                                resRecords.splice(i,1);
                                i--;
                            }
                        }
                        callback(resRecords||[]);
                    }else{
                        callback([]);
                    }
                })
            }else{
                callback([]);
            }
        });
    },

    _exportChannelAnalyseReport : function(condition,sortCondition,callback){
        _impl._queryChannelAnalyseReport(condition,sortCondition,function(resRecords) {
            if (!resRecords) {
                callback(null, false);
                return;
            }

            var rows = [];
            for (var i = 0; i < resRecords.length; i++) {
                var record = resRecords[i];
                var row = [record.rank,record.channelName, record.actualConsume, record.totalPay];
                rows.push(row);
            }

            var excelData = excelExporter.export([
                {
                    caption: '排名',
                    type:'number'
                },
                {
                    caption: '渠道名称',
                    type:'string'
                },
                {
                    type:'number',
                    caption: '消费金额',
                    beforeCellWrite: function (row, cellData) {
                        return cellData/10000;
                    }
                },
                {
                    type:'number',
                    caption: '充值金额',
                    beforeCellWrite: function (row, cellData) {
                        return cellData/10000;
                    }
                }
            ].map(function(cell){
                cell.width = 15;
                return cell;
            }),rows);


            var result ={
                excel : excelData,
                excelName : "渠道分析报表"+condition.monthId+".xlsx"
            }
            callback(result,true);
        });
    }
}

module.exports = handler;