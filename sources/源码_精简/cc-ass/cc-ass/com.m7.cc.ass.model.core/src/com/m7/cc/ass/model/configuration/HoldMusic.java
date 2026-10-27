package com.m7.cc.ass.model.configuration;


public class HoldMusic {
	private String account;
	private String pbx;
	
	private String name;
	
	public HoldMusic(String pbx, String account, String name) {
		this.account = account;
		this.pbx = pbx;
		this.name = name;
	}
	
	public String getAccount() {
		return account;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getPbx() {
		return pbx;
	}
}
