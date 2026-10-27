
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

var app = express();

app.set('port', config.serverPort);
app.use(express.favicon());
app.use(express.bodyParser({uploadDir:config.fileDownloadDir}));
app.use(express.methodOverride());
app.use(app.router);
app.use(log4js.connectLogger(require("appLog").access, {level:log4js.levels.INFO}));

var logger = require("appLog");
logger.app.info("logger app is init success!!");

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

/**
 * {
 *  action:'customerServiceReport.queryCSMessageReport',
 *  data:{
 *      account:'N000000000264',
 *      reportType:'im_report_message',
 *      query:{
 *          TimeType:'DayID'
 *      }
 *   }
 * }
 *
 */
app.get('/report', routes.reportAction);
app.post('/report', routes.reportAction);


require('appDb/MongoDb').connectDb();
require('appDb/MongoDb').connectAppDb();
var times = 0;
var startTimeout = setInterval(function () {
    times++;
    if (times > 100) {
        console.log("connecting to db faild!!!");
        clearInterval(startTimeout);
    }
    if (require('appDb/MongoDb').db() && require('appDb/MongoDb').appDb()) {
        http.createServer(app).listen(app.get('port'), function () {
            console.log('Express server listening on port ' + app.get('port'));
        });
        clearInterval(startTimeout);
    }
}, 500);


