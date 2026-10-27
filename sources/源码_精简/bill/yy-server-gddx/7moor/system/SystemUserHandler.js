var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var fs = require("fs");
var config = require('appConfig');
var SysUser = require(__baseDir + "/models/SysUser");
var SysUserStandardPriceConfig = require(__baseDir + "/models/SysUserStandardPriceConfig");

var Then = require("thenjs");

var handler = {
    queryUserList: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        if(data.name){
            data.name=new RegExp(data.name);
        }
        if(data.loginName){
            data.loginName=new RegExp(data.loginName);
        }
        if(data.role){
            var role = data.role;
            data.role = {$all:[role]};
        }
        mongo.db().collection(constants.DB.system_user).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.system_user).find(data, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, accounts) {
                    if (!err) {
                        result.list = accounts || [];
                        result.success = true;
                    } else {
                        logger.app.warn("queryUserList list error", err);
                        result.message = "查询用户信息异常！";
                    }
                    callback(result);
                });
            } else {
                logger.app.warn("queryUserList count error", err);
                result.message = "查询用户信息异常！";
                callback(result);
            }
        });
    },
    queryUserRole: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        mongo.db().collection(constants.DB.system_user_role).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.system_user_role).find(data, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, roles) {
                    if (!err) {
                        result.list = roles || [];
                        result.success = true;
                    } else {
                        logger.app.warn("queryUserRole list error", err);
                        result.message = "查询用户角色信息异常！";
                    }
                    callback(result);
                });
            } else {
                logger.app.warn("queryUserRole count error", err);
                result.message = "查询用户角色信息异常！";
                callback(result);
            }
        });
    },
    getUserRoleInfo: function (data, session, callback) {
        var result = {success: false};

        mongo.db().collection(constants.DB.system_user_role).findOne(data, function (err, dbRole) {
            if (!err) {
                result.success = true;
                result.data = dbRole;
                callback(result);
            } else {
                logger.app.error("获取系统用户信息失败! ", err);
                result.message = "获取系统用户信息失败！";
                callback(result);
            }
        });
    },
    udpateUserRole: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.system_user_role).update({_id: id}, {$set: data}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error("更新系统角色信息失败! ", err);
                result.message = "更新系统角色信息失败！";
                callback(result);
            }
        });
    },
    addUserRole: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.DateTime.getCurrentDateTime();

        mongo.db().collection(constants.DB.system_user_role).insert(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error("保存系统角色信息失败! ", err);
                result.message = "保存系统角色信息失败！";
                callback(result);
            }
        });
    },
    getRoleLimits: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.system_user_limit).findOne({}, function (err, limit) {
            if (!err) {
                result.limits = limit.limits;
                mongo.db().collection(constants.DB.system_user_role).findOne(data,function(err,dbRole){
                   if(!err){
                       result.role = dbRole;
                       result.success = true;
                       callback(result);
                   } else {
                       logger.app.error("获取系统权限信息失败! ", err);
                       result.message = "获取系统权限信息失败！";
                       callback(result);
                   }
                });
            } else {
                logger.app.error("获取系统权限信息失败! ", err);
                result.message = "获取系统权限信息失败！";
                callback(result);
            }
        });
    },
    updateRoleLimits: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(constants.DB.system_user_role).update({_id:id},{$set:data},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.error("修改角色权限信息失败! ", err);
                result.message = "修改角色权限信息失败！";
                callback(result);
            }
        });
    },
    getUserSetInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.system_user).findOne(data, function (err, dbUser) {
            if (!err) {
                if (dbUser) {
                    result.success = true;
                    result.data = dbUser;
                    callback(result);
                } else {
                    logger.app.error("getUserSetInfo:get systemUser info from db error! ", err);
                    result.message = "获取系统用户信息失败！";
                    callback(result);
                }
            } else {
                logger.app.error("getUserSetInfo:get systemUser info from db error! ", err);
                result.message = "获取系统用户信息失败！";
                callback(result);
            }
        });
    },
    addUser2: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.system_user).findOne({loginName: data.loginName}, function (err, oneUser) {
            if (!err) {
                if (!oneUser) {
                    data._id = utils.UUID.generateUuid();
                    data.createTime = utils.DateTime.getCurrentDateTime();
                    data.status = constants.systemUserSataus.enable;
                    data.balance = 0;
                    data.billTime = "0000-00";
                    if(data.identity!="proxy"){
                        data.callinLicence = 0;
                        data.serviceLicence = 0;
                        data.monitorLicence = 0;
                        //data.calloutLicence = 0;
                        //data.standardLicence = 0;
                    }

                    if(data.identity=="proxy"){
                        if(data.proxyType=='channel'){
                            data.isInvoice=false;
                        }else{
                            data.isInvoice=true;
                        }
                    }

                    data.dial400Fee = {};
                    data.dial400FeeStrategy = '';
                    data.dialFee = {};
                    data.dialFeeStrategy = '';
                    //新增
                    data.transferFee={};
                    data.transferFeeStrategy='';
                    data.internationalFee={};
                    data.internationalStrategy='';

                    data.min400Consume = 0;
                    mongo.db().collection(constants.DB.system_user).insert(data, {w: 1}, function (err) {
                        if (!err) {
                            result.success = true;
                            result.user = data;
                            callback(result);
                        } else {
                            logger.app.error("insert account to db error!", err);
                            result.message = "用户数据入库异常！";
                            callback(result);
                        }
                    });
                } else {
                    result.message = "用户名【" + data.loginName + "】已经存在！";
                    callback(result);
                }
            } else {
                logger.app.warn("addUser check name err!", err);
                result.message = "检查用户名异常！";
                callback(result);
            }
        });
    },
    addUser : function(data,session,cb){
        Then()
            .then(function(cont){
                SysUser.duplicateLoginName(data.loginName,cont);
            })
            .then(function(cont,duplicate){
                if(duplicate){
                    return cb({
                        success : false,
                        message : "用户名【" + data.loginName + "】已经存在！",
                    })
                }
                cont();
            })
            .then(function(cont){
                //初始化
                data._id = utils.UUID.generateUuid();
                data.createTime = utils.DateTime.getCurrentDateTime();
                data.status = constants.systemUserSataus.enable;
                data.balance = 0;
                data.billTime = "0000-00";
                //强制提成比例
                if(data.identity!="proxy"){
                    data.callinLicence = 0;
                    data.serviceLicence = 0;
                    data.monitorLicence = 0;
                }

                //渠道开发票
                if(data.identity=="proxy"){
                    if(data.proxyType=='channel'){
                        data.isInvoice=false;
                    }else{
                        data.isInvoice=true;
                    }
                }
                cont();
            })
            .then(function(cont){
                if(data.identity != 'proxy' || !data.proxyLevel){
                    return cont();
                }
                //话费价格初始化
                SysUserStandardPriceConfig.get(data.proxyLevel,function(err,standardPriceConfig){
                    if(err){
                        return cont(err);
                    }
                    if(!standardPriceConfig){
                        return cont(new Error("未找到标准价格"));
                    }

                    for (var key in standardPriceConfig) {
                        if(key == '_id'){
                            continue;
                        }
                        data[key] = standardPriceConfig[key];
                    }

                    cont();
                });

            })
            .then(function(cont){
                //保存
                SysUser.save(data,cont);
            })
            .then(function(cont){
                return cb({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.error(err);
                return cb({
                    success : false,
                    message : '添加用户失败',
                });
            });

    },
    updateUserInfo: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(constants.DB.system_user).findOne({loginName: data.loginName}, function (err, oneUser) {
            if (!err) {
                if (!oneUser || oneUser._id == id) {
                    mongo.db().collection(constants.DB.system_user).find({parent:{$nin:[null,'']}},{_id:1,parent:1}).toArray( function (err, docs) {
                        if(!err){
                            docs= docs||[];
//                            console.log(docs)
                            var lowUsers=[id];
                            var getMyAgent=function(pid){
                                for (var i = 0; i < docs.length; i++) {
                                    var obj = docs[i];
                                    if(obj.parent==pid){
                                        lowUsers.push(obj._id);
                                        getMyAgent(obj._id);
                                    }
                                }
                            }
                            getMyAgent(id);
 //                           console.log(lowUsers)

                                if( !(lowUsers.contains(data.parent))){
                                    mongo.db().collection(constants.DB.system_user).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                                        if (!err) {
                                            result.success = true;
                                            callback(result);
                                        } else {
                                            logger.app.error("updateUserInfo to db error!", err);
                                            result.message = "数据库修改数据异常";
                                            callback(result);
                                        }
                                    });
                                }else{
                                    logger.app.error("updateUserInfo to db error!", err);
                                    result.message = "上级不能是自己或自己的下级";
                                    callback(result);
                                }
                            }else {
                            logger.app.error(err);
                            result.message="获取下属用户异常";
                            callback(result);
                        }
                    });
                } else {
                    result.message = "登录名【" + data.loginName + "】已经存在！";
                    callback(result);
                }
            } else {
                logger.app.warn("updateUserInfo check name err!", err);
                result.message = "检查用户名异常！";
                callback(result);
            }
        });
    },

    queryUserSetLog: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        if (data.time) {
            data.time = new RegExp(data.time);
        }

        mongo.db().collection(constants.DB.bill_system_user_operate_log).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_system_user_operate_log).find(data, {sort: {time: -1}, limit: limit, skip: skip}).toArray(function (err, logs) {
                    if (!err) {
                        logs = logs || [];
                        result.list = logs;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryAccountSetLog  error", err);
                        result.message = "查询用户操作记录信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryAccountSetLog count error", err);
                result.message = "查询用户操作记录信息异常！";
                callback(result);
            }
        });

    },

    savaPriceConfig: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.overdraw = utils.formatFee(data.overdraw);
//        data.min400Consume = utils.formatFee(data.min400Consume);
        data.callinLicence = utils.formatFee(data.callinLicence);
        data.serviceLicence = utils.formatFee(data.serviceLicence);
        //data.calloutLicence = utils.formatFee(data.calloutLicence);
        data.standardLicence = utils.formatFee(data.standardLicence);
        data.monitorLicence = utils.formatFee(data.monitorLicence);
        data.smsFee = utils.formatFee(data.smsFee);
        data.voiceFee = utils.formatFee(data.voiceFee);

        //流量包
        for(var key in data.fee){
            data.fee[key] = utils.formatFee(data.fee[key]);
        }


        for(var key in data.dialFee){
            data.dialFee[key] = utils.formatFee(data.dialFee[key]);
        }

        for(var key in data.dial400Fee){
            data.dial400Fee[key] = utils.formatFee(data.dial400Fee[key]);
        }

        for(var key in data.internationalFee){
            data.internationalFee[key] = utils.formatFee(data.internationalFee[key]);
        }

        if(data.externalLineFees){
            //检查重复线路和未关联线路
            var checkLineArr=[];
            var noRepeatLine = true;
            var hasLine = true;
            for(var i=0; i<data.externalLineFees.length; i++){
                var lineIds = data.externalLineFees[i].lineIds;
                if(lineIds && lineIds.length>0){
                    for(var k=0; k< lineIds.length; k++){
                        var lineId = lineIds[k];
                        if(checkLineArr.indexOf(lineId) < 0){
                            checkLineArr.push(lineId);
                        }else{
                            noRepeatLine = false;
                            break;
                        }
                    }
                }else{
                    hasLine = false;
                    break;
                }
            }

            if(!hasLine){
                result.message = "未关联线路!";
                callback(result);
                return;
            }

            if(!noRepeatLine){
                result.message = "关联线路重复！";
                callback(result);
                return;
            }

            data.externalLineFees.forEach(function (lineFee){
                for(var key in lineFee.dialFee){
                    lineFee.dialFee[key] = utils.formatFee(lineFee.dialFee[key]);
                }

                for(var key in lineFee.dial400Fee){
                    lineFee.dial400Fee[key] = utils.formatFee(lineFee.dial400Fee[key]);
                }

                for(var key in lineFee.internationalFee){
                    lineFee.internationalFee[key] = utils.formatFee(lineFee.internationalFee[key]);
                }
            });
        }




        mongo.db().collection(constants.DB.system_user).update({_id:id},{$set:data},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                result.message = "更新信息失败！";
                logger.app.error("savaPriceConfig:  error! ", err);
                callback(result);
            }
        });
    },
    getMyInfo: function (data, session, callback) {
        var result = {success: false};
        var uid = session.user._id;
        mongo.db().collection(constants.DB.system_user).findOne({_id: uid}, function (err, dbUser) {
            if (!err) {
                if (dbUser) {
                    result.success = true;
                    result.data = dbUser;
                    callback(result);
                } else {
                    logger.app.error("getMyInfo:get systemUser info from db error! ", err);
                    result.message = "获取系统用户信息失败！";
                    callback(result);
                }
            } else {
                logger.app.error("getMyInfo:get systemUser info from db error! ", err);
                result.message = "获取系统用户信息失败！";
                callback(result);
            }
        });
    },


    /***********************withdraw start*************************************/
    saveWithDraw: function (data, session, callback) {
        var result = {success: false};
        var payee = {};
        payee.cardName = data.cardName;
        payee.address = data.address;
        payee.bank = data.bank;
        payee.cardNo = data.cardNo;
        if (data.payeeId) {
            payee._id = data.payeeId;
        }
        var uid=session.user._id;
        handler.savePayee(payee, session, function (rep) {
            if (rep.success) {
                mongo.db().collection(constants.DB.system_user).findOne({_id:uid},function(err,user){
                    if(!err){
                        var balance=utils.formatTrueFee(user.balance);
                        if(data.money>balance){
                            logger.app.error("saveWithDraw get orderNo error!");
                            result.message = "支取金额超过了你的实际金额，请关掉选项卡重新操作！";
                            callback(result);
                            return;
                        }
                        utils.BusinessUtil.getPayOrderNo(null, function (rep2) {
                            if (rep2.success) {
                                var withdraw = {};
                                withdraw._id = rep2.orderNo;
                                withdraw.time = utils.DateTime.getCurrentDateTime();
                                withdraw.status = constants.withdrawStatus.send;
                                withdraw.uid = session.user._id;
                                withdraw.payeeId = rep.pk;
                                withdraw.money = data.money;
                                withdraw.procedureFee = 0;
                                if(withdraw.money<500){
                                    withdraw.procedureFee = 2;
                                }
                                mongo.db().collection(constants.DB.bill_user_withdraw).insert(withdraw, {w: 1}, function (err) {
                                    if (!err) {
                                        data.name = session.user.name;
                                        data.orderNo = withdraw._id;
                                        data.procedureFee = withdraw.procedureFee;
                                        handler._sendMail2Withdraw(data, result, callback);
                                    } else {
                                        logger.app.error("saveWithDraw to db error!", err);
                                        result.message = "支取操作入库异常！";
                                        callback(result);
                                    }
                                });
                            } else {
                                logger.app.error("saveWithDraw get orderNo error!");
                                result.message = "获取流水号异常！";
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err);
                        result.message = "查询用户异常！";
                        callback(result);
                    }
                });

            } else {
                callback(rep);
            }
        });
    },
    _sendMail2Withdraw: function (data, result, callback) {
        var sendMail = {
            toAddr: [config.proxyMail],
            subject: "支取请求",
            type: "withdraw",
            ccAddr: [config.proxyMail],
            status: "undeal",
            seqId: data.orderNo
        };
        fs.readFile(__baseDir + "/views/withdraw/drawMail.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html, data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        result.data = data;
                        callback(result);
                    } else {
                        logger.app.error("insert to send mail to db error!", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("mail templete[withdraw] not found!", err);
                result.message = "mail templete[withdraw] not found!";
                callback(result);
            }
        });
    },
    _renderView: function (view, data, dir) {
        var oldDir = null;
        if (dir) {
            dir = dir + '.';
        } else {
            dir = '';
        }
        for (var i in data) {
            if (typeof data[i] == 'object' && typeof data[i] != null) {
                oldDir = dir;
                dir = dir + i;
                view = handler._renderView(view, data[i], dir);
                dir = oldDir;
                oldDir = null;
            } else {
                view = view.replace(new RegExp('_#' + dir + i + '#_', 'g'), data[i]);
            }
        }
        return view;
    },
    queryMylWithdraw: function (data, session, callback) {
        var result = {success: false};
        var query = {uid: session.user._id, status: constants.withdrawStatus.send};
        mongo.db().collection(constants.DB.bill_user_withdraw).find(query, {money: 1}).toArray(function (err, list) {
            if (!err) {
                var sum = 0;
                var list2 = list || [];
                for (var i = 0; i < list2.length; i++) {
                    var obj = list2[i];
                    sum += obj.money;
                }
                result.sum = sum;
                result.success = true;
            } else {
                logger.app.warn("queryMylWithdraw list error", err);
                result.message = "查询之前记录异常！";
            }
            callback(result);
        });
    },
    queryWithdrawList: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        var userIdentity = data.identity || 'proxy';
        delete data.identity;

        //生成用户ID限定条件
        var uidCondition={status:'enable'};
        if(data.uid){//查询某代理或者客户经理
            uidCondition._id = data.uid;
        }else if(session.user.identity == constants.systemUserIndentity.proxy || session.user.identity == constants.systemUserIndentity.customerCare) {
            //查询本人
            uidCondition._id = session.user._id;
        }else{
            //管理员身份查询
            uidCondition.identity = userIdentity;
        }

        mongo.db().collection(constants.DB.system_user).find(uidCondition,{_id:1}).toArray(function(err,users){
            if(!err){
                var users = users || [];
                var uids = [];
                for(var i=0;i<users.length;i++){
                    if(users[i]) {
                        uids.push(users[i]._id);
                    }
                }
                data.uid = {$in:uids};
                mongo.db().collection(constants.DB.bill_user_withdraw).count(data, function (err, count) {
                    if (!err) {
                        result.count = count;
                        mongo.db().collection(constants.DB.bill_user_withdraw).find(data, {sort: {time: -1}, limit: limit, skip: skip}).toArray(function (err, list) {
                            if (!err) {
                                result.list = list || [];
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.warn("queryWithdrawList list error", err);
                                result.message = "获取支付记录异常！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("queryWithdrawList count error", err);
                        result.message = "获取支付记录异常！";
                        callback(result);
                    }
                });
            }else{
                logger.app.warn("queryWithdrawList list error", err);
                result.message = "获取用户列表异常！";
                callback(result);
            }
        })

    },

    queryPayeeList: function (data, session, callback) {
        var result = {success: false};
        data.uid = session.user._id;
        mongo.db().collection(constants.DB.bill_user_payee).find(data, {sort: {createTime: -1}}).toArray(function (err, list) {
            if (!err) {
                result.list = list || [];
                result.success = true;
            } else {
                logger.app.warn("queryPayeeList list error", err);
                result.message = "获取收款人信息异常！";
            }
            callback(result);
        });
    },
    savePayee: function (data, session, callback) {
        var result = {success: false};
        if (!data._id) {
            data._id = utils.UUID.generateUuid();
        }
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.uid = session.user._id;
        mongo.db().collection(constants.DB.bill_user_payee).save(data, {safe: true}, function (err) {
            if (!err) {
                result.success = true;
                result.pk = data._id;
                callback(result);
            } else {
                logger.app.error("saveWithDraw to db error!", err);
                result.message = "支取操作入库异常！";
                callback(result);
            }
        });
    },
    finishWithDraw: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;

        mongo.db().collection(constants.DB.bill_user_withdraw).findOne({_id: id},function(err,withdrawDB){
            if (!err) {
                var status=withdrawDB.status;
                if(status==constants.withdrawStatus.finish){
                    logger.app.warn("支取请求已经完成");
                    result.message = "支取请求已经完成";
                    callback(result);
                }else if(status==constants.withdrawStatus.revert){
                    logger.app.warn("支取请求已经取消");
                    result.message = "支取请求已经取消";
                    callback(result);
                }else{
                    var set = {
                        status: constants.withdrawStatus.finish
                    }
                    mongo.db().collection(constants.DB.bill_user_withdraw).findAndModify({_id: id}, [], {$set: set}, {new: true}, function (err, row) {
                        if (!err) {
                            var balance=utils.formatFee(row.money);
                            var uid=row.uid;
                            mongo.db().collection(constants.DB.system_user).findAndModify({_id: uid},[],{$inc: {balance: -balance }},{new:true},function(err,theUser){
                                if (!err) {
                                    var time=utils.DateTime.getCurrentDateTime();
                                    var currentBalanceLong = theUser.balance;
                                    var currentBalance=utils.formatTrueFee(currentBalanceLong)+"";
                                    var income=utils.formatTrueFee(balance)+"";
                                    var userIdentity = theUser.identity;//提现申请人的身份.
                                    utils.BusinessUtil.getPayOrderNo(null,function(rep2){
                                        if(rep2.success){
                                            var orderNo="BP"+rep2.orderNo;
                                            if(userIdentity == 'customerCare'){
                                                var paySet = {
                                                    _id: rep2.orderNo,
                                                    create_time:time,
                                                    timestamp:utils.DateTime.getCurrentTimestamp(),
                                                    income:balance,
                                                    totalFee:balance,
                                                    currentBalance:currentBalanceLong,
                                                    source:constants.customerCareSource.withdraw,
                                                    account : '',
                                                    customerCare : uid,
                                                }
                                                mongo.db().collection(constants.DB.bill_customerCare_pay).insert(paySet);
                                            }else{
                                                var payset={
                                                    _id:orderNo,
                                                    status:'pay',
                                                    payType:constants.payType.balance,
                                                    money:income,
                                                    income:income,
                                                    account:'',
                                                    create_time:time,
                                                    pay_time:time,
                                                    flag:constants.proxySource.proxyWithDraw,
                                                    proxy:uid,
                                                    source:constants.proxySource.proxyWithDraw,
                                                    timestamp:utils.DateTime.getCurrentTimestamp(),
                                                    currentBalance:currentBalance
                                                }
                                                mongo.db().collection(constants.DB.bill_user_pay).insert(payset);
                                            }
                                            result.success = true;
                                            callback(result);
                                        }else{
                                            callback(rep2);
                                        }
                                    });
                                } else {
                                    logger.app.error("finishWithDraw to db error!", err);
                                    result.message = "完成支付请求数据异常";
                                    callback(result);
                                }
                            })
                        } else {
                            logger.app.error("finishWithDraw to db error!", err);
                            result.message = "完成支付请求数据异常";
                            callback(result);
                        }
                    });
                }
            }else{
                logger.app.error(err);
                result.message = "查询支付请求数据异常";
                callback(result);
            }
        });
    },
    queryWithDrawInfo: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        mongo.db().collection(constants.DB.bill_user_withdraw).findOne({_id: id}, function (err, row) {
            if (!err) {
                var key = row.payeeId;
                result.withdraw = row;
                mongo.db().collection(constants.DB.bill_user_payee).findOne({_id: key}, function (err, payee) {
                    if (!err) {
                        result.payee = payee;
                        result.success = true;
                    } else {
                        logger.app.error("queryWithDraw to db error!", err);
                        result.message = "请求数据异常";
                    }
                    callback(result);
                })
            } else {
                logger.app.error("queryWithDraw to db error!", err);
                result.message = "请求数据异常";
                callback(result);
            }
        });
    },
    revertWithDraw: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        var set = {
            status: constants.withdrawStatus.revert
        }
        mongo.db().collection(constants.DB.bill_user_withdraw).update({_id: id},{$set: set},function(err){
            if(!err){
                result.success=true;
                callback(result);
            }else{
                logger.app.error("revertWithDraw to db error!", err);
                result.message = "撤销支取请求数据异常";
                callback(result);
            }
        });
    },
    /***********************withdraw end*************************************/


    /***********************ask gateway sips start*************************************/
    finishAskGwSip: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        var set = {
            status: constants.withdrawStatus.finish
        }
        mongo.db().collection(constants.DB.bill_user_askgwsip).findAndModify({_id: id}, [], {$set: set}, {new: true}, function (err, row) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error("finishWithDraw to db error!", err);
                result.message = "完成申请网关sip号请求数据异常";
                callback(result);
            }
        });
    },
    queryAskGwSip: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        if (session.user.identity != constants.systemUserIndentity.admin) {
            data.uid = session.user._id;
        }
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.createTime = {
                $gte: beginTime + " 00:00:00"
            }
        }
        if (endTime) {
            if (data.createTime) {
                data.createTime.$lte = endTime + " 23:59:59"
            } else {
                data.createTime = {
                    $lte: endTime + " 23:59:59"
                }
            }
        }
        mongo.db().collection(constants.DB.bill_user_askgwsip).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.bill_user_askgwsip).find(data, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                    if (!err) {
                        result.list = docs || [];
                        result.success = true;
                    } else {
                        logger.app.warn("queryAskGwSip list error", err);
                        result.message = "查询申请sip号记录异常！";
                    }
                    callback(result);
                });
            } else {
                logger.app.warn("queryAskGwSip count error", err);
                result.message = "查询申请sip号记录异常！";
                callback(result);
            }
        });
    },
    saveAskGwSip: function (data, session, callback) {
        var result = {success: false};
        utils.BusinessUtil.getPayOrderNo(null, function (rep2) {
            if (rep2.success) {
                var set = {};
                set._id = rep2.orderNo;
                set.num = data.num;
                set.isFax = data.isFax || false;
                set.account = data.account;
                set.createTime = utils.DateTime.getCurrentDateTime();
                set.status = constants.withdrawStatus.send;
                set.product = data.product;
                set.billLoginName = session.account.billLoginName||'';

                mongo.db().collection(constants.DB.bill_user_askgwsip).insert(set, {w: 1}, function (err) {
                    if (!err) {
                        data.name =  session.account.billLoginName||session.account.companyName;
                        data.orderNo = set._id;
                        handler._sendMail2AskGw(data, result, function(){});
                        result.success = true;
                        result.data = data;
                        callback(result);
                    } else {
                        logger.app.error("saveAskGwSip to db error!", err);
                        result.message = "支取操作入库异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.error("saveAskGwSip get orderNo error!");
                result.message = "获取流水号异常！";
                callback(result);
            }
        });
    },
    _sendMail2AskGw: function (data, result, callback) {
        var sendMail = {
            toAddr: [config.proxyMail],
            subject: "申请网关sip号",
            type: "withdraw",
            ccAddr: [config.proxyMail],
            status: "undeal",
            seqId: data.orderNo
        };
        fs.readFile(__baseDir + "/views/withdraw/askGwSipMail.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html, data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error("insert to send mail to db error!", err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error("mail templete[saveAskGwSip] not found!", err);
                result.message = "mail templete[saveAskGwSip] not found!";
                callback(result);
            }
        });
    },
    /***********************ask gateway sips end*************************************/

    updateMyPwd: function (data,session, callback) {
        var result = {success: false};
        var uid=session.user._id;
        var query={_id:uid};

        mongo.db().collection(constants.DB.system_user).findOne(query,function(err,row){
            if(!err){
                if(row){
                    if(row.password==data.oldPwd){
                        var set={password:data.password};
                        mongo.db().collection(constants.DB.system_user).update(query,{$set:set},function(err){
                            if(!err){
                                result.success = true;
                                callback(result);
                            }else{
                                logger.app.error(err.stack);
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error('当前的密码输入错误');
                        result.message="当前的密码输入错误！";
                        callback(result);
                    }
                }else{
                    logger.app.error('不存在的账号');
                    result.message="不存在的账号！";
                    callback(result);
                }
            }else{
                logger.app.error(err.stack);
                callback(result);
            }
        });
    },
    updateMyInfo: function (data, session, callback) {
        var result = {success: false};
        var uid=session.user._id;
        mongo.db().collection(constants.DB.system_user).findOne({loginName: data.loginName}, function (err, oneUser) {
            if (!err) {
                if (!oneUser || oneUser._id == uid) {
                    mongo.db().collection(constants.DB.system_user).update({_id: uid}, {$set: data}, {w: 1}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error("updateMyInfo to db error!", err);
                            result.message = "数据库修改数据异常";
                            callback(result);
                        }
                    });
                } else {
                    result.message = "登录名【" + data.loginName + "】已经存在！";
                    callback(result);
                }
            } else {
                logger.app.warn("updateMyInfo check name err!", err);
                result.message = "检查用户名异常！";
                callback(result);
            }
        });
    },
    setAlertInfo: function (data, session, callback) {
        var result = {success: false};
        var uid=session.user._id;

        var set={
            isNotify:data.isNotify==null?false:true,
            isInvoice:data.isInvoice==null?false:true
        }
        mongo.db().collection(constants.DB.system_user).update({_id: uid}, {$set: set}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error("setAlertInfo to db error!", err);
                result.message = "数据库修改数据异常";
                callback(result);
            }
        });
    },
    saveCallEvent2Proxy: function (data, session, callback) {
        var result = {success: false};
        var uid=data._id;

        var set={
            callEventUrl:data.callEventUrl
        }
        mongo.db().collection(constants.DB.system_user).update({_id: uid}, {$set: set}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error("setAlertInfo to db error!", err);
                result.message = "数据库修改数据异常";
                callback(result);
            }
        });
    },
    setGroupFinanceInfo: function(data,session,callback){
        var result = {success: false};

        var condition = {
          _id : data._id,
        };
        var update = {
            $set:{realProxy : data.realProxy,},
        }

        SysUser.update(condition,update,function(err){
            if(err){
                logger.app.error("setGroupFinanceInfo to db error!", err);
                result.message = "数据库修改数据异常";
                return callback(result);
            }

            result.success = true;
            callback(result);
        });

    },
    stopSysUser : function(data,session,callback){
        var condition = {
            _id : data.stopUserId,
        };

        var update = {
            $set:{status: constants.systemUserSataus.disable},
        }

        var result = {success: false};
        SysUser.update(condition,update,function(err){
            if(err){
                logger.app.error("stopSysUser error occur.", err);
                result.message = '操作失败,请联系管理员';
                return callback(result);
            }

            result.success = true;
            callback(result);
        });
    }
};

module.exports = handler;
