/**
 * Created by zhangyang on 15/5/4.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var fields = require(__baseDir + '/m7/common/Fields');

var handler = {
    sendMail: function (data, callback) {
        var result = {success: false};
        //入库
        var dbMail = {
            _id: data._id,
            mailId: data.mailId,
            from: data.mailId,
            to: utils.getStringArray(data.to),
            cc: utils.getArrayString(data.cc),
            subject: decodeURIComponent(data.subject),
            content: decodeURIComponent(data.content),
            attachment : _impl.processAttachment(data.attachment),
            rid: data.rid || "",
            user : data.user,
            status: "undeal",
            account: data.account,
            createTime: utils.getCurrentDate(),
            type: "out"
        };

        mongo.db().collection(fields.DB_APP_MAIL).insert(dbMail, function (err) {
            if (!err) {
                //发送
                _impl.sendMail(data, function (success) {
                    if (success) {
                        mongo.db().collection(fields.DB_APP_MAIL).update({_id:data._id},{$set:{status:"deal"}});
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "邮件发送异常！";
                        callback(result);
                    }
                });
            } else {
                result.message = "存储邮件异常！"
                callback(result);
            }
        });

    }
};

var _impl = {

    processAttachment : function(attachment){
        var data = [];
        for(var i =0;i<attachment.length;i++){
            data[i] = {};
            utils.copyOjbData(data[i],attachment[i]);
        }


        for (var i = 0; i < data.length; i++) {
            var attach = data[i];
            attach.fileName = decodeURIComponent(attach.fileName);
        }
        return data;
    },

    sendMail: function (data, callback) {
        var mail = {
            action: "sendMail",
            actionId: utils.UUID.generateUuid(),
            mailId: data.mailId,
            to: data.to,
            cc: data.cc || "",
            title: data.subject,
            content: data.content,
            attachment : data.attachment
        };
        var url = config.mailUrl || "";

        httpProvider.sendPost(url, JSON.stringify(mail), function (err, response) {
            response = response || "{}";
            response = JSON.parse(response);
            if (!err && response.Succeed) {
                callback(true);
            } else {
                callback(false);
            }
        });

    }
};


module.exports = handler;
