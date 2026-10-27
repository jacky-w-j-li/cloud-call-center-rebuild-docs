package com.m7.cc.ass.server.handler;

import java.util.Hashtable;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class HangupHandler {
	private static final Logger log = Logger.getLogger(HangupHandler.class
			.getName());
	
	public static C5Response processHangup(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			C5Pbx pbxvo = RuntimeData.getInstance().getPbxViaId(pbx);
			if(pbxvo == null){
				response.setSucceed(false);
				response.setMessage("Invalid PBX!");
				return response;
			}
			if (!action.hasKey(Fields.Channel) && !action.hasKey(Fields.CallID) && !action.hasKey(Fields.Agent) && !action.hasKey("WebcallActionID")) {
				response.setMessage("Null channel! or Null CallID! or Null Agent! or Null WebcallActionID!");
				response.setSucceed(false);
				return response;
			}
			
			String channel = null;
			if(action.hasKey(Fields.CallID)){
				String callId = (String) action.getParameterValue(Fields.CallID);
				Hashtable<String, C5Channel> cs = RuntimeData.getInstance().getPbxViaId(pbx).getChannels();
				for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
					C5Channel curChannel = entry.getValue();
					if(curChannel.getUniqueid().equals(callId)){
						channel = curChannel.getChannelName();
					}
				}
			}else if(action.hasKey(Fields.Agent) && action.hasKey(Fields.Account)){
				String agent = action.getStringValue(Fields.Agent);
				C5Pbx cur_pbx = RuntimeData.getInstance().getPbxViaId(pbx);
				Hashtable<String, C5Channel> cs = cur_pbx.getChannels();
				User user = cur_pbx.getAccount(action.getStringValue("Account")).getUserViaExten(agent);
				if(user == null){
					response.setMessage("Account or Agent no Channel!");
					response.setSucceed(false);
					return response;
				}
				for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
					C5Channel curChannel = entry.getValue();
					if(cur_pbx.getPeer(curChannel.getPeer().split("/")[1]) != null){
						if(cur_pbx.getPeer(curChannel.getPeer().split("/")[1]).getUserID().equals(user.getId())){
							channel = curChannel.getChannelName();
						}
					}
				}
			}else if(action.hasKey("WebcallActionID")){
				String webcallId = (String) action.getParameterValue("WebcallActionID");
				Hashtable<String, C5Channel> cs = RuntimeData.getInstance().getPbxViaId(pbx).getChannels();
				for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
					C5Channel curChannel = entry.getValue();
					if(curChannel.getState().equals(Fields.Link) 
							&& curChannel.getVar("WebcallActionID") != null 
							&& curChannel.getVar("WebcallActionID").equals(webcallId)){
						channel = curChannel.getChannelName();
						if((action.hasKey("hanupLinkChannel") || action.hasKey("HanupLinkChannel")) 
								&& curChannel.getLinkedChannel() != null){
							AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
							if (amiClient != null && amiClient.isAuthenticated()) {
								AsteriskResponse lres = amiClient
										.sendSynchronousAction(new Hangup(curChannel.getLinkedChannel().getChannelName(), action
												.getActionID()+"handlerlinkChannel"));
								if (lres.isSuccessful()) {
									response.setSucceed(true);
									log.warning("Hangup by WebcallActionID lchannel success. channelName =" + curChannel.getLinkedChannel().getChannelName());
								} else {
									log.warning("Hangup by WebcallActionID lchannel failed. channelName =" + curChannel.getLinkedChannel().getChannelName());
								}
							}
						}
						break;
					}
				}
			}else{
				channel = action.getStringValue(Fields.Channel);
			}
			if(channel == null){
				response.setMessage("Null channel!");
				response.setSucceed(false);
				return response;
			}
//			if(channel.equalsIgnoreCase("null") && action.hasKey(Fields.id)) {
//				String userID = action.getStringValue(Fields.id);
//				String pbxID = action.getStringValue(Fields.PBX);
//				String accountId = action.getStringValue(Fields.Account);
//				User user = RuntimeData.getInstance().getAccount(pbxID, accountId).getUser(userID);
//				if(user != null){
//					user.getSipNum()
//				}
//			}
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient != null && amiClient.isAuthenticated()) {
				AsteriskResponse res = amiClient
						.sendSynchronousAction(new Hangup(channel, action
								.getActionID()+"handler"));
				if(!response.isSucceed()){
					if (res.isSuccessful()) {
						response.setSucceed(true);
					} else {
						log.log(Level.WARNING, "Hangup interface to hangup failed!");
						response.setSucceed(false);
						response.setMessage(res.toString());
					}					
				}
			}else{
				response.setSucceed(false);
				response.setMessage("Invalid PBX!");
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Hangup interface has Exception="+action.getParameters().toString(), e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		log.warning("Hangup interface [Action] = " +action.getParameters().toString() + " [Response] = "+ response.getParameters().toString());
		return response;
	}
}
