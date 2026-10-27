package com.m7.cc.ass.server.tcp;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.SmartServer;
import com.koala.smart.server.exception.AppException;

public class AssTcpServer {
	private SmartServer server;
	private SessionHandler sessionHandler;
	private static AssTcpServer instance = null;
	
	private static final Logger log = Logger.getLogger(AssTcpServer.class.getName());
	
	private AssTcpServer(){
		instance = this;
		server  = new SmartServer("ass_tcp_server.conf");
		sessionHandler = new SessionHandler();
		log.info("Start ASS TCP server.");
		try {
			server.addSessionListener(sessionHandler);
			server.setByteHandler(sessionHandler);
		} catch (AppException e) {
			log.log(Level.WARNING, "Start ASS TCP server failed.", e);
		}
		
		try {
			server.startServer();
		} catch (AppException e) {
			log.log(Level.WARNING, "Start ASS TCP server failed.", e);
		}
		log.info("Start ASS TCP server succeed.");

	}
	
	public static AssTcpServer getInstance(){
		if (null == instance)
			instance = new AssTcpServer();
		return instance;
	}

	public SessionHandler getSessionHandler() {
		return sessionHandler;
	}
	
}
