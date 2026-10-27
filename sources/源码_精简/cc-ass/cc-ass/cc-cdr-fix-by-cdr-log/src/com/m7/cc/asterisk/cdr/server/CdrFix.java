package com.m7.cc.asterisk.cdr.server;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.handler.CDRHandler;
import com.m7.cc.asterisk.cdr.server.handler.DefaultCDRHandler;
import com.m7.cc.asterisk.cdr.server.handler.NewAppCDRHandler;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.db.oracle.AppDBProvider;
import com.m7.cc.db.oracle.DBProvider;
import com.m7.cc.json.JSONReader;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class CdrFix {
	private static CdrFix instance;
	private CdrServerConfig config;
	private Logger log;
	private Thread dbThread;
	private CDRHttpServer httpServer;
	private CDRHandler cdrHandler = null;

	public CdrFix() {
		instance = this;

		// 1. Load configuration
		config = CdrServerConfig.getInstance();
		config.loadConfig();

		// 2. init log
		try {
			IceLogger.initLogger(config.getLogDir(), "cdr_server",
					config.getLogLevel(), config.isLogConsole());
		} catch (Exception e) {
			e.printStackTrace();
			System.exit(0);
			return;
		}
		log = Logger.getLogger(CdrFix.class.getName());

		// 3. init cdr handler and connect db
		boolean isConnected = false;
		if(CdrServerConfig.getInstance().getHandlerType().equals(CdrServerConfig.MONGODB)){
			cdrHandler = new NewAppCDRHandler();
			isConnected = cdrHandler.connectDatabase();
		} else {
			cdrHandler = new DefaultCDRHandler();
			isConnected = cdrHandler.connectDatabase();
			checkDatabase();
		}
		if(!isConnected) {
			System.exit(0);
			return;
		}
		
		// 4. init CDR HTTP server
//		httpServer = new CDRHttpServer();
		
		File file = new File("./fix/");
		if (file.exists() && file.isDirectory()) {
			File[] files = file.listFiles();
			if (files.length < 1) {
				System.out.println("File not found!");
				return;
			}
//			if (this.mode.equals(SINGLE)) {
				fixDataOnSignleMode(files, "fixData");
//			} 
//			else if (this.mode.equals(MULTI)) {
//				fixDataOnMultiMode(files);
//			}
		} else {
			System.out.println("File path not found!");
			return;
		}
		
	}
	
	private void fixDataOnSignleMode(File[] files, String name) {
		String line = null;
		BufferedReader reader = null;
		String pbx = name;
		CDREventProcessor processor = new CDREventProcessor(pbx, this.cdrHandler);
		try {
			for (File file : files) {
				reader = new BufferedReader(new InputStreamReader(
						new FileInputStream(file), "UTF-8"), 4096);
				int count = 0;
				while ((line = reader.readLine()) != null) {
					System.out.println("hang ===" + count);
					if (line.indexOf("Command") < 0) {
						continue;
					}
					if (line.indexOf("updateCdrToDatabase") != -1) {
						continue;
					}
					if (line.indexOf("event_buffer") != -1) {
						continue;
					}
					if (line.indexOf("processEvent") != -1) {
						continue;
					}
					
					fixData(processor, line);
					count++;
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	private void fixData(CDREventProcessor processor, String line)
			throws Exception {
		line = URLDecoder.decode(line, "UTF-8");
		System.out.println(line);
		JSONReader jsonReader = new JSONReader();
		HashMap<String, Object> map = (HashMap<String, Object>) jsonReader
				.read(line);
		C5Event event = new C5Event(map.get(Fields.Event).toString());
		event.getParameters().putAll(map);
		
		if(event.containKey("Account")){
//			if(
//					event.getStringValue("Account").equals("N00000000638") ||
//					event.getStringValue("Account").equals("N00000000657") ||
//					event.getStringValue("Account").equals("N00000000650") ||
//					event.getStringValue("Account").equals("N00000000599") ||
//					event.getStringValue("Account").equals("N00000000669")){
//				return;
			if (!event.getEventName().equalsIgnoreCase(Fields.ChannelCdr)) 
				processor.processEvent(event);
//			}			
		}
	}

	public static CdrFix getInstance() {
		return instance;
	}

	public void checkDatabase() {
		dbThread = new Thread("Database thread") {
			public void run() {
				while (true) {
					try {
						String date = Utils.getDate("HH:mm");
						if (date.equalsIgnoreCase("00:00")) {
							System.gc();
						}
						sleep(10000);
						if (!DBProvider.getInstance().isConnected()) {
							DBProvider.getInstance().reconnect();
						}
						if (!AppDBProvider.getInstance().isConnected()) {
							AppDBProvider.getInstance().reconnect();
						}
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
					}
				}
			}
		};
		dbThread.setDaemon(true);
		dbThread.start();
	}
	
	public CDRHandler getCDRHandler(){
		return cdrHandler;
	}

	public void destruct() {
		log.warning("Stoping CDR Server");
		DBProvider.getInstance().disconnect();
		AppDBProvider.getInstance().disconnect();
		if (httpServer != null) {
			httpServer.stop();
			httpServer = null;
		}
		instance = null;
		log.warning("CDR Server stoped");
	}

	public static void main(String[] args) {
		new CdrFix();
	}
}
