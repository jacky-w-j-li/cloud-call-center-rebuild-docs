package com.m7.cc.ass.model.configuration;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;


/**
 * 
 * @author Cai Zhibin 2009-7-6
 *
 */
public class C5QueueEntry {
	private String astID;
	private String account;
	private int position = 1;
	private String callerIDName;
	private String channel;
	private int count = 1;
	private String uniqueid;
	private int wait = 0;
	private String queue;
	private String callerID;
	private int holdtime = 0;
	private int originalPosition = 1;
	
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

	public C5QueueEntry(String channel, String queue, String account, String pbx){
		this.channel = channel;
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
		event.addParameter(Fields.CallerID, this.callerID);
//		event.addParameter(Fields.CallerIDName, this.callerIDName);
//		event.addParameter(Fields.Channel, this.channel);
//		event.addParameter(Fields.Count, this.count);
//		event.addParameter(Fields.Wait, this.wait);
//		event.addParameter(Fields.OriginalPosition, this.originalPosition);
		event.addParameter(Fields.Uniqueid, this.uniqueid);
		return event;
	}

	public String getCallerID() {
		return callerID;
	}

	public void setCallerID(String callerID) {
		if(callerID == null || callerID.equalsIgnoreCase("null")
				|| callerID.equalsIgnoreCase("<unknow>"))
			return;
		this.callerID = callerID;
	}

	public String getCallerIDName() {
		return callerIDName;
	}

	public void setCallerIDName(String callerIDName) {
		if(callerIDName == null || callerIDName.equalsIgnoreCase("null")
				|| callerIDName.equalsIgnoreCase("<unknow>"))
			return;
		this.callerIDName = callerIDName;
	}

	public String getChannel() {
		return channel;
	}

	public void setChannel(String channel) {
		if(channel == null || channel.equalsIgnoreCase("null")
				|| channel.equalsIgnoreCase("<unknow>"))
			return;
		this.channel = channel;
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

	public int getCount() {
		return count;
	}

	public void setCount(int count) {
		this.count = count;
	}

	public String getUniqueid() {
		return uniqueid;
	}

	public void setUniqueid(String uniqueid) {
		this.uniqueid = uniqueid;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}
	
}
