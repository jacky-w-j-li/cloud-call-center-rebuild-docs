var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var http = require("appHttp");


var handler = {
    deleteBoard: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_board).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除机柜信息异常！";
                callback(result);
            }
        });
    },
    deleteCcBoard: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除机柜信息异常！";
                callback(result);
            }
        });
    },
    updateBoard: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_board).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateBoard  error", err);
                result.message = "更新机柜信息异常！";
                callback(result);
            }
        });
    },
    updateCcBoard: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_cc_board).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateBoard  error", err);
                result.message = "更新机柜信息异常！";
                callback(result);
            }
        });
    },
    addBoard: function (data, session, callback) {
        var result = {success: false};
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        mongo.db().collection(constants.DB.platform_board).insert(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("add pbx err!", err);
                result.message = "添加机柜异常！";
                if (err.code == "11000") {
                    result.message = "机柜编号已经存在！";
                }
                callback(result);
            }
        });

    },
    addCcBoard: function (data, session, callback) {
        var result = {success: false};
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        mongo.db().collection(constants.DB.platform_cc_board).insert(data, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("add pbx err!", err);
                result.message = "添加机柜异常！";
                if (err.code == "11000") {
                    result.message = "机柜编号已经存在！";
                }
                callback(result);
            }
        });
    },
    queryBoardInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_board).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryCcBoardInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryCcBoardServer: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);

        mongo.db().collection(constants.DB.platform_cc_board_server).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_cc_board_server).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryBoardServer: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);

        mongo.db().collection(constants.DB.platform_board_server).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_board_server).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryCcBoardInRoute: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.number) data.number = new RegExp(data.number);

        mongo.db().collection(constants.DB.platform_cc_board_inRoute).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_cc_board_inRoute).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryCcBoardOutLine: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

//        if (data.name) data.name = new RegExp(data.name);

        mongo.db().collection(constants.DB.platform_cc_board_outLine).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_cc_board_outLine).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryBoardOutLine: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

//        if (data.name) data.name = new RegExp(data.name);

        mongo.db().collection(constants.DB.platform_board_outLine).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_board_outLine).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    deleteCcBoardServer: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board_server).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除路由信息异常！";
                callback(result);
            }
        });
    },
    deleteBoardServer: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_board_server).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除路由信息异常！";
                callback(result);
            }
        });
    },
    deleteCcBoardInRoute: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board_inRoute).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除路由信息异常！";
                callback(result);
            }
        });
    },
    deleteCcBoardOutLine: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board_outLine).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除路由信息异常！";
                callback(result);
            }
        });
    },
    deleteBoardOutLine: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_board_outLine).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除路由信息异常！";
                callback(result);
            }
        });
    },
    deleteCcBoardOutRoute: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board_outRoute).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除路由信息异常！";
                callback(result);
            }
        });
    },
    deleteBoardOutRoute: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_board_outRoute).remove(data, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("deleteBoard  error", err);
                result.message = "删除路由信息异常！";
                callback(result);
            }
        });
    },
    updateCcBoardServer: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_cc_board_server).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateBoard  error", err);
                result.message = "更新机柜信息异常！";
                callback(result);
            }
        });
    },
    updateBoardServer: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_board_server).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateBoard  error", err);
                result.message = "更新机柜信息异常！";
                callback(result);
            }
        });
    },
    updateCcBoardInRoute: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_cc_board_inRoute).update({_id: id}, {$set: data}, {w: 1}, function (err) {
            if (!err) {
                result.success = true;
                callback(result);
            } else {
                logger.app.warn("updateBoard  error", err);
                result.message = "更新机柜信息异常！";
                callback(result);
            }
        });
    },
    updateCcBoardOutLine: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        //mongo.db().collection(constants.DB.platform_cc_board_outLine).count({number:data.number,_id:{$ne:id}},function(err,count){
        //    if(!err){
        //        if(count>0){
        //            result.message = "线路[" +data.number +"] 已经存在！";
        //            callback(result);
        //        }else{
                    mongo.db().collection(constants.DB.platform_cc_board_outLine).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("updateBoardOutLine  error", err);
                            result.message = "更新机柜中继异常！";
                            callback(result);
                        }
                    });
        //        }
        //    }else{
        //        logger.app.error("updateBoardOutLine  error", err);
        //        result.message = "更新机柜中继异常！";
        //        callback(result);
        //    }
        //});
    },
    updateBoardOutLine: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_board_outLine).count({number:data.number,_id:{$ne:id}},function(err,count){
            if(!err){
                if(count>0){
                    result.message = "线路[" +data.number +"] 已经存在！";
                    callback(result);
                }else{
                    mongo.db().collection(constants.DB.platform_board_outLine).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("updateBoardOutLine  error", err);
                            result.message = "更新机柜中继异常！";
                            callback(result);
                        }
                    });
                }
            }else{
                logger.app.error("updateBoardOutLine  error", err);
                result.message = "更新机柜中继异常！";
                callback(result);
            }
        });
    },
    updateCcBoardOutRoute: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        //mongo.db().collection(constants.DB.platform_cc_board_outRoute).count({number:data.number,_id:{$ne:id}},function(err,count){
        //    if(!err){
        //        if(count>0){
        //            result.message = "路由[" +data.number +"] 已经存在！";
        //            callback(result);
        //        }else{
                    mongo.db().collection(constants.DB.platform_cc_board_outRoute).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("updateBoardOutRoute  error", err);
                            result.message = "更新机柜路由异常！";
                            callback(result);
                        }
                    });
        //        }
        //    }else{
        //        logger.app.error("updateBoardOutRoute  error", err);
        //        result.message = "更新机柜路由异常！";
        //        callback(result);
        //    }
        //});
    },
    updateBoardOutRoute: function (data, session, callback) {
        var result = {success: false};
        var id = data._id;
        delete data._id;
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        mongo.db().collection(constants.DB.platform_board_outRoute).count({number:data.number,_id:{$ne:id}},function(err,count){
            if(!err){
                if(count>0){
                    result.message = "路由[" +data.number +"] 已经存在！";
                    callback(result);
                }else{
                    mongo.db().collection(constants.DB.platform_board_outRoute).update({_id: id}, {$set: data}, {w: 1}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("updateBoardOutRoute  error", err);
                            result.message = "更新机柜路由异常！";
                            callback(result);
                        }
                    });
                }
            }else{
                logger.app.error("updateBoardOutRoute  error", err);
                result.message = "更新机柜路由异常！";
                callback(result);
            }
        });
    },
    queryCcBoardServerInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board_server).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryBoardServerInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_board_server).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryCcBoardInRouteInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board_inRoute).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryCcBoardOutLineInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board_outLine).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryBoardOutLineInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_board_outLine).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryCcBoardOutRouteInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_cc_board_outRoute).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryBoardOutRouteInfo: function (data, session, callback) {
        var result = {success: false};
        mongo.db().collection(constants.DB.platform_board_outRoute).findOne(data, function (err, board) {
            if (!err) {
                result.success = true;
                result.data = board;
                callback(result);
            } else {
                logger.app.warn("queryBoardInfo  error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    addCcBoardServer: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        var number = data.number;

        mongo.db().collection(constants.DB.platform_cc_board_server).findOne({number:number,boardId:data.boardId},function(err,dbObj){
            if(dbObj){
                result.message = "机器[" +number+ "]已经存在！";
                callback(result);
            } else {
                mongo.db().collection(constants.DB.platform_cc_board_server).insert(data, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("add pbx err!", err);
                        result.message = "添加呼入路由成功！！";
                        if (err.code == "11000") {
                            result.message = "编号已经存在！！";
                        }
                        callback(result);
                    }
                });
            }
        });


    },
    addBoardServer: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        var number = data.number;

        mongo.db().collection(constants.DB.platform_board_server).findOne({number:number,boardId:data.boardId},function(err,dbObj){
            if(dbObj){
                result.message = "机器[" +number+ "]已经存在！";
                callback(result);
            } else {
                mongo.db().collection(constants.DB.platform_board_server).insert(data, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("add pbx err!", err);
                        result.message = "添加呼入路由成功！！";
                        if (err.code == "11000") {
                            result.message = "编号已经存在！！";
                        }
                        callback(result);
                    }
                });
            }
        });


    },
    addCcBoardInRoute: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        var number = data.number;

        mongo.db().collection(constants.DB.platform_cc_board_inRoute).findOne({number:data.number,boardId:data.boardId},function(err,dbObj){
            if(dbObj){
                result.message = "路由[" + number +"]已经存在！";
                callback(result);
            } else {
                mongo.db().collection(constants.DB.platform_cc_board_inRoute).insert(data, {w: 1}, function (err) {
                    if (!err) {
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.warn("add pbx err!", err);
                        result.message = "添加呼入路由成功！！";
                        if (err.code == "11000") {
                            result.message = "编号已经存在！！";
                        }
                        callback(result);
                    }
                });
            }
        });


    },
    addCcBoardOutLine: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        var number = data.number;

        mongo.db().collection(constants.DB.platform_cc_board_outLine).findOne({number:data.number},function(err,dbRoute){
            if(!err){
                if(dbRoute){
                    result.message = "线路[" +number +"] 已经存在！";
                    callback(result);
                } else {
                    mongo.db().collection(constants.DB.platform_cc_board_outLine).insert(data, {w: 1}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("add pbx err!", err);
                            result.message = "添加机柜中继成功！！";
                            if (err.code == "11000") {
                                result.message = "编号已经存在！！";
                            }
                            callback(result);
                        }
                    });
                }
            }else{
                logger.app.error("addBoardOutLine  error", err);
                result.message = "增加机柜中继异常！";
                callback(result);
            }
        });
    },
    addBoardOutLine: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();
        var number = data.number;

        mongo.db().collection(constants.DB.platform_board_outLine).findOne({number:data.number},function(err,dbRoute){
            if(!err){
                if(dbRoute){
                    result.message = "线路[" +number +"] 已经存在！";
                    callback(result);
                } else {
                    mongo.db().collection(constants.DB.platform_board_outLine).insert(data, {w: 1}, function (err) {
                        if (!err) {
                            result.success = true;
                            callback(result);
                        } else {
                            logger.app.warn("add pbx err!", err);
                            result.message = "添加机柜中继成功！！";
                            if (err.code == "11000") {
                                result.message = "编号已经存在！！";
                            }
                            callback(result);
                        }
                    });
                }
            }else{
                logger.app.error("addBoardOutLine  error", err);
                result.message = "增加机柜中继异常！";
                callback(result);
            }
        });
    },
    addCcBoardOutRoute: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        var maxTry = 100;
        var loop =function (){
            //生成唯一路由编号
            var routeNumber = 10 + Math.floor(Math.random() * (990));
            //两位数补0
            routeNumber = routeNumber.toString();
            routeNumber = routeNumber.length == 2 ? '0'+routeNumber : routeNumber;

            mongo.db().collection(constants.DB.platform_cc_board_outRoute).count({number:routeNumber},function(err,count){
                if(!err){
                    if(count==0){
                        data.number = routeNumber;
                        mongo.db().collection(constants.DB.platform_cc_board_outRoute).insert(data, {w: 1}, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                            }else{
                                logger.app.error("addBoardOutRoute  error", err);
                                result.message = "增加机柜路由异常！";
                                callback(result);
                            }
                        });
                    }else {
                        maxTry--;
                        if (maxTry <= 0) {
                            logger.app.error("addBoardOutRoute  error", err);
                            result.message = "机柜路由编号用尽!";
                            callback(result);
                        } else {
                            loop();
                        }
                    }
                }else{
                    logger.app.error("addBoardOutRoute  error", err);
                    result.message = "增加机柜路由异常！";
                    callback(result);
                }
            });
        }

        loop();

    },
    addBoardOutRoute: function (data, session, callback) {
        var result = {success: false};
        data._id = utils.UUID.generateUuid();
        data.createTime = utils.DateTime.getCurrentDateTime();
        data.lastUpdateTime = utils.DateTime.getCurrentDateTime();

        var maxTry = 100;
        var loop =function (){
            //生成唯一路由编号
            var routeNumber = 10 + Math.floor(Math.random() * (990));
            //两位数补0
            routeNumber = routeNumber.toString();
            routeNumber = routeNumber.length == 2 ? '0'+routeNumber : routeNumber;

            mongo.db().collection(constants.DB.platform_board_outRoute).count({number:routeNumber},function(err,count){
                if(!err){
                    if(count==0){
                        data.number = routeNumber;
                        mongo.db().collection(constants.DB.platform_board_outRoute).insert(data, {w: 1}, function (err) {
                            if (!err) {
                                result.success = true;
                                callback(result);
                            }else{
                                logger.app.error("addBoardOutRoute  error", err);
                                result.message = "增加机柜路由异常！";
                                callback(result);
                            }
                        });
                    }else {
                        maxTry--;
                        if (maxTry <= 0) {
                            logger.app.error("addBoardOutRoute  error", err);
                            result.message = "机柜路由编号用尽!";
                            callback(result);
                        } else {
                            loop();
                        }
                    }
                }else{
                    logger.app.error("addBoardOutRoute  error", err);
                    result.message = "增加机柜路由异常！";
                    callback(result);
                }
            });
        }

        loop();

    },
    queryCcBoardOutRoute: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);

        mongo.db().collection(constants.DB.platform_cc_board_outRoute).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_cc_board_outRoute).find(data, {sort: {createTime:-1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryBoardOutRoute: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);

        mongo.db().collection(constants.DB.platform_board_outRoute).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_board_outRoute).find(data, {sort: {createTime:-1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    getBoardCache: function (data, session, callback) {
        mongo.db().collection(constants.DB.platform_board).find(data).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var caches = [];
                for (var i = 0; i < docs.length; i++) {
                    var cache = {
                        codeType: "board",
                        codeOrder: i + 1,
                        codeName: docs[i].name,
                        codeValue: docs[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
    getCcBoardCache: function (data, session, callback) {
        mongo.db().collection(constants.DB.platform_cc_board).find(data).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var caches = [];
                for (var i = 0; i < docs.length; i++) {
                    var cache = {
                        codeType: "ccBoard",
                        codeOrder: i + 1,
                        codeName: docs[i].name,
                        codeValue: docs[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            } else {
                callback(err);
            }
        });
    },
    getOutRouteByPBXCache: function(data,session,callback) {
        var condition = {
            _id : data.pbx
        }
        _impl.getPBX(condition,function(err,pbx){
            if(err){
                callback(err);
                return;
            }
            if(!pbx){
                callback(null,[]);
                return;
            }
            _impl.getOutRoutes({boardId:pbx.board},function(err,outRoutes){
                if(err){
                    callback(err);
                    return;
                }
                if(!outRoutes){
                    callback(null,[]);
                    return;
                }

                var caches = [];
                for (var i = 0; i < outRoutes.length; i++) {
                    var cache = {
                        codeType: "zjOutRouteByPBX",
                        codeOrder: i + 1,
                        codeName: outRoutes[i].name,
                        codeValue: outRoutes[i]._id
                    };
                    caches.push(cache);
                }
                callback(null, caches);
            });
        });
    },
    queryBoard: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);

        mongo.db().collection(constants.DB.platform_board).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_board).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    queryCcBoard: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        if (data.name) data.name = new RegExp(data.name);

        mongo.db().collection(constants.DB.platform_cc_board).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_cc_board).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, boards) {
                    if (!err) {
                        boards = boards || [];
                        result.success = true;
                        result.list = boards;
                        callback(result);
                    } else {
                        logger.app.warn("queryBoard list error", err);
                        result.message = "查询机柜信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryBoard count error", err);
                result.message = "查询机柜信息异常！！";
                callback(result);
            }
        });
    },
    effectCcRoute : function(data , session , callback){
        var result = {success: false};
        var type = data.type;
        delete data.type;
        var aelString = "";
        var Peer = '';
        switch (type) {
            case 'out':
                Peer = 'GWOutRoute';
                mongo.db().collection(constants.DB.platform_cc_board_outRoute).find(data).toArray(function (err, outRoutes) {
                    if (!err) {
                        outRoutes = outRoutes || [];
                        for (var i = 0; i < outRoutes.length; i++) {
                            var outRoutesItem = outRoutes[i];
                            aelString += outRoutesItem.context;
                        }
                        aelString += "\n";
                        util.effectCcGwConfig(data, Peer, aelString, function (err) {
                            if (!err) {
                                result.success = true;
                            } else {
                                logger.app.error("", err);
                                result.message = err.message;
                            }
                            callback(result);
                        });
                    } else {
                        logger.app.error("", err);
                        callback(result);
                        return;
                    }
                });
                break;
            case 'in':
                Peer = 'GWInRoute';
                mongo.db().collection(constants.DB.platform_cc_board_inRoute).find(data).toArray(function (err, inRoutes) {
                    if (!err) {
                        inRoutes = inRoutes || [];
                        aelString += "context callInRoute{\n";
                        var tpl = "	_CallNumber =>{" + "\n" + "		CALLERID(num) = ${CallNo};" + "\n" + "		Dial(SIP/\"${CalledNo}\"@_Ip:_Port);" + "\n" + "	}";
                        mongo.db().collection(constants.DB.platform_cc_pbx).find({}).toArray(function(err,pbxs){
                            pbxs = pbxs || [];
                            for (var i = 0; i < inRoutes.length; i++) {
                                var inRoutesItem = inRoutes[i];
                                var inRoutePbx = util.getPbxById(inRoutesItem.pbx, pbxs);
                                var inRouteStr = tpl.replace(/_CallNumber/g, inRoutesItem.number).replace(/_Ip/g, inRoutePbx.routeIp).replace(/_Port/g, inRoutePbx.routePort) + "\n";
                                aelString += inRouteStr;
                            }
                            aelString += "_X. =>{\nNoop(\"-------------=================--------------------${EXTEN}----------------============================---------------\");\nHangup();\n}\n}";
                            util.effectCcGwConfig(data, Peer, aelString, function (err) {
                                if (!err) {
                                    result.success = true;
                                } else {
                                    logger.app.error("", err);
                                    result.message = err.message;
                                }
                                callback(result);
                            });


                        });

                    } else {
                        logger.app.error("", err);
                        callback(result);
                        return;
                    }

                });
                break;
            case 'gateway':
                Peer = 'GWOutCallConfig';
                mongo.db().collection(constants.DB.platform_cc_board_outLine).find(data).toArray(function (err, outRoutes) {
                    if (!err) {
                        outRoutes = outRoutes || [];
                        for (var i = 0; i < outRoutes.length; i++) {
                            var outRoutesItem = outRoutes[i];
                            aelString += outRoutesItem.context;
                        }
                        aelString += "\n";
                        util.effectCcGwConfig(data, Peer, aelString, function (err) {
                            if (!err) {
                                result.success = true;
                            } else {
                                logger.app.error("", err);
                                result.message = err.message;
                            }
                            callback(result);
                        });
                    } else {
                        logger.app.error("", err);
                        callback(result);
                        return;
                    }
                });
                break;
        }
    },

    effectRoute : function(data , session , callback){
        var result = {success: false};
        var type = data.type;
        delete data.type;
        var aelString = "";
        var Peer = '';
        switch (type) {
            case 'out':
                Peer = 'GWOutRoute';
                mongo.db().collection(constants.DB.platform_board_outRoute).find(data).toArray(function (err, outRoutes) {
                    if (!err) {
                        outRoutes = outRoutes || [];
                        for (var i = 0; i < outRoutes.length; i++) {
                            var outRoutesItem = outRoutes[i];
                            aelString += outRoutesItem.context;
                        }
                        aelString += "\n";
                        util.effectGwConfig(data, Peer, aelString, function (err) {
                            if (!err) {
                                result.success = true;
                            } else {
                                logger.app.error("", err);
                                result.message = err.message;
                            }
                            callback(result);
                        });
                    } else {
                        logger.app.error("", err);
                        callback(result);
                        return;
                    }
                });
                break;
            case 'in':
                Peer = 'GWInRoute';
                mongo.db().collection(constants.DB.platform_board_inRoute).find(data).toArray(function (err, inRoutes) {
                    if (!err) {
                        inRoutes = inRoutes || [];
                        aelString += "context callInRoute{\n";
                        var tpl = "	_CallNumber =>{" + "\n" + "		CALLERID(num) = ${CallNo};" + "\n" + "		Dial(SIP/\"${CalledNo}\"@_Ip:_Port);" + "\n" + "	}";
                        mongo.db().collection(constants.DB.platform_pbx).find({}).toArray(function(err,pbxs){
                            pbxs = pbxs || [];
                            for (var i = 0; i < inRoutes.length; i++) {
                                var inRoutesItem = inRoutes[i];
                                var inRoutePbx = util.getPbxById(inRoutesItem.pbx, pbxs);
                                var inRouteStr = tpl.replace(/_CallNumber/g, inRoutesItem.number).replace(/_Ip/g, inRoutePbx.routeIp).replace(/_Port/g, inRoutePbx.routePort) + "\n";
                                aelString += inRouteStr;
                            }
                            aelString += "_X. =>{\nNoop(\"-------------=================--------------------${EXTEN}----------------============================---------------\");\nHangup();\n}\n}";
                            util.effectGwConfig(data, Peer, aelString, function (err) {
                                if (!err) {
                                    result.success = true;
                                } else {
                                    logger.app.error("", err);
                                    result.message = err.message;
                                }
                                callback(result);
                            });


                        });

                    } else {
                        logger.app.error("", err);
                        callback(result);
                        return;
                    }

                });
                break;
            case 'gateway':
                Peer = 'GWOutCallConfig';
                mongo.db().collection(constants.DB.platform_board_outLine).find(data).toArray(function (err, outRoutes) {
                    if (!err) {
                        outRoutes = outRoutes || [];
                        for (var i = 0; i < outRoutes.length; i++) {
                            var outRoutesItem = outRoutes[i];
                            aelString += outRoutesItem.context;
                        }
                        aelString += "\n";
                        util.effectGwConfig(data, Peer, aelString, function (err) {
                            if (!err) {
                                result.success = true;
                            } else {
                                logger.app.error("", err);
                                result.message = err.message;
                            }
                            callback(result);
                        });
                    } else {
                        logger.app.error("", err);
                        callback(result);
                        return;
                    }
                });
                break;
        }
    }
};

var _impl = {
    getPBX: function(condition,callback){
        mongo.db().collection(constants.DB.platform_pbx).findOne(condition,function(err,record){
            if(err){
                callback(err);
                return;
            }
            if(!record){
                callback(null,null);
                return;
            }
            callback(null,record);
        });
    },
    getBoard: function(condition,callback){
        mongo.db().collection(constants.DB.platform_board).findOne(condition,function(err,record){
            if(err){
                callback(err);
                return;
            }
            if(!record){
                callback(null,null);
                return;
            }
            callback(null,record);
        });
    },
    getOutRoutes: function(condition,callback){
        mongo.db().collection(constants.DB.platform_board_outRoute).find(condition).toArray(function(err,records){
            if(err){
                callback(err);
                return;
            }
            if(!records){
                callback(null,null);
                return;
            }
            callback(null,records);
        });
    }
}



var util = {
    getPbxById: function (pbxId, pbxs) {
        for (var i = 0; i < pbxs.length; i++) {
            var pbxsItem = pbxs[i];
            if (pbxsItem._id == pbxId) {
                return pbxsItem;
            }
        }
    },
    effectCcGwConfig: function (condition, peer, ael, callback) {
        mongo.db().collection(constants.DB.platform_cc_board_server).find(condition).toArray(function (err, macs) {
            if (!err) {
                macs = macs || [];
                var index = 0;
                var tempFun = function () {
                    if (index == macs.length) {
                        callback(null);
                    } else {
                        var macsItem = macs[index];
                        var addr = "http://" + macsItem.ip + ":" + macsItem.port;
                        var actionId = 'RouteConfig' + utils.UUID.generateUuid();
                        var action = {
                            Command: 'Action',
                            Action: 'RouteConfig',
                            ActionID: actionId,
                            Peer: peer,
                            Content: ael
                        };
                        console.log(action);
                        http.sendPost(addr, action, function (err, data) {
                            var response = JSON.parse(data||'{}');
                            console.log(response);
                            if (response.Succeed) {
                                index++;
                                tempFun();
                            } else {
                                callback(new Error("同步ass失败！" + macsItem.name));
                            }

                        });
                    }
                }
                tempFun();

            } else {
                logger.app.error("", err);
                callback(err);
            }
        });

    },

    effectGwConfig: function (condition, peer, ael, callback) {
        mongo.db().collection(constants.DB.platform_board_server).find(condition).toArray(function (err, macs) {
            if (!err) {
                macs = macs || [];
                var index = 0;
                var tempFun = function () {
                    if (index == macs.length) {
                        callback(null);
                    } else {
                        var macsItem = macs[index];
                        var addr = "http://" + macsItem.ip + ":" + macsItem.port;
                        var actionId = 'RouteConfig' + utils.UUID.generateUuid();
                        var action = {
                            Command: 'Action',
                            Action: 'RouteConfig',
                            ActionID: actionId,
                            Peer: peer,
                            Content: ael
                        };
                        console.log(action);
                        http.sendPost(addr, action, function (err, data) {
                            var response = JSON.parse(data||'{}');
                            console.log(response);
                            if (response.Succeed) {
                                index++;
                                tempFun();
                            } else {
                                callback(new Error("同步ass失败！" + macsItem.name));
                            }

                        });
                    }
                }
                tempFun();

            } else {
                logger.app.error("", err);
                callback(err);
            }
        });

    }
};

module.exports = handler;
