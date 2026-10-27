package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * 
 * @author Caif
 * @version 1.0, 2008-1-16
 */
public class Originate extends AsteriskAction {
	private String async;
	private String callerID;
	private String timeout;
	private String variable;
	private String account;
	private String channel;
	private String exten;
	private String context;
	private String priority;
	private String application;
	private String data;
	/**
	 * Create a originate action to transfer the channel to a extension on a
	 * context with priority.
	 * 
	 * @param channel *
	 * @param exten *
	 * @param context *
	 * @param priority *
	 * @param timeout
	 * @param callerID
	 * @param variable
	 * @param account
	 * @param async
	 * @param actionID
	 */
	public Originate(String channel, String exten,
			String context, String priority, String actionID) {
		super(AMIField.ORIGINATE, actionID);
		this.channel = channel;
		this.exten = exten;
		this.context = context;
		this.priority = priority;
		addParameter(AMIField.CHANNEL, channel);
		addParameter(AMIField.EXTEN, exten);
		addParameter(AMIField.CONTEXT, context);
		addParameter(AMIField.PRIORITY, priority);
	}

	/**
	 * Create a originate to tranfer a channel to application
	 * 
	 * @param channel *
	 * @param application *
	 * @param data *
	 * @param timeout
	 * @param callerID
	 * @param variable
	 * @param account
	 * @param async
	 * @param actionID
	 */
	public Originate(String channel, String application,
			String data, String actionID) {
		super(AMIField.ORIGINATE, actionID);
		this.channel = channel;
		this.application = application; 
		this.data = data;
		addParameter(AMIField.CHANNEL, channel);
		addParameter(AMIField.APPLICATION, application);
		addParameter(AMIField.DATA, data);
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
		this.addParameter(AMIField.ACCOUNT, account);
	}

	public String getAsync() {
		return async;
	}

	public void setAsync(String async) {
		this.async = async;
		this.addParameter(AMIField.ASYNC, async);
	}

	public String getCallerID() {
		return callerID;
	}

	public void setCallerID(String callerID) {
		this.callerID = callerID;
		this.addParameter(AMIField.CALLERID, callerID);
	}

	public String getTimeout() {
		return timeout;
	}

	public void setTimeout(String timeout) {
		this.timeout = timeout;
		this.addParameter(AMIField.TIMEOUT, timeout);
	}

	public String getVariable() {
		return variable;
	}
	
	/**
	 * Variable: var1=23|var2=24|var3=25
	 * @param variable
	 */
	public void setVariable(String variable) {
		this.variable = variable;
		this.addParameter(AMIField.VARIABLE, variable);
	}

	public String getApplication() {
		return application;
	}

	public String getChannel() {
		return channel;
	}

	public String getContext() {
		return context;
	}

	public String getData() {
		return data;
	}

	public String getExten() {
		return exten;
	}

	public String getPriority() {
		return priority;
	}
}
