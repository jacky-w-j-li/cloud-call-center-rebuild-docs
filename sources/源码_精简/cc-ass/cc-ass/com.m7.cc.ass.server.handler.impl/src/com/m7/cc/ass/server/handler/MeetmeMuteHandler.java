package com.m7.cc.ass.server.handler;

import java.util.Hashtable;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class MeetmeMuteHandler {
private static Logger log = Logger.getLogger(MeetmeMuteHandler.class.getName());


	private static String context_room = null;
	
	public static C5Response mute(C5Action action) {
		String actionName = action.getActionName();
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
				if(action.hasKey(Fields.CallID)){
					String callId = action.getStringValue(Fields.CallID);
					Hashtable<String, C5Channel> cs = RuntimeData.getInstance().getPbxViaId(pbx).getChannels();
					for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
						C5Channel curChannel = entry.getValue();
						if(curChannel.getUniqueid().equals(callId)){
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
				if (actionName.equalsIgnoreCase(Fields.MeetmeMute)) {
					context_room = "musiconhold" ;
				} else if (actionName.equalsIgnoreCase(Fields.MeetmeUnMute)) {
					String room = channel.getVar("room");
					if (room != null ) {
						if (room.length() > 17) {
							context_room = room.substring(0, 12) + "-" + room.substring(12, 17) + "-room";
						} else {
							context_room = room.substring(0, 12) + "-" + room.substring(12) + "-room";
						}
					} else {
						response.setMessage("MeetmeNum is not exist!");
						response.setSucceed(false);
						return response;
					}
				} else {
					response.setMessage("Null actionName!");
					response.setSucceed(false);
					return response;
				}
			}
			Redirect redirect = new Redirect(channel.getChannelName(), context_room, "s", "1",
					action.getActionID());
			AsteriskResponse res;
			res = AMICore.getInstance()
					.getAMIClient(pbx).sendSynchronousAction(redirect);
			if (res.isSuccessful()) {
				response.setSucceed(true);
			} else {
				response.setSucceed(false);
				response.setMessage(res.toString());
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
}
