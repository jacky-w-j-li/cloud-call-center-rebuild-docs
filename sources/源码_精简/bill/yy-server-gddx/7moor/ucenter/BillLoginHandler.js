var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig');
var appSession = require('appSession');
var fs = require("fs");
var systemUserHandler = require(__baseDir + "/7moor/system/SystemUserHandler");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var httpProvider = require("appHttp");

var handler = {
    billLogin: function (data, session, callback) {
        var result = {success: false};
        result.sessionId = session._id;
        mongo.db().collection(constants.DB.platform_account).findOne({_id:session.account._id}, function (err,acc){
            if(!err){
                //for redirect user info
                acc.billIdentity=session.account.billIdentity||"";
                acc.billLoginName=session.account.billLoginName||"";
                acc.billLimits=session.account.billLimits||[];
                acc.products = session.account.products;
                acc.isNotify=session.account.isNotify;
                acc.proxyType=session.account.proxyType;
                //session.account.balance=acc.balance;
                //session.account.overdraw=acc.overdraw||0;
                result.account = acc;
                result.success=true;
                if (acc.financeAccount) {
                    mongo.db().collection(constants.DB.platform_account).findOne({_id: acc.financeAccount}, function(err, financeAccount) {
                        if (err) {
                            logger.app.warn("billLogin error", err);
                            callback(result);
                        } else {
                            acc.financeAccount = financeAccount;
                            callback(result);
                        }
                    });
                } else {
                    callback(result);
                }
            }else{
                logger.app.warn("billLogin error", err);
                callback(result);
            }
        });

    },
    getSessionId:function(data,callback){
        var result={
            success:true,
            showView:true,
            view:"pay_blank.html",
            data:{}
        }
        appSession.login(data, function (rep) {
            var html='';
            if(rep.success){
                html='<script type="text/javascript">var url=\''+config.ucenterUrl+'/?sid='+rep.sessionId+'\';window.location=url;</script>';
                result.data={html:html};
                callback(result);
            }else{
                html='自动登录失败，请重试';
                result.data={html:html};
                result.view="error_tips.html";
                callback(result);
            }
        });
    },
    getCCSessionId:function(data,callback){
        var result={success:false};
        var dest=data.dest;
        appSession.loginByCCSid(data, function (rep) {
            if(rep.success){
                var returnUrl=config.ucenterUrl+"/?sid="+rep.sessionId+"&dest="+dest;
                callback({success:true,url:returnUrl});
            }else{
                var error = new Error('request service error!');
                logger.request.error(error);
                callback(result);
            }
        });
    },
    /**
     * http://localhost:8086/public?action=taobao.getTbSessionId&data={"t_id":"dxtest"}
     * @param data
     * @param callback
     */
    getTbSessionId:function(data,res){
        var result={
            success:true,
            showView:true,
            view:"pay_blank.html",
            data:{}
        }
        var account=data;
//        var tid=data.t_id;
//        mongo.db().collection(constants.DB.platform_account).findOne({t_id:tid},function (err, account) {
//            if (!err) {
                var t_status=account.t_status;
                if(t_status==false){
                    var url=config.ucenterUrl+'/?sid='+account._id+"&type=taobao&companyName="+account.companyName;
                    var html='<script type="text/javascript">var url=\''+url+'\';window.location=url;</script>';
                    result.data={html:html};
                    res.render(result.view,result.data);
                }else{
                    var param={
                        data: {
                            loginName:account.name,
                            password:account.managerPassword,
                            type:'ucenter'
                        }
                    }
                    appSession.login(param, function (rep) {
                        var html='';
                        if(rep.success){
                            html='<script type="text/javascript">var url=\''+config.ucenterUrl+'/?sid='+rep.sessionId+'\';window.location=url;</script>';
                            result.data={html:html};
                            res.render(result.view,result.data);
                        }else{
                            html='自动登录失败，请重试';
                            result.data={html:html};
                            result.view="error_tips.html";
                            res.render(result.view,result.data);
                        }
                    });
                }
//            } else {
//                logger.app.warn("getTbSessionId error", err);
//                result.message = "查询账户信息异常！";
//                callback(result);
//            }
//
//        });
    },
    /**
     * http://127.0.0.1:8086/?sid=N00000000092&type=taobao&companyName=1
     * @param data
     * @param callback
     */
    finishTaobao:function(data,callback){
        var result={success:false};
        handler.checkRepeat(data,function(rep){
            if(rep.success){
                var id=data._id;
                delete data._id;
                data.t_status=true;
                delete data.managerPassword2;
                mongo.db().collection(constants.DB.platform_account).findAndModify({_id:id},[],{$set:data}, {new:true},function (err,newAccount) {
                    if (!err) {
                        handler._sendMail2Taobao(data);
                        var info={
                            account:id,
                            pbx:newAccount.pbx[0].pbx,
                            displayName:newAccount.companyName,
                            name:newAccount.name
                        }
                        syncAcs.updateAccount(info,function(isSuccess){});
                        var param={
                            data: {
                                loginName:data.name,
                                password:data.managerPassword,
                                type:'ucenter'
                            }
                        };
                        appSession.login(param, function (rep) {
                            if(rep.success){
                                var url=config.ucenterUrl+'/?sid='+rep.sessionId;
                                result.url=url;
                                result.success=true;
                                callback(result);
                            }else{
                                callback(rep);
                            }
                        });
                    } else {
                        logger.app.warn("finishTaobao error", err);
                        result.message = "完善账户信息异常！";
                        callback(result);
                    }
                });
            } else{
                callback(rep);
            }
        });

    },
    checkRepeat:function(data,callback){
        var result = {success: false};
        var query={name:data.name};
        query._id={$ne:data._id};
        mongo.db().collection(constants.DB.platform_account).count(query,function (err, count) {
            if (!err) {
                if (count == 0) {
                    var query2={linkManEmail:data.linkManEmail};
                    query2._id={$ne:data._id};
                    mongo.db().collection(constants.DB.platform_account).count(query2,function (err, num2) {
                        if (!err) {
                            if (num2 == 0) {
                                result.success = true;
                                callback(result);
                            } else {
                                result.message = '该邮箱已经存在';
                                callback(result);
                            }
                        } else {
                            logger.app.error(err.stack);
                            result.message = '校验名称重复出错';
                            callback(result);
                        }
                    });
                } else {
                    result.message = '该账户名已经存在';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = '校验名称重复出错';
                callback(result);
            }
        });
    },
    _sendMail2Taobao: function (data) {
        var sendMail = {
            toAddr: [data.linkManEmail],
            subject: "账号信息已完善",
            type: "registe",
            ccAddr: [config.proxyMail],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/taobao/finish_reg.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = systemUserHandler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendMail2Taobao] not found!", err);

            }
        });
    },
    validateAccount:function(data,callback){
        var key='';
        var val='';
        for(var k in data){
            key=k;
            val=data[k];
            break;
        }
        var query={key:val};
        mongo.db().collection(constants.DB.platform_account).count(query,function(err,count){
            if(!err){
                if(count>0){
                    callback(false);
                }else{
                    callback(true);
                }
            }else{
                logger.app.error("validateAccount error", err);
                callback(false);
            }
        });
    },
    checkCCPbx: function (data,session, callback) {
        var result = {success: false};
        var id=data.account+"_"+constants.product.cc;
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:id},function(err,row){
            if (err) {
                logger.app.error(err);
                result.message = 'get cc product pbx error!'+err.message;
                callback(result);
            }else{
                var pbx=[];
                if(row){
                    pbx=row.pbx;
                    result.success=true;
                    result.pbx=pbx||[];
                    callback(result);
                }else{
                    result.message="您还没有开通呼叫中心产品！";
                    callback(result);
                }
            }
        });
    },
    redirectCCAdminLogin: function (data, session, callback) {
        var uid=session.user._id;
        var identity=session.user.identity;
        data.billId=uid;
        data.identity=identity;
        var url=config.ccServerUrl+"service?action=getLoginSession&data="+JSON.stringify(data);
        url=encodeURI(url);
//        res.redirect(url);
        var result={success:false};
        httpProvider.sendGet(url,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.success){
                        var sid=res.sid;
                        var returnUrl=config.ccServerUrl+"?sessionId="+sid;
                        callback({success:true,url:returnUrl});
                    }else{
                        callback(result);
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }else{
                var error = err || new Error('request service error!');
                logger.request.error(error);
                callback(result);
            }
        });
    },
    redirectCCInLogin: function (data, session, callback) {
	console.log("debug:"+session);
        var uid=session.user._id;
        var identity=session.user.identity;
        data.billId=uid;
        data.identity=identity;
        var url=config.ccInUrl+"service?action=getLoginSession&data="+JSON.stringify(data);
	logger.app.info("debug:"+url);
        url=encodeURI(url);
//        res.redirect(url);
        var result={success:false};
        httpProvider.sendGet(url,function(err,res){
	    logger.app.info("debug:"+res);
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.success){
                        var sid=res.sid;
                        var returnUrl=config.ccInUrl+"?sessionId="+sid;
                        callback({success:true,url:returnUrl});
                    }else{
                        callback(result);
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }else{
                var error = err || new Error('request service error!');
                logger.request.error(error);
                callback(result);
            }
        });
    },
    redirectCCOutLogin: function (data, session, callback) {
        var uid=session.user._id;
        var identity=session.user.identity;
        data.billId=uid;
        data.identity=identity;
        var url=config.ccOutUrl+"service?action=getLoginSession&data="+JSON.stringify(data);
        url=encodeURI(url);
//        res.redirect(url);
        var result={success:false};
        httpProvider.sendGet(url,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.success){
                        var sid=res.sid;
                        var returnUrl=config.ccOutUrl+"?sessionId="+sid;
                        callback({success:true,url:returnUrl});
                    }else{
                        callback(result);
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(result);
                }
            }else{
                var error = err || new Error('request service error!');
                logger.request.error(error);
                callback(result);
            }
        });
    }

};


module.exports = handler;
