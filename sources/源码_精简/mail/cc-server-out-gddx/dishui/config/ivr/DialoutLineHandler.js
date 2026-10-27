var mongo = require('appDb/MongoDb');
var fields = require(__baseDir + '/dishui/common/Fields');
var logger = require('appLog');
var IvrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var dateTimeUtil = require('appUtil/DateTime');
var uuid = require('appUtil/UUID');

exports.initAccountLine = function(data, session, callback){
    var result = {success: false};
    result.list = [];
    var line = {
        "Account": data.Account,
        "Dialout": true,
        "PBX": data.PBX
    }
    initLine(line, session, function(dialoutLineInitRes){
        if (!dialoutLineInitRes.success) {
            callback(dialoutLineInitRes);
            return;
        }
        result.list.push(dialoutLineInitRes.data);
        line.Dialout = false;
        initLine(line, session, function(transferLineInitRes){
            if (!transferLineInitRes.success) {
                callback(transferLineInitRes);
                return;
            }
            result.success = true;
            result.list.push(transferLineInitRes.data);
            callback(result);
        });
    });
}

function initLine(data, session, callback){
    var result = {success: false};
    var queryLineData = {
        Account: data.Account,
        PBX: data.PBX,
        Dialout: data.Dialout
    }

    exports.queryLine(queryLineData, session, function(queryRes){
        if (!queryRes.success) {
            callback(queryRes);
            return;
        }

        if (queryRes.list && queryRes.list.length > 0) {
            logger.app.info(data.Account + ' line [isDialout:' + data.Dialout+'] has inited, ignore this init process.');
            result.success = true;
            result.data = queryRes.list[0];
            callback(result);
        } else {
            queryLineData._id = uuid.generateUuid();
            mongo.db().collection(fields.DB_ACCOUNT_LINE).insert(queryLineData,function(err){
                if(err) {
                    logger.app.error(err);
                    result.message = 'Account ['+data.Account+'] line [dialout:' + data.Dialout + '] init failure.';
                    callback(result);
                    return;
                }
                logger.app.info('Account ['+data.Account+'] line [dialout:' + data.Dialout + '] inited.');
                result.success = true;
                result.data = queryLineData;
                callback(result);
            });
        }
    });
}

exports.queryLine = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_ACCOUNT_LINE).find(data, {sort:{Dialout:-1}}).toArray(function (err, docs) {
        if (err) {
            result.success = false;
            result.message = 'Query line failure!';
            callback(result);
            return;
        }

        result.list = docs;
        result.success = true;
        callback(result);
    });
};

exports.queryAllLines = function (data, session, callback) {
    var result = {success: false};
    mongo.db('bill').collection(fields.DB_PLATFORM_LINE).find().toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = 'query all lines failed!';
            callback(result);
            return;
        }
        result.lines = docs;
        result.success = true;
        callback(result);
        return;
    });
};

exports.saveLine = function (data, session, callback) {
    var result = {success: false};
    if (!data.Exten) {
        result.message = 'Line not choose.';
        callback(result);
        return;
    }
    if(data.MultiDidEnable){
        if(data.MultiDidEnable == 'true'){
            data.MultiDidEnable = true;
        }else{
            data.MultiDidEnable = false;
        }
    }
    //data.UpdateUser = session.user._id;
//    mongo.db('bill').collection(fields.DB_PLATFORM_LINE).findOne({_id: data.Exten}, function (err, lineDoc) {
//        if (err) {
//            callback(result);
//            return;
//        }
        data.Action = "DialLineAdd";
//        data.Exten = lineDoc._id;
        data.UpdateTime = dateTimeUtil.getCurrentDate();
        data.NeedPrefix = false;
        var ivrData = {
            nodeData: data,
            dbData: {
                tableName: fields.DB_ACCOUNT_LINE,
                condition: {"_id":data._id}
            }
        }
        if (data.Dialout == "false") {
            ivrData.nodeData.Dialout = false;
        } else {
            ivrData.nodeData.Dialout = true;
        }
        IvrHandler.saveOrUpdateIvr(ivrData, session, function (err, doc) {
            if (err) {
                result.message = 'save line to acs failed!';
                callback(result);
                return;
            }
            //reload ivr
            if(!data.Dialout){
                data.Type = 0;
            }
            IvrHandler.reloadIvr(data, session, function (reloadRes) {
                if (reloadRes.success) {
                    result.success = true;
                    result.data = data;
                    callback(result);
                } else {
                    result.message = 'reload Ivr when save line failed!';
                    callback(result);
                }
            });
        });
//    });
}

exports.saveLineForIvrTools = function(data,session,callback){
    var result = {success:false};
//    mongo.db('bill').collection(fields.DB_PLATFORM_LINE).findOne({_id:data.lineId},function(err,lineDoc){
//        if(err){
//            callback(result);
//            return;
//        }
        var ivrData = {
            nodeData : {Action:"DialLineAdd",
                PBX:data.PBX,
                Account:data.Account,
                NeedPrefix:false,
                DidNum:data.didnum || data.DidNum,
                Exten: data.lineId || data.Exten,
                Dialout: data.Dialout
            },
            isStoreDB : false
        }
//        //针对263线路，加前缀
//        if(lineDoc.lineDialoutPrefix == '904' || lineDoc.lineDialoutPrefix == '906' || lineDoc.lineDialoutPrefix == '912'){
//            ivrData.nodeData.NeedPrefix = true;
//        }
//        if(data.lineType === 'Xfer'){
//            ivrData.nodeData.Dialout = false;
//        }else{
//            ivrData.nodeData.Dialout = true;
//        }
        IvrHandler.saveOrUpdateIvr(ivrData,session,function(err,doc){
            if(err){
                result.message = 'save line to acs failed!';
                callback(result);
                return;
            }
            result.success = true;
            result.data = ivrData.nodeData;
            callback(result);
        });
//    });
};