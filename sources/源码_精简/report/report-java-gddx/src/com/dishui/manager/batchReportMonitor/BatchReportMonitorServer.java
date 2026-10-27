package com.dishui.manager.batchReportMonitor;

import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by yaxi on 15-11-6.
 * 报表事件处理入口
 */
public class BatchReportMonitorServer {
    private Logger log = Logger.getLogger(BatchReportMonitorServer.class.getName());
    private static BatchReportMonitorServer instance = null;
    private boolean isRunning = false;
    private int taskLimit = 1000;
    private ThreadPoolExecutor workPool;
    private BatchReportMonitorServer() {
        instance = this;
    }

    public static BatchReportMonitorServer getInstance() {
        if (instance == null) {
            new BatchReportMonitorServer();
        }
        return instance;
    }

    public void start() {

        if (this.isRunning) {
            System.out.println("BatchReportMonitorServer was started.");
            return;
        }
        workPool = new ThreadPoolExecutor(12, 80, 600, TimeUnit.SECONDS,
                new LinkedBlockingQueue<Runnable>(1000));

        DBObject condition = new BasicDBObject();
        condition.put("reportStatus", "ready");
        List<DBObject> taskList = new ArrayList<DBObject>();
//        List<DBObject> csTaskList = new ArrayList<DBObject>();
//        List<DBObject> bTaskList = new ArrayList<DBObject>();
//        List<DBObject> cTaskList = new ArrayList<DBObject>();
        ReportTaskPool csTaskPool1 = new ReportTaskPool();
        ReportTaskPool csTaskPool2 = new ReportTaskPool();
        ReportTaskPool csTaskPool3 = new ReportTaskPool();
        ReportTaskPool bTaskPool = new ReportTaskPool();
        ReportTaskPool cTaskPool = new ReportTaskPool();
        while (true) {
            System.out.println("lun");
            try {
                for(int i=0; i<1000; i++){
                    DBObject dbObject = new BasicDBObject();
                    dbObject.put("reportType", (new Random().nextInt(3) + 1));
                    dbObject.put("name", i + 1);
                    taskList.add(dbObject);
                }
//                taskList = MongoProvider.find("app_report_event", condition, taskLimit);
                for (DBObject task : taskList) {
                    if(task.get("reportType").toString().equals("1")){
                        csTaskPool1.add(task);  //在线客服
                        csTaskPool2.add(task);  //在线客服
                        csTaskPool3.add(task);  //在线客服
                    }else if(task.get("reportType").toString().equals("2")){
                        bTaskPool.add(task);       //工单
                    }else if(task.get("reportType").toString().equals("3")){
                        cTaskPool.add(task);    //客户
                    }else{
                        log.log(Level.INFO, "not defined reportType:" + task.get("reportType").toString());
                    }
                }
                CustomerServiceMessageReportWorker customerServiceMessageReportWorker = new CustomerServiceMessageReportWorker(csTaskPool1);
                CustomerServiceBusinessAnalyzeReport customerServiceBusinessAnalyzeReport = new CustomerServiceBusinessAnalyzeReport(csTaskPool2);
                CustomerServiceAgentReportWorker customerServiceAgentReportWorker = new CustomerServiceAgentReportWorker(csTaskPool3);
                workPool.execute(customerServiceMessageReportWorker);
                workPool.execute(customerServiceBusinessAnalyzeReport);
                workPool.execute(customerServiceAgentReportWorker);

                BusinessReportWorker businessReportWorker = new BusinessReportWorker(bTaskPool);
                workPool.execute(businessReportWorker);
                CustomerReportWorker customerReportWorker = new CustomerReportWorker(cTaskPool);
                workPool.execute(customerReportWorker);

            } catch (Exception e) {
                log.log(Level.WARNING, e.getMessage(), e);
            }

            try {
                Thread.sleep(1000);
            } catch (Exception e) {
                log.log(Level.WARNING, e.getMessage(), e);
            }
        }

    }

    public static void main(String[] args) throws ParseException {
//        while(true){
//            System.out.println(new Random().nextInt(3)+1);
//        }

//        BatchReportMonitorServer server = new BatchReportMonitorServer();
//        server.start();
//        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
//        SimpleDateFormat dateFormat1 = new SimpleDateFormat("yyyyMMdd");
//        Date date = dateFormat.parse("2014-12-11 23:00:01");
//        System.out.println(dateFormat1.format(date));


       System.out.println(1244909040L/1000);
    }
}

