package com.dishui.service.dataProcess;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Date;
import java.util.List;

public class ServiceNumProcessor implements Processor {
    private static String name = "serviceNum";
    private long validTime = 8 * 60 * 60 * 1000 + 10 * 60 * 1000;

    @Override
    public void process() {
        long now = new Date().getTime();
        long minTime = now - validTime;
        String date = Utils.getDate(minTime);
        List<DBObject> nums = MongoProvider.find("platform_serviceNum", new BasicDBObject().append("status", "ready").append("readyTime", new BasicDBObject().append("$lt", date)));
        if (nums != null && nums.size() > 0) {
            for (int i = 0; i < nums.size(); i++) {
                try {
                    DBObject num = nums.get(i);
                    DBObject update = new BasicDBObject();
                    update.put("status", "free");
                    update.put("concurrent",1);
                    update.put("flag", "");
                    update.put("account", "");
                    update.put("pbx","");
                    update.put("product","");
                    if (num.get("monthRentInit") != null && !String.valueOf(num.get("monthRentInit")).equals("")) {
                        update.put("monthRent", num.get("monthRentInit"));
                    }
                    MongoProvider.update("platform_serviceNum", new BasicDBObject().append("_id", num.get("_id")), new BasicDBObject().append("$set", update));
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    @Override
    public String getName() {
        return name;
    }
}
