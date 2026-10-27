package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.Fields;

public class WeixinMessage {
	public static final String NAME = "weixinMessage";
	private String openID;
	private String userID;
	private String messageId;
	private String msgType;
	private String content;
	private String pbx;
	private String account;
	private String createTime;
	private String nickName;
	private boolean isDispatchered = false;

	public String getNickName() {
		return nickName;
	}

	public void setNickName(String nickName) {
		this.nickName = nickName;
	}

	public String getMsgType() {
		return msgType;
	}

	public void setMsgType(String msgType) {
		this.msgType = msgType;
	}

	public String getOpenID() {
		return openID;
	}

	public void setOpenID(String openID) {
		this.openID = openID;
	}

	public String getUserID() {
		return userID;
	}

	public void setUserID(String userID) {
		this.userID = userID;
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
		if (map.containsKey("OpenID"))
			this.openID = (String) map.get("OpenID");
		if (map.containsKey("UserID"))
			this.userID = (String) map.get("UserID");
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
		if (map.containsKey("NickName"))
			this.nickName = (String) map.get("NickName");
	}
	
	public HashMap<String, String> getMap(){
		HashMap<String, String> map = new HashMap<String, String>();
		map.put("OpenID", this.openID);
		map.put("UserID", this.userID);
		map.put("Pbx", this.pbx);
		map.put("Account", this.account);
		map.put("CreateTime", this.createTime);
		map.put("MessageId", this.messageId);
		map.put("Content", this.content);
		map.put("MsgType", this.msgType);
		map.put("NickName", this.nickName);
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
