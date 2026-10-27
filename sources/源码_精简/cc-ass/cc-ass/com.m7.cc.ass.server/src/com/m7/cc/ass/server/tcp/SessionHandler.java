package com.m7.cc.ass.server.tcp;

import java.util.Hashtable;
import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.koala.smart.server.listener.DataListener;
import com.koala.smart.server.listener.SessionListener;

public class SessionHandler implements DataListener, SessionListener{
	
	private Hashtable<String, AssTcpSession> sessions = new Hashtable<String, AssTcpSession>();
	
	private static Logger log = Logger.getLogger(SessionHandler.class.getName());
	
	public SessionHandler(){
	}
	
	public void addSession(String sessionID, AssTcpSession session) {
		sessions.put(sessionID, session);
	}

	public void removeSession(String sessionID) {
		sessions.remove(sessionID);
	}

	public Hashtable<String, AssTcpSession> getSessions() {
		return sessions;
	}
	
	public void handleByte(Session session, byte[] data) {
		// TODO Auto-generated method stub
		
	}

	public void newSession(Session session) {
		log.info("new ass tcp connection: "+session.getIp());
		AssTcpSession assSession = new AssTcpSession(session);
		sessions.put(session.getId(), assSession);
	}

	public void sessionClosed(Session session) {
		log.info("ass tcp connection closed: "+session.getIp());
		AssTcpSession assSession = sessions.get(session.getId());
		if(assSession != null){
			assSession.logoff("timeout");
			assSession.close();
		}
	}

	public void sessionTimeout(Session session, long arg1) {
		log.info("ass tcp connection timeout: "+session.getIp());
		AssTcpSession assSession = sessions.get(session.getId());
		if(assSession != null){
			assSession.logoff("timeout");
			assSession.close();
		}
		session.close();
	}

	public void handleString(Session session, String data) {
		AssTcpSession assSession = sessions.get(session.getId());
		if(assSession != null){
			assSession.processData(data);
		} else {
			log.warning("no session found for ["+session.getIp()+"]: \r\n" + data);
		}
	}

}
