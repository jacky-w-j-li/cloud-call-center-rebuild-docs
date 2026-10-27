package com.dishui.manager.phone.monitor;

import com.dishui.server.handler.PhoneNumHandler;

import java.util.Calendar;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by Administrator on 2016/8/19.
 */
public class PhoneMonitorServer {

    private static PhoneMonitorServer instance = null;
    private PhoneMonitorServer(){
        instance = this;
    }
    private boolean isRunning = false;
    private Timer phoneNotifyTimer = new Timer();
    private TimerTask phoneNotifyTask = new PhoneNumHandler();

    public static PhoneMonitorServer getInstance(){
        if (instance == null){
            new PhoneMonitorServer();
        }
        return instance;
    }

    public void start(){
        if(this.isRunning){
            System.out.println("PhoneMonitorServer server was started.");
            return;
        }
        Calendar notifyBegin = Calendar.getInstance();
        notifyBegin.add(Calendar.DAY_OF_MONTH, 1);
        notifyBegin.set(Calendar.HOUR_OF_DAY, 1);
        notifyBegin.set(Calendar.MINUTE, 0);
        notifyBegin.set(Calendar.SECOND, 0);
        phoneNotifyTimer.scheduleAtFixedRate(phoneNotifyTask, notifyBegin.getTime(), 86400000);
    }
}
