package com.m7.cc.asterisk.fastagi;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.SmartServer;
import com.koala.smart.server.exception.AppException;

public class AgiServer {
	private SmartServer server;
	private AgiSessionHandler sessionHandler;
	private static Logger log = Logger.getLogger(AgiServer.class.getName());
	
	public AgiServer(){
		server  = new SmartServer("agi_tcp_server.conf");
		sessionHandler = new AgiSessionHandler();
		log.info("Start AGI server.");
		try {
			server.addSessionListener(sessionHandler);
			server.setByteHandler(sessionHandler);
		} catch (AppException e) {
			log.log(Level.WARNING, "Start AGI server failed.", e);
		}
		
		try {
			server.startServer();
		} catch (AppException e) {
			log.log(Level.WARNING, "Start AGI server failed.", e);
		}
		log.info("Start AGI server succeed.");
	}
	
	public void close(){
		server.destruct();
		sessionHandler.close();
	}
}
