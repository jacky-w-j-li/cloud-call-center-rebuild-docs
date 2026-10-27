package com.m7.cc.ass.server.monitor.server.http;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.Hashtable;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.cc.net.httpserver.Headers;
import com.cc.net.httpserver.HttpExchange;
import com.cc.net.httpserver.HttpHandler;
import com.cc.net.httpserver.HttpServer;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.command.Fields;

public class MonitorHttpServer implements HttpHandler {
	private static MonitorHttpServer instance;
	private HttpServer server;

	private static final Logger log = Logger.getLogger(MonitorHttpServer.class
			.getName());

	public MonitorHttpServer() {
		instance = this;

		String a = ASConfig.getInstance().getVar("monitor.http");
		int port = 7001;
		try{
			if(a != null) {
				port = Integer.valueOf(a);
			}
		}catch (Exception e) {
			
		}
		InetSocketAddress addr = new InetSocketAddress(port);
		log.info("Start C5 Monitor http server: "
				+ port);
		try {
			server = HttpServer.create(addr, 0);
			server.createContext("/", this);
			server.setExecutor(Executors.newCachedThreadPool());
			server.start();
		} catch (IOException e) {
			log.log(Level.WARNING, "Init C5 Monitor http server failed", e);
			System.out.println("C5 Monitor http server start failed");
			System.exit(0);
		}
		System.out.println("Monitor http server started.");
	}

	public static MonitorHttpServer getInstance() {
		if (instance == null)
			new MonitorHttpServer();
		return instance;
	}

	public void handle(HttpExchange exchange) throws IOException {
		try {
			String requestMethod = exchange.getRequestMethod();
			if (requestMethod.equalsIgnoreCase("GET")) {
				processGet(exchange);
			} else if (requestMethod.equalsIgnoreCase("POST")) {
				processPost(exchange);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			exchange.close();
		}
	}

	private void processPost(HttpExchange exchange) throws Exception {
		sendOK("7MOOR Monitor Server 1.1.0", exchange);
	}

	private void processGet(HttpExchange exchange) throws IOException {
		String path = exchange.getRequestURI().getPath();
		if (path.startsWith("/c5monitor")) {
			String strData = exchange.getRequestURI().getQuery();
			Hashtable<String, String> map = new Hashtable<String, String>();
			if (strData.indexOf('&') > -1) {
				String[] commands = strData.split("&");
				for (int i = 0; i < commands.length; i++) {

					String[] command = commands[i].split("=");
					if (command.length == 2)
						map.put(command[0], command[1]);
				}

				String actionName = map.get(Fields.Action);

				try {
					if (actionName.equalsIgnoreCase("getQueueViaName")) {
						String pbx = map.get(Fields.PBX);
						String accountID = map.get(Fields.Account);
						String queueName = map.get(Fields.DisplayName);
						Hashtable<String, C5Queue> queues = RuntimeData
								.getInstance().getAccount(pbx, accountID)
								.getQueues();
						List<String> queueExtens = RuntimeData.getInstance()
								.getAccount(pbx, accountID).getQueueExtens();
						for (int q = 0; q < queueExtens.size(); q++) {
							String queueExten = queueExtens.get(q);
							C5Queue queue = queues.get(queueExten);
							if (queue != null
									&& queue.getDisplayName() != null
									&& queue.getDisplayName().equalsIgnoreCase(
											queueName)) {
								sendOK(queueExten, exchange);
								return;
							}
						}
						
					}
					sendOK("error", exchange);
				} catch (Exception e) {
					sendOK("error", exchange);
				}

			} else {
				sendOK("error", exchange);
			}
		} else {
			sendOK("error", exchange);
		}
	}

	public static void sendOK(String data, HttpExchange exchange)
			throws IOException {
		try {
			Headers responseHeaders = exchange.getResponseHeaders();
			responseHeaders.set("Content-Type", "text/plain");
			byte[] toSend = data.getBytes("UTF-8");
			responseHeaders.set("Content-Length", toSend.length + "");
			exchange.sendResponseHeaders(200, 0);
			exchange.getResponseBody().write(toSend);
			exchange.getResponseBody().flush();
			exchange.getResponseBody().close();
		} catch (Throwable e) {

		} finally {
			exchange.close();
		}
	}
	
	public void stop() {
		server.stop(0);
	}
}
