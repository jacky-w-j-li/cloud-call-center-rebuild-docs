var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var constants = require(__baseDir + "/7moor/utils/Constants");
var httpProvider = require("appHttp");
var config = require('appConfig');
var syncAcs = require(__baseDir + "/7moor/ucenter/SyncAcsHandler");

var handler = {
    getNumCount: function (data, session, callback) {
        var result = {success: false};
        var query1={account:session.account._id};
        var query2={account:session.account._id,called:false};
        var query3={account:session.account._id,called:true,reason:'4'};

        mongo.db().collection(constants.DB.platform_autocall).count(query1,function (err, total) {
            if (!err) {
                result.total = total;
                mongo.db().collection(constants.DB.platform_autocall).count(query2, function (err, count) {
                    if (!err) {
                        result.todo = count;
                        mongo.db().collection(constants.DB.platform_autocall).count(query3, function (err, count2) {
                            if (!err) {
                                result.dialsucess = count2;
                                result.success = true;
                                callback(result);
                            } else {
                                logger.app.error(err);
                                callback(result);
                            }
                        })
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    getNumList: function (data, session, callback) {
        var result = {success: false};
        var pageSize = data.limit||10;
        delete data['limit'];
        var page = data.page||1;
        delete data['page'];
        var limit = pageSize;
        var skip = (page - 1) * pageSize;
        var condition = data||{};
        condition.account=session.account._id;
        utils.removeEmptyProperty(condition);
        if(condition.called && typeof(condition.called)=='string'){
            if(condition.called=='true'){
                condition.called=true;
            }else{
                condition.called=false;
            }
        }
        if(condition.keypress && typeof(condition.keypress)=='string'){
            if(condition.keypress=='true'){
                condition.keypress=true;
            }else{
                condition.keypress=false;
            }
        }
        if(condition.reason && condition.reason=='0'){
            condition.reason={$ne:'4'}
        }

        mongo.db().collection(constants.DB.platform_autocall).find(condition,{sort:{beginTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db().collection(constants.DB.platform_autocall).count(condition, function (err, count) {
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
                logger.app.error(err);
                callback(result);
            }
        });
    },

    /**
     *  { file:
            { fileId: '5e262a90-9316-11e3-92d3-ff4d218bdb55',
            name: '0test_yy.xls' } }
     * @param data
     * @param session
     * @param res
     */
    importNum:function(data,session,res){
        var doc={fileId:data.file.fileId,trueName:data.file.name,isPhone:data.isPhone==null?false:true};
        handler.insertImpTask(doc,session,function(err){
            var result='';
            if(!err){
                result='<script>parent.handler.batch.uploadSuccess("success")</script>';
            }else{
                result='<script>parent.handler.batch.uploadSuccess("fail")</script>';
            }
            res.send(result);
        });
    },
    insertImpTask : function(data,session,callback){
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account._id;
        data._id=id;
        data.createTime= time;
        data.accountId=aid;
        data.batchNo=handler.__getDateNo();
        data.flag="start";
        data.type="tellist";
        mongo.db().collection(constants.DB.user_import_task).insert(data,{w:1},function(err){
            if (!err) {
                result.success = true;
                handler.__sendTask(aid,callback);
            } else {
                logger.app.error('db imp task error:' + err.stack);
                result.message = 'db imp task error!'+err.message;
                callback(result);
            }
        })
    },
    __sendTask:function(accountId,callback){
        var url = config.serviceUrl+'?Action=import&Method=import&Account=' + accountId;
        url=encodeURI(url);
        httpProvider.sendGet(url, function(err, result){
            if(!err && result){
                try{
                    var res = JSON.parse(result);
                    if(res.Succeed){
                        callback(null);
                    }else{
                        callback(new Error('request service error!'));
                    }
                }catch (e) {
                    logger.request.error(e);
                    callback(e);
                }
            }else{
                var error = err || new Error('request service error!');
                logger.request.error(error);
                callback(error);
            }
        });
    },
    __getDateNo:function(){
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var str = year + '' + (month > 9 ? month : "0" + month) + '' + (day > 9 ? day : "0" + day);
        var h = date.getHours(), m = date.getMinutes(), s = date.getSeconds();
        str += (h > 9 ? h : "0" + h) + '' + (m > 9 ? m : "0" + m) + '' + (s > 9 ? s : "0" + s);
        return str;
    },
    startDial:function(data,session,callback){
        data=data||{};
        data.account=session.account._id;
        data.pbx=session.account.pbx[0].pbx;
        syncAcs.startDial(data,callback)
    },
    removeTodoList: function (data, session, callback) {
        var result = {success: false};
        var condition = {};
        condition.account=session.account._id;
        condition.called=false;
        mongo.db().collection(constants.DB.platform_autocall).remove(condition,function (err) {
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    }
};

module.exports = handler;
