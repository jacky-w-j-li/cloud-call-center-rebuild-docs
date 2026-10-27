var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var wxPublicHandler = require(__baseDir + "/7moor/weixin/WxPublicHandler");


var handler = {
    test: function (data, callback) {

        wxPublicHandler.newVoicemail({id:"zhangyang_test"},function(result){
            callback(result);
        });

    }
};

module.exports = handler;