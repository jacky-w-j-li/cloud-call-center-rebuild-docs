/**
 * Created by chenguang on 5/3/16.
 */
var util = require("appUtil/Utils");
var httpProvider = require("appHttp");
var log = require("appLog");
var Thenjs = require("thenjs");
var config = require('appConfig');
var mongo = require("appDb/MongoDb");

var service = {
    queryNum : function(req, res, next){
        var result = {code:'500', message:'query failed!'};
        var data = req.params;
        var limit = 1;
        if(data.number){
            limit = data.number;
        }
        var query = {
            account:data.account,
            binding:false,
            unbind:false
        }
        mongo.db().collection("api_fjxh_ims").find(query,{limit: limit}).toArray(function(err, docs) {
            if (err) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(docs){
                result = {code:'200', message:'200 ok', xhNumbers:docs};
                util.sendResult(result, res, req.id());
                return;
            }else{
                result = {code:'400', message:'free number not found!'};
                util.sendResult(result, res, req.id());
                return;
            }
        });

        return;
    },
    queryTelNo : function(req, res, next){
        var result = {code:'500', message:'query failed!'};
        var data = req.params;
        if(!data.telno){
            result = {code:'501', message:'check telno please!'};
            util.sendResult(result, res, req.id());
            return;
        }
        mongo.db().collection("api_fjxh_telno").findOne({telno:data.telno}, function(err, doc) {
            if (err) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(doc){
                result = {code:'200', message:'200 ok', telnos:doc};
                util.sendResult(result, res, req.id());
                return;
            }else{
                result = {code:'400', message:'telno not found!'};
                util.sendResult(result, res, req.id());
                return;
            }
        });

        return;
    },
    queryXHNum : function(req, res, next){
        var result = {code:'500', message:'query failed!'};
        var data = req.params;
        var number = 1;
        if(data.number){
            number = data.number;
        }
        var url = config.ccJavaService + "?Action=fjxhQuery"+"&number="+number
        httpProvider.sendGet(url,function(err, resp){
            if (err || !resp) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            var response = JSON.parse(resp.toString());
            if(response.code != 200){
                result = {code:'400', message:'query failed!'};
                util.sendResult(result, res, req.id());
                return;
            }else{
                result = {code:'200', message:'succeed'};
                result.xhNumbers = JSON.parse(response.xhNumbers);
                util.sendResult(result, res, req.id());
                return;
            }
        });

        return;
    },
    bind : function(req, res, next){
        var result = {code:'404', message:'bind failed!'};
        var data = req.params;
        if(!data.xhIms || !data.key || !data.telno || !data.telnoKey){
            result = {code:'501', message:'check params please!'};
            util.sendResult(result, res, req.id());
            return;
        }
        mongo.db().collection("api_fjxh_ims").findOne({_id:""+data.xhIms+"@"+data.key+""}, function(err,doc) {
            if (err) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!doc){
                result = {code:'401', message:'xhIms not fond!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(doc.binding){
                result = {code:'402', message:'xhIms binding true!'};
                util.sendResult(result, res, req.id());
                return;
            }

            mongo.db().collection("api_fjxh_telno").findOne({_id:""+data.telno+"@"+data.telnoKey+""}, function(err,doc) {
                if (err) {
                    result = {code: '500', message: 'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
                if (!doc) {
                    result = {code: '403', message: 'telno not fond!'};
                    util.sendResult(result, res, req.id());
                    return;
                }

                var url = config.ccJavaService + "?Action=fjxhBind"+"&ims="+data.xhIms+"&key="+data.key+"&telno="+data.telno+"&telnoKey="+data.telnoKey;
                httpProvider.sendGet(url,function(err, resp){
                    if (err || !resp) {
                        result = {code:'500', message:'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    var response = JSON.parse(resp.toString());
                    if(response.code != 200){
                        //if(response.code == 402){
                        //    result = {code:'402', message:'小号不存在或key值不匹配!'};
                        //}else if(response.code == 403){
                        //    result = {code:'403', message:'重复绑定动作或小号不匹配!'};
                        //}
                        //else {
                        result = {code:'400', message:'bind failed,check ims and key please!'};
                        //}
                        util.sendResult(result, res, req.id());
                        return;

                    }else{
                        mongo.db().collection("api_fjxh_ims").update({xhIms:data.xhIms},{ $set:{ binding : true,bindingTelNo:data.telno} }, function(err) {
                            if (err) {
                                result = {code:'500', message:'server has error!'};
                                util.sendResult(result, res, req.id());
                                return;
                            }
                            result = {code:'200', message:'succeed'};
                            util.sendResult(result, res, req.id());
                            return;
                        });
                        return;
                    }
                });
            });
        });
        return;
    },
    calledBind : function(req, res, next){//绑定被叫，1分钟内呼叫有效
        var result = {code:'404', message:'dial failed!'};
        var data = req.params;
        if(!data.xhIms || !data.key || !data.calledNo){
            result = {code:'501', message:'check params please!'};
            util.sendResult(result, res, req.id());
            return;
        }
        mongo.db().collection("api_fjxh_ims").findOne({_id:""+data.xhIms+"@"+data.key+""}, function(err,doc) {
            if (err) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!doc){
                result = {code:'401', message:'xhIms not fond!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!doc.binding){
                result = {code:'402', message:'xhIms binding false!'};
                util.sendResult(result, res, req.id());
                return;
            }

            var url = config.ccJavaService + "?Action=fjxhDial"+"&ims="+data.xhIms+"&key="+data.key+"&calleeNbr="+data.calledNo;
            httpProvider.sendGet(url,function(err, resp){
                if (err || !resp) {
                    result = {code:'500', message:'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
                var response = JSON.parse(resp.toString());
                if(response.code != 200){
                    result = {code:'400', message:'calledBind failed, check ims and key please!'};
                    util.sendResult(result, res, req.id());
                    return;
                }else{
                    result = {code:'200', message:'succeed'};
                    util.sendResult(result, res, req.id());
                    return;
                }
            });
        });
        return;
    },
    unbind : function(req, res, next){
        var result = {code:'404', message:'unbind failed!'};
        var data = req.params;
        if(!data.xhIms || !data.key){
            result = {code:'501', message:'check params please!'};
            util.sendResult(result, res, req.id());
            return;
        }
        mongo.db().collection("api_fjxh_ims").findOne({_id:""+data.xhIms+"@"+data.key+""}, function(err,doc) {
            if (err) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!doc){
                result = {code:'401', message:'xhIms not fond!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!doc.binding){
                result = {code:'402', message:'xhIms binding false!'};
                util.sendResult(result, res, req.id());
                return;
            }

            var url = config.ccJavaService + "?Action=fjxhClose"+"&ims="+data.xhIms+"&key="+data.key;
            httpProvider.sendGet(url,function(err, resp){
                if (err || !resp) {
                    result = {code:'500', message:'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
                var response = JSON.parse(resp.toString());
                if(response.code != 200){
                    result = {code:'400', message:'unbind failed!'};
                    util.sendResult(result, res, req.id());
                    return;
                }else{
                    mongo.db().collection("api_fjxh_ims").update({_id:data.xhIms+"@"+data.key},{$set:{unbind:true}}, function(err) {
                        if (err) {
                            result = {code:'500', message:'server has error!'};
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        result = {code:'200', message:'succeed'};
                        util.sendResult(result, res, req.id());
                        return;
                    });
                }
            });

        });

        return;
    }
}

module.exports = service;