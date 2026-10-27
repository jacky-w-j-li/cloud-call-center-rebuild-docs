/**
 * Created by wangmeng on 2016/4/18.
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var appEvent = require("appEvent");
var thenjs =require("thenjs");
var custCommonHandler = {
    //初始化公海剩余客户
    initCustomerCommonLeave:function(data,callback){
        var account = data.account;
        var result = {success: false};
        if(account){
            mongo.db("bill").collection("platform_account_product").findOne({_id: account + "_cc"}, function (err, doc) {
               if(!err){
                   if(doc){
                       var dbName = doc.dataDB;
                       mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).distinct("_id",{"account": account}, function (err, poolList) {
                           if(!err){
                               if(poolList){
                                   var poolAry = [];
                                   for (var j = 0; j < poolList.length; j++) {
                                       var poolId = poolList[j];
                                       poolAry.push(poolId);
                                   }
                                       mongo.db(dbName).collection(account + fields.DB_C5_CUSTOMER).find({"categoryId": {"$in":poolAry}}, {
                                           sort: {createTime: -1},
                                           fields: {owner: 1, categoryId: 1}
                                       }).toArray(function (err, docs) {
                                           if (!err) {
                                               if (docs) {
                                                   //插入数据到公海统计表
                                                   var currentDateArray = utils.DateTime.getFormatDateStr(new Date()).split("-");
                                                   var year = currentDateArray[0];
                                                   var month = currentDateArray[0] + currentDateArray[1];
                                                   var day = currentDateArray[0] + currentDateArray[1] + currentDateArray[2];
                                                   var reportQuery = {"account": account, "day": day};
                                                   var agentsMap = {};
                                                   var poolsMap = {};
                                                   //循环查找出每个座席对应的数据
                                                   for (var i = 0; i < docs.length; i++) {
                                                       var customer = docs[i];
                                                       var owner = customer.owner;
                                                       var categoryId = customer.categoryId;
                                                       var poolMapDoc = {"account":account,"year":year,"month":month,"day":day,"surplus":0,"assign":0}
                                                       if(owner==categoryId){
                                                           if (!poolsMap[categoryId]) {
                                                               poolMapDoc.surplus += 1;
                                                               poolsMap[categoryId] = poolMapDoc;
                                                           } else {
                                                               poolsMap[categoryId].surplus += 1;
                                                           }
                                                       }else{
                                                           if (!poolsMap[categoryId]) {
                                                               poolMapDoc.assign += 1;
                                                               poolsMap[categoryId] = poolMapDoc;
                                                           } else {
                                                               poolsMap[categoryId].assign += 1;
                                                           }
                                                           var agentMapDoc = {"account": account,"year": year,"month": month,"day": day,"assign":0};
                                                           var saleOwner = categoryId+"_"+owner;
                                                               if (!agentsMap[saleOwner]) {
                                                                   agentMapDoc.assign += 1;
                                                                   agentsMap[saleOwner] = agentMapDoc;
                                                               } else {
                                                                  agentsMap[saleOwner].assign += 1;
                                                               }
                                                       }

                                                   }
                                                   mongo.reportDb().collection(fields.CC_CUSTOMER_COMMON_REPORT).remove(reportQuery, {w: 1}, function (err) {
                                                       if (!err) {
                                                           var bulkWriteCommon = [];
                                                           for(var item in poolsMap){
                                                               var obj = poolsMap[item];
                                                               var insertData = {
                                                                   "account": obj.account,
                                                                   "categoryId": item,
                                                                   "day": obj.day,
                                                                   "month": obj.month,
                                                                   "year": obj.year,
                                                                   "assign": obj.assign,
                                                                   "surplus": obj.surplus
                                                               }
                                                               var query = {insertOne:insertData};
                                                               bulkWriteCommon.push(query);
                                                           }
                                                          if(bulkWriteCommon.length!=0){
                                                              mongo.reportDb().collection(fields.CC_CUSTOMER_COMMON_REPORT).bulkWrite(bulkWriteCommon,function(err){
                                                                  if(!err){
                                                                      mongo.reportDb().collection(fields.CC_CUSTOMER_COMMON_USER_REPORT).remove(reportQuery, {w: 1}, function (err) {
                                                                          if (!err) {
                                                                              var bulkWrite = [];
                                                                              for (var item in agentsMap) {
                                                                                  var obj = agentsMap[item];
                                                                                  var saleOwner = item.split("_");
                                                                                  var categoryId = saleOwner[0];
                                                                                  var owner = saleOwner[1];
                                                                                  var insertData = {
                                                                                      "account": obj.account,
                                                                                      "year": obj.year,
                                                                                      "month": obj.month,
                                                                                      "day": obj.day,
                                                                                      "categoryId": categoryId,
                                                                                      "user": owner,
                                                                                      "assign": obj.assign
                                                                                  };
                                                                                  var query = {insertOne: insertData};
                                                                                  bulkWrite.push(query);
                                                                              }
                                                                              if (bulkWrite.length != 0) {
                                                                                  mongo.reportDb().collection(fields.CC_CUSTOMER_COMMON_USER_REPORT).bulkWrite(bulkWrite, function (err) {
                                                                                      if (!err) {
                                                                                          result.success = true;
                                                                                          callback(result);
                                                                                      } else {
                                                                                          logger.app.error(err);
                                                                                          callback(result);
                                                                                      }
                                                                                  })
                                                                              }
                                                                          } else {
                                                                              logger.app.error(err);
                                                                              callback(result);
                                                                          }
                                                                      })
                                                                  }else{
                                                                      logger.app.error(err);
                                                                      callback(result);
                                                                  }
                                                              })
                                                          }
                                                       } else {
                                                           logger.app.error(err);
                                                           callback(result);
                                                       }
                                                   })
                                               } else {
                                                   result.message = '未找到客户信息!';
                                                   callback(result);
                                               }
                                           } else {
                                               logger.app.error(err);
                                               callback(result);
                                           }
                                       })

                               }else{
                                   result.message = "未找到公海信息!";
                                   callback(result);
                               }
                           }else{
                               logger.app.error(err);
                               callback(result);
                           }
                       })
                   }else{
                        result.message = "未找到账号信息!";
                       callback(result);
                   }
               }else{
                   logger.app.error(err);
                   callback(result);
               }
            })
        }else{
            result.message = "帐号输入有误!";
            callback(result);
        }
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