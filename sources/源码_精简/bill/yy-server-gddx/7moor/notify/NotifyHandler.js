var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig');
var fs = require("fs");

var handler = {
    mail:"service@7moor.com",
    //mail:"wangdx@7moor.com",
    emailReg:/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
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
    notifyNum: function (data, callback) {
        var result = {success: false};
        var account=data.account;
        var snList=data.snList||[];
        var tmpl="<tr><td>_#num#_</td><td>_#endDate#_</td></tr>";

        mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, acc) {
            if (!err && acc) {
                var mail=acc.linkManEmail;
                var companyName=acc.companyName;
                var createMethod=acc.createMethod;
                var createUser=acc.createUser;
                var html=[];
                var set={
                    mail:handler.mail,
                    companyName:companyName,
                    snContent:''
                }
                //用于发给service@7moor.com
                var setService={
                    mail:handler.mail,
                    companyName:companyName,
                    snContent:''
                }
                mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                    if (!err) {
                        setService.proxyName=proxy.name || "无";
                        //setService.proxyIdentity=proxy.identity;
                        //setService.proxyStatus=proxy.status;
                        setService.proxyLinkManName=proxy.linkManName || "无";
                        setService.proxyLinkManEmail=proxy.linkManEmail || "无";
                        setService.proxyLinkManPhone=proxy.linkManPhone || "无";

                        var index=0;
                        var _mailHandler=function(){
                            if(index==snList.length){
                                setService.snContent=html.join("");
                                handler._sendNumMail27moor(setService);
                            }else{
                                var obj = snList[index];
                                html.push(handler._renderView(tmpl,obj));
                                index++;
                                _mailHandler();
                            }
                        };
                        _mailHandler();
                    }else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
                if(createMethod==constants.accountCreateMethod.proxy){
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                        if (!err) {
                            var proxyMail=proxy.linkManEmail;
                            var proxyName=proxy.name;
                            var isNotify=proxy.isNotify;
                            var parentID=proxy.parent;//用于判断上级

                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendNumMail2Proxy(set);
                            }else{
                                logger.app.error("proxy["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendNumMail2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            //发送给代理的上级
                            if(parentID && parentID != ''){
                                mongo.db().collection(constants.DB.system_user).findOne({_id:parentID}, function (err, parent) {
                                    if (!err) {
                                        var parentMail=parent.linkManEmail;
                                        var parentName=parent.name;
                                        if(parentMail && handler.emailReg.test(parentMail)){
                                            set.mail=parentMail;
                                            set.parentName=parentName;
                                            set.proxyName=proxy.name || "无";
                                            set.proxyLinkManName=proxy.linkManName || "无";
                                            set.proxyLinkManEmail=proxy.linkManEmail || "无";
                                            set.proxyLinkManPhone=proxy.linkManPhone || "无";
                                            handler._sendNumMail2Parent(set);
                                        }else{
                                            logger.app.error("parent["+parentName+"] mail is null ,not send mail!");
                                        }
                                        result.success = true;
                                        callback(result);
                                    }else {
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else if(createMethod==constants.accountCreateMethod.bill){//计费创建，提醒邮件发送给账户的创建人
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, createUser) {
                        if (!err) {
                            var proxyMail=createUser.linkManEmail;
                            var proxyName=createUser.name;
                            var isNotify=createUser.isNotify;
                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendNumMail2Proxy(set);
                            }else{
                                logger.app.error("createUser["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendNumMail2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    if(mail && handler.emailReg.test(mail)){
                        set.mail=mail;
                        handler._sendNumMail2Customer(set);
                    }else{
                        logger.app.error("customer["+account+"] mail is null ,not send mail!");
                    }
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _sendNumMail27moor: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "服务号码到期提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyNum_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    name: data.companyName,
                    snContent:data.snContent,
                    proxyName:data.proxyName,
                    proxyLinkManName:data.proxyLinkManName,
                    proxyLinkManEmail:data.proxyLinkManEmail,
                    proxyLinkManPhone:data.proxyLinkManPhone
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendNumMail27moor] not found!", err);
            }
        });
    },
    _sendNumMail2Parent: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "服务号码到期提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyNum_parent.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    parentName:data.parentName,
                    name: data.companyName,
                    snContent:data.snContent,
                    proxyName:data.proxyName,
                    proxyLinkManName:data.proxyLinkManName,
                    proxyLinkManEmail:data.proxyLinkManEmail,
                    proxyLinkManPhone:data.proxyLinkManPhone
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            }else {
                logger.app.error("mail templete[_sendNumMail2Parent] not found!", err);
            }
        });
    },
    _sendNumMail2Proxy: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "服务号码到期提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyNum_proxy.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    name: data.companyName,
                    snContent:data.snContent,
                    proxyName:data.proxyName
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendNumMail2Proxy] not found!", err);
            }
        });
    },
    _sendNumMail2Customer: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "服务号码到期提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyNum_customer.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    name: data.companyName,
                    snContent:data.snContent
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendNumMail2Customer] not found!", err);
            }
        });
    },
    _showLicenceType:function(type){
        var desc="";
        if(type=='enterprise'){
            desc="标准版";
        }else if(type=='outcall'){
            desc="外呼版";
        }else if(type=='monitor'){
            desc="监控版";
        }
        return desc;
    },
    notifyLicence: function (data, callback) {
        var result = {success: false};
        var account=data.account;
        var licenceList=data.licenceList||[];
        var tmpl="<tr><td>_#name#_</td><td>_#typeDesc#_</td><td>_#endDate#_</td></tr>";
        mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, acc) {
            if (!err && acc) {
                var mail=acc.linkManEmail;
                var companyName=acc.companyName;
                var createMethod=acc.createMethod;
                var createUser=acc.createUser;
                var html=[];
                var set={
                    mail:handler.mail,
                    companyName:companyName,
                    snContent:''
                }
                //用于发给service@7moor.com
                var setService={
                    mail:handler .mail ,
                    companyName:companyName ,
                    snContent:''
                }
                mongo .db ().collection (constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                    if (!err) {
                        setService .proxyName =proxy.name || "无";
                        //setService .proxyIdentity =proxy.identity;
                        //setService .proxyStatus =proxy.status ;
                        setService .proxyLinkManName =proxy.linkManName || "无";
                        setService .proxyLinkManEmail =proxy.linkManEmail || "无";
                        setService .proxyLinkManPhone =proxy.linkManPhone || "无";

                        var index=0;
                        var _mailHandler=function(){
                            if(index==licenceList.length){
                                setService.snContent=html.join("");
                                handler._sendLicence27moor(setService);
                            } else{
                                var obj = licenceList[index];
                                obj.typeDesc=handler._showLicenceType(obj.licenceType);
                                obj.name="licence"+(index+1);
                                html.push(handler._renderView(tmpl,obj));

                                index++;
                                _mailHandler();
                            }
                        };
                        _mailHandler();
                    }else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
                if(createMethod==constants.accountCreateMethod.proxy){
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                        if (!err) {
                            var proxyMail=proxy.linkManEmail;
                            var proxyName=proxy.name;
                            var isNotify=proxy.isNotify;
                            var parentID=proxy.parent;//用于判断上级
                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendLicence2Proxy(set);
                            }else{
                                logger.app.error("proxy["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendLicence2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            //发送给代理的上级
                            if(parentID && parentID != ''){
                                mongo.db().collection(constants.DB.system_user).findOne({_id:parentID}, function (err, parent) {
                                    if (!err) {
                                        var parentMail=parent.linkManEmail;
                                        var parentName=parent.name;
                                        if(parentMail && handler.emailReg.test(parentMail)){
                                            set.mail=parentMail;
                                            set.parentName=parentName;
                                            set.proxyName=proxy.name || "无";
                                            set.proxyLinkManName=proxy.linkManName || "无";
                                            set.proxyLinkManEmail=proxy.linkManEmail || "无";
                                            set.proxyLinkManPhone=proxy.linkManPhone || "无";
                                            handler._sendLicence2Parent(set);
                                        }else{
                                            logger.app.error("parent["+parentName+"] mail is null ,not send mail!");
                                        }
                                        result.success = true;
                                        callback(result);
                                    }else {
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else if(createMethod==constants.accountCreateMethod.bill){//计费创建，提醒邮件发送给账户的创建人
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, createUser) {
                        if (!err) {
                            var proxyMail=createUser.linkManEmail;
                            var proxyName=createUser.name;
                            var isNotify=createUser.isNotify;
                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendLicence2Proxy(set);
                            }else{
                                logger.app.error("createUser["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendLicence2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    if(mail && handler.emailReg.test(mail)){
                        set.mail=mail;
                        handler._sendLicence2Customer(set);
                    }else{
                        logger.app.error("customer["+account+"] mail is null ,not send mail!");
                    }
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _sendLicence27moor: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "licence到期提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyLicence_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    name: data.companyName,
                    snContent:data.snContent,
                    proxyName:data.proxyName,
                    proxyLinkManName:data.proxyLinkManName,
                    proxyLinkManEmail:data.proxyLinkManEmail,
                    proxyLinkManPhone:data.proxyLinkManPhone
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendLicence27moor] not found!", err);
            }
        });
    },
    _sendLicence2Parent: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "licence到期提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyLicence_parent.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    parentName:data.parentName,
                    name: data.companyName,
                    snContent:data.snContent,
                    proxyName:data.proxyName,
                    proxyLinkManName:data.proxyLinkManName,
                    proxyLinkManEmail:data.proxyLinkManEmail,
                    proxyLinkManPhone:data.proxyLinkManPhone
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            }else {
                logger.app.error("mail templete[_sendLicence2Parent] not found!", err);
            }
        });
    },
    _sendLicence2Proxy: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "licence到期提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyLicence_proxy.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    name: data.companyName,
                    snContent:data.snContent,
                    proxyName:data.proxyName
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendLicence2Proxy] not found!", err);
            }
        });
    },
    _sendLicence2Customer: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "licence到期提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyLicence_customer.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    name: data.companyName,
                    snContent:data.snContent
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendLicence2Customer] not found!", err);
            }
        });
    },
    /**
     *
     * @param data
     * @param callback
     */
    notifyDialFee: function (data, callback) {
        var result = {success: false};
        var account=data.account;
        var product=data.product;
        var balance=data.balance;
        var limit=data.limit;
        mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, acc) {
            if (!err && acc) {
                var mail=acc.linkManEmail;
                var companyName=acc.companyName;
                var createMethod=acc.createMethod;
                var createUser=acc.createUser;
                var set={
                    mail:handler.mail,
                    name:companyName,
                    product:product,
                    balance:balance,
                    limit:limit
                }
                //用于发给service@7moor.com
                var setService={
                    mail:handler.mail,
                    name:companyName,
                    product:product,
                    balance:balance,
                    limit:limit
                }
                mongo .db ().collection (constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                    if (!err) {
                        setService .proxyName =proxy.name || "无";
                        //setService .proxyIdentity =proxy.identity;
                        //setService .proxyStatus =proxy.status ;
                        setService .proxyLinkManName =proxy.linkManName || "无";
                        setService .proxyLinkManEmail =proxy.linkManEmail || "无";
                        setService .proxyLinkManPhone =proxy.linkManPhone || "无";

                        handler._sendDialFeeMail27moor(setService);
                    }else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
                if(createMethod==constants.accountCreateMethod.proxy){
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                        if (!err) {
                            var proxyMail=proxy.linkManEmail;
                            var proxyName=proxy.name;
                            var isNotify=proxy.isNotify;
                            var parentID=proxy.parent;//用于判断上级
                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendDialFee2Proxy(set);
                            }else{
                                logger.app.error("proxy["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendDialFee2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            //发送给代理的上级
                            if(parentID && parentID != ''){
                                mongo.db().collection(constants.DB.system_user).findOne({_id:parentID}, function (err, parent) {
                                    if (!err) {
                                        var parentMail=parent.linkManEmail;
                                        var parentName=parent.name;
                                        if(parentMail && handler.emailReg.test(parentMail)){
                                            set.mail=parentMail;
                                            set.parentName=parentName;
                                            set.proxyName=proxy.name || "无";
                                            set.proxyLinkManName=proxy.linkManName || "无";
                                            set.proxyLinkManEmail=proxy.linkManEmail || "无";
                                            set.proxyLinkManPhone=proxy.linkManPhone || "无";
                                            handler._sendDialFee2Parent(set);
                                        }else{
                                            logger.app.error("parent["+parentName+"] mail is null ,not send mail!");
                                        }
                                        result.success = true;
                                        callback(result);
                                    }else {
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else if(createMethod==constants.accountCreateMethod.bill){//计费创建，提醒邮件发送给账户的创建人
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, createUser) {
                        if (!err) {
                            var proxyMail=createUser.linkManEmail;
                            var proxyName=createUser.name;
                            var isNotify=createUser.isNotify;
                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendDialFee2Proxy(set);
                            }else{
                                logger.app.error("createUser["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendDialFee2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    if(mail && handler.emailReg.test(mail)){
                        set.mail=mail;
                        handler._sendDialFee2Customer(set);
                    }else{
                        logger.app.error("customer["+account+"] mail is null ,not send mail!");
                    }
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _showProductDesc:function(product){
        var desc="";
        if(product=='cc'){
            desc="呼叫中心";
        }else if(product=='zj'){
            desc="企业总机";
        }else if(product=='400'){
            desc="400";
        }
        return desc;
    },
    _sendDialFee2Parent: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "话费余额不足提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyDialFee_parent.html", function (err, html) {
            if (!err) {
                html = new String(html);
                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendDialFee2Parent] not found!", err);
            }
        });
    },
    _sendDialFeeMail27moor: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "话费余额不足提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyDialFee_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendDialFeeMail27moor] not found!", err);
            }
        });
    },
    _sendDialFee2Proxy: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "话费余额不足提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyDialFee_proxy.html", function (err, html) {
            if (!err) {
                html = new String(html);
                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendDialFee2Proxy] not found!", err);
            }
        });
    },
    _sendDialFee2Customer: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "话费余额不足提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyDialFee_customer.html", function (err, html) {
            if (!err) {
                html = new String(html);
                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendDialFee2Customer] not found!", err);
            }
        });
    },
    notifyBankPay: function (data, callback) {
        var result = {success: false};
        var account=data.account;
        mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, acc) {
            if (!err && acc) {
                var mail=acc.linkManEmail;
                var companyName=acc.companyName;
                var createMethod=acc.createMethod;
                var createUser=acc.createUser;
                var set={
                    mail:handler.mail,
                    name:companyName,
                    product:data.product,
                    totalFee:data.totalFee,
                    orderNo:data.orderNo,
                    trade_no:data.trade_no
                }
                handler._sendBankPayMail27moor(set);
                if(createMethod==constants.accountCreateMethod.proxy){
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                        if (!err) {
                            var proxyMail=proxy.linkManEmail;
                            var proxyName=proxy.name;
                            var isNotify=proxy.isNotify;
                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendBankPay2Proxy(set);
                            }else{
                                logger.app.error("proxy["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendBankPay2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    if(mail && handler.emailReg.test(mail)){
                        set.mail=mail;
                        handler._sendBankPay2Customer(set);
                    }else{
                        logger.app.error("customer["+account+"] mail is null ,not send mail!");
                    }
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _sendBankPayMail27moor: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "充值提醒",
            type: "bankPay",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyBankPay_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
//                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendBankPayMail27moor] not found!", err);
            }
        });
    },
    _sendBankPay2Proxy: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "充值提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyBankPay_proxy.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendBankPay2Proxy] not found!", err);
            }
        });
    },
    _sendBankPay2Customer: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "充值提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyBankPay_customer.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendBankPay2Customer] not found!", err);
            }
        });
    },
    notifyBankPay2Bill: function (data, callback) {
        var result = {success: false};
        var proxy=data.proxy;
        mongo.db().collection(constants.DB.system_user).findOne({_id:proxy}, function (err, proxy) {
            if (!err) {
                var proxyMail=proxy.linkManEmail;
                var proxyName=proxy.name;
                var set={
                    mail:handler.mail,
                    proxyName:proxyName,
                    totalFee:data.totalFee,
                    orderNo:data.orderNo,
                    trade_no:data.trade_no
                }
                handler._sendBankPay2BillMail27moor(set);
                if(proxyMail && handler.emailReg.test(proxyMail)){
                    set.mail=proxyMail;
                    handler._sendBankPay2Bill2Proxy(set);
                }else{
                    logger.app.error("proxy["+proxyName+"] mail is null ,not send mail!");
                }

                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _sendBankPay2BillMail27moor: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "充值提醒",
            type: "bankPay",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyBankPay2Bill_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
//                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendBankPay2BillMail27moor] not found!", err);
            }
        });
    },
    _sendBankPay2Bill2Proxy: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "充值提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyBankPay2Bill_proxy.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendBankPay2Bill2Proxy] not found!", err);
            }
        });
    },

    notifyZJBalance:function(accDB){
        var dialAlertZJ = accDB.dialAlertZJ*10000;
        var balance=accDB.balance;
        var account=accDB._id;
        var id=account+"_zj";
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id:id},function(err,row){
            if(!err && row){
                var notifyNum=row.notifyNum||0;
                if(balance>0 && balance<=dialAlertZJ && notifyNum==0){
                    handler._insertNotify(account,balance,dialAlertZJ,"zj");
                }else if(balance<=0 && notifyNum<=1){
                    handler._insertNotify(account,balance,dialAlertZJ,"zj");
                }
            }else{
                logger.app.error(err);
            }
        });
    },
    notifyCCBalance:function(accDB){
        var dialAlertZJ = accDB.dialAlertZJ*10000;
        var dialAlertCC = accDB.dialAlertCC*10000;
        var balance=accDB.balance;
        var account=accDB._id;
        var id=account+"_cc";
        mongo.db().collection(constants.DB.platform_account_product).find({_id:id}).toArray(function (err, products){
            if(!err && products){
                for (var i = 0; i < products.length; i++) {
                    var obj = products[i];
                    var notifyNum=obj.notifyNum||0;
                    if(obj.product=='zj'){
                        if(balance>0 && balance<=dialAlertZJ && notifyNum==0){
                            handler._insertNotify(account,balance,dialAlertZJ,"zj");
                        }else if(balance<=0 && notifyNum<=1){
                            handler._insertNotify(account,balance,dialAlertZJ,"zj");
                        }
                    }else{
                        if(balance>0 && balance<=dialAlertZJ && notifyNum==0){
                            handler._insertNotify(account,balance,dialAlertCC,"cc");
                        }else if(balance<=0 && notifyNum<=1){
                            handler._insertNotify(account,balance,dialAlertCC,"cc");
                        }
                    }
                }
            }else{
                logger.app.error(err);
            }
        });
    },
    _insertNotify:function(account,balance,limit,product){
        var id=account+"_zj";
        mongo.db().collection(constants.DB.platform_account_product).update({_id:id},{$inc:{notifyNum:1}},function(err){
            if(!err){
                var set={
                    type:"dialAlert",
                    account:account,
                    product:product,
                    balance:balance/10000,
                    limit:limit/10000
                };
                mongo.db().collection(constants.DB.bill_notify).insert(set);
            }else{
                logger.app.error(err);
            }
        })
    },
    notifyOweFee: function (data, callback) {
        var result = {success: false};
        var account=data.account;
        var product=data.product;
        var balance=data.balance;
        var limit=data.limit;
        mongo.db().collection(constants.DB.platform_account).findOne({_id: account}, function (err, acc) {
            if (!err && acc) {
                var mail=acc.linkManEmail;
                var companyName=acc.companyName;
                var createMethod=acc.createMethod;
                var createUser=acc.createUser;
                var set={
                    mail:handler.mail,
                    name:companyName,
                    product:product,
                    balance:balance,
                    limit:limit
                }
                //用于发给service@7moor.com
                var setService={
                    mail:handler.mail,
                    name:companyName,
                    product:product,
                    balance:balance,
                    limit:limit
                }
                mongo .db ().collection (constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                    if (!err) {
                        setService .proxyName =proxy.name || "无";
                        //setService .proxyIdentity =proxy.identity;
                        //setService .proxyStatus =proxy.status ;
                        setService .proxyLinkManName =proxy.linkManName || "无";
                        setService .proxyLinkManEmail =proxy.linkManEmail || "无";
                        setService .proxyLinkManPhone =proxy.linkManPhone || "无";

                        handler._sendOweFeeMail27moor(setService);
                    }else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
                if(createMethod==constants.accountCreateMethod.proxy){
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, proxy) {
                        if (!err) {
                            var proxyMail=proxy.linkManEmail;
                            var proxyName=proxy.name;
                            var isNotify=proxy.isNotify;
                            var parentID=proxy.parent;//用于判断上级
                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendOweFee2Proxy(set);
                            }else{
                                logger.app.error("proxy["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendOweFee2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            //发送给代理的上级
                            if(parentID && parentID != ''){
                                mongo.db().collection(constants.DB.system_user).findOne({_id:parentID}, function (err, parent) {
                                    if (!err) {
                                        var parentMail=parent.linkManEmail;
                                        var parentName=parent.name;
                                        if(parentMail && handler.emailReg.test(parentMail)){
                                            set.mail=parentMail;
                                            set.parentName=parentName;
                                            set.proxyName=proxy.name || "无";
                                            set.proxyLinkManName=proxy.linkManName || "无";
                                            set.proxyLinkManEmail=proxy.linkManEmail || "无";
                                            set.proxyLinkManPhone=proxy.linkManPhone || "无";
                                            handler._sendOweFee2Parent(set);
                                        }else{
                                            logger.app.error("parent["+parentName+"] mail is null ,not send mail!");
                                        }
                                        result.success = true;
                                        callback(result);
                                    }else {
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else if(createMethod==constants.accountCreateMethod.bill){//计费创建，提醒邮件发送给账户的创建人
                    mongo.db().collection(constants.DB.system_user).findOne({_id:createUser}, function (err, createUser) {
                        if (!err) {
                            var proxyMail=createUser.linkManEmail;
                            var proxyName=createUser.name;
                            var isNotify=createUser.isNotify;
                            if(proxyMail && handler.emailReg.test(proxyMail)){
                                set.mail=proxyMail;
                                set.proxyName=proxyName;
                                handler._sendOweFee2Proxy(set);
                            }else{
                                logger.app.error("createUser["+proxyName+"] mail is null ,not send mail!");
                            }
                            if(isNotify){
                                if(mail && handler.emailReg.test(mail)){
                                    set.mail=mail;
                                    handler._sendOweFee2Customer(set);
                                }else{
                                    logger.app.error("customer["+account+"] mail is null ,not send mail!");
                                }

                            }
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    if(mail && handler.emailReg.test(mail)){
                        set.mail=mail;
                        handler._sendOweFee2Customer(set);
                    }else{
                        logger.app.error("customer["+account+"] mail is null ,not send mail!");
                    }
                    result.success = true;
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    _sendOweFee2Parent: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "话费余额不足提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyOweFee_parent.html", function (err, html) {
            if (!err) {
                html = new String(html);
                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendOweFee2Parent] not found!", err);
            }
        });
    },
    _sendOweFeeMail27moor: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "话费余额不足提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyOweFee_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendOweFeeMail27moor] not found!", err);
            }
        });
    },
    _sendOweFee2Proxy: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "话费余额不足提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyOweFee_proxy.html", function (err, html) {
            if (!err) {
                html = new String(html);
                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendOweFee2Proxy] not found!", err);
            }
        });
    },
    _sendOweFee2Customer: function (data) {
        var sendMail = {
            toAddr: [data.mail],
            subject: "话费余额不足提醒",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyOweFee_customer.html", function (err, html) {
            if (!err) {
                html = new String(html);
                data.productDesc=handler._showProductDesc(data.product);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendOweFee2Customer] not found!", err);
            }
        });
    },
    sendAccountIdentity27moor: function (data) {
        var sendMail = {
            toAddr: [handler.mail],
            subject: "云客服企业认证",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyAccIdentity_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[sendAccountIdentity27moor] not found!", err);
            }
        });
    },
    sendAuditIdentity27moor: function (data) {
        if(!handler.emailReg.test(data.mail)){
            logger.app.error("account["+data.loginName+"] mail is null ,not send mail!");
            return
        }
        var sendMail = {
            toAddr: [data.mail],
            subject: "云客服企业认证",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyAuditIdentity_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[sendAuditIdentity27moor] not found!", err);
            }
        });
    },
    sendZJSelectNum27moor: function (data) {
        var sendMail = {
            toAddr: ['zhijian@7moor.com'],//
            subject: "总机选号通知",
            type: "notify",
            ccAddr: [],
            status: "undeal"
        };
        fs.readFile(__baseDir + "/views/notify/notifyZJSelectNum_7moor.html", function (err, html) {
            if (!err) {
                html = new String(html);
                html = handler._renderView(html,data);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[sendAccountIdentity27moor] not found!", err);
            }
        });
    },


    notifyCustFee: function(data,callback){
        var result = {success:false};
        _impl.getAccount(data.account,function(err,account){
            if(err){
                logger.app.error("send mail to customer to notify custFee failed", err);
                callback(result);
                return;
            }
            _impl.getSysUser(account.createUser,function(err,sysUser){
                if(err){
                    logger.app.error("send mail to customer to notify custFee failed", err);
                    callback(result);
                    return;
                }
                _impl.getCustFee(data.account,data.custFeeId,function(err,custFee) {
                    if(err){
                        logger.app.error("send mail to customer to notify custFee failed", err);
                        callback(result);
                        return;
                    }
                    var param = {
                        name: account.companyName,
                        proxyName: sysUser.name,
                        custFeeName: custFee.name,
                        day2End: data.day2End,

                    };
                    //给客户发邮件
                    _impl.sendMail(account.linkManEmail, "自定义扣费到期提醒", "notify", [], "undeal", "notifyManualCustFee_customer", param, function (err) {
                        if (err) {
                            logger.app.error("send mail to customer to notify manual custFee failed", err);
                            callback(result);
                            return;
                        }
                        //给代理发邮件
                        _impl.sendMail(sysUser.linkManEmail, "自定义扣费到期提醒", "notify", [], "undeal", "notifyManualCustFee_proxy", param, function (err) {
                            if (err) {
                                logger.app.error("send mail to proxy to notify manual custFee failed", err);
                                callback(result);
                                return;
                            }
                        });

                        result.success = true;
                        callback(result);
                    });

                });
            });

        });
    },
    notifyCustFeeStop: function(data,callback){
        var result = {success:false};
        _impl.getAccount(data.account,function(err,account){
            if(err){
                logger.app.error("send mail to customer to notify custFee stop failed", err);
                callback(result);
                return;
            }
            _impl.getSysUser(account.createUser,function(err,sysUser){
                if(err){
                    logger.app.error("send mail to customer to notify custFee stop failed", err);
                    callback(result);
                    return;
                }
                _impl.getCustFee(data.account,data.custFeeId,function(err,custFee) {
                    if(err){
                        logger.app.error("send mail to customer to notify custFee stop failed", err);
                        callback(result);
                        return;
                    }
                    var param = {
                        name: account.companyName,
                        proxyName: sysUser.name,
                        custFeeName: custFee.name,
                        stopTime: data.stopTime,
                    };
                    var templateCustomer, templateProxy;
                    if (data.autoRenew == 'true') {
                        templateCustomer = 'notifyAutoRenewCustFeeStop_customer';
                        templateProxy = 'notifyAutoRenewCustFeeStop_proxy';
                    } else {
                        templateCustomer = 'notifyManualCustFeeStop_customer';
                        templateProxy = 'notifyManualCustFeeStop_proxy';
                    }
                    //给客户发邮件
                    _impl.sendMail(account.linkManEmail, "自定义扣费停止计费通知", "notify", [], "undeal", templateCustomer, param, function (err) {
                        if (err) {
                            logger.app.error("send mail to customer to notify manual custFee stop failed", err);
                            callback(result);
                            return;
                        }

                        //给代理发邮件
                        _impl.sendMail(sysUser.linkManEmail, "自定义扣费停止计费通知", "notify", [], "undeal", templateProxy, param, function (err) {
                            if (err) {
                                logger.app.error("send mail to proxy to notify manual custFee stop failed", err);
                                callback(result);
                                return;
                            }
                        });

                        result.success = true;
                        callback(result);
                    });
                });
            });

        });
    }

};

var _impl = {
    sendMail : function(toAddr,subject,type,ccAddr,status,view,param,callback){
        var mail = {
            toAddr : [toAddr],
            subject: subject,
            type   : type,
            ccAddr : ccAddr,
            status : status,
        }
        fs.readFile(__baseDir + "/views/notify/"+view+".html", function (err, html) {
            if (err) {
                callback(err);
                return;
            }
            html = new String(html);
            html = handler._renderView(html,param);

            mail.content = html;
            mongo.db().collection(constants.DB.bill_system_mail_send).insert(mail, function (err) {
                if (err) {
                    callback(err);
                    return;
                }

                callback();
            });
        });
    },
    getAccount: function(acountId,callback){
        mongo.db().collection(constants.DB.platform_account).findOne({_id: acountId}, function (err, record) {
            if(err){
                callback(err);
                return;
            }
            callback(null,record)
        });
    },
    getSysUser: function(userId,callback){
        mongo.db().collection(constants.DB.system_user).findOne({_id: userId}, function (err, record) {
            if(err){
                callback(err);
                return;
            }
            callback(null,record)
        });
    },
    getCustFee : function(accountId,custFeeId,callback){
        _impl.getCustFeeList(accountId,function(err,records) {
            if (err) {
                callback(err);
                return;
            }
            if (!records || records.length <= 0) {
                callback(null, null);
                return;
            }

            var custFee;

            var custFeeMatch = records.filter(function (item) {
                return item.id == custFeeId;
            });
            if (custFeeMatch.length == 0) {
                callback(null, null);
                return;
            }

            custFee = custFeeMatch[0];

            callback(null,custFee);
        });
    },
    getCustFeeList: function(account,callback){
        _impl.getProduct(account+'_custFee',function(err,product){
            if(err){
                callback(err);
                return;
            }
            if(!product){
                callback(null,null);
                return;
            }

            callback(null,product.custFees);
        });
    },
    getProduct : function(id,callback) {
        mongo.db().collection(constants.DB.platform_account_product).findOne({_id: id}, function (err, record) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, record);
        });
    },

}

module.exports = handler;
