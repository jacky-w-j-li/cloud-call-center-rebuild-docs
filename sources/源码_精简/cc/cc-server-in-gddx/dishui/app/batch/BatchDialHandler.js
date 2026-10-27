var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var httpProvider = require("appHttp");
var config = require('appConfig').conf;
var syncAcs = require(__baseDir + "/dishui/app/batch/SyncAcsHandler");


var handler = {
    getNumCount: function (data, session, callback) {
        var result = {success: false};
        var query1={account:session.account.account};
        var query2={account:session.account.account,called:false};
        var query3={account:session.account.account,called:true,reason:'4'};

        mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL).count(query1,function (err, total) {
            if (!err) {
                result.total = total;
                mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL).count(query2, function (err, count) {
                    if (!err) {
                        result.todo = count;
                        mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL).count(query3, function (err, count2) {
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
        condition.account=session.account.account;
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
                condition.keypress={$in:[false,null]};
            }
        }
        if(condition.reason && condition.reason=='0'){
            condition.reason={$ne:'4'}
        }

        mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL).find(condition,{sort:{beginTime:-1},limit: limit, skip: skip}).toArray(function (err, docs) {
            if (!err) {
                result.list = docs;
                mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL).count(condition, function (err, count) {
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
        var doc={fileName:data.file.fileId,trueName:data.file.name,isPhone:data.isPhone==null?false:true};
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
        var aid=session.account.account;
        data._id=id;
        data.createTime= time;
        data.accountId=aid;
        data.batchNo=handler.__getDateNo();
        data.flag="start";
        data.type="tellist";
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data,{w:1},function(err){
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
        var url = config.ccServiceUrl+'?Action=import&Method=import&Account=' + accountId;
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
        data.account=session.account.account;
        if(!data.pbx){
            data.pbx=session.user.pbx;
        }
        syncAcs.startDial(data,callback)
    },
    removeTodoList: function (data, session, callback) {
        var result = {success: false};
        var condition = {};
        condition.account=session.account.account;
        condition.called=false;
        mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL).remove(condition,function (err) {
            if(!err){
                result.success = true;
                callback(result);
            } else {
                logger.app.error(err);
                callback(result);
            }
        });
    },
    /**
     * http://localhost:3000/public?action=service.updateCallLimit&data=&data={"account":"N00000000036","limit":"5"}
     {
       success: true,
       message: '',
       "data": {
         "success": true
       }
     }
     * @param data
     * @param session
     * @param callback
     */
    saveConcurrent:function (data, session, callback) {
        var result = {success: false};
        var userPbx=session.user.pbx;
        data.account = session.account.account;
        data.pbx = userPbx;
        var query={_id:session.account._id};
        mongo.db("bill").collection("platform_account_product").findOne(query,function (err,product){
            if (!err && product) {
                var pbxs=product.pbx||[];
                var set={};
                for (var i = 0; i < pbxs.length; i++) {
                    var obj = pbxs[i];
                    if(obj.PBX==userPbx){
                        set=obj;
                        break;
                    }
                }
                var maxIn=set.maxIn;
                var limit=parseInt(data.limit,10);
                if(limit==-1){
                    if(!isNaN(maxIn) && maxIn!=-1){
                        result.message = '呼入并发不能设为-1';
                        callback(result);
                        return;
                    }
                }else{
                    if(!isNaN(maxIn) && maxIn!=-1 && maxIn<limit){
                        result.message = '最大并发数为【'+maxIn+'】';
                        callback(result);
                        return;
                    }
                }
                var action = 'action=service.updateCallLimit&data=' + JSON.stringify(data);
                httpProvider.sendGet(config.yyBillUrl + "?" + action, function(err, res){
                    if(err) {
                        result.message = 'Sent require to manager server error: ' + data;
                        callback(result);
                        return;
                    }
                    var resData = JSON.parse(res.toString());
                    if(!resData.success){
                        result.message = resData.message;
                        callback(result);
                        return;
                    }
                    result.success = true;
                    callback(result);
                });
            }else{
                logger.app.error(err.stack);
                callback(result);
            }
        });

    },
    /**
     * http://localhost:3000/service?action= queryLicenseCount&json={"accountId":"N00000000065","sipConfigId":"513123123"}
     * {
  "resultMsg": "接口调用成功！",
  "resultCode": "0000",
  "data": {
    "success": true,
    "info": {
      "ivr": 0,
      "monitor": 0,
      "standard": -1,
      "order": 0,
      "MaxOutboundCalls": "0",
      "enterprise": 0,
      "outcall": 0,
      "business": 0,
      "ext": 0,
      "MaxIncomingCalls": "5"
    }
  }
}
     {
     success:true,
     data:{},
     message:
     }

     * @param data
     * @param session
     * @param callback
     */
    getConcurrent:function (data, session, callback) {
        var result = {success: false};
        data.account=session.account.account;
        data.pbx=session.user.pbx;//session.user.pbx
        var action = 'action=service.queryLicenseCount&data=' + JSON.stringify(data);
        httpProvider.sendGet(config.yyBillUrl + "?" + action, function(err, res){
            if(err) {
                result.message = 'Sent require to manager server error: ' + data;
                callback(result);
                return;
            }
            var resData = JSON.parse(res.toString());
//            if(resData.resultCode != '0000') {
//                result.message = resData.resultMsg;
//                callback(result);
//                return;
//            }
            if(!resData.success){
                result.message = resData.message;
                callback(result);
                return;
            }
            result.limit=resData.data.MaxIncomingCalls;
            result.success = true;
            callback(result);
        });
    },
    _generateImpTask:function(data,session){
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        data._id=id;
        data.createTime= time;
        data.accountId=aid;
        data.batchNo=data.batchNo;
        data.flag="finish";
        data.type="telArealist";
        mongo.db().collection(fields.DB_CUSTOMER_IMPTASK).insert(data,function(err){
            if (err) {
                logger.app.error('numArea import task error:' + err.stack);
            }
        });
    },
    insertImpAreaTask : function(data,session,callback){
        var result = {success: false};
        var id=utils.UUID.generateUuid();
        var time=utils.DateTime.getCurrentDateTime();
        var aid=session.account.account;
        data._id=id;
//        data.createTime= time;
        data.account=aid;
        data.batchNo=handler.__getDateNo();
        data.called=false;
        data.current=data.beginNum;
        data.num=data.beginNum+"-"+data.endNum;
        delete data.beginNum;
        delete data.endNum;
        mongo.db('cc_autocall').collection(fields.DB_APP_AUTOCALL).insert(data,{w:1},function(err){
            if (!err) {
                var set={batchNo:data.batchNo};
                handler._generateImpTask(set,session);
                result.success = true;
                callback(result);
            } else {
                logger.app.error('db imp task error:' + err.stack);
                result.message = 'db imp task error!'+err.message;
                callback(result);
            }
        })
    },
    updateCallStrategy: function (data, session, callback) {
        var result = {success: false};
        var aid = session.account.account;
        var userPbx=session.user.pbx;
        var query={_id:session.account._id};
        mongo.db("bill").collection("platform_account_product").findOne(query,function (err,product) {
            if (!err && product) {
                var pbxs=product.pbx||[];
                var set={};
                for (var i = 0; i < pbxs.length; i++) {
                    var obj = pbxs[i];
                    if(obj.PBX==userPbx){
                        set=obj;
                        break;
                    }
                }
                if(data.AutoCallStrategy){
                    set.AutoCallStrategy=data.AutoCallStrategy;
                }
                if(data.SmartAutoCallCount){
                    set.SmartAutoCallCount=parseInt(data.SmartAutoCallCount||1,10);
                }
                mongo.db("bill").collection("platform_account_product").update({_id:session.account._id,'pbx.PBX':userPbx},{$set:{'pbx.$':set}},function (err) {
                    if (!err) {
                        var param={
                            account:aid,
                            pbx:userPbx,
                            autoCallStrategy:data.AutoCallStrategy,
                            smartAutoCallCount:parseInt(data.SmartAutoCallCount||'1',10)
                        }
                        var action = 'action=service.updateCallLimit&data=' + JSON.stringify(param);
                        httpProvider.sendGet(config.yyBillUrl + "?" + action, function(err, res){
                            if(err) {
                                result.message = 'Sent require to manager server error: ' + data;
                                callback(result);
                                return;
                            }
                            var resData = JSON.parse(res.toString());
                            if(!resData.success){
                                result.message = resData.message;
                                callback(result);
                                return;
                            }
                            result.success = true;
                            callback(result);
                        });
                    }else{
                        logger.app.error(err.stack);
                        result.message = 'updateCallStrategy error!';
                        callback(result);
                    }
                });
            }else{
                logger.app.error(err.stack);
                result.message = 'updateCallStrategy error!';
                callback(result);
            }
        });
    }

};

module.exports = handler;
