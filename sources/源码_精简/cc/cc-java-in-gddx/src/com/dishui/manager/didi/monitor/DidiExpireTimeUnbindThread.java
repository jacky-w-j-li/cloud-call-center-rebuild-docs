package com.dishui.manager.didi.monitor;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.log.SystemOutHandler;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLEncoder;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 7/5/16.
 */
public class DidiExpireTimeUnbindThread extends Thread{
    private Logger log = Logger.getLogger(DidiExpireTimeUnbindThread.class.getName());

    @Override
    public void run() {
        DBObject find = new BasicDBObject();
        find.put("expire_time", new BasicDBObject("$ne", null));

        DBObject sort = new BasicDBObject();
        sort.put("expire_time", 1);

        List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "didi_num_bind", find, sort, 1);
        if(list != null && list.size() >0){
            long minTime = Long.parseLong(list.get(0).get("expire_time").toString());
            String beforeTime = Utils.getDidiBeforeDateFromNow(minTime);
            log.log(Level.INFO, "DidiExpireTimeUnbindThread current find before=" + beforeTime);
            find.put("time", new BasicDBObject("$lte", beforeTime));
            long currentTime = System.currentTimeMillis();
            List<DBObject> resList = MongoProvider.findFromReportDb("interAPI", "didi_num_bind", find, sort, 5000);
            if(resList != null && resList.size() > 0){
                int size = resList.size();
                log.log(Level.INFO, "DidiExpireTimeUnbindThread deal count=" + size);
                for(int i=0;i<size;i++){
                    DBObject doc = resList.get(i);
                    String bindTime = doc.get("time").toString();
                    long expireTime = Long.parseLong(doc.get("expire_time").toString());
                    long unbindTime = Utils.getDidiBeforeTimestampFromTime(bindTime, expireTime * 60 * 1000l);
                    if(unbindTime != 0l && unbindTime <= currentTime){
                        MongoProvider.removeFromReportDb("interAPI", "didi_num_bind", new BasicDBObject("_id", doc.get("_id").toString()));
                        doc.put("unbind_reason","timeout");
                        doc.put("unbind_time", Utils.getCurrentDate());
                        MongoProvider.reportInsert("interAPI", "didi_num_unbind_log", doc);
                        MongoProvider.reportUpdate("interAPI",
                                "didi_trunk_num_pool",
                                new BasicDBObject("_id", doc.get("trunk_num").toString()),
                                new BasicDBObject("$inc", new BasicDBObject("bind_count", -1)),
                                false,
                                false);
                    }
                }
            }
        }
    }

    public static void main(String[] args) {
//        long current = System.currentTimeMillis();
//        System.out.println(current + "");
//        long min = current - 10080l*60*1000;
//
//        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
//
//        String minString = format.format(min);
//        System.out.println(minString);

        System.out.println(Utils.getDidiBeforeTimestampFromTime("2016-06-28 19:02:43", 10080 * 60 * 1000l) + "");
        System.out.println(System.currentTimeMillis() + "");
    }
}
