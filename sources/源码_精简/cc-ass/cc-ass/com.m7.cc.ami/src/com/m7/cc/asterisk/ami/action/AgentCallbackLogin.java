package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * 
 * @author Cai Zhibin 2009-7-6
 *
 */
public class AgentCallbackLogin extends AsteriskAction{
	private String agent;//*
	private String exten;//*
	private String context;
	private String wrapupTime;
	public AgentCallbackLogin(String agent, String exten, String actionID) {
		super(AMIField.AGENT_CALLBACK_LOGIN, actionID);
		this.agent = agent;
		this.exten = exten;
		this.addParameter(AMIField.AGENT, agent);
		this.addParameter(AMIField.EXTEN, exten);
	}
	public String getContext() {
		return context;
	}
	public void setContext(String context) {
		this.context = context;
		this.addParameter(AMIField.CONTEXT, context);
	}
	public String getWrapupTime() {
		return wrapupTime;
	}
	public void setWrapupTime(String wrapupTime) {
		this.wrapupTime = wrapupTime;
		this.addParameter(AMIField.WRAPUP_TIME, wrapupTime);
	}
	public String getAgent() {
		return agent;
	}
	public String getExten() {
		return exten;
	}

}
