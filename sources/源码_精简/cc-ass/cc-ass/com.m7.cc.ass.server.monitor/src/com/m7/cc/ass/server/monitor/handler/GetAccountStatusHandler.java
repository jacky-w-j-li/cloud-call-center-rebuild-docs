package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class GetAccountStatusHandler {

	public static C5Response getAccountStatus(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = null;
			if (action.hasKey(Fields.PBX))
				pbx = (String) action.getParameterValue(Fields.PBX);
			String accountName = null;
			if (action.hasKey(Fields.AccountName))
				accountName = action.getStringValue(Fields.AccountName);
			response.setSucceed(true);
			// get channel from all pbxs
			if (pbx == null) {
				Vector<String> clients = RuntimeData.getInstance().getPbxs();
				List<Map<String, Object>> channelEvents = new ArrayList<Map<String, Object>>();
				for (int i = 0; i < clients.size(); i++) {
					C5Pbx client = RuntimeData.getInstance().getPbxViaId(
							clients.get(i));
					Iterator<C5Account> accounts = client.getAccounts()
							.values().iterator();
					while (accounts.hasNext()) {
						C5Account account = accounts.next();
						if (accountName != null
								&& !account.getName().equals(account)) {
							continue;
						}
						C5Event event = account.getStateEvent();
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
					List<Map<String, Object>> channelEvents = new ArrayList<Map<String, Object>>();
					Iterator<C5Account> accounts = client.getAccounts()
							.values().iterator();
					while (accounts.hasNext()) {
						C5Account account = accounts.next();
						if (accountName != null
								&& !account.getName().equals(account)) {
							continue;
						}
						C5Event event = account.getStateEvent();
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
