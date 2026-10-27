package com.dishui.manager.billReport.impl.maintenance;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.Map;

/**
 * Created by jackwong on 16/4/7.
 */
public class MaintenanceTeletrafficReportHandler {
    /**
     * 完成一次通话
     *
     * @param event
     */
    public static void completeCall(Event event) {
        Map<String,Object> map = event.getBusinessData();

        String lineId = (String)map.get("line");
        if(lineId == null){
            return;
        }

        BasicDBObject condition = new BasicDBObject();
        condition.put("_id",generateId(event,lineId));
        condition.put("line",lineId);
        condition.put("yearId", event.getYearId());
        condition.put("seasonId",event.getSeasonId());
        condition.put("monthId",event.getMonthId());
        condition.put("dayId",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("milliseconds",map.get("milliseconds"));

        MongoProvider.update(Constant.BILL_MAINTENANCE_TELETRAFFIC_REPORT_TABLE,condition,new BasicDBObject("$inc",incDoc),true);
    }

    private static String generateId(Event event,String lineId){
        if(event == null || lineId == null){
            return null;
        }
        return event.getDayId()+'_'+ lineId;
    }
}
