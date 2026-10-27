/*
 * main route
 */

var utils = require('appUtil/Utils');
var config = require('appConfig').conf;
var appSession = require('appSession');
var actionHandler = require('./actionHandler');
var serviceHandler = require('./serviceHandler');
var uploadHandler = require('./uploadHandler');
var downloadHandler = require('./downloadHandler');
var logger = require('appLog');
var fs = require("fs");
var formHandler = require('./formHandler');
var mongo = require('appDb/MongoDb');
var commonInterHandler = require('./commonInterHandler');
var imgDealHandler = require('./ImgDealHandler');
var publicHandler = require("./publicHandler");
var qiniuHandler = require(__baseDir + '/dishui/app/qiniu/QiniuHandler');
/**
 * useful for test
 * @param req
 * @param res
 */
exports.index = function (req, res) {
    //res.render('index', { title: 'Express' });
    // notify master about the request
//    process.send({ cmd: 'notifyRequest',id:process.pid });
    var mongo = require('appDb/MongoDb');
//    require('appHttp').sendPost('http://localhost:3000/uploadFile?name=123&length=900',{id:12345,desc:'sfjslfjsl'},function(err,res){
//        if(!err)
//        console.log("response data:"+res.body);
//        else
//        console.log(err);
//    });
    var serverConfig = require('appConfig');
    res.send('new app server:' + serverConfig.conf.version);
};

exports.app = function (req, res) {
    var appRoute = require("./routeApp");
    appRoute.handle(req, res);
}

exports.manager = function (req, res) {
    var managerRoute = require("./routeManager");
    managerRoute.handle(req, res);
}

exports.uploadFile = function (req, res) {
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
        upload.module = query.module || urlQuery.module;
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

exports.downLoadFile = function (req, res) {
    var download = parseDownloadData(req);
    logger.app.info("get request download["+download._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(download));
    if (!download.err) {
        if (download.sessionId) {
            appSession.checkSession(download.sessionId, function (err, session) {
                if (!err) {
                    downloadHandler.handleDownload(download, session, res);
                } else {
                    utils.send403(res,download._aid);
                }
            });
        } else {
            utils.send403(res,download._aid);
        }
    } else {
        utils.send500(res,download._aid);
    }
}

function parseDownloadData(req) {
    var download = {};
    download._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        download.sessionId = query.sessionId;
        download.type = query.type;
        download.file = query.file;
        download.name = query.name;
        download.fileId = query.fileId;
    } catch (e) {
        logger.app.error("parse request error", e);
        download.err = e;
    }
    return download;
}


exports.routeService = function (req, res) {
    var service = parseServiceData(req);
    logger.app.info("get request service["+service._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(service));
    if (service.err) {
        utils.sendError(service.err, res , service._aid);
        return;
    }
    appSession.checkAccessByIp(req, function (result) {
        if (result.success) {
            logger.app.info(result.addr._id + "[" + result.addr.name + "] request service:" + JSON.stringify(service));
            serviceHandler.handleService(service, res);
        } else {
            utils.send403(res  , service._aid);
        }
    });
}

function parseServiceData(req) {
    var service = {};
    service._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        if (query.action && query.data) {
            service.name = query.action;
            service.data = JSON.parse(query.data);
        } else if((query.action && query.json)) {
            service.name = query.action;
            service.data = JSON.parse(query.json);
        } else{
            service.err = 'param error! your shoud check your param!';
        }
    } catch (e) {
        logger.app.error("json parse error:" + e.stack);
        service.err = e.message;
    }
    return service;
}


exports.routeAction = function (req, res) {
    var action = parseActionData(req);
    logger.app.info("get request action["+action._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(action));
    if (action.err) {
        utils.sendError(action.err, res,action._aid);
        return;
    }
    if (action.sessionId) {
        appSession.checkSession(action.sessionId, function (err, session) {
            if (!err) {
                actionHandler.handleAction(action, session, res);
            } else {
                logger.app.error(err);
                utils.send500(res,action._aid);
            }
        });
    } else if (action.name === 'managerLogin') {
        appSession.managerLogin(action, function (result) {
            utils.sendResult(result, res , action._aid);
        });
    } else if (action.name === 'login') {
        appSession.checkLoginByIp(req, function (result) {
            logger.app.info("[" + result.clientIp + "] request login CC" );
            action.clientIp=result.clientIp;
            appSession.login(action, function (_result) {
                utils.sendResult(_result, res);
            });
        });
    } else if (action.name === 'monitorLogin') {
        appSession.monitorLogin(action,function(result){
            utils.sendResult(result,res , action._aid);
        });
    } else if (action.name === 'proxyLogin') {
        appSession.proxyLogin(action, function (result) {
            utils.sendResult(result, res , action._aid);
        });
    } else if (action.name === 'config.accountConfig.retryMail2Authcode') {
        actionHandler.handleAction(action,null,res);
    } else if (action.name === 'app.customer.batchUpdateActionUser') {
        actionHandler.handleAction(action,null,res);
    } else {
        utils.send403(res,action._aid);
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
//            action.data = query.data;
            action.sessionId = query.sessionId;
            //just for ext
            if (query.limit)action.data.limit = query.data.limit;
            if (query.page)action.data.page = query.data.page;
            //end for ext
        } else {
            action.err = 'param error! your shoud check your param!';
        }

    } catch (e) {
        logger.app.error("json parse error:", e);
        action.err = e.message;
    }
    return action;
}

exports.routeForm = function (req, res) {
    var form = parseFormData(req);
    logger.app.info("get request action["+form._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(form));
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
                        mongo.writeFileToDb(file.path, fileId, file.name, 'default', function (err) {
                            if (!err) {
                                form.data[file.key] = {fileId: fileId, name: file.name};
                                fs.unlink(file.path, function () {
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
                utils.send500(res ,form._aid);
            }
        });
    } else {
        utils.send403(res);
    }
}
/**
 * 直接从临时文件复制图片到指定目录，富文本编辑器使用
 * @param req
 * @param res
 */
exports.routeRichUpload = function (req, res) {
    var form = parseFormData(req);
    logger.app.info("get request action["+form._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(form));
    if (form.err) {
        utils.sendError(form.err.message, res , form._aid);
        return;
    }
    if (form.sessionId) {
        appSession.checkSession(form.sessionId, function (err, session) {
            if (!err) {
                if (form.data.files) {
                    /*var length = form.data.files.length;
                    var index = 0;
                    var processor = function (file) {
                        var fileId = utils.UUID.generateUuid();
                        if(!exports.isImage(file.name)){
                            utils.sendError("只能上传图片", res , form._aid);
                            return;
                        }
                        fs.readFile(file.path,function(err,data){
                            if(!err){
                                var _path=config.kmImgDir+fileId;
                                fs.writeFile(_path,data,function(err){
                                    if(!err){
                                        form.data.fileId=fileId;
//                                        form.data[file.key] = {fileId: fileId, name: file.name};
                                        fs.unlink(file.path, function () {
                                        });
                                        index++;
                                        if (index == length) {
                                            delete form.data.files;
                                            formHandler.handle(form, session, res);
                                        } else {
                                            processor(form.data.files[index]);
                                        }
                                    }else{
                                        logger.app.error(err);
                                        utils.sendError(err.message, res , form._aid);
                                    }
                                })
                            }else{
                                logger.app.error(err);
                                utils.sendError(err.message, res , form._aid);
                            }
                        });
                    }
                    processor(form.data.files[index]);*/

                    if(form.data.type == "km_qiniu"){
                        var file=form.data.files[0];
                        var fName=file.name;
                        var fileSuffix = fName.substring(fName.lastIndexOf("."));

                        if(!exports.isImage(file.name)){
                            res.jsonp({
                                success: false,
                                message: "上传失败，只支持png,jpg,jpeg,bmp,gif格式的图片!"
                            });
                            return;
                        }
                        qiniuHandler.uploadKmImageToQN(file.path,fileSuffix, session,function (err, url) {
                            if (!err && url) {
                                res.jsonp({error: 0, message: "上传成功", url: url});
                            } else {
                                utils.sendError("上传失败", res, form._aid);
                            }
                            fs.unlink(file.path, function () {
                            });
                        })
                    }else{
                        var file=form.data.files[0];
                        var fileId = utils.UUID.generateUuid();
                        if(!exports.isImage(file.name)){
                            utils.sendError("只能上传图片", res , form._aid);
                            return;
                        }
                        //console.dir(file)
                        mongo.writeFileToDb(file.path,fileId,file.name,"default",function(err,data){
                            if(err){
                                logger.app.error("save file error!",err);
                                res.json({success:false});
                            }else{
                                var result = {
                                    fileId : fileId,
                                    trueName : file.name
                                };
                                form.data=result;
                                //res.json(result);
                                fs.unlink(file.path, function () {
                                });
                                //console.dir(form);
                                formHandler.handle(form, session, res);
                            }
                        });
                    }

                }
            } else {
                logger.app.error(err);
                utils.send500(res ,form._aid);
            }
        });
    } else {
        utils.send403(res);
    }
}
exports.isImage = function (url) {
    var res, suffix = "";
    var imageSuffixes = ["png", "jpg", "jpeg", "gif", "bmp"];
    var suffixMatch = /\.([a-zA-Z0-9]+)(\?|\@|$)/;

    if (!url || !suffixMatch.test(url)) {
        return false;
    }
    res = suffixMatch.exec(url);
    suffix = res[1].toLowerCase();
    for (var i = 0, l = imageSuffixes.length; i < l; i++) {
        if (suffix === imageSuffixes[i]) {
            return true;
        }
    }
    return false;
};

function parseFormData(req) {
    var form = {};
    form._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        if (req.method == 'POST') {
            if(query && query.action=='uploadRichImage' ){
                //do nothing
            }else{
                query = req.body;
            }
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

exports.routeCommonInter = function(req,res){
    var req = parseCommonInterData(req);
    var _aid = utils.UUID.generateUuid();
    if(req.query && ('md5' in req.query)){
        logger.app.info("request["+_aid+"] service CommonInter:" + JSON.stringify(req.query));
        if(req.query.md5 == config.md5){
            commonInterHandler.handleCommonInter(req.query, res);
        }else{
            utils.send403(res,_aid);
        }
    }else{
        appSession.checkAccessByIp(req, function (result) {
            if (result.success) {
                logger.app.info(result.addr._id + "[" + result.addr.name + "] request["+_aid+"] service CommonInter:" + JSON.stringify(req.query));
                commonInterHandler.handleCommonInter(req.query, res);
            } else {
                utils.send403(res , _aid);
            }
        });
    }
}

function parseCommonInterData(req) {
    try {
        if(req.method == 'POST'){
            req.query = req.body;
        }
    } catch (e) {
        logger.app.error("json request error", e);
        req.err = e.message;
    }
    return req;
}

exports.routeImgUpload = function (req, res) {
    var upload = parseUploadData(req);
    logger.app.info("get request upload["+upload._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(upload));
    if (!upload.err) {
        if (upload.sessionId) {
            appSession.checkSession(upload.sessionId, function (err, session) {
                if (!err) {
                    imgDealHandler.transferImg(upload, session, res);
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
        } else {
            if(req.method == 'POST'){
                query._aid = action._aid;
                action = query;
                action.name = req.query.action;
            }else{
                action.err = new Error('param error! your shoud check your param!');
            }
        }
    } catch (e) {
        action.err = e;
    }
    return action;
}

exports.routeQiniu = function(req, res){
    var action = parseQiniuNotifyData(req);
    logger.app.info("get qiniu.mps.notfiy request public["+action._aid+"] from["+utils.getReqIp(req)+"]:" + JSON.stringify(action));
    if (action.err) {
        utils.sendError(action.err.message, res , action._aid);
        return;
    }
    publicHandler.handleAction(action, res);
}

function parseQiniuNotifyData(req) {
    var action = {};
    action._aid = utils.UUID.generateUuid();
    try {
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        action.data = query;
        action.name = 'qiniu.mpsNotify';
    } catch (e) {
        action.err = e;
    }
    return action;
}