package com.m7.cc.db.mongo;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.mongodb.DB;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientOptions;
import com.mongodb.MongoClientURI;
import com.mongodb.client.MongoDatabase;

public class MongoConnect {
	private static Logger log = Logger.getLogger(MongoConnect.class.getName());
	private String ip;
	private String port;
	private String user;
	private String password;
	private String database;
	
	private String reportIp;
	private String reportPort;
	private String reportUser;
	private String reportPassword;
	private String reportDatabase;

	public static MongoConnect instance;

	private MongoClient appMongo;
	private MongoClient reportMongo;

	private MongoConnect() {
		instance = this;
	}

	public static MongoConnect getInstance() {
		if (instance == null)
			new MongoConnect();
		return instance;
	}

	public boolean connect() {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(200));
		try {
			ip = CdrServerConfig.getInstance().getMongoDBIP();
			port = CdrServerConfig.getInstance().getMongoDBPort();
			user = CdrServerConfig.getInstance().getDbUser();
			password = CdrServerConfig.getInstance().getDbPassword();
			database = CdrServerConfig.getInstance().getDatabase();
			
			reportIp = CdrServerConfig.getInstance().getReportMongoDBIP();
			reportPort = CdrServerConfig.getInstance().getReportMongoDBPort();
			reportUser = CdrServerConfig.getInstance().getReportDBUser();
			reportPassword = CdrServerConfig.getInstance().getReportDBPassword();
			reportDatabase = CdrServerConfig.getInstance().getReportDatabase();
			
			if (ip == null || port == null) {
				System.out.println("app Database not configured!!!!!");
				return false;
			}
			
			if (reportIp == null || reportPort == null) {
				System.out.println("report Database not configured!!!!!");
				return false;
			}
			
			System.out.println("Connecting to app ["+database+"] db: "+ip+":"+port);
            MongoClientOptions.Builder build1 = new MongoClientOptions.Builder();
            build1.connectionsPerHost(200);
            build1.connectTimeout(1*60*1000);
            build1.maxWaitTime(2*60*1000);
            appMongo = new MongoClient(new MongoClientURI("mongodb://"+user+":"+password+"@"+ip+":"+port,build1));
            MongoDatabase db = appMongo.getDatabase(database);
            if(db != null) {
                System.out.println(database + " app DB connected");
            } else {
                System.out.println(database + " app DB connection failed!");
            }
            System.out.println("Connecting to report ["+reportDatabase+"] db: "+reportIp+":"+reportPort);
            MongoClientOptions.Builder build2 = new MongoClientOptions.Builder();
            build2.connectionsPerHost(200);
            build2.connectTimeout(1*60*1000);
            build2.maxWaitTime(2*60*1000);
            reportMongo = new MongoClient(new MongoClientURI("mongodb://"+reportUser+":"+reportPassword+"@"+reportIp+":"+reportPort, build2));
            MongoDatabase db2 = reportMongo.getDatabase(reportDatabase);
            if(db2 != null) {
                System.out.println(reportDatabase + " report DB connected");
            } else {
                System.out.println(reportDatabase + " report DB connection failed!");
            }
		} catch (Exception e) {
			log.log(Level.WARNING, "Connect to mongodb failed", e);
			System.out.println("Connect to mongodb failed");
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public MongoDatabase getDB() {
		if (appMongo == null)
			return null;
		return appMongo.getDatabase(database);
	}

	public MongoDatabase getDB(String dbName) {
		if (appMongo == null)
			return null;
		return appMongo.getDatabase(dbName);
	}
	
	public MongoDatabase getReportDB() {
		if (reportMongo == null)
			return null;
		return reportMongo.getDatabase(reportDatabase);
	}

	public MongoDatabase getReportDB(String dbName) {
		if (reportMongo == null)
			return null;
		return reportMongo.getDatabase(dbName);
	}
	
	public void close() {
		if (appMongo != null)
			appMongo.close();
		if (reportMongo != null)
			reportMongo.close();
	}
}
