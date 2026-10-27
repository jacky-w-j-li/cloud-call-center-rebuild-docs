package com.dishui.manager.batchReportMonitor;

import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

/**
 * Created by yaxi on 15-11-6.
 * 工单报表
 */
public class BusinessReportWorker implements Runnable{
    private Logger log = Logger.getLogger(BusinessReportWorker.class.getName());


    private ReportTaskPool reportTaskPool;

    public BusinessReportWorker(ReportTaskPool reportTaskPool){
        this.reportTaskPool = reportTaskPool;
    }

    @Override
    public void run() {
        System.out.println("数目："+reportTaskPool.size());
        while(true){
            DBObject task = reportTaskPool.getTask();
            if(task == null){
                continue;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(task.get("reportType").toString() + "===========" +task.get("name"));
        }
    }
}
