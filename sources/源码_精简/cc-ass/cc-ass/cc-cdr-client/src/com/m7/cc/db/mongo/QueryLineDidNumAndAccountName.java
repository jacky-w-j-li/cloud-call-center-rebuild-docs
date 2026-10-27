package com.m7.cc.db.mongo;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.Set;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoOptions;

public class QueryLineDidNumAndAccountName {

	public static void main(String[] args) {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(10));
		try {
//			String ip = "115.29.10.194";  //测试
			String ip = "10.160.11.198"; //正式
			String port = "7211";
//			String user = "dishui";
			String user = "7moor";
			String password = "7moorcom";
			if (ip == null || port == null) {
				System.out.println("Database not configured!!!!!");
				return;
			}
			System.out.println("Connecting to db: " + ip + ":" + port);
			Mongo mongo = new Mongo(ip, Integer.valueOf(port));
			MongoOptions options = mongo.getMongoOptions();
//			options.autoConnectRetry = true;
//			options.connectionsPerHost = 200;
//			DB db = mongo.getDB("admin");
//			db.authenticate(user, password.toCharArray());
			System.out.println("Connected to db: " + ip + ":" + port);
			DB ccDb = mongo.getDB("cc");
			DB billDb = mongo.getDB("bill");
			DBObject findCc = new BasicDBObject();
			ArrayList<String> list = new ArrayList<String>();
			list.add("cc.zr.1.0");
			list.add("cc.zr.1.1");
			list.add("cc.zr.1.2");
			list.add("cc.zr.1.3");
			list.add("cc.zr.1.4");
			list.add("cc.zr.1.5");
			list.add("cc.zr.1.6");
			list.add("cc.zr.1.7");
			list.add("cc.zr.1.8");
			list.add("cc.zr.1.9");
			ArrayList<String> list1 = new ArrayList<String>();
			list1.add("701");
			list1.add("702");
			list1.add("818");
			list1.add("828");
			list1.add("838");
			list1.add("839");
			list1.add("848");
			list1.add("840");
			list1.add("841");
			findCc.put("PBX", new BasicDBObject("$nin",list));
			findCc.put("Exten", new BasicDBObject("$in", list1));
			
			DBCursor result = ccDb.getCollection("manager_account_line")
					.find(findCc, new BasicDBObject("Account",1).append("DidNum", 1)).sort(new BasicDBObject("Account",1));
			while (result.hasNext()) {
				DBObject ob = result.next();
				String curAcc = ob.get("Account").toString();
				String curDidNum = ob.get("DidNum").toString();
				DBObject curAccOb = billDb.getCollection("platform_account").findOne(new BasicDBObject("_id", curAcc));
				System.out.println(curAccOb.get("companyName")+","+curAcc+","+curDidNum);
			}
			
			mongo.close();
		} catch (Exception e) {
			System.out.println("Connect to mongodb failed");
			e.printStackTrace();
		}
	}

}
