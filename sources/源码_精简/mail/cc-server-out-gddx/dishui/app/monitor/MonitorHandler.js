/**
 * Created by chenguang on 11/17/15.
 */
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var utils = require('appUtil/Utils');
var datetime = require('appUtil/DateTime');

exports.getPushOnlineAgentAndDealingCount = function(data, session, callback){
    var result = {success: false};
    var find = {'user.account': session.user.account};
    mongo.db().collection('app_push_client').find(find).toArray(function(err,docs) {
        if (err) {
            result.message = 'getPushOnlineAgent update db failed!';
            callback(result);
            return;
        }
        result.onlineList = docs;

        var match = {
            account : session.user.account,
            status: 'deal',
            user: {$ne:null}
        }
        var group = {_id:"$user",count:{$sum:1}};
        mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
            .aggregate([{$match:match},{$group:group}], function (err, workRes) {
                if (!err) {
                    result.dealList = workRes;
                    var matchQueue = {
                        account : session.user.account,
                        createTime: {$gte: utils.DateTime.getStartDate() +' 00:00:00'},
                        toPeer: {$ne:null},
                        serviceMan: 'manual'
                    }
                    var groupQueue = {_id:"$toPeer", accessCount:{$sum:1}};
                    mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
                        .aggregate([{$match:matchQueue},{$group:groupQueue}], function (err, qaRes) {
                            if (!err) {
                                result.queueAccessList = qaRes;

                                var matchUndealQueue = {
                                    account : session.user.account,
                                    createTime: {$gte: utils.DateTime.getStartDate() +' 00:00:00'},
                                    toPeer: {$ne:null},
                                    status: 'undeal'
                                }
                                var groupUndealQueue = {_id:"$toPeer", undealCount:{$sum:1}};
                                mongo.db().collection(fields.DB_APP_MULTI_CHANNEL_CHAT_SESSION)
                                    .aggregate([{$match:matchUndealQueue},{$group:groupUndealQueue}], function (err, quRes) {
                                        if (!err) {
                                            result.queueUndealList = quRes;
                                            result.success = true;
                                            callback(result);
                                        }else{
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    });
                            }else{
                                logger.app.error(err);
                                callback(result);
                            }
                        });
                } else {
                    logger.app.error(err);
                    callback(result);
                }
            });
    });
}
