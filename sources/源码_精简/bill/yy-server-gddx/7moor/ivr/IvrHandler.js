var mongo = require('appDb/MongoDb');
var nodeUtil = require('util');
var utils = require('appUtil/Utils');
var uuid = require('appUtil/UUID');
var log = require('appLog');
var objectUtil = require('appUtil/ObjectUtil');
var dateTimeUtil = require('appUtil/DateTime');
var querystring = require('querystring');
var httpProvider = require("appHttp");
var businessUtil = require('appUtil/BusinessUtil');
var config = require('appConfig');
var pbxUtil = require(__baseDir+'/7moor/resource/PbxHandler');
var fs = require("fs");
var systemUserHandler = require(__baseDir + "/7moor/system/SystemUserHandler");
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");


exports.addAccount = function(data, callback) {
    var pbx=data.pbx;
    var time=utils.DateTime.getCurrentDateTime();
    pbxUtil.getPbxInfo2(pbx,function(rep){
        if(rep.success) {
            var configUrl = rep.data.configAddr;
//            configUrl = "http://127.0.0.1:7789/";
            var action = {
                Command: 'Action',
                Action: 'AccountAdd',
                ActionID: uuid.generateUuid(),
                pbx: pbx,
                account: data._id,
                name: data.name,
                displayName: data.companyName,
                sips: [],
                users: []
            };

            var sips = null;
            var secret = businessUtil.generatePassword(8, false);
            mongo.db().collection(constants.DB.platform_user).count({account:data._id}, function (err, total) {
                if (!err) {
                    if(total==0){
                        var timeStamp=utils.DateTime.getCurrentTimestamp();
                        businessUtil.getSeriesSipNum(8, function(err, sipData){
                            if(err) {
                                log.app.warn('Get sipNum from java service failed', err);
                                callback(false);
                            } else {
                                sips = sipData;
                                for(var i=0;i<4;i++){
                                    var userID = uuid.generateUuid();
                                    var user = {
                                        _id: userID,
                                        pbx: pbx,
                                        account: data._id,
                                        exten: ""+(8000+i),
                                        password: ''+(8000+i),
                                        displayName: ''+(8000+i),
                                        mobile: '',
                                        email: '',
                                        didNum: '',
                                        isAdmin: true,
                                        sipExten: sips[i*2],
                                        mobileExten: sips[i*2+1],
                                        product:constants.product.zj,
                                        createTime:time,
                                        lastUpdate:timeStamp
                                    }
                                    var sip1 = {
                                        _id: user.sipExten,
                                        account: user.account,
                                        pbx: pbx,
                                        exten: user.sipExten,
                                        user: user._id,
                                        type: 'sip',
                                        secret: secret,
                                        status: 'using',
                                        product:constants.product.zj
                                    };
                                    var sip2 = {
                                        _id: user.mobileExten,
                                        account: user.account,
                                        pbx: pbx,
                                        exten: user.mobileExten,
                                        user: user._id,
                                        type: 'Local',
                                        status: 'using',
                                        product:constants.product.zj
                                    };
                                    if(i==0 && data.linkManPhone){
                                        user.mobile=data.linkManPhone;
                                    }
                                    mongo.db().collection('platform_user').insert(user);
                                    var q1={_id:sip1._id};
                                    delete sip1._id;
                                    var q2={_id:sip2._id};
                                    delete sip2._id;
                                    mongo.db().collection('platform_sipNum').update(q1,{$set: sip1});
                                    mongo.db().collection('platform_sipNum').update(q2,{$set: sip2});
                                    if(i == 0) {
                                        action.agent = userID;
                                    }
                                    action.sips.push(sip1);
                                    action.sips.push(sip2);
                                    action.users.push(user);
                                }
                                httpProvider.sendPost(configUrl, action, function(err, result){
                                    if(err) {
                                        log.app.warn('Add account to ass failed!', err);
                                        callback(false);
                                    } else {
                                        var res = JSON.parse(result);
                                        if(res.Succeed){
                                            callback(true);
                                        } else {
                                            log.app.warn(result);
                                            callback(false);
                                        }

                                    }
                                });
                            }
                        });
                    }else{
                        httpProvider.sendPost(configUrl, action, function(err, result){
                            if(err) {
                                log.app.warn('Add account to ass failed!', err);
                                callback(false);
                            } else {
                                var res = JSON.parse(result);
                                if(res.Succeed){
                                    callback(true);
                                } else {
                                    log.app.warn(result);
                                    callback(false);
                                }

                            }
                        });
                    }
                } else {
                    log.app.error(err);
                    callback(false);
                }
            })
        }else{
            callback(rep);
        }
    });

}
exports.getCallInfo=function(data, session, callback) {
    var ref = {
        _id:data._id
//        account: session.account._id,
//        serviceNo:data.serviceNo
    };
    mongo.db("zj").collection('platform_ivr').findOne(ref, function(err, doc){
        if(doc) {
            callback({success: true, data: doc});
        } else {
            callback({success: false});
        }
    });
}

exports.editTime=function(data, session, callback) {
    var ref = {
        _id: data._id
    };
    var keys = {
        day:[]
    };

    for(var i=2;i<8;i++) {
        if(data[i+'']){
            keys.day.push(i+'');
        }
    }
    if(data['1']){
        keys.day.push('1');
    }
    keys.startTimeHour = data.startTimeHour;
    keys.startTimeMinute = data.startTimeMinute;
    keys.endTimeHour = data.endTimeHour;
    keys.endTimeMinute = data.endTimeMinute;

    mongo.db("zj").collection('platform_ivr').findOne(ref, function(err, ivr){
        if(!err && ivr) {
            var serviceNo=ivr.serviceNo;
            mongo.db("zj").collection('platform_ivr').update(ref, {$set: keys});
            var pbx=utils.getProductPbx(constants.product.zj,session);
            var action = {
                Command: 'Action',
                Action: 'SetWorkTime',
                ActionID: uuid.generateUuid(),
                account: session.account._id,
                pbx: pbx,
                startTimeHour: keys.startTimeHour,
                startTimeMinute: keys.startTimeMinute,
                endTimeHour: keys.endTimeHour,
                endTimeMinute: keys.endTimeMinute,
                day: keys.day,
                serviceNo:serviceNo
            }
            mongo.db().collection('platform_pbx').findOne({_id: action.pbx}, {configAddr: 1}, function(err, doc){
                if(doc) {
//                    doc.configAddr="http://127.0.0.1:7789";//for test
                    httpProvider.sendPost(doc.configAddr, action, function(err, result){
                        if(err) {
                            log.app.warn('Set time to ass failed!', err);
                        }
                    });
                }
            });
            callback({success: true});
        } else {
            log.app.error(err);
            callback({success: false});
        }
    });


}

exports.setIvr=function(data, session, callback) {
    var ref = {
        _id: data._id
    };
    var keys = {
        ivr:data.ivr
    };
    var pbx=utils.getProductPbx(constants.product.zj,session);
    mongo.db("zj").collection('platform_ivr').findOne(ref, function(err, ivr){
        if(!err && ivr) {
            var serviceNo=ivr.serviceNo;
            var action = {
                Command: 'Action',
                Action: 'SetIvr',
                ActionID: uuid.generateUuid(),
                account: session.account._id,
                pbx: pbx,
                ivr: data.ivr,
                serviceNo:serviceNo
            }
            mongo.db("zj").collection('platform_ivr').update(ref, {$set: keys});
            mongo.db().collection('platform_pbx').findOne({_id: action.pbx}, {configAddr: 1}, function(err, doc){
                if(doc) {
//                    doc.configAddr="http://127.0.0.1:7789";//for test
                    httpProvider.sendPost(doc.configAddr, action, function(err, result){
                        if(err) {
                            log.app.warn('Set ivr ass failed!', err);
                        }
                    });
                }
            });
            callback({success: true});
        }else{
            log.app.error(err);
            callback({success: false});
        }
    });

}

exports.setAgent=function(data, session, callback) {
    var ref = {
        _id: data._id
    };
    if(!data.agent){
        data.agent=[];
    }
    var keys = {
        agent:data.agent
    };

    var pbx=utils.getProductPbx(constants.product.zj,session);
    mongo.db("zj").collection('platform_ivr').findOne(ref, function(err, ivr){
        if(!err && ivr) {
            var serviceNo=ivr.serviceNo;
            var action = {
                Command: 'Action',
                Action: 'SetAgent',
                ActionID: uuid.generateUuid(),
                account: session.account._id,
                pbx: pbx,
                agent: data.agent,
                serviceNo:serviceNo
            }
            mongo.db("zj").collection('platform_ivr').update(ref, {$set: keys});
            mongo.db().collection('platform_pbx').findOne({_id: action.pbx}, {configAddr: 1}, function(err, doc){
                if(doc) {
//                    doc.configAddr="http://127.0.0.1:7789";//for test
                    httpProvider.sendPost(doc.configAddr, action, function(err, result){
                        if(err) {
                            log.app.warn('Set agent to ass failed!', err);
                        }
                    });
                }
            });
            callback({success: true});
        }else{
            log.app.error(err);
            callback({success: false});
        }
    });
}
exports.checkRepeat=function(agents,session,callback){
    var result = {success: false};
    var aid = session.account._id;
    var query={account:aid};
    agents=agents||[];
    mongo.db("zj").collection(constants.DB.platform_ivr).find(query).toArray(function (err, list) {
        if (!err) {
            list=list||[];
            var num=0;
            var uid="";
            for (var i = 0; i < list.length; i++) {
                var obj = list[i];
                if(obj.ivr=="0"){
                    for (var j = 0; j < agents.length; j++) {
                        var obj1 = agents[j];
                        if(obj1._id==obj.agent){
                            num++;
                            uid=obj1._id;
                            break;
                        }
                    }
                }else if(obj.ivr=="1"){
                    for (var j = 0; j < agents.length; j++) {
                        var obj1 = agents[j];
                        var _serviceAgents=obj1.serviceAgent||[];
                        for (var k = 0; k < _serviceAgents.length; k++) {
                            var obj2 = _serviceAgents[k];
                            if(obj1._id==obj2[k]){
                                num++;
                                uid=obj1._id;
                                break;
                            }
                        }
                    }
                }
            }
            if (num == 0) {
                result.success = true;
                callback(result);
            } else {
                log.app.warn('uid ['+uid+'] is exists!');
//                result.message = '工号['+uid+']已经存在';
                result.code='404';
                callback(result);
            }
        } else {
            log.app.error(err.stack);
            result.message = 'checkRepeat error!';
            callback(result);
        }
    });
},
exports.setServiceAgent=function(data, session, callback) {
    var ref = {
        _id: data._id
    };
    var keys = {
        serviceAgent:data.serviceAgent||[]
    };
    var pbx=utils.getProductPbx(constants.product.zj,session);
    mongo.db("zj").collection('platform_ivr').findOne(ref, function(err, ivr){
        if(!err && ivr) {
            var serviceNo=ivr.serviceNo;
            var action = {
                Command: 'Action',
                Action: 'SetServiceAgent',
                ActionID: uuid.generateUuid(),
                account: session.account._id,
                pbx: pbx,
                servieAgent: data.serviceAgent,
                serviceNo:serviceNo
            }
            mongo.db("zj").collection('platform_ivr').update(ref, {$set: keys});
            mongo.db().collection('platform_pbx').findOne({_id: action.pbx}, {configAddr: 1}, function(err, doc){
                if(doc) {
//                    doc.configAddr="http://127.0.0.1:7789";//for test
                    httpProvider.sendPost(doc.configAddr, action, function(err, result){
                        if(err) {
                            log.app.warn('Set service agent to ass failed!', err);
                        }
                    });
                }
            });
            callback({success: true});
        }else{
            log.app.error(err);
            callback({success: false});
        }
    });
}

exports.setW=function(data, session, res) {
    var ref = {
        _id: data._id
    };

    var keys = {
        w: {
            name: data.w_music.name,
            id: data.w_music.fileId
        }
    };

    mongo.db("zj").collection('platform_ivr').update(ref, {$set: keys});
    var pbx=utils.getProductPbx(constants.product.zj,session);
    mongo.db("zj").collection('platform_ivr').findOne(ref, function(err, ivr){
        if(!err && ivr) {
            var serviceNo=ivr.serviceNo;
            var action = {
                Command: 'Action',
                Action: 'MusicAdd',
                ActionID: uuid.generateUuid(),
                account: session.account._id,
                pbx: pbx,
                servieAgent: data,
                serviceNo:serviceNo
            }

            mongo.readFileFromDb(data.w_music.fileId, function(err, data1){
                if(err) {
                    log.app.warn('Read w music from db failed.', err);
                } else {
                    mongo.db().collection('platform_pbx').findOne({_id: action.pbx}, {configAddr: 1}, function(err, doc){
                        if(doc) {
//                            doc.configAddr="http://127.0.0.1:7789";//for test
                            httpProvider.sendByteFile(doc.configAddr+'/command?Action=MusicAdd&PBX='+action.pbx
                                +'&Account='+action.account+'&Filename='+data.w_music.fileId+'.wav&type=w&serviceNo='+action.serviceNo, data1, function(err, result){
                                if(err) {
                                    log.app.warn('Add w music to ass failed!', err);
                                } else {
                                    res.render('musicUploaded', {});
                                }
                            });
                        }
                    });
                }
            });
        }else{
            log.app.error(err);
            res.render({success: false});
        }
    });

}

exports.setOW=function(data, session, res) {
    var ref = {
        _id: data._id
    };

    var keys = {
        ow: {
            name: data.ow_music.name,
            id: data.ow_music.fileId
        }
    };

    mongo.db("zj").collection('platform_ivr').update(ref, {$set: keys});
    var pbx=utils.getProductPbx(constants.product.zj,session);
    mongo.db("zj").collection('platform_ivr').findOne(ref, function(err, ivr){
        if(!err && ivr) {
            var serviceNo=ivr.serviceNo;
            var action = {
                Command: 'Action',
                Action: 'MusicAdd',
                ActionID: uuid.generateUuid(),
                account: session.account._id,
                pbx: pbx,
                servieAgent: data,
                serviceNo:serviceNo
            }
            mongo.readFileFromDb(data.ow_music.fileId, function(err, data1){
                if(err) {
                    log.app.warn('Read ow music from db failed.', err);
                } else {
                    mongo.db().collection('platform_pbx').findOne({_id: action.pbx}, {configAddr: 1}, function(err, doc){
                        if(doc) {
//                            doc.configAddr="http://127.0.0.1:7789";//for test
                            httpProvider.sendByteFile(doc.configAddr+'/command?Action=MusicAdd&PBX='+action.pbx
                                +'&Account='+action.account+'&Filename='+data.ow_music.fileId+'.wav&type=ow&serviceNo='+action.serviceNo, data1, function(err, result){
                                if(err) {
                                    log.app.warn('Add ow music to ass failed!', err);
                                } else {
                                    res.render('musicUploaded', {});
                                }
                            });
                        }
                    });
                }
            });
        }else{
            log.app.error(err);
            res.render({success: false});
        }
    });
}

var _send400Mail=function (data,result,callback) {
    var sendMail = {
        toAddr: [config.proxyMail],
        subject: "申请400号码",
        type: "registe",
        ccAddr: [config.proxyMail],
        status: "undeal"
    };
    fs.readFile(__baseDir + "/views/400/send400.html", function (err, html) {
        if (!err) {
            html = new String(html);
            html = systemUserHandler._renderView(html,data);
            sendMail.content = html;
            mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                if (err) {
                    log.app.error("insert to send mail to db error!", err);
                    callback(result);
                }else{
                    result.success=true;
                    callback(result);
                }
            });
        } else {
            log.app.error("mail templete[_send400Mail] not found!", err);
            callback(result);
        }
    });
}

exports.send400=function(data, session,callback) {
    var result = {success: false};
    var id=utils.UUID.generateUuid();
    var time=utils.DateTime.getCurrentDateTime();
    var record={
        _id:id,
        account:session.account._id,
        createTime:time,
        status:'send',
        linkManEmail:data.linkManEmail,
        linkManName:data.linkManName,
        linkManPhone:data.linkManPhone
    };
    data.name=session.account.name;
    mongo.db().collection(constants.DB.platform_400_mail).insert(record);
    _send400Mail(data,result,callback);
}

exports.getMyServiceNo=function(data, session, callback) {
    var result = {success: false};
    var condition ={};
    condition.account=session.account._id;
//    condition.flag=constants.serviceNumFlag.service;
//    condition.product=constants.product.zj;
    mongo.db("zj").collection(constants.DB.platform_ivr).find(condition,{fields:{serviceNo:1}}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs||[];
            result.success = true;
            callback(result)
        } else {
            log.app.error(err);
            callback(result);
        }
    });
}
exports.deleteZJServiceNo=function(data, session, callback) {
    var result = {success: false};
    var num=data._id;
    var ivrId=data.ivrId;
    var query={_id:num};
    var syncErrMsg="deleteZJServiceNo同步acs失败";
    mongo.db("zj").collection(constants.DB.platform_ivr).findOne({_id:ivrId},function(err,flow){
        if(!err && flow){
            var queue1=flow.queue;
            var queue2=flow.serviceQueue;
            var account=flow.account;
            var tb=constants.DB.platform_serviceNum;
            if(num!=null && num.substring(0,3)=='400'){
                tb=constants.DB.platform_num400;
            }
            mongo.db().collection(tb).findOne(query,function(err,row){
                if(!err && row){
                    var flag=row.flag;
                    var account=row.account;
                    var pbx=row.pbx;
                    var doc={
                        serviceno:num,
                        pbx:pbx,
                        account:account
                    }
                    syncAcs.removeServiceNo(doc,function(isSuccess){
                        if(isSuccess){
                            var set={
                                flag:''
                            };
                            mongo.db().collection(tb).update(query,{$set:set},function(err){
                                if(!err){
                                    mongo.db("zj").collection(constants.DB.platform_ivr).remove({_id:ivrId},function(err){
                                        if(!err){
                                            //free queue
                                            var queueSet={
                                                account: '',
                                                pbx: '',
                                                type: '',
                                                status: 'free',
                                                lastAccount:account
                                            }
                                            mongo.db().collection('platform_queue').update({_id: queue1},{$set:queueSet});
                                            mongo.db().collection('platform_queue').update({_id: queue2},{$set: queueSet});
                                            //sync user's callerIDNum
                                            mongo.db().collection(constants.DB.platform_user).update({account:account,product:constants.product.zj,callerIDNum:num},{$set:{callerIDNum:""}},{multi:true},function(){
                                                if(err){
                                                    log.app.error(err);
                                                }
                                            });
                                            result.success = true;
                                            callback(result);
                                        }else{
                                            log.app.error(err);
                                            callback(result);
                                        }
                                    });
                                }else{
                                    log.app.error(err);
                                    callback(result);
                                }
                            });
                        }else{
                            log.app.error(syncErrMsg);
                            result.message=syncErrMsg;
                            callback(result);
                        }
                    });
                }else{
                    log.app.error(err);
                    callback(result);
                }
            });
        }else{
            log.app.error(err);
            callback(result);
        }
    });

}


