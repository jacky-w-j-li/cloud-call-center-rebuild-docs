var handlerDir = __baseDir + '/dishui';
var logger = require('appLog');
var utils = require('appUtil/Utils');
var service_platformSync = require(handlerDir + '/common/platformSync');
var fields = require(__baseDir + '/dishui/common/Fields');
var appSession = require('appSession');

var extensionHandler = require(handlerDir + '/config/ivr/ExtensionHandler');
var accountHandler = require(handlerDir+'/common/billInterface/accountServiceHandler');
var app_user_handler = require(handlerDir + '/app/user/UserHandler');
var serviceNoHandler = require(handlerDir + '/config/ivr/ServiceNoHandler');
var manager_account_pbx_handler = require(handlerDir + '/config/account/AccountPbxHandler');
var ass_handler = require(handlerDir + '/config/ass/AssHandler');
var ivr_user_handler = require(handlerDir + '/config/ivr/UserHandler');
var multi_channel_handler = require(handlerDir + '/app/multiChannel/MultiChannelHandler');
var email_channel_handler = require(handlerDir + '/app/multiChannel/EmailChannelHandler');
var app_business_handler = require(handlerDir + '/app/business/BusinessHandler');
var app_customer_handler = require(handlerDir + '/app/customer/CustomerHandler');
var app_workbench_handler = require(handlerDir + '/app/workbench/WorkbenchHandler.js');
var mobile_report_handler = require(handlerDir + '/app/report/MobileReportHandler.js');
var app_customer_history_handler = require(handlerDir + '/app/customer/CustomerHistoryHandler');
var clinetMenuHandler = require(__baseDir + "/dishui/common/clientMenu/ClientMenuHandler");
var custHandler = require(__baseDir + '/dishui/app/customer/CustomerHandler');
var notifyHandler = require(handlerDir + '/common/NotifyHandler');
var webchat_handler = require(handlerDir + '/app/webchat/WebchatHandler');
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
    assUpdateAliyunOssCdrFileServer: ass_handler.assUpdateAliyunOssCdrFileServer,
    multiAccountCallMemoryByProxy: ass_handler.multiAccountCallMemoryByProxy,
    editUserForIm: ivr_user_handler.editUserForIm,
    openThirdPartyEditUser: ivr_user_handler.openThirdPartyEditUser,

    typeNoticeFromCustomer:multi_channel_handler.typeNoticeFromCustomer,
    NewWebchat: multi_channel_handler.receiveWebchat,
    getImCsrConfig: multi_channel_handler.getImCsrConfig,
    newEmail: email_channel_handler.receiveEmail,
    updateLogoutMailAutoClaimTime: email_channel_handler.updateLogoutMailAutoClaimTime,
    emailNotify: email_channel_handler.notifyAgent,
    getImCsr:multi_channel_handler.getImCsr,
    webchat: {
        autoCloseWebchatSession: webchat_handler.autoCloseWebchatSession,
        weixinRemindMsg:webchat_handler.weixinRemindMsg
    },

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
        delBusAttach: app_business_handler.delBusAttach,
        delBusAttach: app_business_handler.delBusAttach,
        getWorkbenchInfo: app_workbench_handler.getWorkbenchInfo,
        getMobileReport: mobile_report_handler.getMobileReport,
        customer: {
            queryCustPage2In:app_customer_handler.queryCustPage2In,
            queryCustInfo: app_customer_handler.queryCustInfo,
            addCustomer: app_customer_handler.addCustomer,
            updateCustomer: app_customer_handler.updateCustomer,
            updateCustomerStatusOrSource: app_customer_handler.updateCustomerStatusOrSource,
            updateCustForOwner:app_customer_handler.updateCustForOwner,

            queryCustNote: app_customer_handler.queryCustNote,
            addNote: app_customer_handler.addNote,
            updateNote:app_customer_handler.updateNote,
            dealNote:app_customer_handler.dealNote,
            queryCustCommonHistory : app_customer_history_handler.queryCustCommonHistory
        },
    },
    notify:{
        customerPlanNotify:notifyHandler.customerPlanNotify,
        quesNotify:notifyHandler.quesNotify,
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
    // mongo.db('mobile_assistant').collection("user_session").findOne({_id:service.data.sessionId}, function (err, doc) {
    //     if(!err && doc){
    //         result.success = true;
    //         result.session = doc;
    //         callback(result);
    //     }else {
            mongo.db('bill').collection('platform_user').findOne({_id:service.data.sessionId}, function(err, user) {
                if(!err && user) {
                    mongo.db('bill').collection('platform_account_product').findOne({account: user.account, product:'cc'}, function(err, account) {
                        if(!err && account) {
                            _setMobileSessionAuthority(user, account, callback);
                        }else {
                            callback(result);
                        }
                    });
                }else {
                    callback(result);
                }
            });
        // }
    // });
};

var _setMobileSessionAuthority = function(dbUser,dbAccount,callback){
    var result = {success: false,session:{}};
    clinetMenuHandler.getUserFunc(dbUser.role,function(rep){
        if(rep.success){
            dbUser.funcIds=rep.funcIds;
            dbUser.allFun=rep.allFun;
            dbUser.scope=rep.scope;
            mongo.db('bill').collection(fields.DB_PLATFORM_USER).find({account: dbUser.account},{fields:{_id:1,parentId:1,deptId:1}}).toArray(function (err, docs){
                if (!err) {
                    docs= docs||[];
                    dbUser.allAgents=docs;
                    var lowUsers=[dbUser._id];
                    var getMyAgent=function(pid){
                        for (var i = 0; i < docs.length; i++) {
                            var obj = docs[i];
                            if(obj.parentId==pid){
                                lowUsers.push(obj._id);
                                getMyAgent(obj._id);
                            }
                        }
                    }
                    getMyAgent(dbUser._id);
                    //dbUser.lowUsers=lowUsers;
                    dbUser.myLowUsers=lowUsers;//我和我的下属
                    //console.dir(lowUsers)
                    getDeptOrLevelUsers(dbAccount,dbUser,function (err){
                        if(!err){
                            mongo.db().collection(fields.DB_APP_CUSTOMER_POOL).find({account:dbUser.account}).toArray(function(err,seaList){
                                if (!err) {
                                    dbUser.allSeas = seaList || [];
                                    getUserSession(dbUser,dbAccount, function (err, session) {
                                        if (!err && session) {
                                            //console.dir(session);
                                            result.success = true;
                                            result.sessionId = session._id;
                                            result.session.user = dbUser;
                                            result.session.account = dbAccount;
                                            callback(result);
                                        } else {
                                            result.message = 'init session error!';
                                            callback(result);
                                        }
                                    });
                                }else{
                                    logger.app.error(err);
                                    callback(result);
                                }
                            });

                        }else{
                            result.message = 'getDeptOrLevelUsers error!';
                            callback(result);
                        }
                    });
                } else {
                    logger.app.error(err);
                    result.message="获取座席异常";
                    callback(result);
                }
            });
        }else{
            callback(rep);
        }
    });
};

function getDeptOrLevelUsers(dbAccount,dbUser,callback) {
    var allAgents=dbUser.allAgents;
    var userId=dbUser._id,deptId=dbUser.deptId,scope=dbUser.scope;
    mongo.db('bill').collection(fields.DB_PLATFORM_DEPARTMENT).find({account:dbAccount.account},{fields:{_id:1,pId:1,treePath:1,observer:1}}).toArray(function (err, depts){
        if (!err) {
            depts=depts||[];
            dbUser.allDeps=depts;
            var dataScope=[fields.data_scope_level,fields.data_scope_dept,fields.data_scope_deptLevel];
            var moduleUsers={};
            var scopeType={all:'all'};
            var getMyObservers=function(){
                var myObs=[];
                for (var i = 0; i < depts.length; i++) {
                    var obj = depts[i];
                    var observers=obj.observer||[];
                    for(var j=0;j<observers.length;j++){
                        if(observers[j]==userId){
                            myObs.push(obj._id);
                            break;
                        }
                    }
                }
                return myObs;
            }
            var getMyScopeUsers=function(myDeps){
                var lowUsersByDepts=[];
                if(myDeps.length>0){
                    var map={};
                    for(var i=0;i<myDeps.length;i++){
                        var id=myDeps[i];
                        map[id]=true;
                    }
                    for (var i = 0; i < allAgents.length; i++) {
                        var obj = allAgents[i];
                        if(map[obj.deptId]){
                            lowUsersByDepts.push(obj._id);
                        }
                    }
                }
                var scopeUsers=utils.distinctArray(dbUser.myLowUsers.concat(lowUsersByDepts));
                return scopeUsers;
            }
            dataScope.forEach(function(key){//获得每个权限级别的用户
                var myDeps=[];
                if(key==fields.data_scope_dept) {
                    myDeps=getMyObservers();
                    if(deptId){
                        myDeps=[deptId].concat(myDeps);
                    }
                }else if(key==fields.data_scope_deptLevel){
                    if(deptId){
                        for (var i = 0; i < depts.length; i++) {
                            var obj = depts[i];
                            var observers=obj.observer||[];
                            var treePath=obj.treePath||"";
                            var num=0;
                            for(var j=0;j<observers.length;j++){
                                if(observers[j]==userId){
                                    myDeps.push(obj._id);
                                    num++;
                                    break;
                                }
                            }
                            if(num<=0 && treePath.indexOf(deptId)!=-1){
                                myDeps.push(obj._id);
                            }
                        }
                    }else{
                        myDeps=getMyObservers();
                    }
                }else if(key==fields.data_scope_level){
                    myDeps=getMyObservers();
                }

                scopeType[key]=getMyScopeUsers(myDeps);
            })

            for(var k in scope){
                var _scope=scope[k];
                moduleUsers[k]=scopeType[_scope];
            }
            dbUser.moduleUsers=moduleUsers;
            //console.dir(dbUser.moduleUsers)
            callback(null);
        } else {
            logger.app.error(err);
            callback(err);
        }
    });
};

function getUserSession(user,account, cb) {
    var session = {_id: user._id, user: user,account:account};
    return cb(null,session);
}