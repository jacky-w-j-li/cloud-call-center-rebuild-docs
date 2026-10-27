package com.m7.cc.ass.call.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.event.CallCounter;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.ami.action.Monitor;
import com.m7.cc.asterisk.ami.action.StopMonitor;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.notify.service.NotifyListener;
import com.m7.cc.util.Utils;

public class CallConsulting {

	private static Logger log = Logger
			.getLogger(CallConsulting.class.getName());

	public static C5Response handleAction(Call call, C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			if (action.getActionName().equals(Fields.Transfer)) {
				//System.out.println("===="+call.getThirdChannel());
				if(call.getThirdChannel() == null){
					response.setSucceed(false);
					response.setMessage("channel 3 hangup");
					return response;
				}
				ChannelHandler.redirectSyn(call.getMainChannel(),
						Fields.threewaycall, call.getRoom(), "1");

				call.getMainChannel().setState(Fields.Unlink);
				call.getMainChannel().setLinked(false);
				call.getMainChannel().setTimestamp(Utils.getCurrentTimestamp());
				call.getSecondChannel().setState(Fields.Unlink);
				call.getSecondChannel().setLinked(false);
				call.getSecondChannel().setTimestamp(
						Utils.getCurrentTimestamp());
				CallListener.getInstance().channelStatusChanged(
						call.getMainChannel());
				CallListener.getInstance().channelStatusChanged(
						call.getSecondChannel());

				call.getMainChannel().setState(Fields.Ring);
				call.getMainChannel().setLinked(false);
				call.getMainChannel().setTimestamp(Utils.getCurrentTimestamp());
				call.getMainChannel().setChannelType(Fields.transfer);
				CallListener.getInstance().channelStatusChanged(
						call.getMainChannel());

				C5Channel cc = call.getSecondChannel();
				C5Channel tc = call.getThirdChannel();
				call.setThirdChannel(null);
				call.setSecondChannel(tc);
				NotifyListener.getInstance().sendToSoftPhoneMessage(Fields.TransferSuccess, 
						cc.getSipPeer().getUserID(), cc.getAccount(),cc.getPbx());
				cc.setCall(null);
				ChannelHandler.hangup(cc);

				call.getMainChannel().setLinkedChannel(call.getSecondChannel());
				call.getSecondChannel().setLinkedChannel(call.getMainChannel());
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
				call.getSecondChannel().setMonitorFilename(monitor.getFile());

				call.getMainChannel().setState(Fields.Link);
				call.getMainChannel().setLinked(true);
				call.getMainChannel().setTimestamp(Utils.getCurrentTimestamp());
				call.getMainChannel().setLinkedChannel(call.getSecondChannel());
				call.getSecondChannel().setChannelType(Fields.transfer);
				call.getSecondChannel().setState(Fields.Ringing);
				CallCounter.count(
						RuntimeData.getInstance().getPbxViaId(
								call.getSecondChannel().getPbx()),
						call.getSecondChannel());
				call.getSecondChannel().setState(Fields.Link);
				call.getSecondChannel().setLinked(true);
				call.getSecondChannel().setTimestamp(
						Utils.getCurrentTimestamp());
				CallListener.getInstance().channelStatusChanged(
						call.getMainChannel());
				CallListener.getInstance().channelStatusChanged(
						call.getSecondChannel());

				call.setState(CallHandlerImpl.CHATTING);
				response.setSucceed(true);
				return response;
			} else if (action.getActionName().equals(Fields.ThreeWayCall)) {
				if(call.getThirdChannel() == null){
					response.setSucceed(false);
					response.setMessage("channel 3 hangup");
					return response;
				}
				ChannelHandler.redirectSyn(call.getMainChannel(),
						Fields.threewaycall, call.getRoom(), "1");
				call.setState(CallHandlerImpl.THREE_WAY_CALL);
				response.setSucceed(true);
			} else if (action.getActionName().equals(Fields.StopConsult)) {
				if (call.getMainChannel() == null) {
					call.setState(CallHandlerImpl.END);
					ChannelHandler.hangup(call.getSecondChannel());
					ChannelHandler.hangup(call.getThirdChannel());
					call.close();
					response.setSucceed(true);
					response.setMessage("Idle");
					return response;
				} else {
					ChannelHandler.redirect(call.getMainChannel(),
							Fields.threewaycall, call.getRoom(), "1");
					call.setState(CallHandlerImpl.CHATTING);
					try {
						ChannelHandler.hangup(call.getThirdChannel());
					} catch (Exception e) {
						log.log(Level.WARNING, e.getMessage(), e);
					}
					call.setThirdChannel(null);
				}
				response.setSucceed(true);
			} else {
				response.setSucceed(true);
				response.setMessage("Unsupported action ["
						+ action.getActionName() + "] in Consult state");
			}
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
					channel.setLinked(false);
					channel.setState(Fields.Unlink);
					CallListener.getInstance().channelStatusChanged(channel);
					channel.setState(Fields.Hangup);
					C5Channel mainChannel = call.getMainChannel();
					C5Channel secondChannel = call.getSecondChannel();
					if (mainChannel != null
							&& mainChannel.getUniqueid().equals(
									channel.getUniqueid())) {
						// TODO This channel should be redirect to the peer it's
						// queue
						// goes to when hanguped.
						// call.setState(CallHandlerImpl.END);
						// ChannelHandler.hangup(secondChannel);
						// call.close();
						call.setMainChannel(null);
					} else if (secondChannel != null
							&& secondChannel.getUniqueid().equals(
									channel.getUniqueid())) {
						call.setState(CallHandlerImpl.END);
						ChannelHandler.hangup(mainChannel);
						if (call.getThirdChannel() != null) {
							ChannelHandler.hangup(call.getThirdChannel());
						}
						call.close();
					} else if (call.getThirdChannel() != null
							&& call.getThirdChannel().getUniqueid().equals(
									channel.getUniqueid())) {
						 call.setThirdChannel(null);
					}
				}
				CallListener.getInstance().channelStatusChanged(channel);
			} else if (event.getEventName().equals(Fields.Newexten)) {
				String account = event.getStringValue(Fields.Account);
				CallListener.getInstance().channelNewExten(account, event);
			} else if (event.getEventName().equals(Fields.MeetmeJoin)) {
				String channelName = event.getParameters().get(Fields.Channel).toString();
				if(channelName!= null && call.getThirdChannel()!= null){
					if(channelName.equalsIgnoreCase(call.getThirdChannel().getChannelName())){
						call.getThirdChannel().setLinked(true);
						call.getThirdChannel().setState(Fields.Link);
						CallListener.getInstance()
						.channelStatusChanged(call.getThirdChannel());
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			call.close();
		}
	}
}
