var util = require("appUtil/Utils");
var mongo = require("appDb/MongoDb");
var log = require("appLog");
var schedule = require('node-schedule');
var redisUtils = require("m7rds");
var redisField = require(__baseDir + '/com/common/RedisKeyPrefix');
var rateLimitConfig = require(__baseDir + '/com/common/rateLimitConfig');



exports.restAuthorization = function(req,res,callback){
    var success = false;
    var sig = "";
    var query = req.query;
    if(req.trustIp){
        success = true;
        callback(success);
        return;
    }
    if(query && query.sig){
        sig = query.sig;
    }else{
        util.send403(res, req.id());
        callback(success);
        return;
    }
    if(req.headers.authorization){
        var authorization = req.headers.authorization;
        //base64解码
        var decodedstr = new Buffer(authorization, 'base64').toString();
        var decodedstrs = decodedstr.split(':');
        if(decodedstrs.length == 2){
            //判断时间戳
            var requestDate = decodedstrs[1];
            if(util.isAuthorizationDateType(requestDate)){
                var date1 = new Date(requestDate.substring(0,4)+"/"+requestDate.substring(4,6)+"/"+requestDate.substring(6,8)+
                " "+requestDate.substring(8,10)+":"+requestDate.substring(10,12)+":"+requestDate.substring(12,14));
                var currentDate = new Date();
                var difftime = (currentDate.getTime()-date1.getTime())/1000;
                if(difftime>300){
                    util.send403(res, req.id());
                    callback(success);
                    return;
                }else{
                    mongo.db().collection("account_secret").findOne({_id:decodedstrs[0]}, function(err, doc) {
                        if (err) {
                            result = {code:400, message:'server has error!'};
                            util.sendResult(result, res, req.id());
                            callback(success);
                            return;
                        }
                        if(doc){
                            var str = decodedstrs[0] + doc.secret + decodedstrs[1];
                            //MD5加密
                            var md5Str = util.md5(str);
                            if(md5Str == sig){
                                success = true;
                                callback(success);
                                return;
                            }else{
                                util.send403(res, req.id());
                                callback(success);
                                return;
                            }
                        }else{
                            util.send403(res, req.id());
                            callback(success);
                            return;
                        }
                    });
                }
            }else{
                util.send403(res, req.id());
                callback(success);
                return;
            }
        }else{
            util.send403(res, req.id());
            callback(success);
            return;
        }
    }else{
        util.send403(res, req.id());
        callback(success);
        return;
    }
};

exports.parseRestPostActionData = function(req){
    var action = {};
    if (typeof req.body == "object") {
        log.app.info(" request["+req.id()+"] body ["+JSON.stringify(req.body) +"]");
    }else{
        log.app.info(" request["+req.id()+"] body ["+req.body +"]");
    }
    try {
        var account = "";
        var url = req.url;
        if(url){
            var urls = url.split('/');
            if(urls && urls.length > 1){
                var lastUrl = urls[urls.length-1];
                var tempParam = lastUrl.split('?');
                var length = req.trustIp ? 1 : 2;
                length = tempParam.length == 2 ? 2 : length;
                if(tempParam && tempParam.length == length){
                    account = tempParam[0];
                }
            }
        }
        var query = req.query;
        if (req.method == 'POST') {
            query = req.body;
        }
        action.data = {};
        if(query){
            if (typeof req.body == "object") {
                action.data = query;
            }else{
                action.data = JSON.parse(query);
            }
        }
        action.data.account = account;
    } catch (e) {
        action.err = e.message;
        log.app.error("json parse error:",e);
    }
    return action;
};

exports.checkProvinceCity = function(province,city,callback){
    var data = {};
    if(province){
        mongo.ccDb("cc").collection("app_optiondic").findOne({accountId:"system"}, function(err,doc) {
            if(err){
                result = {code:500, message:'server has error!'};
                util.sendResult(result, res, req.id());
                callback(data);
                return;
            }
            if(doc){
                var provinceOptions = doc.options;
                for(var i=0; i<provinceOptions.length; i++){
                    if(province == provinceOptions[i].name){
                        data.provinceKey = provinceOptions[i].key;
                        if(city){
                            var cityOptions = provinceOptions[i].options;
                            for(var j=0; j<cityOptions.length; j++){
                                if(city == cityOptions[j].name){
                                    data.cityKey = cityOptions[j].key;
                                }
                            }
                        }
                        callback(data);
                        return;
                    }
                }
                callback(data);
                return;
            }else{
                callback(data);
                return;
            }
        });
    }else{
        callback(data);
        return;
    }
};

exports.rateLimiter = function (version,module,method,account,callback) {
    var rateCount = rateLimitConfig[version][module][method].rateCount;
    var reply = {state: false};
    if(rateCount){
        var redisKey = version.toUpperCase()+"_"+module.toUpperCase()+"_"+method.toUpperCase()+"_"+"COUNT";
        redisUtils.hash.get(redisField[redisKey],account,function(err,result){
            if(err){
                result = {code:500, message:'server has error!'};
                util.sendResult(result, res, req.id());
                callback(reply);
                return;
            }
            if(result){
                if(parseInt(result) < parseInt(rateCount)){
                    var currentCount = parseInt(result) + 1;
                    redisUtils.hash.set(redisField[redisKey],account,currentCount.toString(), function(err,setResult){
                        reply.state = true;
                        callback(reply);
                        return;
                    }, redisField.REDIS_DB1);
                }else{
                    reply.count = rateCount;
                    callback(reply);
                    return;
                }
            }else{
                redisUtils.hash.set(redisField[redisKey],account,"1", function(err,setResult){
                    reply.state = true;
                    callback(reply);
                    return;
                }, redisField.REDIS_DB1);
            }
        },redisField.REDIS_DB1);
    }else{
        reply.state = true;
        callback(reply);
        return;
    }
};

exports.initSystemSchedule = function(){
    exports.initRateLimitCountCache();
    var j = schedule.scheduleJob('*/1 * * * *', function(){
        exports.initRateLimitCountCache();
    });
};

exports.initRateLimitCountCache = function () {
    var methods = redisField.initCacheMethod;
    if(methods && methods.length>0){
        for(var i=0; i<methods.length; i++){
            redisUtils.string.del(redisField[methods[i]],function(err,num){}, redisField.REDIS_DB1);
        }
    }
};

exports.getAssRequestUrl = function(account, exten, callback){
    var result = {success : false};
    if(account == null){
        result.Message = "lack of account parameter";
        callback(result);
    }else if(exten == null){
        result.Message = "lack of exten parameter";
        callback(result);
    }else{
        mongo.ccDb('bill').collection('platform_user').findOne({account:account,exten:exten}, function (err, extenInfo) {
            if(err){
                result.Message = 'Find exten error when getAssRequestUrl';
                callback(result);
            }else{
                if(extenInfo == null){
                    result.Message = 'Find no exten when getAssRequestUrl';
                    callback(result);
                }else{
                    var extenPbx = extenInfo.pbx;
                    mongo.ccDb('bill').collection('platform_cc_pbx').findOne({_id:extenPbx, status:'enable'}, function (err, pbxInfo) {
                        if(err){
                            result.Message = 'Find pbx error when getAssRequestUrl';
                            callback(result);
                        }else{
                            if(pbxInfo == null){
                                result.Message = 'Find no pbx when getAssRequestUrl';
                                callback(result);
                            }else{
                                result.success = true;
                                var configAddr = pbxInfo.configAddr;
                                var assAddr = pbxInfo.assAddr;
                                result.assUrl = configAddr.substring(0, configAddr.lastIndexOf(":")) + assAddr.substring(assAddr.lastIndexOf(':'));
                                callback(result);
                            }
                        }
                    });
                }
            }
        });
    }
};