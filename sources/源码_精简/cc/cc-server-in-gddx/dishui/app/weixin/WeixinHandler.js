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
        var aid=session.user.account;
        mongo.db().collection(fields.DB_APP_WEIXIN_USER).update({_id:id+"_"+aid},{$set:{customerId:cid,custName:data.custName}},{w:1},function (err){
            if (!err) {
                result.success=true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    queryWeixinById:function(data,session,callback){
        var result = {success:false};
        var query={
            _id:data._id
        }
        mongo.db().collection(fields.DB_APP_WEIXIN).findOne(query,function(err,row){
            if (!err) {
                result.success = true;
                result.row=row;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    dealMsg:function(data,session,callback){
        var result = {success:false};
        var id=data._id;
        var uid=session.user._id;
        var aid=session.user.account;

        var query={account:aid,userID:id,status:{$in:['undeal','leak','assign']}};
        var set={
            status:'deal'//undeal,deal,leak
        }
        mongo.db().collection(fields.DB_APP_WEIXIN).update(query,{$set:set},{w:1,multi:true},function (err){
            if (!err) {
                var query2={
                    _id:id+"_"+aid
                }
                mongo.db().collection(fields.DB_APP_WEIXIN_USER).update(query2,{$set:{status:'deal',msgNum:0}},{w:1},function (err){
                    if (!err) {
                        result.success=true;
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
    /**
     *
     * @param data
     * @param session
     * @param callback
     */
    replyMsg:function(data,session,callback){
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        var uid=session.user._id;
        data._id=id;
        data.msgType="weixin";

        data.account=aid;
        data.user=uid;
//        data.uid=uid;
        data.createTime= time;
        data.lastTime=time;
//        data.content=encodeURIComponent(encodeURIComponent(data.content));

        httpProvider.sendPost(config.msgUrl+"sendMessage", "data="+JSON.stringify(data),function(err, rep){
            if(err) {
                logger.app.warn('replyMsg to gateway failed!', err);
                callback(result);
            } else {
                var res = JSON.parse(rep);
                if(res.success){
                    result.success=true;
                    result.row=data;
                    callback(result);
                } else {
                    logger.app.warn(result);
                    callback(result);
                }
            }
        });
    },
    queryHistory:function(data,session,callback){
        var result = {success:false};
        var limit = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var skip = (page - 1) * limit;


        var query = data||{};
        var aid=session.user.account;
        query.account=aid;
        utils.removeEmptyProperty(query);
        if(query.createTime){
            query.createTime={$lt:query.createTime};
        }

        mongo.db().collection(fields.DB_APP_WEIXIN).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs||[];
                result.success=true;
                callback(result)
            }else{
                logger.app.error(err);
                callback(result);
            }
        })
    },
    _setQueryWxCondition:function(query,session){
        delete query.page;
        delete query.limit;
        utils.removeEmptyProperty(query);
        query.account=session.user.account;
//        utils.setDateTimeCondition(query);
    },
    queryWexinUser:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        handler._setQueryWxCondition(query,session);
        mongo.db().collection(fields.DB_APP_WEIXIN_USER).find(query,{sort:{$natural:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs||[];
                mongo.db().collection(fields.DB_APP_WEIXIN_USER).count(query,function(err,count){
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

    queryUndealWexinUser:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        var uid=session.user._id;
        handler._setQueryWxCondition(query,session);
        query.status='leak';
        mongo.db().collection(fields.DB_APP_WEIXIN_USER).find(query,{sort:{$natural:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs||[];
                mongo.db().collection(fields.DB_APP_WEIXIN_USER).count(query,function(err,count){
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
    queryUserHistory:function(data,session,callback){
        var result = {success:false};
        var limit = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var skip = (page - 1) * limit;

        var query = data||{};
        var aid=session.user.account;
        query.account=aid;
        if(!query.userID){
            query.userID="NA";
        }
        utils.removeEmptyProperty(query);
        mongo.db().collection(fields.DB_APP_WEIXIN).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs||[];
                result.success=true;
                callback(result);
            }else{
                logger.app.error(err);
                callback(result);
            }
        })
    },
    queryMyWeixinList : function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        var aid=session.user.account;
//        query.account=aid;

        utils.removeEmptyProperty(query);
        var uid=session.user._id;

        mongo.db().collection(fields.DB_APP_WEIXIN).distinct("userID", {user:uid}, function (err, docs) {
            if (!err) {
                docs = docs || [];
                for (var i = 0; i < docs.length; i++) {
                    var o = docs[i];
                    docs[i]=o+"_"+aid;
                }
                query._id={$in: docs};
                mongo.db().collection(fields.DB_APP_WEIXIN_USER).find(query,{sort:{$natural:-1},limit: limit, skip: skip}).toArray(function (err, list) {
                    if (!err) {
                        result.list = list||[];
                        mongo.db().collection(fields.DB_APP_WEIXIN_USER).count(query,function(err,count){
                            result.count=count;
                            result.success = true;
                            callback(result);
                        });
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
    saveWeixinAssign : function (data,session,callback){
        var result = {success:false};
        var total=data.total;
        var owners=data.owners;
        var query=data.query||{};
        handler._setQueryWxCondition(query,session);
        query.status='leak';
        mongo.db().collection(fields.DB_APP_WEIXIN_USER).find(query,{sort:{$natural:-1},fields:{_id:1}}).toArray(function (err, docs) {
            if (!err) {
                if(total==docs.length){
                    var ids=[];
                    var userIds=[];
                    var skip=0;
                    for(var i=0;i<owners.length;i++){
                        var count=owners[i].count;
                        var owner= owners[i].owner;
                        for (var j = skip; j < skip+count; j++) {
                            var doc = docs[j];
                            var _id=doc._id;
                            userIds.push(_id);
                            var idx=_id.lastIndexOf("_");
                            var key=_id.substring(0,idx);
//                            var key=doc._id.split("_")[0];
                            ids.push(key);
                        }
                        var q1={userID:{"$in":ids},status:'leak'};
                        var q2={_id:{"$in":userIds}};
                        var d1={user:owner,status:'assign'};
                        handler._updateWeixinOwner(q1,q2,d1,session);
                        ids=[];
                        skip+=count;
                    }

                    result.success = true;
                }else{
                    logger.app.error('saveWeixinAssign data is change');
                    result.code = '1001';
                }
                callback(result);
            } else {
                logger.app.error(err);
                callback({success: false, list: [], count: 0});
            }
        });
    },
    _updateWeixinOwner:function(query,query2,data,session){
        var time=utils.getCurrentDate() ;
        var aid=session.user.account;
        query.account=aid;
//        data.lastUpdateTime=time;
//        data.lastUpdater=uid;
        mongo.db().collection(fields.DB_APP_WEIXIN).update(query,{$set:data},{multi: true},function(err){
            if(err){
                logger.app.error('_updateWeixinOwner error:' + err.stack);
            }else{
                mongo.db().collection(fields.DB_APP_WEIXIN_USER).update(query2,{$set:{status:'assign'}},{w:1},function (err){});
            }
        });
    },

    queryUserHistoryByCustId:function(data,session,callback){
        var result = {success:false};
        var aid=session.user.account;
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({_id:data.customerId},function(err,row){
            if(!err && row){
                var wxs=row.weixin||[];
                var wxIds=[];
                var wxIds2=[];
                if(wxs.length>0){
                    for (var i = 0; i < wxs.length; i++) {
                        var obj = wxs[i];
                        wxIds.push(obj.num);
                        wxIds2.push(obj.num+"_"+aid);
                    }
                }
                var limit = data.limit||10;
                delete data['limit'];
                var page = data.page||1;
                delete data['page'];
                var skip = (page - 1) * limit;

                var query = {};

                query.account=aid;
                query.userID={$in:wxIds};
                utils.removeEmptyProperty(query);
                mongo.db().collection(fields.DB_APP_WEIXIN).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                    if (!err) {
                        docs = docs||[];
                        mongo.db().collection(fields.DB_APP_WEIXIN_USER).find({_id:{$in:wxIds2}},{fields:{_id:1,nickname:1}}).toArray(function (err, list) {
                           if(!err){
                               list=list||[];
                               for (var i = 0; i < docs.length; i++) {
                                   var obj1 = docs[i];
                                   for (var j = 0; j < list.length; j++) {
                                       var obj2 = list[j];
                                       if(obj2._id.indexOf(obj1.userID)!=-1){
                                           obj1.nickname=obj2.nickname;
                                       }
                                   }
                               }
                               result.list = docs;
                               result.success=true;
                               callback(result);
                           }else{
                               logger.app.error(err);
                               callback(result);
                           }
                        });

                    }else{
                        logger.app.error(err);
                        callback(result);
                    }
                })
            }else{
                logger.app.error('db queryUserHistoryByCustId error:' + err.stack);
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
        var uid=data._id;
        delete data._id;

        var query = data||{};
        utils.removeEmptyProperty(query);
        var result = {success: false};
        //query.delTag = null;
        var aid=session.user.account;
//        var idx=uid.lastIndexOf("_");
//        var userId=uid.substring(0,idx);
        query["weixin.num"] = uid;
        mongo.db().collection(fields.DB_APP_WEIXIN_USER).findOne({_id:uid+"_"+aid},function(err,row){
            if(!err && row){
                var custId=row.customerId;
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
                                        mongo.db().collection(fields.DB_APP_WEIXIN_USER).update({_id:uid+"_"+aid},{$set:{customerId:cust._id,custName:cust.name}},function (err){
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
                logger.app.error(err);
                callback(result);
            }
        });
    },

    queryWexinUser2In:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data.limit;
        var page = data.page||1;
        delete  data.page;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query=data||{};
        handler._setQueryWxCondition(query,session);
        var aid=session.user.account;
        var scope=session.user.scope.chat;
        if(scope!=fields.data_scope_all){
            var query2={};
            utils.setUserLevelCondition(query2,'user','chat',session);
            mongo.db().collection(fields.DB_APP_WEIXIN).distinct("userID", query2, function (err, docs) {
                if (!err) {
                    docs = docs || [];
                    for (var i = 0; i < docs.length; i++) {
                        var o = docs[i];
                        docs[i]=o+"_"+aid;
                    }
                    query._id={$in: docs};
                    mongo.db().collection(fields.DB_APP_WEIXIN_USER).find(query,{sort:{$natural:-1},limit: limit, skip: skip}).toArray(function (err, list) {
                        if (!err) {
                            result.list = list||[];
                            mongo.db().collection(fields.DB_APP_WEIXIN_USER).count(query,function(err,count){
                                result.count=count;
                                result.success = true;
                                callback(result);
                            });
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
        }else{
            mongo.db().collection(fields.DB_APP_WEIXIN_USER).find(query,{sort:{$natural:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
                if (!err) {
                    result.list = docs||[];
                    mongo.db().collection(fields.DB_APP_WEIXIN_USER).count(query,function(err,count){
                        result.count=count;
                        result.success = true;
                        callback(result);
                    });
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        }
    },
    saveWeixinAssign2In : function (data,session,callback){
        var result = {success:false};
        var total=data.total;
        var owners=data.owners;
        var query=data.query||{};
        handler._setQueryWxCondition(query,session);
        query.status='leak';

        var aid=session.user.account;
        var scope=session.user.scope.chat;
        if(scope!=fields.data_scope_all){
            var query2={};
            utils.setUserLevelCondition(query2,'user','chat',session);
            mongo.db().collection(fields.DB_APP_WEIXIN).distinct("userID", query2, function (err, docs) {
                if (!err) {
                    docs = docs || [];
                    for (var i = 0; i < docs.length; i++) {
                        var o = docs[i];
                        docs[i]=o+"_"+aid;
                    }
                    query._id={$in: docs};
                    mongo.db().collection(fields.DB_APP_WEIXIN_USER).find(query,{sort:{$natural:-1},fields:{_id:1}}).toArray(function (err, docs) {
                        if (!err) {
                            if(total==docs.length){
                                var ids=[];
                                var userIds=[];
                                var skip=0;
                                for(var i=0;i<owners.length;i++){
                                    var count=owners[i].count;
                                    var owner= owners[i].owner;
                                    for (var j = skip; j < skip+count; j++) {
                                        var doc = docs[j];
                                        var _id=doc._id;
                                        userIds.push(_id);
                                        var idx=_id.lastIndexOf("_");
                                        var key=_id.substring(0,idx);
//                            var key=doc._id.split("_")[0];
                                        ids.push(key);
                                    }
                                    var q1={userID:{"$in":ids},status:'leak'};
                                    var q2={_id:{"$in":userIds}};
                                    var d1={user:owner,status:'assign'};
                                    handler._updateWeixinOwner(q1,q2,d1,session);
                                    ids=[];
                                    skip+=count;
                                }

                                result.success = true;
                            }else{
                                logger.app.error('saveWeixinAssign data is change');
                                result.code = '1001';
                            }
                            callback(result);
                        } else {
                            logger.app.error(err);
                            callback({success: false, list: [], count: 0});
                        }
                    });
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
        }else{
            mongo.db().collection(fields.DB_APP_WEIXIN_USER).find(query,{sort:{$natural:-1},fields:{_id:1}}).toArray(function (err, docs) {
                if (!err) {
                    if(total==docs.length){
                        var ids=[];
                        var userIds=[];
                        var skip=0;
                        for(var i=0;i<owners.length;i++){
                            var count=owners[i].count;
                            var owner= owners[i].owner;
                            for (var j = skip; j < skip+count; j++) {
                                var doc = docs[j];
                                var _id=doc._id;
                                userIds.push(_id);
                                var idx=_id.lastIndexOf("_");
                                var key=_id.substring(0,idx);
//                            var key=doc._id.split("_")[0];
                                ids.push(key);
                            }
                            var q1={userID:{"$in":ids},status:'leak'};
                            var q2={_id:{"$in":userIds}};
                            var d1={user:owner,status:'assign'};
                            handler._updateWeixinOwner(q1,q2,d1,session);
                            ids=[];
                            skip+=count;
                        }

                        result.success = true;
                    }else{
                        logger.app.error('saveWeixinAssign data is change');
                        result.code = '1001';
                    }
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        }
    }
};



module.exports = handler;

