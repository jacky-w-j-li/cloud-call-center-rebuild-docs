package com.m7.cc.asterisk.cdr.client;

import java.util.ArrayList;
import java.util.List;

public class AssCdrConnect {
	private String name;
	private String user;
	private String password;
	private String ip;
	private int port;
	private List<String> pbxs = new ArrayList<String>();

	public AssCdrConnect(String name, String user, String password, String ip, int port) {
		this.name = name;
		this.user = user;
		this.password = password;
		this.ip = ip;
		this.port = port;
	}
	
	public void addPbx(String pbx){
		pbxs.add(pbx);
	}

	public String getUser() {
		return user;
	}

	public String getPassword() {
		return password;
	}

	public String getIp() {
		return ip;
	}

	public int getPort() {
		return port;
	}

	public List<String> getPbxs() {
		return pbxs;
	}

	public String getName() {
		return name;
	}
	
}
