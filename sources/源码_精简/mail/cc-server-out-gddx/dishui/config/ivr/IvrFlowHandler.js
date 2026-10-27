var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var uuid = require('appUtil/UUID');
var logger = require('appLog');
var dateTimeUtil = require('appUtil/DateTime');
var scheduleHandler = require(__baseDir + '/dishui/config/ivr/ScheduleHandler');
var announcementHandler = require(__baseDir + '/dishui/config/ivr/AnnouncementHandler');

exports.queryFlow = function(data, session, callback){
    if(!data.Account){
        data.Account = session.user.account;
    }
    mongo.db().collection(fields.DB_IVR_FLOW).find(data).toArray(function (err, docs) {
        var result = {success: false};
        if (!err) {
            result.list = docs;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err.stack);
            result.message = 'Query ivr flow failure!';
            callback(result);
        }
    });
};

exports.deleteFlow = function(data,session,callback){
    var result = {success:false};
    data.FirstNodeId = '';
    data.FirstNodeType = '';
    delete data['FirstNode'];
    //修改所有引用了这个流程的，日程节点的语音节点
    updateScheduleForFlow(data,session,function(res){
        if(!res.success){
            logger.app.info("update schedule for delete flow %s failed. flowId = %s.", data.FlowName, data._id);
            callback(result);
            return;
        }
        //修改所有引用了这个流程数据库中得FlowId
        unbindScheduleForFlow(res.scheduleList,'',function(dbRes){
            if(!dbRes.success){
                callback(reslut);
                return;
            }
            var delData = {_id:data._id};
            deleteFlowFromDB(delData,function(err){
                if(err){
                    callback(result);
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        });
    });
}

/**
 * Cerate ivr flow when create serviceNo
 * @param data
 *  {"Type":"normal","Exten":"01010004114","DisplayName":"","PBX":"9.9.9.100","Account":"N00000000052",
 *  "_id":"0adafb20-3625-11e3-bbdf-97b7892de33f"}
 * @param session
 * @param callback
 */
exports.createIfNoFlow = function(data, session, callback){
    var queryData = {
        PBX : data.PBX,
        Account : data.Account
    };

    exports.queryFlow(queryData, session, function(queryResult){
        if(!queryResult.success) {
            callback(new Error(queryResult.message));
            return;
        }

        // create default ivr flow
        if (queryResult.list.length < 1){
            exports.initDefaultFlow({Account:data.Account, PBX:data.PBX}, session, function(err, defaultFlow){
                if(err){
                    logger.app.error(err.stack);
                    callback(err);
                    return;
                }
                logger.app.info(data.Account + " [" + data.PBX + "] flow created.");
                callback(null, defaultFlow);
            });
        } else {
            callback(null, queryResult.list[0]);
        }
    })
};

exports.initDefaultFlow = function(data, session, callback) {
    data._id = uuid.generateUuid();
    data.FlowName = '默认流程';
    data.FlowDesc = '默认流程';
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    data.UpdateUser = session.user._id;
    mongo.db().collection(fields.DB_IVR_FLOW).insert(data, {w:1}, function (err) {
        if (err) {
            logger.app.error(err.stack);
            callback(err);
        } else {
            callback(null, data);
        }
    });
}

exports.addOrUpdateFlow = function(data, session, callback){
    var result = {success:false};
    //add new flow
    if(!data._id){
      var addData = {
          _id : uuid.generateUuid(),
          Account : data.Account,
          PBX : data.PBX,
          FlowName : data.FlowName,
          FlowDesc : data.FlowDesc,
          UpdateTime : dateTimeUtil.getCurrentDate(),
          UpdateUser : session.user._id
      }
      saveFlowToDB(addData,function(err){
          if (err) {
              logger.app.error('Update flow failure: %s %s', currentFlow._id, currentFlow.FlowName);
              result.success = false;
              result.message = 'Update flow failure: '+ currentFlow.FlowName;
              callback(result);
              return;
          }
          result.success = true;
          result.data = addData;
          callback(result);
          return;
      });
    }
    //update flow
    var queryData = {
        _id : data._id,
        Account: session.user.account,
        PBX: data.PBX
    };
    exports.queryFlow(queryData, session, function(queryFlowResult){
        if(!queryFlowResult.success || !queryFlowResult.list || queryFlowResult.list.length < 1){
            result.success = false;
            result.message = 'Flow not found:' + data._id;
            callback(result);
            return;
        }
        var currentFlow = queryFlowResult.list[0];
        var firstNodeArr = data.FirstNode.split("@");
        var firstNodeType = firstNodeArr[0];
        var firstNodeExten = firstNodeArr[1];
        data.FirstNodeExten = firstNodeExten;
        data.FirstNodeType = firstNodeType;
        delete data['FirstNode'];
        var currentId = data._id;
        if(firstNodeType != currentFlow.FirstNodeType || firstNodeExten != currentFlow.FirstNodeExten){
            updateScheduleForFlow(data,session,function(usffRes){
                if(!usffRes.success){
                    callback(result);
                    return;
                }
                updateFlowToDB(data, function(err){
                    if (err) {
                        logger.app.error('Update flow failure: %s %s', currentFlow._id, currentFlow.FlowName);
                        result.success = false;
                        result.message = 'Update flow failure: '+ currentFlow.FlowName;
                        callback(result);
                        return;
                    }
                    data._id = currentId;
                    result.data = data;
                    result.success = true;
                    callback(result);
                });
            });
        } else {
            updateFlowToDB(data, function(err){
                if (err) {
                    logger.app.error('Update flow failure: %s %s', currentFlow._id, currentFlow.FlowName);
                    result.success = false;
                    result.message = 'Update flow failure: '+ currentFlow.FlowName;
                    callback(result);
                    return;
                }
                data._id = currentId;
                result.data = data;
                result.success = true;
                callback(result);
            });
        }

    });
};

function updateScheduleForFlow(data,session,callback){
    var result = {success: false};
    var queryScheduleData = {
        Account: data.Account,
        PBX: data.PBX,
        FlowId: data._id
    };
    scheduleHandler.querySchedule(queryScheduleData, session, function(queryScheduleResult){
        if (!queryScheduleResult.success){
            result.success = false;
            result.message = 'Query schedule by flow failure, the flow is '+ data._id;
            callback(result);
            return;
        }
        var scheduleList = queryScheduleResult.list;
        if(scheduleList && scheduleList.length > 0) {
            var schedule = null;
            var announcementArr = [];
            for(var i= 0,len=scheduleList.length;i<len;i++){
                schedule = scheduleList[i];
                if(schedule.AnnouncementId){
                    announcementArr.push(schedule.AnnouncementId);
                }
            }
            if(announcementArr.length > 0){
                announcementHandler.batchUpdateAnnouncement({
                    AnnouncementIdArr: announcementArr,
                    updateData: {
                        ToPeerType : data.FirstNodeType,
                        ToPeer : data.FirstNodeExten
                    }
                }, session, function(batchUpdateResult){
                    if(!batchUpdateResult.success){
                        callback(batchUpdateResult);
                        return;
                    }
                    result.scheduleList = scheduleList;
                    result.success = true;
                    callback(result);
                });
            }
        }else{
            result.success = true;
            callback(result);
        }
    });
}

function unbindScheduleForFlow(scheList,FlowId,callback){
    var result = {success:false};
    if(scheList){
        var sche = scheList.shift();
        var updateData = {
            _id : sche._id,
            FlowId : FlowId
        }
        scheduleHandler.updateScheduleToDB(updateData,function(res){
            if(!res.success){
                callback(result);
            }
            if (scheList.length > 0) {
                batchUpdateScheduleForFlow(scheList, FlowId, callback);
            } else {
                result.success = true;
                callback(result);
            }
        });
    }else{
        result.success = true;
        callback(result);
    }
}


function updateFlowToDB(flow, callback){
    var id = flow._id;
    delete flow['_id'];
    flow.UpdateTime = dateTimeUtil.getCurrentDate();
    mongo.db().collection(fields.DB_IVR_FLOW).update({_id:id}, {"$set": flow},{"upsert":true}, function(err){
        if(err){
            logger.app.error(err.stack);
            callback(err);
            return;
        }
        logger.app.info('Flow [%s, %s] has been updated.', flow._id, flow.FlowName);
        callback(null);
    });
}

function saveFlowToDB(flow, callback){
    mongo.db().collection(fields.DB_IVR_FLOW).insert(flow,function(err,doc){
        if(err){
            logger.app.error(err.stack);
            callback(err);
            return;
        }
        logger.app.info('Flow [%s, %s] has been insert db.', flow._id, flow.FlowName);
        callback(null);
    });
}

function deleteFlowFromDB(flow, callback){
    mongo.db().collection(fields.DB_IVR_FLOW).remove(flow,function(err,doc){
       if(err){
           logger.app.error(err,stack);
           callback(err);
           return;
       }
       callback(null);
    });
}