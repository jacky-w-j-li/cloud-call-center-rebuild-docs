package com.dishui.manager.session;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.AppConfig;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;



public class AppSession {
	private static Logger log = Logger.getLogger(AppSession.class.getName());
	public static AppSession instance;
	private  Thread sessionThread;
	public AppSession(){
		instance = this;
		this.sessionThread = new Thread("session check") {
			public void run() {
				while (true) {
					checkSession();
					try {
						sleep(600000);
					} catch (Exception e) {
						e.printStackTrace();
					}
				}
			}
		};
	}

	public static AppSession getInstance(){
		if (instance == null)
			new AppSession();
		return instance;
	}
	public void start(){
		this.sessionThread.start();
	}

	protected void checkSession() {
		log.log(Level.INFO,"check session status .....");
		long timeout = Long.parseLong(AppConfig.getInstance().getVar("app.sessionTime"));
		timeout = timeout*60*1000;
		long baseTime = System.currentTimeMillis() - timeout;
		DBObject condition = new BasicDBObject();
		condition.put("timeFlush", new BasicDBObject().append("$lt", baseTime));
        MongoProvider.remove("app_session", condition);

		log.log(Level.INFO,"check session finish.....");
    }
	
	
	
	
}
