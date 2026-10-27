package com.m7.cc.asterisk.cdr.server;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.client.GWCdrClient;
import com.m7.cc.util.log.IceLogger;

public class GWCdrServer {
	private static GWCdrServer instance;
	private Logger log;
	private Thread dbThread;
	private GWCDRHttpServer httpServer;

	public GWCdrServer() {
		instance = this;
		// 1.Load configuration
		CdrServerConfig.getInstance().loadConfig();

		// 2. init log
		try {
			IceLogger.initLogger(CdrServerConfig.getInstance().getLogDir(),
					"cdr_server", CdrServerConfig.getInstance().getLogLevel(),
					CdrServerConfig.getInstance().isLogConsole());
		} catch (Exception e) {
			e.printStackTrace();
			return;
		}
		log = Logger.getLogger(GWCdrClient.class.getName());

		// 3. init database
		try {
			MongoConnect.getInstance().connect();
		} catch (Exception e) {
			log.log(Level.WARNING, "Connect to db failed", e);
			System.out.println("Connect to db failed");
			return;
		}

		// 4. init CDR HTTP server
		httpServer = new GWCDRHttpServer();

		// 5. Make sure database is connected
		// checkDatabase();
	}


	public static GWCdrServer getInstance() {
		return instance;
	}

	public void destruct() {
		log.warning("Stoping GW CDR Client");
		try {
			dbThread.interrupt();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		httpServer.stop();
		instance = null;
	}

	public static void main(String[] args) {
		new GWCdrServer();
	}
}
