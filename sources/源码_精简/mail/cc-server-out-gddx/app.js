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
    , config = require('appConfig').conf;

require("m7rds").connect.init(config.redisIp,config.redisPort, config.redisPwd);

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
//app.use(express.logger('dev'));
app.use(appParser.qiniuBodyParser);
app.use(express.bodyParser({uploadDir:config.fileDownloadDir}));
app.use(express.methodOverride());
app.use(app.router);
//app.use(express.static(path.join(__dirname, 'public')));
app.use(log4js.connectLogger(require("appLog").access, {level: log4js.levels.INFO}));


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

app.post('/service', routes.routeService);
app.get('/service', routes.routeService);
app.post('/fileUpload', routes.uploadFile);
app.get('/fileDownload',routes.downLoadFile);
app.get('/action', routes.routeAction);
app.post('/action', routes.routeAction);
// form submit or file upload
app.post('/form',routes.routeForm);
app.post('/richUpload',routes.routeRichUpload);
//app.post('/imgUpload',routes.routeImgUpload);
app.get('/commonInte',routes.routeCommonInter);
app.post('/commonInte',routes.routeCommonInter);
//for public request
app.get('/public', routes.routePublic);
app.post('/public', routes.routePublic);
app.post('/qiniu/mps/notfiy', routes.routeQiniu);

require('appDb/MongoDb').connectDb();
require('appDb/MongoDb').connectReportDb();
var times = 0;
var startTimeout = setInterval(function () {
    times++;
    if (times > 1000) {
        log.app.error("connecting to db faild!!!");
        clearInterval(startTimeout);
    }
    if (require('appDb/MongoDb').db()) {
        http.createServer(app).listen(app.get('port'),"0.0.0.0",function () {
            log.app.info('Express server listening on port ' + app.get('port'));
        });
        clearInterval(startTimeout);
    }
}, 500);


process.on('uncaughtException', function(err){
    log.app.error("Caught exception:----->",err);
    process.exit(8);
});

