package com.dishui.manager.report.impl;


import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.ReportStartUp;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.dishui.manager.report.model.MonitorAccount;
import com.dishui.manager.report.model.MonitorClearTask;
import com.mongodb.BasicDBObject;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 11/8/15.
 *
 * 文字客服监控处理类
 */
public class ImMonitorHandler implements EventListener {
    private static final Logger log = Logger.getLogger(ImMonitorHandler.class.getName());

    public Vector<Event> eventBuffer = new Vector<Event>();

    public static HashMap<String, MonitorAccount> accounts = new HashMap<String, MonitorAccount>();
    public static ExecutorService excutor = Executors.newCachedThreadPool();

    private boolean running = true;

    public ImMonitorHandler() {
        Thread t = new Thread("ImMonitorHandler buffer thread") {
            public void run() {
                doEvent();
            }
        };
        t.start();
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 23);
        calendar.set(Calendar.MINUTE, 59);
        calendar.set(Calendar.SECOND, 59);
        Date time = calendar.getTime();
        MonitorClearTask clearTask = new MonitorClearTask(this);
        ReportStartUp.getInstance().timer.scheduleAtFixedRate(clearTask, time, 86400000);
    }

    private void doEvent() {
        while (running) {
            try {
                synchronized (eventBuffer) {
                    if (eventBuffer.size() == 0) {
                        eventBuffer.wait();
                    } else {
                        handleEvent(eventBuffer.remove(0));
                    }
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
    }

    public void addToBuf(Event event) {
        synchronized (eventBuffer) {
            if (eventBuffer.size() > 1000000) {
                log.warning("account buffer is too large to cache any event");
            } else {
                eventBuffer.add(event);
            }
            eventBuffer.notify();
        }
    }

    private void handleEvent(Event event) {
        try {
            if(event.getType().equalsIgnoreCase(EventType.IM_NEW_SESSION)){
                ImAccessMonitorHandler.getInstance().newSession(event);
                ImQueueMonitorHandler.getInstance().newSession(event);
            }else if(event.getType().equalsIgnoreCase(EventType.IM_ACCESS_SESSION)){
                ImAccessMonitorHandler.getInstance().accessSession(event);
                ImAgentMonitorHandler.getInstance().accessSession(event);
                ImQueueMonitorHandler.getInstance().accessSession(event);
//            }else if(event.getType().equalsIgnoreCase(EventType.IM_NEW_VISITOR)){
//            }else if(event.getType().equalsIgnoreCase(EventType.IM_NEW_MSG_IN)){
            }else if(event.getType().equalsIgnoreCase(EventType.IM_REDIRECT_SESSION)){
                ImAgentMonitorHandler.getInstance().redirectSession(event);
            }else if(event.getType().equalsIgnoreCase(EventType.IM_CONVERT_MANUAL)){
                ImAccessMonitorHandler.getInstance().convertManual(event);
                ImQueueMonitorHandler.getInstance().convertManual(event);
//            }else if(event.getType().equalsIgnoreCase(EventType.IM_FIRST_REPLY)){
            }else if(event.getType().equalsIgnoreCase(EventType.IM_CLOSE_SESSION)){
                ImAccessMonitorHandler.getInstance().closeSession(event);
                ImAgentMonitorHandler.getInstance().closeSession(event);
                ImQueueMonitorHandler.getInstance().closeSession(event);
//            }else if(event.getType().equalsIgnoreCase(EventType.IM_NEW_MSG_OUT)){
            }else if(event.getType().equalsIgnoreCase(EventType.IM_AUTO_CLAIM_STATUS)){
                ImAgentMonitorHandler.getInstance().autoClaimStatus(event);
            }else if(event.getType().equalsIgnoreCase(EventType.IM_SOCKET_PUSH_CONNECTED)){
                ImAgentMonitorHandler.getInstance().socketPushConnected(event);
            }

        } catch (Exception e) {
            log.log(Level.WARNING, "ImMonitorHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }

    public static void pushByAccount(String account,Hashtable<String,Object> dataMap){
        List<BasicDBObject> list = MongoProvider.findFromApp("cc", "app_push_client",
                new BasicDBObject("user.account", account).append("user.type", "manager"));

        for(int i=0 ; i<list.size() ;i++){
            if(list.get(i).get("pushServerIp") != null && list.get(i).get("pushServerPort") != null){
                PushTask pt = new PushTask(list.get(i).get("pushServerIp").toString()
                        ,list.get(i).get("pushServerPort").toString()
                        ,account
                        ,list.get(i).get("_id").toString()
                        ,"ImMonitor"
                        ,dataMap);
                ImMonitorHandler.excutor.execute(pt);
            }
        }
    }

}
