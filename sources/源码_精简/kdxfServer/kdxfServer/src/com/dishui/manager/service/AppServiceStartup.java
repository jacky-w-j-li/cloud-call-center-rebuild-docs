package com.dishui.manager.service;

import com.dishui.server.http.AppHttpServer;
import com.dishui.util.log.IceLogger;

public class AppServiceStartup {
	
	public static void main(String[] args) {
		AppConfig.getInstance();
		IceLogger.initLogger(AppConfig.getInstance().getLogDir(),
				"kdxfService", AppConfig.getInstance().getLogLevel(),
				true);
		new AppHttpServer();
		System.out.println("kdxf service server started.");
	}
}
