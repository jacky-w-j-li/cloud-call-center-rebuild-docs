/**
 * Created by yaxi on 2015-07-31.
 */
global.__baseDir = __dirname;
var express = require('express')
    , methodOverride = require('method-override')
    , routes = require('./routes/index')
    , http = require('http')
    , path = require('path')
    , log4js = require('log4js')
    , config = require('appConfig').conf
    , bodyParser = require('body-parser')
    , redisUtils = require('m7rds')
    , redisKeyPrefix = require(__baseDir+"/common/RedisKeyPrefix");

var app = express();

if(!process.httpServerPort){
    process.httpServerPort = config.serverPort;
}
// view engine setup
app.set('port', process.httpServerPort);
app.set('ip', config.serverIp);
app.set('jsonp callback name', 'callback');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
//app.use(bodyParser({uploadDir:config.fileDownloadDir}));
app.use(methodOverride());
app.use(log4js.connectLogger(require("appLog").access, {level: log4js.levels.INFO}));

app.use('/', routes);



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

var server = http.createServer(app).listen(app.get('port'), function () {
    log.app.info('WebIM Express server listening on port ' + app.get('port'));
});

var httpProvider = require("appHttp");
var mongo = require('appDb/MongoDb');
mongo.connectDb();
require("m7rds").connect.init(config.redisIp,config.redisPort, config.redisPwd);
var utils = require('appUtil/Utils');
// 配合nginx的ip_hash或者url_hash负载均衡策略可以开启多个实例，即对应多个port，
// cluster方式目前没有好的方法处理
var socketio = require('socket.io')(server);
var times = 0;
var startTimeout = setInterval(function () {
    times++;
    if (times > 1000) {
        log.app.error("connecting to db faild!!!");
        clearInterval(startTimeout);
    }
    if (mongo.db()) {
//认证
        socketio.use(function(socket, next) {
            var handshakeData = socket.request;
            var query = handshakeData._query;
            var username = query.username;
            var password = query.password;
            var account = query.account;

            mongo.db('bill').collection('platform_user')
                .findOne({account:account,exten:username,password:password}, function(err, doc){
                    if(err || !doc){
                        next(new Error('not authorized'));//认证失败
                        return;
                    }
                    log.app.info("get authorized socketId:"+socket.id);
                    var setCon = {_id:doc._id, socketId: socket.id, user:doc, connTime: utils.getCurrentDate(),pushServerIp: app.get('ip'), pushServerPort:app.get('port')};
                    setCon.status = doc.imClaimStatus;
                    var connSession ={$set: setCon};

                    mongo.db().collection('app_multi_channel_chat_session').update({user:doc._id, status:'deal'}, {$unset: {agentBreakTime:1}},function(err){});

                    var imcountFind = {$or:[{user: doc._id, status: 'deal', account: account},{invitedUser:doc._id,status:'deal',inviteUserStatus:'accept',account: account}]};
                    mongo.db().collection('app_multi_channel_chat_session').count(imcountFind, function(err, imcount){
                        var count = imcount;
                        if(err){
                            count = 0;
                        }
                        redisUtils.string.set(redisKeyPrefix.AGENT_CURR_IM_DEAL_COUNT+doc._id, count, function(){}, redisKeyPrefix.REDIS_DB1);

                        mongo.db().collection ('app_push_client').update({_id:doc._id}, connSession,{upsert:true, w:1}, function(err){
                            if(err){
                                next(new Error('not authorized, 500 server error! app_push_client insert fail'));//认证失败
                                log.app.error("not authorized, 500 server error! app_push_client insert fail");
                                return;
                            }else{
                                redisUtils.string.setObj(redisKeyPrefix.ONLINE_AGENT_INFO+doc._id, setCon, function(){}, redisKeyPrefix.REDIS_DB1);
                                next();//认证成功
                            }
                        });
                    });


                });
        });

        socketio.on("connection", function(socket){
            console.log("process.httpServerPort:"+process.httpServerPort);
            log.app.info("connect from client,socketId:"+socket.id);

            // 如果业务不在此服务中，业务量大时可以采用以下方法扩展。
            // 将socketId, 该服务ip， port传给客户端，由客户端获取后传给业务方，
            // 在推送消息的时候能通过这个准确找到接入的服务器并进行消息的推送。
            socket.emit("socketId", {socketId:socket.id, port:app.get('port'), ip:app.get("ip")});

            socket.on("disconnect", function(){
                var data = {
                    action: "disconnect",
                    socketId: socket.id,
                    port: app.get('port'),
                    serverIp: app.get('ip')
                };
                log.app.info("disconnect session from client:"+socket.id);
                mongo.db().collection('app_push_client').findOne({socketId: socket.id}, function(err, doc){
                    if(!err && doc){
                        var find = {user: doc.user._id, status:'deal'};
                        mongo.db().collection('app_multi_channel_chat_session').update(find, {$set: {agentBreakTime:utils.getCurrentDateTime()}}, {multi: true}, function(err){});
                        mongo.db().collection('app_push_client').remove({socketId: socket.id}, function(err){});

                        //notify server agent logout
                        log.app.info("updateLogoutMailAutoClaimTime sessionId :"+doc._id);
                        var postData = {sessionId:doc._id,emailStatus:doc.emailStatus||"close"};
                        httpProvider.sendPost(config.ccServiceUrl,"action=updateLogoutMailAutoClaimTime&data="+JSON.stringify(postData), function (err, response) {});

                        //notify Other Agent one people offline
                        redisUtils.string.del(redisKeyPrefix.ONLINE_AGENT_INFO+doc._id, function(){log.app.info("delete agent info from redis");}, redisKeyPrefix.REDIS_DB1);
                        redisUtils.string.del(redisKeyPrefix.AGENT_IM_DEALED_COUNT+doc._id, function(){}, redisKeyPrefix.REDIS_DB1);
                        redisUtils.string.del(redisKeyPrefix.AGENT_EMAIL_DEALED_COUNT+doc._id, function(){}, redisKeyPrefix.REDIS_DB1);
                        mongo.db().collection('app_push_client').find({'user.account': doc.user.account,_id:{$ne:doc._id}}).toArray(function(err, clients){
                            if(!err && clients){
                                if(clients.length > 0){
                                    var pushMsg = {
                                        eventData: {
                                            Event: 'NewNotify', Account: doc.user.account,
                                            Data: {
                                                type: 'agentPushStatus',
                                                online: false,
                                                userId: doc.user._id,
                                                time: utils.getCurrentDate()
                                            }
                                        }
                                    };
                                    for(var i=0 ;i<clients.length ;i++){
                                        if(clients[i].pushServerPort == process.httpServerPort){
                                            var socket = socketio.sockets.connected[clients[i].socketId];
                                            if(socket){
                                                socket.emit("pushMsg", pushMsg);
                                            }
                                        }else{
                                            var tmpMsg = utils.deepClone(pushMsg);
                                            tmpMsg.userId = clients[i]._id;
                                            httpProvider.sendGet("http://"+clients[i].pushServerIp+":"+clients[i].pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(tmpMsg)), function(err, res){
                                            });
                                        }
                                    }
                                }
                            }
                        });
                    }

                });
            });
        });
        clearInterval(startTimeout);
    }
}, 500);

exports.socketio = socketio;




