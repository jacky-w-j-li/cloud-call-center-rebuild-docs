var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var taskDic = require(__baseDir + '/dishui/app/task/TaskHandler');


var handler = {
    queryTaskReport: function (data, session, callback) {
        var result = {success: false};
        var type = data.type;
        delete data.type;
        if(data.report_year){
            data.report_year=parseInt(data.report_year);
        }
        if(data.report_month){
            data.report_month=parseInt(data.report_month);
        }
        if(data.report_day){
            data.report_day=parseInt(data.report_day);
        }
        var condition = {};
        var keys = "";
        var init = {};
        var process = function (obj, prev) {
            var tags = obj.tags;
            for (var i = 0; i < tags.length; i++) {
                var tagsItem = tags[i];
                if (prev[tagsItem]) {
                    prev[tagsItem]++;
                } else {
                    prev[tagsItem] = 1;
                }
            }
        };
        var resultData = [];

        taskDic.getTagsDic(session, function (err, tags) {
            if (!err) {
                for (var tag in tags) {
                    init[tag] = 0;
                }
                switch (type) {
                    case "year":
                        condition = data;
                        keys = 'report_month';
                        for (var i = 1; i <= 12; i++) {
                            var groupData = utils.ObjectUtil.copy(init);
                            groupData.date = i + '月';
                            resultData.push(groupData);
                        }
                        break;
                    case "month":
                        condition = data;
                        keys = 'report_day';
                        var monthDays = new Date(data.report_year, data.report_month, 0).getDate();
                        for (var i = 1; i <= monthDays; i++) {
                            var groupData = utils.ObjectUtil.copy(init);
                            groupData.date = i + '天';
                            resultData.push(groupData);
                        }
                        break;
                    case "custom":
                        var timeCondition = {};
                        if (data.beginTime) {
                            timeCondition['$gte'] = data.beginTime;
                        }
                        if (data.endTime) {
                            timeCondition['$lte'] = data.endTime;
                        }
                        condition.report_date = timeCondition;
                        keys = 'report_date';
                        var beginDate = new Date(data.beginTime);
                        var endDate = new Date(data.endTime);
                        while (beginDate <= endDate) {
                            var groupData = utils.ObjectUtil.copy(init);
                            groupData.date = utils.DateTime.getFormatDateStr(beginDate);
                            resultData.push(groupData);
                            beginDate.setDate(beginDate.getDate() + 1);
                        }
                        break;
                }
                mongo.db(session).collection(session.account.account + fields.DB_TASK).group([keys], condition, init, process, function (err, results) {
                    for (var i = 0; i < results.length; i++) {
                        var resultItem = results[i];
                        impl.updateBusinessData(resultItem, resultData, keys);
                        impl.countBusinessData(resultItem,init);
                    }
                    init.date = "总计";
                    delete init[keys];
                    resultData.push(init);
                    result.success = true;
                    result.data = resultData;
                    callback(result);
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });


    }
};


var impl = {
    updateBusinessData: function (item, array, key) {
        var date = item[key];
        for (var i = 0; i < array.length; i++) {
            var arrayItem = array[i];
            if (arrayItem.date == date || arrayItem.date == date + '月' || arrayItem.date == date + '天') {
                for (var p in item) {
                    if (p != key) {
                        arrayItem[p] = item[p];
                    }
                }
            }
        }
    },
    countBusinessData : function(item,init){
        for(var key in item){
            if(item[key] != 0){
                init[key] +=item[key];
            }

        }
    }
};

module.exports = handler;


