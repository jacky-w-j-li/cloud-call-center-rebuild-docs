package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ServicePeer;


/**
 * Hangup
 * @author Cai Zhibin 2009-10-27
 *
 */
public class TerminateCall implements ServicePeer{

	private String exten;
	
	private String displayName = "terminatecall-0";
	
	public String getActionString() {
		return "Hangup";
	}

	public String getExten() {
		return exten;
	}

	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	public String getServicePeerName() {
		return Fields.Hangup;
	}
	
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "terminatecall-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	@Override
	public C5Event getStateEvent() {
		C5Event event = new C5Event(Fields.Hangup);
		return event;
	}
}
