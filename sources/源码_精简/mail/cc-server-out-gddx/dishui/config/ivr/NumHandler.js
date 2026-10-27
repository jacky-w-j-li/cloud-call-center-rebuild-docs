var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var uuid = require('appUtil/UUID');
var businessUtil = require('appUtil/BusinessUtil');
var dateTimeUtil = require('appUtil/DateTime');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var scheduleHandler = require(__baseDir + '/dishui/config/ivr/ScheduleHandler');

var _BLACK_LIST_NODE_DEFAULT_TYPE = '1';
exports.isDefaultBlackListNodeExists = function(data, session, callback) {
    exports.queryBlackListNode({Account: data.Account, PBX: data.PBX, Type: _BLACK_LIST_NODE_DEFAULT_TYPE}, session, function(queryResult){
        if (!queryResult.success){
            callback(new Error(queryResult.message));
            return;
        }
        if (queryResult.data.length < 1) {
            exports.initDefaultBlackListNode(data, function(){

            });
        } else {
            callback(null);
        }
    });
};

exports.initDefaultBlackListNode = function(data, session, callback){
    var queryFirstSchedule = {
        Account : data.Account,
        PBX : data.PBX,
        ServiceNo : data.Exten
    }
    scheduleHandler.getNextSchedule(queryFirstSchedule, session, function(err, scheduleData){
        if(err){
            callback(err);
            return;
        }

        getBlackListNodeExten(data, function(err, extenData){
            if(err){
                callback(err);
                return;
            }
            var blackListData = {
                Account : data.Account,
                PBX : data.PBX,
                Exten : extenData.Exten,
                ServiceNo : data.Exten,
                MatchedPeer : "",
                UnmatchedPeer : scheduleData.Exten,
                Style : '1',
                DisplayName: data.Exten+'默认黑名单'
            }
            if(!extenData.isExist){
                blackListData._id = uuid.generateRandomId();
            } else {
                blackListData._id = extenData._id;
            }

            exports.addOrUpdateBlackListNode(blackListData, session, function(listNodeRes){
                if(!listNodeRes.success){
                    callback(listNodeRes.err);
                    return;
                }
                logger.app.info(data.Account + " [" + data.PBX + "] " + " blacklist node  created:" + data.Exten);
                callback(null, blackListData);
            });
        });
    });
};

exports.addOrUpdateBlackListNode = function(data, session, callback){
    var result = {success: false};
    data.Action = "BlackListAdd";
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    data.UpdateUser = session.user._id;
    var ivrData = {
        nodeData : data,
        dbData : {
            tableName : fields.DB_IVR_NODE_BLACK_LIST,
            condition : {
                Account: data.Account,
                PBX : data.PBX,
                ServiceNo: data.ServiceNo,
                _id: data._id
            }
        }
    };
    ivrHandler.saveOrUpdateIvr(ivrData, session, function(err){
        if (err) {
            result.err = err;
            callback(result);
            return;
        }
        result.success = true;
        callback(result, ivrData);
    });

};

exports.queryBlackListNode = function(data, session, callback) {
    mongo.db().collection(fields.DB_IVR_NODE_BLACK_LIST).find(data).toArray(function (err, docs) {
        var result = {success: false};
        if (!err) {
            result.data = docs;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err.stack);
            result.message = 'Query black list node failure!';
            callback(result);
        }
    });
}

exports.deleteBlackListNode = function(data, session, callback){
    //todo
    var result = {success:false};
    getBlackListNodeExten(data,function(err,doc){
        if(err){
            callback(result);
            return;
        }
        var blIvrData = {
            Action : "PeerRemove",
            Peer : "blacklist",
            Exten : doc.Exten,
            Account : data.Account,
            PBX : data.PBX
        }
        var ivrData = {
            nodeData : blIvrData,
            dbData : {
                tableName : fields.DB_IVR_NODE_BLACK_LIST,
                condition : {"Account":data.Account , "PBX" : data.PBX, "Exten" : doc.Exten}
            }
        }
        ivrHandler.deleteIvr(ivrData,session,function(ivrRes){
            if(!ivrRes.success){
               callback(result);
               return;
            }
            result.success=true;
            callback(result);
        })
    });
}

/**
 *
 * @param data
 * @param session
 * @param callback
 */
exports.checkBlackListNodeUnmatchPeer = function(data, session, callback) {
    var result = {success: false};
    var blacklistData = {
        Account: data.Account,
        PBX: data.PBX,
        ServiceNo: data.ServiceNo
    }
    exports.queryBlackListNode(blacklistData, session, function(blackListRes){
        if(!blackListRes.success) {
            result.success = false;
            result.message = 'After edit schedule,should check if black list node unmatcher peer to this scheule, ' +
                'but query black list node failure!';
            callback(result);
            return;
        }
        if (!blackListRes.data || blackListRes.data.length < 1){
            result.success = true;
            callback(result);
            return;
        }
        var blackListNode = blackListRes.data[0];
        var scheduleQueryData = {
            Account: data.Account,
            PBX: data.PBX,
            ServiceNo: data.ServiceNo
        }
        scheduleHandler.getNextSchedule(scheduleQueryData, session, function(err, scheduleData){
            if(err) {
                result.message = 'Get max order of schedule failure.';
                result.success = false;
                callback(result);
                return;
            }
            if(scheduleData && blackListNode.UnmatchedPeer != scheduleData.Exten){
                blackListNode.UnmatchedPeer = scheduleData.Exten;
                exports.addOrUpdateBlackListNode(blackListNode, session, function(listNodeRes){
                    if(!listNodeRes.success){
                        result.message = 'Update black list node unmatch peer to new schedule failure: ' +scheduleData.Exten;
                        result.success = false;
                        callback(result);
                        return;
                    }
                    result.success = true;
                    result.data = data;
                    callback(result);
                    return;
                });
            } else {
                result.success = true;
                result.data = data;
                callback(result);
            }
        });
    });
}

function getBlackListNodeExten(data, callback){
    var query = {
        Account: data.Account,
        PBX: data.PBX,
        ServiceNo: data.Exten
    }
    mongo.db().collection(fields.DB_IVR_NODE_BLACK_LIST).findOne(query, function (err, doc) {
        if (err) {
            logger.app.error(err.stack);
            callback(err);
            return;
        }
        if(!doc){
            businessUtil.getIvrId(data.Account, function(err, idData){
                if(err){
                    callback(err);
                    return;
                }
                callback(null, {Exten: idData.ivrId, isExist: false});
            });
        } else {
            callback(null, {Exten: doc.Exten, isExist: true, _id: doc._id});
        }
    });
}