package com.m7.cc.ass.server.core;

import com.m7.cc.ass.server.http.C5HttpServer;
import com.m7.cc.ass.server.tcp.AssTcpServer;

/**
 * 
 * @author Cai Zhibin 2009-6-19
 * 
 */
public class AsteriskStatusServer {
	

	private static AsteriskStatusServer instance;

	public C5Timer timer = new C5Timer("ASS Timer");

	private C5HttpServer httpServer;

	public AsteriskStatusServer() {
		instance = this;
		startup();
	}

	public static AsteriskStatusServer getInstance() {
		return instance;
	}

	public C5HttpServer getHttpServer() {
		return httpServer;
	}

	private void startup() {

		httpServer = new C5HttpServer();
		
		AssTcpServer.getInstance();

		System.out.println("ASS started.");
	}

	public void stop() {
		System.exit(0);
	}
}
