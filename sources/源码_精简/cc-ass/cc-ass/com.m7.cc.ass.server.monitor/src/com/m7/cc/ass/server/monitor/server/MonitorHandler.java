package com.m7.cc.ass.server.monitor.server;

import java.util.Hashtable;
import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.koala.smart.server.listener.DataListener;
import com.koala.smart.server.listener.SessionListener;

public class MonitorHandler implements DataListener, SessionListener {
	private Hashtable<String, MonitorSession> sessions = new Hashtable<String, MonitorSession>();

	private static final Logger log = Logger.getLogger(MonitorHandler.class.getName());
	
	public void handleByte(Session session, byte[] command) {
		// TODO Auto-generated method stub

	}

	public void handleString(Session session, String command) {
		
		if(sessions.containsKey(session.getId())){
			sessions.get(session.getId()).processData(command);
		} else {
			log.warning("Get command from ["+session.getId()+"] which is not in our cacher");
		}
	}

	public void newSession(Session session) {
		log.fine("New session ["+session.getId()+"]");
		sessions.put(session.getId(), new MonitorSession(session.getId(), session));
	}

	public void sessionClosed(Session session) {
		log.fine("Session closed ["+session.getId()+"]");
		sessions.remove(session.getId());
	}

	public void sessionTimeout(Session session, long time) {
		log.fine("Session timeout ["+session.getId()+"]");

	}

	public void close(){
		sessions.clear();
	}
}
