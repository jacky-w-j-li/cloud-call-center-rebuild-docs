/**
 * Created by zhangyang on 15/3/5.
 */
var utils = require('appUtil/Utils');
var logger = require('appLog');
var openService = require(__baseDir + '/7moor/service/OpenServiceHandler');
var qiniuService = require(__baseDir + '/7moor/service/QiniuServiceHandler');
var interfaceSmsService = require(__baseDir + '/7moor/sms/InterfaceSmsHandler');

var services = {
    qiniu:{
        getUptoken : qiniuService.getUptoken
    },
    query400Status : openService.query400Status,
    getCCAccountsByProxy : openService.getCCAccountsByProxy,
    getCCServiceNoByAcc : openService.getCCServiceNoByAcc,
    getCCAgentsByAcc : openService.getCCAgentsByAcc,
    interfaceSms : interfaceSmsService.sendInterfaceSms,
    getSmsTemplate : interfaceSmsService.getSmsTemplate,
    sendInterfaceTemplateSms : interfaceSmsService.sendInterfaceTemplateSms,
    getCCBalance : openService.getCCBalance,
    getCCCdr : openService.getCCCdr,
    flowPackage : openService.flowPackage,
    flowRecharge : openService.flowRecharge,
    flowRechargeStatus : openService.flowRechargeStatus,
    flowRechargeNotify : openService.flowRechargeNotify,
    voiceVerifyStandard : openService.voiceVerifyStandard,
    voiceVerifyCallBack : openService.voiceVerifyCallBack,
    locateIP : openService.locateIP,
    isNumberAllowedIntl : openService.isNumberAllowedIntl,
    ivrYtxCommitDisplayNum : openService.ivrYtxCommitDisplayNum,
    ivrYtxNewAppCommitDisplayNum : openService.ivrYtxNewAppCommitDisplayNum
};


exports.handleService = function (service, res ,_aid) {
    try {
        var actionFun = eval('services.' + service.name);
        if (actionFun) {
            actionFun(service.data, function (result) {
                if(service.name == 'flowRechargeNotify' || service.name == 'voiceVerifyCallBack'){
                    res(null, result);
                }else if(service.name == 'ivrYtxCommitDisplayNum'){
                    res.send(result);
                }else{
                    result.success = result.success || false;
                    result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                    utils.sendResult(result, res ,_aid);
                }
            });
        } else {
            processUnknowService(service, res , _aid);
        }
    } catch (e) {
        logger.app.error("",e);
        utils.sendResult({success: false, message: e.message}, res ,_aid);
    }


}


function processUnknowService(service, res , _aid) {
    var result = {};
    result.success = false;
    result.result = 500;
    result.message = 'openService[' + service.name + '] is not support!';
    utils.sendResult(result, res , _aid);
}
