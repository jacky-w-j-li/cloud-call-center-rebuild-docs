var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var syncAcsHandler = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");

var handler = {
    queryNum400: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data._id) {
            data._id = new RegExp(data._id);
        }
        var beginTime = data.begin;
        delete data.begin;
        var endTime = data.end;
        delete data.end;
        if (beginTime) {
            data.endTime = {
                $gte: beginTime
            }
        }
        if (endTime) {
            if (data.endTime) {
                data.endTime.$lte = endTime;
            } else {
                data.endTime = {
                    $lte: endTime
                }
            }
        }
        mongo.db().collection(constants.DB.platform_num400).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_num400).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, nums) {
                    if (!err) {
                        nums = nums || [];
                        var accountIds = [];
                        for (var i = 0; i < nums.length; i++) {
                            if (nums[i].account) {
                                accountIds.push(nums[i].account)
                            }
                        }
                        mongo.db().collection(constants.DB.platform_account).find({_id: {$in: accountIds}}, {fields: {_id: 1, companyName: 1}}).toArray(function (err, accounts) {
                            if (!err) {
                                accounts = accounts || [];
                                nums = utils.ObjectUtil.linkObjects(nums, accounts, {account: "_id"}, "accountData");
                                result.list = nums || [];
                                if (nums && nums.length > 0) {
                                    for (var i = 0; i < nums.length; i++) {
                                        var data = nums[i];
                                        if (data.dialFee) {
                                            for (var key in data.dial400Fee) {
                                                data.dial400Fee[key] = utils.formatTrueFee(data.dial400Fee[key]);
                                            }
                                        }
                                        if (data.min400Consume) data.min400Consume = utils.formatTrueFee(data.min400Consume);
                                    }
                                }


                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.warn("query num400 link account error", err);
                                result.message = "查询400号关联账户信息异常！";
                                callback(result);
                            }
                        });

                    } else {
                        logger.app.warn("queryNum400 list error", err);
                        result.message = "查询400号信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryNum400 count error", err);
                result.message = "查询400号信息异常！";
                callback(result);
            }
        });
    },
    getNum400Info: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_num400).findOne(data, function (err, dbNum) {
            if (!err) {
                dbNum = dbNum || {};
                var data = dbNum;
                if (data.dial400Fee) {
                    for (var key in data.dial400Fee) {
                        data.dial400Fee[key] = utils.formatTrueFee(data.dial400Fee[key]);
                    }
                }
                if (data.min400Consume) data.min400Consume = utils.formatTrueFee(data.min400Consume);
                if (data.discount) data.discount = utils.formatTrueFee(data.discount);

                if (data.initFee) {
                    var init = data.initFee;
                    if (init.dial400Fee) {
                        for (var key in init.dial400Fee) {
                            init.dial400Fee[key] = utils.formatTrueFee(init.dial400Fee[key]);
                        }
                    }
                    if (init.min400Consume) init.min400Consume = utils.formatTrueFee(init.min400Consume);
                    if (init.min400ConsumeProxy) init.min400ConsumeProxy = utils.formatTrueFee(init.min400ConsumeProxy);
                }

                result.success = true;
                result.data = dbNum;
                callback(result);
            } else {
                logger.app.warn("getUserInfo  error", err);
                result.message = "查询400号信息异常！";
                callback(result);
            }
        });
    },
    addNum400: function (data, session, callback) {
        var result = {success: false};
        var type = data.serviceNumAddType.serviceNumAddType;
        delete data.serviceNumAddType;
        if (data.dial400Fee) {
            for (var i in data.dial400Fee) {
                data.dial400Fee[i] = utils.formatFee(data.dial400Fee[i]);
            }
        }
        if (data.min400Consume) data.min400Consume = utils.formatFee(data.min400Consume);
        if (type) {
            if (type == "single") {
                data._id = data.num400;
                delete data.num400;
                data.status = constants.serviceNumStatus.free;
                data.createTime = utils.DateTime.getCurrentDateTime();
                data.initFee = {
                    min400Consume : data.min400Consume,
                    dial400Fee : data.dial400Fee,
                    dial400FeeStrategy : data.dial400FeeStrategy
                };

                mongo.db().collection(constants.DB.platform_num400).insert(data, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("add single 400Num err!", err);
                        result.message = "添加400号异常！";
                        if (err.code == "11000") {
                            result.message = "400号[" + data._id + "]已经存在！";
                        }
                        callback(result);
                    }
                });
            } else {
                var begin = data.beginNum + "", end = data.endNum + "";
                delete data.beginNum;
                delete data.endNum;
                var prefix = "";
                if ((begin.substring(0, 1) == "0" && end.substring(0, 1) == "0") || (begin.substring(0, 1) !== "0" && end.substring(0, 1) !== "0")) {
                    if (begin.substring(0, 1) == "0" && end.substring(0, 1) == "0") {
                        prefix = "0";
                        begin = begin.substring(1);
                        end = end.substring(1);
                    }
                    begin = new Number(begin), end = new Number(end);
                    if (end > begin) {
                        var addNum = function (insertNum) {
                            var num = {
                                _id: prefix + insertNum,
                                createTime: utils.DateTime.getCurrentDateTime(),
                                status: constants.serviceNumStatus.free
                            };
                            utils.copyOjbData(num, data, []);
                            num.initFee = {
                                min400Consume : num.min400Consume,
                                dial400Fee : num.dial400Fee,
                                dial400FeeStrategy : num.dial400FeeStrategy
                            };
                            mongo.db().collection(constants.DB.platform_num400).insert(num, {w: 1}, function (err) {
                                if (!err) {
                                    begin++;
                                    if (begin > end) {
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        addNum(begin);
                                    }

                                } else {
                                    logger.app.warn("add num400[" + insertNum + "] err!", err);
                                    result.message = "添加400号[" + insertNum + "]异常！";
                                    callback(result);
                                }
                            });
                        };
                        addNum(begin);
                    } else {
                        logger.app.warn("add Num400  rule is not match!", new Error());
                        result.message = "400号规则错误！";
                        callback(result);
                    }
                } else {
                    logger.app.warn("add Num400  rule is not match!", new Error());
                    result.message = "400号规则错误！";
                    callback(result);
                }
            }
        } else {
            logger.app.warn("add Num400 type is empty!", new Error());
            result.message = "添加类型不能为空！";
            callback(result);
        }
    },
    updateNum400Init: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        delete data._id;
        if (data.dial400Fee) {
            for (var i in data.dial400Fee) {
                data.dial400Fee[i] = utils.formatFee(data.dial400Fee[i]);
            }
        }
        if (data.min400Consume) data.min400Consume = utils.formatFee(data.min400Consume);
        if (data.min400ConsumeProxy) data.min400ConsumeProxy = utils.formatFee(data.min400ConsumeProxy);

        mongo.db().collection(constants.DB.platform_num400).findOne({_id: id}, function (err, dbNum) {
            if (!err) {
                var updateData = {initFee: data};
                if (dbNum.status == "free") {
                    updateData.dial400FeeStrategy = data.dial400FeeStrategy;
                    updateData.dial400Fee = data.dial400Fee;
                    updateData.min400Consume = data.min400Consume;
                }
                mongo.db().collection(constants.DB.platform_num400).update({_id: id}, {$set: updateData}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("update serviceNum error!", err);
                        result.message = "更新400号异常！";
                        callback(result);
                    }
                });

            } else {
                logger.app.warn("update serviceNum error!", err);
                result.message = "更新400号异常！";
                callback(result);
            }
        });


    },
    updateNum400: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        delete data._id;
        if (data.dial400Fee) {
            for (var i in data.dial400Fee) {
                data.dial400Fee[i] = utils.formatFee(data.dial400Fee[i]);
            }
        }
        if (data.min400Consume) data.min400Consume = utils.formatFee(data.min400Consume);
        if (data.discount) data.discount = utils.formatFee(data.discount);
        mongo.db().collection(constants.DB.platform_num400).findOne({_id:id},function(err,dbNum){
            if(!err && dbNum){
                mongo.db().collection(constants.DB.platform_num400).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                    if (!err) {
                        if(data.concurrent && data.concurrent != dbNum.concurrent && dbNum.pbx && dbNum.account){
                            var requestData = {
                                pbx : dbNum.pbx,
                                account : dbNum.account,
                                concurrent : data.concurrent,
                                serviceno : id
                            };
                            syncAcsHandler.updateServiceNo(requestData,function(isSuccess){
                                result.success = isSuccess;
                                if(!result.success){
                                    result.message = "更新状态服务器失败！";
                                }
                                callback(result);
                            });
                        } else {
                            result.success = true;
                            callback(result);
                        }
                    } else {
                        logger.app.warn("update serviceNum error!", err);
                        result.message = "更新400号异常！";
                        callback(result);
                    }
                });


            } else {
                logger.app.warn("update serviceNum error!", err);
                result.message = "数据异常，无法找到服务号！";
                callback(result);
            }
        });

    },
    deleteNum400: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_num400).remove(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("delete serviceNum error!", err);
                result.message = "删除400号异常！";
                callback(result);
            }
        });
    },
    useNum400 : function (data,session,callback){
        var result = {success : false};
        var id = data._id;
        delete data._id;
        data.status = "use";
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_num400).update({_id:id},{$set:data},function(err){
            if(!err){
                result.success = true;
                callback(result);
            } else {
                result.message = "更新服务号异常!";
                callback(result);
            }
        });

    }
};

module.exports = handler;
