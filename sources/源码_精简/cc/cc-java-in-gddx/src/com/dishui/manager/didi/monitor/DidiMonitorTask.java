package com.dishui.manager.didi.monitor;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 6/27/16.
 */
public class DidiMonitorTask extends TimerTask {
    private Logger log = Logger.getLogger(DidiMonitorTask.class.getName());

    public void run() {
        try {
            String curTime = Utils.getLastMin(-1);
            String lastTime = Utils.getLastMin(-4);
            String lastWarningTime = Utils.getLastMin(-2);
            log.log(Level.INFO, "Begin DidiMonitorTask nowDate="+ curTime);

            List<DBObject> cityAccList = MongoProvider.findFromReportDb("interAPI", "didi_monitor_config", new BasicDBObject());

            for(int i=0;i<cityAccList.size();i++){
                Thread tempT = new DidiMonitorThread(curTime, lastTime, cityAccList.get(i), lastWarningTime);
                tempT.start();
            }
            Thread unbindThread = new DidiExpireTimeUnbindThread();
            unbindThread.start();
        } catch (Exception e) {
            log.log(Level.WARNING, e.getMessage(), e);
        }
    }

    public static void main(String[] args) {
//		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
//		System.out.println(formatter.format(new Date(System.currentTimeMillis() - 31*24*60*60*1000l)));
//        String abc = "/var/spool/asterisk/monitor/1.1.1.101/20141215/20141215-121633_N00000000143_10000197_5001_01058010112_10000197_pbx-1418616991.280";
//        String end = "";
//        for(int i=10; i<1000 ;i++){
//            end += abc+i+".mp3 ";
//        }
//        System.out.println(end);
    }
}
