package com.m7.cc.asterisk.cdr.server;

import java.net.UnknownHostException;

import com.mongodb.DB;
import com.mongodb.Mongo;
import com.mongodb.MongoException;
import com.mongodb.MongoOptions;

public class MongoConnect {

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

	public void connect() {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(100));
		try {
			String ip = CdrServerConfig.getInstance().getVar("db.ip");
			String pt = CdrServerConfig.getInstance().getVar("db.port");
			if (ip == null || pt == null) {
				System.out.println("Database not configured!!!!!");
				return;
			}
			int port = Integer.valueOf(pt);
			System.out.println("Connecting to db: " + ip + ":" + port);
			mongo = new Mongo(ip, port);
			MongoOptions options = mongo.getMongoOptions();
			options.autoConnectRetry = true;
			options.connectionsPerHost = 100;
			boolean result = mongo.getDB(
					CdrServerConfig.getInstance().getVar("db.name"))
					.authenticate(
							CdrServerConfig.getInstance().getVar("db.account"),
							CdrServerConfig.getInstance().getVar("db.password")
									.toCharArray());
			if (result) {
				System.out.println("DB connected");
			} else {
				System.out.println("DB connection failed!");
			}
		} catch (UnknownHostException e) {
			e.printStackTrace();
		} catch (MongoException e) {
			e.printStackTrace();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public DB getDB() {
		if (mongo == null)
			return null;
		return mongo.getDB(CdrServerConfig.getInstance().getVar("db.name"));
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
