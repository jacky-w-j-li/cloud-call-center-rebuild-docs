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
        var fileName = data.fileName;
        var trueName = data.trueName;
        delete data.idle;
        var xlsHeads = data.xlsHeads;
        data._id=id;
        data.createTime= time;
        data.creator =uid ;
        data.accountId=aid;
        data.flag="start";
        data.type="quickreply";
        if(!xlsHeads && fileName && trueName){
            result.message ="解析表头异常，请检查Excel文件格式是否正确！";
            callback(result);
            return;
        }else if(fileName && trueName){
            mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data,{w:1},function(err){
                if (!err) {
                    result.data=data;
                    importhandler.__sendTask(aid,callback,data);
                } else {
                    logger.app.error('db imp task error:' + err.stack);
                    result.message = 'db imp task error!'+err.message;
                    callback(result);
                }

            })
        }else{
            result.message ="请选择导入文件！";
            callback(result);
        }
    },
    __sendTask:function(accountId,callback,data){
        var result = {success: false};
        var url = config.ccServiceUrl+'?Action=import&Method=quickreplyimport&Account=' + accountId+"&moduleType="+data.moduleType;
        //var url = config.ccServiceUrl+'?Action=import&Method=import&Account=' + accountId;
        url=encodeURI(url);
        http.sendGet(url,function(err,res){
            if(!err && res){
                try{
                    var res = JSON.parse(res);
                    if(res.Succeed){
                        //importhandler._sendSuccess(res,data,callback);
                        result.success=true;
                        callback(result);
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
    },

    _sendSuccess:function(res,data,callback){
        var result = {success: false};
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).findOne({_id:data._id},function(err,task){
            console.log("task&&&&&",JSON.stringify(task));
            if (!err && task.flag=="finish") {
                res.success=true;
                res.row=data;
                callback(res);
            } else if(!err && task.flag=="import"){
                importhandler._sendSuccess(res,data,callback);
            }else if(!err && task.flag=="failure"){
                res.success=false;
                res.message="导入失败，请稍后重试！";
                callback(res);
            }else{
                res.success=false;
                logger.app.error('db imp task error: there is no task execute' );
                callback(res);
            }
        })
    },
};

module.exports = importhandler;
