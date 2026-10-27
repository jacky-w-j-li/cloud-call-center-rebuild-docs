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
  , routes = require('./routes/routes')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , log4js = require('log4js')
  , config = require('appConfig').conf;


/**
 * init express
 */
var app = express();

// all environments
app.set('port', config.serverPort);
app.set('jsonp callback name', 'callback');
app.set('views', __dirname + '/views');
app.use(express.favicon());
app.use(express.bodyParser({uploadDir:config.fileDownloadDir}));
app.use(express.methodOverride());
app.use(app.router);
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

app.post('/mail', routes.routeMail);
app.post('/weixin',routes.routeWeixin);
app.post('/im',routes.routeIm);
app.post('/sendMessage',routes.routeSendMessage);
app.post('/status',routes.routeStatus);
app.post('/newIM', routes.routeNewIm);
app.post('/weixinMenu', routes.routesWeixinMenu);
app.post('/newMail', routes.routeNewMail);
app.post('/sendMail', routes.routeSendMail);
app.post('/notify', routes.routeNotify);
app.post('/saveMaterial', routes.routesSaveMaterial);
app.post('/saveNewsMaterial', routes.routesSaveNewsMaterial);
app.post('/updateNewsMaterial', routes.routesUpdateNewsMaterial);
app.post('/getMaterial', routes.routesGetMaterial);
app.post('/weixinCustomService', routes.routeWeixinCustomService);

require('appDb/MongoDb').connectDb();
var times = 0;

var startTimeout = setInterval(function () {
    times++;
    if (times > 1000) {
        log.app.error("connecting to db faild!!!");
        clearInterval(startTimeout);
    }
    if (require('appDb/MongoDb').db()) {
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

