package com.dishui.manager.report.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.*;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 11/8/15.
 *
 * 在线客服报表
 */
public class ImAgentMonitorHandler {
    public static ImAgentMonitorHandler instance;
    private static final Logger log = Logger.getLogger(ImAgentMonitorHandler.class
            .getName());
    private ImAgentMonitorHandler(){
        instance = this;
    }

    public static ImAgentMonitorHandler getInstance(){
        if (instance == null)
            new ImAgentMonitorHandler();
        return instance;
    }

    public void accessSession(Event event) {
        MonitorAgent maa = getAgent(event);
        if(maa != null){
            maa.accessSession();
            ImMonitorHandler.pushByAccount(event.getAccount(), maa.getEventData());
        }
    }

    public void redirectSession(Event event){
//        {
//            "_id": "83e1b670-8ddb-11e5-bbe3-1b166a3f319a",
//                "account": "N00000000264",
//                "reportTime": "2015-11-18 18:02:45",
//                "reportStatus": "ready",
//                "type": "redirectSession",
//                "businessData": {
//                    "agentId": "d5614bb0-41a9-11e5-9402-bbb5995842ea",
//                    "accessId": "a8cd6f10-785f-11e5-af51-552f9a7c5fda",
//                    "toUser": "d5dce450-41a9-11e5-9402-bbb5995842ea",
//                    "platform": "pc"
//        }
//        }
        MonitorAgent fromMaa = getAgent(event);
        MonitorAgent toMaa = null;
        if(!event.getBusinessData().get("toUser").equals("pool")){
            toMaa = getAgent(event.getAccount(), event.getBusinessData().get("toUser").toString());
        }
        if(fromMaa != null){
            fromMaa.redirectFromMeSession();
            ImMonitorHandler.pushByAccount(event.getAccount(), fromMaa.getEventData());
        }
        if(toMaa != null){
            toMaa.redirectToMeSession();
            ImMonitorHandler.pushByAccount(event.getAccount(), toMaa.getEventData());
        }
    }

    public void closeSession(Event event){
        MonitorAgent maa = getAgent(event);
        if(maa != null){
            maa.closeSession();
            ImMonitorHandler.pushByAccount(event.getAccount(), maa.getEventData());
        }
    }

    public void autoClaimStatus(Event event){
        MonitorAgent maa = getAgent(event);
        if(maa != null){
            if(event.getBusinessData().get("status").equals("open")){
                maa.autoClaimStatus(true);
            }else{
                maa.autoClaimStatus(false);
            }
            ImMonitorHandler.pushByAccount(event.getAccount(), maa.getEventData());
        }
    }

    public void socketPushConnected(Event event){
        MonitorAgent maa = getAgent(event);
        if(maa != null){
            ImMonitorHandler.pushByAccount(event.getAccount(), maa.getEventData());
        }
    }

    public MonitorAgent getAgent(Event event){
        String account = event.getAccount();
        MonitorAccount ma = ImMonitorHandler.accounts.get(account);
        if(ma == null){
            ma = new MonitorAccount(account);
            ImMonitorHandler.accounts.put(account, ma);
        }
        if(event.getBusinessData().get("agentId") != null){
            String agentId = event.getBusinessData().get("agentId").toString();

            MonitorAgent maa = ma.getAgent(agentId);
            if(maa == null){
                maa = new MonitorAgent(account, agentId);

                //count claim
                BasicDBObject condition = new BasicDBObject("agentId", maa.getId()).append("dayId", DateUtil.getCurrentSimpleDate());
                List<BasicDBObject> dbList = MongoProvider.find(Constant.IM_AGENT_REPORT_TABLE, condition);
                int claimCount = 0;
                for(int i=0;i<dbList.size();i++){
                    if(dbList.get(i).get("accessSessionCount") != null)
                        claimCount += dbList.get(i).getInt("accessSessionCount");
                }
                maa.setClaim(claimCount);
                //count dealing
                BasicDBObject dealCond = new BasicDBObject("account", account).append("status","deal").append("user",agentId);
                long dealingCount= MongoProvider.countFromApp("cc", Constant.APP_MULTI_CHANNEL_CHAT_SESSION, dealCond);
                maa.setDealing((int)dealingCount);
                //query status
                BasicDBObject statusCond = new BasicDBObject("_id", maa.getId());
                List<BasicDBObject> dbStatusList = MongoProvider.findFromApp("cc", Constant.APP_PUSH_CLIENT, statusCond, new BasicDBObject("status",1));
                if(dbStatusList.size() > 0){
                    if(dbStatusList.get(0).get("status") != null){
                        if(dbStatusList.get(0).getString("status").equals("close")){
                            maa.setAutoClaim(false);
                        }
                    }
                }
                ma.addAgent(maa);
            }else if(event.getType().equalsIgnoreCase(EventType.IM_SOCKET_PUSH_CONNECTED)){
                //query status
                BasicDBObject statusCond = new BasicDBObject("_id", maa.getId());
                List<BasicDBObject> dbStatusList = MongoProvider.findFromApp("cc", Constant.APP_PUSH_CLIENT, statusCond, new BasicDBObject("status",1));
                maa.setAutoClaim(true);
                if(dbStatusList.size() > 0){
                    if(dbStatusList.get(0).get("status") != null){
                        if(dbStatusList.get(0).getString("status").equals("close")){
                            maa.setAutoClaim(false);
                        }
                    }
                }
            }
            return maa;
        }else{
            System.out.printf(event.toString());
            return null;
        }
    }

    public MonitorAgent getAgent(String account,String agentId){
        MonitorAccount ma = ImMonitorHandler.accounts.get(account);
        if(ma == null){
            ma = new MonitorAccount(account);
            ImMonitorHandler.accounts.put(account, ma);
        }
        if(agentId!= null){
            MonitorAgent maa = ma.getAgent(agentId);
            if(maa == null){
                maa = new MonitorAgent(account, agentId);

                //count claim
                BasicDBObject condition = new BasicDBObject("agentId", maa.getId()).append("dayId", DateUtil.getCurrentSimpleDate());
                List<BasicDBObject> dbList = MongoProvider.find(Constant.IM_AGENT_REPORT_TABLE, condition);
                int claimCount = 0;
                for(int i=0;i<dbList.size();i++){
                    if(dbList.get(i).get("accessSessionCount") != null)
                        claimCount += dbList.get(i).getInt("accessSessionCount");
                }
                maa.setClaim(claimCount);
                //count dealing
                BasicDBObject dealCond = new BasicDBObject("account", account).append("status","deal").append("user",agentId);
                long dealingCount= MongoProvider.countFromApp("cc", Constant.APP_MULTI_CHANNEL_CHAT_SESSION, dealCond);
                maa.setDealing((int)dealingCount);
                //query status
                BasicDBObject statusCond = new BasicDBObject("_id", maa.getId());
                List<BasicDBObject> dbStatusList = MongoProvider.findFromApp("cc", Constant.APP_PUSH_CLIENT, statusCond, new BasicDBObject("status",1));
                if(dbStatusList.size() > 0){
                    if(dbStatusList.get(0).get("status") != null){
                        if(dbStatusList.get(0).getString("status").equals("close")){
                            maa.setAutoClaim(false);
                        }
                    }
                }
                ma.addAgent(maa);
            }
            return maa;
        }else{
            return null;
        }
    }

}
