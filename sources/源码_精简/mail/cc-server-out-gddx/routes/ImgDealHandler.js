var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var http = require('appHttp');
var config = require('appConfig').conf;
var fs = require('fs');


var handler = {
    transferImg : function (data, session,res) {
        var fileId = utils.UUID.generateUuid();
        var file =data.file;
        var srcFile=file.path;
        var trueName=file.name;
        var account=session.user.account;
//        var tempPath = file.path.split("/");
//        var fileId = tempPath[tempPath.length-1];
        var url = config.ccServiceUrl+'?Action=img&Method=weixin&file='+fileId+'&trueName='+trueName
            +'&account='+account+'&srcFile='+srcFile;
        url=encodeURI(url);
        http.sendGet(url,function(err,rep){
            if(!err && rep){
                try{
                    var res2 = JSON.parse(rep);
                    if(res2.Succeed){
                        var result = {
                            fileId : fileId,
                            extenion:res2.extenion,
                            trueName:trueName,
                            success:true
                        };
                        logger.request.info("transferImg return result==="+res2.isSuccess);
                        fs.unlink(srcFile, function () {
                        });
                        res.json(result);
                    }else{
                        res.json({success:false});
                    }
                }catch (e) {
                    logger.request.error(e);
                    res.json({success:false});
                }
            }else{
                var error = err || new Error('request transferImg error!');
                logger.request.error(error);
                res.json({success:false});
            }
        });
    }
};



module.exports = handler;


