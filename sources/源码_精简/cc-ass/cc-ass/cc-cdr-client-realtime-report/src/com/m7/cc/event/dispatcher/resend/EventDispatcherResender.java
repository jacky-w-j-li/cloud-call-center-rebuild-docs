package com.m7.cc.event.dispatcher.resend;

import java.net.URLEncoder;
import java.util.HashMap;
import java.util.List;
import java.util.Vector;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.m7.cc.db.mongo.MongoConnect;
import com.m7.cc.interfaces.DispatcherResend;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.log.IceLogger;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class EventDispatcherResender{
	
	public static Vector<DBObject> eventBuffer = new Vector<DBObject>();
	private static Logger rensendLog;
	private boolean running = true;
	private HashMap<String, String> levelMap = new HashMap<String, String>();
	private static ExecutorService executor;

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
		executor =  Executors.newCachedThreadPool();
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
//					send(event);
					executor.execute(new DispatcherResend(event,levelMap,rensendLog));
					eventBuffer.remove(0);
				}else{
					Thread.sleep(2000);
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
		String res = "";
		try {
			String eventUrl1 = event.get("url").toString().split("\\?")[0];
			String eventUrl2 = URLEncoder.encode(event.get("url").toString().split("\\?")[1], "UTF-8");
			String eventUrl = eventUrl1 + "?" + eventUrl2;
			String currentLevel = event.get("level").toString();
			BasicDBObject findEvent = new BasicDBObject();
			findEvent.put("_id", event.get("_id").toString());
			//String res = HttpProvider.sendGet(eventUrl);
			String address = eventUrl.split("\\?")[0];
			String param = eventUrl.split("\\?")[1];
			if (address != null && address.indexOf("[post]") != -1) {
				rensendLog.log(Level.INFO,"begin resend url="+eventUrl);
				res = HttpProvider.sendPost(address,param.getBytes("UTF-8"));
				rensendLog.log(Level.INFO,"end resend url="+eventUrl+"......res="+res);
			} else {
				rensendLog.log(Level.INFO,"begin resend url="+eventUrl);
				res = HttpProvider.sendGet(eventUrl, 3);
				rensendLog.log(Level.INFO,"end resend url="+eventUrl+"......res="+res);
			}
			if(res.trim().equals("200")){
				//resend success to delete db.
				MongoConnect.getInstance().getReportDB("cdr").getCollection("app_event_dispatcher_resend", BasicDBObject.class).deleteOne(findEvent);
//				MongoProvider.getInstance().remove("app_event_dispatcher_resend", findEvent);
				return true;
			}else{
				//resend failed
				BasicDBObject doc = new BasicDBObject();
				doc.put("$set", new BasicDBObject().append("level", levelMap.get(currentLevel)).append("lock", false) );
				MongoConnect.getInstance().getReportDB("cdr").getCollection("app_event_dispatcher_resend", BasicDBObject.class).updateOne(findEvent, doc);
//				MongoProvider.getInstance().update("app_event_dispatcher_resend", findEvent, doc);
			}
			if (eventUrl.indexOf("[post]") != -1) {
				String adres = eventUrl.substring(0,eventUrl.indexOf("[post]"));
				String parm = eventUrl.split("\\?")[1];
				rensendLog.log(Level.INFO, "Level "+ currentLevel +
						". EventDispatcher ReSend Event  : " + adres + ".result=" + res + "\r\n data:" + parm);
			} else {
				rensendLog.log(Level.INFO, "Level "+ currentLevel +". EventDispatcher ReSend Event  : " + eventUrl + ".result=" + res);
			}		
		} catch (Exception e) {
			String currentLevel = event.get("level").toString();
			BasicDBObject findEvent = new BasicDBObject();
			findEvent.put("_id", event.get("_id").toString());
			BasicDBObject doc = new BasicDBObject();
			doc.put("$set", new BasicDBObject().append("level", "end").append("lock", false) );
			MongoConnect.getInstance().getReportDB("cdr").getCollection("app_event_dispatcher_resend", BasicDBObject.class).updateOne(findEvent, doc);
//			MongoProvider.getInstance().update("app_event_dispatcher_resend", findEvent, doc);
			rensendLog.log(Level.WARNING, "EventDispatcher ReSend Event failed id=" + event.get("_id").toString(), e);
		}
		return false;
	}
	
	public void close() {
		running = false;
	}
	
	public int getBufferSize(){
		return eventBuffer.size();
	}

	
	public static void main(String[] args) {
		try {
			String url1 = "http://127.0.0.1:4000/service?CallNo=18971291285&CallSheetID=78156f90-bba0-494b-8ebb-c36e2b20dfe3&CalledNo=02752360278&CallID=cc-ali-0-1469317912.288124&CallType=normal&RecordFile=&Ring=2016-07-24 07:51:52&Begin=&End=2016-07-24 07:52:14&QueueTime=&Queue=&ActionID=&CallState=Hangup&State=leak&FileServer=http://121.41.19.95&CallStatus=leak&Province=湖北省&District=武汉市";
			String[] ab = url1.split("\\?");
			System.out.println(ab);
			String eventUrl1 = url1.split("\\?")[0];
			String eventUrl2 = URLEncoder.encode(url1.split("\\?")[1], "UTF-8");
			String eventUrl = eventUrl1 + "?" + eventUrl2;
			System.out.println(eventUrl);
			System.out.println(HttpProvider.sendGet(eventUrl));
			
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
