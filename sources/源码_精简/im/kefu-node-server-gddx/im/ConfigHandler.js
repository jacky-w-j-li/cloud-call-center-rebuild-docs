/**
 * Created by zengyx on 16/3/7.
 */

var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/im/common/Fields');
var utils = require('appUtil/Utils');
var logger = require('appLog');

/**
 * 获取多技能组
 * @param data
 * @param connection
 * @param callback
 */
exports.sdkGetPeers = function(data, connection, callback){
    var result = {Succeed: false};
    var accessId = connection.accessId;
    mongo.db().collection(fields.DB_APP_KEFU_IM_CONFIG).findOne({accessId: accessId},function(err, imconfig){
        if(!err && imconfig && imconfig.account){
            var toPeer = imconfig.ToPeer;
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
            if(peers.length<=0){
                result.Message = "没有可选的技能组用来处理消息";
                callback(result);
                return;
            }
            result.Succeed = true;
            result.Peers = peers;
            callback(result);
        }else{
            result.Message = "not found Config";
            logger.app.error("not found Config");
            callback(result);
        }
    });
};

exports.sdkGetInvestigateAndQA = function(){

}