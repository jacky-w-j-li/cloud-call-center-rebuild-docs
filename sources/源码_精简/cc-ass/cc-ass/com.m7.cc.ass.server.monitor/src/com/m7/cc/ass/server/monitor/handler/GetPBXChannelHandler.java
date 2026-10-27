package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.server.monitor.model.PbxCount;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.log.IceLogger;

public class GetPBXChannelHandler {
	
	private static Logger pbxNumLog;
	
	public static C5Response getPBXChannel(C5Action action) {
		if(pbxNumLog == null) {
			pbxNumLog = IceLogger.getLogger("/var/log/ass",
					"pbxnum_request", "ALL", false);
		}
		
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());

		try {
			Map<String, PbxCount> pbxs = new HashMap<String, PbxCount>();
			List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
			
			Vector<String> clients = RuntimeData.getInstance().getPbxs();
			for (int i = 0; i < clients.size(); i++) {
				C5Pbx client = RuntimeData.getInstance().getPbxViaId(clients.get(i));
				PbxCount pbxCount = new PbxCount(client.getPbx());
				pbxs.put(client.getPbx(), pbxCount);
				Iterator<C5Channel> channels = client.getChannels().values().iterator();
				while (channels.hasNext()) {
					try {
						C5Channel channel = channels.next();
						pbxNumLog.log(Level.INFO, "channel: " + channel);
						if(channel != null) {
							pbxNumLog.log(Level.INFO, "channelType: " + channel.getChannelType());	
							if(channel.getChannelType() != null) {
								if(channel.getChannelType().equals("normal")) {
									pbxNumLog.log(Level.INFO, "normal channel");
									//获取pbx的呼入通话数
									pbxCount.setNormal(pbxCount.getNormal() + 1);
								}
								else if(channel.getChannelType().equals("dialout")) {
									pbxNumLog.log(Level.INFO, "dialout channel");
									//获取pbx呼出记录
									pbxCount.setDialout(pbxCount.getDialout() + 1);
								}
							}
						}
					} catch(Exception e) {
						pbxNumLog.log(Level.WARNING, " ", e);
						continue;
					}
				}
			}
			
			for(Map.Entry<String, PbxCount> pxc : pbxs.entrySet()) {
				PbxCount pbxCount = pxc.getValue();
				C5Event event = pbxCount.getStateEvent();
				events.add(event.getParameters());
			}
			response.addParameter(Fields.Event, events);
			response.setSucceed(true);
		} catch (Exception e) {
			pbxNumLog.log(Level.WARNING, " ", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
