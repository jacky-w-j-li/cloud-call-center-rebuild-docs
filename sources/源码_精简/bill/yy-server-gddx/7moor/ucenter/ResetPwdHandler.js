var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var config = require('appConfig');
var fs = require("fs");
var systemUserHandler = require(__baseDir + "/7moor/system/SystemUserHandler");

var handler = {
    forgetPwd: function (data, callback) {
        var result = {success: false};
        var query={linkManEmail:data.linkManEmail};
        var time=utils.DateTime.getCurrentTimestamp();
        data.lastUpdate=time;

        mongo.db().collection(constants.DB.platform_account).findOne(query,function(err,row){
            if(!err){
                if(row){
                    handler._sendMail2Pwd(row);
                    result.success = true;
                    callback(result);
                }else{
                    logger.app.error('404 account not found!');
                    result.message="您输入的邮箱未注册，请重新输入";
                    callback(result);
                }
            }else{
                logger.app.error(err.stack);
                callback(result);
            }
        });
    },
    showReset:function(data,callback){
        var result={
            success:false,
            showView:true,
            view:"pay_blank.html",
            data:{}
        };
        var query={registeKey:data.key};
        mongo.db().collection(constants.DB.bill_system_mail_send).findOne(query,function(err,row){
            if(!err){
                if(row && !row.isUnavailable){
                    var sendTime=row.sendTime;
                    var currentTime=utils.DateTime.getCurrentDateTime();
                    var hour = utils.DateTime.getDateDiff(sendTime,currentTime, "hour");
                    if(hour<3){

                        var url=config.ucenterUrl+'/?sid='+row.registeKey+"&type=resetPwd";
                        var html='<script type="text/javascript">var url=\''+url+'\';window.location=url;</script>';
                        result.data={html:html};
                        result.success=true;
                        callback(result);
                    }else{
                        var html='链接已经失效';
                        result.data={html:html};
                        result.view="error_tips.html";
                        callback(result);
                    }
                }else{
                    var html='链接已经失效';
                    result.data={html:html};
                    result.view="error_tips.html";
                    callback(result);
                }
            }else{
                logger.app.error(err.stack);
                var html='err.stack';
                result.data={html:html};
                result.view="error_tips.html";
                callback(result);
            }
        });
    },
    resetPwd: function (data, callback) {
        var result = {success: false};
        var query={registeKey:data.key};
        mongo.db().collection(constants.DB.bill_system_mail_send).findOne(query,function(err,row){
            if(!err){
                if(row){
                    var set={managerPassword:data.newPwd};
                    mongo.db().collection(constants.DB.platform_account).update({_id:row.account},{$set:set},function(err){
                        if(!err){
                            mongo.db().collection(constants.DB.bill_system_mail_send).update(query,{$set:{isUnavailable:true}},function(err){
                                if(err){
                                    logger.app.error(err);
                                }
                            });
                            result.success = true;
                            callback(result);
                        }else{
                            logger.app.error(err.stack);
                            callback(result);
                        }
                    });
                }else{
                    logger.app.error('非法的请求');
                    result.message="非法的请求！";
                    callback(result);
                }
            }else{
                logger.app.error(err.stack);
                callback(result);
            }
        });
    },
    _sendMail2Pwd: function (data) {
        var sendMail = {
            toAddr: [data.linkManEmail],
            subject: "重置密码",
            type: "resetPwd",
            ccAddr: [config.proxyMail],
            status: "undeal",
            registeKey: utils.UUID.generateUuid(),
            account:data._id
        };
        fs.readFile(__baseDir + "/views/resetPwd/resetPwd.html", function (err, html) {
            if (!err) {
                var url = config.registeUrl + '/public?action=resetPwd.showReset&data={"key":"' + sendMail.registeKey + '"}';
                html = new String(html);
                var obj={
                    linkManEmail: data.linkManEmail,
                    url:encodeURI(url)
                }
                html = systemUserHandler._renderView(html,obj);
                sendMail.content = html;
                mongo.db().collection(constants.DB.bill_system_mail_send).insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("insert to send mail to db error!", err);
                    }
                });
            } else {
                logger.app.error("mail templete[_sendMail2Pwd] not found!", err);

            }
        });
    }

};

module.exports = handler;
