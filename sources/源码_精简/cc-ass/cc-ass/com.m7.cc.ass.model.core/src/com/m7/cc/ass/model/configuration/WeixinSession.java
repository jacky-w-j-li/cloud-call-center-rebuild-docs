package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.Fields;

public class WeixinSession {
	private String from;
	private String userID;
	private long lastSendTime;
	
	public WeixinSession(String from, String userID, long lastSendTime) {
		this.from = from;
		this.userID = userID;
		this.lastSendTime = lastSendTime;
	}
	
	public String getFrom() {
		return from;
	}

	public void setFrom(String from) {
		this.from = from;
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
		if (map.containsKey("From"))
			this.from = (String) map.get("From");
		if (map.containsKey("LastSendTime"))
			this.lastSendTime = (Long) map.get("LastSendTime");
	}
	
	public HashMap<String, String> getMap(){
		HashMap<String, String> map = new HashMap<String, String>();
		map.put("From", this.from);
		map.put("UserID", this.userID);
		map.put("LastSendTime", this.lastSendTime+"");
		return map;
	}

}
