
var util = require("appUtil/Utils");
var log = require("appLog");
var http = require('appHttp');
var mongo = require("appDb/MongoDb");
var restUtil = require(__baseDir + '/com/common/restUtil');

var service = {
    queryQueue:function(req, res, next) {
        var result = {};
        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var account = req.params.account;
                var password = req.params.password;

                if (account == null || account == "" || password == null || password == "") {
                    result.code = 400;
                    result.message = "please check your parameters";
                    util.sendResult(result,res,req.id());
                    return;
                }
                mongo.ccDb("bill").collection("platform_account").findOne({_id:account,managerPassword:password},function(err1,accountDoc){
                    if(!err1){
                        if(accountDoc){
                            var gSelector = {"Account":accountDoc._id};
                            mongo.ccDb("cc").collection("manager_ivr_skillgroup").find(gSelector).toArray(function(err2,docList){
                                if(!err2){
                                    if(docList && docList.length>0){
                                        dealAgentInfoInDocList(docList, function (result2) {
                                            util.sendResult(result2,res,req.id());
                                        });
                                    }else{
                                        result.code = 200;
                                        result.message = "200 OK";
                                        result.data = docList;
                                        util.sendResult(result,res,req.id());
                                    }
                                }else{
                                    log.app.error(err.stack);
                                    result.code = 500;
                                    result.message = "Internal Server Error";
                                    util.sendResult(result,res,req.id());
                                    return;
                                }
                            });
                        }else{
                            result.code = 210;
                            result.message = 'account or password incorrect';
                            util.sendResult(result,res,req.id());
                            return;
                        }
                    }else{
                        log.app.error(err.stack);
                        result.code = 500;
                        result.message = "Internal Server Error";
                        util.sendResult(result,res,req.id());
                        return;
                    }
                });
            }
        });
    }
};
function dealAgentInfoInDocList(data, callback){
    var ids = [];
    for(var i=0; i<data.length; i++){
        var item = data[i];
        if(item.AssignMembers.length > 0){
            for(var j=0; j<item.AssignMembers.length; j++){
                ids.push(item.AssignMembers[j].agentID);
            }
        }
    }
    if(ids.length > 0){
        var selector = {"_id": {$in:ids}};
        mongo.db("bill").collection("platform_user").find(selector).toArray(function(err, kfInfo){
            if(err){
                var result = {code:500,message:"Internal Server Error"};
                callback(result);
                return ;
            }
            if(kfInfo.length > 0){
                for(var i=0; i<data.length; i++){
                    var item = data[i];
                    delete item._id;
                    delete item.State;
                    delete item.Type;
                    delete item.Peer;
                    delete item.Music;
                    delete item.MusicClass;
                    if(item.AssignMembers.length > 0){
                        for(var j=0; j<item.AssignMembers.length; j++){
                            for(var kfi=0; kfi<kfInfo.length; kfi++){
                                if(data[i].AssignMembers[j].agentID == kfInfo[kfi]._id){
                                    data[i].AssignMembers[j].agentExten = kfInfo[kfi].exten;
                                    data[i].AssignMembers[j].agentName = kfInfo[kfi].displayName;
                                }
                            }
                        }
                    }
                }
            }
            var result ={code:200,message:"200 OK"};
            result.data = data;
            callback(result);
        });
    }else{
        var result = {code:200,message:"200 OK"};
        result.data = data;
        callback(result);
    }
}
module.exports = service;