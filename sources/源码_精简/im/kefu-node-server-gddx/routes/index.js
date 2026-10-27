var logger = require("appLog");
var actionHandler = require('./actionHandler');
var utils = require('appUtil/Utils');
var fs = require('fs');
var config = require('appConfig').conf;
var qiniu = require('qiniu');
var sdkSessionHandler = require(__baseDir + '/im/SdkSessionHandler');

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.onlineAction = function (req, res){
    var reqData = parseOnlineReqData(req);

    logger.app.info("get request validate[" + reqData._aid + "]" +
        " from [" + utils.getReqIp(req) + "]:" + JSON.stringify(reqData));

    if(reqData.err){
        utils.sendError(reqData.err, reqData._aid, res);
        return;
    }
    actionHandler.handleAction(reqData, res);

};

exports.chatAction = function(req, res) {
    var action = parseActionData(req);
    if (action.err) {
        utils.sendError(action.err, res);
        return;
    }
    if (action.action == "newMsg" && req.files &&  req.files.picToUpload) {
        console.dir(req.files.picToUpload);
        var temp_path = req.files.picToUpload.path;
        if (temp_path) {
            uploadToQN(temp_path, action.data.accessId, function(err, key){
                if(key){
                    action.data.content = config.qiniu_domain+key;
                }
                fs.unlink(temp_path,function(err){
                    logger.app.error(err);
                });
                actionHandler.handleAction(action, res);
            });

        }else{
            utils.sendResult({success: false, message:"获取图片失败"}, res);
        }
    }else{
        actionHandler.handleAction(action, res);
    }
};

function parseOnlineReqData(req){
    var actionData = {action :req.action};
    actionData._aid = utils.UUID.generateUuid();
    try{
        var query = req.query;
        if(req.method == "POST"){
            query = req.body;
        }

        if(query.accessId){
            actionData.action = query.action;
            actionData.data ={};
            actionData.data.accessId = query.accessId;
            actionData.data.location = query.location || "";
            actionData.data.callbackF = query.callbackF;
            actionData.data._aid = actionData._aid;
        }else{
            actionData.err = "param err";
        }
    }catch(e){
        actionData.err = "param err";
        logger.app.error("[" + actionData._aid + "]parse param error", e);
    }

    return actionData;

}

function parseActionData(req) {
    var action = {};
    action._aid = utils.UUID.generateUuid();
    var query = {};
    try {
        if(req.method == 'POST'){
            query = req.body;
        }else{
            query = req.query;
        }

        if (query.data) {
            if(query.data.substr(query.data.length-2,2) == '\n'){
                query.data = query.data.substring(0,query.data.length-2);
            }
            logger.app.info('get action['+action._aid+'] from client:'+JSON.stringify(query.data));
            action.data = JSON.parse(query.data);
            action.action = action.data.action;
            if(action.data.Action){
                action.name = action.data.Action;
                action.action = action.data.Action;
            }
            action.data._aid = action._aid;
            action.data.ip = utils.getReqIp(req);
            if(action.data.sid){
                action.sid = action.data.sid;
            }
            if(action.data.ConnectionId){
                action.connectionId = action.data.ConnectionId;
            }
        }
    } catch (e) {
        logger.app.error("json request error", e);
        action.err = e.message;
    }
    return action;
}

function uploadToQN(fileUrl, accessId, callback) {
    var putPolicy = new qiniu.rs.PutPolicy({scope: config.qiniu_bucketName});
    var extra = new qiniu.io.PutExtra();
    var date= utils.getCurrentDate();
    var today = new Date();
    var time=today.getTime();
    var fileSuffix = fileUrl.substr(fileUrl.lastIndexOf("."));
    var key ="im/"+ accessId+"/" + date+"/"+time+"/" + utils.UUID.generateUuid() + fileSuffix;


    qiniu.io.putFile(putPolicy.token(), key, fileUrl, extra, function(err, ret) {
        if(!err) {
            // 上传成功， 处理返回值
            console.log(ret.key, ret.hash);
            // ret.key & ret.hash
            callback(null, key);
        } else {
logger.app.info(err);
            // 上传失败， 处理返回代码
            console.log('上传七牛失败');
            console.log(err);
            // http://developer.qiniu.com/docs/v6/api/reference/codes.html
            callback(err);
        }
    });
}
exports.sdkChatAction = function(req, res) {
    var action = parseActionData(req);
    if (action.err) {
        utils.sendError(action.err, res);
        return;
    }
    if (action.connectionId) {
        sdkSessionHandler.checkConnection(action.connectionId, function (err, connection) {
            if (!err) {
                actionHandler.handleSdkAction(action, connection, res);
            } else {
                var result={
                    Succeed: false,
                    Message: '404'
                }
                utils.sendResult(result, res, action._aid);
            }
        });
    }
    else if (action.name == 'sdkLogin'){
        sdkSessionHandler.sdkLogin(action, function(_result){
            utils.sendResult(_result, res, action._aid);
        });
    }
    //else if (action.name == 'multiChannelServerNewMsg'){
    //    dispatcherHandler.notifySdkHasMsg(action.data, function(_result){
    //        _result.Succeed = _result.Succeed || false;
    //        _result.Message = _result.Succeed ? _result.Message || '200 ok!' : _result.Message || 'unknow error!';
    //        utils.sendResult(_result, res);
    //    });
    //}
    else if (action.name == 'connectionBreak' && action.data.IoSessionId) {
        sdkSessionHandler.breakConnectionByIoSession(action, function (_result) {
            utils.sendResult(_result, res, action._aid);
        });
    } else{
        var result = {
            Succeed: false,
            Message: 'ConnectionId not found!'
        }
        utils.sendResult(result, res, action._aid);
    }
}


exports.fileUploadAction = function (req, res) {
    var upload = parseUploadData(req);
    logger.app.info("get request upload["+upload._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(upload));
    if (!upload.err) {
        if (upload.sessionId) {
            appSession.checkSession(upload.sessionId, function (err, session) {
                if (!err) {
                    uploadHandler.handleUpload(upload, session, res);
                } else {
                    utils.send403(res , upload._aid);
                    cleanUploadFile(upload);
                }
            });
        } else {
            utils.send403(res , upload._aid);
            cleanUploadFile(upload);
        }
    } else {
        utils.send500(res , upload._aid);
        cleanUploadFile(upload);
    }

}

function cleanUploadFile(upload) {
    if (upload.file) {
        try {
            fs.unlink(upload.file.path);
        } catch (e) {
            logger.app.error("remove file[" + upload.file.path + "] error!", e);
        }
    }
}


function parseUploadData(req) {
    var upload = {};
    upload._aid = utils.UUID.generateUuid();
    try {
        var query = req.body;
        var urlQuery = req.query;
        var file = req.files.upload;
        upload.file = file;
        upload.type = query.type || urlQuery.type;
        upload.sessionId = query.sessionId || urlQuery.sessionId;

        delete query.type;
        delete  urlQuery.type;
        delete query.sessionId;
        delete  urlQuery.sessionId;

        upload.data = query || urlQuery || {};
    } catch (e) {
        logger.app.error("parse request error", e);
        upload.err = e;
    }
    return upload;
}

exports.sendMsgAction = function(req, res) {
    logger.app.info("sendMsgAction");
    var action = parseSendMsgActionData(req);
    if (action.err) {
        utils.sendError(action.err, res);
        return;
    }
    actionHandler.handleAction(action, res);
};


function parseSendMsgActionData(req) {
    var action = {};
    action._aid = utils.UUID.generateUuid();
    var query = {};
    try {
        if(req.method == 'POST'){
            query = req.body;
        }else{
            query = req.query;
        }
        if (query.data) {
            logger.app.info('get action['+action._aid+'] from client:'+JSON.stringify(query.data));
            if(query.data.substr(query.data.length-2,2) == '\n'){
                query.data = query.data.substring(0,query.data.length-2);
            }
            action.data = JSON.parse(query.data);
            action.action = action.data.action;
            action.data._aid = action._aid;
            action.data.ip = utils.getReqIp(req);

            if(action.data.sid){
                action.sid = action.data.sid;
            }
        }
    } catch (e) {
        logger.app.error("json request error", e);
        action.err = e.message;
    }
    return action;
}



