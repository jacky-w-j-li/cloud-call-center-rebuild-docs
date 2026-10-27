/**
 * Module dependencies.
 */
global.__baseDir = __dirname;
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var config = require('appConfig').conf;
var log4js = require('log4js');
var utils = require('appUtil/Utils');
var tokenExpire = 10 * 60 * 1000;

var sessionHandler = require(__baseDir + '/im/SessionHandler');
var app = express();

app.set('port', config.serverPort);
app.use(express.favicon());
app.use(express.bodyParser({uploadDir: config.fileDownloadDir}));
app.use(express.methodOverride());
app.use("/chat", checkPermission());
app.use(app.router);
app.use(log4js.connectLogger(require("appLog").access, {level: log4js.levels.INFO}));

var logger = require("appLog");
logger.app.info("logger app is init success!!");

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/chat', routes.chatAction);
app.post('/chat', routes.chatAction);

app.get('/online', routes.onlineAction);
app.post('/online', routes.onlineAction);

app.get('/sdkChat', routes.sdkChatAction);
app.post('/sdkChat', routes.sdkChatAction);

app.get('/sendMsg', routes.sendMsgAction);
app.post('/sendMsg', routes.sendMsgAction);


require('appDb/MongoDb').connectDb();
var times = 0;
var startTimeout = setInterval(function () {
    times++;
    if (times > 100) {
        console.log("connecting to db faild!!!");
        clearInterval(startTimeout);
    }
    if (require('appDb/MongoDb').db()) {
        http.createServer(app).listen(app.get('port'), function () {
            console.log('Express server listening on port ' + app.get('port'));
        });
        clearInterval(startTimeout);
    }
}, 500);

function checkPermission() {
    return function (req, res, next) {
        if(req.body && req.body.data){
            var data = JSON.parse(req.body.data);

            //token校验
            if(data.action == "newMsg"){
                if(data.token && data.tokenTime){
                    console.log(data.token);
                    var decipherValue = utils.decipher(config.cryptoAlgorithm, config.tokenKey, data.token);
                    var sid = decipherValue.substr(0, decipherValue.lastIndexOf("_"));
                    var timestamp = decipherValue.substr(decipherValue.lastIndexOf("_")+1);
                    //30分钟有效期
                    if(sid != data.sid || timestamp != data.tokenTime || (utils.getCurrentDateTime() - timestamp > tokenExpire)){
                        res.jsonp({success:false, message:"无效请求或请求不合法"});
                        return;
                    }
                }else{
                    res.jsonp({success:false, message:"无效请求或请求不合法"});
                    return;
                }
            }

            //上传文件的合法性校验
            if (req.files && !utils.isEmptyObject(req.files)) {
                console.log(data);
                console.log(req.files);
                if (data.action == "newMsg" && req.files.picToUpload) {
                    var type = req.files.picToUpload.type.toLowerCase();
                    var name = req.files.picToUpload.name.toLowerCase();
                    var filesuffix = name.substr(name.lastIndexOf(".")+1);
                    var size = req.files.picToUpload.size;
                    if (!req.body.isClipboard && ( (filesuffix != "jpg" && filesuffix != "jpeg" && filesuffix != "gif" && filesuffix != "png" && filesuffix != "gif") ||
                        (type != "image/jpg" && type != "image/jpeg" && type != "image/png" && type != "image/bmp" && type != "image/gif"))) {
                        res.jsonp({
                            success: false,
                            message: "上传失败，只支持png,jpg,jpeg,bmp,gif格式的图片",
                            timestamp: data.timestamp
                        });
                    } else if (size > 10 * 1024 * 1024) {
                        res.jsonp({
                            success: false,
                            message: "上传失败，图片大小不能超过10M",
                            timestamp: data.timestamp
                        });
                    } else {
                        sessionHandler.checkSession(data.sid, function (err, result) {
                            if (err) {
                                res.jsonp({success: false, message: "invalid request"});
                            } else {
                                next();
                            }

                        });
                    }

                }else if(data.action == "newMsg" && req.files.fileToUpload){
                    if(req.body.isFile && size > 20 * 1024 * 1024){
                        res.jsonp({
                            success: false,
                            message: "上传失败，文件大小不能超过20M",
                            timestamp: data.timestamp
                        });
                    }else{
                        sessionHandler.checkSession(data.sid, function (err, result) {
                            if (err) {
                                res.jsonp({success: false, message: "invalid request"});
                            } else {
                                next();
                            }

                        });
                    }
                }else {
                    console.log(112);
                    res.jsonp(
                        {
                            success: false,
                            message: "invalid request"
                        }
                    );
                }
            } else {
                next();
            }
        }else{
            next();
        }

    }
}

process.on('uncaughtException', function(err){
    logger.app.error("Caught exception:----->",err);
    process.exit(8);
});


