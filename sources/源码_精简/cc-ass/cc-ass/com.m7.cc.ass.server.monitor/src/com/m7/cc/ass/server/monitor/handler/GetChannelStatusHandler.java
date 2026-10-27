package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class GetChannelStatusHandler {

	public static C5Response getChannelStatus(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = null;
			if(action.hasKey(Fields.PBX))
				pbx = (String) action.getParameterValue(Fields.PBX);
			String channelName = null;
			if(action.hasKey(Fields.Channel))
				channelName = (String) action.getParameterValue(Fields.Channel);
			String account = null;
			if(action.hasKey(Fields.Account))
				account = action.getStringValue(Fields.Account);
			response.setSucceed(true);
			// get channel from all pbxs
			if (pbx == null) {
				Vector<String> clients = RuntimeData.getInstance().getPbxs();
				List<Map<String, Object>> channelEvents = new ArrayList<Map<String, Object>>();
				for (int i = 0; i < clients.size(); i++) {
					C5Pbx client = RuntimeData.getInstance().getPbxViaId(
							clients.get(i));
					Iterator<C5Channel> channels = client.getChannels()
							.values().iterator();
					while (channels.hasNext()) {
						C5Channel channel = channels.next();
						if(account != null && !channel.getAccount().equals(account)){
							continue;
						} 
						if(channelName != null && !channel.getChannelName()
								.startsWith(channelName))
							continue;
						C5Event event = channel.getSelfStateEvent();
						channelEvents.add(event.getParameters());
					}
				}
				response.addParameter(Fields.Event, channelEvents);
				response.setSucceed(true);
			} else {
				// get channel from indicated pbx
				C5Pbx client = RuntimeData.getInstance().getPbxViaId(pbx);
				if (client != null) {
					response.setSucceed(true);
					Iterator<C5Channel> channels = client.getChannels()
							.values().iterator();
					List<Map<String, Object>> channelEvents = new ArrayList<Map<String, Object>>();
					while (channels.hasNext()) {
						C5Channel channel = channels.next();
						if(account != null && !channel.getAccount().equals(account)){
							continue;
						} 
						if(channelName != null && !channel.getChannelName()
								.startsWith(channelName))
							continue;
						C5Event event = channel.getSelfStateEvent();
						channelEvents.add(event.getParameters());
					}
					response.addParameter(Fields.Event, channelEvents);
				} else {
					response.setMessage("Invalid pbx: " + pbx);
					response.setSucceed(false);
				}
			}
		} catch (Exception e) {
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
