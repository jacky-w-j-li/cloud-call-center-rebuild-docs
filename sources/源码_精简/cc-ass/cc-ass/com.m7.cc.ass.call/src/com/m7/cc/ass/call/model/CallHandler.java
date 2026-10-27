package com.m7.cc.ass.call.model;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;

public interface CallHandler {
	
	public C5Response handleAction(Call call, C5Action action);
	
	public void handleEvent(Call call, C5Event event);
}
