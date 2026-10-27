var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var sessionHandler = require(__baseDir + '/im/SessionHandler');
var fields = require(__baseDir + '/im/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var qaHandler = require('./QAHandler');
var Thenjs = require("thenjs");

exports.newMsg = function (data, callback) {
    var result = {
        success: false
    };

    sessionHandler.checkSession(data.sid, function (err, sessionData) {
        if (!err && sessionData) {
            var message = {
                account: sessionData.account,
                sid: sessionData._id,
                contentType: data.contentType,
                message: data.content,
                platform: sessionData.platform,
                type: "in",
                when: utils.getCurrentDateTime(),
                dateTime: utils.getCurrentDate(),
                status: "undeal",
                actionId: utils.UUID.generateUuid(),
                action: "newMsg",
                accessId: sessionData.accessId,
                nickName: sessionData.username,
                showHtml: data.showHtml || false,
                notShow: data.notShow,
                _id:utils.UUID.generateUuid()
            };
            for(var key in message){
                message[key] = encodeURIComponent(message[key]);
            }
            httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(message), function (err, response) {
                if (!err) {
                    var result = {
                        success: true
                    };
                    result.sid = sessionData._id;
                    result.content = data.content;
                    result.timestamp = data.timestamp;
                    //result.companyid = data.companyid;
                    callback(result);
                } else {
                    logger.app.error("[%s, %s]error from dispather", "newMsg", data._aid);
                    var result = {success: false, message: "error from dispather"};
                    callback(result);
                }
            });

        } else {
            result.message = "[" + data.sid + "]session valid,send msg err" + err;
            callback(result);
            return;
        }
    });
};
/**
 * 预知访客输入内容
 * @param data   {_id,content}
 * @param callback
 */
exports.typeNotice = function (data, callback) {
    var result = {
        success: false
    };
    sessionHandler.checkSession(data._id, function (err, sessionData) {
        if(!err && sessionData){
            var message = {
                account: sessionData.account,
                sid: data._id,
                content: data.content,
                timestamp:utils.getCurrentDateTime(),
                action: "typeNotice"
            };
            message.content = encodeURIComponent(message.content);
            httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(message), function (err, response) {
                if (!err) {
                    var result = {
                        success: true
                    };
                    callback(result);
                } else {
                    logger.app.error("[%s, %s]error from dispather", "typeNotice", data._id);
                    var result = {success: false, message: "error from dispather"};
                    callback(result);
                }
            });
        }else{
            result.message = "[" + data.sid + "]session valid,send msg err" + err;
            callback(result);
        }
    });
};

/**
 * 预知访客输入内容
 * @param data   {_id,content}
 * @param callback
 */
exports.sdkTypeNotice = function (data, conection, callback) {
    var result = {
        Succeed: false
    };
    var message = {
        account: conection.account,
        sid: conection._id,
        content: data.content,
        timestamp: utils.getCurrentDateTime(),
        action: "typeNotice"
    };
    httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(message), function (err, response) {
        if (!err) {
            var result = {
                Succeed: true
            };
            callback(result);
        } else {
            logger.app.error("[%s, %s]error from dispather", "typeNotice-sdk", conection._id);
            var result = {Succeed: false, message: "error from dispather"};
            callback(result);
        }
    });
};




exports.leaveMsg = function(data, callback){
    var result = {
        success: false
    };
    var lMessage = {
        _id: utils.UUID.generateUuid(),
        message: data.message,
        platform: data.platform,
        accessId: data.accessId,
        phone:data.phone || "",
        email: data.email || "",
        action: "leaveMessage",
        sid: data.sid || utils.UUID.generateUuid(),
        actionId: utils.UUID.generateUuid(),
        nickName:"访客留言",
        fromUrl: data.fromUrl,
        urlTitle:data.urlTitle,
        toPeer: data.toPeer || "",
        seoSource: data.seoSource,
        seoKeywords: data.seoKeywords,
        ip: data.ip
    };
    logger.app.info(lMessage);
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, function(err, dbData){
        if(!err && dbData){
            lMessage.account = dbData.account;
            logger.app.info("[leaveMsg][" + data._aid + "]request to dispather:" + JSON.stringify(lMessage));
            for(var key in lMessage){
                lMessage[key] = encodeURIComponent(lMessage[key]);
            }
            httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(lMessage), function (err, response) {
                if (!err && response) {
                    result.success = true;
                    callback(result);
                } else {
                    result = {success: false, message: "error from dispather"};
                    callback(result);
                }
            });
        }else{
            logger.app.error("未找到所对应账户[accessId:"+data.accessId+"]");
            result.message = "留言失败";
            callback(result);
        }
    });
};

exports.getMsg = function (data, callback) {
    var result = {
        success: false
    };
    var condition = data;
    condition.action="getMsg";
    condition.actionId=utils.UUID.generateUuid();
    httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(condition), function (err, response) {
        if (!err) {
            response = response || "{}";
            var r = null;
            try {
                r = JSON.parse(response);
            } catch (e) {
                logger.app.error("[%s, %s]getMsg error:" + e, condition.actionId, condition.sid);
                result.message = "get msg error";
                callback(result);
                return;
            }

            if (r.success) {
                result.success = true;
                result.data = r.data;

                callback(result);
            } else {
                logger.app.error("[%s, %s]getMsg error", condition.actionId, condition.sid);
                result.message = "getMsg from dispather error";
                callback(result);
            }
        }else{
            callback(result);
        }

    });


};


exports.sdkNewMsg = function(data, connection, callback) {
    var result = {
        Succeed: false
    }
    var message = {
        account: connection.account,
        sid: connection._id,
        contentType: data.ContentType,
        message: data.Message,
        platform: 'sdk',
        type: "in",
        when: utils.getCurrentDateTime(),
        dateTime: utils.getCurrentDate(),
        status: "undeal",
        actionId: utils.UUID.generateUuid(),
        action: "newMsg",
        accessId: connection.accessId,
        nickName: connection.username
    };
    for(var key in message){
        message[key] = encodeURIComponent(message[key]);
    }
    httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(message), function (err, response) {
        if (!err) {
            result.Succeed = true;
            result.sid = connection._id;
            //result.companyid = data.companyid;
            var res = JSON.parse(response);
            result.when = res.when;
            callback(result);
        } else {
            logger.app.error("[%s, %s]error from dispather", "newMsg", data._aid);
            result.message= "error from dispather";
            callback(result);
        }
    });
};

exports.sdkGetMsg = function (data, connection, callback) {
    var result = {
        Succeed: false
    };
    var condition = {
        sid: connection._id,
        type: 'out',
        actionId: utils.UUID.generateUuid(),
        action: "getMsg",
        platform: 'sdk',
        receivedMsgIds: data.ReceivedMsgIds
    };

    httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(condition), function (err, response) {
        if (!err) {
            response = response || "{}";
            var r = null;
            try {
                r = JSON.parse(response);
            } catch (e) {
                logger.app.error("[%s, %s]getMsg error:" + e, condition.actionId, condition.sid);
                result.message = "get msg error";
                callback(result);
                return;
            }
            if (r.success) {
                result.Succeed = true;
                result.data = r.data;
                callback(result);
            } else {
                logger.app.error("[%s, %s]getMsg error", condition.actionId, condition.sid);
                result.message = "getMsg from dispather error";
                callback(result);
            }
        }else{
            callback(result);
        }

    });
};

exports.sdkMessageConfirm = function(data, connection, callback){
    var result = {
        Succeed: false
    };
    mongo.db().collection(fields.DB_APP_KEFU_IM_NOTIFY).removeMany({tonotify:connection._id,msgId: {$in:data.ReceivedMsgIds}},{w:1}, function(err){
        if(err){
            result.Succeed = true;
        }
        callback(result);
    });

}

exports.sdkGetInvestigate = function (data, connection, callback) {
    var result = {Succeed: false};
    _impl.getImCsr(connection.account,function(res){
        if(res.success){
            var data = [];
            for(var i=0 ;i<res.csrDic.length;i++){
                var tmpOne = {name: res.csrDic[i].name, value: res.csrDic[i].key};
                data.push(tmpOne);
            }
            result.Succeed = true;
            result.List = data;
            callback(result);
        }else {
            logger.app.error("[%s, %s]error from dispather", "sdkGetInvestigate");
            result.message= "error from dispather";
            result.List = [];
            callback(result);
        }
    });
};

exports.sdkSubmitInvestigate = function (data, connection, callback) {
    var result = {
        Succeed: false
    };
    var message = {
        account     : connection.account,
        sid         : connection._id,
        way         : data.way || 'in',
        satisfaction : data.Name ||'',
        appraiseKey  : data.Value||'',
        platform    : 'sdk',
        when        : utils.getCurrentDateTime(),
        dateTime    : utils.getCurrentDate(),
        actionId    : utils.UUID.generateUuid(),
        action       : "sendImCSRInfo",
        accessId    : connection.accessId,
        nickName     : '',
        showHtml     : '',
        notShow      : '',
        type         : "imcsr",
        status       : "finish",
        contentType  : 'text'

    };
    httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(message), function (err1, response1) {
        if (!err1) {
            result.Succeed = true;
            result.sid = connection._id;
            result.companyid = data.companyid;
            callback(result);
        } else {
            logger.app.error("[%s, %s]error from dispather" + err, "newMsg-investigate", data._aid);
            result.message= "error from dispather";
            callback(result);
        }
    });
};

exports.sdkSubmitLeaveMessage = function (data, connection, callback) {
    var result = {
        Succeed: false
    };
    var lMessage = {
        //account: connection.account,
        //sid: connection._id,
        //contentType: "text",
        //message: "来源：app端"+"</br>内容："+data.Message+"</br>电话：" + data.Phone + "</br>邮箱："+ data.Email,
        //platform: 'sdk',
        //type: "in",
        //when: utils.getCurrentDateTime(),
        //dateTime: utils.getCurrentDate(),
        //status: "undeal",
        //actionId: utils.UUID.generateUuid(),
        //action: "newMsg",
        //accessId: connection.accessId,
        //nickName: connection.username,
        //showHtml: true

        _id: utils.UUID.generateUuid(),
        message: data.Message,
        platform: 'sdk',
        accessId: connection.accessId,
        phone:data.Phone || "",
        email: data.Email || "",
        action: "leaveMessage",
        sid: connection._id || utils.UUID.generateUuid(),
        actionId: utils.UUID.generateUuid(),
        nickName: "访客留言",
        account: connection.account,
        toPeer: data.ToPeer || ""
    };
    if(connection.thirdPartyUserId)
        lMessage.thirdPartyUserId = connection.thirdPartyUserId;
    if(connection.username)
        lMessage.username = connection.username;
    logger.app.info(lMessage);
    logger.app.info("[leaveMsg][" + data._aid + "]request to dispather:" + JSON.stringify(lMessage));
    for(var key in lMessage){
        lMessage[key] = encodeURIComponent(lMessage[key]);
    }
    httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(lMessage), function (err, response) {
        if (!err && response) {
            result.Succeed = true;
            callback(result);
        } else {
            result = {Succeed: false, Message: "error from dispather"};
            callback(result);
        }
    });
};

exports.sendWebMsg = function(data, callback){
    var resMsg = {success: false};
    var sid = data.sid;
    _impl.checkSession(sid, function (err, result) {
        if (!err && result) {
            var url = config.imUrl || "";
            url = url.replace("\$1", result.serverIp);
            url = url.replace("\$2", result.serverPort);
            logger.app.info("push url:"+ url);
            var text = {
                sid: sid,
                msgNum: 1,
                socketId: result.socketId
            };
            httpProvider.sendPost(url, "json=" + JSON.stringify(text), function (err, response) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    logger.app.error("parse response from pushServer error[" + JSON.stringify(text) + "]");
                    callback(resMsg);
                    return;
                }

                if (!err && response.success) {
                    resMsg.success = true;
                    callback(resMsg);
                } else {
                    logger.app.error("push states error[" + sid + "]", err);
                    callback(resMsg);
                }
            });

        } else {
            logger.app.error("check session error[sid="+sid+"]", err);
            callback(resMsg);
        }
    });
};


exports.sendWebFileUploadMsg = function(data, callback){
    var resMsg = {success: false};
    var sid = data.sid;
    _impl.checkSession(sid, function (err, result) {
        if (!err && result) {
            var url = config.imUrl || "";
            url = url.replace("\$1", result.serverIp);
            url = url.replace("\$2", result.serverPort);
            logger.app.info("push url:"+ url);
            var text = {
                sid: sid,
                socketId: result.socketId,
                timestamp:data.timestamp,
                content:data.content,
                type:"fileUpload",
                success:data.success
            };
            httpProvider.sendPost(url, "json=" + JSON.stringify(text), function (err, response) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    logger.app.error("parse response from pushServer error[" + JSON.stringify(text) + "]");
                    callback(resMsg);
                    return;
                }

                if (!err && response.success) {
                    resMsg.success = true;
                    callback(resMsg);
                } else {
                    logger.app.error("push states error[" + sid + "]", err);
                    callback(resMsg);
                }
            });

        } else {
            logger.app.error("check session error[sid="+sid+"]", err);
            callback(resMsg);
        }
    });
};

exports.sendAppMsg = function(data, callback){
    var result = {success: false};
    _impl.checkSession(data.sid, function (err, sessionDoc) {
        if (!err && sessionDoc) {
            var notifyVo = {
                account: data.account || "",
                tonotify: data.sid,
                msgId: data._id
            };
            mongo.db().collection(fields.DB_APP_KEFU_IM_NOTIFY).insertOne(notifyVo, function(err){
                if(err){
                    logger.app.error("update db im notify error", err);
                    callback(result);
                }else{
                    var notify = {
                        Action: "NewMessage",
                        ActionId: utils.UUID.generateUuid(),
                        ConnectionId: sessionDoc.connectionId,
                        IoSessionId: sessionDoc.ioSessionId
                    };
                    logger.app.info(JSON.stringify(notify));
                    httpProvider.sendPost(sessionDoc.connectServer, notify, function (err, response) {
                        logger.app.info(response.toString());
                        try {
                            response = JSON.parse(response);
                        } catch (e) {
                            logger.app.error("parse response from pushServer error[" + JSON.stringify(notify) + "]");
                            callback(result);
                            return;
                        }

                        //if (!err && response.Succeed) {
                            result.success =  true;
                            callback(result);
                        //} else {
                        //    logger.app.error("push states error[" + data.sid + "]");
                        //    callback(result);
                        //}
                    });
                }
            });

        } else {
            callback(result);
        }

    });
};

exports.sendSysMsg = function(data, callback){
    callback({success: true});
    if(data.batch){
        Thenjs(function(cont){
            mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).find({_id:{$in:data.sids}}).toArray(cont);
        }).then(function(cont, sessions){
            var recur = function(sessions,data){
                console.log(sessions);
                if(sessions.length<=0){
                    return;
                }
                var session = sessions.pop();
                Thenjs(function(cont1){

                    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId:session.accessId},cont1);
                }).then(function(cont1, imConfig){
                    console.log(imConfig);
                    if(session.platform == "sdk"){
                        if(data.operation == "queueNum"){
                            data.operation = "queueNum@"+data.queueNum;
                        }
                        var notify = {
                            Action: "NewSysMessage",
                            ActionId: utils.UUID.generateUuid(),
                            ConnectionId: session.connectionId,
                            IoSessionId: session.ioSessionId,
                            Type: data.operation || 'online'
                        };
                        httpProvider.sendPost(session.connectServer, notify, function (err, response) {

                        });

                    }else if(session.platform == "weixin"){

                    }else{
                        var msg = {};
                        if(imConfig.showAgentName == "1" || imConfig.showAgentName == true){
                            msg.displayName = data.displayName;
                        }else{
                            msg.displayName = data.exten;
                        }
                        console.log(msg);
                        msg.sid = session._id;
                        msg.socketId = session.socketId;
                        msg.port = session.port;
                        msg.type = data.operation;
                        msg.queueNum = data.queueNum || 0;
                        console.log(msg);
                        var url = config.imUrl || "";
                        console.log(url);
                        url = url.replace("\$1", session.serverIp);
                        url = url.replace("\$2", session.port);
                        console.log(url);
                        httpProvider.sendPost(url, "json=" + JSON.stringify(msg), function (err, response) {
                            if (err) {
                                logger.app.error("push sysmsg error:"+err);
                            }
                        });
                    }
                    recur(sessions, data);
                }).fail(function(cont1, err){

                });
            }
            recur(sessions, data);

        }).fail(function(cont, err){
            logger.app.error(err);
        });
    }else{
        var msg = {};
        mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne({_id: data.sid}, function(err, session){
            if(!err && session){
                mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId:session.accessId}, function(err, imConfig){
                    if(!err && imConfig){
                        console.log(data);
                        if(session.platform == "sdk"){
                            if(data.operation == "queueNum"){
                                data.operation = "queueNum@"+data.queueNum;
                            }
                            var notify = {
                                Action: "NewSysMessage",
                                ActionId: utils.UUID.generateUuid(),
                                ConnectionId: session.connectionId,
                                IoSessionId: session.ioSessionId,
                                Type: data.operation || 'online',
                            };
                            httpProvider.sendPost(session.connectServer, notify, function (err, response) {
                                try {
                                    response = JSON.parse(response);
                                } catch (e) {
                                    logger.app.error("parse response from pushServer error[" + JSON.stringify(notify) + "]");
                                    return;
                                }
                            });

                        }else if(session.platform == "weixin"){

                        }else{
                            if(imConfig.showAgentName == "1"){
                                msg.displayName = data.displayName;
                            }else{
                                msg.displayName = data.exten;
                            }
                            msg.sid = session._id;
                            msg.socketId = session.socketId;
                            msg.port = session.port;
                            msg.type = data.operation;
                            msg.queueNum = data.queueNum || 0;
                            var url = config.imUrl || "";
                            url = url.replace("\$1", session.serverIp);
                            url = url.replace("\$2", session.port);
                            httpProvider.sendPost(url, "json=" + JSON.stringify(msg), function (err, response) {
                                if (err) {
                                    logger.app.error("push sysmsg error:"+err);
                                }
                            });
                        }


                    }else{
                        logger.app.error("not found im config by accessId["+ session.accessId+"]");
                    }
                });
            }else{
                logger.app.error("[pushSysMsgToCustomer]not found session");
            }
        });
    }

};

exports.getImCsrConfig = function(data,callback){
    var result = {success: false};
    //常见问题列表
    data.qaType = "queryCatalogListInf";
    qaHandler.pullQAMsg(data,function(res1){
        result.catalogList = res1.catalogList || [];
        //满意度字典
        mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId, webchat_csr: true}, function(err, dbData){
            if (!err && dbData) {
                _impl.getImCsr(dbData.account,function(res){
                    if(res.success){
                        result.csrDic = res.csrDic;
                        result.success = true;
                        callback(result);
                    }else{
                        callback(result);
                    }
                });

            } else {
                result.message = "[" + data.sid + "]session valid,send msg err" + err;
                callback(result);
            }
        });
    });
};

exports.pushImCsrConfig = function(data,callback){
    var resMsg = {success: false};
    _impl.checkSession(data.sid, function (err, result) {
        if (!err && result) {
            var url = config.imUrl || "";
            url = url.replace("\$1", result.serverIp);
            url = url.replace("\$2", result.serverPort);
            logger.app.info("push url:"+ url);
            var text = {
                sid: data.sid,
                pushImCsrConfig:true,
                isInvestigate:data.isInvestigate,
                socketId: result.socketId
            };
            httpProvider.sendPost(url, "json=" + JSON.stringify(text), function (err, response) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    logger.app.error("parse response from pushServer error[" + JSON.stringify(text) + "]");
                    callback(resMsg);
                    return;
                }
                if (!err && response.success) {
                    resMsg.success = true;
                    callback(resMsg);
                } else {
                    logger.app.error("push states error[" + sid + "]", err);
                    callback(resMsg);
                }
            });

        } else {
            logger.app.error("check session error[sid="+sid+"]", err);
            callback(resMsg);
        }
    });

};

exports.pushWebCSRMsg = function(data,callback){
    var resMsg = {success: false};
    var sid = data.sid;
    _impl.checkSession(sid, function (err, result) {
        if (!err && result) {
            var url = config.imUrl || "";
            url = url.replace("\$1", result.serverIp);
            url = url.replace("\$2", result.serverPort);
            logger.app.info("push url:"+ url);
            var text = {
                sid: sid,
                webchatCSR:true,
                socketId: result.socketId
            };
            httpProvider.sendPost(url, "json=" + JSON.stringify(text), function (err, response) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    logger.app.error("parse response from pushServer error[" + JSON.stringify(text) + "]");
                    callback(resMsg);
                    return;
                }

                if (!err && response.success) {
                    resMsg.success = true;
                    callback(resMsg);
                } else {
                    logger.app.error("push states error[" + sid + "]", err);
                    callback(resMsg);
                }
            });

        } else {
            logger.app.error("check session error[sid="+sid+"]", err);
            callback(resMsg);
        }
    });
};
exports.sendWebCSRMsg = function(data,callback){
    var result = {success: false};

    sessionHandler.checkSession(data.sid, function (err, sessionData) {
        if (!err && sessionData) {
            var message = {
                account      : sessionData.account,
                sid          : sessionData._id,
                way          : data.way,
                satisfaction : data.satisfaction,
                proposal     : data.proposal,
                label        : data.label,
                appraiseKey  : data.appraiseKey,
                platform     : sessionData.platform,
                when         : utils.getCurrentDateTime(),
                dateTime     : utils.getCurrentDate(),
                actionId     : utils.UUID.generateUuid(),
                action       : "sendImCSRInfo",
                accessId     : sessionData.accessId,
                nickName     : sessionData.username,
                showHtml     : data.showHtml || false,
                notShow      : data.notShow,
                type         : "imcsr",
                status       : "finish",
                contentType  : 'text'
            };
            for(var key in message){
                message[key] = encodeURIComponent(message[key]);
            }
            httpProvider.sendPost(config.gatewayServiceUrl, "data=" + JSON.stringify(message), function (err, response) {
                if (!err) {
                    var result = { success: true};

                    callback(result);
                } else {
                    logger.app.error("[%s, %s]error from dispather", "sendWebCSRMsg", data._aid);
                    var result = {success: false, message: "error from dispather"};
                    callback(result);
                }
            });

        } else {
            result.message = "[" + data.sid + "]session valid,send msg err" + err;
            callback(result);
            return;
        }
    });
};
var _impl = {
    checkSession: function (sid, callback) {
        mongo.db().collection(fields.DB_APP_KEFU_IM_SESSION).findOne({_id: sid}, function (err, doc) {
            if (!err && doc && doc._id) {
                doc.sid = doc._id;
                doc.serverPort = doc.port;
                callback(null, doc);
            } else {
                logger.app.error("not found session[" + sid + "]");
                callback({success: false, message: "not found session"});
            }
        });
    },
    getImCsr :function(account, callback){
        var result = {success: false};
        mongo.db().collection("app_channel_dic").findOne({type:"webchatCSR",account:account},function(err,res1){
            if(!err && res1){
                logger.app.info("result.csrDi  " +JSON.stringify(res1.options));
                result.csrDic = res1.options;
                result.success = true;
                callback(result);
            }else{
                logger.app.error("get webchatCSR dic info err",err);
                callback(result);
            }
        });

    }

}