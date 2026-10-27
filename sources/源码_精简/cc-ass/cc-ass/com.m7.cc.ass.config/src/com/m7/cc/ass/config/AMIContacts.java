package com.m7.cc.ass.config;

import com.m7.cc.config.ConfPeer;

public class AMIContacts {
	public final static String HOST = "host";
	public final static String PORT = "port";
	public final static String USER = "user";
	public final static String PASSWORD = "password";
	
	private ConfPeer peer;
	
	private String id = "";
	private String host = "127.0.0.1";
	private int port = 5038;
	private String user;
	private String password;
	
	public AMIContacts(ConfPeer peer){
		this.id = peer.getName();
		this.peer = peer;
		this.host = peer.getParam(HOST);
		this.port = Integer.valueOf(peer.getParam(PORT));
		this.user = peer.getParam(USER);
		this.password = peer.getParam(PASSWORD);
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getId() {
		return id;
	}

	public String getHost() {
		return host;
	}

	public void setHost(String host) {
		this.host = host;
		peer.addParam(HOST, host);
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
		peer.addParam(PORT, port+"");
	}

	public String getUser() {
		return user;
	}

	public void setUser(String user) {
		this.user = user;
		peer.addParam(USER, user);
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
		peer.addParam(PASSWORD, password);
	}
	
}
