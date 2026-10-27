package com.dishui.notify;

import com.dishui.db.mango.MongoProvider;
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
    private static final String app_customer_pool_assign="app_customer_pool_assign";

    @Override
    public void run() {
        try {
            Calendar now = Calendar.getInstance();
//            int week = now.get(Calendar.DAY_OF_WEEK) - 1;
//            if (week < 0)  week = 0;

            log.info("UserSalesTask hour::=============" + now.get(Calendar.HOUR_OF_DAY));
            if (now.get(Calendar.HOUR_OF_DAY) != 0) {
                return;
            }
            resetDaySales();

        } catch (Exception e) {
            log.log(Level.WARNING, "process UserSalesTask exception! ", e);
            e.printStackTrace();
        }
    }



    /**
     * 重置最少分配策略每人每日的商机数
     */
    private void resetDaySales() {
        DBObject condition = new BasicDBObject("category","4");
//        DBObject condition = new BasicDBObject("category","4").append("account","N00000000525");
        List<DBObject> list = MongoProvider.find("app_customer_pool", condition,new BasicDBObject("account",1).append("members",1));
        for (int i = 0; i < list.size(); i++) {
            try {
                DBObject current = list.get(i);
                String id = (String) current.get("_id");
                String account = (String) current.get("account");
                BasicDBList members=(BasicDBList)current.get("members");

                //删除不在成员中的座席
                DBObject query1=new BasicDBObject("account",account).append("poolId",id).append("uid",new BasicDBObject("$nin",members));
                MongoProvider.remove(app_customer_pool_assign, query1);
                //reset
                DBObject query=new BasicDBObject("account",account).append("poolId",id);
                DBObject set = new BasicDBObject("num",0);
                MongoProvider.batchUpdateByDB("cc", app_customer_pool_assign, query, new BasicDBObject("$set", set));

            } catch (Exception e) {
                log.log(Level.WARNING, "process resetDaySales exception! ", e);
                e.printStackTrace();
            }
        }
    }

}
