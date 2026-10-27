var util = require("appUtil/Utils");
var log = require("appLog");
var mongo = require("appDb/MongoDb");
var restUtil = require(__baseDir + '/com/common/restUtil');
var redisUtils = require("m7rds");
var redisField = require(__baseDir + '/com/common/RedisKeyPrefix');
var rateLimitConfig = require(__baseDir + '/com/common/rateLimitConfig');


var service = {
    queryWebchatSession: function (req,res) {
        var result = {code: 400, message: 'Please check your parameters'};
        restUtil.restAuthorization(req, res,function(authorization) {
            if (authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if (action.err) {
                    result = {code: 400, message: action.err};
                    util.sendResult(result, res, req.id());
                    return;
                }
                var data = action.data;
                if (!data.account) {
                    util.sendResult(result, res, req.id());
                    return;
                }
                restUtil.rateLimiter("v20160818","webChat","queryWebchatSession",data.account,function(rateLimitreply){
                    if(rateLimitreply.state){
                        var query = {};
                        query.account = data.account;
                        var maxResultCount = rateLimitConfig["v20160818"]["webChat"]["queryWebchatSession"].resultCount;
                        var limit = maxResultCount;
                        var page = 1;
                        if(data.page){
                            if(util.isNum(data.page)){
                                page = data.page;
                            }else{
                                util.sendResult(result , res, req.id());
                                return;
                            }
                        }
                        if(data.pageSize){
                            if(util.isNum(data.pageSize)){
                                if (data.pageSize > maxResultCount) {
                                    util.sendResult(result, res, req.id());
                                    return;
                                } else {
                                    limit = data.pageSize;
                                }
                            }else{
                                util.sendResult(result, res, req.id());
                                return;
                            }
                        }
                        var skip = (page - 1) * limit;
                        self._setQuerySessionCondition(data,query);
                        mongo.ccDb("cc").collection("app_multi_channel_chat_session").find(query,{sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                            if(err){
                                result = {code:500, message:'server has error!'};
                                util.sendResult(result, res, req.id());
                                return;
                            }
                            if(docs){
                                result = {code:200, message:'success!'};
                                var resultData =  {};
                                resultData.count = docs.length;
                                var resultSession = [];
                                if(docs.length>0){
                                    mongo.ccDb().collection("platform_user").find({account: data.account}).toArray(function (err, users) {
                                        if(err){
                                            result = {code:500, message:'server has error!'};
                                            util.sendResult(result, res, req.id());
                                            return;
                                        }
                                        mongo.ccDb("cc").collection("app_channel_dic").findOne({account:data.account,"type":"webchatCSR"},function(err, dic) {
                                            if(err){
                                                result = {code:500, message:'server has error!'};
                                                util.sendResult(result, res, req.id());
                                                return;
                                            }
                                            mongo.ccDb("cc").collection("app_mail_queue").find({Account: data.account}).toArray(function (err, queues) {
                                                if (err) {
                                                    result = {code:500, message:'server has error!'};
                                                    util.sendResult(result, res, req.id());
                                                    return;
                                                }
                                                for(var i=0; i<docs.length; i++){
                                                    var userId = docs[i].user;
                                                    var toPeer = docs[i].toPeer;
                                                    var appraiseKey = docs[i].appraiseKey;
                                                    var history = docs[i].history;
                                                    var fromUser = docs[i].fromUser;
                                                    var previousPeer = docs[i].previousPeer;
                                                    var finishUser = docs[i].finishUser;


                                                    if(userId){
                                                        for(var k=0; k<users.length; k++){
                                                            if(userId === users[k]._id){
                                                                docs[i].user =  '['+users[k].exten+']'+users[k].displayName;
                                                                break;
                                                            }

                                                        }
                                                    }

                                                    if(toPeer){
                                                        for(var l=0; l<queues.length; l++){
                                                            if(toPeer === queues[l].Exten){
                                                                docs[i].toPeer = queues[l].DisplayName;
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    if(fromUser){
                                                        for(var k=0; k<users.length; k++){
                                                            if(fromUser === users[k]._id){
                                                                docs[i].fromUser =  '['+users[k].exten+']'+users[k].displayName;
                                                                break;
                                                            }

                                                        }
                                                    }

                                                    if(finishUser){
                                                        for(var k=0; k<users.length; k++){
                                                            if(finishUser === users[k]._id){
                                                                docs[i].finishUser =  '['+users[k].exten+']'+users[k].displayName;
                                                                break;
                                                            }

                                                        }
                                                    }

                                                    if(previousPeer){
                                                        for(var l=0; l<queues.length; l++){
                                                            if(previousPeer === queues[l].Exten){
                                                                docs[i].previousPeer = queues[l].DisplayName;
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    if(appraiseKey){
                                                        if(dic.options && dic.options.length>0){
                                                            for(var j=0; j<dic.options.length; j++){
                                                                if(appraiseKey === dic.options[j].key){
                                                                    docs[i].appraise = dic.options[j].name;
                                                                    delete docs[i].appraiseKey;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }





                                                    if(history && history.length>0){
                                                        for(var m=0; m<history.length; m++){
                                                            if(history[m].user){
                                                                for(var n=0; n<users.length; n++){
                                                                    if(history[m].user ===  users[n]._id){
                                                                        docs[i].history[m].user = users[n].exten;
                                                                        break;
                                                                    }
                                                                }

                                                            }

                                                            if(history[m].toPeer){
                                                                for(var x=0; x<queues.length; x++){
                                                                    if(history[m].toPeer === queues[x].Exten){
                                                                        docs[i].history[m].toPeer = queues[x].DisplayName;
                                                                    }
                                                                }

                                                            }

                                                            if(history[m].invitedUser){
                                                                for(var y=0; y<users.length; y++){
                                                                    if(history[m].invitedUser ===  users[y]._id){
                                                                        docs[i].history[m].invitedUser = users[y].exten;
                                                                        break;
                                                                    }
                                                                }

                                                            }

                                                        }
                                                    }
                                                }
                                                resultData.webchatSession = docs;
                                                result.data = resultData;
                                                util.sendResult(result, res, req.id());
                                                return;
                                            });
                                        });
                                    });
                                }else{
                                    result.data = resultData;
                                    util.sendResult(result, res, req.id());
                                    return;
                                }
                            }
                        });
                    }else{
                        result = {code : 400, message: 'Server is busy, max request frequency is '+rateLimitreply.count+'/min'};
                        util.sendResult(result, res, req.id());
                        return;
                    }

                });
            }
        });
    },
    queryWebchatMessage: function (req,res) {
        var result = {code: 400, message: 'Please check your parameters'};
        restUtil.restAuthorization(req, res,function(authorization) {
            if(authorization) {
                var action = restUtil.parseRestPostActionData(req);
                if (action.err) {
                    result = {code: 400, message: action.err};
                    util.sendResult(result, res, req.id());
                    return;
                }
                var data = action.data;
                if (!data.account) {
                    util.sendResult(result, res, req.id());
                    return;
                }
                restUtil.rateLimiter("v20160818","webChat","queryWebchatMessage",data.account,function(rateLimitreply) {
                    if (rateLimitreply.state) {
                        if(!data.sid){
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        var query = {};
                        query.sid = data.sid;
                        if (data.dateTimeBegin && !data.dateTimeEnd) {
                            query.dateTime = {$gte: data.dateTimeBegin};
                        }
                        if (data.dateTimeEnd && !data.dateTimeBegin) {
                            query.dateTime = {$lte: data.dateTimeEnd};
                        }
                        if (data.dateTimeBegin && data.dateTimeEnd) {
                            query.dateTime = {$gte: data.dateTimeBegin,$lte: data.dateTimeEnd};
                        }
                        mongo.ccDb("cc").collection("app_kefu_im_message").find(query).toArray(function (err, docs) {
                            if(err){
                                result = {code:500, message:'server has error!'};
                                util.sendResult(result, res, req.id());
                                return;
                            }
                            if(docs){
                                result = {code:200, message:'success!'};
                                var resultData =  {};
                                resultData.count = docs.length;
                                if(docs.length>0){
                                    resultData.webchatMessage = docs;
                                }
                                result.data = resultData;
                                util.sendResult(result, res, req.id());
                                return;
                            }
                        });
                    }else{
                        result = {code : 400, message: 'Server is busy, max request frequency is '+rateLimitreply.count+'/min'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                });
            }
        });
    }
};


var self = {
    _setQuerySessionCondition: function (data,query) {
        query.type = "webchat";
        if (data.createTimeBegin&&!data.createTimeEnd) {
            query.createTime = {$gte: data.createTimeBegin + " 00:00:00"};
        }
        if (data.createTimeEnd&&!data.createTimeBegin) {
            query.createTime = {$lte: data.createTimeEnd + " 00:00:00"};
        }
        if (data.createTimeBegin&&data.createTimeEnd) {
            query.createTime = {$gte: data.createTimeBegin + " 00:00:00",$lte: data.createTimeEnd + " 00:00:00"};
        }
        if (data.beginTimeBegin&&!data.beginTimeEnd) {
            query.beginTime = {$gte: data.beginTimeBegin + " 00:00:00"};
        }
        if (data.beginTimeEnd&&!data.beginTimeBegin) {
            query.beginTime = {$lte: data.beginTimeEnd};
        }
        if (data.beginTimeBegin&&data.beginTimeEnd) {
            query.beginTime = {$gte: data.beginTimeBegin + " 00:00:00",$lte: data.beginTimeEnd + " 00:00:00"};
        }
        if (data.endTimeBegin&&!data.endTimeEnd) {
            query.endTime = {$gte: data.endTimeBegin + " 00:00:00"};
        }
        if (data.endTimeEnd&&!data.endTimeBegin) {
            query.endTime = {$lte: data.endTimeEnd + " 00:00:00"};
        }
        if (data.endTimeBegin&&data.endTimeEnd) {
            query.endTime = {$gte: data.endTimeBegin + " 00:00:00",$lte: data.endTimeEnd + " 00:00:00"};
        }
        if (data.manualTimeBegin&&!data.manualTimeEnd) {
            query.manualTime = {$gte: new Date(data.manualTimeBegin + " 00:00:00").getTime()};
        }
        if (data.manualTimeEnd&&!data.manualTimeBegin) {
            query.manualTime = {$lte: new Date(data.manualTimeEnd + " 00:00:00").getTime()};
        }
        if (data.manualTimeBegin&&data.manualTimeEnd) {
            query.manualTime = {$gte: new Date(data.manualTimeBegin + " 00:00:00" ).getTime(),$lte: new Date(data.manualTimeEnd + " 00:00:00").getTime()};
        }
        if (data.msgCountType && data.msgCount) {
            var msgCount = parseInt(data.msgCount);
            if (data.msgCountType == "gt") {
                query.totalMsgCount = {$gt: msgCount}
            } else if (data.msgCountType == "lt") {
                query.totalMsgCount = {$lt: msgCount}
            } else if (data.msgCountType == "eq") {
                query.totalMsgCount = msgCount;
            }
        }

        if(data.area){
            query.area = {$regex: eval("/" + data.area + "/i")};
        }

        if(data.sName){
            query.sName = {$regex: eval("/" + data.sName + "/i")};
        }

        if(data._id){
            query._id = data._id;
        }
    }
};

module.exports = service;