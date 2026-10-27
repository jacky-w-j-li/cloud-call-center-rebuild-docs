package com.m7.cc.db.mongo;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;

import com.m7.cc.util.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoOptions;

public class CopyOfCountAliveAccount {

	public static void main(String[] args) {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(10));
		try {
			
			String abc = "1466770794.671126";
			System.out.println((long)Double.parseDouble(abc));
			
//			String ip = "115.29.10.194";  //测试
			String ip = "120.26.103.8"; //测试report
			String port = "7210";
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
			
			DB appDB = mongo.getDB("cg_test");

			DBCollection collection = appDB.getCollection("N00000007200_c5_call_sheet");
			
			DBObject find = new BasicDBObject();
			find.put("OFFERING_TIME", new BasicDBObject("$gte","2016-06-22 21:00:00").append("$lte", "2016-06-22 21:10:00"));
			find.put("STATUS", "dealing");
			find.put("DIDI_BIND_ID", new BasicDBObject("$exists", 1));
			
			
			HashMap<String, Boolean> map = new HashMap<String, Boolean>();
			DBCursor accCur = collection.find(find);
//			System.out.println(accCur.size());
			int count = 0;
			while (accCur.hasNext()) {
				DBObject acc = accCur.next();
				if(acc != null){
					String bind_id =  acc.get("DIDI_BIND_ID").toString();
					if(!map.containsKey(bind_id)){
						String endTime = acc.get("END_TIME").toString();
						long tempNum = transferTimeTolong(endTime)+20000;
						String resultTime = getDate(tempNum);
						
						
						DBObject countFind = new BasicDBObject("DIDI_BIND_ID", bind_id)
						    .append("_id", new BasicDBObject("$ne",acc.get("_id")))
							.append("STATUS", "dealing")
							.append("OFFERING_TIME", new BasicDBObject("$gte","2016-06-22 21:00:00")
							.append("$lte", resultTime)
							);
						long num = collection.count(countFind);
//						if(num == 4){
//							System.out.println("---"+bind_id);
//						}		
						if(num >= 2){
							count++;
							System.out.println("---"+bind_id);
							System.out.println(count);
						}
						map.put(bind_id, true);
					}											
				}
			}
			System.out.println("------结果 ="+count);
		} catch (Exception e) {
			System.out.println("has exception");
			e.printStackTrace();
		}
	}
	
	public static long transferTimeTolong(String time){
		try {
			SimpleDateFormat format =  new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");  
			Date date = format.parse(time);
//			System.out.print("Format To times:"+date.getTime());
			return date.getTime();
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return 0l;
    }
	
	public static String getDate(long timestamp){
		if(timestamp == -1)
			return null;
		DateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String date = df.format(new Date(timestamp));
		return date;
	}

}
