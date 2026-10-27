var logger = require("appLog");
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var fields = require(__baseDir + '/dishui/common/Fields');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var numHandler = require(__baseDir + '/dishui/config/ivr/NumHandler');

exports.saveRedNum = function(data, session, callback){
    var result = {success: false};
    var numId = '';
    if (data._id) {
        numId = data._id;
    } else {
        numId = uuid.generateRandomId();
    }
    data.Num = data.BlackNum;
    delete data["_id"];
    mongo.db().collection(fields.DB_IVR_BLACK_LIST).find({Type: '0',Account:session.user.account}).toArray(function(err,docs){
        if (err) {
            callback(err);
            return;
        }
        var endList = [];
        var isHas = false;
        for(var i=0 ;i<docs.length ; i++){
            endList.push(docs[i].Num);
            if(docs[i].Num == data.Num){
                isHas = true;
            }
        }
        if(!isHas){
            endList.push(data.Num);
        }
        var ivrData = {
            nodeData : {
                Action : "RedListAdd",
                PBX : data.PBX,
                Account : session.user.account,
                List : endList.join(',')
            },
            isStoreDB : false
        }
        ivrHandler.saveOrUpdateIvr(ivrData, session, function(err){
            if (err) {
                result.success = false;
                result.message = 'addOrupdate redlist failure: ' + data.Num;
                callback(result);
                return;
            }
            mongo.db().collection(fields.DB_IVR_BLACK_LIST).update({_id: numId}, {"$set": data}, {upsert: true},function(err){
                if (err) {
                    callback(err);
                    return;
                }
                data._id = numId;
                result.data = data;
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.saveInBlackNum = function(data, session, callback){
    var result = {success: false};
    if (!data._id) {
        data._id = uuid.generateRandomId();
    }
    data.Num = data.BlackNum;
    exports.queryBlackNum({_id :{$ne:data._id} ,Account: data.Account, PBX: data.PBX, Type: data.Type}, session, function(blackRes){
        if (!blackRes.success) {
            callback(new Error(blackRes.message));
            return;
        }
        var assData = blackRes.list;
        assData.push(data)
        numHandler.queryBlackListNode ({Account : data.Account, PBX : data.PBX}, session, function(blackNodeRes){
            if (!blackNodeRes.success) {
                callback(new Error(blackNodeRes.message));
                return;
            }
            var blackNodes = {
                list : blackNodeRes.data,
                currentData : data,
                assData : assData
            }
            exports.batchUpdateBlackNum(blackNodes, session, function (updateRes) {
                if (!updateRes.success) {
                    callback(new Error(updateRes.message));
                    return;
                }
                result.data = blackNodes.currentData;
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.saveOutBlackNum = function(data, session, callback){
    var result = {success: false};
    delete data['Type'];
    data.Num = data.BlackNum;
    exports.queryBlackNum({"_id":data._id}, session, function (blackRes){
        if (!blackRes.success) {
            callback(new Error(blackRes.message));
            return;
        }
        if (blackRes.list.length == 0){
            data._id = uuid.generateRandomId();
            data.oldNum = null;
            var ivrData = {
                nodeData : data,
                dbData : {
                    tableName : fields.DB_IVR_BLACK_LIST
                }
            }
            ivrData.nodeData.Type = 'DialoutBlackList';
            ivrData.nodeData.Action = 'PeerAdd';
            ivrData.nodeData.Peer = 'NumManage';
            ivrHandler.saveOrUpdateIvr(ivrData, session, function(err){
                if(err){
                    result.success = false;
                    result.reason = 500;
                    callback(result);
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        }else{
            data.oldNum = blackRes.list[0].BlackNum;
            var ivrData = {
                nodeData : data,
                dbData : {
                    tableName : fields.DB_IVR_BLACK_LIST
                }
            }
            ivrData.nodeData.Type = 'DialoutBlackList';
            ivrData.nodeData.Action = 'PeerAdd';
            ivrData.nodeData.Peer = 'NumManage';
            ivrHandler.saveOrUpdateIvr(ivrData, session, function(err){
                if(err){
                    result.success = false;
                    result.reason = 500;
                    callback(result);
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        }

    });
}

exports.saveBlackList = function (data, session, callback) {
    var result = {success : false};
    data.Account = session.user.account;
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    data.UpdateUser = session.user._id;
    exports.isChangeType(data, session, function(changeRes){
        if (!changeRes.success){
            callback(new Error(changeRes.message));
            return;
        }
        if (data.Type == '2') {
            exports.saveOutBlackNum(data, session, function(outBlackNumRes){
                if (!outBlackNumRes.success){
                    callback(new Error(outBlackNumRes.message));
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        } else if (data.Type == '0') {
            exports.saveRedNum(data, session, function(redNumRes){
                if (!redNumRes.success){
                    callback(new Error(redNumRes.message));
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            });
        } else if (data.Type == '1') {
            exports.saveInBlackNum(data, session, function(InBlackRes){
                if (!InBlackRes.success){
                    callback(new Error(InBlackRes.message));
                    return;
                }
                result.data = data;
                result.success = true;
                callback(result);
            })
        }
    });
}

exports.isChangeType = function(data, session, callback){
    var result = {success: false};
    if (data._id){
        mongo.db().collection(fields.DB_IVR_BLACK_LIST).findOne({'_id': data._id}, function(err, doc){
            if (err){
                err = err || new Error('find black[' + data._id + "] fail!");
                logger.app.error(err.stack);
                result.message = err.message;
                callback(result);
                return;
            }
            if (doc){
                if (doc.Type == data.Type){
                    result.success = true;
                    callback(result);
                }else{
                    exports.delBlackNum(doc, session, function(delOldRes){
                        if (!delOldRes.success){
                            result.message = "del black type" + doc.Type + "black num" + doc.BlackNum+ " failure";
                            result.success = false;
                            callback(result);
                            return;
                        }
                        result.success = true;
                        callback(result);
                    })
                }
            }else{
                result.success = false;
                result.message = 'can not find blacklist:' + data._id;
            }
        })
    }else{
        result.success = true;
        callback(result);
    }
}

exports.batchUpdateBlackNum = function (data, session, callback) {
    var result = {success : false};
    if (data.list && data.list.length > 0) {
        var blackNode = data.list.shift();
        var ivrData = {
            nodeData : blackNode,
            currentData : data.currentData,
            dbData : {
                tableName : fields.DB_IVR_BLACK_LIST
            }
        }
        var blacknumList = '';
        for (var i = 0; i < data.assData.length; i++) {
            blacknumList += data.assData[i].BlackNum + ",";
        }
        ivrData.nodeData.list = blacknumList.substr(0, blacknumList.length - 1);
        ivrData.nodeData.Action = "BlackListAdd";
        ivrHandler.saveOrUpdateIvr(ivrData, session, function(err){
            if (err) {
                result.success = false;
                result.message = 'addOrupdate blacklist failure: ' + blackNode.Exten;
                callback(result);
                return;
            }
            if (data.list.length > 0) {
                exports.batchUpdateBlackNum(data, session, callback);
            } else {
                result.data = data.currentData;
                result.success = true;
                callback(result);
            }
        });
    }
}

exports.batchDelBlackNum = function (data, session, callback) {
    var result = {success : false};
    if (data.list && data.list.length > 0) {
        var blackNode = data.list.shift();
        var ivrData = {
            isStoreDB: false,
            nodeData : blackNode
        }
        var blacknumList = '';
        for (var i = 0; i < data.assData.length; i++) {
            blacknumList += data.assData[i].BlackNum + ",";
        }
        ivrData.nodeData.list = blacknumList.substr(0, blacknumList.length - 1);
        ivrData.nodeData.Action = "BlackListAdd";
        ivrHandler.deleteIvr(ivrData, session, function(ivrRes){
            if (!ivrRes.success) {
                result.success = false;
                result.message = 'Delete schedule in serviceNo failure: ' + data.Exten;
                callback(result);
                return;
            }
            if (data.list.length > 0) {
                exports.batchDelBlackNum(data, session, callback);
            } else {
                var condition = {
                    Account: data.currentData.Account,
                    PBX: data.currentData.PBX,
                    _id: data.currentData._id
                }
                mongo.db().collection(fields.DB_IVR_BLACK_LIST).remove(condition, {w: 1}, function (err) {
                    if (err) {
                        result.success = true;
                        callback(result);
                        return;
                    }
                    result.success = true;
                    callback(result);
                });
            }
        });
    }
}

exports.isExist = function (data, session, callback) {
    var result= {success : false};
    exports.queryBlackNum(data, session, function(blackResult){
        if (!blackResult.success) {
            callback(new Error(blackResult.message));
            return;
        }
        if (blackResult.list.length > 0) {
            result.isExist = true;
            result.success = true;
            callback(result);
        } else {
            result.isExist = false;
            result.success = true;
            callback(result);
        }
    });
}

exports.queryBlackNum = function (data, session, callback) {
    data.Account = session.user.account;
    var result= {success : false};
    var sort = {UpdateTime : -1}
    mongo.db().collection(fields.DB_IVR_BLACK_LIST).find(data).sort(sort).toArray(function(err, docs){
        if(!err){
            result.list = docs;
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err.stack);
            result.message = 'Query back number failure: ' + util.inspect(data);
            result.success = false;
            callback(result);
        }
    });
}

exports.getInBlackListDic = function (session, callback){
    exports.queryBlackNum({Type:'1'},session,function(res){
        if(res.success){
            callback(null,res.list || []);
        }else{
            callback(null,[]);
        }
    })
}

exports.delRedNum = function(data, session, callback){
    var result = {success: false};
    var find = {Type: '0', Account:session.user.account, _id:{$ne:data._id}};
    mongo.db().collection(fields.DB_IVR_BLACK_LIST).find(find).toArray(function(err,docs){
        if (err) {
            callback(err);
            return;
        }
        var endList = [];
        for(var i=0 ;i<docs.length ; i++){
            endList.push(docs[i].Num);
        }
        var ivrData = {
            nodeData : {
                Action : "RedListAdd",
                PBX : data.PBX,
                Account : session.user.account,
                List : endList.join(',')
            },
            isStoreDB : false
        }
        if(endList.length == 0){
            ivrData.nodeData.List = null;
        }
        ivrHandler.saveOrUpdateIvr(ivrData, session, function(err){
            if (err) {
                result.success = false;
                result.message = 'addOrupdate redlist failure: ' + data.Num;
                callback(result);
                return;
            }
            mongo.db().collection(fields.DB_IVR_BLACK_LIST).remove({"_id": data._id}, {w: 1}, function (err) {
                if (err) {
                    result.success = false;
                    callback(result);
                    return;
                }
                result.success=true;
                callback(result);
            });
        });
    });
}

exports.delInBLackNum = function(data, session, callback){
    var result = {success: false};
    exports.queryBlackNum({Account: data.Account, PBX: data.PBX, Type: data.Type}, session, function(blackRes){
        if (!blackRes.success) {
            callback(new Error(blackRes.message));
            return;
        }
        var assData = blackRes.list;
        for (var i = 0; i < assData.length; i++) {
            if (assData[i].BlackNum == data.BlackNum) {
                assData = assData.slice(0, i).concat(assData.slice(i+1, assData.length));
            }
        }
        numHandler.queryBlackListNode ({Account : data.Account, PBX : data.PBX}, session, function(blackNodeRes){
            if (!blackNodeRes.success) {
                callback(new Error(blackNodeRes.message));
                return;
            }
            var blackNodes = {
                list : blackNodeRes.data,
                currentData : data,
                assData : assData
            }
            exports.batchDelBlackNum(blackNodes, session, function (updateRes) {
                if (!updateRes.success) {
                    callback(new Error(updateRes.message));
                    return;
                }
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.delOutBlackNum = function(data, session, callback){
    var result = {success: false};
    data.Exten = data.BlackNum;
    var ivrData = {
        nodeData : data,
        dbData : {
            tableName : fields.DB_IVR_BLACK_LIST,
            condition: {
                Account: data.Account,
                PBX: data.PBX,
                BlackNum: data.Exten
            }
        }
    }
    ivrData.nodeData.Action = "PeerRemove";
    ivrData.nodeData.Peer = "DialoutBlackList";
    ivrHandler.deleteIvr(ivrData, session, function(ivrRes){
        if (!ivrRes.success) {
            result.success = false;
            result.message = 'Delete schedule in serviceNo failure: ' + data.Exten;
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });
}

exports.delBlackNum = function (data, session, callback) {
    var result = {success : false};
    data.Account = session.user.account;
    if (data.Type == '0') {
        exports.delRedNum(data, session, function(redNumRes){
            if (!redNumRes.success){
                callback(new Error(redNumRes.message));
                return;
            }
            result.data = data;
            result.success = true;
            callback(result);
        });
    } else if (data.Type == '1') {
        exports.delInBLackNum(data, session, function(inBlackNumRes){
            if (!inBlackNumRes.success){
                callback(new Error(inBlackNumRes.message));
                return;
            }
            result.data = data;
            result.success = true;
            callback(result);
        });
    } else if (data.Type == '2') {
        exports.delOutBlackNum(data, session, function(outBlackNumRes){
            if (!outBlackNumRes.success){
                callback(new Error(outBlackNumRes.message));
                return;
            }
            result.data = data;
            result.success = true;
            callback(result);
        });
    }
}

exports.isRedNum = function(data, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_BLACK_LIST).findOne(data, function(err, doc){
        if (err){
            logger.app.error(err.stack);
            result.message = 'Query vip number failure: ' + util.inspect(data);
            result.success = false;
            callback(result);
        }
        if (doc){
            result.success = true;
            callback(result);
        }else{
            result.success = false;
            callback(result);
        }
    })
}