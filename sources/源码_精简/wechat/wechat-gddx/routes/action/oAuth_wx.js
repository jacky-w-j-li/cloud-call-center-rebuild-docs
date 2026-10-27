var config = require('../../config');
var log = require('appLog');
var http = require('appHttp');
var utils = require('appUtil/Utils');
var db = require('appDb/MongoDb');
//var schedule = require("node-schedule");
var Thenjs = require("thenjs");
var _ = require('underscore');
var messageHandler  = require('./messageHandler.js');

/**
 * 公众号网页授权信息
 *param[code,state,appId]
 *state：用作表示哪一个菜单按钮的操作 （目前为评价）
 */
module.exports.oAuthWxInfo = function (req, res) {
    console.log("hello ,你好啊啊啊啊啊");
    var code = req.query.code || "",
        state_way = req.query.state || "",
        appId = req.query.appid || "",
        result = {success:false,appId:"",openId:"",account:"",way:"",err:""};

    if (!code || !state_way || !appId) {
        log.app.warn('params is err !!!!!!!');
        res.render('evalute', {err: "params fail", success: false, code:"10006",csrDic:null});
        return;
    }
    var state = state_way.split("_")[0], way = state_way.split("_")[1];
    log.app.info("oAuthWxInfo req query: code=" + code + "state=" + state + "appId=" + appId);
    Thenjs(function (cont) {
        db.db().collection("wxaccount").findOne({authorizer_appid: appId}, cont);
    }).then(function(cont,doc){
        if(doc){
            if(!doc.webchat_csr == true){
                 result.err=  appId+'该账号没有开启客户满意度调查';
                 result.errcode = '10006'; //没有开启满意度调查
                 cont(result);
            }else{
                 cont(null, doc);
            }
        }else{
            result.err =  appId+'没有获取到该微信账号在平台的配置信息';
            result.errcode = '10006';
            cont(result);
        }
    }).then(function (cont, wxAccount) {
        db.db().collection("component").findOne({component_appid: wxAccount.appId}, function (err, component) {
            if (!err && component) {
                cont(null, wxAccount, component || {})
            } else {
                result.err = "component findOne by component_appid err" + wxAccount.appId;
                result.errcode = '10006';
                cont(result);
            }
        });
    }).then(function (cont, wxAccount, component) {
        getCodeData(appId, code, component.component_appid, component.component_access_token, function (err, codeInfo) {
            if (!err && codeInfo) {
                cont(null, codeInfo.openid || "", wxAccount);
            } else {
                result.err =  "getCodeData codeInfo err";
                result.errcode = "10006";
                return cont(result);
            }
        });
    }).then(function (cont, openId, wxAccount) {
        if (!openId) {
            result.err = "parse [oAuthWxInfo] openId is null!";
            result.errcode = "10006";
            cont(result);
            return;
        }
        var postData = {
            sid:openId,
            account:wxAccount.account,
            action:"getCsrConfig",
            platform:'weixin'
        }
        http.sendPost(config.gateway_uri, "data="+JSON.stringify(postData), function (e, result) {
            log.app.info('oAuth_wx  收到gateway回复：' + result);
            try{
                result = JSON.parse(result);
                result.appId= appId;
                result.openId= openId;
                result.account= wxAccount.account;
                result.way= way;
                result.err = "";
                result.csrDic = result.csrDic || [];

                result.errcode = result.code || "10006";
                res.render(state, result);
            }catch (e){
                cont({success:false, errcode:'10006',err:e, csrDic:[]});
            }
        });
    }).fail(function (cont, err) {
        log.app.warn("process [oAuthWxInfo] error !!", err || new Error(""));
        err.csrDic = [];
        res.render(state, err);
    });
}
/**微信提交评价
 *param[msg,openId,appId]
 */
module.exports.sendImCSRInfo = function (action, callback) {
    log.app.info("sendImCSRInfo actionInfo" + JSON.stringify(action));
    var actionInfo = {
        appId: action.appId,
        openId: action.openId,
        satisfaction: action.satisfaction,
        appraiseKey: action.appraiseKey,
        label: action.label,
        proposal: action.proposal,
        way: action.way
    }, result = {success: false};
    if (!actionInfo.appId || !actionInfo.openId || !actionInfo.satisfaction) {
        log.app.warn('saveImCSRInfo actionInfo params is err !!!!!!!');
        result.errMsg="提交评价，参数不完整，请检查"
        callback(JSON.stringify(result));
    }
    actionInfo = _.extend(actionInfo, {isNewVisitor: false});
    sendToGW("sendImCSRInfo", actionInfo, function (result) {
        callback(JSON.stringify(result));
    });
}
/**坐席推送评价消息
 *param[msg,openId,appId]
 */
module.exports.pushImCSRInfo = function (action, callback) {
    log.app.info("pushImCSRInfo actionInfo" + JSON.stringify(action));
    var result = {success: false};
    if (!action.sid || !action.account) {
        result.errMsg = "wechat pushImCSRInfo params err"
        callback(JSON.stringify(result));
    };
    var actionInfo = {
        sid: action.sid,
        account: action.account,
        contentType: 'text',
    };
    Thenjs(function (cont) {
        db.db().collection("wx_user").findOne({openid: actionInfo.sid}, cont);
    }).then(function (cont, user) {
        if (user) {
            actionInfo.appid = user.appid;
            db.db().collection("wxaccount").findOne({authorizer_appid: actionInfo.appid,account: actionInfo.account}, cont);
        } else {
            result.errmsg = "user is null：" + actionInfo.sid;
            log.app.info(result.errmsg);
            cont(result.errmsg);
        }
    }).then(function (cont, wxaccount) {
        if (wxaccount) {
           var href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + actionInfo.appid + "&redirect_uri=" + config.localhost + "/oAuthWx&response_type=code&scope=snsapi_base&state=evaluate_out&component_appid=" + wxaccount.appId + "#wechat_redirect";
            actionInfo.content = "请您对我的本次服务做出评价,谢谢~  <a href='" + href + "'>点击进行评价</a>";
            messageHandler.sendMsg(actionInfo, function (err) {
                if (err == "success") {
                    result.success = true;
                    callback(JSON.stringify(result));
                } else {
                    cont(err);
                }
            });
        } else {
            result.errmsg = "wxaccount is null: authorizer_appid" + actionInfo.appid + "account:" + actionInfo.account;
            log.app.info(result.errmsg);
            cont(result.errmsg);
        }
    }).fail(function (cont, err) {
        log.app.info(err);
        callback(JSON.stringify(result));
    });
}
/**获取满意度配置
 *param[account]
 */
module.exports.getCsrDic = function (req, res) {
    var account = req.query.account||"", result = {success: false};
    log.app.info("getCsrDic account:" + account);
    if (!account) {
        log.app.warn('getCsrDic  params is err !!!!!!!');
        result.errmsg = "获取满意度参数不完整！";
        res.jsonp(result);
        return;
    }
    db.db("cc").collection("app_channel_dic").findOne({type: "webchatCSR", account: account}, function (err, DicInfo) {
        if (!err && DicInfo) {
            log.app.info("result.csrDi  " + JSON.stringify(DicInfo.options));
            result.csrDic = DicInfo.options;
            result.success = true;
            res.jsonp(result);
            return;
        } else {
            log.app.error("getCsrDic dic info err", err);
            result.errmsg = "该网站在线客服没有开启客户满意度调查"
            res.jsonp(result);
            return;
        }
    });
}
/**提交会话之前校验
 *param[account]
 */
module.exports.checkSession = function (req, res) {
    var result = {success: false};
    var openid= req.query.openid||"";
    log.app.info("checkSession openid :" + req.query.openid);
    if (!openid) {
        log.app.warn('getCsrDic  params is err !!!!!!!');
        result.errmsg = "您的用户标识为空，请重新操作！";
        res.jsonp(result);
        return;
    }
    db.db("cc").collection("app_multi_channel_chat_session").findOne({ sid: openid, status: {$nin: ['finish', 'changePeer']}, leavemsg: {$ne: true}}, function (err, session) {
        if (err) {
            log.app.info("find app_multi_channel_chat_session err " + err);
            result.errmsg = "查询会话有误，请确认会话是否存在！";
            res.jsonp(result);
            return;
        }
        if (session) {
            if (session.status == "robot") {
                result.errmsg = "会话由机器人处理，无法评价！";
                log.app.info("find app_multi_channel_chat_session  " + result.errmsg);
                res.jsonp(result);
                return;
            } else {
                var query = {
                    account   :session.account,
                    sessionId : session._id
                };
                db.db("cc").collection('app_kefu_im_csr').findOne(query,function(e,data){ //判断是否已经评价过了
                    if(!e && data){
                        result.errmsg = '您已经评价过了，不能重复评价!';
                        res.jsonp(result);
                        return;
                    }else{
                        result.success = true;
                        res.jsonp(result);
                        return;
                    }
                });
            }
        } else {
            result.errmsg = "暂无会话，无法评价！";
            log.app.info("find app_multi_channel_chat_session  " + result.errmsg);
            res.jsonp(result);
            return;
        }
    });
}

//根据code获取该微信用户的信息
function getCodeData(appid, code, component_appid, component_access_token, cb) {
    /*https://api.weixin.qq.com/sns/oauth2/component/access_token?appid=APPID&code=CODE&grant_type=authorization_code&component_appid=COMPONENT_APPID&component_access_token=COMPONENT_ACCESS_TOKEN*/
    var url = "https://api.weixin.qq.com/sns/oauth2/component/access_token?appid=" + appid + "&code=" + code + "&grant_type=authorization_code&component_appid=" + component_appid + "&component_access_token=" + component_access_token;
    http.sendHttps(url, function (err, result) {
        cb(err, JSON.parse(result|| {}) );
    });
}
/**
 * 发送给getway的方法
 * @param action
 * @param fromUser
 * @param appId
 * @param content
 * @param contentType
 * @param isNewVisitor
 */
var sendToGW = function (action, data, callback) {
    log.app.info("sendToGW data========:"+JSON.stringify(data))
    var result = {success: false};
    db.db().collection('wx_user').findOne({_id: data.openId}, ['nickname'], function (err, user) {
        if (user) {
            db.db().collection('wxaccount').findOne({_id: data.appId}, ['_id', 'account', 'to_peer'], function (err, doc) {
                if (doc) {
                    if (doc.to_peer) {
                        try {
                            var postData = {
                                action: action,
                                account: doc.account,
                                accessId: doc._id,
                                sid: data.openId,
                                nickName: encodeURIComponent(encodeURIComponent(user.nickname)),
                                dateTime: utils.getCurrentDate(),
                                when: utils.getCurrentDateTime(),
                                platform: 'weixin',
                                contentType: "text",
                                isNewVisitor: data.isNewVisitor,
                                way: data.way || "in",
                                satisfaction: data.satisfaction,
                                appraiseKey: data.appraiseKey,
                                label: data.label,
                                proposal: data.proposal,
                                showHtml: data.showHtml || false,
                                notShow: data.notShow || false,
                                status: "finish",
                                type: "weixincsr"
                            };
                            var str = 'data=' + JSON.stringify(postData);
                            log.app.info('oAuth_wx  消息发送给gateway: ' + str);
                            for(var key in postData){
                                postData[key] = encodeURIComponent(postData[key]);
                            }
                            http.sendPost(config.gateway_uri, str, function (postErr, result) {
                                if (postErr) {
                                    log.app.error(postErr);
                                    return callback(result);
                                }

                                log.app.info('oAuth_wx  收到gateway回复：' + result);
                                try {
                                    result = JSON.parse(result);
                                } catch (parseErr) {
                                    log.app.error(parseErr);
                                    result = { success: false };
                                }
                                return callback(result)
                            });
                        } catch (e) {
                            log.app.error(e);
                            return callback(result);
                        }

                    } else {
                        log.app.warn('没有配置技能组: ' + data.appId);
                        result.errMsg='没有配置技能组: ' + data.appId
                        return callback(result);
                    }
                } else {
                    log.app.warn('account not found: ' + data.appId);
                    result.errMsg='account not found: ' + data.appId
                    return callback(result);
                }
            });
        }
    });
}