/**
 * Created by jackwong on 16/1/20.
 */
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/common/Fields');

exports.getSystemUserDic = function (callback) {
    mongo.appDb("bill").collection(fields.DB_BILL_SYSTEM_USER).find({status: "enable"}, {sort: {name: 1}}).toArray(function (err, users) {
        if (!err) {
            users = users || [];
            var idUser = {};
            for (var i = 0; i < users.length; i++) {
                idUser[users[i]._id] = users[i];
            }
            callback(null, idUser);
        } else {
            callback(err);
        }
    });
}