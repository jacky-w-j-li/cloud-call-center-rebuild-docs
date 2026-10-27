package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class GetPBXStatusHandler {

	public static C5Response getPBXStatus(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = null;
			if(action.hasKey(Fields.PBX))
				pbx = (String) action.getParameterValue(Fields.PBX);

			AMIClient[] clients = AMICore.getInstance().getAMIClients();
			List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
			// if no pbx prefix indicated, we will get all pbxs
			if (pbx == null) {
				for(int i=0;i<clients.length;i++) {
					AMIClient client = clients[i];
					C5Event event = client.getStateEvent();
					events.add(event.getParameters());
				}
			} else {
				for(int i=0;i<clients.length;i++) {
					AMIClient client = clients[i];
					if (client.getId().startsWith(pbx)) {
						C5Event event = client.getStateEvent();
						events.add(event.getParameters());
					}
				}
			}
			response.addParameter(Fields.Event, events);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setMessage(e.getMessage());
			response.setSucceed(true);
		}
		return response;
	}
}
