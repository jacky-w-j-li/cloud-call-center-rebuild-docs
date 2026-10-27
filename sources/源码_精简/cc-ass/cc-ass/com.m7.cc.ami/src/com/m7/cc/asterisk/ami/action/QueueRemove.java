package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * This action used to remove members
 * @author Caif
 * @version 1.0, 2008-1-27
 */
public class QueueRemove extends AsteriskAction{
	private String queue;//*
	
	//* the name of the member to add to the queue.
	//this will be a technology adn resource, sunch as SIP/1001 
	//or Local/1001@from-internal/n
	//an agent can also be added by using Agent/123
	private String _interface;//*
	
	public QueueRemove(String queue, String _interface, String actionID) {
		super(AMIField.QUEUE_REMOVE, actionID);
		this.queue = queue;
		this._interface = _interface;
		this.addParameter(AMIField.QUEUE, queue);
		this.addParameter(AMIField.INTERFACE, _interface);
	}

	public String get_interface() {
		return _interface;
	}

	public String getQueue() {
		return queue;
	}

}
