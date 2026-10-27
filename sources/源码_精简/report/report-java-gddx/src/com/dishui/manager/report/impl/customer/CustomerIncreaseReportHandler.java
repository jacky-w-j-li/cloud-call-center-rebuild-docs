package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;

import java.util.Map;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/11/16.
 */
public class CustomerIncreaseReportHandler {
    private static final Logger log = Logger.getLogger(CustomerIncreaseReportHandler.class.getName());
    private static String UnknowSource = "unknow"; //无账户来源

    public static void newCustomer(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount());
        condition.put("account", event.getAccount());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());
        String source = UnknowSource;
        if(map != null && map.get("source") != null){
            if(!map.get("source").equals("")){
                source = (String)map.get("source");
            }
        }
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put(source, 1);

        MongoProvider.update(Constant.CUSTOMER_INCREASE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

    }


    public static void updateCustomerSource(Event event){
        Map<String, Object> map = event.getBusinessData();
        String createTime =  (String)map.get("createTime");
//        System.out.println("createTime===="+createTime);
       // event.resetReportTime(createTime);
        Map<String, String> timeMap = DateUtil.parseTime(createTime);
        String yearId  = timeMap.get("yearId");
        String monthId = yearId + timeMap.get("monthId");
        String dayId = monthId + timeMap.get("dayId");

        BasicDBObject condition = new BasicDBObject();
        String createDate = event.getDayId();
        condition.put("_id",  createDate + "_" + event.getAccount());
        condition.put("account", event.getAccount());
        condition.put("year", yearId);
        condition.put("month",monthId);
        condition.put("day",dayId);

        String source = UnknowSource;
        String oldSource = UnknowSource;
        if(map != null && map.get("source") != null){
            if(!map.get("source").equals("")){
                source = (String)map.get("source");
            }
        }
        if(map != null && map.get("oldSource") != null){
            if(!map.get("oldSource").equals("")){
                oldSource = (String)map.get("oldSource");
            }
        }
        if(source.equals(oldSource)){
             return;
        }
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put(source, 1);
        incDoc.put(oldSource, -1);
        MongoProvider.update(Constant.CUSTOMER_INCREASE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

    }


}
