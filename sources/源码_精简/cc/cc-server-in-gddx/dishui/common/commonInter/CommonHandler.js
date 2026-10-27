var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var config = require('appConfig').conf;
var uuid = require('appUtil/UUID');
var nodeUtil = require('util');
var logger = require('appLog');
var userHandler = require(__baseDir + '/dishui/config/user/UserHandler');
var fields = require(__baseDir + '/dishui/common/Fields');
var objectUtil = require('appUtil/ObjectUtil');
var accountHandler = require(__baseDir + '/dishui/config/account/AccountHandler');
var cdrHandler = require(__baseDir + '/dishui/app/callSheet/CallSheetHandler');
var customerHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');

var handler = {
    handle:function(query,callback){
        if(query.flag == '1'){
            //主叫记忆---只查询最近一个月的通话记录
            var result= {success: false};
            if(query.callNo && query.accountId && query.callMemory){
                var findAcc = {
                    _id : query.accountId+"_cc"
                }
                accountHandler.queryAccountById(findAcc, null,function(accRes){
                    if(!accRes.success){
                        result.message = accRes.message;
                        logger.app.error(result.message);
                        callback(result);
                        return;
                    }
                    delete query._id;
                    var accSession = {
                        account: accRes.data
                    }
                    cdrHandler.getEmpNoByCallNo(query, accSession, function(cdrRes){
                        if(!cdrRes.success){
                            result.message = cdrRes.message;
                            logger.app.error(result.message);
                            return;
                        }
                        var empNo = cdrRes.empNo;
                        if(query.callMemory){
                            empNo = '0' + empNo;
                        }
                        result.success = true;
                        result.empNo = empNo;
                        logger.app.info(empNo);
                        callback(result);
                    });
                })
            }else{
                result.message = '[callNo, accountId, callMemory is must: ]' + nodeUtil.inspect(query);
                logger.app.error(result.message);
                return;
            }
        } else if(query.flag == '10'){
            //主叫记忆 根据客户取所属座席的工号
            var result = {success:false};
            if(query.callNo && query.accountId){
                customerHandler.getCustomerOwnerEmpNo(query,function(queryResult){
                    result.success = true;
                    if(queryResult.success){
                        result.resultStr = "0"+queryResult.empNo;
                    }else {
                        result.resultStr = "0404";
                    }
                    logger.app.info(result.resultStr);
                    callback(result);
                });
            } else {
                result.message = '[callNo, accountId is must: ]' + nodeUtil.inspect(query);
                logger.app.error(result.message);
                return;
            }
        } else if(query.flag == '4'){
            // query sip bind
            var result = {success: false};
            var resultStr = '';
            var queryExtenData = {
                account: query.accountId,
                pbx: query.pbx,
                gatewayExten: query.sip,
                product: 'cc'
            }
            userHandler.queryUser(queryExtenData, null, function(userRes){
                if(!userRes.success){
                    result.message = 'query user fail: '+ query.sip;
                    logger.app.error(result);
                    callback(result);
                    return;
                }
                if(userRes.list && userRes.list.length > 0){
                    for(var i=0; i<userRes.list.length; i++){
                        resultStr += userRes.list[i].displayName + ',' + userRes.list[i].exten + '|';
                    }
                    resultStr = resultStr.substr(0, resultStr.length-1);
                    result.success = true;
                    result.resultStr = resultStr;
                    logger.app.info(result.resultStr);
                    callback(result);
                }else{
                    result.success = true;
                    result.resultStr = '404';
                    result.message = 'can not find user the sip user' + query.sip;
                    logger.app.info(result.message);
                    callback(result);
                }
            })
        }else if(query.flag == '20'){
            // query account companyName
            var result = {success: false};
            var find = {
                _id: query.accountId
            }
            mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT).findOne(find, function(err, doc){
                if(err){
                    result.message = 'query account fail!';
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                if(!doc){
                    result.success = true;
                    result.resultStr = '404';
                    result.message = 'can not find account the sip user' + query.accountId;
                    logger.app.info(result.message);
                    callback(result);
                    return;
                }
                result.success = true;
                result.resultStr = doc.companyName;
                callback(result);
            });
        }else if(query.flag == '31'){
            //match customer's status By FROM_CID
            var result = {success: false};
            var find = {
                _id: query.accountId + "_cc"
            }
            mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne(find, function(err, doc){
                if(err){
                    result.message = 'query account fail!';
                    logger.app.error(err);
                    callback(result);
                }else{
                    if(doc != null){
                        var dataDb = doc.dataDB;
                        var em = {'phone' : {$elemMatch: {'tel': query.from}}};
                        mongo.db(dataDb).collection(query.accountId + '_customer').findOne(em, {fields: {"status":1,"_id":0}}, function(err, fm){
                            if(err){
                                result.message = 'query customer status fail!';
                                logger.app.error(err);
                                callback(result);
                            }else{
                                if(fm != null && fm.status != null){
                                    mongo.db().collection('customer_template').findOne({"account": query.accountId}, {fields: {'status':1, '_id':0}}, function(err, status){
                                        if(err){
                                            result.message = 'query status fail!';
                                            logger.app.error(err);
                                            callback(result);
                                        }else{
                                            if(status != null && status.status[fm.status] != null){
                                                result.resultStr = status.status[fm.status];
                                                result.success = true;
                                                callback(result);
                                            }
                                        }
                                    });
                                }else{
                                    result.message = 'query success with zero result';
                                    callback(result);
                                }
                            }
                        });
                    }else{
                        result.message = 'query success with zero result';
                        callback(result);
                    }
                }
            });
        }else{
            var result ={
                success : false,
                code : '603',
                message:'此接口不存在！请确认flag！'};
            logger.app.error(result.message + " 错误码: " + result.code + "\n" + nodeUtil.inspect(query));
            callback(result);
            return;
        }
    }
};
module.exports = handler;
