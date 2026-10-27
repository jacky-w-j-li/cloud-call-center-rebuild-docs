package com.m7.monitor.sip;

/**
 * 
 * @author Caif
 * @version 1.0, 2008-1-9
 */
public class IceSipURI {
	private String displayName = "";
	private String extension = "7koala";
	private String password = "";
	private String ipAddress;
	private int port;
	
	/**
	 * 
	 * @param extension
	 * @param ipAddress
	 * @param port this should be > 0
	 */
	public IceSipURI(String extension, String ipAddress, int port){
		this.extension = extension;
		this.ipAddress = ipAddress;
		this.port = port;
	}
	
	public String toString(){
		String result = "";
		if(displayName != null && !displayName.equalsIgnoreCase(""))
			result = result + "\""+displayName+"\"";
		result = result+"<sip:"+extension+"@"+ipAddress;
		if(port > 0)
			result = result+":"+port+">";
		else result = result+">";
		return result;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getExtension() {
		return extension;
	}

	public String getIpAddress() {
		return ipAddress;
	}

	public int getPort() {
		return port;
	}

	public void setExtension(String extension) {
		this.extension = extension;
	}

}
