package com.m7.cc.asterisk.fastagi;

import java.util.Hashtable;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.m7.cc.agi.AgiActivator;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class AgiSession implements Runnable {
	private Session session;
	private String data = "";
	private Object dataLock = new Object();
	private Object lock = new Object();
	private String result = "";
	private boolean closed = false;

	private static Logger log = AgiSessionHandler.log;

	public AgiSession(Session session) {
		this.session = session;
	}

	public Session getSession() {
		return session;
	}

	public void handleData(String d) {
		this.data += d;
		if(data.endsWith("\n\n")){
			
		} else if (!this.data.startsWith("agi") && this.data.endsWith("\n")) {
			synchronized (lock) {
				result = data;
				data = "";
				log.info("Get agi response: " + "\n"
						+ result);
				lock.notifyAll();
			}
		}
	}

	public String send(String data) {
		if (closed)
			return "";
		synchronized (lock) {
			try {
				log.info("Send agi command: " + data);
				session.send(data + "\n");
				lock.wait(3000);
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
			return result;
		}
	}

	public void close() {
		closed = true;
		if (session != null) {
			try {
				session.lingerClose();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
			session = null;
		}
	}

	@Override
	public void run() {
		try {
			synchronized (dataLock) {
				if (data.endsWith("\n\n")) {
					log.info("Get agi request: " + this.session.getId() + "\n"
							+ data);
					Hashtable<String, String> params = new Hashtable<String, String>();
					String[] lines = this.data.split("\n");
					this.data = "";
					for (int i = 0; i < lines.length; i++) {
						int index = lines[i].indexOf(":");
						params.put(lines[i].substring(0, index).trim(),
								lines[i].substring(index + 1).trim());
					}
					String url = params.get("agi_network_script");
					url = url.substring(0, url.indexOf('?'));
					C5Action action = new C5Action(url, Utils.getSynActionID(url));
					action.setValues(params);
					action.addParameter(Fields.Session, this);
					AgiActivator.getHandler().handle(action);
					log.info("Handle action: " + action.getActionName());
				} 
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "data error ", e);
			close();
		}
	}
}
