package com.dishui.manager.report.impl.im;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.WriteConcern;

import java.util.Map;

/**
 * Created by yaxi on 15-11-9.
 *
 */
public class ImMessageReportHandler {

    public static ImMessageReportHandler instance;

    private ImMessageReportHandler(){
        instance = this;
    }

    public static ImMessageReportHandler getInstance(){
        if (instance == null)
            new ImMessageReportHandler();
        return instance;
    }



    public void newVisitor(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("hourId", event.getHourId());
        condition.put("minuteId", event.getMinuteId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId") == null? "":map.get("accessId"));
        BasicDBObject incDoc = new BasicDBObject();
        if(map.get("agentType").equals("robot")){
            incDoc.put("robotVisitorCount", 1);
        }
        incDoc.put("visitorCount", 1);
        MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    
    public void newSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("hourId", event.getHourId());
        condition.put("minuteId", event.getMinuteId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId") == null? "":map.get("accessId"));
        if(map.get("seoSource")!=null && !map.get("seoSource").equals("")){
            condition.put("seoSource", map.get("seoSource"));
        }
        if(map.get("seoKeywords")!=null && !map.get("seoKeywords").equals("")){
            condition.put("seoKeywords", map.get("seoKeywords"));
        }
        if(map.get("fromUrl")!=null && !map.get("fromUrl").equals("")){
            condition.put("fromUrl", map.get("fromUrl"));
        }
        if(map.get("area")!=null && !map.get("area").equals("")){
            condition.put("area", map.get("area"));
        }
        BasicDBObject incDoc = new BasicDBObject();
        if(map.get("agentType").equals("robot")){
            incDoc.put("robotSessionCount", 1);
        }else{
            incDoc.put("sessionCount", 1);
        }
        MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true,new WriteConcern(1));
        if(map.get("urlTitle")!=null && !map.get("urlTitle").equals("")){
        	BasicDBObject setDoc = new BasicDBObject();
        	setDoc.put("urlTitle", map.get("urlTitle"));
            MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$set", setDoc), false);
        }
        
    }

    
    public void closeSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        //在线客服消息报表
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("hourId", event.getHourId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId") == null? "":map.get("accessId"));
        BasicDBObject incDoc = new BasicDBObject();
        if(map.get("consultType") == null){

        }else{
            String flag = map.get("flag") == null ? "" : (String)map.get("flag");
            if(flag.equals("good")){
                incDoc.put("goodCount", 1); //优质会话数
            }else if(flag.equals("bad")){
                incDoc.put("badCount", 1); //劣质
            }else if(flag.equals("medium")){
                incDoc.put("mediumCount", 1); //中等
            }
            incDoc.put("finishSessionCount", 1); //完成会话数
            int timeLength = (Integer) map.get("sessionTimeLength");
            incDoc.put("sessionTotalTimeLength", Math.floor(timeLength/1000)); //单位s
            MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }

    }

    
    public void firstReply(Event event) {
        Map<String, Object> map = event.getBusinessData();
        Integer flag = map.get("lastRedirectTime") == null? 0 : (Integer)map.get("lastRedirectTime");
        if(flag == 1){
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId") == null? "":map.get("accessId"));
        BasicDBObject incDoc = new BasicDBObject();
        int timeLength = map.get("sessionFirstResponseTimeLength") == null ? (Integer)map.get("firstResponseTimeLength") : (Integer)map.get("sessionFirstResponseTimeLength");
        incDoc.put("firstResponseTotalTimeLength", Math.floor(timeLength/1000)); //单位秒
        incDoc.put("responseCount", 1); //单位秒
        MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    
    public void newMsgIn(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("hourId", event.getHourId());
        condition.put("minuteId", event.getMinuteId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId") == null? "":map.get("accessId"));
        System.out.println(condition);
        BasicDBObject incDoc = new BasicDBObject();
        if(map.get("agentType").equals("robot")){
            incDoc.put("robotMessageCount" , 1);
        }else{
            incDoc.put("messageCount", 1);
        }
        MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    public void convertManual(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("hourId", event.getHourId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId") == null? "":map.get("accessId"));
        if(map.get("seoSource")!=null && !map.get("seoSource").equals("")){
            condition.put("seoSource", map.get("seoSource"));
        }
        if(map.get("seoKeywords")!=null && !map.get("seoKeywords").equals("")){
            condition.put("seoKeywords", map.get("seoKeywords"));
        }
        if(map.get("fromUrl")!=null && !map.get("fromUrl").equals("")){
            condition.put("fromUrl", map.get("fromUrl"));
        }
        if(map.get("area")!=null && !map.get("area").equals("")){
            condition.put("area", map.get("area"));
        }
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("convertManualCount", 1);
        incDoc.put("sessionCount", 1);
        MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true,new WriteConcern(1));
        if(map.get("urlTitle")!=null && !map.get("urlTitle").equals("")){
        	BasicDBObject setDoc = new BasicDBObject();
        	setDoc.put("urlTitle", map.get("urlTitle"));
            MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$set", setDoc), false);
        }
    
    }

    public void reduceSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("hourId", event.getHourId());
        condition.put("minuteId", event.getMinuteId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        BasicDBObject incDoc = new BasicDBObject();
        if(map.get("agentType").equals("robot")){
            incDoc.put("robotSessionCount",-1);
        }else{
            incDoc.put("sessionCount", -1);
        }
        MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    public void lostSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("platform", map.get("platform"));
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("hourId", event.getHourId());
        condition.put("minuteId", event.getMinuteId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId") == null? "":map.get("accessId"));
        if(map.get("seoSource")!=null && !map.get("seoSource").equals("")){
            condition.put("seoSource", map.get("seoSource"));
        }
        if(map.get("seoKeywords")!=null && !map.get("seoKeywords").equals("")){
            condition.put("seoKeywords", map.get("seoKeywords"));
        }
        if(map.get("fromUrl")!=null && !map.get("fromUrl").equals("")){
            condition.put("fromUrl", map.get("fromUrl"));
        }
        if(map.get("area")!=null && !map.get("area").equals("")){
            condition.put("area", map.get("area"));
        }
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("lostSessionCount",1);
        MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true,new WriteConcern(1));
        if(map.get("urlTitle")!=null && !map.get("urlTitle").equals("")){
        	BasicDBObject setDoc = new BasicDBObject();
        	setDoc.put("urlTitle", map.get("urlTitle"));
            MongoProvider.update(Constant.IM_MESSAGE_REPORT_TABLE, condition, new BasicDBObject("$set", setDoc), false);
        }
    }
}
