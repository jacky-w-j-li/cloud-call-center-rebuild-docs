package com.m7.cc.ass.model.configuration;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;


/**
 * 
 * @author chenguang 2015-4-23
 *
 */
public class MailQueueMember {
	private String astID;
	private String account;
	private int position = 1;
	private int wait = 0;
	private String queue;
	private int holdtime = 0;
	private int originalPosition = 1;
	private String UserID;
	
	public String getUserID() {
		return UserID;
	}

	public void setUserID(String userID) {
		UserID = userID;
	}

	public String getPbx() {
		return astID;
	}

	public int getOriginalPosition() {
		return originalPosition;
	}

	public void setOriginalPosition(int originalPosition) {
		this.originalPosition = originalPosition;
	}

	public int getHoldtime() {
		return holdtime;
	}

	public void setHoldtime(int holdtime) {
		this.holdtime = holdtime;
	}

	public MailQueueMember(String UserId,String queue, String account, String pbx){
		this.UserID = UserId;
		this.queue = queue;
		this.account = account;
		this.astID = pbx;
	}
	
	/**
	 * Event: QueueEntry
	 * Position:1
	 * CallerIDName:lilian
	 * Channel:SIP/1002-096221a8
	 * Count: 1
	 * Wait:5
	 * Queue:200
	 * CallerID:1002
	 * OriginalPosition: 1
	 * Uniqueid: 
	 * @return
	 */
	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.QueueEntry);
		event.addParameter(Fields.PBX, this.astID);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Queue, this.queue);
//		event.addParameter(Fields.Position, this.position);
//		event.addParameter(Fields.CallerIDName, this.callerIDName);
//		event.addParameter(Fields.Channel, this.channel);
//		event.addParameter(Fields.Count, this.count);
//		event.addParameter(Fields.Wait, this.wait);
//		event.addParameter(Fields.OriginalPosition, this.originalPosition);
		return event;
	}
	
	public void setCallerID(String callerID) {
		if(callerID == null || callerID.equalsIgnoreCase("null")
				|| callerID.equalsIgnoreCase("<unknow>"))
			return;
	}

	public int getWait() {
		return wait;
	}

	public void setWait(int wait) {
		this.wait = wait;
	}

	public String getQueue() {
		return queue;
	}

	public int getPosition() {
		return position;
	}

	public void setPosition(int position) {
		this.position = position;
	}
	
	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}
	
}
