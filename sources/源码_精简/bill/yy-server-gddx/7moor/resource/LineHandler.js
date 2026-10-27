var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    queryLine: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);
        mongo.db().collection(constants.DB.platform_line).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_line).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, lines) {
                    if (!err) {
                        lines = lines || [];
                        result.success = true;
                        result.list = lines;
                        callback(result);
                    } else {
                        logger.app.warn("queryLine list error", err);
                        result.message = "查询线路信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryLine count error", err);
                result.message = "查询线路信息异常！";
                callback(result);
            }
        });
    },
    getLineInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_line).findOne(data, function (err, dbLine) {
            if (!err) {
                dbLine = dbLine || {};
                if (dbLine.dialFee) {
                    for (var i in dbLine.dialFee) {
                        if(!isNaN(dbLine.dialFee[i])){
                            dbLine.dialFee[i] = utils.formatTrueFee(dbLine.dialFee[i]);
                        }
                    }
                }
                if (dbLine.internationalFee) {
                    for (var i in dbLine.internationalFee) {
                            dbLine.internationalFee[i] = utils.formatTrueFee(dbLine.internationalFee[i]);
                    }
                }
                result.success = true;
                result.data = dbLine;
                callback(result);
            } else {
                logger.app.warn("getLineInfo  error", err);
                result.message = "查询线路信息异常！";
                callback(result);
            }
        });
    },
    /*
    getSystemUserDic: function (data, session, callback) {
        mongo.db().collection(constants.DB.system_user).find({status: "enable"}).toArray(function (err, users) {
            if (!err) {
                users = users || [];
                var caches = [];
                for (var i = 0; i < users.length; i++) {
                    var cache = {
                        codeType: "systemUser",
                        codeOrder: i + 1,
                        codeName: users[i].name,
                        identity : users[i].identity,
                        codeValue: users[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
    */

    addLine: function (data, session, callback) {
        var result = {success: false};
        data.status = constants.pbxSataus.enable;
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        if (data.dialFee) {
            for (var i in data.dialFee) {
                if(!isNaN(data.dialFee[i])){
                    data.dialFee[i] = utils.formatFee(data.dialFee[i]);
                }
            }
        }
        if (data.internationalFee) {
            for (var i in data.internationalFee) {
                data.internationalFee[i] = utils.formatFee(data.internationalFee[i]);
            }
        }
        mongo.db().collection(constants.DB.platform_line).insert(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("addLine err!", err);
                result.message = "添加线路异常！";
                if (err.code == "11000") {
                    result.message = "线路编号已经存在！";
                }
                callback(result);
            }
        });
    },
    updateLine: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        if (data.dialFee) {
            for (var i in data.dialFee) {
                if(!isNaN(data.dialFee[i])){
                    data.dialFee[i] = utils.formatFee(data.dialFee[i]);
                }
            }
        }
        if (data.internationalFee) {
            for (var i in data.internationalFee) {
                    data.internationalFee[i] = utils.formatFee(data.internationalFee[i]);
            }
        }
        mongo.db().collection(constants.DB.platform_line).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateLine  error", err);
                result.message = "更新线路信息异常！";
                callback(result);
            }
        });
    },
    getLineCache: function (data, session, callback) {
        if(data.line_type){
            data.type = data.line_type;
            delete data.line_type;
        }
        mongo.db().collection(constants.DB.platform_line).find(data,{sort:{name:1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var caches = [];
                for (var i = 0; i < docs.length; i++) {
                    var cache = {
                        codeType: "line",
                        codeOrder: i + 1,
                        codeName: docs[i].name,
                        codeValue: docs[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
    deleteLine: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_line).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteLine  error", err);
                result.message = "删除线路信息异常！";
                callback(result);
            }
        });

    },
    judgeSmsSend: function (data, session, callback) {
        var result = {success: false};
        var limit = 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        if(data.num){
            data.num=new RegExp(data.num);
        };
        if(data.account){
            data.account=new RegExp(data.account);
        };
        if(data.m7Status){
            data.m7Status=new RegExp(data.m7Status);
        }else{
            //data.m7Status={$ne:"send"};//搜索条件 默认为 未发送短信
            data.m7Status="verify";//搜索条件 默认为 未发送短信
        }
        mongo.db("cc").collection(constants.DB.app_sms_send).count(data,function(err,count){
            if(!err){
            result.count = count;
            mongo.db("cc").collection(constants.DB.app_sms_send).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, lines) {
                if (!err) {
                    lines = lines || [];
                    result.success = true;
                    result.list = lines;
                    callback(result);
                } else {
                    logger.app.warn("querySmsSend error", err);
                    result.message = "查询待处理短信数据异常！";
                    callback(result);
                }
            });
            }
        })
    },
    updateSmsSend_pass :function(data, session, callback){
        var result = {success: false};
        var k = data.length - 1;
        for(var i=0; i< k ; i++){
            data[i].m7Status = "pass";
            data[i].verifyUser = data[k];
            mongo.db("cc").collection(constants.DB.app_sms_send).update({_id: data[i]._id}, {$set: data[i]}, {w: 1}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.warn("updateSmsSend_pass  error", err);
                    result.message = "更新短信状态异常！短信信息为："+data[i].account+data[i].content;
                    callback(result);
                }
            });
        }
    },
    updateSmsSend_unpass :function(data, session, callback){
        var result = {success: false};
        var k = data.length - 1;
        for(var i=0; i< k ; i++){
            data[i].m7Status = "unpass";
            data[i].verifyUser = data[k];
            mongo.db("cc").collection(constants.DB.app_sms_send).update({_id: data[i]._id}, {$set: data[i]}, {w: 1}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.warn("updateSmsSend_unpass  error", err);
                    result.message = "更新短信状态异常！短信信息为："+data[i].account+data[i].content;
                    callback(result);
                }
            });
        }
    }
};


module.exports = handler;