var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var utils = require('appUtil/Utils');
var datetime = require('appUtil/DateTime');
var mongo = require('appDb/MongoDb');
var uuid = require('appUtil/UUID');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");

exports.sendSms = function (data, session, callback) {
    var result = {
        success: false
    }
    if (data.sendType == 'template') {
        data.m7Status = "ready";
        data.sign = data.templateSign;
        delete data.templateSign;
    } else {
        data.m7Status = "ready";
        //data.m7Status = "check";
    }
    data._id = uuid.generateUuid();
    data.createUser = session.user._id;
    data.account = session.user.account;
    data.signDisplay = data.sign.substring(data.sign.indexOf('_') + 1, data.sign.length);
    data.sign = data.sign.substring(0, data.sign.indexOf('_'));
    data.submitTime = utils.getCurrentDate();
    data.product = "cc";
    data.type = "send";

    var allText = data.content + data.signDisplay;
    var smsSplitBaseNum = 66;
    if(session.account.smsSplitBaseNum){
        smsSplitBaseNum = session.account.smsSplitBaseNum;
    }
    if (allText.length > smsSplitBaseNum) {
        data.splitCount = parseInt(allText.length / smsSplitBaseNum);
        if (allText.length % smsSplitBaseNum != 0) {
            data.splitCount++;
        }
    } else {
        data.splitCount = 1;
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT).findOne({_id: session.account.account}, function (err, doc) {
        if (err) {
            result.message = "send sms check cc balance failed!";
            callback(result);
            return;
        }
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: session.account._id}, function (err, productDoc) {
            if (err) {
                result.message = "send sms check cc balance failed!";
                callback(result);
                return;
            }
            var smsFee = 1000;
            if (productDoc.smsFee) {
                smsFee = productDoc.smsFee;
            }
            var money = data.splitCount * smsFee;
            var realBalance = doc.balance;
            if (doc.overdraw) {
                realBalance = realBalance + doc.overdraw;
            }
            if (money > realBalance) {
                result.message = "余额不足";
                callback(result);
                return;
            }
            if (data.sendType == 'template') {
                if(data.smsChannel == 'ytx'||data.smsChannel == 'ytxyx'){
                    var query = {_id:data.templateid};
                    mongo.db('bill').collection(fields.DB_YTX_TEMPLATE_ID).findOne(query, function (err,doc) {
                        if(err){
                            result.message = "query ytxid cc db failed!";
                            callback(result);
                        }else{
                            data.ytxtemplateid = doc.ytxtemplateid;
                            mongo.db().collection(fields.DB_APP_SMS_SEND).insert(data, function (err) {
                                if (err) {
                                    result.message = "sms insert cc db failed!";
                                    callback(result);
                                } else {
                                    mongo.db(session).collection(session.user.account + fields.DB_SMS).insert(data, function (nerr) {
                                        if (nerr) {
                                            result.message = "sms insert account_sms db failed!";
                                        } else {
                                            result.success = true;
                                        }
                                        callback(result);
                                    });
                                }
                            });
                        }
                    });
                }else{
                    mongo.db().collection(fields.DB_APP_SMS_SEND).insert(data, function (err) {
                        if (err) {
                            result.message = "sms insert cc db failed!";
                            callback(result);
                        } else {
                            mongo.db(session).collection(session.user.account + fields.DB_SMS).insert(data, function (nerr) {
                                if (nerr) {
                                    result.message = "sms insert account_sms db failed!";
                                } else {
                                    result.success = true;
                                }
                                callback(result);
                            });
                        }
                    });
                }
            } else {
                mongo.db('bill').collection(fields.DB_PLATFORM_SMS_CHANNEL).findOne({forceSelect: true}, function (err, doc) {
                    if (doc) {
                        data.smsChannel = doc._id;
                    } else {
                        if (session.account.smsChannel) {
                            data.smsChannel = session.account.smsChannel;
                        } else {
                            data.smsChannel = 'gdty';
                        }
                    }
                    mongo.db().collection(fields.DB_APP_SMS_SEND).insert(data, function (err) {
                        if (err) {
                            result.message = "sms insert cc db failed!";
                            callback(result);
                        } else {
                            mongo.db(session).collection(session.user.account + fields.DB_SMS).insert(data, function (nerr) {
                                if (nerr) {
                                    result.message = "sms insert account_sms db failed!";
                                } else {
                                    result.success = true;
                                }
                                callback(result);
                            });
                        }
                    });
                })
            }
        });
    });
}

exports.queryMySms = function (data, session, callback) {
    var result = {success: false};
    var sort = {submitTime: -1};
    var begin = 0;
    var pageSize = 10;
    if (data.pageSize) {
        pageSize = parseInt(data.pageSize);
    }
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    data = formatCondition(data);
    delete data.page;
    delete data.pageSize;
    data.createUser = session.user._id;
    utils.removeEmptyProperty(data);
    mongo.db(session).collection(session.account.account + '_sms').find(data, {sort: sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        mongo.db(session).collection(session.account.account + '_sms').find(data, {sort: sort}).count(function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            result.count = docCount;
            callback(result);
        });
    });
}

exports.queryAllSms = function (data, session, callback) {
    var result = {success: false};
    var sort = {submitTime: -1};
    var begin = 0;
    var pageSize = 10;
    if (data.pageSize) {
        pageSize = parseInt(data.pageSize);
    }
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    data = formatCondition(data);
    delete data.page;
    delete data.pageSize;
    if (data.createUser) {
        if (typeof data.createUser == 'string') {
            utils.setUserLevelCondition(data, 'createUser','sms', session);
        }
    } else {
        utils.setUserLevelCondition(data, 'createUser','sms', session);
        if (data.createUser) {
            data.createUser['$in'].push(null);
        }
    }
    utils.removeEmptyProperty(data);
    mongo.db(session).collection(session.account.account + '_sms').find(data, {sort: sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        mongo.db(session).collection(session.account.account + '_sms').find(data, {sort: sort}).count(function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            result.count = docCount;
            callback(result);
        });
    });
}

exports.getSmsSignDic = function (session, callback) {
    var query = {
        account: session.user.account
    };
    mongo.db().collection(fields.DB_APP_SMS_SIGN).find(query).toArray(function (err, docs) {
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};

exports.getSmsTemlateDic = function (session, callback) {
    var query = {
        account: session.user.account
    };
    mongo.db().collection(fields.DB_APP_SMS_TEMPLATE).find(query).toArray(function (err, docs) {
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};

exports.sendBatchSms = function (data, session, callback) {

    if (data.sendType == 'template') {
        data.m7Status = "ready";
        data.sign = data.batchTemplateSign;
        delete data.batchTemplateSign;
    } else {
        data.m7Status = "ready";
        //data.m7Status = "check";
    }
    data._id = uuid.generateUuid();
    data.createUser = session.user._id;
    data.account = session.user.account;
    data.signDisplay = data.sign.substring(data.sign.indexOf('_') + 1, data.sign.length);
    data.sign = data.sign.substring(0, data.sign.indexOf('_'));
    data.submitTime = utils.getCurrentDate();
    data.product = "cc";
    data.type = "send";
    data.isBatch = true;
    var allText = data.content + data.signDisplay;
    var smsSplitBaseNum = 66;
    if(session.account.smsSplitBaseNum){
        smsSplitBaseNum = session.account.smsSplitBaseNum;
    }
    if (allText.length > smsSplitBaseNum) {
        data.splitCount = parseInt(allText.length / smsSplitBaseNum);
        if (allText.length % smsSplitBaseNum != 0) {
            data.splitCount++;
        }
    } else {
        data.splitCount = 1;
    }
    if (!data.operatorStrategy) {
        checkThePrices(data,session,function (res){
            if (res.success) {
                insertSend(data,session,function (req) {
                    if (req.success) {
                        callback(req);
                    }
                });
            } else {
                callback(res);
            }
        });
    } else {
        var result = {
            success: false
        }
        var numsArray = [];
        var numArr = null;
        var yd_num = "";
        var dx_num = "";
        var lt_num = "";
        var def_num = "";
        var ydChannel = data.yd_smsChannel;
        var dxChannel = data.dx_smsChannel;
        var ltChannel = data.lt_smsChannel;
        var dfChannel = data.df_smsChannel;
        delete data.yd_smsChannel;
        delete data.dx_smsChannel;
        delete data.lt_smsChannel;
        delete data.df_smsChannel;
        if (data.nums) {
            numArr = data.nums.split(",");
        }
        if (numArr && numArr.length > 0) {
            for (var i = 0; i < numArr.length; i++) {
                var param = utils.matchingOperator(numArr[i]);
                if ("yd_smsChannel" == param) {
                    yd_num += numArr[i]+",";
                } else if ("dx_smsChannel" == param) {
                    dx_num += numArr[i]+",";
                } else if ("lt_smsChannel" == param) {
                    lt_num += numArr[i]+",";
                } else if ("def_smsChannel" == param) {
                    def_num += numArr[i]+",";
                }
            }
        }
        if (yd_num) {
            numsArray.push(yd_num.substr(0,yd_num.lastIndexOf(","))+"_"+ydChannel);
        }
        if (dx_num) {
            numsArray.push(dx_num.substr(0,dx_num.lastIndexOf(","))+"_"+dxChannel);
        }
        if (lt_num) {
            numsArray.push(lt_num.substr(0,lt_num.lastIndexOf(","))+"_"+ltChannel);
        }
        if (def_num) {
            numsArray.push(def_num.substr(0,def_num.lastIndexOf(","))+"_"+dfChannel);
        }

        checkThePrices(data,session,function (res){
            if (res.success) {
                recursive(numsArray,data,session,function (reqs) {
                    callback(reqs);
                });
            } else {
                callback(res);
            }
        });
    }

};
function recursive (obj,data,session,callback) {
    var result = {
        success: false
    }
    if (obj.length > 0) {
        data._id = uuid.generateUuid();
        data.nums = obj[0].split("_")[0];
        data.smsChannel = obj[0].split("_")[1];
        if (data.nums.indexOf(",") != -1) {
            var arr = data.nums.split(",");
            data.numCount = arr.length;
        } else {
            data.numCount = 1;
        }
        insertSend(data,session,function (res) {
            if (res.success) {
                obj.splice(0,1);
                recursive(obj,data,session,callback);
            } else {
                callback(res);
            }
        });
    } else {
        result.success = true;
        callback(result);
    }
}
function checkThePrices (data,session,callback) {
    var result = {
        success: false
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT).findOne({_id: data.account}, function (err, doc) {
        if (err) {
            result.message = "send sms check cc balance failed!";
            callback(result);
            return;
        }
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: session.account._id}, function (err, productDoc) {
            if (err) {
                result.message = "send sms check cc balance failed!";
                callback(result);
                return;
            }
            var smsFee = 1000;
            if (productDoc.smsFee) {
                smsFee = productDoc.smsFee;
            }
            var money = data.numCount * data.splitCount * smsFee;
            var realBalance = doc.balance;
            if (doc.overdraw) {
                realBalance = realBalance + doc.overdraw;
            }
            if (money > realBalance) {
                result.message = "403";
                callback(result);
                return;
            } else {
                result.success = true;
                callback(result);
            }
        });
    });
}
function insertSend (data,session,callback) {
    var result = {
        success: false
    }
    if(data.nums == "") {
        result.success = true;
        callback(result);
        return;
    }
    if (data.sendType == 'template') {
        if(data.smsChannel == 'ytx'||data.smsChannel == 'ytxyx'){
            var query = {_id:data.templateid};
            mongo.db('bill').collection(fields.DB_YTX_TEMPLATE_ID).findOne(query, function (err,doc) {
                if(err){
                    result.message = "query ytxid cc db failed!";
                    callback(result);
                }else {
                    data.ytxtemplateid = doc.ytxtemplateid;
                    mongo.db().collection(fields.DB_APP_SMS_SEND).insert(data,{w : 1}, function (err) {
                        if (err) {
                            result.message = "sms insert cc db failed!";
                        } else {
                            result.success = true;
                        }
                        callback(result);
                    });
                }
            });
        }else{
            mongo.db().collection(fields.DB_APP_SMS_SEND).insert(data,{w : 1}, function (err) {
                if (err) {
                    result.message = "sms insert cc db failed!";
                } else {
                    result.success = true;
                }
                callback(result);
            });
        }
    } else {
        mongo.db('bill').collection(fields.DB_PLATFORM_SMS_CHANNEL).findOne({forceSelect: true}, function (err, doc) {
            if (doc) {
                data.smsChannel = doc._id;
            } else {
                if (session.account.smsChannel) {
                    data.smsChannel = session.account.smsChannel;
                } else {
                    data.smsChannel = 'gdty';
                }
            }
            mongo.db().collection(fields.DB_APP_SMS_SEND).insert(data,{w : 1}, function (err) {
                if (err) {
                    result.message = "sms insert cc db failed!";
                } else {
                    result.success = true;
                }
                callback(result);
            });
        });
    }
}

exports.querySmsImportTask = function (data, session, callback) {
    var result = {success: false};
    var query = data.query;
    var option = data.option;
    var sort = {createTime: -1};
    utils.removeEmptyProperty(query);
    query.type = {'$in': ['sms', 'templateSms']};
    if (!query.accountId) {
        query.accountId = session.user.account;
    }
    utils.setDateCondition(query);

    var limit = option.pageSize || 10;
    var page = option.index || 1;
    var skip = (page - 1) * limit;

    mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(query, {
        sort: sort,
        limit: limit,
        skip: skip
    }).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).count(query, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        } else {
            logger.app.error('queryMyTask error:' + err.stack);
            result.message = 'queryMyTask error!' + err.message;
            callback(result);
        }

    });
};

/**
 *  { file:
            { fileId: '5e262a90-9316-11e3-92d3-ff4d218bdb55',
            name: '0test_yy.xls' } }
 * @param data
 * @param session
 * @param res
 */
exports.importSms = function (data, session, res) {
    mongo.db('bill').collection(fields.DB_PLATFORM_SMS_CHANNEL).findOne({forceSelect: true}, function (err, doc) {
        var smsChannel = 'gdty';
        if (doc) {
            smsChannel = doc._id;
        } else {
            if (session.account.smsChannel) {
                smsChannel = session.account.smsChannel;
            }
        }
        var doc = {
            fileName: data.file.fileId,
            trueName: data.file.name,
            smsChannel: smsChannel,
            createUser: session.user._id
        };
        insertImpTask(doc, session, function (err) {
            var result = '';
            if (!err) {
                result = '<script>parent.handler.sms.uploadSuccess("success")</script>';
            } else {
                result = '<script>parent.handler.sms.uploadSuccess("fail")</script>';
            }
            res.send(result);
        });
    });
};

exports.importTemplateSms = function (data, session, res) {
    var doc = {
        fileName: data.file.fileId,
        trueName: data.file.name,
        createUser: session.user._id
    };
    insertTemplateSmsImpTask(doc, session, function (err) {
        var result = '';
        if (!err) {
            result = '<script>parent.handler.sms.uploadSuccess("success")</script>';
        } else {
            result = '<script>parent.handler.sms.uploadSuccess("fail")</script>';
        }
        res.send(result);
    });
};
exports.queryTaskImport = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.limit || 10;
    var page = data.page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var query = {account: session.user.account, batchNo: data.batchNo};
    var other = {sort: {submitTime: -1}, limit: limit, skip: skip};

    mongo.db().collection(fields.DB_APP_SMS_SEND).find(query, other).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_APP_SMS_SEND).count(query, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error('db query task error:' + err.stack);
            result.message = 'db query task error!' + err.message;
            callback(result);
        }
    });
};

exports.queryTaskInvalid = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.limit || 10;
    var page = data.page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var query = {account: session.user.account, batchNo: data.batchNo};
    var other = {sort: {createTime: -1}, limit: limit, skip: skip};

    mongo.db().collection(fields.DB_APP_SMS_IMPORT_INVALID).find(query, other).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_APP_SMS_IMPORT_INVALID).count(query, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error('db query task error:' + err.stack);
            result.message = 'db query task error!' + err.message;
            callback(result);
        }
    });
}

exports.smsImportSend = function (data, session, callback) {
    var result = {success: false};
    var findDoc = {account: session.user.account, batchNo: data.batchNo};
    var updateDoc = {$set: {m7Status: 'ready'}};
    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT).findOne({_id: session.account.account}, function (err, doc) {
        if (err) {
            result.message = "send sms check cc balance failed!";
            callback(result);
            return;
        }
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: session.account._id}, function (err, productDoc) {
            if (err) {
                result.message = "send sms check cc balance failed!";
                callback(result);
                return;
            }
            var smsFee = 1000;
            if (productDoc.smsFee) {
                smsFee = productDoc.smsFee;
            }
            mongo.db().collection(fields.DB_APP_SMS_SEND).find(findDoc, {splitCount: 1}).toArray(function (err, docs) {
                if (err) {
                    result.message = "服务异常";
                }
                var countMoney = 0;
                for (var i = 0; i < docs.length; i++) {
                    countMoney += docs[i].splitCount * smsFee;
                }
                var realBalance = doc.balance;
                if (doc.overdraw) {
                    realBalance = realBalance + doc.overdraw;
                }
                if (countMoney > realBalance) {
                    result.message = "余额不足！";
                    callback(result);
                    return;
                }
                if (data.type == 'templateSms') {
                    mongo.db().collection(fields.DB_APP_SMS_SEND).update(findDoc, updateDoc, {multi: true}, function (err) {
                        if (err) {
                            result.message = 'send import sms failed! update db failed!';
                            callback(result);
                            return;
                        }
                        result.success = true;
                        callback(result);
                    });
                } else {
                    //updateDoc = { $set : {m7Status : 'check'}};
                    mongo.db().collection(fields.DB_APP_SMS_SEND).update(findDoc, updateDoc, {multi: true}, function (err) {
                        if (err) {
                            result.message = 'send import sms failed! update db failed!';
                            callback(result);
                            return;
                        }
                        var find = {batchNo: data.batchNo};
                        mongo.db(session).collection(session.user.account + fields.DB_SMS).update(find, updateDoc, {multi: true}, function (err) {
                            if (err) {
                                result.message = 'send import sms failed! update db failed!';
                                callback(result);
                                return;
                            }
                            result.success = true;
                            callback(result);
                        });
                    });
                }
            });
        });
    });
}

exports.smsCountImportToSend = function (data, session, callback) {
    var result = {success: false};
    var findDoc = {account: session.user.account, batchNo: data.batchNo, m7Status: 'import'};
    mongo.db().collection(fields.DB_APP_SMS_SEND).find(findDoc, {multi: true, limit: 1}).toArray(function (err, docs) {
        if (err) {
            result.message = 'count import sms failed! update db failed!';
            callback(result);
            return;
        }
        if (docs && docs.length > 0) {
            result.hasImport = true;
        } else {
            result.hasImport = false;
        }
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).findOne({
            accountId: session.user.account,
            batchNo: data.batchNo
        }, function (err, doc) {
            if (!err) {
                if (doc) {
                    result.success = true;
                    result.type = doc.type;
                } else {
                    result.message = 'not found this task';
                    callback(result);
                    return;
                }
            } else {
                result.message = 'count import sms failed! update db failed!';
                callback(result);
                return;
            }
            callback(result);
        })
    });
}

exports.querySmsTemplate = function (data, session, callback) {
    var result = {success: false};
    var sort = {createTime: -1};
    var begin = 0;
    var pageSize = 10;
    if (data.pageSize) {
        pageSize = parseInt(data.pageSize);
    }
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    data = formatCondition(data);
    delete data.page;
    delete data.pageSize;
    utils.removeEmptyProperty(data);
    if (data.submitTime) {
        data.createTime = data.submitTime;
        delete data.submitTime;
    }
    data.account = session.user.account;
    mongo.db().collection(fields.DB_APP_SMS_TEMPLATE).find(data, {sort: sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        mongo.db().collection(fields.DB_APP_SMS_TEMPLATE).find(data, {sort: sort}).count(function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            result.count = docCount;
            callback(result);
        });
    });
},
    exports.queryHangupMessageTemplate = function (data,session, callback) {
        var result = {success: false};
        var usercon = {_id: session.user.account};
        mongo.db().collection(fields.DB_CC_HANGUP_SMS_TEMPLATE).findOne(usercon, function (err, doc) {
            if (!err) {
                result.success = true;
                result.doc = doc;
            } else {
                logger.app.error("queryHangupMessageTemplate error!", err);
                result.message = "db error!";
            }
            callback(result);
        });

    },
    exports.saveCallMessageTemplate = function (data, session, callback) {
        var result = {success: false};
        var isex = false;
        data._id = session.account.account;
        var datasess={_id:session.account.account};
        mongo.db().collection(fields.DB_CC_HANGUP_SMS_TEMPLATE).findOne(datasess, function (err,doc) {

            if(doc){
                mongo.db().collection(fields.DB_CC_HANGUP_SMS_TEMPLATE).update(doc,data, function (err) {
                    if (!err) {
                        result.success = true;
                    } else {
                        logger.app.error("saveCallMessageTemplate error!", err);
                        result.message = "db error!";
                    }
                    callback(result);
                });
            }else{
                mongo.db().collection(fields.DB_CC_HANGUP_SMS_TEMPLATE).insert(data, function (err) {
                    if (!err) {
                        result.success = true;
                    } else {
                        logger.app.error("saveCallMessageTemplate error!", err);
                        result.message = "db error!";
                    }
                    callback(result);
                });
            }
        });
    }

function insertImpTask(data, session, callback) {
    var result = {success: false};
    var id = utils.UUID.generateUuid();
    var time = utils.DateTime.getCurrentDateTime();
    var aid = session.account.account;
    data._id = id;
    data.createTime = time;
    data.accountId = aid;
    data.batchNo = __getDateNo();
    data.flag = "start";
    data.type = "sms";
    mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data, {w: 1}, function (err) {
        if (!err) {
            result.success = true;
            __sendTask(aid, callback);
        } else {
            logger.app.error('db imp task error:' + err.stack);
            result.message = 'db imp task error!' + err.message;
            callback(result);
        }
    })
}

function insertTemplateSmsImpTask(data, session, callback) {
    var result = {success: false};
    var id = utils.UUID.generateUuid();
    var time = utils.DateTime.getCurrentDateTime();
    var aid = session.account.account;
    data._id = id;
    data.createTime = time;
    data.accountId = aid;
    data.batchNo = __getDateNo();
    data.flag = "start";
    data.type = "templateSms";
    mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data, {w: 1}, function (err) {
        if (!err) {
            result.success = true;
            __sendTask(aid, callback);
        } else {
            logger.app.error('db imp task error:' + err.stack);
            result.message = 'db imp task error!' + err.message;
            callback(result);
        }
    })
}

function __sendTask(accountId, callback) {
    var url = config.ccServiceUrl + '?Action=import&Method=import&Account=' + accountId;
    url = encodeURI(url);
    httpProvider.sendGet(url, function (err, result) {
        if (!err && result) {
            try {
                var res = JSON.parse(result);
                if (res.Succeed) {
                    callback(null);
                } else {
                    callback(new Error('request service error!'));
                }
            } catch (e) {
                logger.request.error(e);
                callback(e);
            }
        } else {
            var error = err || new Error('request service error!');
            logger.request.error(error);
            callback(error);
        }
    });
}

function __getDateNo() {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var str = year + '' + (month > 9 ? month : "0" + month) + '' + (day > 9 ? day : "0" + day);
    var h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
    str += (h > 9 ? h : "0" + h) + '' + (m > 9 ? m : "0" + m) + '' + (s > 9 ? s : "0" + s);
    return str;
}

function formatCondition(data) {
    if (data.BEGIN_TIME || data.END_TIME) {
        data.submitTime = {};
        if (data.BEGIN_TIME) {
            data.submitTime["$gte"] = data.BEGIN_TIME;
            delete data.BEGIN_TIME;
        }
        if (data.END_TIME) {
            data.submitTime["$lte"] = data.END_TIME;
            delete data.END_TIME;
        }
    }
    return data;
}