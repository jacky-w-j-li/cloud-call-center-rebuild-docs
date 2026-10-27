/**
 * redis存储键 前缀命名
 */
exports.REDIS_DB0 = 0;
exports.REDIS_DB1 = 1;
exports.REDIS_DB2 = 2;

exports.V20160818_CUSTOMER_GETTEMPLATE_COUNT = "v20160818CustomerGetTemplateCount"; //获取客户版本号字段接口
exports.V20160818_CUSTOMER_SELECT_COUNT = "v20160818CustomerSelectCount"; //客户资料查询接口
exports.V20160818_CUSTOMER_INSERT_COUNT = "v20160818CustomerInsertCount"; //客户资料新增接口
exports.V20160818_CUSTOMER_UPDATE_COUNT = "v20160818CustomerUpdateCount"; //客户资料修改接口
exports.V20160818_CUSTOMER_DELETE_COUNT = "v20160818CustomerDeleteCount"; //客户资料删除接口
exports.V20160818_WEBCHAT_QUERYWEBCHATSESSION_COUNT = "v20160818WebchatQueryWebchatSessionCount"; //获取在线客户会话
exports.V20160818_WEBCHAT_QUERYWEBCHATMESSAGE_COUNT = "v20160818WebchatQueryWebchatMessageCount"; //根据在线客户会话sid获取聊天记录

exports.initCacheMethod = [ "V20160818_CUSTOMER_GETTEMPLATE_COUNT",
                            "V20160818_CUSTOMER_SELECT_COUNT",
                            "V20160818_CUSTOMER_INSERT_COUNT",
                            "V20160818_CUSTOMER_UPDATE_COUNT",
                            "V20160818_CUSTOMER_DELETE_COUNT",
                            "V20160818_WEBCHAT_QUERYWEBCHATSESSION_COUNT",
                            "V20160818_WEBCHAT_QUERYWEBCHATMESSAGE_COUNT" ];