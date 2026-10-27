package com.m7.monitor;

public class Asterisk {
	private String id;
	private int port;

	public Asterisk(String id, int port) {
		this.id = id;
		this.port = port;
	}
	
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}

}
