/**
 * Created by zengyx on 16/4/15.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var nodeUtil = require('util');
var uuid = require('appUtil/UUID');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var reportEvent = require("appEvent/ReportEvent");
var Thenjs = require("thenjs");

/**
 *
 *
 *
 * var postData = {
            from        : data.from,         // 发件人
            to          : data.to,           // 收件人[]
            cc          : data.cc,           // 抄送
            subject     : data.subject,      // 邮件主题
            content     : data.content,      // 邮件内容
            attachment  : data.attachment,   // 附件[]
            mailId         : data.mailId,       // 邮件唯一id
            supportEmail: data.supportEmail, // 支持邮箱
            createTime  : utils.getCurrentDateTime(),
            emailType   : "send"
        };
 * @param data
 * @param callback
 */
exports.receiveEmail= function(data, callback){
    var subject = data.subject.replace(/\s/g,"+");
    subject = new Buffer(subject, 'base64').toString();
    var index = subject.lastIndexOf("#");
    var emailSessionId = "";
    if(index != -1){
        emailSessionId = subject.substr(index+1);
    }

    Thenjs(function(cont){
        mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).findOne({shortId: emailSessionId, account:data.account, 'to.addr': data.realTo, status: {$nin:['finish','spam']}},cont);
    }).then(function(cont, doc){
        if(doc){
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update({_id: doc._id, account: data.account},
                {$inc:{leakNum:1, receiveNum: 1, totalEmailNum:1}, $set:{lastReceiveTime: utils.getCurrentDate(), lastEmailTimestamp: utils.getCurrentDateTime()}});
            cont(null, doc);

        }else{
            createNewEmailSession(data, cont);
        }
    }).then(function(cont, doc){
        if(!doc){
            callback({success: true});
            return;
        }
        mongo.db().collection(fields.APP_EMAIL_MAILS).update({_id: data.mailId},{$set:{sessionId: doc._id}});
        if(doc.agent){
            doc.subject = encodeURIComponent(doc.subject);
            doc.from.name = encodeURIComponent(doc.from.name);
            doc.to.name = encodeURIComponent(doc.to.name);
            doc.mailId = data.mailId;
            var msg = {eventData: {Event:'NewEmail', Account:data.account, Data:doc}};
            msg.userId = doc.agent;
            msg.eventData.Data.ToPeer = doc.toPeer;
            msg.eventData.Foryou = true;
            exports.pushEmailToAgent(msg, function(pushRes){
                callback(pushRes);
            });
        }else{
            var msg = {eventData: {Event:'NewEmail', Account:data.account, Data:{type:'pushUndealNum'}}};
            msg.eventData.Data.ToPeer = doc.toPeer;
            exports.pushUndealNumToAllAgents(msg, function(){

            });
            callback({success: true});
        }

    }).fail(function(cont,err){
        callback({success:false, message:err});
     });
};

/**
 * 创建新的邮件会话
 * @param data
 * @param callback
 */
function createNewEmailSession(data, callback){
    var subject = data.subject.replace(/\s/g,"+");
    subject = new Buffer(subject, 'base64').toString();
    var fromName = data.from.name.replace(/\s/g,"+");
    fromName = new Buffer(fromName, 'base64').toString();
    var _id = uuid.generateUuid();
    var shortId = utils.generateShortUuid(_id);
    var insertData = {_id: uuid.generateUuid(),shortId: shortId, from:{name: fromName, addr:data.from.addr} ,
        createTimeStamp: utils.getCurrentDateTime(),autoClaimVersion:Math.random()+"_"+utils.getCurrentDateTime(), createTime: utils.getCurrentDate(),
        lastReceiveTime:utils.getCurrentDate(),receiveNum: 1, totalEmailNum:1,leakNum:1,
        lastEmailTimestamp:utils.getCurrentDateTime(), account: data.account,supportEmail: data.supportEmail, subject: subject+" #"+shortId};

    //todo 邮件所属处理人
    assignAgent(data.toPeer, data.account, function(error, agent){
        if(agent){
            insertData.agent = agent;
            insertData.status = "deal";
            insertData.lastClaimTime = utils.getCurrentDateTime();
            insertData.history=[{user:agent, updatedTime:utils.getCurrentDate(), type:"claim", timestamp:utils.getCurrentDateTime()}];

        }else{
            logger.app.error(error);
            insertData.status = "undeal";
        }

        insertData.toPeer = data.toPeer;
        insertData.to = {addr:data.realTo};
        if(data.realToName){
           var realToName = data.realToName.replace(/\s/g,"+");
            realToName = new Buffer(realToName, 'base64').toString();
            insertData.to.name = realToName;
        }

        Thenjs(function(cont){
            mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({
                account: data.account,
                product: 'cc'
            }, function(err, doc){
                cont(null, err,doc);
            });

        }).then(function(cont, err,doc){
            if(err && !doc){
                cont(null, err);
            }else{
                mongo.db(doc.dataDB).collection(data.account + fields.DB_C5_CUSTOMER).find({'email.email': data.from.addr}).toArray(function(err, custDbs){
                    cont(null,err,custDbs, doc);
                });
            }

        }).then(function(cont, err,custDbs, doc){
            var customerId = "";
            if(custDbs){
                if(custDbs.length == 1){
                    customerId  = custDbs[0]._id;
                    insertData.customerId = customerId;
                    insertData.custName = custDbs[0].name;
                }
            }
            //邮件自动分类判定 modified by wangyn
            autoDefineMailCategory(insertData, function(targetCategory) {
                if(targetCategory){
                    insertData.category = targetCategory;
                }
                cont(null, err,customerId,insertData,doc);
            });
        }).then(function(cont,err,customerId,insertData,doc){
            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).insert(insertData, function(err){
                if(err){
                    callback(err);
                    if(insertData.agent){
                        mongo.db().collection("app_push_client").update({_id:insertData.agent},{$inc:{currDealEmailNum:-1}});
                    }
                }else{
                    //当该会话和坐席绑定时,为该坐席的回话数+1 added by wangyn
                    if(insertData.agent){
                        var reportData = {
                            reportTime: utils.getCurrentDate(),
                            reportType: reportEvent.EventType.MAIL_ACCESS_SESSION,
                            conversationCount: 1,
                            agentId: insertData.agent,
                            account: data.account
                        };
                        reportEvent.emitMailReportEvent(reportData);
                    }
                    insertData.custId = insertData.customerId || ""; //冗余在前端展示用
                    callback(null, insertData);
                }
            });

            if(doc){
                mongo.db(doc.dataDB).collection(data.account + "_history").insert(
                    {
                        _id: insertData._id,
                        type: "email",
                        agent: insertData.agent || "",
                        status: 'still',
                        lastUpdateTime: utils.getCurrentDate(),
                        createTime: utils.getCurrentDate(),
                        email: insertData.from.addr,
                        customer: customerId
                    }, function (err) {});
            }


        }).fail(function(cont, err){
            logger.app.error(err);
        });


    });

}
//邮件自动归类为设定的类别方法 added by wangyn
function autoDefineMailCategory(mailSession,callback) {
    var query = {
        account: mailSession.account,
        relateMailAddr:mailSession.to.addr
    };
    mongo.db().collection(fields.APP_EMAIL_MAIL_CATEGORY).find(query,{sort: {"createTime": 1}}).toArray(function(err, categorys){
        if(!err){
            if (categorys) {
                for (var i = 0; i < categorys.length; i++) {
                    var rules = categorys[i].rules || [];
                    if (_isMatchRules(mailSession, rules, categorys[i].rulesType)) {
                        //如果分类满足条件 返回分类信息 结束循环
                        callback(categorys[i]._id);
                        return ;
                    }
                }
            }
        }
        callback(null);
    });
}
//判断是否满足分类的所有规则 added by wangyn
function _isMatchRules(mailSession, rules, rulesType) {
    var matchResult = false;
    if (rules.length > 0) {
        matchResult = _isMatchRule(rules[0], mailSession);
        if (rulesType === "any") {
            for (var i = 1; i < rules.length; i++) {
                matchResult = matchResult || _isMatchRule(rules[i], mailSession);
                if(matchResult){ //满足任一
                    return matchResult;
                }
            }
        } else if (rulesType === "all") {//满足全部
            for (var i = 1; i < rules.length; i++) {
                matchResult = matchResult && _isMatchRule(rules[i], mailSession);
                if(!matchResult){
                    return matchResult;
                }
            }
        }
    }
    return matchResult;
}
//判断每一条规则是否匹配 added by wangyn
function _isMatchRule(rule, mailSession) {
    var target = "";
    if (rule.name === "sendAddr") {
        target = mailSession.from.addr || "";
    } else if (rule.name === "subject") {
        var subject = mailSession.subject;
        subject = subject.substring(0,subject.length - 10);
        target = subject || "";
    }
    if (rule.type === "eq") {
        return target === rule.content;
    } else if (rule.type === "ne") {
        return target !== rule.content;
    } else if (rule.type === "in") {
        return target.indexOf(rule.content) >= 0;
    } else if (rule.type === "nin") {
        return target.indexOf(rule.content) < 0;
    } else {
        return false;
    }
}

/**
 * 分配邮件给座席
 *
 */
function assignAgent(peer, account, callback){
    if(!peer){
        callback(null,null);
        return;
    }
    exports.getUndealNum({toPeer: peer}, {user:{account:account}},function(result){
        //还有待处理的,则新来的加入排队
        console.log(result);
        if(result.openNum && result.openNum>0){
            callback(null, null);
        }else{
            exports.assignByRoundMemory(peer, callback);
        }

    });

}

exports.getUndealNum=function (data, session, callback){
    var result = {success: false};
    var aid = session.user.account;
    var query = {
        account: aid,
        status: "undeal",
        toPeer: data.toPeer
    };
    mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).count(query, function (err, count) {
        if(!err){
            result.openNum=count;
            result.success=true;
            callback(result);
        }else{
            logger.app.error(err);
            callback(result);
        }
    });
},

exports.assignByRoundMemory=function(peer, callback){
    var url = config.assignUrl;
    var urls = url.split(":");
    var ports = urls[2].split(",");
    var mod = peer % ports.length;
    var assignUrl = urls[0]+":"+urls[1]+":"+ports[mod]+"/assign";
    logger.app.info(peer+"----"+assignUrl);
    httpProvider.sendPost(assignUrl, "action=emailAssginByRound&data="+JSON.stringify({peer:peer}), function(err, res){
        var agent = "";
        try{
            res = JSON.parse(res.toString());
            console.log(res);
            agent = res.agent;
        }catch (e){
          logger.app.error(e);
        }
        callback(null, agent);
    })
};

exports.assignByLeast = function(peer, callback){
    Thenjs(function(cont){
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: peer}, cont);

    }).then(function(cont, queue){
        if(queue){
            var agents = queue.AssignMembers;
            if(agents.length>0){
                var agentIds = [];
                for(var i=0; i< agents.length; i++){
                    agentIds.push(agents[i].agentID);
                }
                mongo.db().collection('app_push_client').find({_id: {$in: agentIds}}).toArray(cont);
            }else{
                cont("not found peer agents");
            }
        }else{
            cont("not found peer queue" + peer);
        }
    }).then(function(cont, docs){
        if(docs){
            var agent = docs[0]._id;
            var tempNum = docs[0].currDealEmailNum;
            for(var i=0; i< docs.length; i++){
                var doc = docs[i];
                var currDealEmailNum = doc.currDealEmailNum || 0;

                if(tempNum >= currDealEmailNum){
                    tempNum = currDealEmailNum;
                    agent = doc._id;
                }
            }
            callback(null, agent);
        }else{
            cont("not found login agent");
        }

    }).fail(function(cont,err){
        console.log("0003323");
        logger.app.error(err);
        callback(err);
    });
}

/**
 * 将邮件推送给座席
 * @param msg
 * @param callback
 */
exports.pushEmailToAgent=function(msg, callback){
    var result = {success:false};
    mongo.db().collection('app_push_client').findOne({_id: msg.userId}, function(err, doc){
        if(err){
            callback(result);
            return;
        }
        if(doc){
            logger.app.info("[mail]require push server agentId["+msg.userId+"] msg:"+ JSON.stringify(msg));
            httpProvider.sendGet("http://"+doc.pushServerIp+":"+doc.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(msg)), function(err, res){
                if(err) {
                    result.message = 'Sent mail require to push server error: ' + msg;
                    callback(result);
                    return;
                }
                var resData = {};
                try{
                    resData = JSON.parse(res.toString());
                }catch(e){
                    logger.app.error(e);
                }
                if(!resData.success){
                    result.message = resData.message;
                    callback(result);
                    return;
                }
                result.success = true;
                callback(result);
            });
        }else{
            callback({success: true, message:"agent is not online"});
        }
    })
}

exports.pushUndealNumToAllAgents = function(msg, callback){

    Thenjs(function(cont){
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: msg.eventData.Data.ToPeer}, cont);
    }).then(function(cont, queue){
        if(queue && queue.AssignMembers.length > 0){
            var pushUndealNumToAgent = function(agents){
                if(agents.length <=0){
                    callback();
                    return;
                }
                var agent = agents.pop();
                Thenjs(function(cont1){
                    exports.getAgentPeers({account:msg.eventData.Account,agentId:agent.agentID}, function(res){
                        cont1(null, res);
                    })
                }).then(function(cont1, res){
                    console.log(res);
                    if(res.peers){
                        exports.getUndealNum({toPeer: {$in:res.peers}},{user:{account: msg.eventData.Account}}, function(res2){
                            cont1(null, res2);
                        });
                    }else{
                        cont1("next");
                    }
                }).then(function(cont1, res2){
                    console.log(res2);
                    if(res2.success){
                        var undealNum = res2.openNum; //待处理条数
                        msg.eventData.Data.undealNum = undealNum;
                        msg.userId = agent.agentID;
                        exports.pushEmailToAgent(msg,function(){});
                        pushUndealNumToAgent(agents);
                    }else{
                        cont1("next2");
                    }
                }).fail(function(cont1, err){
                    logger.app.error(err);
                    pushUndealNumToAgent(agents);
                });
            }

            pushUndealNumToAgent(queue.AssignMembers);

        }else{
            callback();
        }
    }).fail(function(cont, err){
        logger.app.error(err);
        callback();
    });
}

exports.getAgentPeers = function(data, callback){
    var result = {success:false};
    var q = {
        Account: data.account,
        'AssignMembers.agentID':data.agentId
    };
    mongo.db().collection(fields.DB_APP_MAIL_QUEUE).find(q).toArray(function(err, docs){
        if (!err) {
            docs=docs||[];
            if(docs.length>0){
                var qIds=[];
                for(var i=0;i<docs.length;i++){
                    var obj=docs[i];
                    qIds.push(obj.Exten);
                }
                result.success = true;
                result.peers = qIds;
                callback(result);
            }else{
                result.list = [];
                result.count = 0;
                result.success = true;
                callback(result);
            }
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
}

exports.notifyAgent = function(data, callback){
    if(data.type == "sendMailStatus"){
        var status = "success";
        if(data.code == "000"){
            status = "success";
        }else if(data.code == "020"){
            status = "fail";
        }
        mongo.db().collection(fields.APP_EMAIL_MAILS).update({_id: data.mailId},{$set:{status:status}});
    }
    data.emailStatus = status;

    var msg = {eventData: {Event:'NewEmailNotify', Account:data.account, Data:data}};
    msg.userId = data.agent;
    msg.eventData.Foryou = true;
    exports.pushEmailToAgent(msg, function(pushRes){
        callback(pushRes);
    });
}
exports.updateLogoutMailAutoClaimTime = function(data,callback){
    var result = {success:true};
    callback(result);
    var currTime = utils.getCurrentDate();
    var setDoc = {
        lastOpenedTime: currTime,
        lastClosedTime: currTime,
        agentStatus:"offline"
    };
    if(data &&　data.sessionId){
        mongo.db().collection(fields.APP_AGENT_AUTOCLAIM_INFO).findAndModify({_id:data.sessionId},[],{$set:setDoc},function(err,agent){
            if (!err && agent) {
                var reportData = {
                    reportTime: currTime,
                    reportType: reportEvent.EventType.MAIL_SOCKET_PUSH_DISCONNECT,
                    agentId: agent._id,
                    account: agent.account,
                    status: data.emailStatus || agent.lastClaimStatus,
                    lastOpenedTime: agent.lastOpenedTime,
                    lastClosedTime: agent.lastClosedTime
                };
                reportEvent.emitMailReportEvent(reportData);
            }
        });
    }
}
