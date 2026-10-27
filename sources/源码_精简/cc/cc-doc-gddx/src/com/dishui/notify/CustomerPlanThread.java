package com.dishui.notify;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.JSONReader;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by hotchwong on 16/3/22.
 */
public class CustomerPlanThread extends Thread{
    private static Logger log= Logger.getLogger(CustomerPlanThread.class.getName());
    private static final int limitTime=15;  //minutes
    public void run(){
        while (true){
            try {
                //deal用于提醒离线的
                String time= Utils.getCurrentDate();
                String endTime= DateUtil.addTime(new Date(), "yyyy-MM-dd HH:mm:ss", Calendar.MINUTE, 30);
//                System.out.println("endTime===="+endTime+",time===="+time);
                List<DBObject> noteList = MongoProvider.getConection("app_note")
                        .find(new BasicDBObject().append("notifyTime", new BasicDBObject().append("$gte", time).append("$lte",endTime)).append("status", "0").append("deal", new BasicDBObject("$exists", false))).limit(200).toArray();
                    if(noteList==null || noteList.size()==0){
                    sleep(20000);
                    continue;
                }
                int num=0;
                for (int i = 0; i < noteList.size(); i++) {
                    DBObject obj = noteList.get(i);
                    String noteId = String.valueOf(obj.get("_id"));
                    String notifyTime = String.valueOf(obj.get("notifyTime"));
//                    System.out.println("notifyTime===="+notifyTime);
                    long seconds= Utils.getDateInterval2(Utils.getCurrentDate(), notifyTime);
//                    System.out.println("seconds===="+seconds);
                    if(seconds==0){
                        num++;
                        //0 处理中，1 完成
                        MongoProvider.updateOne("app_note", new BasicDBObject("_id", noteId), new BasicDBObject("$set", new BasicDBObject().append("deal", "0")), WriteConcern.SAFE);
                        if(!notifyAgent(noteId)){
                              MongoProvider.insert("notify_note_error", obj);
                        }
                    }
                }
                if(num==0){
//                    sleep(30000);
                    continue;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
    private static boolean notifyAgent(String noteId) {
        String url = AppConfig.getInstance().getVar("node.server.url");
        url += ("?action=notify.customerPlanNotify&data={\"_id\":\"" + noteId + "\"}");
        log.log(Level.INFO, url);
        try {
            String result = HttpProvider.sendGet(url);
            JSONReader reader = new JSONReader();
            Map<String, Object> resultObj = (Map<String, Object>) reader.read(result);
            if (resultObj.get("success") != null && (Boolean) resultObj.get("success")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
            return false;
        }
    }
}
