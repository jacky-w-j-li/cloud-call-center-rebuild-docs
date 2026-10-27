var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");


var handler = {

    deleteBuilding: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_building).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBuilding  error", err);
                result.message = "删除写字楼信息异常！";
                callback(result);
            }
        });
    },

    updateBuilding: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(constants.DB.platform_building).update({_id: id}, {$set: data}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateBuilding  error", err);
                result.message = "更新写字楼信息异常！";
                callback(result);
            }
        });
    },

    addBuilding: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_building).insert(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("addBuilding  error", err);
                result.message = "添加写字楼信息异常！";
                callback(result);
            }
        });
    },
    getBuildingInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_building).findOne(data, function (err, building) {
            if (!err) {
                result.success = true;
                result.data = building;
                callback(result);
            } else {
                logger.app.warn("getBuildingInfo  error", err);
                result.message = "获取写字楼信息异常！";
                callback(result);
            }
        });
    },
    queryLoactionBuilding: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        mongo.db().collection(constants.DB.platform_building).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_building).find(data).toArray(function (err, buildings) {
                    if (!err) {
                        result.success = true;
                        result.list = buildings || [];
                        callback(result);
                    } else {
                        logger.app.warn("queryLoactionBuilding  error", err);
                        result.message = "获取写字楼信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryLoactionBuilding count error", err);
                result.message = "获取写字楼信息异常！";
                callback(result);
            }
        });
    },
    deleteLocation: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        mongo.db().collection(constants.DB.platform_location).remove(data, function (err) {
            if (!err) {
                mongo.db().collection(constants.DB.platform_location).remove({location: id}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("deleteLocation linkBuilding error", err);
                        result.message = "删除区域关联写字楼信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("deleteLocation  error", err);
                result.message = "删除区域信息异常！";
                callback(result);
            }
        });


    },
    updateLocation: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        mongo.db().collection(constants.DB.platform_location).update({_id: id}, {$set: data}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateLocation  error", err);
                result.message = "更新区域信息异常！";
                callback(result);
            }
        });
    },

    addLocation: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_location).insert(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("addLocation  error", err);
                result.message = "添加区域信息异常！";
                callback(result);
            }
        });
    },

    getLocationInfo: function (data, session, callback) {
        var result = {success: true};
        mongo.db().collection(constants.DB.platform_location).findOne(data, function (err, location) {
            if (!err) {
                result.success = true;
                result.data = location;
                callback(result);
            } else {
                logger.app.warn("getLocationInfo  error", err);
                result.message = "查询区域信息异常！";
                callback(result);
            }
        });
    },

    queryLocation: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);
        mongo.db().collection(constants.DB.platform_location).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_location).find(data).toArray(function (err, locations) {
                    if (!err) {
                        locations = locations || [];
                        result.list = locations;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("queryLocation  error", err);
                        result.message = "查询区域信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryLocation count error", err);
                result.message = "查询区域信息异常！";
                callback(result);
            }
        });
    },

    getBuildingCache : function(data,session,callback){
        var data = data || {};
        mongo.db().collection(constants.DB.platform_building).find(data).toArray(function(err,buildings){
           if(!err){
               buildings = buildings || [];
               var caches = [];
               for (var i = 0; i < buildings.length; i++) {
                   var cache = {
                       codeType: "building",
                       codeOrder: i + 1,
                       codeName: buildings[i].name,
                       codeValue: buildings[i]._id
                   };
                   caches.push(cache);
               }
               callback(null, caches);
           } else {
               callback(err);
           }
        });
    },
    getLocationCache: function (data, session, callback) {
        var data = data || {};
        mongo.db().collection(constants.DB.platform_location).find(data).toArray(function(err,locations){
            if (!err) {
                locations = locations || [];
                var caches = [];
                for (var i = 0; i < locations.length; i++) {
                    var cache = {
                        codeType: "location",
                        codeOrder: i + 1,
                        codeName: locations[i].name,
                        codeValue: locations[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    }

};


module.exports = handler;

