package com.dishui.manager.batchReportMonitor;

import com.dishui.db.mango.MongoProvider;
import com.dishui.util.StringUtils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.logging.Logger;

/**
 * Created by yaxi on 15-11-6.
 * 在线客服消息报表
 */
public class CustomerServiceMessageReportWorker implements Runnable {
    private Logger log = Logger.getLogger(CustomerServiceMessageReportWorker.class.getName());
    private ReportTaskPool reportTaskPool;

    public CustomerServiceMessageReportWorker(ReportTaskPool reportTaskPool){
        this.reportTaskPool = reportTaskPool;
    }

    @Override
    public void run() {
        System.out.println("数目："+reportTaskPool.size());
//        while (!stop[0]) {
        while(true){

            DBObject task = reportTaskPool.getTask();
            if(task == null){
                continue;
            }
            /*
     data = {
     reportType:1, //1：在线客服消息报表， 2：工单报表， 3：客户报表
     account:'N00000000264',
     agentType:'manual', // manual, robot, robotToManual
     agentId:'d5614bb0-41a9-11e5-9402-bbb5995842ea', //
     reportTime:'2015-11-04 17:09:00',
     type:'conversation',// session(会话类型,对应访客), message（消息类型）, convert（转出类型）, conversation(对话类型，对应对话) leaveMessage(留言)
     status:'new', //conversation:new,finish
     platform:'pc' , //pc, wap, app, weixin
     consultType: '业务咨询',
     messageCount:1,
     conversationTimeLength: 100, //单位ms type == conversation  && status==finish
     firstResponseTimeLength:100, //单位ms type == conversation  && status==new
     accessId:111111111111111111 //接入号
     }
     */
            String type = "";
            if(task.get("type") != null){
                type = task.get("type").toString();
            }
            String status = "";
            if(task.get("status") != null){
                status = task.get("status").toString();
            }
            String account = "";
            if(task.get("account") != null){
                account = task.get("account").toString();
            }
            String accessId = "";
            if(task.get("accessId") != null){
                accessId = task.get("accessId").toString();
            }
            String platform = "";
            if(task.get("platform") != null){
                platform = task.get("platform").toString();
            }
            String reportTime = "";
            if(task.get("reportTime") != null){
                reportTime = task.get("reportTime").toString();
            }

            String agentType = "";
            if(task.get("agentType") != null){
                agentType = task.get("agentType").toString();
            }

            String isNewVisitor = "";
            if(task.get("isNewVisitor") != null){
                isNewVisitor = task.get("isNewVisitor").toString();
            }

            String conversationTimeLength = "";
            if(task.get("conversationTimeLength") != null){
                conversationTimeLength = task.get("conversationTimeLength").toString();
            }

            String firstResponseTimeLength = "";
            if(task.get("firstResponseTimeLength") != null){
                firstResponseTimeLength = task.get("firstResponseTimeLength").toString();
            }

//            dayStr = reportTime.split(" ")[0].replaceAll("-","");
//            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            String dayId = reportTime.trim().split(" ")[0].replaceAll("-","");
//            try {
//                Date date = DateUtil.parse(reportTime);
//                dayStr = DateUtil.parse(date, "yyyyMMdd", Calendar.MONTH, 0);
//            } catch (ParseException e) {
//                e.printStackTrace();
//            }

//            try {
//                Date date = dateFormat.parse(reportTime);
////                dayStr =new StringBuilder("").append(date.getYear()).append(date.getDate());
//            } catch (ParseException e) {
//                e.printStackTrace();
//            }
//            DBObject condition = new BasicDBObject();
//            condition.put("AccountId", account);
//            condition.put("AccessId", accessId);
//            condition.put("Platform", platform);
//            condition.put("DayId", dayId);
//            if(type.equals("conversation")){
//                if(status.equals("new")){
//                    DBObject incDoc = new BasicDBObject();
//                    if(agentType.equals("manual")){
//                        incDoc.put("ConversationCount", 1);
//                    }
//                    if(isNewVisitor.equals("1")){
//                        incDoc.put("VisitorCount", 1);
//                        if(agentType.equals("robot")){
//                            incDoc.put("RobotVisitorCount", 1);
//                        }
//                    }
//                    MongoProvider.update("cc_customer_service_message_report", condition, new BasicDBObject("$inc", incDoc));
//                }else if (status.equals("convert")){
//                    DBObject incDoc = new BasicDBObject();
//                    incDoc.put("ConvertManualCount", 1);
//                    MongoProvider.update("cc_customer_service_message_report", condition, new BasicDBObject("$inc", incDoc));
//
//
//
//
//           }else if(!firstResponseTimeLength.equals("")){
//                    int timeLength = StringUtils.parseInt(firstResponseTimeLength)/1000;  //单位s
//                    DBObject incDoc = new BasicDBObject();
//                     incDoc.put("FirstResponseTimeLength", timeLength);
//                    MongoProvider.update("cc_customer_service_message_report", condition, new BasicDBObject("$inc", incDoc));
//                }else if(!conversationTimeLength.equals("")){
//                    int timeLength = StringUtils.parseInt(conversationTimeLength)/60000; //单位分钟
//                    DBObject incDoc = new BasicDBObject();
//                    incDoc.put("ConversationTimeLength", timeLength);
//                    MongoProvider.update("cc_customer_service_message_report", condition, new BasicDBObject("$inc", incDoc));
//                }
//            }
//            System.out.println(task.get("reportType").toString() + "===========" +task.get("name"));
        }

    }
}
