
global.__baseDir = __dirname;
var restify = require('restify');
var route = require('./route');
var preHook = require('./preHook');
var config = require('appConfig');

var server = restify.createServer({
    name : "api.7moor.com",
    versions: ['1.0.0']
});
server.use(restify.pre.userAgentConnection());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var log = require("appLog");
log.app.info("logger app is init success!!");
log.request.info("logger request is init success!!!");
require('appDb/MongoDb').connectDb();
require('appDb/MongoDb').connectCCDb();
require("m7rds").connect.init(config.redisIp,config.redisPort, config.redisPwd);
server.pre(preHook.service);

route.init(server);

var times = 0;
var startTimeout = setInterval(function () {
    times++;
    if (times > 1000) {
        log.app.error("connecting to db faild!!!");
        clearInterval(startTimeout);
    }
    if (require('appDb/MongoDb').db()) {
        server.listen(config.serverPort, function() {
            console.log('%s listening at %s', server.name, server.url);
        });
        clearInterval(startTimeout);
    }
}, 500);

process.on('uncaughtException', function(err){
    log.app.error("Caught exception:----->",err);
    process.exit(8);
});
