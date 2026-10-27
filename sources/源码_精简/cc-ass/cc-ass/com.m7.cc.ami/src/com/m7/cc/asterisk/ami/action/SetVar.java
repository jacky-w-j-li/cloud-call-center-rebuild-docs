package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class SetVar extends AsteriskAction{
	private String channel;
	private String variable;
	private String value;
	
	public SetVar( String actionID) {
		super(AMIField.SetVar, actionID);
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		this.channel = channel;
		this.addParameter(AMIField.CHANNEL, channel);
	}

	public String getVariable() {
		return variable;
	}

	public void setVariable(String variable) {
		this.variable = variable;
		this.addParameter(AMIField.VARIABLE, variable);
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
		this.addParameter(AMIField.Value, value);
	}

}
