package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class Challenge extends AsteriskAction{
	
	public Challenge(String authType, String actionID){
		super(AMIField.CHALLENGE, actionID);
		addParameter(AMIField.AUTH_TYPE, authType);
	}
}
