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
				DBObject find = new BasicDBObject();
				find.put("level",thisLevel+"");
				find.put("failedTimeStamp",new BasicDBObject().append("$lte", (currentTime-thisLevel)+""));
				find.put("lock", false);
				
				List<DBObject> list = MongoProvider.getInstance().find("app_event_dispatcher_resend", find);
				DBObject doc = new BasicDBObject().append("$set", new BasicDBObject().append("lock", true));
				MongoConnect.getInstance().getDB().getCollection("app_event_dispatcher_resend").update(find, doc, false, true);

				if(list.size() > 0)
					EventDispatcherResender.addToBuf(list);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}

}
