var express = require('express');
var bodyParser  = require('body-parser');
var logger = require('appLog');
var utils = require('appUtil/Utils');
var router = express.Router();
var app = require(__baseDir + "/start.js");
var config = require('appConfig').conf;

router.get("/", function(req, res){
    res.render('index', { title: 'Express' });
});

router.post("/push", function(req, res){
    var query = req.body;
    logger.app.info("push msg"+query.json);
    var data = JSON.parse(query.json);
    var sid = data.sid,  msgnum = data.msgNum, socketId = data.socketId, type = data.type, kefu = data.displayName;

    var signal = undefined;
    if(type){
        if(type == "investigate"){
            signal = 200;
        }else if (type == "typeNotice" || type == "vipAssignFail"){
            signal = {sig: 102,  type: type};
        }else{
            signal = {sig: 101, su:kefu, type: type, queueNum: data.queueNum};
        }
    }else if(sid && msgnum && msgnum > 0){
        signal = 100;
    }else if(sid && data.pushImCsrConfig){
        signal = {sig: 201, isInvestigate:data.isInvestigate};
    }
    var socket = app.socketio.sockets.connected[socketId];

    if(socket){
        logger.app.info("push Msg to "+socket.id);

        if(type == "claim" || type == "robot"){
            if(socket[type] == true){
                res.send({success: true});
                return;
            }
        }
        socket[type] = true;
        socket.emit("getMsg", signal);
    }else{
        logger.app.info("not found socket[sid:%s, socketId:%s]", sid, socketId);
    }
    res.send({success: true});
});


module.exports = router;
