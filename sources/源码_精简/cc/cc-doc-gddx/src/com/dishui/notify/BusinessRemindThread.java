package com.dishui.notify;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.JSONWriter;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;
import java.util.logging.Logger;

/**
 * Created by wangyk on 16/10/12.
 */
public class BusinessRemindThread extends Thread{
    private static Logger log= Logger.getLogger(BusinessRemindThread.class.getName());
    private static final int notifyTime= 5 * 60 * 1000;  // 5 minutes
    private static final int checkTime= 3 * 60 * 1000;  // 3 minutes
    public static String DB_BUSINESS = "_business";
    public static String DB_BUSINESS_FLOW = "account_business_flow";
    public static String DB_BUSINESS_FLOW_STEP = "account_business_flow_step";
    public static String DB_BUSINESS_FLOW_FIELDS = "account_business_flow_field";
    public static String APP_BUSINESS_NOTIFY = "app_business_notify";

    public void run(){
        while(true){
            try {
                sleep(20000);
                String expireTime= DateUtil.addTime(new Date(), "yyyy-MM-dd HH:mm:ss", Calendar.MINUTE, +5);
                DBObject condition = new BasicDBObject().append("expireTime", new BasicDBObject().append("$lte", expireTime));
                List<DBObject> notifyList = MongoProvider.find(APP_BUSINESS_NOTIFY,condition);
                String [] expIds = new String[notifyList.size()];
                if(notifyList.size() > 0 ){ //先删除需要提示的数据
                    for (int i = 0; i <notifyList.size() ; i++) {
                        expIds[i] = (String) notifyList.get(i).get("_id");
                    }
                    MongoProvider.remove(APP_BUSINESS_NOTIFY, new BasicDBObject().append("_id",new BasicDBObject().append("$in", expIds)));
                }
                if(notifyList.size() > 0 ){
                    for (int i = 0; i <notifyList.size() ; i++) {
                        DBObject notifyObj = notifyList.get(i);
                        String url = AppConfig.getInstance().getVar("node.server.url");
                        JSONWriter writer=new JSONWriter();
                        String param=writer.write(notifyObj.toMap());
                        param="action=notify.businessExpireNotify&data="+param;
                        HttpProvider.sendPost2(url,param);
                    }
                }
            }catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
