package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.Fields;

public class WebchatSession {
	private String sid;
	private String userID;
	private long lastSendTime;
	
	public WebchatSession(String sid, String userID, long lastSendTime) {
		this.sid = sid;
		this.userID = userID;
		this.lastSendTime = lastSendTime;
	}
	
	public String getSid() {
		return sid;
	}

	public void setSid(String sid) {
		this.sid = sid;
	}

	public String getUserID() {
		return userID;
	}

	public void setUserID(String userID) {
		this.userID = userID;
	}

	public long getLastSendTime() {
		return lastSendTime;
	}

	public void setLastSendTime(long lastSendTime) {
		this.lastSendTime = lastSendTime;
	}

	public void setValues(HashMap<String, Object> map) {
		if (map.containsKey("UserID"))
			this.userID = (String) map.get("UserID");
		if (map.containsKey("Sid"))
			this.sid = (String) map.get("Sid");
		if (map.containsKey("LastSendTime"))
			this.lastSendTime = (Long) map.get("LastSendTime");
	}
	
	public HashMap<String, String> getMap(){
		HashMap<String, String> map = new HashMap<String, String>();
		map.put("Sid", this.sid);
		map.put("UserID", this.userID);
		map.put("LastSendTime", this.lastSendTime+"");
		return map;
	}

}
