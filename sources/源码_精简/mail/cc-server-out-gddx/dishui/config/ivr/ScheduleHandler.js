var logger = require("appLog");
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var objectUtil = require('appUtil/ObjectUtil');
var nodeUtil = require('util');
var uuid = require('appUtil/UUID');
var businessUtil = require('appUtil/BusinessUtil');
var dateTimeUtil = require('appUtil/DateTime');
var fields = require(__baseDir + '/dishui/common/Fields');
var announcementHandler = require(__baseDir + '/dishui/config/ivr/AnnouncementHandler');
var ivrFlowHandler = require(__baseDir + '/dishui/config/ivr/IvrFlowHandler');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var serivceNoHandler = require(__baseDir + '/dishui/config/ivr/ServiceNoHandler');
var numHandler = require(__baseDir + '/dishui/config/ivr/NumHandler');

/**
 * Create schedule
 * @param data
 * when add serviceNo
 * {"Account":"N00000000052","PBX":"9.9.9.100","DisplayName":"默认日程","Order":999,"StartDate":"*","EndDate":"*",
 *  "StartTime":"*","EndTime":"*","WeekMon":true,"WeekTue":true,"WeekWed":true,"WeekThu":true,"WeekFri":true,
 *  "WeekSat":true,"WeekSun":true,"IsDefault":"1","ServiceNo":"01010004114",
 *  "FlowId":"c8da8ca0-33da-11e3-ad2e-bd71399b36c4","ToPeerType":"system","ToPeer":"0",
 *  "ServiceNoID":"0adafb20-3625-11e3-bbdf-97b7892de33f"}
 *  when add schedule directly:
 *  {"ServiceNo":"01010004114","DisplayName":"123","Order":"1","StartDate":"*","EndDate":"*","StartTime":"*",
 *  "EndTime":"*","WeekMon":true,"WeekTue":true,"WeekWed":true,"WeekThu":true,"WeekFri":true,"WeekSat":true,
 *  "WeekSun":true,"ToPeerType":"account_user","ToPeer":"1002","PBX":"9.9.9.100","Account":"N00000000052"}
 * @param session
 * @param callback
 */
exports.saveSchedule = function (data, session, callback) {
    var result = {success: false};
   // data._id = uuid.generateUuid();
    //data.Account = session.user.account;

    announcementHandler.initDefaultAnnouncement(data, session, function (err, announcementData) {
        if (err) {
            callback(err);
            return;
        }

        data.AnnouncementId = announcementData._id;
        data.MatchedPeer = announcementData.Exten;
        if (data.Order) {
            data.Order = parseInt(data.Order);
        }
        exports.getNextSchedule(data, session, function (err, nextSchuduleData) {
            if (err) {
                result.success = false;
                result.message = "Add or update schedule failure!";
                callback(result);
                return;
            }
            if (nextSchuduleData) {
                data.UnmatchedPeer = nextSchuduleData.Exten;
            } else {
                data.UnmatchedPeer = null;
            }

            getScheduleExten(data, function (err, extenData) {
                if (err) {
                    result.success = false;
                    result.message = "Get ivr id failure!";
                    callback(result);
                    return;
                }
                data.Exten = extenData.Exten;
                data.Action = "TimeConditionAdd";
                data.Times = generateTimes(data);
                data.UpdateTime = dateTimeUtil.getCurrentDate();
                data.UpdateUser = session.user._id;
                if (!extenData.isExists) {
                    data._id = uuid.generateUuid();
                } else {
                    data._id = extenData._id;
                }
                var scheduleData = {
                    nodeData: data,
                    dbData: {
                        tableName: fields.DB_IVR_SCHEDULE
                    }
                };
                ivrHandler.saveOrUpdateIvr(scheduleData, session, function (err) {
                    if (err) {
                        result.success = false;
                        result.message = 'Save or update ivr failure!';
                        callback(result);
                        return;
                    }

                    serivceNoHandler.updateServiceNoSchedule(data, session, function (err) {
                        if (err) {
                            result.success = false;
                            result.message = 'Update schedule in serviceNo failure: ' + data.serviceNo;
                            callback(result);
                            return;
                        }

                        numHandler.checkBlackListNodeUnmatchPeer(data, session, function(checkRes){
                            if(!checkRes.success) {
                                result.message = 'check black list unmatch peer failure.';
                                result.success = false;
                                callback(result);
                                return;
                            }
                            updatePreviousScheduleUnmatch(data, session, function(updatePreviousRes){
                                if(!updatePreviousRes.success) {
                                    callback(updatePreviousRes);
                                    return;
                                }
                                result.success = true;
                                result.data = data;
                                callback(result);
                            });
                        });
                    });

                });
            });
        });
    });
}

exports.updateSchedule = function(data, session, callback){
    var result = {success: false};
    if(data.Order) {
        data.Order = parseInt(data.Order);
    }
    var queryData = {_id:data._id};
    mongo.db().collection(fields.DB_IVR_SCHEDULE).findOne(queryData, function(err, doc){
        if(err){
            result.success = false;
            result.message = 'Get schedule from DB failure: '+ data._id;
            callback(result);
            return;
        }
        var queryAnnouncementData = {
            _id: data.AnnouncementId
        };
        announcementHandler.queryAnnouncement(queryAnnouncementData, session, function(queryAnnResult){
            if(!queryAnnResult.success){
                callback(queryAnnResult);
                return;
            }
            var scheduleAnnouncement = queryAnnResult.list[0];
            scheduleAnnouncement.ToPeerType = data.ToPeerType;
            scheduleAnnouncement.ToPeer = data.ToPeer;
            announcementHandler.addOrUpdateAnnouncement(scheduleAnnouncement, session, function(updateAnnResult){
                if(!updateAnnResult.success) {
                    callback(updateAnnResult);
                    return;
                }
                data.selfExten = doc.Exten;
                exports.getNextSchedule(data, session, function (err, nextSchuduleData) {
                    if (err) {
                        result.success = false;
                        result.message = "Get next schedule failure: " + doc._id;
                        callback(result);
                        return;
                    }
                    if (nextSchuduleData) {
                        data.UnmatchedPeer = nextSchuduleData.Exten;
                    } else {
                        data.UnmatchedPeer = null;
                    }

                    objectUtil.mixin(doc, data);
                    console.info(doc);
                    doc.Action = "TimeConditionAdd";
                    doc.Times = generateTimes(doc);
                    doc.UpdateTime = dateTimeUtil.getCurrentDate();
                    doc.UpdateUser = session.user._id;
                    var scheduleData = {
                        nodeData: doc,
                        dbData: {
                            tableName: fields.DB_IVR_SCHEDULE
                        }
                    };
                    ivrHandler.saveOrUpdateIvr(scheduleData, session, function (err) {
                        if (err) {
                            result.success = false;
                            result.message = 'Update schedule failure: ' + doc._id;
                            callback(result);
                            return;
                        }

                        numHandler.checkBlackListNodeUnmatchPeer(doc, session, function(checkRes){
                            if(!checkRes.success) {
                                result.message = 'check black list unmatch peer failure.';
                                result.success = false;
                                callback(result);
                                return;
                            }
                            updatePreviousScheduleUnmatch(doc, session, function(updatePreviousRes){
                                if(!updatePreviousRes.success) {
                                    callback(updatePreviousRes);
                                    return;
                                }
                                result.success = true;
                                result.data = doc;
                                callback(result);
                            });
                        });
                    });
                });
            });
        });
    });
}

function updatePreviousScheduleUnmatch(data, session, callback) {
    var result = {success: false};
    var previousScheduleData = {
        Account: data.Account,
        PBX: data.PBX,
        ServiceNo: data.ServiceNo,
        Order: data.Order
    }
    exports.getPreviousSchedule(previousScheduleData, session, function(err, previousSchedule){
        if (err) {
            result.message = 'Get previous order schedule failure:' + nodeUtil.inspect(previousScheduleData);
            result.success = false;
            callback(result);
            return;
        }
        if(previousSchedule) {
            previousSchedule.UnmatchedPeer = data.Exten;
            previousSchedule.Action = "TimeConditionAdd";
            var updateScheduleData = {
                nodeData: previousSchedule,
                dbData: {
                    tableName: fields.DB_IVR_SCHEDULE
                }
            };
            ivrHandler.saveOrUpdateIvr(updateScheduleData, session, function (err) {
                if (err) {
                    result.success = false;
                    result.message = 'Update previous order schedule failure: ' + nodeUtil.inspect(updateScheduleData);
                    callback(result);
                    return;
                }
                result.success = true;
                callback(result);
            });
        } else {
            result.success = true;
            callback(result);
        }
    });
}

exports.delSchedule = function (data, session, callback) {
    var result = {success: false};
    var scheduleData = {
        PBX: data.PBX,
        _id: data._id,
        Account: data.Account
    }
    exports.querySchedule(scheduleData, session, function(scheduleRes, err){
        if (err) {
            result.success = false;
            callback(result);
            return;
        }
        if(scheduleRes.list.length > 0){
            var announcementId = scheduleRes.list[0].AnnouncementId;
            announcementHandler.queryAnnouncement({PBX: data.PBX, _id: announcementId}, session, function(annRes, err){
                if (err) {
                    result.success = false;
                    callback(result);
                    return;
                }
                var annData = annRes.list[0];
                announcementHandler.delAnnouncement(annData, session, function(delRes, err){
                    if (err) {
                        callback(err);
                        return;
                    }
                    data.ServiceNo = scheduleRes.list[0].ServiceNo;
                    data.Exten = scheduleRes.list[0].Exten;
                    data.Action = "PeerRemove";
                    data.Peer = "time";
                    var scheduleData = {
                        nodeData: data,
                        dbData: {
                            tableName: fields.DB_IVR_SCHEDULE,
                            condition: {
                                Account: data.Account,
                                PBX: data.PBX,
                                Exten: data.Exten
                            }
                        }
                    };
                    ivrHandler.deleteIvr(scheduleData, session, function(ivrRes){
                        if (!ivrRes.success) {
                            result.success = false;
                            result.message = 'Delete schedule in serviceNo failure: ' + data.Exten;
                            callback(result);
                            return;
                        }
                        serivceNoHandler.delServiceNoSchedule(data, session, function (err) {
                            if (err) {
                                result.success = false;
                                result.message = 'delete schedule in serviceNo failure: ' + data.serviceNo;
                                callback(result);
                                return;
                            }
                            data.selfExten = data.Exten;
                            if(data.Order) {
                                data.Order = parseInt(data.Order);
                            }
                            exports.getNextSchedule(data, session, function (err, nextSchuduleData) {
                                if (err) {
                                    result.success = false;
                                    result.message = "Get next schedule failure: " + data._id;
                                    callback(result);
                                    return;
                                }
                                if (nextSchuduleData) {
                                    exports.updateSchedule(nextSchuduleData, session, function(res){
                                        if(res.success){
                                            result.success = true;
                                            result.data = data;
                                            callback(result);
                                        }else{
                                            result.success = false;
                                            result.message = "update next schedule failure: " + nextSchuduleData._id;
                                            callback(result);
                                        }
                                    });
                                } else {
                                    exports.getPreviousSchedule(data, session, function(err, previousSchuduleData){
                                        if (err) {
                                            result.success = false;
                                            result.message = "Get previous schedule failure: " + data._id;
                                            callback(result);
                                            return;
                                        }
                                        if(previousSchuduleData){
                                            exports.updateSchedule(previousSchuduleData, session, function(res){
                                                if(res.success){
                                                    result.success = true;
                                                    result.data = data;
                                                    callback(result);
                                                }else{
                                                    result.success = false;
                                                    result.message = "update previous schedule failure: " + previousSchuduleData._id;
                                                    callback(result);
                                                }
                                            });
                                        }else{
                                            result.success = true;
                                            result.data = data;
                                            callback(result);
                                        }
                                    });
                                }
                            });
                        });
                    })
                });
            });
        }else{
            result.success = true;
            callback(result);
        }
    });
}

exports.getNextSchedule = function (data, session, callback) {
    var nextScheduleData = {
        Account: data.Account,
        PBX: data.PBX,
        ServiceNo: data.ServiceNo,
        Exten: {$ne:data.selfExten}
    }
    var scheduleOrder = data.Order;
    if (!scheduleOrder) {
        scheduleOrder = 0;
    }
    if (scheduleOrder >= 999) {
        callback(null, null);
        return;
    }
    nextScheduleData.Order = {"$gt": scheduleOrder};
    mongo.db().collection(fields.DB_IVR_SCHEDULE).findOne(nextScheduleData, {sort:{'Order':1}}, function (err, doc) {
        if (err) {
            logger.app.error(err.stack);
            callback(err);
            return;
        }
        callback(null, doc);
    });
}

exports.getPreviousSchedule = function (data, session, callback) {
    var previousScheduleData = {
        Account: data.Account,
        PBX: data.PBX,
        ServiceNo: data.ServiceNo
    }
    var scheduleOrder = data.Order;
    if (!scheduleOrder) {
        scheduleOrder = 0;
    }
    previousScheduleData.Order = {"$lt": scheduleOrder};
    mongo.db().collection(fields.DB_IVR_SCHEDULE).findOne(previousScheduleData, {sort:{'Order':-1}}, function (err, doc) {
        if (err) {
            logger.app.error(err);
            callback(err);
            return;
        }
        callback(null, doc);
    });
}

exports.querySchedule = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_SCHEDULE).find(data, {sort:{Order:1}}).toArray(function (err, docs) {
        if (err) {
            result.success = false;
            result.message = 'find schedule err';
            callback(result);
        } else {
            result.list = docs;
            result.success = true;
            callback(result);
        }
    });
};

exports.delScheduleByServiceNo = function (data, session, callback){
    var result = {success:false};
    var where = {
        "Account":data.Account,
        "PBX":data.PBX,
        "Exten":data.Exten
    };
    mongo.db().collection(fields.DB_IVR_SERVICE_NO).findOne(where,function(err,doc){
        if(err){
            callback(result);
            return;
        }
        var count = 0;
        if(!doc || !doc.Schedules || doc.Schedules.length < 1) {
            result.success = true;
            callback(result);
            return;
        }

        var length = doc.Schedules.length;
        var scheData ={
            Account : data.Account,
            PBX : data.PBX
        }
        scheData._id = doc.Schedules[0].id;
        var forBack = function(res){
            if(!res.success){
                result.message = "delete schedule failed!";
                callback(result);
                return;
            }
            count++;
            if(count < length){
                scheData._id = doc.Schedules[count].id;
                exports.delSchedule(scheData, session, function(res){
                    forBack(res);
                });
            }else if(count == length){
                result.success = true;
                result.scheduleIDs = doc.Schedules;
                callback(result);
            }
        }
        exports.delSchedule(scheData, session, function(res){
            forBack(res);
        });
    });
};

/**
 * Create defalut schedule when create serviceNo
 * @param data
 * {"Type":"normal","Exten":"01010004114","DisplayName":"","PBX":"9.9.9.100","Account":"N00000000052",
 *  "_id":"0adafb20-3625-11e3-bbdf-97b7892de33f","FlowId":"c8da8ca0-33da-11e3-ad2e-bd71399b36c4"}
 * @param session
 * @param callback
 */
exports.initDefaultSchedule = function (data, session, callback) {
    var scheduleData = {
        Account: data.Account,
        PBX: data.PBX
    };

    scheduleData.DisplayName = "默认日程";
    scheduleData.Order = 999;
    scheduleData.StartDate = "*";
    scheduleData.EndDate = "*";
    scheduleData.StartTime = "*";
    scheduleData.EndTime = "*";
    scheduleData.WeekMon = true;
    scheduleData.WeekTue = true;
    scheduleData.WeekWed = true;
    scheduleData.WeekThu = true;
    scheduleData.WeekFri = true;
    scheduleData.WeekSat = true;
    scheduleData.WeekSun = true;
    scheduleData.IsDefault = "1";
    scheduleData.ServiceNo = data.Exten;
    scheduleData.FlowId = data.FlowId;
    scheduleData.ToPeerType = 'system';
    scheduleData.ToPeer = '0';
    scheduleData.ServiceNoID = data._id;
    delete data.FlowId;


    exports.saveSchedule(scheduleData, session, function (addResult) {
        if (!addResult.success) {
            callback(new Error("Init default schedule failure!"));
            return;
        }
        //updateIvrStatue
        callback(null, scheduleData);
    });
}

var _FIRST_DAY_OF_MONTH = 01;
var _LAST_DAY_OF_MONTH = 31;

function generateTimes(data) {
    var days = [];
    var day = [];
    var day2 = [];
    var day3 = [];
    if (data.StartDate == "*") {
        day.push("*");
        day.push("*");
        days.push(day);
    } else {
        var startDateArr = data.StartDate.split("-");
        var startMon = parseInt(startDateArr[0]);
        var startDay = parseInt(startDateArr[1]);
        var endDateArr = data.EndDate.split("-");
        var endMon = parseInt(endDateArr[0]);
        var endDay = parseInt(endDateArr[1]);
        // no cross a month
        if (endMon - startMon == 0) {
            day.push(getMonthName(startMon));
            day.push(startDay + "-" + endDay);
            days.push(day);
        } else {
            // cross months
            if (startDay == _FIRST_DAY_OF_MONTH && endDay == _LAST_DAY_OF_MONTH) {
                day.push(getMonthName(startMon) + "-" + getMonthName(endMon));
                day.push(startDay + "-" + endDay);
                days.push(day);
            } else {
                // cross a month
                if ((endMon - 1) == startMon) {
                    day.push(getMonthName(startMon));
                    day.push(startDay + "-" + _LAST_DAY_OF_MONTH);
                    days.push(day);
                    day2.push(getMonthName(endMon));
                    day2.push(_FIRST_DAY_OF_MONTH + "-" + endDay);
                    days.push(day2);
                } else {
                    if (startDay == _FIRST_DAY_OF_MONTH) {
                        if (endDay == _LAST_DAY_OF_MONTH) {
                            day.push(getMonthName(startMon) + "-" + getMonthName(endMon));
                            day.push(startDay + "-" + endDay);
                            days.push(day);
                        } else {
                            day.push(getMonthName(startMon) + "-" + getMonthName(endMon - 1));
                            day.push(startDay + "-" + _LAST_DAY_OF_MONTH);
                            days.push(day);
                            day2.push(getMonthName(endMon));
                            day2.push(_FIRST_DAY_OF_MONTH + "-" + endDay);
                            days.push(day2);
                        }
                    } else if (endDay == _LAST_DAY_OF_MONTH) {
                        day.push(getMonthName(startMon));
                        day.push(startDay + "-" + _LAST_DAY_OF_MONTH);
                        days.push(day);
                        day2.push(getMonthName(startMon - 1) + "-" + getMonthName(endMon));
                        day2.push(_FIRST_DAY_OF_MONTH + "-" + endDay);
                        days.push(day2);
                    } else {
                        day.push(getMonthName(startMon));
                        day.push(startDay + "-" + _LAST_DAY_OF_MONTH);
                        days.push(day);
                        day2.push(getMonthName(startMon + 1) + "-" + getMonthName(endMon - 1));
                        day2.push(_FIRST_DAY_OF_MONTH + "-" + _LAST_DAY_OF_MONTH);
                        days.push(day2);
                        day3.push(getMonthName(endMon));
                        day3.push(_FIRST_DAY_OF_MONTH + "-" + endDay);
                        days.push(day3);
                    }
                }
            }
        }
    }

    var times = "";
    var dayArr = null;
    var week = getWeeks(data);
    var time = getTimes(data);
    for (var i = 0, len = days.length; i < len; i++) {
        dayArr = days[i];
        times += "@" + time + "," + week + "," + dayArr[1] + "," + dayArr[0];
    }
    times = times.substr(1);
    return times;
}

function getWeeks(data) {
    var weeks = "";
    if (data.WeekMon) {
        weeks += "&mon";
    }
    if (data.WeekTue) {
        weeks += "&tue";
    }
    if (data.WeekWed) {
        weeks += "&wed";
    }
    if (data.WeekThu) {
        weeks += "&thu";
    }
    if (data.WeekFri) {
        weeks += "&fri";
    }
    if (data.WeekSat) {
        weeks += "&sat";
    }
    if (data.WeekSun) {
        weeks += "&sun";
    }
    weeks = weeks.substr(1);
    return weeks;
}

function getTimes(data) {
    var times = "";
    if (data.StartTime == "*") {
        times = "*"
    } else {
        times = data.StartTime + "-" + data.EndTime;
    }
    return times;
}

function getMonthName(month) {
    var name = "*";
    if (month == 01) {
        name = "jan";
    } else if (month == 02) {
        name = "feb";
    } else if (month == 03) {
        name = "mar";
    } else if (month == 04) {
        name = "apr";
    } else if (month == 05) {
        name = "may";
    } else if (month == 06) {
        name = "jun";
    } else if (month == 07) {
        name = "jul";
    } else if (month == 08) {
        name = "aug";
    } else if (month == 09) {
        name = "sep";
    } else if (month == 10) {
        name = "oct";
    } else if (month == 11) {
        name = "nov";
    } else if (month == 12) {
        name = "dec";
    }
    return name;
}

exports.updateScheduleToDB = function(data,callback){
    var result = {success:false};
    var find = {_id : data._id};
    delete data['_id'];
    mongo.db().collection(fields.DB_IVR_SCHEDULE).update(find,{"$set":data},function(err,doc){
        if(err){
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });
}

exports.updateScheduleServiceNo = function(data ,session, callback){
    var result = {success:false};
    var find = {
        Account: data.Account,
        PBX: data.PBX,
        ServiceNo : data.oldServiceNo
    }
    mongo.db().collection(fields.DB_IVR_SCHEDULE).update(find, {"$set":{ServiceNo:data.ServiceNo}}, function(err){
        if(err){
            result.success = false;
            result.message = "Update schedule service no failure: " + find;
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });
}

function getScheduleExten(data, callback) {
    var query = null;
    if (data.IsDefault == "1") {
        query = {
            Account: data.Account,
            PBX: data.PBX,
            ServiceNo: data.ServiceNo,
            IsDefault: "1"
        }
    } else if (data._id) {
        query = {
            Account: data.Account,
            PBX: data.PBX,
            _id: data._id
        }
    }

    if (query) {
        mongo.db().collection(fields.DB_IVR_SCHEDULE).findOne(query, function (err, doc) {
            if (err) {
                logger.app.error(err.stack);
                callback(err);
                return;
            }
            if (!doc) {
                businessUtil.getIvrId(data.Account, function (err, scheduleIdData) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, {Exten: scheduleIdData.ivrId, isExists: false});
                });
            } else {
                callback(null, {Exten: doc.Exten, isExists: true, _id: doc._id});
            }
        });
    } else {
        businessUtil.getIvrId(data.Account, function (err, scheduleIdData) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, {Exten: scheduleIdData.ivrId, isExists: false});
        });
    }

}

exports.saveScheduleForIvrTools = function(data , session ,callback){

    var result = {success:false};
    data.Action = "TimeConditionAdd";
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    data.UpdateUser = session.user._id;
    var scheduleData = {
        nodeData: data,
        isStoreDB: false
    };
    ivrHandler.saveOrUpdateIvr(scheduleData, session, function (err) {
        if (err) {
            console.log('qqtest : update schedule error!');
            result.success = false;
            result.message = 'Save or update ivr failure!';
            callback(result);
            return;
        }
        result.success = true;
        result.data = data;
        callback(result);
    });

}



