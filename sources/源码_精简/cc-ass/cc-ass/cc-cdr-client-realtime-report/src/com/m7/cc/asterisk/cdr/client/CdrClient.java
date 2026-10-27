package com.m7.cc.asterisk.cdr.client;

import java.sql.SQLException;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.db.oracle.DBProvider;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class CdrClient {
	private static CdrClient instance;
	
	private CdrClientConfig config;
	private DBProvider dbProvider;
	
	private Logger log;
	
	private Thread dbThread;
	
	public CdrClient(){
		instance = this;
		//1. Load configuration
		config = CdrClientConfig.getInstance();
		config.loadConfig();
		
		//2. init log
		try {
			IceLogger.initLogger(config.getLogDir(), "cdr_client", config.getLogLevel(), config.isLogConsole());
		} catch (Exception e) {
			e.printStackTrace();
			return;
		}
		log = Logger.getLogger(CdrClient.class.getName());
		
		//3. init database
		dbProvider = new DBProvider();
		try {
			dbProvider.connect();
		} catch (SQLException e) {
			log.log(Level.WARNING, "Connect to db failed", e);
			System.out.println("Connect to db failed");
			return;
		}
		
		//4. init socket client and try to login
		Vector<AssCdrConnect> list = config.getAssCdrConnects();
		for(int i=0;i<list.size();i++){
			AssCdrConnect connect = list.get(i);
			new CdrConnection(dbProvider, connect);
		}
		
		//6. Make sure database is connected
		checkDatabase();
	}
	
	
	
	public static CdrClient getInstance(){
		return instance;
	}
	
	public CdrClientConfig getConfig() {
		return config;
	}
	
	public void checkDatabase(){
		dbThread = new Thread("Database thread"){
			public void run(){
				while(true){
					try {
						String date = Utils.getDate("HH:mm");
						if(date.equalsIgnoreCase("00:00")){
							System.gc();
						} 
						sleep(10000);
						if(!dbProvider.isConnected()){
							dbProvider.reconnect();
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
	
	public void destruct(){
		log.warning("Stoping CDR Client");
		dbProvider.disconnect();
	}

	public static void main(String[] args){
		new CdrClient();
	}
}
