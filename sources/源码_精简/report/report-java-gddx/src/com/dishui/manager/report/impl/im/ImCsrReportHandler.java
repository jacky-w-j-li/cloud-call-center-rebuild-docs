package com.dishui.manager.report.impl.im;

import java.util.Map;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;

/**
 * 
 * @author xulk
 * 在线客服坐席满意度
 */
public class ImCsrReportHandler {
    public static ImCsrReportHandler instance;

    private ImCsrReportHandler(){
        instance = this;
    }

    public static ImCsrReportHandler getInstance(){
        if (instance == null)
            new ImCsrReportHandler();
        return instance;
    }


    
    public void closeSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        if(map.get("agentId") == null){
            return;
        }
        //坐席对话数
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("agentId", map.get("agentId"));
        condition.put("channel", map.get("platform"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("sessionCount", 1);
        MongoProvider.update(Constant.CC_IM_CSR_REPORT, condition, new BasicDBObject("$inc", incDoc), true);
    }
    
    public void pushSatisfaction(Event event) {
    	
        //各个满意度  总评价数
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
        condition.put("agentId", map.get("agentId"));
        condition.put("channel", map.get("platform"));
        BasicDBObject incDoc = new BasicDBObject();
        
        incDoc.put("totalAppraiseCount", 1);
        if("out".equals(map.get("way").toString())){ //主动评价
        	incDoc.put("outCount",1);
        }else{
        	incDoc.put("inCount",1);
        }
        incDoc.put(map.get("appraiseKey").toString(),1);
        MongoProvider.update(Constant.CC_IM_CSR_REPORT, condition, new BasicDBObject("$inc", incDoc), true);
    }
}
