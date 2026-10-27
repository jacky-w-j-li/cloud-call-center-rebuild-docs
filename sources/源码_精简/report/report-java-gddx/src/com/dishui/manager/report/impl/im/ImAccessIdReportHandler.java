package com.dishui.manager.report.impl.im;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;
import com.dishui.manager.service.Utils;

import java.util.Map;

/**
 * Created by yaxi on 15-11-20.
 * 接入号报表
 */
public class ImAccessIdReportHandler {
    public static ImAccessIdReportHandler instance;

    private ImAccessIdReportHandler(){
        instance = this;
    }

    public static ImAccessIdReportHandler getInstance(){
        if (instance == null)
            new ImAccessIdReportHandler();
        return instance;
    }
    /**
     * 新session
     * @param event
     */
    public void newSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("totalSessionCount", 1);
        if(map.get("agentType").equals("robot")){
            incDoc.put("robotSessionCount", 1);
        }else{
            incDoc.put("manualSessionCount", 1);
        }
        MongoProvider.update(Constant.IM_ACCESSID_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 关闭会话
     * @param event
     */
    public void closeSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("finishSessionCount", 1); //完成会话数
        MongoProvider.update(Constant.IM_ACCESSID_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 转人工
     * @param event
     */
    public void convertManual(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("robotToManualSessionCount", 1);
        MongoProvider.update(Constant.IM_ACCESSID_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    public void accessSession(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("accessId", map.get("accessId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("accessSessionCount", 1);
        MongoProvider.update(Constant.IM_ACCESSID_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }
}
