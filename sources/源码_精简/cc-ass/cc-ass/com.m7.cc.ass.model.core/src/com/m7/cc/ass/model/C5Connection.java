package com.m7.cc.ass.model;

import com.m7.cc.command.C5Event;

public abstract class C5Connection {
	
	public abstract void kick(String comments);
	
	public void close(){
		
	}
	
	public abstract void sendEvent(C5Event event);
}
