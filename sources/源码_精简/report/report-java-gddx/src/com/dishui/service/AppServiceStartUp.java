package com.dishui.service;

import com.dishui.db.mango.MongoConnect;
import com.dishui.manager.billReport.BillReportManager;
import com.dishui.manager.billReport.event.BillDailyEventReporter;
import com.dishui.manager.cdrReport.CdrReportManager;
import com.dishui.manager.report.ReportStartUp;
import com.dishui.manager.report.impl.customer.CustomerTaskManage;
import com.dishui.manager.service.AppConfig;
import com.dishui.util.log.IceLogger;

/**
 * Created by yaxi on 15-11-20.
 */
public class AppServiceStartUp {
    public static void main(String[] args){
        AppConfig.getInstance();
        //IceLogger.initLogger(AppConfig.getInstance().getLogDir(), "reportService", AppConfig.getInstance().getLogLevel(), true);
        IceLogger.initLogger(AppConfig.getInstance().getClogHost(),AppConfig.getInstance().getClogBaseLogFields(),
                AppConfig.getInstance().getClogTimeout(),AppConfig.getInstance().getLogDir(),"reportService",
                AppConfig.getInstance().getLogLevel(),true);

        System.out.println("Starting DB plugin...");
        MongoConnect.getInstance().connect();

        ReportStartUp.getInstance().startHandleEvents();
        BillReportManager.getInstance().startHandleEvents();
        CdrReportManager.getInstance().startHandleEvents();

        //发送定时bill报表事件
        BillDailyEventReporter.start();//每天.

        CustomerTaskManage.getInstance().startHandleEvents();
        System.out.println("CustomerTaskManage started.");

    }
}
