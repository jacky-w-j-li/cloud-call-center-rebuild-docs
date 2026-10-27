package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import com.m7.cc.ass.gateway.GWChannel;
import com.m7.cc.ass.gateway.GateWayActivator;
import com.m7.cc.ass.server.monitor.model.GatewayCount;
import com.m7.cc.ass.server.monitor.util.MonitorFields;
import com.m7.cc.ass.server.monitor.util.Utils;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.log.IceLogger;

public class GetGWChannelHandler {
	private static Logger log;
	
	public static C5Response getGWChannel(C5Action action) {
//		if(log == null) {
//			log = IceLogger.getLogger("/var/log/ass",
//					"gwchannel_request", "ALL", false);
//		}
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());

		List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
		Map<String, GatewayCount> gwcs = new HashMap<String, GatewayCount>();
		try {
			if (GateWayActivator.getHandler() != null) {
				HashMap<String, GWChannel> gwChannels = GateWayActivator
						.getHandler().getChannels();
				if (gwChannels != null) {
					for (Map.Entry<String, GWChannel> entry : gwChannels.entrySet()) {
						try {
							if (entry.getValue().getChannelName() != null) {
								if (entry.getValue().getChannelName().indexOf("/") == -1
										|| entry.getValue().getChannelType() == null) {
//									log.warning("-1-" + entry.getValue().getChannelName());
									continue;
								}
								String gatewayName = "";
								if(entry.getValue().getChannelType().equals(MonitorFields.Normal)) {
									gatewayName = entry.getValue().getChannelName().substring(entry.getValue().getChannelName().indexOf("/") + 1,
											entry.getValue().getChannelName().indexOf("-"));
								} else if (entry.getValue().getChannelType().equals(MonitorFields.Dialout)) {
									gatewayName = entry.getValue().getChannelName().substring(entry.getValue().getChannelName().indexOf("/") + 1,
											entry.getValue().getChannelName().indexOf(":"));
								} else if (entry.getValue().getChannelType().equals(MonitorFields.Transfer)) {
									gatewayName = entry.getValue().getChannelName().substring(entry.getValue().getChannelName().indexOf("/") + 1,
											entry.getValue().getChannelName().indexOf(":"));
								}
								if (Utils.isValidIPAddress(gatewayName)) {
									GatewayCount gw = gwcs.get(gatewayName);
									if (gw == null) {
										gw = new GatewayCount(gatewayName);
										gwcs.put(gatewayName, gw);
									}
									if (entry.getValue().getChannelType().equals(MonitorFields.Normal)) {
										gw.setNormal(gw.getNormal() + 1);
									} else if (entry.getValue().getChannelType().equals(MonitorFields.Dialout)) {
										gw.setDialout(gw.getDialout() + 1);
									} else if (entry.getValue().getChannelType().equals(MonitorFields.Transfer)) {
										gw.setTransfer(gw.getTransfer() + 1);
									}
									
								} else {
//									log.warning("-2-" + gatewayName);
								}
							}
						} catch (Exception e) {
							continue;
						}
					}
				} else {
//					log.warning("gwChannels is null");
				}
			} else {
//				log.warning("GateWayActivator's Handler is null");
			}
			
			for (Map.Entry<String, GatewayCount> gwc : gwcs.entrySet()) {
				GatewayCount gatewayCount = gwc.getValue();
				C5Event event = gatewayCount.getStateEvent();
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
	
	public static void main(String args[]) {
		String test = "SIP/6060-178672b0";
		
		String gatewayName = test.substring(test.indexOf("/") + 1,
				test.indexOf(":"));
		System.out.println(gatewayName);
	}

}
