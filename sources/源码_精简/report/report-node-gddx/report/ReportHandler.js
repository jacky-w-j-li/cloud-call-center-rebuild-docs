/**
 * Created by yaxi on 2015-11-11.
 */

var fields = require(__baseDir + '/common/Fields');
var mongo = require('appDb/MongoDb');
var nodeUtil = require('util');
/**
 * {
 *  account:'N000000123',
 *  reportType:'im_report_business_analysis'
 * }
 * @param data
 * @param callback
 */
exports.queryUser = function(data, callback) {
    var result = {success: false};
    if(!data.product){
        data.product = 'cc';
    }
    mongo.appDb('bill').collection(fields.DB_PLATFORM_USER).find(data,['_id','displayName','exten','parentId']).toArray(function(err, docs){
        if(err){
            logger.app.error(err.stack);
            result.message = "Query user failure: " + nodeUtil.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.getTableHeader = function(data,callback){
    var result = {success:false};
    var find = {
        Account : data.account,
        Type : data.reportType
    };
    mongo.appDb("cc").collection(fields.DB_REPORT_TABLE_HEADER_CONFIG).findOne(find,function(err, doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        if(doc){
            result.data = doc ;
            result.success = true;
            callback(result);
        }else{
            var findSystem = {
                Account : 'system',
                Type : data.reportType
            }
            mongo.appDb("cc").collection(fields.DB_REPORT_TABLE_HEADER_CONFIG).findOne(findSystem,function(err, sysdoc){
                if(err){
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                result.data = sysdoc;
                result.success = true;
                callback(result);
            });
        }
    });
}