var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var config = require('appConfig');
var appSession = require('appSession');
var actionHandler = require("./actionHandler");
var publicHandler = require("./publicHandler");
var wxHandler = require("./wxHandler");
var commandHandler = require('./commandHandler');
var formHandler = require('./formHandler');
var getFileHandler = require('./getFileHandler');
var taobaoHandler = require('./taobaoHandler');
var openServiceHandler = require('./openServiceHandler');
var xml2js = require('xml2js');

exports.default = function (req, res) {
    var serverConfig = require('appConfig');
    logger.app.info("get request / from["+utils.getReqIp(req)+"]");
    res.render("index.html", {title: "七陌运营系统", info: '7moor bill app server:' + serverConfig.version});
};

exports.routeCommand = function (req, res) {
    var data = req.query;
    var uuid = utils.UUID.generateUuid();
    logger.app.info("get request command["+uuid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(data));
    if (data.command && data.key && data.key === "7moorCommand") {
        var command = {
            name: data.command,
            data: data.data
        };
        commandHandler.handleCommand(command, res ,uuid);
    } else {
        utils.send403(res ,uuid);
    }
}

exports.routeTaobao = function (req, res) {
    taobaoHandler.handle(req, res);
}

exports.routePublic = function (req, res) {
    var action = parsePublicData(req);
    logger.app.info("get request public["+action._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(action));
    if (action.err) {
        utils.sendError(action.err.message, res , action._aid);
        return;
    }
    publicHandler.handleAction(action, res);
}

function parsePublicData(req) {
    var action = {};
    action._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        if (query.action && query.data) {
            action.name = query.action;
            action.data = JSON.parse(query.data);
            return action;
        } else {
            if(req.query.action == 'flowPackage.flowRechargeNotify'){
                action.name = req.query.action;
                console.log(req.body);
                var parser = new xml2js.Parser({
                    mergeAttrs: true
                });
                var xml = '';
                for(var s in req.body){
                    console.log(s)
                }
                parser.parseString(req.body, function (err, result) {
                    action.data = JSON.stringify(result);
                    console.dir(JSON.stringify(result));
                    return action;
                });
            }else{
                action.err = new Error('param error! your shoud check your param!');
                return action;
            }
        }
    } catch (e) {
        action.err = e;
        return action;
    }
}

exports.routeRest = function(req , res){
    var action = parseRestData(req);
    logger.app.info("get request public["+action._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(action));
    if (action.err) {
        utils.sendError(action.err.message, res , action._aid);
        return;
    }
    publicHandler.handleAction(action, res);
}

function parseRestData(req){
    var action = {};
    action._aid = utils.UUID.generateUuid();
    var url = req.url || "";
    try {
        var datas = url.split("/") || [];
        console.log(datas);
        if(datas.length > 5){
            action.name = datas[3]+"."+datas[4];
            if(action.name == 'register.completeRegiste'){
                var key = datas[5] || "";
                action.data = {key:key};
            } else {
                action.err= {
                    message :"404 not found!"
                };
            }
        } else {
            action.err= {
                message :"404 not found!"
            };
        }
    } catch (e) {
        action.err = e;
    }
    return action;
}

exports.routeWeixin = function (req, res) {
    logger.app.info("get request  weixin form ["+utils.getReqIp(req)+"]:" + JSON.stringify(req.query));
    var query = req.query;
    query.token = config.wx_token;
    if (utils.WeixinUtil.validateMsg(query)) {
        logger.app.info("response to weixin server : " + req.query.echostr);
        res.send(req.query.echostr);
    } else {
        logger.app.error("warn: rquest not come from weixin server!!!!", new Error());
    }
}

exports.routeWXmessage = function (req, res) {
    var data = req.body;
    var query = req.query;
    logger.app.info("get request  weixin form ["+utils.getReqIp(req)+"] :" + JSON.stringify(query));
    query.token = config.wx_token;
    if (utils.WeixinUtil.validateMsg(query)) {
        wxHandler.handleAction(data, function (err, result) {
            if (!err && result) {
                logger.app.info("response to weixin :" + JSON.stringify(result));
                utils.WeixinUtil.sendXml(result, res);
            } else {
                logger.app.info("response to weixin :" + JSON.stringify({}));
                utils.WeixinUtil.sendXml({}, res);
            }
        });
    } else {
        logger.app.error("warn: msg not come from weixin server!!!!", new Error());
    }
}

exports.routeFlowPackage = function (req, res) {
    var data = req.body;
    var query = req.query;
    logger.app.info("get request flowPackage form ["+utils.getReqIp(req)+"] :" + JSON.stringify(data));
    data.data = data;
    data.name = 'flowRechargeNotify';
    openServiceHandler.handleService(data, function (err, result) {
        if (!err && result) {
            logger.app.info("response to flowPackage :" + JSON.stringify(result));
            utils.WeixinUtil.sendYTXXml(result, res);
        } else {
            logger.app.info("response to flowPackage :" + JSON.stringify({}));
            utils.WeixinUtil.sendYTXXml({}, res);
        }
    });
}
exports.voiceVerify = function (req, res) {
    var data = req.body;
    var query = req.query;
    logger.app.info("get request voiceVerifyCallBack form ["+utils.getReqIp(req)+"] :" + JSON.stringify(data));
    data.data = data;
    data.name = 'voiceVerifyCallBack';
    openServiceHandler.handleService(data, function (err, result) {
        if (!err && result) {
            logger.app.info("response to voiceVerifyCallBack :" + JSON.stringify(result));
            utils.WeixinUtil.sendYTXXml(result, res);
        } else {
            logger.app.info("response to voiceVerifyCallBack :" + JSON.stringify({}));
            utils.WeixinUtil.sendYTXXml({}, res);
        }
    });
}

exports.routeGetFile = function (req, res) {
//    var download = parseDownloadData(req);
//    if (!download.err) {
//                    getFileHandler.handle(download, res);
//    } else {
//        utils.send500(res);
//    }
    var query = req.query;
    var uuid = utils.UUID.generateUuid();
    logger.app.info("get request getFile["+uuid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(query));
    if (query.fileId) {
        getFileHandler.handlerRange(req, res);
    } else {
        getFileHandler.handleExportFile(req, res);
    }

}

function parseDownloadData(req) {
    var download = {};
    try {
        var query = req.query;
        //download.sessionId = query.sessionId;
        download.fileId = query.fileId;
    } catch (e) {
        logger.app.error("parse request error", e);
        download.err = e;
    }
    return download;
}

exports.routeForm = function (req, res) {
    var form = parseFormData(req);
    logger.app.info("get request form["+form._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(form));
    if (form.err) {
        utils.sendError(form.err.message, res , form._aid);
        return;
    }
    if (form.sessionId) {
        appSession.checkSession(form.sessionId, function (err, session) {
            if (!err) {
                if (form.data.files) {
                    var length = form.data.files.length;
                    var index = 0;
                    var processor = function (file) {
                        var fileId = utils.UUID.generateUuid();
                        mongo.writeFileToDb(file.path, fileId, file.name, function (err) {
                            if (!err) {
                                form.data[file.key] = {fileId: fileId, name: file.name};
                                require("fs").unlink(file.path, function () {
                                });
                                index++;
                                if (index == length) {
                                    delete form.data.files;
                                    formHandler.handle(form, session, res);
                                } else {
                                    processor(form.data.files[index]);
                                }
                            } else {
                                logger.app.error("write file to db error!", err);
                                utils.sendError(err.message, res , form._aid);
                                return;
                            }
                        });
                    }
                    processor(form.data.files[index]);
                }
            } else {
                logger.app.error(err);
                utils.send500(res , form._id);
            }
        });
    } else {
        utils.send403(res , form._id);
    }
}


function parseFormData(req) {
    var form = {};
    form._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
            var files = req.files;
            if (files) {
                query.files = [];
                for (var key in files) {
                    query.files.push({key: key, path: files[key].path, name: files[key].name});
                }
            }
        }
        if (query.action) {
            form.action = query.action;
            form.sessionId = query.sessionId;
            delete query.sessionId;
            delete query.action;
            form.data = query;
        } else {
            form.err = new Error('param error! your shoud check your param!');
        }

    } catch (e) {
        form.err = e;
    }
    return form;
}

exports.routeAction = function (req, res) {
    var action = parseActionData(req)
    logger.app.info("get request action["+action._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(action));
    if (action.err) {
	console.log("debug:"+action.err)
        utils.sendError(action.err.message, res , action._aid);
        return;
    }
	console.log("debug:1")
    if (action.sessionId) {
        appSession.checkSession(action.sessionId, function (err, session) {
            if (!err) {
                actionHandler.handleAction(action, session, res);
            } else {
                logger.app.error(err);
                utils.send500(res, action._aid);
            }
        });
    } else if (action.name === 'login') {
        appSession.login(action, function (result) {
            utils.sendResult(result, res , action._aid);
        });
    } else if (action.name === 'app.thirdCustom.getDomainInfoById') {
        actionHandler.handleAction(action,null,res);
    } else {
        utils.send403(res , action._aid);
    }
}


function parseActionData(req) {
    var action = {};
    action._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        if (query.action && query.data) {
            action.name = query.action;
            action.data = JSON.parse(query.data);
            action.sessionId = query.sessionId;
//            just for ext
            if (query.limit)action.data.limit = query.limit;
            if (query.page)action.data.page = query.page;
//            end for ext
        } else {
            action.err = new Error('param error! your shoud check your param!');
        }

    } catch (e) {
        action.err = e;
    }
    return action;
}

exports.routeAction2Bill = function (req, res) {
    var action = parseActionData(req)
    logger.app.info("get request action["+action._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(action));
    if (action.err) {
        utils.sendError(action.err.message, res , action._aid);
        return;
    }
    console.info("routeAction2Bill:::sid====="+action.sessionId);
    if (action.sessionId) {
        appSession.checkCCSession(action.sessionId, function (err, session) {
            if (!err) {
                actionHandler.handleAction(action, session, res);
            } else {
                logger.app.error(err);
                utils.send500(res, action._aid);
            }
        });
    } else {
        utils.send403(res , action._aid);
    }
}

exports.routeNotify = function (req, res) {
    var action = parseNotifyData(req);
    logger.app.info("get request notify["+action._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(action));
    if (action.err) {
        utils.sendError(action.err.message, res , action._aid);
        return;
    }
    publicHandler.handleNotifyAction(action, res);
}
function parseNotifyData(req) {
    var action = {};
    action._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        if(query && query.out_trade_no && query.out_trade_no.substring(0,2)=='BP'){
            action.name = 'bill.aliNotify';
        }else{
            action.name = 'pay.aliNotify';
        }
        action.data = query;
    } catch (e) {
        action.err = e;
    }
    return action;
}

exports.routeValidate = function (req, res) {
    var action = parsePublicData(req);
    if (action.err) {
        utils.sendError(action.err.message, res , action._aid);
        return;
    }
    publicHandler.handleValidateAction(action, res);
}

exports.routeOpenService = function (req , res){
    var service = parseOpenServiceData(req);
    logger.app.info("get request openservice["+service._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(service));
    if (service.err) {
        utils.sendError(service.err, res , service._aid);
        return;
    }
    if(service.data && ('md5' in service.data)){
        if(service.data.md5 == config.md5){
            logger.app.info("request by md5 request service:" + JSON.stringify(service));
            openServiceHandler.handleService(service, res, service._aid);
        }else{
            utils.send403(res, service._aid);
        }
    }else{
        appSession.checkAccessByIp(req, function (result) {
            if (result.success) {
                logger.app.info(result.addr._id + "[" + result.addr.name + "] request service:" + JSON.stringify(service));
                openServiceHandler.handleService(service, res, service._aid);
            } else {
                utils.send403(res  , service._aid);
            }
        });
    }
}

function parseOpenServiceData(req) {
    var service = {};
    service._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        if (query.action) {
            service.name = query.action;
            delete query.action;
            service.data = query;
        }  else{
            service.err = 'action error! your shoud check your param!';
        }
    } catch (e) {
        logger.app.error("request parse error:" + e.stack);
        service.err = e.message;
    }
    return service;
}

