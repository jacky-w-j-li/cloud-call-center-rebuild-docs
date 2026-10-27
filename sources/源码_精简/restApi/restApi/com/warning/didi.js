/**
 * Created by chenguang on 5/19/16.
 */
var util = require("appUtil/Utils");
var logger = require("appLog");
var mongo = require("appDb/MongoDb");
var httpProvider = require("appHttp");

var service = {
    notify : function(req, res, next){
        var result = {code:'200', message:'200 ok!'};
        var data = req.params;
        mongo.db().collection("didi_warning_url").findOne({}, function(err, doc){
            if (err) {
                result = {code:'400', message:'account not found!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(doc){
                var url = doc._id+'?type='+data.type+'&status='+data.status;
                httpProvider.sendGet(url, function(err, httpRes){
                    if(err) {
                        result = {code:'500', message:'Sent didi warning has error: ' + url + ' res:'+err.toString()};
                        logger.app.warn('Sent didi warning has error: ' + url + ' res:'+err.toString());
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    result = {code:'200', message:'200 ok! didiRes:'+httpRes.toString()};
                    console.log(httpRes.toString());
                    logger.app.info('Sent didi warning success: ' + url + ' res: ' + httpRes.toString());
                    util.sendResult(result, res, req.id());
                    return;
                });
            }else{
                result = {code:'404', message:'warning url not config!'};
                util.sendResult(result, res, req.id());
                return;
            }
        });
    },
    notifyLine : function(req, res, next){
        var result = {code:'200', message:'200 ok!'};
        var data = req.params;
        mongo.db().collection("didi_warning_url").findOne({}, function(err, doc){
            if (err) {
                result = {code:'400', message:'account not found!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(doc){
                var url = doc._id+'?type='+data.type+'&status='+data.status;
                if(data.city_id){
                    url += "&city_id="+data.city_id;
                }
                httpProvider.sendGet(url, function(err, httpRes){
                    if(err) {
                        result = {code:'500', message:'Sent didi warning has error: ' + url + ' res:'+err.toString()};
                        logger.app.warn('Sent didi warning has error: ' + url + ' res:'+err.toString());
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    result = {code:'200', message:'200 ok! didiRes:'+httpRes.toString()};
                    console.log(httpRes.toString());
                    logger.app.info('Sent didi warning success: ' + url + ' res: ' + httpRes.toString());
                    util.sendResult(result, res, req.id());
                    return;
                });
            }else{
                result = {code:'404', message:'warning url not config!'};
                util.sendResult(result, res, req.id());
                return;
            }
        });
    }
};

module.exports = service;