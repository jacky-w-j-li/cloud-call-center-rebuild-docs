var handlerDir = __baseDir + '/dishui';
var logger = require('appLog');
var utils = require('appUtil/Utils');
var handler = require(handlerDir + "/common/commonInter/CommonHandler");



exports.handleCommonInter = function(query,res){
    try{
        handler.handle(query,function(result){
            if(query.flag == '1'){
                if(result.success){
                    res.end(result.empNo);
                }else{
                    res.end("0404");
                }
            } else if(query.flag == '10'){
                if(result.success){
                    res.end(result.resultStr);
                }else{
                    res.end("0404");
                }
            } else if(query.flag == '4'){
                if(result.success){
                    res.end(result.resultStr);
                }else{
                    res.end("500");
                }
            } else if(query.flag == '20' || query.flag == '31'){
                if(result.success){
                    res.end(result.resultStr);
                }else{
                    res.end("404");
                }
            }else{
                result.success = result.success || false;
                result.message = result.success ? result.message||'200 ok!' : result.message || 'unknow error!';
                utils.sendResult(result, res);
            }
        });
    }catch (e){
        logger.app.error("",e);
        utils.sendResult({success: false, message: e.message}, res);
    }
}

