package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class GetUserStatusHandler {
	public static C5Response getUserStatus(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try{
			String pbx = null;
			if(action.hasKey(Fields.PBX))
				pbx = (String) action.getParameterValue(Fields.PBX);
			String accountId = null;
			if(action.hasKey(Fields.Account))
				accountId = action.getStringValue(Fields.Account);
			String peerName = null;
			if(action.hasKey(Fields.Peer))
				peerName = (String) action.getParameterValue(Fields.Peer);
			boolean isOnline = false;
			if(action.hasKey(Fields.Online))
				isOnline = action.getBoolValue(Fields.Online);
			if (pbx != null) {
				C5Pbx client = RuntimeData.getInstance().getPbxViaId(pbx);
				if (client == null) {
					response.setMessage("Invalid pbx: " + pbx);
					response.setSucceed(false);
					return response;
				} else {
					List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
					if(accountId != null){
						C5Account account = client.getAccount(accountId);
						List<User> users = account.getUserList();
						for (int j = 0; j < users.size(); j++) {
							User user = users.get(j);
							if (peerName != null
									&& !user.getUser().startsWith(peerName))
								continue;
							if (isOnline && !user.isLogin())
								continue;
							events.add(user.getStateEvent().getParameters());
						}
					} else {
						List<String> accounts = client.getAccountNameList();
						for(int i=0;i<accounts.size();i++){
							C5Account account = client.getAccount(accounts.get(i));
							List<User> users = account.getUserList();
							for(int j=0;j<users.size();j++){
								User user = users.get(j);
								if (peerName != null
										&& !user.getUser().startsWith(peerName))
									continue;
								if (isOnline && !user.isLogin())
									continue;
								events.add(user.getStateEvent().getParameters());
							}
						}
					}
					response.addParameter(Fields.Event, events);
				}
			} else {
				Vector<String> clients = RuntimeData.getInstance().getPbxs();
				List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
				for(int i=0;i<clients.size();i++) {
					C5Pbx client = RuntimeData.getInstance().getPbxViaId(clients.get(i));
					if(accountId != null){
						C5Account account = client.getAccount(accountId);
						List<User> users = account.getUserList();
						for (int j = 0; j < users.size(); j++) {
							User user = users.get(j);
							if (peerName != null
									&& !user.getUser().startsWith(peerName))
								continue;
							if (isOnline && !user.isLogin())
								continue;
							events.add(user.getStateEvent().getParameters());
						}
					} else {
						List<String> accounts = client.getAccountNameList();
						for(int k=0;k<accounts.size();k++){
							C5Account account = client.getAccount(accounts.get(k));
							List<User> users = account.getUserList();
							for(int j=0;j<users.size();j++){
								User user = users.get(j);
								if (peerName != null
										&& !user.getUser().startsWith(peerName))
									continue;
								if (isOnline && !user.isLogin())
									continue;
								events.add(user.getStateEvent().getParameters());
							}
						}
					}
				}
				response.addParameter(Fields.Event, events);
			}
			response.setSucceed(true);
		} catch (Exception e){
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
