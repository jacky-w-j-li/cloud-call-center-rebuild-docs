var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
var Utils = require('appUtil/Utils');

var model = {
    isFirstPay: function(currentDateTime,account,cb){
        //是否距离首次付费30天之内.30天外是否能查到记录.
        var firstMostPayTime = Utils.DateTime.dateAdd('d',-30,new Date(currentDateTime));
        firstMostPayTime = Utils.DateTime.getDateFormat(firstMostPayTime);

        mongo.db("zj").collection("user_bank_pay").count({pay_time:{$lt : firstMostPayTime},account:account},function(err,count) {
            if (err) {
                return cb(err);
            }

            return cb(null,count <= 0);
        });
    },
}

module.exports = model;