var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var skillgroupHandler = require(__baseDir + '/dishui/config/ivr/SkillgroupHandler');
var m7Redis = require("m7rds");
var redisKey= require(__baseDir + '/dishui/common/RedisKeyPrefix');
var Thenjs = require("thenjs");

exports.queryEmail = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = data;

    if(!condition.account){
        condition.account = session.user.account;
    }
    utils.removeEmptyProperty(condition);
    if (condition.mailId)
        condition.mailId = new RegExp(condition.mailId);
    mongo.db().collection(fields.DB_APP_MAIL_CONFIG).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_APP_MAIL_CONFIG).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });

}
exports.addEmailCfg = function(data,session,callback){
    var result = {success: false};
    var id = utils.UUID.generateUuid();

    var aid=session.user.account;
    var time=utils.getCurrentDate();
    data._id = id;
    data.account=aid;
    data.createTime=time;
    var mailId = data.mailId;
    var isDefault=data.isDefault;
    mongo.db().collection(fields.DB_APP_MAIL_CONFIG).findOne({mailId:mailId},function(err,mail){
        if(!err){
            if(!mail){
                var ivrData = {};
                ivrData.Action = "PeerAdd";
                ivrData.Peer = "MailAddr";
                ivrData.DisplayName = data.mailId;
                ivrData.Exten = data.mailId;
                ivrData.synAcsSign = "1";
                ivrData.Account = session.user.account;
                ivrData.PBX = session.user.pbx;
                ivrData.ToPeer = data.ToPeer;
                var ivrData = {
                    nodeData: ivrData
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = "Add mail Addr failure:" + data.Exten;
                        result.success = false;
                        callback(result);
                        return;
                    }
                    mongo.db().collection(fields.DB_APP_MAIL_CONFIG).insert(data, function (err) {
                        if (!err) {
                            if(isDefault=="1"){
                                mongo.db().collection(fields.DB_APP_MAIL_CONFIG).update({account:aid,_id:{$ne:id}},{$set:{isDefault:'0'}},{multi: true})
                            }
                            _impl._addOrUpdateMailConfig(data,function(success){
                                if(success){
                                    result.success = true;
                                    callback(result);
                                } else {
                                    result.message = "同步邮件服务失败！";
                                    callback(result);
                                }
                            });

                        } else {
                            logger.app.error('db insert error:' + err.stack);
                            result.message = 'db insert error!' + err.message;
                            callback(result);
                        }
                    });
                });
            }else{
                result.message = '邮箱账户名已经存在！';
                callback(result);
            }
        }else{
            logger.app.error('db query error:' + err.stack);
            result.message = 'db query error!' + err.message;
            callback(result);
        }
    });
}
exports.queryEmailCfgById = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_MAIL_CONFIG).findOne(data, function (err,mail) {
        if (!err) {
            result.success = true;
            result.mail = mail;
            callback(result);
        } else {
            logger.app.error('db queryEmailCfgById error:' + err.stack);
            result.message = '404 mailcfg not found!';
            callback(result);
        }
    });
}
exports.updateEmailCfg = function(data,session,callback){
    var result = {success: false};
    var id = data._id;
    delete data._id;
    var aid=session.user.account;
    var mailId = data.mailId;
    var isDefault=data.isDefault;
    mongo.db().collection(fields.DB_APP_MAIL_CONFIG).findOne({mailId:mailId,_id:{$ne:id}},function(err,mail){
        if(!err){
            if(!mail){
                var ivrData = {};
                ivrData.OldMailAddr = data.oldMailId;
                ivrData.Action = "PeerAdd";
                ivrData.Peer = "MailAddr";
                ivrData.DisplayName = data.mailId;
                ivrData.Exten = data.mailId;
                ivrData.synAcsSign = "1";
                ivrData.Account = session.user.account;
                ivrData.PBX = session.user.pbx;
                ivrData.ToPeer = data.ToPeer;
                var ivrData = {
                    nodeData: ivrData
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = "update mail Addr failure:" + data.Exten;
                        result.success = false;
                        callback(result);
                        return;
                    }
                    delete data.oldMailId;
                    mongo.db().collection(fields.DB_APP_MAIL_CONFIG).update({_id:id},{$set:data}, function (err) {
                        if (!err) {
                            if(isDefault=="1"){
                                mongo.db().collection(fields.DB_APP_MAIL_CONFIG).update({account:aid,_id:{$ne:id}},{$set:{isDefault:'0'}},{multi: true})
                            }
                            _impl._addOrUpdateMailConfig(data,function(success){
                                if(success){
                                    result.success = true;
                                    callback(result);
                                } else {
                                    result.message = "同步邮件服务失败！";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error('db insert error:' + err.stack);
                            result.message = 'db insert error!' + err.message;
                            callback(result);
                        }
                    });
                });
            }else{
                result.message = '邮箱账户名已经存在！';
                callback(result);
            }
        }else{
            logger.app.error('db query error:' + err.stack);
            result.message = 'db query error!' + err.message;
            callback(result);
        }
    });
}

exports.deleteEmailCfg = function(data,session,callback){
    var result = {success: false};

    mongo.db().collection(fields.DB_APP_MAIL_CONFIG).findOne({_id:data._id},function(err,mail){
        if(!err){
            if(mail){
                var ivrData = {};
                ivrData.Action = "PeerRemove";
                ivrData.Peer = "MailAddr";
                ivrData.Exten = mail.mailId;
                ivrData.synAcsSign = "1";
                ivrData.Account = session.user.account;
                ivrData.PBX = session.user.pbx;
                var ivrData = {
                    nodeData: ivrData
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = "Add mail Addr failure:" + data.Exten;
                        result.success = false;
                        callback(result);
                        return;
                    }
                    mongo.db().collection(fields.DB_APP_MAIL_CONFIG).remove({_id: data._id}, function (err) {
                        if (!err) {
                            _impl._deleteMailConfig(mail,function(success){
                                if(success){
                                    result.success = true;
                                    callback(result);
                                } else {
                                    result.message = "同步邮件服务失败！";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error('db deleteEmailCfg error:' + err.stack);
                            result.message = '404 mail not found!';
                            callback(result);
                        }
                    });
                });
            }else{
                result.message = '404 mail not found!';
                callback(result);
            }
        }else{
            result.message = 'find this mail failed!';
            callback(result);
        }
    });
}

exports.addOrUpdateEmailQueue = function(data,session,callback){
    var result = {success: false};

    _checkMailQueueExist(data, session ,function(checkRes){
        if(!checkRes.success){
            result.message = '您修改的多渠道技能组已不存在! 请刷新列表!';
            callback(result);
        }else{
            var isAdd = false;
            var origin = {};
            if('id' in data){
                data._id = data.id;
                delete data.id;
                origin = result.doc;
            }else{
                data._id = utils.UUID.generateUuid();
                data.CreateTime = utils.getCurrentDate();
                isAdd = true;
            }
            var memberArr = JSON.parse(data.MemberToken);
            delete data.MemberToken;
            var assignMember = [];
            for(var i= 0,len=memberArr.length;i<len;i++) {
                var m = memberArr[i];
                var token = m.split(':');
                assignMember.push({
                    agentID: token[0],
                    penalty: token[1]
                });
            }
            data.AssignMembers = assignMember;
            data.EmailAssignMembers = assignMember;
            data.Members = memberArr.join(',');
            data.UpdateTime=utils.getCurrentDate();
            data.Action = "PeerAdd";
            data.Peer = "MailQueue";
            data.Account = session.user.account;
            data.PBX = session.user.pbx;
            var ivrData = {
                nodeData: data,
                dbData: {
                    tableName: fields.DB_APP_MAIL_QUEUE,
                    condition: {
                        _id: data._id
                    }
                }
            }
            ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                if (err) {
                    logger.app.error(err.stack);
                    result.message = "Add mail Addr failure:" + data.Exten;
                    result.success = false;
                    callback(result);
                    return;
                }
                if(isAdd){
                    skillgroupHandler.useSkillGroupExten(data,function(res){});
                }
                result.success = true;
                callback(result);
                m7Redis.string.setObj(redisKey.MULTICHANNEL_SKILLGROUP + data.Exten,data,function(){},redisKey.REDIS_DB1);
            });
        }
    })
}

_checkMailQueueExist = function(data, session, callback){
    var result= {
        success: false
    }
    if('id' in data){
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({_id:data.id},function(err,doc){
            if(err){
                callback(result);
            }else{
                if(doc){
                    result.success = true;
                    result.doc = doc;
                }
                callback(result);
            }
        });
    }else{
        result.success = true;
        callback(result);
    }

}

exports.queryEmailQueue = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = data;

    if(!condition.Account){
        condition.Account = session.user.account;
    }
    utils.removeEmptyProperty(condition);
    mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find(condition, {sort: {"UpdateTime": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_APP_MAIL_QUEUE).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });
}

exports.deleteEmailQueue = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({_id:data._id},function(err,mailQueue){
        if(!err){
            if(mailQueue){
                var ivrData = {};
                ivrData.Action = "PeerRemove";
                ivrData.Peer = "MailQueue";
                ivrData.Exten = mailQueue.Exten;
                ivrData.Account = session.user.account;
                ivrData.PBX = session.user.pbx;
                ivrData.synAcsSign = "1";
                var ivrData = {
                    nodeData: ivrData
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = "Delete mail Queue failure:" + data.Exten;
                        result.success = false;
                        callback(result);
                        return;
                    }
                    mongo.db().collection(fields.DB_APP_MAIL_QUEUE).remove({_id: data._id}, function (err) {
                        if (!err) {
                            m7Redis.string.del(redisKey.MULTICHANNEL_SKILLGROUP+mailQueue.Exten,function(){},redisKey.REDIS_DB1);
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error('db deleteEmailQueue error:' + err.stack);
                            result.message = '404 mail not found!';
                            callback(result);
                        }
                    });
                });
            }else{
                result.message = '404 mail queue not found!';
                callback(result);
            }
        }else{
            result.message = '500 find this mail queue failed!';
            callback(result);
        }
    });
}

exports.queryEmailQueueById = function(data,session,callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne(data, function (err,mailQueue) {
        if (!err) {
            result.success = true;
            result.mailQueue = mailQueue;
            callback(result);
        } else {
            logger.app.error('db queryEmailQueueById error:' + err.stack);
            result.message = '404 mailcfg not found!';
            callback(result);
        }
    });
}

exports.getMailQueuesDic = function(session, callback){
    var query = {
        Account: session.user.account
    };
    mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find(query).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};
exports.getMailCategorysDic = function(session, callback){
    var query = {
        account: session.user.account
    };
    mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).find(query,{sort: {"createTime": 1}}).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};

var _impl = {
    _deleteMailConfig : function (data ,callback){
        var url = config.mailConfigUrl;
        var requestData = {
            action : "deleteMail",
            actionId : utils.UUID.generateUuid(),
            mailId : data.mailId
        };
        httpProvider.sendPost(url,requestData,function(err , response){
            if(!err){
                response = response || "{}";
                response = JSON.parse(response);
                if(response.Succeed){
                    callback(true);
                }else{
                    callback(false);
                }
            } else {
                callback(false);
            }
        });

    },

    _addOrUpdateMailConfig : function(data,callback){
        var url = config.mailConfigUrl;
        var requestData = {
            action : "addOrUpdateMail",
            actionId : utils.UUID.generateUuid(),
            mailId : data.mailId,
            type : data.type,
            password : data.password,
            mailDisplayName : data.mailDisplayName,
            receiveServer : data.receiveServer,
            sendServer : data.sendServer,
            sendServerPort : data.sendServerPort
        };
        httpProvider.sendPost(url,requestData,function(err , response){
            if(!err){
                response = response || "{}";
                response = JSON.parse(response);
                if(response.Succeed){
                    callback(true);
                } else {
                    callback(false);
                }

            } else {
                callback(false);
            }
        });

    },
    _sendOpenEmailService:function(data,callback){//开通邮件服务
        var url = config.openEmailService;
        var requestData = {
            action:"add",
            user:data
        };
        console.log(url);
        httpProvider.sendPost(url,requestData,function(err,res){
            if(!err){
                res = res || "{}";
                console.log(res.toString());
                res = JSON.parse(res);
                if(res.success){
                    callback(true);
                }else{
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    },
    _emailSendForwardTest:function(data,callback){//测试转发
        var emailContent = "您已在 7moor云客服 帐户中添加了一个支持电邮地址&lt;"+data.to+"&gt;，我们发送这封电邮是要测试此电邮地址与您的 7moor云客服 帐户是否可互相连接。如果您从未请求发送此电邮，则无需担忧，删除此电邮即可。 如果这确实是您请求的，且您已经设置了邮箱和 7moor云客服 帐户之间的自动转发，则此电邮将被转发到 "+data.name+"，而我们也将知道转发已设置成功，您已准备就绪。 另一方面来说，如果您尚未设置自动电邮转发，您应立即进行设置，确保从此收件箱转发出的电邮能到达您的 7moor云客服 账户中。"
        var requestData = {
            from:"noreply@7moor.com",
            to:data.to,
            cc:"",
            subject:new Buffer("测试邮件转发").toString("base64"),
            content:new Buffer(emailContent).toString("base64"),
            attachment:"",
            mailId:data.mailId,
            action:"sendMail",
            emailType:"test"
        };
        httpProvider.sendPost(config.msgUrl+"sendMail","data="+JSON.stringify(requestData),function(err,res){
            if(!err){
                res = res || "{}";
                res = JSON.parse(res);
                if(res.success){
                    callback(true);
                }else{
                    callback(false);
                }
            } else {
                logger.app.error(err);
                callback(false);
            }
        });
    }
};
//邮箱服务入口
exports.emailConfigEnter = function(data,session,callback){
    var result = {success: false, emailDomain: config.emailDomain};
    var aid =session.user.account;
    var uname = session.account.name;
    mongo.db().collection(fields.APP_EMAIL_CONFIG).findOne({accountId:aid}, function (err,emailConfig) {
        result.uname = uname;
        if(!err){
            if(!emailConfig){
                result.data = "";
                result.success=true;
                callback(result);
            }else{
                result.success=true;
                result.data = emailConfig;
                callback(result);
            }
        }else{
            logger.app.error('db query error:' + err.stack);
            result.message = 'db query error!' + err.message;
            callback(result);
        }

    });
}
//开通邮箱
exports.emailServerOpen = function(data,session,callback){
    var result = {success:false};
    var aid   = session.user.account;
    var id = data.name;
    var time=utils.getCurrentDate();
    var name = data.name.split("@")[0];
    data.createTime=time;
    data._id = id;
    data.accountId= aid;
    //调用开通邮件的接口,返回true,
    _impl._sendOpenEmailService(name,function(res){
        if(res){
            //console.log('服务邮件开通！');
            //执行基础数据插入
            data.emailModel = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n'+
                '<html>\n'+
                '<head>\n'+
                '   <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n'+
                '   <style type="text/css">\n'+
                '   table td {\n'+
                '    border-collapse: collapse;\n'+
                '   }\n'+
                '   </style>\n'+
                '</head>\n'+
                '<body style="width: 100%; margin: 0; padding: 0;">\n'+
                '   <table border="0" style="padding: 10px ; line-height: 18px; font-family: \'Lucida Grande\',Verdana,Arial,sans-serif; font-size: 12px; color:#444444;">\n'+
                '       <tr style="padding: 10px ; "><td>{content}</td></tr>\n'+
                '       <br><tr style="padding: 10px ; "><td>{sign}</td></tr>\n'+
                '       <tr style="color: #aaaaaa; margin: 10px 0 14px 0; padding-top: 10px; border-top: 1px solid #eeeeee;">\n'+
                '          <td>{history}\n</td>'+
                '       </tr>\n'+
                '   </table>\n'+
                '</body>\n'+
                '</html>\n';
            mongo.db().collection(fields.APP_EMAIL_CONFIG).insert(data, function (err) {
                if(!err){
                    result.success=true;
                    result.message="服务邮箱开通成功~";
                    callback(result);
                }else{
                    result.message = '服务邮箱开通失败！';
                    callback(result);
                }
            });
        }else{
            result.message = '开通服务邮箱失败！';
            callback(result);
        }
    });

}
//邮箱关联
exports.addOrEditEmailConfig = function(data,session,callback){
    //data中应包含{email:emailname,skillGroup:skillGroup,id:id},关联邮箱的信息
    var result = {success: false};
    var aid=session.user.account;
    var relationEmail = data.relationMailId;//关联email的名称
    var emailRelskillGroup = data.emailRelskillGroup;//关联email的技能组
    var relationemailArrId = data.relationEmailArrId;//关联email的id
    delete data.relationMailId;
    delete data.emailRelskillGroup;
    delete data.relationEmailArrId;
    delete data.idle;
    mongo.db().collection(fields.APP_EMAIL_CONFIG).findOne({'emailRelate.email':relationEmail}, function (err,relate) {
        if(relate){
            result.message = "该邮箱已被其他账户关联";
            callback(result);
            return;
        }
        mongo.db().collection(fields.APP_EMAIL_CONFIG).findOne({accountId:aid, 'emailRelate.email':{$ne: relationEmail}}, function (err,emailConfig) {
            if(!err){
                if(emailConfig){//表示已开通邮件接入服务
                    var relationid = emailConfig._id;//需要更新的邮箱的id
                    var email_relate = emailConfig.emailRelate;//获取原有的关联邮箱数组
                    var relationEmailid = utils.UUID.generateUuid();//新关联邮箱id
                    var sendData = emailConfig;
                    sendData.to = relationEmail;
                    sendData.mailId = relationEmailid;
                    var __updateEmailRelate = function(relationid,relationEmail,emailRelskillGroup,relationEmailid){
                        mongo.db().collection(fields.APP_EMAIL_CONFIG).update({_id:relationid},{$push:{emailRelate:{'email':relationEmail,'skillGroup':emailRelskillGroup,'id':relationEmailid,'status':"verifyIn"}}},function(err){
                            if(!err){
                                result.success=true;
                                result.data = {'email':relationEmail,'skillGroup':emailRelskillGroup,id:relationEmailid,'status':"verifyIn"};//status0表示验证未通过，如果验证通过status= status1
                                result.message = "正在验证您的邮箱，请耐心等待~";
                                callback(result);
                            }else{
                                result.message = '关联邮件信息更新失败！';
                                callback(result);
                            }
                        });
                    };
                    //读取数据，存储数据
                    if(!relationemailArrId){//即:没有邮箱id则新关联邮箱
                        var existEmail = [];//存放重复关联的email
                        if(email_relate){
                            for(var i=0;i<email_relate.length;i++){
                                if(email_relate[i].email==relationEmail){
                                    existEmail.push(email_relate[i].email);
                                    break;
                                }
                            }
                            if(existEmail.length>0){
                                result.message = "该邮箱已经关联";
                                callback(result);
                            }else{
                                //先执行测试
                                _impl._emailSendForwardTest(sendData,function(res){
                                    if(res){
                                        __updateEmailRelate(relationid,relationEmail,emailRelskillGroup,relationEmailid);
                                    }else{
                                        result.message="邮件测试转发过程失败，请重试~";
                                        callback(result);
                                    }
                                });


                            }
                        }else{//如果数组是空的新增数组
                            _impl._emailSendForwardTest(sendData,function(res){
                                if(res){
                                    __updateEmailRelate(relationid,relationEmail,emailRelskillGroup,relationEmailid);
                                }else{
                                    result.message="邮件测试转发过程失败，请重试~";
                                    callback(result);
                                }
                            });
                            //console.log('测试成功');
                        }
                    }else{//如果传的值中的邮箱的id，则证明是编辑已关联的邮箱
                        // emailRelate 关联的数组
                        // relationemailArrId 修改的关联邮箱的id
                        var existEmailArr = [];//存放重复关联的email
                        for(var i=0;i<email_relate.length;i++){
                            if(email_relate[i].id!=relationemailArrId){
                                if(email_relate[i].email==relationEmail){
                                    existEmailArr.push(email_relate[i].email);
                                    break;
                                }
                            }
                        }
                        if(existEmailArr.length>0){
                            result.message = "该邮箱已经关联";
                            callback(result);
                        }else{//对于已存在的email进行修改
                            //先执行测试
                            sendData.mailId = relationemailArrId;
                            _impl._emailSendForwardTest(sendData,function(res){
                                if(res){
                                    mongo.db().collection(fields.APP_EMAIL_CONFIG).update({_id:relationid,"emailRelate.id":relationemailArrId},{$set:{'emailRelate.$.email':relationEmail,'emailRelate.$.skillGroup':emailRelskillGroup,'emailRelate.$.id':relationemailArrId,'emailRelate.$.status':"verifyIn"}},function(err){
                                        if(!err){
                                            result.success=true;
                                            result.data = {'email':relationEmail,'skillGroup':emailRelskillGroup,id:relationemailArrId,'status':"verifyIn"};
                                            result.message = "正在验证您的邮箱，请耐心等待~";
                                            callback(result);
                                        }else{
                                            result.message = '关联邮箱信息更新失败！';
                                            callback(result);
                                        }
                                    });
                                }else{
                                    result.message="邮件测试转发过程失败，请重试~";
                                    callback(result);
                                }
                            });
                        }

                    }

                }else {
                    result.message = "请您先开通平台邮箱服务~";
                    callback(result);
                }
            }else{
                logger.app.error('db query error:' + err.stack);
                result.message = 'db query error!' + err.message;
                callback(result);
            }
        });
    });

}
exports.showAllSkilGroup = function(data,session,callback){
    var result = {success:false};
    var query = data;
    if(!query.Account){
        query.Account = session.user.account;
    }
    mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find(query).toArray(function(err,docs){
        if(!err){
            result.success = true;
            result.data = docs || [];
            callback(result);
        }else {
            logger.app.error("数据查询失败："+err);
            callback({success: false, list: [], count: 0});
        }

    });
}
//邮箱验证，页面重新发送邮件
exports.sendCheckEmail = function(data,seesion,callback){
    var result = {success:false};
    _impl._emailSendForwardTest(data,function(res){
        if(res){
            result.success = true;
            result.message="正在验证您的邮箱，请耐心等待~";
            callback(result);
        }else{
            result.message = "验证邮件发送失败请重试~";
            callback(result);
        }
    });
}
//查询已关联的邮箱是否验证通过
exports.checkRelationEmail=function(data,session,callback){
    var result = {success:false};
    mongo.db().collection(fields.APP_EMAIL_CONFIG).findOne({'emailRelate.id' : data.mailId}, function (err,docs) {
        if(!err){
            if(docs){
                var emailRelate = docs.emailRelate;
                if(emailRelate){
                    for(var i=0;i<emailRelate.length;i++){
                        if(emailRelate[i].id==data.mailId){
                            result.success = true;
                            result.data = emailRelate[i].status;
                            callback(result);
                            break;
                        }
                    }
                }
            }
        }else{
            logger.app.error("数据查询失败："+err);
            result.message = "请重新验证~";
            callback(result);
        }
    });
}
//删除关联邮箱
exports.delRelationEmail = function (data,session,callback) {
    var result = {success:false};
    var id = data.delID;
    var aid=session.user.account;
    mongo.db().collection(fields.APP_EMAIL_CONFIG).update({'accountId':aid},{$pull:{'emailRelate':{'id':id}}},function(err){
        if(!err){
            result.success = true;
            result.message = "已删除关联邮箱~";
            callback(result);
        } else{
            logger.app.error("数据更新失败："+err);
            result.message = "关联邮箱不存在~";
            callback(result);
        }
    });
}
exports.saveRelationEmailConfig = function(data,session,callback){
    var result = {success:false};
    var aid = session.user.account;
    var defaultSkillGroup = data.defaultSkillGroup;
    var emailModel = data.emailModel;
    var emailRelate = data.emailRelate;
    var upset = {'emailModel':emailModel};
    //{defaultSkillGroup:defaultSkillGroup,emailModel:emailModel,emailDelimiter:emailDelimiter});
    mongo.db().collection(fields.APP_EMAIL_CONFIG).update({'accountId':aid},{$set: upset},function(err){
        if(!err){
            result.success = true;
            result.message = "html模板保存成功";
            callback(result);
        }else{
            logger.app.error("数据更新失败："+err);
            result.message = "配置保存失败,请规范操作~";
            callback(result);
        }
    });
}

exports.updateEmailRelateConfig = function(data, session, callback){
    var result = {success:false};
    var aid = session.user.account;
    var upset ={};
    if(data.skillGroup){
        upset = {'emailRelate.$.skillGroup': data.skillGroup};
    }else if(data.sign || data.sign== ""){
        upset = {'emailRelate.$.sign': data.sign};
    }

    //{defaultSkillGroup:defaultSkillGroup,emailModel:emailModel,emailDelimiter:emailDelimiter});
    mongo.db().collection(fields.APP_EMAIL_CONFIG).update({'accountId':aid, 'emailRelate.id':data.id},{$set: upset},function(err){
        if(!err){
            result.success = true;
            result.message = "保存成功";
            callback(result);
        }else{
            logger.app.error("数据更新失败："+err);
            result.message = "保存失败,请规范操作~";
            callback(result);
        }
    });
}

/**
 * 获取客服邮箱
 * @type {exports.getSignById}
 */
exports.getServiceEmails = function(session, callback){
    var query = {
        accountId: session.user.account
    };
    mongo.db().collection(fields.APP_EMAIL_CONFIG).findOne(query,function(err, doc){
        if (!err && doc) {
            callback(null, doc.emailRelate || []);
        } else {
            callback(err);
        }
    });
}


/**
 * 保存
 * @param data
 * @param session
 * @param callback
 */
exports.saveEmailSign = function(data,session,callback){
    var result = {success:false};
    var aid = session.user.account;
    var name = data.name;
    var content = data.content;
    if(!name){
        result.message = '名称不能为空';
        callback(result);
    }else if(!content){
        result.message = '内容不能为空';
        callback(result);
    }else{
        data.content.replace(/\r\n/g,"\n").replace(/\n/g,"\r\n");
        var id = utils.UUID.generateUuid();
        var historyItem = {
            operate:"insert",
            createTime:utils.getCurrentDate(),
            user:session.user._id
        };
        var sign = {
            _id :id,
            account:aid,
            name:name,
            content:content,
            createTime:utils.getCurrentDate(),
            updateTime:utils.getCurrentDate(),
            history:[historyItem]
        };
        mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).insert(sign, function (err) {
            if (!err) {
                result.success =true;
                callback(result);
            } else {
                logger.app.error('db insert error:' + err.stack);
                result.message = 'db insert error!' + err.message;
                callback(result);
            }
        });
    }

}
/**
 * 修改
 * @param data
 * @param session
 * @param callback
 */
exports.updateEmailSign = function(data,session,callback){
    var result = {success:false};
    var name = data.name;
    var content = data.content;
    if(!name){
        result.message = '名称不能为空';
        callback(result);
    }else if(!content){
        result.message = '内容不能为空';
        callback(result);
    }else{
        var _id = data._id;
        var find = { _id :_id};
        var historyItem = {
            operate:"update",
            createTime:utils.getCurrentDate(),
            user:session.user._id
        };
        var sign = {
                    $set:{
                            name:name,
                            content:content,
                            updateTime:utils.getCurrentDate()
                        },
                    $push : {history:historyItem}
                    };
        mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).update(find,sign, function (err) {
            if (!err) {
                result.success =true;
                callback(result);
            } else {
                logger.app.error('db insert error:' + err.stack);
                result.message = 'db insert error!' + err.message;
                callback(result);
            }
        });
    }
}


/**
 * 删除
 * @param data
 * @param session
 * @param callback
 */
exports.deleteEmailSign = function(data,session,callback){
    var result = {success:false};
    var _id = data._id;
    if(!_id){
        result.message = 'db delete error!' + err.message;
        callback(result);
    }else{
        var find = { _id :_id};
        mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).findOne(find, function (err,mailSign) {
            if (!err) {
                if(mailSign){
                    mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).remove(find, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.error('db deleteEmailSign error:' + err.stack);
                            result.message = 'db delete error!' + err.message;
                            callback(result);
                        }
                    });
                }else{
                    result.message = '404 mailSign not found!';
                    callback(result);
                }
            } else {
                result.message = 'find this emailSign failed!';
                callback(result);
            }
        });
    }
}
/**
 * 获取所有的emailSgin
 * @param session
 * @param callback
 */
exports.getEmailSignDic = function(session, callback){
    var query = {
        account: session.user.account
    };
    mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).find(query).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
};


/**
 * 根据id获取 emailSgin
 * @param session
 * @param callback
 */
exports.getSignById = function(data,session, callback){
    var result = {success: false};
    var query = {
        _id: data._id
    };
    mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).findOne(query,function(err, sign){
        if (!err) {
            result.data = sign;
            result.success = true;
            callback(result);
        } else {
            result.message = "获取签名出错";
            callback(result);
        }
    });
};

/**
 * 分页获取emailSgin
 * @param session
 * @param callback
 */
exports.querySignList = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = {};
    condition.account = session.user.account;
    //utils.removeEmptyProperty(condition);
    mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });

}
/**
 * 设置默认
 * @param data
 * @param session
 * @param callback
 */
exports.setSignDefault = function (data, session, callback) {
    var result = {success:false};
    var id = data.id;
    var findOther ={account:session.user.account,isDefault:true};
    var historyItem = {
        operate:"setSignDefault",
        createTime:utils.getCurrentDate(),
        user:session.user._id
    };
    var signOther = {
        isDefault:false,
        $push : {history:historyItem}
    };
    //更新其他的都为不默认
    mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).update(findOther,signOther, function (err) {
        if (!err) {
            var find = { _id :id};
            var sign = {
                isDefault:true,
                $push : {history:historyItem}
            };
            mongo.db().collection(fields.APP_EMAIL_MAIL_SIGN).update(find,sign, function (err){
                if (!err) {
                    result.success = true;
                    callback(result);
                }else {
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

/**
 * 添加和修改一个邮件分类  added by wangyn
 * @param data
 * @param session
 * @param callback
 */
exports.saveAndUpdateMailCategory = function (data, session, callback) {
    var result = {success: false};
    Thenjs(function(cont){
        var condition = {
            categoryName: data.categoryName,
            relateMailAddr: data.relateMailAddr,
            _id: {$ne: data.categoryId}
        };
        mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).findOne(condition, function (err, doc){
            cont(null,err,doc);
        });
    }).then(function(cont,err,doc){
        if(doc){
            result.message = "同一邮箱的分类名称不可重复";
            result.duplication = true; //重名错误
            callback(result);
            return;
        }else{
            cont(null,err);
        }
    }).then(function(cont,err){
        if(err){
            callback(result);
        }
        if (data.categoryId) { //更新
            var setDocs = {$set: {categoryName: data.categoryName, rulesType: data.rulesType, rules: data.rules}};
            mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).update({_id: data.categoryId}, setDocs, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        } else { //添加
            var categoryData = {
                _id: utils.UUID.generateUuid(),
                relateMailAddr: data.relateMailAddr,
                account: session.user.account,
                categoryName: data.categoryName,
                rulesType: data.rulesType || "any",
                rules: data.rules,
                createTime: utils.getCurrentDate()
            };
            mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).insert(categoryData, function (err) {
                if (!err) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        }
    }).fail(function(cont,err){
        logger.app.error(err);
        result.message = err;
        callback(result);
    });
};
/**
 * 查询该客服邮箱下所有的邮件分类  added by wangyn
 * @param data
 * @param session
 * @param callback
 */
exports.showMailCategory = function (data, session, callback) {
    var result = {success: false};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = {account:session.user.account,relateMailAddr: data.email};
    mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).find(condition, {limit: limit, skip: skip, sort: {"createTime": 1}}).toArray(function (err, docs) {
        if (!err) {
            result.list = [];
            if (docs) {
                for (var i = 0; i < docs.length; i++) {
                    var doc = {_id: docs[i]._id, name: docs[i].categoryName};
                    result.list.push(doc);
                }
            }
            mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        }else{
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });
};
/**
 * 修改邮件分类信息的回显 added by wangyn
 * @param data
 * @param session
 * @param callback
 */
exports.editMailCategory = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).findOne({_id: data.categoryId}, function (err, category) {
        if (!err) {
            result.list = [];
            result.success = true;
            if (category) {
                result.list = category.rules || [];
                result.categoryName = category.categoryName || '';
                result.rulesType = category.rulesType || '';
            }
        }
        callback(result);
    });
};
/**
 * 删除一条邮件分类信息 added by wangyn
 * @param data
 * @param session
 * @param callback
 */
exports.deleteMailCategory = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).findOne({_id: data.categoryId},function(err,doc){
        if(err || !doc){
            callback(result);
            return ;
        }
        mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).remove({_id: data.categoryId}, function (err) {
            if (!err) {
                result.success = true;
                //删除对应的邮件分类
                var find = {account:session.user.account,'category': data.categoryId};
                mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(find, {$unset: {category: true}}, {multi: true}, function (err) {
                });
            }
            callback(result);
        });
    });
};