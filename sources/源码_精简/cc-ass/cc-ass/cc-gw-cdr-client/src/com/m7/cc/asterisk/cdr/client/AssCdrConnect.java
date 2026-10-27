package com.m7.cc.asterisk.cdr.client;


public class AssCdrConnect {
	private String name;
	private String user;
	private String password;
	private String ip;
	private int port;

	public AssCdrConnect(String name, String user, String password, String ip, int port) {
		this.name = name;
		this.user = user;
		this.password = password;
		this.ip = ip;
		this.port = port;
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

	public String getName() {
		return name;
	}
	
}
