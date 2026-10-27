package com.m7.cc.asterisk.cdr.server;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.cc.net.httpserver.HttpServer;
import com.m7.cc.json.JSONReader;
import com.m7.cc.util.Utils;

public class CDRHttpServer {
	private static CDRHttpServer instance;
	private HttpServer server;
	// private Timer timer;
	private C5HttpHandler httpHandler;

	private static final Logger log = Logger.getLogger(CDRHttpServer.class
			.getName());

	public CDRHttpServer() {
		instance = this;
		Utils.startTime = Utils.getCurrentTimestamp();
		InetSocketAddress addr = new InetSocketAddress(
				Integer.valueOf(CdrServerConfig.getInstance().getPort()));
		log.info("Start CDR http server: "
				+ CdrServerConfig.getInstance().getPort());
		try {
			server = HttpServer.create(addr, 0);
			httpHandler = new C5HttpHandler();

			server.createContext("/", httpHandler);
			// server.createContext("/image", httpHandler);
			server.setExecutor(Executors.newCachedThreadPool());
			server.start();
			System.out.println("CDR http server Started at port: "
					+ CdrServerConfig.getInstance().getPort());
		} catch (IOException e) {
			log.log(Level.WARNING, "Init CDR http server failed", e);
			System.out.println("Init CDR http server failed!");
			System.exit(0);
		}
	}

	public void stop() {
		server.stop(0);
		server = null;
		httpHandler = null;
		instance = null;
	}

	public static CDRHttpServer getInstance() {
		return instance;
	}

	public C5HttpHandler getHttpHandler() {
		return httpHandler;
	}
}
