package com.dishui.db.mango;

import java.net.UnknownHostException;

import com.dishui.bill.service.AppConfig;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoException;
import com.mongodb.MongoOptions;

public class MongoConnect {
	
	public static MongoConnect instance;
	
	private Mongo mongo;
	private Mongo reportMongo;
	
	private MongoConnect() {
		instance = this;
	}
	
	public static MongoConnect getInstance() {
		if(instance == null)
			new MongoConnect();
		return instance;
	}
	
	public void connect() {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(AppConfig.getInstance().getVar("db.poolsize")));
		try {
			String ip = AppConfig.getInstance().getVar("db.ip");
			String pt = AppConfig.getInstance().getVar("db.port");
			if(ip == null || pt == null){
				System.out.println("Database not configured!!!!!");
				return;
			}
			int port = Integer.valueOf(pt);
			System.out.println("Connecting to db: "+ip+":"+port);
			mongo = new Mongo(ip, port);
			MongoOptions options = mongo.getMongoOptions();
			options.autoConnectRetry = true;
			options.connectionsPerHost = 1000;
			boolean result = mongo.getDB("admin").authenticate(AppConfig.getInstance().getVar("db.account"), 
					AppConfig.getInstance().getVar("db.password").toCharArray());
			if(result) {
				System.out.println("DB connected");
			} else {
				System.out.println("DB connection failed!");
			}
		} catch (UnknownHostException e) {
			e.printStackTrace();
		} catch (MongoException e) {
			e.printStackTrace();
		} catch(Exception e) {
			e.printStackTrace();
		}
	}
	
	public DB getDB() {
		if(mongo == null)
			return null;
		return mongo.getDB(AppConfig.getInstance().getVar("db.name"));
	}
	
	public DB getDB(String dbName) {
		if(mongo == null)
			return null;
		return mongo.getDB(dbName);
	}
	
	public void close() {
		if(mongo == null)
			return;
		mongo.close();
	}

	public void connectReport() {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(AppConfig.getInstance().getVar("reportDb.poolsize")));
		try {
			String ip = AppConfig.getInstance().getVar("reportDb.ip");
			String pt = AppConfig.getInstance().getVar("reportDb.port");
			if(ip == null || pt == null){
				System.out.println("Database not configured!!!!!");
				return;
			}
			int port = Integer.valueOf(pt);
			System.out.println("Connecting to db: "+ip+":"+port);
			reportMongo = new Mongo(ip, port);
			MongoOptions options = reportMongo.getMongoOptions();
			options.autoConnectRetry = true;
			options.connectionsPerHost = 1000;
			boolean result = reportMongo.getDB("admin").authenticate(AppConfig.getInstance().getVar("reportDb.account"),
					AppConfig.getInstance().getVar("reportDb.password").toCharArray());
			if(result) {
				System.out.println("DB connected");
			} else {
				System.out.println("DB connection failed!");
			}
		} catch (UnknownHostException e) {
			e.printStackTrace();
		} catch (MongoException e) {
			e.printStackTrace();
		} catch(Exception e) {
			e.printStackTrace();
		}
	}

	public DB getReportDB() {
		if(reportMongo == null)
			return null;
		return reportMongo.getDB(AppConfig.getInstance().getVar("reportDb.name"));
	}

	public DB getReportDB(String dbName) {
		if(reportMongo == null)
			return null;
		return reportMongo.getDB(dbName);
	}

	public void closeReport() {
		if(reportMongo == null)
			return;
		reportMongo.close();
	}




	public static void main(String[] a) {
		try {
			System.setProperty("MONGO.POOLSIZE", String.valueOf(200));
			Mongo connection = new Mongo("10.1.101.21", 30000);
			MongoOptions options = connection.getMongoOptions();  
			options.autoConnectRetry = true;  
			options.connectionsPerHost = 200;  

			DB db = connection.getDB("uc");
			System.out.println(db.authenticate("uc", "dhgr428".toCharArray()));
			DBCollection user = db.getCollection("test");
			DBCursor cursor= user.find();
			while(cursor.hasNext()){
				DBObject u1 = cursor.next();
				System.out.println(u1.toMap().toString());
			}
		} catch (UnknownHostException e) {
			e.printStackTrace();
		} catch (MongoException e) {
			e.printStackTrace();
		}
	}
}
