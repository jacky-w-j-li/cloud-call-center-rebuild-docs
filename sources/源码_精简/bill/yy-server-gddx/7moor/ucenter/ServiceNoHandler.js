var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var businessUtil = require('appUtil/BusinessUtil');
var notifyHandler = require(__baseDir + "/7moor/notify/NotifyHandler");
var financeAccountDBProxy = require(__baseDir + "/7moor/account/FinanceAccountDBProxy");

var handler = {
    queryMyServiceNo: function (data, session, callback) {
        var result = {success: false};
        var condition ={product:data.product,account:session.account._id};
        mongo.db().collection(constants.DB.platform_serviceNum).find(condition).toArray(function (err, docs) {
            if (!err) {
                result.tryCount=0;
                result.normalCount=0;
                for (var i = 0; i < docs.length; i++) {
                    var obj = docs[i];
                    if(obj.status==constants.serviceNumStatus.try){
                        result.tryCount++;
                    }else if(obj.status==constants.serviceNumStatus.use){
                        result.normalCount++;
                    }
                }
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    queryMyServer: function (data, session, callback) {
        var result = {success: false};
//        var condition ={flag:{$ne:''}};
        var condition =data||{};
        var aid=session.account._id;
        condition.account=aid;
        condition.bind400={$in:[null,'']};
        mongo.db().collection(constants.DB.platform_account).findOne({_id:aid}, function (err,acc){
            if(!err){
                result.account=acc;
                mongo.db().collection(constants.DB.platform_serviceNum).find(condition,{sort:{type:1,_id:1}}).toArray(function (err, docs) {
                    if (!err) {
                        result.tel = docs;
                        var _query={
                            account:aid,
                            product:condition.product
                        };
                        mongo.db().collection(constants.DB.platform_num400).find(_query,{sort:{_id:1}}).toArray(function (err, list) {
                            if (!err) {
                                result.tel400 = list;
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
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    queryTestServiceNoList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.status=constants.serviceNumStatus.free;
        condition.type=constants.serviceNumType.try;
        if(condition._id){
            condition._id = new RegExp(condition._id);
        }

        utils.removeEmptyProperty(condition);
//        var createMethod=session.account.createMethod;
//        var createUser=session.account.createUser;
//        condition.owner={$in:[null,""]};
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
    queryServiceNoList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.status=constants.serviceNumStatus.free;
        condition.type=constants.serviceNumType.normal;

        if(condition.startPrice){
            var start=utils.formatFee(parseFloat(condition.startPrice));
            condition.monthRent = {$gte:start};
            delete condition.startPrice;
        }
        if(condition.endPrice){
            var end=utils.formatFee(parseFloat(condition.endPrice));
            if(!condition.monthRent)condition.monthRent={};
            condition.monthRent["$lte"] = end;
            delete condition.endPrice;
        }
        if(condition._id && condition.city){
//            condition.$and =[{_id:{$regex:"^"+condition.city}},{_id:{$regex:condition._id}}];
            condition._id = new RegExp("^"+condition.city+".*"+condition._id);
        }else if(condition._id){
            condition._id = new RegExp(condition._id);
        }else if(condition.city){
            condition._id = new RegExp("^"+condition.city);
        }
        delete condition.city;
        utils.removeEmptyProperty(condition);
        var createMethod=session.account.createMethod;
        var createUser=session.account.createUser;
        if(createMethod==constants.systemUserIndentity.proxy && createUser){
            mongo.db().collection(constants.DB.system_user).findOne({_id:createUser},function(err,sysUser){
               if(!err && sysUser){
                    var numScope=sysUser.numScope||"all";
                    if(numScope=="me"){
                        condition.owner=createUser;
                    }else{
                        condition.owner={$in:[createUser,null,""]};
                    }
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
               }else{
                   logger.app.error(err);
                   callback(result);
               }
            });
        }else{
            condition.owner={$in:[null,""]};
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
        }
    },
    query400ServiceNoList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.status='free';
        if(condition._id){
            condition._id = new RegExp(condition._id);
        }
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
    checkServiceNoExist:function(data,callback){
        var result = {success: false};
        var query={_id:data.serviceno,status:constants.serviceNumStatus.ready,account:data.account};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err){
                if(row){
                    var lastTime=row.readyTime;
                    var currentTime=utils.DateTime.getCurrentDateTime();
                    var lost = utils.DateTime.getDateDiff(lastTime,currentTime, "second")||0;
                    var timeout=(8*3600)-lost;
                    if(timeout<=0){
                        var msg='服务号已超过8小时锁定时间,暂不能支付,将在10分钟后释放';
                        logger.app.error(msg);
                        result.message=msg;
                        callback(result);
                        return;
                    }
                    result.success=true;
                    callback(result);
                }else{
                    result.code='404';
                    logger.app.error('serviceno is free or other person get');
                    callback(result);
                }
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    check400ServiceNoExist:function(data,callback){
        var result = {success: false};
        var query={_id:data.serviceno,status:constants.serviceNumStatus.ready,account:data.account};
        mongo.db().collection(constants.DB.platform_num400).findOne(query,function(err,row){
            if(!err){
                if(row){
                    var lastTime=row.readyTime;
                    var currentTime=utils.DateTime.getCurrentDateTime();
                    var lost = utils.DateTime.getDateDiff(lastTime,currentTime, "second")||0;
                    var timeout=(8*3600)-lost;
                    if(timeout<=0){
                        var msg='服务号已超过8小时锁定时间,暂不能支付,将在10分钟后释放';
                        logger.app.error(msg);
                        result.message=msg;
                        callback(result);
                        return;
                    }
                    result.success=true;
                    callback(result);
                }else{
                    result.code='404';
                    logger.app.error('serviceno is free or other person get');
                    callback(result);
                }
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
                        result.code='404';
                        logger.app.error('serviceno is free or other person get');
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
    _check400SnExist:function(data, callback){
        var result = {success: false};
        var payType=data.payType;
        var query={_id:data.serviceno,status:constants.serviceNumStatus.ready,account:data.account};
        mongo.db().collection(constants.DB.platform_num400).findOne(query,function(err,row){
            if(!err){
                if(row){
                    result.row=row;
                    result.success=true;
                    callback(result);
                }else{
                    if(payType==constants.payType.balance){
                        result.code='404';
                        logger.app.error('serviceno is free or other person get');
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
    addServiceNo2Test: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var beginTime=utils.DateTime.getCurrentDate();
        var aid=session.account._id;
        var pbx=utils.getProductPbx(data.product,session);
        data.account=aid;
        data.pbx=pbx;

        mongo.db().collection(constants.DB.platform_serviceNum).count({account:aid,product:data.product,type:'try'},function (err, total) {
            if (!err) {
                if(total>=2){
                    result.message="试用号码最多选择2个！";
                    callback(result);
                }else{
                    var date=new Date();
                    var endTime=utils.DateTime.dateAdd('d',10,date);
                    endTime=utils.DateTime.getDateDesc(endTime);
                    var sn=data._id;
                    var query={_id:sn};
                    var set={
                        account: aid,
                        beginTime:beginTime,
                        endTime: endTime,
                        pbx:pbx,
                        status:constants.serviceNumStatus.try,
                        flag:"",
                        product:data.product,
                        lastUpdateTime:time
                    };
                    if(data.product==constants.product.cc){
                        set.flag=constants.serviceNumFlag.service;
                    }
                    utils.BusinessUtil.useServiceNum(sn,function(err){
                        if(!err){
                            mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                                if(!err){
                                    var id=utils.UUID.generateUuid();
                                    var record={
                                        _id:id,
                                        serviceno:sn,
                                        createTime:time,
                                        account:aid,
                                        status:'add',
                                        type:"try"
                                    };
                                    mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);
                                    result.success = true;
                                    callback(result);
//                            var info={
//                                account:data.account,
//                                pbx:data.pbx,
//                                serviceno:sn,
//                                type:constants.serviceNumFlag.service,
//                                maxCall:"1"
//                            }
//                            syncAcs.addServiceNo(info,function(isSuccess){
//                                if(isSuccess){
//                                    result.success = true;
//                                }
//                                callback(result);
//                            });
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }else{
                            logger.app.error(err);
                            result.code='404';
                            callback(result);
                        }
                    })
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    addServiceNoCCTest: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var beginTime=utils.DateTime.getCurrentDate();
        var aid=session.account._id;
        var pbx=utils.getProductPbx(data.product,session);
        data.account=aid;
        data.pbx=pbx;
        var date=new Date();
        var endTime=utils.DateTime.dateAdd('d',10,date);
        endTime=utils.DateTime.getDateDesc(endTime);
        var sn=data._id;
        var query={_id:sn};
        var set={
            account: aid,
            beginTime:beginTime,
            endTime: endTime,
            pbx:pbx,
            status:constants.serviceNumStatus.try,
            flag:"",
            product:data.product,
            lastUpdateTime:time
        };
        if(data.product==constants.product.cc){
            set.flag=constants.serviceNumFlag.service;
        }
        utils.BusinessUtil.useServiceNum(sn,function(err){
            if(!err){
                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                    if(!err){
                        var id=utils.UUID.generateUuid();
                        var record={
                            _id:id,
                            serviceno:sn,
                            createTime:time,
                            account:aid,
                            status:'add',
                            type:"try"
                        };
                        mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.code='404';
                callback(result);
            }
        })

    },
    approveServiceNoTest: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        var pbx=utils.getProductPbx(data.product,session);
        data.pbx=pbx;

        var sn=data._id;
        var query={_id:sn};
        var set={
            account: aid,
            pbx:pbx,
            status:constants.serviceNumStatus.verify,
            flag:"",
            product:data.product,
            lastUpdateTime:time
        };
        if(data.product==constants.product.cc){
            set.flag=constants.serviceNumFlag.service;
        }
        utils.BusinessUtil.useServiceNum(sn,function(err){
            if(!err){
                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                    if(!err){
                        var id=utils.UUID.generateUuid();
                        var record={
                            _id:id,
                            serviceno:sn,
                            createTime:time,
                            product:data.product,
                            account:aid,
                            status:"add",
                            type:"verify"
                        };
                        mongo.db().collection(constants.DB.platform_approve_serviceNum).insert(record);
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.code='404';
                callback(result);
            }
        })
    },
    updateServiceNo2Test: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        var day=parseInt(data.day,10);
        var sn=data._id;
        var query={_id:sn};
        //var identitys=constants.identitys.join(" ");
        //if(identitys.indexOf(session.account.billIdentity)==-1){
        //    result.message="禁止该操作！";
        //    callback(result);
        //    return;
        //}

        var hasLimit=utils.isHasLimit(session,"func_cc_sn_delay_try");
        if(!hasLimit){
            result.message="禁止该操作！";
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err && row){
//                if(row.status!=constants.serviceNumStatus.try){
//                    result.message="该号码不是试用号码";
//                    callback(result);
//                    return;
//                }
                var start=row.endTime+" 00:00:00";
                var date2=new Date(Date.parse(start.replace(/-/g,"/")));
                var endTime=utils.DateTime.dateAdd('d',day,date2);
                endTime=utils.DateTime.getDateDesc(endTime);
                var set={
                    endTime: endTime,
                    lastUpdateTime:time
                };
                if(row.status==constants.serviceNumStatus.stopTry){
                    set.status=constants.serviceNumStatus.try;
                }else if(row.status==constants.serviceNumStatus.stop){
                    set.status=constants.serviceNumStatus.use;
                }
                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                    if(!err){
                        var id=utils.UUID.generateUuid();
                        var record={
                            _id:id,
                            resource:row._id,
                            createTime:time,
                            account:row.account,
                            status:'delayTest',
                            type:"serviceno",
                            operator:session.account.billLoginName,
                            memo:"延期"+day+"天，到期日期为"+endTime
                        };
                        mongo.db().collection(constants.DB.bill_test_renew_record).insert(record);
                        result.success = true;
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
    },
    _initTime:function(date){
        var date2=date.replace(/-/g,"");
        date2=parseInt(date2,10);
        return date2;
    },
    resetTime: function (data, session, callback) {
        var result = {success: false};
        var aid=session.account._id;

        var resetTime=data.resetTime;//获取到的设置时间
        var resetTime2=handler._initTime(resetTime);//用于与现在时间time2比较
        var time=utils.DateTime.getCurrentDateTime();//更新时间
        var time2=handler._initTime(time);

        var sn=data._id;
        var query={_id:sn};
        //var identitys=constants.identitys.join(" ");
        //if(identitys.indexOf(session.account.billIdentity)==-1){
        //    result.message="禁止该操作！";
        //    callback(result);
        //    return;
        //}
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err && row){
                if(resetTime2<handler._initTime(row.createTime)){
                    result.message="重置的日期不能小于创建日期";
                    callback(result);
                    return;
                }
                var set={
                    endTime: resetTime,
                    lastUpdateTime:time
                };
                if(resetTime2>time2){
                    if(row.status==constants.serviceNumStatus.stopTry){
                        set.status=constants.serviceNumStatus.try;
                    }else if(row.status==constants.serviceNumStatus.stop){
                        set.status=constants.serviceNumStatus.use;
                    }
                }else{
                    if(row.status==constants.serviceNumStatus.try){
                        set.status=constants.serviceNumStatus.stopTry;
                    }else if(row.status==constants.serviceNumStatus.use){
                        set.status=constants.serviceNumStatus.stop;
                    }
                }
                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                    if(!err){
                        var id=utils.UUID.generateUuid();
                        var record={
                            _id:id,
                            resource:row._id,
                            createTime:time,
                            account:row.account,
                            status:'restEndTime',
                            type:"serviceno",
                            operator:session.account.billLoginName,
                            memo:"重置服务号到期时间为"+resetTime
                        };
                        mongo.db().collection(constants.DB.bill_test_renew_record).insert(record);
                        result.success = true;
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
    },
    /**
     * ucenter停用服务号
     * @param data
     * @param session
     * @param callback
     */
    stopServiceno: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        var sn=data._id;
        var query={_id:sn};
        //var identitys=constants.identitys.join(" ");
        //if(identitys.indexOf(session.account.billIdentity)==-1){
        //    result.message="禁止该操作！";
        //    callback(result);
        //    return;
        //}
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err && row){
//                if(row.status!=constants.serviceNumStatus.try){
//                    result.message="该号码不是试用号码";
//                    callback(result);
//                    return;
//                }
                var set={
                    lastUpdateTime:time
                };
                if(row.status==constants.serviceNumStatus.try){
                    set.status=constants.serviceNumStatus.stopTry
                }else if(row.status==constants.serviceNumStatus.use || row.status==constants.serviceNumStatus.present){
                    set.status=constants.serviceNumStatus.stop;
                }else{
                    result.message = "该状态不能停用";
                    callback(result);
                    return;
                }
                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                    if(!err){
                        var id=utils.UUID.generateUuid();
                        var record={
                            _id:id,
                            resource:row._id,
                            createTime:time,
                            account:row.account,
                            status:'stopServiceno',
                            type:"serviceno",
                            operator:session.account.billLoginName,
                            memo:"停用服务号"
                        };
                        mongo.db().collection(constants.DB.bill_test_renew_record).insert(record);
                        result.success = true;
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
    },
    changeStatus:function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        var sn=data._id;
        var query={_id:sn};
        //var identitys=constants.identitys.join(" ");
        //identitys+=" service";
        var hasLimit=utils.isHasLimit(session,"func_cc_sn_change_status");
        if(!hasLimit){
            result.message="禁止该操作！";
            callback(result);
            return;
        }
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err && row){
                if(row.status != constants.serviceNumStatus.try && row.status != constants.serviceNumStatus.use && row.status != constants.serviceNumStatus.present){
                    //result.message="请选择在用、试用或赠送状态的号码!";
                    //callback(result);
                    //return;
                }else if(row.status==constants.serviceNumStatus.try && data.changeStatus==constants.serviceNumStatus.use){
                    //result.message="试用不能转成在用!";
                    //callback(result);
                    //return;
                }else if(row.status==constants.serviceNumStatus.use && data.changeStatus==constants.serviceNumStatus.try){
                    result.message="在用不能转成试用！";
                    callback(result);
                    return;
                }
                var set={
                    status:data.changeStatus,
                    lastUpdateTime:time
                };
                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                    if(!err){
                        var id=utils.UUID.generateUuid();
                        var record={
                            _id:id,
                            resource:row._id,
                            createTime:time,
                            account:row.account,
                            status:'changeStatus',
                            type:"serviceno",
                            operator:session.account.billLoginName,
                            memo:"变更服务号状态为:"+data.changeStatus
                        };
                        mongo.db().collection(constants.DB.bill_test_renew_record).insert(record);
                        result.success = true;
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
    },
    pay2ServiceNo: function (data,callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var date=new Date();

        var sn=data.serviceno;
        var month=parseInt(data.month,10);
        var concurrent=parseInt(data.concurrent,10);
        var totalFee=utils.formatFee(parseFloat(data.totalFee));

        var query={_id:sn};

        var payFlag=data.flag;
        if(data.serviceFlag==constants.serviceNumFlag.num400){
            if(payFlag==constants.payFlag.buy400Min){
                mongo.db().collection(constants.DB.platform_num400).update(query,{$inc:{balance:totalFee},$set:{notifyNum:0}},function(err){
                    if(err){
                        logger.app.error(err);
                        callback(result);
                    }else{
                        result.success = true;
                        callback(result);
                    }
                });
            }
 /*           if(payFlag==constants.payFlag.buySn){
                handler._check400SnExist(data,function(rep){
                    if(rep.success){
                        var endTime=utils.DateTime.getMonthDay(date,month);
                        endTime=utils.DateTime.getDateDesc(endTime);
                        var set={
                            account: data.account,
                            beginTime:time,
                            endTime: endTime,
                            pbx:data.pbx,
                            status:constants.serviceNumStatus.use,
                            lastUpdateTime:time
                        };
                        mongo.db().collection(constants.DB.platform_num400).update(query,{$set:set},function(err){
                            if(!err){
                                var id=utils.UUID.generateUuid();
                                var record={
                                    _id:id,
                                    serviceno:sn,
                                    createTime:time,
                                    account:data.account,
                                    status:'add',
                                    type:data.serviceFlag
                                };
                                mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);
                                result.success = true;
                                callback(result);
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else{
                        callback(rep);
                    }
                });
            }else if(payFlag==constants.payFlag.snRenew){
                mongo.db().collection(constants.DB.platform_num400).findOne({_id:sn},function(err,row){
                    if(!err){
                        if(row){
                            var start=row.endTime+" 00:00:00";
                            var date2=new Date(Date.parse(start.replace(/-/g,"/")));
                            var endTime=utils.DateTime.getMonthDay(date2,month);
                            endTime=utils.DateTime.getDateDesc(endTime);
                            var set={
                                endTime: endTime,
                                lastUpdateTime:time
                            };
                            mongo.db().collection(constants.DB.platform_num400).update(query,{$set:set},function(err){
                                if(!err){
                                    result.success = true;
                                    callback(result);
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }*/
        }else{
            if(payFlag==constants.payFlag.buySn){
//                var endTime=utils.DateTime.dateAdd('M',month,date);
                var endTime=utils.DateTime.getMonthDay(date,month);
                endTime=utils.DateTime.getDateDesc(endTime);
                var set={
                    account: data.account,
                    beginTime:time,
                    endTime: endTime,
                    pbx:data.pbx,
                    status:constants.serviceNumStatus.use,
                    flag:"",
                    concurrent:concurrent,
                    lastUpdateTime:time
                };
                handler._checkSnExist(data,function(rep){
                    if(rep.success){
                        mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                            if(!err){
                                var id=utils.UUID.generateUuid();
                                var record={
                                    _id:id,
                                    serviceno:sn,
                                    createTime:time,
                                    account:data.account,
                                    status:'add',
                                    type:data.serviceFlag
                                };
                                mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);

                                result.success = true;
                                callback(result);

//                                var info={
//                                    account:data.account,
//                                    pbx:data.pbx,
//                                    serviceno:sn,
//                                    type:data.serviceFlag,
//                                    maxCall:data.concurrent
//                                }
//                                if(data.serviceFlag==constants.serviceNumFlag.didnum){
//                                    syncAcs.addServiceNo(info,function(isSuccess){
//                                        if(isSuccess){
//                                            result.success = true;
//                                        }
//                                        callback(result);
//                                    });
//                                }else{
//                                    result.success = true;
//                                    callback(result);
//                                handler.removeTestServiceNo(data,function(rep2){
//                                    if(rep2.success){
//                                        syncAcs.addServiceNo(info,function(isSuccess){
//                                            if(isSuccess){
//                                                result.success = true;
//                                            }
//                                            callback(result);
//                                        });
//                                    }else{
//                                        logger.app.error('remove test serviceno fialure');
//                                        callback(result);
//                                    }
//                                });
//                                }
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    } else{
                        callback(rep);
                    }
                });
            }else if(payFlag==constants.payFlag.snRenew){
                mongo.db().collection(constants.DB.platform_serviceNum).findOne({_id:sn},function(err,row){
                    if(!err){
                        if(row){
                            var product=row.product;
                            var start=row.endTime+" 00:00:00";
                            var date2=new Date(Date.parse(start.replace(/-/g,"/")));
//                            var endTime=utils.DateTime.dateAdd('M',month,date2);
                            var endTime=utils.DateTime.getMonthDay(date2,month);
                            endTime=utils.DateTime.getDateDesc(endTime);
                            var set={
                                endTime: endTime,
                                lastUpdateTime:time,
                                notifyNum:0
                            };
                            if(row.status==constants.serviceNumStatus.try||row.status==constants.serviceNumStatus.stop||row.status==constants.serviceNumStatus.stopTry){
                                set.status=constants.serviceNumStatus.use;
                            }
                            mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                                if(!err){
                                    data.concurrent=row.concurrent+'';
                                    if(product==constants.product.zj){
                                        syncAcs.updateServiceNo(data,function(isSuccess){
                                            if(isSuccess){
                                                result.success = true;
                                            }
                                            callback(result);
                                        });
                                    }else if(product==constants.product.cc &&row.flag==constants.serviceNumFlag.service){
                                        //todo update
                                        result.success = true;
                                        callback(result);
                                    }else{
                                        result.success = true;
                                        callback(result);
                                    }
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });

/*            }else if(payFlag==constants.payFlag.buyConcurrent){
                var set={
                    lastUpdateTime:time
                };
                mongo.db().collection(constants.DB.platform_serviceNum).findAndModify(query,[],{$set:set,$inc:{concurrent:concurrent}},{new:true},function(err,row){
                    if(!err){
                        data.concurrent=row.concurrent+'';
                        if(row.flag==constants.serviceNumFlag.service){
                            syncAcs.updateServiceNo(data,function(isSuccess){
                                if(isSuccess){
                                    result.success = true;
                                }
                                callback(result);
                            });
                        }else{
                            result.success = true;
                            callback(result);
                        }
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });*/

            }else if(payFlag==constants.payFlag.buyDialMin){
                var id=data.account+"_"+data.product;
                mongo.db().collection(constants.DB.platform_account_product).update({_id:id},{$inc:{balance:totalFee}},function(err){
                    if(err){
                        logger.app.error(err);
                    }
                    result.success = true;
                    callback(result);
                });
            }
        }

    },

    lockServiceNo400:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        utils.BusinessUtil.useServiceNum400(data._id,function(err){
            if(!err){
                var set={
                    account:session.account._id,
                    product:data.product
                };
                mongo.db().collection(constants.DB.platform_num400).findAndModify(query,[],{$set:set},{new:true},function(err,row){
                    if(!err){
                        result.row=row;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.code='404';
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
                    account:session.account._id,
                    product:data.product
                };
                mongo.db().collection(constants.DB.platform_serviceNum).findAndModify(query,[],{$set:set},{new:true},function(err,row){
                    if(!err){
                        handler._setDateInfo(row);
                        result.row=row;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.code='404';
                callback(result);
            }
        });
    },
    _setDateInfo2Month:function(row){
        var current=new Date();
        row.monthDay=utils.DateTime.getCurrentMonthDay();
//        row.leaveDay=row.monthDay-current.getDate()+1;
        row.leaveDay=row.monthDay-current.getDate();//从第2天开始计算
    },
    _setDateInfo:function(row){
        var current=new Date();
        var currentTime=utils.DateTime.getCurrentDateTime();
        if(row.status==constants.serviceNumStatus.ready){
            var lastTime=row.readyTime;
            var lost = utils.DateTime.getDateDiff(lastTime,currentTime, "second")||0;
            row.timeout=(8*3600)-lost;
        }

        row.monthDay=utils.DateTime.getCurrentMonthDay();
        row.leaveDay=row.monthDay-current.getDate();
    },
    getServiceNoById:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err){
                if (row.account) {
                    financeAccountDBProxy.queryFinanceAccountByNormalAccountId(row.account, function (err, financeAccont) {
                        if (!err) {
                            handler._setDateInfo2Month(row);
                            result.row=row;
                            if (financeAccont) {
                                result.row.financeBalance = utils.formatTrueFee(financeAccont.balance);
                            } else {
                                result.row.financeBalance = 0;
                            }
                            result.success=true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else {
                    handler._setDateInfo2Month(row);
                    result.row=row;
                    result.success=true;
                    callback(result);
                }


/*                mongo.db().collection(constants.DB.bill_system_param).findOne({_id:'concurrentPrice'},function(err,param){
                    if(!err && param){
                        var concurrentPrice=param.val;
                        row.concurrentPrice=concurrentPrice;
                        result.row=row;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });*/
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    get400ServiceNoById:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        mongo.db().collection(constants.DB.platform_num400).findOne(query,function(err,row){
            if(!err){
/*                var currentTime=utils.DateTime.getCurrentDateTime();
                if(row.status==constants.serviceNumStatus.ready){
                    var lastTime=row.readyTime;
                    var lost = utils.DateTime.getDateDiff(lastTime,currentTime, "second")||0;
                    row.timeout=(8*3600)-lost;
                }
                if(row.endTime){
                    var endTime=row.endTime+' 23:59:59';
                    var day = utils.DateTime.getDateDiff(currentTime,endTime, "day");
                    var month=Math.round(day/30);
                    row.monthNum=month;
                }*/
                result.row=row;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /*removeTestServiceNo:function(data,callback){
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();

        var set={
            account: '',
            endTime: '',
            pbx:'',
            status:constants.serviceNumStatus.free,
            lastUpdateTime:time
        };
        var query2={account:data.account,type:constants.serviceNumType.try};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query2,function(err,row){
            if(!err){
                if(row){
                    var sn=row._id;
                    var query={_id:sn};
                    mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                        if(!err){
                            var id=utils.UUID.generateUuid();
                            var record={
                                _id:id,
                                serviceno:sn,
                                createTime:time,
                                account:data.account,
                                status:'remove',
                                type:constants.serviceNumType.try
                            };
                            mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);
                            var info={
                                account:data.account,
                                pbx:data.pbx,
                                serviceno:sn
                            }
                            syncAcs.removeServiceNo(info,function(isSuccess){
                                if(isSuccess){
                                    result.success = true;
                                }
                                callback(result);
                            });
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    result.success = true;
                    callback(result);
                }
            }else{
                logger.app.error(err);
                callback(result);
            }
        })
    },*/
    getAccountInfoById:function(id,session,callback){
        var result = {success: false};
        var query={_id:id};
        mongo.db().collection(constants.DB.platform_account).findOne(query,function(err,row){
            if(!err){
                result.row=row;
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    reSelectServiceNo:function(data,session,callback){
        var result = {success: false};
        var set={
            product:'',
            flag:'',
            account: '',
            status:constants.serviceNumStatus.free,
            readyTime:''
        };
        var query={_id:data};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err){
                if(row.monthRentInit){
                    set.monthRent=row.monthRentInit;
                }
                mongo.db().collection(constants.DB.platform_serviceNum).update({_id:data},{$set:set},function(err){
                    if(!err){
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
    },
    checkNopayServiceNo:function(data,session,callback){
        var result = {success: false};
        var aid=session.account._id;
        var query={account:aid};
        mongo.db().collection(constants.DB.platform_serviceNum).find(query).toArray(function(err,docs){
            if(!err){
                var num=0;
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
                    }
                }
                if(num==0){
                    result.message="请先购买正式的服务号";
                    callback(result);
                    return;
                }
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                result.message="查询是否存在未支付的号码异常";
                callback(result);
            }
        });
    },
    reSelect400ServiceNo:function(data,session,callback){
        var result = {success: false};
        var set={
            product:'',
            account: '',
            status:constants.serviceNumStatus.free
        };
        var query={_id:data};
        mongo.db().collection(constants.DB.platform_num400).findOne(query,function(err,row){
            if(!err){
//                if(row.initMonthRent){
//                    set.monthRent=row.initMonthRent;
//                    set.initMonthRent='';
//                }
                mongo.db().collection(constants.DB.platform_num400).update({_id:data},{$set:set},function(err){
                    if(!err){
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
    },
    queryFreeSnList: function (data, session, callback) {
        var result = {success: false};
        var condition =data||{};
        utils.removeEmptyProperty(condition);
        var aid=session.account._id;
        condition.account=session.account._id;
        condition.flag={$in:[null,""]};
        condition.status={$in:[constants.serviceNumStatus.use,constants.serviceNumStatus.waitPay,constants.serviceNumStatus.try]}
        mongo.db().collection(constants.DB.platform_serviceNum).find(condition,{sort:{_id:1}}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs||[];
                mongo.db().collection(constants.DB.platform_num400).find(condition,{sort:{_id:1}}).toArray(function (err, list400) {
                    if(!err){
                        result.list400=list400||[];
                        var query={account:session.account._id,flag:constants.serviceNumFlag.service,product:data.product};
                        mongo.db().collection(constants.DB.platform_serviceNum).count(query,function (err, count) {
                            if (!err) {
                                mongo.db().collection(constants.DB.platform_num400).count(query,function (err, count400) {
                                    if (!err) {
                                        result.selectCount = count+count400;
                                        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:aid+"_zj"},function(err, product){
                                            if(!err && product){
                                                result.isMoreSn=product.isMoreSn;
                                                result.success = true;
                                                callback(result)
                                            }else{
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
                    }else{
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
    queryFreeDidNumList: function (data, session, callback) {
        var result = {success: false};
        var condition =data||{};
        utils.removeEmptyProperty(condition);
        condition.account=session.account._id;
        condition.flag={$in:['',constants.serviceNumFlag.didnum]};
        condition.status={$in:[constants.serviceNumStatus.use,constants.serviceNumStatus.waitPay,constants.serviceNumStatus.try]}
        mongo.db().collection(constants.DB.platform_serviceNum).find(condition,{sort:{_id:1}}).toArray(function (err, docs) {
            if (!err) {
                docs=docs||[];
                var list=[];
                for (var i = 0; i < docs.length; i++) {
                    var obj = docs[i];
                    if(!obj.uid){
                        list.push(obj);
                    }
                }
                result.list = list;
                result.success = true;
                callback(result)
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    bindServiceNo: function (data, session, callback) {
        var result = {success: false};
        var telNum=data.telNum;
        var aid=session.account._id;
        var time=utils.DateTime.getCurrentDateTime();
        var pbx=utils.getProductPbx(constants.product.zj,session);
        var flag=data.serviceFlag||constants.serviceNumFlag.service;
        if(telNum!='4006523616' && telNum.indexOf("400")==0){
            mongo.db().collection(constants.DB.platform_num400).findOne({_id:telNum},function(err,num400){
                if(!err && num400){
                    var concurrent=num400.concurrent||-1;
                    mongo.db().collection(constants.DB.platform_num400).findAndModify({_id:telNum},[],{$set:{pbx:pbx,flag:flag,concurrent:concurrent}},{new:true},function(err,sn){
                        if(!err){
                            businessUtil.getSeriesQueueNum(2, function(err, queueData){
                                if(!err) {
                                    var queues = queueData;
                                    var queue1 = {
                                        account: aid,
                                        pbx: pbx,
                                        type: 'office',
                                        status: 'using'
                                    };
                                    var queue2 = {
                                        account: aid,
                                        pbx: pbx,
                                        type: 'service',
                                        status: 'using'
                                    };

                                    var flow = {
                                        _id: utils.UUID.generateUuid(),
                                        account:aid,
                                        startTimeHour: 0,
                                        startTimeMinute: 0,
                                        endTimeHour: 24,
                                        endTimeMinute: 0,
                                        day:['2','3','4','5','6','7','1'],
                                        agent: [],
                                        queue: queues[0],
                                        serviceAgent: [],
                                        serviceQueue: queues[1],
                                        ivr: '1',
                                        serviceNo:telNum,
                                        createTime:time
                                    };

                                    var info={
                                        account:aid,
                                        pbx:pbx,
                                        serviceno:telNum,
                                        type:flag,
                                        maxCall:sn.concurrent
                                    }
                                    info.flow=flow;
                                    syncAcs.addServiceNo(info,function(isSuccess){
                                        if(isSuccess){
                                            mongo.db().collection('platform_queue').update({_id: queues[0]},{$set: queue1});
                                            mongo.db().collection('platform_queue').update({_id: queues[1]},{$set: queue2});
                                            mongo.db("zj").collection('platform_ivr').insert(flow,{w:1},function(err){
                                                if(!err){
                                                    result.success = true;
                                                    result.ivrId=flow._id;
                                                    callback(result);
                                                }else{
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            });
                                        }else{
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.warn('Get queueNum from java service failed', err);
                                    callback(false);
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
        }else{
            mongo.db().collection(constants.DB.platform_serviceNum).findOne({_id:telNum},function(err,sn){
                if(!err && sn){
                    var status=sn.status;
                    if(status==constants.serviceNumStatus.stop || status==constants.serviceNumStatus.stopTry){
                        result.message="不能选择停用的号码！";
                        callback(result);
                        return;
                    }
                    var pbx=utils.getProductPbx(sn.product,session);
                    businessUtil.getSeriesQueueNum(2, function(err, queueData){
                        if(!err) {
//                            技能组不设默认值
//                            mongo.db().collection(constants.DB.platform_user).find({account:aid},{sort: {exten: 1},limit: 10}).toArray(function (err, users) {
//                                if(!err){
//
//                                }else{
//
//                                }
//                            });
                            var queues = queueData;
                            var queue1 = {
                                account: aid,
                                pbx: pbx,
                                type: 'office',
                                status: 'using'
                            };
                            var queue2 = {
                                account: aid,
                                pbx: pbx,
                                type: 'service',
                                status: 'using'
                            };
                            var flow = {
                                _id: utils.UUID.generateUuid(),
                                account:aid,
                                startTimeHour: 0,
                                startTimeMinute: 0,
                                endTimeHour: 24,
                                endTimeMinute: 0,
                                day:['2','3','4','5','6','7','1'],
                                agent: [],
                                queue: queues[0],
                                serviceAgent: [],
                                serviceQueue: queues[1],
                                ivr: '1',
                                serviceNo:telNum,
                                createTime:time
                            };

                            var info={
                                account:aid,
                                pbx:pbx,
                                serviceno:telNum,
                                type:flag,
                                maxCall:sn.concurrent
                            }
                            info.flow=flow;
                            syncAcs.addServiceNo(info,function(isSuccess){
                                if(isSuccess){
                                    mongo.db().collection(constants.DB.platform_serviceNum).update({_id:telNum},{$set:{flag:flag}},{w:1},function(err){
                                        if(!err){
                                            mongo.db().collection('platform_queue').update({_id: queues[0]},{$set: queue1});
                                            mongo.db().collection('platform_queue').update({_id: queues[1]},{$set: queue2});
                                            mongo.db("zj").collection('platform_ivr').insert(flow,{w:1},function(err){
                                                if(!err){
                                                    result.success = true;
                                                    result.ivrId=flow._id;
                                                    callback(result);
                                                }else{
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            });
//                                            var query={account:aid,serviceNo:''};
//                                            mongo.db("zj").collection(constants.DB.platform_ivr).findOne(query,function(err,row){
//                                                if(!err){
//                                                    if(row){
//                                                        var set={serviceNo:telNum};
//                                                        mongo.db("zj").collection(constants.DB.platform_ivr).update({_id:row._id},{$set:set},function(err){
//                                                            if(!err){
//                                                                result.success = true;
//                                                                callback(result);
//                                                            }else{
//                                                                logger.app.error(err);
//                                                                callback(result);
//                                                            }
//                                                        });
//                                                    }else{
//                                                        //todo add ivr info
//                                                        logger.app.error(err);
//                                                        callback(result);
//                                                    }
//                                                }else{
//                                                    logger.app.error(err);
//                                                    callback(result);
//                                                }
//                                            });
                                        }else{
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    })
                                }else{
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.warn('Get queueNum from java service failed', err);
                            callback(false);
                        }
                    });

                }else{
                    logger.app.error(err);
                    callback(result);
                }
            });
        }
    },
    pay2ZJServiceNo: function (data,callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();

        var sn=data.serviceno;
        var product=constants.product.zj;
        var query={_id:sn};
        var payFlag=data.flag;

        if(payFlag==constants.payFlag.buySn){
//            utils.BusinessUtil.buyServiceNum(sn,data.account,product,function(rep){
//                if(rep.success){
                    var set={
                        beginTime:time,
                        endTime:"",
                        status:constants.serviceNumStatus.use,
                        pbx:data.pbx,
//                        flag:"",
                        concurrent:1,
                        lastUpdateTime:time
                    };
                    mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                        if(!err){
                            var id=utils.UUID.generateUuid();
                            var record={
                                _id:id,
                                serviceno:sn,
                                createTime:time,
                                account:data.account,
                                status:'add',
                                type:"normal"
                            };
                            mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);

                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
//                }else{
//                    callback(rep);
//                }
//            });
        }else if(payFlag==constants.payFlag.snRenew){
            mongo.db().collection(constants.DB.platform_serviceNum).findOne({_id:sn},function(err,row){
                if(!err){
                    data.concurrent=row.concurrent+'';
                    syncAcs.updateServiceNo(data,function(isSuccess){
                        if(isSuccess){
                            var set={
                                planFlag:"",
                                failNum:0,
                                status:constants.serviceNumStatus.use,
                                lastUpdateTime:time
                            };
                            mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                                if(!err){
                                    result.success = true;
                                    callback(result);
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }else{
                            callback(result);
                        }
                    });
                }else{
                    logger.app.error(err);
                    callback(result);
                }
            });
        }
    },
    pay2CCServiceNo: function (data,callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();

        var sn=data.serviceno;
        var query={_id:sn};
        var payFlag=data.flag;

        var set={
            planFlag:"",
            failNum:0,
            status:constants.serviceNumStatus.use,
            lastUpdateTime:time
        };
//            var set={
//                beginTime:time,
//                endTime:"",
//                status:constants.serviceNumStatus.use,
//                pbx:data.pbx,
////                        flag:"",
//                concurrent:1,
//                lastUpdateTime:time
//            };
        mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
            if(!err){
                var id=utils.UUID.generateUuid();
                var record={
                    _id:id,
                    serviceno:sn,
                    createTime:time,
                    account:data.account,
                    status:'add',
                    type:"normal"
                };
                mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);

                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    stopNum:function(data,session,callback){
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var sn=data._id;
        var aid=session.account._id;
        var set={
            lastUpdateTime:time,
            planFlag:"stop"
        };
        mongo.db().collection(constants.DB.platform_serviceNum).update({_id:sn},{$set:set},function(err){
            if(!err){
                var log={
                    serviceno:sn,
                    account:aid,
                    type:'stop',
                    createTime:time,
                    operator:session.account.billLoginName||session.account.name
                };
                mongo.db("zj").collection(constants.DB.log_enable_serviceNum).insert(log);
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    cancelStopNum:function(data,session,callback){
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var sn=data._id;
        var aid=session.account._id;
        var set={
            lastUpdateTime:time,
            planFlag:""
        };
        mongo.db().collection(constants.DB.platform_serviceNum).update({_id:sn},{$set:set},function(err){
            if(!err){
                var log={
                    serviceno:sn,
                    account:aid,
                    type:'cancelStop',
                    createTime:time,
                    operator:session.account.billLoginName||session.account.name
                };
                mongo.db("zj").collection(constants.DB.log_enable_serviceNum).insert(log);
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },

    confirmSelectZJNormalSn: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var beginTime=utils.DateTime.getCurrentDate();
        var aid=session.account._id;
        var pbx=utils.getProductPbx(data.product,session);
        data.account=aid;
        data.pbx=pbx;

        var date=new Date();
        var endTime=utils.DateTime.dateAdd('d',3,date);
        endTime=utils.DateTime.getDateDesc(endTime);
        var sn=data._id;
        var query={_id:sn};
        var set={
            account: aid,
            beginTime:beginTime,
            endTime: endTime,
            pbx:pbx,
            status:constants.serviceNumStatus.waitPay,
            flag:"",
            product:data.product,
            lastUpdateTime:time
        };
        utils.BusinessUtil.useServiceNum(sn,function(err){
            if(!err){
                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                    if(!err){
                        var id=utils.UUID.generateUuid();
                        var record={
                            _id:id,
                            serviceno:sn,
                            createTime:time,
                            account:aid,
                            status:'add',
                            type:"normal"
                        };
                        mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);

                        //发送邮件提醒到质检
                        mongo.db().collection(constants.DB.platform_account).findOne({_id: aid}, function (err, acc) {
                            if (!err && acc) {
                                var mailInfo = {
                                    companyName: acc.companyName,
                                    num: sn,
                                    loginName:  acc.name
                                }
                                notifyHandler.sendZJSelectNum27moor(mailInfo, function (rep) {
                                    if (!rep.success) {
                                        logger.app.error("质检提醒失败，sn==" + sn);
                                    }
                                });
                            }else{
                            }
                        });


                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.code='404';
                callback(result);
            }
        })
    },
    approveServiceNoZJTest: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        var pbx=utils.getProductPbx(data.product,session);
        data.account=aid;
        data.pbx=pbx;

        var sn=data._id;
        var query={_id:sn};
        var set={
            account: aid,
            pbx:pbx,
            status:constants.serviceNumStatus.verify,
            flag:"",
            product:data.product,
            lastUpdateTime:time
        };
        utils.BusinessUtil.useServiceNum(sn,function(err){
            if(!err){
                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                    if(!err){
                        var id=utils.UUID.generateUuid();
                        var record={
                            _id:id,
                            serviceno:sn,
                            createTime:time,
                            account:aid,
                            product:data.product,
                            status:'add',
                            type:"verify"
                        };
                        mongo.db().collection(constants.DB.platform_approve_serviceNum).insert(record);
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                result.code='404';
                callback(result);
            }
        })
    },
    findServiceNumApprove: function (data, session, callback) {
        var result = {success: false};
        var limit = 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        mongo.db().collection(constants.DB.platform_approve_serviceNum).count(data,function(err,count){
            if(!err){
                result.count = count;
                mongo.db().collection(constants.DB.platform_approve_serviceNum).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, lines) {
                    if (!err) {
                        lines = lines || [];
                        result.success = true;
                        result.list = lines;
                        callback(result);
                    } else {
                        logger.app.warn("findServiceNumApprove error", err);
                        result.message = "查询申请服务号数据异常！";
                        callback(result);
                    }
                });
            }
        })
    },
    updateServiceNum_pass :function(data, session, callback){
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var beginTime=utils.DateTime.getCurrentDate();

        var date=new Date();
        var endTime=utils.DateTime.dateAdd('d',10,date);
        endTime=utils.DateTime.getDateDesc(endTime);

        var endTimezj=utils.DateTime.dateAdd('d',-7,date);
        endTimezj=utils.DateTime.getDateDesc(endTimezj);
        var set={
            type:"pass"
        };
        var doc={
            status:"try",
            beginTime:beginTime,
            endTime: endTime,
        };
        var doczj={
            status:"try",
            beginTime:beginTime,
            endTime: endTimezj,
        };
        var id=utils.UUID.generateUuid();
        var recordCC={
            _id:id,
            serviceno:data.serviceno,
            createTime:time,
            account:data.account,
            status:'add',
            type:"try"
        };
        var recordZJ={
            _id:id,
            serviceno:data.serviceno,
            createTime:time,
            account:data.account,
            status:'add',
            type:"normal"
        };
        mongo.db().collection(constants.DB.platform_approve_serviceNum).update({_id:data._id},{$set:set},{w: 1}, function (err) {
            if (!err) {
                if(data.product=="cc"){
                    mongo.db().collection(constants.DB.platform_serviceNum).update({_id:data.serviceno},{$set:doc},{w:1}, function (err) {
                        if(!err){
                            mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(recordCC);
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.warn("updateServiceNum_pass  error", err);
                            result.message = "更新呼叫中心服务号状态异常！";
                            callback(result);
                        }
                    });
                }else {
                    mongo.db().collection(constants.DB.platform_serviceNum).update({_id:data.serviceno},{$set:doczj},{w:1}, function (err) {
                        if(!err){
                            mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(recordZJ);
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.warn("updateServiceNum_pass  error", err);
                            result.message = "更新总机服务号状态异常！";
                            callback(result);
                        }

                    });
                }
            } else {
                logger.app.warn("updateServiceNum_pass  error", err);
                result.message = "更新服务号审批状态异常！";
                callback(result);
            }
        });
    },
    updateServiceNum_unpass :function(data, session, callback){
        var result = {success: false};
        var set={
            type:"unpass",
            unpassReason:data.unpassReason
        }
        var doc={
            status:"unpass",
            pbx:"",
            unpassReason:data.unpassReason
        }
        mongo.db().collection(constants.DB.platform_approve_serviceNum).update({_id:data._id}, {$set: set}, {w: 1}, function (err) {
            if (!err) {
                mongo.db().collection(constants.DB.platform_approve_serviceNum).findOne({_id:data._id}, function (err,pieceDB) {
                    if(!err){
                        mongo.db().collection(constants.DB.platform_serviceNum).update({_id:pieceDB.serviceno},{$set:doc},{w:1}, function (err) {
                            if(!err){
                                result.success = true;
                                callback(result);
                            }else{
                                logger.app.warn("updateServiceNum_unpass  error", err);
                                result.message = "更新服务号状态异常！";
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.warn("updateServiceNum_unpass  error", err);
                        result.message = "查询服务号异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("updateSmsSend_unpass  error", err);
                result.message = "更新服务号审批状态异常！";
                callback(result);
            }
        });
    }
};

module.exports = handler;
