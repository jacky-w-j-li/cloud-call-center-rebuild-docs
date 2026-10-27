package com.m7.cc.db.mongo;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Hashtable;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoOptions;

public class clearOldAutoCallTest {
	private static Hashtable<String, Hashtable<String, CallNumberInfo>> phoneNumbers = new Hashtable<String, Hashtable<String, CallNumberInfo>>();
	
	public static void main(String[] args) {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(10));
		try {
//			String ip = "115.29.10.194";  //测试
			String ip = "112.124.65.214"; //正式
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
						
			System.out.println("Begin load phone file.");
			loadPhoneNumber();
			System.out.println("success load phone file.");
			
			DB db1 = mongo.getDB("cc_autocall");
			DBCollection collection = db1.getCollection("app_autocall_new");
			//shouji haoma ziyuan
			DB libDb = mongo.getDB("num_library");
			DBCollection libCollection = libDb.getCollection("num_library");
			DBCollection libNoCityCollection = libDb.getCollection("num_library_no_city");
			
			DBObject condition = new BasicDBObject();
			ArrayList<DBObject> orList = new ArrayList<DBObject>();
//			orList.add(new BasicDBObject().append("reason", "3"));
//			orList.add(new BasicDBObject().append("reason", "4"));
//			condition.put("called", true);
//			condition.put("$or", orList);
			condition.put("account", new BasicDBObject("$ne",null));
//			condition.put("beginTime", new BasicDBObject().append("$gte","2014-09-15 00:00:00"));
			condition.put("beginTime", new BasicDBObject().append("$lte","2014-11-04 00:00:00").append("$gte","2014-10-25 00:00:00"));
			
			long count = collection.count(condition);
			System.out.println("all count === " + count);
			int pageSize = 3000;
			long allPage = count/pageSize + 1;
			
			for(int i=1 ; i <= allPage ;i++){	
				DBCursor result = collection.find(condition).skip((i-1)*pageSize).limit(pageSize);
				System.out.println("------------page----:" + i);
				int j = 0;
				while (result.hasNext()) {
					DBObject ob = result.next();
					String num = ob.get("num").toString();
					String reason = ob.get("reason").toString();
					if(ob.get("called") != null && ob.get("called").equals("false")){
						continue;
					}
					if(num.startsWith("0")){
						num = num.substring(0, num.length());
					}else{
						try {
							Hashtable<String, CallNumberInfo> numbers = phoneNumbers
									.get(num.substring(0, 3));
							if (numbers != null && num.length() >= 7){
								if(numbers.get(num.substring(0, 7)) == null){
									System.out.println("------num not province and city:" + num);
									DBObject newNoCity = new BasicDBObject();
									newNoCity.put("_id", num);
									if(reason.equals("4") || reason.equals("3")){
										newNoCity.put("canCall", "true");
									}else{
										newNoCity.put("canCall", "false");
									}
									newNoCity.put("lastCallTime", ob.get("beginTime").toString());
									libNoCityCollection.insert(newNoCity);
								}else{
									CallNumberInfo numberInfo = numbers.get(num.substring(0, 7));
									System.out.println((++j+":") + ob.get("num")+":"+ob.get("beginTime")+"---province:"+ numberInfo.getProvince()+"---city:"+numberInfo.getCity());
									DBObject newDoc = new BasicDBObject();
//									newDoc.put("_id", num);
									newDoc.put("province", numberInfo.getProvince());
									newDoc.put("district", numberInfo.getCity());
									newDoc.put("districtCode", numberInfo.getDistrictNo());
									newDoc.put("lastCallTime", ob.get("beginTime").toString());
									if(reason.equals("4")){
										newDoc.put("canCall", "true");
										newDoc.put("status", "dealing");
									}else if(reason.equals("3") || reason.equals("8")){
										newDoc.put("canCall", "true");
										newDoc.put("status", "notDeal");
									}else{
										newDoc.put("canCall", "false");
									}
									libCollection.update(new BasicDBObject("_id",num),newDoc,true,false);
								}
							}else{
								System.out.println("------num not province and city:" + num);
							}
						} catch (Exception e) {
							e.printStackTrace();
						}
					}
				}
				System.out.println("------------page--" + i + "--count:" + j);
			}
			
		} catch (Exception e) {
			System.out.println("Connect to mongodb failed");
			e.printStackTrace();
		}
	}
	
	private static void loadPhoneNumber(){
		phoneNumbers.clear();
		File file = new File("phone");
		if (file.exists()) {
			try {
				BufferedReader br = new BufferedReader(new InputStreamReader(
						new FileInputStream(file), "UTF-8"));
				String line = null;
				Hashtable<String, CallNumberInfo> numbers;
				String prefix;
				CallNumberInfo numberInfo;
				while ((line = br.readLine()) != null && line.length() > 3) {
					prefix = line.substring(0, 3);
					if (!phoneNumbers.containsKey(prefix)) {
						numbers = new Hashtable<String, CallNumberInfo>();
						phoneNumbers.put(prefix, numbers);
					} else {
						numbers = phoneNumbers.get(prefix);
					}
					numberInfo = new CallNumberInfo();
					numberInfo.setValues(line);
					numbers.put(numberInfo.getSegment(), numberInfo);
				}
				br.close();
				br = null;
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}else{
			System.out.println("[Warning]The file of phone numbers (phone) not found.");
		}
	}
}
