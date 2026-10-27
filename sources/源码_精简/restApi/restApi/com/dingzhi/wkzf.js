var util = require("appUtil/Utils");
var log = require("appLog");
var http = require('appHttp');
var Thenjs = require("thenjs");
var mongo = require("appDb/MongoDb");
var service = {
    gsDispatch:function(req,res,next){
        log.request.info(req.url);
        var result = {retcode:200,msg:"success"};
        var gs_mess = req.params;
        var call_sheet_id = "";
        var callseq = gs_mess.callseq;
        var called = gs_mess.called;
        if(called ==1){
            called = "02151903042";
        }
        var caller = gs_mess.caller;
        var starttime = gs_mess.starttime;
        var offtime = gs_mess.offtime;
        var endtime = gs_mess.endtime;
        var keeptime = gs_mess.keeptime;
        var recordfile = gs_mess.recordfile;
        var calltime = gs_mess.calltime;
        var callid = parseFloat((new Date().getTime()+"00")/100000);
        var status = gs_mess.status;
        log.request.info("callseq:"+callseq);
        log.request.info("called:"+called);
        log.request.info("caller:"+caller);
        log.request.info("starttime:"+starttime);
        log.request.info("offtime:"+offtime);
        log.request.info("endtime:"+endtime);
        log.request.info("status:"+status);

        mongo.db('dingzhi').collection('wkzf_gs_callsheet').findOne({"gsid":callseq+""},function(err,doc){
            if(err) {
                log.app.error("MongoDBerror7:" + err);
                util.sendStrResult(JSON.stringify(result), res, req.id());
                return next();
            }else{
                if(doc){
                    call_sheet_id=doc._id;
                    called = doc.callednum;
                    var callsheet={
                        _id:call_sheet_id,
                        CALL_SHEET_ID:call_sheet_id,
                        ACCOUNT_ID:"N00000003455",
                        CUSTOMER_ID : "00000000000000000000",
                        CALL_NO:caller,
                        STATUS:status,
                        DISPOSAL_AGENT:null,
                        BEGIN_TIME:offtime,
                        END_TIME:endtime,
                        CALLED_NO:called,
                        OFFERING_TIME:starttime,
                        CONNECT_TYPE:"normal",
                        RECORD_FILE_NAME:recordfile,
                        CUSTOMER_NAME:"未知客户",
                        ORIGIN_ID:"wkzf-gs-0-"+callid,
                        REF_CALL_SHEET_ID:null,
                        DIRECTION:"I",
                        ERROR_MEMO:null,
                        CALL_ID:"wkzf-gs-0-"+callid,
                        LOCATION:"",
                        ACTION_ID:null,
                        PBX:"gs",
                        LOGIN_TYPE : null,
                        LOCATION_NAME : null,
                        LOCATION_ID : null,
                        QUEUE_NAME : null,
                        QUEUE_TIME : null,
                        FILE_SERVER : "http://116.228.34.234:33887",
                        STATISTIC : null,
                        PROVINCE : "",
                        PROVINCE_CODE : "",
                        DISTRICT : "",
                        DISTRICT_CODE : "",
                        QUICK_QUERY_NUM : caller,
                        IS_AUTO_CALL : false,
                        CALL_TIME_LENGTH : keeptime,
                        QUEUE_TIME_LENGTH : 0,
                        IVR_TIME_LENGTH : calltime-keeptime

                    };
                    mongo.ccDb("cc_data_20151118").collection("N00000003455_c5_call_sheet").insert(callsheet,{w:1},function(err){
                        if(err) {
                            log.app.error("MongoDBerror7:" + err);
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return next();
                        }else{
                            var respend_1 ={
                                "_id" : util.UUID.generateUuid(),
                                "url" : "http://120.55.106.105/moor/hangup?CallNo="+caller+"&CallSheetID="+call_sheet_id+"&CalledNo="+called+"&CallID="+callid+"&CallType=normal&RecordFile="+recordfile+"&Ring="+starttime+"&Begin="+offtime+"&End="+endtime+"&QueueTime=&Queue=&ActionID=&CallState=Hangup&State="+status+"&FileServer=http://116.228.34.234:33887&Province=&District=",
                                "failedTime" : new Date().Format('yyyy-MM-dd hh:mm:ss'),
                                "failedTimeStamp" : (parseInt(Date.parse(new Date()))/1000)+"",
                                "level" : "10",
                                "lock" : false,
                                "ip" : "http://120.55.106.105/moor/hangup"
                            }
                            var respend_2 ={
                                "_id" : util.UUID.generateUuid(),
                                "url" : "http://121.40.250.6:4000/dingzhi/wkzf/gshangupsmsdis/?CallNo="+caller+"&CallSheetID="+call_sheet_id+"&CalledNo="+called+"&CallID="+callid+"&CallType=normal&RecordFile="+recordfile+"&Ring="+starttime+"&Begin="+offtime+"&End="+endtime+"&QueueTime=&Queue=&ActionID=&CallState=Hangup&State="+status+"&FileServer=http://116.228.34.234:33887&Province=&District=&CdrVar=WKZF_TRUE_CALLNO:"+caller,
                                "failedTime" : new Date().Format('yyyy-MM-dd hh:mm:ss'),
                                "failedTimeStamp" : (parseInt(Date.parse(new Date()))/1000)+"",
                                "level" : "10",
                                "lock" : false,
                                "ip" : "http://121.40.250.6:4000/dingzhi/wkzf/gshangupsmsdis"
                            }
                            var respend = [respend_1,respend_2];
                            mongo.db('cdr').collection('app_event_dispatcher_resend').insert(respend,{w:1},function(err){
                                if(err) {
                                    log.app.error("MongoDBerror7:" + err);
                                    util.sendStrResult(JSON.stringify(result), res, req.id());
                                    return next();
                                }else{
                                    util.sendStrResult(JSON.stringify(result), res, req.id());
                                    return next();
                                }
                            })
                        }
                    });
                }else{
                    util.sendStrResult(JSON.stringify(result), res, req.id());
                    return next();
                }
            }
        })
    },
    gsgettruecall:function(req,res,next){
        var gs_mess = req.params;
        var callno = gs_mess.caller;
        var callseq = gs_mess.callseq;
        var callsheetid = util.UUID.generateUuid();
        var url="http://120.55.106.105/moor/getCalledNo?CallSheetID="+callsheetid+"&CallNo="+callno;
        log.request.info("wkzf_gs_called:"+url);
        url=encodeURI(url);
        http.sendGet(url,function(err,resp){
            if(!err && resp){
                try{
                    var resps = resp;
                    var strreps = resps+"";
                    //resps = "18516967734";
                    var result = {retcode:200,msg:"success",real_called:strreps,show_caller:callno};
                    if(strreps =="1"){
                        result.retcode=9001;
                        result.msg="fail";
                        result.real_called=strreps;
                        result.show_caller=callno;
                    }
                    log.request.info("resps:"+resps);
                    mongo.db('dingzhi').collection('wkzf_gs_callsheet').insert({_id:callsheetid,"gsid":callseq,"callednum":strreps},{w:1},function(err){
                        if(err) {
                            log.app.error("MongoDBerror7:" + err);
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return next();
                        }else{
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return next();
                        }
                    });
                }catch (e) {
                    log.request.error("wkzf_gs_called"+e);
                    util.sendStrResult(JSON.stringify(result), res, req.id());
                    return next();
                }
            }else{
                var error = err || new Error('wkzf_gs_called service error!');
                log.request.error(error);
                util.sendStrResult(JSON.stringify(result), res, req.id());
                return next();
            }
        });

    },
    gshangupsmsdis :function(req,res,next){
        var result = "200";
        var url= self.url_encode(req.url);
        var paramarray = url.split('?')[1].split('&');
        for(var i = 0,len=paramarray.length;i<len;i++){
            var pars = paramarray[i].split('=');
            req.params[pars[0]]=pars[1];
        }
        var curtimestamp= Date.parse(new Date())/1000;
        var daytimestamp=Date.parse(new Date())/1000-24*3600;
        var monthtimestamp = curtimestamp-24*3600*30;
        var dis_mess = req.params;
        var called_num = dis_mess.CalledNo;
        var call_num = dis_mess.CallNo;
        var begin_time = dis_mess.Begin;
        var end_time = dis_mess.End;
        var WKZF_TRUE_CALLNO = dis_mess.CdrVar;
        if(begin_time&&end_time){
            var start = parseInt(Date.parse(new Date(begin_time)) / 1000);
            var end = parseInt(Date.parse(new Date(end_time)) / 1000);
            if (end - start >= 9) {
                if(WKZF_TRUE_CALLNO!=null) {
                    call_num = WKZF_TRUE_CALLNO.split(/:/)[1];
                }
                mongo.db('dingzhi').collection('wkzf_already_sms').find({"called_num":called_num,"call_num":call_num,"latelysend":{"$gt":monthtimestamp}}).toArray(function(err,jjdoc){
                    if (err) {
                        log.app.error("MongoDBerror4:"+err);
                        util.sendStrResult(result, res, req.id());
                        return next();
                    }else{
                        if(jjdoc.length==0){
                            mongo.db('dingzhi').collection('wkzf_already_sms').find({"latelysend":{"$gt":daytimestamp},"called_num":called_num}).toArray(function(err,wdoc){
                                if (err) {
                                    log.app.error("MongoDBerror5:"+err);
                                    return;
                                }else{
                                    if(wdoc.length>0){
                                        //今天有人发了
                                        util.sendStrResult(result, res, req.id());
                                        return next();
                                    }else{
                                        //fasong
                                        mongo.db('dingzhi').collection('wkzf_already_sms').find({"latelysend":{"$gt":monthtimestamp},"called_num":called_num}).toArray(function(err,wwdoc){
                                            if(err){
                                                log.app.error("MongoDBerror6:"+err);
                                                return;
                                            }else{
                                                if(wwdoc.length>5){
                                                    //这个月超过5条了
                                                    util.sendStrResult(result, res, req.id());
                                                    return next();
                                                }else{
                                                    mongo.db('dingzhi').collection('wkzf_jjr_phonenum').findOne({"moblienum":call_num},function(err,jjrnamedoc){
                                                        if(err){
                                                            log.app.error("MongoDBerror6:"+err);
                                                            return;
                                                        }else{
                                                            var jjr_name = "";
                                                            if(jjrnamedoc){
                                                                jjr_name = jjrnamedoc['name'];
                                                            }
                                                            var url="http://115.29.14.183:3000/openService?action=sendInterfaceTemplateSms&account=N00000003455&password=k3xkmuj4cu&num="+called_num+"&templateNum=2&var1="+jjr_name+"&var2="+call_num;
                                                            log.request.info("send_wkzf_sms:"+url);
                                                            url=encodeURI(url);
                                                            http.sendGet(url,function(err,resp){
                                                                if(!err && resp){
                                                                    try{
                                                                        var respon = JSON.parse(resp);
                                                                        if(respon.success){
                                                                            mongo.db('dingzhi').collection('wkzf_already_sms').insert({_id:util.UUID.generateUuid(),"called_num":called_num,"call_num":call_num,"latelysend":curtimestamp},{w:1},function(err){
                                                                                if(err) {
                                                                                    log.app.error("MongoDBerror7:" + err);
                                                                                    return;
                                                                                }else{
                                                                                    util.sendStrResult(result, res, req.id());
                                                                                    return next();
                                                                                }
                                                                            });
                                                                        }else{
                                                                            log.request.error("send_wkzf_sms_success:false");
                                                                            util.sendStrResult(result, res, req.id());
                                                                            return next();
                                                                        }
                                                                    }catch (e) {
                                                                        log.request.error("send_wkzf_sms"+e);
                                                                        util.sendStrResult(result, res, req.id());
                                                                        return next();
                                                                    }
                                                                }else{
                                                                    var error = err || new Error('send_wkzf_sms service error!');
                                                                    log.request.error(error);
                                                                }
                                                            });
                                                        }
                                                    })
                                                }
                                            }
                                        });
                                    }
                                }
                            })
                        }else{
                            util.sendStrResult(result, res, req.id());
                            return next();
                        }
                    }
                });
            } else {
                util.sendStrResult(result, res, req.id());
                return next();
            }
        }else{
            util.sendStrResult(result, res, req.id());
            return next();
        }
    },
    hangupsmsdis :function(req,res,next){
        var result = "200";
        var curtimestamp= Date.parse(new Date())/1000;
        var daytimestamp=Date.parse(new Date())/1000-24*3600;
        var monthtimestamp = curtimestamp-24*3600*30;
        var dis_mess = req.params;
        var called_num = dis_mess.CalledNo;
        var call_num = dis_mess.CallNo;
        var begin_time = dis_mess.Begin;
        var end_time = dis_mess.End;
        var WKZF_TRUE_CALLNO = dis_mess.CdrVar;
        if(begin_time&&end_time){
            var start = parseInt(Date.parse(new Date(begin_time)) / 1000);
            var end = parseInt(Date.parse(new Date(end_time)) / 1000);
            log.request.info("end - start:"+(end - start));
            if (end - start >= 9) {
                if(WKZF_TRUE_CALLNO!=null) {
                    call_num = WKZF_TRUE_CALLNO.split(/:/)[1];
                }
                log.request.info("call_num:"+call_num);
                    mongo.db('dingzhi').collection('wkzf_already_sms').find({"called_num":called_num,"call_num":call_num,"latelysend":{"$gt":monthtimestamp}}).toArray(function(err,jjdoc){
                        if (err) {
                            log.app.error("MongoDBerror4:"+err);
                            util.sendStrResult(result, res, req.id());
                            return next();
                        }else{
                            if(jjdoc.length==0){
                                mongo.db('dingzhi').collection('wkzf_already_sms').find({"latelysend":{"$gt":daytimestamp},"called_num":called_num}).toArray(function(err,wdoc){
                                    if (err) {
                                        log.app.error("MongoDBerror5:"+err);
                                        return;
                                    }else{
                                        if(wdoc.length>0){
                                            //今天有人发了
                                            util.sendStrResult(result, res, req.id());
                                            return next();
                                        }else{
                                            //fasong
                                            mongo.db('dingzhi').collection('wkzf_already_sms').find({"latelysend":{"$gt":monthtimestamp},"called_num":called_num}).toArray(function(err,wwdoc){
                                                if(err){
                                                    log.app.error("MongoDBerror6:"+err);
                                                    return;
                                                }else{
                                                    if(wwdoc.length>5){
                                                        //这个月超过5条了
                                                        util.sendStrResult(result, res, req.id());
                                                        return next();
                                                    }else{
                                                        mongo.db('dingzhi').collection('wkzf_jjr_phonenum').findOne({"moblienum":call_num},function(err,jjrnamedoc){
                                                            if(err){
                                                                log.app.error("MongoDBerror6:"+err);
                                                                return;
                                                            }else{
                                                                var jjr_name = "";
                                                                if(jjrnamedoc){
                                                                    jjr_name = jjrnamedoc['name'];
                                                                }
                                                                var url="http://115.29.14.183:3000/openService?action=sendInterfaceTemplateSms&account=N00000003455&password=k3xkmuj4cu&num="+called_num+"&templateNum=2&var1="+jjr_name+"&var2="+call_num;
                                                                log.request.info("send_wkzf_sms:"+url);
                                                                url=encodeURI(url);
                                                                http.sendGet(url,function(err,resp){
                                                                    if(!err && resp){
                                                                        try{
                                                                            var respon = JSON.parse(resp);
                                                                            if(respon.success){
                                                                                mongo.db('dingzhi').collection('wkzf_already_sms').insert({_id:util.UUID.generateUuid(),"called_num":called_num,"call_num":call_num,"latelysend":curtimestamp},{w:1},function(err){
                                                                                    if(err) {
                                                                                        log.app.error("MongoDBerror7:" + err);
                                                                                        return;
                                                                                    }else{
                                                                                        util.sendStrResult(result, res, req.id());
                                                                                        return next();
                                                                                    }
                                                                                });
                                                                            }else{
                                                                                log.request.error("send_wkzf_sms_success:false");
                                                                                util.sendStrResult(result, res, req.id());
                                                                                return next();
                                                                            }
                                                                        }catch (e) {
                                                                            log.request.error("send_wkzf_sms"+e);
                                                                            util.sendStrResult(result, res, req.id());
                                                                            return next();
                                                                        }
                                                                    }else{
                                                                        var error = err || new Error('send_wkzf_sms service error!');
                                                                        log.request.error(error);
                                                                    }
                                                                });
                                                            }
                                                        })
                                                    }
                                                }
                                            });
                                        }
                                    }
                                })
                            }else{
                                  util.sendStrResult(result, res, req.id());
                                  return next();
                            }
                        }
                    });
            } else {
                util.sendStrResult(result, res, req.id());
                return next();
            }
        }else{
            util.sendStrResult(result, res, req.id());
            return next();
        }
    },
    byEmpNoGetPhone : function(req, res, next){//查询单个
        var result = "404";
        var exten = req.params.exten;
        mongo.db('dingzhi').collection("wkzf_zongji").findOne({_id: exten},function(err, aDoc){
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
        mongo.db('dingzhi').collection("wkzf_zongji").find({}, {sort: {"_id":1}, limit: limit, skip: skip}).toArray(function(err, aDoc){
            if (err) {
                util.sendStrResult(result, res, req.id());
                return next();
            }
            if(aDoc){
                result ={};
                // result ="200";
                result.Succeed = true;
                result.data=aDoc;
                mongo.db('dingzhi').collection("wkzf_zongji").count({},function(err, count){
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
    queryLatelyJjrNum:function(req,res,next){
        var result ="404";
        var account = req.params;
        mongo.ccDb("bill").collection("platform_account_product").findOne({"_id" : account.account+"_cc"},function(err, adoc){
            if (err) {
                util.sendResult(result, res, req.id());
                return next();
            }else{
                mongo.ccDb(adoc.dataDB).collection(adoc.account+"_c5_call_sheet").find({"CALLED_NO":account.phonenum},{sort: {"OFFERING_TIME":-1}}).toArray(function(err,bdoc){
                    if (err) {
                        util.sendResult(result, res, req.id());
                        return next();
                    }else{
                        if(bdoc.length>0){
                            result = bdoc[0].CALL_NO;
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return next();
                        }else{
                            util.sendStrResult(result, res, req.id());
                            return next();
                        }
                    }
                });
            }
        })
    },
    queryLatelyNum:function(req,res,next){
        var result ="404";
        var fjharray = [];
        var account = req.params;
        mongo.db('dingzhi').collection("wkzf_zongji").find({"num":account.phonenum}).toArray(function(err,doc){
            if (err) {
                util.sendResult(result, res, req.id());
                return next();
            }else{
                for(var i = 0,len = doc.length;i<len;i++){
                    fjharray.push(doc[i]._id);
                }
                mongo.ccDb("bill").collection("platform_account_product").findOne({"_id" : account.account+"_cc"},function(err, adoc){
                    if (err) {
                        util.sendResult(result, res, req.id());
                        return next();
                    }else{
                        mongo.ccDb(adoc.dataDB).collection(adoc.account+"_c5_call_sheet").find({"CALLED_NO":{$in:fjharray}},{sort: {"OFFERING_TIME":-1}}).toArray(function(err,bdoc){
                            if (err) {
                                util.sendResult(result, res, req.id());
                                return next();
                            }else{
                                if(bdoc.length>0){
                                    result = bdoc[0].CALL_NO;
                                    util.sendStrResult(JSON.stringify(result), res, req.id());
                                    return next();
                                }else{
                                    util.sendStrResult(result, res, req.id());
                                    return next();
                                }
                            }
                        });
                    }
                })
            }
        });
    },
    saveAgentAndPhone:function(req,res,next){
        var result ={};
        var account = req.params;
        var data = {"exten":account.exten};
        if(account.account == "wkzf_account_1"){
            data.account = "N00000005139";
        }else if(account.account == "wkzf_account_2"){
            data.account = "N00000009011";
        }else if(account.account == "wkzf_account_3"){
            data.account = "N00000010341";
        }else if(account.account == "wkzf_account_4"){
            data.account = "N00000010104";
        }else{
            return next();
        }
        var query = {};
        //query.account = {$in:["N00000010104","N00000005139","N00000009011","N00000010341"]};
        query.account = {$in:[data.account]};
        query.callerIDNum = account.phone;
        mongo.ccDb("bill").collection("platform_user").find(query).toArray(function(err,doc){
            if (err) {
                result.success = false;
                util.sendResult(result, res, req.id());
                return;
            }
            if(doc.length ==0){
                mongo.ccDb("bill").collection("platform_user").update(data,{"$set":{"callerIDNum":account.phone}},function(err){
                    if (err) {
                        result.success = false;
                        util.sendResult(result, res, req.id());
                        return;
                    }
                    result.success = true;
                    util.sendResult(result, res, req.id());
                    return;
                });
            }else if(doc.length == 1){
                if(doc[0].exten == account.exten){
                    result.success = true;
                    util.sendResult(result, res, req.id());
                    return;
                }else{
                    result.success = false;
                    result.message = "该透传号码已存在！";
                    util.sendResult(result, res, req.id());
                    return;
                }
            }else{
                result.success = false;
                result.message = "该透传号码早已重复！";
                util.sendResult(result, res, req.id());
                return;
            }

        });

    },
    queryAgentAndPhone:function(req,res,next){
        var result ={};
        var account = req.params;
        var limit=account.limit;
        var skip = (account.skip)*limit;
        var times = account.times;
        var data = {};
        if(account.account == "wkzf_account_1"){
            data.account = "N00000005139";
        }else if(account.account == "wkzf_account_2"){
            data.account = "N00000009011";
        }else if(account.account == "wkzf_account_3"){
            data.account = "N00000010341";
        }else if(account.account == "wkzf_account_4"){
            data.account = "N00000010104";
        }else{
            return next();
        }
        mongo.ccDb("bill").collection("platform_user").find(data,{sort: {"exten":1}, limit: limit, skip: skip}).toArray(function(err,agent){
            if(err){
                result.success = false;
                util.sendStrResult(result, res, req.id());
                return next();
            }else{
                result.success = true;
                result.agent = agent;
                if(times == 1) {
                    mongo.db("bill").collection("platform_user").count(data, function (err, count) {
                        if (err) {
                            result.success = false;
                            util.sendStrResult(result, res, req.id());
                            return next();
                        } else {
                            result.count = count;
                            util.sendStrResult(JSON.stringify(result), res, req.id());
                            return next();
                        }
                    })
                }else{
                    util.sendStrResult(JSON.stringify(result), res, req.id());
                    return next();
                }

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
        mongo.db('dingzhi').collection("wkzf_zongji").findOne({_id: data._id},function(err, aDoc){
            if(err){
                util.sendStrResult(result, res, req.id());
                return next();
            }else if(aDoc){
                result="该坐席已经存在，无法添加"
                util.sendStrResult(result, res, req.id());
                return next();
            }else{
                mongo.db('dingzhi').collection("wkzf_zongji").insert(data,function(err){
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
        mongo.db('dingzhi').collection("wkzf_zongji").findOne({_id: _id},function(err, aDoc) {
            if (err) {
                util.sendStrResult(result, res, req.id());
                return next();
            } else if ((aDoc.length) < 1) {
                result = "该坐席不存在，无法删除"
                util.sendStrResult(result, res, req.id());
                return next();
            } else {
                mongo.db('dingzhi').collection("wkzf_zongji").remove({_id: _id}, function (err) {
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
        mongo.db('dingzhi').collection("wkzf_zongji").findOne({_id: _id},function(err, aDoc) {
            if (err) {
                util.sendStrResult(result, res, req.id());
                return next();
            } else if ((aDoc.length) < 1) {
                result = "该坐席不存在，无法修改"
                util.sendStrResult(result, res, req.id());
                return next();
            } else {
                mongo.db('dingzhi').collection("wkzf_zongji").update({_id: _id}, {num: num}, function (err) {
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
Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
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
    },
    url_encode :function(url){
    //url = encodeURIComponent(url);
    url = url.replace(/\%3A/g, ":");
    url = url.replace(/\%2F/g, "/");
    url = url.replace(/\%3F/g, "?");
    url = url.replace(/\%3D/g, "=");
    url = url.replace(/\%26/g, "&");
    url = url.replace(/\+/g,' ');
    return url;
}
}

module.exports = service;
