var fields = require(__baseDir + '/dishui/common/Fields');
var mongo = require('appDb/MongoDb');
var utils = require('appUtil/Utils');
var logger = require('appLog');

var businessDic = require(__baseDir + '/dishui/app/business/BusinessDicHandler');
var pbxDic = require(__baseDir + '/dishui/app/pbx/PbxHandler');
var userDic = require(__baseDir + '/dishui/app/user/UserHandler');
var deptDic = require(__baseDir + '/dishui/app/dept/DeptHandler');
var custDic = require(__baseDir + '/dishui/app/customer/CustomerHandler');
var taskDic = require(__baseDir + '/dishui/app/task/TaskHandler');
var queueDic = require(__baseDir + '/dishui/app/queue/QueueHandler');
var callRecordDic = require(__baseDir + '/dishui/app/callRecord/CallRecordHandler');
var roleDic = require(__baseDir + '/dishui/config/role/RoleHandler');
var optionDic = require(__baseDir + '/dishui/config/dic/DictionaryHandler');
var lineDic = require(__baseDir + '/dishui/config/ivr/LineDicHandler');
var serviceDic = require(__baseDir + '/dishui/config/ivr/ServiceNoHandler');
var phoneBarDic = require(__baseDir + '/dishui/config/ivr/PhoneBarConfigHandler');
var ivrMenuHandler = require(__baseDir + '/dishui/config/ivr/IvrMenuHandler');
var encryptMd5Handler = require(__baseDir + '/dishui/config/ivr/EncryptMd5Handler');
var callUrlHandler = require(__baseDir + '/dishui/config/callUrl/CallUrlHandler');
var batchTaskDic = require(__baseDir + '/dishui/app/batch/BatchTaskHandler');
var callSheetQualityCheckConfigDic = require(__baseDir + '/dishui/config/qualityCheck/QualityCheckHandler');
var questionnaireDic = require(__baseDir + '/dishui/app/questionnaire/QuestionnaireDicHandler');
var blackListHandler = require(__baseDir + '/dishui/config/ivr/BlackListHandler.js');
var ivrNodeIvrHandler = require(__baseDir + '/dishui/config/ivr/IvrNodeHandler.js');
var interfaceDic = require(__baseDir + '/dishui/config/interfaceUrl/InterfaceHandler');
var newSmsHandler = require(__baseDir + '/dishui/app/sms/NewSmsHandler');
var custTaskHandler = require(__baseDir + '/dishui/app/customer/CustomerTaskHandler');
var emailHandler = require(__baseDir + '/dishui/config/channel/EmailHandler');
var signHandler = require(__baseDir + '/dishui/app/email/SignHandler');
var emailAppHandler = require(__baseDir + '/dishui/app/email/EmailHandler');
var channel_dic_handler = require(__baseDir + '/dishui/config/channelDic/ChannelDicHandler');
var webchatHandler = require(__baseDir + '/dishui/app/webchat/WebchatHandler');
var robotHandler = require(__baseDir + '/dishui/config/channel/RobotHandler');
var callSheetHandler = require(__baseDir + '/dishui/app/callSheet/CallSheetHandler');

var gloabCacheConf = {
    businessFlow: businessDic.getBusinessDic,
    businessFlowStep: businessDic.getBusinessStepDic,
    businessFlowField: businessDic.getBusinessFieldDic,
    questionnaireField : questionnaireDic.getQuestionnaireFieldDic,
    questionnaireQues: questionnaireDic.getQuestionnaireQues,
    questionnaireTemp : questionnaireDic.getQuestionnaireTemp,
    pbx: pbxDic.getPbxDic,
    agents: userDic.getUserDic,
    depts: deptDic.getDeptDic,
    custTmpls: custDic.getTmplByAccId,
    callRecordTmpls: callRecordDic.getTmplByAccId,
    tags: taskDic.getTagsDic,
    queues: queueDic.getQueueDic,
    roles: roleDic.getRoleDicCache,
    options: optionDic.getOptionDic,
    line: lineDic.getLineDic,
    currentPbxQueues: queueDic.getAgentInQueue,
    AllPbxQueues: queueDic.getAllPbxQueue,
    serviceNo: serviceDic.getServiceNoDic,
    phoneBars: phoneBarDic.getPhoneBars,
    callUrls: callUrlHandler.queryCallUrls,
    myServiceNos:batchTaskDic.getSnByUser,
    mySkillGroups:batchTaskDic.getSkillGroupByUser,
    qualityCheckTemplates: callSheetQualityCheckConfigDic.getQualityCheckTemplateDic,
    ownServiceNoResource: serviceDic.getOwnServiceNoResource,
    inBlackList: blackListHandler.getInBlackListDic,
    ivrNodeKeyMemo: ivrNodeIvrHandler.getIvrNodeIvrDic,
    urls: interfaceDic.getUrlsDic,
    encryptMd5: encryptMd5Handler.getIvrMenuDic,
    ivrMenu: ivrMenuHandler.getIvrMenuDic,
    smsSign: newSmsHandler.getSmsSignDic,
    taskCache:custTaskHandler.getTaskDic,
    emailSigns: signHandler.getSignByUser,
    mailQueues: emailHandler.getMailQueuesDic,
    mailChannel: emailAppHandler.getEmailChannel,
    weixinChannel: emailAppHandler.getWeixinChannel,
    channelDic: channel_dic_handler.getChannelDic,
    onlineChannelAgent: webchatHandler.getOnlineAgentDic,
    accessChannelAgent: webchatHandler.getAccessAgentDic,
    robotConfig: robotHandler.getRobotConfig,
    webchatAndSdkConfig: webchatHandler.getWebchatAndSdkConfigDic,
    smsTemplate: newSmsHandler.getSmsTemlateDic,
    quickSearchTmpls:custDic.queryQuickSearchTmpl,
    custCategorys:custDic.queryCustCategorysDic,
    callLabel:callSheetHandler.getMyCallLabel
}
var cacheHandler = {
    getDicCache: function (data, session, callback) {
        var result = {success: false};
        var cacheType = data.type;
            if (cacheType) {
            if (gloabCacheConf[cacheType]) {
                gloabCacheConf[cacheType](session, function (err, data) {
                    if (!err) {
                        result.success = true;
                        result.data = data;
                        callback(result);
                    } else {
                        logger.app.error('getCache[' + cacheType + '] error!', err);
                        result.message = 'getCache[' + cacheType + '] error!';
                        callback(result);
                    }
                });
            }
        } else {
            impl.getGeneralCodesCache(session, function (err, map) {
                if (!err) {
                    result.success = true;
                    result.dicMap = map;
                    callback(result);
                } else {
                    logger.app.error('dicCache error!', err);
                    result.message = 'getGeneralCodesCache error!';
                    callback(result);
                }
            });
        }

    }

}


var impl = {
    getGeneralCodesCache: function (session, callback) {
        mongo.db().collection(fields.DB_TBL_GENERAL_CODES).find({}, {sort: {code_type: -1, code_order: 1}}).toArray(function (err, docs) {
            if (!err) {
                docs = docs || [];
                var dicMap = impl.proceeCodeForMap(docs);
                callback(null, dicMap);
            } else {
                callback(err);
            }
        });
    },
    proceeCodeForMap: function (docs) {
        docs = docs || [];
        var result = {};
        var keys = [];
        for (var i = 0; i < docs.length; i++) {
            var data = docs[i];
            if (keys.contains(data.code_type)) {
                result[data.code_type].push(data);
            } else {
                keys.push(data.code_type);
                result[data.code_type] = [data];
            }
        }
        return result;
    }
}

module.exports = cacheHandler;
