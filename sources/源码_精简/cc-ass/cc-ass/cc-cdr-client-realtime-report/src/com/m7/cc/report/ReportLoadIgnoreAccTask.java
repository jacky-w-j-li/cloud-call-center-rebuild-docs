package com.m7.cc.report;

import java.util.HashMap;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoConnect;
import com.mongodb.BasicDBObject;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;

public class ReportLoadIgnoreAccTask extends TimerTask {
	private Logger log = Logger.getLogger(ReportLoadIgnoreAccTask.class.getName());

	public void run() {
		try {
			MongoDatabase db = null;
			db = MongoConnect.getInstance().getReportDB();
			MongoCollection<BasicDBObject> collection = db.getCollection(Fields.Report_Ignore_Account, BasicDBObject.class);
			FindIterable<BasicDBObject> iterable = collection.find();
		    MongoCursor<BasicDBObject> cursor = iterable.iterator();
		    HashMap<String, Boolean> map = new HashMap<String, Boolean>();
		    while (cursor.hasNext()) {
		    	BasicDBObject ob = cursor.next();
				map.put(ob.getString("_id"), true);
			}
		    IgnorReportAccountServer.getInstance().ignoreReportAcc = map;
		    log.log(Level.INFO, "LOAD Report_Ignore_Account SUCCESS! MAP=" + map.toString());
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}
}
