package com.dishui.db.mango;

import com.dishui.manager.service.AppConfig;
import com.mongodb.*;
import com.mongodb.client.MongoDatabase;

public class MongoConnect {
	
	public static MongoConnect instance;
	
	private MongoClient mongo;
    private MongoClient reportMongo;
	
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
            String username = AppConfig.getInstance().getVar("db.account");
            String password = AppConfig.getInstance().getVar("db.password");
            String dbname = AppConfig.getInstance().getVar("db.name");
            String dbPoolSize = AppConfig.getInstance().getVar("db.poolSize");
            String minDbPoolSize = AppConfig.getInstance().getVar("db.minPoolSize");

			String reportIp = AppConfig.getInstance().getVar("reportDb.ip");
			String reportPort = AppConfig.getInstance().getVar("reportDb.port");
			String reportUsername = AppConfig.getInstance().getVar("reportDb.account");
			String reportPassword = AppConfig.getInstance().getVar("reportDb.password");
			String reportDbName = AppConfig.getInstance().getVar("reportDb.name");
			String reportPoolSize = AppConfig.getInstance().getVar("reportDb.poolSize");
			String reportMinPoolSize = AppConfig.getInstance().getVar("reportDb.minPoolSize");

			if(ip == null || pt == null){
				System.out.println("Database not configured!!!!!");
				return;
			}
			int port = Integer.valueOf(pt);
			System.out.println("Connecting to db: "+ip+":"+port);



			MongoClientOptions.Builder build2 = new MongoClientOptions.Builder();
			//与数据最大连接数1000
			build2.connectionsPerHost(Integer.parseInt(dbPoolSize));
			build2.minConnectionsPerHost(Integer.parseInt(minDbPoolSize));
			//如果当前所有的connection都在使用中，则每个connection上可以有50个线程排队等待
//            build2.threadsAllowedToBlockForConnectionMultiplier(50);
			build2.connectTimeout(1*60*1000);
			build2.maxWaitTime(2 * 60 * 1000);
			reportMongo = new MongoClient(new MongoClientURI("mongodb://"+reportUsername+":"+reportPassword+"@"+reportIp+":"+ reportPort, build2));
			MongoDatabase db2 = reportMongo.getDatabase(reportDbName);
			if(db2 != null) {
				System.out.println("DB report connected");
			} else {
				System.out.println("DB report connection failed!");
			}

			MongoClientOptions.Builder build1 = new MongoClientOptions.Builder();
			build1.connectionsPerHost(Integer.parseInt(reportPoolSize));
			build1.minConnectionsPerHost(Integer.parseInt(reportMinPoolSize));
			build1.connectTimeout(1*60*1000);
			build1.maxWaitTime(2*60*1000);
			mongo = new MongoClient(new MongoClientURI("mongodb://"+username+":"+password+"@"+ip+":"+port,build1));

			MongoDatabase db = mongo.getDatabase(dbname);
			if(db != null) {
				System.out.println(dbname + " DB connected");
			} else {
				System.out.println(dbname + " DB connection failed!");
			}


		}  catch (MongoException e) {
			e.printStackTrace();
		} catch(Exception e) {
			e.printStackTrace();
		}
	}
	
	public MongoDatabase getDB() {
		if(mongo == null)
			return null;
		return mongo.getDatabase(AppConfig.getInstance().getVar("db.name"));
	}
	
	public MongoDatabase getDB(String dbName) {
		if(mongo == null)
			return null;
		return mongo.getDatabase(dbName);
	}

    public MongoDatabase getReportDB() {
        if(reportMongo == null)
            return null;
        return reportMongo.getDatabase(AppConfig.getInstance().getVar("reportDb.name"));
    }

    public MongoDatabase getReportDB(String dbName){
        if(reportMongo == null)
            return null;
        return reportMongo.getDatabase(dbName);
    }

	
	public void close() {
		if(mongo == null)
			return;
		mongo.close();
	}
	
	public static void main(String[] a) {
//		try {
//			System.setProperty("MONGO.POOLSIZE", String.valueOf(200));
//			Mongo connection = new Mongo("10.1.101.21", 30000);
//			MongoOptions options = connection.getMongoOptions();
//			options.autoConnectRetry = true;
//			options.connectionsPerHost = 200;
//
//			DB db = connection.getDB("uc");
//			System.out.println(db.authenticate("uc", "dhgr428".toCharArray()));
//			DBCollection user = db.getCollection("test");
//			DBCursor cursor= user.find();
//			while(cursor.hasNext()){
//				DBObject u1 = cursor.next();
//				System.out.println(u1.toMap().toString());
//			}
//		} catch (UnknownHostException e) {
//			e.printStackTrace();
//		} catch (MongoException e) {
//			e.printStackTrace();
//		}
	}
}
