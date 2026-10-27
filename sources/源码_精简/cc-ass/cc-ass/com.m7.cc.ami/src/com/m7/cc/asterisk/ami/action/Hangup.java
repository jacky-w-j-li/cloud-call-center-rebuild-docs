package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * This action used to hangup a channel.
 * @author Caif
 * @version 1.0, 2008-2-18
 */
public class Hangup extends AsteriskAction{
	private String channel;
	public Hangup(String channel, String actionID) {
		super(AMIField.HANGUP, actionID);
		this.channel = channel;
		this.addParameter(AMIField.CHANNEL, channel);
	}
	public String getChannel() {
		return channel;
	}
}
