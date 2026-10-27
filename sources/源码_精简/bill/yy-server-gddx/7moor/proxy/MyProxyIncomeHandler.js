var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var fs = require("fs");
var config = require('appConfig');

var handler = {
    queryUserIncomeList: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;
        if(data.name){
            data.name=new RegExp(data.name);
        }
        if(data.loginName){
            data.loginName=new RegExp(data.loginName);
        }
        if(data.role){
            var role = data.role;
            data.role = {$all:[role]};
        }
        var sid=session._id;
        mongo.db().collection(constants.DB.system_user).find({parent:{$nin:[null,'']}},{_id:1,parent:1}).toArray( function (err, docs) {
            if(!err){
                docs= docs||[];
//                            console.log(docs)
                var lowUsers=[];
                var getMyAgent=function(pid){
                    for (var i = 0; i < docs.length; i++) {
                        var obj = docs[i];
                        if(obj.parent==pid){
                            lowUsers.push(obj._id);
                            getMyAgent(obj._id);
                        }
                    }
                }
                getMyAgent(sid );
                // lowUsers:  所有的下级  _id  集合
                // data:查询条件

               // console.log(lowUsers)
                data._id={$in:lowUsers};
                mongo.db().collection(constants.DB.system_user).count(data, function (err, count) {
                    if (!err) {
                        result.count = count;
                        mongo.db().collection(constants.DB.system_user).find(data, {
                            sort: {createTime: -1},
                            limit: limit,
                            skip: skip
                        }).toArray(function (err, accounts) {
                            if (!err) {
                                result.list = accounts || [];
                                result.success = true;
                            } else {
                                logger.app.warn("queryUserIncomeList list error", err);
                                result.message = "查询用户信息异常！";
                            }
                            callback(result);
                        });
                    } else {
                        logger.app.warn("queryUserIncomeList count error", err);
                        result.message = "查询用户信息异常！";
                        callback(result);
                    }
                });
            }else {
                logger.app.error(err);
                result.message="获取下属用户异常";
                callback(result);
            }
        });

    },
    getSysUserInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.system_user).findOne(data, function (err, dbUser) {
            if (!err) {
                if (dbUser) {
                    result.success = true;
                    result.data = dbUser;
                    callback(result);
                } else {
                    logger.app.error("getSysUserInfo:get systemUser info from db error! ", err);
                    result.message = "获取系统用户信息失败！";
                    callback(result);
                }
            } else {
                logger.app.error("getSysUserInfo:get systemUser info from db error! ", err);
                result.message = "获取系统用户信息失败！";
                callback(result);
            }
        });
    }

};

module.exports = handler;
