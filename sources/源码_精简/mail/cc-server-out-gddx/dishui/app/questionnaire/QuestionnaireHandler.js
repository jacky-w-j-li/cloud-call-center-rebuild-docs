var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var http = require('appHttp');
var config = require('appConfig').conf;


var handler = {
    getQuesById: function (data, session, callback) {
        var result = {success: false};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).findOne(data, function (err, dbQues) {
            if (!err) {
                result.success = true;
                result.data = dbQues;
                callback(result);
            } else {
                result.message = "获取问卷信息失败！";
                callback(result);
            }
        });
    },

    updateQuestionnaire: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).update({_id: id}, {$set:data }, function (err) {
            if (!err) {
                result.success = true;
                result.data={
                    _id:id
                };
                callback(result);
            } else {
                result.message = "更新问卷数据异常!";
                callback(result);
            }
        });
    },
    _initQueryTime : function(condition){
        var beginTime = condition.lastUpdateTime_begin_date;
        var endTime = condition.lastUpdateTime_end_date;
        if (beginTime) {
            condition.lastUpdateTime = {
                $gte: beginTime + " 00:00:00"
            }
            delete condition.lastUpdateTime_begin_date;
        }
        if (endTime) {
            if (condition.lastUpdateTime) {
                condition.lastUpdateTime.$lte = endTime + " 23:59:59"
            } else {
                condition.lastUpdateTime = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete condition.lastUpdateTime_end_date;
        }
        var beginTime2 = condition.createTime_begin_date;
        var endTime2 = condition.createTime_end_date;
        if (beginTime2) {
            condition.createTime = {
                $gte: beginTime2 + " 00:00:00"
            }
            delete condition.createTime_begin_date;
        }
        if (endTime2) {
            if (condition.createTime) {
                condition.createTime.$lte = endTime2 + " 23:59:59"
            } else {
                condition.createTime = {
                    $lte: endTime2 + " 23:59:59"
                }
            }
            delete condition.createTime_end_date;
        }

    },
    getUserUnconfirmQues : function (data,session,callback){
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete data.query;
        var condition = {
            owner: session.user._id,
            status: "confirm"
        };
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }
        handler._initQueryTime(condition);
        handler._queryQuesList(session, condition, limit, skip, callback);
    },

    getUserCompleteQues: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete data.query;
        var condition = {
            owner: session.user._id,
            status: "complete"
        };
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }
        handler._initQueryTime(condition);
        handler._queryQuesList(session, condition, limit, skip, callback);
    },
    getAllUnconfirmQues : function (data,session,callback){
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete data.query;
        var condition = {
            status: "confirm"
        };
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }
        if(condition.owner && condition.owner == '##'){
            condition.owner = "";
        }
        utils.setUserLevelCondition(condition, "owner", 'question',session);
        handler._initQueryTime(condition);
        handler._queryQuesList(session, condition, limit, skip, callback);
    },

    getAllUncompleteQues: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete data.query;
        var condition = {
            status: "uncomplete"
        };
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }
        if(condition.owner && condition.owner == '##'){
            condition.owner = "";
        }
        utils.setUserLevelCondition(condition, "owner", 'question',session);
        console.log(condition);
        handler._initQueryTime(condition);
        handler._queryQuesList(session, condition, limit, skip, callback);
    },
    getAllCompleteQues: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete data.query;
        var condition = {
            status: "complete"
        };
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }
        if(condition.owner && condition.owner == '##'){
            condition.owner = "";
        }
        utils.setUserLevelCondition(condition, "owner", 'question',session);
        handler._initQueryTime(condition);
        handler._queryQuesList(session, condition, limit, skip, callback);
    },

    getAllQues: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete data.query;
        var condition = {
        };
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
           condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }
        if(condition.owner && condition.owner == '##'){
            condition.owner = "";
        }
        utils.setUserLevelCondition(condition, "owner", 'question',session);
        handler._initQueryTime(condition);
        handler._queryQuesList(session, condition, limit, skip, callback);

    },

    getUserUncompleteQues: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var  query = data.query;
        delete data.query;
        var condition = {
            owner: session.user._id,
            status: "uncomplete"
        };
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }

        if(condition.owner && condition.owner == '##'){
            condition.owner = "";
        }
        handler._initQueryTime(condition);
        handler._queryQuesList(session, condition, limit, skip, callback);

    },
    getUserAllQues: function (data, session, callback) {
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var  query = data.query;
        delete data.query;
        var condition = {
            owner: session.user._id
        };
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }

        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }

        if(condition.owner && condition.owner == '##'){
            condition.owner = "";
        }
        handler._initQueryTime(condition);
        handler._queryQuesList(session, condition, limit, skip, callback);

    },

    getQuesCount : function ( data , session , callback){
        var result = {success: false};
        var  query = data.query;
        delete data.query;
        var condition = {};
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }
        utils.setUserLevelCondition(condition, "owner", 'question',session);
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).count(condition,function(err , count){
            if(!err){
                result.success = true;
                result.count = count;
            } else {
                result.message = "获取问卷数量异常";
            }
            callback(result);
        });
    },
    deleteQues : function (data , session , callback){
        var result = {success: false};
        var  query = data.query;
        delete data.query;
        var condition = {};
        for (var key in data) {
            if (!condition[key] && data[key]) {
                condition[key] = data[key];
            }
        }
        if (query) {
            condition["$or"] = [
                {name: new RegExp(query)},
                {phone: new RegExp(query)}
            ]
        }
        if(condition.name){
            condition.name = new RegExp(condition.name);
        }
        if(condition.phone){
            condition.phone = new RegExp(condition.phone);
        }
        utils.setUserLevelCondition(condition, "owner", 'question',session);
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).remove(condition,function(err){
            if(!err){
                result.success = true;
            } else {
                result.message = "删除数据异常";
            }
            callback(result);
        });

    },
    _queryQuesList: function (session, condition, limit, skip, callback) {
        var result = {success: false};

        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).find(condition, {sort: {lastUpdateTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).count(condition, function (err, count) {
                    if (!err) {
                        result.success = true;
                        result.list = docs || [];
                        result.count = count;
                        delete condition.query;
                        delete condition["$or"];
                        result.condition = condition;
                        callback(result);
                    } else {
                        callback(result);
                    }
                });
            } else {
                callback(result);
            }
        });

    },
    _setQueryCondition: function (query, session) {
        utils.removeEmptyProperty(query);
        query.type = 'questionnaire';
        if (!query.accountId) {
            query.accountId = session.user.account;
        }
        utils.setDateCondition(query);
    },
    queryQuestionTask: function (data, session, callback) {
        var result = {success: false};
        var query = data.query;
        var option = data.option;
        var sort = {createTime: -1};
        handler._setQueryCondition(query, session);

        var limit = option.pageSize || 10;
        var page = option.index || 1;
        var skip = (page - 1) * limit;

        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(query, {sort: sort, limit: limit, skip: skip}).toArray(function (err, docs) {
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
                logger.app.error('queryQuestionTask error:' + err.stack);
                result.message = 'queryQuestionTask error!' + err.message;
                callback(result);
            }

        });
    },
    getXlsHeads: function (data, session, callback) {
        var result = {success: false};
        var url = config.ccServiceUrl + '?Action=import&Method=getHeads&file=' + data.fileName + '&trueName=' + data.trueName;
        url = encodeURI(url);
        http.sendGet(url, function (err, res) {
            if (!err && res) {
                try {
                    var res = JSON.parse(res);
                    res.success = true;
                    if (res.Succeed) {
                        callback(res);
                    } else {
                        result.message = "请求excel表头错误!";
                        callback(result);
                    }
                } catch (e) {
                    logger.request.error(e);
                    result.message = error.message;
                    callback(result);
                }
            } else {
                var error = err || new Error('请求excel表头错误!');
                logger.request.error(error);
                result.message = error.message;
                callback(result);
            }
        });
    },
    import: function (data, session, callback) {
        var result = {success: false};
        var id = utils.UUID.generateUuid();
        var time = utils.getCurrentDate();
        var aid = session.user.account;
        var uid = session.user._id;
        data._id = id;
        data.createTime = time;
        data.creator = uid;
        data.accountId = aid;
        data.flag = "start";
        data.type = "questionnaire";
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                result.data = data;
                handler.__sendTask(aid, callback, data);
            } else {
                logger.app.error('db imp task error:' + err.stack);
                result.message = 'db imp task error!' + err.message;
                callback(result);
            }

        })
    },
    __sendTask: function (accountId, callback, data) {
        var result = {success: false};
        var url = config.ccServiceUrl + '?Action=import&Method=import&Account=' + accountId;
        url = encodeURI(url);
        http.sendGet(url, function (err, res) {
            if (!err && res) {
                try {
                    var res = JSON.parse(res);
                    if (res.Succeed) {
                        res.success = true;
                        res.row = data;
                        callback(res);
                    } else {
                        callback(result);
                    }
                } catch (e) {
                    logger.request.error(e);
                    result.message = e.message;
                    callback(result);
                }
            } else {
                var error = err || new Error('request service error!');
                logger.request.error(error);
                result.message = error.message;
                callback(result);
            }
        });
    },
    queryQuestionTaskImport: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit || 10;
        var page = data.page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = {batchNo: data.batchNo};
        var other = {sort: {createTime: -1}, limit: limit, skip: skip};

        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).find(query, other).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).count(query, function (err, count) {
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
    },

    _setAssginQueryCondition: function (data, session) {
        utils.removeEmptyProperty(data);
        if (data.query) {
            data["$or"] = [
                {name: new RegExp(data.query)},
                {phone: new RegExp(data.query)}
            ]
            delete data.query;
        }
        if(data.owner && data.owner == '##'){
            data.owner = "";
        }
        if(data.questionnaireType == "questionnaire_uncomplete"){
            data.status =  "uncomplete";
        }else if(data.questionnaireType == "questionnaire_unconfirm"){
            data.status =  "confirm";
        }
        if(data.questionnaireType){
            delete data.questionnaireType;
        }
        utils.setUserLevelCondition(data, "owner",'question', session);
        return data;
    },
    _updateQuesOwner: function (query, data, session, count) {
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).update(query, {$set: data}, {multi: true}, function (err) {
            if (err) {
                logger.app.error('_updateQuesOwner error:' + err.stack);
            }
        });
    },
    saveQuesAssign: function (data, session, callback) {
        var total = data.total;
        var owners = data.owners;
        var query = data.query;
        query = handler._setAssginQueryCondition(query, session);
        var result = {success: false};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).find(query, {sort: {createTime: -1}}).toArray(function (err, docs) {
            if (!err) {
                if (total == docs.length) {
                    var ids = [];
                    var skip = 0;
                    for (var i = 0; i < owners.length; i++) {
                        var count = owners[i].count;
                        var owner = owners[i].owner;
                        for (var j = skip; j < skip + count; j++) {
                            var doc = docs[j];
                            ids.push(doc._id);
                        }
                        var q1 = {"_id": {"$in": ids}};
                        var d1 = {owner: owner, status:'uncomplete'};
                        handler._updateQuesOwner(q1, d1, session, count);
                        ids = [];
                        skip += count;
                    }
                    result.success = true;
                } else {
                    logger.app.error('saveQuesAssign data is change');
                    result.code = '1001';
                }
                callback(result);
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    },
    getQuesCallSheet : function(data , session , callback){
        var result = {success : false};
        var sort = {OFFERING_TIME: -1};
        var pageSize = 10;
        var condition = {
            "QUES_ID" : data._id
        };
        mongo.db(session).collection(session.user.account +  fields.DB_ACCOUNT_CALL_SHEET).find(condition,{sort:sort}).limit(pageSize).toArray(function(err,docs){
            if(!err){
                result.success = true;
                result.data = docs || [];
                callback(result);
            } else {
                logger.app.error("query call sheet by Ques exception!",err);
                result.message = "query call sheet by Ques exception!";
                callback(result);
            }
        });
    },
    addQuesComment : function (data,session , callback){
        var result = {success : false};
        var id = data._id;
        delete data._id;
        var comment = {
            comment : data.comment,
            user : session.user._id,
            time : utils.DateTime.getCurrentDateTime()
        }
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).update({_id:id},{$push:{comments:comment}},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.error("add questionnaire comment exception!",err);
                callback(result);
            }
        });
    },
    exportQues : function (data , session , callback){
        var result = {success: false};
//        var query = data.query;
//        delete data.query;
//        if(query){
////            data["$or"] = [
////                {name: new RegExp(query)},
////                {phone: new RegExp(query)}
////            ]
//              data["$or"] = [
//                  {name:}
//
//              ];
//        }
        if (!data.account) {
            data.account = session.account.account;
        }
        var url = config.ccServiceUrl + '?Action=export&Method=questionnaire&Query=' + JSON.stringify(data);
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

    }



}


module.exports = handler;
