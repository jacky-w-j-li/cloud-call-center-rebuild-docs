package com.dishui.manager.command;

import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Event;
import com.dishui.manager.command.C5Response;

/**
 * 
 * @author Cai Zhibin
 *
 */
public interface PacketListener {
	public void processAction(C5Action action);
	public void processResponse(C5Response response);
	public void processEvent(C5Event event);
}
