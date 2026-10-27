package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class Command extends AsteriskAction{

	public Command(String command, String actionID) {
		super(AMIField.COMMAND, actionID);
		this.addParameter(AMIField.COMMAND, command);
	}

}
