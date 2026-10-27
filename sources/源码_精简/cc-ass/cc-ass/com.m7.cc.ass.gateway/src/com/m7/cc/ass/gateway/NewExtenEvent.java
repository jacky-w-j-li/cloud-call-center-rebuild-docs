package com.m7.cc.ass.gateway;

import java.util.Hashtable;
import java.util.Map;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class NewExtenEvent extends C5Event {
	private String asterisk;
	private String application;
	private String uniqueid;
	private String channel;
	private String extension;
	private String priority;
	private String appData;
	private String context;
	private String timestamp;
	private String fromCid;
	private String fromDid;
	
	/**
	 * Event: Newexten Privilege: call,all Extension: 2000 Application: Queue
	 * Uniqueid: 1244774639.123 Channel: SIP/6001-09ed0830 Priority: 1 AppData:
	 * 2000 Context: g3si
	 */
	public NewExtenEvent() {
		super(Fields.Newexten);
		this.setFromCid("");
		this.setFromDid("");
	}

	public String getApplication() {
		return application;
	}

	public void setApplication(String application) {
		this.application = application;
		this.addParameter(Fields.Application, application);
	}

	public String getUniqueid() {
		return uniqueid;
	}

	public void setUniqueid(String uniqueid) {
		this.uniqueid = uniqueid;
		this.addParameter(Fields.Uniqueid, uniqueid);
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		this.channel = channel;
		this.addParameter(Fields.Channel, channel);
	}

	public String getExtension() {
		return extension;
	}

	public void setExtension(String extension) {
		this.extension = extension;
		this.addParameter(Fields.Extension, extension);
	}

	public String getPriority() {
		return priority;
	}

	public void setPriority(String priority) {
		this.priority = priority;
		this.addParameter(Fields.Priority, priority);
	}

	public String getAppData() {
		return appData;
	}

	public void setAppData(String appData) {
		this.appData = appData;
		this.addParameter(Fields.AppData, appData);
	}

	public String getFromCid() {
		return fromCid;
	}

	public void setFromCid(String fromCid) {
		this.fromCid = fromCid;
		this.addParameter(Fields.FromCid, fromCid);
	}

	public String getFromDid() {
		return fromDid;
	}

	public void setFromDid(String fromDid) {
		this.fromDid = fromDid;
		this.addParameter(Fields.FromDid, fromDid);
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
		this.addParameter(Fields.Context, context);
	}

	public String getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
		this.addParameter(Fields.Timestamp, timestamp);
	}

	public String getAsterisk() {
		return asterisk;
	}

	public void setAsterisk(String asterisk) {
		this.asterisk = asterisk;
		this.addParameter(Fields.Asterisk, asterisk);
	}

	public void setValues(Map<String, Object> map) {
		application = (String) map.get(Fields.Application);
		uniqueid = (String) map.get(Fields.Uniqueid);
		channel = (String) map.get(Fields.Channel);
		extension = (String) map.get(Fields.Extension);
		priority = (String) map.get(Fields.Priority);
		appData = (String) map.get(Fields.AppData);
		context = (String) map.get(Fields.Context);
		timestamp = (String) map.get(Fields.Timestamp);
		asterisk = (String) map.get(Fields.Asterisk);
		this.addParameter(Fields.Application, application);
		this.addParameter(Fields.Uniqueid, uniqueid);
		this.addParameter(Fields.Channel, channel);
		this.addParameter(Fields.Extension, extension);
		this.addParameter(Fields.Priority, priority);
		this.addParameter(Fields.AppData, appData);
		this.addParameter(Fields.Context, context);
		this.addParameter(Fields.Timestamp, timestamp);
		this.addParameter(Fields.Asterisk, asterisk);
		this.setFromCid((String) map.get(Fields.FromCid));
		this.setFromDid((String) map.get(Fields.FromDid));
	}

	public void setValues(Hashtable<String, String> map) {
		application = map.get(Fields.Application);
		uniqueid = map.get(Fields.Uniqueid);
		channel = map.get(Fields.Channel);
		extension = map.get(Fields.Extension);
		priority = map.get(Fields.Priority);
		appData = map.get(Fields.AppData);
		context = map.get(Fields.Context);
		timestamp = map.get(Fields.Timestamp);
		asterisk = map.get(Fields.Asterisk);
		this.addParameter(Fields.Application, application);
		this.addParameter(Fields.Uniqueid, uniqueid);
		this.addParameter(Fields.Channel, channel);
		this.addParameter(Fields.Extension, extension);
		this.addParameter(Fields.Priority, priority);
		this.addParameter(Fields.AppData, appData);
		this.addParameter(Fields.Context, context);
		this.addParameter(Fields.Timestamp, timestamp);
		this.addParameter(Fields.Asterisk, asterisk);
	}
}
