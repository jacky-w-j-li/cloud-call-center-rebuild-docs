package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.Fields;

public class Mail {
	public static final String NAME = "mail";
	private String addr;
	private String from;
	private String to;
	private String cc;
	private String subject;
	private String mailId;
	private String pbx;
	private String account;
	private String createTime;
	
	private int dispatcheredCount = 0;
	private boolean dispatchered = false;

	public boolean isDispatchered() {
		return dispatchered;
	}

	public void setDispatchered(boolean dispatchered) {
		this.dispatchered = dispatchered;
	}

	public String getAddr() {
		return addr;
	}

	public void setAddr(String addr) {
		this.addr = addr;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getMailId() {
		return mailId;
	}

	public void setMailId(String mailId) {
		this.mailId = mailId;
	}
	
	public String getFrom() {
		return from;
	}

	public void setFrom(String from) {
		this.from = from;
	}

	public String getTo() {
		return to;
	}

	public void setTo(String to) {
		this.to = to;
	}

	public String getCc() {
		return cc;
	}

	public void setCc(String cc) {
		this.cc = cc;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public void setValues(HashMap<String, Object> map) {
		if (map.containsKey("Address"))
			this.addr = (String) map.get("Address");
		if (map.containsKey("From"))
			this.from = (String) map.get("From");
		if (map.containsKey("To"))
			this.to = (String) map.get("To");
		if (map.containsKey("Cc"))
			this.cc = (String) map.get("Cc");
		if (map.containsKey("Subject"))
			this.subject = (String) map.get("Subject");
		if (map.containsKey("MailId"))
			this.mailId = (String) map.get("MailId");
		if (map.containsKey("PBX")) 
			this.pbx = (String) map.get("PBX");
		if (map.containsKey("Account"))
			this.account = (String) map.get("Account");
		if (map.containsKey("CreateTime"))
			this.createTime = (String) map.get("CreateTime");
	}
	
	public HashMap<String, String> getMap(){
		HashMap<String, String> map = new HashMap<String, String>();
		map.put("Address", this.addr);
		map.put("From", this.from);
		map.put("To", this.to);
		map.put("Cc", this.cc);
		map.put("Subject", this.subject);
		map.put("MailId", this.mailId);
		map.put("Pbx", this.pbx);
		map.put("Account", this.account);
		map.put("CreateTime", this.createTime);
		return map;
	}

	public int getDispatcheredCount() {
		return dispatcheredCount;
	}

	public void setDispatcheredCount(int dispatcheredCount) {
		this.dispatcheredCount = dispatcheredCount;
	}

	public String getCreateTime() {
		return createTime;
	}

	public void setCreateTime(String createTime) {
		this.createTime = createTime;
	}
	
}
