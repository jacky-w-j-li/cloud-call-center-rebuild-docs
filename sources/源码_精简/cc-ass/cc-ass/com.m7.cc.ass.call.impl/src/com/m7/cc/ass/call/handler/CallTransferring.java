package com.m7.cc.ass.call.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.ami.AMIField;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Monitor;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.asterisk.ami.action.StopMonitor;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.notify.service.NotifyListener;
import com.m7.cc.util.Utils;

public class CallTransferring {
	private static Logger log = Logger.getLogger(CallTransferring.class.getName());

	public static C5Response handleAction(Call call, C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		
		try {
			if(action.getActionName().equals(Fields.CancelTransfer)){
				
				//Redirect mainchannel to meetme.
				Redirect redirect = new Redirect(call.getMainChannel()
						.getChannelName(), Fields.threewaycall, call.getRoom(),
						"1", Utils.getSynActionID("p2pcall"));
				AsteriskResponse res = AMICore.getInstance().getAMIClient(
						call.getMainChannel().getPbx()).sendSynchronousAction(redirect);
				//Hangup threechannel.
				if(call.getThirdChannel()!=null){
					ChannelHandler.hangup(call.getThirdChannel());					
				}
				call.setThirdChannel(null);
				
				if(!res.isSuccessful()){
					response.setSucceed(false);
					return response;
				}
				//switch(transferring) to chatting status.
				call.setState(CallHandlerImpl.CHATTING);
				response.setSucceed(true);
			} else {
				response.setSucceed(false);
				response.setMessage("transferring channel faild.");
			}
		}catch(Exception e){
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
	
	public static void handleEvent(Call call, C5Event event) {
		try {
			if (event.getEventName().equals(Fields.ChannelStatus)) {
				C5Channel channel = (C5Channel) event
						.removeParameter(Fields.Channel);
				if (channel.getState().equals(Fields.Hangup)) {
					try {
						channel.setLinked(false);
						channel.setState(Fields.Unlink);
						CallListener.getInstance()
								.channelStatusChanged(channel);
						channel.setState(Fields.Hangup);
						C5Channel mainChannel = call.getMainChannel();
						C5Channel secondChannel = call.getSecondChannel();
						C5Channel thirdChannel = call.getThirdChannel();
						if (mainChannel.getChannelName().equals(
								channel.getChannelName())) {
							call.setState(CallHandlerImpl.END);
							call.close();
							NotifyListener.getInstance().sendToSoftPhoneMessage(Fields.TransferFailed, 
									secondChannel.getSipPeer().getUserID(), 
									secondChannel.getAccount(), secondChannel.getPbx());
							ChannelHandler.hangup(secondChannel);
							ChannelHandler.hangup(thirdChannel);
						} else if(thirdChannel != null && thirdChannel.getChannelName().equals(channel.getChannelName())){
							CallListener.getInstance().channelStatusChanged(
									channel);
							if (secondChannel != null
									&& secondChannel.getCall() == null) {
								secondChannel.setState(Fields.Hangup);
								CallListener.getInstance()
										.channelStatusChanged(secondChannel);
							}
						}
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
						return;
					}
				}else if(channel.getState().equals(Fields.Link)){

					//if transfer-Dial Link Event.
					if(channel.getChannelType().equals(Fields.transfer) ||
							channel.getChannelType().equals(Fields.dialTransfer)){
						try{
							//make mainChannel and secondChannel Unlink event for CDR.
							call.getMainChannel().setState(Fields.Unlink);
							call.getMainChannel().setLinked(false);
							call.getMainChannel().setTimestamp(Utils.getCurrentTimestamp());
							call.getSecondChannel().setState(Fields.Unlink);
							call.getSecondChannel().setLinked(false);
							call.getSecondChannel().setTimestamp(Utils.getCurrentTimestamp());
							CallListener.getInstance().channelStatusChanged(call.getMainChannel());
							CallListener.getInstance().channelStatusChanged(call.getSecondChannel());
							call.getMainChannel().setState(Fields.Ring);
							call.getMainChannel().setLinked(false);
							call.getMainChannel().setTimestamp(Utils.getCurrentTimestamp());
							if (call.getMainChannel().getC5Var(
									Fields.TransferNum) != null) {
								call.getMainChannel().setFromDid(
										call.getMainChannel().getC5Var(
												Fields.TransferNum));
							}
							CallListener.getInstance().channelStatusChanged(call.getMainChannel());

							StopMonitor stopM = new StopMonitor(call.getMainChannel()
									.getChannelName(), Utils.getSynActionID("stopmonitor"));
							AMICore.getInstance().getAMIClient(
									call.getMainChannel().getPbx()).sendAction(stopM);
							Monitor monitor = new Monitor(call.getMainChannel()
									.getChannelName(), Utils.getSynActionID("monitor"));
							monitor.setFile(call.getMainChannel().getMonitorFilename()
									+ "o");
							monitor.setMix("false");
							AMICore.getInstance().getAMIClient(
									call.getMainChannel().getPbx()).sendAction(monitor);
							call.getMainChannel().setMonitorFilename(monitor.getFile());
							call.getThirdChannel().setMonitorFilename(monitor.getFile());
							
							call.getMainChannel().setState(Fields.Link);
							call.getMainChannel().setLinked(true);
							
							C5Channel sc = call.getSecondChannel();
							C5Channel tc = call.getThirdChannel();
							call.setThirdChannel(null);
							call.setSecondChannel(tc);
							
							call.getMainChannel().setLinkedChannel(tc);
							CallListener.getInstance().channelStatusChanged(call.getMainChannel());
							
							//put mainChannel and ThirdChannel to meetme.
							ChannelHandler.redirectSyn(call.getMainChannel(),tc, 
									Fields.threewaycall, call.getRoom(), "1");
							call.setState(CallHandlerImpl.CHATTING);
							
							//to tell softPhone transfer success.
							NotifyListener.getInstance().sendToSoftPhoneMessage(Fields.TransferSuccess, 
									sc.getSipPeer().getUserID(), sc.getAccount(), sc.getPbx());
							
							sc.setCall(null);
							//Hangup secondChannel.
							ChannelHandler.hangup(sc);
						}catch(Exception e){
							log.log(Level.WARNING, "", e);
							return;
						}
					}
					CallListener.getInstance().channelStatusChanged(channel);
				} else if (channel.getState().equals(Fields.Ringing)) {
					C5Channel thirdChannel = call.getThirdChannel();
					if(thirdChannel != null && thirdChannel.getChannelName().equals(channel.getChannelName())){
						CallListener.getInstance().channelStatusChanged(
								channel);
					}
				}
			}else if (event.getEventName().equals(Fields.Newexten)) {
				String context = (String) event.getParameterValue(Fields.Context);
				
				if(context.endsWith("musiconhold")){
					
					C5Channel mainChannel = call.getMainChannel();
					C5Channel secondChannel = call.getSecondChannel();
					if(secondChannel.getCall() !=  null){
						//to tell softPhone transfer failed.
						NotifyListener.getInstance().sendToSoftPhoneMessage(Fields.TransferFailed, 
								secondChannel.getSipPeer().getUserID(), 
								secondChannel.getAccount(), secondChannel.getPbx());
						Redirect redirect = new Redirect(mainChannel.getChannelName(), 
								Fields.threewaycall, call.getRoom(),
								"1", Utils.getSynActionID("p2pcall"));
						AsteriskResponse response = AMICore.getInstance().getAMIClient(
								call.getMainChannel().getPbx()).sendSynchronousAction(redirect);
						if(response.isSuccessful()){
							mainChannel.setState(Fields.Link);
							secondChannel.setState(Fields.Link);
							call.setState(CallHandlerImpl.CHATTING);
						}else{
							call.setState(CallHandlerImpl.END);
							call.close();
						}		
					}else{//if secondChannel Hangup When transferring,mianchannel dial secondChannel.
						Redirect redirect1 = new Redirect(mainChannel.getChannelName(), 
								mainChannel.getAccount()+"-dialin",secondChannel.getSipPeer().getUser().getExten() ,
								"1", Utils.getSynActionID("p2pcall"));
						AsteriskResponse res = AMICore.getInstance().getAMIClient(
								call.getMainChannel().getPbx()).sendSynchronousAction(redirect1);
						if(res.isSuccessful()){
							call.setState(CallHandlerImpl.CHATTING);
						}else{
							call.setState(CallHandlerImpl.END);
							call.close();
						}
					}
					call.setThirdChannel(null);
				}
				String account = event.getStringValue(Fields.Account);
				CallListener.getInstance().channelNewExten(account, event);
				
			} else if(event.getEventName().equals(AMIField.DIAL)){
				C5Channel tc = (C5Channel) event.removeParameter(Fields.Channel);
				call.setThirdChannel(tc);
				//System.out.println("Set transfer thrid chennel!");
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			call.close();
		}
	}

}
