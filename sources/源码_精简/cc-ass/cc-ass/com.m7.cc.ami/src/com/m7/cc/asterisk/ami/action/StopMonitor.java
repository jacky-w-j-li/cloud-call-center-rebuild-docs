package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class StopMonitor extends AsteriskAction{
	private String channel;
	
	public String getChannel() {
		return channel;
	}

	public StopMonitor(String channel, String actionID) {
		super(AMIField.STOP_MONITOR, actionID);
		this.channel = channel;
		this.addParameter(AMIField.CHANNEL, channel);
	}

}
