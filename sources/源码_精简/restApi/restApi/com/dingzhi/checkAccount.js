var util = require("appUtil/Utils");
var log = require("appLog");
var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");

var service = {
    checkAccount: function(req, res, next){
        var result ={success:false} ;
        var account=req.params.account;
        mongo.ccDb('bill').collection("platform_serviceNum").find({account:account}).toArray(function(err, aDoc){
            if(aDoc){
                result.success = true;
                if(aDoc.length>0){
                    mongo.ccDb('bill').collection("platform_user").find({account:account}).toArray(function(err,aDoc){
                        if(err){
                            result.message ="查询账号坐席数量失败，请重新查询";
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return;
                        }else{
                            if(aDoc.length>=2){
                                result.message ="该账户已经添加坐席与服务号";
                                util.sendStrResult(JSON.stringify(result), res, req.id());
                                return;
                            }else{
                                result.message ="该账户添加坐席数量少于两个，请添加后重新检测";
                                util.sendStrResult(JSON.stringify(result), res, req.id());
                                return;
                            }
                        }
                    });

                }else{
                    result.message ="该账户未添加服务号，请添加后重新检测";
                    util.sendStrResult(JSON.stringify(result), res, req.id());
                    return;
                }
            }else{
                result.message ="查询账户服务号失败，请重新查询";
                util.sendStrResult(JSON.stringify(result), res, req.id());
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
