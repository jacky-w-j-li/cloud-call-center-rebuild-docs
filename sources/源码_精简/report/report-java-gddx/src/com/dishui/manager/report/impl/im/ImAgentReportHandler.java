package com.dishui.manager.report.impl.im;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;

import java.util.Map;

/**
 * Created by chenguang on 11/8/15.
 *
 * 在线客服报表
 */
public class ImAgentReportHandler{
    public static ImAgentReportHandler instance;

    private ImAgentReportHandler(){
        instance = this;
    }

    public static ImAgentReportHandler getInstance(){
        if (instance == null)
            new ImAgentReportHandler();
        return instance;
    }

    public void closeSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        if(map.get("agentId") == null){
            return;
        }
        //坐席工作量表
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("platform", map.get("platform"));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("sessionCompleteCount", 1);
        int timeLength = (Integer)map.get("agentSessionTimeLength");
        incDoc.put("sessionToTalTimeLength", Math.floor(timeLength/1000)); //单位分钟
        MongoProvider.update(Constant.IM_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }
    
    public void newMsgOut(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("agentId", map.get("agentId"));
        condition.put("platform", map.get("platform"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("replyCount", 1);
        MongoProvider.update(Constant.IM_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

    }


    
    public void accessSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("platform", map.get("platform"));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("accessSessionCount", 1);
        MongoProvider.update(Constant.IM_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }


    public void redirectSession(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("platform", map.get("platform"));
        BasicDBObject incDoc = new BasicDBObject();
        condition.put("agentId", map.get("agentId"));
        incDoc.put("sessionRollOutCount", 1);
        int timeLength = (Integer)map.get("sessionTimeLength");
        incDoc.put("sessionToTalTimeLength", Math.floor(timeLength/1000)); //单位s
        MongoProvider.update(Constant.IM_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        if(!map.get("toUser").equals("pool") && map.get("toUser")!=null && map.get("toUser")!=""){
            BasicDBObject condition1 = new BasicDBObject();
            condition1.put("account", event.getAccount());
            condition1.put("yearId", event.getYearId());
            condition1.put("monthId", event.getMonthId());
            condition1.put("dayId", event.getDayId());
            condition1.put("reportTime", Utils.getReportTime(event.getReportTime()));
            condition1.put("platform", map.get("platform"));
            BasicDBObject incDoc1 = new BasicDBObject();
            condition1.put("agentId", map.get("toUser"));
//            incDoc1.put("accessSessionCount", 1);
            incDoc1.put("sessionRollInCount", 1);
            MongoProvider.update(Constant.IM_AGENT_REPORT_TABLE, condition1, new BasicDBObject("$inc", incDoc1), true);
        }

    }


    public void reduceSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        if(map.get("agentId") == null){
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("platform", map.get("platform"));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("accessSessionCount", -1);
        MongoProvider.update(Constant.IM_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    public void firstReply(Event event) {
        System.out.println(event.toString());
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        int timeLength = (Integer)map.get("firstResponseTimeLength");
        incDoc.put("firstResponseTotalTimeLength", Math.floor(timeLength/1000)); //单位秒
        incDoc.put("responseCount", 1); //单位秒
        MongoProvider.update(Constant.IM_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }
}
