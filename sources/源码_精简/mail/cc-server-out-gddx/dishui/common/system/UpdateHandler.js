var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');

var handler = {
    getUpNf : function(data , callback){
        var result = { success : false};
        mongo.db().collection("system_update_config").findOne({type:"cc_out",enable:true},function(err , dbConfig){
            if(!err && dbConfig){
                result.success = true;
                result.isNew = true;
                result.date = dbConfig.date;
                result.list = dbConfig.upFile || [];
                callback(result);
            } else {
                logger.app.error("get update config error!",new Error(""));
                callback(result);
            }
        });
    }
};


module.exports = handler;

