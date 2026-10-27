package com.m7.cc.ass.server.handler;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class ChatingIvrPlayHandler {
	public static Logger log = Logger.getLogger(ChatingIvrPlayHandler.class.getName());

	public static C5Response processChatingIvrPlay(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID(), false);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);
			String exten = (String) action.getParameterValue(Fields.Exten);

			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setSucceed(false);
				response.setMessage("can not find this pbx[" + pbx + "]");
				return response;
			}

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("Account [" + accountId + "] not found");
				return response;
			}

			String channelName = null;
			if(action.hasKey(Fields.CallID)){
				String callId = (String) action.getParameterValue(Fields.CallID);
				Hashtable<String, C5Channel> cs = RuntimeData.getInstance().getPbxViaId(pbx).getChannels();
				for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
					C5Channel curChannel = entry.getValue();
					if(curChannel.getUniqueid().equals(callId)){
						if(curChannel.getVar("Meet-ChatingIvrPrompt") == null){
							if(curChannel.getState().equals(Fields.Link)){
								channelName = curChannel.getChannelName();
								break;
							}
						}else{
							channelName = curChannel.getChannelName();
							break;
						}						
					}
				}
			}
			if(channelName == null){
				response.setMessage("not found Channel!");
				response.setSucceed(false);
				return response;
			}
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channelName);
			if(channel == null){
				response.setMessage("not found Channel!");
				response.setSucceed(false);
				return response;
			}
			
			String variable = "";
			String varId = "";
			if (action.hasKey(Fields.Variable)) {
				variable = (String) action.getParameterValue(Fields.Variable);
				variable = variable.trim();
				if (variable.equals("")) {
					response.setMessage("[408]Variable parameter found, but value is null or blank.");
					response.setSucceed(false);
					return response;
				}
				
				varId = Utils.getUniqueid();
				if(!variable.equals("")){
					String[] variables = variable.split(",");
					HashMap<String, String> varMap = new HashMap<String, String>();
					for (String token : variables) {
						int index = token.indexOf(":");
						String varKey = token.substring(0, index);
						String varValue = token.substring(index + 1);
						varMap.put(varKey, varValue);
					}
					account.getChatingIvrPlayVarMap().put(varId, varMap);
				}
			}
			
			exten = "SIP/"+exten+ "@"
					+ ASConfig.getInstance().getDialoutLine() + ":"
					+ ASConfig.getInstance().getDialoutPort();
			
			String room = null;
			if(channel.getVar("Meet-ChatingIvrPrompt") != null){
				room = channel.getVar("ORI_MEETME_NUM");
				Originate originate = new Originate(exten, room,
						Fields.threewaycall, "1", action.getActionID());
				originate.setAsync("true");
				originate.setTimeout("30000");
				if(!varId.equals("")){
					originate.setVariable("__SIPADDHEADER51=chating_ivr_var_id:"+varId);				
				}
				originate.setCallerID(RuntimeData.getInstance().getAccount(pbx,accountId).getDidNum(Fields.DialoutFlag));
				AsteriskResponse res1 = AMICore.getInstance().getAMIClient(channel.getPbx()).sendSynOriginate(originate);
				String reason = res1.getParameter(Fields.Reason);
				if (res1.isSuccessful() && reason.equals("4")) {
					response.setSucceed(true);
					response.setMessage(reason);
				} else {
					response.setSucceed(false);
					response.setMessage(reason);
					return response;
				}
			}else{
				C5Call call = channel.getCall();
				if (call == null) {
					C5Channel lChannel = channel.getLinkedChannel();
					if (lChannel == null) {
						response.setMessage("channel is not linked");
						response.setSucceed(false);
						return response;
					}
					Call mycall = new Call();
					mycall.setRoom(ASConfig.getThreeWayCallRoom() + "");
					mycall.setMainChannel(channel);
					mycall.setSecondChannel(lChannel);
					call = mycall;
					// Switch call to chatting state
					C5Action unhold = new C5Action(Fields.Unhold, "");
					C5Response unholdRes = mycall.handleAction(unhold);
					unholdRes.addParameter(Fields.Message, "unhold failed");
					if (!unholdRes.isSucceed()) {
						return unholdRes;
					}
				}
				room = call.getRoom();
				Originate originate = new Originate(exten, room,
						Fields.threewaycall, "1", action.getActionID());
				originate.setAsync("true");
				originate.setTimeout("30000");
				if(!varId.equals("")){
					originate.setVariable("__SIPADDHEADER51=chating_ivr_var_id:"+varId);				
				}
				originate.setCallerID(RuntimeData.getInstance().getAccount(pbx,accountId).getDidNum(Fields.DialoutFlag));
				
				AsteriskResponse res1 = AMICore.getInstance().getAMIClient(channel.getPbx()).sendSynOriginate(originate);
				String reason = res1.getParameter(Fields.Reason);
				if (res1.isSuccessful() && reason.equals("4")) {
					if(call.getMainChannel() == null || call.getSecondChannel() == null) {
						response.setSucceed(false);
						return response;
					}
					C5Channel thirdChannel = RuntimeData.getInstance().getPbxViaId(
							call.getMainChannel().getPbx()).getChannel(
							res1.getParameter(Fields.Channel));
					call.setThirdChannel(thirdChannel);
					
					response.setSucceed(true);
					response.setMessage(reason);
				} else {
					response.setSucceed(false);
					response.setMessage(reason);
					return response;
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
}
