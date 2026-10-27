package com.dishui.manager.report.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.MonitorAccessNo;
import com.dishui.manager.report.model.MonitorAccount;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Created by chenguang on 11/12/15.
 */
public class ImAccessMonitorHandler {
    public static ImAccessMonitorHandler instance;

    private ImAccessMonitorHandler(){
        instance = this;
    }

    public static ImAccessMonitorHandler getInstance(){
        if (instance == null)
            new ImAccessMonitorHandler();
        return instance;
    }

    public void newSession(Event event){
        MonitorAccessNo man = getAccessNo(event);
        man.newSession();
        if(event.getBusinessData().get("agentType").equals("robot")){
            man.robotSession();
        }else{
            man.manualSession();
        }
        ImMonitorHandler.pushByAccount(event.getAccount(), man.getEventData());
    }

    public void accessSession(Event event) {
        MonitorAccessNo man = getAccessNo(event);
        man.accessSession();
        ImMonitorHandler.pushByAccount(event.getAccount(),man.getEventData());
    }

    public void closeSession(Event event){
        MonitorAccessNo man = getAccessNo(event);
        man.closeSession();
        ImMonitorHandler.pushByAccount(event.getAccount(), man.getEventData());
    }

    public void convertManual(Event event){
        MonitorAccessNo man = getAccessNo(event);
        man.robotToManualSession();
        ImMonitorHandler.pushByAccount(event.getAccount(), man.getEventData());
    }

    public MonitorAccessNo getAccessNo(Event event){
        String account = event.getAccount();
        MonitorAccount ma = ImMonitorHandler.accounts.get(account);
        if(ma == null){
            ma = new MonitorAccount(account);
            ImMonitorHandler.accounts.put(account, ma);
        }
        String accessId = event.getBusinessData().get("accessId").toString();
        MonitorAccessNo man = ma.getAccessNo(accessId);
        if(man == null){
            man = new MonitorAccessNo(account, accessId);
            //init data
            BasicDBObject condition = new BasicDBObject("accessId", man.getAccessId()).append("dayId", DateUtil.getCurrentSimpleDate());
            List<BasicDBObject> dbList = MongoProvider.find(Constant.IM_ACCESS_REPORT, condition);
            int newSessionCount = 0;
            int accessSessionCount = 0;
            int closeSessionCount = 0;
            int robotSessionCount = 0;
            int manualSessionCount = 0;
            int robotToManualSessionCount = 0;
            for(int i=0;i<dbList.size();i++){
                if(dbList.get(i).get("totalSessionCount") != null)
                    newSessionCount += dbList.get(i).getInt("totalSessionCount");
                if(dbList.get(i).get("accessSessionCount") != null)
                    accessSessionCount += dbList.get(i).getInt("accessSessionCount");
                if(dbList.get(i).get("finishSessionCount") != null)
                    closeSessionCount += dbList.get(i).getInt("finishSessionCount");
                if(dbList.get(i).get("robotSessionCount") != null)
                    robotSessionCount += dbList.get(i).getInt("robotSessionCount");
                if(dbList.get(i).get("manualSessionCount") != null)
                    manualSessionCount += dbList.get(i).getInt("manualSessionCount");
                if(dbList.get(i).get("robotToManualSessionCount") != null)
                    robotToManualSessionCount += dbList.get(i).getInt("robotToManualSessionCount");
            }
            man.setNewSession(newSessionCount);
            man.setAccessSession(accessSessionCount);
            man.setCloseSession(closeSessionCount);
            man.setRobotSession(robotSessionCount);
            man.setManualSession(manualSessionCount);
            man.setRobotToManualSession(robotToManualSessionCount);

            ma.addAccessNo(man);
        }
        return man;
    }

}
