/**
 * Created by jinjiaji on 2016-07-03.
 */
var logger = require("appLog");
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fields = require('../common/Fields');
var reportHandler = require('./ReportHandler');
var config = require('../serverConfig.json');
var reportUtils = require('../common/ReportUtils');
var Then = require('thenjs');


exports.queryQuesResultReport = function (data, callback) {
    var result = {success: false};
    var query = {};
    if (data.query) {
        query = data.query;
    } else {
        query = data;
    }
    var condition = {};
    //根据自定义的返回结果拼出表头
    Then(function (cont) {
        //封装condition
        condition = getReportTimeID(data);
        condition.temp_id = query.temp_id;
        getBatchNoList(data, cont);

    }).then(function (cont, batchNos) {
        if (batchNos) {
            condition.batchNo = {$in: batchNos};
        }
        //查找模板对应的回访状态
        mongo.appDb("cc").collection("account_questionnaire_temp").findOne({_id: query.temp_id}, cont);
    }).then(function (cont, temp) {
        //表头信息
        var quesResultTableHeader = {
            "Account": "system",
            "Type": "cc_ques_result_report",
            "ReportName": "问卷回访状态报表",
            "Config": []
        };
        var qstatus = temp.qstatus;
        var order = 1;
        var keys = {};
        var initial = {};
        var qstatusList = [];
        for (var item in qstatus) {
            var displayname = qstatus[item];
            quesResultTableHeader.Config.push({
                "order": order,
                "name": item,
                "displayname": displayname,
                "show": true
            });
            //初始化值
            initial[item] = 0;
            qstatusList.push(item);
            order++;
        }
        initial["_totalResult"] =0;
        result.tableHeader = quesResultTableHeader;
        //累加器，
        var aggregation = function (curr, result) {
            var curResults = curr.results;
            for (var resultId in curResults) {
                result[resultId] += curResults[resultId] || 0;
                result["_totalResult"] += curResults[resultId] || 0;
            }
        };
        //完成器函数
        var finalize = function (result) {
        };
        //聚合函数
        mongo.db().collection("cc_ques_result_report").group(keys, condition, initial, aggregation, finalize, {}, {}, cont);
    }).then(function (cont, docs) {
        docs = docs || [];
        result.data = docs;
        result.success = true;
        callback(result);
    }).fail(function (cont, err) {
        logger.app.error(err);
        callback(result);
    })
};


exports.queryQuesAnwserReport = function (data, callback) {
    var result = {success: false};
    var query = {};
    var reportDatas = {};
    var quesIds = null;
    if (data.query) {
        query = data.query;
    } else {
        query = data;
    }
    var condition = {};
    Then(function (cont) {
        //封装condition
        condition = getReportTimeID(data);
        condition.temp_id = query.temp_id;
        if (query && query.ques_id && query.ques_id.length > 0) {
            condition.quesId = {$in: query.ques_id};
            quesIds = query.ques_id;
        }
        getBatchNoList(data, cont);

    }).then(function (cont, batchNos) {
        if (batchNos) {
            condition.batchNo = {$in: batchNos};
        }
        //查找模板问题
        mongo.appDb("cc").collection("account_questionnaire_question").find({temp_id: query.temp_id}).sort({createTime:1}).toArray(cont);
    }).then(function (cont, quesList) {
        //表头信息
        var keys = {"quesId": 1};
        var initial = {};
        for (var i = 0; i < quesList.length; i++) {
            if (!quesIds || quesIds.indexOf(quesList[i]._id) != -1) {
                var quesAnswerTableHeader = {
                    "Account": "system",
                    "Type": "cc_ques_answer_report",
                    "ReportName": quesList[i].name,
                    "Config": []
                };
                if (quesList[i].anws) {
                    for (var j = 0; j < quesList[i].anws.length; j++) {
                        quesAnswerTableHeader.Config.push({
                            "order": j + 1,
                            "name": quesList[i].anws[j]._id,
                            "displayname": quesList[i].anws[j].answer,
                            "show": true
                        });
                        initial[quesList[i].anws[j]._id] = 0;
                    }
                }
                //封装回访量
                initial["_totalQuesAnswers"]=0;//所有被选答案数相
                initial["_totalQuesSubmitNums"]=0;//回访量
                reportDatas[quesList[i]._id] = {};
                reportDatas[quesList[i]._id].quesId = quesList[i]._id;
                reportDatas[quesList[i]._id].context = quesList[i].context;
                reportDatas[quesList[i]._id].name = quesList[i].name;
                reportDatas[quesList[i]._id].quesAnswerTableHeader = quesAnswerTableHeader;
            }
        }
        //累加器，
        var aggregation = function (curr, result) {
            var anws = curr.anws;
            for (var answerId in anws) {
                result[answerId] += anws[answerId] || 0;
                result["_totalQuesAnswers"] += anws[answerId]|| 0;
            }
            result["_totalQuesSubmitNums"] += curr._totalQuesSubmitNums|| 0;
        };
        //完成器函数
        var finalize = function (result) {
        };
        //聚合函数
        mongo.db().collection("cc_ques_anwser_report").group(keys, condition, initial, aggregation, finalize, {}, {}, function (err, docs) {
            cont(err, docs, quesList);
        });
    }).then(function (cont, docs, quesList) {
        docs = docs || [];
        var quesObj = {};

        for (var i = 0; i < quesList.length; i++) {
            var ques = quesList[i];
            quesObj[ques._id] = [];
            var anws = ques.anws;
            if (anws) {
                for (var j = 0; j < anws.length; j++) {
                    quesObj[ques._id].push(anws[j]._id);
                }
            }
        }


        //把不属于该问题的答案去掉
        for (var i = 0; i < docs.length; i++) {
            var doc = docs[i];
            var quesId = doc.quesId;
            //封装total属性
            if(reportDatas[quesId]){
                reportDatas[quesId]._totalQuesAnswers=doc._totalQuesAnswers;
                reportDatas[quesId]._totalQuesSubmitNums=doc._totalQuesSubmitNums;
                for (var key in doc) {
                    //是否属于该问题
                    var anwsIds = quesObj[quesId];
                    if (anwsIds.indexOf(key) == -1) {
                        delete doc[key];
                    }
                }
                reportDatas[quesId].data = doc;
            }
        }
        result.data = reportDatas;
        result.success = true;
        callback(result);
    }).fail(function (cont, err) {
        logger.app.error(err);
        callback(result);
    })
};


function getBatchNoList(data, callback) {
    //根据创建时间匹配批次号
    var condition = {
        "accountId": data.account,
        "type": "questionnaire",
        "flag": "finish"
    };
    var query = {};
    if (data.query) {
        query = data.query;
    } else {
        query = data;
    }


    if ((query.batchNos && query.batchNos.length > 0) ||
        (query.create_time_begin || query.create_time_end) ||
        (query.batchRemarks && query.batchRemarks.length > 0)) {


        if (query.batchNos && query.batchNos.length > 0) {
            condition.batchNo = {$in: query.batchNos};
        }
        if (query.batchRemarks && query.batchRemarks.length > 0) {
            condition.batchRemark = {$in: query.batchRemarks};
        }
        if (query.create_time_begin) {
            condition.createTime = {};
            condition.createTime.$gte = query.create_time_begin + " 00:00:00";
        }
        if (query.create_time_end) {
            if (!condition.createTime) {
                condition.createTime = {};
            }
            condition.createTime.$lte = query.create_time_end + " 23:59:59";
        }
        mongo.appDb("cc").collection("app_import_task").find(condition).toArray(function (err, docs) {
            if (!err) {
                var list = [];
                for (var i = 0; i < docs.length; i++) {
                    var item = docs[i];
                    if (item) {
                        list.push(item.batchNo);
                    }
                }
                callback(null, list);
            } else {
                callback(err);
            }
        });

    } else {
        callback(null, null);
    }
}

function getReportTimeID(data) {
    var condition = {
        account: data.account
    };
    var query = {};
    if (data.query) {
        query = data.query;
    } else {
        query = data;
    }
    var startArray = new Array();
    var endArray = new Array();
    var startDayID = '';
    var endDayID = '';
    if (query.return_time_begin) {
        startArray = query.return_time_begin.split('-');
        startDayID = startArray[0] + startArray[1] + startArray[2];
    }
    if (query.return_time_end) {
        endArray = query.return_time_end.split('-');
        endDayID = endArray[0] + endArray[1] + endArray[2];
    }
    if (query.return_time_begin && query.return_time_end) {
        condition.dayId = {"$gte": startDayID, "$lte": endDayID};
    } else if (!query.return_time_begin && query.return_time_end) {
        condition.dayId = {"$lte": endDayID};
    } else if (query.return_time_begin && !query.return_time_end) {
        condition.dayId = {"$gte": startDayID};
    }
    return condition;
}