var util = require("appUtil/Utils");
var log = require("appLog");
var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");

var service = {
    byEmpNoGetPhone : function(req, res, next){//查询单个
        var result = "404";
        var exten = req.params.exten;
        mongo.db('dingzhi').collection("xinhj_zongji").findOne({_id: exten},function(err, aDoc){
            if (err) {
                util.sendStrResult(result, res, req.id());
                return next();
            }
            if(aDoc){
                result = aDoc.num;
                util.sendStrResult(JSON.stringify(result), res, req.id());
                return next();
            }else{
                util.sendStrResult(result, res, req.id());
                return;
            }
        });
    },
    allAgent : function(req, res, next){//查询所有
        var result = "404";
        var limit=req.params.limit;
        var skip = (req.params.skip)*limit;
        mongo.db('dingzhi').collection("xinhj_zongji").find({}, {sort: {"_id":1}, limit: limit, skip: skip}).toArray(function(err, aDoc){
            if (err) {
                util.sendStrResult(result, res, req.id());
                return next();
            }
            if(aDoc){
                result ={};
               // result ="200";
                result.Succeed = true;
                result.data=aDoc;
                mongo.db('dingzhi').collection("xinhj_zongji").count({},function(err, count){
                    if (!err) {
                        result.count = count;
                        util.sendStrResult(JSON.stringify(result), res, req.id());
                        return next();
                    } else {
                        util.sendStrResult(result, res, req.id());
                        return next();
                    }
                });
            }
        });
    },
    addEgentAndPhone: function (req, res, next){//添加
    var result = "404";
    var agents = req.params;
    var data = {
        _id : agents.agent,
        num : agents.phoneNum,
    }
        mongo.db('dingzhi').collection("xinhj_zongji").findOne({_id: data._id},function(err, aDoc){
            if(err){
                util.sendStrResult(result, res, req.id());
                return next();
            }else if(aDoc){
                result="该坐席已经存在，无法添加"
                util.sendStrResult(result, res, req.id());
                return next();
            }else{
                mongo.db('dingzhi').collection("xinhj_zongji").insert(data,function(err){
                    if (err) {
                        util.sendStrResult(result, res, req.id());
                        return next();
                    }else{
                        result = "200";
                        util.sendStrResult(result, res, req.id());
                        return next();
                    }
                });
            }
        });

},
    deleteEgentAndPhone : function(req, res, next){//删除
        var result = "404";
        var data = req.params;
       var _id = data.exten;
        mongo.db('dingzhi').collection("xinhj_zongji").findOne({_id: _id},function(err, aDoc) {
            if (err) {
                util.sendStrResult(result, res, req.id());
                return next();
            } else if ((aDoc.length) < 1) {
                result = "该坐席不存在，无法删除"
                util.sendStrResult(result, res, req.id());
                return next();
            } else {
                mongo.db('dingzhi').collection("xinhj_zongji").remove({_id: _id}, function (err) {
                    if (err) {
                        util.sendStrResult(result, res, req.id());
                        return next();
                    } else {
                        result = "200";
                        util.sendStrResult(result, res, req.id());
                        return next();
                    }
                });
            }
        });

    },
    updateEgentAndPhone : function(req, res, next){//修改
        var result = "404";
        var agents = req.params;
        var _id = agents.agent;
        var num = agents.phoneNum;
        mongo.db('dingzhi').collection("xinhj_zongji").findOne({_id: _id},function(err, aDoc) {
            if (err) {
                util.sendStrResult(result, res, req.id());
                return next();
            } else if ((aDoc.length) < 1) {
                result = "该坐席不存在，无法修改"
                util.sendStrResult(result, res, req.id());
                return next();
            } else {
                mongo.db('dingzhi').collection("xinhj_zongji").update({_id: _id}, {num: num}, function (err) {
                    if (err) {
                        util.sendStrResult(result, res, req.id());
                        return next();
                    } else {
                        result = "200";
                        util.sendStrResult(result, res, req.id());
                        return next();
                    }
                });
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
