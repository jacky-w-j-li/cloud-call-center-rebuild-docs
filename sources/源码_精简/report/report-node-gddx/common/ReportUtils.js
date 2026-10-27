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
function sortByNumber(a, b){
    if (a.reportTime) {
        return new Date(a.reportTime).getTime() - new Date(b.reportTime).getTime();
    } else if (a.hourId) {
        return a.hourId - b.hourId;
    }else if(a.dayId){
        return a.dayId- b.dayId;
    }else if(a.monthId){
        return a.monthId- b.monthId;
    }

}

exports.complementTimeTrendReportData = function(format, data, callback){
    if(format.reportType == "other" || format.reportType == "other_half_hour"){
        data.sort(sortByNumber);
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
    data.sort(sortByNumber);
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
