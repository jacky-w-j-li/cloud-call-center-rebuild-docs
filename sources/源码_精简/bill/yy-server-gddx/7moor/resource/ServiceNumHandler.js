var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var config = require('appConfig');
var httpProvider = require("appHttp");
var Long = require('mongodb3').Long;
var Then = require('thenjs');

var ServiceNum = require(__baseDir + '/models/ServiceNum');
var Account = require(__baseDir + '/models/Account');

var handler = {
    queryServiceNum2: function (data, session, callback) {
        if(data.owner==" "){
            data.owner=null;
        }
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data._id) {
            data._id = new RegExp(data._id);
        }
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.endTime = {
                $gte: beginTime
            }
        }
        if (endTime) {
            if (data.endTime) {
                data.endTime.$lte = endTime;
            } else {
                data.endTime = {
                    $lte: endTime
                }
            }
        }
        var identity=session.user.identity;
        var uid=session.user._id;
        if(identity==constants.systemUserIndentity.proxy){
            data.owner=uid;
        }
        if(data.failNum){
            //data.failNum=parseInt(data.failNum,10);
            data.failNum={$gte:parseInt(data.failNum,10)};
        }
        mongo.db().collection(constants.DB.platform_serviceNum).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_serviceNum).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, nums) {
                    if (!err) {
                        nums = nums || [];
                        var accountIds = [];
                        for (var i = 0; i < nums.length; i++) {
                            if (nums[i].account) {
                                accountIds.push(nums[i].account)
                            }
                            if(nums[i].monthRent) {
                                nums[i].monthRent = utils.formatTrueFee(nums[i].monthRent);
                            }
                            if(nums[i].monthRentProxy) {
                                nums[i].monthRentProxy = utils.formatTrueFee(nums[i].monthRentProxy);
                            }
                        }
                        mongo.db().collection(constants.DB.platform_account).find({_id: {$in: accountIds}}, {fields: {_id: 1, companyName: 1}}).toArray(function (err, accounts) {
                            if (!err) {
                                accounts = accounts || [];
                                nums = utils.ObjectUtil.linkObjects(nums, accounts, {account: "_id"}, "accountData");
                                result.list = nums || [];

                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.warn("query serviceNum link account error", err);
                                result.message = "查询服务号关联账户信息异常！";
                                callback(result);
                            }
                        });

                    } else {
                        logger.app.warn("queryServiceNum list error", err);
                        result.message = "查询服务号信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryServiceNum count error", err);
                result.message = "查询服务号信息异常！";
                callback(result);
            }
        });
    },
    /**
     * 获取服务号列表
     * @param data
     * @param session
     * @param callback
     */
    queryServiceNum: function(data, session, callback) {
        var limit = data.limit || 10;
        var page = data.page || 1;

        var accountStatus = data.accountStatus;
        var condition = {
            _id :  data._id ? new RegExp(data._id) : null,
            flag_dhb : data.flag_dhb ? new RegExp(data.flag_dhb) : null,
            flag_360 : data.flag_360 ? new RegExp(data.flag_360) : null,
            Solution_state :data.Solution_state ,
  /*          Solution_state : function (){
                    data.Solution_state ? new RegExp(data.Solution_state) : null

                if(data.Solution_state==false){
                    data.Solution_state="待处理";
                }else if(data.Solution_state==true){
                    data.Solution_state="已处理";
                }
                return data.Solution_state;

            }(),*/
            account : data.account,
            status : data.status,
            pbx : data.pbx,
            bind400 : data.bind400,
            type : data.type,
            sp : data.sp,
            failNum : data.failNum ? {$gte:parseInt(data.failNum,10)} : null,
            owner : function(){
                if(session.user.identity == constants.systemUserIndentity.proxy){
                    return session.user._id;
                }
                if(data.owner == ' '){
                    return null;
                }
            }(),
            endTime : function(){
                //创建日期区间
                if(!data.begin && !data.end){
                    return null;
                }
                return utils.collect(
                    data.begin ? {$gte : data.begin + " 00:00:00"} : null ,
                    data.end ? {$lte : data.end + " 23:59:59"} : null
                );
            }()
        };



        utils.removeEmptyProperty(condition);

        Then().
            //账户状态查询条件
            then(function(cont){
                if(!accountStatus || condition.account){
                    return cont();
                }
                Account.find({status:accountStatus},function(err,accounts){
                    if(err){
                        return cont(err);
                    }
                    accounts = accounts || [];

                    var accountIds = [];
                    accounts.forEach(function(account){
                        accountIds.push(account._id);
                    });

                    if(accountIds.length > 0){
                        condition.account = {$in : accountIds};
                    }

                    cont();
                })
        })
            .parallel([
                //数据
                function(cont){
                    Then().
                        then(function(cont_){
                            ServiceNum.findByPage(condition,limit,page,cont_);
                        })
                        .then(function(cont_,records){
                            records = records || [];

                            var accountIds = [];
                            for (var i = 0; i < records.length; i++) {
                                if (records[i].account) {
                                    accountIds.push(records[i].account)
                                }
                                if(records[i].monthRent) {
                                    records[i].monthRent = utils.formatTrueFee(records[i].monthRent);
                                }
                                if(records[i].monthRentProxy) {
                                    records[i].monthRentProxy = utils.formatTrueFee(records[i].monthRentProxy);
                                }
                            }

                            Account.find({_id : {$in : accountIds}},function(err,accounts){
                                if(err){
                                    return cont(err);
                                }
                                records = utils.ObjectUtil.linkObjects(records, accounts, {account: "_id"}, "accountData");

                                cont(null,records);
                            });
                        })
                        .fail(function(cont_,err){
                            return cont(err);
                        })
                },
                //总数
                function(cont){
                    ServiceNum.count(condition,cont);
                }
            ])
            .then(function(cont,res){
                return callback({
                    success : true,
                    count : res[1],
                    list : res[0],
                });
            })
            .fail(function(cont,err){
                logger.app.warn("update serviceNum error!", err);
                return callback({
                    success : false,
                    message : '查询服务号异常',
                })
            })


    },
    queryServiceNumDb : function (data, session, callback){
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data._id) {
            data._id = new RegExp(data._id);
        }
        data.status = "free";
        var identity=session.user.identity;
        var uid=session.user._id;
        if(identity==constants.systemUserIndentity.proxy){
            data.owner={$in:[uid,null,'']};
        }else{
            data.owner={$in:[null,'']};
        }
        mongo.db().collection(constants.DB.platform_serviceNum).count(data,function(err,count){
            if(!err){
                result.count = count;
                mongo.db().collection(constants.DB.platform_serviceNum).find(data,{sort:{_id:1},limit: limit, skip: skip}).toArray(function(err,nums){
                   if(!err){
                       nums= nums ||[];

                       for (var i = 0; i < nums.length; i++) {
                           if(nums[i].monthRent) {
                               nums[i].monthRent = utils.formatTrueFee(nums[i].monthRent);
                           }
                           if(nums[i].monthRentProxy) {
                               nums[i].monthRentProxy = utils.formatTrueFee(nums[i].monthRentProxy);
                           }
                       }
                       result.list = nums || [];
                       result.success = true;
                       callback(result);
                   } else {
                       logger.app.warn("queryServiceNumDb count error", err);
                       result.message = "查询服务号信息异常！";
                       callback(result);
                   }


                });
            } else {
                logger.app.warn("queryServiceNumDb count error", err);
                result.message = "查询服务号信息异常！";
                callback(result);
            }
        });



    },

    /**
     * 获取单个服务号信息
     * @param data
     * @param session
     * @param callback
     */
    getServiceNumInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(data, function (err, dbNum) {
            if (!err) {
                dbNum = dbNum || {};
                if(dbNum.monthRent) dbNum.monthRent = utils.formatTrueFee(dbNum.monthRent);
                if(dbNum.monthRentInit) dbNum.monthRentInit = utils.formatTrueFee(dbNum.monthRentInit);
                if(dbNum.monthRentProxy) dbNum.monthRentProxy = utils.formatTrueFee(dbNum.monthRentProxy);
                result.success = true;
                result.data = dbNum;
                callback(result);
            } else {
                logger.app.warn("getUserInfo  error", err);
                result.message = "查询服务号信息异常！";
                callback(result);
            }
        });
    },
    /**
     * 添加服务号
     * @param data
     * @param session
     * @param callback
     */
    addServiceNum: function (data, session, callback) {
        var result = {success: false};
        var identity=session.user.identity;
        var uid=session.user._id;
        var type = data.serviceNumAddType.serviceNumAddType;
        if (type) {
            if (type == "single") {
                var num = {
                    _id: data.serviceNum,
                    monthRent: utils.formatFee(data.monthRent || 0) ,
                    monthRentInit : utils.formatFee(data.monthRent || 0) ,
                    monthRentProxy : utils.formatFee(data.monthRentProxy || 0),
                    concurrent: 1,
                    memo: data.memo,
                    board : data.board,
                    createTime: utils.DateTime.getCurrentDateTime(),
                    status: constants.serviceNumStatus.free,
                    type: data.type,
                    sp:data.sp
                };
                if(data.type==constants.serviceNumType.try){
                    num.concurrent=2;
                }
                if(data.bind400){
                    num.bind400=data.bind400;
                    num.status=constants.serviceNumStatus.use;
                }
                if(identity==constants.systemUserIndentity.proxy){
                    num.owner=uid;
                }
                mongo.db().collection(constants.DB.platform_serviceNum).insert(num, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("add single serviceNum err!", err);
                        result.message = "添加服务号异常！";
                        if (err.code == "11000") {
                            result.message = "服务号已经存在！";
                        }
                        callback(result);
                    }
                });
            } else {
                var begin = data.beginServiceNum + "", end = data.endServiceNum + "";
                var prefix = "";
                if ((begin.substring(0, 1) == "0" && end.substring(0, 1) == "0") || (begin.substring(0, 1) !== "0" && end.substring(0, 1) !== "0")) {
                    if (begin.substring(0, 1) == "0" && end.substring(0, 1) == "0") {
                        prefix = "0";
                        begin = begin.substring(1);
                        end = end.substring(1);
                    }
                    begin = new Number(begin), end = new Number(end);
                    if (end > begin) {
                        var addNum = function (insertNum) {
                            var num = {
                                _id: prefix + insertNum,
                                monthRent: utils.formatFee(data.monthRent),
                                monthRentInit : utils.formatFee(data.monthRent),
                                monthRentProxy : utils.formatFee(data.monthRentProxy || 0),
                                concurrent: 1,
                                memo: "",
                                board : data.board,
                                createTime: utils.DateTime.getCurrentDateTime(),
                                status: constants.serviceNumStatus.free,
                                type: data.type,
                                sp:data.sp
                            };
                            if(data.type==constants.serviceNumType.try){
                                num.concurrent=2;
                            }
                            if(data.bind400){
                                num.bind400=data.bind400;
                                num.status=constants.serviceNumStatus.use;
                            }
                            if(identity==constants.systemUserIndentity.proxy){
                                num.owner=uid;
                            }
                            mongo.db().collection(constants.DB.platform_serviceNum).insert(num, {w: 1}, function (err) {
                                if (!err) {
                                    begin++;
                                    if (begin > end) {
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        addNum(begin);
                                    }

                                } else {
                                    logger.app.warn("add serviceNum[" + insertNum + "] err!", err);
                                    result.message = "添加服务号[" + insertNum + "]异常！";
                                    callback(result);
                                }
                            });
                        };
                        addNum(begin);
                    } else {
                        logger.app.warn("add serviceNum  rule is not match!", new Error());
                        result.message = "服务号规则错误！";
                        callback(result);
                    }
                } else {
                    logger.app.warn("add serviceNum  rule is not match!", new Error());
                    result.message = "服务号规则错误！";
                    callback(result);
                }
            }
        } else {
            logger.app.warn("add serviceNum type is empty!", new Error());
            result.message = "添加类型不能为空！";
            callback(result);
        }
    },

    updateServiceNum2: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        delete data._id;
        if(data.monthRent) data.monthRent = Long.fromNumber(utils.formatFee(data.monthRent));
        if(data.bind400){
            data.status=constants.serviceNumStatus.use400;
            mongo.db().collection(constants.DB.platform_serviceNum).findOne({bind400:data.bind400},function(err,sn){
                if(!err){
                    if(sn && sn._id!=id){
                        result.message = "该400号已经被["+sn._id+"]绑定";
                        callback(result);
                        return;
                    }else{
                        mongo.db().collection(constants.DB.platform_serviceNum).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.warn("update serviceNum error!", err);
                                result.message = "更新服务号异常！";
                                callback(result);
                            }
                        });
                    }
                }else{
                    logger.app.error("fins serviceNum error!", err);
                    callback(result);
                }
            });
        }else{
            data.bind400="";
            mongo.db().collection(constants.DB.platform_serviceNum).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.warn("update serviceNum error!", err);
                    result.message = "更新服务号异常！";
                    callback(result);
                }
            });
        }
    },
    /**
     * 更新服务号
     * @param data
     * @param session
     * @param callback
     */
    updateServiceNum: function(data, session, callback){
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        if(data.monthRent){
            data.monthRent = Long.fromNumber(utils.formatFee(data.monthRent));
        }

        var condition = {};
        if(data._id){
            condition._id = data._id;
            if(!data.bind400){
                data.bind400 = null;
            }
        }else{
            condition._id = {$gte: data.beginServiceNum,$lte: data.endServiceNum};
            delete data.bind400;
        }
        delete data._id ;
        delete data.beginServiceNum;
        delete data.endServiceNum;

        Then()
            .then(function(cont){
                //检查400号码是否已被其他号码占用
                if(!data.bind400){
                    return cont();
                }

                ServiceNum.get({bind400 : data.bind400,_id:{$ne : condition._id}},function(err,record){
                    if(err){
                        return cont(err);
                    }
                    if(record){
                        return callback({
                            success : false,
                            message : "该400号已经被["+record._id+"]绑定",
                        })
                    }
                    cont();
                })
            })
            .then(function(cont){
                ServiceNum.update(condition,data,cont);
            })
            .then(function(cont){
                return callback({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.warn("update serviceNum error!", err);
                return callback({
                    success : false,
                    message : '更新服务号异常',
                })
            })
    },
    /**
     * 更新服务号初始资费
     * @param data
     * @param session
     * @param callback
     */
    updateServiceNumInit : function(data,session,callback){
        var result = {success: false};
        var id = data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        delete data._id;
        if(data.monthRentInit) data.monthRentInit = Long.fromNumber(utils.formatFee(data.monthRentInit));
        if(data.monthRentProxy) data.monthRentProxy = Long.fromNumber(utils.formatFee(data.monthRentProxy));

        mongo.db().collection(constants.DB.platform_serviceNum).findOne({_id:id},function(err,dbNum){
           if(!err){
               if(dbNum.status == "free"){
                   data.monthRent  = data.monthRentInit;
               }
               mongo.db().collection(constants.DB.platform_serviceNum).update({_id:id},{$set:data},function(err){
                   if (!err) {
                       result.success = true;
                       callback(result);
                   } else {
                       logger.app.warn("delete serviceNum error!", err);
                       result.message = "删除服务号异常！";
                       callback(result);
                   }
               });
           } else {
               logger.app.warn("find serviceNum error!", err);
               result.message = "更新服务号异常！";
               callback(result);
           }
        });



    },
    /**
     * 删除服务号
     * @param data
     * @param session
     * @param callback
     */
    deleteServiceNum: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_serviceNum).remove(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("delete serviceNum error!", err);
                result.message = "删除服务号异常！";
                callback(result);
            }
        });
    },
    showStopAccInfo:function(data,session,callback){
        var result = {success: false};
        var snId = data._id;
        var account = data.account;
        mongo.db().collection(constants.DB.platform_serviceNum).findOne({_id:snId},function(err,oneSn) {
            if (!err) {
                var lastAccount = oneSn.lastAccount;
                if (lastAccount && lastAccount != '') {
                    var arr = [account,lastAccount];
                    mongo.db().collection(constants.DB.platform_account).find({_id: {$in:arr}}).toArray(function (err, accData) {
                        if (!err && accData) {
                            for(var i=0;i<accData.length;i++){
                                var acc = accData[i];
                                var companyName = acc.companyName;
                                var accountName = acc.name;
                                if(acc && acc._id == account){
                                    result.companyName = companyName;
                                    result.accountName = accountName;
                                }else if(acc && acc._id == lastAccount){
                                    result.lastCompanyName = companyName;
                                    result.lastAccountName = accountName;
                                }
                            }
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                } else {//不存在上个账户
                    mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, accData) {
                        if (!err) {
                            var companyName = "";
                            var accountName = "";
                            if (accData) {
                                companyName = accData.companyName;
                                accountName = accData.name;
                            }
                            result.companyName = companyName;
                            result.accountName = accountName;
                            result.lastCompanyName = "";
                            result.lastAccountName = "";

                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _saveSnRecord:function(data){
        var time=utils.DateTime.getCurrentDateTime();
        var id=utils.UUID.generateUuid();
        var sn=data.serviceNo;
        var account=data.account;
        var flag=data.flag;
        var record={
            _id:id,
            serviceno:sn,
            createTime:time,
            account:account,
            status:'free',
            type:flag
        };
        mongo.db("zj").collection(constants.DB.user_serviceno_record).insert(record);
    },
    freeIvrResource: function (data, callback) {
        var result = {success: false};
        var flag=data.flag;
        var uid=data.uid;
        var account=data.account;
        var num=data.serviceNo;
        if(flag==constants.serviceNumFlag.didnum){
            mongo.db().collection(constants.DB.platform_user).update({_id:uid},{$set:{didNum:''}},function(err){
                if(!err){
                    handler._saveSnRecord(data);
                    result.success = true;
                    callback(result);
                }else{
                    logger.app.error(err);
                    callback(result);
                }
            });
        }else if(flag==constants.serviceNumFlag.service){
            var query={
                account:account,
                serviceNo:num
            }
            mongo.db("zj").collection(constants.DB.platform_ivr).findOne(query,function(err,flow){
                if(!err && flow){
                    var queue1=flow.queue;
                    var queue2=flow.serviceQueue;
                    var ivrId=flow._id;
                    mongo.db("zj").collection(constants.DB.platform_ivr).remove({_id:ivrId},function(err){
                        if(!err){
                            handler._saveSnRecord(data);
                            //free queue
                            var queueSet={
                                account: '',
                                pbx: '',
                                type: '',
                                status: 'free',
                                lastAccount:account
                            }
                            mongo.db().collection('platform_queue').update({_id: queue1},{$set:queueSet});
                            mongo.db().collection('platform_queue').update({_id: queue2},{$set: queueSet});
                            //sync user's callerIDNum
                            mongo.db().collection(constants.DB.platform_user).update({account:account,product:constants.product.zj,callerIDNum:num},{$set:{callerIDNum:""}},{multi:true},function(){
                                if(err){
                                    logger.app.error(err);
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
                    callback(result);
                }
            });
        }else{
            handler._saveSnRecord(data);
            result.success = true;
            callback(result)
        }
    },
    /**
     * failNum:扣费失败次数
     * notifyNum:到期提醒次数
     * @param data
     * @param session
     * @param callback
     */
    freeStopServiceNo:function(data,session,callback){
        var result = {success: false};
        var num=data._id;
        var query={_id:num};
        var syncErrMsg="freeStopServiceNo同步acs失败";
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err){
                var product=row.product;
                var account=row.account;
                var pbx=row.pbx;
                var status=row.status;

                if(status==constants.serviceNumStatus.stopWaitPay){ //for free zj waitpay
                    var set={
                        pbx:'',
                        account:'',
                        status:constants.serviceNumStatus.free,
                        concurrent:1,
                        endTime:'',
                        beginTime:'',
                        flag:'',
                        uid:'',
                        product:'',
                        planFlag:"",
                        failNum:0,
                        notifyNum:0
                    };
                    if(row.monthRentInit){
                        set.monthRent=row.monthRentInit;
                    }
                    if(row.monthRentProxy){
                        set.monthRentProxy=utils.formatFee(10);//reset 10
                    }
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
                    var set={
                        pbx:'',
                        account:'',
                        status:constants.serviceNumStatus.free,
                        concurrent:1,
                        endTime:'',
                        beginTime:'',
                        flag:'',
                        uid:'',
                        product:'',
                        lastAccount:account,
                        planFlag:"",
                        failNum:0,
                        notifyNum:0
                    };
                    if(row.monthRentInit){
                        set.monthRent=row.monthRentInit;
                    }
                    if(row.monthRentProxy){
                        set.monthRentProxy=utils.formatFee(10);//reset 10
                    }
                    if(product==constants.product.zj){
                        var doc={
                            serviceno:num,
                            pbx:pbx,
                            account:account
                        }
                        syncAcs.removeServiceNo(doc,function(isSuccess){
                            if(isSuccess){
                                mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                                    if(!err){
                                        var snInfo={
                                            account:account,
                                            flag:row.flag,
                                            uid:row.uid,
                                            serviceNo:num
                                        }
                                        handler.freeIvrResource(snInfo,function(rep){
                                            callback(rep);
                                        });
                                    }else{
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                logger.app.error(syncErrMsg);
                                result.message=syncErrMsg;
                                callback(result);
                            }
                        });
                    }else if(product==constants.product.cc){
                        var doc={
                            Account:account,
                            PBX:pbx,
                            Exten:num
                        };
                        var url=config.ccServerUrl+"service?action=releaseCCServiceNo&data="+JSON.stringify(doc);
                        url=encodeURI(url);
                        httpProvider.sendGet(url,function(err,res){
                            if(!err && res){
                                try{
                                    var res = JSON.parse(res);
                                    if(res.success){
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
                                        result.message=syncErrMsg;
                                        callback(result);
                                    }
                                }catch (e) {
                                    logger.request.error(e);
                                    result.message=syncErrMsg;
                                    callback(result);
                                }
                            }else{
                                logger.request.error(err);
                                result.message=syncErrMsg;
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error("服务号产品字段未知，未释放！");
                        result.message="服务号产品字段未知，未释放！";
                        callback(result);
                    }
                }
            }
        });
    },
    batchFreeNum:function(data,callback){
        var result = {success: false};
        data=JSON.parse(data);
        var begin=data.begin;
        var end=data.end;
        var query={
            _id:{$gte:begin,$lte:end},
            status: {$ne:'free'}
        }
        mongo.db().collection(constants.DB.platform_serviceNum).find(query).toArray(function(err,nums){
            if(!err){
                nums= nums ||[];
                var idx=0;
                var freeNum=function(){
                    var _num=nums[idx];
                    if(_num){
                        handler.freeStopServiceNo({_id:_num._id},null,function(rep){
                            if(rep.success){
                                idx++;
                                freeNum();
                            }else{
                                logger.app.info("释放失败====="+_num._id);
//                                callback(rep);
                                idx++;
                                freeNum();
                            }
                        });
                    }else{
                        result.success = true;
                        callback(result);
                    }
                }
                freeNum();
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * 计费停用服务号
     * @param data
     * @param session
     * @param callback
     */
    stopServiceNum: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var sn=data._id;
        var query={_id:sn};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err && row){
                var set={
                    lastUpdateTime:time
                    //status:constants.serviceNumStatus.stop
                };
                if(row.status==constants.serviceNumStatus.try){
                    set.status=constants.serviceNumStatus.stopTry;
                }else if(row.status==constants.serviceNumStatus.use || row.status==constants.serviceNumStatus.present|| row.status==constants.serviceNumStatus.waitPay){
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
                            operator:session.user.loginName,
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
    /**
     * 解决360标记处理
     * @param data
     * @param session
     * @param callback
     */
    stopServiceFlag: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var sn=data._id;
        var query={_id:sn};
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err && row){

                //console.log(row.Solution_state);

                if(row.Solution_state){
                    var set={
                        lastUpdateTime:time,
                        Solution_state :"true"
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
                    result.message = "该服务号不需要处理";
                    callback(result);
                    return;
                }


            /*    if(row.status==constants.serviceNumStatus.try){
                    set.status=constants.serviceNumStatus.stopTry;
                }else if(row.status==constants.serviceNumStatus.use || row.status==constants.serviceNumStatus.present|| row.status==constants.serviceNumStatus.waitPay){
                    set.status=constants.serviceNumStatus.stop;
                }else{
                    result.message = "该状态不能停用";
                    callback(result);
                    return;
                }*/


            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /*  根据id查询服务号详细信息 */
    getSerNumById: function (data, session, callback) {
        var result = {success: false};
        mongo.db('bill').collection(constants.DB.platform_serviceNum).findOne(data, function (err, oneSerNum) {
            if (!err) {
                /*if (oneSerNum) {

                 } else {
                 oneSerNum = {};
                 }*/
                result.success = true;
                result.data = oneSerNum;
                callback(result);
            } else {
                result.message = "404";
                callback(result);
            }
        });
    }

    /*freeStopWaitPay:function(data,session,callback){
        var result = {success: false};
        var num=data._id;
        var query={_id:num};
        var syncErrMsg="freeStopServiceNo同步acs失败";
        mongo.db().collection(constants.DB.platform_serviceNum).findOne(query,function(err,row){
            if(!err){
                var account=row.account;
                var pbx=row.pbx;
                var set={
                    pbx:'',
                    account:'',
                    status:constants.serviceNumStatus.free,
                    concurrent:1,
                    endTime:'',
                    beginTime:'',
                    flag:'',
                    uid:'',
                    product:'',
                    lastAccount:account
                };
                if(row.monthRentInit){
                    set.monthRent=row.monthRentInit;
                }
                if(row.monthRentProxy){
                    set.monthRentProxy=utils.formatFee(10);//reset 10
                }
                var doc={
                    serviceno:num,
                    pbx:pbx,
                    account:account
                }
                syncAcs.removeServiceNo(doc,function(isSuccess){
                    if(isSuccess){
                        mongo.db().collection(constants.DB.platform_serviceNum).update(query,{$set:set},function(err){
                            if(!err){
                                var snInfo={
                                    account:account,
                                    flag:row.flag,
                                    uid:row.uid,
                                    serviceNo:num
                                }
                                handler.freeIvrResource(snInfo,function(rep){
                                    callback(rep);
                                });
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(syncErrMsg);
                        result.message=syncErrMsg;
                        callback(result);
                    }
                });
            }
        });
    }*/
};


module.exports = handler;

