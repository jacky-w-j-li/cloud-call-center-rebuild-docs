var util = require("appUtil/Utils");
var log = require("appLog");
var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");

var service = {
    bind : function(req , res , next){
        var result = {code : 200 , message :"bind success!"};
        var action = self.parsePostActionData(req);
        //console.log(action);
        var data = action.data;
        if(action.err){
            result = {code : 400, message: action.err};
            util.sendResult(result , res, req.id());
            return;
        }
        if(!data.num_a || !data.num_b || !data.city_id){
            result = {code : 400, message: 'Please check your parameters'};
            util.sendResult(result , res, req.id());
            return;
        }
        self.checkBjGansuNum(data, function(isOk){
            if(!isOk){
                result = {code: 32004, message: 'gray limited! gan su province is fobidden!'};
                util.sendResult(result , res, req.id());
                return;
            }
            mongo.db().collection("didi_num_bind").find({num_a:data.num_a},{trunk_num:1}).toArray(function(err, aList) {
                if(err){
                    result = {code: 11001, message: 'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
                //{ $where : 'this.bind_count < this.max_bind_count'}
                var findNum = {city_id:data.city_id, max_bind_count:{$ne:0}};
                if(aList && aList.length > 0){
                    var bindArry = [];
                    for(var i= 0,len = aList.length;i<len;i++){
                        bindArry.push(aList[i].trunk_num);
                    }
                    findNum['_id'] = {'$nin': bindArry};
                }
                mongo.db().collection("didi_trunk_num_pool").findOne(findNum, function(err,aDoc) {
                    if (err) {
                        result = {code: 11001, message: 'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    if (!aDoc) {
                        result = {code: 12002, message: 'trunk nums not enough!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    mongo.db().collection("didi_city_gray").findOne({_id:data.city_id}, function(err,grayDoc) {
                        if (err) {
                            result = {code: 11001, message: 'server has error!'};
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        if (grayDoc) {
                            if(grayDoc.gray < 0){
                                result = {code: 32004, message: 'gray limited!'};
                                if(grayDoc.code){
                                    result.code = grayDoc.code;
                                }
                                util.sendResult(result, res, req.id());
                                return;
                            }else if(grayDoc.gray == 0){
                                result = {code: 32004, message: 'gray limited!'};
                                util.sendResult(result, res, req.id());
                                return;
                            }else{
                                if(grayDoc.gray){
                                    var random = util.getRandomNum(1,100);
                                    if(random > grayDoc.gray){
                                        result = {code: 32004, message: 'gray limited!'};
                                        util.sendResult(result, res, req.id());
                                        return;
                                    }
                                }
                            }
                        }
                        var insertDoc = {
                            _id: util.UUID.generateUuid(),
                            num_a: data.num_a,
                            num_b: data.num_b,
                            city_id: data.city_id,
                            trunk_num: aDoc._id,
                            time: util.DateTime.getCurrentDateTime()
                        }
                        if(data.expire_time){
                            insertDoc.expire_time = data.expire_time+'';
                        }else{
                            insertDoc.expire_time = 7*24*60 + '';//minute
                        }
                        mongo.db().collection("didi_num_bind").insert(insertDoc, function (err) {
                            if (err) {
                                result = {code: 11001, message: 'server has error!'};
                                util.sendResult(result, res, req.id());
                                return;
                            }
                            mongo.db().collection("didi_trunk_num_pool").update({_id:aDoc._id},{$inc:{bind_count:1}}, function(updateErr){
                                if (updateErr) {
                                    result = {code: 11001, message: 'server has error!'};
                                    util.sendResult(result, res, req.id());
                                    return;
                                }
                                result.bind_id = insertDoc._id;
                                result.trunk_num = insertDoc.trunk_num;
                                mongo.db().collection("didi_bind_count_daily").update({_id:util.getCurrentDateOnly()+'_'+data.city_id},{$inc:{count:1}},{upsert:true},function(err){});
                                mongo.db().collection("didi_bind_count_perminute").update({_id:util.getCurrentDateMin()+'_'+data.city_id},{$inc:{count:1}},{upsert:true},function(err){});
                                util.sendResult(result, res, req.id());
                                return;
                            });
                        });
                    });
                });
            });
        });
    },
    bindByNum : function(req , res , next){
        var result = {code : 200 , message :"bindByNum success!"};
        var action = self.parsePostActionData(req);
        console.log(action);
        var data = action.data;
        if(action.err){
            result = {code : 400, message: action.err};
            util.sendResult(result , res, req.id());
            return;
        }
        if(!data.num_a || !data.num_b || !data.trunk_num){
            result = {code : 400, message: 'Please check your parameters'};
            util.sendResult(result , res, req.id());
            return;
        }
        mongo.db().collection("didi_trunk_num_pool").findOne({_id:data.trunk_num, max_bind_count:{$ne:0}}, function(err,aDoc) {
            if (err) {
                result = {code: 11001, message: 'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if (!aDoc) {
                result = {code: 12002, message: 'this trunk_num not found or bind count greater max_bind_count!'};
                util.sendResult(result, res, req.id());
                return;
            }
            var insertDoc = {
                _id: util.UUID.generateUuid(),
                num_a: data.num_a,
                num_b: data.num_b,
                city_id: aDoc.city_id,
                trunk_num: aDoc._id,
                time: util.DateTime.getCurrentDateTime()
            }
            if(data.expire_time){
                insertDoc.expire_time = data.expire_time+'';
            }else{
                insertDoc.expire_time = 7*24*60 + '';//minute
            }
            mongo.db().collection("didi_num_bind").insert(insertDoc, function (err) {
                if (err) {
                    result = {code: 11001, message: 'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
                mongo.db().collection("didi_trunk_num_pool").update({_id:aDoc._id},{$inc:{bind_count:1}}, function(updateErr){
                    if (updateErr) {
                        result = {code: 11001, message: 'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    result.bind_id = insertDoc._id;
                    result.trunk_num = insertDoc.trunk_num;
                    mongo.db().collection("didi_bindByNum_count_daily").update({_id:util.getCurrentDateOnly()+'_'+aDoc.city_id},{$inc:{count:1}},{upsert:true},function(err){});
                    mongo.db().collection("didi_bindByNum_count_perminute").update({_id:util.getCurrentDateMin()+'_'+aDoc.city_id},{$inc:{count:1}},{upsert:true},function(err){});
                    util.sendResult(result, res, req.id());
                    return;
                });
            });
        });
    },
    unbind : function(req, res, next){
        var result = {code : 200 , message :"unbind success!"};
        var action = self.parsePostActionData(req);
        var data = action.data;
        if(action.err){
            result = {code : 400, message: action.err};
            util.sendResult(result , res, req.id());
            return;
        }
        if(!data.bind_id){
            result = {code : 400, message: 'Please check your parameters'};
            util.sendResult(result , res, req.id());
            return;
        }
        mongo.db().collection("didi_num_bind").findOne({_id:data.bind_id}, function(err,doc){
            if(err){
                result = {code : 11001, message: 'server has error!'};
                util.sendResult(result , res, req.id());
                return;
            }
            if(!doc){
                result = {code : 401, message: 'This bind_id not found!'};
                util.sendResult(result , res, req.id());
                return;
            }
            mongo.db().collection("didi_num_bind").remove({_id:data.bind_id}, function (err) {
                if (err) {
                    result = {code: 11001, message: 'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
                mongo.db().collection("didi_trunk_num_pool").update({_id:doc.trunk_num},{$inc:{bind_count:-1}}, function(updateErr){
                    if (updateErr) {
                        result = {code: 11001, message: 'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    doc.unbind_reason = 'interface';
                    doc.unbind_time = util.DateTime.getCurrentDateTime();
                    mongo.db().collection("didi_num_unbind_log").insert(doc, function(unbindLogErr){});
                    mongo.db().collection("didi_unbind_count_daily").update({_id:util.getCurrentDateOnly()+'_'+doc.city_id},{$inc:{count:1}},{upsert:true},function(err){});
                    mongo.db().collection("didi_unbind_count_perminute").update({_id:util.getCurrentDateMin()+'_'+doc.city_id},{$inc:{count:1}},{upsert:true},function(err){});
                    util.sendResult(result, res, req.id());
                    return;
                });
            });
        });
    },
    didiPbxGetBind : function(req, res, next){
        var result = "404";
        var data = req.params;
        mongo.db().collection("didi_num_bind").find({num_a:data.num, trunk_num:data.trunk_num}).sort({time:-1}).toArray(function(err, aDocs){
            if (err) {
                util.sendStrResult(result, res, req.id());
                return;
            }
            if(aDocs.length < 1){
                mongo.db().collection("didi_num_bind").find({num_b:data.num, trunk_num:data.trunk_num}).sort({time:-1}).toArray(function(err, bDocs) {
                    if (err) {
                        util.sendStrResult(result, res, req.id());
                        return;
                    }
                    if(bDocs.length > 0){
                        var bDoc = bDocs[0];
                        result = bDoc._id+bDoc.num_a;
                        util.sendStrResult(result, res, req.id());
                        return;
                    }else{
                        util.sendStrResult(result, res, req.id());
                        return;
                    }
                 });
            }else{
                var aDoc = aDocs[0];
                result = aDoc._id+aDoc.num_b;
                util.sendStrResult(result, res, req.id());
                return;
            }
        });
    }
};

var self = {
    parsePostActionData: function(req){
        var action = {};
        //action._aid = utils.UUID.generateUuid();
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
    },
    checkBjGansuNum: function(data, callback){
        //if(data.city_id == '010' && data.num_a.length == 11 && data.num_b.length == 11){
        //    var beginA = data.num_a.substring(0,7);
        //    var beginB = data.num_b.substring(0,7);
        //    mongo.db('cdr').collection("app_ipip_net_newphone").findOne({_id:beginA},function(err, adoc) {
        //        if(err){
        //            callback(true);
        //            return;
        //        }
        //        if(adoc){
        //            if(adoc.province == '甘肃'){
        //                callback(false);
        //                return;
        //            }
        //        }
        //        mongo.db('cdr').collection("app_ipip_net_newphone").findOne({_id:beginB},function(err, bdoc) {
        //            if(err){
        //                callback(true);
        //                return;
        //            }
        //            if(bdoc){
        //                if(bdoc.province == '甘肃'){
        //                    callback(false);
        //                    return;
        //                }
        //            }
        //            callback(true);
        //            return;
        //        });
        //    });
        //}else{
            callback(true);
            return;
        //}
    }
}

module.exports = service;
