/**
 * Created by yaxi on 2015-07-31.
 */
global.__baseDir = __dirname;
var express = require('express')
    , cookieParser = require('cookie-parser')
    , methodOverride = require('method-override')
    , bodyParser = require('body-parser')
    , routes = require('./routes/index')
    , http = require('http')
    , path = require('path')
    , fs = require('fs')
    , log4js = require('log4js')
    , config = require('appConfig').conf
    , utils = require('appUtil/Utils')
    , httpProvider = require("appHttp")
    , crypto = require('crypto');


var app = express();

// view engine setup
app.set('port', process.httpServerPort);
app.set('ip', config.serverIp);
app.set('jsonp callback name', 'callback');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//app.use(cookieParser());
//app.use(express.favicon());
//app.use(cookieSession({keys:{name: 'express:sess'}}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser({uploadDir: config.fileDownloadDir}));
app.use(methodOverride());
app.use(log4js.connectLogger(require("appLog").access, {level: log4js.levels.INFO}));

app.use('/', routes);


var logErrors = function (err, req, res, next) {
    require("appLog").app.error(err.message, err);
    next(err);
};
var clientErrors = function (err, req, res, next) {
    if (req.xhr) {
        res.send(500, {error: 'server error!'});
    } else {
        next(err);
    }
}
function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', {error: err});
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

var socketio = require('socket.io')(server);
//var redis = require('socket.io-redis');
//socketio.adapter(redis({ host: '115.29.10.194', port: 6379 }));
//socketio.use(function (socket, next) {
//    var handshakeData = socket.request;
//    var query = handshakeData._query;
//    var accessId = query.accessId;
//    var data = {
//        accessId: accessId,
//        action: "validateAccessId"
//    };
//
//    httpProvider.sendGet(config.imServiceUrl + "/?data=" + JSON.stringify(data), function (err, response) {
//        if (!err) {
//            var result = JSON.parse(response) || {};
//            if (result.success) {
//                next();
//            } else {
//                next(new Error("not authorized"));
//            }
//        } else {
//            next(new Error("not authorized"));
//        }
//    });
//});

socketio.set('authorization', function (handshakeData, callback) {
    var query = handshakeData._query;
    var accessId = query.accessId;
    var data = {
        accessId: accessId,
        action: "validateAccessId"
    };

    httpProvider.sendGet(config.imServiceUrl + "/?data=" + JSON.stringify(data), function (err, response) {
        if (!err) {
            var result = JSON.parse(response) || {};
            if (result.success) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        } else {
            callback(null, false);
        }
    });
});

socketio.on("connection", function (socket) {
    log.app.info("connect from client, socketid:"+socket.id);
    var data = app.get("ip") + ":" + app.get("port");
    cipher(config.cryptoAlgorithm, config.cryptoKey, data, function (cipherKey) {
        socket.emit("socketId", {socketId: socket.id, key: cipherKey});
    });

    socket.on("disconnect", function (disconn) {
        var data = {
            action: "disconnect",
            socketId: socket.id,
            port: app.get('port'),
            serverIp: app.get('ip')
        };
        httpProvider.sendGet(config.imServiceUrl + "/?data=" + JSON.stringify(data), function (err) {
            if (!err) {
                log.app.info("disconnect a session success");
            } else {
                log.app.error("disconnect a session failure");
            }
        });
    });

    socket.on("token", function(sid){
        var tokenTime = utils.getCurrentDateTime();
        cipher(config.cryptoAlgorithm, config.tokenKey, sid+"_"+tokenTime, function(cipherKey){
            socket.emit("token", {token:cipherKey, tokenTime: tokenTime});
        })
    });
});

function cipher(algorithm, key, data, callback) {
    var encrypted = "";
    var cip = crypto.createCipher(algorithm, key);
    encrypted += cip.update(data, 'binary', 'hex');
    encrypted += cip.final('hex');
    callback(encrypted);
}

exports.socketio = socketio;




