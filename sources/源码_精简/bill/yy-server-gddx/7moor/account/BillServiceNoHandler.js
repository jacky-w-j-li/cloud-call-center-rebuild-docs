var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var ServiceNum = require(__baseDir + '/models/ServiceNum');
var Then = require('thenjs');


var handler = {
    queryNormalServiceNoList: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var skip = (page - 1) * limit;
        var condition = data||{};
//        condition.status='free';
        utils.removeEmptyProperty(condition);
        mongo.db().collection(constants.DB.platform_serviceNum).find(condition,{sort:{_id:1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(constants.DB.platform_serviceNum).count(condition, function (err, count) {
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
    querySet400ServiceNoList: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var skip = (page - 1) * limit;
        var condition = data||{};
        utils.removeEmptyProperty(condition);
        mongo.db().collection(constants.DB.platform_num400).find(condition,{sort:{_id:1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(constants.DB.platform_num400).count(condition, function (err, count) {
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
    lockServiceNo:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        utils.BusinessUtil.useServiceNum(data._id,function(err){
            if(!err){
                var set={
                    account:data.account,
                    flag:data.flag||''
                };
                mongo.db().collection(constants.DB.platform_serviceNum).findAndModify(query,[],{$set:set},{new:true},function(err,row){
                    if(!err){
                        result.row=row;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        result.message='选择服务号异常';
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.message='该号码已经被其他人抢用';
                callback(result);
            }
        });
    },
    setSnMonthRent:function(data,session,callback){
        var result={success:false};
        var query={_id:data._id};
        var set={monthRent:data.newMonthRent,flag:data.flag};
        mongo.db().collection(constants.DB.platform_serviceNum).count({account:data.account,flag:constants.serviceNumFlag.service,_id:{$ne:data._id}},function(err,count){
            if(!err){
                if(count>=1 && data.flag==constants.serviceNumFlag.service){
                    logger.app.warn("服务号只能添加一个");
                    result.message="服务号只能添加一个";
                    callback(result);
                }else if(count==0 && data.flag==constants.serviceNumFlag.didnum){
                    logger.app.warn("请先购买正式的服务号,再买直拨号码");
                    result.message="请先购买正式的服务号,再买直拨号码";
                    callback(result);
                }else{
                    mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
                        if(!err){
                            if (row && (row.monthRent != data.newMonthRent || row.flag!=data.flag)){
                                if(!row.initMonthRent){
                                    set.initMonthRent=row.monthRent;
                                }
                                mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, {w: 1}, function (err) {
                                    if (!err) {
                                        var history = {
                                            _id: utils.UUID.generateUuid(),
                                            time: utils.DateTime.getCurrentDateTime(),
                                            account: row.account,
                                            user: session.user._id,
                                            type: constants.operateLog.monthRent,
                                            serviceno:data._id
                                        }
                                        var content = "号码类型设为:"+data.flag==constants.serviceNumFlag.didnum?'直拨号码':'服务号';
                                        content += ",月租由【" + (row.monthRent || 0) + "】改为【" + data.newMonthRent + "】";
                                        history.content=content;
                                        mongo.db().collection(constants.DB.bill_operate_log).insert(history);
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        logger.app.error(err);
                                        result.message='设置服务号月租异常'
                                        callback(result);
                                    }
                                });
                            } else {
                                result.success = true;
                                callback(result);
                            }
                        }else{
                            logger.app.error(err);
                            result.message='设置服务号月租异常';
                            callback(result);
                        }
                    });
                }
            }else{
                logger.app.error(err);
                result.message='设置服务号月租异常';
                callback(result);
            }
        });
    },
    querySnSetLog: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        if(data.time){
            data.time = new RegExp(data.time);
        }

        mongo.db().collection(constants.DB.bill_operate_log).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_operate_log).find(data, {sort: {time: -1}, limit: limit, skip: skip}).toArray(function (err, logs) {
                    if (!err) {
                        logs = logs || [];
                        result.list = logs;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("querySnSetLog  error", err);
                        result.message = "查询号码操作记录信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("querySnSetLog count error", err);
                result.message = "查询号码操作记录信息异常！";
                callback(result);
            }
        });

    },
    checkNopayServiceNo:function(data,session,callback){
        var result = {success: false};
        var query={account:data.account};
        mongo.db().collection(constants.DB.platform_serviceNum).find(query).toArray(function(err,docs){
            if(!err){
                var num=0;
                var total=0;
                if(docs && docs.length>0){
                    for (var i = 0; i < docs.length; i++) {
                        var obj = docs[i];
                        if(obj.status==constants.serviceNumStatus.ready){
                            result.message="您有选择的号码还未支付，暂不能增加";
                            callback(result);
                            return;
                        }else if(obj.flag==constants.serviceNumFlag.service && obj.type==constants.serviceNumType.normal){
                            num++;
                        }
                        total++;
                    }
                }
//                if(num==0){
//                    result.message="请先购买正式的服务号";
//                    callback(result);
//                    return;
//                }
                result.serviceCount=num;
                result.total=total;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                result.message="查询是否存在未支付的号码异常";
                callback(result);
            }
        });
    },
    getServiceNoById:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        var uid=session.user._id;
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err){
                var currentTime=utils.DateTime.getCurrentDateTime();
                if(row.status==constants.serviceNumStatus.ready){
                    var lastTime=row.lastUpdateTime;
                    var lost = utils.DateTime.getDateDiff(lastTime,currentTime, "second")||0;
                    row.timeout=(8*3600)-lost;
                }
                if(row.endTime){
                    var endTime=row.endTime+' 23:59:59';
                    var day = utils.DateTime.getDateDiff(currentTime,endTime, "day");
                    var month=Math.round(day/30);
                    row.monthNum=month;
                }
                result.row=row;
                var account=row.account;
                handler.getSystemInfoById(uid,session,function(rep){
                    if(rep.success){
                        result.user=rep.user;
                        mongo.db().collection(constants.DB.platform_account).findOne({_id:account}, function (err,acc){
                            if(!err){
                                result.acc=acc;
                                result.success=true;
                                callback(result);
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        callback(rep);
                    }
                })
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getSystemInfoById:function(id,session,callback){
        var result = {success: false};
        if(!id){
            id=session.user._id;
        }
        var query={_id:id};
        mongo.db().collection(constants.DB.system_user).findOne(query,function(err,row){
            if(!err){
                var now=utils.DateTime.getCurrentDate();
                var _query={
                    _id:id+"_"+now
                };
                mongo.db().collection(constants.DB.bill_call_income).findOne(_query,function(err,call){
                    if(!err){
                        if(call){
                            row.nowCallIncome=call.income||0;
                        }else{
                            row.nowCallIncome=0;
                        }
                        var _query2={account:id,date:now};
                        mongo.db().collection(constants.DB.bill_400_income).find(_query2).toArray(function(err,call400){
                            if(!err){
                                call400=call400||[];
                                var nowCall400Income=0;
                                for (var i = 0; i < call400.length; i++) {
                                    var obj = call400[i];
                                    nowCall400Income+=obj.income;
                                }
                                row.nowCall400Income=nowCall400Income;
                                result.user=row;
                                result.success=true;
                                callback(result);
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _checkSnExist:function(data, callback){
        var result = {success: false};
        var payType=data.payType;
        var query={_id:data.serviceno,status:constants.serviceNumStatus.ready,account:data.account};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err){
                if(row){
                    result.success=true;
                    callback(result);
                }else{
                    if(payType==constants.payType.balance){
                        logger.app.error('serviceno is free or other person get');
                        result.message='该号码已经超时释放或被其他人抢用!';
                        callback(result);
                    }else{
                        logger.app.warn('serviceno['+data.serviceno+'] is free or other person get,but onliePay force update!');
                        result.success=true;
                        callback(result);
                    }
                }
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },

    reSelectServiceNo:function(data,session,callback){
        var result = {success: false};
        var set={
            flag:'',
            account: '',
            status:constants.serviceNumStatus.free
        };
        if(data.initMonthRent){
            set.monthRent=data.initMonthRent;
            set.initMonthRent='';
        }
        mongo.db().collection(constants.DB.platform_serviceNum).update({_id:data._id},{$set:set},function(err){
            if(!err){
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    setSnLine2Hp:function(data,session,callback){
        var result={success:false};
        var query={_id:data._id};
        var set={concurrent:data.concurrent};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err){
                if (row){
                    var set2={did:data.did,line:data.line};
                    mongo.db().collection(constants.DB.platform_account).update({_id:row.account}, {$set: set2}, function (err) {
                        if(err){
                            logger.app.error(err);
                        }
                    });
                    mongo.db().collection(constants.DB.platform_serviceNum).update(query, {$set: set}, {w: 1}, function (err) {
                        if (!err) {
                            var history = {
                                _id: utils.UUID.generateUuid(),
                                time: utils.DateTime.getCurrentDateTime(),
                                account: row.account,
                                user: session.user._id,
                                type: constants.operateLog.hpLine,
                                serviceno:data._id
                            }
                            var content = "选择线路:"+data.line;
                            content += ",设置并发:" + data.concurrent + ",设置透传号码:"+data.did;
                            history.content=content;
                            mongo.db().collection(constants.DB.bill_operate_log).insert(history);

                            var info={
                                account:row.account,
                                pbx:row.pbx,
                                serviceno:data._id,
                                concurrent:data.concurrent+""
                            }

                            syncAcs.updateServiceNo(info,function(isSuccess){
                                if(isSuccess){
                                    result.success = true;
                                }
                                callback(result);
                            });
                        } else {
                            logger.app.error(err);
                            result.message='设置hp服务号异常'
                            callback(result);
                        }
                    });
                } else {
                    result.success = true;
                    callback(result);
                }
            }else{
                logger.app.error(err);
                result.message='设置hp服务号异常';
                callback(result);
            }
        });
    },
    lockServiceNo2Hp:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        utils.BusinessUtil.useServiceNum(data._id,function(err){
            if(!err){
                var set={
                    account:data.account,
                    flag:constants.serviceNumFlag.service
                };
                mongo.db().collection(constants.DB.platform_serviceNum).findAndModify(query,[],{$set:set},{new:true},function(err,row){
                    if(!err){
                        result.row=row;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        result.message='选择服务号异常';
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.message='该号码已经被其他人抢用';
                callback(result);
            }
        });
    },
    queryServiceNum400Dic: function (data, session, callback) {
        var result = {success: false};
//        var condition = {status:{$in:[constants.serviceNumStatus.free,constants.serviceNumStatus.ready,constants.serviceNumStatus.try]}};
        var condition={};
        utils.removeEmptyProperty(condition);
        mongo.db().collection(constants.DB.platform_num400).find(condition,{_id:1},{sort:{_id:1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs ||[];
                var caches = [
                    {
                        codeType: "serviceNum400",
                        codeOrder:0,
                        codeName: '--请选择--',
                        codeValue: ''
                    }
                ];
                for(var i=0;i< docs.length;i++){
                    var cache = {
                        codeType: "serviceNum400",
                        codeOrder: i + 1,
                        codeName: docs[i]._id,
                        codeValue: docs[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getServiceNumDic: function(data,session,callback){
        Then(function(cont){
            ServiceNum.find(data,cont);
        })
            .then(function(cont,records){
                var caches = [];
                records = records || [];
                var i = 0;
                records.forEach(function(record){
                    var cache = {
                        codeType: "serviceNum",
                        codeOrder: i++,
                        codeName: record._id,
                        codeValue: record._id
                    };
                    caches.push(cache);
                });

                return cont(null,caches);
            })
            .then(function(cont,caches){
                return callback(null,caches);
            })
            .fail(function(cont,err){
               logger.app.error(err);
                return callback({
                   success : false,
                });
            });
    }


};

module.exports = handler;
