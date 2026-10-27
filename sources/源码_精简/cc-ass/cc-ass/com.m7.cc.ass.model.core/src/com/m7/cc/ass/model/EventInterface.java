package com.m7.cc.ass.model;


// Aman zhai. 2010.05.11

public class EventInterface {
	private static final String DEFAULT_NAME = "NameExam";
	private static final String DEFAULT_EVENT_TYPE = "CallEvent";
	
	private String nameId;
	
	private String pbx;
	
	private String accountID;

	private String eventType;
	
	private String concreteType;
	
	private String key;
	
	private String url;

	public EventInterface(String pbx, String account) {
		this.pbx = pbx;
		this.accountID = account;
		this.eventType = DEFAULT_EVENT_TYPE;
		this.concreteType = null;
		this.url = null;
		this.nameId = DEFAULT_NAME;
		this.key = null;
	}
	
	public EventInterface()
	{
		this.pbx = null;
		this.accountID = null;
		this.eventType = DEFAULT_EVENT_TYPE;
		this.concreteType = null;
		this.url = null;
		this.nameId = DEFAULT_NAME;
		this.key = null;
	}

	public EventInterface(String pbx, String account, String eventType, String key,
			String concreteType, String url) {
		this.pbx = pbx;
		this.accountID = account;
		this.eventType = eventType;
		this.concreteType = concreteType;
		this.url = url;
		this.nameId = this.eventType + "-" + this.concreteType;
		this.key = key;
	}
	
	public void setEventInterface(EventInterface eventInterface)
	{
		if (null != eventInterface)
		{
			this.pbx = eventInterface.getPbx();
			this.accountID = eventInterface.getAccountID();
			this.eventType = eventInterface.getEventType();
			this.concreteType = eventInterface.getConcreteType();
			this.url = eventInterface.getUrl();
			this.nameId = eventInterface.getName();
			this.key = eventInterface.getKey();
		}
	}
	
	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}

	public String getName() {
		return nameId;
	}

	public void setName(String name) {
		this.nameId = name;
	}

	public String getEventType() {
		return eventType;
	}

	public void setEventType(String eventType) {
		this.eventType = eventType;
	}
	
	public String getConcreteType() {
		return concreteType;
	}

	public void setConcreteType(String concreteType) {
		this.concreteType = concreteType;
	}
	
	
	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}
	
	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}
	
	public String getAccountID() {
		return accountID;
	}

	public void setAccountID(String accountID) {
		this.accountID = accountID;
	}
	
}
