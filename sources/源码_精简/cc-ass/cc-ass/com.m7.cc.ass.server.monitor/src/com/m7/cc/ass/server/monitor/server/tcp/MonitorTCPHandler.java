package com.m7.cc.ass.server.monitor.server.tcp;

import java.util.Hashtable;
import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.koala.smart.server.listener.DataListener;
import com.koala.smart.server.listener.SessionListener;

public class MonitorTCPHandler implements DataListener, SessionListener {

	private Hashtable<String, MonitorTCPSession> sessions = new Hashtable<String, MonitorTCPSession>();

	private static final Logger log = Logger.getLogger(MonitorTCPHandler.class.getName());
	
	@Override
	public void handleByte(Session session, byte[] command) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void handleString(Session session, String command) {
		if(sessions.containsKey(session.getId())){
			sessions.get(session.getId()).processData(command);
		} else {
			log.warning("Get command from ["+session.getId()+"] which is not in our cacher");
		}
	}

	@Override
	public void newSession(Session session) {
		log.fine("New session ["+session.getId()+"]");
		sessions.put(session.getId(), new MonitorTCPSession(session.getId(), session));
	}

	@Override
	public void sessionClosed(Session session) {
		log.fine("Session closed ["+session.getId()+"]");
		sessions.remove(session.getId());
	}

	@Override
	public void sessionTimeout(Session session, long time) {
		// TODO Auto-generated method stub
		
	}

}
