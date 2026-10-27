var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    getCheckedSms : function (data , session , callback){
        var userName = session.user.loginName || "";
        if(userName == "admin"){ //管理员查看所有数据
            data.checkUser = {$ne:null}
        } else {
            data.checkUser = userName;
        }
        if(data.m7Status == "pass"){
            data.m7Status = {$ne:"unpass"};
        }
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        mongo.db("cc").collection(constants.DB.app_sms_send).count(data , function(err ,count){
            if(!err){
                result.count = count;
                mongo.db("cc").collection(constants.DB.app_sms_send).find(data ,{sort:{checkTime:-1},limit: limit, skip: skip}).toArray(function(err,dbSms){
                    dbSms = dbSms || [];
                    if(!err){
                        for(var i=0;i<dbSms.length;i++){
                            if(dbSms[i].nums){
                                dbSms[i].num = dbSms[i].nums;
                            }
                        }
                        result.list = dbSms;
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "查询已审核短信失败";
                        callback(result);
                    }
                });
            } else {
                result.message = "查询已审核短信失败";
                callback(result);
            }
        });
    },
    getCheckSms: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        mongo.db("cc").collection(constants.DB.app_sms_send).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db("cc").collection(constants.DB.app_sms_send).find(data, {sort: {submitTime: 1}, limit: limit, skip: skip}).toArray(function (err, dbSms) {
                    dbSms = dbSms || [];
                    if (!err) {
                        for(var i=0;i<dbSms.length;i++){
                            if(dbSms[i].nums){
                                dbSms[i].num = dbSms[i].nums;
                            }
                        }
                        result.list = dbSms;
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "查询审核短信失败";
                        callback(result);
                    }
                });
            } else {
                result.message = "查询审核短信失败";
                callback(result);
            }
        });
    },
    getCheckSmsById: function (data, session, callback) {
        var result = {success: false};
        mongo.db("cc").collection(constants.DB.app_sms_send).findOne(data, function (err, dbSms) {
            if (!err) {
                result.success = true;
                result.data = dbSms;
                callback(result);
            } else {
                result.message = "查询短信信息失败";
                callback(result);
            }
        });
    },
    checkSmsByUser : function (data , session , callback){
        var result = {success: false};
        var user = data.checkUser || "";
        var list = data.smsList || [];
        var action = data.check;
        if(action == "pass"){ //审核通过
            var updateData = {
                m7Status: "ready",
                checkUser: user,
                checkTime: utils.DateTime.getCurrentDateTime()
            };
            _impl._updateSmsStatus(updateData,list,function(err){
                if(!err){
                    result.success = true;
                    callback(result);
                } else {
                    result.message = "更新短信状态异常";
                    callback(result);
                }
            });

        } else { //审核未通过
            var updateData = {
                m7Status: "unpass",
                checkUser: user,
                checkTime: utils.DateTime.getCurrentDateTime(),
                by_errordescription : data.message
            };
            _impl._updateSmsStatus(updateData,list,function(err){
                if(!err){
                    result.success = true;
                    callback(result);
                } else {
                    result.message = "更新短信状态异常";
                    callback(result);
                }
            });
        }
    }
};

var _impl = {
    /**
     * 更新短信列表
     * @param update
     * @param smsList
     * @param callback
     * @private
     */
    _updateSmsStatus : function (update , smsList , callback){
        var smsIds = [];
        for(var i =0 ;i < smsList.length;i++){
            var obj = smsList[i];
            smsIds.push(obj._id);
        }
        mongo.db("cc").collection(constants.DB.app_sms_send).update({_id:{$in:smsIds},m7Status:"check"},{$set:update},{multi:true},function(err){
            if(!err){
                var index = 0;
                var result = null;
                var updateAppSms = function(){ //更新一条appSms
                    if(index == smsList.length){
                        callback(result);
                        return;
                    }
                    var smsObj = smsList[index];
                    utils.BusinessUtil.getAccountAppDb(smsObj.account , function(err , dbName){
                        if(!err){
                            mongo.db(dbName).collection(smsObj.account+ "_sms").update({_id:smsObj._id,m7Status:"check"},{$set:update},function(err){
                                if(err){
                                    logger.app.error(err);
                                    result = err;
                                }
                                index++;
                                updateAppSms();
                            });
                        } else {
                            logger.app.error(err);
                            result = err;
                            index++;
                            updateAppSms();
                        }
                    });
                };
                updateAppSms();
            } else {
                callback(err);
            }
        });
    }
}

module.exports = handler;
