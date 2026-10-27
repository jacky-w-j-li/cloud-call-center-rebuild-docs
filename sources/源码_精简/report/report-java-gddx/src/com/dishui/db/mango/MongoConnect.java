package com.dishui.db.mango;

import java.net.UnknownHostException;

import com.dishui.manager.service.AppConfig;
import com.mongodb.*;
import com.mongodb.client.MongoDatabase;

public class MongoConnect {
	
	public static MongoConnect instance;
	
	private MongoClient mongo;
	private MongoClient appMongo;

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

            String appIp = AppConfig.getInstance().getVar("appDb.ip");
            String appPort = AppConfig.getInstance().getVar("appDb.port");
            String appUsername = AppConfig.getInstance().getVar("appDb.account");
            String appPassword = AppConfig.getInstance().getVar("appDb.password");
            String appDbName = AppConfig.getInstance().getVar("appDb.name");

			if(ip == null || pt == null){
				System.out.println("Database not configured!!!!!");
				return;
			}
			int port = Integer.valueOf(pt);
			System.out.println("Connecting to db: "+ip+":"+port);
//			mongo = new Mongo(ip, port);
//			MongoOptions options = mongo.getMongoOptions();
//			options.autoConnectRetry = true;
//			options.connectionsPerHost = 1000;
//			boolean result = mongo.getDB("admin").authenticate(AppConfig.getInstance().getVar("db.account"),
//					AppConfig.getInstance().getVar("db.password").toCharArray());
            MongoClientOptions.Builder build1 = new MongoClientOptions.Builder();
            //与数据最大连接数1000
            build1.connectionsPerHost(100);

            //如果当前所有的connection都在使用中，则每个connection上可以有50个线程排队等待
//            build1.threadsAllowedToBlockForConnectionMultiplier(50);
            build1.connectTimeout(1*60*1000);
            build1.maxWaitTime(2*60*1000);
            mongo = new MongoClient(new MongoClientURI("mongodb://"+username+":"+password+"@"+ip+":"+port, build1));

            //获取数据库test,不存在的话，会自动建立该数据库
            MongoDatabase db = mongo.getDatabase(dbname);
            if(db != null) {
				System.out.println("DB connected");
			} else {
				System.out.println("DB connection failed!");
			}

            MongoClientOptions.Builder build2 = new MongoClientOptions.Builder();
            //与数据最大连接数1000
            build2.connectionsPerHost(100);
            //如果当前所有的connection都在使用中，则每个connection上可以有50个线程排队等待
//            build2.threadsAllowedToBlockForConnectionMultiplier(50);
            build2.connectTimeout(1*60*1000);
            build2.maxWaitTime(2 * 60 * 1000);
            appMongo = new MongoClient(new MongoClientURI("mongodb://"+appUsername+":"+appPassword+"@"+appIp+":"+ appPort, build2));
            MongoDatabase db2 = appMongo.getDatabase(appDbName);
            if(db2 != null) {
                System.out.println("DB app connected");
            } else {
                System.out.println("DB app connection failed!");
            }

		} catch (MongoException e) {
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

    public MongoDatabase getAppDB() {
        if(appMongo == null)
            return null;
        return appMongo.getDatabase(AppConfig.getInstance().getVar("appDb.name"));
    }

    public MongoDatabase getAppDB(String dbName) {
        if(appMongo == null)
            return null;
        return appMongo.getDatabase(dbName);
    }

    public DB getOldDb(){
        if(mongo == null)
            return null;
        return mongo.getDB(AppConfig.getInstance().getVar("db.name"));
    }

    public DB getOldDb(String dbName){
        if(mongo == null)
            return null;
        return mongo.getDB(dbName);
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
