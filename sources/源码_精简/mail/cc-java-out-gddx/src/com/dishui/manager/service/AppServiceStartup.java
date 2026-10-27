package com.dishui.manager.service;

import com.dishui.db.mango.MongoConnect;
import com.dishui.manager.batchCdrMonitor.BatchCdrMonitorServer;
import com.dishui.manager.db.master.DBMaster;
//import com.dishui.manager.db.master.DBMaster;
import com.dishui.manager.session.AppSession;
import com.dishui.notify.NotifyMaster;
import com.dishui.server.handler.ArchiveCustomerHandler;
import com.dishui.server.handler.DeleteCustomerHandler;
import com.dishui.server.http.AppHttpServer;
import com.dishui.service.mail.DsMailService;
import com.dishui.util.log.IceLogger;

import java.io.File;
import java.io.IOException;

public class AppServiceStartup {
	
	public static void main(String[] args) {

        AppConfig.getInstance();
		//IceLogger.initLogger(AppConfig.getInstance().getLogDir(),
		//		"managerService", AppConfig.getInstance().getLogLevel(),
		//		true);
		IceLogger.initLogger(AppConfig.getInstance().getClogHost(),AppConfig.getInstance().getClogBaseLogFields(),
				AppConfig.getInstance().getClogTimeout(),AppConfig.getInstance().getLogDir(),"mailServer",
				AppConfig.getInstance().getLogLevel(),true);

		System.out.println("Starting DB plugin...");
		MongoConnect.getInstance().connect();
		new AppHttpServer();
		System.out.println("app service server started.");
//        System.out.println("Starting AppSessionCheck plugin...");
//		AppSession.getInstance().start();
//        System.out.println("AppSessionCheck started.");
//        System.out.println("Starting AppBatchCdrMonitorTask plugin...");
        //this server run in cc-java.so this don't need to run
//        BatchCdrMonitorServer.getInstance().start();
//        System.out.println("AppBatchCdrMonitor started.");

        DeleteCustomerHandler.getInstance();
        System.out.println("deleteCustomerTask started.");

		ArchiveCustomerHandler.getInstance();
		System.out.println("archiveCustomerTask started");


	}
}
