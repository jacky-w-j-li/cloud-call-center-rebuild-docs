package com.m7.cc.ass.server.monitor.server.tcp;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.SmartServer;
import com.koala.smart.server.exception.AppException;

public class MonitorTCPServer {
	private SmartServer server;
	private MonitorTCPHandler monitorHandler;
	
	private static final Logger log = Logger.getLogger(MonitorTCPServer.class.getName());
	
	public MonitorTCPServer(){
		server  = new SmartServer("monitor_tcp_server.conf");
		monitorHandler = new MonitorTCPHandler();
		log.info("Start monitor server[TCP].");
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
		System.out.println("ASS Monitor server[TCP] started.");
	}
	
	public void stop(){
		server.destruct();
	}
}
