global.__baseDir = __dirname;

var express = require('express');
var http = require('http');
var log = require('appLog');
var app = express();
var routes = require('./routes');
var config = require('./config');
var path = require('path');
var accessToken = require('./routes/weixin/access_token');
var index = require('./routes/index');
//var msg = require('./routes/weixin/message');
//msg.getMessage();

app.set('port', config.port);
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));
console.dir(__dirname);

routes(app);

require('appDb/MongoDb').connectDb();
var times = 0;
var startTimeout = setInterval(function () {
    times++;
    if (times > 1000) {
        console.log("connecting to db faild!!!");
        clearInterval(startTimeout);
    }
    if (require('appDb/MongoDb').db()) {
        console.log("wechat-task server is starting......");
        //http.createServer(app).listen(app.get('port'), function () {
        //    console.log('Express server listening on port ' + app.get('port'));
        //});
        clearInterval(startTimeout);
        accessToken.init();
        index.refreshWXMsg();
    }
}, 500);


process.on('uncaughtException', function(err){
    log.app.error("Caught exception:----->",err);
    process.exit(8);
});
