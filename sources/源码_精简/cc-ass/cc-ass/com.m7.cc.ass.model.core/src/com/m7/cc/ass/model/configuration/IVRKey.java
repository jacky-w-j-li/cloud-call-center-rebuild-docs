package com.m7.cc.ass.model.configuration;


public class IVRKey {
	private String key;
	private String toPeer;
	
	public IVRKey(String key){
		this.key = key;
	}
	
	public IVRKey(String key, String toPeer){
		this.key = key;
		this.toPeer = toPeer;
	}

	public String getToPeer() {
		return toPeer;
	}

	public void setToPeer(String toPeer) {
		this.toPeer = toPeer;
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}
}
