var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var uuid = require('appUtil/UUID');
var solrHandler = require(__baseDir + '/dishui/common/SolrHandler');
var fields = require(__baseDir + '/dishui/common/Fields');
var thenjs =require("thenjs");
var appEvent = require("appEvent");
var notifyHandler = require(__baseDir + '/dishui/common/NotifyHandler');

var CustomerApprovalBusinessHandler = {

    queryCustomerApprovalBusiness :function (data,session,callback){
        var result = {success: false};
        var pageSize = data.limit;
        delete data['limit'];
        var page = data.page;
        var page = data.page;
        delete data['page'];
        pageSize = pageSize || 10;
        page = page || 1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = {};
        condition.account = session.account.account;
        if(data.owner){
            condition.owner = data.owner;
        }

        if(data.createUser){
            condition.createUser = data.createUser;
        }
        if(data.ownercom){
            condition.ownercom = data.ownercom;
        }
        if(data.ownerdep){
            condition.ownerdep = data.ownerdep;
        }
        if(data.ownercomCreateUser){
            condition.ownercomCreateUser = data.ownercomCreateUser;
        }
        if(data.ownerdepCreateUser){
            condition.ownerdepCreateUser = data.ownerdepCreateUser;
        }

        if(data.isAll){
            if(condition.owner || data.ownercom || data.ownerdep)
            utils.setUserLevelCondition(condition,'owner','custApproval',session);
            //如果是按id查询
            if(condition.owner && (!data.ownercom || !data.ownerdep )){
                if(typeof condition.owner != 'string'){
                    condition.owner["$in"].push("NA");
                }
            }
            if(condition.createUser || condition.ownercomCreateUser || condition.ownerdepCreateUser ){
                utils.setUserLevelCondition2Many(condition,'createUser','custApproval',session);
            }
        }else{
            if(condition.createUser || condition.ownercomCreateUser || condition.ownerdepCreateUser ){
                utils.setUserLevelCondition2Many(condition,'createUser','custApproval',session,true,"custApproval");
            }
        }

        if(data.status){
            condition.status = data.status;
        }
        if(data.beginTime && data.endTime){
            condition.createTime = {$gte:data.beginTime,$lte:data.endTime};
        }else if(data.endTime){
            condition.createTime = {$lte:data.endTime};
        }else if(data.beginTime){
            condition.createTime = {$gte:data.beginTime};
        }
        if(data.cname){
            var solrCondition = {
                name:data.cname
            };
            solrHandler.queryIndex2Cust(solrCondition,session,function(data){
                if(data.success){
                    //查出用户名
                    //先查出用户有哪些审核权限的模板id
                    var queryBusiness = {};
                    queryBusiness.account = session.account.account;
                    queryBusiness.role = {$in:session.user.role};
                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL).find(queryBusiness).toArray(function(err,docs){
                        if(!err){
                            docs=docs||[];
                            var types = [];
                            for(var i=0; i<docs.length;i++){
                                types.push(docs[i].type);
                            }
                            if(types.length == 0){
                                result.success = true;
                                result.list = [];
                                result.count = 0;
                                callback(result);
                            }else{
                                condition.apprType = {$in:types};
                                if(data.apprType){
                                    //判断是否有权限
                                    if(types.indexOf(data.apprType) == -1){
                                        result.success = true;
                                        result.list = [];
                                        result.count = 0;
                                        callback(result);
                                        return;
                                    }else{
                                        condition.apprType = data.apprType;
                                    }
                                }
                                condition.cid = {$in:data.ids};
                                mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).find(condition,{sort: {"createTime": -1}, limit: limit, skip: skip}).toArray(function(err, docs) {
                                    if (!err) {
                                        //查找客户是否已删除
                                        var ids = [];
                                        for (var i = 0; i < docs.length; i++) {
                                            ids.push(docs[i].cid);
                                        }
                                        ids = ids || [];

                                        mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find({_id: {$in: ids}}, {fields: {"_id":1,"name": 1}}).toArray(function (err, customers) {
                                            if (!err) {
                                                customers = customers || [];
                                                CustomerApprovalBusinessHandler.processCustomerCname(docs, customers);
                                                mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).count(condition, function (err, count) {
                                                    if(!err){
                                                        //给cname赋值
                                                        for (var i = 0; i < customers.length; i++) {
                                                            for (var j = 0; j < docs.length; j++) {
                                                                if(customers[i]._id == docs[i].cid){
                                                                    docs[i].cname = customers[i].name;
                                                                }
                                                            }
                                                        }
                                                        result.list = docs;
                                                        result.success = true;
                                                        result.count = count;
                                                        callback(result);
                                                    }else{
                                                        logger.app.error('db queryCustApprovalList error:' + err.stack);
                                                        result.message = "queryCustApprovalList error";
                                                        callback(result)
                                                    }
                                                });
                                            }else{
                                                logger.app.error('db queryCustApprovalList error:' + err.stack);
                                                result.message = "queryCustApprovalList error";
                                                callback(result)
                                            }

                                        });
                                    } else {
                                        logger.app.error('db queryCustApprovalList error:' + err.stack);
                                        result.message = "queryCustApprovalList error";
                                        callback(result)
                                    }
                                });
                            }
                        }else{
                            logger.app.error(err);
                            callback(result);
                        }
                    });
                }else{
                    logger.app.error("query solr index error");
                    callback({success: false, list: [], count: 0});
                }
            });
        }else{
            //先查出用户有哪些审核权限的模板id
            var queryBusiness = {};
            queryBusiness.account = session.account.account;
            queryBusiness.role = {$in:session.user.role};
            mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL).find(queryBusiness).toArray(function(err,docs){
                if(!err){
                    docs=docs||[];
                    var types = [];
                    for(var i=0; i<docs.length;i++){
                        types.push(docs[i].type);
                    }
                    if(types.length == 0){
                        result.success = true;
                        result.list = [];
                        result.count = 0;
                        callback(result);
                    }else{
                        condition.apprType = {$in:types};
                        if(data.apprType){
                            //判断是否有权限
                            if(types.indexOf(data.apprType) == -1){
                                result.success = true;
                                result.list = [];
                                result.count = 0;
                                callback(result);
                                return;
                            }else{
                                condition.apprType = data.apprType;
                            }
                        }
                        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).find(condition,{sort: {"createTime": -1}, limit: limit, skip: skip}).toArray(function(err, docs) {
                            if (!err) {
                                //查找客户是否已删除
                                var ids = [];
                                for (var i = 0; i < docs.length; i++) {
                                    ids.push(docs[i].cid);
                                }
                                ids = ids || [];

                                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find({_id: {$in: ids}}, {fields: {"_id":1,"name": 1}}).toArray(function (err, customers) {
                                    if (!err) {
                                        customers = customers || [];
                                        CustomerApprovalBusinessHandler.processCustomerCname(docs, customers);
                                        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).count(condition, function (err, count) {
                                            if(!err){
                                                //给cname赋值
                                                for (var i = 0; i < customers.length; i++) {
                                                    for (var j = 0; j < docs.length; j++) {
                                                        if(customers[i]._id == docs[i].cid){
                                                            docs[i].cname = customers[i].name;
                                                        }
                                                    }
                                                }
                                                result.list = docs;
                                                result.success = true;
                                                result.count = count;
                                                callback(result);
                                            }else{
                                                logger.app.error('db queryCustApprovalList error:' + err.stack);
                                                result.message = "queryCustApprovalList error";
                                                callback(result)
                                            }
                                        });
                                    }else{
                                        logger.app.error('db queryCustApprovalList error:' + err.stack);
                                        result.message = "queryCustApprovalList error";
                                        callback(result)
                                    }

                                });
                            } else {
                                logger.app.error('db queryCustApprovalList error:' + err.stack);
                                result.message = "queryCustApprovalList error";
                                callback(result)
                            }
                        });
                    }
                }else{
                    logger.app.error(err);
                    callback(result);
                }
            });
        }

    },
    emitUpdateSysStatusEvent:function(type,data,session){
        var _p = {};
        _p.tType = "updateSysStatus";
        _p._id = data.cid;
        _p.accountId = session.account.account;
        _p.uid = session.user._id;
        _p.oldCategoryId = data.categoryId;
        _p.oldOwner = data.sourceOwner;
        _p.status = data.oldStatus;
        _p.oldStatus = data.oldStatus;
        _p.categoryId = data.categoryId;
        _p.owner = data.sourceOwner;
        var sysStatus = "";
        if(type == "examine"){
            if(data.apprType == "2") sysStatus = "5";
            if(data.apprType == "3") sysStatus = "6";
            if(data.apprType == "4") sysStatus = "7";
            if(data.apprType == "8") sysStatus = "9";
        }else if(type == "complete"){
            sysStatus = data.apprType;
            if(sysStatus=="2"||sysStatus=="4"){
                _p.categoryId = data.poolId;
                _p.owner = data.poolId;
                delete data['poolId'];

            }
        }else if(type == "not"){
            if(data.apprType=="2"||data.apprType=="4"){
                sysStatus = "0";
                _p.owner= data.categoryId;
            }else if(data.apprType=="3"){
                sysStatus = "10";
            }else if(data.apprType=="8"){
                sysStatus = "11";
            }
        }

        _p.sysStatus = sysStatus;
        if(_p.sysStatus=="6"||_p.sysStatus=="9"||_p.sysStatus=="3"||_p.sysStatus=="8"){
            _p.money = parseFloat(data.money).toFixed(2);
        }
        var codeName = "";
        mongo.db().collection(fields.DB_TBL_GENERAL_CODES).findOne({code_type:"sys_status",code_value:_p.sysStatus},function(err,dic){
            if(!err&&dic){
                codeName = dic.code_name;
                _p.content = "跟进状态变更为【"+codeName+"】";
                appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_CONTACT_STATUS, _p);
            }
        });
    },
    addCustApprovalBusiness :function (data,session,callback) {
        var result = {success: false};

        //先查询客户是否存在
        mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).findOne({_id:data.cid},function(err,custDoc){
            if(!err){
                if(custDoc){
                    var insertData = {};
                    insertData._id = uuid.generateUuid();
                    insertData.cid = data.cid;
                    insertData.cname = data.cname;
                    insertData.apprType = data.apprType;
                    insertData.category = data.category;
                    insertData.categoryId = data.categoryId;
                    insertData.owner = "NA";
                    insertData.sysStatus = data.sysStatus;
                    insertData.status = "0";
                    insertData.oldStatus = data.status;
                    insertData.reason = data.reason;
                    insertData.sourceOwner = data.sourceOwner;
                    insertData.competitors = data.competitors;
                    insertData.memo = data.memo;
                    insertData.user = session.user._id;
                    insertData.money = parseFloat(data.money).toFixed(2);
                    insertData.account = session.account.account;
                    insertData.createUser = session.user._id;
                    insertData.createTime = utils.getCurrentDate();
                    insertData.lastUpdater = session.user._id;
                    insertData.lastTime = utils.getCurrentDate();
                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).insert(insertData,function(err) {
                        if (!err) {
                            var sysStatus = "";
                            if(data.apprType == "2") sysStatus = "5";
                            if(data.apprType == "3") sysStatus = "6";
                            if(data.apprType == "4") sysStatus = "7";
                            if(data.apprType == "8") sysStatus = "9";
                            var setCustData = {
                                lastUpdateTime:utils.getCurrentDate(),
                                sysStatus:sysStatus,
                                lastUpdater:session.user._id

                            };
                            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update({_id:data.cid},{$set:setCustData},function(err){
                                if(!err){
                                    //如果有竞争对手,添加到客户模板内
                                    if(data.competitors){
                                        var competitors = {};
                                        competitors.key = utils.UUID.generateUuid();
                                        competitors.name = data.competitors;
                                        mongo.db().collection('customer_template').update({"_id":data.custTmplsId,"competitors.name":{"$ne":competitors.name}}, {"$push":{"competitors":competitors}}, function(err){
                                            if(!err) {
                                                result.success = true;
                                                CustomerApprovalBusinessHandler.emitUpdateSysStatusEvent("examine",data,session);
                                                callback(result);
                                            } else {
                                                logger.app.error('db update customer template competitors error:' + err.stack);
                                                result.message = "db update customer template competitors error";
                                                callback(result)
                                            }
                                        });
                                    }else{
                                        result.success = true;
                                        CustomerApprovalBusinessHandler.emitUpdateSysStatusEvent("examine",data,session);
                                        callback(result);
                                    }

                                }else{
                                    logger.app.error('db addCustApprovalBusiness error:' + err.stack);
                                    result.message = "addCustApprovalBusiness error";
                                    callback(result)
                                }
                            });
                        } else {
                            logger.app.error('addCustApprovalBusiness error:' + err.stack);
                            result.message = "addCustApprovalBusiness error";
                            callback(result)
                        }
                    });
                }else{
                    result.message = "提交审核失败,当前客户已被删除!";
                    callback(result)
                }
            }else{
                logger.app.error('db findCust error:' + err.stack);
                callback(result)
            }
        });
    },
    customerSysStatusApproval : function (data,session,callback) {

    },
    updateCustApprovalBusiness : function (data,session,callback) {
        var result = {success: false};
        //先查询是否已被领取
        var query = {"_id":data._id};
        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).findOne(query,function(err,apprBusiness){
            if(!err){
                if(apprBusiness.owner != "NA"){
                    result.message = "该工单已经被其他座席领取";
                    callback(result);
                }else{
                    //判断客户是否被删除
                    var custQuery = {"_id":data.cid};
                    mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).findOne(custQuery,function (err,custDoc){
                        if(!err){
                            delete data._id;
                            var setData = {$set:data}
                            if(!custDoc){
                                setData = {$set:{"owner":"DELETE","status":"3"}} //如果没查找到客户就修改客户为删除状态
                                mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).update(query,setData,function(err) {
                                    if (!err) {
                                        result.message = "该客户已被删除,提审信息可以在全部中查看";
                                        callback(result);
                                    } else {
                                        logger.app.error('db updateCustApprovalBusiness error:' + err.stack);
                                        result.message = "updateCustApprovalBusiness error";
                                        callback(result)
                                    }
                                });
                            }else{
                                mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).update(query,setData,function(err) {
                                    if (!err) {
                                        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).findOne(query,function(err, doc) {
                                            if (!err) {
                                                result.success = true;
                                                result.custApprovalBusiness = doc;
                                                callback(result);
                                            } else {
                                                logger.app.error('db updateCustApprovalBusiness error:' + err.stack);
                                                result.message = "updateCustApprovalBusiness error";
                                                callback(result)
                                            }
                                        });
                                    } else {
                                        logger.app.error('db updateCustApprovalBusiness error:' + err.stack);
                                        result.message = "updateCustApprovalBusiness error";
                                        callback(result)
                                    }
                                });
                            }
                        }else{
                            logger.app.error('db findCust error:' + err.stack);
                            result.message = "findCust error";
                            callback(result)
                        }
                    });
                }
            }else{
                logger.app.error('db updateCustApprovalBusiness error:' + err.stack);
                result.message = "updateCustApprovalBusiness error";
                callback(result)
            }
        });

    },
    getCustApprovalBusinessById : function (data,session,callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).findOne({"_id":data},function(err, doc) {
            if (!err) {
                result.success = true;
                result.custApprovalBusiness = doc;
                callback(result);
            } else {
                logger.app.error('db getCustApprovalById error:' + err.stack);
                result.message = "getCustApprovalById error";
                callback(result)
            }
        });
    },
    passedBusiness : function (data,session,callback) {
        var result = {success: false};
        //先查询客户是否存在
        mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).findOne({"_id":data.cid},function(err,custDoc){
            if(!err){
                if(!custDoc){
                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).updateOne({"_id":data._id},{$set:{"owner":"DELETE","status":"3"}},function(err) {
                        if(!err){
                            result.success = false;
                            result.message = "该客户已被删除,提审信息可以在全部中查询";
                            callback(result);
                        }  else{
                            logger.app.error('db updateApprovalBusiness error:' + err.stack);
                            callback(result)
                        }
                    })
                }else{
                    //先判断是否别的座席已经提交
                    var query = {"_id":data._id,"status":{$in:["1","2"]}};
                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).findOne(query,function(err,apprBusiness){
                        if(!err){
                            if(apprBusiness){
                                result.success = false;
                                result.message = "该工单已经被其他座席处理";
                                callback(result);
                            }else{
                                var now = utils.DateTime.getCurrentDateTime();
                                //公海或商机客户需要查出categoryId
                                // 2无效  3成单  4 丢单  8续费
                                if(data.apprType != "3" && data.apprType != "8"){
                                    var poolQuery = {"account":session.account.account};
                                    if(data.apprType == "2"){
                                        poolQuery.category = "1";
                                    }else if(data.apprType == "4"){
                                        poolQuery.category = "2";
                                    }
                                    mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne(poolQuery,function(err,doc){
                                        var pool = doc;
                                        var setData = {
                                            lastTime:now,
                                            status:"1",
                                            owner:session.user._id,
                                            lastUpdater:session.user._id
                                        };
                                        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).updateOne({"_id":data._id},{$set:setData},function(err) {
                                            if (!err) {
                                                var setCustData = {
                                                    lastUpdateTime:now,
                                                    sysStatus:data.apprType,
                                                    categoryId:pool._id,
                                                    owner:pool._id,
                                                    lastUpdater:session.user._id

                                                };
                                                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update({_id:data.cid},{$set:setCustData},function(err){
                                                    if(!err){
                                                        data.poolId = pool._id;
                                                        CustomerApprovalBusinessHandler.emitUpdateSysStatusEvent("complete",data,session);
                                                        //插入联系历史
                                                        var _his={
                                                            _id:utils.UUID.generateUuid(),
                                                            type:'approval',
                                                            customer:data.cid,
                                                            createTime:now,
                                                            apprId:data._id,
                                                            apprType : data.apprType,
                                                            agent:session.user._id,
                                                            status:"pass",
                                                            lastUpdateTime:now,
                                                            comments:""
                                                        }
                                                        mongo.db(session).collection(session.account.account + "_history").insert(_his,function(err){
                                                            if(!err){
                                                                result.success = true;
                                                                callback(result);
                                                            }else{
                                                                logger.app.error('db insert history error:' + err.stack);
                                                                result.message = "insert history  error";
                                                                callback(result)
                                                            }
                                                        });

                                                        //var notifyInfo={
                                                        //    _id:data.sourceOwner,
                                                        //    cid:data.cid,
                                                        //    type:data.apprType,
                                                        //    deal:"1",
                                                        //    memo:""
                                                        //}
                                                        //notifyHandler.auditNotify(notifyInfo,function(rep){
                                                        //    if(!rep.success){
                                                        //    }
                                                        //})

                                                        //插入到通知表
                                                        var notifyInfo = {
                                                            _id:utils.UUID.generateUuid(),
                                                            sourceOwner:data.sourceOwner,
                                                            type:"approvalBusiness",
                                                            cid:data.cid,
                                                            apprType:data.apprType,
                                                            deal:"1",
                                                            apprBusId:data._id
                                                        }
                                                        mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
                                                            if(err){
                                                                logger.app.error('db insert app_notify error:' + err.stack);
                                                            }
                                                        });

                                                    }else{
                                                        logger.app.error('db passedBusiness error:' + err.stack);
                                                        result.message = "passedBusiness error";
                                                        callback(result)
                                                    }
                                                });
                                            } else {
                                                logger.app.error('db passedBusiness error:' + err.stack);
                                                result.message = "passedBusiness error";
                                                callback(result)
                                            }
                                        });
                                    });

                                }else{
                                    var setData = {
                                        lastTime:now,
                                        status:"1",
                                        owner:session.user._id,
                                        lastUpdater:session.user._id
                                    };
                                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).updateOne({"_id":data._id},{$set:setData},function(err) {
                                        if (!err) {
                                            var setCustData = {
                                                lastUpdateTime:now,
                                                sysStatus:"3",
                                                lastUpdater:session.user._id

                                            };
                                            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update({_id:data.cid},{$set:setCustData},function(err){
                                                if(!err){
                                                    CustomerApprovalBusinessHandler.emitUpdateSysStatusEvent("complete",data,session);
                                                    //插入联系历史
                                                    var _his={
                                                        _id:utils.UUID.generateUuid(),
                                                        type:'approval',
                                                        customer:data.cid,
                                                        apprId:data._id,
                                                        createTime:now,
                                                        agent:session.user._id,
                                                        status:"pass",
                                                        apprType : data.apprType,
                                                        lastUpdateTime:now,
                                                        comments:""
                                                    }
                                                    mongo.db(session).collection(session.account.account + "_history").insert(_his,function(err){
                                                        if(!err){
                                                            result.success = true;
                                                            callback(result);
                                                        }else{
                                                            logger.app.error('db insert history error:' + err.stack);
                                                            result.message = "insert history  error";
                                                            callback(result)
                                                        }
                                                    });

                                                }else{
                                                    logger.app.error('db passedBusiness error:' + err.stack);
                                                    result.message = "passedBusiness error";
                                                    callback(result)
                                                }
                                            });
                                        } else {
                                            logger.app.error('db passedBusiness error:' + err.stack);
                                            result.message = "passedBusiness error";
                                            callback(result)
                                        }
                                    });
                                }

                            }
                        }else{
                            logger.app.error('db passedBusiness error:' + err.stack);
                            callback(result)
                        }
                    })
                }
            }else{
                logger.app.error('db findCust error:' + err.stack);
                callback(result)
            }
        });
    },
    showApprBusDetail : function (data,session,callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).findOne({"_id":data.apprId},function(err, business) {
            if (!err) {
                result.custApprovalBusiness = business;
                mongo.db(session).collection(session.account.account + "_history").findOne({"_id":data.historyId},function(err, history) {
                    if (!err) {
                        result.success = true;
                        result.history = history;
                        callback(result)
                    } else {
                        logger.app.error('db showApprBusDetail error:' + err.stack);
                        result.message = "showApprBusDetail error";
                        callback(result)
                    }
                });
            } else {
                logger.app.error('db showApprBusDetail error:' + err.stack);
                result.message = "showApprBusDetail error";
                callback(result)
            }
        });
    },
    unPassedBusiness : function (data,session,callback) {
        var result = {success: false};

        mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).findOne({"_id":data.cid},function(err,custDoc){
            if(!err){
                if(!custDoc){
                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).updateOne({"_id":data._id},{$set:{"owner":"DELETE","status":"3"}},function(err) {
                        if(!err){
                            result.success = false;
                            result.message = "该客户已被删除,提审信息可以在全部中查询";
                            callback(result);
                        }  else{
                            logger.app.error('db updateApprovalBusiness error:' + err.stack);
                            callback(result)
                        }
                    })
                }else{
                    //先判断是否被其他座席处理
                    var query = {"_id":data._id,"status":{$in:["1","2"]}};
                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).findOne(query,function(err,apprBusiness){
                        if(!err){
                            if(apprBusiness){
                                result.success = false;
                                result.message = "该工单已经被其他座席处理";
                                callback(result);
                            }else{
                                var now = utils.DateTime.getCurrentDateTime();
                                //审批不通过,恢复到客户原有系统状态
                                var setData = {
                                    lastTime:now,
                                    status:"2",
                                    owner:session.user._id,
                                    unPassReason:data.unPassReason,
                                    lastUpdater:session.user._id
                                };
                                mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).updateOne({"_id":data._id},{$set:setData},function(err) {
                                    if (!err) {
                                        var setCustData = {};
                                        if(data.apprType=="2"||data.apprType=="4"){
                                            var categoryId = data.categoryId;
                                            setCustData = {
                                                lastUpdateTime:now,
                                                sysStatus:"0",
                                                owner:categoryId,
                                                lastUpdater:session.user._id
                                            }
                                        }else if(data.apprType=="8"){
                                            setCustData = {
                                                lastUpdateTime:now,
                                                sysStatus:"11",
                                                lastUpdater:session.user._id
                                            };
                                        }else if(data.apprType=="3"){
                                            setCustData = {
                                                lastUpdateTime:now,
                                                sysStatus:"10",
                                                lastUpdater:session.user._id
                                            };
                                        }
                                        mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).update({_id:data.cid},{$set:setCustData},function(err){
                                            if(!err){
                                                CustomerApprovalBusinessHandler.emitUpdateSysStatusEvent("not",data,session);
                                                //插入联系历史
                                                var _his={
                                                    _id:utils.UUID.generateUuid(),
                                                    type:'approval',
                                                    customer:data.cid,
                                                    createTime:now,
                                                    agent:session.user._id,
                                                    apprId:data._id,
                                                    apprType : data.apprType,
                                                    status:"unPass",
                                                    lastUpdateTime:now,
                                                    comments:"[审核不通原因]"+data.unPassReason
                                                }
                                                mongo.db(session).collection(session.account.account + "_history").insert(_his,function(err){
                                                    if(!err){
                                                        result.success = true;
                                                        callback(result);
                                                    }else{
                                                        logger.app.error('db insert history error:' + err.stack);
                                                        result.message = "insert history  error";
                                                        callback(result)
                                                    }
                                                });

                                                if(data.apprType=='2'||data.apprType=='4'){
                                                    //var notifyInfo={
                                                    //    _id:data.sourceOwner,
                                                    //    cid:data.cid,
                                                    //    type:data.apprType,
                                                    //    deal:"2",
                                                    //    memo:data.unPassReason
                                                    //}
                                                    //notifyHandler.auditNotify(notifyInfo,function(rep){
                                                    //    if(!rep.success){
                                                    //    }
                                                    //})
                                                    //插入到通知表
                                                    var notifyInfo = {
                                                        sourceOwner:data.sourceOwner,
                                                        cid:data.cid,
                                                        type:"approvalBusiness",
                                                        apprType:data.apprType,
                                                        deal:"2",
                                                        apprBusId:data._id
                                                    }
                                                    mongo.db().collection(fields.DB_APP_NOTIFY).insert(notifyInfo,function(err){
                                                        if(err){
                                                            logger.app.error('db insert app_notify error:' + err.stack);
                                                        }
                                                    });

                                                }
                                            }else{
                                                logger.app.error('db unPassedBusiness error:' + err.stack);
                                                result.message = "unPassedBusiness error";
                                                callback(result)
                                            }
                                        });
                                    } else {
                                        logger.app.error('db unPassedBusiness error:' + err.stack);
                                        result.message = "unPassedBusiness error";
                                        callback(result)
                                    }
                                });
                            }
                        }else{
                            logger.app.error('db unPassedBusiness error:' + err.stack);
                            callback(result)
                        }
                    })
                }
            }else{
                logger.app.error('db findCust error:' + err.stack);
                callback(result)
            }
        });

    },
    refreshUndealNum : function (data,session,callback) {
        var result = {success: false};
        var queryBusiness = {};
        queryBusiness.account = session.account.account;
        queryBusiness.role = {$in:session.user.role||[]};
        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL).find(queryBusiness).toArray(function(err,docs){
            if(!err){
                docs=docs||[];
                var types = [];
                for(var i=0; i<docs.length;i++){
                    types.push(docs[i].type);
                }
                if(types.length == 0){
                    result.success = true;
                    result.list = [];
                    result.count = 0;
                    callback(result);
                }else{
                    var condition = {"account":session.account.account};
                    condition.owner = "NA";
                    condition.apprType = {$in:types};
                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).count(condition, function (err,unReadCount) {
                        if(!err){
                            result.unReadCount = unReadCount;
                            condition.status = "0";
                            condition.owner = session.user._id;
                            mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).count(condition, function (err, myCount) {
                                if(!err){
                                    result.myCount = myCount;
                                    condition.status = "0";
                                    mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).count(condition, function (err, unApproval) {
                                        if(!err){
                                            result.unApproval = unApproval;
                                            result.success = true;
                                            callback(result);
                                        }else{
                                            logger.app.error('db refreshUndealNumerror:' + err.stack);
                                            result.message = "refreshUndealNum  error";
                                            callback(result)
                                        }
                                    });
                                }else{
                                    logger.app.error('db refreshUndealNumerror:' + err.stack);
                                    result.message = "refreshUndealNum  error";
                                    callback(result)
                                }
                            });
                        }else{
                            logger.app.error('db refreshUndealNumerror:' + err.stack);
                            result.message = "refreshUndealNum  error";
                            callback(result)
                        }
                    });
                }
            }else{
                logger.app.error(err);
                callback(result);
            }
        });
    },
    processCustomerCname: function (data, customers) {
        for (var i = 0; i < data.length; i++) {
            var findFlag = false // 客户未删除标记,默认删除
            var dataItem = data[i];
            if(customers.length == 0){
                dataItem.cname = "";
            }else {
                for (var j = 0; j < customers.length; j++) {
                    var customer = customers[j];
                    if (dataItem.cid == customer._id) {
                        //查找到客户
                        findFlag = true;
                        break;
                    }
                }
                if(!findFlag){
                    dataItem.cname = "";
                }
            }
        }
    }

};
module.exports = CustomerApprovalBusinessHandler;