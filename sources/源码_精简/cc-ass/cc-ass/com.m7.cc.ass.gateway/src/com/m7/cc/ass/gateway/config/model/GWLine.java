package com.m7.cc.ass.gateway.config.model;

import java.util.HashMap;

public class GWLine extends Context implements ServicePeer {
	
	public static final String NAME = "line";
	
	private String ip;
	private int port;
	
	private String displayName = "";
	
	public GWLine(String exten) {
		super(exten+"-"+NAME, exten);
	}

	public String getIp() {
		return ip;
	}

	public void setIp(String ip) {
		this.ip = ip;
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}
	
	public void setPort(String port) {
		this.port = Integer.valueOf(port).intValue();
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
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
