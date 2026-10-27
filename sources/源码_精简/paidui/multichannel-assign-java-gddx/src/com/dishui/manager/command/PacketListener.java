package com.dishui.manager.command;

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
