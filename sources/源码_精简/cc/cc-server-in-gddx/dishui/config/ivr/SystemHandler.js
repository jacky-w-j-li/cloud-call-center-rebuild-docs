var logger = require('appLog');
var mongo = require('appDb/MongoDb');
var util = require('util');
var uuid = require('appUtil/UUID');
var dateTimeUtil = require('appUtil/DateTime');
var fields = require(__baseDir + '/dishui/common/Fields');
var businessUtil = require('appUtil/BusinessUtil');
var ivrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var nodeRelationHandler = require(__baseDir + '/dishui/config/ivr/NodeRelationHandler');
var IvrHandler = require(__baseDir + '/dishui/config/ivr/IvrHandler');
var qualityCheckConfigHandler = require(__baseDir + '/dishui/config/ivr/QualityCheckConfigHandler');
var accountHandler = require(__baseDir + '/dishui/config/account/AccountHandler');

exports.initIvrValidate = function (data, session, callback) {
    var result = {success: false};
    var assData = {
        Exten : '3',
        validateToPeer : '',
        Action : "IvrValidateNodeAdd",
        Account : data.Account,
        PBX : data.PBX,
        DisplayName : "转ivr验证"
    }
    var initData = {
        Exten : '3',
        Account : data.Account,
        PBX : data.PBX,
        DisplayName : "转ivr验证",
        validateToPeer : '0',
        validateToPeerType : 'system',
        UpdateTime : dateTimeUtil.getCurrentDate()
    }
    var ivrData = {
        nodeData : assData,
        currentData : initData,
        isAdd : true,
        dbData : {
            tableName : fields.DB_IVR_SYSTEM,
            condition: {
                Account: data.Account,
                PBX: data.PBX,
                Exten: '3'
            }
        }
    }
    ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
        if (err) {
            logger.app.error(err);
            result.message = "Add or update extensionpeer node failure:" + initData.Exten;
            result.success = false;
            callback(result);
            return;
        }
        logger.app.info("extensionpeer node add or update: " + initData.DisplayName);
        result.success = true;
        callback(result);
    });
}

exports.initDialJobNum = function (data, session, callback) {
    var result = {success: false};
    var queryData = {
        Account: data.Account,
        PBX: data.PBX,
        Exten: '2'
    }
    mongo.db().collection(fields.DB_IVR_SYSTEM).find(queryData).toArray(function (err, docs) {
        if (err) {
            logger.app.err(err);
            result.success = false;
            result.message = 'Query dial jobnum node failure when init.';
            callback(result);
            return;
        }

        if (docs && docs.length > 0) {
            logger.app.info(data.Account + ' Dial jobnum node has inited, ignore this init process:' + data.PBX);
            result.success = true;
            result.data = docs[0];
            callback(result);
        } else {
            var assData = {
                Exten : '2',
                DialJobNumParam : 'JOBNUM',
                Action : "DialJobNumNodeAdd",
                Account : data.Account,
                PBX : data.PBX,
                DisplayName : "拨打工号",
                ToPeer : '',
                AgentBusyToPeer : '',
                LogoffToPeer : '',
                Update : false
            }
            var initData = {
                Exten : '2',
                VarId : 'JOBNUM',
                Account : data.Account,
                PBX : data.PBX,
                DisplayName : "拨打工号",
                ToPeerWhenEmpnoNotExist : '0',
                ToPeerTypeWhenEmpnoNotExist : 'system',
                ToPeerWhenEmpnoAgentBusy : '0',
                ToPeerTypeWhenEmpnoAgentBusy : 'system',
                ToPeerWhenEmpnoLogoff : '0',
                ToPeerTypeWhenEmpnoLogoff : 'system',
                UpdateTime : dateTimeUtil.getCurrentDate()
            }
            var ivrData = {
                nodeData : assData,
                currentData : initData,
                isAdd : true,
                dbData : {
                    tableName : fields.DB_IVR_SYSTEM
                }
            }
            ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
                if (err) {
                    logger.app.error(err);
                    result.message = "init dialjobnum node failure:" + initData.Exten;
                    result.success = false;
                    callback(result);
                    return;
                }
                logger.app.info("dialjobnum node init: " + initData.DisplayName);
                result.success = true;
                result.data = initData;
                callback(result);
            });
        }
    });
}

exports.querySystemForIvrTools = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_SYSTEM).find(data).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query system node failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        result.list = docs;
        result.success = true;
        callback(result);
    });
};

exports.updateSystem = function (data, session, callback) {
    var result = {success: false};
    data.UpdateTime = dateTimeUtil.getCurrentDate();
    if (data.Exten == '3') {
        var assData = {
            validateToPeer : data.validateToPeer,
            Action : "IvrValidateNodeAdd",
            Account : data.Account,
            PBX : data.PBX,
            DisplayName : "转ivr验证",
            Update : true,
            Exten : data.Exten
        }
        var ivrData = {
            nodeData : assData,
            currentData : data,
            dbData : {
                tableName : fields.DB_IVR_SYSTEM,
                condition: {
                    Account: data.Account,
                    PBX: data.PBX,
                    Exten: data.Exten
                }
            }
        }
    } else {
        data.varId = 'JOBNUM'
        var assData = {
            Exten : '2',
            DialJobNumParam : 'JOBNUM',
            Action : "DialJobNumNodeAdd",
            Account : data.Account,
            PBX : data.PBX,
            DisplayName : data.DisplayName,
            ToPeer : data.ToPeerWhenEmpnoNotExist,
            AgentBusyToPeer : data.ToPeerWhenEmpnoAgentBusy,
            LogoffToPeer : data.ToPeerWhenEmpnoLogoff,
            Update : true
        }
        var ivrData = {
            nodeData : assData,
            currentData : data,
            dbData : {
                tableName : fields.DB_IVR_SYSTEM,
                condition: {
                    Account: data.Account,
                    PBX: data.PBX,
                    Exten: data.Exten
                }
            }
        }
    }
    var relationArray = null;
    if(data.relationArray){
        relationArray = data.relationArray;
        delete data.relationArray;
    }
    ivrHandler.saveOrUpdateIvr(ivrData, session, function (err) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Update system node failure:" + data.Exten;
            result.success = false;
            callback(result);
            return;
        }
        //更新节点引用关系
        nodeRelationHandler.updateNodeRelation(data,relationArray,function(relaRes){
            logger.app.info("system node add or update: " + data.DisplayName);
            result.success = true;
            result.data = data;
            callback(result);
        });
    });
}

exports.initApproveSurvey = function (data, session, callback){
    var result = {success: false};
    var options = new Array();
    var optionData1 = {
        name: '满意',
        key: uuid.generateUuid()
    }
    var optionData1ChildArray = new Array();
    var optionData1Child = {
        name: '1',
        key: uuid.generateUuid(),
        options: []
    }
    optionData1ChildArray.push(optionData1Child);
    optionData1.options = optionData1ChildArray;
    options.push(optionData1);
    var optionData2 = {
        name: '不满意',
        key: uuid.generateUuid()
    }
    var optionData2ChildArray = new Array();
    var optionData2Child = {
        name: '2',
        key: uuid.generateUuid(),
        options: []
    }
    optionData2ChildArray.push(optionData2Child);
    optionData2.options = optionData2ChildArray;
    options.push(optionData2);
    var currentData = {
        //accountId: session.user.account,
        accountId: data._id,
        cascade: '2',
        name: '满意度调查选项',
        headers: {'0':'满意度选项','1':'满意值'},
        options: options,
        _id: uuid.generateUuid()
    }
    mongo.db().collection(fields.DB_APP_OPTIONDIC).insert(currentData, function(err){
        if(!err){
            exports.saveToAss(currentData, session, function(saveRes){
                if(!saveRes.success){
                    result.success = false;
                    callback(result);
                    return;
                }
                result.success = true;
                logger.app.info('init approve survey success' + currentData);
                callback(result);
            });
        }else{
            logger.app.err('init approve survey failed' + currentData);
            callback(result);
        }
    });
}

exports.initQualityCheckOption = function(data, session, callback){
    var result = {success: false};
    var options = new Array();
    var optionData1 = {
        ACCOUNT: data._id,
        NAME: '专业水平',
        WEIGHT: '40'
    }
    options.push(optionData1);
    var optionData2 = {
        ACCOUNT: data._id,
        NAME: '态度语气',
        WEIGHT: '30'
    }
    options.push(optionData2);
    var optionData3 = {
        ACCOUNT: data._id,
        NAME: '解决程度',
        WEIGHT: '30'
    }
    options.push(optionData3);
    exports.batchQualityCheckOption(options, session, function(batchRes){
        if (!batchRes.success){
            result.success = false;
            result.message = 'init quality check option failure';
            callback(result);
            return;
        }
        result.success = true;
        logger.app.info('init quality check success');
        callback(result);
    });
}

exports.batchQualityCheckOption = function(data, session, callback){
    var result = {success: false};
    var checkOptions = data.shift();
    qualityCheckConfigHandler.saveQualityCheckConfig(checkOptions, session, function(saveRes){
        if (!saveRes.success){
            result.success = false;
            result.message = 'init quality check option failure';
            callback(result);
            return;
        }
        if (checkOptions.length > 0){
            exports.batchQualityCheckOption(data, session, callback);
        }
        result.success = true;
        callback(result);
    })
}

exports.querySystem = function (data, session, callback) {
    var result = {success: false};
    mongo.db().collection(fields.DB_IVR_SYSTEM).find(data).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err.stack);
            result.message = "Query system node failure" + util.inspect(data);
            result.success = false;
            callback(result);
            return;
        }
        docs.unshift({"Account" : data.Account,
            "DisplayName" : "转满意度",
            "Exten" : "1",
            "PBX" : data.PBX});

        docs.unshift({"Account" : data.Account,
            "DisplayName" : "挂机",
            "Exten" : "0",
            "PBX" : data.PBX});
        result.list = docs;
        result.success = true;
        callback(result);
    });
}

exports.saveToAss = function(data, session, callback){
    var result = {success: false};
    var accountData = {_id: data.accountId};
    accountHandler.getAccountById(accountData, session, function(accRes){
        if(!accRes.success){
            callback(accRes);
            return;
        }
        var accPbxList = accRes.data.pbx;
        if(accPbxList.length == 0){
            result.success = true;
            callback(result);
        }else{
            exports.batchToPbx(accPbxList, session, function(pbxRes){
                if(!pbxRes.success){
                    callback(pbxRes);
                    return;
                }
                result.success = true;
                callback(result);
            });
        }
    });
}

exports.batchToPbx = function(data, session, callback){
    var result = {success: false};
    if(data.length > 0){
        var pbxData = data.shift();
        exports.saveOptionToPbx(pbxData, session, function(optionRes){
            if(!optionRes.success){
                callback(optionRes);
                return;
            }
            if(data.length > 0){
                exports.batchToPbx(data, session, callback)
            }else{
                result.success = true;
                callback(result);
            }
        });
    }
}

exports.saveOptionToPbx = function(data, session, callback){
    var result = {success: false};
    var findData = {
        accountId: data.Account,
        name: '满意度调查选项'
    }
    mongo.db().collection(fields.DB_APP_OPTIONDIC).findOne(findData, function(err, doc){
        if(err){
            callback(err);
            return;
        }
        if(!doc){
            result.success = false;
            callback(result);
            return;
        }else{
            var SatisfactionOptions = '';
            for(var i=0; i<doc.options.length; i++){
                if(i == 0){
                    SatisfactionOptions = "{";
                }
                if(doc.options[i].state == "2"){
                    SatisfactionOptions += "'"+doc.options[i].options[0].name+"'" +":'"+ doc.options[i].name + "',";
                }
                if(i == doc.options.length-1){
                    SatisfactionOptions = SatisfactionOptions.substr(0, SatisfactionOptions.length - 1);
                    SatisfactionOptions += "}";
                }
            }
            SatisfactionOptions = eval('(' + SatisfactionOptions + ')');
            data.SatisfactionOptions = SatisfactionOptions;
            delete data.AutoCallStrategy;
            delete data.SmartAutoCallCount;
            var ivrData = {
                isStoreDB: false,
                nodeData : data
            }
            ivrData.nodeData.Action = "AccountAdd";
            ivrHandler.saveOrUpdateIvr(ivrData, session, function(err,acsRes){
                if(!err){
                    result.success = true;
                    console.log('init phoneBarConfig success!');
                    callback(result);
                }else{
                    result.message = 'init phoneBarConfig failed!';
                    callback(result);
                }
            });
        }
    });
}

exports.getSatisfactionOptions = function(data, session, callback) {
    var result = {success: false};
    var findData = {
        accountId: data.Account,
        name: '满意度调查选项'
    }
    mongo.db().collection(fields.DB_APP_OPTIONDIC).findOne(findData, function(err, doc) {
        if (err || !doc) {
            logger.app.error('Query option dictionary failure: ' + util.inspect(data), err||new Error());
            result.success = false;
            callback(result);
        } else {
            var SatisfactionOptions = '';
            for (var i = 0; i < doc.options.length; i++) {
                if (i == 0) {
                    SatisfactionOptions = "{";
                }
                if (doc.options[i].state == "2") {
                    SatisfactionOptions += "'" + doc.options[i].options[0].name + "'" + ":'" + doc.options[i].name + "',";
                }
                if (i == doc.options.length - 1) {
                    SatisfactionOptions = SatisfactionOptions.substr(0, SatisfactionOptions.length - 1);
                    SatisfactionOptions += "}";
                }
            }
            SatisfactionOptions = eval('(' + SatisfactionOptions + ')');
            result.data = SatisfactionOptions;
            result.success = true;
            callback(result);
        }
    });
};

