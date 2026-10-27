package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * This action used to pause the queue member.
 * If the queue is identified, this action will pause the member in this queue.
 * Or it will pause this member in all queues it belong to.
 * @author Caif
 * @version 1.0, 2008-1-27
 */
public class QueuePause extends AsteriskAction{
	
	//* the name of the member to add to the queue.
	//this will be a technology adn resource, sunch as SIP/1001 
	//or Local/1001@from-internal/n
	//an agent can also be added by using Agent/123
	private String _interface;//*
	private String paused;//*
	
	//if the queue is not specified, it will pause all queues that the member in.
	private String queue;
	
	/**
	 * 
	 * @param _interface
	 * @param paused true|false
	 * @param actionID
	 */
	public QueuePause(String _interface, String paused, String actionID) {
		super(AMIField.QUEUE_PAUSE, actionID);
		this._interface = _interface;
		this.paused = paused;
		this.addParameter(AMIField.INTERFACE, _interface);
		this.addParameter(AMIField.PAUSED, paused);
	}

	public String getQueue() {
		return queue;
	}

	public void setQueue(String queue) {
		this.queue = queue;
		this.addParameter(AMIField.QUEUE, queue);
	}

	public String get_interface() {
		return _interface;
	}

	public String getPaused() {
		return paused;
	}

}
