package com.m7.cc.auto.call.clear;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.db.mongo.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ClearAutoCallCdrTask extends TimerTask {
	private Logger log = Logger.getLogger(ClearAutoCallCdrTask.class.getName());

	public void run() {
		try {
			SimpleDateFormat formatter = new SimpleDateFormat("HH");
			if(Integer.parseInt(formatter.format(new Date())) == 2){
				log.log(Level.WARNING, "Begin clear auto call cdr one month ago.");
				SimpleDateFormat findFormatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
				long time = 31*24*60*60*1000l;
				long baseTime = System.currentTimeMillis() - time;
				BasicDBObject condition = new BasicDBObject();
				condition.put("taskId", new BasicDBObject().append("$ne", null));
				condition.put("beginTime", new BasicDBObject().append("$lt", findFormatter.format(new Date(baseTime))));
				MongoProvider.getInstance().remove("cc_autocall", "app_autocall_new", condition);
				log.log(Level.WARNING, "Success clear auto call cdr one month ago." + findFormatter.format(new Date(baseTime)));
				
				//to delete. remove task import nums.
				BasicDBObject find = new BasicDBObject("status","delete");
				List<DBObject> list = MongoProvider.getInstance().find("cc_autocall_task", "app_autocall_task", find);
				for(int i=0 ; i<list.size() ; i++){
					String taskId = list.get(i).get("_id").toString();
					MongoProvider.getInstance().remove("cc_autocall", "app_autocall_import", new BasicDBObject("taskId", taskId));
					MongoProvider.getInstance().remove("cc_autocall_task", "app_autocall_task", new BasicDBObject("_id", taskId));	
					log.log(Level.WARNING, "Success clear import task dirty nums taskId=" + taskId);
				}
				log.log(Level.WARNING, "Success clear import task dirty nums all.");
			}
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}
//	public static void main(String[] args) {
//		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
//		System.out.println(formatter.format(new Date(System.currentTimeMillis() - 31*24*60*60*1000l)));
//	}
}
