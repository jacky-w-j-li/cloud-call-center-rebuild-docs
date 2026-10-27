package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class ThreeWayCallHandler {

	private static Logger log = Logger.getLogger(ThreeWayCallHandler.class
			.getName());

	public static C5Response handle(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {

			String pbx = action.getStringValue(Fields.PBX);
			String fromExten = action.getStringValue(Fields.FromExten);
			String exten = action.getStringValue(Fields.Exten);
			String accountId = action.getStringValue(Fields.Account);
			String userId = action.getStringValue(Fields.UserID);

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
			User user = account.getUser(userId);
			if (user == null) {
				response.setSucceed(false);
				response.setMessage("User [" + userId + "] not found");
				return response;
			}

			SipPeer sipPeer = RuntimeData.getInstance().getSipPeer(pbx,
					fromExten);
			if (sipPeer == null) {
				response.setSucceed(false);
				response.setMessage("SipPeer [" + fromExten + "] not found");
				return response;
			}
			if (sipPeer.getChannels().size() == 0) {
				response.setSucceed(false);
				response.setMessage("No channel found for sippeer ["
						+ fromExten + "]");
				return response;
			}
			
			C5Channel channel = sipPeer.getChannels().get(0);
			if(channel.getCall() != null){
				return channel.getCall().handleAction(action);
			} else {
				if (channel.getLinkedChannel() == null) {
					response.setSucceed(false);
					response.setMessage("Channel [" + channel.getChannelName()
							+ "] is not linked");
					return response;
				}

				if (exten.length() > 5) {
					exten = "Local/" + exten + "@" + accountId + "-predialout/n";
				} else {
					User toUser = account.getUserViaExten(exten);
					if (toUser != null && toUser.getSipNum() != null) {
						SipPeer peer = RuntimeData.getInstance().getSipPeer(pbx,
								toUser.getSipNum());
						if (peer == null || peer.getChannels().size() > 0) {
							response.setSucceed(false);
							response.setMessage("SipPeer is not idle");
							return response;
						}
						exten = "SIP/" + toUser.getSipNum();
						toUser.setStatus(Fields.ThreeWayCall);
					} else
						exten = "SIP/" + exten;
				}

				String room = ASConfig.getThreeWayCallRoom() + "";
				Originate originate = new Originate(exten, room, Fields.threewaycall,
						"1", action.getActionID());
				AsteriskResponse res = amiClient.sendSynchronousAction(originate);
				boolean result = res.isSuccessful();
				if (!result) {
					response.setSucceed(false);
					response.setMessage("Three-way-call failed: " + res.toString());
					return response;
				}

				Redirect redirect = new Redirect(channel.getChannelName(),
						"threewaycall", room, "1", action.getActionID());
				String toChannel = channel.getLinkedChannel().getChannelName();
				redirect.setExtraChannel(toChannel);

				res = amiClient.sendSynchronousAction(redirect);
				result = res.isSuccessful();
				if (!result) {
					response.setSucceed(false);
					response.setMessage("Three-way-call failed: " + res.toString());
				} else {
					response.setSucceed(true);
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Three-way-call failed", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
