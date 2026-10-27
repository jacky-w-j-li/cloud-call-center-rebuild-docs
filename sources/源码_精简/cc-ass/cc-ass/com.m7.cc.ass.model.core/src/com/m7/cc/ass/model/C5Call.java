package com.m7.cc.ass.model;

import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;

public interface C5Call {
	
	public C5Response handleAction(C5Action action);
	
	public void handleEvent(C5Event event);
	
	public C5Channel getMainChannel();
	
	public void setMainChannel(C5Channel mainChannel);
	
	public C5Channel getSecondChannel();
	
	public void setSecondChannel(C5Channel secondChannel);
	
	public C5Channel getThirdChannel();
	
	public void setThirdChannel(C5Channel thirdChannel);
	
	public String getRoom();
	
	public String getState();
	
	public void setState(String state);
}
