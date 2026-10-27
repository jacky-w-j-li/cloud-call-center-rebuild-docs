package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class Logoff extends AsteriskAction{
	private String userName;
	
	public Logoff(String userName, String actionID) {
		super(AMIField.LOGOFF, actionID);
		this.userName = userName;
		this.addParameter(AMIField.USER_NAME, userName);
	}

	public String getUserName() {
		return userName;
	}

}
