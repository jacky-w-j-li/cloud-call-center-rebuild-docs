var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');

module.exports.getDeptDic = function (session, callback) {
    var accountId = session.user.account;
    mongo.db("bill").collection(fields.DB_PLATFORM_DEPARTMENT).find({"account":accountId},{sort:{"order":-1}}).toArray(function(err, depts) {
        if (!err) {
            callback(null, depts || []);
        } else {
            callback(err);
        }
    });
}

