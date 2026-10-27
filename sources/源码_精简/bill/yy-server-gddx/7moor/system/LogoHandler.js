var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var config = require('appConfig');
var fs= require('fs');
var path = require('path');
var constants = require(__baseDir + "/7moor/utils/Constants");

var handler = {
    getLogoInfo:function(data,session,callback){
        var result = {success : false};
        mongo.db().collection(constants.DB.platform_logo).findOne(data,function(err,logo){
            if(!err && logo){
                result.success = true;
                result.data = logo;
                callback(result);
            } else {
                result.message = "404";
                callback(result);
            }
        });
    },
    queryLogo: function (data, session, callback) {
        var result = {success: false};
        var limit = data.limit || 10;
        delete data.limit;
        var page = data.page || 1;
        delete data.page;
        var skip = (page - 1) * limit;

        //if (data.name) data.name = new RegExp(data.name);
        mongo.db().collection(constants.DB.platform_logo).count(data, function (err, count) {
            if (!err) {
                result.count = count;
                mongo.db().collection(constants.DB.platform_logo).find(data, {sort: {_id: 1}, limit: limit, skip: skip}).toArray(function (err, logos) {
                    if (!err) {
                        logos = logos || [];
                        result.success = true;
                        result.list = logos;
                        callback(result);
                    } else {
                        logger.app.warn("queryLogo list error", err);
                        result.message = "查询logo信息异常！";
                        callback(result);
                    }
                });
            } else {
                logger.app.warn("queryLogo count error", err);
                result.message = "查询logo信息异常！";
                callback(result);
            }
        });
    },
    deleteLogo:function(data,session,callback){
        var result={success:false};
        var oldFilePath=config.logoSaveDir+data.fileName;
        mongo.db().collection(constants.DB.platform_logo).remove({_id: data._id}, function (err) {
            if (!err) {
                fs.unlink(oldFilePath, function () {
                });
                result.success=true;
                callback(result);
            } else {
                logger.app.error("delete logo  error!", err);
                result.message = "删除logo数据异常";
                callback(result);
            }
        });
    },
    updateLogoInfo:function(data, session, callback){
        var result={success:false};
        var set={
            phone : data.phone,
            email : data.email,
            footer:data.footer
        };
        mongo.db().collection(constants.DB.platform_logo).update({_id: data._id}, {$set: set}, {w: 1}, function (err) {
            if (!err) {
                result.success=true;
                callback(result);
            } else {
                logger.app.error("update logo to db error!", err);
                result.message = "数据库修改数据异常";
                callback(result);
            }
        });
    },
    updateLogo:function(data,session,res){
        handler.updateLogoTask(data,session,function(result){
            res.set('Content-Type', 'text/html');//如果不设置，会报解析json串异常
            res.send(result);
        });
    },
    updateLogoTask : function(data,session,callback){
        var result = {success: false};
        var fileName=utils.UUID.generateUuid()+data.file.name.substring(data.file.name.lastIndexOf('.'));
        var logoSavePath=config.logoSaveDir +fileName;

        mongo.readFileFromDb(data.file.fileId,function(err,fileData){
            if(!err){
                fs.writeFile(logoSavePath,fileData,function(err){
                    if(!err){
                        var oldFilePath=config.logoSaveDir+data.fileName;
                        //将其他信息保存到数据库
                        var set={
                            phone : data.phone,
                            email : data.email,
                            footer:data.footer,
                            fileName:fileName
                        };
                        mongo.db().collection(constants.DB.platform_logo).update({_id: data._id}, {$set: set}, {w: 1}, function (err) {
                            if (!err) {
                                fs.unlink(oldFilePath, function () {
                                });
                                result.success=true;
                                callback(result);
                            } else {
                                fs.unlink(logoSavePath, function () {
                                });
                                logger.app.error("update logo to db error!", err);
                                result.message = "数据库修改数据异常";
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error('write file error!');
                        result.message = '上传文件失败!';
                        callback(result);
                    }
                });
            }else{
                logger.app.error("read file to db error!", err);
                result.message = '从数据库读取文件失败!';
                callback(result);
            }
        });
    },
    addLogo:function(data,session,res){
        handler.addLogoTask(data,session,function(result){
            res.set('Content-Type', 'text/html');//如果不设置，会报解析json串异常
            res.send(result);
        });
    },
    addLogoTask : function(data,session,callback){
        var result = {success: false};
        var fileName=utils.UUID.generateUuid()+data.file.name.substring(data.file.name.lastIndexOf('.'));
        var logoSavePath=config.logoSaveDir +fileName;

        mongo.readFileFromDb(data.file.fileId,function(err,fileData){
            if(!err){
                fs.writeFile(logoSavePath,fileData,function(err){
                    if(!err){
                        //将其他信息保存到数据库
                        var logoInfo=data;
                        logoInfo.fileName=fileName;
                        delete logoInfo.file;
                        //检查域名是否已存在
                        mongo.db().collection(constants.DB.platform_logo).findOne({_id:logoInfo._id},function (err, logo) {
                            if(!logo){
                                mongo.db().collection(constants.DB.platform_logo).insert(logoInfo,{w:1},function(err){
                                    if (!err) {
                                        result.success = true;
                                        callback(result);
                                    } else {
                                        //插入不成功删除上传文件
                                        fs.unlink(logoSavePath, function () {
                                        });
                                        logger.app.error('db imp task error!');
                                        result.message = '数据库插入异常!';
                                        callback(result);
                                    }
                                });
                            }else{
                                //插入不成功删除上传文件
                                fs.unlink(logoSavePath, function () {
                                });
                                logger.app.error('insert logo to db error!');
                                result.message = '该域名已存在，请重新输入!';
                                callback(result);
                            }
                        });
                    }else{
                        logger.app.error('write file error!',err);
                        result.message = '上传文件失败!';
                        callback(result);
                    }
                });
            }else{
                logger.app.error("read file to db error!", err);
                result.message = '从数据库读取文件失败!';
                callback(result);
            }
        });
    }


};


module.exports = handler;