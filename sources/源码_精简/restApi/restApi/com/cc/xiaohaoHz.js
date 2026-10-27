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
    getXHNum : function(req, res, next){
        var result = {code:'500', message:'query failed!'};
        var data = req.params;
        var limit = 1;
        if(data.number){
            limit = data.number;
        }
        var query = {
            account :null,
            buinessType:data.buinessType,
            usable:true
        }
        mongo.db().collection("api_xh_ims").find(query,{limit: limit}).toArray(function(err, docs) {
            if (err) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(docs){

                var xhImsArr = [];
                for(var i=0;i<docs.length;i++){
                    xhImsArr.push(docs[i].xhIms);
                }
                var updater = {account:data.account};
                mongo.db().collection("api_xh_ims").update({xhIms:{$in:xhImsArr}}, {'$set':updater},{w:1},function(err, docs) {
                    if(err) {
                        result = {code:'500', message:'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    result = {code:'200', message:'200 ok', xhNumbers:docs};
                    util.sendResult(result, res, req.id());
                    return;
                });
            }else{
                result = {code:'400', message:'free number not found!'};
                util.sendResult(result, res, req.id());
                return;
            }
        });
    },

    bind : function(req, res, next){
        var result = {code:'404', message:'bind failed!'};
        var data = req.params;
        if(!data.xhIms || !data.telA || !data.telB){
            result = {code:'501', message:'check params please!'};
            util.sendResult(result, res, req.id());
            return;
        }

        var imsQuery = {
            xhIms:data.xhIms,
            account:data.account
        };

        mongo.db().collection("api_xh_ims").findOne(imsQuery, function(err,docIms) {
            if (err) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!docIms){
                result = {code:'401', message:'xhIms not fond!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!docIms.usable){
                result = {code:'402', message:'xhIms is unusable!'};
                util.sendResult(result, res, req.id());
                return;
            }

            var query = {
                xhIms : data.xhIms,
                account:data.account,
                state : "binding",
                $or : [
                    {telA:{$in:[data.telA,data.telB]}},
                    {telB:{$in:[data.telA,data.telB]}}
                ]
            }
            mongo.db().collection("api_xh_bind").findOne(query,function(err,docBind) {
                if (err) {
                    result = {code: '500', message: 'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
                if (docBind) {
                    var repeatNum = "";
                    if(data.telA == docBind.telA || data.telA == docBind.telB){
                        repeatNum = data.telA
                    }
                    if(data.telB == docBind.telA || data.telB == docBind.telB){
                        if(repeatNum){
                            repeatNum += ","
                        }
                        repeatNum += data.telA
                    }
                    result = {code: '405', message: repeatNum+' has bound!'};
                    util.sendResult(result, res, req.id());
                    return;
                }

                var postData = {
                    Action:"",
                    virtualNumber:data.xhIms,
                    monitorParty:data.telA,
                    otherParty:data.telB,
                    accountType:"11",//docIms.buinessType
                    recordingFlag:"Open"
                }
                var url = config.ccJavaService + "?Action=hzxhBind"+"&virtualNumber="+data.xhIms+"&monitorParty="+data.telA+"&otherParty="+data.telB
                    +"&accountType=11&recordingFlag=Open";
                httpProvider.sendGet(url,function(err, resp){
                    if (err || !resp) {
                        result = {code:'500', message:'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    var response = JSON.parse(resp.toString());
                    if(response.Succeed){
                        var bindDoc = {
                            _id:util.UUID.generateUuid(),
                            telA:data.telA,
                            telB:data.telB,
                            state : "binding",
                            account:data.account,
                            xhIms : data.xhIms,
                            bindType : "11",
                            subscriptionId:response.subscriptionId
                        }
                        mongo.db().collection("api_xh_bind").insert(bindDoc, function(err) {
                            if (err) {
                                result = {code:'500', message:'server has error!'};
                                util.sendResult(result, res, req.id());
                                return;
                            }
                            mongo.db().collection("didi_city_account").findOne({_id:data.account},function(err,ddAccount){
                                if (err) {
                                    result = {code:'500', message:'server has error!'};
                                    util.sendResult(result, res, req.id());
                                    return;
                                }

                                if(ddAccount){
                                    mongo.db().collection("xh_didi_bind_count_daily").update({_id:util.getCurrentDateOnly()+'_'+ddAccount.cityId},{$inc:{count:1}},{upsert:true},function(err){});
                                    mongo.db().collection("xh_didi_bind_count_perminute").update({_id:util.getCurrentDateMin()+'_'+ddAccount.cityId},{$inc:{count:1}},{upsert:true},function(err){});
                                }else{
                                    mongo.db().collection("xh_bind_count_daily").update({_id:util.getCurrentDateOnly()+'_'+data.account},{$inc:{count:1}},{upsert:true},function(err){});
                                    mongo.db().collection("xh_bind_count_perminute").update({_id:util.getCurrentDateMin()+'_'+data.account},{$inc:{count:1}},{upsert:true},function(err){});
                                }
                                //记账单
                                mongo.ccDb("bill_data").collection('bill_xiaohaoHz_bind').insert(bindDoc,function(err){});

                                result = {
                                    code:'200',
                                    subscriptionId:response.subscriptionId,
                                    message:'succeed'
                                };
                                util.sendResult(result, res, req.id());
                            })
                        });
                    }else{
                        result = {code:'500', message:'server has error!'};
                        util.sendResult(result, res, req.id());
                        return;
                    }
                });
            });
        });
    },

    unbind : function(req, res, next){
        var result = {code:'404', message:'unbind failed!'};
        var data = req.params;

        mongo.db().collection("api_xh_bind").findOne({subscriptionId:data.subscriptionId}, function(err,doc) {
            if (err) {
                result = {code:'500', message:'server has error!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!doc){
                result = {code:'401', message:'bind not fond!'};
                util.sendResult(result, res, req.id());
                return;
            }
            if(!doc.state || doc.state != "binding"){
                result = {code:'402', message:'xhIms was unbind!'};
                util.sendResult(result, res, req.id());
                return;
            }

            var unbindData = {
                subscriptionId : doc.subscriptionId
            }
            var url = config.ccJavaService + "?Action=hzxhUnbind"+"&subscriptionId="+doc.subscriptionId;
            httpProvider.sendGet(url,function(err, resp){
                if (err || !resp) {
                    result = {code:'500', message:'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }

                var response = JSON.parse(resp.toString());
                if(response.code == "200"){
                    mongo.db().collection("api_xh_bind").update({_id:doc._id},{$set:{state:"unbind"}}, function(err) {
                        if (err) {
                            result = {code:'500', message:'server has error!'};
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        result = {code:'200', message:'succeed'};
                        util.sendResult(result, res, req.id());
                        return;
                    });
                }else{
                    result = {code:'500', message:'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
            });
        });
    },
    callRoute : function(req, res, next){
        console.log(req.body);

        var callRouteInfo = "";
        if(typeof req.body == "string"){
            callRouteInfo = JSON.parse(req.body);
        }else{
            callRouteInfo = req.body;
        }

        var callEvent = '';
        if(typeof callRouteInfo.callEvent == "string"){
            callEvent = JSON.parse(callRouteInfo.callEvent);
        }else{
            callEvent = callRouteInfo.callEvent;
        }

        var result = {
            appKey:config.xhHZAppKey,
            actions:[]
        };
        var actionsData = {};

        if(callEvent.event == 'IDP'){

            //8615678041174
            var query = {
                _id:callEvent.called
            }
            mongo.db().collection("api_xh_ims").findOne(query, function(err,imsDoc) {
                if (err) {
                    result = {code:'500', message:'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }

                if(imsDoc){
                    if(imsDoc.buinessType == "0"){
                        actionsData["routingAddress"] = callEvent.calling
                        actionsData["callingAddress"] = callEvent.called
                    }
                    actionsData['operation'] = "vNumberRoute";
                    result.actions = [actionsData];

                    if(callEvent.calling)

                    //通话事件入库
                    var eventObject = {
                        _id:util.UUID.generateUuid(),
                        callIdentifier :callEvent.callIdentifier,
                        notificationMode :callEvent.notificationMode,
                        xhIms :callEvent.called,
                        account :imsDoc.account,
                        buinessType:imsDoc.buinessType,
                        imsInfo:imsDoc,
                        state :'leak',
                        direction :callEvent.direction,
                        form_cid :callEvent.calling,
                        form_did :"",
                        callStartTime:util.getCurrentDateTime(),
                        eventMessage :{'IDP':callEvent}
                    }

                    mongo.db().collection("api_xh_bill").insert(eventObject,{w:1},function(){
                        if (err) {
                            result = {code:'500', message:'server has error!'};
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        util.sendResult(result, res, req.id());
                    });
                }else{
                    actionsData['operation'] = "Continue";
                    result.actions = [actionsData];
                    util.sendResult(result, res, req.id());
                }
            });
        }else {

            mongo.db().collection("api_xh_bill").findOne({callIdentifier: callEvent.callIdentifier}, function (err, billdoc) {
                if (err) {
                    result = {code: '500', message: 'server has error!'};
                    util.sendResult(result, res, req.id());
                    return;
                }
                if (billdoc) {
                    //通话事件入库
                    var event = {};

                    if(callEvent.event == "Answer"){//接听
                        event = {
                            state: 'dealing',
                            form_did: callEvent.called,
                            callLinkTime: util.getCurrentDateTime(),
                            'eventMessage.Answer': callEvent
                        }
                    }else if(callEvent.event == "Hang Up"){//挂断
                        event = {
                            callHangUpTime: util.getCurrentDateTime(),
                            'eventMessage.HangUp': callEvent
                        }
                    }else if(callEvent.event == "Abandon"){//拒接
                        event = {
                            state: 'leak',
                            callAbandonTime: util.getCurrentDateTime(),
                            'eventMessage.Abandon': callEvent
                        }
                    }else if(callEvent.event == "No Answer"){//振铃未接听
                        event = {
                            state: 'notDeal',
                            callNoAnswerTime: util.getCurrentDateTime(),
                            'eventMessage.NoAnswer': callEvent
                        }
                    }else if(callEvent.event == "Release"){//主叫方结束，本次通话正式结束

                        //记账单
                        if(billdoc.state){
                            var billCollection = "11";
                            if(billdoc.buinessType == "11"){
                                billCollection = "bill_xiaohaoHz_call_type11";
                            }else{
                                billCollection = "bill_xiaohaoHz_call_type0";
                            }

                            mongo.ccDb("bill_data").collection(billCollection).insert(billdoc,function(err){});
                        }

                        event = {
                            callReleaseTime: util.getCurrentDateTime(),
                            'eventMessage.Release': callEvent
                        }
                    }else{//其他
                        event = {
                            'eventMessage.other': callEvent
                        }
                    }


                    mongo.db().collection("api_xh_bill").update({_id: billdoc._id}, {$set: event}, function (err) {
                        if (err) {
                            result = {code: '500', message: 'server has error!'};
                            util.sendResult(result, res, req.id());
                            return;
                        }
                        actionsData['operation'] = "Continue";
                        result.actions = [actionsData];
                        util.sendResult(result, res, req.id());
                    })
                } else {
                    actionsData['operation'] = "Continue";
                    result.actions = [actionsData];
                    util.sendResult(result, res, req.id());
                }
            });
        }
    }
}

module.exports = service;