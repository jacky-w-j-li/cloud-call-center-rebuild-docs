package com.m7.cc.ass.model.configuration;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;


/**
 * 
 * @author Cai Zhibin 2009-6-19
 *
 */
public class C5QueueMember {
	
	private String astID;
	private String account;
	private String name;
	private String queue;
	private String Membership = Fields.Static;
	
	//true 1, false 0
	private boolean paused = false;
	
	private int status = 1;
	
	private int penalty = 0;
	
	private String lastCall;
	
	private String location = "";
	
	private int CallsTaken = 0;
	
	private String exten = "";
	private String userID ;
	public C5QueueMember(String name, String queue, String account, String pbx){
		this.name = name;
		this.queue = queue;
		astID = pbx;
		this.account = account;
	}

	public String getPbx() {
		return astID;
	}
	
	public C5Event getState(){
		C5Event event = new C5Event(Fields.QueueMember);
		event.addParameter(Fields.Exten, this.exten);
		return event;
	}
	
	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.QueueMember);
		event.addParameter(Fields.PBX, this.astID);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Queue, this.queue);
		event.addParameter(Fields.Paused, this.paused);
		event.addParameter(Fields.Membership, this.Membership);
		event.addParameter(Fields.Penalty, this.penalty);
		event.addParameter(Fields.Name, this.name);
		event.addParameter(Fields.LastCall, this.lastCall);
		event.addParameter(Fields.Location, this.location);
		event.addParameter(Fields.Exten, this.exten);
		event.addParameter(Fields.Status, this.status);
		event.addParameter(Fields.CallsTaken, this.CallsTaken);
		event.addParameter(Fields.UserID, this.userID);
		return event;
	}
	
	public int getCallsTaken() {
		return CallsTaken;
	}

	public void setCallsTaken(int callsTaken) {
		CallsTaken = callsTaken;
	}

	public String getLastCall() {
		return lastCall;
	}

	public void setLastCall(String lastCall) {
		this.lastCall = lastCall;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
		if(location.startsWith("SIP"))
			exten = location.replaceAll("SIP/", "");
	}

	public String getMembership() {
		return Membership;
	}

	public void setMembership(String membership) {
		Membership = membership;
	}

	public boolean isPaused() {
		return paused;
	}

	public void setPaused(boolean paused) {
		this.paused = paused;
	}

	public int getPenalty() {
		return penalty;
	}

	public void setPenalty(int penalty) {
		this.penalty = penalty;
	}

	public int getStatus() {
		return status;
	}

	public void setStatus(int status) {
		this.status = status;
	}

	public String getName() {
		return name;
	}

	public String getQueue() {
		return queue;
	}

	public String getExten() {
		return exten;
	}

	public void setExten(String exten) {
		this.exten = exten;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getUserID() {
		return userID;
	}

	public void setUserID(String userID) {
		this.userID = userID;
	}
	
}
