var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var uuid = require('appUtil/UUID');
var fields = require(__baseDir + '/dishui/common/Fields');
var thenjs =require("thenjs");

var CustomerApprovalHandler = {
    queryCustApprovalList : function (data,session,callback){
        var result = {success: false};
        var query = {"account":session.account.account};
        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL).find(query).toArray(function(err, docs) {
            if (!err) {
                result.list = docs||[];
                mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL).count(query, function (err, count) {
                    if(!err){
                        result.success = true;
                        result.count = count;
                        callback(result);
                    }else{
                        logger.app.error('db queryCustApprovalList error:' + err.stack);
                        result.message = "queryCustApprovalList error";
                        callback(result)
                    }
                });
            } else {
                logger.app.error('db queryCustApprovalList error:' + err.stack);
                result.message = "queryCustApprovalList error";
                callback(result)
            }
        });
    },
    getCustApprovalById :function (data,session,callback){
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL).findOne({"_id":data},function(err, doc) {
            if (!err) {
                result.success = true;
                result.custApproval = doc;
                callback(result);
            } else {
                logger.app.error('db getCustApprovalById error:' + err.stack);
                result.message = "getCustApprovalById error";
                callback(result)
            }
        });
    },
    updateCustApproval :function (data,session,callback) {
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL).updateOne({"_id":data._id},{$set:{"role":data.role}},function(err, doc) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error('db updateCustApproval error:' + err.stack);
                result.message = "updateCustApproval error";
                callback(result)
            }
        });
    },
    addCustApprovalBusiness :function (data,session,callback) {
        var result = {success: false};
        var insertData = {};
        insertData._id = uuid.generateUuid();
        insertData.cid = data.cid;
        insertData.apprType = data.apprType;
        insertData.category = data.category;
        insertData.categoryId = data.categoryId;
        insertData.owner = "NA";
        insertData.status = "0";
        insertData.cname = data.cname;
        insertData.reason = data.reason;
        insertData.user = session.user._id;
        insertData.money = data.money;
        insertData.account = session.account.account;
        insertData.createUser = session.user._id;
        insertData.createTime = utils.getCurrentDate();
        insertData.lastUpdater = session.user._id;
        insertData.lastTime = utils.getCurrentDate();
        mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL_BUSINESS).insert(insertData,function(err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.error('addCustApprovalBusiness error:' + err.stack);
                result.message = "addCustApprovalBusiness error";
                callback(result)
            }
        });
    },
    customerSysStatusApproval : function (data,session,callback) {
        //
    },
    initApprovalBusiness : function (data,callback) {
        var result = {success: false};
        var roleId = uuid.generateUuid();
        var insertData = {};
        insertData._id = roleId;
        insertData.display_name = "客户状态审核员"
        insertData.memo = "系统生成";
        insertData.scope = "level";
        insertData.type = "system";
        insertData.limits_out = ["nav_cust_approval_business"];
        insertData.accountId = data.account;
        insertData.limits = [];
        insertData.limits_in = [];
        insertData.createTime = utils.getCurrentDate();
        insertData.lastTime = utils.getCurrentDate();
        mongo.db().collection(fields.DB_APP_ROLE).insert(insertData, function (err) {
            if (!err) {
                //插入4条模板
                var bulkWrite =[];
                var role = [];
                role.push(roleId);

                for(var i=0; i<4; i++){
                    var apprInserData = {};
                    apprInserData._id = uuid.generateUuid();
                    apprInserData.account = data.account;
                    if(i == 0) {
                        apprInserData.name = "无效审核";
                        apprInserData.type = "2";
                    }else if(i == 1){
                        apprInserData.name = "丢单审核";
                        apprInserData.type = "4";
                    } else if(i == 2){
                        apprInserData.name = "成单审核";
                        apprInserData.type = "3";
                    } else if(i == 3) {
                        apprInserData.name = "续费审核";
                        apprInserData.type = "8";
                    }
                    apprInserData.createTime = utils.getCurrentDate();
                    apprInserData.createUser = "system";
                    apprInserData.lastTime = utils.getCurrentDate();
                    apprInserData.role = role;
                    var query = { insertOne : apprInserData};
                    bulkWrite.push(query);
                }

                mongo.db().collection(fields.DB_APP_CUSTOMER_APPROVAL).bulkWrite(bulkWrite,function(err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error('db initApprovalBusiness error:' + err.stack);
                        callback(result)
                    }
                });

            } else {
                logger.app.error('db initApprovalBusiness error:' + err.stack);
                result.message = "initApprovalBusiness error";
                callback(result)
            }
        });
    }

};
module.exports = CustomerApprovalHandler;