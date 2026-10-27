/**
 * Created by cx on 16/9/27.
 */
var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var logger = require('appLog');
var md5 = require('crypto/md5');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;


exports.collectAgentPCInfo = function (data, session, callback) {
    var result = {success: false};
    var _id = session.user._id;
    httpProvider.sendGet(config.ip_url + "?action=locateIP&ip=" + encodeURI(data.ip), function (err, ipres) {
        if (err) {
            logger.app.error("locate ip fail" + err);
        }
        if(ipres)
        var tmp = JSON.parse(ipres).data;
        if(tmp){
            data.area = tmp.nation+" "+tmp.province+" "+tmp.city;
        }else{
            data.area = "未知"
        }
        var updateData ={
            $addToSet: {os : {$each : [data.os]},resolution : {$each : [data.resolution]},version : {$each : [data.version]},
                area : {$each : [data.area]}, userAgent : {$each : [data.userAgent]},ip : {$each : [data.ip]}},

        };
        mongo.reportDb("cc_collect").collection(fields.COLLECT_AGENT_PC_INFO).update({_id: _id},
            updateData,{upsert:true}, function (err) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                } else {
                    result.success = true;
                    callback(result);
                }
            });
    })
}