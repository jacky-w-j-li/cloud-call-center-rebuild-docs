var config = require("appConfig").conf;
var fs = require("fs");
var logger = require("appLog");
var path = require('path');
var mime = require('mime');
var mongo = require('appDb/MongoDb');



exports.handleDownload = function (download, session, res) {
    if (download.fileId) {
        downloadNormalFile(download, session, res);
    } else {
        downloadExportFile(download, session, res);
    }

}

function downloadNormalFile(download, session, res) {
    try {
        var fileId = download.fileId;
        mongo.readFileFromDb(fileId, function (err, data, info) {
            if (!err) {
                var filename = info.name;
                var mimetype = mime.lookup(filename);        //匹配文件格式
                res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(filename));
                res.setHeader('Content-type', mimetype);
                res.write(data);
                res.end();
//                res.jsonp(data.toString());
            } else {
                logger.app.error("", err);
                res.json({
                    success: false,
                    err: err
                });
            }
        });
    } catch (e) {
        logger.app.error("", e);
        res.json({
            success: false,
            err: e
        });
    }

}

function downloadExportFile(download, session, res) {
    try {
        var file = config.fileDownloadDir + download.type + "/" + download.file;
        if(download.file &&(download.file.indexOf("\\")!=-1||download.file.indexOf("/")!=-1)){
            var msg="非法的文件名:"+download.file;
            logger.app.error(msg);
            res.json({
                success: false,
                err: msg
            });
            return;
        }
        if(download.type &&(download.type.indexOf("\\")!=-1||download.type.indexOf("/")!=-1)){
            var msg="非法的文件名:"+download.type;
            logger.app.error(msg);
            res.json({
                success: false,
                err: msg
            });
            return;
        }
        fs.exists(file,function(exists){
            if(exists){
                var filename = download.name;
                var mimetype = mime.lookup(file);        //匹配文件格式

                res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(filename));
                res.setHeader('Content-type', mimetype);

                var filestream = fs.createReadStream(file);
                filestream.on("error", function(err) {
                    //logger.app.error(err);
                    res.removeHeader('Content-disposition');
                    res.setHeader('Content-type', "application/json");
                    res.json({
                        success: false,
                        msg: "404"
                    });
                });
                filestream.on('data', function (chunk) {
                    res.write(chunk);
                });
                filestream.on('end', function () {
                    res.end();
                    fs.unlink(file,function(ex2){
                        if(ex2){
                            logger.app.error("unlink file error2", ex2);
                            //res.json({
                            //    success: false,
                            //    err: ex2
                            //});
                        }
                    });
                });
            } else {
                logger.app.error(file + "is not exists !");
                res.json({
                    success: false,
                    msg: "404"
                });
                return;
            }
        });
    } catch (e) {
        logger.app.error("", e);
        res.json({
            success: false,
            err: e
        });
    }
}

