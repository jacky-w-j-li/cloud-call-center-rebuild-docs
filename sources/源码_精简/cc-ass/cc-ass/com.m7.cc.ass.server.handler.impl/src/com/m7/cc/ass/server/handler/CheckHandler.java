package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class CheckHandler {
	public static Logger log = Logger.getLogger(CheckHandler.class.getName());

	public static C5Response processCheck(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID(), false);
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String channelName = (String) action
					.getParameterValue(Fields.Channel);
			
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channelName);
			if(channel == null) {
				log.warning("channel is null ["+channelName+"] "+pbx);
				response.setMessage("channel is null: "+channelName);
				response.setSucceed(false);
				return response;
			}
			
			C5Call call = channel.getCall();
			if(call == null){
				C5Channel lChannel = channel.getLinkedChannel();
				if(lChannel == null){
					response.setMessage("channel is not linked");
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
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
}
