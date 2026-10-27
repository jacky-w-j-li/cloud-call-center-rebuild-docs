/**
 * Created by zhangyang on 15/12/29.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    getSmsSignCache: function (data, session, callback) {
        mongo.db("cc").collection(constants.DB.app_sms_sign).find(data).toArray(function (err, signs) {
            if (!err) {
                signs = signs || [];
                var caches = [];
                for (var i = 0; i < signs.length; i++) {
                    var cache = {
                        codeType: "smsSign",
                        codeOrder: i + 1,
                        codeName: signs[i].name,
                        codeValue: signs[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    }
};


module.exports = handler;
