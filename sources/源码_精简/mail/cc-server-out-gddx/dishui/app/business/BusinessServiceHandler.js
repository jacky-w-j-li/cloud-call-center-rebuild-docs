var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');


var handler = {
    deleteCustomerBusiness: function (session, cid, callback) {
        if (cid) {
            var condition = null;
            if(cid instanceof Array){
                condition = {customer : {$in:cid}};
            } else {
                condition = {customer: cid};
            }
            mongo.db(session).collection(session.account.account + "_business").distinct("_id", condition, function (err, ids) {
                if (!err) {
                    ids = ids || [];
                    mongo.db(session).collection(session.account.account + "_business").remove(condition, function (err) {
                        if (!err) {
                            var deleteCondition = {businessId: {$in: ids}};
                            mongo.db(session).collection(session.account.account + "__business_history").remove(deleteCondition, function (err) {
                                if (err) {
                                    logger.app.error("", err);
                                }
                                callback(err);
                            });
                        } else {
                            logger.app.error("", err);
                            callback(err);
                        }
                    });
                } else {
                    logger.app.error("", err);
                    callback(err);
                }
            });
        } else {
            callback(new Error("cid is empty!"));
        }
    },
    batchDeleteCustomerBusiness: function (session, cids, callback) {
        if(cids && cids.length > 0){

        } else {
            callback(new Error("cids is empty!"));
        }
    }

};

module.exports = handler;