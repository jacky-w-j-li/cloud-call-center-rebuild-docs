package com.m7.cc.ass.model.cdr.impl;

import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class C5QueueEntryRecord extends C5Event{
	
	private String id;
	private String queue;
	private String asterisk;
	
	//join/leave/caller abandon
	private String event;
	private String timestamp;
	
	//join/leave/caller abandon
	private String uniqueid;
	private String callerID;
	private String callerIDName;
	private String channel;
	
	public C5QueueEntryRecord(){
		super(Fields.QueueEntryCdr);
	}
	
	public C5QueueEntryRecord(String event){
		super(Fields.QueueEntryCdr);
		this.event = event;
	}
	
	public String getJsonString() {
		String str = "{\""+Fields.Command+"\":\""+Fields.Event+"\""
					+",\""+Fields.Event+"\":\""+Fields.QueueEntryCdr+"\""
					+",\""+Fields.id+"\":\""+this.id+"\""
					+",\""+Fields.Queue+"\":\""+this.queue+"\""
					+",\""+Fields.Asterisk+"\":\""+this.asterisk+"\""
					+",\""+Fields.EventName+"\":\""+this.event+"\""
					+",\""+Fields.Timestamp+"\":\""+this.timestamp+"\""
					+",\""+Fields.Uniqueid+"\":\""+this.uniqueid+"\""
					+",\""+Fields.CallerID+"\":\""+this.callerID+"\""
					+",\""+Fields.CallerIDName+"\":\""+this.callerIDName+"\""
					+",\""+Fields.Channel+"\":\""+this.channel+"\""
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

	public String getUniqueid() {
		return uniqueid;
	}

	public void setUniqueid(String uniqueid) {
		this.uniqueid = uniqueid;
	}

	public String getCallerID() {
		return callerID;
	}

	public void setCallerID(String callerID) {
		this.callerID = callerID;
	}

	public String getCallerIDName() {
		return callerIDName;
	}

	public void setCallerIDName(String callerIDName) {
		this.callerIDName = callerIDName;
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		this.channel = channel;
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
			uniqueid = (String) map.get(Fields.Uniqueid);
			callerID = (String) map.get(Fields.CallerID);
			callerIDName = (String) map.get(Fields.CallerIDName);
			channel = (String) map.get(Fields.Channel);
	}
	
}
