var express = require('express');
var router = express.Router();
var app = require(__baseDir + "/app.js");
var logger = require("appLog");
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');

router.get('/', function(req, res) {
    res.render('index', { title: 'Hello, Socket' });
});

router.all("/push", function(req, res){
    var query = req.query;
    if(req.method == "POST"){
        query = req.body;
    }
    logger.app.info("received push msg from["+utils.getReqIp(req)+"] :" + query.msg);
    var data = JSON.parse(decodeURI(query.msg));
    var userId = data.userId;
    mongo.db().collection('app_push_client').findOne({_id:userId}, function(err, doc){
        if(err){
            res.send({success: false, message: 'server find db error!'});
            return;
        }
        if(doc){
            var socketId = doc.socketId;
            var event = data.eventData; //example 其他的业务信息，可以有很多
            //example 业务处理，给到客户端的信号
            var socket = app.socketio.sockets.connected[socketId];
            if(socket){
                logger.app.info("push msg socketId["+socketId+"], userId["+userId+"] :"+ JSON.stringify(data));
                if(event.Event=="BatchNewWebchat"){
                    var data2 = event.Data;
                    for(var j=0; j<data2.length; j++){
                        var pushData = utils.deepClone(event);
                        pushData.Event = "NewWebchat";
                        delete pushData.Data;
                        pushData.Data = data2[j];
                        socket.emit("pushMsg", pushData, function(data){
                            if(data){
                                logger.app.info("push msg to client success"+ JSON.stringify(data));
                            }

                        });
                    }
                }else{
                    socket.emit("pushMsg", event, function(data){
                        if(data){
                            logger.app.info("push msg to client success"+ JSON.stringify(data));
                        }

                    });
                }


            }else{
                logger.app.info("not found socket[socketId:%s]", socketId);
            }
            res.send({success: true});
        }else{
            res.send({success: true, message: 'user not logined!'});
        }
    })
});

router.all("/batchPush", function(req, res){
    res.send({success: true});
    var query = req.query;
    if(req.method == "POST"){
        query = req.body;
    }
    logger.app.info("received push msg from["+utils.getReqIp(req)+"] :" + query.msg);
    try{
        var data = JSON.parse(decodeURI(query.msg));
    }catch (e){
        logger.app.error(e);
        data = JSON.parse(query.msg);
    }

    var userId = data.userId;
    var userIds = [];
    var userMap = {};
    for(var i=0; i<userId.length;i++){
        userIds.push(userId[i].split(":")[0]);
        userMap[userId[i].split(":")[0]] = userId[i].split(":")[1];
    }

    mongo.db().collection('app_push_client').find({_id:{$in:userIds}}).toArray(function(err, docs){
        if(err){
            //res.send({success: false, message: 'server find db error!'});
            return;
        }
        if(docs){
            for(var i=0; i<docs.length; i++){
                var socketId = docs[i].socketId;
                var event = data.eventData; //example 其他的业务信息，可以有很多
                //example 业务处理，给到客户端的信号
                var socket = app.socketio.sockets.connected[socketId];
                if(socket){
                    logger.app.info("push msg socketId["+socketId+"], userId["+docs[i]._id+"] :"+ JSON.stringify(data));
                    event.Data.undealNum = userMap[docs[i]._id];
                    socket.emit("pushMsg", event);
                }else{
                    logger.app.info("not found socket[socketId:%s]", socketId);
                }
            }

        }else{
            //res.send({success: true, message: 'user not logined!'});
        }
    })
});




module.exports = router;
