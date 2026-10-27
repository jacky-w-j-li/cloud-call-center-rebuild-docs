package com.m7.cc.ass.gateway.config;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.Hashtable;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.cc.net.httpserver.Headers;
import com.cc.net.httpserver.HttpExchange;
import com.cc.net.httpserver.HttpHandler;
import com.cc.net.httpserver.HttpServer;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.config.handler.GwHandler;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class GWHttpServer implements HttpHandler {
	private static GWHttpServer instance;
	private HttpServer server;

	private RequestParser packetParser;
	private boolean isLinux = (System.getProperty("os.name").toLowerCase()
			.indexOf("linux") == 0);

	private static Logger requestLog;

	private static final Logger log = Logger.getLogger(GWHttpServer.class
			.getName());

	public GWHttpServer() {
		System.out.println("Start c5 GW http server on port: "
				+ ASConfig.getInstance().getGwPort());
		instance = this;
		requestLog = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
				"gw_request", "ALL", false);
		requestLog.setUseParentHandlers(false);

		packetParser = new RequestParser();

		InetSocketAddress addr = new InetSocketAddress(ASConfig.getInstance()
				.getGwPort());
		log.info("Start C5 GW config http server: "
				+ ASConfig.getInstance().getGwPort());
		try {
			server = HttpServer.create(addr, 0);

			server.createContext("/", this);
			server.setExecutor(Executors.newCachedThreadPool());
			server.start();
		} catch (IOException e) {
			log.log(Level.WARNING, "Init GW http server failed", e);
			System.out.println("GW http server start failed");
			System.exit(0);
		}
		System.out.println("GW http server started.");
	}

	public static GWHttpServer getInstance() {
		if (instance == null)
			new GWHttpServer();
		return instance;
	}

	public void handle(HttpExchange exchange) throws IOException {
		try {
			String allowIp = ASConfig.getInstance().getVar("billing.ip");
			if (allowIp != null) {
				String[] allowIps = null;
				if (allowIp.contains(",")) {
					allowIps = allowIp.split(",");
				} else {
					allowIps = new String[] { allowIp };
				}
				boolean isAllow = false;
				String clientIp = exchange.getRemoteAddress().getAddress().getHostAddress();
				for (String ip : allowIps) {
					if (clientIp.equals(ip)) {
						isAllow = true;
						break;
					}
				}
				if (!isAllow) {
					exchange.close();
					return;
				}
			}
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
		String content_length = exchange.getRequestHeaders().get(
				"Content-length").get(0);
		// String path = exchange.getRequestURI().getPath();
		int length = Integer.valueOf(content_length);
		byte[] data = new byte[1024];
		int count = 0;
		StringBuffer buffer = new StringBuffer();
		while ((count = exchange.getRequestBody().read(data)) != -1) {
			buffer.append(new String(data, 0, count, "UTF-8"));
			length -= count;
		}
		if (length != 0) {
			log.warning("Get imcompleted POST data! [" + buffer.toString()
					+ "]");
			sendOK(new C5Response("", "", "Imcompleted data", false), exchange);
			return;
		}

		String strData = buffer.toString();
		try {
			requestLog.info(strData);
			packetParser.parserPacket(strData, exchange);
		} catch (Exception e) {
			log.log(Level.WARNING, strData, e);
			sendOK(new C5Response("", "", "Error action [" + e.getMessage()
					+ "] \r\n" + strData, false), exchange);
		}
	}

	private void processGet(HttpExchange exchange) throws IOException {
		sendOK("7MOOR GateWay Server 1.1.0", exchange);
	}

	public static void sendOK(C5Response response, HttpExchange exchange)
			throws IOException {
		String data = response.getJsonString();
		sendOK(data, exchange);
	}

	public static void sendOK(String data, HttpExchange exchange)
			throws IOException {
		try {
			requestLog.finest("Send response to client[: " + data);
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
}
