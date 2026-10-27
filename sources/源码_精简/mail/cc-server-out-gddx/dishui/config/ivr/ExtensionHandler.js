var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var util = require('util');
var logger = require('appLog');
var dateTimeUtil = require('appUtil/DateTime');
var IvrHandler = require(__baseDir+'/dishui/config/ivr/IvrHandler');
var busUtil = require('appUtil/BusinessUtil');
var config = require('appConfig').conf;
var http = require('appHttp');
var userHandler = require(__baseDir+'/dishui/config/ivr/UserHandler');

exports.querySip = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_EXTENSION_CONFIG).find(data, {sort:{Exten:-1}}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query sip failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

getIdleSipNo = function(callback){
    var result = {success: false};
    busUtil.getSipNum(null,function(err,nums){
        if(!err){
            //console.log('skno====='+num);
            if(nums != undefined && nums.length>=1){
                result.num = nums[0];
                result.success = true;
            }else{
                result.success = false;
                result.message = "free sipNos not enough!";
            }
            callback(result);
        }else{
            logger.app.error(err.stack);
            result.message = 'get free sipNos num exception!';
            callback(result);
        }
    });
};
exports.saveSip2Acs = function(data,session,callback){
    var result = {success:false};
    getIdleSipNo(function(res){
        if(res.success){
            var sipData = {};
            sipData.Account = data.Account;
            sipData.Exten = res.num;
            sipData.ExtenType = fields.EXTENSION_TYPE_SIP;
            sipData.Local = false;
            sipData.Qualify = true;
            sipData.PBX = data.PBX;
            sipData.Secret = busUtil.generatePassword(8,null);
            sipData.UserID = data.UserID;
            saveSip(sipData, session, function(err, returnData){
                if(err){
                    result.success = false;
                    result.message = err.message;
                    callback(result);
                    return;
                }
                result.sipNum = returnData.Exten;
                result.success = true;
                console.log('add sip sipPeer success!');
                callback(result);
            });
        }
    });
};

exports.saveGatewaySip = function(data, session,callback){
    var result = {success:false};
    getIdleSipNo(function(res){
        if(res.success){
            var sipData = {};
            sipData.Account = data.Account;
            sipData.Exten = res.num;
            sipData.ExtenType = fields.EXTENSION_TYPE_GATEWAY;
            sipData.Local = false;
            sipData.Qualify = true;
            sipData.PBX = data.PBX;
            if (data.Secret){
                sipData.Secret = data.Secret;
            } else {
                sipData.Secret = busUtil.generatePassword(8,null);
            }
            saveSip(sipData, session, function(err, returnData){
                if(err){
                    result.success = false;
                    result.message = err.message;
                    callback(result);
                    return;
                }
                result.data = returnData;
                result.success = true;
                console.log('add gateway sipPeer success: ' + data.Exten);
                callback(result);
            });
        }
    });
}

exports.saveLocalSip2Acs = function(data,session,callback){
    var result = {success:false};
    var isAdd = data.isAddLocalSip;
    delete data.isAddLocalSip;
    if(!isAdd){
        var isUpdateLocal = data.isUpdateLocal;
        if(isUpdateLocal){
            var findData = {
                _id: data.mobileExten
            }
            exports.querySip(findData, session, function(findSipRes){
                if(!findSipRes.success){
                    result.message = 'Local sip not found: ' + data.Exten;
                    callback(result);
                    return;
                }
                var oldSip = findSipRes.list[0];
                oldSip.UserName = data.Local;
                if(!data.Local){
                    oldSip.Local = false;
                } else {
                    oldSip.Local = true;
                }

                saveSip(oldSip, session, function(err){
                    if(err){
                        result.message = 'Update local sip failure: '+ util.inspect(oldSip);
                        callback(result);
                        return;
                    }
                    result.success = true;
                    callback(result);
                });
            });
        } else {
            result.success = true;
            callback(result);
        }
    }else{
        getIdleSipNo(function(res){
            if(res.success){
                var sipData = {};
                sipData.Account = data.Account;
                sipData.Exten = res.num;
                sipData.ExtenType = fields.EXTENSION_TYPE_LOCAL;
                sipData.UserName = data.Local;
                sipData.PBX = data.PBX;
                sipData.Local = true;
                sipData.Qualify = false;
                sipData.Secret = busUtil.generatePassword(8,null);
                sipData.UserID = data.UserID;

                saveSip(sipData, session, function(err, returnData){
                    if(!err){
                        result.localNum = sipData.Exten;
                        result.success = true;
                        console.log('add local sipPeer success!');
                        callback(result);
                    }else{
                        result.message = 'save local sipPeer to acs failed!';
                        callback(result);
                    }
                });
            }
        });
    }
};
function assginedSipNo(sipNo,data,callback){
    var result = {success : false};
    var updateDoc = {
        status:"using",
        account:data.Account,
        pbx:data.PBX,
        secret: data.Secret,
        type:data.ExtenType,
        user:data.UserID,
        product: 'cc',
        exten: sipNo
    }
    if(updateDoc.type == 'gateway'){
//        updateDoc.codes = [
//            "g729","alaw","ulaw","speex"
//        ]
        updateDoc.codes = ["g729"];
    }
    mongo.db('bill').collection(fields.DB_PLATFORM_SIPNUM).update({"_id":sipNo},
        {"$set" : updateDoc}, function (err, dbRes) {
            if (err) {
                logger.app.error(err.stack);
                result.success = false;
                result.message = "using sip exten for DB failure!";
            } else {
                result.success = true;
            }
            callback(result);
        }
    )

};

function saveSip(data, session, callback){
    data.Action = 'SipAdd';
    data.Nat = true;
    data['call-limit'] = 1;
    data.Canreinvite = false;
    data.Host = 'dynamic';
    //data.Update = false;
    data.Type = 'friend';
    data.DisplayName = 'sipper-'+data.Exten;
    data.Name = data.Exten;
    data.Context = data.Account;
//    data.Allow = 'g729,alaw,ulaw,speex';
    data.Allow = 'g729';
    data.status = 'using';
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    //data.UpdateUser = session.user._id;

    var ivrData = {
        nodeData : data,
        dbData : {
            tableName : fields.DB_APP_EXTENSION_CONFIG,
            condition : {"_id" : data.Exten}
        }
    };
    IvrHandler.saveOrUpdateIvr(ivrData,session,function(err,acsRes){
        if(!err){
            assginedSipNo(data.Exten, data, function(assignedRes){
                if(!assignedRes.success) {
                    callback(assignedRes);
                    return;
                }
                data._id = data.Exten;
                callback(null, data);
            });
        }else{
            logger.app.error(err.stack);
            callback(new Error('save sipPeer failed!'));
        }
    });
}

exports.batchAddGatewaySip = function (data, session, callback) {
    var result = {};
    result.success = true;
    result.code = 'sip.batchRequested';
    callback(result);

    data.Amount = parseInt(data.Amount);
    data.Secret = busUtil.generatePassword(8,null);
    if(data.IsSeries){
        delete data.IsSeries;
        exports.getSeriesSipNum(data.Amount,function(err,numList){
            if(!err){
                if(numList){
                    data.numList = numList.split('|');
                    exports.batchAddSeriesSip(data, session, function(err, sipSeriesList){
                        if (err) {
                            logger.app.error('Batch add Series sipNos exception!', err);
//                            result.success = false;
//                            result.message = err.message;
//                            callback(result);
//                            return;
                        }
                        IvrHandler.reloadIvr({PBX: session.user.pbx ,Account: session.user.account, Type:0}, session, function(reloadRes){});
                        logger.app.info('Batch add series sipNos success: ' + util.inspect(data));
//                        result.list = sipSeriesList;
//                        result.success = true;
//                        callback(result);
                    });
                }else{
                    logger.app.error('free sipNos not enough!', err);
//                    result.success = false;
//                    result.message = "free sipNos not enough!";
//                    callback(result);
                }
            }else{
                logger.app.error('get free sipNos num exception!', err);
//                result.message = 'get free sipNos num exception!';
//                callback(result);
            }
        });
    }else{
        recursionAddGatewaySip(data, session, function (err, sipList) {
            if (err) {
                logger.app.error(err);
//                result.success = false;
//                result.message = err.message;
//                callback(result);
//                return;
            }
            IvrHandler.reloadIvr({PBX: session.user.pbx ,Account: session.user.account, Type:0}, session, function(reloadRes){});
//            result.list = sipList;
//            result.success = true;
//            callback(result);

        });
    }
}

exports.batchAddSeriesSip = function(data, session, callback){
    data.errorSip = data.errorSip || '';
    if(!data.list){
        data.list = [];
    }
    if(data.numList && data.numList.length >0){
        data.Exten = data.numList.shift();
        exports.saveSeriesSip(data, session, function(result){
            if(!result.success){
                data.errorSip += data.Exten + ',';
//                    callback(new Error('Add gateway sip failure: ' + result.message));
//                    return;
            } else {
                data.list.push(result.data);
            }
            //process.nextTick(exports.batchAddSeriesSip(data, session, callback));
            exports.batchAddSeriesSip(data, session, callback);
        });
    } else {
        if (data.errorSip) {
            logger.app.error('Batch add series sip has some failure: ' + data.errorSip);
        }
        callback(null, data.list);
    }
}

exports.getSeriesSipNum = function(num,callback){
    num = num || 1;
    var url = config.serviceUrl+'?Action=getSeriesSipNum&num='+num;
    http.sendGet(url,function(err,res){
        if(!err && res){
            try{
                var res = JSON.parse(res);
                if(res.Succeed){
                    var firstNum = res.number;
                    callback(null,firstNum);
                }else{
                    callback(new Error('request service error!'));
                }
            }catch (e) {
                logger.request.error(e);
                callback(e);
            }
        }else{
            var error = err || new Error('request service error!');
            logger.request.error(error);
            callback(error);
        }
    });
}

function recursionAddGatewaySip(data, session, callback){
    if(!data.list){
        data.list = [];
    }
    if(data.Amount > 0) {
        exports.saveGatewaySip(data, session, function(result){
            if(!result.success){
                callback(new Error('Add gateway sip failure: ' + result.message));
                return;
            }
            data.list.push(result.data);
            data.Amount -= 1;
            recursionAddGatewaySip(data, session, callback);
        });
    } else {
        callback(null, data.list);
    }
}

exports.bindExten = function(data, callback){
    var result = {success:false};
    if(data.sip && data.userID){
        mongo.db().collection(fields.DB_APP_EXTENSION_CONFIG).update({"UserID":data.userID, ExtenType:'gateway'},
            {"$unset":{"UserID":1}}, {w:1, multi:true}, function (err, updateRes){
                // ignore err
                if (err) {
                    logger.app.error(err);
                }
                mongo.db('bill').collection(fields.DB_PLATFORM_SIPNUM).update({user:data.userID, ExtenType:'gateway'},
                    {"$unset" : {"user":1}}, function (err, dbRes) {
                        if (err) {
                            logger.app.error(err.stack);
                        }
                        mongo.db().collection(fields.DB_APP_EXTENSION_CONFIG).update({"_id":data.sip},
                            {"$set" : {"UserID":data.userID}}, function (err, dbRes) {
                                if (err) {
                                    logger.app.error(err);
                                    result.message = "using sip exten for DB failure!";
                                    callback(result);
                                } else {
                                    mongo.db('bill').collection(fields.DB_PLATFORM_SIPNUM).update({_id:data.sip},
                                        {"$set" : {"user":data.userID}}, function (err, dbRes) {
                                            if (err) {
                                                logger.app.error(err.stack);
                                                result.message = "using sip exten for DB failure!";
                                                callback(result);
                                            }
                                            userHandler.removeGatewaySipNum(data, null, function(removeSipResult) {
                                                // ignore err
                                                userHandler.addGatewaySipNum(data, null, function(addSipResult) {
                                                    // ignore err
                                                    result.success = true;
                                                    callback(result);
                                                });
                                            });
                                        }
                                    )
                                }
                            }
                        )
                    }
                )
            });
    } else {
        result.message = 'sip or userID not found';
        callback(result);
    }
}

exports.saveSeriesSip = function(data, session, callback){
    var result = {success:false};
    var Secret = data.Secret;
    var sipData = {};
    sipData.Account = data.Account;
    sipData.Exten = data.Exten;
    sipData.ExtenType = fields.EXTENSION_TYPE_GATEWAY;
    sipData.Local = false;
    sipData.Qualify = true;
    sipData.PBX = data.PBX;
    sipData.Secret = Secret;
    sipData.UserID = data._id;
    saveSip(sipData, session, function(err, returnData){
        if(err){
            result.success = false;
            result.message = err.message;
            callback(result);
            return;
        }
        result.data = returnData;
        result.success = true;
        console.log('add gateway sipPeer success: ' + data.Exten);
        callback(result);
    });
}

exports.advantageSearchSip = function(data, session, callback) {
    var result = {success:false};
    var typeSearch = [];
    if (data.sip) {
        typeSearch.push('sip');
    }
    delete data.sip;
    if (data.gateway) {
        typeSearch.push('gateway');
    }
    delete data.gateway;
    if (data.local) {
        typeSearch.push('Local');
    }
    delete data.local;
    if (typeSearch.length > 0) {
        data.ExtenType = {'$in':typeSearch};
    }

    exports.querySip(data, session, function(queryRes){
        if (!queryRes.success) {
            callback(queryRes);
            return;
        }
        result.success = true;
        result.list = queryRes.list;
        callback(result);
    });
}

exports.updateGatewayCodes = function(data, session, callback) {
    var result = {success:false};
    var queryData = {
        _id: data._id
    }
    exports.querySip(queryData, session, function(queryResult){
        if (!queryResult.success) {
            callback(queryResult);
            return;
        }
        if (queryResult.list.length < 1) {
            result.message = 'Sip not found.';
            callback(result);
            return;
        }
        var sip = queryResult.list[0];
        sip.Allow = data.Allow;
        if (data.Allow){
            sip.Allow = data.Allow;
        }
        if(data.Secret){
            sip.Secret = data.Secret;
        }
        sip.Action = 'SipAdd';
        var ivrData = {
            nodeData : sip,
            dbData : {
                tableName : fields.DB_APP_EXTENSION_CONFIG,
                condition : {"_id" : sip.Exten}
            }
        };
        IvrHandler.saveOrUpdateIvr(ivrData,session,function(err,acsRes){
            if(err){
                logger.app.error(err);
                result.message = 'save sipPeer to ACS failed!';
                callback(result);
                return;
            }
            IvrHandler.reloadIvr({PBX: session.user.pbx ,Account: session.user.account,Type:0}, session, function(reloadRes){});
            var updateDoc = {
                codes: data.codes
            }
            mongo.db('bill').collection(fields.DB_PLATFORM_SIPNUM).update({"_id":sip.Exten},
                {"$set" : updateDoc}, function (err, dbRes) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.success = false;
                        result.message = "using sip exten for DB failure!";
                    } else {
                        logger.app.info('Gateway sip codes updated to : ' + data.Allow);
                        result.success = true;
                        result.data = sip;
                    }
                    callback(result);
                }
            )
        });
    });
}

exports.billUpdateGatewayCodes = function(data, callback) {
    var result = {success:false};
    var queryData = {
        _id: data._id
    }
    exports.querySip(queryData, null, function(queryResult){
        if (!queryResult.success) {
            callback(queryResult);
            return;
        }
        if (queryResult.list.length < 1) {
            result.message = 'Sip not found.';
            callback(result);
            return;
        }
        var sip = queryResult.list[0];
        sip.Allow = data.Allow;
        if (data.Allow){
            sip.Allow = data.Allow;
        }
        if(data.Secret){
            sip.Secret = data.Secret;
        }
        sip.Action = 'SipAdd';
        var ivrData = {
            nodeData : sip,
            dbData : {
                tableName : fields.DB_APP_EXTENSION_CONFIG,
                condition : {"_id" : sip.Exten}
            }
        };
        IvrHandler.saveOrUpdateIvr(ivrData,null,function(err,acsRes){
            if(err){
                logger.app.error(err);
                result.message = 'save sipPeer to ACS failed!';
                callback(result);
                return;
            }
            var updateDoc = {};
            if(!data.codes){
                var codeList = data.Allow.split(',');
                updateDoc.codes = codeList;
            }else{
                updateDoc.codes = data.codes;
            }
            if(data.Secret){
                updateDoc.secret=data.Secret;
            }
            mongo.db('bill').collection(fields.DB_PLATFORM_SIPNUM).update({"_id":sip.Exten},
                {"$set" : updateDoc}, function (err, dbRes) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.success = false;
                        result.message = "using sip exten for DB failure!";
                    } else {
                        logger.app.info('Gateway sip codes updated to : ' + data.Allow);
                        result.success = true;
                        result.data = sip;
                    }
                    callback(result);
                }
            )
        });
    });
}

exports.queryAllSipForIvrTools = function(data, session, callback){
    var result = {success: false};

    mongo.db().collection(fields.DB_APP_EXTENSION_CONFIG).find(data).sort({Exten: 1}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query allSip failure";
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

/**
 * 保存sip号方法，不入库操作
 * @param data
 * @param session
 * @param callback
 */
exports.saveSip = function(data, session, callback){
    var result = {success:false};

    data.Action = 'SipAdd';
    data.Nat = true;
    data['call-limit'] = 1;
    data.Canreinvite = false;
    data.Host = 'dynamic';
    //data.Update = false;
    data.Type = 'friend';
    data.DisplayName = 'sipper-'+data.Exten;
    data.Name = data.Exten;
    data.Context = data.Account;
//    data.Allow = data.Allow;
    data.status = 'using';
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    //data.UpdateUser = session.user._id;
    data.UpdateUser = "";
    var ivrData = {
        nodeData : data,
        isStoreDB: false
    };
    IvrHandler.saveOrUpdateIvr(ivrData,session,function(err){
        if(!err){
            result.success = true;
            result.data = data;
            callback(result);
            return;
        }else{
            logger.app.error(err.stack);
            callback(new Error('save sipPeer failed!'));
            callback(result);
            return;
        }
    });
}

exports.bindGatewayUserExten = function(data, session, callback) {
    var result = {success:false};
    var ivrData = {
        nodeData : {Action: 'SipPeerBind', Account:session.account.account ,PBX:data.PBX ,Exten:data._id ,User:data.UserID},
        isStoreDB: false
    };
    IvrHandler.saveOrUpdateIvr(ivrData,session,function(err,acsRes){
        if(!err){
            var bindData = {
                accountId: session.account._id,
                sip: data._id,
                userID: data.UserID,
                pbx: data.PBX
            }
            exports.bindExten(bindData, function(res){
                if(res.success){
                    result.success = true;
                    result.data = data;
                }else{
                    result.success = false;
                }
                callback(result);
            })
        }else{
            logger.app.error(err.stack);
            callback(new Error('save bindGatewayUserExten failed!'));
            callback(result);
            return;
        }
    });
}