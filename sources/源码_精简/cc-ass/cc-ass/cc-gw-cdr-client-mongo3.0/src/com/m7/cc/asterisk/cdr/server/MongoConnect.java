package com.m7.cc.asterisk.cdr.server;

import java.net.UnknownHostException;

import com.mongodb.DB;
import com.mongodb.Mongo;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientOptions;
import com.mongodb.MongoClientURI;
import com.mongodb.MongoException;
import com.mongodb.client.MongoDatabase;

public class MongoConnect {

	public static MongoConnect instance;

	private MongoClient mongo;

	private MongoConnect() {
		instance = this;
	}

	public static MongoConnect getInstance() {
		if (instance == null)
			new MongoConnect();
		return instance;
	}

	public void connect() {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(100));
		try {
			String ip = CdrServerConfig.getInstance().getVar("db.ip");
			String pt = CdrServerConfig.getInstance().getVar("db.port");
			String user = CdrServerConfig.getInstance().getVar("db.account");
			String password = CdrServerConfig.getInstance().getVar("db.password");
			String database = CdrServerConfig.getInstance().getVar("db.name");
			if (ip == null || pt == null) {
				System.out.println("Database not configured!!!!!");
				return;
			}
			int port = Integer.valueOf(pt);
			
			System.out.println("Connecting to db: " + ip + ":" + port);
			MongoClientOptions.Builder build1 = new MongoClientOptions.Builder();
            build1.connectionsPerHost(100);
            build1.connectTimeout(1*60*1000);
            build1.maxWaitTime(2*60*1000);
            mongo = new MongoClient(new MongoClientURI("mongodb://"+user+":"+password+"@"+ip+":"+port,build1));
            MongoDatabase db = mongo.getDatabase(database);
            if(db != null) {
                System.out.println(database + "app DB connected");
            } else {
                System.out.println(database + "app DB connection failed!");
            }
//			System.out.println("Connecting to db: " + ip + ":" + port);
//			mongo = new Mongo(ip, port);
//			MongoOptions options = mongo.getMongoOptions();
//			options.autoConnectRetry = true;
//			options.connectionsPerHost = 100;
//			boolean result = mongo.getDB(
//					CdrServerConfig.getInstance().getVar("db.name"))
//					.authenticate(
//							CdrServerConfig.getInstance().getVar("db.account"),
//							CdrServerConfig.getInstance().getVar("db.password")
//									.toCharArray());
//			if (result) {
//				System.out.println("DB connected");
//			} else {
//				System.out.println("DB connection failed!");
//			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public MongoDatabase getDB() {
		if (mongo == null)
			return null;
		return mongo.getDatabase(CdrServerConfig.getInstance().getVar("db.name"));
	}

	public MongoDatabase getDB(String dbName) {
		if (mongo == null)
			return null;
		return mongo.getDatabase(dbName);
	}

	public void close() {
		if (mongo == null)
			return;
		mongo.close();
	}

}
