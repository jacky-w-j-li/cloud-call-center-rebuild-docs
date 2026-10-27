/**
 * Created by chenguang on 3/11/15.
 */
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var util = require('util');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var dateTimeUtil = require('appUtil/DateTime');
var config = require('appConfig').conf;
var http = require('appHttp');
var userHandler = require(__baseDir + '/dishui/config/ivr/UserHandler');

exports.assGetQiNiuPushAccounts = function(data, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_ASS_QINIU_PUSH_ACCOUNTS).find().toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query qiniu push accounts failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.assGetQiNiuCdrByAcc = function(data, callback){
    var result = {success: false};
    mongo.db('bill').collection("platform_account_product").findOne({_id: data.account+'_cc'},{dataDB:1},function(err, doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        var find = {
            STATUS : "dealing"
        }
        if(data.beginDate && data.endDate){
            find.OFFERING_TIME = {'$gte': data.beginDate+' 00:00:00'
                ,'$lte': data.endDate+' 23:59:59'};
        }else if(data.date){
            find.OFFERING_TIME = {'$gte': data.date+' 00:00:00'
                ,'$lte': data.date+' 23:59:59'};
        }else{
            if(data.splitCount){
                var date = new Date(utils.getYesterdayYear(), utils.getYesterdayMonth()-1, utils.getYesterdayDay(), '0', '0', '0');
                var beginTime = utils.getYesterdayDate()+' 00:00:00';
                if(data.splitCount > 1){
                    var beginStemp = date.getTime() + (data.splitCount-1) * 180*1000;
                    beginTime = utils.getFormatDateTimeStr(beginStemp);
                }
                var endStemp = date.getTime() + data.splitCount * 180*1000;
                var endTime = utils.getFormatDateTimeStr(endStemp);
                find.OFFERING_TIME = {'$gte': beginTime,'$lt': endTime};
            }else{
                find.OFFERING_TIME = {'$gte': utils.getYesterdayDate()+' 00:00:00'
                    ,'$lte': utils.getYesterdayDate()+' 23:59:59'};
            }
        }
        if(data.pbx){
            var pbxArry = data.pbx.split('.');
            var pbxBegin = pbxArry[0]+'.'+pbxArry[1]+'.'+pbxArry[2];
            var pbxlist = [];
            for(var i=0;i<10;i++){
                pbxlist.push(pbxBegin+'.'+i);
            }
            find.PBX = {$in:pbxlist};
        }
        var returnDoc = {
            CALL_ID: 1,
            CALL_NO: 1,
            CALLED_NO: 1,
            CONNECT_TYPE: 1,
            RECORD_FILE_NAME: 1,
            ACCOUNT_ID: 1
        }
        mongo.db(doc.dataDB).collection(data.account + '_c5_call_sheet').find(find,returnDoc).toArray(function (err, docs) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            callback(result);
        });
    })
}

exports.assGetQiNiuHandPushAccounts = function(data, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_ASS_QINIU_HAND_PUSH_ACCOUNTS).find({status:'ready'}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query qiniu hand push accounts failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        if(docs.length > 0){
            var updateDoc = {$set:{status:'send'}}
            mongo.db().collection(fields.DB_ASS_QINIU_HAND_PUSH_ACCOUNTS).update({status:'ready'}, updateDoc, function(err){
                if(err){
                    logger.app.error(err.stack);
                    result.message = "Query qiniu hand push accounts failure" + util.inspect(data);
                    result.success = false;
                    callback(result);
                    return;
                }
                result.list = docs;
                result.success = true;
                callback(result);
            })
        }else{
            result.list = docs;
            result.success = true;
            callback(result);
        }
    });
}

exports.assUpdateAliyunOssCdrFileServer = function(data, callback){
    var result = {success: false};
    var findAcc = {_id:data.account+'_cc'};
    mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne(findAcc, {dataDB:1}, function (err, acc) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "assUpdateAliyunOssCdrFileServer failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        if(acc && acc.dataDB){
            var find = {_id: data.id};
            mongo.db(acc.dataDB).collection(data.account+fields.DB_ACCOUNT_CALL_SHEET).update(find,{$set:{FILE_SERVER:'http://m7-record.oss-cn-hangzhou.aliyuncs.com/'+data.account}}, function (err) {
                if (err) {
                    logger.app.error(err.stack);
                    result.message = "assUpdateAliyunOssCdrFileServer update cdr failure" + util.inspect(data);
                    result.success = false;
                    callback(result);
                    return;
                }
                result.success = true;
                callback(result);
            });
        }else{
            callback(result);
        }
    });
}

exports.multiAccountCallMemoryByProxy = function(data, callback){
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_BILL_SYSTEM_USER).findOne({loginName: data.proxyName},{_id:1},function (err, doc) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "multiAccountCallMemoryByProxy Query proxy user failed!" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        if(doc){
            mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT).find({createUser:doc._id},{_id:1}).toArray(function(err, docs){
                if(err){
                    logger.app.error(err.stack);
                    result.message = "multiAccountCallMemoryByProxy Query platform account failed!" + util.inspect(data);
                    result.success = false;
                    callback(result);
                    return;
                }
                var accArray = [];
                for(var i=0;i<docs.length;i++){
                    accArray.push(docs[i]._id);
                }
                var findGwCdr ={
                    account: {$in : accArray},
                    did: data.callNo
                }
                mongo.db('bill_data').collection(fields.DB_BILL_CDR_QUERY_CC).find(findGwCdr,{account:1}).sort({beginTime:-1}).limit(1).toArray(function(err, gwcdrs){
                    if(err){
                        logger.app.error(err.stack);
                        result.message = "multiAccountCallMemoryByProxy Query gwcdrs failed!" + util.inspect(data);
                        result.success = false;
                        callback(result);
                        return;
                    }
                    if(gwcdrs.length>0){
                        var gwcdr = gwcdrs[0];
                        var account = gwcdr.account;
                        var findProduct = {
                            _id: account+"_cc"
                        }
                        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne(findProduct,{dataDB:1},function(err, product){
                            if(err){
                                logger.app.error(err.stack);
                                result.message = "multiAccountCallMemoryByProxy Query account products failed!" + util.inspect(data);
                                result.success = false;
                                callback(result);
                                return;
                            }
                            var dataDB = product.dataDB;
                            var findCdr = {
                                CALLED_NO : data.callNo,
                                STATUS : "dealing"
                            }
                            mongo.db(dataDB).collection(account+"_c5_call_sheet").find(findCdr).sort({"OFFERING_TIME":-1}).limit(1).toArray(function(err, cdrs){
                                if(err){
                                    logger.app.error(err.stack);
                                    result.message = "multiAccountCallMemoryByProxy Query call_sheet failed!" + util.inspect(data);
                                    result.success = false;
                                    callback(result);
                                    return;
                                }
                                if(cdrs.length > 0){
                                    var cdr = cdrs[0];
                                    userHandler.queryUser({"_id": cdr.DISPOSAL_AGENT}, null, function(userRes){
                                        if(!userRes.success){
                                            result.message = 'multiAccountCallMemoryByProxy query user failure: ' + cdr.DISPOSAL_AGENT
                                            logger.app.error(result.message);
                                            callback(result);
                                            return;
                                        }
                                        var empNo = userRes.list[0].exten;
                                        var pbxId = userRes.list[0].pbx;
                                        var callerIDNum = userRes.list[0].callerIDNum;
                                        mongo.db('bill').collection(fields.DB_PLATFORM_CC_PBX).findOne({_id:pbxId}, function(err, pbx){
                                            if(err){
                                                logger.app.error(err.stack);
                                                result.message = "multiAccountCallMemoryByProxy Query pbx failed!" + util.inspect(data);
                                                result.success = false;
                                                callback(result);
                                                return;
                                            }
                                            result.success = true;
                                            result.isFound = true;
                                            result.ip = pbx.sipAddr;
                                            if(callerIDNum && callerIDNum != ''){
                                                result.serviceNo = callerIDNum;
                                                result.isDialExten = false;
                                                callback(result);
                                                return;
                                            }else{
                                                result.isDialExten = true;
                                                result.jobNum = empNo;
                                                mongo.db().collection(fields.DB_IVR_SERVICE_NO).find({"Account":account,"PBX":pbxId},{Exten:1}).toArray(function(err, serviceNo){
                                                    if(err){
                                                        logger.app.error(err.stack);
                                                        result.message = "multiAccountCallMemoryByProxy Query serviceNo failed!" + util.inspect(data);
                                                        result.success = false;
                                                        callback(result);
                                                        return;
                                                    }
                                                    if(serviceNo.length>0){
                                                        result.serviceNo = serviceNo[0].Exten;
                                                    }else{
                                                        result.isFound = false
                                                    }
                                                    callback(result);
                                                    result;
                                                });
                                            }
                                        });
                                    });
                                }else{
                                    result.isFound = false;
                                    result.success = true;
                                    callback(result);
                                }
                            })
                        });
                    }else{
                        result.isFound = false;
                        result.success = true;
                        callback(result);
                    }
                })
            });
        }else{
            result.isFound = false;
            result.success = true;
            callback(result);
        }
    });
}