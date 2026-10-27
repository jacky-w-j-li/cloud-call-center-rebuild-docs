package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.Map;
import java.util.logging.Logger;

/**
 * Created by wangmeng on 28/3/16.
 */
public class CustomerChangeLogReportHandler {
    private static final Logger log = Logger.getLogger(CustomerChangeLogReportHandler.class.getName());

    public static void newChangeLog(Event event){
        Map<String, Object> map = event.getBusinessData();
        if(map==null)return;
        String id = event.getId();
        String time = event.getReportTime();
        String account = event.getAccount();
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id",id);
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("_id",id);
        incDoc.put("time",time);
        incDoc.put("account",account);
        incDoc.put("user",map.get("user"));
        incDoc.put("type",map.get("tType"));
        incDoc.put("cid",map.get("_id"));
        incDoc.put("content",map.get("content"));
        if(map.get("lastTime") instanceof Double){
            Double lastTime=(Double) map.get("lastTime");
            incDoc.put("lastTime",lastTime.longValue());
        }else if(map.get("lastTime") instanceof Long){
            incDoc.put("lastTime",map.get("lastTime"));
        }
        MongoProvider.update("customer_change_log", condition, new BasicDBObject("$set", incDoc), true);

    }



}
