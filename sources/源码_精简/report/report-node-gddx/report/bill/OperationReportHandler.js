/**
 * Created by jackwong on 16/1/14.
 */
var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir+'/common/Fields');
var excelExporter = require("excel/ExcelExporter");
var Account = require(__baseDir + '/common/models/Account');

var handler ={
    queryMonthReport : function(data,callback){
        var result = {success: false};

        var condition ={
            yearId : data.year.toString()
        }
        _impl._queryMonthReportData(condition,function(data){
            result.success = true;
            result.list =data;
            callback(result);
        });
    },

    exportMonthReport : function(data,callback){
        var result = {success: false};
        handler.queryMonthReport(data,function(queryResult){
            if(queryResult.success){
                var datas = queryResult.list;
                _impl._exportMonthReportData(datas, function (excelData, success) {
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
    /**
     * 消费分析报表
     *
     * @param data
     * @param callback
     */
    queryConsumeReport : function(data,callback){
        var result = {success : false};
        var condition = {
            yearId : data.year
        }
        if(data.area && data.area!=''){
            condition.area = data.area;
        }
        _impl._queryConsumeReportData(condition,function(datas){
            result.success = true;
            result.list = datas;

            callback(result);
        })
    },

    /**
     * 导出消费分析报表
     *
     * @param data
     * @param callback
     */
    exportConsumeReport : function(data,callback){
        var result = {success: false};
        handler.queryConsumeReport(data,function(queryResult){
            if(queryResult.success){
                var datas = queryResult.list;
                _impl._exportConsumeReportData(datas, function (excelData, success) {
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

    /**
     * 充值消费报表
     *
     * @param data
     * @param callback
     */
    queryAccountPayChargeReport : function(data, callback){
        var result = {success: false};

        var page = data.page || 1;
        var limit = data.limit || 50;
        var skip = (page - 1) * limit;

        var condition ={};
        var sortCondition = {};

        if(data.account) {
            condition.account = data.account;
            condition.yearId = data.year + '';
        }else{
            condition.monthId = data.year +''+ data.month;
        };

        if(data.sort){
            sortCondition[data.sort] = -1;
        }else{
            sortCondition['pay'] = -1;
        }


        _impl._queryAccountPayChargeReportByPage(condition,sortCondition,skip,limit,function(count,data){
            result.success = true;
            result.count = count;
            result.list = data;
            callback(result);
        });
    },

    /**
     * 导出充值消费报表
     *
     * @param data
     * @param callback
     */
    exportAccountPayChargeReport : function(data, callback){
        var result = {success: false};

        var condition ={};
        var sortCondition = {};
        var singleAccount = false;

        if(data.account) {
            condition.account = data.account;
            condition.yearId = data.year + '';
            singleAccount = true;
        }else{
            condition.monthId = data.year +''+ data.month;
        };

        if(data.sort){
            sortCondition[data.sort] = -1;
        }else{
            sortCondition['pay'] = -1;
        }

        _impl._queryAccountPayChargeReport(condition,sortCondition,function(datas){
            _impl._exportAccountPayChargeReport(datas, singleAccount, function (excelData, success) {
                if (success) {
                    callback(excelData, true);
                } else {
                    callback(result);
                }
            });
        });
    },

}


var _impl ={
    _queryMonthReportData: function (condition,callback){
        mongo.db().collection(fields.DB_BILL_OPER_MONTH_REPORT).find(condition).toArray(function(err,datas){
            if(!err){
                var resRecords = [];
                for(var i=0;i<datas.length;i++){
                    var data = datas[i];
                    var resRecord = {
                        month : data.monthId.splice(4,0,'-'),
                        newAcc : data.newOpenAccCount || 0,
                        lostAcc : data.awayAccCount || 0,
                        newPayAcc : data.newPayAccCount || 0,
                        payAccSum : data.totalPayAccCount || 0,
                        accSum : data.totalAccCount || 0,
                        actualConsume : data.actualConsume || 0,
                        operCost : data.operCost || 0,
                        consumeAcc : data.consumeCount || 0,
                    }
                    if (data.pay){
                        resRecord.payAcc = data.pay.length;
                        resRecord.paySum = 0;
                        for(var k=0;k<data.pay.length;k++){
                            var pay = data.pay[k].pay;
                            resRecord.paySum += pay;
                        }
                    }

                    if(resRecord.accSum && resRecord.accSum!=0){
                        resRecord.payRate = (resRecord.payAccSum/resRecord.accSum) || 0;
                    }

                    resRecords.push(resRecord);
                }

                callback(resRecords || []);
            } else {
                callback([]);
            }
        });
    },
    _exportMonthReportData : function(resRecords,callback){
        if(!resRecords){
            callback(null,false);
            return;
        }

        var rows=[];
        for(var i=0;i<resRecords.length;i++){
            var record = resRecords[i];
            var row = [record.month,record.newAcc,record.lostAcc,record.newPayAcc,
                record.payAcc,record.consumeAcc,record.payAccSum,record.accSum,record.payRate,record.paySum,
                record.actualConsume,record.operCost];

            rows.push(row);
        }

        var excelData = excelExporter.export([
            {
                caption:'月份',
                type:'string',
            },
            {
                caption:'本月新增企业数',
                type:'number'
            },
            {
                caption:'本月流失企业数',
                type:'number'
            },
            {
                caption:'本月新增付费企业数',
                type:'number'
            },
            {
                caption:'本月付费企业数',
                type:'number'
            },
            {
                caption:'本月消费企业数',
                type:'number'
            },
            {
                caption:'付费企业总数',
                type:'number'
            },
            {
                caption:'企业总数',
                type:'number'
            },
            {
                caption:'付费率',
                type:'string',
                beforeCellWrite:function(row, cellData){
                    return Math.round((cellData || 0 )*100).toString()+'%' ;
                }
            },
            {
                caption:'本月充值总金额',
                type:'number',
                beforeCellWrite:function(row,cellData){
                    return cellData/10000;
                }
            },
            {
                caption: '本月实际消费金额',
                type: 'number',
                beforeCellWrite: function (row, cellData) {
                    return cellData / 10000;
                }
            },
            {
                caption:'本月运营成本',
                type:'number',
                beforeCellWrite:function(row,cellData) {
                    return cellData / 10000;
                }
            }
        ],rows);

        var result ={
            excel : excelData,
            excelName : "运营月报"+".xlsx"
        }
        callback(result,true);

    },
    _queryConsumeReportData : function (condition,callback){
        var keys = {monthId:1};
        var initial = {
            totalPayAccCount:0,
            //payAccCount:0,
            newPayAccCount:0,
            //totalPay:0,
            actualConsume:0,
            licenceConsume:0,
            outCallConsume:0,
            smsConsume:0,
            snConsume:0,
            _400Consume:0,
            flowConsume:0,
            voiceConsume:0,
            minConsume:0,
            workPay:0,
            hardwarePay:0,
            tapePay:0,
            otherPay:0,
        };

        var aggregation = function(curr,result){
            result.totalPayAccCount += curr.totalPayAccCount || 0;//付费企业总计.非代理创建企业不计算.

            //var currPayAccCount = 0;
            //if(curr.pay){
            //    currPayAccCount = curr.pay.length || 0;
            //}
            //result.payAccCount += currPayAccCount;//当月付费企业.非代理创建企业不计算

            result.newPayAccCount += curr.newPayAccCount || 0;//新付费企业.非代理创建企业不计算

            //var currTotalPay = 0;
            //if(curr.pay){
            //    for(var i=0;i<curr.pay.length;i++){
            //        var pay = curr.pay[i].pay;
            //        currTotalPay += pay;
            //    }
            //}
            //result.totalPay += currTotalPay;//充值总计

            result.actualConsume += curr.actualConsume || 0;//实际消费总计

            result.licenceConsume += curr.licenceConsume || 0;//Licence费用

            var currOutCallConsume = 0;
            var curr400Consume = 0;
            if(curr.callConsume){
                for(var i=0;i<curr.callConsume.length;i++){
                    var productCallConsume = curr.callConsume[i];
                    if(!productCallConsume){
                        continue;
                    }
                    if(productCallConsume.product == 'zj'|| productCallConsume.product == 'cc'){
                        currOutCallConsume += productCallConsume.callConsume || 0;
                    }else{
                        curr400Consume += productCallConsume.callConsume || 0;
                    }
                }
            }
            result.outCallConsume += currOutCallConsume || 0;//外呼费用

            result.smsConsume += curr.smsConsume || 0;//短信费用

            var currServiceNumberPay = 0;
            if(curr.numberPay){
                for(var i=0; i<curr.numberPay.length; i++){
                    currServiceNumberPay += curr.numberPay[i].numberPay || 0;
                }
            }

            var currConcurrentPay = curr.concurrentPay || 0;

            var currRent = 0;
            if(curr.rent){
                for(var i=0; i<curr.rent.length; i++){
                    currRent += curr.rent[i].rent || 0;
                }
            }

            result.snConsume += (currServiceNumberPay +currConcurrentPay + currRent);//号码费用包括: 购买服务号 + 总机增加并发数 + 月租

            result._400Consume += curr400Consume;//400呼入费用

            result.flowConsume += curr.flowConsume || 0;//流量费用

            result.voiceConsume += curr.voiceConsume || 0;//语音验证码费用

            var currMinConsume = 0;
            if(curr.minConsume){
                for(var i=0; i<curr.minConsume.length; i++){
                    currMinConsume += curr.minConsume[i].minConsume || 0;
                }
            }

            result.minConsume += currMinConsume;// 低消费用

            result.workPay += curr.workPay || 0;//实施费用

            result.hardwarePay += curr.hardwarePay || 0;//硬件费用

            result.tapePay += curr.tapePay || 0;//录音费用

            result.otherPay += curr.otherPay || 0;//其他费用
        }

        var finalize = function(result){
        };
        mongo.db().collection(fields.DB_BILL_SALES_AREA_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err , datas){
            if(!err) {
                callback(datas || []);
            }else {
                callback([]);
            }
        });

    },
    _exportConsumeReportData : function(resRecords,callback){
        if(!resRecords){
            callback(null,false);
            return;
        }

        var rows=[];
        for(var i=0;i<resRecords.length;i++){
            var record = resRecords[i];

            var row = [record.monthId,record.totalPayAccCount,record.newPayAccCount,
                record.actualConsume,record.licenceConsume,record.outCallConsume,record.smsConsume,record.snConsume,
                record._400Consume,record.flowConsume,record.voiceConsume,record.minConsume,record.workPay,record.hardwarePay,record.tapePay,record.otherPay];

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
                caption: '总付费企业数'
            },
            //{
            //    type:'number',
            //    caption: '本月付费企业数'
            //},
            {
                type:'number',
                caption: '本月新增付费企业数',
            },
            //{
            //    type : 'number',
            //    caption: '本月充值金额',
            //    beforeCellWrite: function (row, cellData) {
            //        return cellData/10000;
            //    }
            //},

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
            excelName : "消费分析月报.xlsx"
        }
        callback(result,true);

    },
    _queryAccountPayChargeReport : function(condition,sortCondition,callback){
        mongo.db().collection(fields.DB_BILL_OPER_ACCOUNT_PAY_CHARGE_REPORT).find(condition,{
            sort:sortCondition,
        }).toArray(function(err,datas){
            if(!err) {
                var resRecords = [];
                var accountIds = [];
                for (var i = 0; i < datas.length; i++) {
                    var data = datas[i];
                    var resRecord = {};
                    resRecord.order = i+1;
                    resRecord.month = data.monthId;
                    resRecord.account = data.account;
                    resRecord.actualConsume = data.actualConsume || 0;
                    resRecord.pay = data.pay || 0;
                    resRecord.totalPay = data.totalPay || 0;
                    resRecord.totalConsume = data.totalConsume || 0;
                    resRecord.currBalance = data.currBalance || 0;

                    resRecords.push(resRecord);
                    accountIds.push(data.account);
                }

                Account.findSomeAccounts(accountIds,function(err,accounts){
                    if(!err){
                        resRecords.forEach(function(record){
                            accounts.forEach(function(account){
                                if(record.account == account._id){
                                    record.accountName = account.name;
                                    record.accountCompanyName = account.companyName;
                                }
                            });
                        });
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
    _queryAccountPayChargeReportByPage : function(condition,sortCondition,skip,limit,callback){
        _impl._countAccountPayChargeReport(condition,function(err,count){
            if(err){
                return callback(0,[]);
            }

            mongo.db().collection(fields.DB_BILL_OPER_ACCOUNT_PAY_CHARGE_REPORT).find(condition,{
                sort:sortCondition,
                limit:limit,
                skip:skip
            }).toArray(function(err,datas){
                if(!err) {
                    var resRecords = [];
                    var accountIds = [];
                    for (var i = 0; i < datas.length; i++) {
                        var data = datas[i];
                        var resRecord = {};
                        resRecord.order = skip+i+1;
                        resRecord.month = data.monthId;
                        resRecord.account = data.account;
                        resRecord.actualConsume = data.actualConsume || 0;
                        resRecord.pay = data.pay || 0;
                        resRecord.totalPay = data.totalPay || 0;
                        resRecord.totalConsume = data.totalConsume || 0;
                        resRecord.currBalance = data.currBalance || 0;

                        resRecords.push(resRecord);
                        accountIds.push(data.account);
                    }

                    Account.findSomeAccounts(accountIds,function(err,accounts){
                        if(!err){
                            resRecords.forEach(function(record){
                               accounts.forEach(function(account){
                                  if(record.account == account._id){
                                      record.accountName = account.name;
                                      record.accountCompanyName = account.companyName;
                                  }
                               });
                            });
                            callback(count,resRecords||[]);
                        }else{
                            callback(0,[]);
                        }
                    })
                }else{
                    callback(0,[]);
                }
            });
        });
    },

    _countAccountPayChargeReport : function(condition,callback){
        mongo.db().collection(fields.DB_BILL_OPER_ACCOUNT_PAY_CHARGE_REPORT).count(condition,function(err,count){
            if(err){
                return callback(err);
            }
            return callback(null,count);
        });
    },
    _exportAccountPayChargeReport : function(resRecords,singleAccount,callback){
        if(!resRecords){
            callback(null,false);
            return;
        }

        var rows=[];
        var cellConf = [
            {
                type:'number',
                caption: '排名'
            },
            {
                type:'number',
                caption:'月份',
                beforeCellWrite: function(row, cellData){
                    return  cellData.substr(-2,2);
                }
            },
            {
                type: 'string',
                caption: '账户编号'
            },
            {
                type: 'string',
                caption: '账户名称'
            },
            {
                type: 'string',
                caption: '公司名称'
            },
            {
                type : 'number',
                caption: '本月充值',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '本月消费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '累计充值',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '累计消费',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '余额',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
        ].map(function(cell){
            cell.width = 15;
            return cell;
        });
        if(!singleAccount) {
            cellConf.splice(1,1);
        }

        for(var i=0;i<resRecords.length;i++){
            var record = resRecords[i];

            var row = [record.order,record.month,record.account,record.accountName,record.accountCompanyName,record.pay,record.actualConsume,record.totalPay,record.totalConsume,record.currBalance];
            if(!singleAccount){
                row.splice(1,1);
            }

            rows.push(row);
        }

        var excelData = excelExporter.export(cellConf,rows);

        var result ={
            excel : excelData,
            excelName : "账户充值消费报表.xlsx"
        }
        callback(result,true);
    },

}



if (!String.prototype.splice) {
    /**
     * {JSDoc}
     *
     * The splice() method changes the content of a string by removing a range of
     * characters and/or adding new characters.
     *
     * @this {String}
     * @param {number} start Index at which to start changing the string.
     * @param {number} delCount An integer indicating the number of old chars to remove.
     * @param {string} newSubStr The String that is spliced in.
     * @return {string} A new string with the spliced substring.
     */
    String.prototype.splice = function(start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}

module.exports = handler;