package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.Fields;

public class WebchatMessage {
	public static final String NAME = "webchatMessage";
	private String accessId;
	private String sid;
	private String messageId;
	private String msgType;
	private String content;
	private String pbx;
	private String account;
	private String createTime;
	private boolean isDispatchered = false;

	public String getMsgType() {
		return msgType;
	}

	public void setMsgType(String msgType) {
		this.msgType = msgType;
	}

	public String getAccessId() {
		return accessId;
	}

	public void setAccessId(String accessId) {
		this.accessId = accessId;
	}

	public String getSid() {
		return sid;
	}

	public void setSid(String sid) {
		this.sid = sid;
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

	public String getMessageId() {
		return messageId;
	}

	public void setMessageId(String messageId) {
		this.messageId = messageId;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public void setValues(HashMap<String, Object> map) {
		if (map.containsKey("Sid"))
			this.sid = (String) map.get("Sid");
		if (map.containsKey("AccessId"))
			this.accessId = (String) map.get("AccessId");
		if (map.containsKey("PBX"))
			this.pbx = (String) map.get("PBX");
		if (map.containsKey("Account"))
			this.account = (String) map.get("Account");
		if (map.containsKey("CreateTime"))
			this.createTime = (String) map.get("CreateTime");
		if (map.containsKey("MessageId"))
			this.messageId = (String) map.get("MessageId");
		if (map.containsKey("Content"))
			this.content = (String) map.get("Content");
		if (map.containsKey("MsgType"))
			this.msgType = (String) map.get("MsgType");
	}
	
	public HashMap<String, String> getMap(){
		HashMap<String, String> map = new HashMap<String, String>();
		map.put("Sid", this.sid);
		map.put("AccessId", this.accessId);
		map.put("Pbx", this.pbx);
		map.put("Account", this.account);
		map.put("CreateTime", this.createTime);
		map.put("MessageId", this.messageId);
		map.put("Content", this.content);
		map.put("MsgType", this.msgType);
		return map;
	}

	public String getCreateTime() {
		return createTime;
	}

	public void setCreateTime(String createTime) {
		this.createTime = createTime;
	}

	public boolean isDispatchered() {
		return isDispatchered;
	}

	public void setDispatchered(boolean isDispatchered) {
		this.isDispatchered = isDispatchered;
	}
	
}
