var utils = require('appUtil/Utils');
var logger = require('appLog');
var registerHandler = require(__baseDir + '/7moor/register/RegisterHandler');
var serviceHandler = require(__baseDir + '/7moor/service/ServiceHandler');
var payHandler = require(__baseDir + '/7moor/ucenter/PayHandler');
var weixinHandler = require(__baseDir + '/7moor/weixin/WxPublicHandler');
var agentHandler = require(__baseDir + '/7moor/ucenter/AgentHandler');
var billLoginHandler = require(__baseDir + "/7moor/ucenter/BillLoginHandler");
var billPayHandler = require(__baseDir + "/7moor/account/BillPayHandler");
var resetPwdHandler = require(__baseDir + "/7moor/ucenter/ResetPwdHandler");
var licenceHandler = require(__baseDir + "/7moor/ucenter/LicenceHandler");
var notifyHandler = require(__baseDir + "/7moor/notify/NotifyHandler");
var websiteHandler = require(__baseDir + "/7moor/website/WebSiteHandler");
var feeTempHandler = require(__baseDir + "/7moor/ucenter/FeeTempHandler");
var hangupSmsHandler = require(__baseDir + "/7moor/sms/HangupSmsHandler");
//var apiHandler = require(__baseDir + "/7moor/api/ApiHandler");
var verificationHandler = require(__baseDir + "/7moor/verification/VerificationHandler");
var wariningHandler = require(__baseDir + "/7moor/warning/WarningHandler");

var actions = {
    register : {
        email : registerHandler.email,
        reEmail : registerHandler.reEmail,
        submitData : registerHandler.submitData,
        getAccount : registerHandler.getAccount,
        initAccount : registerHandler.initAccount,
        getAccountInfo : registerHandler.getAccountInfo,
        completeRegiste : registerHandler.completeRegiste,
//        submitRegister : registerHandler.submitRegister
        findEmailByKey : registerHandler.findEmailByKey,
        rl7mWebSiteMobileCode: registerHandler.rl7mWebSiteMobileCode,
        rl7mWebSiteYZMSmsTry: registerHandler.rl7mWebSiteYZMSmsTry,
        rl7mWebSiteYZMWebCallTryMobileCode: registerHandler.rl7mWebSiteYZMWebCallTryMobileCode,
        rl7mWebSiteYZMWebCallTryMobileVoiceCode: registerHandler.rl7mWebSiteYZMWebCallTryMobileVoiceCode,
        rl7mWebSiteCryptonym: registerHandler.rl7mWebSiteCryptonym,
        rl7mWebSiteYZMWebCallTry: registerHandler.rl7mWebSiteYZMWebCallTry,
        rl7mWebSiteYZMWebCallTryMobileVoiceMakeSure: registerHandler.rl7mWebSiteYZMWebCallTryMobileVoiceMakeSure,
        rl7mWebSiteWbcallTry: registerHandler.rl7mWebSiteWbcallTry,
        rl7mWebSiteYZMWebCallTryCard: registerHandler.rl7mWebSiteYZMWebCallTryCard
    },
    verification :{
        getImageVer : verificationHandler.getImageVer,
        verifyImageCode : verificationHandler.verifyImageCode,
        verifyMobileCode : verificationHandler.verifyMobileCode
    },
    service :{
        getMobileCodeInfo: serviceHandler.getMobileCodeInfo,
        hasFare: serviceHandler.hasFare,
        queryLicenseCount: serviceHandler.queryLicenseCount,
        updateCallLimit: serviceHandler.updateCallLimit,
        getCallInRoute : serviceHandler.getCallInRoute,
        canDialout : serviceHandler.canDialout,
        billAlert : serviceHandler.billAlert,
        gatewaySip : serviceHandler.gatewaySip,
        queryGroupAccountExten : serviceHandler.queryGroupAccountExten,
        notifyGetAccLicence : serviceHandler.notifyGetAccLicence
    },
    pay:{
        licenceBankPay:payHandler.licenceBankPay,
        bankPay:payHandler.bankPay,
        aliNotify:payHandler.aliNotify,
        notifyTimeExpired:payHandler.notifyTimeExpired,
        notifySyncConcurrent:payHandler.notifySyncConcurrent,
        recycleZJTryNum:payHandler.recycleZJTryNum,
        notifyWaitPayExpired:payHandler.notifyWaitPayExpired
    },
    weixin:{
        newVoicemail : weixinHandler.newVoicemail
    },
    agent:{
        updateAgent2IM:agentHandler.updateAgent2IM
    },
    bill:{
        getSessionId:billLoginHandler.getSessionId,
        bankPay:billPayHandler.bankPay,
        aliNotify:billPayHandler.aliNotify
    },
    taobao:{
        getTbSessionId:billLoginHandler.getTbSessionId,
        finishTaobao:billLoginHandler.finishTaobao
    },
    validate:{
        validateAccount:billLoginHandler.validateAccount
    },
    resetPwd:{
        forgetPwd:resetPwdHandler.forgetPwd,
        showReset:resetPwdHandler.showReset,
        resetPwd:resetPwdHandler.resetPwd
    },
    resource:{
    },
    updateData:{
        telBalanceUpdate:payHandler.telBalanceUpdate
    },
    notify:{
        notifyNum:notifyHandler.notifyNum,
        notifyLicence:notifyHandler.notifyLicence,
        notifyDialFee:notifyHandler.notifyDialFee,
        notifyOweFee:notifyHandler.notifyOweFee,
        notifyCustFee:notifyHandler.notifyCustFee,
        notifyCustFeeStop:notifyHandler.notifyCustFeeStop
    },
    webSite:{
        webSiteTryOut: websiteHandler.websiteTryOut,
        getServiceCount: websiteHandler.getServiceCount,
        webSiteCount: websiteHandler.webSiteCount,
        webSiteVideoCount: websiteHandler.webSiteVideoCount,
        webSiteSendMail: websiteHandler.webSiteSendMail,
        webSiteQueryAccountInfo: websiteHandler.webSiteQueryAccountInfo,
        webSiteQueryAccountInfo7moor: websiteHandler.webSiteQueryAccountInfo7moor,
        smsWordsCheck: websiteHandler.smsWordsCheck
    },
    temp:{
//        saveProxyMonthDetail:feeTempHandler.saveProxyMonthDetail
    },
    hangupSms:{
        zjHangupSms: hangupSmsHandler.sendZJHangupSms
    },
    api:{
        //getApiMd5: apiHandler.createAccountApiMD5
    },
    im: {
        editAgentForIm: agentHandler.editAgentForIm
    },
    cc:{
        getCCSessionId: billLoginHandler.getCCSessionId
    },
    ass:{
        foreignIpRegisterWarning: wariningHandler.foreignIpRegisterWarning,
        inRateLowWarning: wariningHandler.inRateLowWarning,
        commonWarning: wariningHandler.commonWarning
    }

};

var impl = {
    processUnknowAction: function (action, res) {
        var result = {};
        result.success = false;
        result.message = 'action[' + action.name + '] is not support!';
        utils.sendResult(result, res , action._aid);
    }
}

var actionHandler = {
    handleAction: function (action, res) {
        try {
            var actionFun = eval('actions.' + action.name);
            if (actionFun) {
                actionFun(action.data, function (result) {
                    if(result.showView){
                        if(result.view && result.data){
                            logger.app.info("response["+action._aid+"] to client view["+result.view+"] : " + JSON.stringify(result.data));
                            res.render(result.view,result.data);
                        } else {
                            logger.app.error("response["+action._aid+"] to client view[error.html] : " + JSON.stringify({}));
                            res.render("error.html",{});
                        }
                    } else if(result.bufferData){
                        result.data = result.data || result.message;
                        logger.app.info("response["+action._aid+"] to client databuffer : " + result.data.length);
                        res.end(result.data);
                    } else {
                        result.success = result.success || false;
                        result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                        utils.sendResult(result, res , action._aid);
                    }
                });
            } else {
                impl.processUnknowAction(action, res);
            }

        } catch (e) {
            logger.app.error(e);
            utils.sendResult({success: false, message: e.message}, res , action._aid);
        }
    },
    handleNotifyAction: function (action, res){
        try {
            var actionFun = eval('actions.' + action.name);
            if (actionFun) {
                actionFun(action.data, function (result) {
                    if(result.success){
                        logger.app.info('response['+action._aid+'] to client: success!');
                        res.send('success');
                    } else {
                        logger.app.info('response['+action._aid+'] to client: fail!');
                        res.send('fail');
                    }
                });
            } else {
                logger.app.error('action[' + action.name + '] is not support!');
                res.send('fail');
            }

        } catch (e) {
            logger.app.error(e);
            logger.app.info('response['+action._aid+'] to client: fail!');
            res.send('fail');
        }
    },
    handleValidateAction: function (action, res){
        try {
            var actionFun = eval('actions.' + action.name);
            if (actionFun) {
                actionFun(action.data, function (result) {
                    logger.app.info('response['+action._aid+'] to client:' + JSON.stringify(result));
                    res.send(result);
                });
            } else {
                logger.app.error('action[' + action.name + '] is not support!');
                res.send(false);
            }

        } catch (e) {
            logger.app.error(e);
            logger.app.error('response['+action._aid+'] to client: false');
            res.send(false);
        }
    }
}

module.exports = actionHandler;
