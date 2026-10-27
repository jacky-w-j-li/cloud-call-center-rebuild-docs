package com.m7.cc.hangupsms.cach;

import java.util.ArrayList;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoProvider;
import com.mongodb.DBObject;

public class HangupSmsCachTask extends TimerTask {
	private Logger log = Logger.getLogger(HangupSmsCachTask.class.getName());

	public void run() {
		try {
			List<DBObject> dblists = new ArrayList<DBObject>();
		    dblists = MongoProvider.getInstance().find("cc",Fields.CC_HANGUP_SMS_TEMPLATE);
		    for (int i = 0; i < dblists.size(); i++) {
		    	HangupSmsCach.add(dblists.get(i).get("_id").toString(), dblists.get(i));
			}
			log.log(Level.WARNING, "Success get hangupsms cach.");
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}
}
