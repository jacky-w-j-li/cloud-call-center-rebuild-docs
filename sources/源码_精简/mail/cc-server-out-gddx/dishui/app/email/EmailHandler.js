var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var custHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');

var handler = {
    locationCustomer : function(data, session, callback){
        var result = {success:false};
        var cid=data.customerId;
        var id=data.callId;
        mongo.db().collection(fields.DB_APP_MAIL).update({_id:id},{$set:{customerId:cid,custName:data.custName}},{w:1},function (err){
            if (!err) {
                result.success=true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    queryMailById:function(data,session,callback){
        var result = {success:false};
        var query={
            _id:data._id
        }
        mongo.db().collection(fields.DB_APP_MAIL).findOne(query,function(err,row){
            if (!err) {
                result.row=row;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    queryMailInfo:function(data,session,callback){
        var result = {success:false};
        var query={
            _id:data._id
        }
        mongo.db().collection(fields.DB_APP_MAIL).findOne(query,function(err,row){
            if (!err) {
                result.row=row;
                mongo.db().collection(fields.DB_APP_MAIL).find({rid:data._id}).toArray(function (err, list) {
                    if(!err){
                        result.replys=list||[];
                        result.success = true;
                        callback(result);
                    }else{
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
    dealInbox:function(data,session,callback){
        var result = {success:false};
        var id=data._id;
        var uid=session.user._id;
        var set={
            status:'deal'//undeal,deal
//            assign:uid
        }
        mongo.db().collection(fields.DB_APP_MAIL).update({_id:id},{$set:set},{w:1},function (err){
            if (!err) {
                result.success=true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     *
     *         {
  "_id":"uuid",
  "msgType":"mail/weixin",
  "mailId":"",
  "to":"xxx,xxx",
  "cc":"xxx,xxx",
  "subject":"",
  "content":"",
  rid:"",//回复的邮件id
  account:"",
  uid:""//座席id
}
     * @param data
     * @param session
     * @param callback
     */
    replyInbox:function(data,session,callback){
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        var uid=session.user._id;
        data._id=id;
        data.msgType="mail";
//        data.mailId="zhangyang@7moor.com";
//        data.rid=data.rid;

        data.account=aid;
//        data.uid=uid;
        data.user=uid;
        data.createTime= time;
        data.lastTime=time;

        data.subject=encodeURIComponent(encodeURIComponent(data.subject));
        data.content=encodeURIComponent(encodeURIComponent(data.content));

        var attachs=data.attachment||[];
        for (var i = 0; i < attachs.length; i++) {
            var obj = attachs[i];
//            var key=obj.key;
            obj.fileName=encodeURIComponent(obj.fileName);
        }

        httpProvider.sendPost(config.msgUrl+"sendMessage", "data="+JSON.stringify(data),function(err, rep){
            if(err) {
                logger.app.warn('replyInbox to ass failed!', err);
                callback(result);
            } else {
                var res = JSON.parse(rep);
                if(res.success){
                    result.success=true;
                    result.data=data;
                    callback(result);
                } else {
                    logger.app.warn(result);
                    callback(result);
                }
            }
        });
    },
    _setQueryWeixinCondition:function(query,session){
        utils.removeEmptyProperty(query);
        delete query.page;
        delete query.limit;
        query.account=session.user.account;
        query.type="in";
        //if(query.user=='empty'){
        //    query.user={$in:['',null]}
        //}
        utils.setDateTimeCondition(query);
    },
    queryMailList : function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        handler._setQueryWeixinCondition(query,session);
        delete query.type;
        query.rid={$in:['',null]};
        mongo.db().collection(fields.DB_APP_MAIL).find(query,{sort:{receiveTime:-1},fields:{content:0},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_APP_MAIL).count(query,function(err,count){
                    if(!err){
                        result.count=count;
                        result.success = true;
                        callback(result);
                    }else{
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

    queryUndealList : function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        query.status='leak';
        handler._setQueryWeixinCondition(query,session);

        mongo.db().collection(fields.DB_APP_MAIL).find(query,{sort:{receiveTime:-1},fields:{content:0},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_APP_MAIL).count(query,function(err,count){
                    result.count=count;
                    result.success = true;
                    callback(result);
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    saveMailAssign : function (data,session,callback){
        var total=data.total;
        var owners=data.owners;
        var query=data.query||{};

        handler._setQueryWeixinCondition(query,session);
        query.status='leak';
//        utils.setUserLevelCondition(query,'owner',session);
        var result = {success:false};
//        var timeStamp=utils.DateTime.getCurrentTimestamp();
        mongo.db().collection(fields.DB_APP_MAIL).find(query,{sort:{receiveTime:-1},fields:{_id:1}}).toArray(function (err, docs) {
            if (!err) {
                if(total==docs.length){
                    var ids=[];
                    var skip=0;
                    for(var i=0;i<owners.length;i++){
                        var count=owners[i].count;
                        var owner= owners[i].owner;
                        for (var j = skip; j < skip+count; j++) {
                            var doc = docs[j];
                            ids.push(doc._id);
                        }
                        var q1={"_id":{"$in":ids}};
                        var d1={user:owner,status:'assign'};
                        handler._updateMailOwner(q1,d1,session);
                        ids=[];
                        skip+=count;
                    }
                    result.success = true;
                }else{
                    logger.app.error('saveMailAssign data is change');
                    result.code = '1001';
                }
                callback(result);
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    },
    _updateMailOwner:function(query,data,session){
        var time=utils.getCurrentDate() ;
        var uid=session.user._id;
//        data.lastUpdateTime=time;
//        data.lastUpdater=uid;
        mongo.db().collection(fields.DB_APP_MAIL).update(query,{$set:data},{multi: true},function(err){
            if(err){
                logger.app.error('_updateMailOwner error:' + err.stack);
            }else{

            }
        });
    },
    queryMyMailList : function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        var uid=session.user._id;
        query.user=uid;
        handler._setQueryWeixinCondition(query,session);
        mongo.db().collection(fields.DB_APP_MAIL).find(query,{sort:{receiveTime:-1},fields:{content:0},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_APP_MAIL).count(query,function(err,count){
                    result.count=count;
                    result.success = true;
                    callback(result);
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    // dic
    getEmailChannel:function(session,callback){
        var result = {success: false};
        var aid = session.user.account;
        var query ={
            account:aid
        };
        mongo.db().collection(fields.DB_APP_MAIL_CONFIG).find(query,{fields:{mailId:1,mailDisplayName:1,isDefault:1}}).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                callback(null, docs || []);
            } else {
                logger.app.error("getEmailChannel error", err);
                callback(err);
            }
        });
    },
    // dic
    getWeixinChannel:function(session,callback){
        var result = {success: false};
        var aid = session.user.account;
        var query ={
            account:aid
        };
        mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).find(query,{fields:{openID:1,displayName:1,isDefault:1}}).toArray(function (err, docs) {
            if (!err) {
                result.success = true;
                callback(null, docs || []);
            } else {
                logger.app.error("getWeixinChannel error", err);
                callback(err);
            }
        });
    },

    queryMailListByCustID : function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        utils.removeEmptyProperty(query);
        query.account=session.user.account;
        query.type="in";
        mongo.db().collection(fields.DB_APP_MAIL).find(query,{sort:{receiveTime:-1},fields:{content:0},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_APP_MAIL).count(query,function(err,count){
                    result.count=count;
                    result.success = true;
                    callback(result);
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },

    relocationCustomer : function (data, session, callback) {
        var limit = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var skip = (page - 1) * limit;
        var emailId=data._id;
        delete data._id;

        var query = data||{};
        utils.removeEmptyProperty(query);
        var result = {success: false};
        //query.delTag = null;
        var aid=session.user.account;

        handler.queryMailInfo({_id:emailId},session,function(rep){
            if(rep.success){
                result.row=rep.row;
                result.replys=rep.replys;

                var custId=rep.row.customerId;
                if(custId){
                    custHandler.queryCustInfo({_id:custId},session,function(rep){
                        if(rep.success){
                            var item=rep.data;
                            result.count = 1;
                            result.list=[item];
                            result.success = true;
                            callback(result);
                        }else{
                            callback(rep);
                        }
                    })
                }else{
                    var mail=result.row.from||'';
                    if (mail) {
                        query["email.email"] = mail;
                    }
                    mongo.db(session).collection(aid + fields.DB_C5_CUSTOMER).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                        if (!err) {
                            result.list = docs||[];
                            mongo.db(session).collection(aid + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                                if (!err) {
                                    result.count = count;
                                    if (count == 1) {
                                        var cust=result.list[0];
                                        custHandler.queryCustFields(cust, session, function (rep) {
                                            if (rep.success) {
                                                cust.fields = rep.data.fields;
                                                result.success = true;
                                                callback(result);
                                            } else {
                                                result.success = false;
                                                callback(result);
                                            }
                                        });
                                        mongo.db().collection(fields.DB_APP_MAIL).update({_id:emailId},{$set:{customerId:cust._id,custName:cust.name}},function (err){
                                            if (err) {
                                                logger.app.error(err);
                                            }
                                        });
                                    }else{
                                        result.success = true;
                                        callback(result);
                                    }
                                } else {
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.error(err);
                            callback(result);
                        }
                    })
                }
            }else{
                callback(rep);
            }
        });
    },


    queryMailList2In : function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        handler._setQueryWeixinCondition(query,session);
        utils.setUserLevelCondition(query,'user','email',session);
        delete query.type;
        query.rid={$in:['',null]};

        mongo.db().collection(fields.DB_APP_MAIL).find(query,{sort:{receiveTime:-1},fields:{content:0},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(fields.DB_APP_MAIL).count(query,function(err,count){
                    if(!err){
                        result.count=count;
                        result.success = true;
                        callback(result);
                    }else{
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
    saveMailAssign2In : function (data,session,callback){
        var total=data.total;
        var owners=data.owners;
        var query=data.query||{};
        handler._setQueryWeixinCondition(query,session);
        utils.setUserLevelCondition(query,'user','email',session);
        query.status='leak';
//        utils.setUserLevelCondition(query,'owner',session);
        var result = {success:false};
//        var timeStamp=utils.DateTime.getCurrentTimestamp();
        mongo.db().collection(fields.DB_APP_MAIL).find(query,{sort:{receiveTime:-1},fields:{_id:1}}).toArray(function (err, docs) {
            if (!err) {
                if(total==docs.length){
                    var ids=[];
                    var skip=0;
                    for(var i=0;i<owners.length;i++){
                        var count=owners[i].count;
                        var owner= owners[i].owner;
                        for (var j = skip; j < skip+count; j++) {
                            var doc = docs[j];
                            ids.push(doc._id);
                        }
                        var q1={"_id":{"$in":ids}};
                        var d1={user:owner,status:'assign'};
                        handler._updateMailOwner(q1,d1,session);
                        ids=[];
                        skip+=count;
                    }
                    result.success = true;
                }else{
                    logger.app.error('saveMailAssign2In data is change');
                    result.code = '1001';
                }
                callback(result);
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    }
};



module.exports = handler;

