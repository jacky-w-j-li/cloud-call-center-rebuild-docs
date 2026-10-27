var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig');

var handler = {
    getBatchNoReport: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit || 10;
        delete data['limit'];
        var page = data.page || 1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data || {};
        query.accountId = session.account._id;
        query.type = "faxlist";
        utils.removeEmptyProperty(query);
        mongo.db().collection(constants.DB.user_import_task).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                var batchNos = [];
                var notFounds = {};
                for (var i = 0; i < docs.length; i++) {
                    var obj = docs[i];
                    batchNos.push(obj.batchNo);
                    notFounds[obj.batchNo] = obj.batchNo;
                }
                mongo.db().collection(constants.DB.user_import_task).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        if (count == 0) {
                            result.list = [];
                            result.success = true;
                            callback(result);
                            return;
                        }
                        var condition = {account: session.account._id, batchNo: {$in: batchNos}};
                        var keys = ['batchNo'];
                        var init = {total: 0, called: 0, success: 0, duration: 0, failure: 0};
                        var reduce = function (obj, prev) {
                            var called = obj.called;
                            var reason = obj.reason;
                            var duration = obj.duration || 0;
                            prev['total']++;
                            if (called) {
                                prev['called']++;
                                if (reason == "0") {
                                    prev['success']++;
                                    prev['duration'] += duration;
                                }
                            }
                        };
                        var transferPercent = function (num, total) {
                            var digit = 0 + "%";
                            if (total > 0) {
                                digit = Math.round(num / total * 10000) / 100.00 + "%";
                                //                digit=Math.round(num/total)* 100+"%";
                            }
                            return digit;
                        }
                        mongo.db().collection(constants.DB.platform_autofax).group(keys, condition, init, reduce, function (err, list) {
                            if (!err) {
                                for (var i = 0; i < list.length; i++) {
                                    var item = list[i];
                                    item.failure = item.called - item.success;
                                    item.dealRate = transferPercent(item.success, item.called);
                                    item.finishRate = transferPercent(item.called, item.total);
                                    item.avgCallTime = item.success == 0 ? 0 : Math.round(item.duration / item.success * 100)/100;
                                    delete notFounds[item.batchNo];
                                }
                                for (var k in notFounds) {
                                    var _batchNo = notFounds[k];
                                    var temp = {batchNo: _batchNo, total: 0, called: 0, success: 0, failure: 0, dealRate: '0%', finishRate: '0%', avgCallTime: 0}
                                    list.push(temp);
                                }
                                var sort=function(ary){
                                    var flag = false;
                                    for(var i = 0; i < ary.length -1; i++) {
                                        for(var j = 0; j < ary.length - i -1;j++) {
                                            var a=parseInt(ary[j].batchNo);
                                            var b=parseInt(ary[j+1].batchNo);
                                            if(a<b) {
                                                var temp = ary[j];
                                                ary[j] = ary[j+1];
                                                ary[j+1] = temp;
                                                flag = true;
                                            }
                                        }
                                        if(flag) {
                                            flag = false;
                                        } else {
                                            break;
                                        }
                                    }
                                }
                                sort(list);
                                result.list = list;
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });

    }


};

module.exports = handler;
