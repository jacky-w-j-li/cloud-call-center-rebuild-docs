var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');
var fields = require(__baseDir + '/dishui/common/Fields');
var UUID = require('appUtil//UUID');
var appEvent = require("appEvent");
var userHandler = require(__baseDir + '/dishui/config/ivr/UserHandler');
var dateTimeUtil = require('appUtil/DateTime');
var qualityCheckHandler = require(__baseDir + '/dishui/config/qualityCheck/QualityCheckHandler');
var custHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');
var httpProvider = require("appHttp");
var Thenjs = require("thenjs");


exports.queryCallSheet = function (data, session, callback) {
    var result = { success: false};
    var sort = {OFFERING_TIME: -1};
    var begin = 0;
    var pageSize = 10;
    if(data.pageSize){
        pageSize = parseInt(data.pageSize);
    }
    var data = formatCondition(data);
//    data.ACCOUNT_ID = session.user.account;
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    var folog = true;
    if (data.isPermissions) {
        folog = false;
    }

    delete data.isPermissions;
    delete data.page;
    delete data.pageSize;
    delete data.cdrExportType;
    delete data.cdrId;

    var has_quality_grade = false;
    if('QUALITY_GRADE' in data){
        has_quality_grade = true;
    }
    var has_quality_taskId = false;
    if ("TASK_ID" in data) {
        has_quality_taskId = true;
    }
    utils.removeEmptyProperty(data);
    if(has_quality_grade){
        data.QUALITY_GRADE = null;
    }
    if(has_quality_taskId){
        data.TASK_ID = null;
    }
    /*    if(data.DISPOSAL_AGENT){
     if(typeof data.DISPOSAL_AGENT == 'string'){
     utils.setUserLevelCondition(data,'DISPOSAL_AGENT',session);
     }
     }else{
     utils.setUserLevelCondition(data,'DISPOSAL_AGENT',session);
     if(data.DISPOSAL_AGENT){
     data.DISPOSAL_AGENT['$in'].push(null);
     }
     }*/
    var menu = "call" //如果是从质检过来的话 需要质检权限
    if(data.menu){
        menu = data.menu;
        delete data.menu;
    } ;
    utils.setUserLevelCondition(data,'DISPOSAL_AGENT',menu,session,true);
    if(data.combox){
        data.$or=[{CALL_NO:data.combox},{CALLED_NO:data.combox}];
        delete data.combox;
    }
    mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(data, {sort:sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        if (!docs) {
            result.success = true;
            result.list = [];
            result.count = 0;
            callback(result);
            return;
        }

        if(data.DISPOSAL_AGENT && typeof data.DISPOSAL_AGENT !='string' && data.DISPOSAL_AGENT['$in'] && data.DISPOSAL_AGENT['$in'].length > 5){
            var endCount = 0;
            exports.recurCount(data, sort, endCount, session, function(res){
                if(!res.success){
                    callback(result);
                    return;
                }else{
                    result.success = true;
                    result.list = docs;
                    result.count = res.endCount;
                    callback(result);
                }
            });
        }else{
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(data).count(function (err, docCount) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                if (!docCount) {
                    result.success = true;
                    result.list = [];
                    result.count = 0;
                    callback(result);
                    return;
                }
                result.success = true;
                result.list = docs;
                result.count = docCount;
                callback(result);
            });
        }
    });
}

exports.queryCallSheetRandom = function (data,randomTemplate,session, callback,template) {
    var result = { success: false};
    var sort = {OFFERING_TIME: -1};
    var begin = 0;
    var pageSize = 10;
    if(data.pageSize){
        pageSize = parseInt(data.pageSize);
    }
    var data = formatCondition(data);

    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }

    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).findOne({_id : randomTemplate},function(err,doc){
        if(err) {
            callback(result);
            return;
        }
        if (!doc) {
            result.success = true;
            callback(result);
            return;
        }
        var query = formatCondition(doc.query);
        var agents = [];
        if(query.DISPOSAL_AGENT && query.DISPOSAL_AGENT.length>0){
            agents = JSON.parse(JSON.stringify(query.DISPOSAL_AGENT));
            query.DISPOSAL_AGENT = {$in:query.DISPOSAL_AGENT};
        }
        if(query.CONNECT_TYPE && query.CONNECT_TYPE.length>0){
            query.CONNECT_TYPE = {$in:query.CONNECT_TYPE};
        }
        if(query.ERROR_MEMO && query.ERROR_MEMO.length>0){
            query.ERROR_MEMO = {$in:query.ERROR_MEMO};
        }

        var randomRule = doc.EXT_RULE;
        //var countTypePercent = doc.COUNT_TYPE_PERCENT;
        //var countTypeNum = doc.COUNT_TYPE_NUM;
        var randomPercent = doc.PERCENT;
        if(randomRule == "COUNT_TYPE_PERCENT"&& !randomPercent){
            callback(result);
            return;
        }
        var randomNum = doc.TEMPLATE_NUM;

        if(!randomRule || doc[randomRule].indexOf("entirety") >= 0){
            var count = 0;
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query,{_id:1}, {sort:sort}).skip(0).toArray(function (err, docs) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                if (!docs) {
                    callback(result);
                    return;
                }

                var randomIdList = [];
                if(!randomRule || doc[randomRule] == "entirety_num"){
                    count = randomNum;
                }else if(doc[randomRule] == "entirety_percent"){
                    count = Math.round(docs.length * randomPercent * 0.01)
                }

                if(docs.length < count){
                    for(var i=0;i<docs.length;i++){
                        randomIdList.push(docs[i]._id);
                    }
                }else{
                    var randomArr = [];
                    var getRandomArray = function(num,max){
                        var whileFlag = true;
                        while(whileFlag){
                            var rNum = utils.getRandomNum(0,max);
                            var repeatFlag = false;
                            for(var i=0;i<randomArr.length;i++){
                                if(rNum == randomArr[i]){
                                    repeatFlag = true;
                                    break;
                                }
                            }
                            if(!repeatFlag){
                                randomArr.push(rNum);
                            }
                            if(randomArr.length == num){
                                whileFlag = false;
                            }
                        }
                    };
                    getRandomArray(count,docs.length-1);

                    for(var i=0;i<randomArr.length;i++){
                        var random = randomArr[i];
                        randomIdList.push(docs[random]._id);
                    }
                }

                exports.updateSign(randomTemplate, randomIdList,session, function(result){
                    if(!result.success){
                        callback(result);
                    }
                    exports.queryCallSheetRandomBySign(data,pageSize,begin,randomTemplate, session, callback,template);
                });
            });
        }else if(doc[randomRule].indexOf("per") >= 0){

            var randomIdList = [];
            var params = {
                nowNum:0,
                randomRule:doc[randomRule],
                randomTemplete : doc,
                randomPercent:randomPercent,
                randomNum:randomNum,
                query:query,
                session:session,
                agents:agents
            }
            exports.randonForAgent(params,randomIdList,function(result){
                if(!result.success){
                    callback(result);
                }
                exports.updateSign(randomTemplate, randomIdList,session, function(result){
                    if(!result.success){
                        callback(result);
                    }
                    exports.queryCallSheetRandomBySign(data,pageSize,begin,randomTemplate, session, callback,template);
                });
            })
        }
    });
}

exports.randonForAgent = function(params,randomIdList,callback){
    var result = {success : false};
    var sort = {OFFERING_TIME: -1};

    if(params.nowNum >= params.agents.length){
        result.success = true;
        callback(result);
    }else{
        params.query.DISPOSAL_AGENT = params.agents[params.nowNum];
        mongo.db(params.session).collection(params.session.account.account + '_c5_call_sheet').find(params.query,{_id:1}, {sort:sort}).skip(0).toArray(function (err, docs) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }

            if(docs && docs.length > 0){
                var randomNum = 0
                if(params.randomRule == "per_num"){
                    randomNum = params.randomNum;
                }else if(params.randomRule == "per_percent"){
                    randomNum = Math.round(docs.length * params.randomPercent * 0.01)
                }
                if(docs.length <= randomNum){
                    for(var i=0;i<docs.length;i++){
                        randomIdList.push(docs[i]._id);
                    }
                }else{
                    var randomArr = [];
                    var getRandomArray = function(num,max){
                        var mod = Math.floor(max/num);
                        for(var t=0;t< num;t++){
                            var start = t * mod;
                            var end = (t+1) * mod - 1;
                            if(t == num - 1){
                                end = max;
                            }
                            randomArr.push(utils.getRandomNum(start,end));
                        }
                    };
                    getRandomArray(randomNum,docs.length-1);

                    for(var i=0;i<randomArr.length;i++){
                        var random = randomArr[i];
                        if(docs[random]){
                            randomIdList.push(docs[random]._id);
                        }
                    }
                }
            }

            params.nowNum++;
            exports.randonForAgent(params,randomIdList,callback)
        })
    }
}

exports.recurCount = function(query, sort, endCount, session, callback){
    if (query.DISPOSAL_AGENT['$in'].length == 0) {
        callback({success:true, endCount: endCount});
    } else {
        var one = query.DISPOSAL_AGENT['$in'].shift();
        var tmpQuery = utils.deepClone(query);
        tmpQuery.DISPOSAL_AGENT = one;
        mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(tmpQuery, {sort:sort}).count(function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback({success:true});
                return;
            }
            if(docCount){
                endCount += docCount;
            }
            exports.recurCount(query, sort, endCount, session, callback);
        });
    }
}

exports.getCdrChannel = function(data,session,callback){
    var result = {success : false};
    var findChannel = {
        'UNIQUEID' : data.CALL_ID
    }
    mongo.db(session).collection(session.account.account+'_cdr_channel').find(findChannel).sort({'SEQUENCENUM':1}).toArray(function(err,chanDocs){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        //console.log(chanDocs);
        result.success = true;
        result.data = chanDocs;
        callback(result);
    });
}

function formatCondition(data){
    if(data.BEGIN_TIME || data.END_TIME) {
        data.OFFERING_TIME = {};
        if(data.BEGIN_TIME){
            data.OFFERING_TIME["$gte"] = data.BEGIN_TIME;
            delete data.BEGIN_TIME;
        }
        if(data.END_TIME){
            data.OFFERING_TIME["$lte"] = data.END_TIME;
            delete data.END_TIME;
        }
    }
    if(data.CHECK_BEGIN_TIME || data.CHECK_END_TIME) {
        data.GRADE_TIME = {};
        if(data.CHECK_BEGIN_TIME){
            data.GRADE_TIME["$gte"] = data.CHECK_BEGIN_TIME;
            delete data.CHECK_BEGIN_TIME;
        }
        if(data.CHECK_END_TIME){
            data.GRADE_TIME["$lte"] = data.CHECK_END_TIME;
            delete data.CHECK_END_TIME;
        }
    }
    if(data.ERROR_MEMO) {
        delete data.LEAK_TYPE;
    } else if(data.LEAK_TYPE) {
        if(data.LEAK_TYPE == 1) {
            data.ERROR_MEMO = {$exists:true, $nin:[null]};
        } else {
            data.ERROR_MEMO = {$exists:true, $in:[null]};
        }
    }
    if(data.NUMBER) {
        data['$or'] = [{
            CALL_NO : data.NUMBER
        },
            {
                CALLED_NO : data.NUMBER
            }];
        delete data.NUMBER;
    }
    if(data.CALL_TIME_LENGTH_BEGIN) {
        if(!('CALL_TIME_LENGTH' in data)){
            data.CALL_TIME_LENGTH = {};
        }
        data.CALL_TIME_LENGTH["$gte"]=parseInt(data.CALL_TIME_LENGTH_BEGIN);
    }
    delete data.CALL_TIME_LENGTH_BEGIN;
    if(data.CALL_TIME_LENGTH_END) {
        if(!('CALL_TIME_LENGTH' in data)){
            data.CALL_TIME_LENGTH = {};
        }
        data.CALL_TIME_LENGTH["$lte"]=parseInt(data.CALL_TIME_LENGTH_END);
    }
    delete data.CALL_TIME_LENGTH_END;
    if(data.QUEUE_TIME_LENGTH_BEGIN) {
        if(!('QUEUE_TIME_LENGTH' in data)){
            data.QUEUE_TIME_LENGTH = {};
        }
        data.QUEUE_TIME_LENGTH["$gte"]=parseInt(data.QUEUE_TIME_LENGTH_BEGIN);
    }
    delete data.QUEUE_TIME_LENGTH_BEGIN;
    if(data.QUEUE_TIME_LENGTH_END) {
        if(!('QUEUE_TIME_LENGTH' in data)){
            data.QUEUE_TIME_LENGTH = {};
        }
        data.QUEUE_TIME_LENGTH["$lte"]=parseInt(data.QUEUE_TIME_LENGTH_END);
    }
    delete data.QUEUE_TIME_LENGTH_END;
    if(data.KEY_TAG){
        if(data.KEY_TAG == "true"){
            data.KEY_TAG = true;
        }else{
            data.KEY_TAG ={$in:[null]};
        }
    }
    if(data.GRADE_CONFIG) {
        var gradeCondition = null;
        var configId = data.GRADE_CONFIG;
        if(data.GRADE_MIN){
            var gradeMin = parseFloat(data.GRADE_MIN);
            if(gradeMin >= 0) {
                gradeCondition = gradeCondition || {};
                gradeCondition['$gte'] = gradeMin;
            }
        }
        if(data.GRADE_MAX){
            var gradeMax = parseFloat(data.GRADE_MAX);
            if(gradeMax >= 0) {
                gradeCondition = gradeCondition || {};
                gradeCondition['$lte'] = gradeMax;
            }
        }
        if(gradeCondition) {
            data[configId] = gradeCondition;
        }
    }else{
        var gradeCondition = null;
        if(data.GRADE_MIN){
            var gradeMin = parseFloat(data.GRADE_MIN);
            if(gradeMin >= 0) {
                gradeCondition = gradeCondition || {};
                gradeCondition['$gte'] = gradeMin;
            }
        }
        if(data.GRADE_MAX){
            var gradeMax = parseFloat(data.GRADE_MAX);
            if(gradeMax >= 0) {
                gradeCondition = gradeCondition || {};
                gradeCondition['$lte'] = gradeMax;
            }
        }
        if(gradeCondition) {
            data.GRADE_AMOUNT = gradeCondition;
        }
    }

    if(data.CUSTOMER_NAME){
        if(data.CUSTOMER_NAME == 'true'){
            delete data.CUSTOMER_NAME;
            data.CUSTOMER_ID = { $ne : '00000000000000000000' };
        }else{
            data.CUSTOMER_ID = '00000000000000000000';
        }
    }
    delete data.GRADE_CONFIG;
    delete data.GRADE_MIN;
    delete data.GRADE_MAX;

    return data;
}

exports.cdrLocationCustomer = function(data, session, callback){
    var result = {success:false};
    var findCus = {
        _id : data.customerId
    }
    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne(findCus,function(err,doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        if(doc){
            var condition = {
                CALL_SHEET_ID : data.CALL_SHEET_ID
            }
            var updateData = {
                "$set" : { CUSTOMER_ID : data.customerId , CUSTOMER_NAME : doc.name }
            }
            mongo.db(session).collection(session.user.account+'_c5_call_sheet').update(condition,
                updateData, function(err){
                    if (err) {
                        logger.app.error(err);
                        callback(result);
                        return;
                    }
                    //update leak table
                    var leakCondition = {
                        CALL_SHEET_ID : data.CALL_SHEET_ID
                    }
                    mongo.db().collection('c5_call_sheet_leak').update(leakCondition,
                        updateData,function(err){
                            if(err){
                                logger.app.error(err);
                                callback(result);
                                return;
                            }
                            result.success = true;
                            callback(result);
                            return;
                        });
                });
        }else{
            result.success = true;
            callback(result);
            return;
        }
    });
}

exports.getEmpNoByCallNo = function(data, session, callback){
    var result = {success: false};
    var queryCdrData = {};
    queryCdrData.OFFERING_TIME = {"$gte" : dateTimeUtil.getSomeDate(30)};
    queryCdrData.DISPOSAL_AGENT = {$nin:[null],$exists:true};
    if(data.callMemory == "1"){
        queryCdrData.CALL_NO = data.callNo;
        mongo.db(session).collection(data.accountId+fields.DB_ACCOUNT_CALL_SHEET).find(queryCdrData).limit(1).sort({"OFFERING_TIME": -1}).toArray(function(err, odocs){
            if(err){
                result.message = 'query cdr failed!'+ queryCdrData;
                logger.app.error(result.message);
                callback(result);
                return;
            }
            delete queryCdrData.CALL_NO;
            queryCdrData.CALLED_NO = data.callNo;
            mongo.db(session).collection(data.accountId+fields.DB_ACCOUNT_CALL_SHEET).find(queryCdrData).limit(1).sort({"OFFERING_TIME": -1}).toArray(function(err, tdocs){
                if(err){
                    result.message = 'query cdr failed!'+ queryCdrData;
                    logger.app.error(result.message);
                    callback(result);
                    return;
                }
                var agentId = null;
                if((odocs && odocs.length>0) && (tdocs && tdocs.length>0)){
                    if(odocs[0].OFFERING_TIME >= tdocs[0].OFFERING_TIME){
                        agentId = odocs[0].DISPOSAL_AGENT;
                    }else{
                        agentId = tdocs[0].DISPOSAL_AGENT;
                    }
                }else if(odocs && odocs.length>0){
                    agentId = odocs[0].DISPOSAL_AGENT;
                }else if(tdocs && tdocs.length>0){
                    agentId = tdocs[0].DISPOSAL_AGENT;
                }
                if(agentId != null){
                    userHandler.queryUser({"_id": agentId}, null, function(userRes){
                        if(!userRes.success){
                            result.message = 'query user failure: ' + docs[0].DISPOSAL_AGENT
                            logger.app.error(result.message);
                            callback(result);
                            return;
                        }
                        result.success = true;
                        result.empNo = userRes.list[0].exten;
                        callback(result);
                        return;
                    });
                }else{
                    result.success = true;
                    result.message = 'can not find find cdr' + data.callNo;
                    result.empNo = '404';
                    logger.app.warn(result.message);
                    callback(result);
                }
            });
        });
    }else if(data.callMemory == "2"){
        queryCdrData.CALL_NO = data.callNo;
    }else if(data.callMemory == "3"){
        queryCdrData.CALLED_NO = data.callNo;
    }
    if(data.callMemory != "1"){
        mongo.db(session).collection(data.accountId+fields.DB_ACCOUNT_CALL_SHEET).find(queryCdrData).limit(1).sort({"OFFERING_TIME": -1}).toArray(function(err, docs){
            if(err){
                result.message = 'query cdr failed!'+ queryCdrData;
                logger.app.error(result.message);
                callback(result);
                return;
            }
            if(docs && docs.length > 0){
                userHandler.queryUser({"_id": docs[0].DISPOSAL_AGENT}, null, function(userRes){
                    if(!userRes.success){
                        result.message = 'query user failure: ' + docs[0].DISPOSAL_AGENT
                        logger.app.error(result.message);
                        callback(result);
                        return;
                    }
                    result.success = true;
                    result.empNo = userRes.list[0].exten;
                    callback(result);
                });
            }else{
                result.success = true;
                result.message = 'can not find find cdr' + data.callNo;
                result.empNo = '404';
                logger.app.warn(result.message);
                callback(result);
            }
        });
    }
}

function formatConditionByCustomer(data){
    if(data.BEGIN_TIME || data.END_TIME) {
        data.OFFERING_TIME = {};
        if(data.BEGIN_TIME){
            data.OFFERING_TIME["$gte"] = data.BEGIN_TIME;
            delete data.BEGIN_TIME;
        }
        if(data.END_TIME){
            data.OFFERING_TIME["$lte"] = data.END_TIME;
            delete data.END_TIME;
        }
    }
    if(data.ERROR_MEMO) {
        delete data.LEAK_TYPE;
    } else if(data.LEAK_TYPE) {
        if(data.LEAK_TYPE == 1) {
            data.ERROR_MEMO = {$exists:true, $nin:[null]};
        } else {
            data.ERROR_MEMO = {$exists:true, $in:[null]};
        }
    }
    if(data.NUMBER) {
        data['$or'] = [{
            CALL_NO : data.NUMBER
        },
            {
                CALLED_NO : data.NUMBER
            }];
        delete data.NUMBER;
    }
    if(data.CALL_TIME_LENGTH_BEGIN) {
        if(!('CALL_TIME_LENGTH' in data)){
            data.CALL_TIME_LENGTH = {};
        }
        data.CALL_TIME_LENGTH["$gte"]=parseInt(data.CALL_TIME_LENGTH_BEGIN);
    }
    delete data.CALL_TIME_LENGTH_BEGIN;
    if(data.CALL_TIME_LENGTH_END) {
        if(!('CALL_TIME_LENGTH' in data)){
            data.CALL_TIME_LENGTH = {};
        }
        data.CALL_TIME_LENGTH["$lte"]=parseInt(data.CALL_TIME_LENGTH_END);
    }
    delete data.CALL_TIME_LENGTH_END;
    if(data.KEY_TAG){
        if(data.KEY_TAG == "true"){
            data.KEY_TAG = true;
        }else{
            data.KEY_TAG ={$in:[null]};
        }
    }

    if(data.custTel && data.custTel.length>0) {
        data['$or'] = [
            {
                CUSTOMER_ID:data.CUSTOMER_ID
            },
            {
                CALL_NO : {$in:data.custTel}
            },
            {
                CALLED_NO :{$in:data.custTel}
            }
        ];
        delete data.CUSTOMER_ID;
        delete data.custTel;
    }

    return data;
}
function packData (data) {
    var condition = {};
    data = data.query;
    condition.STATUS = "dealing";
    condition.QUALITY_GRADE = null;
    //呼叫时间
    if(data.BEGIN_TIME || data.END_TIME) {
        condition.OFFERING_TIME = {};
        if(data.BEGIN_TIME){
            condition.OFFERING_TIME["$gte"] = data.BEGIN_TIME;
            delete data.BEGIN_TIME;
        }
        if(data.END_TIME){
            condition.OFFERING_TIME["$lte"] = data.END_TIME;
            delete data.END_TIME;
        }
    }
    //呼入技能组
    if (data.QUEUE) {
        condition.ERROR_MEMO = data.QUEUE;
    }
    //任务过滤
    /*if (data.TASK_ID) {
     if (data.selectedAgentList.indexOf(",") != -1) {
     var list = data.selectedAgentList.split(",");
     condition.DISPOSAL_AGENT= {"$in":list};
     } else {
     condition.DISPOSAL_AGENT = data.selectedAgentList;
     }
     }*/
    condition.TASK_ID = null;
    //通话时长-开始
    if(data.CALL_TIME_LENGTH_BEGIN) {

        if(!('CALL_TIME_LENGTH' in condition)){
            condition.CALL_TIME_LENGTH = {};
        }
        condition.CALL_TIME_LENGTH["$gte"]=parseInt(data.CALL_TIME_LENGTH_BEGIN);
    }
    //通话时长-结束
    if(data.CALL_TIME_LENGTH_END) {

        if(!('CALL_TIME_LENGTH' in condition)){
            condition.CALL_TIME_LENGTH = {};
        }
        condition.CALL_TIME_LENGTH["$lte"]=parseInt(data.CALL_TIME_LENGTH_END);
    }
    //呼叫类型
    if (data.CONNECT_TYPE) {
        condition.CONNECT_TYPE = data.CONNECT_TYPE;
    }
    //满意度
    if (data.INVESTIGATE) {
        condition.INVESTIGATE = data.INVESTIGATE;
    }
    return condition;
}
exports.queryCallSheetByCustomer = function (data, session, callback) {
    var result = { success: false};
    var sort = {OFFERING_TIME: -1};
    var begin = 0;
    var pageSize = 10;
    if(data.pageSize){
        pageSize = parseInt(data.pageSize);
    }
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    delete data.page;
    delete data.pageSize;

    mongo.db(session).collection(session.user.account+fields.DB_C5_CUSTOMER).findOne({_id:data.CUSTOMER_ID},function(err,row){
        if(!err && row){
            var tels=[];
            if(row.phone && row.phone.length>0){
                for (var i = 0; i < row.phone.length; i++) {
                    var obj = row.phone[i];
                    if(obj.tel){
                        tels.push(obj.tel);
                    }
                }
            }
            data.custTel=tels||[];

//            data = formatConditionByCustomer(data);
//    data.ACCOUNT_ID = session.user.account;

            delete data.cdrExportType;
            var cdrQuery={CUSTOMER_ID:data.CUSTOMER_ID};
//            var cdrQuery2={CALL_NO:{$in:data.custTel}};
//            var cdrQuery3={CALLED_NO:{$in:data.custTel}};
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(cdrQuery, {sort:sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                result.success = true;
                result.list = docs;
                callback(result);
                /*                mongo.db(session).collection(session.account.account + '_c5_call_sheet').count(data, function (err, docCount) {
                 if (err) {
                 logger.app.error(err);
                 callback(result);
                 return;
                 }
                 result.success = true;
                 result.list = docs;
                 result.count = docCount;
                 callback(result);
                 });*/
            });
        }else{
            logger.app.error('db queryCustInfo error:' + err.stack);
            result.message = '404 customer not found!';
            callback(result);
        }
    });
}
exports.getQualityedCheckCallSheet = function(data, session, callback) {
    var result = { success: false};
    mongo.db(session).collection(session.account.account + '_c5_call_sheet').findOne({"_id":data}, function (err, row) {
        if (!err) {
            result.success = true;
            result.data = row;
        } else {
            logger.app.error('db getAccount error:' + err.stack);
            result.message = '404 account not found!';
        }
        callback(result);
    });
}
exports.getQualityCheckCallSheet = function(data, session, callback) {
    data.STATUS = 'dealing';
    data.QUALITY_GRADE = null;
    data.TASK_ID = null;
    var randomNum = data.RANDOMNUM;
    var randomTemplate = data.randomTemplate;
    var pageSize = data.pageSize;
    var page = data.page;
    //var ifReset = data.reset;

    if(data.cdrId == "quality_check_query") {
        data.menu = "qc";
        exports.queryCallSheet(data, session, callback);
    }else if (data.cdrId == "quality_check_query_task") {
        exports.selectedCallRecord(data, session, callback);
    }else if(data.cdrId == "quality_check_query_random"){

        if(data.reset){
            exports.queryCallSheetRandom(data,randomTemplate,session,callback);
        }else{
            exports.queryCallSheetRandomBySign(data,pageSize,page,randomTemplate, session, callback);
        }

    }else if(data.cdrId == "quality_check_query_random_template_addAndSelect"){
        exports.saveRandomTemplate(data,session,'addAndSelect',callback);
    }
}
exports.saveRandomTemplate = function(data, session,selFlag, callback){
    var result = { success: false};
    var query = {
        TEMPLATE_NAME:data.TEMPLATE_NAME,
        account:session.user.account
    }

    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).find(query).toArray(function(err,doc){
        if(err) {
            callback(result);
            return;
        }
        if(doc && doc.length > 0){
            result.code = 0;
            result.message = "模板名称重复，请重新输入！";
            callback(result);
            return;
        }
        var sort = {OFFERING_TIME: -1};
        var templateName = data.TEMPLATE_NAME;
        var randomRule = data.EXT_RULE;
        var countTypePercent = data.COUNT_TYPE_PERCENT;
        var countTypeNum = data.COUNT_TYPE_NUM;
        var randomNum = data.RANDOMNUM;
        var randomPercent = data.PERCENT;
        var includeSubordinate = data.includeSubordinate;
        var selectedAgentList = data.selectedAgentList;
        var selectedCallTypeList = data.CONNECT_TYPE_SELECTED;
        var selectedQueueList = data.ERROR_MEMO_SELECTED;
        var randomTemplate = UUID.generateUuid();

        delete data.EXT_RULE;
        delete data.COUNT_TYPE_PERCENT;
        delete data.COUNT_TYPE_NUM;
        delete data.PERCENT;
        delete data.includeSubordinate;
        delete data.selectedAgentList;
        delete data.CONNECT_TYPE_SELECTED;
        delete data.ERROR_MEMO_SELECTED;
        delete data.RANDOMNUM;
        delete data.randomTemplate;
        delete data.reset;
        delete data.page;
        delete data.pageSize;
        delete data.cdrExportType;
        delete data.cdrId;
        delete data.selectedAgent;
        delete data.TEMPLATE_NAME;


        var has_quality_grade = false;
        if('QUALITY_GRADE' in data){
            has_quality_grade = true;
        }
        utils.removeEmptyProperty(data);
        if(has_quality_grade){
            data.QUALITY_GRADE = null;
        }
        data.TASK_ID = null;

        //utils.setUserLevelCondition(data,'DISPOSAL_AGENT','call',session,true);
        userHandler.queryUser({account: session.user.account}, session, function(userRes){
            if(!userRes.success){
                callback(result);
                return;
            }
            if(selectedAgentList && selectedAgentList != ""){
                var agents = selectedAgentList.split(',');
                if(includeSubordinate){
                    var agentChooseList = selectedAgentList.split(',');
                    var agentList = userRes.list;

                    for(var i=0 ;i<agentChooseList.length;i++){
                        var agent_id = agentChooseList[i];
                        utils.getLowUserArrayByParentId(agent_id,agentList,agents);
                    }

                }
                //if(agents.length == 1){
                //    data.DISPOSAL_AGENT = selectedAgentList;
                //}else{
                //    data.DISPOSAL_AGENT = {$in:agents};
                //}
                data.DISPOSAL_AGENT = agents;
            }else{
                if(randomRule){
                    if((randomRule == "COUNT_TYPE_NUM" && countTypeNum == "per_num") || (randomRule == "COUNT_TYPE_PERCENT" && countTypePercent == "per_percent")){
                        var agents = [];
                        for(var i=0;i<userRes.list.length;i++){
                            agents.push(userRes.list[i]._id);
                        }
                        data.DISPOSAL_AGENT = agents;
                    }
                }
            }
            if(data.combox){
                data.$or=[{CALL_NO:data.combox},{CALLED_NO:data.combox}];
                delete data.combox;
            }
            if(selectedCallTypeList && selectedCallTypeList != ""){
                data.CONNECT_TYPE = selectedCallTypeList.split(',');
            }
            if(selectedQueueList && selectedQueueList != ""){
                data.ERROR_MEMO = selectedQueueList.split(',');
            }
            var data1 = utils.deepClone(data);
            var query = formatCondition(data);
            if(query.DISPOSAL_AGENT){
                if(query.DISPOSAL_AGENT.length == 1){
                    query.DISPOSAL_AGENT = query.DISPOSAL_AGENT[0];
                }else{
                    query.DISPOSAL_AGENT = {$in:query.DISPOSAL_AGENT};
                }
            }
            if(query.CONNECT_TYPE){
                if(query.CONNECT_TYPE.length == 1){
                    query.CONNECT_TYPE = query.CONNECT_TYPE[0];
                }else{
                    query.CONNECT_TYPE = {$in:query.CONNECT_TYPE};
                }
            }
            if(query.ERROR_MEMO){
                if(query.ERROR_MEMO.length == 1){
                    query.ERROR_MEMO = query.ERROR_MEMO[0];
                }else{
                    query.ERROR_MEMO = {$in:query.ERROR_MEMO};
                }
            }
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query, {sort:sort}).count(function (err, docCount) {
                if (err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                if(selFlag == "addAndSelect" && docCount == 0){
                    result.success = true;
                    result.countAll = 0;
                    result.list = [];
                    result.randomTemplate = randomTemplate;
                    callback(result);
                    return;
                }

                var doc = {
                    _id: randomTemplate,
                    TEMPLATE_NAME : templateName,
                    EXT_RULE : randomRule,
                    COUNT_TYPE_PERCENT : countTypePercent,
                    COUNT_TYPE_NUM : countTypeNum,
                    TEMPLATE_NUM : randomNum,
                    PERCENT :  randomPercent,
                    selectedAgentList: selectedAgentList,
                    selectedCallTypeList: selectedCallTypeList,
                    selectedQueueList: selectedQueueList,
                    includeSubordinate: includeSubordinate,
                    account: session.user.account,
                    query : data1,
                    time : dateTimeUtil.getDateFormat(new Date())
                }
                mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).insert(doc, function(err){
                    if(err) {
                        callback(result);
                        return;
                    }
                    if(selFlag == 'addAndSelect'){
                        exports.queryCallSheetRandom(data,randomTemplate,session,callback,doc);
                    }else{
                        result.success = true;
                        result.condition = doc;
                        callback(result);
                    }
                });
            });
        });
    });
}
exports.saveQualityTaskTemplateAndselect = function (data, session, callback) {
    var result = { success: false};
    var query = {
        TASK_NAME:data.TASK_NAME,
        account:session.user.account
    }
    mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).find(query).toArray(function(err,doc){
        if(err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        if(doc && doc.length > 0){
            result.message = "质检任务名称重复，请重新输入！";
            callback(result);
            return;
        }
        var task_name = data.TASK_NAME;
        delete data.TASK_NAME;
        var doc = {
            _id: UUID.generateUuid(),
            TASK_NAME : task_name,
            account: session.user.account,
            query : data,
            time : dateTimeUtil.getDateFormat(new Date()),
            hide:true
        }
        mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).insert(doc, function(err){
            if(err) {
                logger.app.error(err);
                result.message = "创建任务失败！";
                callback(result);
                return;
            }
            var condition = packData(doc);
            var findAgent = {
                account: session.user.account
            }
            var choosAgents = [];
            var choosConnectType = [];
            var choosQueue = [];
            if (condition.CONNECT_TYPE) {
                if (condition.CONNECT_TYPE.indexOf(",") != -1 ) {
                    choosConnectType = condition.CONNECT_TYPE.split(",");
                } else {
                    choosConnectType = [condition.CONNECT_TYPE];
                }
                condition.CONNECT_TYPE = {"$in":choosConnectType}
            }
            if (condition.ERROR_MEMO) {
                if (condition.ERROR_MEMO.indexOf(",") != -1 ) {
                    choosQueue = condition.ERROR_MEMO.split(",");
                } else {
                    choosQueue = [condition.ERROR_MEMO];
                }
                condition.ERROR_MEMO = {"$in":choosQueue}
            }
            if (doc.query.selectedAgentList) {
                if (doc.query.includeSubordinate) {
                    if (doc.query.selectedAgentList.indexOf(",") != -1 ) {
                        var list = doc.query.selectedAgentList.split(",");
                        var selectedAgents = doc.query.selectedAgentList.split(",");
                    } else {
                        var list = [doc.query.selectedAgentList];
                        var selectedAgents =  [doc.query.selectedAgentList];
                    }
                    userHandler.queryUser(findAgent, session, function(userRes){
                        var agentList = userRes.list;
                        for(var i=0 ;i< selectedAgents.length;i++){
                            var agent_id = selectedAgents[i];
                            utils.getLowUserArrayByParentId(agent_id,agentList,list);
                        }
                        for (var i =0; i<list.length;i++) {
                            if (!choosAgents.contains(list[i])){
                                choosAgents.push(list[i]);
                            }
                        }
                        condition.DISPOSAL_AGENT = {"$in":choosAgents};
                        exports.getTaskData(condition,session,callback,doc, choosAgents);
                    });
                } else {
                    if (doc.query.selectedAgentList.indexOf(",") != -1 ) {
                        choosAgents = doc.query.selectedAgentList.split(",");
                    } else {
                        choosAgents = [doc.query.selectedAgentList];
                    }
                    condition.DISPOSAL_AGENT = {"$in":choosAgents};
                    exports.getTaskData(condition,session,callback,doc, choosAgents);
                }
            } else {
                userHandler.queryUser(findAgent, session, function(userRes){
                    var agentList = userRes.list;
                    for (var i =0; i < agentList.length; i++) {
                        choosAgents.push(agentList[i]._id);
                    }
                    condition.DISPOSAL_AGENT = {"$in":choosAgents};
                    exports.getTaskData(condition,session,callback,doc, choosAgents);
                });
            }

        });
    });
}
exports.getTaskData = function (condition, session, callback, doc, choosAgents) {
    var result = { success: false};
    var data = doc.query;
        if (data.sample_selection_rule) {
            var resultList = [];
            var docArray = [];
            if (data.sample_selection_rule == "per_num" && data.count) {
                //按人均条数抽取
                exports.gateCallDatePerNum(condition,choosAgents,data.count, session,docArray,function (result){
                    if(!result.success){
                        callback(result);
                        return;
                    }
                    resultList = result.data;
                    if (resultList.length == 0) {
                        result.success = true;
                        result.count = 0;
                        result.list = [];
                        result.task = doc;
                        callback(result);
                        return;
                    }
                    exports.updateCallSign(resultList, data.QA_SPECIALIST, session, doc, function (result) {
                        if(!result.success){
                            callback(result);
                        }
                        exports.selectedCallRecord(doc._id, session, callback);
                    });
                });
            } else if (data.sample_selection_rule == "entirety_num" && data.count) {
                //整体条数
                exports.gateCallDateEntiretyNum(condition,data.count,session,docArray,function (result){
                    if(!result.success){
                        callback(result);
                        return;
                    }
                    resultList = result.data;
                    if (resultList.length == 0) {
                        result.success = true;
                        result.count = 0;
                        result.list = [];
                        result.task = doc;
                        callback(result);
                        return;
                    }
                    exports.updateCallSign(resultList, data.QA_SPECIALIST, session, doc, function (result) {
                        if(!result.success){
                            callback(result);
                        }
                        exports.selectedCallRecord(doc._id, session, callback);
                    });
                });
            } else if (data.sample_selection_rule == "per_percent" && data.percent) {
                //人均百分比
                mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(condition).count(function (err, docCount) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = 'Query data failure';
                        callback(result);
                        return;
                    }
                    var count = Math.ceil(data.percent.substr(0,data.percent.length-1)*docCount/100)?Math.ceil(data.percent.substr(0,data.percent.length-1)*docCount/100):0;
                    exports.gateCallDatePerNum(condition,choosAgents,count, session,docArray,function (result){
                        if(!result.success){
                            callback(result);
                            return;
                        }
                        resultList = result.data;
                        if (resultList.length == 0) {
                            result.success = true;
                            result.count = 0;
                            result.list = [];
                            result.task = doc;
                            callback(result);
                            return;
                        }
                        exports.updateCallSign(resultList, data.QA_SPECIALIST, session, doc, function (result) {
                            if(!result.success){
                                callback(result);
                            }
                            exports.selectedCallRecord(doc._id, session, callback);
                        });
                    });
                });
            } else if (data.sample_selection_rule == "entirety_percent" && data.percent) {
                //整体百分比
                mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(condition).count(function (err, docCount) {
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = 'Query data failure';
                        callback(result);
                        return;
                    }
                    var count = Math.ceil(data.percent.substr(0,data.percent.length-1)*docCount/100)?Math.ceil(data.percent.substr(0,data.percent.length-1)*docCount/100):0;
                    exports.gateCallDateEntiretyNum(condition,count,session,docArray,function (result){
                        if(!result.success){
                            callback(result);
                            return;
                        }
                        resultList = result.data;
                        if (resultList.length == 0) {
                            result.success = true;
                            result.count = 0;
                            result.list = [];
                            result.task = doc;
                            callback(result);
                            return;
                        }
                        exports.updateCallSign(resultList, data.QA_SPECIALIST, session, doc, function (result) {
                            if(!result.success){
                                callback(result);
                            }
                            exports.selectedCallRecord(doc._id, session, callback);
                        });
                    });
                });
            }
        }
}
exports.gateCallDatePerNum = function  (condition,choosAgents,count, session,docArray,callback) {
    var result = { success: false};
    condition.DISPOSAL_AGENT = choosAgents.shift();
    mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(condition, {_id:1}).toArray(function (err, doc) {
        if (err) {
            logger.app.error(err.stack);
            result.message = 'Query data failure';
            callback(result);
            return;
        }
        var subscriptList = [];
        if (doc.length > 0 && doc.length > count) {
            extract(count,doc,subscriptList);
            for(var i=0;i<subscriptList.length;i++){
                var random = subscriptList[i];
                docArray.push(doc[random]._id);
            }
        } else if (doc.length > 0 && doc.length < count) {
            for (var j =0; j < doc.length; j++) {
                docArray.push(doc[j]._id);
            }
        }

        if (choosAgents.length >0) {
            exports.gateCallDatePerNum(condition,choosAgents,count, session,docArray,callback);
        } else {
            result.success = true;
            result.data = docArray;
            callback(result);
        }
    });
}
exports.gateCallDateEntiretyNum = function (condition,count,session,docArray,callback) {
    var result = { success: false};
    mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(condition, {_id:1}).toArray(function (err, doc) {
        if (err) {
            logger.app.error(err.stack);
            result.message = 'Query data failure';
            callback(result);
            return;
        }
        var subscriptList = [];
        if (doc.length > 0 && doc.length > count) {
            extract(count,doc,subscriptList);
            for(var i=0;i<subscriptList.length;i++){
                var random = subscriptList[i];
                docArray.push(doc[random]._id);
            }
        } else if (doc.length > 0 && doc.length < count) {
            for (var j =0; j < doc.length; j++) {
                docArray.push(doc[j]._id);
            }
        }
        result.success = true;
        result.data = docArray;
        callback(result);
    });
}
exports.updateCallSign = function (idList, qaAngent, session, doc, callback) {
    var result = {success : false};
    var query = {_id : {$in:idList}};
    var taskId = doc._id;
    mongo.db(session).collection(session.account.account + '_c5_call_sheet').update(query,{$addToSet:{QA_SPECIALIST:qaAngent,TASK_ID:taskId}},{multi: true} , function(err){
        if (err) {
            logger.app.error(err.stack);
            result.message = 'Update call sheet push Sign failure: ' +qaAngent+" : " + JSON.stringify(err);
            callback(result);
            return;
        }
        mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).update({_id : taskId},{$set:{WAIT_MONITORING:idList.length,ALREADY_MONITORING:0,REPLACEMENT:0}}, function(err){
            if (err) {
                logger.app.error(err.stack);
                callback(result);
                return;
            }
            result.success = true;
            callback(result);
        });
    });
}
exports.selectedCallRecord = function (data, session, callback) {
    var result = {success : false};
    var sort = {OFFERING_TIME: -1};
    var query = {};
    var begin = 0;
    var pageSize = 10;
    if (data.page) {
        begin = (data.page - 1) * pageSize;
        query = {TASK_ID : data.taskTemplate,QUALITY_GRADE : null};
    } else {
        query = {TASK_ID : data};
    }
    mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).findOne({_id : query.TASK_ID},function(err,doc){
        if(err) {
            callback(result);
            return;
        }

        mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query, {sort:sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query, {sort:sort}).count(function (err, docCount) {
                var ids = '';
                if (docCount > 0) {
                    for (var i = 0; i < docs.length; i++) {
                        docs[i].TASK_ID = doc.TASK_NAME;
                        ids+=docs[i]._id+",";
                    }
                    ids = ids.substr(0,ids.length-1);
                }
                result.success = true;
                result.list = docs;
                result.count = docCount;
                result.task = doc;
                result.countAll = doc.query.count;
                result.randomTemplate = doc.TASK_TEMPLATE;
                result.selectedId = ids;
                callback(result);
            });
        });
    });
}
exports.selectedMorrCallRecord = function (data, session, callback) {
    var result = {success : false};
    var sort = {OFFERING_TIME: -1};
    var query = {
        TASK_ID : data.task_id,
        QUALITY_GRADE:null,
        OFFERING_TIME : data.OFFERING_TIME
    };
    var begin = 0;
    var pageSize = 10;
    mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).findOne({TASK_NAME : query.TASK_ID},function(err,doc){
        if(err) {
            callback(result);
            return;
        }
        delete query.TASK_ID;
        query.TASK_ID = doc._id;
        mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query, {sort:sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            callback(result);
        });
    });
}
exports.queryAllConditionData = function(data, session, callback) {
    var query = {randomTmp : data.randomTemplate};
    var result = {success : false};
    var idList = [];
    if (data.idList && data.idList.length > 0) {
        exports.updateCallRandom(query,data,session,callback);
    } else {
        mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query,{_id : 1}).toArray(function(err,docArray){
            if(err) {
                callback(result);
                return;
            }
            for (var i =0; i < docArray.length; i++) {
                idList.push(docArray[i]._id)
            }
            data.idList = idList;
            exports.updateCallRandom(query,data,session,callback);
        });
    }
}
exports.updateCallRandom = function (query,data,session,callback) {
    var result = {success : false};
    var sort = {OFFERING_TIME: -1};
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).findOne({_id:query.randomTmp},function (err, doc) {
        if(err) {
            callback(result);
            return;
        }
        var query = formatCondition(doc.query);
        mongo.db(session).collection(session.account.account + '_c5_call_sheet').findOne({_id:data.callId},function(err,call){
            if(err) {
                callback(result);
                return;
            }
            query.DISPOSAL_AGENT = call.DISPOSAL_AGENT;
            query._id = {$nin:data.idList};
            if (query.CONNECT_TYPE && query.CONNECT_TYPE.indexOf(",") != -1) {
                var type = query.CONNECT_TYPE.split(",");
                query.CONNECT_TYPE = {$in:type}
            } else if (typeof query.CONNECT_TYPE == "object") {
                query.CONNECT_TYPE = {$in:query.CONNECT_TYPE}
            }
            if (query.ERROR_MEMO && query.ERROR_MEMO.indexOf(",") != -1) {
                var type = query.ERROR_MEMO.split(",");
                query.ERROR_MEMO = {$in:type}
            }else if (typeof query.ERROR_MEMO == "object") {
                query.ERROR_MEMO = {$in:query.ERROR_MEMO}
            }
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query,{sort : sort}).limit(10).skip(0).toArray(function(err,docArray){
                if(err) {
                    callback(result);
                    return;
                }
                if (docArray.length > 0) {
                    mongo.db(session).collection(session.account.account + '_c5_call_sheet').update({_id:data.callId},{$pull:{randomTmp:doc._id}},{multi: true} , function(err){
                        if(err) {
                            callback(result);
                            return;
                        }
                        mongo.db(session).collection(session.account.account + '_c5_call_sheet').update(docArray[0],{$addToSet:{randomTmp:doc._id}},{multi: true} , function(err){
                            if(err) {
                                callback(result);
                                return;
                            }
                            result.success = true;
                            result.idList = data.idList;
                            result.selectedId = docArray[0]._id;
                            callback(result);
                        });
                    });
                } else {
                    result.success = true;
                    result.idList = data.idList;
                    result.selectedId = '';
                    callback(result);
                }
            });
        });
    });
}

exports.replacementRecord = function (data, session, callback) {
    var query = {_id : data._id};
    var result = {success : false};
    mongo.db(session).collection(session.account.account + '_c5_call_sheet').findOne(query,function(err,docOne){
        if(err) {
            callback(result);
            return;
        }
        if (docOne.TASK_ID) {
            mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).findOne({_id : docOne.TASK_ID[0]},function(err,doc){
                if(err) {
                    callback(result);
                    return;
                }
                var condition = packData(doc);
                if (data.selectedId) {
                    var idArray = data.selectedId.split(",");
                    condition._id = {$nin:idArray};
                }
                condition.DISPOSAL_AGENT = docOne.DISPOSAL_AGENT;
                if (condition.CONNECT_TYPE && condition.CONNECT_TYPE.indexOf(",") != -1) {
                    var type = condition.CONNECT_TYPE.split(",");
                    condition.CONNECT_TYPE = {$in:type}
                }
                if (condition.ERROR_MEMO && condition.ERROR_MEMO.indexOf(",") != -1) {
                    var type = condition.ERROR_MEMO.split(",");
                    condition.ERROR_MEMO = {$in:type}
                }
                mongo.db(session).collection(session.account.account + '_c5_call_sheet').
                    find(condition, {_id:1}).limit(10).skip(0).toArray(function (err, docArray) {
                    if(err) {
                        callback(result);
                        return;
                    }
                    var callIds = [];
                    if (docArray.length > 0) {
                        for (var i = 0; i < docArray.length; i++) {
                            callIds.push(docArray[i]._id);
                        }
                    }
                    if (callIds && callIds.length > 0) {
                        mongo.db(session).collection(session.account.account + '_c5_call_sheet').update({_id : data._id},{$unset:{"TASK_ID" : 0,"QA_SPECIALIST" : 0}}, function (err){
                            if(err) {
                                callback(result);
                                return;
                            }
                            mongo.db(session).collection(session.account.account + '_c5_call_sheet').update({_id : callIds[0]},{$addToSet:{QA_SPECIALIST:doc.query.QA_SPECIALIST,TASK_ID:doc._id}}, function(err){
                                if(err) {
                                    callback(result);
                                    return;
                                }
                                var replacement = doc.REPLACEMENT +1;
                                mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).update({_id : doc._id},
                                    { $set:{ REPLACEMENT:replacement}},{multi: true},function(err){
                                        if(err) {
                                            logger.app.error(err);
                                            callback(result);
                                            return;
                                        }
                                        result.success = true;
                                        result.callId = callIds[0];
                                        callback(result);
                                    });
                            });
                        });
                    } else {
                        result.success = true;
                        result.callId = '';
                        callback(result);
                    }
                });
            });
        }
    });
}
function extract (randomNum, docs, randomArr) {
    var getRandomArray = function(num,max){
        var whileFlag = true;
        while(whileFlag){
            var rNum = utils.getRandomNum(0,max);
            var repeatFlag = false;
            for(var i=0;i<randomArr.length;i++){
                if(rNum == randomArr[i]){
                    repeatFlag = true;
                    break;
                }
            }
            if(!repeatFlag){
                randomArr.push(rNum);
            }
            if(randomArr.length == num){
                whileFlag = false;
            }
        }
    };
    getRandomArray(randomNum,docs.length-1);
}
exports.getQualityTaskTemplates = function(data, session, callback){
    var result = { success: false};
    var sort = {time: -1};
    var query = {
        account:session.user.account,
        hide :true
    }

    mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).find(query,{sort:sort}).toArray(function(err,doc){
        if(err) {
            callback(result);
            return;
        }
        if(doc){
            result.success = true;
            result.list = doc;
            callback(result);
        }else{
            callback(result);
        }
    });
}
exports.agentRanking = function (data, session,callback){
    var result = {success: false};
    var findAgent = {
        account: session.user.account
    }
    userHandler.queryUser(findAgent, session, function(userRes) {
        if (!userRes.success) {
            callback(result);
            return;
        }
        result.agents = userRes.list;
        var agents = [];
        if (!data.RANKING_AGENT || data.RANKING_AGENT.length == 0) {
            data.RANKING_AGENT = [];
            if (session.user.type == "admin" || session.user.scope.qc == 'all') {
                var agents = userRes.list;
                for(var i= 0,len = agents.length;i<len;i++){
                    data.RANKING_AGENT.push(agents[i]._id);
                }
            } else {
                data.RANKING_AGENT = session.user._id;
                utils.getLowUserArrayByParentId(data.RANKING_AGENT, result.agents, agents);
                data.RANKING_AGENT=agents.concat(data.RANKING_AGENT);
                var n = {},r=[];
                for(var j = 0,lens=data.RANKING_AGENT.length; j < lens; j++)
                {
                    if (!n[data.RANKING_AGENT[j]])
                    {
                        n[data.RANKING_AGENT[j]] = true;
                        r.push(data.RANKING_AGENT[j]);
                    }
                }
                data.RANKING_AGENT = r;
            }
        } else if (data.includeSubordinate) {
            var agentList = userRes.list;
            for (var i = 0, len = data.RANKING_AGENT.length; i < len; i++) {
                utils.getLowUserArrayByParentId(data.RANKING_AGENT[i], agentList, agents);
            }
            data.RANKING_AGENT = agents.concat(data.RANKING_AGENT);
            var n = {}, r = [];
            for (var j = 0, lens = data.RANKING_AGENT.length; j < lens; j++) {
                if (!n[data.RANKING_AGENT[j]]) {
                    n[data.RANKING_AGENT[j]] = true;
                    r.push(data.RANKING_AGENT[j]);
                }
            }
            data.RANKING_AGENT = r;
        }
        var queryQualityCheckConfigData = {
            account: session.user.account,
            _id: data.TEMPLATE
        }
        qualityCheckHandler.queryQualityCheckConfigOneConfig(queryQualityCheckConfigData, session, function (queryConfigRes) {
            if (!queryConfigRes.success) {
                callback(queryConfigRes);
                return;
            }
            var rankingquery={
                ACCOUNT:session.user.account,
                TEMPLATE: data.TEMPLATE,
            };
            //if(data.RANKING_AGENT)rankingquery.DISPOSAL_AGENT = data.RANKING_AGENT;
            var templ_type = queryConfigRes.type;
            if (templ_type) {
                var keys = {DISPOSAL_AGENT: 1}
                var initial = {all: 0, all_count: 0, all_cent: 0};
                //聚合函数
                var reduce = function (curr, result) {
                    result['all_count']++;
                    if (curr.GRADE_AMOUNT['amount'] == 'yes' || curr.GRADE_AMOUNT['amount'] == 'dont') {
                        result['all']++;
                    }
                }
                //完成器函数
                var finalize = function (result) {
                    result['all_cent'] = (Math.round(result['all'] / result['all_count'] * 100) / 1) + '%';
                }
                //质检权限控制
                //if (!rankingquery.DISPOSAL_AGENT) {
                //    if (session.user.lowUsers) {
                //        rankingquery.DISPOSAL_AGENT = {$in: session.user.lowUsers};
                //        if (session.user.lowUsers.length < 1) {
                //            delete rankingquery.DISPOSAL_AGENT;
                //        }
                //    }
                //}
                mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).group(keys, rankingquery, initial, reduce, finalize, {}, {}, function (err, docs) {
                    if (err) {
                        logger.app.error(err.stack);
                        callback(result);
                        return;
                    }
                    result.type = "pass";
                    result.success = true;
                    result.list = docs;
                    result.agentlist = data.RANKING_AGENT;
                    callback(result);
                });
            } else {
                var keys = {DISPOSAL_AGENT: 1}
                var initial = {all: 0, all_count: 0, all_cent: 0};
                //聚合函数
                var reduce = function (curr, result) {
                    result['all_count'] += curr.GRADE_AMOUNT;
                    result['all']++;
                }
                //完成器函数
                var finalize = function (result) {
                    result['all_cent'] = Math.round(result['all_count'] * 10 / result['all']) / 10;
                }
                //质检权限控制
                //if (!rankingquery.DISPOSAL_AGENT) {
                //    if (session.user.lowUsers) {
                //        rankingquery.DISPOSAL_AGENT = {$in: session.user.lowUsers};
                //        if (session.user.lowUsers.length < 1) {
                //            delete rankingquery.DISPOSAL_AGENT;
                //        }
                //    }
                //}
                mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).group(keys, rankingquery, initial, reduce, finalize, {}, {}, function (err, docs) {
                    if (err) {
                        logger.app.error(err.stack);
                        callback(result);
                        return;
                    }
                    result.type = "normal";
                    result.success = true;
                    result.list = docs;
                    result.agentlist = data.RANKING_AGENT;
                    callback(result);
                });
            }
        });
    });
}
exports.getQualityTaskTemplateList = function (data, session, callback) {
    var result = { success: false};
    var sort = {time: -1};
    var querys = {};
    var begin = 0;
    var pageSize = 10;
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    if (data.cid == "quality_task_monitor") {
        querys = {
            account:session.user.account
        }
    } else {
        if (data.BEGIN_TIME || data.END_TIME) {
            querys.time = {};
            if(data.BEGIN_TIME){
                querys.time["$gte"] = data.BEGIN_TIME;
                delete data.BEGIN_TIME;
            }
            if(data.END_TIME){
                querys.time["$lte"] = data.END_TIME;
                delete data.END_TIME;
            }
        }
        if (data.QA_SPECIALIST) {
            querys['query.QA_SPECIALIST'] = data.QA_SPECIALIST;
        }
        if (data.hide) {
            querys.hide = data.hide == "true" ? true : false;
        }
        querys.account = session.user.account
    }
    mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).find(querys,{sort:sort}).limit(pageSize).skip(begin).toArray(function(err,doc){
        if(err) {
            callback(result);
            return;
        }
        mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).find(querys,{sort:sort}).count(function (err, docCount) {
            if(err) {
                callback(result);
                return;
            }
            if(doc){
                result.success = true;
                result.list = doc;
                result.count=docCount;
                callback(result);
            }else{
                callback(result);
            }
        });
    });
}
exports.getRandomTemplate = function(data, session, callback){
    var result = { success: false};
    var sort = {time: -1};
    var query = {
        account:session.user.account
    }

    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).find(query,{sort:sort}).toArray(function(err,doc){
        if(err) {
            callback(result);
            return;
        }
        if(doc){
            result.success = true;
            result.list = doc;
            callback(result);
        }else{
            callback(result);
        }
    });
}
exports.addRandomTemplate = function(data, session, callback){
    data.STATUS = 'dealing';
    data.QUALITY_GRADE = null;
    exports.saveRandomTemplate(data,session,'add',callback);
}
exports.removeRandomTemplate = function(data, session, callback){
    var result = { success: false};
    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).remove({_id:data.randomTemplate},function (err) {
        if(!err){
            result.success = true;
            callback(result);
        } else {
            logger.app.error(err);
            callback(result);
        }
    });
}
exports.removeTaskTemplate = function (data, session, callback) {
    var result = { success: false};
    mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).update({_id : data.taskTemplate},{$set:{hide:false}},function (err, doc) {
        if(err){
            logger.app.error(err);
            callback(result);
        }
        var query = {
            TASK_ID : data.taskTemplate,
            QUALITY_GRADE:null
        };
        var sort = {OFFERING_TIME: -1};
        mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query, {sort:sort}).toArray(function (err, docs) {
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            var idList = [];
            for (var i =0; i < docs.length; i++) {
                idList.push(docs[i]._id);
            }
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').update({_id : {$in:idList}},{$unset:{"TASK_ID" : 0,"QA_SPECIALIST" : 0, "QUALITY_GRADE" : 0}},{multi: true}, function (err){
                if(err){
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                result.success = true;
                callback(result);
            });
        });
    });

}
exports.updateSign = function(randomTemplate, randomIdList,session, callback) {
    var result = { success: false};

    var query = {_id:{$in:randomIdList}};

    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).update({_id:randomTemplate},{$set:{randomNum:randomIdList.length}},{multi: true},function(err){
        if (err) {
            logger.app.error(err.stack);
            result.message = 'Update call sheet update randomTemplate failure: ' +randomTemplate+" : " + JSON.stringify(data);
            callback(result);
            return;
        }
        mongo.db(session).collection(session.account.account + '_c5_call_sheet').update({randomTmp:randomTemplate},{$pull:{randomTmp:randomTemplate}},{multi: true} , function(err){
            if (err) {
                logger.app.error(err.stack);
                result.message = 'Update call sheet pull Sign failure: ' +randomTemplate+" : " + JSON.stringify(data);
                callback(result);
                return;
            }
            mongo.db(session).collection(session.account.account + '_c5_call_sheet').update(query,{$addToSet:{randomTmp:randomTemplate}},{multi: true} , function(err){
                if (err) {
                    logger.app.error(err.stack);
                    result.message = 'Update call sheet push Sign failure: ' +randomTemplate+" : " + JSON.stringify(data);
                    callback(result);
                    return;
                }
                result.success = true;
                callback(result);
            });
        });
    });
}

exports.queryCallSheetRandomBySign = function(data,pageSizeData,page,randomTemplate, session, callback,template){
    var result = { success: false};
    var sort = {OFFERING_TIME: -1};
    var begin = 0;
    var pageSize = 10;
    if(pageSizeData){//
        pageSize = parseInt(pageSizeData);
    }
    if (page) {
        begin = (page - 1) * pageSize;
    }

    mongo.db().collection(fields.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE).findOne({_id:randomTemplate},function(err,doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        var query = {
            randomTmp:randomTemplate,
            QUALITY_GRADE:null,
            TASK_ID :null
        };
        if(data.OFFERING_TIME){
            query.OFFERING_TIME = data.OFFERING_TIME;
        }

        if(!doc || !doc.randomNum || (doc.randomNum && doc.randomNum == 0)){
            result.success = true;
            result.countAll = 0;
            result.list = [];
            result.randomTemplate = randomTemplate;
            callback(result);
            return;
        }

        mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query, {sort:sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            if(query.DISPOSAL_AGENT && typeof query.DISPOSAL_AGENT !='string' && query.DISPOSAL_AGENT['$in'].length > 5){
                var endCount = 0;
                exports.recurCount(query, sort, endCount, session, function(res){
                    if(!res.success){
                        callback(result);
                        return;
                    }else{
                        result.success = true;
                        result.list = docs;
                        result.count = res.endCount;
                        result.countAll = doc.randomNum;
                        result.condition = template;
                        result.randomTemplate = randomTemplate;
                        callback(result);
                    }
                });
            }else{
                mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(query, {sort:sort}).count(function (err, docCount) {
                    if (err) {
                        logger.app.error(err);
                        callback(result);
                        return;
                    }
                    result.success = true;
                    result.list = docs;
                    result.count = docCount;
                    result.countAll = doc.randomNum;
                    result.condition = template;
                    result.randomTemplate = randomTemplate;
                    callback(result);
                });
            }
        });
    });

}
exports.updateCallGrade = function (data, session, callback) {
    var result = {success: false};
    data = data.GRADE_DATA;
    var callShellData = {
        GRADE_COMMENTS : data.COMMENTS
    };
    if (data.type == "grade") {
        callShellData.QUALITY_GRADE = data.GRADE_AMOUNT;
        var updater = data;
    } else {
        callShellData.QUALITY_GRADE = data.GRADE_AMOUNT.amount;
        var updater = {
            COMMENTS : data.COMMENTS,
            GRADE_AMOUNT : data.GRADE_AMOUNT
        }
    }
    /*Thenjs(function(cont){
     mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).update({CALL_SHEET_ID:data._id},{'$set':callShellData}, {w:1} ,cont);
     }).then(function(cont){
     mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).update({_id: data._id}, {'$set':updater},{w:1},function (err){});
     result = true;
     callback(result);
     }).fail(function(cont, err){
     logger.app.error(err);
     callback(result);
     });*/

    mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).update({CALL_SHEET_ID:data._id},
        {'$set':callShellData}, {w:1} , function(err){
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).findOne({_id: data._id},function(err,docs) {
                if(err) {
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                if (data.type != "grade") {
                    docs.qc_type = "repeat";
                    appEvent.qualityGradeIncident(docs,session);
                }
                mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).update({_id: data._id}, {'$set':updater},{w:1}, function(err){
                    if(err) {
                        logger.app.error(err);
                        callback(result);
                        return;
                    }
                    mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).findOne({_id: data._id},function(err,doc) {
                        if(err) {
                            logger.app.error(err);
                            callback(result);
                            return;
                        }
                        if (data.type != "grade") {
                            appEvent.qualityGradeIncident(doc,session);
                        }
                        result.success = true;
                        callback(result);
                    });
                });
            });

        });

}
exports.saveCallShellGrade = function (data, session, callback) {
    var result = {success: false};
    if(data.CALL_SHEET_ID) {
        var callShellData = {QUALITY_GRADE : data.GRADE_DATA.GRADE_AMOUNT.amount};
        if(data.COMMENTS){
            callShellData.GRADE_COMMENTS = data.COMMENTS;
        }
        mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).findOne({_id:data.CALL_SHEET_ID},function (err, call) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).update({CALL_SHEET_ID:data.CALL_SHEET_ID},
                {'$set':callShellData}, {w:1} , function(err){
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = 'Update call sheet grade failure: ' + JSON.stringify(data);
                        callback(result);
                        return;
                    }
                    var gradeData = data.GRADE_DATA;
                    gradeData.ACCOUNT = session.user.account;
                    gradeData.COMMENTS = data.COMMENTS;
                    gradeData.GRADE_TIME = dateTimeUtil.getCurrentDateTime();
                    if (call.TASK_ID) {
                        gradeData.TASK_ID = call.TASK_ID[0];
                        gradeData.GRADE_USER = call.QA_SPECIALIST[0];
                    } else {
                        gradeData.GRADE_USER = session.user._id;
                    }
                    mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).update({_id: data.CALL_SHEET_ID},gradeData,{upsert:true}, function(err){
                        if(err) {
                            logger.app.error(err);
                            result.message = 'Update call sheet grade data failure: ' + JSON.stringify(gradeData);
                            callback(result);
                            return;
                        }
                        appEvent.qualityGradeIncident(gradeData,session);
                        if (call.TASK_ID) {
                            mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).findOne({_id : call.TASK_ID[0]},function(err,doc){
                                if(err) {
                                    logger.app.error(err);
                                    callback(result);
                                    return;
                                }
                                var alreadyNum = doc.ALREADY_MONITORING +1;
                                var waitNum = doc.WAIT_MONITORING -1;
                                mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).update({_id : call.TASK_ID[0]},
                                    { $set:{ ALREADY_MONITORING:alreadyNum,WAIT_MONITORING:waitNum}},{multi: true},function(err){
                                        if(err) {
                                            logger.app.error(err);
                                            callback(result);
                                            return;
                                        }
                                        result.success = true;
                                        callback(result);
                                    });
                            });
                        } else {
                            result.success = true;
                            callback(result);
                        }

                    });
                });
        });
    }else {
        result.message = "Call sheet not found";
        logger.app.error(result.message);
        callback(result);
    }
}

exports.saveCallSheetGrade = function(data, session, callback) {
    var result = {success: false};
    if(data.CALL_SHEET_ID) {
        var callSheetData = {
            QUALITY_GRADE:Math.round(data.QUALITY_GRADE*100)/100
        }
        if(data.COMMENTS){
            callSheetData.GRADE_COMMENTS = data.COMMENTS;
        }
        mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).findOne({CALL_SHEET_ID:data.CALL_SHEET_ID},function (err, call) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).update({CALL_SHEET_ID:data.CALL_SHEET_ID},
                {'$set':callSheetData}, {w:1} , function(err){
                    if (err) {
                        logger.app.error(err.stack);
                        result.message = 'Update call sheet grade failure: ' + JSON.stringify(data);
                        callback(result);
                        return;
                    }

                    var gradeData = data.GRADE_DATA;
                    gradeData.ACCOUNT = session.user.account;
                    gradeData.GRADE_TIME = dateTimeUtil.getCurrentDateTime();
                    if (call.TASK_ID) {
                        gradeData.TASK_ID = call.TASK_ID[0];
                        gradeData.GRADE_USER = call.QA_SPECIALIST[0];
                    } else {
                        gradeData.GRADE_USER = session.user._id;
                    }
                    mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).update({_id: data.CALL_SHEET_ID},gradeData,{upsert:true}, function(err){
                        if(err) {
                            logger.app.error(err);
                            result.message = 'Update call sheet grade data failure: ' + JSON.stringify(gradeData);
                            callback(result);
                            return;
                        }
                        if (call.TASK_ID) {
                            mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).findOne({_id : call.TASK_ID[0]},function(err,doc){
                                if(err) {
                                    logger.app.error(err);
                                    callback(result);
                                    return;
                                }
                                var alreadyNum = doc.ALREADY_MONITORING +1;
                                var waitNum = doc.WAIT_MONITORING -1;
                                mongo.db().collection(fields.DB_MANAGER_QUALITY_TASK_TEMPLATE).update({_id : call.TASK_ID[0]},
                                    { $set:{ ALREADY_MONITORING:alreadyNum,WAIT_MONITORING:waitNum}},{multi: true},function(err){
                                        if(err) {
                                            logger.app.error(err);
                                            callback(result);
                                            return;
                                        }
                                        result.success = true;
                                        callback(result);
                                    });
                            });
                        } else {
                            result.success = true;
                            callback(result);
                        }
                    });
                });
        });

    } else {
        result.message = "Call sheet not found: " + nodeUtil.inspect(data);
        logger.app.error(result.message);
        callback(result);
    }
}

exports.recordListenLog = function(data, session, callback) {
    var result = {success: false};
    if(data.CALL_SHEET_ID) {
        var doc = {
            CALL_SHEET_ID : data.CALL_SHEET_ID,
            account: session.user.account,
            userId : session.user._id,
            time : dateTimeUtil.getDateFormat(new Date())
        }
        mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK_LISTEN_LOG).insert(doc, function(err){
            if(err) {
                callback(result);
                return;
            }
            result.success = true;
            callback(result);
        });
    }else{
        callback(result);
    }
}

exports.queryListenLog = function(data, session, callback) {
    var result = { success: false};
    var sort = {time: -1};
    var begin = 0;
    var pageSize = 10;
    if(data.pageSize){
        pageSize = parseInt(data.pageSize);
    }
    var data = formatCondition(data);
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    delete data.page;
    delete data.pageSize;

    mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK_LISTEN_LOG).find(data, {sort:sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK_LISTEN_LOG).count(data, function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            result.count = docCount;
            callback(result);
        });
    });
}

exports.queryCallSheetGradeList = function(data, session, callback){
    var result = {success:false};
    var sort = {GRADE_TIME : -1};
    var begin = 0;
    var pageSize = 10;
    if(data.pageSize) {
        pageSize = parseInt(data.pageSize);
        delete data.pageSize;
    }
    if(data.page){
        begin = (data.page-1)*pageSize;
        delete data.page;
    }
    data = formatCondition(data);
    data.ACCOUNT = session.user.account;
    var findAgent = {
        account: session.user.account
    }
    userHandler.queryUser(findAgent, session, function(userRes){
        if(!userRes.success){
            callback(result);
            return;
        }
        result.agents = userRes.list;
        var agents = [];
        if(!data.DISPOSAL_AGENT||data.DISPOSAL_AGENT.length==0){
            data.DISPOSAL_AGENT=[];
            if(session.user.type == "admin" || session.user.scope.qc == 'all'){
                delete data.DISPOSAL_AGENT;
            }else{
                data.DISPOSAL_AGENT = session.user._id;
                utils.getLowUserArrayByParentId(data.DISPOSAL_AGENT, result.agents, agents);
                data.DISPOSAL_AGENT=agents.concat(data.DISPOSAL_AGENT);
                var n = {},r=[];
                for(var j = 0,lens=data.DISPOSAL_AGENT.length; j < lens; j++)
                {
                    if (!n[data.DISPOSAL_AGENT[j]])
                    {
                        n[data.DISPOSAL_AGENT[j]] = true;
                        r.push(data.DISPOSAL_AGENT[j]);
                    }
                }
                data.DISPOSAL_AGENT = r;
            }
        }else if (data.includeSubordinate) {
            var agentList = userRes.list;
            for(var i = 0,len=data.DISPOSAL_AGENT.length;i<len;i++){
                utils.getLowUserArrayByParentId(data.DISPOSAL_AGENT[i], agentList, agents);
            }
            data.DISPOSAL_AGENT=agents.concat(data.DISPOSAL_AGENT);
            var n = {},r=[];
            for(var j = 0,lens=data.DISPOSAL_AGENT.length; j < lens; j++)
            {
                if (!n[data.DISPOSAL_AGENT[j]])
                {
                    n[data.DISPOSAL_AGENT[j]] = true;
                    r.push(data.DISPOSAL_AGENT[j]);
                }
            }
            data.DISPOSAL_AGENT = r;
        }
        if(data.DISPOSAL_AGENT)data.DISPOSAL_AGENT = {$in:data.DISPOSAL_AGENT};
        if(data.GRADE_USER)data.GRADE_USER = {$in:data.GRADE_USER};
        if(data.ERROR_MEMO)data.ERROR_MEMO = {$in:data.ERROR_MEMO};
        if(data.CONNECT_TYPE)data.CONNECT_TYPE = {$in:data.CONNECT_TYPE};
        if(data.amount)data['GRADE_AMOUNT.amount'] = data.amount;


        if(data.includeSubordinate){
            delete data.includeSubordinate;
        }
        if(data.amount){
            delete data.amount;
        }
        mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).find(data).sort(sort).limit(pageSize).skip(begin).toArray(function(err,docs){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).find(data).count(function(err,docCount){
                if(err){
                    logger.app.error(err);
                    callback(result);
                    return;
                }
                result.success = true;
                result.list = docs;
                result.count = docCount;
                callback(result);
            });
        });
    });
}

exports.showQualityComments = function(data, session, callback){
    var result = {success:false};
    mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).findOne({_id:data},function(err,doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        result.success = true;
        result.data = doc.COMMENTS;
        callback(result);
    });
}

exports.queryCallSheetGradeResult = function(data, session, callback) {
    var result = {success: false};
    var query ={};
    query.TEMPLATE = data.TEMPLATE;
    if(data.BEGIN_TIME||data.END_TIME){
        query.GRADE_TIME = {};
        if(data.BEGIN_TIME){
            query.GRADE_TIME["$gte"]= data.BEGIN_TIME;
            delete data.BEGIN_TIME;
        }
        if(data.END_TIME){
            query.GRADE_TIME["$lte"]= data.END_TIME;
            delete data.END_TIME;
        }
    }
    if(data.selectedAgent) {
        query.selectedAgent = data.selectedAgent.replace(',', '');
        var agentArr = query.selectedAgent.split(',');
        var agents = [];
        if(agentArr.length > 0) {
            if (data.includeSubordinate) {
                for (var i =0; i<agentArr.length; i++) {
                    var userarr = session.user.allAgents;
                    utils.getLowUserArrayByParentId(agentArr[i],userarr,agents);
                }
            }
            query.DISPOSAL_AGENT = {"$in": agents.concat(agentArr)};
        }
    }

    delete query.selectedAgent;
    var page = 1;
    var pageSize = 10;
    if(data.pageSize) {
        pageSize = parseInt(data.pageSize);
        delete data.pageSize;
    }
    if(data.page){
        page = parseInt(data.page);
        delete data.page;
    }
    query.ACCOUNT = session.user.account;
    var keys ={
        DISPOSAL_AGENT:1
    }
    //初始化累加器,每一个group中会有一个累加器
    var queryQualityCheckConfigData = {
        account: session.user.account,
        _id: data.TEMPLATE
    }
    qualityCheckHandler.queryQualityCheckConfigOneConfig(queryQualityCheckConfigData, session, function(queryConfigRes){
        if(!queryConfigRes.success){
            callback(queryConfigRes);
            return;
        }
        var templ_type = queryConfigRes.type;
        if(!templ_type){
            var options = queryConfigRes.list;
            var initial = {};
            var option = null;
            for(var i= 0,len = options.length;i<len;i++) {
                option = options[i];
                initial[option.order] = 0;
            }
            initial.COUNT = 0;
            //聚合函数
            var reduce = function( curr, result ){
                for(var i= 0,len=20;i<len;i++){
                    if(curr[i]){
                        result[i] += curr[i];
                    }
                }
                result.COUNT++;
            }
            //完成器函数
            var finalize = function(result){
                var amount = 0;

                for(var i= 0,len=20;i<len;i++){
                    if(result[i]){
                        result[i] = Math.round(result[i]/result.COUNT * 10) / 10;
                        amount += result[i];
                    }
                }
                result.AMOUNT = Math.round(amount * 10) / 10;
            }
            //质检权限控制
            if(!query.DISPOSAL_AGENT){
                if(session.user.moduleUsers.call!=fields.data_scope_all){
                    query.DISPOSAL_AGENT = {$in: session.user.moduleUsers.call};
                    if (session.user.moduleUsers.call.length < 1) {
                        delete query.DISPOSAL_AGENT;
                    }
                }
            }

            query.TEMPLATE=data.TEMPLATE;

            mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).group(keys,query,initial,reduce,finalize,{},{},function(err,docs){
                if(err){
                    logger.app.error(err.stack);
                    callback(result);
                    return;
                }

                var begin = (page-1)*pageSize;
                result.list = docs.slice(begin, begin+pageSize);
                //result.list = docs;
                result.count = docs.length;
                result.page = page;
                result.success = true;
                callback(result);
            });
        }else{
            var options = queryConfigRes.list;
            var initial = {all:0,all_count:0,all_cent:0,counts:0,passcount:0};
            var option = null;
            for(var i= 0,len = options.length;i<len;i++) {
                option = options[i];
                initial[option.name] = 0;
                initial[option.name+'_count'] = 0;
                initial[option.name+'_cent'] = 0;

            }
            //聚合函数
            var reduce = function( curr, result ){
                result['all_count']++;
                for(var i= 1,len=20;i<=len;i++){
                    if(curr.GRADE_AMOUNT['config_name_'+i]){
                        result['config_name_'+i+'_count']++;
                        if(curr.GRADE_AMOUNT['config_name_'+i] == 'yes'||curr.GRADE_AMOUNT['config_name_'+i] == 'dont'){
                            result['config_name_'+i]++;
                        }
                    }
                }
                if(curr.GRADE_AMOUNT['amount'] == 'yes'||curr.GRADE_AMOUNT['amount'] == 'dont'){
                    result['all']++;
                }
            }
            //完成器函数
            var finalize = function(result){
                for(var i= 1,len=20;i<=len;i++){
                    if(result['config_name_'+i+'_count']){
                        result['config_name_'+i+'_cent'] = (Math.round(result['config_name_'+i]/result['config_name_'+i+'_count'] * 100)/1) + '%';
                    }
                }
                result['all_cent'] =  (Math.round(result['all']/result['all_count'] * 100)/1) + '%';
            }
            //质检权限控制
            if(!query.DISPOSAL_AGENT){
                if(session.user.moduleUsers.call!=fields.data_scope_all){
                    query.DISPOSAL_AGENT = {$in: session.user.moduleUsers.call};
                    if (session.user.moduleUsers.call.length < 1) {
                        delete query.DISPOSAL_AGENT;
                    }
                }
            }
            query.TEMPLATE=data.TEMPLATE;
            mongo.db().collection(fields.DB_CALL_SHEET_QUALITY_CHECK).group(keys,query,initial,reduce,finalize,{},{},function(err,docs){
                if(err){
                    logger.app.error(err.stack);
                    callback(result);
                    return;
                }

                var begin = (page-1)*pageSize;
                result.list = docs.slice(begin, begin+pageSize);
                //result.list = docs;
                result.count = docs.length;
                result.page = page;
                result.success = true;
                result.type = 'pass';
                callback(result);
            });
        }

    });
}

exports.queryCallSheetLeak = function (data, session, callback) {
    var result = { success: false};
    var sort = {NEW_OFFERING_TIME: -1};
    var begin = 0;
    var pageSize = 10;
    if(data.pageSize){
        pageSize = parseInt(data.pageSize);
    }
    var data = formatCondition(data);
    if(data.OFFERING_TIME){
        data.NEW_OFFERING_TIME = data.OFFERING_TIME;
        delete data.OFFERING_TIME;
    }
    if (data.page) {
        begin = (data.page - 1) * pageSize;
    }
    delete data.page;
    delete data.pageSize;
    delete data.cdrExportType;
    delete data.cdrId;
    data.IS_CALL_BACK = false;
    var dbOptions = {sort:sort};
    if(data['$or']){
        dbOptions.hint = {"NEW_DISPOSAL_AGENT" : 1, "CALLBACK_AGENT" : 1};
    }else{
        //    data['$or'] = [{"NEW_DISPOSAL_AGENT" : {$in:session.user.moduleUsers.call}}, {"CALLBACK_AGENT" : {$in:session.user.moduleUsers.call}}];
        //    if(session.user.isAdmin || session.user.moduleUsers.call.length<1){
        //        delete data['$or'];
        //    }

        if(session.user.moduleUsers.call!=fields.data_scope_all && !session.user.isAdmin){
            if(!data.NEW_DISPOSAL_AGENT && !data.CALLBACK_AGENT){
                data['$or'] = [{"NEW_DISPOSAL_AGENT" : {$in:session.user.moduleUsers.call}}, {"CALLBACK_AGENT" : {$in:session.user.moduleUsers.call}}];
            }else{
                //处理人回访人查询条件
                if(data.NEW_DISPOSAL_AGENT){
                    utils.setUserLevelCondition(data,'NEW_DISPOSAL_AGENT','call',session);
                }
                if(data.CALLBACK_AGENT){
                    utils.setUserLevelCondition(data,'CALLBACK_AGENT','call',session);
                }
            }
        }else{
            if(data.NEW_DISPOSAL_AGENT){
                utils.setUserLevelCondition(data,'NEW_DISPOSAL_AGENT','call',session,true);
            }
            if(data.CALLBACK_AGENT){
                utils.setUserLevelCondition(data,'CALLBACK_AGENT','call',session,true);
            }
        }
    }
    mongo.db(session).collection(session.account.account + fields.DB_CALL_SHEET_LEAK).find(data, dbOptions).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        delete dbOptions.sort;
        mongo.db(session).collection(session.account.account + fields.DB_CALL_SHEET_LEAK).count(data, dbOptions,function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            result.count = docCount;
            callback(result);
        });
    });
}

exports.notDealCallBackAgentChange = function(data,session,callback){
    var result = {success : false};
    var find = {
        _id : data._id
    }
    var updateDoc = {
        "$set":{
            CALLBACK_AGENT : data.CALLBACK_AGENT
        }
    }
    mongo.db(session).collection(session.account.account + fields.DB_CALL_SHEET_LEAK).findOne(find,function(err,resDoc){
        if(err){
            logger.app.error('change callback agent failed!'+err);
            callback(result);
            return;
        }
        if(resDoc != null && resDoc.IS_CALL_BACK){
            result.refuseAssign = true;     //if called, refuseAssignment  add by pansy at 160519
            callback(result);
        }else{
            mongo.db(session).collection(session.account.account + fields.DB_CALL_SHEET_LEAK).update(find,updateDoc,function(err){
                if(err){
                    logger.app.error('change callback agent failed!'+err);
                    callback(result);
                    return;
                }
                result.success = true;
                //when assign somebody CallLeak ,NotifyTo push-server  add by pansy 2016-06-22
                mongo.db().collection('app_push_client').findOne({_id:data.CALLBACK_AGENT}, function(err, doc){
                    if(err){
                        logger.app.error("find CALLBACK_AGENT's push-server failed" + err);
                    }
                    var leakAssignMsg = {
                        userId: data.CALLBACK_AGENT,
                        eventData: {
                            Event: 'leakAssignMsg',
                            Data: '您有一条新分配的未接来电'
                        }
                    };
                    if(doc != null && doc.pushServerIp != null && doc.pushServerPort != null){
                        httpProvider.sendGet("http://"+doc.pushServerIp+":"+doc.pushServerPort+"/push?msg="+ encodeURI(JSON.stringify(leakAssignMsg)), function(err, res){
                            if(err){
                                logger.app.error("send get request to push-server failed, errMsg: " + err);
                            }else{
                                var resData = {};
                                try{
                                    resData = JSON.parse(res.toString());
                                }catch(e){
                                    logger.app.error(e);
                                }
                                if(resData.success){
                                    logger.app.info("push leakAssignMsg success, userId: " + data.CALLBACK_AGENT);
                                }else{
                                    logger.app.error("push leakAssignMsg failed, userId: " + data.CALLBACK_AGENT + ", resMsg: " + res.message);
                                }
                            }
                            return;
                        });
                    }else{
                        logger.app.info("can't find app_push_client info by userId: " + data.CALLBACK_AGENT);
                    }
                    callback(result);
                });
            });
        }
    });
}

exports.delNotDealCdr = function(data,session,callback){
    var result = {success : false};
    var find ={
        _id : data
    }
    mongo.db(session).collection(session.account.account + fields.DB_CALL_SHEET_LEAK).findOne(find,function(err,resDoc){
        if(err){
            logger.app.error('change callback agent failed!'+err);
            callback(result);
            return;
        }
        mongo.db(session).collection(session.account.account + fields.DB_CALL_SHEET_LEAK).remove(find,function(err){
            if(err){
                logger.app.error('delete not deal cdr failed!'+err);
                callback(result);
                return;
            }
            result.success = true;
            callback(result);
        })
    });
}

exports.delAllNotDealCdr = function(data,session,callback){
    var result = { success: false};
    var data = formatCondition(data);
    if(data.OFFERING_TIME){
        data.NEW_OFFERING_TIME = data.OFFERING_TIME;
        delete data.OFFERING_TIME;
    }
    delete data.page;
    delete data.pageSize;
    delete data.cdrExportType;
    delete data.cdrId;
    data.IS_CALL_BACK = false;
    mongo.db(session).collection(session.account.account + fields.DB_CALL_SHEET_LEAK).remove(data,function(err){
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });
}

exports.saveAssignCallBackAgent = function(data,session,callback){
    var result = {success:false};
    if(data.length>0){
        exports.notDealCallBackAgentChange(data.pop(),session,function(res){
            if(!res.success){
                logger.app.info('assign notDeal cdr failed!');
                callback(result);
                return;
            }
            if(data.length>0){
                exports.saveAssignCallBackAgent(data,session,callback)
            }else{
                result.success = true;
                callback(result);
            }
        })
    }else{
        result.success = true;
        callback(result);
    }
}

exports.saveAssignAllCallBackAgent = function(data,session,callback){
    var result = {success:false};
    var query = data.queryCondition;
    var dataList = data.dataList;
    var sort = {NEW_OFFERING_TIME: -1};
    var query = formatCondition(query);
    if(query.OFFERING_TIME){
        query.NEW_OFFERING_TIME = query.OFFERING_TIME;
        delete query.OFFERING_TIME;
    }
    delete query.page;
    delete query.pageSize;
    delete query.cdrExportType;
    delete query.cdrId;
    query.IS_CALL_BACK = false;
    mongo.db(session).collection(session.account.account + fields.DB_CALL_SHEET_LEAK).find(query, {sort:sort}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        for(var i=0 ; i<dataList.length ; i++){
            var count = dataList[i].COUNT;
            var agentId = dataList[i].CALLBACK_AGENT;
            for(var j=0 ; j<parseInt(count) ; j++){
                var cdr = docs.shift();
                var assginData = {
                    _id: cdr._id,
                    CALLBACK_AGENT: agentId
                }
                exports.notDealCallBackAgentChange(assginData,session,function(){});
            }
        }
        result.success = true;
        callback(result);
    });
}

exports.removeKeyTag = function(data,session,callback){
    var result = {success : false};
    var find = {
        _id : data.CALL_SHEET_ID
    }
    var updateDoc = {
        $unset:{
            KEY_TAG:1
        }
    }
    mongo.db(session).collection(session.account.account + fields.DB_ACCOUNT_CALL_SHEET).update(find,updateDoc,function(err){
        if(err){
            logger.app.error('remove key tag failed!'+err);
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });

}

exports.getCdrMemo = function(data,session,callback){
    var result = {success:false};
    var find = {
        _id : data
    }
    mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).findOne(find,function(err,doc){
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        result.success = true;
        if(doc && 'COMMENTS' in doc){
            result.data = doc.COMMENTS;
        }else{
            result.data = '';
        }
        callback(result);
    })
}

exports.saveCdrMemo = function(data, session, callback){
    var result = {success: false};
    var find = {
        CALL_SHEET_ID : data.CALL_SHEET_ID
    }
    var updateDoc = {
        "$set" : { COMMENTS : data.memo }
    }
    mongo.db(session).collection(session.user.account+fields.DB_ACCOUNT_CALL_SHEET).update(find,updateDoc,function(err){
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        var findHis = {
            _id: data.CALL_SHEET_ID
        }
        var updateHis = {
            "$set" : { comments : data.memo }
        }
        mongo.db(session).collection(session.user.account+fields.DB_HISTORY).update(findHis,updateHis,function(err){
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            logger.app.info(session,'CdrHandler.saveCdrMemo','Call sheet [' + data.CALL_SHEET_ID + '] comments update to :' + data.memo);
            result.success = true;
            callback(result);
        });
    });
}

exports.addExportMonitorTask = function(data, session, callback){
    var menu = "call";
    utils.setUserLevelCondition(data,'DISPOSAL_AGENT',menu,session,true);
    if (!data.isPermissions && data['DISPOSAL_AGENT']) {
        if (data['DISPOSAL_AGENT']['$in']) {
            data['DISPOSAL_AGENT']['$in'].push(null);
        } else {
            data['DISPOSAL_AGENT']['$in']
        }
    }

    if(data.CUSTOMER_NAME){
        if(data.CUSTOMER_NAME == 'true'){
            delete data.CUSTOMER_NAME;
            data.CUSTOMER_ID = { $ne : '00000000000000000000' };
        }else{
            data.CUSTOMER_ID = '00000000000000000000';
        }
    }

    var result = { success: false};
    if(data.KEY_TAG=="true"){
        data.KEY_TAG=true;
    }
    if(data.KEY_TAG=="false"){
        data.KEY_TAG=null;
    }
    var sort = {OFFERING_TIME: -1};

    if(data.page){
        delete data.page
    }
    delete data.isPermissions;
    mongo.db(session).collection(session.account.account + '_c5_call_sheet').find(data, {sort:sort}).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        var records = {};
        var count = 0;
        for(var i=0 ; i<docs.length ; i++){
            if(docs[i].STATUS == 'dealing' || docs[i].STATUS == 'voicemail'){
                var pbx = docs[i].PBX.replace(/\./g,"-");
                if(records[pbx]){
                    records[pbx].push(docs[i].RECORD_FILE_NAME);
                    count++;
                }else{
                    records[pbx] = [];
                    records[pbx].push(docs[i].RECORD_FILE_NAME);
                    count++;
                }
            }
        }
        if(count == 0){
            result.message = "404";
            callback(result);
            return;
        }
        var doc = {
            _id: UUID.generateUuid(),
            records: records,
            account: session.user.account,
            status: 'ready',
            createTime: utils.getCurrentDate(),
            downloadUrlList: {},
            recordsCount: count
        }
        mongo.db().collection('app_call_sheet_batch_download_task').insert(doc, function(err){
            if(err){
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            callback(result);
        });
    });
}

exports.queryExportMonitorTask = function(data, session, callback){
    var result = {success:false};
    var sort = {createTime : -1};
    var begin = 0;
    var pageSize = 10;
    if(data.pageSize) {
        pageSize = parseInt(data.pageSize);
        delete data.pageSize;
    }
    if(data.page){
        begin = (data.page-1)*pageSize;
        delete data.page;
    }
    if(data.BEGIN_TIME || data.END_TIME) {
        data.createTime = {};
        if(data.BEGIN_TIME){
            data.createTime["$gte"] = data.BEGIN_TIME;
            delete data.BEGIN_TIME;
        }
        if(data.END_TIME){
            data.createTime["$lte"] = data.END_TIME;
            delete data.END_TIME;
        }
    }
    data.account = session.user.account;

    var returnDoc = {createTime:1,status:1,downloadUrlList:1,recordsCount:1};
    mongo.db().collection('app_call_sheet_batch_download_task').find(data, returnDoc , {sort:sort}).limit(pageSize).skip(begin).toArray(function (err, docs) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        mongo.db().collection('app_call_sheet_batch_download_task').count(data, function (err, docCount) {
            if (err) {
                logger.app.error(err);
                callback(result);
                return;
            }
            result.success = true;
            result.list = docs;
            result.count = docCount;
            callback(result);
        });
    });
}

exports.removeExportMonitorTask = function(data, session, callback){
    var result = {success:false};
    mongo.db().collection('app_call_sheet_batch_download_task').remove({_id:data}, function (err) {
        if (err) {
            logger.app.error(err);
            callback(result);
            return;
        }
        result.success = true;
        callback(result);
    });
}

exports.getCdrDetail = function(data, session, callback){
    var result = {success:false};
    var find = { 'CALL_SHEET_ID': data};
    mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findOne(find,function(err,doc){
        if(err){
            logger.app.error(err);
            callback(result);
            return;
        }
        if(doc === null){
            result.success = true;
            callback(result);
        }else{
            exports.getCdrChannel(doc,session,function(res){
                if(!res.success){
                    logger.app.log('query cdr channel failed! call_sheet_id = '+ doc.CALL_SHEET_ID);
                    callback(result);
                    return;
                }
                result.success = true;
                result.data = res.data;
                callback(result);
            });
        }
    });
}



exports.relocationCustomer = function(data, session, callback){
    var limit = data.limit||10;
    delete data['limit'];
    var page = data.page||1;
    delete data['page'];
    var skip = (page - 1) * limit;
    var callId=data._id;
    delete data._id;

    var result = {success: false};
//    var aid=session.user.account;
    mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findOne({_id:callId},function(err,callDB){
        if(!err && callDB){
            result.row=callDB;
            var custId=callDB.CUSTOMER_ID;
            var phone=callDB.CALL_NO;
            var connectType=callDB.CONNECT_TYPE;
            if (connectType=='dialout' || connectType=='dialTransfer') {
                phone=callDB.CALLED_NO;
            }
            result.tel=phone;
            if(custId && custId!="00000000000000000000"){
                custHandler.queryCustInfo({_id:custId},session,function(rep){
                    if(rep.success){
                        var item=rep.data;
                        //if(item.delTag=='y'){
                        //    result.count = -1;
                        //    result.list=[];
                        //    result.success = true;
                        //    callback(result);
                        //}else{
                        var tels=item.phone||[];
                        var _num=0;
                        for (var i = 0; i < tels.length; i++) {
                            var obj = tels[i];
                            if(obj.tel==phone){
                                _num++;
                                break;
                            }
                        }
                        if(_num==0){
                            result.count = -1;
                            result.list=[];
                        }else{
                            result.count = 1;
                            result.list=[item];
                        }
                        result.success = true;
                        callback(result);
                        //}
                    }else{
                        if(rep.code=='404'){
                            result.count = -1;
                            result.list=[];
                            result.success = true;
                            callback(result);
                        }else{
                            callback(rep);
                        }
                    }
                })
            }else{
                var query = data||{};
                utils.removeEmptyProperty(query);
                //query.delTag = null;
                query["phone.tel"] = phone;

                mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                    if (!err) {
                        result.list = docs||[];
                        if(result.list==0){
                            var _tel=utils.getShortTel(phone);
                            query["phone.tel"] = _tel;
                            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).find(query, {sort: {createTime: -1}, limit: limit, skip: skip}).toArray(function (err, docs) {
                                if (!err) {
                                    result.list = docs||[];
                                    mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                                        if (!err) {
                                            result.count = count;
                                            if (count == 1 && result.list[0]) {
                                                var cust=result.list[0];
                                                custHandler.queryCustFields(cust, session, function (rep) {
                                                    if (rep.success) {
                                                        cust.fields = rep.data.fields;
                                                        result.success = true;
                                                        callback(result);
                                                    } else {
                                                        result.success = false;
                                                        callback(result);
                                                    }
                                                });
                                                var updateCall = {
                                                    "$set" : { CUSTOMER_ID : cust._id , CUSTOMER_NAME : cust.name }
                                                }
                                                mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findAndModify({_id:callId},[],updateCall,{new:true},function (err,cdrItem) {
                                                    if (err) {
                                                        logger.app.error(err);
                                                    }else{
                                                        exports.upsertCustHistory(cdrItem,session,function(rep){});
                                                        custHandler.updateCustLastContactByCall({customerId:cust._id},cdrItem,session);
                                                    }
                                                });
                                            }else{
                                                result.success = true;
                                                callback(result);
                                            }
                                        } else {
                                            logger.app.error(err);
                                            callback(result);
                                        }
                                    });
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            })
                        }else{
                            mongo.db(session).collection(session.user.account + fields.DB_C5_CUSTOMER).count(query, function (err, count) {
                                if (!err) {
                                    result.count = count;
                                    if (count == 1) {
                                        var cust=result.list[0];
                                        custHandler.queryCustFields(cust, session, function (rep) {
                                            if (rep.success) {
                                                cust.fields = rep.data.fields;
                                                result.success = true;
                                                callback(result);
                                            } else {
                                                result.success = false;
                                                callback(result);
                                            }
                                        });
                                        var updateCall = {
                                            "$set" : { CUSTOMER_ID : cust._id , CUSTOMER_NAME : cust.name }
                                        }
                                        mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findAndModify({_id:callId},[],updateCall,{new:true},function (err,cdrItem) {
                                            if (err) {
                                                logger.app.error(err);
                                            }else{
                                                exports.upsertCustHistory(cdrItem,session,function(rep){});
                                                custHandler.updateCustLastContactByCall({customerId:cust._id},cdrItem,session);
                                            }
                                        });
                                    }else{
                                        result.success = true;
                                        callback(result);
                                    }
                                } else {
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });
                        }
                    } else {
                        logger.app.error(err);
                        callback(result);
                    }
                });
            }
        }else{
            logger.app.error(err);
            callback(result);
        }
    });

}

exports.locationCustomer = function(data, session, callback){//补录客户
    var result = {success: false};
    var cid = data.customerId;
    var id = data.callId;
    var phone=data.phone||[];
    //console.info("locationCustomer=============");
    //console.dir(phone);
    var updateCall = {
        "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : data.custName}
    }

    mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findAndModify({_id:id},[],updateCall,{new:true},function (err,cdrItem) {
        if (err) {
            logger.app.error(err);
        }else{
            var updateCall_leak = {
                "$set" : { NEW_CUSTOMER_ID : cid , NEW_CUSTOMER_NAME : data.custName}
            }
            mongo.db(session).collection(session.account.account+fields.DB_CALL_SHEET_LEAK).update({"NEW_CALL_SHEET_ID":id}, updateCall_leak, function(err){
                if(err){
                    logger.app.error(err);
                }else{
                    //选择老客户关联新号码到客户上
                    if(phone.length>0){
                        var set={
                            _id:cid,
                            phone:phone
                        }
                        custHandler.updateCustTelByCall(set,session,function(){
                        })
                    }
                    //todo write to customer history
                    //exports.updateMCHistory(data,session,function(rep){
                    //});
                    exports.upsertCustHistory(cdrItem,session,function(rep){
                    });

                    custHandler.updateCustLastContactByCall(data,cdrItem,session);
                }
                //custHandler.updateCustomer(set,session,function(){
                //})
            });
        }
    });
}


exports.locationCustomer2Add = function(data, session, callback){//新保存客户
    var result = {success: false};
    var cid = data.customerId;
    var id = data.callId;


    var updateCall = {
        "$set" : { CUSTOMER_ID : cid , CUSTOMER_NAME : data.custName}
    }
    mongo.db(session).collection(session.account.account+fields.DB_ACCOUNT_CALL_SHEET).findAndModify({_id:id},[],updateCall,{new:true},function (err,cdrItem) {
        if (err) {
            logger.app.error(err);
        }else{
            //todo write to customer history
            exports.upsertCustHistory(cdrItem,session,function(rep){});
            custHandler.updateCustLastContactByCall(data,cdrItem,session);
            var updateCall_leak = {
                "$set" : { NEW_CUSTOMER_ID : cid , NEW_CUSTOMER_NAME : data.custName}
            }
            mongo.db(session).collection(session.account.account+fields.DB_CALL_SHEET_LEAK).update({"NEW_CALL_SHEET_ID":id}, updateCall_leak, function(err){
                if(err){
                    logger.app.error(err);
                }else{
                    //todo write to customer history
                    //exports.updateMCHistory(data,session,function(rep){
                    //});
                }
            });
        }
    });
}
/**
 * update multi channel history  by
 * @param data  { callId : callsheetId , customerId : customerId}
 * @param session
 * @param callbcak
 */
exports.updateMCHistory = function(data, session, callbcak){
    var result = {success: false};
    var cid = data.customerId;
    var id = data.callId;
    var updateHis = {
        "$set" : { customer : cid }
    }
    mongo.db(session).collection(session.account.account+fields.DB_HISTORY).update({_id:id},updateHis,function(err){
        if (err) {
            logger.app.error(err);
            callbcak(result);
            return;
        }
        result.success = true;
        callbcak(result);
    });
}



exports.upsertCustHistory = function(data, session, callbcak){
    var result = {success: false};
    if(!data)return;
    var cid = data.CUSTOMER_ID;
    var id = data._id;
    mongo.db(session).collection(session.account.account+fields.DB_HISTORY).findOne({_id:id},function(err,doc){
        if (err) {
            logger.app.error(err);
            callbcak(result);
            return;
        }else{
            if(doc){
                var _set={customer:cid};
                mongo.db(session).collection(session.account.account+fields.DB_HISTORY).update({_id:id},{$set:_set},function(err){
                    if (err) {
                        logger.app.error(err);
                        callbcak(result);
                        return;
                    }
                    result.success = true;
                    callbcak(result);
                });
            }else{
                var time=utils.getCurrentDate();
                //console.info("timestamp====="+utils.transferTimeStamp(time));
                var connectType=data.CONNECT_TYPE;
                var type="callin";
                if (connectType=='dialout' || connectType=='dialTransfer') {
                    type="callout";
                }
                var status=data.STATUS;
                var beginTime=data.BEGIN_TIME;
                var endTime=data.END_TIME;
                var createTime = "";
                if(beginTime){
                    createTime = beginTime;
                    beginTime=utils.transferTimeStamp(beginTime)+"";
                }
                if(endTime){
                    createTime = endTime;
                    endTime=utils.transferTimeStamp(endTime)+"";
                }
                var _set={
                    _id:id,
                    type:type,
                    customer : cid,
                    createTime : createTime,
                    agent : data.DISPOSAL_AGENT,
                    status : status,
                    beginTime :beginTime,
                    endTime : endTime
                }
                if(status=='dealing' || status=='voicemail'){
                    _set.recordFile=data.FILE_SERVER+"/"+data.RECORD_FILE_NAME;
                }
                mongo.db(session).collection(session.account.account+fields.DB_HISTORY).insert(_set,function(err){
                    if (err) {
                        logger.app.error(err);
                        callbcak(result);
                        return;
                    }
                    result.success = true;
                    callbcak(result);
                });
            }
        }
    });

}

exports.getMyCallLabel = function(session, callback){
    var allFunc = session.user.allFun;
    if(allFunc != null){
        if(allFunc.indexOf('func_mark_cdr') >= 0){
            var aid = session.user.account;
            mongo.db().collection(fields.DB_MANAGER_CALL_LABEL).find({'accountId':aid, 'enable':true}).toArray(function(err, label){
                if(!err){
                    callback(null, label);
                }else{
                    logger.app.error(err);
                    callback(err);
                }
            });
        }else{
            callback(null, -1);
        }
    }else{
        callback(null, -1);
    }
}

exports.markCallSheet = function(data, session, callback){
    var result = {success: false};
    var allFunc = session.user.allFun;
    if(allFunc.indexOf('func_mark_cdr') >= 0){
        var label = data.label;
        if(label != null && label instanceof Array){
            var targetDb = session.account.dataDB;
            var callSheet = session.user.account + fields.DB_ACCOUNT_CALL_SHEET;
            var find = {
                _id : data.callSheetId,
                "DISPOSAL_AGENT": session.user._id
            };
            var update = {
                $set : {
                    'LABELS' : label
                }
            }
            var callSheetId = data.callSheetId;
            if(callSheetId != null){
                mongo.db(targetDb).collection(callSheet).findOneAndUpdate(find, update, function(err){
                    if(!err){
                        result.success = true;
                        callback(result);
                    }else{
                        logger.app.error(err);
                        result.message = "update callSheet's LABELS failed";
                        callback(result);
                    }
                });
            }else{
                result.message = 'lack of callSheetId parameter';
                callback(result);
            }
        }else{
            result.message = 'parameter tag is necessary and should be an array';
            callback(result);
        }
    }else{
        result.message = "you're not authorized to this operation";
        callback(result);
    }
}