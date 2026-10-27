package com.m7.cc.ass.call.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class CallThreeWay {

	private static Logger log = Logger.getLogger(CallThreeWay.class.getName());

	public static C5Response handleAction(Call call, C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			response.setSucceed(false);
			response.setMessage("Unsupport action [" + action.getActionName()
					+ "] in VALIDATTING state");
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static void handleEvent(Call call, C5Event event) {
		try {
			if (event.getEventName().equals(Fields.ChannelStatus)) {
				C5Channel channel = (C5Channel) event
						.removeParameter(Fields.Channel);
				if (channel.getState().equals(Fields.Hangup)) {
//					try {
//						call.setState(CallHandlerImpl.END);
//						if (call.getMainChannel().getUniqueid().equals(channel.getUniqueid())) {
//							// TODO This channel should be redirect to the peer
//							// it's
//							// queue
//							// goes to when hanguped.
//							ChannelHandler.hangup(call.getSecondChannel());
//						} else {
//							ChannelHandler.hangup(call.getMainChannel());
//						}
//					} catch (Exception e) {
//						call.close();
//						return;
//					}
					if (call.getMainChannel() != null && call.getMainChannel().getUniqueid().equals(channel.getUniqueid())) {
						call.setMainChannel(null);
					}
					if (call.getSecondChannel() !=null && call.getSecondChannel().getUniqueid().equals(channel.getUniqueid())) {
						call.setSecondChannel(null);
					}
					if (call.getThirdChannel() != null && call.getThirdChannel().getUniqueid().equals(channel.getUniqueid())) {
						call.setThirdChannel(null);
					}
					//if meetme have only one channel then we remove it.add by chenguang 2013-03-26
					int channelCount = 0;
					C5Channel tempChannel = null;
					if(call.getMainChannel() != null) {
						tempChannel = call.getMainChannel();
						channelCount++;
					}
					if(call.getSecondChannel() != null) {
						tempChannel = call.getSecondChannel();
						channelCount++;
					}
					if(call.getThirdChannel() != null) {
						tempChannel = call.getThirdChannel();
						channelCount++;
					}
					if(channelCount == 1){
						if(tempChannel != null){
							call.close();
							if (!ChannelHandler.redirectToQueueHangupPeer(tempChannel)) {
								ChannelHandler.hangup(tempChannel);								
							}
						}
					}
					//this don't close call object,last hangup event can handle
					//call.close();
				}
				CallListener.getInstance().channelStatusChanged(channel);
			} else if (event.getEventName().equals(Fields.MeetmeJoin)) {
				C5Channel channel = RuntimeData.getInstance()
						.getPbxViaId(event.getStringValue(Fields.PBX))
						.getChannel(event.getStringValue(Fields.Channel));
				if (!channel.getUniqueid().equals(
						call.getMainChannel().getUniqueid()) &&
						!channel.getUniqueid().equals(
								call.getSecondChannel().getUniqueid())) {
					call.setThirdChannel(channel);
					call.setState(CallHandlerImpl.THREE_WAY_CALL);
				}
			} else if (event.getEventName().equals(Fields.Newexten)) {
				String account = event.getStringValue(Fields.Account);
				CallListener.getInstance().channelNewExten(account, event);
			} 
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			call.close();
		}
	}
}
