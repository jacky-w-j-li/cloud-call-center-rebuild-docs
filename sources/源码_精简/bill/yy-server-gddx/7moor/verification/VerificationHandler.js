var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var constants = require(__baseDir + "/7moor/utils/Constants");
var ccap = {};//require('ccap')({
//    width: 165,
//    height: 60,
//    offset: 40,
//    quality: 0,
//    generate: function () {
//        var length = 4;
//        var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
//        var code = "";
//        for (var i = 0; i < length; i++) {
//            var index = Math.ceil(Math.random() * 35);
//            code += chars[index];
//        }
//        return code;
//    }
//});

var handler = {
    verifyImageCode: function (data, callback) {
        var result = {success: false};
        var id = data.id;
        var code = data.code || "";
        if (id) {
            mongo.db().collection(constants.DB.bill_platform_image_verity).findOne({_id: id}, function (err, dbCode) {
                if (!err && dbCode) {
                    if (dbCode.code == code.toUpperCase()) {
                        result.success = true;
                    } else {
                        result.message = "invalid code";
                    }
                    callback(result);
                } else {
                    result.message = "invalid code";
                    callback(result);
                }
            });
        } else {
            result.message = "invalid id!";
            callback(result);
        }
    },
    verifyMobileCode: function(data, callback){
        var result = {success: false};
        var id = data.id;
        var code = data.code || "";
        if (id) {
            mongo.db().collection(constants.DB.bill_platform_mail_register).findOne({_id: id}, function (err, doc) {
                if (!err && doc) {
                    var curTime = utils.DateTime.getCurrentTimestamp();
                    if(doc.mobileCodeTime){
                        if(curTime - doc.mobileCodeTime > 5*60*1000){
                            result.code = '01';
                            result.message = 'mobile code is time,place try again!';
                            callback(result);
                            return;
                        }
                    }
                    if (doc.mobileCode == code) {
                        result.success = true;
                        result.key = doc.key;
                    } else {
                        result.code = '03';
                        result.message = "invalid code";
                    }
                    callback(result);
                } else {
                    result.message = "invalid code";
                    callback(result);
                }
            });
        } else {
            result.code = '02';
            result.message = "invalid id!";
            callback(result);
        }
    },
    getImageVer: function (data, callback) {
        var result = {
            success: false
        };
        var id = data.id;
        if (id) {
            var ary = ccap.get();
            var txt = ary[0];
            var buf = ary[1];
            var verData = {
                _id: id,
                time: utils.DateTime.getCurrentDateTime(),
                code: txt
            };
            mongo.db().collection(constants.DB.bill_platform_image_verity).save(verData, function (err) {
                if (!err) {
                    result.success = true;
                    result.bufferData = true;
                    result.data = buf;
                    callback(result);
                } else {
                    result.message = "process error!";
                    callback(result);
                }
            });

        } else {
            result.message = "invalid id!";
            callback(result);
        }
    }
};


module.exports = handler;
