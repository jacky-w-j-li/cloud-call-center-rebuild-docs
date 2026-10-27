package com.m7.cc.ass.call.service;

import java.util.Hashtable;
import java.util.Iterator;

import com.m7.cc.ass.call.model.Call;

public class CallProvider {

	private static CallProvider instance;
	
	private Hashtable<String, Call> calls = new Hashtable<String, Call>();
	
//	private static Logger log = Logger.getLogger(CallProvider.class.getName());
	
	private CallProvider(){
		instance = this;
	}
	
	public static CallProvider getInstance() {
		if(instance == null)
			new CallProvider();
		return instance;
	}

	public void addCall(String room, Call call) {
		synchronized (calls) {
			calls.put(room, call);
		}
	}
	
	public Call getCallViaRoomnum(String room) {
		synchronized (calls) {
			Iterator<Call> it = calls.values().iterator();
			while(it.hasNext()){
				Call call = it.next();
				if(call.getRoom().equals(room))
					return call;
			}
		}
		return null;
	}
	
	public Call removeCall(String room) {
		if(calls.containsKey(room)) {
			synchronized (calls) {
				return calls.remove(room);
			}
		} else return null;
	}
}
