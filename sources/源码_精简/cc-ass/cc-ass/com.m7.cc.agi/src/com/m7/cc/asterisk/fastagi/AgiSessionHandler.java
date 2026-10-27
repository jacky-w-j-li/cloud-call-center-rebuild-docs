package com.m7.cc.asterisk.fastagi;

import java.util.Hashtable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.koala.smart.server.listener.DataListener;
import com.koala.smart.server.listener.SessionListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.util.log.IceLogger;

public class AgiSessionHandler implements DataListener, SessionListener{
	
	private Hashtable<String, AgiSession> sessions = new Hashtable<String, AgiSession>();
	
	public static Logger log = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
			"agi", "FINE", false);
	private ExecutorService excutor;
	
	public AgiSessionHandler(){
		log.info("Agi started");
		excutor = Executors.newCachedThreadPool();
	}
	
	public void addSession(String sessionID, AgiSession session) {
		synchronized (sessions) {
			sessions.put(sessionID, session);
		}
	}

	public void removeSession(String sessionID) {
		synchronized (sessions) {
			if(sessions.containsKey(sessionID))
				sessions.get(sessionID).close();
			sessions.remove(sessionID);
		}
	}
	
	public void handleByte(Session session, byte[] data) {
		// TODO Auto-generated method stub
		
	}

	public void newSession(Session session) {
		log.info("new agi tcp connection: "+session.getId());
		if(!sessions.containsKey(session.getId())){
			this.addSession(session.getId(), new AgiSession(session));
		}
	}

	public void sessionClosed(Session session) {
		log.info("agi tcp connection closed: "+session.getId());
		this.removeSession(session.getId());
	}

	public void sessionTimeout(Session session, long arg1) {
		log.info("agi tcp connection timeout: "+session.getId());
		this.removeSession(session.getId());
	}

	public void handleString(Session session, String data) {
		try{
			log.info("get agi data: "+session.getId()+"\r\n"+data);
			if(!sessions.containsKey(session.getId())){
				this.addSession(session.getId(), new AgiSession(session));
				log.info("Get data from new session: "+session.getId());
			}
			this.sessions.get(session.getId()).handleData(data);
			excutor.execute(this.sessions.get(session.getId()));
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
	}
	
	public void close() {
		try{
			sessions.clear();
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
	}

}
