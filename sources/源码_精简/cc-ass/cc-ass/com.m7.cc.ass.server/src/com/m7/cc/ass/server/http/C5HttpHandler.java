package com.m7.cc.ass.server.http;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.cc.net.httpserver.Headers;
import com.cc.net.httpserver.HttpExchange;
import com.cc.net.httpserver.HttpHandler;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.server.Activator;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

/**
 * This class will handle HTTP request from C5 Web client.
 * 
 * @author Cai Zhibin 2009-6-22
 * 
 */
public class C5HttpHandler implements HttpHandler {
	public final Hashtable<String, String> MIME_TYPES = new Hashtable<String, String>();
	private static final Logger log = Logger.getLogger(C5HttpHandler.class
			.getName());
	private static Logger requestLog;

	private Hashtable<String, C5Session> sessions = new Hashtable<String, C5Session>();

	// private File rootDir = new File("www");

	public C5HttpHandler() {
		requestLog = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
				"request", "ALL", false);
		requestLog.setUseParentHandlers(false);

		String image = "image/";
		MIME_TYPES.put(".gif", image + "gif");
		MIME_TYPES.put(".jpg", image + "jpeg");
		MIME_TYPES.put(".jpeg", image + "jpeg");
		MIME_TYPES.put(".png", image + "png");
		String text = "text/";
		MIME_TYPES.put(".html", text + "html");
		MIME_TYPES.put(".htm", text + "html");
		MIME_TYPES.put(".txt", text + "plain");
	}

	public void handle(HttpExchange exchange) throws IOException {
		String requestMethod = exchange.getRequestMethod();
		try {
			if (requestMethod.equalsIgnoreCase("GET")) {
				processGet(exchange);
			} else if (requestMethod.equalsIgnoreCase("POST")) {
				processPost(exchange);
			}
		} catch (Exception e) {
			sendOK(e.getMessage(), exchange);
		}
	}

	public void addSession(String sessionID, C5Session session) {
		sessions.put(sessionID, session);
	}

	public void removeSession(String sessionID) {
		sessions.remove(sessionID);
	}

	public Hashtable<String, C5Session> getSessions() {
		return sessions;
	}

	/**
	 * C5 Action will be transported via POST request. We parse it in this
	 * method and then send it to c5session for handling.
	 * 
	 * @param exchange
	 * @throws IOException
	 */
	private void processPost(HttpExchange exchange) throws Exception {
		String content_length = exchange.getRequestHeaders().get(
				"Content-length").get(0);
		String path = exchange.getRequestURI().getPath();

		if (path.endsWith("command")) {
			String strData = exchange.getRequestURI().getQuery();
			requestLog.finest("Get action from client[" + strData + "]");
			processCommand(exchange);
			return;
		}

		int length = Integer.valueOf(content_length);
		byte[] data = new byte[1024];
		int count = 0;
		StringBuffer buffer = new StringBuffer();
		while ((count = exchange.getRequestBody().read(data)) != -1) {
			buffer.append(new String(data, 0, count, "UTF-8"));
			length -= count;
		}
		if (length != 0) {
			log.warning("Imcompleted POST data! [" + buffer.toString() + "]");
			sendOK("Imcompleted POST data! [" + buffer.toString() + "]",
					exchange);
			return;
		}

		String strData = buffer.toString();
		if (path.endsWith("app")) {
			processAppJsonString(strData, exchange);
			return;
		}
		if (strData.startsWith("json")) {
			processJsonString(strData, exchange);
		} else {
			if (strData.startsWith("?"))
				strData = strData.substring(1);
			processNormalString(strData, exchange);
		}
	}

	private void processAppJsonString(String strData, HttpExchange exchange)
			throws Exception {
		HashMap<String, Object> map = null;
		try {
			JSONReader jsonReader = new JSONReader();
			map = (HashMap<String, Object>) jsonReader.read(strData);
		} catch (Exception e1) {
			requestLog.log(Level.WARNING, "Error action: " + strData, e1);
			C5Response response = new C5Response("", "", false);
			response.setMessage("400 Error action: " + strData);
			sendOK(response, exchange);
			return;
		}
		processData(map, exchange);
	}

	private void processNormalString(String strData, HttpExchange exchange)
			throws Exception {
		strData = URLDecoder.decode(strData, "UTF-8");
		HashMap<String, Object> map = new HashMap<String, Object>();
		try {
			String[] command = strData.split("&");
			for (int i = 0; i < command.length; i++) {
				String[] param = command[i].split("=");
				if (param.length == 2)
					map.put(param[0], param[1]);
			}
			map.put(Fields.Command, Fields.Action);
		} catch (Exception e) {
			requestLog.log(Level.WARNING, "Error action: " + strData, e);
			C5Response response = new C5Response("", "", false);
			response.setMessage("Error action: " + strData);
			sendOK(response, exchange);
			return;
		}
		processData(map, exchange);
	}

	private void processJsonString(String strData, HttpExchange exchange)
			throws Exception {
		HashMap<String, Object> map = null;
		try {
			if(strData.indexOf('&') != -1){
				strData = strData.substring(strData.indexOf('=') + 1, strData
						.indexOf('&'));				
			}else{
				strData = strData.substring(strData.indexOf('=') + 1);		
			}
			strData = URLDecoder.decode(strData, "UTF-8");
			JSONReader jsonReader = new JSONReader();
			map = (HashMap<String, Object>) jsonReader.read(strData);
		} catch (Exception e1) {
			requestLog.log(Level.WARNING, "Error action: " + strData, e1);
			C5Response response = new C5Response("", "", false);
			response.setMessage("Error action: " + strData);
			sendOK(response, exchange);
			return;
		}
		processData(map, exchange);
	}

	private void processData(HashMap<String, Object> map, HttpExchange exchange)
			throws Exception {
		if (map.size() < 2) {
			C5Response response = new C5Response("", "", false);
			response.setMessage("Empty action");
			sendOK(response, exchange);
			return;
		}
		if (!map.get(Fields.Action).equals(Fields.GetState)) {
			requestLog.finest("Get action from client: \r\n"
					+ map.toString().replaceAll(",", "\r\n"));
		}
		if (!map.containsKey(Fields.SessionID)) {
			String actionName = (String) map.get(Fields.Action);
			if (actionName.equalsIgnoreCase(Fields.Login)) {
				C5Session session = new C5Session();
				try {
					session.parserPacket(map, exchange);
				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
					sendOK(e.getMessage(), exchange);
				}
			} else {
				String actionID;
				if (map.containsKey(Fields.ActionID)){
					actionID = map.get(Fields.ActionID).toString();
				} else {
					actionID = Utils.getSynActionID(actionName);
				}
				C5Action action = new C5Action(actionName, actionID);
				action.setValues(map);
				C5Response response = null;
				if (action.hasKey(Fields.HandlerType)) {
					response = Activator.getHandler(
							action.getStringValue(Fields.HandlerType)).handle(
							action);
				} else
					response = Activator.getHandler().handle(action);
				sendOK(response, exchange);
				return;
			}
		} else {
			String sessionID = (String) map.get(Fields.SessionID);
			C5Session session = sessions.get(sessionID);
			if (session == null) {
				String actionName = (String) map.get(Fields.Action);
				if (actionName.equals(Fields.Logoff)) {
					// Logoff reserved user
					String pbx = (String) map.get(Fields.PBX);
					String account = (String) map.get(Fields.Account);
					String userID = (String) map.get(Fields.User);
					boolean queueRemove = (Boolean) map.get(Fields.QueueRemove);

					User c5user = RuntimeData.getInstance().getAccount(pbx,
							account).getUser(userID);
					if (c5user != null && c5user.isReserve() && queueRemove
							&& c5user.getSipNum() != null) {
						List<String> queues = RuntimeData.getInstance()
								.getAccount(c5user.getPbx(),
										c5user.getAccount()).getQueueExtens();
						for (int i = 0; i < queues.size(); i++) {
							String queue = queues.get(i);
							QueueRemove action = new QueueRemove(queue, "SIP"
									+ "/" + c5user.getSipNum(), Utils
									.getSynActionID("queueremove"));
							AMICore.getInstance().getAMIClient(c5user.getPbx())
									.sendSynchronousAction(action);
						}
						C5Response response = new C5Response(actionName, "",
								true);
						response.setMessage("Logoff succeed");
						sendOK(response, exchange);
					} else {
						C5Response response = new C5Response("", "", false);
						response.setMessage("User not found");
						sendOK(response, exchange);
					}
				} else {
					// it's user_id is expired
					C5Response response = new C5Response("", "", false);
					response
							.setMessage("Your user id has expired! Please login again to get a new id.");
					response.addParameter("Expired", true);
					sendOK(response, exchange);
				}
				return;
			}
			try {
				session.parserPacket(map, exchange);
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
				sendOK(e.getMessage(), exchange);
			}
		}
	}

	/**
	 * 
	 * @param exchange
	 * @throws IOException
	 */
	private void processGet(HttpExchange exchange) throws Exception {
		String path = exchange.getRequestURI().getPath();
		String rrr = exchange.getRequestURI().getQuery();
		if (rrr != null && rrr.indexOf("GetState") == -1) {
			if (rrr.indexOf(Fields.Login) > -1) {
				String ip = "";
				if (exchange.getRemoteAddress() != null
						&& exchange.getRemoteAddress().getAddress() != null)
					ip = exchange.getRemoteAddress().getAddress().toString();
				requestLog.info("Get action from client[" + ip + "]: " + rrr);
			} else
				requestLog.info("Get action from client: " + rrr);
		}
		if (path.startsWith("/monitor")) {
			// requestLog.info("Download record: "+path);
			this.processDownloadRecord(exchange, path);
			return;
		} else if (path.endsWith("command")) {
			processCommand(exchange);
			return;
		} else if (path.endsWith("app")) {
			processCommand(exchange);
			return;
		} else {
			try {
				String strData = exchange.getRequestURI().getQuery();
				HashMap<String, String> map = new HashMap<String, String>();
				if (strData != null && strData.indexOf('&') > -1) {
					String[] commands = strData.split("&");
					for (int i = 0; i < commands.length; i++) {

						String[] command = commands[i].split("=");
						if (command.length == 2)
							map.put(command[0], command[1]);
					}
					String json = map.get("json");
					String callbackname = map.get("callbackName");
					HashMap<String, Object> map1 = null;
					try {
						json = URLDecoder.decode(json, "UTF-8");
						JSONReader jsonReader = new JSONReader();
						map1 = (HashMap<String, Object>) jsonReader.read(json);
					} catch (Exception e1) {
						requestLog.log(Level.WARNING, "Error action: "
								+ strData, e1);
						C5Response response = new C5Response("", "", false);
						response.setMessage("Error action: " + strData);
						sendOK(response, exchange);
						return;
					}
					if (callbackname != null)
						exchange.setVar("callbackName", callbackname);
					processData(map1, exchange);
				} else {
					String data = ASConfig.serverName + ASConfig.version;
					sendOK(data, exchange);
				}
				return;
			} catch (Exception e) {
				sendOK("Bad request", exchange);
			}
		}
	}

	private void processDownloadRecord(HttpExchange exchange, String path)
			throws Exception {
		try {
			if (!path.endsWith("mp3")) {
				throw new Exception("Access forbidden: " + path);
			}

			File file = new File("/var/spool/asterisk" + path);
			if (!file.exists()) {
				throw new Exception("File not found");
			}
			BufferedInputStream bis = new BufferedInputStream(
					new FileInputStream(file));
			byte[] data = new byte[4096];
			Headers responseHeaders = exchange.getResponseHeaders();
			// force client to download this file
			// responseHeaders.set("Content-Type",
			// "application/force-download");
			responseHeaders.set("Content-Length", bis.available() + "");
			String fileName = file.getName();
			responseHeaders.set("Content-Disposition", "attachment;filename="
					+ fileName);
			exchange.sendResponseHeaders(200, bis.available());
			int a = 0;
			int b = 0;
			while ((a = bis.read(data)) != -1) {
				exchange.getResponseBody().write(data, 0, a);
				b = b + a;
			}
			bis.close();
			exchange.getResponseBody().flush();
			exchange.getResponseBody().close();
		} catch (Exception e) {
			log.log(Level.WARNING, exchange.getRemoteAddress().getAddress()
					.toString(), e);
			sendOK("Download error", exchange);
		} finally {
			exchange.close();
		}

	}

	private void processCommand(HttpExchange exchange) throws Exception {
		String strData = exchange.getRequestURI().getQuery();
		Hashtable<String, String> map = new Hashtable<String, String>();
		if (strData.indexOf('&') > -1) {
			String[] commands = strData.split("&");
			for (int i = 0; i < commands.length; i++) {

				String[] command = commands[i].split("=");
				if (command.length == 2)
					map.put(command[0], command[1]);
			}

			C5Response response = new C5Response("", "", "Error action", false);
			String actionName = map.get(Fields.Action);
			String actionID = map.get(Fields.ActionID);
			if (actionID == null)
				actionID = Utils.getSynActionID(actionName);
			C5Action action = new C5Action(actionName, actionID);
			action.setValues(map);
			String callbackname = map.get("callbackName");
			if (callbackname != null)
				exchange.setVar("callbackName", callbackname);
			if (action.hasKey(Fields.HandlerType)) {
				response = Activator.getHandler(
						action.getStringValue(Fields.HandlerType)).handle(
						action);
			} else
				response = Activator.getHandler().handle(action);
			sendOK(response, exchange);
		} else {
			sendOK(new C5Response("", "", "Error action", false), exchange);
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
			String callbackName = (String) exchange.getVar("callbackName");
			if (callbackName != null) {
				data = callbackName + "(" + data + ")";
				exchange.setVar("callbackName", null);
			}
			Headers responseHeaders = exchange.getResponseHeaders();
			responseHeaders.set("Content-Type", "text/plain");
			byte[] toSend = data.getBytes("UTF-8");
			responseHeaders.set("Content-Length", toSend.length + "");
			exchange.sendResponseHeaders(200, 0);
			exchange.getResponseBody().write(toSend);
			exchange.getResponseBody().flush();
			exchange.getResponseBody().close();
		} catch (Exception e) {
			// log.log(Level.WARNING, "", e);
		} finally {
			exchange.close();
		}
	}
}
