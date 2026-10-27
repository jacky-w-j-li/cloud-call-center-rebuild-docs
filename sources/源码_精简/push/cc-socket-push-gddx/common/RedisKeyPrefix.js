/**
 * redis存储键 前缀命名
 *
 */
exports.REDIS_DB0 = 0;
exports.REDIS_DB1 = 1;
exports.MULTICHANNEL_SKILLGROUP = "multi_skillgroup_"; //技能组前缀

exports.AGENT_IM_DEAL_COUNT = "imDealCount_"; //imDealCount_$agentId, 座席能同时处理最大的im会话数
exports.AGENT_EMAIL_DEAL_COUNT = "emailDealCount_"; //emailDealCount_$agentId, 座席能同事处理的的最大的email会话数
exports.AGENT_CURR_IM_DEAL_COUNT = "currImDealCount_"; //座席当前处理的im会话数
exports.AGENT_CURR_ONLINE = "agentOnline_";
exports.AGENT_CURR_EMAIL_COUNT = "currEmailDealCount_";
exports.ONLINE_AGENT_INFO = "onlineAgent_";
exports.AGENT_IM_DEALED_COUNT = "imDealedCount_"; //掉线就直接删除key, 记录处理了多少个会话
exports.AGENT_EMAIL_DEALED_COUNT = "emailDealedCount_"; //掉线就直接删除key, 记录处理了多少个会话
