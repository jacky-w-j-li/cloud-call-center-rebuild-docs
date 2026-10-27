package com.m7.cc.asterisk.cdr.server;

import java.io.IOException;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.cc.net.httpserver.Headers;
import com.cc.net.httpserver.HttpExchange;
import com.cc.net.httpserver.HttpHandler;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;

/**
 * This class handles HTTP request from GW CDR request
 * 
 * @author yangwl
 * 
 */
public class C5HttpHandler implements HttpHandler {
	public final Hashtable<String, String> MIME_TYPES = new Hashtable<String, String>();
	private static final Logger log = Logger.getLogger(C5HttpHandler.class
			.getName());
	private CDREventProcessor processor = new CDREventProcessor();

	public C5HttpHandler() {
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
			sendOK("500", exchange);
		}
	}

	/**
	 * C5 Action will be transported via POST request. We parse it in this
	 * method and then send it to c5session for handling.
	 * 
	 * @param exchange
	 * @throws IOException
	 */
	private void processPost(HttpExchange exchange) throws Exception {
		String content_length = exchange.getRequestHeaders()
				.get("Content-length").get(0);
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
			sendOK("204", exchange);
			return;
		}

		processString(buffer.toString(), exchange);
	}

	private void processString(String strData, HttpExchange exchange)
			throws Exception {
		try {
			strData = URLDecoder.decode(strData, "UTF-8");
			String[] a = strData.split("<>");
//			if(a.length > 1) {
//				log.warning("getcdr: "+strData);
//			}
			log.warning("getcdrs count: "+a.length);
			if(a.length < 40) {
				log.warning("getcdrs limit 40 count: we sleep 500ms");
				Thread.sleep(500);
			}
			for(int i=0;i<a.length;i++) {
				JSONReader jsonReader = new JSONReader();
				processData((HashMap<String, Object>) jsonReader.read(a[i]), exchange);
			}
			sendOK("200", exchange);
		} catch (Exception e1) {
			log.log(Level.WARNING, "Error action: "+strData, e1);
			sendOK("200", exchange);
			return;
		}
	}

	private void processData(HashMap<String, Object> map, HttpExchange exchange)
			throws Exception {
		if (map.size() < 2) {
			log.log(Level.WARNING, "Empty action: "+map);
			sendOK("200", exchange);
			return;
		}
		
		if (!map.containsKey(Fields.Event)){
			log.log(Level.WARNING, "Error action: "+map);
			sendOK("200", exchange);
			return;
		}
		
		C5Event event = new C5Event(map.get(Fields.Event).toString());
		event.getParameters().putAll(map);
		processor.processEvent(event);
	}

	/**
	 * 
	 * @param exchange
	 * @throws IOException
	 */
	private void processGet(HttpExchange exchange) throws Exception {
		sendOK("401", exchange);
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
