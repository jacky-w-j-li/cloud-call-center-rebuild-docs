package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * To check channel's status, if the channel is not setted
 * Asterisk will return all the status of channel.
 * @author Caif
 * @version 1.0, 2008-1-26
 */
public class Status extends AsteriskAction{
	
	private String channel;
	
	public Status(String actionID) {
		super(AMIField.STATUS, actionID);
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		this.channel = channel;
		this.addParameter(AMIField.CHANNEL, channel);
	}

}
