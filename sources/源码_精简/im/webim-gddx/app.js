
global.__baseDir = __dirname;
var express = require('express')
    , cookieParser = require('cookie-parser')
    , cookieSession = require('cookie-session')
    , methodOverride = require('method-override')
    , bodyParser  = require('body-parser')
    , routes = require('./routes/index')
    , http = require('http')
    , path = require('path')
    , fs = require('fs')
    , log4js = require('log4js')
    , config = require('appConfig').conf
    ,utils =require('appUtil/Utils');



var app = express();

// view engine setup
app.set('port', config.serverPort);
app.set('jsonp callback name', 'callback');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(cookieParser());
//app.use(express.favicon());
//app.use(cookieSession({keys:{name: 'express:sess'}}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser({uploadDir:config.fileDownloadDir}));
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




//require('appDb/MongoDb').connectDb();
//var times = 0;
//
//var startTimeout = setInterval(function () {
//    times++;
//    if (times > 1000) {
//        log.app.error("connecting to db faild!!!");
//        clearInterval(startTimeout);
//    }
//    if (require('appDb/MongoDb').db()) {
//        http.createServer(app).listen(app.get('port'), function () {
//            log.app.info('WebIM Express server listening on port ' + app.get('port'));
//        });
//        clearInterval(startTimeout);
//    }
//}, 500);

var sessions = {};
var MESSAGE_BACKLOG = 500;
var channel = new function(){
    var messages = [], callbacks = {};

    this.appendMessage = function(type, msg, sid){
        var message = {
            type:type,
            msg:msg,
            sid:sid,
            timestamp:new Date().getTime()
        }

        messages.push(message);

        var tempid = "";
        for(var id in callbacks){
            console.log("callback sid:"+ id);
            if(id == message.sid){
                callbacks[id].callback(message);
                tempid = id;
                break;
            }
        }
        delete callbacks[tempid];

        while (messages.length > MESSAGE_BACKLOG)
            messages.shift();

    };

    this.queryMessage = function(data, callback){
        var i = 0;
        if(messages.length == 0){
            callbacks[data.sid] = {timestamp : data.timestamp, callback: callback};
        }
        console.log(messages.length);
        while(messages.length > 0 && i<messages.length){
            var message = messages[i];
            if(data.sid == message.sid && message.timestamp > data.timestamp){
                callback(message);
                message.timestamp = data.timestamp - 60000; //将已经推送完了的消息,设置其过期10分钟
            }else{
                callbacks[data.sid] = {timestamp : data.timestamp, callback: callback};
            }
            i++;
        }
    };


    setInterval(function () {
        var tempids = [];
        var now = new Date();
        for(var id in callbacks){
            var callbackJ = callbacks[id];
            if(now - callbackJ.timestamp > 5000){
                callbackJ.callback({msg:""});
                tempids.push(id);
            }
        };
        while(tempids.length > 0){
            delete callbacks[tempids.shift()];
        }
    }, 3000);

}

function createSession(sid,companyid){
    var session = {
        sid:sid,
        timestamp: new Date(),
        destory:function(){
            delete sessions[session.sid];
            delete callbacks[query.sid];
        }
    };

    for(var i in sessions){
        var session2 = sessions[i];
        if (session2 && session2.sid === sid) return session2;
    }
    sessions[session.sid] = session;
    return session;
}

app.route('/openChat').get(function(req, res){
    var query = req.query;
    var sid = query.sid || utils.UUID.generateUuid();
    console.log(sid);
    var session = createSession(sid, query.companyid);
    res.jsonp({sysMsg:"welcome to chat", sid:session.sid, since:session.timestamp});
});

app.route('/getMsg')
    .get(function(req, res){
        var query = req.query;
        var sid = query.sid || utils.UUID.generateUuid();
        var session = createSession(sid, query.companyid);
        console.log("msg:"+sid);
        var queryData = {
            sid: session.sid,
            companyid: query.companyid,
            timestamp : query.since,
            type: "getMsg"
        };
        channel.queryMessage(queryData, function(data){
            res.jsonp(data);
        });
    })
    .post(function(req, res){
    });

app.route("/closeWin").get(function(req, res){
    var query = req.query;
    sessions[query.sid].destory();
});

app.route("/sendMsg").
    get(function(req, res){
        var query = req.query;
        if(!sessions[query.sid]){
            res.jsonp({msg:"",sysMsg : "用户已离开！"});
            return;
        }
        channel.appendMessage("send", query.msg, query.sid);
        res.send("200");
    })
.post(function(req, res){
        var query = req.body;
        if(!sessions[query.sid]){
            res.jsonp({msg:"",sysMsg : "用户已离开！"});
        }
        channel.appendMessage("send", query.msg, query.sid);
});


http.createServer(app).listen(app.get('port'), function () {
    log.app.info('WebIM Express server listening on port ' + app.get('port'));
});