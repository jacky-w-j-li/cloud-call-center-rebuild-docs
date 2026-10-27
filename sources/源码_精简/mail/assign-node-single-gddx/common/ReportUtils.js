/**
 * Created by zengyx on 16/3/10.
 */

var utils = require('appUtil/Utils');

/**
 * 补充时间趋势报表数据
 * format:{timeKey:'hourId',  reportType: 'day|month|year', sortType: 'asc|desc'}
 * data:[]具体数据
 */
function removeNullObj(data, timeKey){
    var resultData = [];
    for(var i=0; i<data.length; i++){
        if(data[i][timeKey]){
            resultData.push(data[i]);
        }
    }
    return resultData;
}
exports.complementTimeTrendReportData = function(format, data, callback){
    if(format.reportType == "other"){
        callback(data);
        return;
    }
    var timeKey = format.timeKey;
    var reportType = format.reportType;
    data = removeNullObj(data, timeKey);

    if(data.length<=0){
        callback([]);
        return;
    }
    console.log(data);
    var dataItemTemplate = {};
    var item0 = data[0];
    var timePrefix = "";
    var firstTime = item0[timeKey];
    timePrefix = firstTime.substr(0,firstTime.length-2);
    for(var key in item0){
        if(key == timeKey){
            continue;
        }
        dataItemTemplate[key] = 0;
    }
    var resultData = [];
    var copyData = utils.deepClone(data);
    var initTime = "00";

    recircleProcess(resultData, copyData, dataItemTemplate, timePrefix, timeKey, initTime, reportType);
    callback(resultData);
}

function recircleProcess(resultData, copyData, dataItemTemplate, timePrefix, timeKey, initTime,reportType){
    var item = copyData.shift();
    if(!item)return;
    var timeSuffix = "";
    var time = item[timeKey];
    if(time){
        timeSuffix = time.substr(time.length-2);
        var itemTime = item[timeKey];
        var num = parseInt(timeSuffix);
        var initNum = parseInt(initTime);

        if((initNum==0 || initNum == resultData.length) && (reportType == "month" || reportType == "year")){
            initNum = initNum+1;
        }

        if(initNum < resultData.length){
            initNum = initNum +1;
        }
        console.log(initNum +"----"+num+"----"+resultData.length);
        for(var i=initNum; i<num; i++){
            if(resultData.length == num){
                break;
            }
            var item1 = utils.deepClone(dataItemTemplate);
            if(i<10){
                item1[timeKey] = timePrefix + "0"+i;
            }else{
                item1[timeKey] = timePrefix+i;
            }
            resultData.push(item1);
        }

        resultData.push(item);
        initTime = itemTime.substr(time.length-2);
    }
    //最后一个的处理
    if(copyData.length == 0){
        var lastNum = 0;
        var initN = resultData.length;
        if(reportType == "day"){
            lastNum = 23;
            initN = resultData.length;
        }else if(reportType == "month"){

            lastNum = dayNumOfMonth(timePrefix.substr(0,4), timePrefix.substr(4));
            initN = resultData.length+1;
        }else if(reportType == "year"){
            lastNum = 12;
            initN = resultData.length+1;
        }
        for(var i=initN; i<=lastNum; i++){
            var item = utils.deepClone(dataItemTemplate);
            if(i<10){
                item[timeKey] = timePrefix + "0"+i;
            }else{
                item[timeKey] = timePrefix+i;
            }
            resultData.push(item);
        }
    }
    recircleProcess(resultData, copyData, dataItemTemplate, timePrefix, timeKey, initTime, reportType);
}

function dayNumOfMonth(year,month){
    var d = new Date(year,month,0);
    return d.getDate();
}

//var data=[{
//    "hourId": "2016030101",
//    "sessionCount": 1,
//    "robotSessionCount": 1,
//    "convertManualCount": 1,
//    "manualSessionCount": 1
//},
//    {
//        "hourId": "2016030102",
//        "sessionCount": 1,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 1
//    },
//    {
//        "hourId": "2016030104",
//        "sessionCount": 24,
//        "robotSessionCount": 23,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },
//    {
//        "hourId": "2016030119",
//        "sessionCount": 5,
//        "robotSessionCount": 5,
//        "convertManualCount": 4,
//        "manualSessionCount": 4
//    },
//    {
//        "hourId": "2016030120",
//        "sessionCount": 7,
//        "robotSessionCount": 1,
//        "convertManualCount": 1,
//        "manualSessionCount": 7
//    },
//    {
//        "hourId": "2016030123",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    }];
//
//var format={timeKey:'hourId',  reportType: 'day', sortType: 'asc'};
//
//exports.complementTimeTrendReportData(format, data,function(result){
//    for(var i=0; i<result.length; i++){
//        console.log(result[i].hourId+"---"+result[i].sessionCount);
//    }
//});
//
//var data1=[
//    {
//        "dayId": "20160302",
//        "sessionCount": 24,
//        "robotSessionCount": 23,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },
//    {
//        "dayId": "20160303",
//        "sessionCount": 5,
//        "robotSessionCount": 5,
//        "convertManualCount": 4,
//        "manualSessionCount": 4
//    },
//    {
//        "dayId": "20160305",
//        "sessionCount": 7,
//        "robotSessionCount": 1,
//        "convertManualCount": 1,
//        "manualSessionCount": 7
//    },
//    {
//        "dayId": "20160306",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160307",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160308",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160311",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160312",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160313",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160314",
//        "sessionCount": 24545,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160317",
//        "sessionCount": 29,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160318",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160319",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160320",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160321",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160322",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160323",
//        "sessionCount": 228,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160324",
//        "sessionCount": 2656,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160325",
//        "sessionCount": 26,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160326",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160327",
//        "sessionCount": 22,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160328",
//        "sessionCount": 268,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160329",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160330",
//        "sessionCount": 12,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    },{
//        "dayId": "20160331",
//        "sessionCount": 2,
//        "robotSessionCount": 0,
//        "convertManualCount": 0,
//        "manualSessionCount": 0
//    }];
//
//var format1={timeKey:'dayId',  reportType: 'month', sortType: 'asc'};
//
//exports.complementTimeTrendReportData(format1, data1,function(result){
//    for(var i=0; i<result.length; i++){
//        console.log(result[i].dayId+"---"+result[i].sessionCount);
//    }
//});