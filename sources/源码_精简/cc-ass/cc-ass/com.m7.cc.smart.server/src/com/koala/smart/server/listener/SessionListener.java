package com.koala.smart.server.listener;

import com.koala.smart.server.Session;

/**
 * 
 * @author caif
 *
 */
public interface SessionListener {
	
	/**
	 * Method that will be called every time when a session is connected.
	 * @param session
	 */
	public void newSession(Session session);
	
	public void sessionClosed(Session session);
	
	public void sessionTimeout(Session session, long time);
}
