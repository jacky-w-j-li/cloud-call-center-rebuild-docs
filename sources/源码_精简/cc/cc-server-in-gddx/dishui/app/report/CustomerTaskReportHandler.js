var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');

var handler = {
    statDialUserData:function(data,session,callback){
        var result = {success: false};
        var taskId=data.taskId;
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne({_id:taskId},function(err,doc){
            if(!err){
                result.total=doc.total|| 0;
                result.unit = doc.unit|| "";
                    mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).find({taskId:taskId}).toArray(function(err,docs){
                        if(!err){
                            result.list = docs;
                            result.success = true;
                            var time = utils.DateTime.getFormatDateStr(new Date());
                            mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER_DAILY).find({taskId:taskId,date:time}).toArray(function(err,docs){
                                if(!err ){
                                    result.listDaily = docs;
                                    result.success = true;
                                    callback(result);
                                }else{
                                    logger.app.error('db statDialUserData error:' + err.stack);
                                    result.message = '数据库查询异常';
                                    callback(result);
                                }
                            });
                        }else{
                            logger.app.error('db statDialUserData error:' + err.stack);
                            result.message = '数据库查询异常';
                            callback(result);
                        }
                    });

            }else{
                logger.app.error('db statDialUserData error:' + err.stack);
                result.message = '数据库查询异常';
                callback(result);
            }
        });
    },
    statCloseDialUserData:function(data,session,callback){
        var result = {success: false};
        var taskId=data.taskId;
        mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK).findOne({_id:taskId},function(err,doc){
            if(!err){
                result.total=doc.total|| 0;
                mongo.db().collection(fields.DB_CUSTOMER_DIAL_TASK_USER).find({taskId:taskId}).toArray(function(err,docs){
                    if(!err){
                        result.list = docs;
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error('db statDialUserData error:' + err.stack);
                        result.message = '数据库查询异常';
                        callback(result);
                    }
                });
            }else{
                logger.app.error('db statDialUserData error:' + err.stack);
                result.message = '数据库查询异常';
                callback(result);
            }
        });
    }
};

module.exports = handler;


