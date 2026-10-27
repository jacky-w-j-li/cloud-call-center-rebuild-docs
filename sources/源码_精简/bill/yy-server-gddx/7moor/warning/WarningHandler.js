var utils = require('appUtil/Utils');
var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var config = require("appConfig");
var constants = require(__baseDir + "/7moor/utils/Constants");
var httpProvider = require("appHttp");

var handler = {
    foreignIpRegisterWarning : function(data, callback){
        var result = {success : false};
        mongo.db().collection('platform_foreign_ip_register_sip_warning_exclude').findOne({_id:data.sipNo},function(err, doc){
            if(err) {
                callback(result);
                return;
            }
            if(doc){
                result.success = true;
                result.message = 'exclude sipNo';
                callback(result);
                return;
            }
            mongo.db().collection('platform_sipNum').findOne({_id:data.sipNo},function(err, sipDoc){
                if(err) {
                    callback(result);
                    return;
                }
                mongo.db().collection('platform_foreign_ip_register_sip_warning_exclude').findOne({_id:sipDoc.account},function(err, resDoc){
                    if(err) {
                        callback(result);
                        return;
                    }
                    if(resDoc){
                        result.success = true;
                        result.message = 'exclude sipNo';
                        callback(result);
                        return;
                    }
                    var sendMail = {
                        toAddr: ['zhijian@7moor.com'],
                        ccAddr:['yunwei@7moor.com','dev@7moor.com'],
                        subject: "["+data.pbx+"]发现外国IP注册sip号",
                        type: "cdrWarning",
                        status: "undeal",
                        warningTime: utils.DateTime.getCurrentDateTime()
                    };
                    sendMail.content = data.pbx+" 发现外国IP注册sip号["+data.sipNo+"], ip="+data.ip+", 国家="+data.country
                        +", 国家id="+data.country_id+" , 报警时间"+utils.DateTime.getCurrentDateTime();
                    mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                        if (err) {
                            logger.app.error("send foreignIpRegisterWarning into mail error!");
                            callback(result);
                            return;
                        }
                        result.success = true;
                        callback(result);
                    });
                });
            });
        });
    },
    inRateLowWarning : function(data, callback){
        var result = {success : false};
        mongo.db().collection('platform_service_no_in_rate_warning_exclude').findOne({$or:[{_id:data.account},{_id:data.serviceNo}]},function(err, doc){
            if(err) {
                callback(result);
                return;
            }
            if(doc){
                result.success = true;
                result.message = 'exclude serviceNO';
                callback(result);
                return;
            }
            mongo.db().collection('platform_account').findOne({_id:data.account,businessTag:'outbound'},function(err, accDoc){
                if(err) {
                    callback(result);
                    return;
                }
                if(accDoc){
                    result.success = true;
                    result.message = 'exclude businessTag outbound account';
                    callback(result);
                    return;
                }
                var sendMail = {
                    //toAddr: ['chenguang@7moor.com'],
                    //ccAddr:[],
                    toAddr: ['zhijian@7moor.com'],
                    ccAddr:['yunwei@7moor.com','dev@7moor.com'],
                    subject: "["+data.serviceNo+"]呼入接通率过低，接通率为"+data.rate+"，时间："+data.hour+"点",
                    type: "cdrWarning",
                    status: "undeal",
                    warningTime: utils.DateTime.getCurrentDateTime()
                };
                sendMail.content = "服务号["+data.serviceNo+"]呼入接通率过低，接通率为"+data.rate+"，检查小时："+data.hour+"点"
                    +"账户["+data.account+"], 报警时间"+utils.DateTime.getCurrentDateTime();
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("send inRateLowWarning into mail error!");
                        callback(result);
                        return;
                    }
                    result.success = true;
                    callback(result);
                });
            });
        });
    },
    commonWarning : function(data, callback){
        var result = {success : false};
        var sendMail = {
            toAddr: ['chenguang@7moor.com'],
            ccAddr:[],
            subject: data.subject,
            type: "cdrWarning",
            status: "undeal",
            warningTime: utils.DateTime.getCurrentDateTime(),
            content: data.content
        };
        mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
            if (err) {
                logger.app.error("send commomWarning into mail error!");
                callback(result);
                return;
            }
            result.success = true;
            callback(result);
        });
    }
}

module.exports = handler;
