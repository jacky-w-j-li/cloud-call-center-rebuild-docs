package com.m7.cc.ass.server.config;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URL;
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
import com.m7.cc.util.log.IceLogger;

public class ACSHttpServer implements HttpHandler {
	private static ACSHttpServer instance;
	private HttpServer server;

	private RequestParser packetParser;
	private boolean isLinux = (System.getProperty("os.name").toLowerCase().indexOf("linux") == 0);

	private static Logger requestLog;

	private static final Logger log = Logger.getLogger(ACSHttpServer.class
			.getName());

	public ACSHttpServer() {
		System.out.println("Start c5 http server on port: "+ASConfig.getInstance().getAcsPort());
		instance = this;
		requestLog = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
				"acs_request", "ALL", false);
		requestLog.setUseParentHandlers(false);

		packetParser = new RequestParser();

		InetSocketAddress addr = new InetSocketAddress(ASConfig.getInstance().getAcsPort());
		log.info("Start C5 config http server: "+ASConfig.getInstance().getAcsPort());
		try {
			server = HttpServer.create(addr, 0);

			server.createContext("/", this);
			server.setExecutor(Executors.newCachedThreadPool());
			server.start();
		} catch (IOException e) {
			log.log(Level.WARNING, "Init http server failed", e);
			System.out.println("Http server start failed");
			System.exit(0);
		}
		System.out.println("Http server started.");
	}

	public static ACSHttpServer getInstance() {
		if (instance == null)
			new ACSHttpServer();
		return instance;
	}

	public void handle(HttpExchange exchange) throws IOException {
		try{
			String requestMethod = exchange.getRequestMethod();
			if (requestMethod.equalsIgnoreCase("GET")) {
				processGet(exchange);
			} else if (requestMethod.equalsIgnoreCase("POST")) {
				processPost(exchange);
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			exchange.close();
		}
	}

	private void processPost(HttpExchange exchange) throws Exception {
		String path = exchange.getRequestURI().getPath();

		if (path.endsWith("command")) {
			String strData = exchange.getRequestURI().getQuery();
			requestLog.finest("Get action from client[" + strData + "]");
			processCommand(exchange);
			return;
		}
		
		String content_length = exchange.getRequestHeaders().get(
				"Content-length").get(0);
		// String path = exchange.getRequestURI().getPath();
		int length = Integer.valueOf(content_length);
		byte[] data = new byte[length];
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
			sendOK(new C5Response("", "", "Error action [" + e.getMessage()+"] \r\n"+strData, false),
					exchange);
		}
	}

	private void processGet(HttpExchange exchange) throws IOException {
		sendOK("7moor Configuration Server does not support GET.\r\n"
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
			C5Action action = new C5Action(Fields.MusicAdd, Utils.getSynActionID("musicadd"));
			try {
				action.setValues(map);
				String pbx = action.getStringValue(Fields.PBX);
				String account = action.getStringValue(Fields.Account);
				boolean holdMusic = false;
				boolean isQiniuMusic = false;
				String qiniuMusicUrl = "";
				if(action.hasKey(Fields.IsQiniuMusic)){
					isQiniuMusic = action.getStringValue(Fields.IsQiniuMusic).equals("yes");
					qiniuMusicUrl =  action.getStringValue(Fields.QiniuMusicUrl).replaceAll("@","=/");
				}
				if(action.hasKey(Fields.IsHoldMusic))
					holdMusic = action.getStringValue(Fields.IsHoldMusic).equals("yes");
				
				String dir = ASConfig.getInstance()
						.getConfigPath()
						+ "/"
						+ pbx
						+ "/accounts/"
						+ account + "/";
				if(holdMusic){
					dir = dir + "moh/" + action.getStringValue(Fields.HoldMusic);
					Activator.getHandler().handle(action);
				}
				else dir = dir + ASConfig.AudioDirectory;
				
				File directory = new File(dir);
				if (!directory.exists()) {
					sendOK(new C5Response(action.getActionName(), action
							.getActionID(), "404 File not found", false),
							exchange);
					return;
				}
				String filename = action.getStringValue(Fields.Filename);
				String tempFile = dir
						+ "/temp_"
						+ filename;
				String _file = dir
						+ "/"
						+ filename;
				if(!isLinux)
					tempFile = _file;
				File file = new File(tempFile);
				file.createNewFile();
				BufferedOutputStream out = new BufferedOutputStream(
						new FileOutputStream(file));
				
				if(!isQiniuMusic || qiniuMusicUrl.equals("")){
					String content_length = exchange.getRequestHeaders().get(
							"Content-length").get(0);
					int length = Integer.valueOf(content_length);
					byte[] data = new byte[1024];
					int count = 0;
					while ((count = exchange.getRequestBody().read(data)) != -1) {
						out.write(data, 0, count);
						length -= count;
					}
					if (length != 0) {
						log.warning("Get imcompleted POST data! [" + filename
								+ "]");
						sendOK(new C5Response(action.getActionName(), action.getActionID(),
								"Imcompleted data", false), exchange);
						return;
					}
					out.flush();
					out.close();
				}else{
					InputStream in = new URL(qiniuMusicUrl).openConnection().getInputStream();
					byte [] bb=new byte[1024];
					int len;
					while( (len=in.read(bb))>0){
						out.write(bb, 0, len);
					}
					out.flush();
					out.close();
					in.close();
				}
				if(isLinux){
					Process process = Runtime.getRuntime().exec(ASConfig.getInstance().getSox()+" "
							+tempFile+" -c 1 -r 8000 -A -2 "+_file);
//					BufferedReader in = new BufferedReader(new InputStreamReader(process.getErrorStream()));
//					String line;
//					String result = "";
//					while ((line = in.readLine()) != null) {
//						result += line;
//					}
//					if(result.equals("Segmentation fault")){
//						file.delete();
//						throw new Exception("Unsupport file format");
//					}
					process.waitFor();
					process.destroy();
					file.delete();
				}
				sendOK(new C5Response(action.getActionName(), action
						.getActionID(), true), exchange);
			} catch (Exception e) {
				log.log(Level.WARNING, "Add  music file failed", e);
				sendOK(new C5Response(action.getActionName(), action
						.getActionID(), "500 "+e.getMessage(), false), exchange);
			} finally {
				exchange.close();
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
		try{
			requestLog.finest("Send response to client[: " + data);
			Headers responseHeaders = exchange.getResponseHeaders();
			responseHeaders.set("Content-Type", "text/plain");
			byte[] toSend = data.getBytes("UTF-8");
			responseHeaders.set("Content-Length", toSend.length + "");
			exchange.sendResponseHeaders(200, 0);
			exchange.getResponseBody().write(toSend);
			exchange.getResponseBody().flush();
			exchange.getResponseBody().close();
		} catch (Throwable e){
			
		} finally {
			exchange.close();
		}
	}
	public static void main(String[] args) {
		try {
			InputStream in = new URL("http://7xo2y7.com2.z0.glb.qiniucdn.com/OOuPmA8_Tkoz3I8ZZudLM9orU1I=/Fu0mF7a_0rhrykFv2RMfcebbD3RO").openConnection().getInputStream();
//			FileOutputStream f = new FileOutputStream("/Users/chenguang/learn/mmm.wav");
			File file = new File("/Users/chenguang/learn/abc.wav");
			file.createNewFile();
			BufferedOutputStream out = new BufferedOutputStream(
					new FileOutputStream(file));
			byte [] bb=new byte[1024];
			int len;
			while( (len=in.read(bb))>0){
				System.out.println("write---");
				out.write(bb, 0, len);
			}
			out.flush();
			out.close();
			in.close();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
