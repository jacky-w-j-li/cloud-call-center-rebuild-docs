package com.dishui.server.http;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.net.httpserver.HttpServer;

public class AppHttpServer {
	private static AppHttpServer instance;
	private HttpServer server;
	private static AppHttpHandler httpHandler;
	private static final Logger log = Logger.getLogger(AppHttpServer.class
			.getName());

	public AppHttpServer() {
		instance = this;
		Utils.startTime = Utils.getCurrentTimestamp();
		InetSocketAddress addr = new InetSocketAddress(AppConfig.getInstance()
				.getHttpPort());
		log.info("Start weibo http server: "
				+ AppConfig.getInstance().getHttpPort());
		try {
			server = HttpServer.create(addr, 0);
			httpHandler = new AppHttpHandler();
			server.createContext("/", httpHandler);
			server.setExecutor(Executors.newCachedThreadPool());
			server.start();
			System.out.println("app Http server started on "
					+ AppConfig.getInstance().getHttpPort());
		} catch (IOException e) {
			log.log(Level.WARNING, "Init app http server failed", e);
			System.exit(0);
		}
	}

	public static AppHttpServer getInstance() {
		return instance;
	}

	public static AppHttpHandler getHttpHandler() {
		return httpHandler;
	}

	public void stop() {

	}
}
