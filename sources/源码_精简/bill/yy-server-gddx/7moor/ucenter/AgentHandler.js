var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var cnToSpellUtil = require('appUtil/cnToSpell');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");
var dateTimeUtils = require('appUtil/DateTime');

var handler = {
    getAgentList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        condition.product=constants.product.zj;
        condition.isDelete = {$ne:"drop"};

        if(condition.displayName){
            condition.displayName = new RegExp(condition.displayName);
        }
        utils.removeEmptyProperty(condition);
        var fields={im:0};
        mongo.db().collection(constants.DB.platform_user).find(condition,fields,{sort:{exten:1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(constants.DB.platform_user).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getCallInternation:function(data,session,callback){
        var result = {success:false,iscallinternation:false};
        mongo.db("bill").collection(constants.DB.platform_account_product).find({_id : session.account._id + "_zj"},{fields:{intlFeeSet:1}}).toArray(function (err, row){
            if (!err) {
                result.success = true;
                if(row.length==0){
                    result.iscallinternation = false;
                }else{
                    result.iscallinternation = true;
                }
                callback(result);
            } else {
                logger.app.error('db getCallInternation error:' + err.stack);
                result.message = '404 isCallInternation not found!';
                callback(result);
            }
        });
    },
    getAgentById:function(data,session,callback){
        var result = {success: false};
        var fields={im:0};
        mongo.db().collection(constants.DB.platform_user).findOne({_id:data._id},fields,function(err,row){
            if(!err){
                if(row){
                    result.success = true;
                    result.row=row;
                    callback(result);
                }else{
                    logger.app.error('404 agent not found!');
                    result.code = '404';
                    callback(result);
                }
            }else{
                logger.app.error(err.stack);
                callback(result);
            }
        });
    },
    /**
     * im interface
     * http://localhost:3000/public?action=agent.updateAgent2IM&data={"_id":"d6934961-829d-11e3-b13d-35324b9471b4","exten":"8001",
     * "pbx":"1.1.1.100","account":"N00000000085","displayName":"8001","email":"abc@hollycrm.com","mobile":"","password":"8001"}
     * {
        "success": true,
        "message": "200 ok!"
        }
     * @param data
     * @param callback
     */
    updateAgent2IM: function (data, callback) {
        var result = {success: false};
        var query={_id:data._id};
        var time=utils.DateTime.getCurrentTimestamp();
        data.lastUpdate=time;
        handler.checkRepeat(data,true,function(rep){
            if(rep.success){
                delete data._id;
                if(data.isAdmin && typeof(data.isAdmin)=='string'){
                    data.isAdmin=data.isAdmin=='true'?true:false;
                }
                mongo.db().collection(constants.DB.platform_user).findAndModify(query,[],{$set:data},{new:true},function(err,user){
                    if(!err){
                        syncAcs.updateUser(user,function(isSuccess){
                            if(isSuccess){
                                result.success = true;
                            }
                            callback(result);
                        })
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else{
                result=rep;
                callback(result);
            }
        });
    },
    updateAgent: function (data, session, callback) {
        var ccc = data.length;
        if(ccc != undefined){
            var query={_id:data};
            data={isDelete:"drop"};
        }else{
            var query={_id:data._id};
        }
        var result = {success: false};
        var time=utils.DateTime.getCurrentTimestamp();
        data.lastUpdate=time;
        data.account=session.account._id;
        handler.checkRepeat(data,true,function(rep){
            if(rep.success){
                handler._checkCallerNum(data,session,function(rep){
                    if(rep.success){
                        delete data._id;
                        if(data.isAdmin && typeof(data.isAdmin)=='string'){
                            data.isAdmin=data.isAdmin=='true'?true:false;
                        }
                        if(data.displayName){
                            data.pinyin = cnToSpellUtil.getSpell(data.displayName);
                        }
                        mongo.db().collection(constants.DB.platform_user).findAndModify(query,[],{$set:data},{new:true},function(err,user){
                            if(!err){
                                syncAcs.updateUser(user,function(isSuccess){
                                    if(isSuccess){
                                        result.success = true;
                                    }
                                    mongo.db().collection(constants.DB.im_contacts_version).update(
                                        {Account:session.account._id}
                                        ,{$set:{Account:session.account._id,Version:dateTimeUtils.getCurrentTimestamp()}}
                                        ,{upsert:true});
                                    callback(result);
                                })
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        callback(rep);
                    }
                });
            } else{
                result=rep;
                callback(result);
            }
        });
    },
    addAgent: function (data, session, callback) {
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        var pbx=utils.getProductPbx(constants.product.zj,session);
        data._id=id;
        data.createTime=time;
        var time2=utils.DateTime.getCurrentTimestamp();
        data.lastUpdate=time2;
        data.account=aid;
        data.pbx=pbx;
        data.product=constants.product.zj;
        if(data.isAdmin && typeof(data.isAdmin)=='string'){
            data.isAdmin=data.isAdmin=='true'?true:false;
        }
        var user=data;
        handler.checkRepeat(data,false,function(rep){
            if(rep.success){
                handler._checkCallerNum(data,session,function(rep){
                    if(rep.success){
                        handler.getSipInfo(user,function(rep2){
                            if(rep2.success){
                                var sips=rep2.sips;
                                user.sipExten=sips[0].exten;
                                user.mobileExten=sips[1].exten;
                                if(user.displayName){
                                    user.pinyin = cnToSpellUtil.getSpell(user.displayName);
                                }
                                mongo.db().collection(constants.DB.platform_user).insert(user, function (err) {
                                    if (!err) {
                                        mongo.db().collection('platform_sipNum').update({_id:user.sipExten},{$set: sips[0]});
                                        mongo.db().collection('platform_sipNum').update({_id:user.mobileExten},{$set: sips[1]});
                                        syncAcs.addUser(user,sips,function(isSuccess){
                                            if(isSuccess){
                                                result.success = true;
                                            }
                                            mongo.db().collection(constants.DB.im_contacts_version).update(
                                                {Account:session.account._id}
                                                ,{$set:{Account:session.account._id,Version:dateTimeUtils.getCurrentTimestamp()}}
                                                ,{upsert:true});
                                            callback(result);
                                        })
                                    } else {
                                        logger.app.error(err);
                                        result.message = 'addAgent error!'+err.message;
                                        callback(result);
                                    }
                                });
                            }else{
                                callback(rep2);
                            }
                        })
                    }else{
                        callback(rep);
                    }
                });
            } else{
                callback(rep);
            }
        });
    },
    getSipInfo:function(user,callback){
        var result = {success: false};
        var secret=utils.BusinessUtil.generatePassword(8,false);
        utils.BusinessUtil.getSeriesSipNum(2,function(err,sips){
            if(!err){
                var sip1 = {
                    account: user.account,
                    pbx: user.pbx,
                    exten: sips[0],
                    user: user._id,
                    type: 'sip',
                    secret: secret,
                    status: 'using',
                    product:constants.product.zj
                };
                var sip2 = {
                    account: user.account,
                    pbx: user.pbx,
                    exten: sips[1],
                    user: user._id,
                    type: 'Local',
                    status: 'using',
                    product:constants.product.zj
                };

                var sips=[sip1,sip2];
                result.sips=sips;
                result.success=true;
                callback(result);
            }else{
                logger.app.error('Get sipNum from java service failed', err);
                callback(result);
            }
        });
    },
    checkRepeat:function(data,isUpdate,callback){
        var result = {success: false};
        var query={exten:data.exten,account:data.account};
        if(isUpdate){
            query._id={$ne:data._id};
        }
        mongo.db().collection(constants.DB.platform_user).count(query,function (err, count) {
            if (!err) {
                if (count == 0) {
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.warn('jobNum ['+data.exten+'] is exists!');
                    result.message = '工号['+data.exten+']已经存在';
                    result.code='404';
                    callback(result);
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'checkRepeat error!';
                callback(result);
            }
        });
    },
    /**
     * for client dic
     * @param session
     * @param callback
     */
    getAgentDic:function (session, callback) {
        var aid = session.account._id;
        var fields={_id:1,displayName:1,exten:1,mobile:1,product:1,isRecord:1,isDelete:1};
        mongo.db().collection(constants.DB.platform_user).find({account: aid},fields,{sort:{exten:1}}).toArray(function(err, docs) {
            if (!err) {
                callback(null, docs || []);
            } else {
                logger.app.error(err);
                callback(err);
            }
        })
    },

    getDidnumList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        condition.status=constants.serviceNumStatus.use;
        condition.flag=constants.serviceNumFlag.didnum;
        condition.uid={$in:[null,'']};

        utils.removeEmptyProperty(condition);

        mongo.db().collection(constants.DB.platform_serviceNum).find(condition,{sort:{$natural:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(constants.DB.platform_serviceNum).count(condition, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    bindDidNum: function (data, session, callback) {
        var result = {success: false};
        var uid=data.uid;
        var didNum=data.telNum;
        var aid=session.account._id;
        var pbx=utils.getProductPbx(constants.product.zj,session);
        mongo.db().collection(constants.DB.platform_serviceNum).findOne({_id:didNum},function(err,row){
            if(!err){
                var endTime=row.endTime+' 23:59:59';
                var currentTime=utils.DateTime.getCurrentDateTime();
                var time = utils.DateTime.getDateDiff(currentTime,endTime,"second");
                var info={
                    account:aid,
                    pbx:pbx,
                    serviceno:didNum,
                    uid:uid,
                    maxCall:row.concurrent
                }
//                if(time<0){
//                    info.maxCall=0;
//                }
                var status=row.status;
                if(status==constants.serviceNumStatus.stop || status==constants.serviceNumStatus.stopTry){
                    result.message="不能选择停用的号码！";
                    callback(result);
                    return;
                }
                mongo.db().collection(constants.DB.platform_user).update({_id:uid},{$set:{didNum:didNum}},function(err){
                    if(!err){
                        var set={uid:uid,flag:constants.serviceNumFlag.didnum};
                        mongo.db().collection(constants.DB.platform_serviceNum).update({_id:didNum},{$set:set},function(err){
                            if(!err){
                                syncAcs.bindDidNum(info,function(isSuccess){
                                    if(isSuccess){
                                        result.success = true;
                                    }
                                    callback(result);
                                });
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    cancelDidNum: function (data, session, callback) {
        var result = {success: false};
        var uid=data.uid;
        var didNum=data.didNum;
        var aid=session.account._id;
        var pbx=utils.getProductPbx(constants.product.zj,session);
        mongo.db().collection(constants.DB.platform_user).update({_id:uid},{$set:{didNum:''}},function(err){
            if(!err){
                mongo.db().collection(constants.DB.platform_serviceNum).update({_id:didNum},{$set:{uid:"",flag:""}},function(err){
                    if(!err){
                        var info={
                            account:aid,
                            pbx:pbx,
                            serviceno:'',
                            uid:uid,
                            maxCall:1
                        }
                        syncAcs.bindDidNum(info,function(isSuccess){
                            if(isSuccess){
                                result.success = true;
                            }
                            callback(result);
                        });
                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },

    batchAddAgent: function (data, session, callback) {
        var result = {success: false};

        var time=utils.DateTime.getCurrentDateTime();
        var time2=utils.DateTime.getCurrentTimestamp();
        var aid=session.account._id;
        var pbx=utils.getProductPbx(constants.product.zj,session);

        var startExten=parseInt(data.startExten,10);
        var num=parseInt(data.num,10);
        if(num>50){
            result.message="批量增加最大数为50!";
            callback(result);
            return;
        }
        var index=0;
        var allUser=[];
        var addAgent=function(){
            if(index<num){
                var exten=startExten+index;
                exten=exten+"";
                var id=utils.UUID.generateUuid();
                var user={
                    _id:id,
                    exten:exten,
                    displayName:exten,
                    password:exten,
                    mobile:'',
                    email:'',
                    callerIDNum:"",
                    createTime:time,
                    lastUpdate:time2,
                    account:aid,
                    pbx:pbx,
                    product:constants.product.zj,
                    isAdmin:false,
                    pinyin: exten
                }
                handler.checkRepeat(user,false,function(rep){
                    if(rep.success){
                        allUser.push(user);
                        handler.getSipInfo(user,function(rep2){
                            if(rep2.success){
                                var sips=rep2.sips;
                                user.sipExten=sips[0].exten;
                                user.mobileExten=sips[1].exten;
                                user.sips=sips;
                                index++;
                                addAgent();
                            }else{
                                callback(rep2);
                            }
                        })
                    } else{
                        callback(rep);
                    }
                });
            }else{
                syncAcs.batchAddUser(aid,pbx,allUser,function(isSuccess){
                    if(isSuccess){
                        result.success = true;
                        for (var i = 0; i < allUser.length; i++) {
                            var _user = allUser[i];
                            var ary1=_user.sips[0];
                            var ary2=_user.sips[1];
                            mongo.db().collection('platform_sipNum').update({_id:ary1.exten},{$set: ary1});
                            mongo.db().collection('platform_sipNum').update({_id:ary2.exten},{$set: ary2});
                            delete _user.sips;
                            mongo.db().collection(constants.DB.platform_user).insert(_user, function (err) {
                                if (err) {
                                    logger.app.error(err);
                                }
                            });
                        }
                        callback(result);
                    }else{
                        result.message="同步acs失败!";
                        callback(result);
                    }
                })
            }
        }
        addAgent();
        mongo.db().collection(constants.DB.im_contacts_version).update(
            {Account:session.account._id}
            ,{$set:{Account:session.account._id,Version:dateTimeUtils.getCurrentTimestamp()}}
            ,{upsert:true});
    },
    /**
     * for cache
     * @param session
     * @param callback
     */
    queryMyIvrServiceNo:function(session, callback) {
        var condition ={account:session.account._id,serviceNo:{$nin:['',null]}};
        mongo.db("zj").collection(constants.DB.platform_ivr).find(condition,{fields:{serviceNo:1}}).toArray(function (err, docs) {
            if (!err) {
                var list=docs || [];
                var _list=[];
                for (var i = 0; i < list.length; i++) {
                    var obj = list[i];
                    _list.push({_id:obj.serviceNo,codeName:obj.serviceNo,codeValue:obj.serviceNo});
                }
                callback(null, _list);
            } else {
                logger.app.error(err);
                callback(err);
            }
        });
    },
    _checkCallerNum:function(data,session,callback){
        var result = {success: false};
        if(data.callerIDNum){
            var condition ={_id:data.callerIDNum,account:session.account._id,product:constants.product.zj,flag:constants.serviceNumFlag.service};
            mongo.db().collection(constants.DB.platform_serviceNum).findOne(condition,{fields:{_id:1}},function (err, row) {
                if (!err) {
                    if(row){
                        result.success=true;
                        callback(result)
                    }else{
                        result.message="非法的外显号码";
                        callback(result)
                    }
                } else {
                    logger.app.error(err);

                    callback(result);
                }
            });
        }else{
            result.success=true;
            callback(result)
        }
    },
    batchUpdateCallInternaion:function (data, session, callback) {
        var result = {success: false};
        var aid=session.account._id;

        var start=data.startExten;
        var end=data.endExten;
        var batch_callinternation=data.batch_callinternation;
        var set={
            iscallinternation:batch_callinternation
        }
        var query= {account:aid,"product" : "zj",exten:{$lte:end,$gte:start}};
        mongo.db().collection(constants.DB.platform_user).update(query,{$set:set},{multi:true},function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(err);
            }
        });
    },
    batchUpdateCallerNum: function (data, session, callback) {
        var result = {success: false};
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        var pbx=utils.getProductPbx(constants.product.zj,session);

        var start=data.startExten;
        var end=data.endExten;
        var callerIDNum=data.callerIDNum;
        var query= {account:aid,exten:{$lte:end,$gte:start}};
        handler._checkCallerNum(data,session,function(rep){
            if(rep.success){
                mongo.db().collection(constants.DB.platform_user).find(query,{fields:{_id:1}}).toArray(function (err, docs) {
                    if (!err) {
                        var users=docs || [];
                        syncAcs.batchUpdateCallerNum(aid,pbx,callerIDNum,users,function(isSuccess){
                            if(isSuccess){
                                var set={
                                    callerIDNum:callerIDNum
                                }
                                mongo.db().collection(constants.DB.platform_user).update(query,{$set:set},{multi:true},function (err) {
                                    if (!err) {
                                        result.success = true;
                                        callback(result);
                                    }else{
                                        logger.app.error(err);
                                        callback(err);
                                    }
                                });
                            }else{
                                result.message="同步acs失败!";
                                callback(result);
                            }
                        })
                    } else {
                        logger.app.error(err);
                        callback(err);
                    }
                });
            }else{
                callback(rep);
            }
        });
    },
    editAgentForIm : function(data, callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_user).findOne({_id:data._id},function (err, doc) {
            if (!err) {
                if (!doc) {
                    result.message = 'this user not found!';
                    callback(result);
                } else {
                    var session = {
                        account:{_id: doc.account}
                    }
                    var updateDoc = {
                        _id: data._id,
                        displayName : data.displayName,
                        email : data.email,
                        mobile : data.mobile,
                        pinyin : cnToSpellUtil.getSpell(data.displayName)
                    }
                    handler.updateAgent(updateDoc,session,function(res){
                        if(!res.success){
                            result.message = 'update agent failed!';
                            callback(result);
                        }else{
                            result.success = true;
                            callback(result);
                        }
                    })
                }
            } else {
                logger.app.error(err.stack);
                result.message = 'editAgentForIm error!';
                callback(result);
            }
        });
    }
};

module.exports = handler;
