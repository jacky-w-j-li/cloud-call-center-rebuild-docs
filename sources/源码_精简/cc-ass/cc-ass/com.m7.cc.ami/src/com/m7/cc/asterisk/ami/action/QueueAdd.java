package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * 
 * @author Caif
 * @version 1.0, 2008-1-27
 */
public class QueueAdd extends AsteriskAction{
	private String queue;//*
	
	//* the name of the member to add to the queue.
	//this will be a technology adn resource, sunch as SIP/1001 
	//or Local/1001@from-internal/n
	//an agent can also be added by using Agent/123
	private String _interface;//*
	
	private String memberName;
	
	//A numerical penalty.
	//Asterisk will distribute calls to members with higher penalties 
	//only after attepting to distribute the call to all members with a lower penalty
	private String penalty;
	
	// yes or no
	private String paused;
	
	public QueueAdd(String queue, String _interface, String actionID) {
		super(AMIField.QUEUE_ADD, actionID);
		this.queue = queue;
		this._interface = _interface;
		this.addParameter(AMIField.QUEUE, queue);
		this.addParameter(AMIField.INTERFACE, _interface);
	}

	public String getMemberName() {
		return memberName;
	}

	public void setMemberName(String memberName) {
		this.memberName = memberName;
		this.addParameter(AMIField.MEMBER_NAME, memberName);
	}

	public String getPenalty() {
		return penalty;
	}

	/**
	 * 
	 * @param penalty numerical var
	 */
	public void setPanelty(String penalty) {
		this.penalty = penalty;
		this.addParameter(AMIField.PENALTY, penalty);
	}

	public String getPaused() {
		return paused;
	}

	/**
	 * 
	 * @param paused yes|no
	 */
	public void setPaused(String paused) {
		this.paused = paused;
		this.addParameter(AMIField.PAUSED, paused);
	}

	public String get_interface() {
		return _interface;
	}

	public String getQueue() {
		return queue;
	}

}
