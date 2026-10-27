package com.m7.cc.ass.model.cdr.impl;

import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class C5PeerRecord extends C5Event{
	public static final String login = "login";
	public static final String busy = "busy";
	public static final String register = "register";
	public static final String insert = "insert";
	public static final String update = "update";
	
	private String id;
	private String asterisk;
	private String userID;
	private String exten;
	private String extenType;
	//this is the account
	private String account;
	
	private String actionType;
	private String begin_time;
	private String end_time;
	
	private String opType = insert;
	
	private String comments;
	private String agent;
	
	private String busyType;
	
	public C5PeerRecord(){
		super(Fields.PeerCdr);
	}
	
	public C5PeerRecord(String actionType){
		super(Fields.PeerCdr);
		this.actionType = actionType;
		this.begin_time = Utils.getCurrentTimestamp();
		this.id = Utils.getUniqueid();
	}
	
	public String getJsonString() {
		String str = "{\""+Fields.Command+"\":\""+Fields.Event+"\""
					+",\""+Fields.Event+"\":\""+Fields.PeerCdr+"\""
					+",\""+Fields.id+"\":\""+this.id+"\""
					+",\""+Fields.PBX+"\":\""+this.asterisk+"\""
					+",\""+Fields.Account+"\":\""+this.account+"\""
					+",\""+Fields.UserID+"\":\""+this.userID+"\""
					+",\""+Fields.Exten+"\":\""+this.exten+"\""
					+",\""+Fields.ExtenType+"\":\""+this.extenType+"\""
					+",\""+Fields.ActionType+"\":\""+this.actionType+"\""
					+",\""+Fields.BeginTime+"\":\""+this.begin_time+"\""
					+",\""+Fields.EndTime+"\":\""+this.end_time+"\""
					+",\""+Fields.OpType+"\":\""+this.opType+"\""
					+",\""+Fields.BusyType+"\":\""+this.busyType+"\""
					+((comments != null)?
						",\""+Fields.Comments+"\":\""+this.comments+"\"":"")
					+((agent != null)?
						",\""+Fields.Agent+"\":\""+this.agent+"\"":"")
					+"}";
		return str;
	}

	public String getOpType() {
		return opType;
	}

	public void setOpType(String opType) {
		this.opType = opType;
	}

	public String getID() {
		return id;
	}

	public void setID(String uniqueID) {
		this.id = uniqueID;
	}

	public String getUserID() {
		return userID;
	}

	public void setUserID(String userID) {
		this.userID = userID;
	}

	public String getExten() {
		return exten;
	}

	public void setExten(String exten) {
		this.exten = exten;
	}

	public String getExtenType() {
		return extenType;
	}

	public void setExtenType(String extenType) {
		this.extenType = extenType;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getActionType() {
		return actionType;
	}

	public void setActionType(String actionType) {
		this.actionType = actionType;
	}

	public String getBegin_time() {
		return begin_time;
	}

	public void setBegin_time(String begin_time) {
		this.begin_time = begin_time;
	}

	public String getEnd_time() {
		return end_time;
	}

	public void setEnd_time(String end_time) {
		this.end_time = end_time;
	}

	public String getAsterisk() {
		return asterisk;
	}

	public void setAsterisk(String asterisk) {
		this.asterisk = asterisk;
	}

	public String getComments() {
		return comments;
	}

	public void setComments(String comments) {
		this.comments = comments;
	}

	public String getAgent() {
		return agent;
	}

	public void setAgent(String agent) {
		this.agent = agent;
	}

	public String getBusyType() {
		return busyType;
	}

	public void setBusyType(String busyType) {
		this.busyType = busyType;
	}

	@Override
	public void setValues(Map<String, Object> map) {
			id = (String) map.get(Fields.id);
			asterisk = (String) map.get(Fields.PBX);
			userID = (String) map.get(Fields.UserID);
			exten = (String) map.get(Fields.Exten);
			extenType = (String) map.get(Fields.ExtenType);
			account = (String) map.get(Fields.Account);
			actionType = (String) map.get(Fields.ActionType);
			begin_time = (String) map.get(Fields.BeginTime);
			end_time = (String) map.get(Fields.EndTime);
			opType = (String) map.get(Fields.OpType);
			busyType = (String) map.get(Fields.BusyType);
			if(map.containsKey(Fields.Comments))
				comments = (String) map.get(Fields.Comments);
			if(map.containsKey(Fields.Agent))
				agent = (String) map.get(Fields.Agent);
	}
	
}
