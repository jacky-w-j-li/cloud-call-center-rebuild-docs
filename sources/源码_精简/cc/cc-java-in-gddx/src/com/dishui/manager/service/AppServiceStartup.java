package com.dishui.manager.service;

import com.dishui.db.mango.MongoConnect;
import com.dishui.manager.agentPc.collectInfo.AgentPcCollectInfoServer;
import com.dishui.manager.didi.monitor.DidiMonitorServer;
import com.dishui.manager.phone.monitor.OssBillMonitorServer;
import com.dishui.manager.phone.monitor.PhoneMonitorServer;
import com.dishui.server.handler.DeleteCustomerHandler;
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
        System.out.println("Starting AppSessionCheck plugin...");
		//AppSession.getInstance().start();
        System.out.println("AppSessionCheck started.");
        System.out.println("Starting AppBatchCdrMonitorTask plugin...");
        //this server run in cc-java.so this don't need to run
//        BatchCdrMonitorServer.getInstance().start();
//        System.out.println("AppBatchCdrMonitor started.");

        DeleteCustomerHandler.getInstance();
        System.out.println("deleteCustomerTask started.");

        if(AppConfig.getInstance().getVar("didi.monitor.collect") != null
                && AppConfig.getInstance().getVar("didi.monitor.collect").equals("yes")){
            DidiMonitorServer.getInstance().start();
            System.out.println("DidiMonitorServer started.");
        }
        PhoneMonitorServer.getInstance().start();
        System.out.println("PhoneMonitorServer started.");
        OssBillMonitorServer.getInstance().start();
        System.out.println("OssBillMonitorServer started.");
        AgentPcCollectInfoServer.getInstance().start();
        System.out.println("PhoneMonitorServer started.");

	}
}
