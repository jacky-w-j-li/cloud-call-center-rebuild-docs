var utils = require('appUtil/Utils');
var logger = require('appLog');
var systemHandler = require(__baseDir + '/7moor/system/SystemHandler');
var accountHandler = require(__baseDir + '/7moor/account/AccountHandler');
var accountQueryHandler = require(__baseDir + '/7moor/account/AccountQueryHandler');
var licenseHandler = require(__baseDir + '/7moor/account/LicenseHandler');
var userHandler = require(__baseDir + '/7moor/user/BillUserHandler');
var serviceNumHandler = require(__baseDir + '/7moor/resource/ServiceNumHandler');
var pbxHandler = require(__baseDir + '/7moor/resource/PbxHandler');
var sipNumHandler = require(__baseDir + '/7moor/resource/SipNumHandler');
var queueHandler = require(__baseDir + '/7moor/resource/QueueHandler');
var num400Handler = require(__baseDir + '/7moor/resource/Num400Handler');
var agentHandler = require(__baseDir + '/7moor/ucenter/AgentHandler');
var serviceNoHandler = require(__baseDir + '/7moor/ucenter/ServiceNoHandler');
var payHandler = require(__baseDir + '/7moor/ucenter/PayHandler');
var ivrHandler = require(__baseDir + '/7moor/ivr/IvrHandler');
var locationHandler = require(__baseDir + '/7moor/resource/LocationHandler');
var boardHandler = require(__baseDir + '/7moor/resource/BoardHandler');
var lineHandler = require(__baseDir + '/7moor/resource/LineHandler');
var batchDialHandler = require(__baseDir + '/7moor/ucenter/BatchDialHandler');
var batchFaxHandler = require(__baseDir + '/7moor/ucenter/BatchFaxHandler');
var feeHandler = require(__baseDir + '/7moor/ucenter/FeeHandler');
var cacheHandler = require(__baseDir + "/7moor/common/GloabCacheHandler");
var systemUserHandler = require(__baseDir + "/7moor/system/SystemUserHandler");
var exportHandler = require(__baseDir + "/7moor/common/ExportHandler");
var batchDialReportHandler = require(__baseDir + '/7moor/ucenter/report/BatchDialReportHandler');
var batchFaxReportHandler = require(__baseDir + '/7moor/ucenter/report/BatchFaxReportHandler');
var registerHandler = require(__baseDir + "/7moor/register/RegisterHandler");
var billServiceNoHandler = require(__baseDir + "/7moor/account/BillServiceNoHandler");
var billLoginHandler = require(__baseDir + "/7moor/ucenter/BillLoginHandler");
var billPayHandler = require(__baseDir + "/7moor/account/BillPayHandler");
var accountSetHandler = require(__baseDir + "/7moor/ucenter/AccountSetHandler");
var licenceHandler = require(__baseDir + "/7moor/ucenter/LicenceHandler");
var custFeeHandler = require(__baseDir + "/7moor/ucenter/CustFeeHandler");
var accountFeeHandler = require(__baseDir + "/7moor/ucenter/AccountFeeHandler");
var proxyFinanceHandler = require(__baseDir + '/7moor/proxy/ProxyFinanceHandler');
var customerCareFinanceHandler = require(__baseDir + '/7moor/customerCare/CustomerCareFinanceHandler');
var consultantFinanceHandler = require(__baseDir + '/7moor/consultant/ConsultantFinanceHandler');
var smsChannelHandler = require(__baseDir + '/7moor/resource/SmsChannelHandler');
var dialCountNumHandler=require(__baseDir+'/7moor/resource/DialCountNumHandler');
var smsExamineHandler=require(__baseDir+'/7moor/resource/SmsExamineHandler');
var intlHandler = require(__baseDir + '/7moor/resource/IntlHandler');
var serviceNumWhiteListHandler = require(__baseDir + '/7moor/resource/ServiceNumWhiteListHandler')
var industryHandler = require(__baseDir + '/7moor/account/IndustryHandler');
var ytxSmsTemplateHandler = require(__baseDir + '/7moor/account/YtxSmsTemplateHandler');
//wwh
var cdrLineHandler=require(__baseDir+'/7moor/cdr/CdrLineHandler');
var operate=require(__baseDir+'/7moor/report/Operate');
var areaHandler=require(__baseDir+'/7moor/report/area/AreaHandler');
var channelHandler=require(__baseDir+'/7moor/report/proxy/ChannelHandler');
var personalHandler=require(__baseDir+'/7moor/report/personal/PersonalHandler');
var incomAnalysisHandler=require(__baseDir+'/7moor/report/IncomAnalysisHandler');
var myProxyIncomeHandler=require(__baseDir+'/7moor/proxy/MyProxyIncomeHandler');
var filingYunHandler=require(__baseDir+'/7moor/resource/FilingYunHandler');
var openIntlFeeHandler=require(__baseDir+'/7moor/resource/OpenIntlFeeHandler');
var logoHandler=require(__baseDir+'/7moor/system/LogoHandler');
var batchPayHandler=require(__baseDir+'/7moor/proxy/BatchPayHandler');
var hangUpSmsHandler=require(__baseDir+'/7moor/ucenter/HangUpSmsHandler');

var thirdCustomHandler=require(__baseDir+'/7moor/ucenter/ThirdCustomHandler');
var invoiceHandler=require(__baseDir+'/7moor/ucenter/InvoiceHandler');
var qiniuHandler=require(__baseDir+'/7moor/qiniu/QiniuHandler');
var smsCheckHandler=require(__baseDir+'/7moor/sms/SmsCheckHandler');
var displayNumRecordHandler = require(__baseDir+'/7moor/account/DisplayNumRecordHandler')
var smsTemplateToCheckHandler = require(__baseDir+'/7moor/sms/SmsTemplateToCheckHandler');
var actions = {
    bill: {
        export:{
            exportBillXls:exportHandler.exportBillXls
        },
        checkCCPbx:billLoginHandler.checkCCPbx,
        redirectCCAdminLogin:billLoginHandler.redirectCCAdminLogin,
        redirectCCInLogin:billLoginHandler.redirectCCInLogin,
        redirectCCOutLogin:billLoginHandler.redirectCCOutLogin,
        system: {
            getClientMenu: systemHandler.getClientMenu,
            getClientDicCache: systemHandler.getClientDicCache,
            queryLogo:logoHandler.queryLogo,
            getLogoInfo:logoHandler.getLogoInfo,
            updateLogoInfo:logoHandler.updateLogoInfo,
            deleteLogo:logoHandler.deleteLogo
        },
        proxy:{
            queryFinanceStat:proxyFinanceHandler.queryFinanceStat,
            queryProxyFinanceDetail:proxyFinanceHandler.queryProxyFinanceDetail,
            queryProxyCallDetail:proxyFinanceHandler.queryProxyCallDetail,
            queryProxyCall400Detail:proxyFinanceHandler.queryProxyCall400Detail,
            //wwh
            queryUserIncomeList:myProxyIncomeHandler.queryUserIncomeList,
            getSysUserInfo:myProxyIncomeHandler.getSysUserInfo,
            queryProxySmsDetail:proxyFinanceHandler.queryProxySmsDetail,

            queryProxyAccInfo:batchPayHandler.queryProxyAccInfo,
            batchPay:batchPayHandler.batchPay,
            batchSetMinConsume:batchPayHandler.batchSetMinConsume
        },
        customerCare:{
            queryFinanceDetail:customerCareFinanceHandler.queryFinanceDetail,
            queryFinanceState:customerCareFinanceHandler.queryFinanceState,
        },
        consultant:{
            queryFinanceDetail:consultantFinanceHandler.queryFinanceDetail,
            queryFinanceState:consultantFinanceHandler.queryFinanceState,
        },
        //wwh
        cdr:{
            queryCdrLineFeeDetail:cdrLineHandler.queryCdrLineFeeDetail,
            queryLineFeeStat:cdrLineHandler.queryLineFeeStat,
            queryCdrLineDetail:cdrLineHandler.queryCdrLineDetail
        },
        report:{
            queryWeekReport:operate.queryWeekReport,
            queryMonthReport:operate.queryMonthReport,
            queryGlobalReport:channelHandler.queryGlobalReport,
            queryAnalyseReport:channelHandler.queryAnalyseReport,
            queryAreaWeekReport:areaHandler.queryAreaWeekReport,
            queryAreaMonthReport:areaHandler.queryAreaMonthReport,
            queryPersonalMonthReport:personalHandler.queryPersonalMonthReport,
            queryPersonalSeasonReport:personalHandler.queryPersonalSeasonReport,
            queryIncomAnalysisReport:incomAnalysisHandler.queryIncomAnalysisReport

        },
        account: {
            querySmsSignList:accountHandler.querySmsSignList,
            querySmsTempleteList : accountHandler.querySmsTempleteList,
            querySmsEditList:accountHandler.querySmsEditList,
            addSmsSign:accountHandler.addSmsSign,
            addSmsTemplete:accountHandler.addSmsTemplete,
            addSmsEdit:accountHandler.addSmsEdit,
            getSmsSignByAccount:accountHandler.getSmsSignByAccount,
            getSmsTempleteById:accountHandler.getSmsTempleteById,
            getSmsEditByAccount:accountHandler.getSmsEditByAccount,
            updateSmsSign:accountHandler.updateSmsSign,
            updateSmsTemplete:accountHandler.updateSmsTemplete,
            updateSmsEdit:accountHandler.updateSmsEdit,
            deleteSmsSign:accountHandler.deleteSmsSign,
            deleteSmsTemplete:accountHandler.deleteSmsTemplete,
            deleteSmsEdit:accountHandler.deleteSmsEdit,
            setProductMinConsume:accountHandler.setProductMinConsume,
            queryGroupAccount:accountHandler.queryGroupAccount,
            addGroupAccount:accountHandler.addGroupAccount,
            updateGroupAccount:accountHandler.updateGroupAccount,
            deleteGroupAccount:accountHandler.deleteGroupAccount,


            getAccountProductInfoById : accountHandler.getAccountProductInfoById,
            getSystemUserInfoById : accountHandler.getSystemUserInfoById,
            getAccountInfoById : accountHandler.getAccountInfoById,
            getFinanceAccountInfoById: accountHandler.getFinanceAccountInfoById,
            setIsRecord: accountHandler.setIsRecord,
            setCCRecord: accountHandler.setCCRecord,
            setCCCdrDay: accountHandler.setCCCdrDay,
            setSmsChannel:accountHandler.setSmsChannel,
            setZJLine:accountHandler.setZJLine,
            setSmsPwd:accountHandler.setSmsPwd,
            setSmsDispatch:accountHandler.setSmsDispatch,
            setZJMoreSn:accountHandler.setZJMoreSn,
            stopAccount: accountHandler.stopAccount,
            reopenAccount: accountHandler.reopenAccount,
            updateCCConcurrent: accountHandler.updateCCConcurrent,
            createNewAccount: accountHandler.createNewAccount,
            openAccountProduct : accountHandler.openAccountProduct,
            openAccountCustFeeProduct:accountHandler.openAccountCustFeeProduct,
            updateAccountProduct : accountHandler.updateAccountProduct,
            updateAccountCustFeeProduct : accountHandler.updateAccountCustFeeProduct,
            getProductAndLicenceById:accountHandler.getProductAndLicenceById,
            getAccountProductById : accountHandler.getAccountProductById,
            queryAccount: accountHandler.queryAccount,
            updateAccountInfo: accountHandler.updateAccountInfo,
            getAccountSetInfo: accountHandler.getAccountSetInfo,
            getAccountProductInfo : accountHandler.getAccountProductInfo,
            getAccountBusinessTagInfo : accountHandler.getAccountBusinessTagInfo,
            updateAccountBusinessTag : accountHandler.updateAccountBusinessTag,
            updateAccountSetCallSum : accountHandler.updateAccountSetCallSum,
            savaOverdrawConfig: accountHandler.savaOverdrawConfig,
            queryAccountSetLog: accountHandler.queryAccountSetLog,
            saveAlertConfig: accountHandler.saveAlertConfig,
            saveInvoiceSet: accountHandler.saveInvoiceSet,
            addGatewaySipNum: accountHandler.addGatewaySipNum,
            queryCallAccountSum:accountHandler.queryCallAccountSum,
            addGatewaySipNumByUcenter: accountHandler.addGatewaySipNumByUcenter,
            updateZJSipNumByUcenter: accountHandler.updateZJSipNumByUcenter,
            updateZJSipNumCodesByUcenter:accountHandler.updateZJSipNumCodesByUcenter,
            deductCCMinConsume:accountHandler.deductCCMinConsume,
            backoutCCMinConsume:accountHandler.backoutCCMinConsume,
            openSingleCallSum:accountHandler.openSingleCallSum,
            openAccountCallSum:accountHandler.openAccountCallSum,
            queryPbxByAccountId:accountHandler.queryPbxByAccountId,
            setCCRecordRights:accountHandler.setCCRecordRights,
            query: {
                queryTelRecord: accountQueryHandler.queryTelRecord,
                queryCcTelRecord : accountQueryHandler.queryCcTelRecord,
                queryFeeRecord: accountQueryHandler.queryFeeRecord,
                queryProxyFeeRecord:accountQueryHandler.queryProxyFeeRecord
            },
            addAccountViaProxy:registerHandler.addAccountViaProxy,
            queryCostRecord:accountQueryHandler.queryCostRecord,
            queryProxyCostRecord:accountQueryHandler.queryProxyCostRecord,
            queryNormalServiceNoList:billServiceNoHandler.queryNormalServiceNoList,
            querySet400ServiceNoList:billServiceNoHandler.querySet400ServiceNoList,
            lockServiceNo:billServiceNoHandler.lockServiceNo,
            setSnMonthRent:billServiceNoHandler.setSnMonthRent,
            querySnSetLog:billServiceNoHandler.querySnSetLog,
            checkNopayServiceNo:billServiceNoHandler.checkNopayServiceNo,
            getServiceNoById:billServiceNoHandler.getServiceNoById,
            getSystemInfoById:billServiceNoHandler.getSystemInfoById,
            reSelectServiceNo:billServiceNoHandler.reSelectServiceNo,
            //balancePay:billPayHandler.balancePay,
            pay2AccByProxy:billPayHandler.pay2AccByProxy,//代理给客户充值
            turnBalance: billPayHandler.turnBalance,//账户退费,运维功能
            borrowAccount:billPayHandler.borrowAccount,//A账户拆借钱给B账户，运维功能
            bindFinanceAccount: billPayHandler.bindFinanceAccount, // 绑定财务账户
            unbindFinanceAccount: billPayHandler.unbindFinanceAccount, // 解绑财务账户
            balanceRefund:billPayHandler.balanceRefund,//代理下客户退钱给代理，运维功能
            pay2AccByUser:billPayHandler.pay2AccByUser,//管理员给客户充值
            pay2ProxyByUser : billPayHandler.pay2ProxyByUser,//管理员给代理充值
            deductionFeeByUser : billPayHandler.deductionFeeByUser,//管理员给客户扣费，运维功能
            supplementDeductionMinConsume : billPayHandler.supplementDeductionMinConsume,//补扣低消
            revocationMinConsume : billPayHandler.revocationMinConsume,//撤消低消,
            queryDisplayNumRecord : displayNumRecordHandler.queryDisplayNumRecord,
            addDisplayNumRecord : displayNumRecordHandler.addDisplayNumRecord,
            updateDisplayNumRecord : displayNumRecordHandler.updateDisplayNumRecord,
            removeDisplayNumRecord : displayNumRecordHandler.removeDisplayNumRecord,

            queryIndustry:industryHandler.queryIndustry,
            findIndustry:industryHandler.findIndustry,
            updateIndustry:industryHandler.updateIndustry,
            removeIndustry:industryHandler.removeIndustry,
            addIndustry:industryHandler.addIndustry,
            queryYtxSmsTemplate:ytxSmsTemplateHandler.queryYtxSmsTemplate,
            syncYtxSmsTemplate:ytxSmsTemplateHandler.syncYtxSmsTemplate,
        },
        hp:{
            setSnLine2Hp:billServiceNoHandler.setSnLine2Hp,
            hpPay:billPayHandler.hpPay,
            lockServiceNo2Hp:billServiceNoHandler.lockServiceNo2Hp
        },
        resource: {
            queryOpenIntlFeeHistory:openIntlFeeHandler.queryOpenIntlFeeHistory,
            addIntlFeeNum:openIntlFeeHandler.addIntlFeeNum,
            deleteIntlFee:openIntlFeeHandler.deleteIntlFee,

            addFilingNum: filingYunHandler.addFilingNum,
            queryFilingHistory: filingYunHandler.queryFilingHistory,


            showStopAccInfo: serviceNumHandler.showStopAccInfo,
            freeStopServiceNo: serviceNumHandler.freeStopServiceNo,
            stopServiceNum: serviceNumHandler.stopServiceNum,
            stopServiceFlag: serviceNumHandler.stopServiceFlag,
            getSerNumById: serviceNumHandler.getSerNumById,
            queryServiceNum: serviceNumHandler.queryServiceNum,
            queryServiceNumDb : serviceNumHandler.queryServiceNumDb,
            getServiceNumInfo: serviceNumHandler.getServiceNumInfo,
            addServiceNum: serviceNumHandler.addServiceNum,
            updateServiceNum: serviceNumHandler.updateServiceNum,
            updateServiceNumInit : serviceNumHandler.updateServiceNumInit,
            deleteServiceNum: serviceNumHandler.deleteServiceNum,
            freeStopServiceNumByAccountId:serviceNumHandler.freeStopServiceNumByAccountId,
            querySipNum: sipNumHandler.querySipNum,
            getSipNumInfo: sipNumHandler.getSipNumInfo,
            updateSipNum: sipNumHandler.updateSipNum,
            queryQueue: queueHandler.queryQueue,
            queryNum400: num400Handler.queryNum400,
            getNum400Info: num400Handler.getNum400Info,
            addNum400: num400Handler.addNum400,
            updateNum400: num400Handler.updateNum400,
            updateNum400Init : num400Handler.updateNum400Init,
            deleteNum400: num400Handler.deleteNum400,
            useNum400: num400Handler.useNum400,
            queryLine: lineHandler.queryLine,
            getLineInfo: lineHandler.getLineInfo,
            addLine: lineHandler.addLine,
            updateLine: lineHandler.updateLine,
            deleteLine: lineHandler.deleteLine,
            getCheckSms:smsCheckHandler.getCheckSms,
            getCheckedSms:smsCheckHandler.getCheckedSms,
            checkSmsByUser:smsCheckHandler.checkSmsByUser,
            getCheckSmsById:smsCheckHandler.getCheckSmsById,
            updateSmsSend_pass:lineHandler.updateSmsSend_pass,
            updateSmsSend_unpass:lineHandler.updateSmsSend_unpass,

            querySmsChannel:smsChannelHandler.querySmsChannel,
            updateSmsChannel:smsChannelHandler.updateSmsChannel,
            removeSmsChannel:smsChannelHandler.removeSmsChannel,
            addSmsChannel:smsChannelHandler.addSmsChannel,
            addDialCountNum:dialCountNumHandler.addDialCountNum,
            queryDialCount:dialCountNumHandler.queryDialCount,
            queryCallSum:dialCountNumHandler.queryCallSum,
            queryDialId:dialCountNumHandler.queryDialId,
            removeDialCount:dialCountNumHandler.removeDialCount,
            updateDialCount:dialCountNumHandler.updateDialCount,
            updateDialCountAcc:dialCountNumHandler.updateDialCountAcc,
            queryAccountCount:dialCountNumHandler.queryAccountCount,
            removeAccountCount:dialCountNumHandler.removeAccountCount,
            updateDialCountAcc:dialCountNumHandler.updateDialCountAcc,
            updateDialCountAccSet:dialCountNumHandler.updateDialCountAccSet,
            queryCompanyName:dialCountNumHandler.queryCompanyName,

            querySmsExamine:smsExamineHandler.querySmsExamine,
            updateSmsExamine:smsExamineHandler.updateSmsExamine,
            updateNoSmsExamine:smsExamineHandler.updateNoSmsExamine,
            querySmsExamineMessages:smsExamineHandler.querySmsExamineMessages,
            addCommunicate :smsExamineHandler.addCommunicate,
            queryTemplateType :smsExamineHandler.queryTemplateType,

            queryIntl:intlHandler.queryIntl,
            findIntl:intlHandler.findIntl,
            updateIntl:intlHandler.updateIntl,
            removeIntl:intlHandler.removeIntl,
            addIntl:intlHandler.addIntl,

            queryServiceNumWhiteList:serviceNumWhiteListHandler.queryServiceNumWhiteList,
            updateServiceNumWhiteList:serviceNumWhiteListHandler.updateServiceNumWhiteList,
            removeServiceNumWhiteList:serviceNumWhiteListHandler.removeServiceNumWhiteList,
            addServiceNumWhiteList:serviceNumWhiteListHandler.addServiceNumWhiteList,

            getSmsInfo: accountHandler.getSmsInfo,
            cc :{
                addPbx: pbxHandler.addCcPbx,
                batchAddPbx : pbxHandler.batchCcAddPbx,
                updatePbx: pbxHandler.updateCcPbx,
                queryPbx: pbxHandler.queryCcPbx,
                queryBoard: boardHandler.queryCcBoard,
                deleteBoard: boardHandler.deleteCcBoard,
                updateBoard: boardHandler.updateCcBoard,
                //queryBoardInfo: boardHandler.queryBoardInfo,
                addBoard: boardHandler.addCcBoard,
                getPbxInfo: pbxHandler.getCcPbxInfo,
                queryBoardInfo: boardHandler.queryCcBoardInfo,
                queryBoardOutRoute : boardHandler.queryCcBoardOutRoute,
                addBoardOutRoute : boardHandler.addCcBoardOutRoute,
                queryBoardOutRouteInfo : boardHandler.queryCcBoardOutRouteInfo,
                updateBoardOutRoute : boardHandler.updateCcBoardOutRoute,
                deleteBoardOutRoute : boardHandler.deleteCcBoardOutRoute,


                queryBoardOutLine : boardHandler.queryCcBoardOutLine,
                addBoardOutLine : boardHandler.addCcBoardOutLine,
                queryBoardOutLineInfo : boardHandler.queryCcBoardOutLineInfo,
                updateBoardOutLine : boardHandler.updateCcBoardOutLine,
                deleteBoardOutLine : boardHandler.deleteCcBoardOutLine,


                queryBoardInRoute : boardHandler.queryCcBoardInRoute,
                addBoardInRoute : boardHandler.addCcBoardInRoute,
                queryBoardInRouteInfo : boardHandler.queryCcBoardInRouteInfo,
                updateBoardInRoute : boardHandler.updateCcBoardInRoute,
                deleteBoardInRoute : boardHandler.deleteCcBoardInRoute,

                queryBoardServer : boardHandler.queryCcBoardServer,
                addBoardServer : boardHandler.addCcBoardServer,
                queryBoardServerInfo : boardHandler.queryCcBoardServerInfo,
                updateBoardServer : boardHandler.updateCcBoardServer,
                deleteBoardServer : boardHandler.deleteCcBoardServer,

                effectRoute : boardHandler.effectCcRoute

            },
            zj:{
                addPbx: pbxHandler.addPbx,
                batchAddPbx : pbxHandler.batchAddPbx,
                updatePbx: pbxHandler.updatePbx,
                queryPbx: pbxHandler.queryPbx,
                getPbxInfo: pbxHandler.getPbxInfo,
                queryBoard: boardHandler.queryBoard,
                deleteBoard: boardHandler.deleteBoard,
                updateBoard: boardHandler.updateBoard,
                queryBoardInfo: boardHandler.queryBoardInfo,
                addBoard: boardHandler.addBoard,
                queryLocation: locationHandler.queryLocation,
                addLocation: locationHandler.addLocation,
                updateLocation: locationHandler.updateLocation,
                deleteLocation: locationHandler.deleteLocation,
                queryLoactionBuilding: locationHandler.queryLoactionBuilding,
                addBuilding: locationHandler.addBuilding,
                updateBuilding: locationHandler.updateBuilding,
                deleteBuilding: locationHandler.deleteBuilding,
                getBuildingInfo: locationHandler.getBuildingInfo,
                getLocationInfo: locationHandler.getLocationInfo,

                queryBoardOutRoute : boardHandler.queryBoardOutRoute,
                addBoardOutRoute : boardHandler.addBoardOutRoute,
                queryBoardOutRouteInfo : boardHandler.queryBoardOutRouteInfo,
                updateBoardOutRoute : boardHandler.updateBoardOutRoute,
                deleteBoardOutRoute : boardHandler.deleteBoardOutRoute,

                queryBoardOutLine : boardHandler.queryBoardOutLine,
                addBoardOutLine : boardHandler.addBoardOutLine,
                queryBoardOutLineInfo : boardHandler.queryBoardOutLineInfo,
                updateBoardOutLine : boardHandler.updateBoardOutLine,
                deleteBoardOutLine : boardHandler.deleteBoardOutLine,

                queryBoardServer : boardHandler.queryBoardServer,
                addBoardServer : boardHandler.addBoardServer,
                queryBoardServerInfo : boardHandler.queryBoardServerInfo,
                updateBoardServer : boardHandler.updateBoardServer,
                deleteBoardServer : boardHandler.deleteBoardServer,

                effectRoute : boardHandler.effectRoute
            }
        },
        user: {
            queryUser: userHandler.queryUser,
            getUserInfo: userHandler.getUserInfo,
            updateUserInfo: userHandler.updateUserInfo
        },
        license: {
            queryLicense: licenseHandler.queryLicense
        },
        systemUser:{
            queryUserList:systemUserHandler.queryUserList,
            getUserSetInfo:systemUserHandler.getUserSetInfo,
            updateUserInfo:systemUserHandler.updateUserInfo,
            addUser:systemUserHandler.addUser,
            savaPriceConfig:systemUserHandler.savaPriceConfig,
            queryUserSetLog:systemUserHandler.queryUserSetLog,
            getMyInfo:systemUserHandler.getMyInfo,
            saveWithDraw:systemUserHandler.saveWithDraw,
            queryWithdrawList:systemUserHandler.queryWithdrawList,
            queryPayeeList:systemUserHandler.queryPayeeList,
            finishWithDraw:systemUserHandler.finishWithDraw,
            revertWithDraw:systemUserHandler.revertWithDraw,
            queryWithDrawInfo:systemUserHandler.queryWithDrawInfo,
            finishAskGwSip:systemUserHandler.finishAskGwSip,
            queryMylWithdraw:systemUserHandler.queryMylWithdraw,
            saveAskGwSip:systemUserHandler.saveAskGwSip,
            queryAskGwSip:systemUserHandler.queryAskGwSip,
            queryUserRole : systemUserHandler.queryUserRole,
            getUserRoleInfo : systemUserHandler.getUserRoleInfo,
            addUserRole : systemUserHandler.addUserRole,
            udpateUserRole : systemUserHandler.udpateUserRole,
            getRoleLimits : systemUserHandler.getRoleLimits,
            updateRoleLimits : systemUserHandler.updateRoleLimits,

            updateMyPwd : systemUserHandler.updateMyPwd,
            updateMyInfo : systemUserHandler.updateMyInfo,
            setAlertInfo : systemUserHandler.setAlertInfo,
            queryAdminWithdrawList : systemUserHandler.queryAdminWithdrawList,
            saveCallEvent2Proxy : systemUserHandler.saveCallEvent2Proxy,
            setGroupFinanceInfo : systemUserHandler.setGroupFinanceInfo,
            stopSysUser : systemUserHandler.stopSysUser,
        }
    },
    app: {
        getDicCache: cacheHandler.getDicCache,
        billLogin:billLoginHandler.billLogin,
        export:{
            exportXls:exportHandler.exportXls
        },
        agent: {
            getAgentList: agentHandler.getAgentList,
            getAgentById: agentHandler.getAgentById,
            getCallInternation:agentHandler.getCallInternation,
            updateAgent: agentHandler.updateAgent,
            addAgent: agentHandler.addAgent,
            getDidnumList: agentHandler.getDidnumList,
            bindDidNum: agentHandler.bindDidNum,
            cancelDidNum: agentHandler.cancelDidNum,
            batchAddAgent: agentHandler.batchAddAgent,
            batchUpdateCallerNum: agentHandler.batchUpdateCallerNum,
            batchUpdateCallInternaion:agentHandler.batchUpdateCallInternaion
        },
        accountSet:{
            updatePwd: accountSetHandler.updatePwd,
            queryAccProduct:accountSetHandler.queryAccProduct,
            saveNotifyConfig:accountSetHandler.saveNotifyConfig,
            getAccProductFee:accountSetHandler.getAccProductFee
        },
        account: {
            query400ServiceNoList: serviceNoHandler.query400ServiceNoList,
            queryServiceNoList: serviceNoHandler.queryServiceNoList,
            queryTestServiceNoList: serviceNoHandler.queryTestServiceNoList,
            queryMyServiceNo: serviceNoHandler.queryMyServiceNo,
            queryMyServer: serviceNoHandler.queryMyServer,
            getServiceNoById: serviceNoHandler.getServiceNoById,
            addServiceNo2Test: serviceNoHandler.addServiceNo2Test,
            addServiceNoCCTest: serviceNoHandler.addServiceNoCCTest,
            approveServiceNoTest: serviceNoHandler.approveServiceNoTest,
            updateServiceNo2Test: serviceNoHandler.updateServiceNo2Test,
            findServiceNumApprove:serviceNoHandler.findServiceNumApprove,
            updateServiceNum_pass:serviceNoHandler.updateServiceNum_pass,
            updateServiceNum_unpass:serviceNoHandler.updateServiceNum_unpass,
            //wwh
            resetTime:serviceNoHandler.resetTime,
            stopServiceno:serviceNoHandler.stopServiceno,
            changeStatus:serviceNoHandler.changeStatus,
            getAccountInfoById : serviceNoHandler.getAccountInfoById,

            lockServiceNo: serviceNoHandler.lockServiceNo,
            lockServiceNo400:serviceNoHandler.lockServiceNo400,
            getAccountInfoById: serviceNoHandler.getAccountInfoById,
            getFinanceAccountInfoById: serviceNoHandler.getFinanceAccountInfoById,
            reSelectServiceNo: serviceNoHandler.reSelectServiceNo,
            checkServiceNoExist: serviceNoHandler.checkServiceNoExist,
            checkNopayServiceNo: serviceNoHandler.checkNopayServiceNo,
            reSelect400ServiceNo:serviceNoHandler.reSelect400ServiceNo,
            get400ServiceNoById:serviceNoHandler.get400ServiceNoById,
            queryFreeSnList:serviceNoHandler.queryFreeSnList,
            queryFreeDidNumList:serviceNoHandler.queryFreeDidNumList,
            bindServiceNo:serviceNoHandler.bindServiceNo,

            stopNum:serviceNoHandler.stopNum,
            cancelStopNum:serviceNoHandler.cancelStopNum,

            confirmSelectZJNormalSn:serviceNoHandler.confirmSelectZJNormalSn,
            approveServiceNoZJTest:serviceNoHandler.approveServiceNoZJTest,

            getAccountInfo : accountHandler.getAccountInfo,
            auditIdentity : accountHandler.auditIdentity
//            queryMyCCTel:serviceNoHandler.queryMyCCTel,
//            queryMyCCServiceNo:serviceNoHandler.queryMyCCServiceNo,
//            queryCCServiceNoList:serviceNoHandler.queryCCServiceNoList,
//            getCCServiceNoById:serviceNoHandler.getCCServiceNoById,
//            addCCServiceNo2Test:serviceNoHandler.addCCServiceNo2Test,
//            reSelectCCServiceNo:serviceNoHandler.reSelectCCServiceNo
        },
        tel: {
            getMyServiceNo: ivrHandler.getMyServiceNo,
            getCallInfo: ivrHandler.getCallInfo,
            editTime: ivrHandler.editTime,
            setIvr: ivrHandler.setIvr,
            setAgent: ivrHandler.setAgent,
            setServiceAgent: ivrHandler.setServiceAgent,
            setW: ivrHandler.setW,
            send400:ivrHandler.send400,
            deleteZJServiceNo:ivrHandler.deleteZJServiceNo
        },
        pay: {
            updateRenewLicence:payHandler.updateRenewLicence,
            balancePay: payHandler.balancePay,//余额消费
            outcallLicenceBalancePay:payHandler.outcallLicenceBalancePay,
            LicenceBalancePay: payHandler.LicenceBalancePay,
            custFeeBalancePay: payHandler.custFeeBalancePay,
            startAutoRenew: payHandler.startAutoRenew,
            balancePay2ZJMonthRent: payHandler.balancePay2ZJMonthRent,
            balancePay2ZJConcurrent: payHandler.balancePay2ZJConcurrent,
            balancePay2CCMonthRent: payHandler.balancePay2CCMonthRent
        },
        batch: {
            getNumList: batchDialHandler.getNumList,
            startDial: batchDialHandler.startDial,
            removeTodoList: batchDialHandler.removeTodoList,
            getNumCount: batchDialHandler.getNumCount,
            getBatchNoReport:batchDialReportHandler.getBatchNoReport
        },
        fax :{
            getNumList: batchFaxHandler.getNumList,
            getNumCount: batchFaxHandler.getNumCount,
            getBatchNoReport : batchFaxReportHandler.getBatchNoReport,
            removeTodoList: batchFaxHandler.removeTodoList,
            startDial: batchFaxHandler.startDial
        },
        hangUpSms : {
            getHangUpSmsTemplateAndSet : hangUpSmsHandler.getHangUpSmsTemplateAndSet,
            saveHangUpSmsSet : hangUpSmsHandler.saveHangUpSmsSet,
            updateDefaultTemplate : hangUpSmsHandler.updateDefaultTemplate,
            deleteTemplate : hangUpSmsHandler.deleteTemplate,
            addHangUpSmsTemplate : hangUpSmsHandler.addHangUpSmsTemplate,
            getTemplateById : hangUpSmsHandler.getTemplateById,
            updateHangUpSmsTemplate : hangUpSmsHandler.updateHangUpSmsTemplate
        },
        fee: {
            getPayList: feeHandler.getPayList,
            getCallsheetList: feeHandler.getCallsheetList,
            getBankPayList:feeHandler.getBankPayList,
            queryCallSheet2CC:feeHandler.queryCallSheet2CC
            //backoutSysPay:feeHandler.backoutSysPay
        },
        licence:{
            getAllLicenceList:licenceHandler.getAllLicenceList,
            getLicenceList:licenceHandler.getLicenceList,
            getLicenceById:licenceHandler.getLicenceById,
            getLicenceCount:licenceHandler.getLicenceCount,
            addLicence2Test:licenceHandler.addLicence2Test,
            updateLicence2Test:licenceHandler.updateLicence2Test,
            //wwh
            resetLicenceTime:licenceHandler.resetLicenceTime,
            changeLicenceStatus:licenceHandler.changeLicenceStatus,
            deleteLicence:licenceHandler.deleteLicence,
            queryLicenceOpRecords: licenceHandler.queryLicenceOpRecords
        },
        custFee:{
            getCustFeeList:custFeeHandler.getCustFeeList,
        },
        sipNo:{
            querySipNumByUcenter: sipNumHandler.querySipNumByUcenter,
            refreshSipNoStatus: sipNumHandler.refreshSipNoStatus
        },
        accFee:{
            getAccountMonthList:accountFeeHandler.getAccountMonthList,
            getSmsMonthFeeById:accountFeeHandler.getSmsMonthFeeById,
            getSmsMonthDetailList:accountFeeHandler.getSmsMonthDetailList,
            getMonthDetailList:accountFeeHandler.getMonthDetailList,
            getMonthFeeById:accountFeeHandler.getMonthFeeById,
            getllMonthFeeById:accountFeeHandler.getllMonthFeeById,
            getllMonthDetailList:accountFeeHandler.getllMonthDetailList,
            getConsumeById:accountFeeHandler.getConsumeById,
            getyyMonthFeeById:accountFeeHandler.getyyMonthFeeById,
            getyyMonthDetailList:accountFeeHandler.getyyMonthDetailList,
        },
        thirdCustom:{
            getDomainInfoById:thirdCustomHandler.getDomainInfoById
        },
        invoice:{
            getAddrList:invoiceHandler.getAddrList,
            addAddr:invoiceHandler.addAddr,
            getAddrById:invoiceHandler.getAddrById,
            updateAddr:invoiceHandler.updateAddr,
            delAddr:invoiceHandler.delAddr,

            getInfoList:invoiceHandler.getInfoList,
            addInfo:invoiceHandler.addInfo,
            getInfoById:invoiceHandler.getInfoById,
            updateInfo:invoiceHandler.updateInfo,
            updateInfoDefault:invoiceHandler.updateInfoDefault,
            delInfo:invoiceHandler.delInfo,

            getNoInvoiceList:invoiceHandler.getNoInvoiceList,
            getInvoiceByPayId:invoiceHandler.getInvoiceByPayId,
            getDealInvoiceList:invoiceHandler.getDealInvoiceList,
            saveGetInvoice:invoiceHandler.saveGetInvoice,

            queryInvoiceList:invoiceHandler.queryInvoiceList,
            getInvoiceById:invoiceHandler.getInvoiceById,

            queryInvoiceList2Bill:invoiceHandler.queryInvoiceList2Bill,
            dealInvoice:invoiceHandler.dealInvoice,
            updateInvoice:invoiceHandler.updateInvoice
        },
        qiniu:{
            getUptoken:qiniuHandler.getUptokenByClient
        },
        smsTemplateToCheck:{
            postSmsTemplate:smsTemplateToCheckHandler.postSmsTemplate,
            updateSmsTemplateToCheck:smsTemplateToCheckHandler.updateSmsTemplateToCheck,
            querySmsTemplateToCheck:smsTemplateToCheckHandler.querySmsTemplateToCheck,
            querySmsTemplateToCheckMessage:smsTemplateToCheckHandler.querySmsTemplateToCheckMessage,
            addSmsTemplateToCheckMessages:smsTemplateToCheckHandler.addSmsTemplateToCheckMessages,
            cancelSmsTemplateToCheck:smsTemplateToCheckHandler.cancelSmsTemplateToCheck,
            getCCDicCodes:smsTemplateToCheckHandler.getCCDicCodes,
            getAccountSigns:smsTemplateToCheckHandler.getAccountSigns
        }
    }
}

var impl = {
    processUnknowAction: function (action, res) {
        var result = {};
        result.success = false;
        result.message = 'action[' + action.name + '] is not support!';
        utils.sendResult(result, res , action._aid);
    }
}

var actionHandler = {
    handleAction: function (action, session, res) {
        try {
            var actionFun = eval('actions.' + action.name);
            if (actionFun) {
                actionFun(action.data, session, function (result) {
                    result.success = result.success || false;
                    result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                    utils.sendResult(result, res , action._aid);
                });

            } else {
                impl.processUnknowAction(action, res);
            }

        } catch (e) {
            logger.app.error(e);
            utils.sendResult({success: false, message: e.message}, res , action._aid);
        }
    }
}

module.exports = actionHandler;
