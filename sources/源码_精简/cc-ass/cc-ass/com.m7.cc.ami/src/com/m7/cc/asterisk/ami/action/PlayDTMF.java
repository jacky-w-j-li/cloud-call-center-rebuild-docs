package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

public class PlayDTMF  extends AsteriskAction{
	
	//the channel from which the dtmf send
	private String channel;
	
	//digit of dtmf
	//* = 10
	//# = 11
	private String digit;
	
	public PlayDTMF(String channel, String digit, String actionID) {
		super(AMIField.PLAY_DTMF, actionID);
		this.channel = channel;
		this.digit = digit;
		this.addParameter(AMIField.CHANNEL, channel);
		this.addParameter(AMIField.DIGIT, digit);
	}

	public String getChannel() {
		return channel;
	}

	public String getDigit() {
		return digit;
	}

}
