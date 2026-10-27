package com.dishui.manager.report.impl.business;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;

import java.util.Map;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/11/18.
 * 工单坐席工作量报表
 * 数据字段：
 *
 * 坐席   agent
 * 创建工单数    create
 * 领取工单数    pick
 * 处理工单数    process
 * 处理工单总时长  processTimeCount
 * 平均处理时长   （后期计算 processTimeCount/process）
 * 分配工单数量   assign
 *
 */
public class BusinessAgentReportHandler {
    private static final Logger log = Logger.getLogger(BusinessAgentReportHandler.class.getName());

    /**
     * 创建新的工单
     */
    public static void create(Event event){
        Map<String, Object> map = event.getBusinessData();
        String agent = (String)map.get("user");
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount() + "_" + agent);
        condition.put("account", event.getAccount());
        condition.put("agent",agent);
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("create",1);

        MongoProvider.update(Constant.BUSINESS_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * business flow to next step
     */
    public static void nextStep(Event event){
        Map<String, Object> map = event.getBusinessData();
        String agent = (String)map.get("user");
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount() + "_" + agent);
        condition.put("account", event.getAccount());
        condition.put("agent",agent);
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("process",1);
        int processTime = Integer.parseInt(String.valueOf(map.get("processTime")));
        incDoc.put("processTimeCount",processTime);

        MongoProvider.update(Constant.BUSINESS_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * pick the business to me
     */
    public static void pick(Event event){
        Map<String, Object> map = event.getBusinessData();
        String agent = (String)map.get("user");
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount() + "_" + agent);
        condition.put("account", event.getAccount());
        condition.put("agent",agent);
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("pick",1);

        MongoProvider.update(Constant.BUSINESS_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * assign the business to other agent
     */
    public static void assign(Event event){
        Map<String, Object> map = event.getBusinessData();
        String agent = (String)map.get("user");
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount() + "_" + agent);
        condition.put("account", event.getAccount());
        condition.put("agent",agent);
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("assign",1);

        MongoProvider.update(Constant.BUSINESS_AGENT_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }
}
