var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');

var handler = {
    addLog : function(log,session){
        log.master = session.user._id;
        log.time = utils.DateTime.getCurrentDateTime();
        mongo.db().collection("account_operate_log").insert(log,function(err){
            if(err){
                logger.app.error("",err);
            }
        });
    }

};

module.exports = handler;