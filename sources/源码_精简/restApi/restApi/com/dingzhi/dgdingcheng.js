var util = require("appUtil/Utils");
var log = require("appLog");
var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");

var service = {
    allPhone: function(req, res, next){
        var result = "404";
        var now = new Date();
        var str = now.getFullYear()+""+(now.getMonth()+1)+""+now.getDate();
        mongo.db('dingzhi').collection("dgdingcheng").find().toArray(function(err, aDoc){
            if (err) {
                util.sendStrResult(result, res, req.id());
                return next();
            }
            if(aDoc){
                for(var i = 0;i < aDoc.length;i++){
                    if(aDoc[i]._id == "lastUseNum"){
                        var Num = aDoc[i].num;
                    }
                    if(aDoc[i]._id == "lastUseTime"){
                        var  lastUseTime = aDoc[i].num;
                    }
                }
                if(lastUseTime==str){
                    for(var k = 0;k < aDoc.length;k++){
                        if(aDoc[k]._id == Num){
                            var result = aDoc[k].num;
                        }
                    }
                }else {
                    var newNum = Num+1;
                    if(newNum == 11){
                        newNum = 1;
                    }
                    for(var m = 0; m < aDoc.length;m++){
                        if(aDoc[m]._id == newNum){
                            var result = aDoc[m].num;
                        }
                    }
                    mongo.db('dingzhi').collection("dgdingcheng").update({_id: "lastUseTime"}, {num: str}, function (err) {
                        if(err){
                            log.app.info(" request["+req.id()+"] body ["+"lastUseTime update failed"+"]");
                        }
                        mongo.db('dingzhi').collection("dgdingcheng").update({_id: "lastUseNum"}, {num: newNum}, function (err) {
                            if(err){
                                log.app.info(" request["+req.id()+"] body ["+"lastUseNum update failed"+"]");
                            }
                        });
                    });

                }
                util.sendStrResult(result, res, req.id());
                return next();
            }else{
                util.sendStrResult(result, res, req.id());
                return;
            }
        });
    }

};

var self = {
    parsePostActionData: function(req){
        var action = {};
        if (typeof req.body == "object") {
            log.app.info(" request["+req.id()+"] body ["+JSON.stringify(req.body) +"]");
        }else{
            log.app.info(" request["+req.id()+"] body ["+req.body +"]");
        }
        try {
            var query = req.query;
            if (req.method == 'POST') {
                query = req.body;
            }
            if (typeof req.body == "object") {
                action.data = query;
            }else{
                action.data = JSON.parse(query);
            }
        } catch (e) {
            action.err = e.message;
            log.app.error("json parse error:",e);
        }
        return action;
    }
}

module.exports = service;
