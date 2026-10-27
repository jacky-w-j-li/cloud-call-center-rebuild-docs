var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir+'/common/Fields');
var excelExporter = require("excel/ExcelExporter");
var Line = require(__baseDir + '/common/models/Line');
var Then = require('thenjs');

var handler = {
    /**
     * 话务量报表
     */
    queryMaintenanceTeletrafficReport : function(data,callback){
        var result = {success : false};

        var condition = _impl._getCondition(data);
        var records = [];

        Then(function(cont){
            _impl._queryMaintenanceTeletrafficReport(condition,function(err,datas){
                if(err){
                    return cont(err);
                }
                records = datas;
                cont();
            });
        })
            .parallel([function(cont){
                //表格数据 手动聚合
                var lines = JSON.parse(JSON.stringify(records));
                var list = [];

                lines.forEach(function(line){
                    var hit = false;
                    list.forEach(function(item){
                        if(item.line == line.line){
                            item.milliseconds += line.milliseconds || 0;
                            hit = true;
                        }
                    });

                    if(!hit){
                        list.push({line: line.line,milliseconds: line.milliseconds || 0});
                    }
                });

                cont(null,list);
            }
                ,function(cont){
                    //图表数据
                    var lines = JSON.parse(JSON.stringify(records));
                    var chartList = [];

                    lines.forEach(function(item){
                        //按年统计时给出每月的数据,其他情况给出每天数据
                        if(data.timeType == 'year'){
                            item.time = item.monthId;
                        }else{
                            item.time = item.dayId;
                        }
                    });

                    //按年统计时给出每月的数据,其他情况给出每天数据
                    if(data.timeType == 'year'){
                        lines.forEach(function(line){
                            var hit = false;
                            chartList.forEach(function(item){
                                if(item.line == line.line && item.monthId == line.monthId){
                                    item.milliseconds += line.milliseconds || 0;
                                    hit = true;
                                }
                            });

                            if(!hit){
                                chartList.push({line: line.line,monthId: line.monthId,time: line.time,milliseconds: line.milliseconds || 0});
                            }
                        });
                    }else{
                        chartList = lines;
                    }

                    cont(null,chartList);
                }])
            .then(function(cont,res){
                var list = res[0];
                var chartList = res[1];

                var getLineName = function(list,lineLines){
                    list.forEach(function(item){
                        var lineLine = lineLines[item.line];
                        if(lineLine && lineLine.name && lineLine.name != ''){
                            item.name = lineLine.name;
                        }else{
                            item.name = item.line;
                        }

                        if(!item.name || item.name == ''){
                            item.name = '未知线路';
                        }
                    });
                }

                Line.findLineLines(function(err,lineLines){
                    if(err){
                        return cont(err);
                    }
                    getLineName(list,lineLines);
                    getLineName(chartList,lineLines);

                    result.success = true;
                    result.list = list;
                    result.chartList = chartList;
                    callback(result);
                });
            })
            .fail(function(){
                callback([]);
            });
    },
    /**
     * 导出话务量报表
     *
     * @param data
     * @param callback
     */
    exportMaintenanceTeletrafficReport : function(data,callback){
        var result = {success: false};
        handler.queryMaintenanceTeletrafficReport(data,function(queryResult){
            if(queryResult.success){
                var datas = queryResult.list;
                _impl._exportMaintenanceTeletrafficReport(datas, function (excelData, success) {
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
    }

}

var _impl = {
    _queryMaintenanceTeletrafficReport : function(condition,cb){
        Then(function(cont) {
            mongo.db().collection(fields.DB_BILL_MAINTENANCE_TELETRAFFIC_REPORT_TABLE).find(condition,{sort:{line:-1,dayId:1}}).toArray(cont);
        })
            .then(function(cont,datas){
                return cb(null,datas || []);
            })
            .fail(function(cont,err){
                return cb(err,[]);
            })
    },
    _exportMaintenanceTeletrafficReport : function(resRecords,callback){
        if(!resRecords){
            callback(null,false);
            return;
        }

        var rows=[];
        for(var i=0;i<resRecords.length;i++){
            var record = resRecords[i];

            var row = [
                record.name,
                record.milliseconds];

            rows.push(row);
        }

        var excelData = excelExporter.export([
            {
                caption: '线路',
                type:'string'
            },
            {
                type:'number',
                caption: '话务量(分钟)',
                beforeCellWrite: function(row,cellData) {
                    return Math.round(cellData/(1000 * 60));
                }
            },
        ].map(function(cell){
            cell.width = 15;
            return cell;
        }),rows);

        var result ={
            excel : excelData,
            excelName : "话务量报表"+".xlsx"
        }
        callback(result,true);
    },
    _getCondition : function (data){
        var condition = {};

        if(data.timeType == 'day'){
            var day = data.day;
            condition.dayId = day.replace(/\-/g,"");
        }else if(data.timeType == 'month'){ //月
            var year = data.year;
            var month = data.month;
            condition.monthId = year+month;
        } else if (data.timeType == 'season'){ //季度
            var year = data.year;
            var season = data.season;
            condition.yearId = year;
            condition.seasonId = season;
        } else if (data.timeType == 'year'){ //年
            var year = data.year;
            condition.yearId = year;
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
                condition.dayId = timeCondition;
            }
        }

        if(data.lines && data.lines.length > 0){
            condition.line = {$in:data.lines};
        }

        return condition;
    },
    _formatTime: function(value){
        if(value.length >= 6){
            value = value.slice(0, 4) + "/" + value.slice(4);
        }
        if(value.length > 7){
            value = value.slice(0,-2) + "/" + value.slice(-2);
        }

        return value;

    }
}

module.exports = handler;