var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var nodeUtil = require('util');
var mongo = require('appDb/MongoDb');
var dateTimeUtil = require('appUtil/DateTime');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
//var billInterfaceHandler = require(__baseDir + '/dishui/common/BillInterfaceHandler');
var billInterfaceHandler = require(__baseDir + '/dishui/common/billInterface/BillRequestHandler');
var ivrFlowHandler = require(__baseDir + '/dishui/config/ivr/IvrFlowHandler');
var scheduleHandler = require(__baseDir + '/dishui/config/ivr/ScheduleHandler');
var numHandler = require(__baseDir + '/dishui/config/ivr/NumHandler');
var uuid = require('appUtil/UUID');
var busUtil = require('appUtil/BusinessUtil');
var objectUtil = require('appUtil/ObjectUtil');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;

exports.queryServiceNo = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_SERVICE_NO).find(data, {sort:{Exten:-1}}).toArray(function(err, docs){
        if(err){
            logger.app.error(err.stack);
            result.message = "Query service no failure:" + data;
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.saveServiceNoForIvrTools = function(data, session, callback){
    var result = {success:false};
    data.ToPeer = data.ToPeer;
    data.Action = "ServiceNoAdd";
    data.Update = true;
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    data.UpdateUser = session.user._id;

    var serviceNoData = {
        nodeData: data,
        isStoreDB: false
    }
    ivrHandler.saveOrUpdateIvr(serviceNoData, session, function(err){
        if(err){
            result.success = false;
            result.reason = 500;
            callback(result);
            return;
        }
        result.success = true;
        result.data = data;
        callback(result);
    });
}

exports.queryAvailableServiceNo = function(data, session, callback){
    var result = {success: false};
    var find = {
        account: data.Account,
        product: 'cc'
    };
    mongo.db('bill').collection(fields.DB_PLATFORM_NUM400).find(find, {sort:{Exten:-1}}).toArray(function(err, doc400s){
        if(err){
            logger.app.error(err.stack);
            result.message = "Query available service no failure:" + data;
            result.success = false;
            callback(result);
            return;
        }
        mongo.db('bill').collection(fields.DB_PLATFORM_SERVICENUM).find(find, {sort:{Exten:-1}}).toArray(function(err, docs){
            if(err){
                logger.app.error(err.stack);
                result.message = "Query available service no failure:" + data;
                result.success = false;
                callback(result);
                return;
            }
            mongo.db().collection(fields.DB_IVR_SERVICE_NO).find({Account:data.Account}, {sort:{Exten:-1}}).toArray(function(err, secondDocs){
                if(err){
                    logger.app.error(err.stack);
                    result.message = "Query service no failure:" + data;
                    result.success = false;
                    callback(result);
                    return;
                }
                var endDocs = docs.concat(doc400s);
                for(var i=0 ; i < secondDocs.length; i++){
                    for(var j=0 ; j< endDocs.length ; j++){
                        if(secondDocs[i].Exten == endDocs[j]._id){
                            endDocs.splice(j,1);
                            break;
                        }
                    }
                }
                result.list = endDocs;
                result.success = true;
                callback(result);
            });
        });
    });
}

/**
 *
 * @param data
 *  {"Type":"normal","Exten":"01010004114","DisplayName":"","PBX":"9.9.9.100","Account":"N00000000052"}
 * @param session
 * @param callback
 */
exports.saveServiceNo = function (data, session, callback) {
    var result = {success: false};

    data._id = uuid.generateUuid();
    // Check if user has a flow, if not ,create a default flow.
    ivrFlowHandler.createIfNoFlow(data, session, function(err, flowData){
        if(err){
            result.success = false;
            result.reason = 500;
            callback(result);
            return;
        }
        data.FlowId = flowData["_id"];
        // TODO create init schedule if not exists for serviceNo
        scheduleHandler.initDefaultSchedule(data, session, function(err, scheduleData){
            // TODO create init blacklist node if not exists for serviceNo
            if(err){
                result.success = false;
                result.reason = 500;
                callback(result);
                return;
            }
            numHandler.initDefaultBlackListNode(data, session, function(err, blacklistData){
                if (err){
                    result.success = false;
                    result.reason = 500;
                    callback(result);
                    return;
                }
                data.ToPeer = blacklistData.Exten;
                data.Action = "ServiceNoAdd";
                data.UpdateTime = dateTimeUtil.getCurrentDate();
                data.UpdateUser = session.user._id;
                var serviceNoData = {
                    nodeData: data,
                    dbData : {
                        tableName : fields.DB_IVR_SERVICE_NO
                    }
                }
                ivrHandler.saveOrUpdateIvr(serviceNoData, session, function(err){
                    if(err){
                        result.success = false;
                        result.reason = 500;
                        callback(result);
                        return;
                    }
                    var billTableName = fields.DB_PLATFORM_SERVICENUM;
                    if(data.Exten.substr(0,3) == '400'){
                        billTableName = fields.DB_PLATFORM_NUM400;
                    }
                    mongo.db('bill').collection(billTableName).update({_id:data.Exten},{$set:{pbx:data.PBX}},function(err){
                        if(err){
                            logger.app.error(err);
                            callback(result);
                            return;
                        }
                        logger.app.info(data.Account + ' - ' + data.PBX+' serviceNo ' + data.Exten + 'created.');
                        data.NoTypeName = data.Type === 'normal' ? '普通':'批量外呼';
                        result.data = data;
                        result.serviceNoSchedule = scheduleData;
                        result.success = true;
                        callback(result);
                        //synchronize bill
//                        var billData = {
//                            pbx: data.PBX,
//                            number: data.Exten
//                        }
//                        var action = 'action=service.effectCCRoute&data=' + JSON.stringify(billData);
//                        httpProvider.sendGet(config.yyBillUrl + "?" + action, function(err, res){
//                            if(err) {
//                                result.message = 'Sent require to bill server error: ' + data;
//                                callback(result);
//                                return;
//                            }
//                            var resData = JSON.parse(res.toString());
//                            if(!resData.success){
//                                result.message = resData.message;
//                                callback(result);
//                                return;
//                            }
//                            logger.app.info(data.Account + ' - ' + data.PBX+' serviceNo ' + data.Exten + 'created.');
//                            data.NoTypeName = data.Type === 'normal' ? '普通':'批量外呼';
//                            result.data = data;
//                            result.serviceNoSchedule = scheduleData;
//                            result.success = true;
//                            callback(result);
//                        });
                    });
                });
            })
        });
    });
}

exports.updateServiceNo = function (data, session, callback) {
    var result = {success : false};
    exports.queryServiceNo({"_id":data._id}, session, function(queryRes){
        if(!queryRes.success || queryRes.list.length < 1){
            callback(queryRes);
            return;
        }
        var oldServiceNo = queryRes.list[0];
        if(oldServiceNo.Exten != data.Exten){
            result.message = '不允许修改服务号码！';
            callback(result);
            return;
        } else {
            updateServiceNoInfo(data, session, callback);
        }

    });
}

/**
 * After schedule created, add schedule to service list
 * @param scheduleData
 * @param session
 * @param callback
 */
exports.updateServiceNoSchedule = function (scheduleData, session, callback) {
    var queryData = null;
    if(scheduleData.ServiceNoID){
        queryData = {
    //        Account: scheduleData.Account,
    //        PBX: scheduleData.PBX,
    //        Exten: scheduleData.ServiceNo,
    //        'Schedules.id': scheduleData._id
            _id: scheduleData.ServiceNoID,
            "Schedules.id" : scheduleData._id
        }
    } else {
        queryData = {
            Account: scheduleData.Account,
            PBX: scheduleData.PBX,
            Exten: scheduleData.ServiceNo,
            "Schedules.id" : scheduleData._id
        }
    }
    mongo.db().collection(fields.DB_IVR_SERVICE_NO).findOne(queryData, function (err, doc) {
        if (err) {
            logger.app.error(err.stack);
            callback(err);
            return;
        }

        if (!doc) {
            var serviceNoData = {
                Account: scheduleData.Account,
                PBX: scheduleData.PBX,
                Exten: scheduleData.ServiceNo
            };
            if(scheduleData.ServiceNoID) {
                serviceNoData._id = scheduleData.ServiceNoID;
            }
            mongo.db().collection(fields.DB_IVR_SERVICE_NO).update(serviceNoData, {'$push': {'Schedules': {id: scheduleData._id}}},
                {'upsert': true, 'w':1}, function (err) {
                if (err) {
                    logger.app.error(err.stack);
                    callback(err);
                    return;
                }
                callback(null);
            });
        } else {
            callback(null);
        }
    });
}

//QQ
exports.delServiceNoSchedule = function (scheduleData, session, callback) {
    var queryData = {
        Account: scheduleData.Account,
        PBX: scheduleData.PBX,
        Exten: scheduleData.ServiceNo,
        'Schedules.id': scheduleData._id
    }
    mongo.db().collection(fields.DB_IVR_SERVICE_NO).findOne(queryData, function (err, doc) {
        if (err) {
            logger.app.error(err.stack);
            callback(err);
            return;
        }
        if (doc) {
            var serviceNoData = {
                Account: scheduleData.Account,
                PBX: scheduleData.PBX,
                Exten: scheduleData.ServiceNo
            };
            mongo.db().collection(fields.DB_IVR_SERVICE_NO).update(serviceNoData, {'$pull': {'Schedules': {id: scheduleData._id}}},
                function (err) {
                    if (err) {
                        logger.app.error(err.stack);
                        callback(err);
                        return;
                    }
                    callback(null);
                });
        }
    });
}

exports.queryServiceNoByExten = function(data, session, callback){
    var result = {success:false}
    var queryData = {
        Account: data.Account,
        PBX: data.PBX,
        Exten: data.Exten
    }
    mongo.db().collection(fields.DB_IVR_SERVICE_NO).findOne(queryData, function (err, doc) {
        if (err) {
            logger.app.error(err.stack);
            callback(result);
            return;
        }
        result.success =  true;
        result.doc = doc;
        callback(result);
    });
}

exports.updateServiceNoBaseInfo = function(data, session, callback){
    var result = {success:false}
    delete data['oldExten'];
    delete data['oldDisplayName'];
    delete data['oldType'];
    data.Action = "ServiceNoAdd";
    var ivrData = {
        nodeData : data,
        dbData : {
            tableName : fields.DB_IVR_SERVICE_NO,
            condition : {"Account" : data.Account,"PBX":data.PBX,"Exten":data.Exten}
        }
    };
    ivrHandler.saveOrUpdateIvr(ivrData,session,function(err,ivrRes){
        if(err){
            logger.app.error(err.stack);
            callback(result);
            return;
        }else{
            exports.queryServiceNoByExten(data,session,function(queryRes){
                if(queryRes.success){
                    queryRes.doc.NoTypeName = queryRes.doc.Type === 'normal'?'普通':'批量外呼';
                    result.data = queryRes.doc;
                    result.success=true;
                    callback(result);
                }else{
                    logger.app.error('query serviceNo failed!');
                }
            })
        }
    });
}

exports.updateServiceNoForNewNo = function(data, session, callback){
    var result = {success:false};
    //检查服务号占用情况
    checkServiceNoStatus(data,session,function(stateRes){
        if(!stateRes.success){
            result.reason = 500;
            callback(result);
            return;
        }
        if(stateRes.state === fields.SERVICENO_USED){
            result.reason = 401;
            callback(result);
            return;
        }
        var delData={
            Account : data.Account,
            PBX : data.PBX,
            Exten : data.oldExten
        };
        exports.deleteServiceNo(delData,session,function(delRes){
            if(!delRes.success){
                result.reason = 402;
                result.message = 'delete serviceNo failed for updateServiceNoForNewNo!';
                callback(result);
                return;
            }
            delete data['oldExten'];
            delete data['oldDisplayName'];
            delete data['oldType'];
            exports.saveServiceNo(data, session, function(addRes){
                if(!addRes.success){
                    result.reason = 403;
                    result.message = 'add serviceNo failed for updateServiceNoForNewNo!';
                    callback(result);
                    return;
                }
                exports.queryServiceNoByExten(data,session,function(queryRes){
                    if(queryRes.success){
                        queryRes.doc.NoTypeName = queryRes.doc.Type === 'normal'?'普通':'批量外呼';
                        result.data = queryRes.doc;
                        result.success=true;
                        callback(result);
                    }else{
                        logger.app.error('query serviceNo failed!');
                    }
                })
            });
        });
    });
}

/*
    给计费调用的方法,用来回收过期的服务号.
*/
exports.releaseCCServiceNo = function(data,callback){
    var result = {success: false};
    var session = {
        user:{
            account:data.Account
        }
    };
    exports.queryServiceNoByExten(data,session,function(res){
        if(res.success){
            if(res.doc){
                exports.deleteServiceNo(data,session,function(res){
                    callback(res);
                });
            }else{
                result.success = true;
              callback(result);
            }
        }else{
            callback(result);
        }
    });
}

exports.deleteServiceNo = function(data, session, callback){
    var result = {success: false};
    //删除黑名单
    numHandler.deleteBlackListNode(data, session, function(numRes){
       if(!numRes.success){
           result.message = "delete blackListNode failed!for delete serviceNo!";
           callback(result);
           return;
       }
       //删除日程
       scheduleHandler.delScheduleByServiceNo(data, session, function(scheRes){
          if(!scheRes.success){
              result.message = "delete schedule failed!for delete serviceNo!";
              callback(result);
              return;
          }
          data.Action="PeerRemove";
          data.Peer="ServiceNo";
          var ivrData = {
              nodeData : data,
              dbData : {
                  tableName : fields.DB_IVR_SERVICE_NO,
                  condition : {
                      "Account":data.Account, "PBX":data.PBX, "Exten":data.Exten
                  }
              }
          };
          //删除服务号
          ivrHandler.deleteIvr(ivrData, session, function(ivrRes){
              if(!ivrRes.success){
                  result.message = "del serviceNo failed from acs!";
                  callback(result);
                  return;
              }
              var billTableName = fields.DB_PLATFORM_SERVICENUM;
              if(data.Exten.substr(0,3) == '400'){
                  billTableName = fields.DB_PLATFORM_NUM400;
              }
              mongo.db('bill').collection(billTableName).update({_id:data.Exten,account:session.user.account},{$set:{pbx:""}},function(err){
                  if(err){
                      logger.app.error(err);
                      callback(result);
                      return;
                  }
                  console.info('Service no deleted: ' + data.Exten);
                  result.data = data;
                  result.scheduleIDs = scheRes.scheduleIDs;
                  result.success = true;
                  callback(result);
                  return;
              });
          });
       });
    });
}

function updateServiceNoInfo(data, session, callback){
    var result = {success: false};

    var oldServiceNo = data.oldServiceNo;
    delete data.oldServiceNo;
    data.Action = "ServiceNoAdd";
    data.UpdateTime = dateTimeUtil.getCurrentDate();
   // data.UpdateUser = session.user._id;
    var updateData = {
        nodeData: data,
        dbData : {
            tableName : fields.DB_IVR_SERVICE_NO,
            condition: {
                _id: data._id
            }
        }

    }
    ivrHandler.saveOrUpdateIvr(updateData, session, function(err){
        if (err){
            result.success = false;
            result.message = "Update service no failure!";
            callback(result);
            return;
        }

        var updateScheduldServiceNo = {
            Account: data.Account,
            PBX: data.PBX,
            oldServiceNo : oldServiceNo,
            ServiceNo: data.Exten
        }
        scheduleHandler.updateScheduleServiceNo(updateScheduldServiceNo, session, function(updateScheduleRes){
            if(!updateScheduleRes.success) {
                callback(updateScheduleRes);
                return;
            }

            exports.queryServiceNo({"_id":data._id}, session, function(updatedQueryRes){
                if(!updatedQueryRes.success || !updatedQueryRes.list || updatedQueryRes.list.length < 1){
                    result.success = false;
                    result.message = 'Query service no after update failure!';
                    return;
                }
                result.data = updatedQueryRes.list[0];
                result.data.NoTypeName = result.data.Type === 'normal' ? '普通':'批量外呼';
                result.success = true;
                logger.app.info("ServiceNo %s has updated!", data.Exten);
                callback(result);
            });
        });
    });
}
/**
 * 已作废
 * @param data
 * @param session
 * @param callback
 */
function checkServiceNoStatus(data,session,callback){
    var result = {success:false};
    busUtil.getServiceNo({Account: data.Account, num: data.Exten}, function (err, state) {
        if (err){
            callback(result);
            return;
        }
        if (state && state == "400") {
            result.success = true;
            result.state = fields.SERVICENO_USED;
            callback(result);
            return;
        }
        //计费只会返回，这个服务号是否被别人占用，如果这个服务号被自己占用还是会返回空闲。但是对于自己也不允许建第二个相同服务号
        //所以再检查一次重复
        var find = {"Account":data.Account, "Exten":data.Exten};
        mongo.db().collection(fields.DB_IVR_SERVICE_NO).find(find).toArray(function(err,docs){
            if(err){
                callback(result);
                return;
            }
            if(docs.length > 0){
                result.success = true;
                result.state = fields.SERVICENO_USED;
                callback(result);
                return;
            }
            result.state = fields.SERVICENO_IDLE;
            result.success = true;
            callback(result);
        });
    });
}

exports.getServiceNoDic = function(session, callback){
    var result = {success: false};
    var query = {
        Account: session.user.account
        //PBX: session.user.sipConfigId
    }
    mongo.db().collection(fields.DB_IVR_SERVICE_NO).find(query).toArray(function(err, docs){
        if (!err) {
            callback(null, docs || []);
        } else {
            callback(err);
        }
    });
}

exports.getOwnServiceNoResource = function(session, callback){
    var find = {
        account: session.user.account,
        product: 'cc'
    };
    mongo.db('bill').collection(fields.DB_PLATFORM_NUM400).find(find, {sort:{Exten:-1}}).toArray(function(err, doc400s){
        if(err){
            logger.app.error(err.stack);
            callback(err);
            return;
        }
        mongo.db('bill').collection(fields.DB_PLATFORM_SERVICENUM).find(find, {sort:{Exten:-1}}).toArray(function(err, docs){
            if(err){
                logger.app.error(err.stack);
                callback(err);
                return;
            }
            var endDocs = docs.concat(doc400s);
            callback(null, endDocs || []);
        });
    });
}