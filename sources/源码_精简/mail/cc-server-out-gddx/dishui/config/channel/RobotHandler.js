/**
 * Created by yaxi on 2015-09-29.
 */
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var config = require('appConfig').conf;
var httpProvider = require("appHttp");
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var crypto = require('crypto');

exports.robotLogin = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).findOne(data, function (err,robot) {
        if (!err) {
            console.log(robot);
            result.success = true;
            var ts = utils.getCurrentDateTime();
            var robotData = config.robot_unionCode+";" + robot.account+";"+ts+";"+config.robot_status;
            cipher("aes-128-cbc", config.robot_secret_key, robotData, function(token){
                result.data = config.robot_loginUrl+"?unionCode="+config.robot_unionCode+"&ts="+ts+"&token="+token;
                callback(result);
            });

        } else {
            logger.app.error('db queryRobotById error:' + err.stack);
            result.message = '404 robot not found!';
            callback(result);
        }
    });
}

exports.queryRobot = function(data, session, callback){
    var result = {success: false};
    var pageSize = data.limit;
    delete data['limit'];
    var page = data.page;
    delete data['page'];
    pageSize = pageSize || 10;
    page = page || 1;
    var limit = pageSize;
    var skip = (page - 1) * pageSize;
    var condition = data;

    if(!condition.account){
        condition.account = session.user.account;
    }
    if (condition.name)
        condition.robot_name = new RegExp(condition.name);
    utils.removeEmptyProperty(condition);
    mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).find(condition, {sort: {"$natural": -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
        if (!err) {
            result.list = docs;
            mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).count(condition, function (err, count) {
                if (!err) {
                    result.count = count;
                    result.success = true;
                    callback(result);
                } else {
                    logger.app.error(err);
                    callback({success: false, list: [], count: 0});
                }
            });
        } else {
            logger.app.error(err);
            callback({success: false, list: [], count: 0});
        }
    });
};

exports.queryRobotById = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).findOne(data, function (err,robot) {
        if (!err) {
            result.success = true;
            result.data = robot;
            callback(result);
        } else {
            logger.app.error('db queryRobotById error:' + err.stack);
            result.message = '404 robot not found!';
            callback(result);
        }
    });
};

exports.deleteRobotCfg = function(data, session, callback){
    var result = {success: false};
    mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).findOne({_id:data._id},function(err,robot){
        if(!err){
            if(robot){
                mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).remove({_id: data._id}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error('db deleteRobotCfg error:' + err.stack);
                        result.message = '404 robot not found!';
                        callback(result);
                    }
                });
            }else{
                result.message = '404 robot not found!';
                callback(result);
            }
        }else{
            result.message = 'find this robot failed!';
            callback(result);
        }
    });
};

exports.addRobotCfg = function(data, session, callback){
    var result = {success: false};
    var aid=session.user.account;
    var robotQuery = {
        ts: utils.getCurrentDateTime(),
        uid: aid,
        email: aid+"@7moor.com",
        name: "容联七陌",
        companyName: "容联七陌科技有限公司",
        phone: ""
    };
console.log(robotQuery);
    robot_interface.register(robotQuery, function(err, r){
        if(err){
            result.message = err;
            callback(result);
        }else{
            if(r.errcode == 0 || r.errorcode == 0){
                data._id = utils.UUID.generateUuid();
                data.account=aid;
                data.createTime=utils.getCurrentDate();
                data.robot_sysNum = r.data.sysNum;
                mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).insert(data, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error('[addRobotCfg]db insert error:' + err.stack);
                        result.message = 'db insert error!' + err.message;
                        callback(result);
                    }
                });
            }else if(r.errcode == -1 || r.errorcode == -1){
                logger.app.info(r);
                result.message = "开通失败";
                callback(result);
            }else if(r.errcode == -3 || r.errorcode == -3){
                result.message = "请求数据错误，注册失败";
                callback(result);
            }else{
                result.message = r.errormsg;
                callback(result);
            }

        }

    });

};


exports.updateRobotCfg = function(data, session, callback){
    var result = {success: false};
    var id = data._id;

    mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).findOne({_id:id},function(err,robot){
        if(!err){
            if(robot){
                var update = {
                    updateTime: utils.getCurrentDate(),
                    robot_name : data.robot_name
                };
                mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).update({_id:id},{$set:update}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error('db update error:' + err.stack);
                        result.message = 'db update error!' + err.message;
                        callback(result);
                    }
                });
            }else{
                result.message = '未找到该智能机器人配置号！';
                callback(result);
            }
        }else{
            logger.app.error('db query error:' + err.stack);
            result.message = 'db query error!' + err.message;
            callback(result);
        }
    });
};


var robot_interface = {
    register : function(data, callback){
        cipher("aes-128-cbc", config.robot_secret_key, JSON.stringify(data), function(token){

            var registerData = {
                ts: data.ts,
                unionCode: config.robot_unionCode,
                token: token
            };
            logger.app.info(registerData);
            httpProvider.sendPost(config.robot_registerUrl+"?ts="+data.ts+"&unionCode="+config.robot_unionCode+"&token="+token, "", function(err, response){

                response = response || "{}";
                var r = null;
                try {
                    r = JSON.parse(response);
                } catch (e) {
                    logger.app.error("register error:" + e);
                    callback("register error");
                    return;
                }
                if(err){
                    callback("robot register failure");
                }else{
                    callback(null, r);
                }
            });
        });

    }

};

//加密
function cipher(algorithm, key, data ,callback){
    logger.app.info(data);
    var encrypted = "";
    var cip = crypto.createCipheriv(algorithm, key, key);
    var srawt = new Buffer(data);
    var len = srawt.length;
    while(len % 16 != 0) len ++;
    var sraw = new Buffer(len);
    /* 在最后补0 */
    for (var i = 0; i < len; ++i) {
        if (i < srawt.length) {
            sraw[i] = srawt[i];
        } else {
            sraw[i] = 0;
        }
    }
    encrypted+=cip.update(sraw, 'utf8', 'base64');
    encrypted+=cip.final('base64');
    if(callback && "function" == typeof callback){
        callback(encodeURIComponent(encrypted));
    }else{
        return encodeURIComponent(encrypted);
    }

}

exports.getRobotConfig= function(session, callback){
    mongo.db().collection(fields.DB_APP_KEFU_IM_ROBOT_CONFIG).find({account: session.user.account}).toArray(function(err, docs){
        if(!err){
            if(docs){
                callback(null, docs);
            }else{
                callback(null,[]);
            }
        }else{
            callback(err);
        }

    });
}
