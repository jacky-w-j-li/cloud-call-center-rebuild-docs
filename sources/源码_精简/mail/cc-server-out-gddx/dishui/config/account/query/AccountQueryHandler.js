var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig').conf;
var http = require('appHttp');


var handler = {
    queryPayRecode: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        data = utils.removeEmptyProperty(data);
        var beginTime = data.beginTime, endTime = data.endTime;
        delete data.beginTime, delete data.endTime;
        var condition = data;
        if (beginTime) {
            condition.date = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (condition.date) {
                condition.date.$lte = endTime + " 23:59:59"
            } else {
                condition.data = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
//        condition.type = "recharge";
        condition.type = {"$in": ["paymentBorrow", "recharge"]};
        var result = {success: false};
        mongo.db().collection("account_balance_log").find(condition, {limit: limit, skip: skip, sort: {date: -1}}).toArray(function (err, logs) {
            if (!err) {
                logs = logs || [];
                mongo.db().collection("account_balance_log").count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;

                        mongo.db().collection("account_balance_log").distinct("account", condition, function (err, ids) {
                            if (!err) {
                                ids = ids || [];
                                mongo.db().collection("app_account").find({_id: {$in: ids}}, {fields: {company: 1, name: 1}}).toArray(function (err, accounts) {
                                    if (!err) {
                                        accounts = accounts || [];
                                        util.processLinkData(logs, accounts, "account");
                                        var countFun = function (obj, prev) {
                                            prev.countNum++;
                                            if (obj.accountBalance) {
                                                prev.countAccount += obj.accountBalance;
                                            }
                                            if (obj.agentBalance) {
                                                prev.countAgent += obj.agentBalance;
                                            }
                                            if (obj.smsBalance) {
                                                prev.countSms += obj.smsBalance;
                                            }
                                            if (obj.callBalance) {
                                                prev.countCall += obj.callBalance;
                                            }
                                            if (obj.borrowBalance) {
                                                prev.countPayment += obj.borrowBalance;
                                            }
                                        };
                                        var init = {countNum: 0, countAccount: 0, countAgent: 0, countSms: 0, countCall: 0, countPayment: 0};
                                        mongo.db().collection("account_balance_log").group([], condition, init, countFun, function (err, results) {
                                            if (!err) {
                                                results[0] = results[0] || init;
                                                results[0].countPay = results[0].countAccount + results[0].countAgent + results[0].countSms + results[0].countCall + results[0].countPayment;
                                                result.countInfo = results[0];
                                                result.list = logs;
                                                result.success = true;
                                                callback(result);
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });

    },
    querySmsRecode: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        data = utils.removeEmptyProperty(data);
        var beginTime = data.beginTime, endTime = data.endTime;
        delete data.beginTime, delete data.endTime;
        var condition = data;
        if (beginTime) {
            condition.date = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (condition.date) {
                condition.date.$lte = endTime + " 23:59:59"
            } else {
                condition.data = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        var result = {success: false};
        mongo.db().collection("account_sms_send").find(condition, {limit: limit, skip: skip, sort: {date: -1}}).toArray(function (err, logs) {
            if (!err) {
                logs = logs || [];
                mongo.db().collection("account_sms_send").count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;

                        mongo.db().collection("account_sms_send").distinct("account", condition, function (err, ids) {
                            if (!err) {
                                ids = ids || [];
                                mongo.db().collection("app_account").find({_id: {$in: ids}}, {fields: {company: 1, name: 1}}).toArray(function (err, accounts) {
                                    if (!err) {
                                        accounts = accounts || [];
                                        util.processLinkData(logs, accounts, "account");
                                        var countFun = function (obj, prev) {
                                            prev.countSendNum += obj.sendNum;
                                            prev.countSmsFee += obj.smsFare;
                                        };
                                        var init = {countSendNum: 0, countSmsFee: 0};
                                        mongo.db().collection("account_sms_send").group([], condition, init, countFun, function (err, results) {
                                            if (!err) {
//                                                results[0].countPay = results[0].countAccount + results[0].countAgent + results[0].countSms + results[0].countCall;
                                                result.countInfo = results[0] || init;
                                                result.list = logs;
                                                result.success = true;
                                                callback(result);
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });

    },
    queryTel400Recode: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        data = utils.removeEmptyProperty(data);
        var beginTime = data.beginTime, endTime = data.endTime, accountName = data.accountName, companyName = data.companyName;
        delete data.beginTime, delete data.endTime , delete data.accountName, delete data.companyName;
        var condition = data;
        if (beginTime) {
            condition.BEGIN_TIME = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (condition.BEGIN_TIME) {
                condition.BEGIN_TIME.$lte = endTime + " 23:59:59"
            } else {
                condition.BEGIN_TIME = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }


        if (accountName || companyName) {
            var accountCondition = {};
            if (accountName) {
                accountCondition.name = new RegExp(accountName);
            }
            if (companyName) {
                accountCondition.company = new RegExp(companyName);
            }
            if (condition.ACCOUNT_ID) {
                accountCondition._id = condition.ACCOUNT_ID;
            }
            mongo.db().collection("app_account").distinct("_id", accountCondition, function (err, accountIds) {
                if (!err) {
                    accountIds = accountIds || [];
                    condition.ACCOUNT_ID = {$in: accountIds};
                    impl.queryTel400RecodeImpl(condition, callback, limit, skip);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });

        } else {
            impl.queryTel400RecodeImpl(condition, callback, limit, skip);
        }
    },
    queryTelRecode: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        data = utils.removeEmptyProperty(data);
        var beginTime = data.beginTime, endTime = data.endTime, accountName = data.accountName, companyName = data.companyName;
        delete data.beginTime, delete data.endTime , delete data.accountName, delete data.companyName;
        var condition = data;
        if (beginTime) {
            condition.BEGIN_TIME = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (condition.BEGIN_TIME) {
                condition.BEGIN_TIME.$lte = endTime + " 23:59:59"
            } else {
                condition.BEGIN_TIME = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }


        if (accountName || companyName || session.user.role == 'proxy') {
            var accountCondition = {};
            accountCondition.proxyUser = session.user._id;
            if (accountName) {
                accountCondition.name = new RegExp(accountName);
            }
            if (companyName) {
                accountCondition.company = new RegExp(companyName);
            }
            if (condition.ACCOUNT_ID) {
                accountCondition._id = condition.ACCOUNT_ID;
            }
            mongo.db().collection("app_account").distinct("_id", accountCondition, function (err, accountIds) {
                if (!err) {
                    accountIds = accountIds || [];
                    condition.ACCOUNT_ID = {$in: accountIds};
                    impl.queryTelRecodeImpl(condition, callback, limit, skip);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });

        } else {
            impl.queryTelRecodeImpl(condition, callback, limit, skip);
        }
    },
    exportTelRecode: function (data, session, callback) {

        data = utils.removeEmptyProperty(data);
        var beginTime = data.beginTime, endTime = data.endTime , accountName = data.accountName, companyName = data.companyName;
        delete data.beginTime, delete data.endTime , delete data.accountName, delete data.companyName;
        var condition = data;
        if (beginTime) {
            condition.BEGIN_TIME = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (condition.BEGIN_TIME) {
                condition.BEGIN_TIME.$lte = endTime + " 23:59:59"
            } else {
                condition.BEGIN_TIME = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        condition.type = "billTelRecord";

        if (accountName || companyName  || session.user.role == 'proxy') {
            var accountCondition = {};
            accountCondition.proxyUser = session.user._id;
            if (accountName) {
                accountCondition.name = new RegExp(accountName);
            }
            if (companyName) {
                accountCondition.company = new RegExp(companyName);
            }
            if (condition.ACCOUNT_ID) {
                accountCondition._id = condition.ACCOUNT_ID;
            }
            mongo.db().collection("app_account").distinct("_id", accountCondition, function (err, accountIds) {
                if (!err) {
                    accountIds = accountIds || [];
                    condition.ACCOUNT_ID = {$in: accountIds};


                    impl.exportTelRecodeImpl(condition, callback);
                } else {
                    logger.app.error(err);
                    callback({success: false});
                }
            });

        } else {
            impl.exportTelRecodeImpl(condition, callback);
        }


    },
    exportTel400Recode: function (data, session, callback) {

        data = utils.removeEmptyProperty(data);
        var beginTime = data.beginTime, endTime = data.endTime , accountName = data.accountName, companyName = data.companyName;
        delete data.beginTime, delete data.endTime , delete data.accountName, delete data.companyName;
        var condition = data;
        if (beginTime) {
            condition.BEGIN_TIME = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (condition.BEGIN_TIME) {
                condition.BEGIN_TIME.$lte = endTime + " 23:59:59"
            } else {
                condition.BEGIN_TIME = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        condition.type = "billTelRecord";

        if (accountName || companyName) {
            var accountCondition = {};
            if (accountName) {
                accountCondition.name = new RegExp(accountName);
            }
            if (companyName) {
                accountCondition.company = new RegExp(companyName);
            }
            if (condition.ACCOUNT_ID) {
                accountCondition._id = condition.ACCOUNT_ID;
            }
            mongo.db().collection("app_account").distinct("_id", accountCondition, function (err, accountIds) {
                if (!err) {
                    accountIds = accountIds || [];
                    condition.ACCOUNT_ID = {$in: accountIds};


                    impl.exportTel400RecodeImpl(condition, callback);
                } else {
                    logger.app.error(err);
                    callback({success: false});
                }
            });

        } else {
            impl.exportTel400RecodeImpl(condition, callback);
        }


    }
};

var impl = {
    exportTelRecodeImpl: function (condition, callback) {
        var result = {success: false};
        var url = config.ccServiceUrl + '?Action=export&Method=billTelRecord&Query=' + JSON.stringify(condition);
        url = encodeURI(url);
        http.sendGet(url, function (err, res) {
            if (!err && res) {
                try {
                    var res = JSON.parse(res);
                    if (res.Succeed) {
                        result.success = true;
                        result.path = res.path;
                        callback(result);
                    } else {
                        callback(result);
                    }
                } catch (e) {
                    callback(e);
                }
            } else {
                var error = err || new Error('request service error!');
                result.message = err.message;
                callback(result);
            }
        });
    },
    exportTel400RecodeImpl: function (condition, callback) {
        var result = {success: false};
        var url = config.ccServiceUrl + '?Action=export&Method=billTel400Record&Query=' + JSON.stringify(condition);
        url = encodeURI(url);
        http.sendGet(url, function (err, res) {
            if (!err && res) {
                try {
                    var res = JSON.parse(res);
                    if (res.Succeed) {
                        result.success = true;
                        result.path = res.path;
                        callback(result);
                    } else {
                        callback(result);
                    }
                } catch (e) {
                    callback(e);
                }
            } else {
                var error = err || new Error('request service error!');
                result.message = err.message;
                callback(result);
            }
        });
    },
    queryTel400RecodeImpl: function (condition, callback, limit, skip) {
        var result = {success: false};
        mongo.db().collection("call_sheet_400_bill_query").find(condition, {limit: limit, skip: skip, sort: {BEGIN_TIME: -1}}).toArray(function (err, cdrs) {
            if (!err) {
                cdrs = cdrs || [];
                mongo.db().collection("call_sheet_400_bill_query").count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        mongo.db().collection("call_sheet_400_bill_query").distinct("ACCOUNT_ID", condition, function (err, ids) {
                            if (!err) {
                                ids = ids || [];
                                mongo.db().collection("app_account").find({_id: {$in: ids}}, {fields: {company: 1, name: 1}}).toArray(function (err, accounts) {
                                    if (!err) {
                                        accounts = accounts || [];
                                        util.processLinkData(cdrs, accounts, "ACCOUNT_ID");
                                        var countFun = function (obj, prev) {
                                            prev.countNum++;
                                            prev.countCallMin += obj.CALL_MINITES;
                                            prev.countCallSec += obj.CALL_TIME_LENGTH;
                                            prev.countCallFare += obj.CALL_FARE;
                                        };
                                        var init = {countNum: 0, countCallMin: 0, countCallSec: 0, countCallFare: 0};
                                        mongo.db().collection("call_sheet_400_bill_query").group([], condition, init, countFun, function (err, results) {
                                            if (!err) {
//                                                results[0].countPay = results[0].countAccount + results[0].countAgent + results[0].countSms + results[0].countCall;
                                                result.countInfo = results[0] || init;
                                                result.list = cdrs;
                                                result.success = true;
                                                callback(result);
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    },
    queryTelRecodeImpl: function (condition, callback, limit, skip) {
        var result = {success: false};
        mongo.db().collection("call_sheet_bill_query").find(condition, {limit: limit, skip: skip, sort: {BEGIN_TIME: -1}}).toArray(function (err, cdrs) {
            if (!err) {
                cdrs = cdrs || [];
                mongo.db().collection("call_sheet_bill_query").count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        mongo.db().collection("call_sheet_bill_query").distinct("ACCOUNT_ID", condition, function (err, ids) {
                            if (!err) {
                                ids = ids || [];
                                mongo.db().collection("app_account").find({_id: {$in: ids}}, {fields: {company: 1, name: 1}}).toArray(function (err, accounts) {
                                    if (!err) {
                                        accounts = accounts || [];
                                        util.processLinkData(cdrs, accounts, "ACCOUNT_ID");
                                        var countFun = function (obj, prev) {
                                            prev.countNum++;
                                            prev.countCallMin += obj.CALL_MINITES;
                                            prev.countCallSec += obj.CALL_TIME_LENGTH;
                                            prev.countCallFare += obj.CALL_FARE;
                                        };
                                        var init = {countNum: 0, countCallMin: 0, countCallSec: 0, countCallFare: 0};
                                        mongo.db().collection("call_sheet_bill_query").group([], condition, init, countFun, function (err, results) {
                                            if (!err) {
//                                                results[0].countPay = results[0].countAccount + results[0].countAgent + results[0].countSms + results[0].countCall;
                                                result.countInfo = results[0] || init;
                                                result.list = cdrs;
                                                result.success = true;
                                                callback(result);
                                            }
                                        });

                                    }
                                });
                            }
                        });

                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    }
}


var util = {
    processLinkData: function (data, linkdata, key) {
        for (var i = 0; i < data.length; i++) {
            var dataItem = data[i];
            for (var j = 0; j < linkdata.length; j++) {
                var linkdataItem = linkdata[j];
                if (dataItem[key] == linkdataItem._id) {
                    for (var linkKey in linkdataItem) {
                        if (linkKey != "_id") {
                            dataItem[linkKey] = linkdataItem[linkKey];
                        }
                    }
                }
            }
        }
    }
}

module.exports = handler;