package com.dishui.manager.report.impl.mail;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by wangyn on 2016-9-6.
 *
 * 邮件客服报表
 */
public class MailAgentReportHandler {
    public static MailAgentReportHandler instance;

    private MailAgentReportHandler() {
        instance = this;
    }

    public static MailAgentReportHandler getInstance() {
        if (instance == null)
            new MailAgentReportHandler();
        return instance;
    }

    // 座席处理的邮件会话数
    public void closeSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        if (map.get("agentId") == null) {
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("sessionCompleteCount", 1);
        int timeLength = (Integer) map.get("agentSessionTimeLength");
        //回话时长小于1秒 不存数据
        if(timeLength >= 1000){
            incDoc.put("sessionToTalTimeLength", Math.floor(timeLength / 1000));
        }
        MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    // 坐席邮件回复成功 回复邮件数+1 added by wangyn
    public void newMailOut(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("replyCount", 1);
        MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    // 邮件会话接入数
    public void accessSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("accessSessionCount", 1);
        MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    // 邮件会话转出数
    public void redirectSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        BasicDBObject incDoc = new BasicDBObject();
        condition.put("agentId", map.get("agentId"));
        incDoc.put("sessionRollOutCount", 1);
        int timeLength = (Integer) map.get("sessionTimeLength");
        //回话时长小于1秒 不存数据
        if(timeLength >= 1000){
            incDoc.put("sessionToTalTimeLength", Math.floor(timeLength / 1000));
        }
        MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);

        // 邮件转入
        if (!map.get("toUser").equals("pool")) {
            BasicDBObject condition1 = new BasicDBObject();
            condition1.put("account", event.getAccount());
            condition1.put("yearId", event.getYearId());
            condition1.put("monthId", event.getMonthId());
            condition1.put("dayId", event.getDayId());
            condition1.put("reportTime", Utils.getReportTime(event.getReportTime()));
            BasicDBObject incDoc1 = new BasicDBObject();
            condition1.put("agentId", map.get("toUser"));
            incDoc1.put("sessionRollInCount", 1);
            MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition1, new BasicDBObject("$inc", incDoc1),
                    true);
        }

    }

    // 回话减少
    public void reduceSession(Event event) {
        Map<String, Object> map = event.getBusinessData();
        if (map.get("agentId") == null) {
            return;
        }
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", event.getReportTime());
        condition.put("platform", map.get("platform"));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("accessSessionCount", -1);
        MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    // 邮件平均首次响应时长
    public void firstReply(Event event) {
        System.out.println(event.toString());
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", Utils.getReportTime(event.getReportTime()));
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        int timeLength = (Integer) map.get("firstResponseTimeLength");
        incDoc.put("firstResponseTotalTimeLength", Math.floor(timeLength / 1000)); // 单位秒
        incDoc.put("responseCount", 1); // 单位秒
        MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    //处理邮件自动领取开关的开启和关闭时长
    public void mailAutoClaimStatus(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        String currTime = event.getReportTime();
        String reportTime = Utils.getReportTime(currTime);
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", reportTime);
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        BasicDBObject conditionAgent = new BasicDBObject();
        conditionAgent.put("_id", map.get("agentId"));
        String status = (String) map.get("status");
        String lastOpenedTime = (String) map.get("lastMailStatusOpenedTime");
        String lastClosedTime = (String) map.get("lastMailStatusClosedTime");
        insertUpdateTimes(lastClosedTime, lastOpenedTime, currTime, status, condition, incDoc);
    }

    public void mailSocketPushDisconnected(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        String currTime = event.getReportTime();
        String reportTime = Utils.getReportTime(currTime);
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("reportTime", reportTime);
        condition.put("agentId", map.get("agentId"));
        BasicDBObject incDoc = new BasicDBObject();
        BasicDBObject conditionAgent = new BasicDBObject();
        conditionAgent.put("_id", map.get("agentId"));
        String lastMailStatusOpenedTime = (String) map.get("lastMailStatusOpenedTime");
        String lastMailStatusClosedTime = (String) map.get("lastMailStatusClosedTime");
        String status = (String) map.get("status");
        if ("open".equals(status)) {
            //最后离线时是开启状态
            insertUpdateTimes(currTime, lastMailStatusOpenedTime, currTime, "close", condition, incDoc);
        } else {
            //最后离线时是关闭状态
            insertUpdateTimes(lastMailStatusClosedTime, currTime, currTime, "open", condition, incDoc);
        }
    }

    public void insertUpdateTimes(String lastClosedTime, String lastOpenedTime, String currTime, String lastStatus, BasicDBObject condition, BasicDBObject incDoc) {
        Map<String, Double> updateTimes = new HashMap();
        if (lastStatus.equals("open")) {
            if(lastClosedTime==null || "".equals(lastClosedTime)){
                return;
            }
            //处理类似: 13:10 ~ 13:35
            while (Utils.getDateInterval(Utils.getReportTime(lastClosedTime), Utils.getReportTime(currTime)) >= 30 * 60) {
                double partTime = Utils.getDateInterval(lastClosedTime, Utils.getReportTimeAfterHalfHour(lastClosedTime));
                updateTimes.put(Utils.getReportTime(lastClosedTime), partTime);
                lastClosedTime = Utils.getReportTimeAfterHalfHour(lastClosedTime);
            }
            //处理类似: 13:10 ~ 13:20
            if (Utils.getReportTime(lastClosedTime) != null && Utils.getReportTime(lastClosedTime).equals(Utils.getReportTime(currTime))) {
                updateTimes.put(Utils.getReportTime(lastClosedTime), (double)Utils.getDateInterval(lastClosedTime, currTime));
            }
            if (updateTimes.size() >= 1) {
                for (Map.Entry<String, Double> entry : updateTimes.entrySet()) {
                    if(entry.getValue()<=0){
                        return ;
                    }
                    condition.put("reportTime", entry.getKey());
                    incDoc.put("mailAutoClaimCloseTimeLength", entry.getValue());
                    MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }
        } else {
            if(lastOpenedTime==null || "".equals(lastOpenedTime)){
                return;
            }
            //处理类似: 13:10 ~ 13:35
            while (Utils.getDateInterval(Utils.getReportTime(lastOpenedTime), Utils.getReportTime(currTime)) >= 30 * 60) {
                double partTime = Utils.getDateInterval(lastOpenedTime, Utils.getReportTimeAfterHalfHour(lastOpenedTime));
                updateTimes.put(Utils.getReportTime(lastOpenedTime), partTime);
                lastOpenedTime = Utils.getReportTimeAfterHalfHour(lastOpenedTime);
            }
            //处理类似: 13:10 ~ 13:20
            if (Utils.getReportTime(lastOpenedTime) != null && Utils.getReportTime(lastOpenedTime).equals(Utils.getReportTime(currTime))) {
                updateTimes.put(Utils.getReportTime(lastOpenedTime),(double)Utils.getDateInterval(lastOpenedTime, currTime));
            }
            if (updateTimes.size() >= 1) {
                for (Map.Entry<String, Double> entry : updateTimes.entrySet()) {
                    if(entry.getValue()<=0){
                        return ;
                    }
                    condition.put("reportTime", entry.getKey());
                    incDoc.put("mailAutoClaimOpenTimeLength", entry.getValue());
                    MongoProvider.update(Constant.MAIL_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
                }
            }
        }

    }
}
