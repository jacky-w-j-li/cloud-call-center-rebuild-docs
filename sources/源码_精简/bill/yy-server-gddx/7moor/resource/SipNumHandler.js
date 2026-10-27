var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var appHttp = require('appHttp');
var config = require('appConfig');

var handler = {
    querySipNum: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        var userCondition = {};
        if (data.userName) userCondition.displayName = new RegExp(data.userName);
        if (data.userExten) userCondition.exten = data.userExten;

        if (data.userName || data.userExten) {
            delete data.userName;
            delete data.userExten;
            mongo.db().collection(constants.DB.platform_user).distinct("_id", userCondition, function (err, ids) {
                ids = ids || [];
                data.user = {$in: ids}
                mongo.db().collection(constants.DB.platform_sipNum).count(data, function (err, count) {
                    if (!err) {
                        result.count = count;
                        mongo.db().collection(constants.DB.platform_sipNum).find(data, {sort: {_id: -1}, limit: limit, skip: skip}).toArray(function (err, sipNums) {
                            if (!err) {
                                sipNums = sipNums || [];
                                var accountIds = [];
                                var userIds = [];
                                for (var i = 0; i < sipNums.length; i++) {
                                    if (sipNums[i].account) accountIds.push(sipNums[i].account);
                                    if (sipNums[i].user) userIds.push(sipNums[i].user);
                                }
                                mongo.db().collection(constants.DB.platform_account).find({_id: {$in: accountIds}}, {fields: {_id: 1, companyName: 1}}).toArray(function (err, accounts) {
                                    if (!err) {
                                        accounts = accounts || [];
                                        sipNums = utils.ObjectUtil.linkObjects(sipNums, accounts, {account: "_id"}, "accountData");
                                        mongo.db().collection(constants.DB.platform_user).find({_id: {$in: userIds}}, {fields: {_id: 1, displayName: 1}}).toArray(function (err, users) {
                                            if (!err) {
                                                users = users || [];
                                                sipNums = utils.ObjectUtil.linkObjects(sipNums, users, {user: "_id"}, "userData");
                                                result.success = true;
                                                result.list = sipNums;
                                                callback(result);
                                            } else {
                                                logger.app.warn("querySipNum link user error", err);
                                                result.message = "查询sip号关联用户信息异常！";
                                                callback(result);
                                            }
                                        });
                                    } else {
                                        logger.app.warn("querySipNum link account error", err);
                                        result.message = "查询sip号关联账户信息异常！";
                                        callback(result);
                                    }
                                });
                            } else {
                                logger.app.warn("querySipNum list error", err);
                                result.message = "查询sip号信息异常！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("querySipNum count error", err);
                        result.message = "查询sip号信息异常！";
                        callback(result);
                    }
                });
            });
        } else {
            mongo.db().collection(constants.DB.platform_sipNum).count(data, function (err, count) {
                if (!err) {
                    result.count = count;
                    mongo.db().collection(constants.DB.platform_sipNum).find(data, {sort: {_id: -1}, limit: limit, skip: skip}).toArray(function (err, sipNums) {
                        if (!err) {
                            sipNums = sipNums || [];
                            var accountIds = [];
                            var userIds = [];
                            for (var i = 0; i < sipNums.length; i++) {
                                if (sipNums[i].account) accountIds.push(sipNums[i].account);
                                if (sipNums[i].user) userIds.push(sipNums[i].user);
                            }
                            mongo.db().collection(constants.DB.platform_account).find({_id: {$in: accountIds}}, {fields: {_id: 1, companyName: 1}}).toArray(function (err, accounts) {
                                if (!err) {
                                    accounts = accounts || [];
                                    sipNums = utils.ObjectUtil.linkObjects(sipNums, accounts, {account: "_id"}, "accountData");
                                    mongo.db().collection(constants.DB.platform_user).find({_id: {$in: userIds}}, {fields: {_id: 1, displayName: 1}}).toArray(function (err, users) {
                                        if (!err) {
                                            users = users || [];
                                            sipNums = utils.ObjectUtil.linkObjects(sipNums, users, {user: "_id"}, "userData");
                                            result.success = true;
                                            result.list = sipNums;
                                            callback(result);
                                        } else {
                                            logger.app.warn("querySipNum link user error", err);
                                            result.message = "查询sip号关联用户信息异常！";
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.warn("querySipNum link account error", err);
                                    result.message = "查询sip号关联账户信息异常！";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.warn("querySipNum list error", err);
                            result.message = "查询sip号信息异常！";
                            callback(result);
                        }
                    });
                } else {
                    logger.app.warn("querySipNum count error", err);
                    result.message = "查询sip号信息异常！";
                    callback(result);
                }
            });
        }


    },
    querySipNumByUcenter: function (data, session, callback) {
        var result = {success: false};
        var aid=session.account._id;
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if(!data.account)data.account=aid;
        data.type="gateway";
        utils.removeEmptyProperty(data);
        if (data.userExten) {
            var userCondition = {};
            userCondition.account = aid;
            userCondition.exten = data.userExten;
            delete data.userExten;
            mongo.db().collection(constants.DB.platform_user).distinct("_id", userCondition, function (err, ids) {
                ids = ids || [];
                data.user = {$in: ids}
                mongo.db().collection(constants.DB.platform_sipNum).count(data, function (err, count) {
                    if (!err) {
                        result.count = count;
                        mongo.db().collection(constants.DB.platform_sipNum).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, sipNums) {
                            if (!err) {
                                sipNums = sipNums || [];
                                var userIds = [];
                                var pbxIds = [];
                                var pbxsMap = {};
                                for (var i = 0; i < sipNums.length; i++) {
                                    if (sipNums[i].user) userIds.push(sipNums[i].user);
                                    if (sipNums[i].pbx) pbxsMap[sipNums[i].pbx] = sipNums[i].pbx;
                                }
                                mongo.db().collection(constants.DB.platform_user).find({_id: {$in: userIds}}, {fields: {_id: 1, displayName: 1}}).toArray(function (err, users) {
                                    if (!err) {
                                        users = users || [];
                                        sipNums = utils.ObjectUtil.linkObjects(sipNums, users, {user: "_id"}, "userData");
                                        var pbxTableName = constants.DB.platform_pbx;
                                        if(data.product == 'cc'){
                                            pbxTableName = constants.DB.platform_cc_pbx;
                                        }
                                        for(one in pbxsMap){
                                            pbxIds.push(one);
                                        }
                                        mongo.db().collection(pbxTableName).find({_id: {$in: pbxIds}}, {fields: {_id: 1, sipAddr: 1}}).toArray(function (err, pbxs) {
                                            if (!err) {
                                                pbxs = pbxs || [];
                                                sipNums = utils.ObjectUtil.linkObjects(sipNums, pbxs, {pbx: "_id"}, "pbxData");
                                                exports.getSipStatusFromAss({account:aid,pbx:pbxIds,product:data.product},session,function(statusList){
                                                    if(statusList.success){
                                                        sipNums = utils.ObjectUtil.linkObjects(sipNums, statusList.data, {_id: "exten"}, "sipStatus");
                                                    }
                                                    result.success = true;
                                                    result.list = sipNums;
                                                    callback(result);
                                                });
                                            } else {
                                                logger.app.warn("querySipNum link user error", err);
                                                result.message = "查询sip号关联pbx信息异常！";
                                                callback(result);
                                            }
                                        });
                                    } else {
                                        logger.app.warn("querySipNum link user error", err);
                                        result.message = "查询sip号关联用户信息异常！";
                                        callback(result);
                                    }
                                });
                            } else {
                                logger.app.warn("querySipNum list error", err);
                                result.message = "查询sip号信息异常！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("querySipNum count error", err);
                        result.message = "查询sip号信息异常！";
                        callback(result);
                    }
                });
            });
        } else {
            mongo.db().collection(constants.DB.platform_sipNum).count(data, function (err, count) {
                if (!err) {
                    result.count = count;
                    mongo.db().collection(constants.DB.platform_sipNum).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, sipNums) {
                        if (!err) {
                            sipNums = sipNums || [];
                            var userIds = [];
                            var pbxIds = [];
                            var pbxsMap = {};
                            for (var i = 0; i < sipNums.length; i++) {
                                if (sipNums[i].user) userIds.push(sipNums[i].user);
                                if (sipNums[i].pbx) pbxsMap[sipNums[i].pbx] = sipNums[i].pbx;
                            }
                            mongo.db().collection(constants.DB.platform_user).find({_id: {$in: userIds}}, {fields: {_id: 1, displayName: 1}}).toArray(function (err, users) {
                                if (!err) {
                                    users = users || [];
                                    sipNums = utils.ObjectUtil.linkObjects(sipNums, users, {user: "_id"}, "userData");
                                    var pbxTableName = constants.DB.platform_pbx;
                                    if(data.product == 'cc'){
                                        pbxTableName = constants.DB.platform_cc_pbx;
                                    }
                                    for(one in pbxsMap){
                                        pbxIds.push(one);
                                    }
                                    mongo.db().collection(pbxTableName).find({_id: {$in: pbxIds}}, {fields: {_id: 1, sipAddr: 1}}).toArray(function (err, pbxs) {
                                        if (!err) {
                                            pbxs = pbxs || [];
                                            sipNums = utils.ObjectUtil.linkObjects(sipNums, pbxs, {pbx: "_id"}, "pbxData");
                                            exports.getSipStatusFromAss({account:aid,pbx:pbxIds,product:data.product},session,function(statusList){
                                                if(statusList.success){
                                                    sipNums = utils.ObjectUtil.linkObjects(sipNums, statusList.data, {_id: "exten"}, "sipStatus");
                                                }
                                                result.success = true;
                                                result.list = sipNums;
                                                callback(result);
                                            });
                                        } else {
                                            logger.app.warn("querySipNum link user error", err);
                                            result.message = "查询sip号关联pbx信息异常！";
                                            callback(result);
                                        }
                                    });
                                } else {
                                    logger.app.warn("querySipNum link user error", err);
                                    result.message = "查询sip号关联用户信息异常！";
                                    callback(result);
                                }
                            });
                        } else {
                            logger.app.warn("querySipNum list error", err);
                            result.message = "查询sip号信息异常！";
                            callback(result);
                        }
                    });
                } else {
                    logger.app.warn("querySipNum count error", err);
                    result.message = "查询sip号信息异常！";
                    callback(result);
                }
            });
        }
    },
    updateSipNum: function (data, session, callback) {
        var result = {success: false};
        var code = data.codeConfig.code;
        var secret = data.secret;
        var isFax = data.isFax;
        if (code && !utils.ObjectUtil.isArray(code)) {
            code = [code];
        }
        var _id = data._id;
        mongo.db().collection(constants.DB.platform_sipNum).findOne({_id: _id}, function (err, dbSipNum) {
            if (dbSipNum) {
                var product=dbSipNum.product;
                var collection=constants.DB.platform_pbx;
                if(product=='cc'){
                    //                http://localhost:4000/service?action=updateGatewaySipNoCodes&data={%22_id%22:%2220000830%22,%22Allow%22:%22g729,alaw%22,%22Secret%22:%22123456%22}
                    var param={
                        _id:_id,
                        Allow:code.join(","),
                        Secret:secret
                    }
                    logger.app.info("debug:"+JSON.stringify(param))
                    var url = config.ccServerUrl+"service?action=updateGatewaySipNoCodes&data=" + JSON.stringify(param);
                    url=encodeURI(url);
		    logger.app.info(url)
                    appHttp.sendGet(url,function(err,res){
			logger.app.info("debug:"+JSON.stringify(res));
                        if(!err && res){
                            try{
                                var res = JSON.parse(res);
                                if(res.success){
                                    callback(res);
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
                }else{
                    mongo.db().collection(collection).findOne({_id:dbSipNum.pbx},function(err,dbPbx){
                        if(dbPbx){
                            var url = dbPbx.configAddr;
                            var postData = {
                                Command : "Action",
                                Action: "GatewaySipsUpdate",
                                ActionID : utils.UUID.generateUuid(),
                                sipNo : _id,
                                isFax:isFax,
                                codecs : code,
                                account : dbSipNum.account,
                                pbx : dbSipNum.pbx,
                                secret : secret
                            };
                            appHttp.sendPost(url, postData, function (err, data) {
                                if (!err) {
                                    data = JSON.parse(data + "");
                                    if (data.Succeed) {
                                        mongo.db().collection(constants.DB.platform_sipNum).update({_id:_id},{$set:{secret:secret,isFax:isFax,codes:code}});
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        callback(result);
                                    }
                                } else {
                                    logger.app.error("request acs server error!",err);
                                    result.message = "request acs server error!";
                                    callback(result);
                                }
                            });
                        } else {
                            callback(result);
                        }
                    });
                }

            } else {
                callback(result);
            }
        });
    },
    getSipNumInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_sipNum).findOne(data, function (err, dbSip) {
            if (dbSip) {
                result.success = true;
                result.data = dbSip;
                callback(result);
            } else {
                callback(result);
            }
        });
    },
    refreshSipNoStatus: function(data, session, callback) {
        var result = {success:false};
        var products = session.account.products;
        var pbxs = [];
        var pbxIds = [];
        for(var i=0; i<products.length ;i++){
            if(products[i].product == data){
                pbxs = products[i].pbx;
                break;
            }
        }
        if(pbxs.length > 0){
            for(var i=0 ; i<pbxs.length ; i++){
                if(data == 'cc'){
                    pbxIds.push(pbxs[i].PBX);
                }else{
                    pbxIds.push(pbxs[i].pbx);
                }
            }
            exports.getSipStatusFromAss({account:session.account._id,pbx:pbxIds,product:data},session,function(statusList){
                if(statusList.success){
                    result.success = true;
                    result.list = statusList.data;
                }else{
                    result.message = 'query sip status form ass failed!';
                }
                callback(result);
            });
        }
    }
};

exports.getSipStatusFromAss = function(data, session, callback) {
    var result = {
        success: false,
        data: []
    }
    exports.getSipStatusFromAssCur(data, result, function(res){
        callback(res);
    });
}

exports.getSipStatusFromAssCur = function(data, result, callback){
    var pbxTableName = constants.DB.platform_pbx;
    if(data.product == 'cc'){
        pbxTableName = constants.DB.platform_cc_pbx;
    }
    var pbxId = data.pbx.pop();
    mongo.db().collection(pbxTableName).findOne({_id:pbxId},function(err,dbPbx){
        if(dbPbx){
            var url = dbPbx.configAddr;
            var postData = {
                Command : "Action",
                Action: "GetSipStatus",
                ActionID : utils.UUID.generateUuid(),
                account : data.account,
                pbx : pbxId
            };
            appHttp.sendPost(url, postData, function (err, assRes) {
                if (!err) {
                    try{
                        assRes = JSON.parse(assRes + "");
                        if (assRes.Succeed) {
                            result.data = result.data.concat(assRes.Data);
                            if(data.pbx.length>0){
                                exports.getSipStatusFromAssCur(data , result, callback);
                            }else{
                                result.success = true;
                                callback(result);
                            }
                        } else {
                            callback(result);
                        }
                    }catch(e){
                        logger.app.error(e);
                        if (e instanceof SyntaxError){
                            logger.app.error(e.name +" : "+ assRes || "");
                        }
                        callback(result);
                    }
                } else {
                    logger.app.error("request acs server error!",err);
                    result.message = "request acs server error!";
                    callback(result);
                }
            });
        } else {
            callback(result);
        }
    });
}


module.exports = handler;

