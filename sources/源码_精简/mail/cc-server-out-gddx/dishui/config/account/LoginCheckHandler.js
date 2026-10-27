var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var fs = require("fs");

var handler = {
    getAccProductById: function (data, session, callback) {
        var result = {success: false};
        var query={_id:session.account._id};
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne(query, function (err, row) {
            if (!err) {
                result.success = true;
                result.data = row;
            } else {
                logger.app.error('db getAccountById error:' + err.stack);
                result.message = '404 account not found!';
            }
            callback(result);
        });
    },
    saveLoginCheck: function (data, session, callback) {
        var result = {success: false};
        var query={_id:session.account._id};
        mongo.db('bill').collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).update(query, {$set: data}, function (err) {
            if (!err) {
                result.success = true;
            } else {
                logger.app.error('saveLoginCheck error:', err);
            }
            callback(result);
        });
    },
    _renderView: function (view, data, dir) {
        var oldDir = null;
        if (dir) {
            dir = dir + '.';
        } else {
            dir = '';
        }
        for (var i in data) {
            if (typeof data[i] == 'object' && typeof data[i] != null) {
                oldDir = dir;
                dir = dir + i;
                view = handler._renderView(view, data[i], dir);
                dir = oldDir;
                oldDir = null;
            } else {
                view = view.replace(new RegExp('_#' + dir + i + '#_', 'g'), data[i]);
            }
        }
        return view;
    },
    sendMail2Authcode: function (data,loginName,callback) {
        var result={success:false};
        var authCode=utils.getAuthcode(6);
        var sendMail = {
            toAddr: [data.email],
            subject: "获取登录验证码",
            type: "loginAuthcode",
            ccAddr: [],
            status: "undeal",
            registeKey: utils.UUID.generateUuid(),
            account:data._id,//is agent id
            authCode:authCode
        };

        fs.readFile(__baseDir + "/views/sendAuthCode.html", function (err, html) {
            if (!err) {
                html = new String(html);
                var obj={
                    displayName: loginName,//data.displayName,
                    authCode:authCode
                }
                html = handler._renderView(html,obj);
                sendMail.content = html;
                mongo.db("bill").collection("bill_system_mail_send").insert(sendMail, function (err) {
                    if (err) {
                        logger.app.error("sendMail2Authcode insert to send mail to db error!", err);
                    }else{
                        result.success=true;
                        var set={
                            lastCodeKey:sendMail.registeKey
                        }
                        mongo.db("bill").collection(fields.DB_PLATFORM_USER).update({_id:data._id},{$set:set});
                        result.lastCodeKey=sendMail.registeKey
                        callback(result);
                    }
                });
            } else {
                logger.app.error("mail templete[sendAuthCode] not found!", err);
                callback(result);
            }
        });
    },
    checkAuthcode: function (data, callback) {
        var result = {success: false};
        var query={registeKey:data.lastCodeKey};
        mongo.db("bill").collection("bill_system_mail_send").findOne(query,function(err,row){
            if(!err){
                if(row){
                    if(row.authCode==data.authCode){
                        result.success = true;
                        callback(result);
                    }else{
                        result.message="验证码错误！";
                        logger.app.error(result.message);
                        callback(result);
                    }
                }else{
                    result.message="非法的请求！";
                    logger.app.error(result.message);
                    callback(result);
                }
            }else{
                logger.app.error(err.stack);
                callback(result);
            }
        });
    },
    retryMail2Authcode: function (data,session,callback) {
        var result={success:false};
        var query={registeKey:data.lastCodeKey};
        mongo.db("bill").collection("bill_system_mail_send").update(query,{$set:{status:"undeal"}},function(err){
            if(!err){
                result.success = true;
                callback(result);
            }else{
                logger.app.error(err.stack);
                callback(result);
            }
        });
    }
}

module.exports = handler;
