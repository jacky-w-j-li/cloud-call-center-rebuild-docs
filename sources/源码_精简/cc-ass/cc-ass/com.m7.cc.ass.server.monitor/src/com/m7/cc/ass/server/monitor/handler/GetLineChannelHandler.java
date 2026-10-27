package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import com.m7.cc.ass.gateway.GWChannel;
import com.m7.cc.ass.gateway.GateWayActivator;
import com.m7.cc.ass.server.monitor.model.LineCount;
import com.m7.cc.ass.server.monitor.util.MonitorFields;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.log.IceLogger;

public class GetLineChannelHandler {
	
	private static Logger log;
	
	public static C5Response getLineChannel(C5Action action) {
//		if(log == null) {
//			log = IceLogger.getLogger("/var/log/ass",
//					"linechannel_request", "ALL", false);
//		}
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			Map<String, LineCount> lines = new HashMap<String, LineCount>();
			List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();

			if (GateWayActivator.getHandler() != null) {
				HashMap<String, GWChannel> gwChannels = GateWayActivator
						.getHandler().getChannels();
				if (gwChannels != null) {
					for (Map.Entry<String, GWChannel> entry : gwChannels
							.entrySet()) {
						try {
							if(entry.getValue().getLine() != null) {
								LineCount lineCount = lines.get(entry.getValue().getLine());
								if (lineCount == null) {
									lineCount = new LineCount(entry.getValue().getLine());
									lines.put(entry.getValue().getLine(), lineCount);
								}
								if(entry.getValue().getChannelType() != null) {
									if (entry.getValue().getChannelType().equals(MonitorFields.Normal)) {
										lineCount.setNormal(lineCount.getNormal() + 1);
									} else if (entry.getValue().getChannelType().equals(MonitorFields.Dialout)) {
										lineCount.setDialout(lineCount.getDialout() + 1);
									} else if (entry.getValue().getChannelType().equals(MonitorFields.Transfer)) {
										lineCount.setTransfer(lineCount.getTransfer() + 1);
									}
								} else {
//									log.warning("-1-" + entry.getValue().getChannelName() + "/" + entry.getValue().getChannelType());
								}
							} else {
//								log.warning("-2-" + entry.getValue().getChannelName() + "/" + entry.getValue().getDPrefix()); 
							}							
						} catch(Exception e) {
							continue;
						}
					}
				} else {
//					log.warning("gwChannels is null");
				}
			} else {
//				log.warning("GateWayActivator's Handler is null");
			}
			
			for (Map.Entry<String, LineCount> line : lines.entrySet()) {
				LineCount lineCount = line.getValue();
				C5Event event = lineCount.getStateEvent();
				events.add(event.getParameters());
			}
			response.addParameter(Fields.Event, events);
			response.setSucceed(true);

		} catch (Exception e) {
			//log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
