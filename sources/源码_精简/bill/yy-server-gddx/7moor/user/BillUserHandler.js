var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    /**
     * 获取用户信息列表
     * @param data
     * @param session
     * @param callback
     */
    queryUser: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.displayName) {
            data.displayName = new RegExp(data.displayName);
        }

        mongo.db().collection(constants.DB.platform_user).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_user).find(data, {sort: {account: 1}, limit: limit, skip: skip, fields: {_id: 1, account: 1, displayName: 1, email: 1, exten: 1, mobile: 1, pbx: 1}}).toArray(function (err, users) {
                    if (!err) {
                        users = users || [];
                        var accountIds = [];
                        for (var i = 0; i < users.length; i++) {
                            if (users[i].account) {
                                accountIds.push(users[i].account)
                            }
                        }
                        mongo.db().collection(constants.DB.platform_account).find({_id: {$in: accountIds}}, {fields: {_id: 1, companyName: 1}}).toArray(function (err, accounts) {
                            if (!err) {
                                accounts = accounts || [];
                                users = utils.ObjectUtil.linkObjects(users, accounts, {account: "_id"}, "accountData");
                                result.list = users || [];
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.warn("queryUser link account error", err);
                                result.message = "查询用户关联账户信息异常！";
                                callback(result);
                            }
                        });
                    } else {
                        logger.app.warn("queryUser list error", err);
                        result.message = "查询用户信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryUser count error", err);
                result.message = "查询用户信息异常！";
                callback(result);
            }
        });
    },
    /**
     * 获取单个用户信息
     * @param data
     * @param session
     * @param callback
     */
    getUserInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_user).findOne(data, function (err, dbUser) {
            if (!err) {
                dbUser = dbUser || {};
                var data = {
                    user : dbUser
                };
                result.success = true;
                result.data = data;
                callback(result);
            } else {
                logger.app.warn("getUserInfo  error", err);
                result.message = "查询用户信息异常！";
                callback(result);
            }
        });
    },
    /**
     * 更新用户信息
     * @param data
     * @param session
     * @param callback
     */
    updateUserInfo : function(data,session,callback){
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(constants.DB.platform_user).update({_id:id},{$set:data},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateUserInfo  error", err);
                result.message = "更新用户信息异常！";
                callback(result);
            }
        });
    }
};


module.exports = handler;

