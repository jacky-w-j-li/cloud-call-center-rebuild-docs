package com.m7.cc.ass.server.monitor.handler;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;

public class GetPBXAccountHandler {
	public static C5Response getPBXAccount(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String ask = action.getParameterValue("ask").toString();
			Map<String, Object> accountChannels = new HashMap<String, Object>();
			C5Pbx client = RuntimeData.getInstance().getPbxViaId(ask);
			Iterator<C5Channel> channels = client.getChannels().values().iterator();
			while (channels.hasNext()) {
				try {
					C5Channel channel = channels.next();
					if(!accountChannels.containsKey(channel.getAccount())) {
						accountChannels.put(channel.getAccount(), 1);
					} else {
						accountChannels.put(channel.getAccount(), Integer.parseInt(accountChannels.get(channel.getAccount()).toString()) + 1);
					}
				} catch(Exception e) {
					continue;
				}
			}
			response.addParameter("accountChannels", accountChannels);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
		}
		return response;
	}
}
