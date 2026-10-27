package com.m7.cc.ass.model.configuration;

import java.util.HashMap;

import com.m7.cc.command.C5Event;
import com.m7.cc.configuration.service.Context;
import com.m7.cc.configuration.service.ServicePeer;

public class WebCall extends Context implements ServicePeer{
	public static final String NAME = "webcall";
	
	private String account;
	private String toPeer = "0";
	
	private String displayName;
	
	public WebCall(String account, String exten) {
		super(account+"-"+exten+"-"+NAME, exten);
		this.account = account;
		this.displayName = "webcall-" + exten;
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "webcall-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	public String getToPeer() {
		return toPeer;
	}

	public void setToPeer(String toPeer) {
		this.toPeer = toPeer;
	}

	public String getAccount() {
		return account;
	}

	public String getActionString() {
		return "goto "+this.getContext()+",${EXTEN},1";
	}

	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	public String getServicePeerName() {
		return NAME;
	}
	
	public void addValues(HashMap<String, Object> map) {
		
	}

	@Override
	public C5Event getStateEvent() {
		// TODO Auto-generated method stub
		return null;
	}
}
