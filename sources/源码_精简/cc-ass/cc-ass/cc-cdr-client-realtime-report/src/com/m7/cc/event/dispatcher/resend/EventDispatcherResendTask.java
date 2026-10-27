package com.m7.cc.event.dispatcher.resend;


import java.util.ArrayList;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.db.mongo.MongoConnect;
import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.report.ReportCollector;
import com.m7.cc.util.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.FindIterable;
import java.util.Iterator;

public class EventDispatcherResendTask extends TimerTask {
	private Logger log = Logger.getLogger(ReportCollector.class.getName());

	public void run() {
		try {
			long currentTime = Long.parseLong(Utils.getCurrentTimestampSecond());
			ArrayList<Integer> levelList = new ArrayList<Integer>();
			levelList.add(10);
			levelList.add(30);
			levelList.add(60);
			levelList.add(600);
			for(int i=0 ; i < levelList.size() ; i++){
				int thisLevel = levelList.get(i);
				BasicDBObject find = new BasicDBObject();
				find.put("level",thisLevel+"");
				find.put("failedTimeStamp",new BasicDBObject().append("$lte", (currentTime-thisLevel)+""));
				find.put("lock", false);
				List<DBObject> list = new ArrayList<DBObject>();
	            MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getReportDB("cdr")
	            		.getCollection("app_event_dispatcher_resend", BasicDBObject.class);
	            FindIterable result = collection.find(find);
	            for(Iterator<BasicDBObject> iterator = result.iterator(); iterator.hasNext();){
	                BasicDBObject event = iterator.next();
	                list.add(event);
	            }
//				List<DBObject> list = MongoProvider.getInstance().find("app_event_dispatcher_resend", find);
				BasicDBObject doc = new BasicDBObject().append("$set", new BasicDBObject().append("lock", true));
				UpdateOptions uo = new UpdateOptions();
				uo.upsert(false);
				MongoConnect.getInstance().getReportDB("cdr").getCollection("app_event_dispatcher_resend").updateMany(find, doc, uo);

				if(list.size() > 0)
					EventDispatcherResender.addToBuf(list);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}

}
