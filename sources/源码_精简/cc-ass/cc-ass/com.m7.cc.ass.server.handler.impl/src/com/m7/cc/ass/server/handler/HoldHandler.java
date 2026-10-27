package com.m7.cc.ass.server.handler;

import java.util.Hashtable;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class HoldHandler {
	
	private static Logger log = Logger.getLogger(HoldHandler.class.getName());
	
	public static C5Response hold(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			C5Channel channel = null;
			String pbx = action.getStringValue(Fields.PBX);
			C5Pbx pbxvo = RuntimeData.getInstance().getPbxViaId(pbx);
			if(pbxvo == null){
				response.setSucceed(false);
				response.setMessage("Invalid PBX!");
				return response;
			}
			if(action.hasKey(Fields.Channel)){
				 String channelName = action.getStringValue(Fields.Channel);
				 channel = RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channelName);
				 if(channel == null) {
					log.warning("channel is null ["+channelName+"] "+pbx);
					response.setMessage("channel is null: "+channelName);
					response.setSucceed(false);
					return response;
				 }
			}else{
				if (!action.hasKey(Fields.CallID) && !action.hasKey(Fields.Agent)) {
					response.setMessage("Null channel! or Null CallID! or Null Agent!");
					response.setSucceed(false);
					return response;
				}
				if(action.hasKey(Fields.CallID)){
					String callId = action.getStringValue(Fields.CallID);
					Hashtable<String, C5Channel> cs = RuntimeData.getInstance().getPbxViaId(pbx).getChannels();
					for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
						C5Channel curChannel = entry.getValue();
						if(curChannel.getState().equals(Fields.Link) && curChannel.getUniqueid().equals(callId)){
							channel = curChannel;
						}
					}
				}else if(action.hasKey(Fields.Agent) && action.hasKey(Fields.Account)){
					String agent = action.getStringValue(Fields.Agent);
					C5Pbx cur_pbx = RuntimeData.getInstance().getPbxViaId(pbx);
					Hashtable<String, C5Channel> cs = cur_pbx.getChannels();
					User user = cur_pbx.getAccount(action.getStringValue(Fields.Account)).getUserViaExten(agent);
					if(user == null){
						response.setMessage("Account or Agent no Channel!");
						response.setSucceed(false);
						return response;
					}
					for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
						C5Channel curChannel = entry.getValue();
						if(cur_pbx.getPeer(curChannel.getPeer().split("/")[1]) != null){
							if(cur_pbx.getPeer(curChannel.getPeer().split("/")[1]).getUserID().equals(user.getId())){
								channel = curChannel;
							}else{
								response.setMessage("Account or Agent no Channel!");
								response.setSucceed(false);
								return response;
							}
						}
					}
				}
				if(channel == null){
					response.setMessage("Null channel!");
					response.setSucceed(false);
					return response;
				}
			}
			C5Call call = channel.getCall();
			if(call == null){
				C5Channel lChannel = channel.getLinkedChannel();
				if(lChannel == null){
					response.setMessage("Channel is not linked!");
					response.setSucceed(false);
					return response;
				}
				Call mycall = new Call();
				mycall.setRoom(ASConfig.getThreeWayCallRoom() + "");
				mycall.setMainChannel(channel);
				mycall.setSecondChannel(lChannel);
				call = mycall;
			}
			response = call.handleAction(action);
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response unhold(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			C5Channel channel = null;
			String pbx = action.getStringValue(Fields.PBX);
			C5Pbx pbxvo = RuntimeData.getInstance().getPbxViaId(pbx);
			if(pbxvo == null){
				response.setSucceed(false);
				response.setMessage("Invalid PBX!");
				return response;
			}
//			String userId = action.getStringValue(Fields.UserID);
//			String accountId = action.getStringValue(Fields.Account);
			if(action.hasKey(Fields.Channel)){
				 String channelName = action.getStringValue(Fields.Channel);
				 channel = RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channelName);
				 if(channel == null) {
					log.warning("channel is null ["+channelName+"] "+pbx);
					response.setMessage("channel is null: "+channelName);
					response.setSucceed(false);
					return response;
				 }
			}else{
				if (!action.hasKey(Fields.CallID) && !action.hasKey(Fields.Agent)) {
					response.setMessage("Null channel! or Null CallID! or Null Agent!");
					response.setSucceed(false);
					return response;
				}
				if(action.hasKey(Fields.CallID)){
					String callId = (String) action.getParameterValue(Fields.CallID);
					Hashtable<String, C5Channel> cs = RuntimeData.getInstance().getPbxViaId(pbx).getChannels();
					for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
						C5Channel curChannel = entry.getValue();
						if(curChannel.getState().equals(Fields.Link) && curChannel.getUniqueid().equals(callId)){
							channel = curChannel;
						}
					}
				}else if(action.hasKey(Fields.Agent) && action.hasKey(Fields.Account)){
					String agent = (String) action.getParameterValue(Fields.Agent);
					C5Pbx cur_pbx = RuntimeData.getInstance().getPbxViaId(pbx);
					Hashtable<String, C5Channel> cs = cur_pbx.getChannels();
					User user = cur_pbx.getAccount(action.getStringValue(Fields.Account)).getUserViaExten(agent);
					if(user == null){
						response.setMessage("Account or Agent no Channel!");
						response.setSucceed(false);
						return response;
					}
					for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
						C5Channel curChannel = entry.getValue();
						if(cur_pbx.getPeer(curChannel.getPeer().split("/")[1]) != null){
							if(cur_pbx.getPeer(curChannel.getPeer().split("/")[1]).getUserID().equals(user.getId())){
								channel = curChannel;
							}else{
								response.setMessage("Account or Agent no Channel!");
								response.setSucceed(false);
								return response;
							}
						}
					}
				}
				if(channel == null){
					response.setMessage("Null channel!");
					response.setSucceed(false);
					return response;
				}
			}
			C5Call call = channel.getCall();
			if(call == null){
				log.warning("Call not unhold a undefined call: "+channel.getUniqueid());
				response.setMessage("Call not found!");
				response.setSucceed(false);
				return response;
			} else {
				response = call.handleAction(action);
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
	
	public static void linkAutoToCall(C5Channel channel1) {
		try{
			C5Channel channel2 = channel1.getLinkedChannel();
			C5Call call = channel1.getCall();
			if (call == null) {
				Call mycall = new Call();
				mycall.setRoom(ASConfig.getThreeWayCallRoom() + "");
				mycall.setMainChannel(channel1);
				mycall.setSecondChannel(channel2);
				call = mycall;
				if(channel1.getVar("calledPhone") != null){
					channel2.setFromCid(channel1.getVar("calledPhone"));
				}
				if(channel2.getVar("calledPhone") != null){
					channel1.setFromCid(channel2.getVar("calledPhone"));
				}
				if(channel1.getVar("WebcallActionID") != null){
					channel2.addVar("WebcallActionID", channel1.getVar("WebcallActionID"));
				}
				if(channel2.getVar("WebcallActionID") != null){
					channel1.addVar("WebcallActionID", channel2.getVar("WebcallActionID"));
				}
				// Switch call to chatting state
				C5Action unhold = new C5Action(Fields.Unhold, "");
				C5Response unholdRes = mycall.handleAction(unhold);
				unholdRes.addParameter(Fields.Message, "unhold failed");
				if (!unholdRes.isSucceed()) {
					log.log(Level.WARNING, "linkAutoToCall unhold failed!"+channel1.getChannelName());
				}
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
	}
}
