package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class Message extends AsteriskAction{
	private String fromExten;
	private String toExten;
	private String msg;
	private String time;
	
	public Message(String fromExten, String toExten, String msg, String time, String actionID) {
		super(AMIField.MESSAGE, actionID);
		this.fromExten = fromExten;
		this.toExten = toExten;
		this.msg = msg;
		this.time = time;
		addParameter(AMIField.FROM_EXTEN, fromExten);
		addParameter(AMIField.TO_EXTEN, toExten);
		addParameter(AMIField.MESSAGES, msg);
		addParameter(AMIField.TIME, time);
	}
	public String getFromExten() {
		return fromExten;
	}
	public String getMsg() {
		return msg;
	}
	public String getToExten() {
		return toExten;
	}
	public String getTime() {
		return time;
	}
	
}
