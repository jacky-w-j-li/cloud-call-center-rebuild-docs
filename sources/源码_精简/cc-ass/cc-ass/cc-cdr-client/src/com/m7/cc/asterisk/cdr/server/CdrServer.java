package com.m7.cc.asterisk.cdr.server;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.handler.CDRHandler;
import com.m7.cc.asterisk.cdr.server.handler.DefaultCDRHandler;
import com.m7.cc.asterisk.cdr.server.handler.NewAppCDRHandler;
import com.m7.cc.auto.call.clear.ClearAutoCallCdrServer;
import com.m7.cc.db.oracle.AppDBProvider;
import com.m7.cc.db.oracle.DBProvider;
import com.m7.cc.event.dispatcher.resend.EventDispatcherServer;
import com.m7.cc.report.ReportServer;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class CdrServer {
	private static CdrServer instance;
	private CdrServerConfig config;
	private Logger log;
	private Thread dbThread;
	private CDRHttpServer httpServer;
	private CDRHandler cdrHandler = null;
	private ReportServer reportServer = null;
	private EventDispatcherServer eventResendServer = null;
	private ClearAutoCallCdrServer clearAutoCallCdrServer = null;

	public CdrServer() {
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
		log = Logger.getLogger(CdrServer.class.getName());

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
		httpServer = new CDRHttpServer();
		
		// 5. start report server
		if(CdrServerConfig.getInstance().isCollectReport()){
			reportServer = ReportServer.getInstance();
			reportServer.startServer();
		}
		
		//6. start eventDispatcherResend server
		if(CdrServerConfig.getInstance().isdispatcherEventResend()){
			eventResendServer = EventDispatcherServer.getInstance();
			eventResendServer.startServer();			
		}
		
		//7.clear one month ago autocall cdr
		if(CdrServerConfig.getInstance().isClearCdr()){
			clearAutoCallCdrServer = ClearAutoCallCdrServer.getInstance();
			clearAutoCallCdrServer.startServer();			
		}
		
//		DBObject key = new BasicDBObject();
//		key.put("END_TIME", -1);
////		MongoConnect.getInstance().getDB("app_20130920").getCollection("N000000000"+10+"_c5_call_sheet").createIndex(key);
//		for(int i=11;i<78;i++){
//			MongoConnect.getInstance().getDB("app_20130920").getCollection("N000000000"+i+"_c5_call_sheet").createIndex(key);
//		}
	}

	public static CdrServer getInstance() {
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
		new CdrServer();
	}
}
