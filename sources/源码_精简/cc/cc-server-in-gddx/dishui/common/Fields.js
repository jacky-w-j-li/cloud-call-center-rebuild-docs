exports.Test = "Test";
exports.Login = "Login";
exports.GetClientDicCache = "GetClientDicCache";
exports.QueryAccount = "QueryAccount";

//customer action type
exports.ACTION_DATE = "date";
exports.ACTION_ASSIGN = "assign";
exports.ACTION_SELF = "self";
exports.ACTION_NA = "NA";

//id flag
exports.ID_ACCOUNT = "accountId";

//app user type
exports.APP_USER_TYPE_AGENT = "agent";
exports.APP_USER_TYPE_MANAGER = "manager";

//serviceNo state
exports.SERVICENO_USED = "USED";
exports.SERVICENO_IDLE = "IDLE";

//qiniu domain
exports.QINIU_IM_DOMAIN = "https://fs-im-kefu.7moor.com/";
exports.QINIU_EMAIL_DOMAIN = "https://fs-mail-resource.7moor.com/";
exports.QINIU_KM_DOMAIN = "https://fs-km.7moor.com/";

exports.QINIU_IM_BUCKET = "m7-im-kefu";
exports.QINIU_TEST_BUCKET = "m7-test";
exports.QINIU_EMAIL_BUCKET = "m7-mail-resource";

//db tables
exports.DB_MONITOR_USER = "platform_monitor_user";
exports.DB_MANAGER_USER = "manager_user";
exports.DB_APP_SESSION = "app_session";
exports.DB_MANAGER_SESSION = "manager_session";
exports.DB_C5_ACCOUNT = "app_account";
exports.DB_CLIENT_MENU = "client_menu";
exports.DB_ID_GENEROTER = "id_generator";
exports.DB_ACCOUNT_PBX_CONFIG = "account_pbx_config";
exports.DB_TBL_GENERAL_CODES = "app_dic_codes";
exports.DB_APP_CACHE_VERSION = "app_cache_version";
exports.DB_TBL_DIALOUT_LINE = "tbl_dialout_line";
exports.DB_APP_USER = "app_user";
exports.DB_ACCESS_IP = "access_ip";
exports.DB_TASK = "_task";
exports.DB_TASK_COMMENTS = "_comments";
exports.DB_APP_KM_CATALOG = "app_km_catalog";
exports.DB_APP_KM_ITEM = "app_km_item";
exports.DB_APP_KM_CONTENT = "app_km_content";
exports.DB_APP_KM_DELID = "app_km_delid";
exports.DB_APP_KM_OUTER_CATALOG = "app_km_outer_catalog";
exports.DB_APP_KM_OUTER_ITEM = "app_km_outer_item";
exports.DB_APP_KM_OUTER_CONTENT = "app_km_outer_content";
exports.DB_APP_KM_SEARCH_HOT_WORDS = "app_km_search_hot_words";

exports.DB_APP_OPTIONDIC = "app_optiondic";
exports.DB_APP_ROLE = "app_role";
exports.DB_APP_MENU = "app_menu";
exports.DB_APP_SKILLGROUP = "app_skillgroup";
exports.DB_MANAGER_IVR_SKILLGROUP = "manager_ivr_skillgroup";
exports.DB_APP_MENU = "app_menu";
exports.DB_C5_CUSTOMER = "_customer";
exports.DB_CUSTOMER_TEMPLATE = "customer_template";
exports.DB_APP_NOTE = "app_note";
exports.DB_APP_NOTIFY = "app_notify";
exports.DB_APP_BUSINESS_NOTIFY = "app_business_notify";
exports.DB_APP_QUES_NOTE = "app_ques_note";
exports.DB_APP_EXTENSION_CONFIG = "app_extension_config";
exports.DB_Extension = "extension_config";
exports.DB_CUSTOMER_IMPTASK = "app_import_task";
exports.DB_CUSTOMER_EXPTASK = "app_export_task";
exports.DB_CUSTOMER_TEMP = "app_customer_temp";
exports.DB_CUSTOMER_REPEAT = "app_customer_repeat";
exports.DB_CUSTOMER_OWNER_LOG = "_customer_change_log";
exports.DB_APP_MAIL_CONFIG = "app_mail_config";
exports.DB_APP_WEIXIN_CONFIG = "app_weixin_config";
exports.DB_APP_MAIL_QUEUE = "app_mail_queue";
exports.DB_ASS_QINIU_PUSH_ACCOUNTS = "ass_qiniu_push_accounts";
exports.DB_ASS_QINIU_HAND_PUSH_ACCOUNTS = "ass_qiniu_hand_push_accounts";
exports.DB_CUSTOMER_TASK = "customer_task";
exports.DB_CUSTOMER_TASK_USER = "customer_task_user";
exports.DB_APP_KEFU_IM_CONFIG = "app_kefu_im_config";
exports.DB_APP_KEFU_IM_TODO_SHOW_CONFIG = "app_kefu_im_todo_show_config";
exports.DB_APP_SDK_VERSIONS = "app_kefu_im_sdk_versions";
exports.DB_APP_MULTI_CHANNEL_CHAT_SESSION = "app_multi_channel_chat_session";
exports.DB_APP_MULTI_CHANNEL_CHAT_QUICKREPLY = "app_multi_channel_chat_quickreply";
exports.DB_APP_KEFU_IM_MESSAGE = "app_kefu_im_message";
exports.DB_APP_KEFU_IM_ROBOT_CONFIG = "app_kefu_im_robot_config";
exports.DB_APP_IM_CUSTOMER_RELATION = "app_im_customer_relation";
exports.DB_APP_WECHAT_CONFIG = "wxaccount";
exports.DB_APP_WECHAT_MATERIAL = "material";
exports.DB_APP_WECHAT_CUSTOM_SERVICE = "wx_customservice";
exports.DB_APP_KEFU_IM_FAQ = "app_kefu_im_faq";
exports.DB_APP_PUSH_CLIENT = "app_push_client";

exports.DB_CC_USER_LIMIT = "cc_user_limit";
exports.DB_CC_USER_LIMIT_IN = "cc_user_limit_in";
exports.DB_CC_APP_MENU = "cc_app_menu";
exports.DB_CC_APP_MENU_IN = "cc_app_menu_in";
exports.DB_CC_APP_MENU_OUT = "cc_app_menu_out";
exports.DB_CC_USER_LIMIT_OUT = "cc_user_limit_out";

exports.DB_IVR_FLOW = "manager_ivr_flow";
exports.DB_IVR_NODE_BLACK_LIST = "manager_ivr_black_list";
exports.DB_IVR_NODE_ANNOUNCEMENT = "manager_ivr_announcement";
exports.DB_IVR_NODE_IVR = "manager_ivr_ivr";
exports.DB_IVR_NODE_VALIDATION = "manager_ivr_validation";
exports.DB_IVR_NODE_ROUTE = "manager_ivr_route";
exports.DB_IVR_SERVICE_NO = "manager_ivr_service_no";
exports.DB_IVR_SCHEDULE = "manager_ivr_schedule";
exports.DB_IVR_BLACK_LIST = "ivr_black_num";
exports.DB_IVR_PHONEBAR_CONFIG = 'manager_ivr_phonebar_config';
exports.DB_IVR_VAR = 'manager_ivr_var';
exports.DB_IVR_NODE_CALLURL = "manager_ivr_callurl";
exports.DB_IVR_SOUND = 'manager_ivr_sound';
exports.DB_IVR_NODE_RELATION = "ivr_node_relation";
exports.DB_IVR_NODE_EXTENSION_PEER = "manager_ivr_extension_peer";
exports.DB_IVR_NODE_ASSIGNMENT = "manager_ivr_assignment";
exports.DB_IVR_SYSTEM = "manager_ivr_system";
exports.DB_IVR_NODE_TEXT_ANNOUNCEMENT = "manager_ivr_text_announcement";
exports.DB_ACCOUNT_LINE = "manager_account_line";
exports.DB_IVR_NODE_ROOM = "manager_ivr_room";
exports.DB_IVR_NODE_SATISFACTION = "manager_ivr_satisfaction";
exports.DB_IVR_NODE_SUPERDIALJOBNUM = "manager_ivr_superDialJobNum";
exports.DB_IVR_NODE_VOICE_MAIL = "manager_ivr_voicemail";
exports.DB_IVR_NODE_ENCRYPT_MD5 ='manager_ivr_encrypt_md5';
exports.DB_IVR_NODE_IVR_MENU = "manager_ivr_ivrMenu";
exports.DB_SKILLGROUP = "skillgroup";
exports.DB_MANAGER_DIALOUT_LINE = "manager_server_line";
exports.DB_IVR_TOOLS_UTIL = "manager_ivr_tools_util";
exports.DB_IVR_PROCESS = "manager_ivr_process";

//快捷回复（系统）
exports.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY_TAGS="app_multi_channel_system_quickreply_tags";
exports.DB_APP_MULTI_CHANNEL_SYSTEM_QUICKREPLY="app_multi_channel_system_quickreply";

//extension type
exports.EXTENSION_TYPE_SIP = "sip";
exports.EXTENSION_TYPE_LOCAL = "Local";
exports.EXTENSION_TYPE_GUARD = "guard";
exports.EXTENSION_TYPE_GATEWAY = "gateway";

//phonebarconfig
exports.PHONE_TYPE_FREE = "空闲";
exports.PHONE_TYPE_BUSY = "忙碌";
exports.PHONE_TYPE_REST = "小休";
exports.PHONE_SYSTEM_BUSY = "系统置忙";

exports.EXTENSION_TYPE_GATEWAY = "gateway";
exports.DB_C5_SMS = "c5_sms";
exports.APP_SMS_COMMIT = "commit";
exports.APP_SMS_SUCCESS = "success";
exports.APP_SMS_FAILED = "failed";

exports.DB_BUSINESS_TAG = "business_tag";
exports.DB_ACCOUNT_BUSINESS_FLOW = "account_business_flow";
exports.DB_ACCOUNT_BUSINESS_FLOW_STEP = "account_business_flow_step";
exports.DB_ACCOUNT_BUSINESS_FLOW_FIELD = "account_business_flow_field";

exports.DB_ACCOUNT_BUSINESS_REPORT = "account_business_report";

exports.DB_ACCOUNT_BUSINESS = "_business";
exports.DB_ACCOUNT_BUSINESS_HISTORY = "_business_history";

exports.DB_ACCOUNT_QUESTIONNAIRE = "_questionnaire";

exports.DB_ACCOUNT_QUESTIONNAIRE_LOG = "account_questionnaire_log";
exports.DB_ACCOUNT_QUESTIONNAIRE_TEMP = "account_questionnaire_temp";
exports.DB_ACCOUNT_QUESTIONNAIRE_QUESTION = "account_questionnaire_question";
exports.DB_ACCOUNT_QUESTIONNAIRE_FIELD = "account_questionnaire_field";

exports.DB_CALL_SHEET_LEAK = "_c5_call_sheet_leak";
exports.DB_ACCOUNT_CALL_SHEET = "_c5_call_sheet";
exports.DB_CALL_SHEET_QUALITY_CHECK = "app_call_sheet_quality_check";
exports.DB_CALL_SHEET_QUALITY_CHECK_LISTEN_LOG = "app_call_sheet_quality_check_listen_log";
exports.DB_MANAGER_QUALITY_CHECK_RANDOM_TEMPLATE = "manager_quality_check_random_template";
exports.DB_MANAGER_QUALITY_TASK_TEMPLATE = "manager_quality_task_template";
exports.DB_MANAGER_QUALITY_CHECK_CONFIG = "manager_quality_check_config";
exports.DB_MANAGER_QUALITY_CHECK_CYCLE_CONFIG = "manager_quality_check_cycle_config";
exports.DB_MANAGER_CALL_LABEL = "manager_call_label";
exports.DB_SYSTEM_CONFIG = "system_config";
exports.DB_CUSTOMER_SYNC_CONFIG = "app_customer_sync_config";
exports.DB_HISTORY = "_history";

exports.DB_REPORT_TABLE_HEADER_CONFIG = "app_report_table_header_config";
exports.DB_REPORT_QUEUE_HOUR = "app_report_queue_hour";
exports.DB_REPORT_AGENT_HOUR = "app_report_agent_houre";
exports.DB_REPORT_SERVICE_CALL_IN = "app_report_service_call_in";
exports.DB_REPORT_APPROVE_SURVEY = "app_report_approve_survey";
exports.DB_REPORT_CALL_OUT = "app_report_call_out";
//mongo3.0 report table name
exports.DB_NEW_REPORT_QUEUE_HOUR = "cdr_report_queue_hour";
exports.DB_NEW_REPORT_AGENT_HOUR = "cdr_report_agent_houre";
exports.DB_NEW_REPORT_SERVICE_CALL_IN = "cdr_report_service_call_in";
exports.DB_NEW_REPORT_APPROVE_SURVEY = "cdr_report_approve_survey";
exports.DB_NEW_REPORT_CALL_OUT = "cdr_report_call_out";
exports.DB_IM_MESSAGE_REPORT = "cc_im_message_report";
exports.DB_CUSTOMER_INCREASE_REPORT = "cc_customer_increase_report";

exports.DB_APP_AUTOCALL = "app_autocall";
exports.DB_APP_AUTOCALL_TASK = "app_autocall_task";
exports.DB_APP_AUTOCALL_NEW = "app_autocall_new";
exports.DB_APP_AUTOCALL_IMPORT = "app_autocall_import";
//callRecord
exports.DB_CALLRECORD_TEMPLATE = "callRecord_template";
exports.DB_CALLRECORD = "_call_record";

exports.DB_CDR_CUSTOMER_RELATION = "cdr_customer_relation";

exports.TASK_NOTIFY_CREATE = "taskCreate";
exports.TASK_NOTIFY_COMPLETE = "taskComplete";

exports.BUSINESS_NOTIFY_ASSIGN = "businessAssign";
exports.BUSINESS_NOTIFY_ASSIGN_ROLE = "businessAssignRole";

exports.CUSTOMER_NOTIFY_ASSIGN = "custAssign";

exports.DB_ACCOUNT_CDR_PEER = "_cdr_peer";
exports.DB_C5_CUSTOMER = "_customer";

exports.DB_INTERFACE_URL = "manager_interface_url";
exports.DB_TAB_URL = "manager_tab_url";
exports.DB_CALL_URL = "manager_call_url";
exports.DB_DIALOUT_URL = "manager_dialout_url";
exports.DB_CALL_INTER_HISTORY = "manager_call_inter_history";
//callevent
exports.DB_INTERFACE_CONFIG_EVENT = "manager_interface_config_event";
exports.MANAGER_CALL_LABEL = "manager_call_label";

//new app
exports.DB_PLATFORM_ACCOUNT = "platform_account";
exports.DB_PLATFORM_ACCOUNT_PRODUCT = "platform_account_product";
exports.DB_PLATFORM_CC_PBX = "platform_cc_pbx";
exports.DB_PLATFORM_CC_BOARD = "platform_cc_board";
exports.DB_PLATFORM_CC_BOARD_OUTROUTE = "platform_cc_board_outRoute";
exports.DB_PLATFORM_LINE = "platform_line";
exports.DB_PLATFORM_TOKEN = "platform_token";
exports.DB_PLATFORM_USER = "platform_user";
exports.DB_PLATFORM_DEPARTMENT = "platform_department";
exports.DB_PLATFORM_SIPNUM = "platform_sipNum";
exports.DB_PLATFORM_SERVICENUM = "platform_serviceNum";
exports.DB_PLATFORM_NUM400 = "platform_num400";
exports.DB_PLATFORM_QUEUE = "platform_queue";
exports.DB_PLATFORM_SMS_CHANNEL = "platform_sms_channel";
exports.DB_BILL_SYSTEM_USER = "bill_system_user";
exports.DB_APP_SMS_SEND = "app_sms_send";
exports.DB_APP_SMS_SIGN = "app_sms_sign";
exports.DB_APP_SMS_TEMPLATE = "app_sms_template";
exports.DB_CC_HANGUP_SMS_TEMPLATE = "cc_hangup_sms_template";
exports.DB_APP_SMS_IMPORT_INVALID = "app_sms_import_invalid";
exports.DB_SMS = "_sms";
exports.DB_BILL_CDR_QUERY_CC = "bill_cdr_query_cc";
exports.DB_IM_CONTACTS_VERSION = "im_contacts_version";
exports.DB_YTX_TEMPLATE_ID = "ytx_template_id";

exports.product_cc ="cc";
exports.product_zj ="zj";

//batch dial task status
exports.task_status_ready = "ready";
exports.task_status_start = "start";
exports.task_status_finish = "finish";
exports.task_status_delete = "delete";

exports.task_numType_import = "import";
exports.task_numType_generate = "generate";

exports.task_taskType_normal = "normal";
exports.task_taskType_time = "time";

exports.task_timeType_staticDate = "staticDate";
exports.task_timeType_everyDay = "everyDay";

//customer change log
exports.custLog_assign = "assign";
exports.custLog_assignOut = "assignOut";
exports.custLog_clearOwner = "clearOwner";
exports.custLog_updateStatus = "updateStatus";
exports.custLog_selfCreate = "selfCreate";
exports.custLog_import = "import";
exports.custLog_import_assign = "import_assign";
exports.custLog_updateOwner2Add = "updateOwner2Add";//更新到的所属人记录
exports.custLog_updateOwner2Reduce = "updateOwner2Reduce";//原来所属人减少客户记录
exports.custLog_use = "use";
exports.custLog_giveUp = "giveUp";
exports.custLog_delete = "delete";
exports.custLog_batchDelete = "batchDelete";
exports.custLog_batchUpdateStatus = "batchUpdateStatus";


exports.CUSTOMER_MAX_COMMONNUM = 100;
exports.CUSTOMER_DEFAULT_STATUS = "status0";

exports.data_scope_level ="level";
exports.data_scope_all ="all";
exports.data_scope_dept ="dept";
exports.data_scope_deptLevel ="deptLevel";




exports.DB_APP_MAIL = "app_mail";
exports.DB_APP_MAILSIGN = "app_mail_sign";
exports.DB_APP_WEIXIN = "app_weixin";
exports.DB_APP_WEIXIN_USER = "app_weixin_user";


exports.DB_APP_WEBCHAT = "app_kefu_im_message";
exports.DB_APP_WEBCHAT_USER = "app_kefu_im_session";
exports.DB_APP_CHANNEL_DIC = "app_channel_dic";
exports.DB_APP_SEO_SOURCE = "app_seo_source";


exports.DB_APP_KEFU_GLOBAL_SET = "app_kefu_global_set";

//新增邮件配置功能
exports.APP_EMAIL_CONFIG = "app_email_config";
exports.APP_EMAIL_CHANNEL_SESSION = "app_email_channel_session";
exports.APP_EMAIL_MAILS = "app_email_mails";
exports.APP_EMAIL_CUSTOMER_RELATE = "app_email_customer_relate";
exports.APP_EMAIL_MAIL_SIGN = "app_email_sign";
exports.APP_EMAIL_MAIL_CATEGORY = "app_email_category";
exports.APP_AGENT_AUTOCLAIM_INFO = "app_agent_autoclaim_info";


exports.DB_CUSTOMER_SAMPLE_REPEAT="customer_sample_repeat";
exports.DB_CUSTOMER_DIAL_TASK="customer_dial_task";
exports.DB_CUSTOMER_DIAL_TASK_USER="customer_dial_task_user";
exports.DB_CUSTOMER_SAMPLE = "_customer_sample";
exports.DB_CUSTOMER_SAMPLE_ARCHIVE="customer_sample_archive";
exports.DB_CUSTOMER_DIAL_TASK_USER_DAILY = "customer_dial_task_user_daily";
exports.custLog_archive = "archive";
exports.DB_APP_CUSTOMER_APPROVAL = "app_customer_approval";
exports.DB_APP_CUSTOMER_APPROVAL_BUSINESS = "app_customer_approval_business";
exports.DB_APP_CUSTOMER_TITKET = "app_customer_titket";
exports.DB_APP_QUICK_SEARCH="app_quick_search";
exports.DB_APP_CUSTOMER_POOL = "app_customer_pool";
exports.DB_APP_EXPORT_TASK = "app_export_task";

//db_report
exports.CC_CUSTOMER_STATUS_REPORT = "cc_customer_status_report";
exports.CC_CUSTOMER_SALES_REPORT = "cc_customer_sales_report";
exports.CC_CUSTOMER_OPPORTUNITY_REPORT = "cc_customer_opportunity_report";

//db_report cc_collect
exports.COLLECT_AGENT_PC_INFO= "collect_agent_pc_info";