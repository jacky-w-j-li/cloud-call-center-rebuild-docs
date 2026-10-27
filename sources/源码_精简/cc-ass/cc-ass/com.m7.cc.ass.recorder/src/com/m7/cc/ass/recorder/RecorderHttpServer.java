package com.m7.cc.ass.recorder;

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
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class RecorderHttpServer implements HttpHandler {
	private static RecorderHttpServer instance;
	private HttpServer server;

	private static final Logger log = Logger.getLogger(RecorderHttpServer.class
			.getName());

	public RecorderHttpServer() {
		String a = ASConfig.getInstance().getVar("recorder.port");
		int port = 7002;
		if(a != null) {
			try {
				port = Integer.valueOf(a);
			} catch (Exception e) {
				log.log(Level.WARNING, "recorder.port incorrect", e);
			}
		}
		System.out.println("Start c5 recorder http server on port: "
				+ port);
		instance = this;

		InetSocketAddress addr = new InetSocketAddress(port);
		log.info("Start C5 recorder http server: "
				+ ASConfig.getInstance().getAcsPort());
		try {
			server = HttpServer.create(addr, 0);

			server.createContext("/", this);
			server.setExecutor(Executors.newCachedThreadPool());
			server.start();
		} catch (IOException e) {
			log.log(Level.WARNING, "Init recorder http server failed", e);
			System.out.println("Recorder http server start failed");
			System.exit(0);
		}
		System.out.println("Recorder http server started.");
	}

	public static RecorderHttpServer getInstance() {
		if (instance == null)
			new RecorderHttpServer();
		return instance;
	}

	public void close() {
		server.stop(0);
		instance = null;
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
		String path = exchange.getRequestURI().getPath();

		if (path.endsWith("command")) {
			processCommand(exchange);
			return;
		} else {
			sendOK("Unknow command", exchange);
		}
	}

	private void processGet(HttpExchange exchange) throws IOException {
		sendOK("7MOOR record Server does not support GET.\r\n"
				+ "Please use POST to send data", exchange);
	}

	private void processCommand(HttpExchange exchange) throws Exception {
		String strData = exchange.getRequestURI().getQuery();
		String[] params = strData.split("\\&");
		Hashtable<String, String> map = new Hashtable<String, String>();
		if (params.length > 0) {
			for (int i = 0; i < params.length; i++) {
				String[] a = params[i].split("=");
				map.put(a[0].trim(), a[1].trim());
			}
		}
		String actionName = map.get("Action");
		if (actionName.equals("MusicAdd")) {
			C5Action action = new C5Action(Fields.MusicAdd, Utils
					.getSynActionID("musicadd"));
			try {
				action.setValues(map);
				String pbx = action.getStringValue(Fields.PBX);
				String time = action.getStringValue(Fields.Times);
				String content_length = exchange.getRequestHeaders().get(
						"Content-length").get(0);
				String dir = "/var/spool/asterisk/monitor/" + pbx + "/" + time;

				File directory = new File(dir);
				if (!directory.exists()) {
					directory.mkdirs();
				}
				String filename = action.getStringValue(Fields.Filename);
				String _file = dir + "/" + filename;
				File file = new File(_file);
				file.createNewFile();
				BufferedOutputStream out = new BufferedOutputStream(
						new FileOutputStream(file));
				int length = Integer.valueOf(content_length);
				byte[] data = new byte[1024];
				int count = 0;
				while ((count = exchange.getRequestBody().read(data)) != -1) {
					out.write(data, 0, count);
					length -= count;
				}
				if (length != 0) {
					log
							.warning("Get imcompleted POST data! [" + filename
									+ "]");
					sendOK(new C5Response(action.getActionName(), action
							.getActionID(), "Imcompleted data", false),
							exchange);
					return;
				}
				out.flush();
				out.close();
				
				sendOK(new C5Response(action.getActionName(), action
						.getActionID(), true), exchange);
			} catch (Exception e) {
				log.log(Level.WARNING, "Add  music file failed", e);
				sendOK(new C5Response(action.getActionName(), action
						.getActionID(), "500 " + e.getMessage(), false),
						exchange);
			} finally {

			}

		}
	}

	public static void sendOK(C5Response response, HttpExchange exchange)
			throws IOException {
		String data = response.getJsonString();
		sendOK(data, exchange);
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

}
