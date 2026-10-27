package com.m7.cc.command;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;



public interface PacketListener {
	public void processAction(C5Action action);
	public void processResponse(C5Response response);
	public void processEvent(C5Event event);
}
