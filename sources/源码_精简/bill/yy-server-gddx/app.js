/**
 * app.js
 * server main js
 * server start from here
 * function : init server evn and start basic http server
 * add by zhangyang
 */

/**
 * Module dependencies.
 */
global.__baseDir = __dirname;
var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , fs = require('fs')
    , appParser = require("appParser")
    , log4js = require('log4js')
    , config = require('appConfig');
require(__dirname + '/7moor/utils/initGlobal');


/**
 * init express
 */
var app = express();

// all environments
app.set('port', config.serverPort);
app.set('jsonp callback name', 'callback');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({uploadDir: config.fileDownloadDir}));
app.use(appParser.xmlBodyParser);
app.use(express.methodOverride());
app.use(app.router);
app.use(log4js.connectLogger(require("appLog").access, {level: log4js.levels.INFO}));
app.use(express.static(__dirname + '/public'));

var logErrors = function (err, req, res, next) {
    require("appLog").app.error(err.message, err);
    next(err);
};
var clientErrors = function (err, req, res, next) {
    if (req.xhr) {
        res.send(500, { error: 'server error!' });
    } else {
        next(err);
    }
}
function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
}
app.use(logErrors);
app.use(clientErrors);
app.use(errorHandler);

//for log
var log = require("appLog");
log.app.info("logger app is init success!!");
log.request.info("logger request is init success!!!");

//for weixin
app.get('/weixin',routes.routeWeixin);
app.post('/weixin',routes.routeWXmessage);
//for yuntongxun flowpackage
app.post('/flowPackage',routes.routeFlowPackage);
//for yuntongxun voiceVerify
app.post('/voiceVerify',routes.voiceVerify);
//for action request
app.post('/action', routes.routeAction);
app.get('/action',routes.routeAction);
//for public request
app.get('/public', routes.routePublic);
app.post('/public', routes.routePublic);
//for alipay notify
app.post('/alinotify', routes.routeNotify);
app.get('/alinotify', routes.routeNotify);
//for validate
app.get('/validate', routes.routeValidate);
//for command control
app.get('/command',routes.routeCommand);
// form submit or file upload
app.post('/form',routes.routeForm);
//get file
app.get('/getFile',routes.routeGetFile);
//for out service
app.get('/openService',routes.routeOpenService);
app.post('/openService',routes.routeOpenService);
//for tobao
//app.get('/taobao',routes.routeTaobao);
//app.post('/taobao',routes.routeTaobao);

//restful
app.get(/^\/rest\/.*$/, routes.routeRest);

//cc route bill
app.get('/action2bill', routes.routeAction2Bill);
app.post('/action2bill', routes.routeAction2Bill);
//default
app.get("/", routes.default);


require('appDb/MongoDb').connectDb();
require('appDb/MongoDb').connectReportDb();
require("m7rds").connect.init(config.ccRedisIp,config.ccRedisPort, config.ccRedisPwd);
var times = 0;
var startTimeout = setInterval(function () {
    times++;
    if (times > 1000) {
        log.app.info("connecting to db faild!!!");
        clearInterval(startTimeout);
    }
    if (require('appDb/MongoDb').db() && require('appDb/MongoDb').reportDb()) {
        http.createServer(app).listen(app.get('port'), function () {
            log.app.info('Express server listening on port ' + app.get('port'));
        });
        clearInterval(startTimeout);
    }
}, 500);

process.on('uncaughtException', function(err){
    log.app.error("Caught exception:----->",err);
    process.exit(8);
});






