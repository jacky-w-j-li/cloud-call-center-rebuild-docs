package com.m7.cc.asterisk.cdr.server;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.asterisk.cdr.server.handler.CDRHandler;
import com.m7.cc.asterisk.cdr.server.handler.CDRLibraryHandler;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoConnect;
import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;

public class CDREventProcessor {
	private String pbx;
	private Thread dataThread;
	private static Logger log = Logger.getLogger(CDREventProcessor.class.getName());
	private Logger eventLog = null;
	private Vector<C5Event> event_buffer = new Vector<C5Event>();
	private CDRHandler cdrHandler = null;
	
	public CDREventProcessor(String pbx, CDRHandler cdrHandler){
		this.pbx = pbx;
		String cdrDir = CdrServerConfig.getInstance().getLogDir();
		if (!cdrDir.endsWith("/")) {
			cdrDir += "/";
		}
		eventLog = IceLogger.getLogger(cdrDir + pbx + "/", pbx, "ALL", false, 20);
		this.cdrHandler = cdrHandler;
		updateData();
	}
	
	public void updateData() {
		dataThread = new Thread(pbx+" Data thread") {
			public void run() {
				updateCdrToDatabase();
			}
		};
		// dataThread.setDaemon(true);
		dataThread.start();
	}

//	public void processDatabaseReconnected() {
//		log.info("Reconnected to db, process buffered event");
//		synchronized (event_buffer) {
//			if (event_buffer.size() > 0) {
//				event_buffer.notifyAll();
//			}
//		}
//	}
	
	public void processEvent(C5Event event) {
		eventLog.info(event.getJsonString());
		event_buffer.add(event);
	}

	private void updateCdrToDatabase() {
		C5Event event = null;
		while (true) {
			try {
				if (event_buffer.size() > 0)
					event = event_buffer.remove(0);
				else {
					Thread.sleep(10);
				}
				if (event != null) {
					eventLog.info("get cdr from event_buffer:" + event.getJsonString());
					if (event.getEventName().equalsIgnoreCase(
							Fields.PeerCallCdr)) {
						C5PeerCallRecord cdr = new C5PeerCallRecord();
						cdr.setValues(event.getParameters());
						cdrHandler.handlePeerCallCdr(cdr);
					} else if (event.getEventName().equalsIgnoreCase(
							Fields.ChannelCdr)) {
						C5ChannelRecord cdr = new C5ChannelRecord();
						cdr.setValues(event.getParameters());
						cdrHandler.handleChannelCdr(cdr);
					} else if (event.getEventName().equalsIgnoreCase(
							Fields.PeerCdr)) {
						C5PeerRecord cdr = new C5PeerRecord();
						cdr.setValues(event.getParameters());
						cdrHandler.handlePeerCdr(cdr);
					} 
//					else if (event.getEventName().equalsIgnoreCase(
//							Fields.QueueEntryCdr)) {
//						C5QueueEntryRecord cdr = new C5QueueEntryRecord();
//						cdr.setValues(event.getParameters());
//						saved = dbProvider.saveEntryRecord(cdr);
//					} else if (event.getEventName().equalsIgnoreCase(
//							Fields.QueueMemberCdr)) {
//						C5QueueMemberRecord cdr = new C5QueueMemberRecord();
//						cdr.setValues(event.getParameters());
//						saved = dbProvider.saveMemberRecord(cdr);
//					} 
					else if (event.getEventName().equalsIgnoreCase(
							Fields.Investigate)) {
						C5Investigate cdr = new C5Investigate();
						cdr.setValues(event.getParameters());
						cdrHandler.handleInvestigateCdr(cdr);
					} else if (event.getEventName().equalsIgnoreCase(Fields.BatchDialoutCdr)){
						C5BatchDialoutRecord cdr = new C5BatchDialoutRecord();
						cdr.setValues(event.getParameters());
						cdrHandler.handleBatchDialoutCdr(cdr);
					} else if(event.getEventName().equalsIgnoreCase("AutoCall")) {
						String numType = "";
						if(event.containKey(Fields.NumType)){
							numType = event.getStringValue(Fields.NumType);
						}
						//if auto call import num ,we record cdr.
						String reason = event.getStringValue("Reason");
						if(numType.equals("import")){
							BasicDBObject ref = new BasicDBObject();
							ref.put("account", event.getStringValue(Fields.Account));
							ref.put("reason", "none");
							ref.put("_id", event.getStringValue("_id"));
							
							DBObject set = new BasicDBObject();
							set.put("beginTime", getFormatTime(event.getStringValue(Fields.BeginTime)));
							set.put("beginTimestamp", event.getStringValue(Fields.BeginTime));
							set.put("reason", reason);
							if(reason.equals("4")) {
								set.put("endTime", getFormatTime(event.getStringValue(Fields.EndTime)));
								set.put("endTimestamp", event.getStringValue(Fields.EndTime));
								int duration = (Integer.valueOf(event.getStringValue(Fields.EndTime).substring(0, event.getStringValue(Fields.EndTime).indexOf('.'))) 
										- Integer.valueOf(event.getStringValue(Fields.BeginTime).substring(0, event.getStringValue(Fields.BeginTime).indexOf('.'))));
								set.put("duration", duration);
							}
							BasicDBObject doc = new BasicDBObject();
							doc.put("$set", set);
							MongoProvider.getInstance().update("cc_autocall","app_autocall_new", ref, doc);
						}
						//update task dial count and dealing count.
						String taskId = null;
						if(event.containKey("taskId"))
							taskId = event.getStringValue("taskId");
						if(taskId != null && !taskId.equals("")){
							BasicDBObject findTask = new BasicDBObject();
							findTask.put("_id", taskId);
							DBObject taskDoc = new BasicDBObject();
							boolean isUpdate = false;
							if(reason.equals("4")){
								taskDoc.put("dialNum",1);
								isUpdate = true;
							} else if(reason.equals("3")){
								taskDoc.put("notDialNum",1);
								isUpdate = true;
							}
							if(isUpdate){
								MongoProvider.getInstance().update("cc_autocall_task"
										,"app_autocall_task", findTask, new BasicDBObject("$inc",taskDoc), WriteConcern.SAFE);								
							}
						}
						try{
							//to add numLibrary
							HashMap<String,String> libraryNumMap = new HashMap<String, String>();
							if(reason.equals("4")){
								libraryNumMap.put("canCall", "true");
								libraryNumMap.put("status", Fields.dealing);
							} else if(reason.equals("3") || reason.equals("8")){
								libraryNumMap.put("canCall", "true");
								libraryNumMap.put("status", Fields.notDeal);
							}
							libraryNumMap.put("_id", event.getStringValue(Fields.CalledNo));
							if(event.containKey(Fields.Province)){
								if(event.getStringValue(Fields.Province).contains("\\")){
									libraryNumMap.put("province", Utils.unicodeToGB(event.getStringValue(Fields.Province)));
								}else{
									libraryNumMap.put("province", event.getStringValue(Fields.Province));
								}
							}
							if(event.containKey(Fields.District)){
								if(event.getStringValue(Fields.District).contains("\\")){
									libraryNumMap.put("district", Utils.unicodeToGB(event.getStringValue(Fields.District)));
								}else{
									libraryNumMap.put("district", event.getStringValue(Fields.District));
								}
							}
							if(event.containKey(Fields.DistrictCode))
								libraryNumMap.put("districtCode", event.getStringValue(Fields.DistrictCode));
							libraryNumMap.put("lastCallTime", getFormatTime(event.getStringValue(Fields.BeginTime)));
							if(!libraryNumMap.containsKey("canCall")){
								libraryNumMap.put("canCall", "false");
							}
							CDRLibraryHandler.processCdrLibrary(libraryNumMap);
							//for web site cdr count
							String today = Utils.getDate("yyyy-MM-dd");
							BasicDBObject updateDoc = new BasicDBObject();
							if(reason.equals("4")){
								updateDoc.put("$inc", new BasicDBObject("autoCallSuccess",1).append("autoCall", 1));
							}else{
								updateDoc.put("$inc", new BasicDBObject("autoCall", 1));
							}
							MongoProvider.getInstance().update(Fields.DB_NAME_BILL, "web_site_cdr_count", new BasicDBObject("_id",today), updateDoc, true);								
						}catch(Exception e){
							event = null;
							log.log(Level.WARNING, "==AUTOCALL==$inc==Exception"+e.getMessage(), e);
						}
					}else if(event.getEventName().equalsIgnoreCase(Fields.EventDispatcherResend)){
						String url = event.getStringValue("url");
						BasicDBObject newResend = new BasicDBObject();
						newResend.put("_id",Utils.getUniqueid());
						newResend.put("url",url);
						newResend.put("failedTime",Utils.getDate("yyyy-MM-dd HH:mm:ss"));
						newResend.put("failedTimeStamp",Utils.getCurrentTimestampSecond());
						newResend.put("level", "10");
						newResend.put("lock", false);
						newResend.put("ip", url.substring(0, url.indexOf("?")));
						MongoConnect.getInstance().getReportDB("cdr").getCollection("app_event_dispatcher_resend", BasicDBObject.class).insertOne(newResend);
//						MongoProvider.getInstance().insert("app_event_dispatcher_resend",newResend);
					}else {
//						log.warning("Unknow event: " + event.getJsonString());
					}
					event = null;
				}
			} catch (Exception e) {
				log.log(Level.WARNING, e.getMessage(), e);
			}
		}
	}
	
	private String getFormatTime(String timestamp) {
		Timestamp t = Utils.getTimestamp(timestamp);
		return Utils.getDate(t.getTime());
	}
}
