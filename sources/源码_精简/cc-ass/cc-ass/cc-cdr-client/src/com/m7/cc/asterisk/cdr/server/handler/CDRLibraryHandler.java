package com.m7.cc.asterisk.cdr.server.handler;

import java.util.HashMap;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.CDREventProcessor;
import com.m7.cc.db.mongo.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class CDRLibraryHandler {
	private static Thread libraryDataThread;
	private static Logger log = Logger.getLogger(CDREventProcessor.class.getName());
	private static Vector<HashMap<String, String>> num_buffer = new Vector<HashMap<String, String>>();
	/*
	 * [map info]
	 * _id = num (String)
	 * canCall = true/false (string);
	 * province = (String)
	 * district = (String)
	 * districtCode = (String)
	 * lastCallTime = (String)
	 */
	public static void processCdrLibrary(HashMap<String, String> numMap) {
		if(libraryDataThread == null){
			libraryDataThread = new Thread("Process Cdr Library Data thread") {
				public void run() {
					updateCdrLibraryToDatabase();
				}
			};
			libraryDataThread.start();
		}
		num_buffer.add(numMap);
	}

	private static void updateCdrLibraryToDatabase() {
		HashMap<String, String> numMap = null;
		while (true) {
			try {
				if (num_buffer.size() > 0)
					numMap = num_buffer.remove(0);
				else {
					Thread.sleep(5000);
				}
				if (numMap != null) {
					String num = numMap.get("_id");
					if(num != null){
						if(!num.matches("[0-9]*")){
							numMap = null;	
							continue;
						}
						DBObject library = new BasicDBObject();
						library.putAll(numMap);
						library.removeField("_id");
						DBObject countDoc = new BasicDBObject();
						if(numMap.get("canCall") != null && 
								numMap.get("canCall").equals("true")){
							countDoc.put("dealingCount",1);					
						}else{
							countDoc.put("leakCount",1);
						}
						MongoProvider.getInstance().update("num_library","num_library", 
									new BasicDBObject().append("_id", num), 
									new BasicDBObject("$set",library).append("$inc", countDoc), true);
						numMap = null;
					}
				}
			} catch (Exception e) {
				log.log(Level.WARNING, e.getMessage(), e);
			}
		}
	}
}