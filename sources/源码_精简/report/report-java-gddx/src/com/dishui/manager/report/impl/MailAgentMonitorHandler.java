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
 * Created by wangyn on 2016年9月8日11:50:32
 *
 * 邮件客服报表监控
 */
public class MailAgentMonitorHandler {
    public static MailAgentMonitorHandler instance;
    private static final Logger log = Logger.getLogger(MailAgentMonitorHandler.class
            .getName());
    private MailAgentMonitorHandler(){
        instance = this;
    }

    public static MailAgentMonitorHandler getInstance(){
        if (instance == null)
            new MailAgentMonitorHandler();
        return instance;
    }

    //邮件自动领取开关的
    public void mailAutoClaimStatus(Event event){
        MonitorAgent maa = getAgent(event);
        if(maa != null){
            if(event.getBusinessData().get("status").equals("open")){
                maa.setMailAutoClaim(true);
            }else{
                maa.setMailAutoClaim(false);
            }
            MailMonitorHandler.pushByAccount(event.getAccount(), maa.getEventData());
        }
    }

    public MonitorAgent getAgent(Event event){
        String account = event.getAccount();
        MonitorAccount ma = MailMonitorHandler.accounts.get(account);
        if(ma == null){
            ma = new MonitorAccount(account);
            MailMonitorHandler.accounts.put(account, ma);
        }
        if(event.getBusinessData().get("agentId") != null){
            String agentId = event.getBusinessData().get("agentId").toString();

            MonitorAgent maa = ma.getAgent(agentId);
            if(maa == null){
                maa = new MonitorAgent(account, agentId);

                //query emailStatus
                BasicDBObject statusCond = new BasicDBObject("_id", maa.getId());
                List<BasicDBObject> dbStatusList = MongoProvider.findFromApp("cc", Constant.APP_PUSH_CLIENT, statusCond, new BasicDBObject("emailStatus",1));
                if(dbStatusList.size() > 0){
                    if(dbStatusList.get(0).get("emailStatus") != null){
                        if(dbStatusList.get(0).getString("emailStatus").equals("close")){
                            maa.setAutoClaim(false);
                        }
                    }
                }
                ma.addAgent(maa);
            }
            return maa;
        }else{
            System.out.printf(event.toString());
            return null;
        }
    }
    

}
