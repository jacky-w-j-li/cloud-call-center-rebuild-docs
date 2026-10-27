package com.dishui.manager.batchCdrMonitor;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.*;

public class BatchCdrMonitorServer {
	private static BatchCdrMonitorServer instance = null;
	private boolean isRunning = false;
	private TimerTask monitorTask = new BatchCdrMonitorTask();
	private Timer clearTimer = new Timer();
	private HashMap<String, String> pbxAcsUrlMap = new HashMap<String, String>();

	private BatchCdrMonitorServer(){
		instance = this;
	}


	
	public static BatchCdrMonitorServer getInstance(){
		if (instance == null){
			new BatchCdrMonitorServer();
		}
		return instance;
	}
	
	public void start(){
		if(this.isRunning){
			System.out.println("ClearAutoCallCdr server was started.");
			return;
		}
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, cal.get(Calendar.HOUR_OF_DAY)+1);
        cal.set(Calendar.MINUTE, 5);
		clearTimer.scheduleAtFixedRate(monitorTask, cal.getTime(), 3600000);
	}
	
	public void stop(){
		clearTimer.cancel();
		clearTimer = null;
		this.isRunning = false;
	}

    public String getPbxAcsUrl(String pbxId){
        if(pbxAcsUrlMap.containsKey(pbxId)){
            return pbxAcsUrlMap.get(pbxId);
        }else{
            DBObject findPbx = new BasicDBObject();
            findPbx.put("_id",pbxId);
            DBObject resPbx = MongoProvider.findOne("bill", "platform_cc_pbx", findPbx);
            if(resPbx==null){
                return null;
            }else{
                pbxAcsUrlMap.put(pbxId, resPbx.get("configAddr").toString());
                return resPbx.get("configAddr").toString();
            }
        }
    }
}
