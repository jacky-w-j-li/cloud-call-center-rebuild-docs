package com.dishui.manager.report.impl.im;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;

import java.util.Map;

/**
 * Created by yaxi on 15-11-9.
 * 在线客服业务分析报表
 */
public class ImBusinessReportHandler{
    public static ImBusinessReportHandler instance;

    private ImBusinessReportHandler(){
        instance = this;
    }

    public static ImBusinessReportHandler getInstance(){
        if (instance == null)
            new ImBusinessReportHandler();
        return instance;
    }


    public void closeSession(Event event) {
        //业务分析报表
        Map<String, Object> map = event.getBusinessData();
        if(map.get("consultType") == null){
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("consultType", map.get("consultType"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put(map.get("platform").toString(),1);
        MongoProvider.update(Constant.IM_BUSINESS_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

}
