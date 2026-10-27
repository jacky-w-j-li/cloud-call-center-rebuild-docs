package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * 
 * @author Caif
 * @version 1.0, 2008-1-29
 */
public class Redirect extends AsteriskAction{
	
	private String channel;
	private String extraChannel;
	private String exten;
	private String context;
	private String priority;
	
	public Redirect(String channel, String context, String exten, String priority, String actionID) {
		super(AMIField.REDIRECT, actionID);
		this.channel = channel;
		this.exten = exten;
		this.context = context;
		this.priority = priority;
		this.addParameter(AMIField.CHANNEL, channel);
		this.addParameter(AMIField.CONTEXT, context);
		this.addParameter(AMIField.EXTEN, exten);
		this.addParameter(AMIField.PRIORITY, priority);
	}
	
	public String getChannel() {
		return channel;
	}
	public String getContext() {
		return context;
	}
	public String getExten() {
		return exten;
	}
	public String getExtraChannel() {
		return extraChannel;
	}
	public void setExtraChannel(String extraChannel){
		this.extraChannel = extraChannel;
		this.addParameter(AMIField.EXTRA_CHANNEL, extraChannel);
	}
	
	public String getPriority() {
		return priority;
	}

}
