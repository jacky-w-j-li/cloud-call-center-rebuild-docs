package com.m7.cc.interfaces;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.m7.cc.db.mongo.MongoConnect;
import com.m7.cc.json.JSONWriter;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.log.IceLogger;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;


public class DispatcherResend implements Runnable {
	private static Logger rensendLog ;
	private DBObject event;
	private HashMap<String, String> levelmap;
	public DispatcherResend(DBObject event,HashMap<String, String> levelmap,Logger rensendLog) {
		this.event = event;
		this.levelmap = levelmap;
		this.rensendLog = rensendLog;
	}
	@Override
	public void run() {
		sendrun(event);
	}
	
	private boolean sendrun(DBObject event) {
		String res = "";
		try {
			String eventUrl1 = event.get("url").toString().split("\\?")[0];
			String eventUrl2 = urlencode(event.get("url").toString().split("\\?")[1]);
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
//					MongoProvider.getInstance().remove("app_event_dispatcher_resend", findEvent);
				return true;
			}else{
				//resend failed
				BasicDBObject doc = new BasicDBObject();
				doc.put("$set", new BasicDBObject().append("level", levelmap.get(currentLevel)).append("lock", false) );
				MongoConnect.getInstance().getReportDB("cdr").getCollection("app_event_dispatcher_resend", BasicDBObject.class).updateOne(findEvent, doc);
//					MongoProvider.getInstance().update("app_event_dispatcher_resend", findEvent, doc);
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
//				MongoProvider.getInstance().update("app_event_dispatcher_resend", findEvent, doc);
			rensendLog.log(Level.WARNING, "EventDispatcher ReSend Event failed id=" + event.get("_id").toString(), e);
		}
		return false;
	}
	public static String urlencode(String url){
		String newurl = "";
		String[] strs= url.split("&");
		for (int i = 0; i < strs.length; i++) {
			
			try {
				newurl+=URLEncoder.encode(strs[i].split("=")[0], "UTF-8")+"=";
				if(strs[i].split("=").length>1){
					newurl+=URLEncoder.encode(strs[i].split("=")[1], "UTF-8");
				}
			} catch (UnsupportedEncodingException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			newurl+="&";
			
		}
		newurl = newurl.substring(0, newurl.length()-1);
		return newurl;
	}

	
}
