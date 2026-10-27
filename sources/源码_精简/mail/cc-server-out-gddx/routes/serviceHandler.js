var handlerDir = __baseDir + '/dishui';
var logger = require('appLog');
var utils = require('appUtil/Utils');
var service_platformSync = require(handlerDir + '/common/platformSync');
var appSession = require('appSession');

var extensionHandler = require(handlerDir + '/config/ivr/ExtensionHandler');
var accountHandler = require(handlerDir+'/common/billInterface/accountServiceHandler');
var app_user_handler = require(handlerDir + '/app/user/UserHandler');
var serviceNoHandler = require(handlerDir + '/config/ivr/ServiceNoHandler');
var manager_account_pbx_handler = require(handlerDir + '/config/account/AccountPbxHandler');
var ass_handler = require(handlerDir + '/config/ass/AssHandler');
var ivr_user_handler = require(handlerDir + '/config/ivr/UserHandler');
var multi_channel_handler = require(handlerDir + '/app/multiChannel/MultiChannelHandler');
var app_business_handler = require(handlerDir + '/app/business/BusinessHandler');
var app_customer_handler = require(handlerDir + '/app/customer/CustomerHandler');
var notifyHandler = require(handlerDir + '/common/NotifyHandler');
var mongo = require('appDb/MongoDb');

var services ={
    platformSync :service_platformSync.handle,
    getLoginSession : appSession.getLoginSession,
    bindExten: extensionHandler.bindExten,
    updateCallLimit: accountHandler.updateCallLimit,
    updateGatewaySipNoCodes : extensionHandler.billUpdateGatewayCodes,
    'agent.updateAgent2IM' : app_user_handler.editUser2Im,
    updateBdTaskStatus: accountHandler.updateBdTaskStatus,
    releaseCCServiceNo: serviceNoHandler.releaseCCServiceNo,
    modifyAccountName: manager_account_pbx_handler.modifyAccountName,
    assGetQiNiuPushAccounts: ass_handler.assGetQiNiuPushAccounts,
    assGetQiNiuCdrByAcc: ass_handler.assGetQiNiuCdrByAcc,
    assGetQiNiuHandPushAccounts: ass_handler.assGetQiNiuHandPushAccounts,
    multiAccountCallMemoryByProxy: ass_handler.multiAccountCallMemoryByProxy,
    editUserForIm: ivr_user_handler.editUserForIm,
    openThirdPartyEditUser: ivr_user_handler.openThirdPartyEditUser,

    NewWebchat: multi_channel_handler.receiveWebchat,
    getImCsr:multi_channel_handler.getImCsr,
    mobileAssistant: {
        addBusinessTask: app_business_handler.addBusinessTask,
        getUnDealBusiness: app_business_handler.getUnDealBusiness,
        getRoleUnDealBusiness : app_business_handler.getRoleUnDealBusiness,
        getFinishedBusiness: app_business_handler.getFinishedBusiness,
        getAllBusiness : app_business_handler.getAllBusiness,
        getAssignedBusiness: app_business_handler.getAssignedBusiness,
        getFollowedBusiness: app_business_handler.getFollowedBusiness,
        getAllUncompleteBusiness : app_business_handler.getAllUncompleteBusiness,
        getAllFinishedBusiness : app_business_handler.getAllFinishedBusiness,
        getBusinessDetailById: app_business_handler.getBusinessDetailById,
        getBusinessInfoById : app_business_handler.getBusinessInfoById,
        excuteBusinessStepAction: app_business_handler.excuteBusinessStepAction,
        getCustomerLastBusiness: app_business_handler.getCustomerLastBusiness,
        getCustomerHistoryBusiness : app_business_handler.getCustomerHistoryBusiness,
        getCustomerBusiness : app_business_handler.getCustomerBusiness,
        excuteBusinessBackAction : app_business_handler.excuteBusinessBackAction,
        addBusinessBackInfo : app_business_handler.addBusinessBackInfo,
        exportBusiness : app_business_handler.exportBusiness,
        changeBusinessMaster : app_business_handler.changeBusinessMaster,
        setWaitforMessage : app_business_handler.setWaitforMessage,
        setTaskToMe : app_business_handler.setTaskToMe,
        addTempBusinessTask: app_business_handler.addTempBusinessTask,
        getBusinessCount : app_business_handler.getBusinessCount,
        deleteBusiness : app_business_handler.deleteBusiness,
        queryBusByScope : app_business_handler.queryBusByScope,
        getUnDealBusNum : app_business_handler.getUnDealBusNum,
        getRoleUnDealBuNum : app_business_handler.getRoleUnDealBuNum,
        readBusiness : app_business_handler.readBusiness,
        refreshUndealNum : app_business_handler.refreshUndealNum,
        queryCustInfo: app_customer_handler.queryCustInfo,
        delBusAttach: app_business_handler.delBusAttach
    },

    notify:{
        customerPlanNotify:notifyHandler.customerPlanNotify,
        saleChanceNotify:notifyHandler.saleChanceNotify,
        saleChanceManagerNotify:notifyHandler.saleChanceManagerNotify,
        recyleNotify:notifyHandler.recyleNotify,
        batchUpdateCustomerNotify:notifyHandler.batchUpdateCustomerNotify,
        auditNotify :  notifyHandler.auditNotify,
        adminRecyleNotify :  notifyHandler.adminRecyleNotify,
        adminAssignOutNotify :  notifyHandler.adminAssignOutNotify,
        adminAssignNotify :  notifyHandler.adminAssignNotify,
        adminBatchAssignNotify :  notifyHandler.adminBatchAssignNotify,
        adminBatchAssignOutNotify :  notifyHandler.adminBatchAssignOutNotify,
        batchImportAssignNotify :  notifyHandler.batchImportAssignNotify,
        batchRecyleNotify : notifyHandler.batchRecyleNotify,
        businessUserNotify : notifyHandler.businessUserNotify,
        businessExpireNotify : notifyHandler.businessExpireNotify
    }
}


exports.handleService = function(service,res){
    var serviceFun = eval('services.' + service.name);
    if (serviceFun) {
        try {
            if(service.name.indexOf('mobileAssistant') != -1){
                getMobileAssistantSession(service, function(sessionRes){
                    if(sessionRes.success){
                        delete service.data.sessionId;
                        delete service.data.action;
                        console.log('servicedata is:'+JSON.stringify(service.data));
                        serviceFun(service.data, sessionRes.session ,function (result) {
                            result.success = result.success || false;
                            result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                            utils.sendResult(result, res , service._aid);
                        });
                    }else{
                        var result = {
                            success : false,
                            message : 'session not found!'
                        }
                        utils.sendResult(result, res , service._aid);
                    }
                })
            }else{
                serviceFun(service.data, function (result) {
                    if(result.showView){
                        if(result.view && result.data){
                            res.render(result.view,result.data);
                        } else {
                            res.render("error.html",{});
                        }
                    } else {
                        result.success = result.success || false;
                        result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                        utils.sendResult(result, res , service._aid);
                    }
                });
            }
        } catch (e) {
            logger.app.error(e);
            utils.sendResult({success: false, message: e.message}, res , service._aid);
        }
    } else {
        processUnknowService(service, res);
    }
}

function processUnknowService(service, res) {
    var result = {};
    result.success = false;
    result.message = 'service[' + service.type + '] is not support!';
    utils.sendResult(result, res ,  service._aid);
}

function getMobileAssistantSession(service, callback){
    var result = {
        success : false
    }
    mongo.db('mobile_assistant').collection("user_session").findOne({_id:service.data.sessionId}, function (err, doc) {
        if(!err && doc){
            result.success = true;
            result.session = doc;
            callback(result);
        }else {
            mongo.db('bill').collection('platform_user').findOne({_id:service.data.sessionId}, function(err, user) {
                if(!err && user) {
                    mongo.db('bill').collection('platform_account_product').findOne({account: user.account, product:'cc'}, function(err, account) {
                        if(!err && account) {
                            var session = {
                                _id: user._id,
                                user: user,
                                account: account
                            };
                            result.success = true;
                            result.session = session;
                            callback(result);
                        }else {
                            callback(result);
                        }
                    });
                }else {
                    callback(result);
                }
            });
        }

    });
}