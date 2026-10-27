package com.m7.cc.ass.server.monitor.server;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.SmartServer;
import com.koala.smart.server.exception.AppException;

public class MonitorServer {
	private SmartServer server;
	private MonitorHandler monitorHandler;
	
	private static final Logger log = Logger.getLogger(MonitorServer.class.getName());
	
	public MonitorServer(){
		server  = new SmartServer("monitor_server.conf");
		monitorHandler = new MonitorHandler();
		log.info("Start monitor server.");
		try {
			server.addSessionListener(monitorHandler);
			server.setByteHandler(monitorHandler);
		} catch (AppException e) {
			log.log(Level.WARNING, "", e);
		}
		
		try {
			server.startServer();
		} catch (AppException e) {
			e.printStackTrace();
		}
		System.out.println("ASS Monitor server started.");
	}
	
	public void stop(){
		server.destruct();
	}
}
