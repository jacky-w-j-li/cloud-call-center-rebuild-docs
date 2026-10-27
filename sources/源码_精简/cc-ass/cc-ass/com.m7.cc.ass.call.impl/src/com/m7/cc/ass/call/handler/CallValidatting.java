package com.m7.cc.ass.call.handler;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.notify.service.NotifyListener;
import com.m7.cc.util.Utils;

public class CallValidatting {

	private static Logger log = Logger.getLogger(CallValidatting.class
			.getName());

	public static C5Response handleAction(Call call, C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			if (action.getActionName().equals(Fields.EndIvrMenuOut)) {
				Redirect redirect = new Redirect(call.getSecondChannel().getChannelName(), Fields.threewaycall,
						call.getRoom(),"1", Utils.getSynActionID("p2pcall"));
				AsteriskResponse res;
				res = AMICore.getInstance().getAMIClient(
						call.getMainChannel().getPbx()).sendSynchronousAction(
						redirect);
				
				if(res.isSuccessful()){
					call.setState(CallHandlerImpl.CHATTING);
				}
			}else{
				response.setSucceed(false);
				response.setMessage("Unsupport action [" + action.getActionName()
						+ "] in VALIDATTING state");				
			}
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}

	public static void handleEvent(Call call, C5Event event) {
		try {
			if (event.getEventName().equals(Fields.Newexten)) {
				String context = (String) event
						.getParameterValue(Fields.Context);
				String asterisk = (String) event.getParameterValue(Fields.PBX);
				String channelName = (String) event
						.getParameterValue(Fields.Channel);
				if (context.endsWith("check-end")) {
					Redirect action = new Redirect(channelName,
							Fields.threewaycall, call.getRoom(), "1", Utils
									.getSynActionID("redirect"));
					AMICore.getInstance().getAMIClient(asterisk).sendAction(
							action);
					C5Event checkEvent = new C5Event(Fields.Check);
					checkEvent.addParameter(Fields.PBX, call.getMainChannel()
							.getPbx());
					checkEvent.addParameter(Fields.Account, call
							.getMainChannel().getAccount());
					checkEvent.addParameter(Fields.Exten, call
							.getSecondChannel().getExten());
					checkEvent.addParameter(Fields.Result, call
							.getMainChannel().getVar(Fields.Result));
					CallListener.getInstance().newEvent(checkEvent);
					call.setState(CallHandlerImpl.CHATTING);
				} else if (context.endsWith("ivr-menu-end")) {
					// ivrmenu end,mainchannel redirect to meetme,The call
					// switch to chatting status
					//C5Channel mainChannel = call.getMainChannel();
					C5Channel secondChannel = call.getSecondChannel();
					if (secondChannel.getCall() != null) {
						Redirect redirect = new Redirect(channelName,
								Fields.threewaycall, call.getRoom(), "1",
								Utils.getSynActionID("p2pcall"));
						AsteriskResponse response = AMICore.getInstance()
								.getAMIClient(asterisk)
								.sendSynchronousAction(redirect);
						if (response.isSuccessful()) {

							call.setState(CallHandlerImpl.CHATTING);
							// to tell softPhone ivrMenuInner end.ivrMenu result
							// send to softPhone.
							Map<String, String> msgData = new HashMap<String, String>();
							msgData.put(
									Fields.VAL_OF_IVR_MENU,
									call.getMainChannel().getVar(
											Fields.VAL_OF_IVR_MENU));
							NotifyListener.getInstance()
									.sendToSoftPhoneMessage(
											Fields.IvrMenuEnd,
											secondChannel.getSipPeer()
													.getUserID(),
											secondChannel.getAccount(),
											secondChannel.getPbx(), msgData);
						} else {
							call.setState(CallHandlerImpl.END);
						}
					} else {// if secondChannel Hangup ,hangup mainchannel.
						ChannelHandler.hangup(call.getMainChannel());
					}
				}
				String account = event.getStringValue(Fields.Account);
				CallListener.getInstance().channelNewExten(account, event);
			} else if (event.getEventName().equals(Fields.ChannelStatus)) {
				C5Channel channel = (C5Channel) event
						.removeParameter(Fields.Channel);
				if (channel.getState().equals(Fields.Hangup)) {
					//when ivrMenuOut end ,redirect second channel to meetme, status to chatting.
					if(call.getThirdChannel() != null
							&& channel.getUniqueid().equals(call.getThirdChannel().getUniqueid())
							&& channel.getActionId() != null 
							&& channel.getActionId().startsWith("IvrMenu-Originate")){
						
						Redirect action = new Redirect(call.getSecondChannel().getChannelName(),
								Fields.threewaycall, call.getRoom(), "1", Utils
										.getSynActionID("p2pcall"));
						AMICore.getInstance().getAMIClient(channel.getPbx()).sendAction(
								action);
						call.setState(CallHandlerImpl.CHATTING);
						//to tell softPhone ivrMenuOut end.ivrMenu result send to softPhone.
						Map<String, String> msgData = new HashMap<String, String>();
						//msgData.put(Fields.VAL_OF_IVR_MENU, call.getMainChannel().getVar(Fields.VAL_OF_IVR_MENU));
						NotifyListener.getInstance().sendToSoftPhoneMessage(Fields.IvrMenuEnd, 
								call.getSecondChannel().getSipPeer().getUserID(), 
								call.getSecondChannel().getAccount(), call.getSecondChannel().getPbx(),msgData);
					}else{
						try {
							call.setState(CallHandlerImpl.END);
							if (call.getMainChannel().getUniqueid().equals(
									channel.getUniqueid())) {
								// TODO This channel should be redirect to the peer
								// it's
								// queue
								// goes to when hanguped.
								//if channel is iveMenu.
								if(channel.isIvrMenu()){
									Redirect redirect = new Redirect(call.getSecondChannel().getChannelName(),
											Fields.ivrmenumainhangup, "s", "1", Utils
													.getSynActionID("endIvrMenu"));
									AMICore.getInstance().getAMIClient(channel.getPbx()).sendAction(
											redirect);
									
									NotifyListener.getInstance().sendToSoftPhoneMessage(Fields.IvrMenuEnd, 
											call.getSecondChannel().getSipPeer().getUserID(), 
											call.getSecondChannel().getAccount(), call.getSecondChannel().getPbx());
								}else{
									ChannelHandler.hangup(call.getSecondChannel());
								}
								if(call.getThirdChannel()!=null){
									ChannelHandler.hangup(call.getThirdChannel());
								}									
							} else {
								if(channel.isIvrMenu()){
									Redirect redirect = new Redirect(call.getMainChannel().getChannelName(),
											Fields.ivrmenusecondhangup, "s", "1", Utils
													.getSynActionID("endIvrMenu"));
									AMICore.getInstance().getAMIClient(channel.getPbx()).sendAction(
											redirect);
									
									NotifyListener.getInstance().sendToSoftPhoneMessage(Fields.IvrMenuEnd, 
											call.getSecondChannel().getSipPeer().getUserID(), 
											call.getSecondChannel().getAccount(), call.getSecondChannel().getPbx());
								}else{
									ChannelHandler.hangup(call.getMainChannel());
								}
								if(call.getThirdChannel()!=null){
									ChannelHandler.hangup(call.getThirdChannel());
								}									
							}
						} catch (Exception e) {
							call.close();
							return;
						}
						call.close();						
					}
				}
				CallListener.getInstance().channelStatusChanged(channel);
			} else if(event.getEventName().equals(Fields.OriginateResponse)) {
				C5Channel mainChannel = (C5Channel) event.getParameters().get(
						Fields.OriginChannel);
				// if originate third system success
				if (event.getParameterValue(Fields.Response).toString()
						.equalsIgnoreCase(Fields.OriginateResultSuccess)) {
					C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(
							mainChannel.getPbx());
					C5Channel thirdChannel = pbx.getChannel(event
							.getStringValue(Fields.Channel));
					thirdChannel.setAccount(mainChannel.getAccount());
					thirdChannel.setCall(call);
					call.setThirdChannel(thirdChannel);
				} else {
					Redirect action = new Redirect(call.getSecondChannel()
							.getChannelName(), Fields.threewaycall,
							call.getRoom(), "1",
							Utils.getSynActionID("p2pcall"));
					AMICore.getInstance().getAMIClient(mainChannel.getPbx())
							.sendAction(action);
					call.setState(CallHandlerImpl.CHATTING);
					// to tell softPhone ivrMenuOut end.ivrMenu result send to
					// softPhone.
					Map<String, String> msgData = new HashMap<String, String>();
					msgData.put(Fields.VAL_OF_IVR_MENU, "DTSF");
					NotifyListener.getInstance().sendToSoftPhoneMessage(
							Fields.IvrMenuEnd,
							call.getSecondChannel().getSipPeer().getUserID(),
							call.getSecondChannel().getAccount(),
							call.getSecondChannel().getPbx(), msgData);
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			call.close();
		}
	}

}
