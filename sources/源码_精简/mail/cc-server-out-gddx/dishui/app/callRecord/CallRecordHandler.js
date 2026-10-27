var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');


var setQueryCondition=function(query,session){
    utils.removeEmptyProperty(query);
    //query.delTag=null;
//    if(!query.accountId){
//        query.accountId=session.user.account;
//    }
    if(query.combox){
        query.$or=[{name:new RegExp("^"+query.combox)},{"phone.tel":query.combox}];
        delete query.combox;
    }
    utils.setDateCondition(query);
}


//callRecordTmpls dic
exports.getTmplByAccId = function (session,callback) {
    var result = {success: false};
    var accId =session.user.account;
    mongo.db().collection(fields.DB_CALLRECORD_TEMPLATE).find({account:accId}).toArray(function(err,docs){
        if(!err){
            result.success = true;
            callback(null, docs || []);
        }else{
            logger.app.error('db getTmplInfo error:' + err.stack);
            result.message = '404 tmpl not found!';
            callback(err) ;
        }
    });
}
exports.addCallRecord = function (data,session,callback) {
    var result = {success: false};
    var id=utils.UUID.generateUuid();
    var time=utils.getCurrentDate() ;
    var aid=session.user.account;
    var uid=session.user._id;
    data._id=id;
    data.createTime= time;
    data.creator =uid ;
    data.lastUpdateTime=time;
    data.lastUpdater=uid;
    data.account=aid;

    var query={CALL_SHEET_ID:data.callId};
//    console.dir(data);
    mongo.db(session).collection(session.user.account+"_c5_call_sheet").findOne(query,function(err,doc){
        if (!err) {
            data.callNo=doc.CALL_NO;
            data.callTime=doc.OFFERING_TIME;
            data.recordAddr="";
            if(doc.STATUS='dealing'){
                data.recordAddr=doc.FILE_SERVER+"/"+doc.RECORD_FILE_NAME;
            }
            mongo.db(session).collection(session.user.account+fields.DB_CALLRECORD).insert(data, function (err) {
                if (!err) {
                    result.success = true;
                    result.data=data;
                } else {
                    logger.app.error('db insert error:' + err.stack);
                    result.message = 'db insert error:'+err.message;
                }
                callback(result);
            });
        }else{
            logger.app.error('query callsheet info error:' + err.stack);
            result.message = 'db insert error:'+err.message;
            callback(result);
        }
    });

}

var extractFields=function(tmpl,item){
    var fields=[];
    if(tmpl.custom_fields && tmpl.custom_fields.length>0){
        for(var i=0;i<tmpl.custom_fields.length;i++){
            var obj=tmpl.custom_fields[i];
            fields.push({n:obj.name,v:item[obj._id]||'',t:obj.type,k:obj._id}) ;
        }
    }
    return fields;
}
exports.queryCallRecordInfo = function (data, session,callback) {
    var result = {success: false};
    mongo.db(session).collection(session.user.account+fields.DB_CALLRECORD).findOne({_id:data._id},function(err,row){
        if(!err){
            if(!row){
                result.message = '404 callRecord not found!';
                callback(result);
                return;
            }
            mongo.db().collection(fields.DB_CALLRECORD_TEMPLATE).findOne({_id:row.dbType},function(err,item){
                if(!err){
                    result.success = true;
                    row.fields=extractFields(item,row)||[];
                    result.data=row;
                }else{
                    logger.app.error('db queryCallRecordInfo error:' + err.stack);
                    result.message = '404 tmpl not found!';
                }
                callback(result);
            });
        }else{
            logger.app.error('db queryCallRecordInfo error:' + err.stack);
            result.message = '404 customer not found!';
            callback(result);
        }
    });
}

exports.addCallRecord2Dial = function (data,session,callback) {
    var result = {success: false};
    var id=utils.UUID.generateUuid();
    var time=utils.getCurrentDate() ;
    var aid=session.user.account;
    var uid=session.user._id;
    data._id=id;
    data.createTime= time;
    data.creator =uid ;
    data.lastUpdateTime=time;
    data.lastUpdater=uid;
    data.account=aid;

    var beforeDay=utils.DateTime.getSomeDate(2);
    var query={OFFERING_TIME:{$gte:beforeDay},CALLED_NO:data.callNo};
    mongo.db(session).collection(session.user.account+"_c5_call_sheet").find(query, {sort:{OFFERING_TIME:-1},limit: 1}).toArray(function (err, list){
        if (!err) {
            if(list && list.length>0){
                var doc=list[0];
                data.callNo=doc.CALLED_NO;
                data.callTime=doc.OFFERING_TIME;
                data.recordAddr="";
                if(doc.STATUS='dealing'){
                    data.recordAddr=doc.FILE_SERVER+"/"+doc.RECORD_FILE_NAME;
                }
            }else{
                data.callNo="";
                data.callTime="";
                data.recordAddr="";
            }
            mongo.db(session).collection(session.user.account+fields.DB_CALLRECORD).insert(data, function (err) {
                if (!err) {
                    result.success = true;
                    result.data=data;
                    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).update({_id:data.cid},{$set:{status:'status7'}});
                } else {
                    logger.app.error('db insert error:' + err.stack);
                    result.message = 'db insert error:'+err.message;
                }
                callback(result);
            });

        }else{
            logger.app.error('query callsheet info error:' + err.stack);
            result.message = 'db insert error:'+err.message;
            callback(result);
        }
    });

}
