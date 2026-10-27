var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var http = require('appHttp');
var fields = require(__baseDir + '/dishui/common/Fields');
var assHandler = require(__baseDir + '/dishui/common/billInterface/assServiceHandler');

var handler = {
    /**
     * account
     * limit
     * @param data
     * @param callback
     */
    updateCallLimit: function (data, callback) {
        var result = {success: false};
        var accountId = data.account;
        var limit = data.limit;
        var updateData = {
            concurrentType: "custom",
            callInLimit: limit
        };
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne({"_id": accountId+"_cc"}, function (err, dbAccount) {
            if (!err && dbAccount) {
                var type = dbAccount.concurrentType || "normal";
                if (type == "normal") {
                    updateData.callOutLimit = Math.ceil(dbAccount.agentNum * 1.5) + "";
                } else {
                    updateData.callOutLimit = dbAccount.callOutLimit;
                }
                mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).update({"_id": accountId+"_cc"}, {$set: updateData}, function (err) {
                    if (!err) {
                        assHandler.notifyAssUpdateLicense(accountId, function (err, res) {
                            if (!err && res.Succeed) {
                                result.success = true;
                            } else {
                                result.message = "数据修改成功，同步ass失败，请再试！";
                            }
                            callback(result);
                        });
                    } else {
                        logger.app.error("", err);
                        callback(result);
                    }
                });


            } else {
                logger.app.error("db error!", err || new Error("can not fount account!"));
                result.message = "can not fount account!";
                callback(result);
            }
        });
    },
    /**
     * for service interface
     * http://localhost:4000/service?action=updateBdTaskStatus&data={"taskId":"74a2e960-266a-11e4-ba72-2f818aae9076","status":'ready'}
     * @param data
     * @param callback
     */
    updateBdTaskStatus: function (data, callback) {
        var result = {success: false};
        var query = {
            _id:data.taskId
        };
        var set={status:data.status};
        mongo.db("cc_autocall_task").collection(fields.DB_APP_AUTOCALL_TASK).update(query,{$set:set},function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err.stack);
                result.message = 'updateBdTaskStatus interface error!';
                callback(result);
            }
        });
//        mongo.db().collection(fields.DB_APP_AUTOCALL_TASK).findOne(query, function (err, doc) {
//            if (!err && doc) {
/*                if(doc.status==fields.task_taskType_normal){
                    set.status=fields.task_status_ready;
                }else{
                    set.status=fields.task_status_finish;
                }*/

//            } else {
//                logger.app.error("db error!", err || new Error("batch task not fount !"));
//                callback(result);
//            }
//        });
    }

};


module.exports = handler;
