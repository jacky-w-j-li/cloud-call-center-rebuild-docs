var utils = require('appUtil/Utils');
var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var logger = require('appLog');


var handler = {

    queryAccountQuestionnaireTemp: function (data, session, callback) {
        var result = {success: false};
        var condition = {account: session.user.account};
        var option = {fields: {_id: 1, name: 1, status: 1}, sort: {status: -1, createTime: 1}};
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).find(condition, option).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                result.success = true;
                result.data = docs;
            } else {
                logger.app.error("queryAccountQuestionnaireTemp from db error! ", err);
                result.message = "获取模板信息异常！";
            }
            callback(result);
        });
    },
    getQuestionnaireTempById: function (data, session, callback) {
        var result = {success : false};
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).findOne(data,function(err,dbTemp){
            if(!err && dbTemp){
                result.success = true;
                result.data = dbTemp;
                callback(result);
            } else {
                result.message = "获取问卷模板信息异常！";
                logger.app.error("获取问卷模板信息异常["+data._id+"]");
                callback(result);
            }
        });
    },
    updateQuestionnaireTemp: function (data, session, callback) {
        var result  = {success : false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).update({_id:id},{$set:data},function(err){
            if(!err){
                result.success = true;
            } else {
                result.message = "更新模板信息异常！";
            }
            callback(result);
        });
    },
    addQuestionnaireTemp: function (data, session, callback) {
        var result = {success: false};
        data.account = session.user.account;
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.createUser = session.user._id;
        data._id = utils.UUID.generateUuid();
        data.status = "enable";

        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).findOne({account: session.account.account, name: data.name}, function (err, oneTemp) {
            if (!oneTemp) {
                mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).insert(data, function (err) {
                    if (!err) {
                        //add default field
                        impl._addDefaultTempFields(data._id, function (err) {
                            if (!err) {
                                result.success = true;
                                result.data = data;
                                callback(result);
                            } else {
                                result.message = "初始化模板异常!";
                                callback(result);
                            }
                        });

                    } else {
                        result.message = "添加模板异常！";
                        callback(result);
                    }
                });
            } else {
                result.success = false;
                result.message = "模板名称已经存在！";
                callback(result);
            }
        });
    },
    queryQuestionnaireQues: function (data, session, callback) {
        var result = {success: false};

        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).find(data, {sort: {createTime: 1}}).toArray(function (err, dbQues) {
            if (!err) {
                result.success = true;
                result.data = dbQues || [];
                callback(result);
            } else {
                result.message = "获取问题列表异常！";
                callback(result);
            }
        });
    },
    delTempQues: function (data, session, callback) {
        var result = {success: false};
        if(!data || !data._id || data._id==""){
            result.message = "删除模板问题异常！";
            callback(result);
        }
        var find = {
            _id :data._id
        };
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).remove(find,function(err){
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                result.message = "删除模板问题异常！";
                callback(result);
            }
        });
    },
    addQuestionnaireFields: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_FIELD).findOne({temp_id: data.temp_id, name: data.name}, function (err, dbField) {
            if (!err && !dbField) {
                mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_FIELD).insert(data, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "添加模板字段异常！"
                        callback(result);
                    }
                });
            } else {
                result.message = "字段名称已经存在！";
                callback(result);
            }
        });
    },
    updateQuestionnaireFields : function (data ,session, callback){
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_FIELD).update({_id:id},{$set:data},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                result.message = "更新数据异常!";
                callback(result);
            }
        });
    },
    addQuestionnaireQues: function (data, session, callback) {
        var result = {success: false};

        var anws = data.anws ||[];
        for(var i=0;i<anws.length;i++){
            if(!anws[i]._id){
                anws[i]._id = utils.UUID.generateUuid();
            }
        }

        if (data._id) {
            var id = data._id;
            delete data._id;
            if(data.isBegin){
                mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).update({temp_id:data.temp_id,isBegin:true},{$set:{isBegin:false}},function(){
                    mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).update({_id: id}, {$set: data}, function (err) {
                        if (!err) {
                            result.success = true;
                            data._id = id;
                            result.data = data;
                            callback(result);
                        } else {
                            result.message = "更新问卷问题异常！";
                            callback(result);
                        }
                    });
                });
            }else{
                mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).update({_id: id}, {$set: data}, function (err) {
                    if (!err) {
                        result.success = true;
                        data._id = id;
                        result.data = data;
                        callback(result);
                    } else {
                        result.message = "更新问卷问题异常！";
                        callback(result);
                    }
                });
            }

        } else {
            data._id = utils.UUID.generateUuid();
            data.createTime = utils.DateTime.getCurrentDateTime();
            mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).findOne({temp_id: data.temp_id, name: data.name}, function (err, dbQues) {
                if (!err && !dbQues) {
                    if(data.isBegin){
                        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).update({temp_id:data.temp_id,isBegin:true},{$set:{isBegin:false}});
                    }
                    mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).insert(data, function (err) {
                        if (!err) {
                            result.success = true;
                            result.data = data;
                            callback(result);
                        } else {
                            result.message = "保存问题异常!";
                            callback(result);
                        }
                    });

                } else {
                    result.message = "问题已经存在！";
                    callback(result);
                }
            });
        }
    },
    getQuesById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_QUESTION).findOne(data, function (err, dbQues) {
            if (!err) {
                dbQues = dbQues || {};
                result.success = true;
                result.data = dbQues;
                callback(result);
            } else {
                result.message = "获取问题失败！";
            }
        });
    },
    queryQuestionnaireFields: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query = data.query;
        delete  data.query;
        if (query) {
            data.name = new RegExp(query);
        }

        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_FIELD).find(data, {limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_FIELD).count(data, function (err, count) {
                    if (!err) {
                        result.success = true;
                        result.list = docs || [];
                        result.count = count;
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
            } else {
                logger.app.error("queryBusinessFlowFields error!", err);
                result.message = "获取模板字段信息异常！";
                callback(result);
            }

        });
    },
    getQuestionnaireFieldById : function(data,session,callback){
        var result = {success : false};
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_FIELD).findOne(data,function(err,dbField){
           if(!err && dbField){
               result.success = true;
               result.data = dbField;
               callback(result);
           } else {
               logger.app.error("getQuestionnaireFieldById error!", err || new Error(""));
               result.message = "获取模板字段信息异常！";
               callback(result);
           }
        });

    },
    changeStatusQuestionnaireTemp : function (data ,session,callback){
        var result = {success: false};
        var id = data._id;
        delete data._id;
        var update = {
            $set: data
        };
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).update({_id: id}, update, {w: 1}, function (err) {
            if (!err) {
                mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).findOne({_id: id}, function (err, flow) {
                    if (!err) {
                        result.success = true;
                        result.data = flow;
                    } else {
                        logger.app.error("", err);
                    }
                    callback(result);
                });
            } else {
                logger.app.error("", err);
                callback(result);
            }
        });
    },

    getQuestionnaireTempStatusById: function(data, session, callback){
        var result = {success: false};
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).findOne(data,function(err,dbField){
            if(!err && dbField){
                result.success = true;
                result.data = {};
                result.data._id = dbField._id;
                result.data.qstatus = dbField.qstatus;
                callback(result);
            } else {
                logger.app.error("getQuestionnaireTempStatusById error!", err || new Error(""));
                result.message = "获取模板状态配置信息异常！";
                callback(result);
            }
        });
    },

    updateQuestionnaireTempStatusById: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_TEMP).update({_id: data._id},{$set:{qstatus: data.qstatus}}, function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.error("updateQuestionnaireTempStatusById error!", err || new Error(""));
                result.message = "更新模板状态配置信息异常！";
                callback(result);
            }
        });
    },
    checkTempIsUsed: function (data, session, callback) {
        var result = {success: false};
        var condition = {temp_id: data.temp_id};
        mongo.db(session).collection(session.user.account + fields.DB_ACCOUNT_QUESTIONNAIRE).count(condition, function (err, count) {
            if (!err) {
                result.success = true;
                result.count = count;
                if(count>0){
                    result.isUsed=true;
                }else{
                    result.isUsed=false;
                }
                callback(result);
            } else {
                callback(result);
            }
        });
    }

};

var impl = {
    _addDefaultTempFields: function (tempId, callback) {
        var name = {
            _id: tempId+"_name",
            temp_id: tempId,
            name: "客户姓名",
            desc: "系统生成"
        }
        var phone = {
            _id: tempId + "_phone",
            temp_id: tempId,
            name: "联系方式",
            desc: "系统生成"
        }

        var defaultFields = [];
        defaultFields.push(name);
        defaultFields.push(phone);

        mongo.db().collection(fields.DB_ACCOUNT_QUESTIONNAIRE_FIELD).insert(defaultFields, function (err) {
            callback(err);
        });


    }
}


module.exports = handler;
