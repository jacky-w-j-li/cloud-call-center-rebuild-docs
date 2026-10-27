/**
 * Created by zhangyang on 15/4/30.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/m7/common/Fields');
var httpProvider = require("appHttp");


var handler = {
    newMail: function (data, callback) {
        var result = {success : false};
        var mailId = data.mailId;
        //通过mailId获取账户信息
        _impl.getMailAccount(mailId,function(accountId){
            if(accountId){
                data.createTime = utils.getCurrentDate();
                data.account = accountId;
                data.status = "undeal";
                data._id = utils.UUID.generateUuid();
                //入库
                _impl.saveMail(data);
                //通过账户获取pbx信息
                _impl.getPbxInfo(accountId,function(pbx){
                    if(pbx){
                        //并推送给状态服务器
                        _impl.pushMail(pbx,data,function(success){
                            logger.app.info("mail push " + success?"success":"failure");
                        });
                    } else {
                       result.message = "can not found pbx info!";
                        callback(result);
                    }
                });
                result.success = true;
                callback(result);
            } else {
                result.message = "can not found account!";
                callback(result);
            }
        });
    }
};

var _impl = {
    pushMail : function(pbx,data,callback){
        var url = pbx.assAddr || "";

        var postData =  {
            Action : "NewMail",
            ActionID: utils.UUID.generateUuid(),
            Account: data.account,
            Address : data.mailId,
            PBX : pbx._id,
            Subject : data.subject,
            From : data.fromName+"<"+data.from+">",
            To : utils.getArrayString(data.to) ,
            Cc : utils.getArrayString(data.cc),
            MailId : data._id,
            CreateTime : data.receiveTime || utils.getCurrentDate()
        };
        console.log(url);
        console.log(JSON.stringify(postData));

        httpProvider.sendPost(url,"json=" + JSON.stringify(postData),function(err,response){
            if(!err){
                console.log("success==============");
                callback(true);
            } else {
                console.log("err==============");
                callback(false);
            }
        });



    },

    getPbxInfo : function(accountId,callback){
        var condition = {
            _id : accountId + "_cc"
        };
        mongo.db("bill").collection(fields.DB_PLATFORM_ACCOUNT_PRODUCT).findOne(condition,function(err,dbConfig){
            if(!err && dbConfig){
                var pbx = dbConfig.pbx;
                if(pbx && pbx[0]){
                    var pbxId = pbx[0].PBX;
                    mongo.db("bill").collection(fields.DB_PLATFORM_PBX).findOne({_id:pbxId},function(err , dbPBX){
                        if(!err && dbPBX){
                            callback(dbPBX);
                        } else {
                            logger.app.error("can not found  pbx by id["+pbxId+"]");
                            callback
                        }
                    });
                } else {
                    logger.app.error("valid  account pbx by id["+accountId+"]");
                    callback(null);
                }

            } else {
                logger.app.error("not found account pbx by id["+accountId+"]");
                callback(null);
            }
        });

    },

    saveMail : function (mail){
        mail.subject = decodeURIComponent(mail.subject.replace(/\+/g, '%20'));
        mail.content = decodeURIComponent(mail.content.replace(/\+/g, '%20'));
        mail.type = "in";
        mongo.db().collection(fields.DB_APP_MAIL).insert(mail);
    },

    getMailAccount : function(mailId , callback){
        var condition = {
            mailId : mailId
        };
        mongo.db().collection(fields.DB_APP_MAIL_CONFIG).findOne(condition,function(err,dbConfig){
            if(!err && dbConfig){
                callback(dbConfig.account);
            } else {
                logger.app.error("not found mailConfig by id["+mailId+"]");
                callback(null);
            }
        });
    }

}

module.exports = handler;
