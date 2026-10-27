package com.dishui.notify;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.JSONReader;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

/**
 * Created by jinjj on 16/8/11.
 */
public class QuesPlanThread extends Thread{
    private static Logger log= Logger.getLogger(QuesPlanThread.class.getName());
    private static String limitTimeStr = AppConfig.getInstance().getVar("ques.limitTime");
    private static final int limitTime= Integer.valueOf(limitTimeStr);  //minutes
    public void run(){
    	System.out.println("ques 开始,limitTime："+limitTime);
        while (true){
            try {
                String time= Utils.getCurrentDate();
                String endTime= DateUtil.addTime(new Date(), "yyyy-MM-dd HH:mm:ss", Calendar.MINUTE, 30);
                List<DBObject> noteList = MongoProvider.getConection("app_ques_note")
                        .find(new BasicDBObject().append("notifyTime", new BasicDBObject().append("$gte", time).append("$lte",endTime)).append("status", "0").append("deal", new BasicDBObject("$exists", false))).limit(200).toArray();               
                if(noteList==null || noteList.size()==0){
                    sleep(10000);
                    continue;
                }
                int num=0;
                for (int i = 0; i < noteList.size(); i++) {
                    DBObject obj = noteList.get(i);
                    String noteId = String.valueOf(obj.get("_id"));
                    String notifyTime = String.valueOf(obj.get("notifyTime"));
                    long seconds= Utils.getDateInterval2(time, notifyTime);
                    if(seconds<=limitTime*60){
                        num++;
                        //0 处理中，1 完成
                        MongoProvider.updateOne("app_ques_note", new BasicDBObject("_id", noteId), new BasicDBObject("$set", new BasicDBObject().append("deal", "0")), WriteConcern.SAFE);
                        if(!notifyAgent(noteId)){
                              MongoProvider.insert("notify_ques_note_error", obj);
                        }
                    }
                }
                if(num==0){
                    sleep(30000);
                    continue;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
    private static boolean notifyAgent(String noteId) {
        String url = AppConfig.getInstance().getVar("node.ccserver.url");
        url += ("?action=notify.quesNotify&data={\"_id\":\"" + noteId + "\"}");
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
