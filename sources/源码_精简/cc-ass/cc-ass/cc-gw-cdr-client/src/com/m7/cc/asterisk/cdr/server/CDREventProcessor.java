package com.m7.cc.asterisk.cdr.server;

import java.sql.Timestamp;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class CDREventProcessor {
	private Thread dataThread;
	private Logger log = Logger.getLogger(CDREventProcessor.class.getName());
	private Logger eventLog = null;
	private Vector<C5Event> event_buffer = new Vector<C5Event>();

	public CDREventProcessor() {
		eventLog = IceLogger.getLogger(CdrServerConfig.getInstance()
				.getLogDir(), "gateway", "ALL", false);
		updateData();
	}

	private void updateData() {
		dataThread = new Thread("Data thread") {
			public void run() {
				updateCdrToDatabase();
			}
		};
		dataThread.start();
	}

	private void updateCdrToDatabase() {
		C5Event event = null;
		while (true) {
			try {
				if (event_buffer.size() > 0)
					event = event_buffer.remove(0);
				else {
					Thread.sleep(500);
				}
				if (event != null) {
					if (event.getEventName().equalsIgnoreCase("GWChannel")) {
						String channelType = event
								.getStringValue(Fields.ChannelType);
						if (channelType.equals(Fields.dialout)
								|| channelType.equals(Fields.transfer)
								|| channelType.equals(Fields.normal)) {
							DBObject map = new BasicDBObject();
							map.put("_id", event.getStringValue(Fields.Uniqueid));
							map.put("account", event.getStringValue(Fields.Account));
							map.put("type", event.getStringValue(Fields.ChannelType));
							map.put("cid", event.getStringValue(Fields.FromCid));
							map.put("did", event.getStringValue(Fields.FromDid));
							map.put("beginTime", event.getStringValue(Fields.BeginTime));
							map.put("beginTimeDisplay", getFormatTime(event.getStringValue(Fields.BeginTime)));
							map.put("endTime", event.getStringValue(Fields.EndTime));
							map.put("endTimeDisplay", getFormatTime(event.getStringValue(Fields.EndTime)));
							map.put("route", event.getStringValue("route"));
							map.put("line", event.getStringValue("line"));
							map.put("product", event.getStringValue("product"));
							if(event.hasKey("agentId")){
								map.put("agentId", event.getStringValue("agentId"));
							}
							if(event.hasKey("call_sheet_ID")){
								if(!event.getStringValue("call_sheet_ID").equals("")){
									map.put("call_sheet_ID", event.getStringValue("call_sheet_ID"));	
								}
							}
							if(event.getStringValue("CallerProvince").contains("\\")){
								map.put("callerProvince", Utils.unicodeToGB(event.getStringValue("CallerProvince")));
							}else{
								map.put("callerProvince", event.getStringValue("CallerProvince"));								
							}
							if(event.getStringValue("CallerCity").contains("\\")){
								map.put("callerCity", Utils.unicodeToGB(event.getStringValue("CallerCity")));
							}else{
								map.put("callerCity", event.getStringValue("CallerCity"));								
							}
							map.put("callerDistrictNo", event.getStringValue("CallerDistrictNo"));
							if(event.getStringValue("CalleeProvince").contains("\\")){
								map.put("calleeProvince", Utils.unicodeToGB(event.getStringValue("CalleeProvince")));
							}else{							
								map.put("calleeProvince", event.getStringValue("CalleeProvince"));
							}
							if(event.getStringValue("CalleeCity").contains("\\")){
								map.put("calleeCity", Utils.unicodeToGB(event.getStringValue("CalleeCity")));
							}else{
								map.put("calleeCity", event.getStringValue("CalleeCity"));
							}
							map.put("calleeDistrictNo", event.getStringValue("CalleeDistrictNo"));
							MongoConnect.getInstance().getDB("bill_data").getCollection("bill_cdr").insert(map);
						}
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
	
	public void processDatabaseReconnected() {
		log.info("Reconnected to db, process buffered event");
		synchronized (event_buffer) {
			if (event_buffer.size() > 0) {
				event_buffer.notifyAll();
			}
		}
	}

	public void processEvent(C5Event event) {
		eventLog.info(event.getJsonString());
		event_buffer.add(event);
	}

}
