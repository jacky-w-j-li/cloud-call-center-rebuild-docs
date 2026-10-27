package com.m7.cc.ass.server.monitor.handler;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.GetConfig;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class GetConfigHandler {
	public static C5Response getConfig(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String filename = (String) action.getParameterValue(Fields.Filename);
			
			AMIClient client = AMICore.getInstance().getAMIClient(pbx);
			//if no pbx prefix indicated, we will get all pbxs
			if(client != null){
				GetConfig getconfig = new GetConfig(filename, Utils.getSynActionID("getconfig"));
				try {
					AsteriskResponse res = client.sendSynchronousAction(getconfig);
					response.setSucceed(true);
					response.setMessage(res.toString());
				} catch (CommunicationException e) {
					response.setSucceed(false);
					response.setMessage("Send action failed");
				}
			} else {
				response.setMessage("No pbx found for ["+pbx+"]");
				response.setSucceed(false);
			}
		} catch (Exception e){
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
