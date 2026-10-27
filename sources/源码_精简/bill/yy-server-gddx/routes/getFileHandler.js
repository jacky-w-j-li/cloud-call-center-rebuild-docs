var config = require("appConfig");
var fs = require("fs");
var logger = require("appLog");
var path = require('path');
var mime = require('mime');
var mongo = require('appDb/MongoDb');

function parseRange(str, size) {
    if (str.indexOf(",") != -1) {
        return;
    }
    str = str.substring(6);
    var range = str.split("-"),
        start = parseInt(range[0], 10),
        end = parseInt(range[1], 10);
    // Case: -100
    if (isNaN(start)) {
        start = size - end;
        end = size - 1;
        // Case: 100-
    } else if (isNaN(end)) {
        end = size - 1;
    }
    // Invalid
    if (isNaN(start) || isNaN(end) || start > end || end > size) {
        return;
    }
    return {start: start, end: end};
}


exports.handlerRange = function (req, res) {
    try {
        var fileId = req.query.fileId;
        mongo.readFileFromDb(fileId, function (err, data, info) {
            if (!err) {
                var filename = info.name;
                var mimetype = mime.lookup(filename);        //匹配文件格式
                res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(filename));
                res.setHeader('Content-type', mimetype);
                res.setHeader('Content-Length', data.length);
                res.setHeader('Accept-Ranges', 'bytes');
                if (req.headers["range"]) {
                    var range = parseRange(req.headers["range"], data.length);
                    if (range) {
                        res.setHeader("Content-Range", "bytes " + range.start + "-" + range.end + "/" + data.length);
                        res.setHeader("Content-Length", (range.end - range.start + 1));
                        res.writeHead(206, "Partial Content");
                        res.write(new Buffer(data.slice(range.start, range.end + 1)));
                        res.end();
                    } else {
                        res.removeHeader("Content-Length");
                        res.writeHead(416, "Request Range Not Satisfiable");
                        res.end();
                    }
                } else {
                    res.write(data);
                    res.end();
                }

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

exports.handleExportFile = function (req, res) {
    var query = req.query;
    if(query.type && query.file && query.name){
        try {
            var file = config.fileDownloadDir + query.type + "/" + query.file;
            if(query.file &&(query.file.indexOf("\\")!=-1||query.file.indexOf("/")!=-1)){
                var msg="非法的文件名:"+query.file;
                logger.app.error(msg);
                res.json({
                    success: false,
                    err: msg
                });
                return;
            }
            if(query.type &&(query.type.indexOf("\\")!=-1||query.type.indexOf("/")!=-1)){
                var msg="非法的文件名:"+query.type;
                logger.app.error(msg);
                res.json({
                    success: false,
                    err: msg
                });
                return;
            }
            fs.exists(file,function(exists){
                if(exists){
                    var filename = query.name;
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
                        fs.unlink(file,function(err){
                            logger.app.error(err);
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
    } else {
        res.json({
            success: false,
            err: "param exception!"
        });
    }


}

exports.handle = function (req, res) {
    try {
        var fileId = download.fileId;
        mongo.readFileFromDb(fileId, function (err, data, info) {
            if (!err) {
                var filename = info.name;
                var mimetype = mime.lookup(filename);        //匹配文件格式
                res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(filename));
                res.setHeader('Content-type', mimetype);
                res.setHeader('Content-Length', data.length);
                res.setHeader('Accept-Ranges', 'bytes');
                res.write(data);
                res.end();

//                fs.mkdir(__baseDir+"/public/download/"+fileId,function(err){
//                    if(!err){
//                        fs.writeFile(__baseDir+"/public/download/"+fileId+"/"+filename,data,function(err){
//                            if(!err){
//                                res.redirect("/download/"+fileId+"/"+filename);
//                            }
//                        });
//                    }
//                });


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



