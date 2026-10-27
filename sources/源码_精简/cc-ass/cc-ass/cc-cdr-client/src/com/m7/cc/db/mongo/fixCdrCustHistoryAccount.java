package com.m7.cc.db.mongo;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoOptions;

public class fixCdrCustHistoryAccount {

	public static void main(String[] args) {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(10));
		try {
			String ip = "115.29.10.194";  //测试
//			String ip = "10.160.11.198"; //正式
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
//			String account = "N00000000143";
			String account = "N00000006562";
			DB db_bill = mongo.getDB("bill");
			DBCollection collection = db_bill.getCollection("platform_account_product");
			DBObject findAcc = new BasicDBObject();
			findAcc.put("_id",account+"_cc");
			DBObject acc = collection.findOne(findAcc, new BasicDBObject("dataDB",1));
			
			String acc_db = acc.get("dataDB").toString();
			System.out.println(acc.get("dataDB"));
			DB db_data = mongo.getDB(acc_db);
			DBCollection cdrCollection = db_data.getCollection(account+"_c5_call_sheet");
			DBCollection historyCollection = db_data.getCollection(account+"_history");
			
			DBObject findCdr = new BasicDBObject();
			findCdr.put("OFFERING_TIME",new BasicDBObject("$gte","2016-05-14 00:00").append("$lte", "2016-05-17 23:59"));
			DBCursor cdrCur = cdrCollection.find(findCdr);
			while (cdrCur.hasNext()) {
				DBObject ob = cdrCur.next();
				if(!ob.get("CUSTOMER_ID").toString().equals("00000000000000000000")){
					DBObject findHis = new BasicDBObject("_id", ob.get("_id"));
					DBObject his = historyCollection.findOne(findHis);
					if(his == null){
						DBObject data = new BasicDBObject();
						data.put("_id", ob.get("_id"));
						data.put("customer", ob.get("CUSTOMER_ID"));
						data.put("createTime",  ob.get("END_TIME"));
						data.put("agent", ob.get("DISPOSAL_AGENT"));
						data.put("status", ob.get("STATUS"));
						
						data.put("beginTime", fixCdrCustHistoryAccount.getTimeStamp(ob.get("BEGIN_TIME")));
						data.put("endTime", fixCdrCustHistoryAccount.getTimeStamp(ob.get("END_TIME")));
						if(ob.get("CONNECT_TYPE").toString().equals("normal") || ob.get("CONNECT_TYPE").toString().equals("transfer")){
							data.put("type", "callin");
						}else{
							data.put("type", "callout");
						}
						if(ob.get("STATUS").toString().equals("dealing") || ob.get("STATUS").toString().equals("voicemail")){
							data.put("recordFile", ob.get("FILE_SERVER")+"/"+ob.get("RECORD_FILE_NAME"));
						}
						historyCollection.insert(data);
						System.out.println(data.get("customer"));
					}
				}
			}
			
		} catch (Exception e) {
			System.out.println("Connect to mongodb failed");
			e.printStackTrace();
		}
	}
	
    public static String getTimeStamp(Object str){
    	if(str == null){
    		return "";
    	}
    	String str1 = str.toString();
    	String re_time = null; 
		try {
			SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
			Date date;
			date = simpleDateFormat.parse(str1); 
			long l = date.getTime(); 
			re_time = String.valueOf(l);
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return re_time;
    }

}
