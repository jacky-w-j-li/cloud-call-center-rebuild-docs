package com.m7.cc.ass.gateway.config.model;

import java.util.HashMap;

public class GWRoute extends Context implements ServicePeer {
	public static final String NAME = "route";
	
	private String displayName;
	
	private String nextPeer;
	
	public GWRoute(String exten) {
		super(exten+"-"+NAME, exten);
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getNextPeer() {
		return nextPeer;
	}

	public void setNextPeer(String nextPeer) {
		this.nextPeer = nextPeer;
	}

	@Override
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public String getActionString() {
		return "goto "+this.getContext()+",s,1";
	}

	@Override
	public String getServicePeerName() {
		return NAME;
	}

	@Override
	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}
	
}
