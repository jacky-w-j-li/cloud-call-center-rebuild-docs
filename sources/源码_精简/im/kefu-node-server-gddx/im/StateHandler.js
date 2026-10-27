/**
 * Created by yaxi on 2015-07-30.
 */
var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/im/common/Fields');
var logger = require('appLog');
var utils = require('appUtil/Utils');

var statesHandler = {
    validateEmebedState : function (data, callback) {
        var condition = {
            accessId : data.accessId
        };
        callback({success:true});
        console.log(data);
        var addToSet = {};
        if(data.location){
            addToSet.location = decodeURIComponent(data.location);
            mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne(condition, function(err, doc){
                if(doc && ((doc.location && doc.location.length<5) || !doc.location)){
                    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).updateOne(condition, {$set:{haveAuthrizedCheck: true}, $addToSet: addToSet});
                }
            });
        }
    },

    getAbilityVersion: function(data, callback){
        var result = {success: true};
        mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, function(err, imconfig){
            if(!err && imconfig && imconfig.account){
                delete imconfig.location;
                var toPeer = imconfig.ToPeer;
                delete imconfig.ToPeer;
                var peerArr = [];
                if(typeof toPeer == "string"){
                    peerArr.push({name:'在线咨询', id: toPeer, status:'enable'});
                }else{
                    peerArr = toPeer;
                }
                var peers = [];
                for(var i=0; i< peerArr.length; i++){
                    if(peerArr[i].status == "enable"){
                        peers.push(peerArr[i]);
                    }
                }
                imconfig.peers = peers;
                if(peers.length<=0){
                    result.success = false;
                    result.message = "没有可选的技能组用来处理消息";
                    callback(result);
                    return;
                }

                result = imconfig;
                result.success = true;
                result.serviceStates = 1;
                delete result.serviceTime;
                mongo.db().collection(fields.DB_APP_KEFU_IM_VERSION).findOne({type:'ability', enable:true}, function(err, versionDoc){

                    if(!err && versionDoc){
                        result.version = versionDoc.version;
                        callback(result);
                    }else{
                        result.version = new Date().getTime();
                        callback(result);
                    }
                });

            }else{
                logger.app.error("not found webchatConfig");
                callback(result);
            }
        });

    },
    getOnlineStates : function(data, callback){
        var condition = {
            accessId : data.accessId
        };
        var location1 = decodeURIComponent(data.location);
        var result = {success: false};
        mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne(condition, function(err, imconfig){
            if(!err && imconfig && imconfig.account){
                var location = imconfig.location ||[];
                delete imconfig.location;
                var toPeer = imconfig.ToPeer;
                delete imconfig.ToPeer;
                var peerArr = [];
                if(typeof toPeer == "string"){
                    peerArr.push({name:'在线咨询', id: toPeer, status:'enable'});
                }else{
                    peerArr = toPeer;
                }
                var peers = [];
                for(var i=0; i< peerArr.length; i++){
                    if(peerArr[i].status == "enable"){
                        peers.push(peerArr[i]);
                    }
                }
                imconfig.peers = peers;
                if(peers.length<=0){
                    result.success = false;
                    result.message = "没有可选的技能组用来处理消息";
                    callback(result);
                    return;
                }
                result = imconfig;
                result.haveAuthrizedCheck = false;
                for(var i=0; i< location.length; i++){
                    if(location1 && location[i].indexOf(location1) != -1){
                        result.haveAuthrizedCheck = true;
                        break;
                    }
                }
                result.success = true;
                result.serviceStates = 1;
                delete result.serviceTime;

                mongo.db().collection(fields.DB_APP_KEFU_IM_VERSION).findOne({type:'emebed', enable:true}, function(err, versionDoc){
                    if(!err && versionDoc){
                        result.version = versionDoc.version;
                        callback(result);
                    }else{
                        result.version = new Date().getTime();
                        callback(result);
                    }
                });
            }else{
                logger.app.error("not found webchatConfig");
                callback(result);
            }
        });

    },


    //getAbilityVersion: function(data, callback){
    //    var result = {success: true};
    //    mongo.db().collection(fields.DB_APP_KEFU_IM_VERSION).findOne({type:'ability', enable:true}, function(err, versionDoc){
    //
    //        if(!err && versionDoc){
    //            result.version = versionDoc.version;
    //            callback(result);
    //        }else{
    //            result.version = new Date().getTime();
    //            callback(result);
    //        }
    //    });
    //},
    //getOnlineStates : function(data, callback){
    //    var condition = {
    //        accessId : data.accessId
    //    };
    //    var location1 = decodeURIComponent(data.location);
    //    var result = {success: false};
    //    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne(condition, function(err, imconfig){
    //        if(!err && imconfig && imconfig.account){
    //            var location = imconfig.location ||[];
    //            delete imconfig.location;
    //            result = imconfig;
    //            result.haveAuthrizedCheck = false;
    //            for(var i=0; i< location.length; i++){
    //                if(location1 && location[i].indexOf(location1) != -1){
    //                    result.haveAuthrizedCheck = true;
    //                    break;
    //                }
    //            }
    //            result.success = true;
    //            result.serviceStates = 1;
    //            delete result.serviceTime;
    //            mongo.db().collection(fields.DB_APP_KEFU_IM_VERSION).findOne({type:'emebed', enable:true}, function(err, versionDoc){
    //
    //                if(!err && versionDoc){
    //                    result.version = versionDoc.version;
    //                    callback(result);
    //                }else{
    //                    result.version = new Date().getTime();
    //                    callback(result);
    //                }
    //            });
    //
    //
    //        }else{
    //            logger.app.error("not found webchatConfig");
    //            callback(result);
    //        }
    //    });
    //
    //},

    checkOnlineAgent : function(data, callback){
    var result = {
        success: false
    }
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, function(err, config){
        if(!config.ToPeer){
            callback(result);
            return;
        }
        if(config.ToPeer == ''){
            callback(result);
            return;
        }
        mongo.db().collection(fields.DB_APP_MAIL_QUEUE).findOne({Exten: config.ToPeer}, function(err, queue){
            if(err || !queue){
                callback(result);
                return;
            }
            if(queue.AssignMembers.length > 0){
                var agentIds = [];
                for(var i=0 ;i<queue.AssignMembers.length;i++){
                    agentIds.push(queue.AssignMembers[i].agentID)
                }
                mongo.db().collection(fields.DB_APP_PUSH_CLIENT).find({_id:{$in: agentIds}}).toArray(function(err,docs){
                    if(!err && docs && docs.length > 0){
                        result.success = true;
                    }
                    callback(result);
                });
            }
        })
    })
},

    /**
     * 获取全局的设置
     * 断开时间+是否留言
     */
    getWebchatGlobleConfig:function(data, callback){
        var result = {success: true};
        mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: data.accessId}, function (err, imconfig) {
            if (!err && imconfig && imconfig.account) {
                mongo.db().collection(fields.DB_APP_KEFU_GLOBAL_SET).findOne({account:imconfig.account}, function(err, globalSet){
                    if(err || !globalSet){
                        result.globalSet={
                            break_len:10,
                            break_tips_len:3,
                            break_tips:'您已经很长时间没有发送消息了,再过3分钟,系统将自动断开会话',
                            isLeaveMsg:"1",
                            msg:'客服不在线,系统将自动断开会话',
                        };
                    }else{
                        delete globalSet.account;
                        if(!globalSet.msg){
                            globalSet.msg = "客服不在线,系统将自动断开会话";
                        }
                        result.globalSet = globalSet;

                    }
                    callback(result);

                });
            } else {
                callback({success: false});
            }
        });
    }

};

module.exports = statesHandler;