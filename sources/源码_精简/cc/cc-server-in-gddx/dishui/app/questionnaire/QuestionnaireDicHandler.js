var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');



var handler = {
    getQuestionnaireFieldDic : function (session,callback){
        var result = [];
        var accountId = session.user.account;
        var condition = {account: accountId};
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).find(condition).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var i = 0;
                var tempFun = function () {
                    if (i < docs.length) {
                        var doc = docs[i];
                        condition = {temp_id: doc._id};
                        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_FIELD).find(condition).toArray(function (err, fields) {
                            fields = fields || [];
                            result = result.concat(fields);
                            i++;
                            tempFun();
                        });
                    } else {
                        callback(null, result);
                    }
                }
                tempFun();
            } else {
                callback(err);
            }
        });
    },
    getQuestionnaireQues : function (session,callback){
        var result = [];
        var accountId = session.user.account;
        var condition = {account: accountId};

        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).find(condition).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var i = 0;
                var tempFun = function () {
                    if (i < docs.length) {
                        var doc = docs[i];
                        condition = {temp_id: doc._id};
                        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).find(condition).sort({createTime:1}).toArray(function (err, fields) {
                            fields = fields || [];
                            result = result.concat(fields);
                            i++;
                            tempFun();
                        });
                    } else {
                        callback(null, result);
                    }
                }
                tempFun();
            } else {
                callback(err);
            }
        });
    },
    getQuestionnaireTemp : function (session ,callback){
        var result = [];
        var accountId = session.user.account;
        var condition = {account: accountId,status:"enable"};

        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).find(condition).toArray(function(err ,docs){
            if(!err){
                docs = docs || [];
                callback(null , docs);
            } else {
                callback(err);
            }
        });
    },
    getQuestionnaireImportBatchNo :function (session ,callback){
        var result = [];
        var query={};
        query.accountId = session.user.account;
        query.type="questionnaire";
        query.flag="finish";
        var sort = {createTime: -1};
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(query, {sort: sort}).toArray(function (err, docs) {
            if (!err) {
                for(var i=0;i<docs.length;i++){
                    var batchNo = docs[i].batchNo;
                    if(batchNo && batchNo!=""){
                        result.push(docs[i]);
                    }
                }
                callback(null,result);
            } else {
                logger.app.error('getcache getQuestionnaireImportBatchNo error:' + err.stack);
                result.message = 'getcache getQuestionnaireImportBatchNo error!' + err.message;
                callback(null,result);
            }
        });
    },
    getQuestionnaireImportBatchRemark :function (session ,callback){
        var result = [];
        var query={};
        query.accountId = session.user.account;
        query.flag="finish";
        var sort = {createTime: -1};
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(query, {sort: sort}).toArray(function (err, docs) {
            if (!err) {
                for(var i=0;i<docs.length;i++){
                    var batchRemark = docs[i].batchRemark;
                    if(batchRemark && batchRemark!=""){
                        result.push(docs[i]);
                    }
                }
                callback(null,result);
            } else {
                logger.app.error('getcache getQuestionnaireImportBatchRemark error:' + err.stack);
                result.message = 'getcache getQuestionnaireImportBatchRemark error!' + err.message;
                callback(null,result);
            }
        });
    }
}

module.exports = handler;
