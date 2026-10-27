package com.dishui.manager.didi.monitor;

import java.util.Calendar;
import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by chenguang on 6/27/16.
 */
public class DidiMonitorServer {
    private static DidiMonitorServer instance = null;
    private boolean isRunning = false;
    private TimerTask monitorTask = new DidiMonitorTask();
    private TimerTask dailyNotifyTask = new DidiDailyNotifyTask();
    private TimerTask didiLinkRateTask = new DidiLinkRateTask();
    private Timer didiTimer = new Timer();
    private Timer didiNotifyTimer = new Timer();
    private Timer didiLinkRateTimer = new Timer();

    private DidiMonitorServer(){
        instance = this;
    }

    public static DidiMonitorServer getInstance(){
        if (instance == null){
            new DidiMonitorServer();
        }
        return instance;
    }

    public void start(){
        if(this.isRunning){
            System.out.println("didiMonitorServer server was started.");
            return;
        }
        didiTimer.scheduleAtFixedRate(monitorTask, new Date(), 60000);
        Calendar notifyBegin = Calendar.getInstance();
        notifyBegin.add(Calendar.DAY_OF_MONTH, 1);
        notifyBegin.set(Calendar.HOUR_OF_DAY, 8);
        notifyBegin.set(Calendar.MINUTE, 0);
        notifyBegin.set(Calendar.SECOND, 0);
        didiNotifyTimer.scheduleAtFixedRate(dailyNotifyTask, notifyBegin.getTime(), 86400000);
        didiLinkRateTimer.scheduleAtFixedRate(didiLinkRateTask, new Date(), 3600000);

    }

    public void stop(){
        didiTimer.cancel();
        didiTimer = null;
        this.isRunning = false;
    }
}
