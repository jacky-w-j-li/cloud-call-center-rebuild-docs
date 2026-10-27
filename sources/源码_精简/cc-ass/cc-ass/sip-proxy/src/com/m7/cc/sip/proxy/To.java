package com.m7.cc.sip.proxy;

public class To {
	private String displayName = "";
	private String protocl = "sip";
	private String exten;
	private String ip;
	private int port;
	
	//<sip:5002@10.8.8.214:6071>
	//or sip:21401846@10.8.3.15:6070;tag=as72fdc55d
	//<sip:21401846@10.2.10.22:56827;LINEID=c8713b55af73>
	//To: sip:10.8.3.15:6070
	//To: sip:21401846@10.8.3.15:6070
	public To(String value){
		if(value.startsWith("\"")){
			displayName = value.substring(value.indexOf('"'), value.lastIndexOf('"')+1);
		}
		String uri = "";
		if(value.indexOf('<') != -1){
			uri = value.substring(value.indexOf(':')+1, value.indexOf('>'));
			if(uri.indexOf(';') != -1) {
				uri = uri.substring(0, uri.indexOf(';'));
			}
		} else {
			if(value.indexOf(';') != -1){
				uri = value.substring(value.indexOf(':')+1, value.indexOf(';'));
			} else {
				uri = value.substring(value.indexOf(':')+1);
			}
		}
		String[] a = null;
		if(uri.indexOf('@') != -1) {
			a = uri.split("@");
		} else {
			a = new String[]{"", uri};
		}
		if(a[1].indexOf(':') != -1){
			String[] b = a[1].split(":");
			ip = b[0];
			port = Integer.valueOf(b[1]);
		} else {
			port = -1;
			ip = a[1];
		}
		exten = a[0];
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getProtocl() {
		return protocl;
	}

	public void setProtocl(String protocl) {
		this.protocl = protocl;
	}

	public String getExten() {
		return exten;
	}

	public void setExten(String exten) {
		this.exten = exten;
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

	public String getString() {
		String a = "";
		a = displayName + "<sip:"+exten+"@"+ip;
		if(port != -1) {
			a += ":"+port+">";
		} else {
			a += ">";
		}
		return a;
	}
}
