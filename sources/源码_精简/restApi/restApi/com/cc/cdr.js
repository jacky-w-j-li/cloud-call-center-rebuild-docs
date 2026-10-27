/**
 * Created by chenguang on 5/3/16.
 */
var util = require("appUtil/Utils");
var log = require("appLog");
var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");

var service = {
    getById : function(req, res, next){
        var result = {code:'404', message:'cdr not found!'};
        var data = req.params;
        var findAcc = {
            account:data.account,
            product:'cc'
        }
        mongo.ccDb('bill').collection("platform_account_product").findOne(findAcc, function(err, accDoc){
            if (err) {
                result = {code:'400', message:'account not found!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(accDoc){
                var dataDb = accDoc.dataDB;
                var returnDoc = {
                    "CALL_SHEET_ID": 1,
                    "CALL_NO": 1,
                    "STATUS": 1,
                    "DISPOSAL_AGENT": 1,
                    "BEGIN_TIME": 1,
                    "END_TIME": 1,
                    "CALLED_NO": 1,
                    "OFFERING_TIME": 1,
                    "CONNECT_TYPE": 1,
                    "RECORD_FILE_NAME": 1,
                    "CUSTOMER_NAME": 1,
                    "REF_CALL_SHEET_ID": 1,
                    "PBX": 1,
                    "QUEUE_NAME": 1,
                    "FILE_SERVER": 1,
                    "PROVINCE": 1,
                    "DISTRICT": 1,
                    "DISTRICT_CODE": 1,
                    "KEY_TAG": 1,
                    "CALL_TIME_LENGTH": 1,
                    "PREMEDIA_MEMO" : 1,
                    "PREMEDIA_KEY" : 1
                };
                if(data.cdrVar){
                    returnDoc[data.cdrVar] = 1;
                }
                mongo.ccDb(dataDb).collection(data.account+'_c5_call_sheet').findOne({_id:data.callSheetId}, returnDoc, function(err, cdr) {
                    if (err) {
                        result = {code:'400', message:'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    if(cdr){
                        result = {code:'200', message:'200 ok', data:cdr};
                        util.sendResult(result, res, req.id());
                        return;
                    }else{
                        result = {code:'404', message:'cdr not found!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                });
            }else{
                result = {code:'404', message:'account not found!'};
                util.sendResult(result, res, req.id());
                return;
            }
        });
    }
}

module.exports = service;