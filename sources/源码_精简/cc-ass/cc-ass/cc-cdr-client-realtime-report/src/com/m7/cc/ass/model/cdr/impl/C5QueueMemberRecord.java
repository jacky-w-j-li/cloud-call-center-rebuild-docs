package com.m7.cc.ass.model.cdr.impl;

import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class C5QueueMemberRecord extends C5Event{

	private String id;
	private String queue;
	private String asterisk;
	
	//member add/remove/pause
	private String event;
	private String timestamp;
	
	private String memberName;
	private String location;
	private boolean paused;
	private boolean isStatic;
	private int penalty;
	private int callsTaken;
	
	public C5QueueMemberRecord(){
		super(Fields.QueueMemberCdr);
	}
	
	public C5QueueMemberRecord(String event){
		super(Fields.QueueMemberCdr);
		this.event = event;
	}
	
	public String getJsonString() {
		String str = "{\""+Fields.Command+"\":\""+Fields.Event+"\""
					+",\""+Fields.Event+"\":\""+Fields.QueueMemberCdr+"\""
					+",\""+Fields.id+"\":\""+this.id+"\""
					+",\""+Fields.Queue+"\":\""+this.queue+"\""
					+",\""+Fields.Asterisk+"\":\""+this.asterisk+"\""
					+",\""+Fields.EventName+"\":\""+this.event+"\""
					+",\""+Fields.Timestamp+"\":\""+this.timestamp+"\""
					+",\""+Fields.MemberName+"\":\""+this.memberName+"\""
					+",\""+Fields.Location+"\":\""+this.location+"\""
					+",\""+Fields.Paused+"\":"+this.paused
					+",\""+Fields.Static+"\":"+this.isStatic
					+",\""+Fields.Penalty+"\":"+this.penalty
					+",\""+Fields.CallsTaken+"\":"+this.callsTaken
					+"}";
		return str;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getQueue() {
		return queue;
	}

	public void setQueue(String queue) {
		this.queue = queue;
	}

	public String getAsterisk() {
		return asterisk;
	}

	public void setAsterisk(String asterisk) {
		this.asterisk = asterisk;
	}

	public String getEvent() {
		return event;
	}

	public String getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}

	public String getMemberName() {
		return memberName;
	}

	public void setMemberName(String memberName) {
		this.memberName = memberName;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public boolean isPaused() {
		return paused;
	}

	public void setPaused(boolean paused) {
		this.paused = paused;
	}

	public boolean isStatic() {
		return isStatic;
	}

	public void setStatic(boolean isStatic) {
		this.isStatic = isStatic;
	}

	public int getPenalty() {
		return penalty;
	}

	public void setPenalty(int penalty) {
		this.penalty = penalty;
	}

	public int getCallsTaken() {
		return callsTaken;
	}

	public void setCallsTaken(int callsTaken) {
		this.callsTaken = callsTaken;
	}

	public void setEvent(String event) {
		this.event = event;
	}

	@Override
	public void setValues(Map<String, Object> map) {
			id = (String) map.get(Fields.id);
			queue = (String) map.get(Fields.Queue);
			asterisk = (String) map.get(Fields.Asterisk);
			event = (String) map.get(Fields.EventName);
			timestamp = (String) map.get(Fields.Timestamp);
			memberName = (String) map.get(Fields.MemberName);
			location = (String) map.get(Fields.Location);
			paused = (Boolean) map.get(Fields.Paused);
			isStatic = (Boolean) map.get(Fields.Static);
			penalty = ((Long) map.get(Fields.Penalty)).intValue();
			callsTaken = ((Long) map.get(Fields.CallsTaken)).intValue();
	}
	
}
