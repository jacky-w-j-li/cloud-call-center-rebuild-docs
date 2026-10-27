var logger = require("appLog");
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var utils = require('appUtil/Utils');
var mongo = require('appDb/MongoDb');
var fs = require("fs");

var handler = {
    emailReg:/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    /**
     * 0:处理中，1:处理完成，2:离线
     * @param data
     * @param callback
     */
    customerPlanNotify: function (data, callback) {
        var result = {success: false};
        var noteId=data._id;
        mongo.db().collection(fields.DB_APP_NOTE).findOne({_id: noteId}, function (err, doc) {
            if (!err && doc) {
                var aid = doc.accountId;
                var uid = doc.userId;
                var remark = doc.remark;
                var cid = doc.customerId;
                var notifyTime = doc.notifyTime;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid + "_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db = productDB.dataDB;
                        mongo.db(db).collection(aid + fields.DB_C5_CUSTOMER).findOne({_id: cid}, function (err, custDB) {
                            if(!err && custDB){
                                var custName = custDB.name;
                                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                    if(!err ){
                                        if(client){
                                            var msg = {
                                                userId: uid,
                                                eventData:{
                                                    Event:'customerPlan',
                                                    Account:aid,
                                                    Data:{
                                                        remark:encodeURIComponent(remark),
                                                        notifyTime:notifyTime,
                                                        cid:cid,
                                                        custName:custName
                                                    }
                                                }
                                            };
                                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                            httpProvider.sendGet(url,function (err, rep) {
                                                try {
                                                    rep = JSON.parse(rep);
                                                } catch (e) {
                                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                    callback(result);
                                                    return;
                                                }

                                                if (!err && rep.success) {
                                                    mongo.db().collection(fields.DB_APP_NOTE).update({_id:noteId},{$set:{deal:"1"}},function(err){
                                                        if(err){
                                                            logger.app.error(err);
                                                        }
                                                    })
                                                    result.success = true;
                                                    callback(result);
                                                } else {
                                                    logger.app.error("push customerPlan error[" + uid + "]", err);
                                                    callback(result);
                                                }
                                            });

                                            //send mail
                                            /*                         mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
                                             if (!err && userDB) {
                                             var userName = userDB.displayName;
                                             var mail = userDB.email;
                                             var title = "你的联系计划［" + remark + "］即将到期";
                                             var msg = "你的联系计划［" + remark + "］将于<span style='color: red;'>" + notifyTime + "</span>到期";
                                             var sendMail = {
                                             toAddr: [mail],
                                             subject: title,
                                             type: "notify",
                                             ccAddr: [],
                                             status: "undeal"
                                             };
                                             fs.readFile(__baseDir + "/views/notify/notify_customer_plan.html", function (err, data) {
                                             if (!err) {
                                             data = new String(data);
                                             data = data.replace(/_#userName#_/, userName);
                                             data = data.replace(/_#content#_/, msg);
                                             sendMail.content = data;
                                             mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                             if (!err) {
                                             //callback(null);
                                             } else {
                                             logger.app.error("insert to send mail to db error!", err);
                                             //callback(err);
                                             }
                                             });
                                             } else {
                                             logger.app.error("mail templete[notify_customer_plan] not found!", err);
                                             //callback(err);
                                             }
                                             });
                                             } else {
                                             //callback(err);
                                             }
                                             });*/
                                        }else{
                                            //offline
                                            mongo.db().collection(fields.DB_APP_NOTE).update({_id:noteId},{$set:{deal:"2"}},function(err){
                                                if(!err){
                                                    result.message = 'agent not logined';
                                                    result.success = true;
                                                    callback(result);
                                                }else{
                                                    logger.app.error(err);
                                                    callback(result);
                                                }
                                            })
                                        }
                                    }else{
                                        logger.app.error(err);
                                        callback(result);
                                    }
                                });
                            }
                        })
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                })
/*                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,custDB){
                    if(!err && custDB){
                        var name=custDB.name;
                      //  var msg = "你的联系计划［" + remark + " ］将于" + notifyTime + "到期";

                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                })*/

            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },

    saleChanceNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.uid;
        var cid = data.cid;
        var type = data.type;
        //console.info("saleChanceNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                       var db=productDB.dataDB;
                        mongo.db(db).collection(aid+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,custDB){
                            if(!err && custDB){
                                var name=custDB.name;
                                var content = "您有一个新的商机［" + name + "］，请及时查看";

                                var sendMail=function(){
                                    var userName = userDB.displayName;
                                    var mail = userDB.email;
                                    var title = content;
                                    var msg = content;
                                    if(mail && handler.emailReg.test(mail)){
                                        var sendMail = {
                                            toAddr: [mail],
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#userName#_/, userName);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance] not found!", err);
                                            }
                                        });
                                    }
                                }

                                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                    if(!err ){
                                        if(client){
                                            var msg = {
                                                userId: uid,
                                                eventData:{
                                                    Event:'saleChance',
                                                    Account:aid,
                                                    Data:{
                                                        type:type,
                                                        content:encodeURIComponent(content),
                                                        cid:cid,
                                                        custName:name
                                                    }
                                                }
                                            };
                                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                            httpProvider.sendGet(url,function (err, rep) {
                                                try {
                                                    rep = JSON.parse(rep);
                                                } catch (e) {
                                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                    callback(result);
                                                    return;
                                                }
                                                if (!err && rep.success) {
                                                } else {
                                                    logger.app.error("push saleChanceNotify error[" + uid + "]", err);
                                                    //callback(result);
                                                }
                                            });

                                            //send mail
                                            //sendMail();
                                        }else{
                                            //offline
                                            //sendMail();
                                        }
                                        //sendMail();
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
                        })
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
    saleChanceManagerNotify: function (data, callback) {
        var result = {success: false};
        var uids=data.uids;
        var cid = data.cid;
        var type = data.type;
        //console.info("saleChanceManagerNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).find({_id: {$in:uids}}).toArray(function (err, userDBs) {
            if (!err && userDBs) {
                var aid= userDBs[0].account;
                var mails=[];
                //for (var i = 0; i < userDBs.length; i++) {
                //    var obj = userDBs[i];
                //    if(i==0){
                //        aid=obj.account;
                //    }
                //    mails.push(obj.email);
                //}
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                        mongo.db(db).collection(aid+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,custDB){
                            if(!err && custDB){
                                var name=custDB.name;
                                var content="系统有一个新的商机［" + name + "］，当前商机池中所有成员都不在线或关闭了领取，请您及时查看进行分配";
                                var sendMail=function(){
                                    var title = "新商机未分配提醒";
                                    var msg = content;
                                    if(mails.length>0){
                                        var sendMail = {
                                            toAddr: mails,
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance_manager.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance_manager] not found!", err);
                                            }
                                        });
                                    }
                                }

                                mongo.db().collection('app_push_client').find({_id:{$in:uids}}).toArray(function(err, clients){
                                    if(!err ){
                                        clients=clients||[];
                                        clients.forEach(function(client){
                                            if(client){
                                                var msg = {
                                                    userId: client._id,
                                                    eventData:{
                                                        Event:'saleChance',
                                                        Account:aid,
                                                        Data:{
                                                            type:type,
                                                            content:encodeURIComponent(content),
                                                            cid:cid
                                                        }
                                                    }
                                                };
                                                var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                                httpProvider.sendGet(url,function (err, rep) {
                                                    try {
                                                        rep = JSON.parse(rep);
                                                    } catch (e) {
                                                        logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                        return;
                                                    }

                                                    if (!err && rep.success) {
                                                    } else {
                                                        logger.app.error("push saleChanceNotify error[" + uid + "]", err);
                                                    }
                                                });
                                                if (client.user.email && handler.emailReg.test(client.user.email)){
                                                    mails.push(client.user.email);
                                                }
                                                //send mail
                                                //sendMail();
                                            }
                                            //else{
                                            //    //offline
                                            //    sendMail();
                                            //}
                                        })
                                        //sendMail();
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
                        })
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
    /**
     * 丢单、无效审核提醒
     *  2无效  3成单  4 丢单
     * @param data
     * @param callback
     */
    auditNotify: function (data, callback) {
        var result = {success: false};
        var uid = data.sourceOwner;
        var cid = data.cid;
        var type = data.apprType;
        var deal = data.deal;//1:pass,2:nopass
        var apprBusId = data.apprBusId ;
        var notifyType = data.type;
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                        mongo.db(db).collection(aid+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,custDB){

                            mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).findOne({"_id":apprBusId},function(err,apprBusiness){

                                if(!err && custDB){
                                    var name=custDB.name;
                                    var content = "您有一个商机［" + name + "］，";
                                    var suffix="";
                                    if(type=='2'){
                                        if(deal=='1'){
                                            suffix="进行无效审核已经通过，商机已被回收！";
                                        }else{
                                            suffix="进行无效审核失败，失败原因是["+apprBusiness.unPassReason+"]商机已被回收！";
                                        }
                                    }else if(type=='4'){
                                        if(deal=='1'){
                                            suffix="进行丢单审核已经通过，商机已被回收！";
                                        }else{
                                            suffix="进行丢单审核失败，失败原因是["+apprBusiness.unPassReason+"]商机已被回收！";
                                        }
                                    }
                                    content = content+=suffix;
                                    var sendMail=function(){
                                        var userName = userDB.displayName;
                                        var mail = userDB.email;
                                        var title = content;
                                        var msg = content;
                                        if(mail && handler.emailReg.test(mail)){
                                            var sendMail = {
                                                toAddr: [mail],
                                                subject: title,
                                                type: "notify",
                                                ccAddr: [],
                                                status: "undeal"
                                            };
                                            fs.readFile(__baseDir + "/views/notify/notify_sale_chance_recyle.html", function (err, data) {
                                                if (!err) {
                                                    data = new String(data);
                                                    data = data.replace(/_#userName#_/, userName);
                                                    data = data.replace(/_#content#_/, msg);
                                                    sendMail.content = data;
                                                    mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                        if (!err) {
                                                        } else {
                                                            logger.app.error("insert to send mail to db error!", err);
                                                        }
                                                    });
                                                } else {
                                                    logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                                }
                                            });
                                        }
                                    }

                                    mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                        if(!err ){
                                            if(client){
                                                var msg = {
                                                    userId: uid,
                                                    eventData:{
                                                        Event:'saleChance',
                                                        Account:aid,
                                                        Data:{
                                                            notifyType:type,
                                                            type:notifyType,
                                                            content:encodeURIComponent(content),
                                                            cid:cid
                                                        }
                                                    }
                                                };
                                                var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                                httpProvider.sendGet(url,function (err, rep) {
                                                    try {
                                                        rep = JSON.parse(rep);
                                                    } catch (e) {
                                                        logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                        //callback(result);
                                                        return;
                                                    }

                                                    if (!err && rep.success) {
                                                        //result.success = true;
                                                        //callback(result);
                                                    } else {
                                                        logger.app.error("push auditNotify error[" + uid + "]", err);
                                                        //callback(result);
                                                    }
                                                });

                                                //send mail
                                                //sendMail();
                                            }
                                            //else{
                                            //    //offline
                                            //    sendMail();
                                            //}
                                            //sendMail();
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
                            })

                        })
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

    recyleNotify: function (data, callback) {
        var result = {success: false};
        var uid=data._id;
        var cid = data.cid;
        var sysStatus=data.sysStatus;
        var type = data.type;
        //var categoryId=data.categoryId;
        console.info("recyleNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                        mongo.db(db).collection(aid+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,custDB){
                            if(!err && custDB){
                                var name=custDB.name;
                                var content = "您有一个商机［" + name + "］，";
                                var suffix="超过指定的时间未进行跟进，已被系统回收！";
                                content+=suffix;
                                var sendMail=function(){
                                    var userName = userDB.displayName;
                                    var mail = userDB.email;
                                    var title = content;
                                    var msg = content;
                                    if(mail && handler.emailReg.test(mail)){
                                        var sendMail = {
                                            toAddr: [mail],
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance_recyle.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#userName#_/, userName);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                            }
                                        });
                                    }
                                }

                                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                    if(!err ){
                                        if(client){
                                            var msg = {
                                                userId: uid,
                                                eventData:{
                                                    Event:'saleChance',
                                                    Account:aid,
                                                    Data:{
                                                        type:type,
                                                        content:encodeURIComponent(content),
                                                        cid:cid
                                                    }
                                                }
                                            };
                                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                            httpProvider.sendGet(url,function (err, rep) {
                                                try {
                                                    rep = JSON.parse(rep);
                                                } catch (e) {
                                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                    return;
                                                }

                                                if (!err && rep.success) {
                                                } else {
                                                    logger.app.error("push recyleNotify error[" + uid + "]", err);
                                                }
                                            });

                                            //send mail
                                            //sendMail();
                                        }
                                        //else{
                                        //    //offline
                                        //    //sendMail();
                                        //}
                                        //sendMail();
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
                        })
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
    batchRecyleNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.uid;
        var num = data.num;
        var categoryId=data.categoryId;
        var type = data.type;
        console.info("batchRecyleNotify=============");
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                                var content = "您有["+num+"]个商机，";
                                var suffix="超过指定的时间未进行跟进，已被系统回收！";
                                content+=suffix;
                                var sendMail=function(){
                                    var userName = userDB.displayName;
                                    var mail = userDB.email;
                                    var title = content;
                                    var msg = content;
                                    if(mail && handler.emailReg.test(mail)){
                                        var sendMail = {
                                            toAddr: [mail],
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance_recyle.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#userName#_/, userName);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                            }
                                        });
                                    }
                                }

                                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                    if(!err ){
                                        if(client){
                                            var msg = {
                                                userId: uid,
                                                eventData:{
                                                    Event:'saleChance',
                                                    Account:aid,
                                                    Data:{
                                                        type:type,
                                                        content:encodeURIComponent(content),
                                                    }
                                                }
                                            };
                                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                            httpProvider.sendGet(url,function (err, rep) {
                                                try {
                                                    rep = JSON.parse(rep);
                                                } catch (e) {
                                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                    callback(result);
                                                    return;
                                                }

                                                if (!err && rep.success) {
                                                } else {
                                                    logger.app.error("push batchRecyleNotify error[" + uid + "]", err);
                                                }
                                            });

                                            //send mail
                                            //sendMail();
                                        }
                                        //else{
                                        //    //offline
                                        //    //sendMail();
                                        //}
                                        //sendMail();
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

            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    batchUpdateCustomerNotify: function (data, callback) {
        var result = {success: false};
        var cid = data.cid;
        var uid=data.uid;
        var poolId=data.poolId;
        var pName = "无归属";
        var custCount=data.custCount;
        var type = data.type;
        //console.info("updateCustomerCategoryNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                            mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne({_id:poolId},function(err,pool){
                                if(!err){
                                    if(pool){
                                        pName = pool.cName;
                                    }
                                    var content = "您有"+custCount+"个客户，";
                                    var suffix="归属已变更为 ["+pName+"] ";
                                    content+=suffix;
                                    var sendMail=function(){
                                        var userName = userDB.displayName;
                                        var mail = userDB.email;
                                        var title = content;
                                        var msg = content;
                                        if(mail && handler.emailReg.test(mail)){
                                            var sendMail = {
                                                toAddr: [mail],
                                                subject: title,
                                                type: "notify",
                                                ccAddr: [],
                                                status: "undeal"
                                            };
                                            fs.readFile(__baseDir + "/views/notify/notify_batch_chance_customer.html", function (err, data) {
                                                if (!err) {
                                                    data = new String(data);
                                                    data = data.replace(/_#userName#_/, userName);
                                                    data = data.replace(/_#content#_/, msg);
                                                    sendMail.content = data;
                                                    mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                        if (!err) {
                                                        } else {
                                                            logger.app.error("insert to send mail to db error!", err);
                                                        }
                                                    });
                                                } else {
                                                    logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                                }
                                            });
                                        }

                                    }

                                    mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                        if(!err ){
                                            if(client){
                                                var msg = {
                                                    userId: uid,
                                                    eventData:{
                                                        Event:'saleChance',
                                                        Account:aid,
                                                        Data:{
                                                            type:type,
                                                            content:encodeURIComponent(content),
                                                            cid:cid
                                                        }
                                                    }
                                                };
                                                var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                                httpProvider.sendGet(url,function (err, rep) {
                                                    try {
                                                        rep = JSON.parse(rep);
                                                    } catch (e) {
                                                        logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                        return;
                                                    }

                                                    if (!err && rep.success) {
                                                    } else {
                                                        logger.app.error("push batchUpdateCustomerNotify error[" + uid + "]", err);
                                                    }
                                                });

                                                //send mail
                                                //sendMail();
                                            }
                                            //else{
                                            //    //offline
                                            //    //sendMail();
                                            //}
                                            //sendMail();
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

                            })
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

    adminRecyleNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.uid;
        var cid = data.cid;
        var categoryId=data.categoryId;
        var type = data.type;
        //console.info("adminRecyleNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                        mongo.db(db).collection(aid+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,custDB){
                            if(!err && custDB){
                                var name=custDB.name;
                                var content = "您有一个商机［" + name + "］，";
                                var suffix="已被管理员回收！";
                                content+=suffix;
                                var sendMail=function(){
                                    var userName = userDB.displayName;
                                    var mail = userDB.email;
                                    var title = content;
                                    var msg = content;
                                    if(mail && handler.emailReg.test(mail)){
                                        var sendMail = {
                                            toAddr: [mail],
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance_recyle.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#userName#_/, userName);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                            }
                                        });
                                    }

                                }

                                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                    if(!err ){
                                        if(client){
                                            var msg = {
                                                userId: uid,
                                                eventData:{
                                                    Event:'saleChance',
                                                    Account:aid,
                                                    Data:{
                                                        type:type,
                                                        content:encodeURIComponent(content),
                                                        cid:cid
                                                    }
                                                }
                                            };
                                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                            httpProvider.sendGet(url,function (err, rep) {
                                                try {
                                                    rep = JSON.parse(rep);
                                                } catch (e) {
                                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                    return;
                                                }

                                                if (!err && rep.success) {
                                                } else {
                                                    logger.app.error("push adminRecyleNotify error[" + uid + "]", err);
                                                }
                                            });

                                            //send mail
                                            //sendMail();
                                        }
                                        //else{
                                        //    //offline
                                        //    //sendMail();
                                        //}
                                        //sendMail();
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
                        })
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
    adminAssignOutNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.uid;
        var cid = data.cid;
        var categoryId=data.categoryId;
        var type = data.type;
        //console.info("adminAssignOutNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                        mongo.db(db).collection(aid+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,custDB){
                            if(!err && custDB){
                                var name=custDB.name;
                                var content = "您有一个商机［" + name + "］，";
                                var suffix="被分配给了其他人！";
                                content+=suffix;
                                var sendMail=function(){
                                    var userName = userDB.displayName;
                                    var mail = userDB.email;
                                    var title = content;
                                    var msg = content;
                                    if(mail && handler.emailReg.test(mail)){
                                        var sendMail = {
                                            toAddr: [mail],
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance_assign.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#userName#_/, userName);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                            }
                                        });
                                    }

                                }

                                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                    if(!err ){
                                        if(client){
                                            var msg = {
                                                userId: uid,
                                                eventData:{
                                                    Event:'saleChance',
                                                    Account:aid,
                                                    Data:{
                                                        type:type,
                                                        content:encodeURIComponent(content),
                                                        cid:cid
                                                    }
                                                }
                                            };
                                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                            httpProvider.sendGet(url,function (err, rep) {
                                                try {
                                                    rep = JSON.parse(rep);
                                                } catch (e) {
                                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                    return;
                                                }

                                                if (!err && rep.success) {
                                                } else {
                                                    logger.app.error("push adminAssignOutNotify error[" + uid + "]", err);
                                                }
                                            });

                                            //send mail
                                            //sendMail();
                                        }
                                        //else{
                                        //    //offline
                                        //    //sendMail();
                                        //}
                                        //sendMail();
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
                        })
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
    adminAssignNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.uid;
        var cid = data.cid;
        var categoryId=data.categoryId;
        var type = data.type;
        //console.info("adminAssignNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                        mongo.db(db).collection(aid+fields.DB_C5_CUSTOMER).findOne({_id:cid},function(err,custDB){
                            if(!err && custDB){
                                var name=custDB.name;
                                var content = "您有新分配的商机［" + name + "］";
                                var suffix="";
                                content+=suffix;
                                var sendMail=function(){
                                    var userName = userDB.displayName;
                                    var mail = userDB.email;
                                    var title = content;
                                    var msg = content;
                                    if(mail && handler.emailReg.test(mail)){
                                        var sendMail = {
                                            toAddr: [mail],
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance_assign.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#userName#_/, userName);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                            }
                                        });
                                    }

                                }

                                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                    if(!err ){
                                        if(client){
                                            var msg = {
                                                userId: uid,
                                                eventData:{
                                                    Event:'saleChance',
                                                    Account:aid,
                                                    Data:{
                                                        type:type,
                                                        content:encodeURIComponent(content),
                                                        cid:cid,
                                                        custName:name
                                                    }
                                                }
                                            };
                                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                            httpProvider.sendGet(url,function (err, rep) {
                                                try {
                                                    rep = JSON.parse(rep);
                                                } catch (e) {
                                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                    return;
                                                }

                                                if (!err && rep.success) {
                                                } else {
                                                    logger.app.error("push adminAssignNotify error[" + uid + "]", err);
                                                }
                                            });

                                            //send mail
                                            //sendMail();
                                        }
                                        //else{
                                        //    //offline
                                        //    //sendMail();
                                        //}
                                        //sendMail();
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
                        })
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
    adminBatchAssignOutNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.uid;
        var num=data.num;
        var type = data.type;
        //console.info("adminBatchAssignOutNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                var content = "您有［"+num+"］个商机，被管理员分配出去了！";
                var sendMail=function(){
                    var userName = userDB.displayName;
                    var mail = userDB.email;
                    var title = content;
                    var msg = content;
                    if(mail && handler.emailReg.test(mail)){
                        var sendMail = {
                            toAddr: [mail],
                            subject: title,
                            type: "notify",
                            ccAddr: [],
                            status: "undeal"
                        };
                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance_assign.html", function (err, data) {
                            if (!err) {
                                data = new String(data);
                                data = data.replace(/_#userName#_/, userName);
                                data = data.replace(/_#content#_/, msg);
                                sendMail.content = data;
                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                    if (!err) {
                                    } else {
                                        logger.app.error("insert to send mail to db error!", err);
                                    }
                                });
                            } else {
                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                            }
                        });
                    }
                }

                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                    if(!err ){
                        if(client){
                            var msg = {
                                userId: uid,
                                eventData:{
                                    Event:'saleChance',
                                    Account:aid,
                                    Data:{
                                        type:type,
                                        content:encodeURIComponent(content)
                                    }
                                }
                            };
                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                            httpProvider.sendGet(url,function (err, rep) {
                                try {
                                    rep = JSON.parse(rep);
                                } catch (e) {
                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                    return;
                                }

                                if (!err && rep.success) {
                                } else {
                                    logger.app.error("push adminBatchAssignOutNotify error[" + uid + "]", err);
                                }
                            });

                            //send mail
                            //sendMail();
                        }
                        //else{
                        //    //offline
                        //    //sendMail();
                        //}
                        //sendMail();
                        result.success = true;
                        callback(result);
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
    adminBatchAssignNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.uid;
        var num=data.num;
        var type = data.type;
        //console.info("adminBatchAssignNotify=============");
        //console.dir(data)
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                var content = "您有新分配的商机［"+num+"］个！";
                var sendMail=function(){
                    var userName = userDB.displayName;
                    var mail = userDB.email;
                    var title = content;
                    var msg = content;
                    if(mail && handler.emailReg.test(mail)){
                        var sendMail = {
                            toAddr: [mail],
                            subject: title,
                            type: "notify",
                            ccAddr: [],
                            status: "undeal"
                        };
                        fs.readFile(__baseDir + "/views/notify/notify_sale_chance_assign.html", function (err, data) {
                            if (!err) {
                                data = new String(data);
                                data = data.replace(/_#userName#_/, userName);
                                data = data.replace(/_#content#_/, msg);
                                sendMail.content = data;
                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                    if (!err) {
                                    } else {
                                        logger.app.error("insert to send mail to db error!", err);
                                    }
                                });
                            } else {
                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                            }
                        });
                    }

                }

                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                    if(!err ){
                        if(client){
                            var msg = {
                                userId: uid,
                                eventData:{
                                    Event:'saleChance',
                                    Account:aid,
                                    Data:{
                                        type:type,
                                        content:encodeURIComponent(content)
                                    }
                                }
                            };
                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                            httpProvider.sendGet(url,function (err, rep) {
                                try {
                                    rep = JSON.parse(rep);
                                } catch (e) {
                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                    return;
                                }

                                if (!err && rep.success) {
                                } else {
                                    logger.app.error("push adminBatchAssignNotify error[" + uid + "]", err);
                                }
                            });

                            //send mail
                            //sendMail();
                        }
                        //else{
                        //    //offline
                        //    //sendMail();
                        //}
                       // sendMail();
                        result.success = true;
                        callback(result);
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
    batchImportAssignNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.uid;
        var categoryId=data.categoryId;
        var num = data.num;
        var type = data.type;
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                                var content = "您有新分配［" + num + "］个商机";
                                var suffix="";
                                content+=suffix;
                                var sendMail=function(){
                                    var userName = userDB.displayName;
                                    var mail = userDB.email;
                                    var title = content;
                                    var msg = content;
                                    if(mail && handler.emailReg.test(mail)){
                                        var sendMail = {
                                            toAddr: [mail],
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_batch_import_assign.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#userName#_/, userName);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                            }
                                        });
                                    }

                                }

                                mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                    if(!err ){
                                        if(client){
                                            var msg = {
                                                userId: uid,
                                                eventData:{
                                                    Event:'saleChance',
                                                    Account:aid,
                                                    Data:{
                                                        type:type,
                                                        content:encodeURIComponent(content)

                                                    }
                                                }
                                            };
                                            var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                            httpProvider.sendGet(url,function (err, rep) {
                                                try {
                                                    rep = JSON.parse(rep);
                                                } catch (e) {
                                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                    return;
                                                }

                                                if (!err && rep.success) {
                                                } else {
                                                    logger.app.error("push batchImportAssignNotify error[" + uid + "]", err);
                                                }
                                            });

                                            //send mail
                                            //sendMail();
                                        }
                                        //else{
                                        //    //offline
                                        //    //sendMail();
                                        //}
                                        //sendMail();
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

            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    businessUserNotify: function (data, callback) {
        var result = {success: false};
        var uid=data.userId;
        var cid = data.customerId;
        var type = data.type;
        var businessId = data.businessId;
        mongo.db("bill").collection(fields.DB_PLATFORM_USER).findOne({_id: uid}, function (err, userDB) {
            if (!err && userDB) {
                var aid = userDB.account;
                mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
                    if (!err && productDB) {
                        var db=productDB.dataDB;
                        mongo.db(db).collection(aid+fields.DB_ACCOUNT_BUSINESS).findOne({_id:businessId},function(err,business) {
                            if (!err) {
                                if(business){
                                    var number = business.number;
                                    var content = "您有一个新工单需要处理";
                                    var sendMail=function(){
                                        var userName = userDB.displayName;
                                        var mail = userDB.email;
                                        var title = content;
                                        var msg = content;
                                        var sendMail = {
                                            toAddr: [mail],
                                            subject: title,
                                            type: "notify",
                                            ccAddr: [],
                                            status: "undeal"
                                        };
                                        fs.readFile(__baseDir + "/views/notify/notify_business_user.html", function (err, data) {
                                            if (!err) {
                                                data = new String(data);
                                                data = data.replace(/_#userName#_/, userName);
                                                data = data.replace(/_#content#_/, msg);
                                                sendMail.content = data;
                                                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, {w: 1}, function (err) {
                                                    if (!err) {
                                                    } else {
                                                        logger.app.error("insert to send mail to db error!", err);
                                                    }
                                                });
                                            } else {
                                                logger.app.error("mail templete[notify_sale_chance_recyle] not found!", err);
                                            }
                                        });
                                    }

                                    mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                        if(!err ){
                                            if(client){
                                                var msg = {
                                                    userId: uid,
                                                    eventData:{
                                                        Event:'business',
                                                        Account:aid,
                                                        Data:{
                                                            type:type,
                                                            content:encodeURIComponent(content),
                                                            cid:cid,
                                                            master:business.master,
                                                            businessId:businessId,
                                                            number:number
                                                        }
                                                    }
                                                };
                                                var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                                httpProvider.sendGet(url,function (err, rep) {
                                                    try {
                                                        rep = JSON.parse(rep);
                                                    } catch (e) {
                                                        logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                        return;
                                                    }

                                                    if (!err && rep.success) {
                                                    } else {
                                                        logger.app.error("push recyleNotify error[" + uid + "]", err);
                                                    }
                                                });

                                                //send mail
                                                //sendMail();
                                            }
                                            //else{
                                            //    //offline
                                            //    sendMail();
                                            //}
                                            //sendMail();
                                            result.success = true;
                                            callback(result);
                                        }else{
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    });
                                }else{
                                    result.message = "工单已被删除";
                                    callback(result);
                                }
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

            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    businessExpireNotify : function (data,callback){
        var result = {success: false};
        var busId=data.busId;
        var aid = data.account;
        var step = data.step;
        var flow = data.flowId;
        var notifyUsers = data.notifyUser || [];
        console.dir(data)

        mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({_id: aid+"_cc"}, function (err, productDB) {
            if (!err && productDB) {
                var db=productDB.dataDB;
                mongo.db(db).collection(aid+fields.DB_ACCOUNT_BUSINESS).findOne({_id:busId},function(err,business) {
                    if (!err) {
                        if(business){
                            //查询工单流程
                            mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW).findOne({"_id": flow},{fields:{name:1}},function(err,flowDoc){
                                //查询工单步骤
                                mongo.db().collection(fields.DB_ACCOUNT_BUSINESS_FLOW_STEP).findOne({_id: step},{fields:{name:1}},function(err,stepDoc){

                                    var notifyBusUsers = function (flowDoc,stepDoc,uid){
                                        mongo.db().collection('app_push_client').findOne({_id: uid, "user.status":'enable'}, function(err, client){
                                            if(!err ){
                                                if(client){
                                                    var msg = {
                                                        userId: uid,
                                                        eventData:{
                                                            Event:'business',
                                                            Account:aid,
                                                            Data:{
                                                                type:"expireNotify",
                                                                content:encodeURIComponent("您的工单["+flowDoc.name+"] 步骤["+stepDoc.name+"] 剩余处理时长不足5分钟 请及时处理")
                                                            }
                                                        }
                                                    };
                                                    var url="http://"+client.pushServerIp+":"+client.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg));
                                                    httpProvider.sendGet(url,function (err, rep) {
                                                        try {
                                                            rep = JSON.parse(rep);
                                                        } catch (e) {
                                                            logger.app.error("parse response from pushServer error[" + JSON.stringify(msg) + "]");
                                                            return;
                                                        }

                                                        if (!err && rep.success) {
                                                        } else {
                                                            logger.app.error("push businessExpireNotify error[" + uid + "]", err);
                                                        }
                                                    });
                                                }
                                            }else{
                                                logger.app.error(err);
                                                callback(result);
                                            }
                                        });
                                    }

                                    if(business.master){
                                        notifyUsers.push(business.master);
                                        notifyUsers = utils.distinctArray(notifyUsers);//去重数组
                                        //循环提醒所有客户
                                        for(var i=0;i<notifyUsers.length;i++){
                                            notifyBusUsers(flowDoc,stepDoc,notifyUsers[i]);
                                        }
                                    }else{
                                        mongo.db("bill").collection(fields.DB_PLATFORM_USER).find({role: business.roles[0].role},{fields:{_id:1}}).toArray(function (err, users) {
                                            for(var i=0;i<users.length;i++){
                                                notifyUsers.push(users[i]._id);
                                            }
                                            notifyUsers = utils.distinctArray(notifyUsers);
                                            //循环提醒所有客户
                                            for(var i=0;i<notifyUsers.length;i++){
                                                notifyBusUsers(flowDoc,stepDoc,notifyUsers[i]);
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        })
    }
};



module.exports = handler;


