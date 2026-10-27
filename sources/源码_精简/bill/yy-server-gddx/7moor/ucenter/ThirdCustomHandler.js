var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");


var handler = {
    getDomainInfoById:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        mongo.db().collection("platform_logo").findOne(query,function(err,row){
            if(err) {
                logger.app.error(err);
                return callback(result);
            }
            if(row){
                result.success = true;
                result.row=row;
                return callback(result);
            }

            return callback(result);
        });
    }
};

module.exports = handler;
