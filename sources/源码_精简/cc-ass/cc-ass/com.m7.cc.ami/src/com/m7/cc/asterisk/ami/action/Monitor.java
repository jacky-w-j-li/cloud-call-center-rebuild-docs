package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * Record audion information of the channel in server.
 * @author Caif
 * @version 1.0, 2008-2-18
 */
public class Monitor extends AsteriskAction{
	private String channel;
	private String file;
	private String format;
	private String Mix;//true or false
	
	public Monitor(String channel, String actionID) {
		super(AMIField.MONITOR, actionID);
		this.channel = channel;
		this.addParameter(AMIField.CHANNEL, channel);
	}

	public String getFile() {
		return file;
	}

	public void setFile(String file) {
		this.file = file;
		this.addParameter(AMIField.FILE, file);
	}

	public String getFormat() {
		return format;
	}

	public void setFormat(String format) {
		this.format = format;
		this.addParameter(AMIField.FORMAT, format);
	}

	public String getMix() {
		return Mix;
	}

	public void setMix(String mix) {
		Mix = mix;
		this.addParameter(AMIField.MIX, mix);
	}

	public String getChannel() {
		return channel;
	}

}
