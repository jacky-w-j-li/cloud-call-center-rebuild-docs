package com.dishui.manager.report.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.*;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;

import java.util.HashMap;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 11/8/15.
 *
 * 在线客服报表
 */
public class ImQueueMonitorHandler {
    public static ImQueueMonitorHandler instance;

    private static final Logger log = Logger.getLogger(ImQueueMonitorHandler.class.getName());

    private ImQueueMonitorHandler(){
        instance = this;
    }

    public static ImQueueMonitorHandler getInstance(){
        if (instance == null)
            new ImQueueMonitorHandler();
        return instance;
    }

    public void newSession(Event event){
        MonitorQueue mq = getQueue(event);
        if(mq != null && event.getBusinessData().get("sessionId") != null){
            if(event.getBusinessData().get("agentType").equals("robot")){
                mq.getSessionMap().put(event.getBusinessData().get("sessionId").toString(), "robot");
            }else if(event.getBusinessData().get("agentType").equals("manual")){
                mq.getSessionMap().put(event.getBusinessData().get("sessionId").toString(), "undeal");
                ImMonitorHandler.pushByAccount(event.getAccount(),mq.getEventData());
            }else{
                mq.getSessionMap().put(event.getBusinessData().get("sessionId").toString(), "leave");
                ImMonitorHandler.pushByAccount(event.getAccount(),mq.getEventData());
            }
        }
    }

    public void accessSession(Event event) {
        MonitorQueue mq = getQueue(event);
        if(mq != null && event.getBusinessData().get("sessionId") != null){
            mq.getSessionMap().put(event.getBusinessData().get("sessionId").toString(), "deal");
            ImMonitorHandler.pushByAccount(event.getAccount(),mq.getEventData());
        }
    }

    public void convertManual(Event event){
        MonitorQueue mq = getQueue(event);
        if(mq != null && event.getBusinessData().get("sessionId") != null){
            mq.getSessionMap().put(event.getBusinessData().get("sessionId").toString(), "undeal");
            ImMonitorHandler.pushByAccount(event.getAccount(),mq.getEventData());
        }
    }

    public void closeSession(Event event){
        try{
            MonitorQueue mq = getQueue(event);
            if(mq != null && event.getBusinessData().get("sessionId") != null){
                if(mq.getSessionMap().get(event.getBusinessData().get("sessionId").toString()) != null){
                    if(mq.getSessionMap().get(event.getBusinessData().get("sessionId").toString()).equals("robot")){
                        mq.getSessionMap().put(event.getBusinessData().get("sessionId").toString(), "robot-finish");
                    }else if(mq.getSessionMap().get(event.getBusinessData().get("sessionId").toString()).equals("leave")){
                        mq.getSessionMap().put(event.getBusinessData().get("sessionId").toString(), "leave-finish");
                    }else{
                        mq.getSessionMap().put(event.getBusinessData().get("sessionId").toString(), "finish");
                    }
                    ImMonitorHandler.pushByAccount(event.getAccount(),mq.getEventData());
                }
            }
        }catch (Exception e){
            log.log(Level.WARNING,"ImQueueMonitorHandler has exception!", e);
        }
    }

    public MonitorQueue getQueue(Event event){
        String account = event.getAccount();
        MonitorAccount ma = ImMonitorHandler.accounts.get(account);
        if(ma == null){
            ma = new MonitorAccount(account);
            ImMonitorHandler.accounts.put(account, ma);
        }
        if(event.getBusinessData().get("toPeer") != null && event.getBusinessData().get("sessionId") != null){
            String exten = event.getBusinessData().get("toPeer").toString();
            MonitorQueue mq = ma.getQueue(exten);
            if(mq == null){
                mq = new MonitorQueue(account, exten);
                //init data
                BasicDBObject manualSessionFind = new BasicDBObject("toPeer", mq.getQueueExten())
                        .append("account", account)
                        .append("serviceMan", "manual")
//                        .append("_id", new BasicDBObject("$ne",event.getBusinessData().get("sessionId").toString()))
                        .append("createTime", new BasicDBObject("$gte", DateUtil.getCurrentDate() + " 00:00:00"));
                List<BasicDBObject> list = MongoProvider.findFromApp("cc", Constant.APP_MULTI_CHANNEL_CHAT_SESSION, manualSessionFind, new BasicDBObject("_id",1).append("status",1));
                HashMap<String,String> map = new HashMap<String, String>();
                for(int i=0 ;i<list.size(); i++){
                    map.put(list.get(i).get("_id").toString(),list.get(i).get("status").toString());
                }
                mq.setSessionMap(map);
                ma.addQueue(mq);
            }
            return mq;
        }else{
            return null;
        }
    }


}
