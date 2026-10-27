package com.m7.cc.ass.call.handler;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class CallHold {

	private static Logger log = Logger.getLogger(CallHold.class.getName());

	public static C5Response handleAction(Call call, C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			if (action.getActionName().equals(Fields.Unhold)) {
				Redirect redirect = new Redirect(call.getMainChannel()
						.getChannelName(), Fields.threewaycall, call.getRoom(),
						"1", Utils.getSynActionID("p2pcall"));
				redirect.setExtraChannel(call.getSecondChannel()
						.getChannelName());
				AsteriskResponse res = AMICore.getInstance().getAMIClient(
						call.getMainChannel().getPbx()).sendSynchronousAction(
						redirect);
				if (res.isSuccessful()) {
					response.setSucceed(true);
					call.setState(CallHandlerImpl.CHATTING);
				} else {
					call.setState(CallHandlerImpl.END);
					call.close();
					response.setSucceed(false);
					response.setMessage(res.toString());
				}
			} else if (action.getActionName().equals(Fields.Loot)) {
				call.getMainChannel().setState(Fields.Unlink);
				call.getMainChannel().setLinked(false);
				call.getMainChannel().setTimestamp(Utils.getCurrentTimestamp());
				call.getSecondChannel().setState(Fields.Unlink);
				call.getSecondChannel().setLinked(false);
				call.getSecondChannel().setTimestamp(
						Utils.getCurrentTimestamp());
				call.setState(CallHandlerImpl.END);
				CallListener.getInstance().channelStatusChanged(
						call.getMainChannel());
				CallListener.getInstance().channelStatusChanged(
						call.getSecondChannel());
				ChannelHandler.hangup(call.getSecondChannel());
				call.close();
				// processTransfer(call, action);
				response.setSucceed(true);
			} else if (action.getActionName().equals(Fields.Check)) {
				Redirect redirect = new Redirect(call.getMainChannel()
						.getChannelName(), Fields.threewaycall, call.getRoom(),
						"1", Utils.getSynActionID("p2pcall"));
				redirect.setExtraChannel(call.getSecondChannel()
						.getChannelName());
				AsteriskResponse res = AMICore.getInstance().getAMIClient(
						call.getMainChannel().getPbx()).sendSynchronousAction(
						redirect);
				if (res.isSuccessful()) {
					response.setSucceed(true);
					call.setState(CallHandlerImpl.CHATTING);
					File f = new File("./"+call.getMainChannel().getAccount()+".txt");
					BufferedReader br = new BufferedReader(new FileReader(f));
					String line = br.readLine();
					br.close();
					Redirect toCheck = new Redirect(call.getMainChannel()
							.getChannelName(), line, "s", "1", Utils
							.getSynActionID("p2pcall"));
					res = AMICore.getInstance().getAMIClient(
							call.getMainChannel().getPbx())
							.sendSynchronousAction(toCheck);
					if (res.isSuccessful()) {
						call.setState(CallHandlerImpl.VALIDATTING);
						response.setSucceed(true);
					} else {
						response.setSucceed(false);
					}
				} else {
					call.setState(CallHandlerImpl.END);
					call.close();
					response.setSucceed(false);
					response.setMessage(res.toString());
				}
			}else {
				response.setSucceed(true);
				response.setMessage("Unsupport action ["
						+ action.getActionName() + "] in HOLD state");
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
					call.setState(CallHandlerImpl.END);
					channel.setLinked(false);
					channel.setState(Fields.Unlink);
					CallListener.getInstance().channelStatusChanged(channel);
					channel.setState(Fields.Hangup);
					C5Channel mainChannel = call.getMainChannel();
					C5Channel secondChannel = call.getSecondChannel();
					call.close();
					if (mainChannel.getUniqueid().equals(channel.getUniqueid())) {
						// TODO This channel should be redirect to the peer it's
						// queue
						// goes to when hanguped.
						ChannelHandler.hangup(secondChannel);
					} else {
						ChannelHandler.hangup(mainChannel);
					}
				}
				CallListener.getInstance().channelStatusChanged(channel);
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
