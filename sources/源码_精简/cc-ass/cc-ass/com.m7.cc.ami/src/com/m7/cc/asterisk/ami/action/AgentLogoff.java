package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * 
 * @author Cai Zhibin 2009-7-6
 *
 */
public class AgentLogoff extends AsteriskAction{
	private String agent;//*
	private String soft;// true or false
	
	public AgentLogoff(String agent, String actionID) {
		super(AMIField.AGENT_LOGOFF, actionID);
		this.agent = agent;
		this.addParameter(AMIField.AGENT, agent);
	}
	public String getSoft() {
		return soft;
	}
	public void setSoft(String soft) {
		this.soft = soft;
		this.addParameter(AMIField.SOFT, soft);
	}
	public String getAgent() {
		return agent;
	}

}
