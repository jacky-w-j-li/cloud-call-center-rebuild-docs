package com.dishui.manager.report.model;

import java.util.Hashtable;

/**
 * Created by chenguang on 11/12/15.
 */
public class MonitorAccessNo {
	public static final String NAME = "MonitorAccessId";
	
	private String account;
	private String accessId;
	private String displayName ;

    private int newSession = 0;
	private int accessSession = 0;
	private int closeSession = 0;
    private int robotSession = 0;
    private int manualSession = 0;
    private int robotToManualSession = 0;


	public MonitorAccessNo(String account, String accessId) {
        this.account = account;
        this.accessId =  accessId;
		this.displayName = "MonitorAccessId-" + accessId;
	}

    public String getAccessId() {
        return accessId;
    }

    public void newSession(){
        newSession++;
    }

    public void accessSession(){
        accessSession++;
    }

    public void closeSession(){ closeSession++; }

    public void manualSession(){ manualSession++;}

    public void robotToManualSession(){ robotToManualSession++;}

    public void robotSession(){ robotSession++;}

    public void setNewSession(int newSession) {
        this.newSession = newSession;
    }

    public void setAccessSession(int accessSession) {
        this.accessSession = accessSession;
    }

    public void setCloseSession(int closeSession) {
        this.closeSession = closeSession;
    }

    public void setManualSession(int manualSessionCount) {
        this.manualSession = manualSessionCount;
    }

    public void setRobotToManualSession(int robotToManualSessionCount) {
        this.robotToManualSession = robotToManualSessionCount;
    }

    public void setRobotSession(int robotSessionCount) {
        this.robotSession = robotSessionCount;
    }

    public Hashtable<String, Object> getEventData(){
        Hashtable<String, Object> eventData = new Hashtable<String, Object>();
        eventData.put("im_monitor_type","accessNo");
        eventData.put("accessId",accessId);
        eventData.put("newSession",newSession);
        eventData.put("accessSession",accessSession);
        eventData.put("closeSession",closeSession);
        eventData.put("robotSession", robotSession);
        eventData.put("manualSession",manualSession);
        eventData.put("robotToManualSession",robotToManualSession);
        return eventData;
    }
}
