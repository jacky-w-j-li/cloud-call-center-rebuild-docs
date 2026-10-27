var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var skillgroupHandler = require(__baseDir + '/dishui/config/ivr/SkillgroupHandler');

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
            if('id' in data){
                data._id = data.id;
                delete data.id;
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

    }
};
