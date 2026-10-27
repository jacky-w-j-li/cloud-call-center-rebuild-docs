package com.m7.cc.ass.server.http;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.cc.net.httpserver.HttpServer;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.util.Utils;

public class C5HttpServer {
	private static C5HttpServer instance;
	private HttpServer server;
//	private Timer timer;
	private C5HttpHandler httpHandler;
	
	private static final Logger log = Logger.getLogger(C5HttpServer.class.getName());
	
	public C5HttpServer(){
		instance = this;
		Utils.startTime = Utils.getCurrentTimestamp();
		InetSocketAddress addr = new InetSocketAddress(ASConfig.getInstance().getAssPort());
		log.info("Start http server: "+ASConfig.getInstance().getAssPort());
		try {
			server  = HttpServer.create(addr, 0);
			httpHandler = new C5HttpHandler();
			
			server.createContext("/", httpHandler);
//			server.createContext("/image", httpHandler);
		    server.setExecutor(Executors.newCachedThreadPool());
		    server.start();
		} catch (IOException e) {
			log.log(Level.WARNING, "Init http server failed", e);
			System.exit(0);
		}
	}
	
	public static C5HttpServer getInstance(){
		return instance;
	}
	
	public C5HttpHandler getHttpHandler() {
		return httpHandler;
	}
}
