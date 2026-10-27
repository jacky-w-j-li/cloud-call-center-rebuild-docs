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

public class baobao {
	public static void main(String[] args) {
//		String abc = "Ued9f3d80-786e-11e5-bf49-b37141d621d3Ued9f3d80-786e-11e5-bf49-b37141d621d3Ued9f3d80-786e-11e5-bf49-b37141d621d3Ued9f3d80-786e-11e5-bf49-b37141d621d3Ued9f3d80-786e-11e5-bf49-b37141d621d301085659293";
		String abc = "Ued9f3d80-786e-11e5-bf49-b37141d621d301085659293";
		
		if(abc.length() > 37){
			int count = abc.length()/37;
			System.out.println(count);
			String bcd =abc.substring(37*count, abc.length());
			System.out.println(bcd);
		}
	}

//	public static void main(String[] args) {
//		System.setProperty("MONGO.POOLSIZE", String.valueOf(10));
//		try {
////			String ip = "115.29.10.194";  //测试
//			String ip = "10.1.100.31"; //正式
//			String port = "7000";
////			String user = "dishui";
//			String user = "admin";
//			String password = "hollycrm";
//			if (ip == null || port == null) {
//				System.out.println("Database not configured!!!!!");
//				return;
//			}
//			System.out.println("Connecting to db: " + ip + ":" + port);
//			Mongo mongo = new Mongo(ip, Integer.valueOf(port));
//			MongoOptions options = mongo.getMongoOptions();
//			options.autoConnectRetry = true;
//			options.connectionsPerHost = 200;
//			DB db = mongo.getDB("admin");
//			db.authenticate(user, password.toCharArray());
//			System.out.println("Connected to db: " + ip + ":" + port);
//			DB aDb = mongo.getDB("app_20141212");
//			DB bDb = mongo.getDB("app_20150917");
//			DBObject findCc = new BasicDBObject();
//			findCc.put("CONNECT_TYPE", "normal");
//			findCc.put("OFFERING_TIME", new BasicDBObject("$gte","2016-01-11 00:00").append("$lte", "2016-01-20 12:00"));
//			DBCursor result = bDb.getCollection("N000000006287_c5_call_sheet").find(findCc);
//			System.out.println("count =="+result.count());
//			int count =0 ;
//			while (result.hasNext()) {
//				count ++;
//				System.out.println("count =="+count);
//				DBObject ob = result.next();
//				
//				DBObject findA = new BasicDBObject("CALLED_NO", ob.get("CALL_NO").toString())
//				.append("OFFERING_TIME", new BasicDBObject("$gte","2016-01-11 00:00").append("$lte", "2016-01-20 12:00"));
//				
//				DBCursor resultA = aDb.getCollection("N000000003422_c5_call_sheet").find(findA).limit(1);
//				if(resultA.hasNext()){
//					DBObject oa = resultA.next();
//					System.out.println("finded!!!!" + oa.get("CALLED_NO"));
//					ob.put("ACCOUNT_ID","N000000003422");
//					if(oa.get("DISPOSAL_AGENT") != null)
//						ob.put("DISPOSAL_AGENT",oa.get("DISPOSAL_AGENT").toString());
//					ob.put("PBX", oa.get("PBX"));
//					ob.put("CALLED_NO", oa.get("CALL_NO"));
//					BasicDBList bl = new BasicDBList();
//					bl.add(oa.get("CALL_NO"));
//					bl.add(ob.get("CALL_NO"));
//					ob.put("CALL_NO_CALLED_NO", bl);
//					ob.put("cx", true);
//					aDb.getCollection("N000000003422_c5_call_sheet").insert(ob);
//				}
////				if(count ==100){
////					break;
////				}
////				String curAcc = ob.get("Account").toString();
////				String curDidNum = ob.get("DidNum").toString();
////				DBObject curAccOb = billDb.getCollection("platform_account").findOne(new BasicDBObject("_id", curAcc));
////				System.out.println(curAccOb.get("companyName")+","+curAcc+","+curDidNum);
//			}
//			
//			mongo.close();
//		} catch (Exception e) {
//			System.out.println("Connect to mongodb failed");
//			e.printStackTrace();
//		}
//	}

}
