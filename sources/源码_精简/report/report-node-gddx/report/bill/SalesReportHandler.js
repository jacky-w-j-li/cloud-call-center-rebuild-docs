var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir+'/common/Fields');
var excelExporter = require("excel/ExcelExporter");
var buzUtils = require(__baseDir+'/common/BuzUtils');
var Account = require(__baseDir + '/common/models/Account');
var Then = require('thenjs');

var handler = {
    /**
     * 销售考核报表
     * @param data
     * @param callback
     */
    querySalesCheckReport : function (data , callback){
        var result = {success: false};
        var conditon = _impl._getTimeCondition(data);

        if(data.user){
            conditon.user = data.user;
            _impl._queryReportUserData(conditon,function(datas){
                result.success = true;
                result.list = datas;
                callback(result);
            });
        } else {
            if(data.leader){
                _impl._getUserAllLower(data.leader,function(ids){
                    conditon.user = {$in:ids}
                    _impl._queryReportData(conditon,function(datas){
                        result.success = true;
                        result.list = datas;
                        callback(result);
                    });
                });
            }
            else if(data.area){//需要过滤地域
                _impl._getAreaUsers(data.area,function(ids){
                    conditon.user = {$in:ids}
                    _impl._queryReportData(conditon,function(datas){
                        result.success = true;
                        result.list = datas;
                        callback(result);
                    });
                });
            } else {
                var condition = {
                    identity : 'proxy',
                    status : 'enable',
                    realPrxoy: {$in:[null,'']}
                };
                if(!data.withChannels){
                    condition.proxyType = {$nin:['other','channel']};
                }

                _impl._getProxyUsers(condition,function(ids){
                    conditon.user = {$in:ids}
                    _impl._queryReportData(conditon,function(datas){
                        result.success = true;
                        result.list = datas;
                        callback(result);
                    });
                });
            }
        }
    },
    /**
     * 导出销售考核报表
     *
     * @param data
     * @param callback
     */
    exportSalesCheckReport : function(data,callback){
        var result = {success: false};
        handler.querySalesCheckReport(data,function(queryResult){
            if(queryResult.success){
                var datas = queryResult.list;
                _impl._exportCheckReport(datas, function (excelData, success) {
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
     * 销售个人报表
     *
     * @param data
     * @param callback
     */
    querySalesPersonalReport : function(data,callback){
        var result = {success: false};
        var conditon = _impl._getTimeCondition2(data);
        if(data.area){//需要过滤地域
            _impl._getAreaUsers(data.area,function(ids){
                conditon.userId = {$in:ids}
                _impl._queryPersonalReport(conditon,function(datas){
                    result.success = true;
                    result.list = datas;
                    callback(result);
                });
            });
        } else {
            var condition = {
                identity : 'proxy',
                status : 'enable',
                realProxy: {$in:[null,'']}
            };
            if(!data.withChannels){
                condition.proxyType = {$nin:['other','channel']};
            }
            _impl._getProxyUsers(condition,function(ids){
                conditon.userId = {$in:ids};
                _impl._queryPersonalReport(conditon,function(datas){
                    result.success = true;
                    result.list = datas;
                    callback(result);
                });
            });
        }
    },

    /**
     * 导出销售个人报表
     *
     * @param data
     * @param callback
     */
    exportSalesPersonalReport : function(data,callback){
        var result = {success: false};
        handler.querySalesPersonalReport(data,function(queryResult){
            if(queryResult.success){
                var datas = queryResult.list;
                _impl._exportPersonalReport(datas, function (excelData, success) {
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
};


var _impl = {
    _queryReportUserData : function (condition , callback){
        Then(function(cont) {
            mongo.db().collection(fields.DB_BILL_SALES_CHECK_REPORT).find(condition).toArray(cont);
        })
            .then(function(cont,datas){
                Then()
                    .eachLimit(datas,function(cont_,data){
                        _impl._processTurnUsingAccount(data.turnUsingAccount,function(turnUsingAccount){
                            data.turnUsingAccount = turnUsingAccount;
                            cont_(null,data);
                        })
                    },5)
                    .then(function(cont_,datas){
                        cont(null,datas);
                    });
                })
            .then(function(cont,datas){
                callback(datas || []);
            })
            .fail(function(){
                callback([]);
            })
        //mongo.db().collection(fields.DB_BILL_SALES_CHECK_REPORT).find(condition).toArray(function(err,datas){
        //    if(!err){
        //        //_impl._processDateData(datas || []);
        //        callback(datas||[]);
        //    } else {
        //        callback([]);
        //    }
        //});
    },
    _queryReportData : function (condition,callback){
        var keys = {user: 1};
        var initial = {
            create: 0,
            turnUsing: 0,
            newPay: 0,
            oldPay: 0,
            systemPayCount: 0,
            hardWarePayCount: 0,
            turnUsingAccount: [],
        };
        var aggregation = function (curr, result) {
            result.create += curr.create || 0;
            result.turnUsing += curr.turnUsing || 0;
            result.newPay += curr.newPay || 0;
            result.oldPay += curr.oldPay || 0;
            result.systemPayCount += curr.systemPayCount || 0;
            result.hardWarePayCount += curr.hardWarePayCount || 0;
            result.turnUsingAccount = result.turnUsingAccount.concat(curr.turnUsingAccount || []);
        };
        var finalize = function(result){
        };

        Then(function(cont) {
            mongo.db().collection(fields.DB_BILL_SALES_CHECK_REPORT).group(keys, condition, initial, aggregation, finalize, {}, {}, cont)
        })
            .then(function(cont,datas){
                Then()
                    .eachLimit(datas,function(cont_,data){
                        _impl._processTurnUsingAccount(data.turnUsingAccount,function(turnUsingAccount){
                            data.turnUsingAccount = turnUsingAccount;
                            cont_(null,data);
                        })
                    },5)
                    .then(function(cont_,datas){
                        cont(null,datas);
                    });
            })
            .then(function(cont,datas){
                callback(_impl._processCountData(datas || []));
            })
            .fail(function(){
                callback([]);
            });

        //mongo.db().collection(fields.DB_BILL_SALES_CHECK_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err , datas){
        //    if(!err){
        //        callback(_impl._processCountData(datas || []));
        //    } else {
        //        callback([]);
        //    }
        //});
    },
    _processDateData : function(datas,defaultValue){
        datas = datas || [];
        for(var i=0;i<datas.length;i++){
            datas[i].date = datas[i].day || defaultValue;
        }
    },
    _processCountData : function (datas){
        var countData = {
            user:"总计数据",
            create: 0,
            turnUsing: 0,
            newPay: 0,
            oldPay: 0,
            systemPayCount: 0,
            hardWarePayCount: 0,
            turnUsingAccount: [],
        };
        for(var i=0;i<datas.length;i++){
            countData.create += Number(datas[i].create);
            countData.turnUsing += Number(datas[i].turnUsing);
            countData.newPay += Number(datas[i].newPay);
            countData.oldPay += Number(datas[i].oldPay);
            countData.systemPayCount += Number(datas[i].systemPayCount);
            countData.hardWarePayCount += Number(datas[i].hardWarePayCount);
        }
        datas.push(countData);
        return datas;
    },
    _processTurnUsingAccount : function(datas,cb){
        if(datas == null || datas.length == 0){
            return cb(null);
        }

        var turnUsingAccount = [];
        for(var i=0; i<datas.length; i++){
            var account = datas[i];
            account.newSignFlag = account.newSign ? 1 : -1;
            turnUsingAccount.push(account);
            for(var k=i + 1; k < datas.length; k++){
                if(account.account == datas[k].account){
                    account.newSignFlag += datas[k].newSign ? 1 : -1;
                    datas.splice(k,1);
                    k--;
                }
            }
        }

        turnUsingAccount = turnUsingAccount.filter(function(item){
            return item.newSignFlag && item.newSignFlag != 0;
        });

        var accountIds = [];
        turnUsingAccount.forEach(function(item){
            accountIds.push(item.account);
        });
        Account.findSomeAccountAccounts(accountIds,function(err,accountAccounts){
            if(err){
                return cb(null);
            }
            turnUsingAccount.forEach(function(item){
                var account = accountAccounts[item.account];
                item.accountName = account.name;
                item.accountCompanyName = account.companyName;
            });

            return cb(turnUsingAccount);
        });
    },
    _getAreaUsers : function (area , callback){
        var ids = [];
        var condition = {
            proxyType : area,
            identity : 'proxy',
            status : 'enable',
            realProxy : {$in:[null,'']}
        };
        mongo.appDb("bill").collection(fields.DB_BILL_SYSTEM_USER).find(condition,{_id:1}).toArray(function(err , users){
            if(!err){
                users = users || [];
                for(var i=0;i<users.length;i++){
                    ids.push(users[i]._id);
                }
                callback(ids);
            } else {
                callback(ids);
            }
        });
    },
    _getProxyUsers : function(condition , callback){
        var ids = [];
        mongo.appDb("bill").collection(fields.DB_BILL_SYSTEM_USER).find(condition,{_id:1}).toArray(function(err , users){
            if(!err){
                users = users || [];
                for(var i=0;i<users.length;i++){
                    ids.push(users[i]._id);
                }
                callback(ids);
            } else {
                callback(ids);
            }
        });
    },
    _getUserAllLower : function (userId , callback){
        mongo.appDb("bill").collection(fields.DB_BILL_SYSTEM_USER).find({status:'enable',identity:"proxy",parent:{$nin:[null,'']}},{fields:{_id:1,parent:1}}).toArray(function(err , users){
            var result = [userId];
            if(!err){
                users = users || [];
                var getUserLower = function (uid){
                    for(var i=0;i<users.length;i++){
                        var obj = users[i];
                        if(obj.parent == uid){
                            result.push(obj._id);
                            getUserLower(obj._id);
                        }
                    }
                }
                getUserLower(userId);
                callback(result);
            } else {
                callback(result);
            }

        });
    },
    _getTimeCondition : function (data){
        var condition = {};
        if(data.timeType == 'month'){ //月
            var year = data.year;
            var month = data.month;
            condition.month = year+month;
        } else if (data.timeType == 'season'){ //季度
            var year = data.year;
            var season = data.season;
            condition.year = year;
            condition.season = season;
        } else if (data.timeType == 'year'){ //年
            var year = data.year;
            condition.year = year;
        } else if (data.timeType == 'custom'){ //自定义
            var begin = data.beginDate || "";
            var end = data.endDate || "";
            var timeCondition = {};
            if(begin){
                begin = begin.replace(/\-/g,"");
                timeCondition.$gte = begin;
            }
            if(end){
                end = end.replace(/\-/g,"");
                timeCondition.$lte = end;
            }
            if(begin || end){
                condition.day = timeCondition;
            }
        }

        return condition;
    },
    _getTimeCondition2 : function (data){
        var condition = {};
        if(data.timeType == 'month'){ //月
            var year = data.year;
            var month = data.month;
            condition.monthId = year+month;
        } else if (data.timeType == 'season'){ //季度
            var year = data.year;
            var season = data.season;
            condition.yearId = year;
            condition.seasonId = season;
        } else { //年 默认
            var year = data.year;
            condition.yearId = year;
        }

        return condition;
    },


    _queryPersonalReport : function(condition,callback){
        var keys = {userId:1};
        var initial = {
            totalPayAccCount:0,
            payAccCount:0,
            newPayAccCount:0,
            totalPay:0,
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

            var currPayAccCount = 0;
            if(curr.pay){
                currPayAccCount = curr.pay.length || 0;
            }
            result.payAccCount += currPayAccCount;//当月付费企业.非代理创建企业不计算

            result.newPayAccCount += curr.newPayAccCount || 0;//新付费企业.非代理创建企业不计算

            var currTotalPay = 0;
            if(curr.pay){
                for(var i=0;i<curr.pay.length;i++){
                    var pay = curr.pay[i].pay;
                    currTotalPay += pay;
                }
            }
            result.totalPay += currTotalPay;//充值总计

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
        mongo.db().collection(fields.DB_BILL_SALES_PERSONAL_REPORT).group(keys,condition,initial,aggregation,finalize,{},{},function(err , datas){
            if(!err) {
                buzUtils.getSystemUserDic(function(err,users){
                    if(!err){
                        for(var i = 0; i<datas.length;i++){
                            var user = users[datas[i].userId];
                            if(user){
                                datas[i].saleName = user.name;
                            }else{
                                //离职人员,不统计
                                datas.splice(i,1);
                                i--;
                            }
                        }
                        callback(datas||[]);
                    }else{
                        callback([]);
                    }
                })

            }else {
                callback([]);
            }
        });

    },
    _exportPersonalReport : function(resRecords,callback){
        if(!resRecords){
            callback(null,false);
            return;
        }

        var rows=[];
        for(var i=0;i<resRecords.length;i++){
            var record = resRecords[i];

            var row = [record.saleName,record.totalPayAccCount,record.payAccCount,record.newPayAccCount,record.totalPay,
                record.actualConsume,record.licenceConsume,record.outCallConsume,record.smsConsume,record.snConsume,
                record._400Consume,record.flowConsume,record.voiceConsume,record.minConsume,record.workPay,record.hardwarePay,record.tapePay,record.otherPay];

            rows.push(row);
        }

        var excelData = excelExporter.export([
            {
                caption: '销售',
                type:'string'
            },
            {
                type:'number',
                caption: '总付费企业数'
            },
            {
                type:'number',
                caption: '付费企业数'
            },
            {
                type:'number',
                caption: '新增付费企业数',
            },
            {
                type : 'number',
                caption: '充值金额(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },

            {
                type : 'number',
                caption: '实际消费(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: 'Licence消费(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '外呼话费(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '短信消费(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '号码消费(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '400话费(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '流量消费(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '语音验证码消费(元)',
                beforeCellWrite: function (row, cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '话费低消',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '实施费用',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '硬件费用',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '录音费用',
                beforeCellWrite: function(row,cellData) {
                    return cellData/10000;
                }
            },
            {
                type : 'number',
                caption: '其他费用',
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
            excelName : "销售个人统计报表"+".xlsx"
        }
        callback(result,true);
    },
    _exportCheckReport:function(resRecords,callback){
            if(!resRecords){
                callback(null,false);
                return;
            }

            buzUtils.getSystemUserDic(function(err,users){
                if(!err){
                    for(var i = 0; i<resRecords.length;i++){
                        var userInfo = users[resRecords[i].user];
                        if(userInfo){
                            resRecords[i].user = userInfo.name;
                        }
                    }
                    var rows=[];
                    for(var i=0;i<resRecords.length;i++){
                        var record = resRecords[i];

                        var row = [
                            record.user,
                            record.create,
                            record.turnUsing,
                            record.newPay,
                            record.oldPay,
                            record.systemPayCount,
                            record.hardWarePayCount];

                        rows.push(row);
                    }

                    var excelData = excelExporter.export([
                        {
                            caption: '销售',
                            type:'string'
                        },
                        {
                            type:'number',
                            caption: '创建客户数'
                        },
                        {
                            type:'number',
                            caption: '签约客户数',
                        },
                        {
                            type : 'number',
                            caption: '新签客户回款',
                            beforeCellWrite: function (row, cellData) {
                                return cellData;
                            }
                        },

                        {
                            type : 'number',
                            caption: '老客户续费回款',
                            beforeCellWrite: function (row, cellData) {
                                return cellData;
                            }
                        },
                        {
                            type : 'number',
                            caption: '系统回款总金额',
                            beforeCellWrite: function (row, cellData) {
                                return cellData;
                            }
                        },
                        {
                            type : 'number',
                            caption: '硬件回款总金额',
                            beforeCellWrite: function (row, cellData) {
                                return cellData;
                            }
                        }
                    ].map(function(cell){
                        cell.width = 15;
                        return cell;
                    }),rows);

                    var result ={
                        excel : excelData,
                        excelName : "销售考核报表"+".xlsx"
                    }
                    callback(result,true);
                }else{
                    callback(null,false);
                }
            })
    }

};

module.exports = handler;
