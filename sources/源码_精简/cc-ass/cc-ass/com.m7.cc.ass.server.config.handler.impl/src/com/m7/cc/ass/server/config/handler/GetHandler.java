package com.m7.cc.ass.server.config.handler;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ServicePeer;

public class GetHandler {
	
	private static Logger log = Logger.getLogger(GetHandler.class.getName());

	public static C5Response add(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String name = action.getStringValue(Fields.Peer);
			if (name.equals(Fields.PBX)) {
				Vector<String> ids = RuntimeData.getInstance().getPbxs();
				List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
				for(int i=0;i<ids.size();i++){
					AMIClient pbx = AMICore.getInstance().getAMIClient(ids.get(i));
					C5Event event = pbx.getStateEvent();
					events.add(event.getParameters());
				}
				response.setSucceed(true);
				response.addParameter(Fields.Event, events);
				return response;
			} else if (name.equals(Fields.Account)) {
				String pbxId = action.getStringValue(Fields.PBX);
				C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxId);
				if(pbx == null){
					response.setSucceed(false);
					response.setMessage("PBX not found");
					return response;
				}
				Hashtable<String, C5Account> accounts = pbx.getAccounts();
				List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
				Iterator<C5Account> it = accounts.values().iterator();
				while(it.hasNext()) {
					C5Account account = it.next();
					events.add(account.getStateEvent().getParameters());
				}
				response.setSucceed(true);
				response.addParameter(Fields.Event, events);
				return response;
			} else {
				String pbxId = action.getStringValue(Fields.PBX);
				String accountId = action.getStringValue(Fields.Account);
				C5Account account = RuntimeData.getInstance().getAccount(pbxId, accountId);
				if(account == null){
					response.setSucceed(false);
					response.setMessage("Account not found");
					return response;
				}
				List<ServicePeer> peers = account.getServicePeers(name);
				List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
				for(int i=0;i<peers.size();i++) {
					events.add(peers.get(i).getStateEvent().getParameters());
				}
				response.setSucceed(true);
				response.addParameter(Fields.Event, events);
				return response;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
}
