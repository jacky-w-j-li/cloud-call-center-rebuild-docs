package com.dishui.manager.report.model;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;

/**
 * Created by chenguang on 11/12/15.
 */
public class MonitorQueue {
	public static final String NAME = "MonitorQueue";

	private String account;
	private String queueExten;
	private String displayName ;

    private HashMap<String, String> sessionMap = new HashMap<String, String>();

	public MonitorQueue(String account, String queueExten) {
        this.account = account;
        this.queueExten =  queueExten;
		this.displayName = "MonitorQueue-" + queueExten;
	}
    public String getQueueExten(){ return queueExten; }

    public void setSessionMap(HashMap<String,String> map){
        sessionMap = map;
    }

    public HashMap<String,String> getSessionMap(){
        return sessionMap;
    }

    public Hashtable<String, Object> getEventData(){
        Hashtable<String, Object> eventData = new Hashtable<String, Object>();
        eventData.put("im_monitor_type","queue");
        eventData.put("queueExten", queueExten);

        long manualSession = 0;
        long waitClaim = 0;
        Iterator it = sessionMap.keySet().iterator();
        while(it.hasNext()){
            String key = (String)it.next();
            String value = sessionMap.get(key);
            if(!value.equals("robot") && !value.equals("leave") && !value.equals("robot-finish") && !value.equals("leave-finish")){
                manualSession++;
            }
            if(value.equals("undeal")){
                waitClaim++;
            }
        }
        eventData.put("waitClaim",waitClaim);
        eventData.put("manualSession",manualSession);
        System.out.printf(sessionMap.toString());
        return eventData;
    }
}
