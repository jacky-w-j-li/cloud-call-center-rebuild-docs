package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * This action used to park a call.
 * When a call parked Asterisk will identify it will a call number like 701,
 * users can dial this number to invoke it.
 * If the parked call is timeout, channel2 will invoke it.
 * @author Caif
 * @version 1.0, 2008-2-14
 */
public class Park extends AsteriskAction {
	private String channel;

	private String channel2;

	//The unit of timeout is ms. sample: 45000
	private String timeout;

	public Park(String channel, String channel2, String actionID) {
		super(AMIField.PARK, actionID);
		this.channel = channel;
		this.channel2 = channel2;
		this.addParameter(AMIField.CHANNEL, channel);
		this.addParameter(AMIField.CHANNEL2, channel2);
	}
	
	public Park(String channel, String channel2, String timeout, String actionID) {
		super(AMIField.PARK, actionID);
		this.channel = channel;
		this.channel2 = channel2;
		this.timeout = timeout;
		this.addParameter(AMIField.CHANNEL, channel);
		this.addParameter(AMIField.CHANNEL2, channel2);
		this.addParameter(AMIField.TIMEOUT, timeout);
	}

	public String getTimeout() {
		return timeout;
	}

	public void setTimeout(String timeout) {
		this.timeout = timeout;
		this.addParameter(AMIField.TIMEOUT, timeout);
	}

	public String getChannel() {
		return channel;
	}

	public String getChannel2() {
		return channel2;
	}

}
