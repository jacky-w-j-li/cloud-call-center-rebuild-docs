package com.dishui.notify;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Calendar;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

public class UserSalesTask extends TimerTask {
    private static Logger log = Logger.getLogger(UserSalesTask.class.getName());

    @Override
    public void run() {
        try {
            Calendar now = Calendar.getInstance();
            int week = now.get(Calendar.DAY_OF_WEEK) - 1;
            if (week < 0)  week = 0;

            log.info("UserSalesTask hour::=============" + now.get(Calendar.HOUR_OF_DAY));
            if (now.get(Calendar.HOUR_OF_DAY) != 0) {
                return;
            }
            resetDaySales(week);

        } catch (Exception e) {
            log.log(Level.WARNING, "process UserSalesTask exception! ", e);
            e.printStackTrace();
        }
    }



    /**
     * 重置每人每日的商机数，若是周一，则重置每周的商机数
     */
    private void resetDaySales(int week) {
//        String time= Utils.getCurrentDate();
        DBObject condition = new BasicDBObject();
        List<DBObject> list = MongoProvider.find("app_customer_sale_chance", condition);
        for (int i = 0; i < list.size(); i++) {
            try {
                DBObject current = list.get(i);
                String id = (String) current.get("_id");
                BasicDBList members=(BasicDBList)current.get("members");
                if(members!=null && members.size()>0){
                    DBObject query=new BasicDBObject("_id",new BasicDBObject("$in",members));
                    DBObject set = new BasicDBObject();
                    set.put("dayCust",0);
                    if(week==1){
                        set.put("weekCust",0);
                    }
                    MongoProvider.updateByDB("bill", "platform_user",query, new BasicDBObject("$set", set));
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "process resetDaySales exception! ", e);
                e.printStackTrace();
            }
        }
    }

}
