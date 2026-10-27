var logger = require('appLog');
var nodeUtil = require('util');
var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + '/7moor/utils/Constants');
var accountPbxHandler = require(__baseDir + '/7moor/ivr/PbxHandler');
var ivrHandler = require(__baseDir + '/7moor/ivr/IvrHandler');
var lineHandler = require(__baseDir + '/7moor/ivr/LineHandler');
var systemNodeHandler = require(__baseDir + '/7moor/ivr/SystemNodeHandler');

exports.saveAccountPbx = function(data, session, callback) {
    var result = {success:false};
    exports.getAccountPbx(data, session, function(accountPbxResult) {
        if (!accountPbxResult.success) {
            callback(accountPbxResult);
            return;
        }

        // TODO get 8xxxx serviceNo from java service
        data.ServiceNo = 80000;

    });
}

exports.getAccountPbx = function(data, session, callback) {
    var result = {success: false};
    var queryAccountPbxData = {
        '_id' : data._id
    }
    // query account by _id to find if account pbx has init.
    exports.queryAccountPbx(queryAccountPbxData, session, function(queryAccountPbxResult){
        if (!queryAccountPbxResult.success) {
            callback(queryAccountPbxResult);
            return;
        }

        // just return true if account pbx has init.
        if (queryAccountPbxResult.pbx) {
            logger.app.info('Account pbx has init, use exists pbx to init account pbx: ' + queryAccountPbxResult.pbx._id);
            data.PBX = queryAccountPbxResult.pbx._id;
            result.success = true;
            callback(result);
            return;
        }

        // find the pbx which user count is min.
        accountPbxHandler.getMinUserPbx({}, session, function(queryPbxResult){
            if (!queryPbxResult.success) {
                callback(queryPbxResult);
                return;
            }

            var pbx = queryPbxResult.pbx;
            if (!pbx) {
                result.message = 'Got min user count pbx is null!!';
                logger.app.error(result.message);
                callback(result);
                return;
            }
            logger.app.info('Got min user count pbx: ' + pbx._id);
            data.PBX = pbx._id;
            result.succes = true;
            callback(result);
        });
    });
}


/**
 * To save account pbx when user registered in user center:
 * 1. init account pbx.
 * 2. init account line.
 * 3. init dial job number node.
 * @param data
 * @param session
 * @param callback
 */
//exports.saveAccountPbx = function(data, session, callback) {
//    var result = {success: false};
//    exports.initAccountPbx(data, session, function(initAccountPbxResult){
//        if (!initAccountPbxResult.success) {
//            callback(initAccountPbxResult);
//            return;
//        }
//        lineHandler.initAccountLine(data, session, function (initRes) {
//            if (!initRes.success) {
//                callback(initRes);
//                return;
//            }
//            result.lines = initRes.list;
//            systemNodeHandler.initDialJobNum(data, null, function(dialJobNumRes){
//                if (!dialJobNumRes.success) {
//                    result.success = false;
//                    result.message = 'Update dialjobnum failure: ' + nodeUtil.inspect(data);
//                    callback(result);
//                    return;
//                }
//                result.system = dialJobNumRes.data;
//            });
//        });
//    });
//}

/**
 * Init account pbx
 * If account has init pbx before, ignore this process and return true,
 * else, we find the pbx which user count is min to init.
 * @param data
 * @param session
 * @param callback
 */
exports.initAccountPbx = function(data, session, callback) {
    var result = {success: false};
    var queryAccountPbxData = {
        '_id' : data._id
    }
    // query account by _id to find if account pbx has init.
    exports.queryAccountPbx(queryAccountPbxData, session, function(queryAccountPbxResult){
        if (!queryAccountPbxResult.success) {
            callback(queryAccountPbxResult);
            return;
        }

        // just return true if account pbx has init.
        if (queryAccountPbxResult.pbx) {
            logger.app.info('Account pbx has init, not need to init again: ' + data._id);
            result.success = true;
            callback(result);
            return;
        }

        // find the pbx which user count is min.
        accountPbxHandler.getMinUserPbx({}, session, function(queryPbxResult){
            if (!queryPbxResult.success) {
                callback(queryPbxResult);
                return;
            }

            var pbx = queryPbxResult.pbx;
            if (!pbx) {
                result.message = 'Got min user count pbx is null!!';
                logger.app.error(result.message);
                callback(result);
                return;
            }
            logger.app.info('Got min user count pbx: ' + pbx._id);

            // init account pbx
            data.pbx = pbx._id;
            data.isDialoutIntegration = '0';
            data.isTransferIntegration = '0';

            var ivrData = {
                nodeData: data,
                dbData: {
                    tableName: constants.DB.platform_account,
                    condition: {"_id": data._id}
                }
            };

            ivrData.nodeData.Action = "AccountAdd";
            ivrData.dbData.updateData = {"$set": {pbx: data}};
            ivrHandler.saveOrUpdateIvr(ivrData, session, function (err, pbxData) {
                if (err) {
                    result.message = "Init account pbx to ACS failure!";
                    logger.app.error(result.message);
                    callback(result);
                    return;
                }

                logger.app.info('Success to init account pbx: ' + data._id + ' ' + pbx._id);
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.queryAccountPbx = function(data, session, callback) {
    var result = {success: false};
    mongo.db().collection(constants.DB.platform_account).find(data).toArray(function(err, accounts){
        if (err) {
            result.message = 'Query account pbx failure!';
            logger.app.error(result.message);
            callback(result);
            return;
        }

        result.pbxes = accounts.pbx;
        result.success = true;
        callback(result);
    });
}