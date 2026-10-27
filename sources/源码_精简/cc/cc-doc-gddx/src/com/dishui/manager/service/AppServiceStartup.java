package com.dishui.manager.service;

import com.dishui.db.mango.MongoConnect;
import com.dishui.excel.ExportTaskManage;
import com.dishui.notify.NotifyMaster;
import com.dishui.server.http.AppHttpServer;
import com.dishui.util.log.IceLogger;


public class AppServiceStartup {
	
	public static void main(String[] args) {
        AppConfig.getInstance();
		IceLogger.initLogger(AppConfig.getInstance().getLogDir(),
				"managerService", AppConfig.getInstance().getLogLevel(),
				true);
		System.out.println("Starting DB plugin...");
		MongoConnect.getInstance().connect();
		new AppHttpServer();
		System.out.println("app service server started.");


        NotifyMaster.getInstance().start();
        System.out.println("notifyMaster started.");

        ExportTaskManage.getInstance().startHandleEvents();
        System.out.println("exportTaskManage started.");
	}
}
