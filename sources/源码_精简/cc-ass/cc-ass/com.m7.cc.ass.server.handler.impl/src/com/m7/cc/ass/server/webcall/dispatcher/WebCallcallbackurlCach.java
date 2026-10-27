package com.m7.cc.ass.server.webcall.dispatcher;

import java.util.HashMap;
import java.util.Hashtable;


public class WebCallcallbackurlCach {

	private static Hashtable<String,HashMap<String, Object>> callbackurlcach = new Hashtable<String,HashMap<String, Object>>();

	public synchronized static void add(String key, HashMap value) { 
		callbackurlcach.put(key, value); 
		} 
	public synchronized  static HashMap getWebCallcallbackurlcach(String key) {
		return 	callbackurlcach.remove(key);
	} 
}
