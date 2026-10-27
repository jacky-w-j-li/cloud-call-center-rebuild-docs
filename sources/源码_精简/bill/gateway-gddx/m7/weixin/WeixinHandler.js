/**
 * Created by zhangyang on 15/5/6.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/m7/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");


var handler = {
    newMessage: function (data, callback) {
        var result = {success: false};
        //通过公众号id 获取 账户id
        var openID = data.openID || "";
        _impl.getWeixinAccount(openID, function (account) {
            if (account) {
                data.createTime = utils.getCurrentDate();
                data.account = account;
                data.status = "undeal";
                data.type = "in";
                //入库
                _impl.saveWeixin(data,function(err){
                    if(!err){
                        //获取pbx信息
                        _impl.getPbxInfo(account,function(pbx){
                            if (pbx){
                                //推送给状态服务器
                                _impl.pushMessage(pbx,data,function(success){
                                    logger.app.info("weixin push " + success?"success":"failure");
                                });
                            } else {
                                logger.app.error("can not found pbx info!");
                            }
                        });
                        result.success = true;
                        callback(result);
                    } else {
                        result.message = "获取用户信息失败！";
                        callback(result);
                    }
                });
            } else {
                result.message = "can not found account!";
                callback(result);
            }
        });


    }
};

var _impl = {
    pushMessage : function (pbx , data , callback){
        var url = pbx.assAddr || "";

        var postData =  {
            Action : "NewWeixin",
            ActionID: utils.UUID.generateUuid(),
            Account: data.account,
            OpenID : data.openID,
            PBX : pbx._id,
            UserID : data.userID,
            NickName : encodeURIComponent(data.nickname),
            MessageId : data._id,
            MsgType : data.msgType,
            Content : encodeURIComponent(data.content),
            CreateTime : data.createTime
        };

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
    saveWeixin: function (data , callback) {
        var userID = data.userID || "";
        var account = data.account || "";
        mongo.db().collection(fields.DB_APP_WEIXIN_USER).findOne({_id:userID + "_" + account},function(err, dbUser){
            if(!dbUser){
                _impl.getUserInfo(data,function(userInfo){
                    if(userInfo){
                        data.nickname = userInfo.nickname;
                        callback(null);
                    } else {
                        callback(new Error("获取用户信息失败！"));
                    }
                });

            } else {
                data.nickname = dbUser.nickname;
                callback(null);
            }
        });

        mongo.db().collection(fields.DB_APP_WEIXIN).insert(data);
    },
    getUserInfo : function (data , callback){
        var url = config.weixinFuncUrl || ""
        var requestData = {
            userID : data.userID,
            openID : data.openID,
            action : "getUserInfo",
            language : "zhCN"
        };
        httpProvider.sendPost(url , JSON.stringify(requestData), function (err , response){
            response = response || "{}";
            response = JSON.parse(response);
            if(!err && response.statusCode == "000000"){
                var dbUser = {
                    _id : data.userID + "_" + data.account,
                    account : data.account,
                    nickname : response.nickname,
                    sex : response.sex,
                    city : response.city,
                    country : response.country,
                    province : response.province,
                    language : response.language,
                    headImgUrl : response.headImgUrl,
                    groupId : response.groupId,
                    subscribe : response.subscribe,
                    subscribeTime : response.subscribeTime,
                    remark : response.remark
                };
                mongo.db().collection(fields.DB_APP_WEIXIN_USER).insert(dbUser);
                callback(dbUser);
            } else {
                callback(null);
            }
        });
    },
    getWeixinAccount: function (openId, callback) {
        var condition = {
            openID: openId
        };
        mongo.db().collection(fields.DB_APP_WEIXIN_CONFIG).findOne(condition, function (err, dbConfig) {
            if (!err && dbConfig) {
                callback(dbConfig.account);
            } else {
                logger.app.error("not found weixinConfig by openId[" + openId + "]");
                callback(null);
            }
        });
    }
};

module.exports = handler;

