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
 * 工单整体分析报表
 *
 * 业务类型 flow
 * 已创建  create
 * 已完成  finish
 * 完成率（可以后期计算  已完成/已创建）
 * 完成总时长 finishTimeCount
 * 平均完成时长（后期计算  完成总时长/已完成）
 * 处理总时长 processTimeCount
 * 流转总个数 processCount
 * 平均处理时长（后期计算  处理总时长/流转总个数）
 * 领取总数 pickCount
 * 领取总等待时长 waitTimeCount
 * 平均等待时长 （后期计算 总等待时长/领取总数）
 *
 */
public class BusinessAnalyseReportHandler {

    private static final Logger log = Logger.getLogger(BusinessAnalyseReportHandler.class.getName());

    /**
     * 创建新的工单
     */
    public static void create(Event event){
        Map<String, Object> map = event.getBusinessData();
        String flow = (String)map.get("flow");
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount() + "_" + flow);
        condition.put("account", event.getAccount());
        condition.put("flow",flow);
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("create",1);

        MongoProvider.update(Constant.BUSINESS_ANALYSE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * finish business
     * @param event
     */
    public static void finish(Event event){
        Map<String, Object> map = event.getBusinessData();
        String flow = (String)map.get("flow");
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount() + "_" + flow);
        condition.put("account", event.getAccount());
        condition.put("flow",flow);
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("finish",1);
        int finishTime = Integer.parseInt(String.valueOf(map.get("finishTime")));
        incDoc.put("finishTimeCount",finishTime);
        incDoc.put("processCount",1);
        int processTime = Integer.parseInt(String.valueOf(map.get("processTime")));
        incDoc.put("processTimeCount",processTime);

        MongoProvider.update(Constant.BUSINESS_ANALYSE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * business flow to next step
     */
    public static void nextStep(Event event){
        Map<String, Object> map = event.getBusinessData();
        String flow = (String)map.get("flow");
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount() + "_" + flow);
        condition.put("account", event.getAccount());
        condition.put("flow",flow);
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("processCount",1);
        int processTime = Integer.parseInt(String.valueOf(map.get("processTime")));
        incDoc.put("processTimeCount",processTime);

        MongoProvider.update(Constant.BUSINESS_ANALYSE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * pick the business to me
     */
    public static void pick(Event event){
        Map<String, Object> map = event.getBusinessData();
        String flow = (String)map.get("flow");
        BasicDBObject condition = new BasicDBObject();
        condition.put("_id", Utils.getReportCurrentDate() + "_" + event.getAccount() + "_" + flow);
        condition.put("account", event.getAccount());
        condition.put("flow",flow);
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());
        condition.put("day",event.getDayId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("pickCount",1);
        int waitTime = Integer.parseInt(String.valueOf(map.get("waitTime")));
        incDoc.put("waitTimeCount",waitTime);

        MongoProvider.update(Constant.BUSINESS_ANALYSE_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }


}
