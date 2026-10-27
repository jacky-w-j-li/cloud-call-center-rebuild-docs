package com.m7.cc.ass.server.http;

import java.util.Vector;

/**
 * This item is a state string queue, which is identified by id.
 * The [id] of this class is made up with {exten@asterisk_address}
 * @author Cai Zhibin 2009-6-24
 *
 */
public class StateQueue {
	private String id;
	Vector<String> states = new Vector<String>();
	
	public StateQueue(String id){
		this.id = id;
	}
	
	public String getId(){
		return id;
	}
	
	public boolean hasNext(){
		if(states == null)
			return false;
		if(states.size() > 0)
			return true;
		else return false;
	}
	
	public String popState(){
		if(states == null)
			return null;
		synchronized (states) {
			if(states.size() > 0)
				return states.remove(0);
			else return null;
		}
	}
	
	/**
	 * Pop all state string, splited with ','
	 * @return
	 */
	public String popAllState() {
		String a = "[]";
		synchronized (states) {
			if (states.size() > 0 && states.size() <= 100){
				a = states.toString();
				states.clear();
			}else if(states.size() != 0){
				Vector<String> tempStates = new Vector<String>();
		        for(int i=0 ; i<100 ; i++){
		        	if(states.size() > 1){
		        		tempStates.add(states.remove(0));		        		
		        	}else{
		        		break;
		        	}
		        }
		        a = tempStates.toString();
			}
		}
		return a;
	}
	
	public void pushState(String state){
		if(states == null)
			return;
		synchronized (states) {
			states.add(state);
		}
	}
	
	public void clear(){
		synchronized (states) {
			states.clear();
		}
	}
	
	public void destruct(){
		states.clear();
		states = null;
	}
}
