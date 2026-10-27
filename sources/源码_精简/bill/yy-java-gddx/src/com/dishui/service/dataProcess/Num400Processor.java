package com.dishui.service.dataProcess;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Date;
import java.util.List;

public class Num400Processor implements  Processor {

    private static String name = "num400";
    private long validTime = 8 * 60 * 60 * 1000 + 10 * 60 * 1000;


    @Override
    public void process() {

        long now = new Date().getTime();
        long minTime = now - validTime;
        String date = Utils.getDate(minTime);
        List<DBObject> nums = MongoProvider.find("platform_num400", new BasicDBObject().append("status", "ready").append("readyTime", new BasicDBObject().append("$lt", date)));
        if (nums != null && nums.size() > 0) {
            for (int i = 0; i < nums.size(); i++) {
                try {

                    DBObject num = nums.get(i);
                    DBObject update = new BasicDBObject();
                    update.put("status", "free");
                    update.put("account", "");
                    update.put("product","");
                    update.put("pbx","");
                    update.put("balance",0);
                    if (num.get("initFee") != null) {
                        DBObject init = (DBObject)num.get("initFee");
                        if(init.get("min400Consume") != null)
                            update.put("min400Consume",init.get("min400Consume"));
                        if(init.get("dial400FeeStrategy") != null)
                            update.put("dial400FeeStrategy",init.get("dial400FeeStrategy"));
                        if(init.get("dial400Fee") != null)
                            update.put("dial400Fee",init.get("dial400Fee"));
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
