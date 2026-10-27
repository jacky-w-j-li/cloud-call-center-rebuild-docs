var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig');
var financeAccountDBProxy = require(__baseDir + "/7moor/account/FinanceAccountDBProxy");
var VoiceVerifyConsume = require(__baseDir + '/models/VoiceVerifyConsume');
var VoiceVerifyDetail = require(__baseDir + '/models/VoiceVerifyDetail');

var handler = {
    getAccountMonthList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;

        var table="";
        table=constants.DB.bill_call_consume;

        var condition = data||{};
        if(data.name=="smsCC"){
            delete data.name;
            table=constants.DB.bill_sms_consume;
            condition.name=constants.product.cc;
        }else if(data.name=="smsZJ"){
            delete data.name;
            table=constants.DB.bill_sms_consume;
            condition.name=constants.product.zj
        }else if(data.name=="ll"){
            delete data.name;
            table=constants.DB.bill_flow_consume;
            condition.name=constants.product.ll
        }else if(data.name=="yy"){
            delete data.name;
            table=constants.DB.bill_voiceVerify_consume;
            condition.name=constants.product.yy
        }

        condition.account=session.account._id;
        utils.removeEmptyProperty(condition);

        financeAccountDBProxy.queryAccountBill(condition, { limit: limit, skip: skip , table: table}, function (err, results) {
            if (err) {
                logger.app.error(err);
                callback(result);
            } else {
                result.isFinanceAccount = results.isFinanceAccount;
                result.list = results.bills;
                result.count = results.count;
                result.success = true;
                callback(result);
            }
        });

        // mongo.db("bill_data").collection(table).find(condition,{sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
        //     if (!err) {
        //         result.list = docs||[];
        //         mongo.db("bill_data").collection(table).count(condition, function (err, count) {
        //             if (!err) {
        //                 result.count = count;
        //                 result.success = true;
        //                 callback(result);
        //             } else {
        //                 logger.app.error(err);
        //                 callback(result);
        //             }
        //         });
        //     } else {
        //         logger.app.error(err);
        //         callback(result);
        //     }
        // });
    },
    __initQuery:function(condition,month,product){
        var start=condition.beginTime;
        var end =condition.endTime;
        condition.endTimeDisplay={"$gte":month+"-01 00:00:00","$lte":month+"-31 23:59:59"};
        if(start){
            condition.endTimeDisplay["$gte"]=start+" 00:00:00";
        }
        if(end){
            condition.endTimeDisplay["$lte"]=end+" 23:59:59";
        }
        delete condition.beginTime;
        delete condition.endTime;

/*        var tel=condition.combox;
        if(tel){
            if(product=="400"){
                condition.cid=tel;
            }else{
                condition.did=tel;
            }
*//*            var ary=[];
            ary.push({"cid":tel});
            ary.push({"did":tel});
            condition.$or = ary;*//*
            delete condition.combox;
        }*/
        if(condition.dialType){
            condition.type = condition.dialType;
            delete condition.dialType
        }
    },
    getMonthDetailList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        var key=data.monthId;
        delete data.monthId;
        var ary=key.split("_");
        var month=ary[1];
        var product=ary[2];
        var table="";
        if(product=="zj"){
            table=constants.DB.bill_cdr_query_zj;
        }else if(product=="cc"){
            table=constants.DB.bill_cdr_query_cc;
        }else if(product=="400"){
            table=constants.DB.bill_cdr_query_400;
            condition.did=ary[3];
        }
        utils.removeEmptyProperty(condition);
        handler.__initQuery(condition,month,product);
        mongo.db("bill_data").collection(table).find(condition,{sort:{endTimeDisplay:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db("bill_data").collection(table).count(condition, function (err, count) {
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
                logger.app.error(err);
                callback(result);
            }
        });
    },
    __initSmsQuery:function(condition,month,product){
        var start=condition.beginTime;
        var end =condition.endTime;
        condition.submitTime={"$gte":month+"-01 00:00:00","$lte":month+"-31 23:59:59"};
        if(start){
            condition.submitTime["$gte"]=start+" 00:00:00";
        }
        if(end){
            condition.submitTime["$lte"]=end+" 23:59:59";
        }
        delete condition.beginTime;
        delete condition.endTime;

        var num=condition.combox;
        if(num){
            condition.num=num;
        }
        delete condition.combox;
        if(product=='cc'){
            condition.product='cc';
        }

    },
    getSmsMonthDetailList:  function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        var key=data.monthId;
        delete data.monthId;
        var ary=key.split("_");
        var month=ary[1];
        var product=ary[2];
        var table="";
        if(product=="cc"){
            table=constants.DB.bill_sms_detail_cc;
        }else if(product=="zj"){
            table=constants.DB.bill_sms_detail_zj;
        }
        utils.removeEmptyProperty(condition);
        handler.__initSmsQuery(condition,month,product);

        mongo.db("bill_data").collection(table).find(condition,{sort:{submitTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db("bill_data").collection(table).count(condition, function (err, count) {
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
                logger.app.error(err);
                callback(result);
            }
        });
    },
    __initllQuery:function(condition,month){
        var start=condition.beginTime;
        var end =condition.endTime;
        condition.time={"$gte":month+"-01 00:00:00","$lte":month+"-31 23:59:59"};
        if(start){
            condition.time["$gte"]=start+" 00:00:00";
        }
        if(end){
            condition.time["$lte"]=end+" 23:59:59";
        }
        delete condition.beginTime;
        delete condition.endTime;
        var phoneNum=condition.combox;
        if(phoneNum){
            condition["sendData.phoneNum"]=phoneNum;
        }
        delete condition.combox;
    },
    getllMonthDetailList:  function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        var key=data.monthId;
        delete data.monthId;
        var table=constants.DB.bill_flow_detail;
        var ary=key.split("_");
        var month=ary[1];
        utils.removeEmptyProperty(condition);
        handler.__initllQuery(condition,month);
        mongo.db("bill_data").collection(table).find(condition,{sort:{time:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db("bill_data").collection(table).count(condition, function (err, count) {
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
                logger.app.error(err);
                callback(result);
            }
        });
    },
   /* get400MonthDetailList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        var key=data.monthId;
        delete data.monthId;
        var ary=key.split("_");
        var month=ary[1];
        utils.removeEmptyProperty(condition);
        handler.__initQuery(condition,month);
        mongo.db("bill_data").collection(constants.DB.bill_cdr_query_400).find(condition,{sort:{beginTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db("bill_data").collection(constants.DB.bill_cdr_query_400).count(condition, function (err, count) {
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
                logger.app.error(err);
                callback(result);
            }
        });
    },*/
    getyyMonthFeeById: function(data,session,callback){
        var result = {success: false};
        var condition = {_id:data.monthId};
        VoiceVerifyConsume.get(condition,function(err,consume){
            if(err){
                logger.app.error(err);
                return callback(result);
            }
            result.monthFee = consume;
            result.success = true;
            callback(result);
        });
    },
    __inityyQuery:function(condition,month,product){
        var start=condition.beginTime;
        var end =condition.endTime;
        condition.time={"$gte":month+"-01 00:00:00","$lte":month+"-31 23:59:59"};
        if(start){
            condition.time["$gte"]=start+" 00:00:00";
        }
        if(end){
            condition.time["$lte"]=end+" 23:59:59";
        }
        delete condition.beginTime;
        delete condition.endTime;

        var num=condition.combox;
        if(num){
            condition["sendData.to"]=num;
        }
        delete condition.combox;
    },
    getyyMonthDetailList: function(data,session,callback){
        var result = {success: false};

        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete data.page;

        var condition = data||{};
        condition.account=session.account._id;

        var arr=data.monthId.split("_");
        var month=arr[1];
        delete data.monthId;

        utils.removeEmptyProperty(condition);
        handler.__inityyQuery(condition,month);

        VoiceVerifyDetail.findByPage(condition,pageSize,page,function(err,rows,count){
            if(err){
                logger.app.error(err);
                return callback(result);
            }
            result.success = true;
            result.list = rows;
            result.count = count;
            callback(result);
        });



    },
    getMonthFeeById: function (data, session, callback) {
        var result = {success: false};
        var key=data.monthId
        mongo.db("bill_data").collection(constants.DB.bill_call_consume).findOne({_id:key},function(err,row){
            if(!err){
                result.monthFee=row;
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getllMonthFeeById: function (data, session, callback) {
        var result = {success: false};
        var key=data.monthId
        mongo.db("bill_data").collection(constants.DB.bill_flow_consume).findOne({account:key},function(err,row){
            if(!err){
                result.monthFee=row;
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getSmsMonthFeeById: function (data, session, callback) {
        var result = {success: false};
        var key=data.monthId
        mongo.db("bill_data").collection(constants.DB.bill_sms_consume).findOne({_id:key},function(err,row){
            if(!err){
                result.monthFee=row;
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getConsumeById: function (data, session, callback) {
        var result = {success: false};
        mongo.db("bill_data").collection(constants.DB.bill_call_consume).findOne(data,function(err,row){
            if(!err){
                result.data=row;
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    }

};

module.exports = handler;
