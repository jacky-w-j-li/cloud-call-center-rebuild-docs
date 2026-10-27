/**
 * Created by zhangyang on 15/5/6.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/m7/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");


var handler = {
    leaveMessage: function(data, callback){
        var result = {success: false};
        data.notShow = true;
        data.contentType = "text";
        data.status = "undeal";
        data.type = "in";
        if(data.platform == "pc" || data.platform == "wap"){
            data.message = "来源：<a target='_blank' href='"+data.fromUrl+"'>"+data.fromUrl+"</a>"+"</br>内容："+data.message+"</br>电话：" + data.phone + "</br>邮箱："+ data.email;
            data.showHtml = true;
        }else if(data.platform == "sdk"){
            data.message = "来源：app端"+"</br>内容："+data.message+"</br>电话：" + data.phone + "</br>邮箱："+ data.email;
            data.showHtml = true;
        }

        _impl.saveNewMsgFromCustomer(data, function(err, leaveMsg){
            if(!err){
                //推送给处理服务器
                var postData = {
                    Action: "NewWebchat",
                    Sid: data.sid,
                    MsgType: "leaveMessage",
                    MessageId: leaveMsg._id,
                    Account: data.account,
                    AccessId: data.accessId,
                    CreateTime: leaveMsg.dateTime,
                    Platform: data.platform,
                    NickName: data.nickName,
                    FromUrl: data.fromUrl,
                    UrlTitle: data.urlTitle,
                    ToPeer: data.toPeer,
                    SeoSource: data.seoSource,
                    SeoKeywords: data.seoKeywords,
                    Ip: data.ip,
                    Content: data.message
                };
                _impl.pushNewImMessage(postData, function (success) {
                    logger.app.info("im push " + (success ? "success" : "failure"));
                    if(success){
                        result.success = true;
                        callback(result);
                    }else{
                        callback(result);
                    }
                });
            }else{

            }
        });

    },
    convertManual: function(data, callback){
        var result = {success: false};
        //推送给处理服务器
        var postData = {
            Action: "NewWebchat",
            Sid: data.sid,
            MsgType: "convertManual",
            Account: data.account,
            AccessId: data.accessId,
            CreateTime: utils.getCurrentDate(),
            MessageId: utils.UUID.generateUuid(),
            Platform: data.platform,
            NickName: data.nickName
        };
        if (data.platform == "weixin") {
            postData.IsNewVisitor = data.isNewVisitor;
            if(data.words){
                postData.Words = true;
            }
        }
        _impl.pushNewImMessage(postData, function (success) {
            logger.app.info("im push " + (success ? "success" : "failure"));
            if(success){
                result.success = true;
                callback(result);
            }else{
                callback(result);
            }
        });
    },

    imConn: function (data, callback) {
        var result = {success: true};

        //推送给处理服务器
        var postData = {
            Action: "NewWebchat",
            Account: data.account,
            Sid: data.sid,
            MsgType: "newConn",
            AccessId: data.accessId,
            CreateTime: utils.getCurrentDate(),
            MessageId: utils.UUID.generateUuid(),
            Platform: data.platform,
            NickName: data.nickName,
            FromUrl: data.fromUrl,
            UrlTitle: data.urlTitle,
            IsNewVisitor: data.isNewVisitor || false,
            ToPeer: data.toPeer,
            SeoSource: data.seoSource,
            SeoKeywords: data.seoKeywords,
            Ip: data.ip,
            OtherParams:data.otherParams,
            NoRobot:data.noRobot
        };
        if(data.sdkAndroidVersionCode){
            postData.sdkAndroidVersionCode = data.sdkAndroidVersionCode;
        }
        if(data.sdkIosVersionCode){
            postData.sdkIosVersionCode = data.sdkIosVersionCode;
        }
        _impl.pushNewImMessage(postData, function (success) {
            logger.app.info("im push " + (success ? "success" : "failure"));
            callback(result);
        });

    },

    imDisconnect: function (data, callback) {
        var result = {
            success: false
        };
        //推送给状态服务器
        var postData = {
            Action: "NewWebchat",
            Account: data.account,
            Sid: data.sid,
            MsgType: "disConn",
            CreateTime: utils.getCurrentDate(),
            AccessId: data.accessId,
            MessageId: utils.UUID.generateUuid(),
            Platform: data.platform
        };
        _impl.pushNewImMessage(postData, function (success) {
            logger.app.info("im push " + (success ? "success" : "failure"));
        });
        result.success = true;
        callback(result);


    },

    /**
     * 客服im，客户新发消息
     */
    newMsg: function (data, callback) {
            var result = {success: false};

        //入库
        _impl.saveNewMsgFromCustomer(data, function (err, message) {
            if (!err) {
                result.success = true;
                result.when = message.when;
                callback(result);
                //推送给状态服务器
                var postData = {
                    Action: "NewWebchat",
                    Account: data.account,
                    Sid: data.sid,
                    MessageId: message._id,
                    CreateTime: message.dateTime,
                    MsgType: "newMsg",
                    AccessId: data.accessId,
                    Content: message.message,
                    Platform: data.platform,
                    ContentType: data.contentType,
                    NickName: data.nickName,
                    NotShow: data.notShow,
                    ShowHtml: data.showHtml == "true" || data.showHtml == true? true: false,
                    when: message.when
                };
                if(data.platform=="weixin"){
                    postData.IsNewVisitor=data.isNewVisitor;
                }
                _impl.pushNewImMessage(postData, function (success) {
                    logger.app.info("im push " + (success ? "success" : "failure"));
                });


            } else {
                result.message = "保存信息失败！";
                callback(result);
            }
        });
    },
    getMsg: function (data, callback) {
        if(data.platform == "sdk"){
            handler.getSdkMsg(data, callback);
        }else{
            handler.getPcMsg(data, callback);
        }
    },

    getSdkMsg: function(data, callback){
        var result = {success: false};
        var receivedMsgIds = data.receivedMsgIds;
        mongo.db().collection(fields.DB_APP_KEFU_IM_NOTIFY).remove({tonotify:data.sid, msgId: {$in:receivedMsgIds}},{w:1}, function(err){
            if(!err){
               mongo.db().collection(fields.DB_APP_KEFU_IM_NOTIFY).find({tonotify:data.sid}).toArray(function(err, docs){
                   var msgIds = [];
                   for(var i=0; i<docs.length; i++){
                        msgIds.push(docs[i].msgId);
                   }
                   var sort = {when: 1};
                   mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).find({sid:data.sid, _id:{$in: msgIds}}).sort(sort).toArray(function (err, imDocs) {
                       if (!err && imDocs) {
                           var msg = [];
                           for (var i = 0; i < imDocs.length; i++) {
                               var message = {
                                   _id: imDocs[i]._id,
                                   sid: imDocs[i].sid,
                                   when: imDocs[i].when,
                                   dateTime: imDocs[i].dateTime,
                                   content: imDocs[i].message,
                                   contentType: imDocs[i].contentType,
                                   showHtml: imDocs[i].showHtml || false
                               };
                               msg.push(message);
                           }
                           result.data = msg;
                           result.success = true;
                           callback(result);

                       } else {
                           result.message = "get sdk msg failed[" + data.sid + "]";
                           callback(result);
                       }
                   });
               });
            }else{
                logger.app.error("get sdk msg failed[" + data.sid + "]");
                result.message = "get sdk msg failed[" + data.sid + "]";
                callback(result);
            }
        });


    },

    getPcMsg: function (data, callback) {
        var result = {success: false};
        var condition = {
            sid: data.sid
        };
        var sort = {};
        if (data.history) {
            sort = {when: -1};
            if (data.lastTime && data.lastTime != undefined && data.lastTime != "undefined") {
                condition.when = {$lt: data.lastTime};
            }

        } else {
            sort = {when: 1};
            if(data.since){
                condition.when = {$gt: data.since};
            }else{
                condition.status = data.status;
            }
            condition.type = data.type;
        }


        mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).find(condition).sort(sort).limit(data.pageSize || 50).toArray(function (err, docs) {
            if (!err && docs) {
                var msg = [];
                var ids = [];
                var userId = "";
                var userIds = [];
                for (var i = 0; i < docs.length; i++) {
                    ids.push(docs[i]._id);
                    if(userIds.indexOf(docs[i].user)== -1){
                        userIds.push(docs[i].user)
                    }
                    if (userId == "" || userId == null) {
                        userId = docs[i].user;
                    }
                    console.log(docs[i]);
                    var message = {
                        _id: docs[i]._id,
                        sid: docs[i].sid,
                        when: docs[i].when,
                        dateTime: docs[i].dateTime,
                        content: docs[i].message,
                        contentType: docs[i].contentType,
                        type: docs[i].type,
                        showHtml: docs[i].showHtml || false,
                        notShow: docs[i].notShow || false,
                        userId:docs[i].user || ""
                    };

                    if(docs[i].user == "system"){
                        message.user = "system";
                    }
                    msg.push(message);
                }

                if (data.history) {
                    if (msg.length <= 0) {
                        result.data = [];
                        result.success = true;
                        callback(result);
                    } else {
                        result.data = msg;
                        mongo.db("bill").collection(fields.DB_APP_PLATFORM_USER).find({"_id":{$in:userIds}}).toArray(function (err, users) {
                            if(!err){
                                var userList ={};
                                for(var j =0;j<users.length;j++){
                                    var user = users[j];
                                    userList[user._id]={};
                                    userList[user._id].displayName=user.displayName;
                                    userList[user._id].exten=user.exten;
                                }
                                //
                                result.data[0].users=userList;
                                result.success = true;
                                callback(result);
                            }else{
                                result.message = "[getMsg]find error";
                                callback(result);
                            }
                        });
                    }
                } else {
                    mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).update({_id: {$in: ids}, status:'undeal'}, {$set: {status: "deal"}}, {multi: true, w:1}, function (err, r) {
                        if (!err) {
                            if(r <= 0){
                                msg = [];
                            }
                            result.data = msg;
                            mongo.db("bill").collection(fields.DB_APP_PLATFORM_USER).find({"_id":{$in:userIds}}).toArray(function (err, users) {
                                if(!err){
                                    var userList ={};
                                    for(var j =0;j<users.length;j++){
                                        var user = users[j];
                                        userList[user._id]={};
                                        userList[user._id].displayName=user.displayName;
                                        userList[user._id].exten=user.exten;
                                    }
                                    //
                                    if(result.data[0]){
                                        result.data[0].users=userList;
                                    }
                                    result.success = true;
                                    callback(result);
                                }else{
                                    result.message = "[getMsg]find error";
                                    callback(result);
                                }
                            });
                        } else {
                            result.message = "[getMsg]update error";
                            callback(result);
                        }
                    });
                }
            } else {
                result.message = "get msg failed[" + data.sid + "]";
                callback(result);
            }
        });
    },

    newIm: function (data, callback) {
        var result = {success: false};
        //通过 sid 获取账户id
        var sid = data.sid || "";
        _impl.getImAccount(sid, function (account) {
            if (account) {
                delete data.sid;
                data.account = account.account;
                data.status = "undeal";
                data.type = "in";
                //入库
                _impl.saveIm(data, function (err) {
                    if (!err) {
                        //获取pbx的信息
                        _impl.getPbxInfo(account.account, function (pbx) {
                            if (pbx) {
                                //推送给状态服务器
                                _impl.pushMessage(pbx, data, function (success) {
                                    logger.app.info("im push " + success ? "success" : "failure");
                                });
                            } else {
                                logger.app.error("can not found pbx info!");
                                callback(result);
                            }
                        });
                        result.success = true;
                        callback(result);

                    } else {
                        result.message = "保存信息失败！";
                        callback(result);
                    }
                });
            } else {
                result.message = "can not found account!";
                callback(result);
            }
        });
    },

    investigate: function(data, callback){
        var result = {success: true};
        callback(result);
        //推送给处理服务器
        var postData = {
            Action: "NewWebchat",
            Account: data.account,
            Sid: data.sid,
            MsgType: "investigate",
            AccessId: data.accessId,
            CreateTime: data.dateTime,
            When: data.when,
            MessageId: utils.UUID.generateUuid(),
            Content: data.message,
            Platform: data.platform,
            Investigate: data.investigate
        };
        _impl.pushNewImMessage(postData, function (success) {
            logger.app.info("sdk investigate push " + (success ? "success" : "failure"));
        });
    },


    /**
     * 接受客户的满意度调查数据
     * @param data
     * @param callback
     */
    sendImCSRInfo: function (data, callback) {
        var result = { success: false };
        var dbData = {
            accessId    : data.accessId,
            account     : data.account,
            contentType : 'text',
            dateTime    : utils.getCurrentDate(),
            message     : decodeURIComponent('用户已评价：'+data.satisfaction),
            nickName    : data.username,
            notShow     : data.notShow,
            showHtml    : data.showHtml || false,
            platform    : data.platform,
            sid         : data.sid,
            status      : data.status,
            type        : data.type,
            when        : utils.getCurrentDateTime()

        }
        _impl.saveNewMsgFromCustomer(dbData, function (err, message) {
            if(!err){
                //推送给状态服务器
                var postData = {
                    Action     : "NewWebchat",
                    MessageId  : message._id,
                    message    : dbData.message,
                    Account    : data.account,
                    Sid        : data.sid,
                    AccessId   : data.accessId,
                    MsgType    : "saveImCSRInfo",
                    Platform   : data.platform,
                    when       : message.when,
                    createTime : utils.getCurrentDate(),
                    isInvestigate:data.isInvestigate || false,
                    appraise   : {
                        way         : data.way,
                        satisfaction: data.satisfaction,
                        appraiseKey : data.appraiseKey,
                        label       : data.label,
                        proposal    : data.proposal,
                    }
                };
                _impl.pushNewImMessage(postData, function (success) {
                    logger.app.info("im push " + (success ? "success" : "failure"));
                    if(success){
                        result.success = true;
                        callback(result);
                    }else{
                        callback(result);
                    }
                });
            }else{
                result.message = "保存信息失败！";
                callback(result);
            }
        });
    },
    /**
     * 发送常见问题信息
     * @param data
     * @param callback
     */
    sendImQAMsg:function(data,callback){
        var result = {success: false};

        //入库
        _impl.saveNewMsgFromCustomer(data, function (err, message) {
            if (!err) {
                result.success = true;
                result.when = message.when;
                callback(result);
                //推送给状态服务器
                var postData = {
                    Action      : "NewWebchat",
                    Account     : data.account,
                    Sid         : data.sid,
                    MessageId   : message._id,
                    CreateTime  : message.dateTime,
                    MsgType     : "sendImQAMsg",
                    AccessId    : data.accessId,
                    Content     : message.message,
                    QAMsgId     : data.qaMsgId,
                    Platform    : data.platform,
                    ContentType : data.contentType,
                    NickName    : data.nickName,
                    NotShow     : data.notShow,
                    ShowHtml    : data.showHtml == "true" || data.showHtml == true? true: false
                };
                _impl.pushNewImMessage(postData, function (success) {
                    logger.app.info("im push " + (success ? "success" : "failure"));
                });
            } else {
                result.message = "保存信息失败！";
                callback(result);
            }
        });
    },

    getCsrConfig:function(data, callback){
        var postData = {
            Sid:data.sid,
            Action: "getImCsrConfig",
            Account: data.account
        }
        _impl.getInfoCallback(postData, function(res){
            callback(res);
        })
    },
    typeNotice:function(data,callback){
        var result = {
            success: false
        };
        //推送给状态服务器
        var postData = {
            Action: "typeNoticeFromCustomer",
            Account: data.account,
            Sid: data.sid,
            _id:data._id,
            TimeStamp: data.timestamp,
            Content: data.message,
        };
        _impl.pushNewImMessage(postData, function (success) {
            logger.app.info("im push " + (success ? "success" : "failure"));
        });
        result.success = true;
        callback(result);
    }
};

var _impl = {
    emojiFaces : [
        [':smile:' , ':smiley:' , ':laughing:' , ':blush:'] ,
        [':heart_eyes:' , ':smirk:' , ':flushed:' , ':kissing_heart:'] ,
        [':grin:' , ':wink:' , ':stuck_out_tongue_winking_eye:' , ':stuck_out_tongue_closed eyes:'] ,
        [':sleeping:' , ':worried:' , ':expressionless:' , ':sweat_smile:'] ,
        [':joy:' , ':cold_sweat:' , ':sob:' , ':angry:'] ,
        [':mask:' , ':scream:' , ':sunglasses:' , ':heart:'] ,
        [':broken_heart:' , ':star:' , ':anger:' , ':exclamation:'] ,
        [':question:' , ':zzz:' , ':thumbsup:' , ':thumbsdown:'] ,
        [':ok_hand:' , ':punch:' , ':yeah:' , ':clap:'] ,
        [':muscle:' , ':pray:' , ':skull:' , ':trollface:']
    ] ,

    weixinEmojiCode : [
        ['\ue415' , '\ue057', '\ue40a', '\ue056'],
        ['\ue106', '\ue402', '\ue40d', '\ue418'],
        ['\ue404', '\ue405', '\ue105', '\ue409'],
        ['\ue408', '\ue058', '\ue403', '\ue415'],
        ['\ue412', '\ue40f', '\ue411', '\ue059'],
        ['\ue40c', '\ue107', '\ue414', '\ue022'],
        ['\ue023', '\ue32f', '\ue334', '\ue337'],
        ['\ue336', '\ue13c', '\ue00e', '\ue421'],
        ['\ue420', '\ue00d', '\ue011', '\ue41f'],
        ['\ue14c', '\ue41d', '\ue11c', '\ue10c']
    ],

    adaptEmojiForWeixin: function(content){
        for (var i = 0; i < _impl.weixinEmojiCode.length; i++) {
            for (var j = 0; j < _impl.weixinEmojiCode[i].length; j++) {
                var pattern = new RegExp(_impl.weixinEmojiCode[i][j], "g");
                if (content == undefined || content == null || content == "") return;
                content = content.replace(pattern, _impl.emojiFaces[i][j]);
            }
        }
        return content;
    },
    saveNewMsgFromCustomer: function (data, callback) {

        var content = "";
        try{
            content = decodeURIComponent(data.message)
        }catch(e){
            content = data.message.replace(/%26/g, "&");
            content = content.replace(/%23/g, "#");
            content = content.replace(/%3A/g, ":");
            content = content.replace(/%24/g, "$");
            content = content.replace(/%40/g, "@");
            content = content.replace(/%3D/g, "=");
            content = content.replace(/%2B/g, "+");
            content = content.replace(/%2F/g, "/");

        }
        if(data.platform == "weixin"){
            content = _impl.adaptEmojiForWeixin(content);
            data.message = encodeURIComponent(content);
        }
        //sdk的一个bugfix
        content = content.replace(/:stuck_out_tongue_closed\+eyes:/g, ":stuck_out_tongue_closed eyes:");
        var message = {
            _id: data._id || utils.UUID.generateUuid(),
            account: data.account,
            sid: data.sid,
            contentType: data.contentType || "",
            message: content || "",
            platform: data.platform || "",
            when: utils.getCurrentDateTime(),
            dateTime: utils.getCurrentDate(),
            status: data.status || "",
            type: data.type || "",
            accessId: data.accessId || "",
            showHtml: data.showHtml || false,
            notShow: data.notShow
        };
        console.dir(message);
        mongo.db().collection(fields.DB_APP_KEFU_IM_MESSAGE).insert(message, {w:1}, function (msgErr) {
                if (!msgErr) {
                    message.message = data.message;
                    callback(null, message);
                } else {
                    callback("insert im msg error");
                    return;
                }
            }
        );
    },

    /**
     * 推送给cc应用服务
     * @param postData
     * @param callback
     */
    pushNewImMessage: function (postData, callback) {
        logger.app.info("pushNewImMessage========postData======"+JSON.stringify(postData));
        var url = config.pushServiceUrl;
        var action = postData.Action;
        delete postData.Action;
        if(postData.Content){
            postData.Content = encodeURIComponent(postData.Content);
        }
        if(postData.FromUrl){
            postData.FromUrl = encodeURIComponent(postData.FromUrl);
        }
        if(postData.UrlTitle){
            postData.UrlTitle = encodeURIComponent(postData.UrlTitle);
        }
        if(postData.NickName){
            postData.NickName = encodeURIComponent(postData.NickName);
        }
        console.log(postData);
        httpProvider.sendPost(url, "action=" + action + "&data=" + JSON.stringify(postData), function (err, response) {
            if (!err) {
                var res = JSON.parse(response);
                if(res.success){
                    logger.app.info("success==============");
                    callback(true);
                }else{
                    logger.app.error("err=============="+JSON.stringify(postData), err);
                    callback(false);
                }
            } else {
                logger.app.error("err=============="+JSON.stringify(postData), err);
                callback(false);
            }
        });
    },
    getInfoCallback: function(postData, callback){
        var url = config.pushServiceUrl;
        var action = postData.Action;
        delete postData.Action;
        httpProvider.sendPost(url, "action=" + action + "&data=" + JSON.stringify(postData), function (err, response) {
            if (!err) {
                var res = JSON.parse(response);
                callback(res);
            } else {
                logger.app.error("err=============="+JSON.stringify(postData), err);
                callback({success:false});
            }
        });
    },

    pushMessage: function (pbx, data, callback) {
        var url = pbx.assAddr || "";

        var postData = {

            Action: "NewIm",
            ActionID: utils.UUID.generateUuid(),
            Account: data.account,
            PBX: pbx._id,
            UserID: data.userID,
            MessageId: data._id,
            MsgType: data.msgType,
            Content: data.content,
            CreateTime: data.createTime
        };

        httpProvider.sendPost(url, "json=" + JSON.stringify(postData), function (err, response) {
            if (!err) {
                callback(true);
            } else {
                callback(false);
            }
        });
    },
    getPbxInfo: function (accountId, callback) {
        var condition = {
            _id: accountId + "_cc"
        };
        mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne(condition, function (err, dbConfig) {
            if (!err && dbConfig) {
                var pbx = dbConfig.pbx;
                if (pbx && pbx[0]) {
                    var pbxId = pbx[0].PBX;
                    mongo.db("bill").collection(fields.DB_PLATFORM_PBX).findOne({_id: pbxId}, function (err, dbPBX) {
                        if (!err && dbPBX) {
                            callback(dbPBX);
                        } else {
                            logger.app.error("can not found  pbx by id[" + pbxId + "]");
                            callback(null);
                        }
                    });
                } else {
                    logger.app.error("valid  account pbx by id[" + accountId + "]");
                    callback(null);
                }

            } else {
                logger.app.error("not found account pbx by id[" + accountId + "]");
                callback(null);
            }
        });

    },
    saveIm: function (data, callback) {
        var time = Number(data.createTime);
        data.createTimeStamp = time;
        data.createTime = utils.DateTime.getDateFormat(new Date(time));
        mongo.db().collection(fields.DB_APP_IM).insert(data);
        callback(null);
    },
    getImAccount: function (sid, callback) {
        var condition = {
            sid: sid
        };
        mongo.db("bill").collection(fields.DB_APP_ACCOUNT_PRODUCT).findOne(condition, function (err, account) {
            if (!err && account) {
                callback(account);
            } else {
                logger.app.error("not found account by sid[" + sid + "]");
                callback(null);
            }
        });
    },

    getWebImAccount: function (account, callback) {
        var condition = {
            account: account
        };
        mongo.db("bill").collection(fields.DB_APP_ACCOUNT_PRODUCT).findOne(condition, function (err, accountDoc) {
            if (!err && accountDoc) {
                callback(accountDoc);
            } else {
                logger.app.error("found account error by account[" + account + "]");
                callback(null);
            }
        });
    }
};


module.exports = handler;
