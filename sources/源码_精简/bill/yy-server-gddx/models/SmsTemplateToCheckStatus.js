var mongo = require('appDb/MongoDb');
/**
 * 短信状态
 *
 */
var model ={
    getSmsTemplateToCheckStatusCache: function (data, session, callback) {
        mongo.db("cc").collection("app_dic_codes").find({code_type:"smsTemplateToCheckStatus"}).toArray(function (err, smsTemplateToCheckStatus) {
            if (!err) {
                smsTemplateToCheckStatus = smsTemplateToCheckStatus || [];
                var caches = [];
                for (var i = 0; i < smsTemplateToCheckStatus.length; i++) {
                    var cache = {
                        codeType: "templateStatus",
                        codeOrder: i + 1,
                        codeName: smsTemplateToCheckStatus[i].code_name,
                        codeValue: smsTemplateToCheckStatus[i].code_value
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });

    }
}

module.exports = model;