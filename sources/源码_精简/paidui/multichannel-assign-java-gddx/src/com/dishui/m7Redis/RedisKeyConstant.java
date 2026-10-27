package com.dishui.m7Redis;

/**
 * Created by zengyx on 16/6/16.
 */
public class RedisKeyConstant {
    public static final int REDIS_DB0 = 0;
    public static final int REDIS_DB1 = 1;
    public static final String REDIS_FAIL = "FAIL";
    public static final String REDIS_OK = "OK";

    public static final String MULTICHANNEL_SKILLGROUP = "multi_skillgroup_"; //技能组前缀

    public static final String AGENT_IM_DEAL_COUNT = "imDealCount_"; //imDealCount_$agentId, 座席能同时处理最大的im会话数
    public static final String AGENT_EMAIL_DEAL_COUNT = "emailDealCount_"; //emailDealCount_$agentId, 座席能同事处理的的最大的email会话数
    public static final String AGENT_CURR_IM_DEAL_COUNT = "currImDealCount_"; //座席当前处理的im会话数
    public static final String AGENT_CURR_ONLINE = "agentOnline_";
    public static final String AGENT_CURR_EMAIL_COUNT = "currEmailDealCount_";
    public static final String ONLINE_AGENT_INFO = "onlineAgent_";
    public static final String AGENT_IM_DEALED_COUNT = "imDealedCount_"; //处理了多少个,掉线就清0

    public static final String REDIS_IM_ASSIGN_TASK = "im_assign_task";
    public static final String IM_ASSIGN_MEMORY = "queueMemory_";

}
