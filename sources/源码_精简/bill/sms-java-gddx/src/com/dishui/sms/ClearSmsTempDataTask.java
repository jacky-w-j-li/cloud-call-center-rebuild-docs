package com.dishui.sms;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ClearSmsTempDataTask extends TimerTask {
	private Logger log = Logger.getLogger(ClearSmsTempDataTask.class.getName());

	public void run() {
		try {
			SimpleDateFormat formatter = new SimpleDateFormat("HH");
			if(Integer.parseInt(formatter.format(new Date())) == 16){
                SimpleDateFormat delFormatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                int duration = 15;

                String beginDelDate = delFormatter.format(new Date(System.currentTimeMillis() - duration*24*60*60*1000l));
                log.log(Level.WARNING, "Begin clear sms temp data $lt=" + beginDelDate);
                DBObject con = new BasicDBObject();
                con.put("submitTime", new BasicDBObject("$lt", beginDelDate));
                
                MongoProvider.remove("cc", "app_sms_send", con);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
	}

}
