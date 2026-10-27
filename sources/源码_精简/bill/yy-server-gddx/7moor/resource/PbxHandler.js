var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");

var Then = require('thenjs');

var ZjPbx = require(__baseDir + "/models/ZjPbx");
var CcPbx = require(__baseDir + "/models/CcPbx");
var handler = {
    /**
     * 获取pbx列表信息
     * @param data
     * @param session
     * @param callback
     */
    queryPbx: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data._id) data._id = new RegExp(data._id);
        if (data.name) data.name = new RegExp(data.name);
        if (data.sipAddr) data.sipAddr = new RegExp(data.sipAddr);
        data.status = constants.pbxSataus.enable;

        mongo.db().collection(constants.DB.platform_pbx).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_pbx).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, pbxs) {
                    if (!err) {
                        pbxs = pbxs || [];
                        result.success = true;
                        result.list = pbxs;
                        callback(result);
                    } else {
                        logger.app.warn("queryPbx list error", err);
                        result.message = "查询pbx信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryPbx count error", err);
                result.message = "查询pbx信息异常！";
                callback(result);
            }
        });
    },
    queryCcPbx: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data._id) data._id = new RegExp(data._id);
        if (data.name) data.name = new RegExp(data.name);
        if (data.sipAddr) data.sipAddr = new RegExp(data.sipAddr);
        data.status = constants.pbxSataus.enable;

        mongo.db().collection(constants.DB.platform_cc_pbx).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_cc_pbx).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, pbxs) {
                    if (!err) {
                        pbxs = pbxs || [];
                        result.success = true;
                        result.list = pbxs;
                        callback(result);
                    } else {
                        logger.app.warn("queryPbx list error", err);
                        result.message = "查询pbx信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryPbx count error", err);
                result.message = "查询pbx信息异常！";
                callback(result);
            }
        });
    },

    /**
     * 获取单个pbx信息
     * @param data
     * @param session
     * @param callback
     */
    getPbxInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_pbx).findOne(data, function (err, dbPbx) {
            if (!err) {
                dbPbx = dbPbx || {};
                result.success = true;
                result.data = dbPbx;
                callback(result);
            } else {
                logger.app.warn("getPbxInfo  error", err);
                result.message = "查询pbx信息异常！";
                callback(result);
            }
        });
    },
    getCcPbxInfo : function ( data,session,callback){
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_pbx).findOne(data, function (err, dbPbx) {
            if (!err) {
                dbPbx = dbPbx || {};
                result.success = true;
                result.data = dbPbx;
                callback(result);
            } else {
                logger.app.warn("getPbxInfo  error", err);
                result.message = "查询pbx信息异常！";
                callback(result);
            }
        });
    },
    /**
     * 添加pbx
     * @param data
     * @param session
     * @param callback
     */
    addPbx: function (data, session, callback) {
        //var result = {success: false,tag:false};//tag用于判断添加cc信任ip是否成功
        var result = {success: false};
        data.status = constants.pbxSataus.enable;
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        mongo.db().collection(constants.DB.platform_pbx).insert(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
                //总机暂不添加
                //mongo.db("cc").collection(constants.DB.access_ip).insert({"_id":data.routeIp,"name":data.name}, {w: 1}, function (err) {
                //    if (!err) {
                //        result.tag = true;
                //        callback(result);
                //    } else {
                //        logger.app.warn("add ip err!", err);
                //        result.message = "添加pbx成功,添加cc信任ip异常！";
                //        if (err.code == "11000") {
                //            result.message = "添加pbx成功,路由ip已经存在！";
                //        }
                //        callback(result);
                //    }
                //});
            }else {
                logger.app.warn("add pbx err!", err);
                result.message = "添加pbx异常！";
                if (err.code == "11000") {
                    result.message = "pbx实例已经存在！";
                }
                callback(result);
            }
        });
    },
    batchAddPbx: function(data,session,callback) {
        data.status = constants.pbxSataus.enable;
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        var instanceSuffix = data._id.substr(data._id.lastIndexOf('.')+1);
        var sipSuffix = data.sipAddr.substr(data.sipAddr.lastIndexOf(':')+1);
        var encryptSipSuffix = data.encryptSipAddr.substr(data.encryptSipAddr.lastIndexOf(':')+1);
        var routePort = parseInt(data.routePort);

        instanceSuffix = instanceSuffix ? parseInt(instanceSuffix) : 0;
        sipSuffix = sipSuffix ? parseInt(sipSuffix) : 6060;
        encryptSipSuffix = encryptSipSuffix ? parseInt(encryptSipSuffix) : 6070;

        Then()
            .each([0,1,2,3,4,5,6,7,8,9],function(cont,index){
                data = JSON.parse(JSON.stringify(data));
                data._id = data._id.substr(0,data._id.lastIndexOf('.')+1) + (instanceSuffix + index);
                data.name = data.name.substr(0,data.name.lastIndexOf('.')+1) + (instanceSuffix + index);
                data.sipAddr = data.sipAddr.substr(0,data.sipAddr.lastIndexOf(':')+1) + (sipSuffix + index);
                data.encryptSipAddr = data.encryptSipAddr.substr(0,data.encryptSipAddr.lastIndexOf(':')+1) + (encryptSipSuffix + index);
                data.routePort = routePort + index + "";

                ZjPbx.add(data,cont);
            })
            .then(function(cont){
                //各种加IP白名单
                var ipRegex = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g;
                var ips = [];
                ips = ips.concat(data.assAddr.match(ipRegex)).concat(data.configAddr.match(ipRegex)).concat(data.sipAddr.match(ipRegex)).concat(data.encryptSipAddr.match(ipRegex)).concat(data.routeIp.match(ipRegex));
                ips = utils.uniq(ips);
                ips.forEach(function(ip){
                    if(!ip){
                        return;
                    }
                    mongo.db().collection(constants.DB.access_ip).insert({"_id":ip,"name":data.name}, {w: 1});
                    mongo.db("cc").collection(constants.DB.cc.access_ip).insert({"_id":ip,"name":data.name}, {w: 1});
                });

                cont();
            })
            .then(function(cont){
                return callback({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.warn("batch add pbx err!", err);
                var result = {success : false};
                if (err.code == "11000") {
                    result.message = "pbx实例已经存在！";
                }
                result.message = '批量添加pbx异常';

                callback(result);
            });
    },
    addCcPbx: function (data, session, callback) {
        var result = {success: false,tag:false};//tag用于判断添加cc信任ip是否成功
        data.status = constants.pbxSataus.enable;
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        mongo.db().collection(constants.DB.platform_cc_pbx).insert(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                //callback(result);
                mongo.db("cc").collection(constants.DB.access_ip).insert({"_id":data.routeIp,"name":data.name}, {w: 1}, function (err) {
                    if (!err) {
                        result.tag = true;
                        callback(result);
                    } else {
                        logger.app.warn("add ip err!", err);
                        result.message = "添加pbx成功,添加cc信任ip异常！";
                        if (err.code == "11000") {
                            result.message = "添加pbx成功,路由ip已经存在！";
                        }
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("add pbx err!", err);
                result.message = "添加pbx异常！";
                if (err.code == "11000") {
                    result.message = "pbx实例已经存在！";
                }
                callback(result);
            }
        });
    },

    batchCcAddPbx: function(data,session,callback) {
        data.status = constants.pbxSataus.enable;
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        var routePort = parseInt(data.routePort);

        var instanceSuffix = data._id.substr(data._id.lastIndexOf('.')+1);
        var sipSuffix = data.sipAddr.substr(data.sipAddr.lastIndexOf(':')+1);
        var encryptSipSuffix = data.encryptSipAddr.substr(data.encryptSipAddr.lastIndexOf(':')+1);

        instanceSuffix = instanceSuffix ? parseInt(instanceSuffix) : 0;
        sipSuffix = sipSuffix ? parseInt(sipSuffix) : 6060;
        encryptSipSuffix = encryptSipSuffix ? parseInt(encryptSipSuffix) : 6070;

        Then()
            .each([0,1,2,3,4,5,6,7,8,9],function(cont,index){
                data = JSON.parse(JSON.stringify(data));
                data._id = data._id.substr(0,data._id.lastIndexOf('.')+1) + (instanceSuffix + index);
                data.name = data.name.substr(0,data.name.lastIndexOf('.')+1) + (instanceSuffix + index);
                data.sipAddr = data.sipAddr.substr(0,data.sipAddr.lastIndexOf(':')+1) + (sipSuffix + index);
                data.encryptSipAddr = data.encryptSipAddr.substr(0,data.encryptSipAddr.lastIndexOf(':')+1) + (encryptSipSuffix + index);
                data.routePort = routePort + index + "";

                CcPbx.add(data,cont);
            })
            .then(function(cont){
                //各种加IP白名单
                var ipRegex = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g;
                var ips = [];
                ips = ips.concat(data.assAddr.match(ipRegex)).concat(data.configAddr.match(ipRegex)).concat(data.sipAddr.match(ipRegex)).concat(data.encryptSipAddr.match(ipRegex)).concat(data.routeIp.match(ipRegex));
                ips = utils.uniq(ips);
                ips.forEach(function(ip){
                    if(!ip){
                        return;
                    }
                    mongo.db().collection(constants.DB.access_ip).insert({"_id":ip,"name":data.name}, {w: 1});
                    mongo.db("cc").collection(constants.DB.cc.access_ip).insert({"_id":ip,"name":data.name}, {w: 1});
                });

                cont();
            })
            .then(function(cont){
                return callback({
                    success : true,
                })
            })
            .fail(function(cont,err){
                logger.app.warn("batch add cc pbx err!", err);
                var result = {success : false};
                if (err.code == "11000") {
                    result.message = "pbx实例已经存在！";
                }
                result.message = '批量添加pbx异常';

                callback(result);
            });
    },
    /**
     * 更新pbx
     * @param data
     * @param session
     * @param callback
     */
    updatePbx: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_pbx).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updatePbx  error", err);
                result.message = "更新pbx信息异常！";
                callback(result);
            }
        });
    },
    updateCcPbx: function (data, session, callback) {
        var result = {success: false,tag:false};//tag用于判断添加cc信任ip是否成功
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_cc_pbx).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                //callback(result);
                mongo.db("cc").collection(constants.DB.access_ip).insert({"_id":data.routeIp,"name":data.name}, {w: 1}, function (err) {
                    if (!err) {
                        result.tag = true;
                        callback(result);
                    } else {
                        logger.app.warn("add ip err!", err);
                        result.message = "更新pbx成功,添加cc信任ip异常！";
                        if (err.code == "11000") {
                            result.message = "更新pbx成功,路由ip已经存在！";
                        }
                        callback(result);
                    }
                });

            } else {
                logger.app.warn("updatePbx  error", err);
                result.message = "更新pbx信息异常！";
                callback(result);
            }
        });
    },
    getCcPbxCache : function (data,session,callback){
        data.status = "enable";
        mongo.db().collection(constants.DB.platform_cc_pbx).find(data).toArray(function (err, pbxs) {
            if (!err) {
                pbxs = pbxs || [];
                var caches = [];
                for (var i = 0; i < pbxs.length; i++) {
                    var cache = {
                        codeType: "ccPbx",
                        codeOrder: i + 1,
                        codeName: pbxs[i].name,
                        codeValue: pbxs[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
    /**
     * 获取pbx缓存
     * @param session
     * @param callback
     */
    getPbxCache: function (data, session, callback) {
        data.status = "enable";
        mongo.db().collection(constants.DB.platform_pbx).find(data).toArray(function (err, pbxs) {
            if (!err) {
                pbxs = pbxs || [];
                var caches = [];
                for (var i = 0; i < pbxs.length; i++) {
                    var cache = {
                        codeType: "pbx",
                        codeOrder: i + 1,
                        codeName: pbxs[i].name,
                        codeValue: pbxs[i]._id,
                        board:pbxs[i].board
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
    /**
     * 获取开户的pbx
     * called by other module
     * callback(err,pbx)
     */
    getNewAccountPbx: function (callback) {
        mongo.db().collection(constants.DB.platform_pbx).findOne({status: "enable", currentSelect: true}, function (err, pbx) {
            if (!err && pbx) {
                callback(null, pbx);
            } else {
                logger.app.error("query newAccountPbx error!", err);
                callback(err);
            }
        });
    },
    getPbxInfo2: function (id, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_pbx).findOne({_id: id}, function (err, dbPbx) {
            if (!err) {
                dbPbx = dbPbx || {};
                result.success = true;
                result.data = dbPbx;
                callback(result);
            } else {
                logger.app.warn("getPbxInfo  error", err);
                result.message = "查询pbx信息异常！";
                callback(result);
            }
        });
    }

};


module.exports = handler;
