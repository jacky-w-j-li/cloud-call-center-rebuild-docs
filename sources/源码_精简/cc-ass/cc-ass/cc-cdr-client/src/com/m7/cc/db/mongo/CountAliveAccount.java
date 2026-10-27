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

public class CountAliveAccount {

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
			options.autoConnectRetry = true;
			options.connectionsPerHost = 200;
			DB db = mongo.getDB("admin");
			db.authenticate(user, password.toCharArray());
			System.out.println("Connected to db: " + ip + ":" + port);
			//begin to count
			ArrayList<String> dayList = new ArrayList<String>();
			ArrayList<String> weekList = new ArrayList<String>();
			ArrayList<String> monthList = new ArrayList<String>();
			
			DBObject findDay = new BasicDBObject();
			findDay.put("OFFERING_TIME",new BasicDBObject("$gte","2015-08-24 18:15:00"));
			
			DBObject findWeek = new BasicDBObject();
			findWeek.put("OFFERING_TIME",new BasicDBObject("$gte","2015-08-19 00:00:00"));
			
			DBObject findMonth = new BasicDBObject();
			findMonth.put("OFFERING_TIME",new BasicDBObject("$gte","2015-07-25 00:00:00"));
			
			DB db_bill = mongo.getDB("bill");
			DBCollection collection = db_bill.getCollection("db_master");
			DBObject db_master_vo = collection.findOne();
			
			System.out.println(db_master_vo);
			BasicDBList dbList = (BasicDBList) db_master_vo.get("db_names");
			for(int i=0 ;i<dbList.size();i++){
				String curDbName = dbList.get(i).toString();
				System.out.println(curDbName);
				DB curDb = mongo.getDB(curDbName);
//				System.out.println(curDb.getCollectionNames());
				Set<String> set = curDb.getCollectionNames();
				
				Iterator<String> it = set.iterator();//先迭代出来  
		        while(it.hasNext()){//遍历  
		        	String curCollectionName = it.next(); 
		        	if(curCollectionName.toString().endsWith("_c5_call_sheet")){
		        		DBCursor dresult = curDb.getCollection(curCollectionName).find(findDay).limit(1);
		        		if(dresult.hasNext()){
		        			dayList.add(curCollectionName);
		        		}
		        		DBCursor wresult = curDb.getCollection(curCollectionName).find(findWeek).limit(1);
		        		if(wresult.hasNext()){
		        			weekList.add(curCollectionName);
		        		}
		        		DBCursor mresult = curDb.getCollection(curCollectionName).find(findMonth).limit(1);
		        		if(mresult.hasNext()){
		        			monthList.add(curCollectionName);
		        		}
		        		Thread.sleep(30);
		        	}
		        }  
			}
			System.out.println("日活跃账号："+dayList);
			System.out.println("周活跃账号："+weekList);
			System.out.println("月活跃账号："+monthList);
			
			System.out.println("日活跃账号数："+dayList.size());
			System.out.println("周活跃账号数："+weekList.size());
			System.out.println("月活跃账号数："+monthList.size());
		} catch (Exception e) {
			System.out.println("Connect to mongodb failed");
			e.printStackTrace();
		}
	}

}
