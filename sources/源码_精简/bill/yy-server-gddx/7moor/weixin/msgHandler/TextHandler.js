var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");


var handler ={
    handle : function(data,callback){
         var fromUser = data.FromUserName;
        mongo.db().collection(constants.DB.platform_weixin_user).findOne({_id:fromUser},function(err,dbUser){
           if(!err && dbUser){
                if(dbUser.textStatus == "bind"){
                    var msg = {
                        ToUserName : data.FromUserName,
                        FromUserName : data.ToUserName,
                        CreateTime : utils.DateTime.getCurrentTimestamp(),
                        MsgType : "text"
                    };
                    var bindInfo = data.Content;
                    var info = bindInfo.split("@");
                    if(info.length == 2){
                        var account = info[1],username = info[0];
                        mongo.db().collection(constants.DB.platform_account).findOne({name:account},function(err,dbAccount){
                           if(!err && dbAccount){
                               mongo.db().collection(constants.DB.platform_user).findOne({account:dbAccount._id,exten:username},function(err,dbPlatUser){
                                   if(!err && dbPlatUser){
                                       mongo.db().collection(constants.DB.platform_weixin_user).findOne({user:dbPlatUser._id,status:constants.weixinUserStatus.valid},function(err,dbBindUser){
                                          if(!dbBindUser || dbBindUser._id == dbUser._id){
                                              mongo.db().collection(constants.DB.platform_weixin_user).update({_id:dbUser._id},{$set:{status:constants.weixinUserStatus.waitValid,textStatus:"valid",account:dbAccount._id,user:dbPlatUser._id}},{w:1},function(err){
                                                  if(!err){
                                                      msg.Content = "请输入登陆密码进行账户验证。直接发送密码即可。";
                                                      callback(null,msg);
                                                  } else {
                                                      msg.Content = "操作失败，请再次发送。";
                                                      callback(null,msg);
                                                  }
                                                });
                                          } else {
                                              msg.Content = "此账户已被其他人绑定，请联系管理员，或换一个账户进行绑定。";
                                              callback(null,msg);
                                          }
                                       });
                                   } else {
                                       msg.Content = "没有找到要绑定的用户，请确认用户信息，重新输入。name@company";
                                       callback(null,msg);
                                   }
                               });
                           } else {
                               msg.Content = "没有找到要绑定的账户，请确认账户信息，重新输入。name@company";
                               callback(null,msg);
                           }
                        });
                    } else {
                        msg.Content = "绑定信息格式错误，请重新输入。name@company";
                        callback(null,msg);
                    }
                } else if(dbUser.textStatus == "valid"){
                    var msg = {
                        ToUserName : data.FromUserName,
                        FromUserName : data.ToUserName,
                        CreateTime : utils.DateTime.getCurrentTimestamp(),
                        MsgType : "text"
                    };
                    var bindInfo = data.Content;
                    mongo.db().collection(constants.DB.platform_user).findOne({_id:dbUser.user,password:bindInfo},function(err,findUser){
                       if(findUser){
                           msg.Content = "账号绑定成功！";
                           callback(null,msg);
                           mongo.db().collection(constants.DB.platform_weixin_user).update({_id:dbUser._id},{$set:{status:constants.weixinUserStatus.valid,textStatus:"text"}});
                       } else {
                           msg.Content = "密码认证错误，请重新输入！！";
                           callback(null,msg);
                       }
                    });
                }else{
                    var msg = {
                        ToUserName : data.FromUserName,
                        FromUserName : data.ToUserName,
                        CreateTime : utils.DateTime.getCurrentTimestamp(),
                        MsgType : "text",
                        Content : "ok"
                    };
                    callback(null,msg);
                }
           } else {
               logger.app.warn("can not found weixin link User!",err || new Error());
               callback(new Error());
           }
        });
    }
};


module.exports = handler;


