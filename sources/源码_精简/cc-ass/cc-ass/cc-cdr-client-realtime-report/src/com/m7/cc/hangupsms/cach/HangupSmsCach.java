package com.m7.cc.hangupsms.cach;

import java.util.Hashtable;

import com.mongodb.DBObject;

public class HangupSmsCach {
	
	private static Hashtable<String,DBObject> hangupsmscach = new Hashtable<String,DBObject>();

	public synchronized static void add(String key, DBObject value) { 
		hangupsmscach.put(key, value); 
		} 
	public synchronized  static DBObject getHangupsmscach(String key) {
		DBObject obj = hangupsmscach.get(key); 
		if (obj == null) { 
		return null; 
		} 
		return obj;
	} 
}
