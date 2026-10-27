package com.dishui.mongo.master;


import com.dishui.bill.service.AppTimer;

import java.util.Calendar;
import java.util.logging.Logger;


public class DBMaster {
	private static Logger log = Logger.getLogger(DBMaster.class.getName());
	public static String DB_MASTER = "db_master";
	public static String DB_MASTER_LOG = "db_master_log";
	
	
	public static DBMaster instance;
	private DBCheckTask dbTask;
	
	public static DBMaster getInstance(){
		if (instance == null) {
			new DBMaster();
		}
		return instance;
	}
	
	private DBMaster(){
		instance = this;
		dbTask = new DBCheckTask();
	}
	
	public void start(){
        dbTask.start();


//		Calendar now = Calendar.getInstance();
////		now.add(Calendar.HOUR_OF_DAY, 1);
//		now.set(Calendar.MINUTE, 0);
//		now.set(Calendar.SECOND, 0);
		
//		AppTimer.getInstance().scheduleAtFixedRate(dbTask, now.getTime(), 60*1000);
	}
	
}
