package com.m7.cc.ass.gateway.config.model;

import java.util.HashMap;

public interface ServicePeer {
	public String getActionString();
	public String getExten();
	public String getServicePeerName();
	public void addValues(HashMap<String, Object> map);
	/**
	 * All parameters which are needed by ServicePeer will be gotten from this map
	 * and setted into ServicePeer.
	 * @param map
	 */
	public void setValues(HashMap<String, Object> map);
	public String getDisplayName();
}
