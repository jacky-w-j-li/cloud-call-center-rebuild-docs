/**
 * Created by zhouxc on 2016/3/28.
 */

var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/m7/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var Thenjs = require('thenjs');

var handler = {

    /**
     * 新邮件
     * @param data
     * @param callBack
     */
    newMail: function (data, actionId, callBack) {
        var result = {success: false};

        /**
         * 首先查找邮件定界符，根据邮件定界符解析出邮件的真正内容，推送给 cc-server-in 并入库
         * email 设置表： DB_APP_EMAIL_CONFIG
         *
         */
        var postData = {
            from: data.from,         // 发件人
            to: data.to || [],           // 收件人[]
            cc: data.cc || [],           // 抄送
            subject: data.subject,      // 邮件主题
            content: data.content || data.contentText,      // 邮件内容
            contentText: data.contentText,
            attachment: data.attachment || [],   // 附件[]
            mailId: data.mailId,       // 邮件唯一id
            supportEmail: data.supportEmail, // 支持邮箱
            createTime: utils.getCurrentDate(),
            createTimeStamp: utils.getCurrentDateTime(),
            emailType: "receive"
        };


        mongo.db().collection(fields.DB_APP_EMAIL_CONFIG).findOne({name: {$regex: data.supportEmail, $options: "i"}}, function (err, doc) {
            if (err || !doc) {
                logger.app.error('find app_email_config failed' + data.supportEmail);
                callBack(result);
            } else {
                postData.emailDelimiter = doc.emailDelimiter || "";
                postData.account = doc.accountId;
                _impl.insertReceiveEmails(postData, function (success, mail) {
                    if (success) {
                        result.success = true;
                        var emailTo = {};
                        for (var i = 0; i < postData.to.length; i++) {
                            var toObj = postData.to[i];
                            if (doc.emailRelate &&  doc.emailRelate.length>0) {
                                for (var j = 0; j < doc.emailRelate.length; j++) {
                                    var relateObj = doc.emailRelate[j];
                                    if (toObj.addr.toLowerCase() == relateObj.email.toLowerCase()) {
                                        var temp = {realTo: relateObj.email.toLowerCase(), realToName: toObj.name, toPeer:relateObj.skillGroup};
                                        if(!emailTo[relateObj.skillGroup]){
                                            emailTo[relateObj.skillGroup] = temp;
                                        }

                                        //系统测试转发判断
                                        if (postData.from.addr.toLowerCase() == "noreply@7moor.com") {
                                            mongo.db().collection(fields.DB_APP_EMAIL_CONFIG).update({
                                                    name: doc.name,
                                                    'emailRelate.email': {$regex: toObj.addr, $options: "i"}
                                                },
                                                {$set: {'emailRelate.$.status': 'verifyPass'}}, function (err) {
                                                });
                                        }

                                    }
                                    //验证邮件接收者是support邮箱
                                    if (postData.from.addr.toLowerCase() == relateObj.email.toLowerCase() && toObj.addr.toLowerCase() == doc.name.toLowerCase()) {
                                        postData.toPeer = relateObj.skillGroup;
                                        postData.realTo = doc.name;
                                        break;
                                    }
                                }

                            } else {
                                postData.realTo = postData.supportEmail;
                            }


                        }
                        //抄送的情况
                        for (var i = 0; i < postData.cc.length; i++) {
                            var ccObj = postData.cc[i];
                            if (doc.emailRelate) {
                                for (var j = 0; j < doc.emailRelate.length; j++) {
                                    var relateObj = doc.emailRelate[j];
                                    if (ccObj.addr.toLowerCase() == relateObj.email.toLowerCase()) {
                                        var temp = {realTo: relateObj.email.toLowerCase(), realToName: ccObj.name, toPeer:relateObj.skillGroup};
                                        if(!emailTo[relateObj.skillGroup]){
                                            emailTo[relateObj.skillGroup] = temp;
                                        }
                                    }
                                }
                            } else {
                                postData.realTo = postData.supportEmail;
                            }

                        }
                        if(_impl.isEmptyObject(emailTo) && !postData.realTo){
                            postData.realTo = postData.supportEmail;
                        }
                        postData.mailId = mail._id;
                        if(postData.realTo){
                            _impl.pushNewMailData(postData, actionId,function (success) {
                                logger.app.info("newMail push " + (success ? "success" : "failure"));
                            });
                        }else{
                            var count = 1 ;
                            for(var toPeer in emailTo){
                                var to = emailTo[toPeer];
                                var postDataClone = utils.deepClone(postData);
                                postDataClone.realTo = to.realTo;
                                postDataClone.realToName = to.realToName;
                                postDataClone.toPeer = to.toPeer;
                                if(count==1){ //一个 直接推送
                                    _impl.pushNewMailData(postDataClone, actionId,function (success) {
                                        logger.app.info("newMail push " + (success ? "success" : "failure"));
                                    });
                                }else{ //多个 入库推送
                                    mongo.db().collection(fields.DB_APP_EMAIL_MAILS).insert(mail,{w:1},function (err) {
                                        if (!err) {
                                            _impl.pushNewMailData(postDataClone, actionId,function (success) {
                                                logger.app.info("newMail push " + (success ? "success" : "failure"));
                                            });
                                        }
                                    });
                                }
                                count++;
                                mail._id = mail._id+"_"+count;
                                postData.mailId = postData.mailId+"_"+count;
                            }
                        }

                    } else {
                        result.message = "insertEmail failure";
                    }

                    callBack(result);
                });
            }
        });
    },
    /**
     * 客服回复邮件给访客
     * @param data
     * @param callback
     */
    sendMail: function (data, actionId, callback) {
        var result = {success: false};

        if (data.emailType == 'test') {
            data.action = "send";
            data.attachment = [];
            _impl.pushSendMailData(data,actionId, function (success) {
                logger.app.info("["+actionId+"]"+ (success ? "push testMail successed" : "push testMail failed"));
                if (success) {
                    result.success = true;
                }
                callback(result);
            });
        }else if(data.emailType == 'forward'){
            //转发用户发来的邮件
            var postData = {
                from: data.from.addr, // 客户企业邮箱
                subject: data.subject,// 主题
                content: data.content,//内容
                attachment: data.attachment || null,// 附件
                action: "send"
            };

            //转发地址
            var to = "";
            for (var i = 0; i < data.to.length; i++) {
                if (i != 0) {
                    to = to + ",";
                }
                to += data.to[i].addr;
            }
            postData.to = to;

            //发送邮件
            _impl.pushSendMailData(postData, actionId, function (success) {
                logger.app.info("["+actionId+"]"+ (success ? "push forwardMail successed" : "push forwardMail failed"));
                if (success) {
                    result.success = true;
                }
                callback(result);
            });
        }else {
            _impl.insertReplyEmails(data, actionId, function (success, mail) {
                if (success) {
                    var postData = {
                        from: data.from.addr,                  // 客户企业邮箱
                        subject: data.subject,               // 主题
                        content: new Buffer(mail.sourceContent).toString("base64"),               // 内容
                        attachment: data.attachment || null,            // 附件
                        mailId: mail._id,                // 邮件id,
                        action: "send"
                    };
                    var to = "";
                    for (var i = 0; i < data.to.length; i++) {
                        if (i != 0) {
                            to = to + ",";
                        }
                        to += data.to[i].addr;
                    }
                    var cc = "";
                    for (var i = 0; i < data.cc.length; i++) {
                        if (i != 0) {
                            cc = cc + ",";
                        }
                        cc += data.cc[i].addr;
                    }
                    postData.to = to;
                    postData.cc = cc;

                    _impl.pushSendMailData(postData, actionId, function (success) {
                        logger.app.info("["+actionId+"]"+ (success ? "push SendMail successed" : "push SendMail failed"));
                        result.success = true;
                        callback(result);
                    });
                } else {
                    callback(result);
                }
            });

        }
    }
};

var _impl = {
    /**
     * 推送给cc服务
     * @param postData
     * @param callback
     */
    pushNewMailData: function (postData, actionId, callback) {
        var url = config.pushServiceUrl;
        logger.app.info(postData);
        httpProvider.sendPost(url, "action=newEmail&data=" + JSON.stringify(postData), function (err, response) {
            if (!err) {
                var res = JSON.parse(response);
                if (res.success) {
                    logger.app.info("["+actionId+"]"+"send email success");
                    callback(true);
                } else {
                    logger.app.info("["+actionId+"]"+"send email failure=");
                    callback(false);
                }
            } else {
                logger.app.error("["+actionId+"]"+"send email err=" + JSON.stringify(postData), err);
                callback(false);
            }
        });
    },



    /**
     * 推送给邮件服务
     * @param postData
     * @param callback
     */
    pushSendMailData: function (postData, actionId,callback) {
        var url = config.mailPushUrl;
        logger.app.info(url + JSON.stringify(postData));
        callback(true);
        httpProvider.sendPost(url, JSON.stringify(postData), function (err, response) {
            if (!err) {
                var res = JSON.parse(response);
                if (res.success) {
                    logger.app.info("["+actionId+"]"+ "success==============");
                } else {
                    //发送失败
                    mongo.db().collection(fields.DB_APP_EMAIL_MAILS).update({_id: postData.mailId}, {$set: {status: "fail"}});
                }
            } else {
                logger.app.error("["+actionId+"]"+ "err==============" + JSON.stringify(postData), err);

            }
        });
    },
    /**
     * 入库
     * @param postData
     * @param callback
     */
    insertReceiveEmails: function (postData, callback) {
        var insertData = {
            _id: postData.mailId,
            supportEmail: postData.supportEmail,
            account: postData.account,
            createTime: postData.createTime || utils.getCurrentDate(),
            createTimeStamp: postData.createTimeStamp || utils.getCurrentDateTime(),
            emailType: postData.emailType,
            from: {}

        };
        // 主题和内容进行解码
        insertData.subject = postData.subject.replace(/\s/g, "+");
        insertData.subject = new Buffer(insertData.subject, 'base64').toString();
        var content = postData.content.replace(/\s/g, "+");
        content = new Buffer(content, 'base64').toString();
        var contentText = postData.contentText.replace(/\s/g, "+");
        contentText = new Buffer(contentText, 'base64').toString();

        //insertData.sourceContent = content;
        insertData.content = content;
        insertData.contentText = contentText;
        insertData.from.addr = postData.from.addr;
        var name = postData.from.name.replace(/\s/g, "+");
        name = new Buffer(name, 'base64').toString();
        insertData.from.name = name;
        var to = [];
        var attach = [];
        if (!postData.to) {
            logger.app.error("not found email to");
            callback(false);
            return;
        }
        for (var i = 0; i < postData.to.length; i++) {
            var toObj = utils.deepClone(postData.to[i]);
            var toName = toObj.name.replace(/\s/g, "+");
            toName = new Buffer(toName, 'base64').toString();
            toObj.name = toName;
            to.push(toObj);
        }

        for (var i = 0; i < postData.attachment.length; i++) {
            var attachObj = utils.deepClone(postData.attachment[i]);
            var attachName = attachObj.name.replace(/\s/g, "+");
            var attachUrl = attachObj.url.replace(/\s/g, "+");
            attachName = new Buffer(attachName, 'base64').toString();
            attachUrl = new Buffer(attachUrl, 'base64').toString();
            attachObj.name = attachName;
            attachObj.url = attachUrl;
            attach.push(attachObj);
        }
        insertData.to = to;
        insertData.attachment = attach;
        var cc = [];
        if (postData.cc) {
            for (var i = 0; i < postData.cc.length; i++) {
                var ccObj = utils.deepClone(postData.cc[i]);
                var ccName = ccObj.name.replace(/\s/g, "+");
                ccName = new Buffer(ccName, 'base64').toString();
                ccObj.name = ccName;
                cc.push(ccObj);
            }
        }

        insertData.cc = cc;

        //入库
        console.log("==========================================");
        console.log(insertData);

        mongo.db().collection(fields.DB_APP_EMAIL_MAILS).findOne({_id: insertData._id}, function (err, doc) {
            if (!err && !doc) {
                mongo.db().collection(fields.DB_APP_EMAIL_MAILS).insert(insertData,{w:1},function (err) {
                    if (!err) {
                        callback(true, insertData);
                    } else {
                        logger.app.info("insert app_email_session failed");
                        callback(false);
                    }
                });
            } else {
                callback(false);

            }
        });


    },
    /**
     * 入库
     * @param postData
     * @param actionId 日志用,建立trace
     * @param callback
     */
    insertReplyEmails: function (postData, actionId,callback) {
        var insertData = {
            _id: postData.mailId,
            supportEmail: postData.supportEmail,
            account: postData.account,
            createTime: postData.createTime || utils.getCurrentDate(),
            createTimeStamp: postData.createTimeStamp || utils.getCurrentDateTime(),
            emailType: postData.emailType,
            sessionId: postData.sessionId,
            agent: postData.agent,
            from: {}

        };

        // 主题和内容进行解码
        insertData.subject = postData.subject.replace(/\s/g, "+");
        insertData.subject = new Buffer(insertData.subject, 'base64').toString();
        var content = postData.content.replace(/\s/g, "+");
        content = new Buffer(content, 'base64').toString();
        var contentText = postData.contentText.replace(/\s/g, "+");
        contentText = new Buffer(contentText, 'base64').toString();

        Thenjs(function (cont) {
            mongo.db().collection(fields.DB_APP_EMAIL_CONFIG).findOne({name: {$regex:postData.supportEmail,$options: 'i'}}, cont);

        }).then(function (cont, doc) {
            if (doc) {
                var sign = "";
                for (var i = 0; i < doc.emailRelate.length; i++) {
                    if (doc.emailRelate[i].email.toLowerCase() == postData.from.addr.toLowerCase()) {
                        sign = doc.emailRelate[i].sign;
                        break;
                    }
                }
                if (sign) {
                    mongo.db().collection(fields.DB_APP_EMAIL_SIGN).findOne({_id: sign}, function (err, signDoc) {
                        cont(null, doc, signDoc);
                    });
                } else {
                    cont(null, doc);
                }
            } else {
                callback(false);
            }
        }).then(function (cont, doc, sign) {
            if (doc) {
                var htmlModel = doc.emailModel;
                var delimiter = doc.emailDelimiter;
                var sign = sign ? sign.content || "" : "";

                //回复邮件时，在签名前添加座席的名字+工号
                if(postData.agentInfo){
                    sign ="<br />"+postData.agentInfo + "<br />" + sign;
                }else{
                    sign ="<br />" + sign;
                }

                var sourceContent = htmlModel.replace("{content}", content);
                sourceContent = sourceContent.replace("{sign}", sign.replace(/\n/g, "<br />"));
                if (postData.lastMailId) {
                    mongo.db().collection(fields.DB_APP_EMAIL_MAILS).findOne({_id: postData.lastMailId}, function (err, mail) {

                        if (!err && mail) {
                            var mailHistory = mail.sourceContent || mail.content || "";
                            mailHistory = "\n<blockquote style=\"margin-left:10px;\" type=\"cite\" class=\"\"><div class=\"\">在" + mail.createTime + ", " + (mail.from.name || "") + "&lt;" + mail.from.addr + "&gt;写道：</div><br/><br/><div style=\"padding: 10px;\">" + mailHistory + "</div></blockquote>";
                            sourceContent = sourceContent.replace("{history}", mailHistory);
                            insertData.sourceContent = sourceContent;
                        }
                        cont(null);
                    });
                } else {
                    sourceContent = sourceContent.replace("{history}", "");
                    insertData.sourceContent = sourceContent;
                    cont(null);
                }
            } else {
                cont(null);
            }
        }).then(function (cont) {
            insertData.content = content;
            insertData.contentText = contentText;
            insertData.from.addr = postData.from.addr;
            var name = postData.from.name.replace(/\s/g, "+");
            name = new Buffer(name, 'base64').toString();
            insertData.from.name = name;
            var to = [];
            var attach = [];
            if (!postData.to) {
                logger.app.error("not found email to");
                callback(false);
                return;
            }
            for (var i = 0; i < postData.to.length; i++) {
                var toObj = utils.deepClone(postData.to[i]);
                var toName = toObj.name.replace(/\s/g, "+");
                toName = new Buffer(toName, 'base64').toString();
                toObj.name = toName;
                to.push(toObj);
            }
            for (var i = 0; i < postData.attachment.length; i++) {
                var attachObj = utils.deepClone(postData.attachment[i]);

                var attachName = attachObj.name.replace(/\s/g, "+");
                var attachUrl = attachObj.url.replace(/\s/g, "+");
                attachName = new Buffer(attachName, 'base64').toString();
                attachUrl = new Buffer(attachUrl, 'base64').toString();
                attachObj.name = attachName;
                attachObj.url = attachUrl;
                attach.push(attachObj);
            }
            insertData.to = to;
            insertData.attachment = attach;
            var cc = [];
            if (postData.cc) {
                for (var i = 0; i < postData.cc.length; i++) {
                    var ccObj = utils.deepClone(postData.cc[i]);
                    if (ccObj.name) {
                        var ccName = ccObj.name.replace(/\s/g, "+");
                        ccName = new Buffer(ccName, 'base64').toString();
                        ccObj.name = ccName;
                    }
                    cc.push(ccObj);
                }
            }

            insertData.cc = cc;

            //入库
            mongo.db().collection(fields.DB_APP_EMAIL_MAILS).findOne({_id: insertData._id}, function (err, doc) {
                if (!err && !doc) {
                    mongo.db().collection(fields.DB_APP_EMAIL_MAILS).insert(insertData, function (err) {
                        if (!err) {
                            callback(true, insertData);
                        } else {
                            logger.app.info("insert app_email_session failed");
                            cont(err);
                        }
                    });
                } else {
                    if (doc) {
                        callback(true, doc);
                    } else {
                        cont(err);
                    }

                }
            });

        }).fail(function (cont, error) {
            logger.app.error(error);
            callback(false);
        });


    },

    decodeObject: function (obj) {
        if (!obj) {
            return "";
        }
        if (typeof obj == "string") {
            var ret = obj.replace(/\s/g, "+");
            ret = new Buffer(ret, 'base64').toString();
            return ret;
        } else if (typeof obj == "object") {
            if (obj instanceof Array) {
                var retarr = [];
                for (var i = 0; i < obj.length; i++) {
                    var retObj = obj[i];
                    for (var key in retObj) {
                        var a = retObj[key].replace(/\s/g, "+");
                        a = new Buffer(a, 'base64').toString();
                        retObj[key] = a;
                    }
                    retarr.push(retObj);
                }
            } else {

            }
        }
    },

    isEmptyObject:function(obj){
        for(var i in obj){
            if(obj[i]){return false;}
        }
        return true;
    }
};

module.exports = handler;
