package com.m7.cc.ass.server.monitor.util;

public class Utils {
	public static boolean isValidIPAddress(String str) {
		if(str.matches("[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}"))
			return true;
		return false;
	}
	
	//±»»ÁSIP/10.1.1.177:5060-17dcfc50
	public static boolean idValidChannel(String str) {
		return str.matches("(.*)[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\:[0-9]{4}(.*)");
	}
	
	public static void main(String args[]) {
		System.out.println(Utils.idValidChannel("10.1.1.177"));
	}
}
