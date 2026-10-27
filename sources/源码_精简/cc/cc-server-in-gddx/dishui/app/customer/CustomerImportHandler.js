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
        var url = config.ccServiceUrl+'?Action=import&Method=getHeads2&file='+data.fileName+'&trueName='+data.trueName;
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
        data.type="customer";
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
    },
    _setQueryCondition:function(query,session){
        utils.removeEmptyProperty(query);
        query.type='customer';
        if(!query.accountId){
            query.accountId=session.user.account;
        }
        utils.setDateCondition(query);
    },
    queryMyTask:function(data,session,callback){
        var result = {success: false};
        var query =data.query;
        var option=data.option;
        var sort={createTime:-1};
        importhandler._setQueryCondition(query,session);
        utils.setUserLevelCondition(query,'creator','customer',session);

        var limit = option.pageSize||10;
        var page = option.index||1;
        var skip = (page - 1) * limit;

        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).find(query,{sort:sort,limit: limit, skip: skip}).toArray(function(err,docs){
            if (!err) {
                result.list= docs;
                mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error('queryMyTask error:' + err.stack);
                result.message = 'queryMyTask error!'+err.message;
                callback(result);
            }

        });
    },
    queryTaskImport:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        var page = data.page||1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query={batchNo:data.batchNo};
        var other={sort:{createTime:-1},limit: limit, skip: skip};

        mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).find(query,other).toArray(function(err,docs){
            if (!err) {
                result.list= docs;
                mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error('db query task error:' + err.stack);
                result.message = 'db query task error!'+err.message;
                callback(result);
            }

        });
    } ,
    queryTaskRepeat:function(data,session,callback){
        var result = {success: false};
        var pageSize = data.limit||10;
        var page = data.page||1;
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var query={accountId:session.user.account,batchNo:data.batchNo};
        var other={sort:{createTime:-1},limit: limit, skip: skip};

        mongo.db().collection(fields.DB_CUSTOMER_REPEAT).find(query,other).toArray(function(err,docs){
            if (!err) {
                result.list= docs;
                mongo.db().collection(fields.DB_CUSTOMER_REPEAT).count(query, function (err, count) {
                    if (!err) {
                        result.count = count;
                        result.success = true;
                        callback(result);
                    } else {
                        logger.app.error(err);
                        callback({success: false, list: [], count: 0});
                    }
                });
            } else {
                logger.app.error('db query task error:' + err.stack);
                result.message = 'db query task error!'+err.message;
                callback(result);
            }

        });
    },
    getImpTask:function(data,session,callback){
        var result = {success: false};
        var query={_id:data._id};
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).findOne(query,function(err,doc){
            if (!err && doc) {
                result.row = doc;
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    delImpTask:function(data,session,callback){
        var result = {success: false};
        var query ={_id:data._id};
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).findOne(query,function(err,doc){
            if (!err && doc) {
                var flag=doc.flag;
                if(flag=='finish' || flag=='failure'){
                    mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).remove(query,function(err){
                        if (!err) {
                            result.success = true;
                            callback(result)
                        } else {
                            logger.app.error( err);
                            callback(result);
                        }
                    });
                }else{
                    result.success=false;
                    result.message="只有完成的批次才能删除！";
                    callback(result);
                }
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    }
};


module.exports = importhandler;
