package com.dishui.manager.batchReportMonitor;

import com.mongodb.DBObject;

import java.util.logging.Logger;

/**
 * Created by yaxi on 15-11-6.
 * 在线客服报表
 */
public class CustomerServiceAgentReportWorker implements Runnable {
    private Logger log = Logger.getLogger(CustomerServiceAgentReportWorker.class.getName());
    private ReportTaskPool reportTaskPool;

    public CustomerServiceAgentReportWorker(ReportTaskPool reportTaskPool){
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
            String type = task.get("type").toString();
            if(type.equals("conversation")){

            }
            System.out.println(task.get("reportType").toString() + "===========" +task.get("name"));
        }

    }
}
