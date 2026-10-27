package com.m7.cc.asterisk.ami.action;

import com.m7.cc.asterisk.ami.AMIField;

/**
 * To query the status of the queue.
 * If no queue is indefined all of the queues will feedback
 * @author Caif
 * @version 1.0, 2008-1-26
 */
public class QueueStatus extends AsteriskAction{
	private String queue;
	private String member;

	public QueueStatus(String actionID) {
		super(AMIField.QUEUE_STATUS, actionID);
	}

	public String getMember() {
		return member;
	}

	public void setMember(String member) {
		this.member = member;
		this.addParameter(AMIField.MEMBER, member);
	}

	public String getQueue() {
		return queue;
	}

	public void setQueue(String queue) {
		this.queue = queue;
		this.addParameter(AMIField.QUEUE, queue);
	}


}
