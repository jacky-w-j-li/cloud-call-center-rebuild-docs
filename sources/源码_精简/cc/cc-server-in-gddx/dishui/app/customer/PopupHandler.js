var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var custhandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');
var emailHandler = require(__baseDir + '/dishui/app/email/EmailHandler');
var weixinHandler = require(__baseDir + '/dishui/app/weixin/WeixinHandler');
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var Thenjs = require("thenjs");

exports.popupCust = function (data, session, callback) {
    var limit = data.limit||10;
    delete data['limit'];
    var page = data.page||1;
    delete data['page'];
    var skip = (page - 1) * limit;

    var queue=data.queue;
    delete data.queue;
    var query = data;
    utils.removeEmptyProperty(query);
    var result = {success: false};
    var tel=query.phone;
    if (tel) {
        query["phone.tel"] = tel;
        delete query.phone;
    }
    //query.delTag = null;
    delete query.accountId;

    mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs||[];
            if(result.list==0){
                var _tel=utils.getShortTel(tel);
                query["phone.tel"] = _tel;
                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                    if (!err) {
                        result.list = docs||[];
                        mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                            if (!err) {
                                result.count = count;
                                result.success = true;
                                if (count == 1) {
                                    custhandler.queryCustFields(docs[0], session, function (rep) {
                                        if (rep.success) {
                                            result.list[0].fields = rep.data.fields;
                                            callback(result);
                                        } else {
                                            result.success = false;
                                            callback(result);
                                        }
                                    });
                                }else{
                                    callback(result);
                                }
                                //exports.getQueuePopup({queue:queue},session,function(rep2){
                                //    if (rep2.success) {
                                //        result.popup=rep2.popup;
                                //        if (count == 1) {
                                //            custhandler.queryCustFields(docs[0], session, function (rep) {
                                //                if (rep.success) {
                                //                    result.list[0].fields = rep.data.fields;
                                //                } else {
                                //                    result.success = false;
                                //                    callback(result);
                                //                }
                                //            });
                                //        }
                                //        callback(result);
                                //    }else{
                                //        callback(rep2);
                                //    }
                                //});
                            } else {
                                logger.app.error(err);
                                callback({success: false, list: [], count: 0});
                            }
                        });
                    }else{
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                })
            }else{
                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        if (count == 1) {
                            custhandler.queryCustFields(docs[0], session, function (rep) {
                                if (rep.success) {
                                    result.list[0].fields = rep.data.fields;
                                    callback(result);
                                } else {
                                    result.success = false;
                                    callback(result);
                                }
                            });
                        }else{
                            callback(result);
                        }
                        //exports.getQueuePopup({queue:queue},session,function(rep2){
                        //    if (rep2.success) {
                        //        result.popup=rep2.popup;

//                                if(session.account.autoSave){
//                                    custhandler.resetStatus(docs[0],session,function(){});
//                                }

                        //}else{
                        //    callback(rep2);
                        //}
                        //});
                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            }
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });

}
exports.getQueuePopup = function (data, session, callback) {
    var result = {success: false};
    var queue = data.queue || "";

    mongo.db().collection("manager_ivr_skillgroup").findOne({Exten: queue}, function (err, dbQueue) {
        if (!err && dbQueue) {
            var popup = dbQueue.BussinessTypeId || "business";
            result.success = true;
            result.popup = popup;
            callback(result);
        } else {
            result.message = "can not found queue[" + queue + "]";
            result.success = true;
            result.popup = "business";
            callback(result);
        }
    });


}

exports.locactionCustNum = function(data, session, callback){
    var result = {success: false};
    var query = data||{};
    utils.removeEmptyProperty(query);

    if (query.phone) {
        query["phone.tel"] = query.phone;
        delete query.phone;
    }
    //query.delTag = null;
    mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
        if (!err) {
            result.count = count;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
}

exports.locactionCallNoArea = function(data, session, callback){
    var result = {success: false};
    var query={_id:data.tel};
    mongo.db("bill").collection("tbl_mobile_code").findOne(query, function (err, row) {
        if (!err) {
            result.row = row;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
}
/**
 * 查询老客户
 * @param data
 * @param session
 * @param callback
 */
exports.queryCustomerByPopup = function (data, session, callback) {
    var result = {success: false};
    var limit = data.limit||10;
    delete data['limit'];
    var page = data.page||1;
    delete data['page'];
    var skip = (page - 1) * limit;

    var callId=data.callId;
    var callTel=data.phone;
    var field=data.field;
    var combox=data.combox||'';
    combox=combox.replace(/(^\s+)|(\s+$)/g,"");
    var query={};
    if(combox){
        if (field=='phone') {
            query["phone.tel"] = combox;
        }else if(field=='email'){
            query["email.email"] = combox;
        }else if(field=='weixin'){
            query.$or=[{"weixin.num":combox},{"weixin.memo":combox}];
//            query["weixin.num"] = combox;
        }else if(field=='displayName'){
            //var regStr=utils.escapeRegex(combox);
            //query.name= new RegExp("^"+regStr);
        }
    }else{
        result.list = [];
        result.count = 0;
        result.success = true;
        callback(result);
        return;
    }

    //支持合并客户搜索
    if(data.mergeFlag){
        delete data.mergeFlag;
        if(session.user.type == "admin" || session.user.scope.customer == 'all'){
            query.owner = {"$ne":"NA"}
        }else{
            utils.setUserLevelCondition(query,'owner','customer',session);
        }
    }

    var _queryFun=function(){
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
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
    }

    if(combox && field=='displayName'){
        query.name=combox;
        solrHandler.queryIndex2Cust(query,session,function(rep){
            if(rep.success){
                delete query.name;
                var ids=rep.ids;
                query._id={$in:ids};
                _queryFun();
            }else{
                logger.app.error("query solr index error");
                callback({success: false, list: [], count: 0});
            }
        });
    }else{
        _queryFun();
    }
}


/**
 * 获取邮件信息，并定位客户，若定位到一个，更新邮件的关联客户id
 * @param data
 * @param session
 * @param callback
 */
exports.popupEmail = function (data, session, callback) {
    var result = {success: false};
    var query = data||{};
    utils.removeEmptyProperty(query);
    var aid=session.user.account;
    var query={_id:data._id};
    Thenjs(function(cont){
        mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).findOne(query,cont);

    }).then(function(cont, row){
        result.user = row;
        if(row){
            //mongo.db().collection(fields.APP_EMAIL_CUSTOMER_RELATE).findOne({email: data.fromEmail, account:aid}, function(err, relationDoc){
                var query = {};
                if(row.customerId){
                    query._id = row.customerId;
                    //row.customerId = relationDoc.customerId;
                }else{
                    query['email.email'] = {'$in':[data.fromEmail]};
                }
                mongo.db(session).collection(aid + fields.DB_C5_CUSTOMER).find(query).toArray(function(err, custDbs){
                    cont(err, custDbs, row);
                });
            //});
        }else{
            cont("用户不存在");
        }
    }).then(function(cont, custDbs, row){
        if(custDbs){
            if(custDbs.length == 1){
                custhandler.queryCustFields(custDbs[0], session, function (rep) {
                    if (rep.success) {
                        custDbs[0].fields = rep.data.fields;
                        result.row = custDbs[0];
                        if(!row.customerId){
                            //自动关联客户
                            mongo.db().collection(fields.APP_EMAIL_CHANNEL_SESSION).update(
                                {'from.addr':data.fromEmail, account:session.user.account, customerId: null},
                                {$set:{customerId: custDbs[0]._id}},
                                {multi: true,w:1}, function(err){
                                    if(!err){
                                        mongo.db(session).collection(session.user.account+"_history").update({email: data.fromEmail,$or:[{customer:null},{customer:''}]}, {$set:{customer:custDbs[0]._id}},{multi: true}, function(err){});
                                    }
                                });

                        }
                        result.success = true;
                        callback(result);
                    } else {
                        result.success = false;
                        callback(result);
                    }
                });
            }else{
                for(var i =0; i<custDbs.length; i++){
                    if(row.customerId && custDbs[i]._id == row.customerId){
                        result.row = custDbs[i];
                        break;
                    }
                }
                result.multiCusts = custDbs;
                result.success = true;
                callback(result);
            }
        }else{
            result.success = true;
            callback(result);
        }
    }).fail(function(cont, err){
        logger.app.error(err);
        callback(result);
    });
}




exports.popupWeixin = function (data, session, callback) {
    var limit = data.limit||10;
    delete data['limit'];
    var page = data.page||1;
    delete data['page'];
    var skip = (page - 1) * limit;
    var wxId=data._id;
    delete data._id;
    var query = data||{};
    utils.removeEmptyProperty(query);
    var result = {success: false};
    //query.delTag = null;
    var aid=session.user.account;
    var userId=query.weixin;
    if (query.weixin) {
        query["weixin.num"] = query.weixin;
        delete query.weixin;
    }
//    weixinHandler.queryWeixinById({_id:wxId},session,function(rep){
//        if(rep.success){
//            var inbox=rep.row||{};
//            result.inbox=inbox;
            mongo.db(session).collection(aid + fields.DB_C5_CUSTOMER).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                if (!err) {
                    result.list = docs||[];
                    mongo.db(session).collection(aid + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                        if (!err) {
                            result.count = count;
                            if (count == 1) {
                                var cust=result.list[0];
                                custhandler.queryCustFields(cust, session, function (rep) {
                                    if (rep.success) {
                                        cust.fields = rep.data.fields;
                                        result.success = true;
                                        var _set={
                                            callId:userId,
                                            customerId:cust._id,
                                            custName:cust.name
                                        }
                                        weixinHandler.locationCustomer(_set,session,function(){});
                                        callback(result);
                                    } else {
                                        result.success = false;
                                        callback(result);
                                    }
                                });
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        } else {
                            logger.app.error(err);
                            callback({success: false, list: [], count: 0});
                        }
                    });
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            })
//        }else{
//            callback(rep);
//        }
//    });
}

exports.popupWebchat = function (data, session, callback) {
    var result = {success: false};
    var query = data||{};
    utils.removeEmptyProperty(query);
    var aid=session.user.account;
    var query={_id:data._id};
    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION).findOne(query,function (err,row){
        if (!err) {
            result.user = row;
            if(row){
                mongo.db().collection(fields.DB_APP_IM_CUSTOMER_RELATION).findOne({sid: data.sid, account:aid,status: {$ne: 'delete'}}, function(err, relationDoc){
                    if(err){
                        result.row = null;
                        result.success = true;
                        callback(result);
                    }else{
                        if(relationDoc && relationDoc.customerId){
                            var custId=relationDoc.customerId;
                            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).findOne({_id:custId}, function (err, custDb) {
                                if (!err) {
                                    if(custDb){
                                        custhandler.queryCustFields(custDb, session, function (rep) {
                                            if (rep.success) {
                                                custDb.fields = rep.data.fields;
                                                result.row = custDb;
                                                result.success = true;
                                                callback(result);
                                            } else {
                                                result.success = false;
                                                callback(result);
                                            }
                                        });
                                    }else{
                                        result.success = true;
                                        callback(result);
                                    }

                                } else {
                                    result.row = {};
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }else{
                            result.row = null;
                            result.success = true;
                            callback(result);
                        }
                    }


                });

            }else{
                //result.row = null;
                //result.success = true;
                logger.app.error("用户不存在！");
                callback(result);
            }
        }else{
            logger.app.error(err);
            callback(result);
        }
    });
}