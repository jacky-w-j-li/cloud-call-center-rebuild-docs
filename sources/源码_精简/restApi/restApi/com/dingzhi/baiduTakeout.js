var util = require("appUtil/Utils");
var log = require("appLog");
var mongo = require("appDb/MongoDb");
var httpProvider = require("appHttp");

var service = {
    getCalledNumber: function (req, res, next) {
        var data = req.params;
        var caller = data.callerNumber;
        var callSheetID = data.callSheetID;
        var callee = data.calledNumber;

        if(caller && callee && callSheetID){
            var result = {};
            var cId = 201611001;
            var requestId = req.id();
            var sign = '';
            var timestamp = new Date().getTime();
            var sessionId = callSheetID;
            var callerNumber = caller;
            var calledNumber = callee;
            var diversionNumber = '';
            var domain = 'http://42.123.76.54:39090/ims/api/gd/call';
            var url = domain + '?cId=' + cId + '&requestId=' + requestId + '&sign=' + sign + '&timestamp=' + timestamp +
                '&data={"sessionId":"' + sessionId + '","callerNumber":"' +  callerNumber + '","calledNumber":"' + calledNumber +
                '","diversionNumber":"' + diversionNumber + '"}';

            log.app.info("baiduTakeout: " + callSheetID + " requestUrl: " + url);

            httpProvider.sendGet(url,function(err, resp){
                 if (err || !resp) {
                    result.calledNumber = "error";
                 }
                 var response = JSON.parse(resp.toString());
                 var responseData = response.data;
                 if(responseData.flag == 0 && responseData.toneId == "0" && responseData.calledNumber){
                    result.calledNumber = responseData.calledNumber;
                 }else if(responseData.flag == 1 && responseData.toneId){
                    result.calledNumber = responseData.toneId;
                 }
                 result.callerNumber = responseData.callerNumber;
                 result.recordFlag = responseData.recordFlag.toString();
                 log.app.info("baiduTakeout: " + callSheetID + " Response: " + resp.toString());
                 util.sendResult(result,res,req.id());
                 return next();
             });
        }
    }
};

module.exports = service;