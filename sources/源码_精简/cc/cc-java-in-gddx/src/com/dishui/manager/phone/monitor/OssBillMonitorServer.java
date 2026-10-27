package com.dishui.manager.phone.monitor;

import com.dishui.server.handler.OssBillHandler;

import java.util.Calendar;
import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by Administrator on 2016/10/24.
 */
public class OssBillMonitorServer {

    private static OssBillMonitorServer instance = null;
    private OssBillMonitorServer(){
        instance = this;
    }
    private boolean isRunning = false;
    private Timer ossNotifyTimer = new Timer();
    private TimerTask ossNotifyTask = new OssBillHandler();

    public static OssBillMonitorServer getInstance(){
        if (instance == null){
            new OssBillMonitorServer();
        }
        return instance;
    }

    public void start(){
        if(this.isRunning){
            System.out.println("OssBillMonitorServer server was started.");
            return;
        }
        Calendar notifyBegin = Calendar.getInstance();
        notifyBegin.set(Calendar.DAY_OF_MONTH, 26);
        notifyBegin.set(Calendar.HOUR_OF_DAY, 12);
        notifyBegin.set(Calendar.MINUTE, 0);
        notifyBegin.set(Calendar.SECOND, 0);
        Date time = notifyBegin.getTime();
        System.out.println(time);
        ossNotifyTimer.schedule(ossNotifyTask,time,86400000); //每个月的26号12点00分

        /*notifyBegin.add(Calendar.DAY_OF_MONTH, 1);
        notifyBegin.set(Calendar.HOUR_OF_DAY, 8);
        notifyBegin.set(Calendar.MINUTE, 0);
        notifyBegin.set(Calendar.SECOND, 0);
        ossNotifyTimer.scheduleAtFixedRate(ossNotifyTask, notifyBegin.getTime(), 7*24*60*60);*/
    }
}
