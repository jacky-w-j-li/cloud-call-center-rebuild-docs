package com.dishui.mongo.master;

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

	}
	
}
