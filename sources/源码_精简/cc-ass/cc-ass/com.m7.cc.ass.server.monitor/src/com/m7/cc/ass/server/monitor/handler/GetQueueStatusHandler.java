package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class GetQueueStatusHandler {

	public static C5Response getQueueStatus(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = null;
			if(action.hasKey(Fields.PBX))
				pbx = (String) action.getParameterValue(Fields.PBX);
			String account = null;
			if(action.hasKey(Fields.Account))
				account = action.getStringValue(Fields.Account);
			String queueNames = null;
			if(action.hasKey(Fields.Queue)) 
				queueNames = action.getStringValue(Fields.Queue);
			
			if (pbx != null) {
				AMIClient client = AMICore.getInstance().getAMIClient(pbx);
				if (client == null || !client.isAuthenticated()) {
					response.setMessage("Invalid pbx: " + pbx);
					response.setSucceed(false);
				} else {

					Iterator<C5Queue> queues = RuntimeData.getInstance()
							.getPbxViaId(pbx).getQueues().values().iterator();
					List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();

					while (queues.hasNext()) {
						C5Queue queue = queues.next();
						if(account != null && !queue.getAccount().equals(account))
							continue;
						if(queueNames != null && !queue.getExten().startsWith(queueNames))
							continue;
						C5Event event = queue.getStateEvent();
						events.add(event.getParameters());
					}
					response.setSucceed(true);
					response.addParameter(Fields.Event, events);
				}
			} else {
				Vector<String> names = RuntimeData.getInstance().getPbxs();
				List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
				for(int i=0;i<names.size();i++){
					C5Pbx client = RuntimeData.getInstance().getPbxViaId(names.get(i));
					Iterator<C5Queue> queues = client.getQueues().values()
							.iterator();
					
					while (queues.hasNext()) {
						C5Queue queue = queues.next();
						if(account != null && !queue.getAccount().equals(account))
							continue;
						if(queueNames != null && !queue.getExten().startsWith(queueNames))
							continue;
						C5Event event = queue.getStateEvent();
						events.add(event.getParameters());
					}
				}
				response.setSucceed(true);
				response.addParameter(Fields.Event, events);
			}
		} catch (Exception e) {
			response.setMessage(e.getMessage());
			response.setSucceed(true);
		}
		
		return response;
	}
}
