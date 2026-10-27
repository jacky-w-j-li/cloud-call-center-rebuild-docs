var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig').conf;

var handler = {
    getUpNf : function(data , callback){
        var result = { success : false};
        result.ccPushUrl = config.ccPushUrl;
        var localTimestamp = data.localTime;
        var diff =0;
        if(localTimestamp){
            diff = new Date().getTime()-localTimestamp;
            result.serverDiffTime=diff;
        }
        result.serverTime = utils.getCurrentDateTime();
        var twoWeeksAgoDate = utils.DateTime.getStartDate(14);
        twoWeeksAgoDate = twoWeeksAgoDate.replace(/-/g,"");
        mongo.db().collection("system_update_config").find({type:"cc_in", date:{$gte:twoWeeksAgoDate}},{sort:{date:-1}}).toArray(function(err , dbConfig){

            if(!err && dbConfig){
                result.success = true;
                result.isNew = true;
                var resultList = [];
                var tempList = [];
                for(var i=0; i<dbConfig.length; i++){
                    var list = dbConfig[i].upFile || [];
                    var date = dbConfig[i].date;
                    for(var j=0; j<list.length; j++){
                        if(tempList.contains(list[j])){
                            continue;
                        }
                        tempList.push(list[j]);
                        resultList.push({js: list[j], date: date});
                    }
                }
                result.list = resultList || [];

                callback(result);
            } else {
                logger.app.error("get update config error!",new Error(""));
                callback(result);
            }
        });
    },

    getSysTime: function(data, callback){
        var result ={};
        var date = new Date();
        result.year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var hour = date.getHours();
        var minites = date.getMinutes();
        var second = date.getSeconds();
        result.month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        result.day = day > 9 ? day : '0' + day;
        result.hour = hour > 9 ? hour : '0' + hour;
        result.minites = minites > 9 ? minites : '0' + minites;
        result.second = second > 9 ? second : '0' + second;
        callback(result);
    }
};


module.exports = handler;


