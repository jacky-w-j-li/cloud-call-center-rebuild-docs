var handlerDir = __baseDir + '/dishui';
var logger = require('appLog');
var utils = require('appUtil/Utils');
var fs = require('fs');
var mongo = require('appDb/MongoDb');

//var customer_export_handler = require(handlerDir+"/app/customer/CustomerExportHandler");
var customer_handler = require(handlerDir + "/app/customer/CustomerHandler.js");


var uploads = {
//    customerExportIn :customer_export_handler.handleExportIn
    getXlsHeads: customer_handler.getXlsHeads,
    default_upload: default_upload
}


exports.handleUpload = function (upload, session, res) {
    try {
        var file =upload.file;
        var type = upload.type;
        var module = upload.module;
        if(!type || type == 'undefined'){
            type = 'default';
        }
        var tempPath = file.path.split("/");
        var fileId = tempPath[tempPath.length-1];
        if(module=='customer'){
            var result = {
                filePath : file.path,
                fileName : file.name,
                success:true
            };
            logger.app.info('reponse customer['+upload._aid+'] to client:'+JSON.stringify(result));
            res.json(result);
        }else{
            mongo.writeFileToDb(file.path,fileId,file.name,type,function(err,data){
                if(err){
                    logger.app.error("save file error!",err);
                    logger.app.info('reponse['+upload._aid+'] to client:'+JSON.stringify({success:false}));
                    res.json({success:false});
                }else{
                    var result = {
                        filePath : file.path,
                        fileName : file.name,
                        success:true
                    };
                    logger.app.info('reponse['+upload._aid+'] to client:'+JSON.stringify(result));
                    res.json(result);
                }
            });

        }
    } catch (e) {
        logger.app.error("",e);
        res.json({success:false});
    }
}

function processUnknowAction(upload, res) {
    var result = {};
    result.success = false;
    result.message = 'action[' + upload.type + '] is not support!';
    utils.sendResult(result, res);
    try {
        fs.unlink(upload.file.path);
    } catch (e) {
        logger.app.error("", e);
    }

}

function default_upload(file, data, session, callback) {
    var result = {success : false};
    try{
        result.filePath = file.path;
        result.fileName = file.name;
        result.success = true;
    }catch (e){
        logger.app.error("",e);
    }
    callback(result);
}
