package com.m7.cc.event.dispatcher.resend;

import java.util.HashMap;
import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoConnect;
import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.report.ReportCollector;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBObject;

public class EventDispatcherResender{
	
	public static Vector<DBObject> eventBuffer = new Vector<DBObject>();
	private static Logger rensendLog;
	private boolean running = true;
	private HashMap<String, String> levelMap = new HashMap<String, String>();	

	public EventDispatcherResender() {
		levelMap.put("10","30");
		levelMap.put("30","60");
		levelMap.put("60","600");
		levelMap.put("600","end");
		
		String cdrDir = CdrServerConfig.getInstance().getLogDir();
		if (!cdrDir.endsWith("/")) {
			cdrDir += "/";
		}
		rensendLog = IceLogger.getLogger(cdrDir + "EventDispatcherResend" + "/", 
				"EventDispatcherResend", "ALL", false, 20);
		
		Thread t = new Thread("EventDispatcher ReSend thread") {
			public void run() {
				sendEvent();
			}
		};
		t.start();
		rensendLog.info("EventDispatcher ReSend thread started!");
	}

	private void sendEvent() {
		while (running) {
			try {
				DBObject event = null;
				synchronized (eventBuffer) {
					if (eventBuffer.size() == 0) {
						eventBuffer.wait();
					} else {
						event = eventBuffer.get(0);
					}
				}
				if (event != null) {
					send(event);
					eventBuffer.remove(0);
				}else{
					Thread.sleep(5000);
				}
			} catch (Exception e) {
				rensendLog.log(Level.WARNING, "", e);
			}
		}
	}
	
	public static void addToBuf(List<DBObject> list) {
		synchronized (eventBuffer) {
			if (eventBuffer.size() > 1000000) {
				rensendLog.warning("EventDispatcher ReSend buffer is too large to cache any event");
			} else {
				eventBuffer.addAll(list);
			}
			eventBuffer.notifyAll();
		}
	}

	private boolean send(DBObject event) {
		try {
			String eventUrl = event.get("url").toString();
			String currentLevel = event.get("level").toString();
			DBObject findEvent = new BasicDBObject();
			findEvent.put("_id", event.get("_id").toString());
			String res = HttpProvider.sendGet(eventUrl);
			if(res.trim().equals("200")){
				//resend success to delete db.
				MongoProvider.getInstance().remove("app_event_dispatcher_resend", findEvent);
				return true;
			}else{
				//resend failed
				DBObject doc = new BasicDBObject();
				doc.put("$set", new BasicDBObject().append("level", levelMap.get(currentLevel)).append("lock", false) );
				MongoProvider.getInstance().update("app_event_dispatcher_resend", findEvent, doc);
			}
			rensendLog.log(Level.INFO, "Level "+ currentLevel +". EventDispatcher ReSend Event  : " + eventUrl + ".result=" + res);
		} catch (Exception e) {
			rensendLog.log(Level.WARNING, "EventDispatcher ReSend Event failed", e);
			String currentLevel = event.get("level").toString();
			DBObject findEvent = new BasicDBObject();
			findEvent.put("_id", event.get("_id").toString());
			DBObject doc = new BasicDBObject();
			doc.put("$set", new BasicDBObject().append("level", levelMap.get(currentLevel)).append("lock", false) );
			MongoProvider.getInstance().update("app_event_dispatcher_resend", findEvent, doc);
		}
		return false;
	}
	
	public void close() {
		running = false;
	}
	
	public int getBufferSize(){
		return eventBuffer.size();
	}

}
