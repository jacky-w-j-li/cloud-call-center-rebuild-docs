package com.m7.cc.sip.proxy;

public class Via {
	
	private String version;
	private String ip;
	private int port;
	private String received;
	
	public Via(String value){
		String[] a = value.split(" ");
		version = a[0];
		String address = a[1];
		int index = a[1].indexOf(';');
		//Via: SIP/2.0/UDP 210.14.64.87:5063;branch=z9hG4bK340cd4cf;rport 
		if( index != -1) {
			String add = address.substring(0, index);
			String[] c = add.split(":");
			ip = c[0];
			port = Integer.valueOf(c[1]);
			received = address.substring(index + 1);
		} else {
			String[] c = address.split(":");
			ip = c[0];
			port = Integer.valueOf(c[1]);
		}
	}
	
	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
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

	public String getReceived() {
		return received;
	}

	public void setReceived(String received) {
		this.received = received;
	}

	public String getString(){
		String a = "";
		a = version+" "+ ip+":"+port;
		if(received != null){
			a += ";"+received;
		}
		return a;
	}
}
