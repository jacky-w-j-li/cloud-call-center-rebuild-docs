var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var http = require('appHttp');
var config = require('appConfig').conf;

var importhandler = {
    getXlsHeads:function(data, session, callback){
        var result = {success: false};
        var errMsg="解析表头异常，请检查Excel文件格式是否正确！";
        var url = config.ccServiceUrl+'?Action=import&Method=getHeads&file='+data.fileName+'&trueName='+data.trueName;
        url=encodeURI(url);
        http.sendGet(url,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        res.success = true;
                        callback(res);
                    }else{
                        result.message=res.message||errMsg;
                        callback(result);
                    }
                }catch (e) {
                    logger.request.error(e);
                    result.message=e.message;
                    callback(result);
                }
            }else{
                var error = err || new Error(errMsg);
                logger.request.error(error);
                result.message=error.message;
                callback(result);
            }
        });
    },
    import: function(data,session,callback){
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.getCurrentDate() ;
        var aid=session.user.account;
        var uid=session.user._id;
        data._id=id;
        data.createTime= time;
        data.creator =uid ;
        data.accountId=aid;
        data.flag="start";
        data.type="customerTask";
        data.status = "";
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data,{w:1},function(err){
            if (!err) {
                result.success = true;
                result.data=data;
                importhandler.__sendTask(aid,callback,data);
            } else {
                logger.app.error('db imp task error:' + err.stack);
                result.message = 'db imp task error!'+err.message;
                callback(result);
            }

        })
    },
    __sendTask:function(accountId,callback,data){
        var result = {success: false};
        var url = config.ccServiceUrl+'?Action=import&Method=import&Account=' + accountId;
        url=encodeURI(url);
        http.sendGet(url,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        res.success=true;
                        res.row=data;
                        callback(res);
                    }else{
                        callback(result);
                    }
                }catch (e) {
                    logger.request.error(e);
                    result.message= e.message;
                    callback(result);
                }
            }else{
                var error = err || new Error('request service error!');
                logger.request.error(error);
                result.message= error.message;
                callback(result);
            }
        });
    }
};


module.exports = importhandler;