/**
 * Created by zengyx on 16/5/27.
 *
 * 邮件通知handler
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/m7/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var Thenjs = require('thenjs');

var handler = {
    /**
     * 邮件发送投递的结果给cc-server-in
     * @param data
     * @param callback
     */
    sendMailStatus: function (data, actionId, callback) {

        mongo.db().collection(fields.DB_APP_EMAIL_MAILS).findOne({_id: data.mailId}, function (err, doc) {
            if (!err && doc) {
                data.sessionId = doc.sessionId;
                data.agent = doc.agent;
                data.account = doc.account;
                data.subject = new Buffer(doc.subject).toString("base64");
                data.to = doc.to.addr;
                _impl.pushNotifyData(data, actionId, function (success) {
                    if(success){
                        callback({success: true});
                    }else{
                        callback({success: false});
                    }
                });
            }else{
                callback({success: true, message:"not found mail"});
            }
        })


    }
};

var _impl = {

    /**
     * 推送给cc服务
     * @param postData
     * @param callback
     */
    pushNotifyData: function (postData, actionId,callback) {
        var url = config.pushServiceUrl;
        logger.app.info(postData);
        httpProvider.sendPost(url, "action=emailNotify&data=" + JSON.stringify(postData), function (err, response) {
            if (!err) {
                var res = JSON.parse(response);
                if (res.success) {
                    logger.app.info("["+actionId+"]"+"send notify success");
                    callback(true);
                } else {
                    logger.app.info("["+actionId+"]"+"send notify failure=" +JSON.stringify(postData));
                    callback(false);
                }
            } else {
                logger.app.error("["+actionId+"]"+"send notify err=" + JSON.stringify(postData), err);
                callback(false);
            }
        });
    }
}

module.exports = handler;