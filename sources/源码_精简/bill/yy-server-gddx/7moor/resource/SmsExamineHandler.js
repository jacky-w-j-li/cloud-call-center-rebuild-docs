var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var accountHandler = require(__baseDir + "/7moor/account/AccountHandler");
var Then = require("thenjs");

var handler = {
    querySmsExamine: function(data,session,callback) {
        data.signToCheck={ $exists: true };
        //只查询待审核0和审核不通过2；审核通过1、审核取消3不查询
        data.status={$in : [0,2]};
        var condition = _impl._extractGridCondition(data);
        var result = {success:false};
        _impl._querySmsExamine(condition,function(err,count,resData){
            if(!err){
                result.success = true;
                result.count = count;
                result.list = resData;
            }else{
                result.message = '查询短信审核信息失败,'+err.message;
                logger.app.error('query dial count failed',err);
            }
            callback(result);
        });
    },
    queryTemplateType: function(data,session,callback) {
        var result = {success:false};
        mongo.db('cc').collection('app_dic_codes').find({code_type:"smsTemplateType"}).toArray(function(err,docs){
            if(!err){
                result.success = true;
                result.list = docs;
            }
            callback(result);
        });

    },
 /*   getsmsTemplateToCheckStatusCache: function (data, session, callback) {
        mongo.db("cc").collection("app_dic_codes").find({code_type:"smsTemplateToCheckStatus"}).toArray(function (err, smsTemplateToCheckStatus) {
            if (!err) {
                smsTemplateToCheckStatus = smsTemplateToCheckStatus || [];
                var caches = [];
                for (var i = 0; i < smsTemplateToCheckStatus.length; i++) {
                    var cache = {
                        codeType: "templateStatus",
                        codeOrder: i + 1,
                        codeName: smsTemplateToCheckStatus[i].code_name,
                        codeValue: smsTemplateToCheckStatus[i].code_value
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });

    },*/


    //查询沟通信息
    querySmsExamineMessages: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);
        var result = {success:false};

        _impl._querySmsExamineMessages(condition,function(err,resData){
            if(!err){
                result.success = true;
                result.list = resData;
            }else{
                result.message = '查询沟通信息失败,'+err.message;
                logger.app.error('query dial count failed',err);
            }
            callback(result);
        });
    },

    //不通过短信审核
    updateNoSmsExamine:function(data,session,callback){
        var result = {success: false};
        var data_id=data._id;
        var condition={
            _id:data_id
        }
        var messages={
            from:'admin',
            content:data.messages,
            time:utils.DateTime.getCurrentDateTime()
        }

        mongo.db("cc").collection(constants.DB.cc.app_sms_template).update(condition, {$push:{messages:messages},$set:{"status" : 2}} ,function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                result.message = "不通过审核失败！";
                callback(result);
            }
        });
    },
    //添加沟通信息
    addCommunicate:function(data,session,callback){
        var result = {success: false};
        var data_id=data._id;
        var condition={
            _id:data_id
        }
        var messages={
            from:'admin',
            content:data.messages,
            time:utils.DateTime.getCurrentDateTime()
        }

        mongo.db("cc").collection(constants.DB.cc.app_sms_template).update(condition, {$push:{messages:messages}} ,function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                result.message = "添加沟通信息失败！";
                callback(result);
            }
        });
    },
    //通过短信审核
    updateSmsExamine : function (data , session , callback){
        var result = {success: false};
        var data_id=data._id;
        data.num=data_id.substring(data_id.indexOf("_")+1);
        mongo.db().collection(constants.DB.platform_account).findOne({_id:data.account},function(err , oneAccount){
            if(!err){
                if(oneAccount){
                    //utils.BusinessUtil.getSmsTempleteId(data.account , function(err , num ) {
                        //data._id = data.account + "_" + num;
                       // data.num = num + "";
                        var content = data.content || "";
                        var matchRs = content.match(/\{\d+\}/g) || [];
                        data.vars = matchRs.length;
                        data.createTime = utils.DateTime.getCurrentDateTime()
                        var sign = data.sign|| "";
                        var signContent = sign;
                        var isYtxChannel = data.smsChannel && (data.smsChannel.indexOf("ytx") >= 0 || data.smsChannel.indexOf("ytxyx") >= 0);
                        sign=sign.replace("【","").replace("】","").trim().toString();
                        //如果不是已有签名，则新增签名。
                        mongo.db("cc").collection(constants.DB.app_sms_sign).findOne({account: data.account,name:"【"+sign+"】"}, function (err, dbSign) {
                            if (!err) {
                                Then()
                                    .then(function (cont) {
                                        if (!dbSign) {
                                            var signData = {
                                                account: data.account,
                                                name: sign
                                            };
                                            accountHandler.addSmsSign(signData, session, function (signResult) {
                                                if (signResult.success) {
                                                    data.signId = signResult.signInfo._id;
                                                    cont();
                                                } else {
                                                    result.message = "保存短信签名失败！";
                                                    return callback(result);
                                                }
                                            });
                                        } else {
                                            signContent = dbSign.name;
                                            data.signId=dbSign._id;
                                            cont();
                                        }
                                    })
                                    .then(function (cont) {
                                        if (isYtxChannel) {
                                            data.sign=data.signId;
                                            //云通讯短信模板备案
                                            var params = utils.collect(data,{signContent:signContent,_id:data._id});
                                            utils.BusinessUtil.addYTXSmsTemplate(params, cont);
                                        } else {
                                            cont();
                                        }
                                    })
                                    .then(function(cont){
                                        if (isYtxChannel) {
                                            result.success = true;
                                            return callback();
                                        }
                                        var condition={
                                            _id:data_id
                                        }
                                        data.sign=data.signId;
                                        data.templateType=data.templateType.templateType;
                                        data.status=1;
                                        mongo.db("cc").collection(constants.DB.cc.app_sms_template).update(condition, {$set:data} ,function (err) {
                                            if (!err) {
                                                result.success = true;
                                                callback(result);
                                            } else {
                                                result.message = "保存短信模板失败！";
                                                callback(result);
                                            }
                                        });
                                    })
                                    .fail(function(cont,err){
                                        logger.app.error(err);
                                        result.message = "保存短信模板失败！"+err.message;
                                        callback(result);
                                    });
                            } else {
                                result.message = "保存短信模板失败！";
                                callback(result);
                            }
                        });
                    //});
                } else {
                    result.message = '该账户不存在！';
                    callback(result);
                }
            } else {
                logger.app.error(err);
                result.message = ' method updateSmsExamine error!';
                callback(result);
            }
        });
    },
    queryAccountCount: function(data,session,callback) {
        var condition = _impl._extractGridCondition(data);
        var result = {success:false};

        _impl._queryAccountCount(condition,function(err,count,resData){
            if(!err){
                result.success = true;
                result.count = count;
                result.list = resData;
            }else{
                result.message = '查询拨号计数失败,'+err.message;
                logger.app.error('query dial count failed',err);
            }

            callback(result);
        });
    },
    queryCompanyName: function(data,session,callback) {
        var result = {success:false};

        var condition={
            _id:data
        }

        _impl._queryAccountCountSet(condition,function(err,resData){
            if(!err){
                result.success = true;
                result.list = resData;
            }else{
                result.message = '查询拨号计数失败,'+err.message;
                logger.app.error('query dial count failed',err);
            }

            callback(result);
        });
    },
    updateDialCount: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data._id,
        };
        var update = {
            callCount : data.callCount,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
        }
        _impl._updateDialCount(condition,update,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新拨号计数失败,"+err.message ;
                logger.app.error("update dial count  failed",err);
            }
            callback(result);
        });
    },
    //设置账户拨号
    updateDialCountAcc: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data.account,
        };
        //[name: "3", companyName: "无", accountCount: "1", accountResidualCount: "0"]
        var update={
            _NIndex:utils.UUID.generateUuid(),
            name:data.name,
            companyName:data.companyName,
            accountCount:data.accountCount,
            accountResidualCount:data.accountResidualCount
        };
        _impl._updateDialCountAcc(condition,update,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新拨号计数失败,"+err.message ;
                logger.app.error("update dial count  failed",err);
            }
            callback(result);
        });
    },

    //修改账户限制
    updateDialCountAccSet: function(data,session,callback){
        var result = {success: false};
        var condition = {
            _id : data.account,
            "account._NIndex":data._NIndex
        };
        //$set:{"account.$.companyName":"7moorsss","account.$.accountCount": "1"}
        var update={
            "account.$.name":data.name,
            "account.$.companyName":data.companyName,
            "account.$.accountCount":data.accountCount,
            "account.$.accountResidualCount":data.accountResidualCount
        };
        _impl._updateDialCountAccSet(condition,update,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = "更新拨号计数失败,"+err.message ;
                logger.app.error("update dial count  failed",err);
            }
            callback(result);
        });
    },



    //添加拨号计数失败列表
    addDialCountNum: function(data,session,callback){
        var result = {success: false};
        var insert ={
            _id : data._id,
            callCount : data.callCount,
            residualCount : data.callCount,
            lastUpdateTime : utils.DateTime.getCurrentDateTime(),
            createTime : utils.DateTime.getCurrentDateTime(),
        };
        _impl._addDialCountNum(insert,function(err){
            if(!err){
                result.success = true;
            }else{
                result.message = ","+err.message;
                logger.app.error("add dial count failed",err);
            }
            callback(result);
        });
    },
    removeDialCount: function(data,session,callback){
        var result = {success:false};
        var condition = {
            _id : data._id,
        };
        _impl._removeDialCount(condition,function(err){
            if(!err){
                result.success = true;
            } else{
                result.message = "删除拨号计数失败,"+err.message;
                logger.app.error("remove dial count failed",err);
            }
            callback(result);
        });
    },
    //删除拨号计数中的数组元素
    removeAccountCount: function(data,session,callback){
        var result = {success:false};
        var condition = {
            _id : data.id,
        };
        var update ={
            name : data.name
        }
        _impl._removeAccountCount(condition,update,function(err){
            if(!err){
                result.success = true;
            } else{
                result.message = "删除账户计数失败,"+err.message;
                logger.app.error("remove dial count failed",err);
            }
            callback(result);
        });
    }


};

var _impl = {
    _extractGridCondition : function(data){
        var condition = {
            limit : data.limit || 10,
            skip  : ((data.page || 1) - 1) * (data.limit || 10),
            query : function(){
                delete data.limit;
                delete data.page;

                return data;
            }()};

        return condition;
    },
    _querySmsExamine : function(condition,callback) {
        mongo.db("cc").collection(constants.DB.cc.app_sms_template).count(condition.query,function(err,count){
            if(err){
                logger.app.err("query sms_examine  error");
                callback(err);
                return;
            }

            mongo.db("cc").collection(constants.DB.cc.app_sms_template).find(condition.query,{sort:{_id:1},limit:condition.limit,skip:condition.skip}).toArray(function(err,records){
                if(err){
                    logger.app.err("query sms_examine  error");
                    callback(err);
                    return;
                }

                callback(null,count,records);
            });
        });
    },

    _querySmsExamineMessages : function(condition,callback) {
        mongo.db("cc").collection(constants.DB.cc.app_sms_template).find(condition.query,{sort:{_id:1},limit:condition.limit,skip:condition.skip}).toArray(function(err,records){
            if(err){
                logger.app.err("query sms_examine  error");
                callback(err);
                return;
            }

            callback(null,records[0].messages);
        });
    },
    _queryDialId : function(condition,callback) {
        mongo.db().collection(constants.DB.call_count_set).find(condition).toArray(function(err,records){
            if(err){
                logger.app.err("query sms dial_count  list error");
                callback(err);
                return;
            }
            callback(null,records);
        });
    },
    _queryAccountCount : function(condition,callback) {
        mongo.db().collection(constants.DB.call_count_set).count(condition.query,function(err,count){
            if(err){
                logger.app.err("query dial_count count error");
                callback(err);
                return;
            }

            mongo.db().collection(constants.DB.call_count_set).find(condition.query,{sort:{_id:1},limit:condition.limit,skip:condition.skip}).toArray(function(err,records){
                if(err){
                    logger.app.err("query sms dial_count  list error");
                    callback(err);
                    return;
                }
                callback(null,count,records[0].account);
            });
        });
    },
    _queryAccountCountSet : function(condition,callback) {
        mongo.db().collection(constants.DB.platform_account).find(condition).toArray(function(err,records){
            if(err){
                logger.app.err("query sms dial_count  list error");
                callback(err);
                return;
            }
            callback(null,records);
        });
    },
    _updateDialCount : function(condition, update,callback){
        mongo.db().collection(constants.DB.call_count_set).update(condition, {$set: update}, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });
    },
    _updateDialCountAcc:function (condition, update,callback) {
        mongo.db().collection(constants.DB.call_count_set).update(condition, {$push: {account:update}}, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    },
    _updateDialCountAccSet:function (condition, update,callback) {
        //db.getCollection('call_count_set').update({"_id":"1024744689","account._NIndex" : "94333320-9440-11e6-be32-61a2896df793"},{$set:{"account.$.companyName":"7moorsss","account.$.accountCount": "1"}})
        mongo.db().collection(constants.DB.call_count_set).update(condition, {$set:update}, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    },
    _addDialCountNum : function(insert,callback){
        mongo.db().collection(constants.DB.call_count_set).insert(insert, {w: 1}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });
    },
    _removeDialCount : function(condition,callback){
        mongo.db().collection(constants.DB.call_count_set).remove(condition, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    },
    _removeAccountCount : function(condition,update,callback){
        //db.getCollection('call_count_set').update({ _id:'234' },{$pull : {'account' :{'name' :'6'} }})
        mongo.db().collection(constants.DB.call_count_set).update(condition,{$pull: {account:update}}, function (err) {
            if (!err) {
                callback();
            } else {
                callback(err);
            }
        });

    }

};


module.exports = handler;
