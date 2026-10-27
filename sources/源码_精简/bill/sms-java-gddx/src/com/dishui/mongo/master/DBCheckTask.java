package com.dishui.mongo.master;

import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.CommandResult;
import com.mongodb.DB;
import com.mongodb.DBObject;

import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

public class DBCheckTask extends Thread{
	private static Logger log = Logger.getLogger(DBCheckTask.class.getName());
	@Override
	public void run() {
        while (true){
            try {
                //do task
                Calendar now = Calendar.getInstance();
                int hour = now.get(Calendar.HOUR_OF_DAY);
                log.log(Level.INFO,"check the db status, the hour is ["+hour+"]");
                if(hour != 0 ){
                    sleep(59*60*1000); // 1 hour
                    continue;
                } else {
                    log.log(Level.INFO,"starting check the db status!");
                    checkCurrentDb();
                    DataManager.start();
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
	}
	
	private String getCurrentDb(){
		DBObject master = MongoProvider.findOne(DBMaster.DB_MASTER, new BasicDBObject().append("master_key", "db_status"));
		if (master != null) {
			return (String) master.get("db_current");
		}else{
			log.warning("db_master is not found !");
			return null;
		}
	}
	
	private boolean checkDataSize(String dbName,long dataSize){
		DBObject lastDbStatus = MongoProvider.findOne(DBMaster.DB_MASTER_LOG, new BasicDBObject().append("db_key", dbName).append("date", Utils.getLastDate()));
		if (lastDbStatus != null) {
			long lastDataSize = (long)Double.parseDouble(String.valueOf(lastDbStatus.get("dataSize")));
			long limitSize = Long.parseLong(AppConfig.getInstance().getVar("db.limitDataSize"));
			if ((dataSize - lastDataSize) >= limitSize ) {
				return true;
			}
		}
		return false;
		
	}
	
	private void createNewDb(){
		String dbNameString = "cc_data_"+ Utils.getDate("yyyyMMdd");
		DBObject master = MongoProvider.findOne(DBMaster.DB_MASTER, new BasicDBObject().append("master_key", "db_status"));
		List<String> dbs = (List<String>) master.get("db_names");
		if(!dbs.contains(dbNameString)){
			DB db = MongoProvider.getDb(dbNameString);
			if(db != null){
				db.addUser(AppConfig.getInstance().getVar("db.account"), AppConfig.getInstance().getVar("db.password").toCharArray());
				DBObject updateDoc = new BasicDBObject();
				updateDoc.put("$inc", new BasicDBObject().append("db_num", 1));
				updateDoc.put("$push", new BasicDBObject().append("db_names", dbNameString));
				updateDoc.put("$set", new BasicDBObject().append("db_current", dbNameString));
				MongoProvider.update(DBMaster.DB_MASTER, new BasicDBObject().append("master_key", "db_status"), updateDoc);
			}
		}else{
			log.log(Level.WARNING, "dbname ["+dbNameString+"] is exist ,can not create new dbs");
		}
	}
	
	private void updateDbStatus(){
		DBObject master = MongoProvider.findOne(DBMaster.DB_MASTER, new BasicDBObject().append("master_key", "db_status"));
		List<String> dbs = (List<String>)master.get("db_names");
		for(String dbName : dbs){
			CommandResult states = MongoProvider.getDbStates(dbName);
            BasicDBObject stateData = getDBStateFromResult(states);
            if (stateData == null) {
                return;
            }
            stateData.put("db_key", dbName);
            stateData.put("date", Utils.getDefaultCurrentDate());
			MongoProvider.insert(DBMaster.DB_MASTER_LOG, stateData);
		}
	}
	
	private boolean checkCurrentDb(){
		String currentDbName = getCurrentDb();
		if(currentDbName != null){
            CommandResult states = MongoProvider.getDbStates(currentDbName);
            BasicDBObject stateData = getDBStateFromResult(states);
            if (stateData == null) {
                return false;
            }
			int collections = stateData.getInt("collections");
			long dataSize = stateData.getLong("dataSize");
			long storageSize =stateData.getLong("storageSize");
			System.out.println("collections:["+collections+"] dataSize:["+dataSize+"] storageSize["+storageSize+"]");
            log.info("collections:["+collections+"] dataSize:["+dataSize+"] storageSize["+storageSize+"]");
			if (collections>=Long.parseLong(AppConfig.getInstance().getVar("db.limitTables")) || checkDataSize(currentDbName,dataSize)) {
					log.log(Level.INFO,"the current db is reach the limit,create a new db!");
					createNewDb();
			}
			updateDbStatus();
			return true;
		}
		
		return false;
	}

    private BasicDBObject getDBStateFromResult(CommandResult states) {
        if (AppConfig.getInstance().getDbCluster()) {
            BasicDBObject statObj = (BasicDBObject) states;
            DBObject raw = (DBObject) statObj.get("raw");
            Map<String, Object> rawMap = raw.toMap();
            Object[] objArr = rawMap.values().toArray();
            if (objArr.length < 1) {
                log.warning("DB is cluster, but we cound not get raw data on db state!!!");
                return null;
            }
            return (BasicDBObject) objArr[0];
        }
        return (BasicDBObject) states;
    }

}
