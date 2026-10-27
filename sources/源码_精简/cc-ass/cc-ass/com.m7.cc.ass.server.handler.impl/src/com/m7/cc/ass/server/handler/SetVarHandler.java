package com.m7.cc.ass.server.handler;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

public class SetVarHandler {
	private static final Logger log = Logger.getLogger(SetVarHandler.class
			.getName());
	public static C5Response processSetVar(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID());
		try {
			String pbx = (String) action.getParameterValue("PBX");
			String channelName = (String) action.getParameterValue("Channel");
			String strValue = (String) action.getParameterValue("Value");

			AMIClient client = AMICore.getInstance().getAMIClient(pbx);
			if ((client != null) && (client.isAuthenticated())) {
				C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
						.getChannel(channelName);
				if (channel == null) {
					response.setMessage("can not find this channel: "
							+ channelName);
					response.setSucceed(false);
				} else {
					if (strValue.indexOf("LABELS") == -1) {
						String[] vars = strValue.split("&");
						for (int i = 0; i < vars.length; i++) {
							String[] value = vars[i].split("=");
							if (value.length > 1) {
								channel.addC5Var(value[0], value[1]);
								channel.addVar(value[0], value[1]);
							}
						}
					} else {
						String[] value = strValue.substring(6).split("##");
						List<String> labels = new ArrayList<String>();
						for(String v : value){
							labels.add(v);
						}
						C5Channel linkCh = channel.getLinkedChannel();
						channel.setLabels(labels);
						if (linkCh != null) {
							linkCh.setLabels(labels);
						}
						log.warning("channelLabels:::::" + channel.getLabels());
					}
					response.setSucceed(true);
				}
			} else {
				response.setMessage("can not find this pbx: " + pbx);
				response.setSucceed(false);
			}
		} catch (Exception e) {
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	public static void main(String[] args) {
		String aa = "LABELS08031d60-59ea-11e6-b0eb-253e5c2aa8rr##95bafe40-59ed-11e6-b0eb-253e5c2aa8ff##";
		String[] value = aa.substring(6).split("##");
		List<String> labels = new ArrayList<String>();
		for(String v : value){
			labels.add(v);
		}
		System.out.println(labels);
	}
}
