package com.m7.cc.db.mongo;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.mongodb.DB;
import com.mongodb.Mongo;
import com.mongodb.MongoOptions;

public class MongoConnect {
	private static Logger log = Logger.getLogger(MongoConnect.class.getName());
	private String ip;
	private String port;
	private String user;
	private String password;
	private String database;

	public static MongoConnect instance;

	private Mongo mongo;

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
			if (ip == null || port == null) {
				System.out.println("Database not configured!!!!!");
				return false;
			}
			System.out.println("Connecting to db: " + ip + ":" + port);
			mongo = new Mongo(ip, Integer.valueOf(port));
			MongoOptions options = mongo.getMongoOptions();
			options.autoConnectRetry = true;
			options.connectionsPerHost = 200;
			DB db = mongo.getDB("admin");
			db.authenticate(user, password.toCharArray());
			System.out.println("Connected to db: " + ip + ":" + port);
		} catch (Exception e) {
			log.log(Level.WARNING, "Connect to mongodb failed", e);
			System.out.println("Connect to mongodb failed");
			e.printStackTrace();
			return false;
		}
		return true;
	}

	public DB getDB() {
		if (mongo == null)
			return null;
		return mongo.getDB(database);
	}

	public DB getDB(String dbName) {
		if (mongo == null)
			return null;
		return mongo.getDB(dbName);
	}

	public void close() {
		if (mongo == null)
			return;
		mongo.close();
	}
}
