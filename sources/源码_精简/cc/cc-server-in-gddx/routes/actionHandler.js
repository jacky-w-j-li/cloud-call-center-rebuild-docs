var handlerDir = __baseDir + '/dishui';
var utils = require('appUtil/Utils');
var logger = require('appLog');
var globalCache = require(handlerDir + "/common/clientCache/GlobalCacheHandler");
var clinetMenuHandler = require(handlerDir + "/common/clientMenu/ClientMenuHandler");
var app_customer_handler = require(handlerDir + '/app/customer/CustomerHandler');
var app_task_handler = require(handlerDir + '/app/task/TaskHandler');
var app_export_handler = require(handlerDir + '/common/ExportHandler');
var app_import_handler = require(handlerDir + '/app/customer/CustomerImportHandler');
var app_popup_handler = require(handlerDir + '/app/customer/PopupHandler');
var app_call_report_handler = require(handlerDir + '/app/report/CallReportHandler');
var app_call_sheet_handler = require(handlerDir + '/app/callSheet/CallSheetHandler');
var app_phone_bar_config_handler = require(handlerDir + '/app/phoneBarConfig/PhoneBarConfigHandler');
var app_user_handler = require(handlerDir + '/app/user/UserHandler');

var app_businessReport_handler = require(handlerDir + '/app/report/BusinessReportHandler');
var app_customerReport_handler = require(handlerDir + '/app/report/CustomerReportHandler');
var app_customerTaskReport_handler = require(handlerDir + '/app/report/CustomerTaskReportHandler');
var batchDialHandler = require(handlerDir + '/app/batch/BatchDialHandler');
var batchDialReportHandler = require(handlerDir + '/app/batch/BatchDialReportHandler');
var batchTaskHandler = require(handlerDir + '/app/batch/BatchTaskHandler');
var customerChangeReporthandler = require(handlerDir + '/app/customer/CustomerChangeReportHandler');

var app_call_bill_handler = require(handlerDir + '/app/callBill/CallBillHandler');
var callRecordHandler = require(handlerDir + '/app/callRecord/CallRecordHandler');

var business_config_handler = require(handlerDir + "/config/business/BusinessHandler");
var manager_customer_handler = require(handlerDir + '/config/customer/CustomerHandler');
var manager_role_handler = require(handlerDir + '/config/role/RoleHandler');
var manager_dictionary_handler = require(handlerDir + '/config/dic/DictionaryHandler');
var manager_dept_handler = require(handlerDir + '/config/dept/DeptHandler');
var app_business_handler = require(handlerDir + '/app/business/BusinessHandler');
var manager_user_handler = require(handlerDir + '/config/user/UserHandler');

var app_kmcataloghandler=require(handlerDir+'/app/km/KmCatalogHandler');
var app_kmitemhandler=require(handlerDir+'/app/km/KmItemHandler');

var manager_ivr_handler = require(handlerDir + '/config/ivr/IvrHandler');
var manager_ivr_serviceNo_handler = require(handlerDir + '/config/ivr/ServiceNoHandler');
var manager_account_pbx_handler = require(handlerDir + '/config/account/AccountPbxHandler');
var manager_agent_handler = require(handlerDir + '/config/user/UserHandler');
var manager_queue_handler = require(handlerDir + '/config/ivr/SkillgroupHandler');
var manager_schedule_handler = require(handlerDir + '/config/ivr/ScheduleHandler');
var manager_var_handler = require(handlerDir + '/config/ivr/VarHandler');
var manager_line_handler = require(handlerDir + '/config/ivr/DialoutLineHandler');
var manager_sound_handler = require(handlerDir + '/config/ivr/SoundHandler');
var manager_announcement_handler = require(handlerDir + '/config/ivr/AnnouncementHandler');
var manager_ivr_node_handler = require(handlerDir + '/config/ivr/IvrNodeHandler');
var manager_ivr_sip_handler = require(handlerDir + '/config/ivr/ExtensionHandler');
var manager_validation_node_handler = require(handlerDir + '/config/ivr/ValidationHandler');
var manager_assignment_node_handler = require(handlerDir + '/config/ivr/AssignmentHandler');
var manager_system_node_handler = require(handlerDir + '/config/ivr/SystemHandler');
var manager_ivr_extension_peer_handler = require(handlerDir + '/config/ivr/ExtensionPeerHandler');
var manager_ivr_text_announcement_handler = require(handlerDir + '/config/ivr/TextAnnouncementHandler');
var manager_ivr_call_url_handler = require(handlerDir + '/config/ivr/CallUrlHandler');
var manager_ivr_route_handler = require(handlerDir + '/config/ivr/RouteHandler');
var manager_ivr_room_handler = require(handlerDir + '/config/ivr/RoomHandler');
var manager_ivr_menu_handler = require(handlerDir + '/config/ivr/IvrMenuHandler');
var manager_ivr_encrypt_md5_handler = require(handlerDir + '/config/ivr/EncryptMd5Handler');
var manager_ivr_voice_mail_handler = require(handlerDir + '/config/ivr/VoiceMailHandler');
var manager_ivr_satisfaction_handler = require(handlerDir + '/config/ivr/SatisfactionHandler');
var manager_agent_config_handler = require(handlerDir + '/config/ivr/UserHandler');
var manager_ivr_blacklist_handler = require(handlerDir + '/config/ivr/BlackListHandler');
var app_cdr_peer_handler = require(handlerDir + '/app/monitor/CdrPeerHandler');
var manager_interface_handler = require(handlerDir + '/config/interfaceUrl/InterfaceHandler');
var manager_tab_handler = require(handlerDir + '/config/tabUrl/TABHandler');
var manager_callInterHistory_handler = require(handlerDir + '/config/callInterHistory/CallInterHistoryHandler');
var manager_callUrl_handler = require(handlerDir + '/config/callUrl/CallUrlHandler');
var manager_callevent_handler = require(handlerDir + '/config/callEvent/CallEventHandler');
var manager_call_label= require(handlerDir + '/config/callLabel/CallLabelHandler');
var manager_ivr_phonebarconfig_handler = require(handlerDir + '/config/ivr/PhoneBarConfigHandler');
var manager_quality_check_handler = require(handlerDir + '/config/qualityCheck/QualityCheckHandler');
var manager_ivr_superDialJobNum_handler = require(handlerDir + '/config/ivr/SuperDialJobNumHandler');
var questionnaire_config_handler = require(handlerDir + '/config/questionnaire/QuestionnaireHandler');
var questionnaire_handler = require(handlerDir + '/app/questionnaire/QuestionnaireHandler');
var loginCheckHandler = require(handlerDir + '/config/account/LoginCheckHandler');
var manager_account_handler = require(handlerDir + '/config/account/AccountHandler');
var new_sms_handler = require(handlerDir + '/app/sms/NewSmsHandler');
var app_customer_task_handler = require(handlerDir + '/app/customer/CustomerTaskHandler');
var app_customer_approval_business_handler = require(handlerDir + '/app/customer/CustomerApprovalBusinessHandler');
var app_customer_titket_handler = require(handlerDir + '/app/customer/CustomerTitketHandler');
var app_customer_task_import_handler = require(handlerDir + '/app/customer/CustomerTaskImportHandler');
var manager_email_handler = require(handlerDir + '/config/channel/EmailHandler');
var manager_weixin_handler = require(handlerDir + '/config/channel/WeixinHandler');
var emailHandler = require(__baseDir + '/dishui/app/email/EmailHandler');
var signHandler = require(__baseDir + '/dishui/app/email/SignHandler');
var weixinHandler = require(__baseDir + '/dishui/app/weixin/WeixinHandler');
var qiniuHandler = require(__baseDir + '/dishui/app/qiniu/QiniuHandler');
var manager_webchat_handler = require(handlerDir + '/config/channel/WebchatHandler');
var manager_robot_handler = require(handlerDir + '/config/channel/RobotHandler');
var manager_faq_handler = require(handlerDir + '/config/channel/ChannelFaqHandler');
var webchatHandler = require(__baseDir + '/dishui/app/webchat/WebchatHandler');
var multi_channel_handler = require(handlerDir + '/app/multiChannel/MultiChannelHandler');
var channel_dic_handler = require(handlerDir + '/config/channelDic/ChannelDicHandler');
var app_customer_history_handler = require(handlerDir + '/app/customer/CustomerHistoryHandler');
var workbenchHandler = require(handlerDir + '/app/workbench/WorkbenchHandler');
var monitorHandler = require(handlerDir + '/app/monitor/MonitorHandler');
var channelGlobalSetHandler = require(handlerDir + '/config/channel/ChannelGlobalSetHandler');
//快捷回复
var manager_quickReply_handler = require(handlerDir + '/config/channel/QuickReplyHandler');
var manager_quickReplyImport_handler = require(handlerDir + '/config/channel/QuickReplyImportHandler');

var customerCommonHandler = require(handlerDir + '/config/customerCommon/CustomerCommonHandler');
var customerApprovalHandler = require(handlerDir + '/config/customerApproval/CustomerApprovalHandler');
//通话流程
var manager_process_handler = require(handlerDir + '/config/ivr/IvrProcessHandler');
//坐席电脑信息
var app_collect_handler = require(handlerDir + '/app/collect/CollectHandler');
var actions = {
    common: {
        getDicCache: globalCache.getDicCache,
        getMenu: clinetMenuHandler.getMenu,
        getUsrMenu: clinetMenuHandler.getUsrMenu,
        getUserInMenu: clinetMenuHandler.getUserInMenu,
        getUserOutMenu: clinetMenuHandler.getUserOutMenu
    },
    app: {
        customer: {
            task:{
                saveDialTask:app_customer_task_handler.saveDialTask,
                saveCustTask:app_customer_task_handler.saveCustTask,
                queryDialTaskList:app_customer_task_handler.queryDialTaskList,
                queryTaskList:app_customer_task_handler.queryTaskList,
                queryDialTaskById:app_customer_task_handler.queryDialTaskById,
                queryTaskById:app_customer_task_handler.queryTaskById,
                saveAgentsAssign:app_customer_task_handler.saveAgentsAssign,
                queryImportDetail:app_customer_task_handler.queryImportDetail,
                saveCustAssign:app_customer_task_handler.saveCustAssign,
                //getUserDialList:app_customer_task_handler.getUserDialList,
                statUserData:app_customer_task_handler.statUserData,
                removeDialTaskAgent:app_customer_task_handler.removeDialTaskAgent,
                removeTaskAgent:app_customer_task_handler.removeTaskAgent,
                reduceCustForAgent:app_customer_task_handler.reduceCustForAgent,
                getTaskImportBatch:app_customer_task_handler.getTaskImportBatch,
                queryDuplicateDataDetail:app_customer_task_handler.queryDuplicateDataDetail,
                getXlsHeads:app_customer_task_import_handler.getXlsHeads,
                exportCustomerTask:app_customer_task_handler.exportCustomerTask,
                import:app_customer_task_import_handler.import,
                closeDialTask:app_customer_task_handler.closeDialTask,
                showDailyTask:app_customer_task_handler.showDailyTask,
                saveDailyTask:app_customer_task_handler.saveDailyTask,
                queryCloseDialTaskList:app_customer_task_handler.queryCloseDialTaskList,
                queryNADataDetail:app_customer_task_handler.queryNADataDetail,
                queryDialedNumberTaskList:app_customer_task_handler.queryDialedNumberTaskList,
                queryCallSheet:app_customer_task_handler.queryCallSheet,
                exportDialSound:app_customer_task_handler.exportDialSound,
                archiveCustomer:app_customer_task_handler.archiveCustomer,
                queryAgentTaskList:app_customer_task_handler.queryAgentTaskList,
                queryTaskDetail:app_customer_task_handler.queryTaskDetail,
                queryCustByPhone:app_customer_task_handler.queryCustByPhone,
                queryAgentCalledTaskList:app_customer_task_handler.queryAgentCalledTaskList,
                queryAutoCallPhone:app_customer_task_handler.queryAutoCallPhone,
                convertDataByPhone:app_customer_task_handler.convertDataByPhone,
                queryCallSheetByCustSample : app_customer_task_handler.queryCallSheetByCustSample,
                updateSampleAndDaily : app_customer_task_handler.updateSampleAndDaily,
                updateSampleAndDailyDialInfo : app_customer_task_handler.updateSampleAndDailyDialInfo,
                queryDailyStats : app_customer_task_handler.queryDailyStats,
                currentPhoneErr : app_customer_task_handler.currentPhoneErr,
                generateCustStatByAccount : app_customer_task_handler.generateCustStatByAccount
            },
            titket:{
                queryCustTitketList : app_customer_titket_handler.queryCustTitketList,
                addCustTitket : app_customer_titket_handler.addCustTitket,
                updateCustTitket : app_customer_titket_handler.updateCustTitket,
                batchUpdateTitket : app_customer_titket_handler.batchUpdateTitket,
                queryCustTitketById : app_customer_titket_handler.queryCustTitketById,
                queryCustTitketCount : app_customer_titket_handler.queryCustTitketCount,
                donationCustTitket : app_customer_titket_handler.donationCustTitket,
                settingCustTitketFlag : app_customer_titket_handler.settingCustTitketFlag

            },
            approvalBusiness : {
                addCustApprovalBusiness : app_customer_approval_business_handler.addCustApprovalBusiness,
                queryCustomerApprovalBusiness : app_customer_approval_business_handler.queryCustomerApprovalBusiness,
                customerSysStatusApproval : app_customer_approval_business_handler.customerSysStatusApproval,
                updateCustApprovalBusiness : app_customer_approval_business_handler.updateCustApprovalBusiness,
                passedBusiness : app_customer_approval_business_handler.passedBusiness,
                unPassedBusiness : app_customer_approval_business_handler.unPassedBusiness,
                refreshUndealNum : app_customer_approval_business_handler.refreshUndealNum,
                showApprBusDetail : app_customer_approval_business_handler.showApprBusDetail,
                getCustApprovalBusinessById : app_customer_approval_business_handler.getCustApprovalBusinessById
            },
            queryCustList:app_customer_handler.queryCustList,
            queryCustActions: app_customer_handler.queryCustActions,
            queryCustInfo: app_customer_handler.queryCustInfo,
            updateCustomer: app_customer_handler.updateCustomer,
            updateCustomerStatusOrSource: app_customer_handler.updateCustomerStatusOrSource,
            mergeCustomer: app_customer_handler.mergeCustomer,
            addCustomer: app_customer_handler.addCustomer,
            deleteCustomer:app_customer_handler.deleteCustomer,
            //saveCustAssign: app_customer_handler.saveCustAssign,
            //delCustOwner: app_customer_handler.delCustOwner,
            //delCustQuery: app_customer_handler.delCustQuery,
            //batchUpdateStatus: app_customer_handler.batchUpdateStatus,

            queryCustNote: app_customer_handler.queryCustNote,
            addNote: app_customer_handler.addNote,
            updateNote:app_customer_handler.updateNote,
            getNote : app_customer_handler.getNote,
            dealNote:app_customer_handler.dealNote,

            import:app_import_handler.import,
            queryMyTask:app_import_handler.queryMyTask,
            queryTaskImport: app_import_handler.queryTaskImport,
            queryTaskRepeat: app_import_handler.queryTaskRepeat,
            getImpTask:app_import_handler.getImpTask,
            delImpTask: app_import_handler.delImpTask,

            getXlsHeads:app_import_handler.getXlsHeads,
            queryPopupCustomer: app_customer_handler.queryPopupCustomer,
            useCustomerOwner: app_customer_handler.useCustomerOwner,
            freeCustomerOwner: app_customer_handler.freeCustomerOwner,

            //queryCustPage:app_customer_handler.queryCustPage,
            callLocationCustomer:app_customer_handler.callLocationCustomer,
            queryCustNote2Me:app_customer_handler.queryCustNote2Me,

            delCustomerAttach:app_customer_handler.delCustomerAttach,

            queryCustPage2In:app_customer_handler.queryCustPage2In,
            delCustQuery2In:app_customer_handler.delCustQuery2In,
            saveCustAssign2In:app_customer_handler.saveCustAssign2In,
            delCustOwner2In:app_customer_handler.delCustOwner2In,
            batchUpdateStatus2In:app_customer_handler.batchUpdateStatus2In,

            queryCustCommonHistory : app_customer_history_handler.queryCustCommonHistory,
            addCustomerExportMonitorTask : app_customer_handler.addCustomerExportMonitorTask,
            addQuickSearch:app_customer_handler.addQuickSearch,
            queryQuickSearch:app_customer_handler.queryQuickSearch,
            queryQuickSearchById:app_customer_handler.queryQuickSearchById,
            deleteQuickSearch:app_customer_handler.deleteQuickSearch,
            upQuickSearch:app_customer_handler.upQuickSearch,
            batchUpdateCustomerCategory:app_customer_handler.batchUpdateCustomerCategory,
            updateCustForOwner:app_customer_handler.updateCustForOwner,
            claimCustomer:app_customer_handler.claimCustomer,
            querySalesStatistics:app_customer_handler.querySalesStatistics,
            cancelPlanning:app_customer_handler.cancelPlanning,
            settingCustRemind:app_customer_handler.settingCustRemind,
            queryExportTaskSearch:app_customer_handler.queryExportTaskSearch,
            queryHitSingleSearch:app_customer_handler.queryHitSingleSearch
        },
        business: {
            delBusAttach: app_business_handler.delBusAttach,
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
            refreshUndealNum : app_business_handler.refreshUndealNum

        },
        batch: {
            getNumList: batchDialHandler.getNumList,
            startDial: batchDialHandler.startDial,
            removeTodoList: batchDialHandler.removeTodoList,
            getNumCount: batchDialHandler.getNumCount,
            getBatchNoReport:batchDialReportHandler.getBatchNoReport,
            saveConcurrent:batchDialHandler.saveConcurrent,
            getConcurrent:batchDialHandler.getConcurrent,
            insertImpAreaTask:batchDialHandler.insertImpAreaTask,
            updateCallStrategy:batchDialHandler.updateCallStrategy,

            getSnByUser:batchTaskHandler.getSnByUser,
            getBdTaskList:batchTaskHandler.getBdTaskList,
            saveBdTask:batchTaskHandler.saveBdTask,
            updateBdTask:batchTaskHandler.updateBdTask,
            removeBdTask:batchTaskHandler.removeBdTask,
            getDealBdTaskList:batchTaskHandler.getDealBdTaskList,
            getTaskById:batchTaskHandler.getTaskById,
            getImpTaskById:batchTaskHandler.getImpTaskById,
            getNumList2:batchTaskHandler.getNumList2,
            startDialTask:batchTaskHandler.startDialTask,
            updateTaskCallStrategy:batchTaskHandler.updateTaskCallStrategy,
            importTaskNum:batchTaskHandler.importTaskNum
        },
        task: {
            addTask : app_task_handler.addTask,
            query : app_task_handler.query,
            getTaskComments : app_task_handler.getTaskComments,
            doCompleteTask : app_task_handler.doCompleteTask,
            cancelCompleteTask : app_task_handler.cancelCompleteTask,
            addComments : app_task_handler.addComments,
            assignToUser : app_task_handler.assignToUser,
            getTaskById : app_task_handler.getTaskById,
            addTaskTag : app_task_handler.addTaskTag,
            deleteTaskTag : app_task_handler.deleteTaskTag
        },
        report : {
            // queryTaskReport : app_report_handler.queryTaskReport,
            queryTaskReport : app_businessReport_handler.queryTaskReport,
            queryCustStatusReport : app_customerReport_handler.queryCustStatusReport,
            getTableHeader: app_call_report_handler.getTableHeader,
            saveTableHeader: app_call_report_handler.saveTableHeader,
            openQueueTime: app_call_report_handler.openQueueTime,
            openQueue: app_call_report_handler.openQueue,
            openAgent: app_call_report_handler.openAgent,
            queryAgentTime: app_call_report_handler.queryAgentTime,
            openApproveSurvey: app_call_report_handler.openApproveSurvey,
            approveSurveyToCallSheet: app_call_report_handler.approveSurveyToCallSheet,
            openRelayTime: app_call_report_handler.openRelayTime,
            openRelayArea: app_call_report_handler.openRelayArea,
            openRelayAreaCity: app_call_report_handler.openRelayAreaCity,
            openCalloutTime: app_call_report_handler.openCalloutTime,
            openDialoutArea: app_call_report_handler.openDialoutArea,
            getCustChanageReport: customerChangeReporthandler.getCustChanageReport,
            statDialUserData:app_customerTaskReport_handler.statDialUserData,
            statCloseDialUserData:app_customerTaskReport_handler.statCloseDialUserData
        },
        callSheet: {
            queryCallSheetByCustomer: app_call_sheet_handler.queryCallSheetByCustomer,
            queryCallSheet: app_call_sheet_handler.queryCallSheet,
            getCdrChannel: app_call_sheet_handler.getCdrChannel,
            cdrLocationCustomer: app_call_sheet_handler.cdrLocationCustomer,
            queryCallSheetLeak: app_call_sheet_handler.queryCallSheetLeak,
            notDealCallBackAgentChange: app_call_sheet_handler.notDealCallBackAgentChange,
            delNotDealCdr: app_call_sheet_handler.delNotDealCdr,
            delAllNotDealCdr: app_call_sheet_handler.delAllNotDealCdr,
            saveAssignCallBackAgent: app_call_sheet_handler.saveAssignCallBackAgent,
            saveAssignAllCallBackAgent: app_call_sheet_handler.saveAssignAllCallBackAgent,
            removeKeyTag: app_call_sheet_handler.removeKeyTag,
            getCdrMemo: app_call_sheet_handler.getCdrMemo,
            saveCdrMemo: app_call_sheet_handler.saveCdrMemo,
            addExportMonitorTask: app_call_sheet_handler.addExportMonitorTask,
            queryExportMonitorTask: app_call_sheet_handler.queryExportMonitorTask,
            removeExportMonitorTask:  app_call_sheet_handler.removeExportMonitorTask,
            getCdrDetail: app_call_sheet_handler.getCdrDetail,

            relocationCustomer: app_call_sheet_handler.relocationCustomer,
            locationCustomer: app_call_sheet_handler.locationCustomer,
            updateMCHistory : app_call_sheet_handler.updateMCHistory,

            markCallSheet: app_call_sheet_handler.markCallSheet
        },
        excel:{
            exportXls:app_export_handler.exportXls,
            exportMoreXls:app_export_handler.exportMoreXls
        },
        popup: {
            popupCust: app_popup_handler.popupCust,
            getQueuePopup : app_popup_handler.getQueuePopup,
            locactionCustNum : app_popup_handler.locactionCustNum,
            locactionCallNoArea : app_popup_handler.locactionCallNoArea,
            queryCustomerByPopup : app_popup_handler.queryCustomerByPopup,

            popupEmail : app_popup_handler.popupEmail,
            popupWeixin : app_popup_handler.popupWeixin,
            popupWebchat : app_popup_handler.popupWebchat
        },
        phoneBarConfig: {
            queryConfig:app_phone_bar_config_handler.queryConfig
        },
        user: {
            editUser: app_user_handler.editUser,
            editUser2Im: app_user_handler.editUser2Im,

            setUserChannel: app_user_handler.setUserChannel,
            getAccountInfo: app_user_handler.getAccountInfo,
            getToken: app_user_handler.getToken
        },
        callBill: {
            queryMyCallBill: app_call_bill_handler.queryMyCallBill,
            downloadRecord:app_call_bill_handler.downloadRecord
        },
        callRecord:{
            addCallRecord:callRecordHandler.addCallRecord,
            queryCallRecordInfo:callRecordHandler.queryCallRecordInfo,
            addCallRecord2Dial:callRecordHandler.addCallRecord2Dial
        },
        km:{
            getKmUptoken:qiniuHandler.getKmUptoken,
            getKmAttachUrl:qiniuHandler.getKmAttachUrl,

            queryCatalogList:app_kmcataloghandler.queryCatalogList,
            addCatalog:app_kmcataloghandler.addCatalog,
            updateCatalog:app_kmcataloghandler.updateCatalog,
            delCatalog:app_kmcataloghandler.delCatalog,
            showCatalogEdit:app_kmcataloghandler.showCatalogEdit,

            queryRecentList:app_kmitemhandler.queryRecentList,
            queryItemList:app_kmitemhandler.queryItemList,
            uploadDoc:app_kmitemhandler.uploadDoc,
            saveItem:app_kmitemhandler.saveItem,
            showItemEdit:app_kmitemhandler.showItemEdit,
            updateItem:app_kmitemhandler.updateItem,
            delItem:app_kmitemhandler.delItem,
            delAttach:app_kmitemhandler.delAttach,
            queryKmDic:app_kmitemhandler.queryKmDic,
            queryWholeKmDic: app_kmitemhandler.queryWholeKmDic,
            queryKmHotWords: app_kmitemhandler.queryKmHotWords
        },
        monitor: {
            queryCdrPeer: app_cdr_peer_handler.queryCdrPeer
        },
        qualityCheck:{
            getQualityedCheckCallSheet:app_call_sheet_handler.getQualityedCheckCallSheet,
            getQualityCheckCallSheet: app_call_sheet_handler.getQualityCheckCallSheet,
            getCallSheetGrade : app_call_sheet_handler.getCallSheetGrade,
            saveCallSheetGrade : app_call_sheet_handler.saveCallSheetGrade,
            saveCallShellGrade : app_call_sheet_handler.saveCallShellGrade,
            updateCallGrade : app_call_sheet_handler.updateCallGrade,
            queryCallSheetGradeResult: app_call_sheet_handler.queryCallSheetGradeResult,
            queryCallSheetGradeList: app_call_sheet_handler.queryCallSheetGradeList,
            showQualityComments : app_call_sheet_handler.showQualityComments,
            recordListenLog : app_call_sheet_handler.recordListenLog,
            queryListenLog : app_call_sheet_handler.queryListenLog,
            getQualityCheckRandomTemplates: app_call_sheet_handler.getRandomTemplate,
            addQualityCheckRandomTemplates: app_call_sheet_handler.addRandomTemplate,
            addQualityTaskTemplate : app_call_sheet_handler.saveQualityTaskTemplateAndselect,
            selectedMorrCallRecord : app_call_sheet_handler.selectedMorrCallRecord,
            queryAllConditionData : app_call_sheet_handler.queryAllConditionData,
            getQualityTaskTemplates : app_call_sheet_handler.getQualityTaskTemplates,
            getQualityTaskTemplateList : app_call_sheet_handler.getQualityTaskTemplateList,
            removeQualityCheckRandomTemplates: app_call_sheet_handler.removeRandomTemplate,
            removeQualityCheckTaskTemplates : app_call_sheet_handler.removeTaskTemplate,
            replacementRecord : app_call_sheet_handler.replacementRecord,
            agentRanking : app_call_sheet_handler.agentRanking
        },
        questionnaire: {
            getUserUncompleteQues: questionnaire_handler.getUserUncompleteQues,
            getUserAllQues: questionnaire_handler.getUserAllQues,
            getUserCompleteQues: questionnaire_handler.getUserCompleteQues,
            getUserUnconfirmQues : questionnaire_handler.getUserUnconfirmQues,
            getAllUncompleteQues: questionnaire_handler.getAllUncompleteQues,
            getAllCompleteQues: questionnaire_handler.getAllCompleteQues,
            getAllQues: questionnaire_handler.getAllQues,
            getAllUnconfirmQues: questionnaire_handler.getAllUnconfirmQues,
            getQuesById : questionnaire_handler.getQuesById,
            updateQuestionnaire : questionnaire_handler.updateQuestionnaire,
            completeQuestionnaire : questionnaire_handler.completeQuestionnaire,
            confirmQuesCallTask : questionnaire_handler.confirmQuesCallTask,
            completeQuestionnaire : questionnaire_handler.completeQuestionnaire,

            queryQuestionTask: questionnaire_handler.queryQuestionTask,
            getXlsHeads: questionnaire_handler.getXlsHeads,
            import: questionnaire_handler.import,
            queryQuestionTaskImport: questionnaire_handler.queryQuestionTaskImport,
            saveQuesAssign: questionnaire_handler.saveQuesAssign,
            getQuesCallSheet : questionnaire_handler.getQuesCallSheet,
            addQuesComment : questionnaire_handler.addQuesComment,

            exportQues : questionnaire_handler.exportQues,
            getQuesCount : questionnaire_handler.getQuesCount,
            deleteQues : questionnaire_handler.deleteQues,
            removeQuesTask:questionnaire_handler.removeQuesTask,
            getBatchNoByTime:questionnaire_handler.getBatchNoByTime,
            getBatchRemarkByTime:questionnaire_handler.getBatchRemarkByTime
        },
        sms: {
            sendSms: new_sms_handler.sendSms,
            queryMySms: new_sms_handler.queryMySms,
            queryAllSms: new_sms_handler.queryAllSms,
            sendBatchSms: new_sms_handler.sendBatchSms,
            querySmsImportTask: new_sms_handler.querySmsImportTask,
            queryTaskImport: new_sms_handler.queryTaskImport,
            queryTaskInvalid: new_sms_handler.queryTaskInvalid,
            smsImportSend: new_sms_handler.smsImportSend,
            smsCountImportToSend: new_sms_handler.smsCountImportToSend,
            smsCountImportToSend: new_sms_handler.smsCountImportToSend,
            querySmsTemplate: new_sms_handler.querySmsTemplate,
            saveCallMessageTemplate:new_sms_handler.saveCallMessageTemplate,
            queryHangupMessageTemplate:new_sms_handler.queryHangupMessageTemplate
            //getSmsById: new_sms_handler.getSmsById
        },
        email:{
            locationCustomer:emailHandler.locationCustomer,
            deleteCustomerImRelation: emailHandler.deleteCustomerImRelation,
            dealInbox:emailHandler.dealInbox,
            replyInbox:emailHandler.replyInbox,
            forwardEmail:emailHandler.forwardEmail,
            loadEmailHistory:emailHandler.loadEmailHistory,
            queryMailInfo:emailHandler.queryMailInfo,
            queryUndealList:emailHandler.queryUndealList,
            saveMailAssign:emailHandler.saveMailAssign,
            queryMyDealMailList:emailHandler.queryMyDealMailList,
            queryAllMailList:emailHandler.queryAllMailList,
            queryMailListByCustID:emailHandler.queryMailListByCustID,
            saveRemark: emailHandler.saveRemark,
            relocationCustomer:emailHandler.relocationCustomer,
            saveMailAssign2In:emailHandler.saveMailAssign2In,
            queryMailList2In:emailHandler.queryMailList2In,
            updateEmailSession:emailHandler.updateEmailSession,
            updateAutoClaimEmailSessionStatus: emailHandler.updateAutoClaimEmailSessionStatus,
            claimNewEmailSession: emailHandler.claimNewEmailSession,
            refreshMenuNum: emailHandler.refreshMenuNum,
            refreshLeakNum: emailHandler.refreshLeakNum,
            finishEmailSession: emailHandler.finishEmailSession,
            getLastEmail: emailHandler.getLastEmail,
            redirectEmailSession: emailHandler.redirectEmailSession,
            updateLogoutMailAutoClaimTime: emailHandler.updateLogoutMailAutoClaimTime,
            doMailMark: emailHandler.doMailMark,
            defineMailCategory: emailHandler.defineMailCategory,
            getMailCategory: emailHandler.getMailCategory,
        },
        weixin:{
            locationCustomer:weixinHandler.locationCustomer,
            dealMsg:weixinHandler.dealMsg,
            replyMsg:weixinHandler.replyMsg,
            queryHistory:weixinHandler.queryHistory,
            queryWexinUser:weixinHandler.queryWexinUser,
            queryUserHistory:weixinHandler.queryUserHistory,
            queryUndealWexinUser:weixinHandler.queryUndealWexinUser,
            queryMyWeixinList:weixinHandler.queryMyWeixinList,
            saveWeixinAssign:weixinHandler.saveWeixinAssign,
            queryUserHistoryByCustId:weixinHandler.queryUserHistoryByCustId,
            relocationCustomer:weixinHandler.relocationCustomer,
            queryWexinUser2In:weixinHandler.queryWexinUser2In,
            saveWeixinAssign2In:weixinHandler.saveWeixinAssign2In,

            delFile:qiniuHandler.delImFile,
            getUptoken:qiniuHandler.getUptokenByClient
        },
        webchat:{
            locationCustomer:webchatHandler.locationCustomer,
            updateCustomerImRelation: webchatHandler.updateCustomerImRelation,
            deleteCustomerImRelation: webchatHandler.deleteCustomerImRelation,
            dealMsg:webchatHandler.dealMsg,
            replyMsg:webchatHandler.replyMsg,
            queryHistory:webchatHandler.queryHistory,
            queryUserHistory:webchatHandler.queryUserHistory,
            queryWebchatUser2In:webchatHandler.queryWebchatUser2In,
            queryUserByCustId:webchatHandler.queryUserByCustId,
            queryUserById:webchatHandler.queryUserById,
            updateSessionOwner:webchatHandler.updateSessionOwner,
            queryWebchatSession:webchatHandler.queryWebchatSession,
            queryChatSessionById:webchatHandler.queryChatSessionById,
            refreshMenuNum:webchatHandler.refreshMenuNum,
            typeNotice:webchatHandler.typeNotice,

            getWebchatTodoShowConfig:webchatHandler.getWebchatTodoShowConfig,
            saveWebchatTodoShowConfig:webchatHandler.saveWebchatTodoShowConfig,

            claimWebchatSession: webchatHandler.claimWebchatSession,
            redirectWebchatSession: webchatHandler.redirectWebchatSession,
            grabWebchatSession:webchatHandler.grabWebchatSession,
            finishWebchatSession: webchatHandler.finishWebchatSession,
            updateWebchatSessionRemark : webchatHandler.updateWebchatSessionRemark, //备注的更�
            getQuickReplyList: webchatHandler.getQuickReplyList,
            getAllQuickReplyList: webchatHandler.getAllQuickReplyList,
            saveQuickReply: webchatHandler.saveQuickReply,
            autoClaimWebchatSession: webchatHandler.autoClaimWebchatSession,
            updateAutoClaimWebchatSessionStatus: webchatHandler.updateAutoClaimWebchatSessionStatus,
            queryChatInfoById: webchatHandler.queryChatInfoById,
            getImUptoken: qiniuHandler.getImUpTokenByClient,

            //多方会话
            inviteGroupSession:webchatHandler.inviteGroupSession,
            acceptGroupSession:webchatHandler.acceptGroupSession,
            refusedGroupSession:webchatHandler.refusedGroupSession,
            cancelGroupSession:webchatHandler.cancelGroupSession,
            kickGroupSession:webchatHandler.kickGroupSession,
            getUndealInvitation:webchatHandler.getUndealInvitation,



            //客户端满意度调查
            pushImCSRInfo:webchatHandler.pushImCSRInfo,
            //查询所有技能组
            showAllSkillGroup: webchatHandler.showAllSkillGroup,

            //系统快捷回复
            queryWebChatAllTags:manager_quickReply_handler.queryWebChatAllTags,//webChat页面系统回复查询所有标签（包括其他标签）及标签下快捷回复数量
            queryWebChatTagsById:manager_quickReply_handler.queryWebChatTagsById,//按标签查询快捷回复

            //获取本地和服务器的时间差
            getServerTimeDiff:webchatHandler.getServerTimeDiff,

            // 推送排队信息至客户端（前100）
            pushQueueNumToWebChatClients: multi_channel_handler.pushQueueNumToWebChatClients
        },
        push: {
            pushSocketLogined: multi_channel_handler.pushSocketLogined
        },
        workbench: {
            workbenchRefresh: workbenchHandler.workbenchRefresh
        },
        monitor: {
            getPushOnlineAgentAndDealingCount: monitorHandler.getPushOnlineAgentAndDealingCount,
            queryCdrPeer: app_cdr_peer_handler.queryCdrPeer
        },
        collect:{
            collectAgentPCInfo: app_collect_handler.collectAgentPCInfo
        }
    },
    config :{
        business :{
            queryAccountBusinessFlow: business_config_handler.queryAccountBusinessFlow,
            addBusinessFlow: business_config_handler.addBusinessFlow,
            queryBusinessFlowSteps: business_config_handler.queryBusinessFlowSteps,
            queryBusinessFlowStep: business_config_handler.queryBusinessFlowStep,
            addBusinessFlowStep: business_config_handler.addBusinessFlowStep,
            updateBusinessFlowStep: business_config_handler.updateBusinessFlowStep,
            addBusinessStepAction: business_config_handler.addBusinessStepAction,
            addBusinessStepField: business_config_handler.addBusinessStepField,
            deleteBusinessStepField: business_config_handler.deleteBusinessStepField,
            updateBusinessStepInfo: business_config_handler.updateBusinessStepInfo,
            updateBusinessStepFields: business_config_handler.updateBusinessStepFields,
            queryBusinessStepAction: business_config_handler.queryBusinessStepAction,
            udpateBusinessStepAction: business_config_handler.udpateBusinessStepAction,
            deleteBusinessStepAction: business_config_handler.deleteBusinessStepAction,
            addBusinessFlowFields: business_config_handler.addBusinessFlowFields,
            queryBusinessFlowFields: business_config_handler.queryBusinessFlowFields,
            queryAllBusinessFlowFields : business_config_handler.queryAllBusinessFlowFields,
            getBusinessFolwById : business_config_handler.getBusinessFolwById,
            updateBusinessFlowInfo : business_config_handler.updateBusinessFlowInfo,
            changeStatusBusinessFlow : business_config_handler.changeStatusBusinessFlow,


            queryBusinessReport : business_config_handler.queryBusinessReport,
            saveBusinessReportInfo : business_config_handler.saveBusinessReportInfo,
            getBusinessReportConfigById : business_config_handler.getBusinessReportConfigById,
            addBusinessReportField : business_config_handler.addBusinessReportField

        },
        questionnaire : {
            queryAccountQuestionnaireTemp : questionnaire_config_handler.queryAccountQuestionnaireTemp,
            getQuestionnaireTempById : questionnaire_config_handler.getQuestionnaireTempById,
            updateQuestionnaireTemp : questionnaire_config_handler.updateQuestionnaireTemp,
            addQuestionnaireTemp : questionnaire_config_handler.addQuestionnaireTemp,
            queryQuestionnaireQues : questionnaire_config_handler.queryQuestionnaireQues,
            addQuestionnaireFields : questionnaire_config_handler.addQuestionnaireFields,
            updateQuestionnaireFields : questionnaire_config_handler.updateQuestionnaireFields,
            queryQuestionnaireFields : questionnaire_config_handler.queryQuestionnaireFields,
            getQuestionnaireFieldById : questionnaire_config_handler.getQuestionnaireFieldById,
            addQuestionnaireQues : questionnaire_config_handler.addQuestionnaireQues,
            getQuesById : questionnaire_config_handler.getQuesById,
            changeStatusQuestionnaireTemp : questionnaire_config_handler.changeStatusQuestionnaireTemp,
            getQuestionnaireTempStatusById: questionnaire_config_handler.getQuestionnaireTempStatusById,
            updateQuestionnaireTempStatusById: questionnaire_config_handler.updateQuestionnaireTempStatusById,
            checkTempIsUsed: questionnaire_config_handler.checkTempIsUsed,
            delTempQues: questionnaire_config_handler.delTempQues
        },
        customer: {
            addCustomerTemplate: manager_customer_handler.addCustomerTemplate,
            getCustomerTemplate: manager_customer_handler.getCustomerTemplate,
            addCustomerField: manager_customer_handler.addCustomerField,
            moveCustomField: manager_customer_handler.moveCustomField,
            deleteCustomField: manager_customer_handler.deleteCustomField,
            editCustomField: manager_customer_handler.editCustomField,
            editStatus: manager_customer_handler.editStatus,
            editFields: manager_customer_handler.editFields,
            uniqueField: manager_customer_handler.uniqueField,
            callPop: manager_customer_handler.callPop,
            editSource: manager_customer_handler.editSource,
            editCompetitors: manager_customer_handler.editCompetitors,
            setAutoSave:manager_customer_handler.setAutoSave,
            //saveMaxCommon:manager_customer_handler.saveMaxCommon
        },
        dept:{
            queryDeptList:manager_dept_handler.queryDeptList,
            queryUser:manager_dept_handler.queryUser,
            addDept:manager_dept_handler.addDept,
            updateDept:manager_dept_handler.updateDept,
            delDept:manager_dept_handler.delDept,
            moveDept:manager_dept_handler.moveDept,
            initDept:manager_dept_handler.initDept
        },
        role:{
            queryRole: manager_role_handler.queryRole,
            queryRoleAll: manager_role_handler.queryRoleAll,
            addRole: manager_role_handler.addRole,
            showRoleAdd: manager_role_handler.showRoleAdd,
            showRoleEdit: manager_role_handler.showRoleEdit,
            delRole: manager_role_handler.delRole,
            updateRole: manager_role_handler.updateRole
        },
        channel:{
            queryEmail:manager_email_handler.queryEmail,
            addEmailCfg:manager_email_handler.addEmailCfg,
            queryEmailCfgById:manager_email_handler.queryEmailCfgById,
            updateEmailCfg:manager_email_handler.updateEmailCfg,
            deleteEmailCfg:manager_email_handler.deleteEmailCfg,
            addOrUpdateEmailQueue:manager_email_handler.addOrUpdateEmailQueue,
            queryEmailQueue: manager_email_handler.queryEmailQueue,
            deleteEmailQueue: manager_email_handler.deleteEmailQueue,
            queryEmailQueueById: manager_email_handler.queryEmailQueueById,
            addWeixinCfg: manager_weixin_handler.addWeixinCfg,
            queryWeixin: manager_weixin_handler.queryWeixin,
            deleteWeixinCfg: manager_weixin_handler.deleteWeixinCfg,
            queryWeixinCfgById: manager_weixin_handler.queryWeixinCfgById,
            updateWeixinCfg: manager_weixin_handler.updateWeixinCfg,
            addWebchatCfg: manager_webchat_handler.addWebchatCfg,
            queryWebchat: manager_webchat_handler.queryWebchat,
            queryWebchatCfgById: manager_webchat_handler.queryWebchatCfgById,
            updateWebchatCfg: manager_webchat_handler.updateWebchatCfg,
            deleteWebchatCfg: manager_webchat_handler.deleteWebchatCfg,
            checkWebSiteEmebedScript: manager_webchat_handler.checkWebSiteEmebedScript,
            addRobotCfg: manager_robot_handler.addRobotCfg,
            robotLogin: manager_robot_handler.robotLogin,
            updateRobotCfg: manager_robot_handler.updateRobotCfg,
            queryRobot: manager_robot_handler.queryRobot,
            queryRobotById: manager_robot_handler.queryRobotById,
            deleteRobotCfg: manager_robot_handler.deleteRobotCfg,
            //saveMultiChannelPublicConfig: manager_account_handler.saveMultiChannelPublicConfig,
            updateMultiChannelHistoryForLocateCust: multi_channel_handler.updateMultiChannelHistoryForLocateCust,
            queryWechat: manager_weixin_handler.queryWechat,
            updateWechat: manager_weixin_handler.updateWechat,
            deleteWechat: manager_weixin_handler.deleteWechat,

            //邮件设置
            querySignList:manager_email_handler.querySignList,
            saveEmailSign:manager_email_handler.saveEmailSign,
            updateEmailSign:manager_email_handler.updateEmailSign,
            deleteEmailSign:manager_email_handler.deleteEmailSign,
            getSignById:manager_email_handler.getSignById,
            setSignDefault:manager_email_handler.setSignDefault,
            //邮件分类
            saveAndUpdateMailCategory:manager_email_handler.saveAndUpdateMailCategory,
            showMailCategory:manager_email_handler.showMailCategory,
            editMailCategory:manager_email_handler.editMailCategory,
            deleteMailCategory:manager_email_handler.deleteMailCategory,

            //快捷回复
            queryAllTitle: manager_quickReply_handler.queryAllTitle,//初始化查询所有标签以及数量
            addQuickReply: manager_quickReply_handler.addQuickReply,//新增常用语
            queryQuickReplyByTitle:manager_quickReply_handler.queryQuickReplyByTitle,//标签下所有常用于展示
            queryQuickReplyById:manager_quickReply_handler.queryQuickReplyById,//修改常用语在右侧展示
            updateQuickReply:manager_quickReply_handler.updateQuickReply,//保存常用语
            deleteQuickReply:manager_quickReply_handler.deleteQuickReply,//删除
            queryTagsArray:manager_quickReply_handler.queryTagsArray,//查询所有标签Id和name
            queryTagsByName:manager_quickReply_handler.queryTagsByName,//根据输入name查询标签id
            queryQuickReplyByTagsName:manager_quickReply_handler.queryQuickReplyByTagsName,//按标签、关键字查询快捷回复
            queryQuickReplyByContent:manager_quickReply_handler.queryQuickReplyByContent,//按快捷回复关键字查询快捷回复

            //导入快捷回复
            quickReplyImport:manager_quickReplyImport_handler.import,
            getXlsHeads:manager_quickReplyImport_handler.getXlsHeads,
            //微信菜单
            queryDockWeiXinList: manager_weixin_handler.queryDockWeiXinList,
            saveDockWeixin: manager_weixin_handler.saveDockWeixin,
            getDockWeixin: manager_weixin_handler.getDockWeixin,
            updateDockWeixin: manager_weixin_handler.updateDockWeixin,
            delDockWeixin: manager_weixin_handler.delDockWeixin,

            checkWeixinMenu: manager_weixin_handler.checkWeixinMenu,
            getWeixinMenu: manager_weixin_handler.getWeixinMenu,
            createWeixinMenu: manager_weixin_handler.createWeixinMenu,
            saveWeixinMaterial: manager_weixin_handler.saveWeixinMaterial,
            saveNewsMaterial: manager_weixin_handler.saveNewsMaterial,
            //updateNewsMaterial: manager_weixin_handler.updateNewsMaterial,
            getMaterial:manager_weixin_handler.getMaterial,

            //global set
            getGlobalSetById: channelGlobalSetHandler.getGlobalSetById,
            saveGlobalSet: channelGlobalSetHandler.saveGlobalSet,
            //新增邮件菜单
            addOrEditEmailConfig:manager_email_handler.addOrEditEmailConfig,
            emailConfigEnter:manager_email_handler.emailConfigEnter,
            showAllSkilGroup:manager_email_handler.showAllSkilGroup,
            delRelationEmail:manager_email_handler.delRelationEmail,
            saveRelationEmailConfig:manager_email_handler.saveRelationEmailConfig,
            emailServerOpen:manager_email_handler.emailServerOpen,
            sendCheckEmail:manager_email_handler.sendCheckEmail,
            checkRelationEmail:manager_email_handler.checkRelationEmail,
            updateEmailRelateConfig: manager_email_handler.updateEmailRelateConfig,

            // 微信客服设置
            weixinGetAllCustomService: manager_weixin_handler.getAllCustomService,
            weixinAddCustomService: manager_weixin_handler.addCustomService,
            weixinUpdateCustomService: manager_weixin_handler.updateCustomService,
            weixinDelCustomService: manager_weixin_handler.delCustomService,
            weixinGetCustomServiceBindUsers: manager_weixin_handler.getCustomServiceBindUsers,
            weixinBindUsersToCustomService: manager_weixin_handler.bindUsersToCustomService
        },
        dic:{
            queryDicList:manager_dictionary_handler.queryDicList,
            addDic :manager_dictionary_handler.addDic ,
            findOneAppDic:manager_dictionary_handler.findOneAppDic,
            updateOneAppDic : manager_dictionary_handler.updateOneAppDic,
            updateDic:manager_dictionary_handler.updateDic ,
            delDic:manager_dictionary_handler.delDic
        },
        user:{
            queryUser:manager_user_handler.queryUser,
            updateUser:manager_user_handler.updateUser,
            getUserById:manager_user_handler.getUserById,
            getCurrentUser:manager_user_handler.getCurrentUser,
            updataCurrentUser:manager_user_handler.updataCurrentUser,
            updateImFont: manager_user_handler.updateImFont,
            batchUpdateUser:manager_user_handler.batchUpdateUser,
            getCallInternation:manager_user_handler.getCallInternation
        },
        overallSituationConfig: {
            updateTokenConfig : manager_account_handler.updateTokenConfig
        },
        interfaceUrl:{
            addInterfaceFields: manager_interface_handler.addInterfaceFields,
            queryInterfaceFields: manager_interface_handler.queryInterfaceFields,
            delInterfaceFields: manager_interface_handler.delInterfaceFields,
            editInterfaceFields: manager_interface_handler.editInterfaceFields,
            moveInterfaceField: manager_interface_handler.moveInterfaceField
        },
        tabUrl : {
            addTABFields : manager_tab_handler.addTABFields,
            queryTABFields : manager_tab_handler.queryTABFields,
            editTABFields : manager_tab_handler.editTABFields,
            delTABFields : manager_tab_handler.delTABFields,
            moveTABField : manager_tab_handler.moveTABField
        },
        callEvent : {
            addOrUpdateCallEvent : manager_callevent_handler.addOrUpdateCallEvent,
            queryCallEvent : manager_callevent_handler.queryCallEvent,
            getCallEventById : manager_callevent_handler.getCallEventById,
            delCallEvent : manager_callevent_handler.delCallEvent
        },
        callLabel : {
            queryCallLabel : manager_call_label.queryCallLabel,
            addCallLabel : manager_call_label.addCallLabel,
            updateCallLabelState : manager_call_label.updateCallLabelState
        },
        callInter: {
            addOrEditCallInter: manager_callInterHistory_handler.addOrEditCallInter,
            queryCallInter: manager_callInterHistory_handler.queryCallInter,
            delCallInter: manager_callInterHistory_handler.delCallInter
        },
        callUrl: {
            addCallUrlFields: manager_callUrl_handler.addCallUrlFields,
            addDialoutUrlFields: manager_callUrl_handler.addDialoutUrlFields,
            queryCallUrlFields: manager_callUrl_handler.queryCallUrlFields,
            queryDialoutUrlFields: manager_callUrl_handler.queryDialoutUrlFields,
            editCallUrlFields: manager_callUrl_handler.editCallUrlFields,
            delCallUrlFields: manager_callUrl_handler.delCallUrlFields,
            delDialoutUrlFields: manager_callUrl_handler.delDialoutUrlFields,
            userDialoutScreen: manager_callUrl_handler.userDialoutScreen,
            stopuserDialoutScreen: manager_callUrl_handler.stopuserDialoutScreen,
            editDialoutUrlFields: manager_callUrl_handler.editDialoutUrlFields
        },
        ivr: {
            getAllNodesByPbx: manager_ivr_handler.getAllNodesByPbx,
            pbx: {
                getAllAccountPbx: manager_account_pbx_handler.getAllAccountPbx,
                queryAccountPbx: manager_account_pbx_handler.queryAccountPbx,
                saveAccountPbx: manager_account_pbx_handler.saveAccountPbx,
                moveAccountPbx: manager_account_pbx_handler.moveAccountPbx,
                checkPbxLoadInfo: manager_account_pbx_handler.checkPbxLoadInfo
            },
            schedule: {
                querySchedule: manager_schedule_handler.querySchedule,
                saveSchedule: manager_schedule_handler.saveSchedule,
                updateSchedule: manager_schedule_handler.updateSchedule,
                deleteSchedule: manager_schedule_handler.delSchedule
            },
            serviceNo: {
                queryServiceNo: manager_ivr_serviceNo_handler.queryServiceNo,
                saveServiceNo: manager_ivr_serviceNo_handler.saveServiceNo,
                updateServiceNo: manager_ivr_serviceNo_handler.updateServiceNo,
                deleteServiceNo: manager_ivr_serviceNo_handler.deleteServiceNo
            },
            agent: {
                refreshUser: manager_agent_config_handler.refreshUser,
                queryAgent: manager_agent_config_handler.queryUser,
                updateAgent: manager_agent_config_handler.updateUser,
                disableAgent: manager_agent_config_handler.disableAgent,
                enableAgent: manager_agent_config_handler.enableAgent,
                batchAddAgent: manager_agent_config_handler.batchAddAgent
            },
            queue: {
                queryQueue: manager_queue_handler.queryQueue,
                getFreeQueueNo: manager_queue_handler.getFreeQueueNo,
                updateQueue: manager_queue_handler.updateIvrQueue,
                deleteQueue: manager_queue_handler.deleteQueue
            },
            blacklist: {
                saveBlackList: manager_ivr_blacklist_handler.saveBlackList,
                queryBlackNum: manager_ivr_blacklist_handler.queryBlackNum,
                delBlackNum: manager_ivr_blacklist_handler.delBlackNum
            },
            vars: {
                queryVar: manager_var_handler.queryVar,
                updateVar: manager_var_handler.saveVar,
                deleteVar: manager_var_handler.delVar,
                refreshVar: manager_var_handler.refreshVar
            },
            line: {
                queryLine: manager_line_handler.queryLine,
                updateLine: manager_line_handler.saveLine
            },
            sound: {
                querySound: manager_sound_handler.querySound,
                updateSound: manager_sound_handler.addOrUpdateSound,
                deleteSound: manager_sound_handler.deleteSound,
                soundToQiniuTransfer: manager_sound_handler.soundToQiniuTransfer,
                soundToQiniuTransferRefresh: manager_sound_handler.soundToQiniuTransferRefresh
            },
            phoneBarConfig: {
                queryPhoneBarConfig: manager_ivr_phonebarconfig_handler.queryPhoneBarConfig,
                savePhoneBarConfig: manager_ivr_phonebarconfig_handler.savePhoneBarConfig
            },
            ivrTools: {
                queryAllAccount: manager_account_handler.queryAllAccount,
                ivrToolsSave: manager_ivr_handler.ivrToolsSave,
                ivrToolsSaveStatus: manager_ivr_handler.ivrToolsSaveStatus
            },
            node: {
                announcement: {
                    queryAnnouncement: manager_announcement_handler.queryAnnouncement,
                    updateAnnouncement: manager_announcement_handler.addOrUpdateAnnouncement,
                    deleteAnnouncement: manager_announcement_handler.delAnnouncement
                },
                ivr: {
                    queryIvr: manager_ivr_node_handler.queryIvrNode,
                    updateIvr: manager_ivr_node_handler.addOrUpdateIvr,
                    updateIvrKey: manager_ivr_node_handler.addOrUpdateIvrKey,
                    deleteIvr: manager_ivr_node_handler.delIvr
                },
                validation: {
                    queryValidation: manager_validation_node_handler.queryValidation,
                    updateValidation: manager_validation_node_handler.saveOrUpdateValidation,
                    deleteValidation: manager_validation_node_handler.delValidation
                },
                assignment: {
                    queryAssignment: manager_assignment_node_handler.queryAssignment,
                    updateAssignment: manager_assignment_node_handler.addOrUpdateAssignment,
                    deleteAssignment: manager_assignment_node_handler.deleteAssignment
                },
                system: {
                    updateSystem: manager_system_node_handler.updateSystem
                },
                extensionPeer: {
                    queryExtensionPeer: manager_ivr_extension_peer_handler.queryExtensionPeer,
                    updateExtensionPeer: manager_ivr_extension_peer_handler.addOrUpdateExtensionPeer,
                    deleteExtensionPeer: manager_ivr_extension_peer_handler.deleteExtensionPeer
                },
                textAnnouncement: {
                    queryTextAnnouncement: manager_ivr_text_announcement_handler.queryTextAnnouncement,
                    updateTextAnnouncement: manager_ivr_text_announcement_handler.addOrUpdateTextAnnouncement,
                    deleteTextAnnouncement: manager_ivr_text_announcement_handler.deleteTextAnnouncement
                },
                callUrl: {
                    queryCallUrl: manager_ivr_call_url_handler.queryCallUrl,
                    updateCallUrl: manager_ivr_call_url_handler.addOrUpdateCallUrl,
                    deleteCallUrl: manager_ivr_call_url_handler.deleteCallUrl
                },
                route: {
                    queryRoute: manager_ivr_route_handler.queryRoute,
                    updateRoute: manager_ivr_route_handler.addOrUpdateRoute,
                    deleteRoute: manager_ivr_route_handler.delRoute
                },
                room: {
                    queryRoom: manager_ivr_room_handler.queryRoom,
                    updateRoom: manager_ivr_room_handler.addOrUpdateRoom,
                    deleteRoom: manager_ivr_room_handler.deleteRoom
                },
                voiceMail: {
                    queryVoiceMail: manager_ivr_voice_mail_handler.queryVoiceMail,
                    updateVoiceMail: manager_ivr_voice_mail_handler.addOrUpdateVoiceMail,
                    deleteVoiceMail: manager_ivr_voice_mail_handler.deleteVoiceMail
                },
                satisfaction: {
                    updateSatisfaction: manager_ivr_satisfaction_handler.addOrUpdateSatisfaction,
                    deleteSatisfaction: manager_ivr_satisfaction_handler.deleteSatisfaction
                },
                encryptMd5:{
                    queryEncryptMd5: manager_ivr_encrypt_md5_handler.queryEncryptMd5,
                    updateEncryptMd5: manager_ivr_encrypt_md5_handler.addOrUpdateEncryptMd5,
                    deleteEncryptMd5: manager_ivr_encrypt_md5_handler.deleteEncryptMd5
                },
                superDialJobNum: {
                    updateSuperDialJobNum: manager_ivr_superDialJobNum_handler.addOrUpdateSuperDialJobNum,
                    deleteSuperDialJobNum: manager_ivr_superDialJobNum_handler.deleteSuperDialJobNum
                },
                ivrMenu:{
                    queryIvrMenu: manager_ivr_menu_handler.queryIvrMenu,
                    updateIvrMenu: manager_ivr_menu_handler.addOrUpdateIvrMenu,
                    deleteIvrMenu: manager_ivr_menu_handler.deleteIvrMenu
                }
            },
            sip: {
                querySip: manager_ivr_sip_handler.querySip,
                batchAddGatewaySip: manager_ivr_sip_handler.batchAddGatewaySip,
                advantageSearchSip: manager_ivr_sip_handler.advantageSearchSip,
                updateGatewayCodes: manager_ivr_sip_handler.updateGatewayCodes,
                bindGatewayUserExten: manager_ivr_sip_handler.bindGatewayUserExten
            },
            reloadIvr: manager_ivr_handler.reloadIvr,
            process: {
                queryIvrProcessList: manager_process_handler.queryIvrProcessList,
                saveIvrProcess: manager_process_handler.saveIvrProcess,
                queryIvrProcessById: manager_process_handler.queryIvrProcessById,
                delIvrProcess: manager_process_handler.delIvrProcess,
                updateIvrProcess: manager_process_handler.updateIvrProcess,
                queryAllProcessList: manager_process_handler.queryAllProcessList
            }
        },
        qualityCheck: {
            queryQualityCheckTemplate: manager_quality_check_handler.queryQualityCheckTemplate,
            queryQualityTaskTemplateConfig : manager_quality_check_handler.queryQualityTaskTemplateConfig,
            saveQualityCheckTemplate: manager_quality_check_handler.saveQualityCheckTemplate,
            saveQualityCheckTemplateTwo: manager_quality_check_handler.saveQualityCheckTemplateTwo,
            queryQualityCheckConfig: manager_quality_check_handler.queryQualityCheckConfig,
            saveQualityCheckConfig: manager_quality_check_handler.saveQualityCheckConfig,
            deleteQualityCheckConfig: manager_quality_check_handler.deleteQualityCheckConfig,
            changeQualityCheckTemplateStatus: manager_quality_check_handler.changeQualityCheckTemplateStatus,
            saveQualityCheckCycle: manager_quality_check_handler.saveQualityCheckCycle,
            queryQualityCheckCycle: manager_quality_check_handler.queryQualityCheckCycle,
            changeQualityCheckCycleStatus: manager_quality_check_handler.changeQualityCheckCycleStatus,
            queryQualityCheckedtabletitle:manager_quality_check_handler.queryQualityCheckedtabletitle,
            queryQualityCheckedCycle:manager_quality_check_handler.queryQualityCheckedCycle
        },
        accountConfig:{
            getAccProductById: loginCheckHandler.getAccProductById,
            saveLoginCheck: loginCheckHandler.saveLoginCheck,
            retryMail2Authcode: loginCheckHandler.retryMail2Authcode
        },
        mailSign:{
            querySignList:signHandler.querySignList,
            insertSign:signHandler.insertSign,
            updateSign:signHandler.updateSign,
            removeSign:signHandler.removeSign,
            getSignById:signHandler.getSignById,
            setSignDefault:signHandler.setSignDefault
        },
        channelDic: {
            getDicByType: channel_dic_handler.getDicByType,
            getDicById: channel_dic_handler.getDicById,
            saveDic: channel_dic_handler.saveDic,
            saveCSRDic:channel_dic_handler.saveCSRDic,
            getCSRDic:channel_dic_handler.getCSRDic,
            saveDicItem: channel_dic_handler.saveDicItem,
            delDicItem: channel_dic_handler.delDicItem


        },
        account:{
            updateAccountBaseInfo: manager_account_handler.updateAccountBaseInfo,
            saveNotifyConfig: manager_account_handler.saveNotifyConfig,
            getAccountInfoById: manager_account_handler.getAccountInfoById
        },
        customerCommon:{
            saveCustomerCommon:customerCommonHandler.saveCustomerCommon,
            queryCommon:customerCommonHandler.queryCommon,
            queryCustomerCommonInfo:customerCommonHandler.queryCustomerCommonInfo,
            queryCommonById:customerCommonHandler.queryCommonById,
            UpCustomerCommon:customerCommonHandler.UpCustomerCommon,
            queryImportDetail:customerCommonHandler.queryImportDetail,
            batchTransferCustomerCommon:customerCommonHandler.batchTransferCustomerCommon,
            queryCustomerCommonCustomer:customerCommonHandler.queryCustomerCommonCustomer,
            deleteCustomerCommon:customerCommonHandler.deleteCustomerCommon
        },
        customerApproval:{
            queryCustApprovalList : customerApprovalHandler.queryCustApprovalList,
            getCustApprovalById : customerApprovalHandler.getCustApprovalById,
            updateCustApproval : customerApprovalHandler.updateCustApproval
        }
    }
};

exports.handleAction = function (action, session, res) {
    try {
        var actionFun = eval('actions.' + action.name);
        if (actionFun) {
            actionFun(action.data, session, function (result) {
                logger.app.info("perform-analysis["+action._aid+"]" + JSON.stringify({step:"handleAction-sendResult"}));
                result.success = result.success || false;
                result.message = result.success ? result.message || '200 ok!' : result.message || 'unknow error!';
                utils.sendResult(result, res , action._aid);
            });
        } else {
            processUnknowAction(action, res);
        }
    } catch (e) {
        logger.app.error(e);
        utils.sendResult({success: false, message: e.message}, res , action._aid);
    }
}

function processUnknowAction(action, res) {
    var result = {};
    result.success = false;
    result.message = 'action[' + action.name + '] is not support!';
    utils.sendResult(result, res ,action._aid);
}

