var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var ivrFlowHandler = require(__baseDir + '/dishui/config/ivr/IvrFlowHandler');
var soundHandler = require(__baseDir + '/dishui/config/ivr/SoundHandler');

exports.queryAnnouncement = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_NODE_ANNOUNCEMENT).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query announcement failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.addOrUpdateAnnouncement = function (data, session, callback) {
    var result = {success: false};
    var extenParam = {
        Account: data.Account,
        PBX: data.PBX
    }
    if (data.ServiceNo) {
        extenParam.ServiceNo = data.ServiceNo;
    }
    if(data._id) {
        extenParam._id = data._id;
    }
    getAnnouncementExten(extenParam, function (err, extenData) {
            if (err) {
                callback(err);
                return;
            }

            data.Exten = extenData.Exten;
            if (!extenData.isExists) {
                if(!data._id)
                    data._id = uuid.generateUuid();
            } else {
                data._id = extenData._id;
            }
            data.Action = "AnnouncementAdd";
            data.UpdateTime = dateTimeUtil.getCurrentDate();
            data.UpdateUser = session.user._id;
            if(data.Filename == ''){
                delete data.Filename;
            }
            var ivrData = {
                nodeData: data,
                dbData: {
                    tableName: fields.DB_IVR_NODE_ANNOUNCEMENT,
                    condition: {
                        Account: data.Account,
                        PBX: data.PBX,
                        Exten: data.Exten
                    }
                }
            }
            var currentId = null;
            if (data._id) {
                ivrData.dbData.condition._id = data._id;
                currentId = data._id;
                delete data._id;
            }

            if (data.ServiceNo) {
                ivrData.dbData.condition.ServiceNo = data.ServiceNo;
            }
            ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                if (err) {
                    logger.app.error(err.stack);
                    result.message = "Add or update announcement node failure:" + data.Exten;
                    result.success = false;
                    callback(result);
                    return;
                }
                logger.app.info("Announcement node add or update: [" + data.ServiceNo + "] " + data.DisplayName);
                result.success = true;
                data._id = currentId;

                soundHandler.querySound({Filename: data.Filename}, session, function(querySoundRes){
                    if(!querySoundRes.success || querySoundRes.list.length < 1){
                        data.SoundName = '';
                    } else {
                        data.SoundName = querySoundRes.list[0].DisplayName;
                    }
                    result.data = data;
                    callback(result);
                });
            });
        });
}

/**
 * Create default announcement node when create serviceNo.
 * data parameter is schedule data.
 * @param data
 *  {"Account":"N00000000052","PBX":"9.9.9.100","DisplayName":"默认日程","Order":999,"StartDate":"*","EndDate":"*",
 *  "StartTime":"*","EndTime":"*","WeekMon":true,"WeekTue":true,"WeekWed":true,"WeekThu":true,"WeekFri":true,
 *  "WeekSat":true,"WeekSun":true,"IsDefault":"1","ServiceNo":"01010004114","FlowId":"c8da8ca0-33da-11e3-ad2e-bd71399b36c4",
 *  "ToPeerType":"system","ToPeer":"0","ServiceNoID":"0adafb20-3625-11e3-bbdf-97b7892de33f"}
 * @param session
 * @param callback
 */
exports.initDefaultAnnouncement = function (data, session, callback) {
    var queryFlow = {
        Account: data.Account,
        PBX: data.PBX
    };
    if (data.FlowId) {
        queryFlow._id = data.FlowId;
    } else {
        queryFlow.FlowName = "默认流程";
    }
    ivrFlowHandler.queryFlow(queryFlow, session, function (queryFlowResult) {
        if (!queryFlowResult.success) {
            callback(new Error(queryFlowResult.message));
            return;
        }
        var announcementData = {
            Account: data.Account,
            PBX: data.PBX,
            ToPeerType: "",
            ServiceNo : data.ServiceNo
        };
        if(data.IsDefault) {
            announcementData.DisplayName = "中继号：" + data.ServiceNo + "默认日程语音";
        } else {
            announcementData.DisplayName = "日程：" + data.DisplayName + "默认语音";
            announcementData._id = uuid.generateUuid();
        }
//        if(queryFlowResult.list && queryFlowResult.list.length > 0){
//            announcementData.ToPeer = queryFlowResult.list[0].Exten;
//        }
        announcementData.ToPeer = data.ToPeer;
        exports.addOrUpdateAnnouncement(announcementData, session, function (annResult) {
            if (!annResult.success) {
                callback(new Error(annResult.message));
                return;
            }
            logger.app.info(data.Account + " [" + data.PBX +"] default announcement created:" + data.ServiceNo);
            callback(null, announcementData);
        });
    });
}

exports.delAnnouncement = function (data, session, callback) {
    var result= {success : false};
    data.Action = "PeerRemove";
    data.Peer = "announcement";
    var ivrData = {
        nodeData: data,
        dbData: {
            tableName: fields.DB_IVR_NODE_ANNOUNCEMENT,
            condition: {
                Account: data.Account,
                PBX: data.PBX,
                Exten: data.Exten
            }
        }
    }
    ivrHandler.deleteIvr(ivrData, session, function(delRes){
        if (!delRes.success) {
            logger.app.error(err.stack);
            result.message = "delete announcement node failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        logger.app.info("Announcement node delete: [" + data.Exten + "] ");
        result.data = data;
        result.success = true;
        callback(result);
    });
}

function getAnnouncementExten(data, callback) {
    if (data.ServiceNo || data._id) {
        var queryDefault = {
            Account: data.Account,
            PBX: data.PBX
        }
        if (data.ServiceNo) {
            queryDefault.ServiceNo = data.ServiceNo;
        }
        if (data._id) {
            queryDefault._id = data._id;
        }
        mongo.db().collection(fields.DB_IVR_NODE_ANNOUNCEMENT).findOne(queryDefault, function (err, doc) {
            if (err) {
                logger.app.error(err.stack);
                callback(err);
                return;
            }
            if (!doc) {
                businessUtil.getIvrId(data.Account, function (err, announcementIdData) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, {Exten: announcementIdData.ivrId, isExists: false});
                });
            } else {
                callback(null, {Exten: doc.Exten, isExists: true, _id: doc._id}, true, doc._id);
            }
        });
    } else {
        businessUtil.getIvrId(data.Account, function (err, announcementIdData) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, {Exten: announcementIdData.ivrId, isExists: false});
        });
    }
}

exports.batchUpdateAnnouncement = function (data, session, callback) {
    var result = {success: false};
    if (data.AnnouncementIdArr) {
        var announcementId = data.AnnouncementIdArr.shift();
        exports.queryAnnouncement({'_id': announcementId}, session, function (queryResult) {
            if (!queryResult.success) {
                callback(queryResult);
                return;
            }
            if (queryResult.list && queryResult.list.length > 0) {
                var announcement = queryResult.list[0];
                for (var attr in data.updateData) {
                    announcement[attr] = data.updateData[attr];
                }
                announcement.Action = "AnnouncementAdd";
                var ivrData = {
                    nodeData: announcement,
                    dbData: {
                        tableName: fields.DB_IVR_NODE_ANNOUNCEMENT
                    }
                }
                ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                    if (err) {
                        result.success = false;
                        result.message = 'Update announcement failure: ' + announcement.Exten;
                        callback(result);
                        return;
                    }
                    if (data.AnnouncementIdArr.length > 0) {
                        exports.batchUpdateAnnouncement(data, session, callback);
                    } else {
                        result.success = true;
                        callback(result);
                    }
                });
            } else {
                exports.batchUpdateAnnouncement(data, session, callback);
            }
        });
    } else {
        result.success = true;
        callback(result);
    }
}