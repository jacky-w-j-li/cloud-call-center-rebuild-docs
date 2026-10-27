package com.m7.cc.asterisk.ami;

import com.m7.cc.asterisk.ami.action.AsteriskEvent;

/**
 * This interface is implemented by classes observing Asterisk Events
 * 
 */
public interface EventListener {
	/**
	 * Recieve an AsteriskServerEvent from a EventObservable
	 * 
	 * @param event
	 *            Asterisk Server Event
	 */
	public void processEvent(AsteriskEvent event);
	
	public void connectionClosed();
}
