package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class Ping extends AsteriskAction{

	public Ping(String actionID) {
		super(AMIField.PING, actionID);
	}
}
