/**
 * Created by wangmeng on 2016/4/18.
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var appEvent = require("appEvent");
var custCommonHandler = {
    initCommonPool:function(data,callback){
      var result = {success:false};
        var account = data.account;
        var query = {category:{"$in":["0","1","2"]},account:account};
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find(query).toArray(function(err,commonList){
            if(!err){
                if(commonList.length == 0){
                        var insertData = {};
                    insertData._id = utils.UUID.generateUuid();
                    insertData.createTime = utils.getCurrentDate();
                    insertData.account = account;
                    insertData.managers = [];
                    insertData.recycle = {};
                    insertData.ruleNum = "50";
                    insertData.category = "0";
                    insertData.cName = "默认公海";
                         mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account:account},{fields:{displayName:1}}).toArray(function (err, uList) {
                        if (!err) {
                            uList=uList||[];
                            var ary = [];
                            for (var i = 0; i < uList.length; i++) {
                                ary.push(uList[i]._id);
                            }
                            insertData.members = ary;
                            mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).insert(insertData,{w:1},function(err){
                                if(!err){
                                    insertData._id = utils.UUID.generateUuid();
                                    insertData.createTime = utils.getCurrentDate();
                                    insertData.members = [];
                                    insertData.category = "1";
                                    insertData.cName = "无效商机公海";
                                    mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).insert(insertData,{w:1},function(err){
                                        if(!err){
                                            insertData._id = utils.UUID.generateUuid();
                                            insertData.createTime = utils.getCurrentDate();
                                            insertData.category = "2";
                                            insertData.cName = "丢单商机公海";
                                            mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).insert(insertData,{w:1},function(err){
                                                if(!err){
                                                    result.success = true;
                                                    callback(result);
                                                }else{
                                                    logger.app.error('initCustomerCommon error:' + err);
                                                    callback(result);
                                                }
                                            })
                                        }else{
                                            logger.app.error('initCustomerCommon error:' + err);
                                            callback(result);
                                        }
                                    })
                                }else{
                                    logger.app.error('initCustomerCommon error:' + err);
                                    callback(result);
                                }
                            })
                        }else{
                            logger.app.error('initCustomerCommon error:' + err);
                            callback(result);
                        }
                    });
                }else{
                    result.message = '系统公海已经存在，请确认后再进行添加!';
                    callback(result);
                }
            }else{
                logger.app.error('initCustomerCommon error:' + err);
                callback(result);
            }
        })
    },
    saveCustomerCommon:function(data,session,callback){
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.getCurrentDate();
        data.account = session.user.account;
        data.createUser = session.user._id;
        var query = {account:data.account,cName:data.cName};
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne(query,function(err,oneNum){
            if(!err&&!oneNum){
                mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).insert(data,{w:1},function(err){
                    if(!err){
                        result.success = true;
                        result.data = data;
                        callback(result);
                    }
                });
            }else{
                result.message = '公海名称已存在，请重新输入!';
                callback(result);
            }
        });
    },
    UpCustomerCommon:function(data,session,callback){
        var result = {success: false};
        var commonId = data.commonId;
        delete data['commonId'];
        var query = {_id:commonId};
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne(query,function(err,oneNum){
            if(!err){
                if(oneNum){
                    mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).update(query,{$set:data},{multi: true},function(err){
                        if(!err){
                            result.success = true;
                            data._id = commonId;
                            result.data = data;
                            callback(result);
                        }
                    })
                }else{
                    result.code = "1001";
                    result.message = "customerPool is not find";
                    callback(result);
                }
            }else{
                logger.app.error('UpCustomerCommon error:' + err);
                callback(result);
            }
        });
    },
    queryCustomerCommonInfo:function(data,session,callback){
        var result = {success:false};
        var commonId = data.commonId;
        delete data['commonId'];
        var page = data.page|| 1;
        delete data['page'];
        var limit = data.limit || 10;
        delete data['limit'];
        var skip = (page - 1) * limit;
        var condition = data;
        condition.categoryId = commonId;
        if (condition.name){
            condition.name = new RegExp(condition.name);
        }
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne({_id:commonId},function(err,common){
            if(!err){
                result.common = common;
                mongo.db(session).collection(session.account.account+fields.DB_C5_CUSTOMER).find(condition,{sort:{createTime:1}, limit: limit, skip: skip}).toArray(function(err,docs){
                    if(!err){
                        var list = docs ||[];
                        mongo.db(session).collection(session.account.account+fields.DB_C5_CUSTOMER).count(condition,function(err,count){
                            if(!err){
                                result.count = count;
                                result.list = list;
                                result.success = true;
                                callback(result);
                            }
                        })
                    }else{
                        logger.app.error('queryCustomerCommonInfo error:' + err);
                        callback(result);
                    }
                });
            }
        });
    },

    queryCommon:function(data,session,callback){
        var result = {success:false};
        var page = data.page|| 1;
        delete data['page'];
        var limit = data.limit || 10;
        delete data['limit'];
        var skip = (page - 1) * limit;

        var query = {"account":session.user.account};
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find(query,{sort: {category:1,createTime: 1}, limit: limit, skip: skip}).toArray(function(err,mares){
            if(!err){
                var list = mares || [];
                mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).count(query, function (err, count) {
                    if(!err){
                        result.count = count;
                        result.list = list;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error('queryCommon error:' + err);
                        callback(result);
                    }
                });
            }else{
                logger.app.error('queryCommon error:' + err);
                callback(result) ;
            }
        });
    },
    queryCommonById:function(data,session,callback){
        var result = {success:false};
        var cId = data;
        var query = {_id:cId};
        mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne(query,function(err,common){
            if(!err){
                result.common = common;
                result.success = true;
                callback(result);
            }else{
                logger.app.error('queryCommonById error:' + err);
                callback(result);
            }
        });
    },
    queryImportDetail:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        utils.removeEmptyProperty(data);
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).count(data,function(err,count){
            if(!err){
                mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(data,{sort:{createTime:-1},limit: limit, skip: skip}).toArray(function (err, batches) {
                    if(!err){
                        result.success = true;
                        result.list = batches;
                        result.count = count;
                        callback(result);
                    }else{
                        logger.app.error('db queryImportDetail error:' + err.stack);
                        callback({success: false, list: [], count: 0});
                    }
                });
            }else{
                logger.app.error('db queryImportDetail error:' + err.stack);
                callback({success: false, list: [], count: 0});
            }
        });
    },


    batchTransferCustomerCommon:function(data,session,callback){
        var total=data.total;
        var commonId=data.commonId;
        var query=data.query;
        var result = {success:false};
        var uid = session.user._id;
        var account=session.user.account;
        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query, {sort:{createTime:-1}}).toArray(function (err, docs) {
            if (!err) {
                if(total==docs.length){
                    var time=utils.getCurrentDate();
                    var uid=session.user._id;
                    var updateSet={
                        lastUpdateTime:time,
                        lastUpdater:uid,
                        categoryId:commonId,
                        owner:commonId,
                        sysStatus:"0"
                    }
                    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update(query,{$set:updateSet},{multi: true},function(err2){
                        if(!err2){
                            result.success=true;
                            mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find({account:account,managers:uid},{sort: {category: 1},fields:{cName:1}}).toArray(function(err,poolList){
                                if(!err&&poolList){
                                    var poolMap={};
                                    var poolId = "NA";
                                    poolList.forEach(function(obj){
                                        poolMap[obj._id]=obj.cName;
                                        if(obj._id == data.categoryId){
                                            poolId = obj._id;
                                        }
                                    })

                                    var notifyMap = {};

                                    for(var i = 0;i<docs.length;i++){
                                        var _p = {};
                                        var doc = docs[i];
                                        _p.oldCategoryId = doc.categoryId;
                                        _p.categoryId = commonId;
                                        _p._id = doc._id;
                                        _p.accountId = account;
                                        _p.tType ="transferPool";
                                        _p.uid=uid;
                                        _p.owner = doc.owner;

                                        generateNotifyMap(doc,notifyMap,poolId);

                                        if(_p.oldCategoryId!=_p.categoryId){
                                            var oldPName = poolMap[_p.oldCategoryId];
                                            var pName = poolMap[_p.categoryId];
                                            _p.content = "客户从【"+oldPName+"】转移到【"+pName+"】";
                                            appEvent.emitCustomerReportEvent(appEvent.EventType.CUST_UPDATE_CATEGORY, _p);
                                        }
                                    }
                                    if(!isEmpty(notifyMap)){
                                        var bulkWrite =[];
                                        for(var item in notifyMap){
                                            var notify = notifyMap[item];
                                            var notifyInfo = {
                                                _id:utils.UUID.generateUuid(),
                                                cid:uid,
                                                poolId:poolId,
                                                uid:item,
                                                custCount:notify.custIds.length,
                                                type:"batchUpdateOwner"
                                            }
                                            var query = { insertOne : notifyInfo};
                                            bulkWrite.push(query);
                                        }
                                        mongo.db().collection(fields.DB_APP_NOTIFY).bulkWrite(bulkWrite,function(err) {
                                            if (err)  {
                                                logger.app.error('db initDept error:' + err.stack);
                                            }
                                        });
                                    }
                                }
                            });

                            callback(result);
                        } else {
                            logger.app.error('batchTransferCustomerCommon error:' + err2.stack);
                            result.message = 'batchTransferCustomerCommon error!';
                            callback(result);
                        }
                    });
                }else{
                    logger.app.error('batchTransferCustomerCommon data is change');
                    result.code = '1001';
                    callback(result);
                }
            }else{
                logger.app.error('batchTransferCustomerCommon error:' + err.stack);
                result.message = 'batchTransferCustomerCommon error!';
                callback(result);
            }
        });
    },
    queryCustomerCommonCustomer : function(data,session,callback){
    var result = {success:false};
    var commonId = data;
    var account = session.user.account;
    var query = {categoryId:commonId};
    mongo.db(session).collection(account+fields.DB_C5_CUSTOMER).count(query,function(err,count){
        if(!err){
            result.success = true;
            result.count = count;
            callback(result);
        }else{
            logger.app.error('queryCustomerCommonCustomer error:'+err);
            callback(result);
        }
    })
    },
    deleteCustomerCommon : function(data,session,callback){
    var result = {success:false};
    var query = {_id:data.commonId};
    mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).findOne(query,function(err,saleChance){
        if(!err&&saleChance){
            mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).remove(query,function(err){
                if(!err){
                    result.success  = true;
                    callback(result);
                }else{
                    logger.app.error('deleteSaleChance error:' + err);
                    callback(result);
                }
            });
        }else{
            logger.app.error('deleteSaleChance error:' + err);
            callback(result);
        }
    });
}
};


var generateNotifyMap = function(customer,notifyMap,poolId){
    if(customer.owner != "NA" ){
        if(!notifyMap[customer.owner]){
            notifyMap[customer.owner] = {"cid":customer.owner,"poolId":poolId,"custIds":[customer._id]};
        }else{
            notifyMap[customer.owner].custIds.push(customer._id);
        }
    }
}
var isEmpty = function (obj) {
    for (var name in obj)
    {
        return false;
    }
    return true;
};

module.exports = custCommonHandler;