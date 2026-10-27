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
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class HttpTransferHandler {

	private static final Logger log = Logger
			.getLogger(HttpTransferHandler.class.getName());

	public static C5Response processTransfer(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID(), true);
		try{
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			String fromExten = action.getStringValue(Fields.FromExten);

			
			String pbx = null;
			if(action.hasKey(Fields.PBX)){
				pbx = (String) action.getParameterValue(Fields.PBX);
			}
			if(pbx == null){
				pbx = RuntimeData.getInstance().getPbxViaAccount(account);
			}
			if(pbx == null){
				response.setMessage("401 Account not found");
				response.setSucceed(false);
				return response;
			}
			
			C5Account a = RuntimeData.getInstance().getAccount(pbx, account);
			if(a == null){
				response.setMessage("403 Not allowed");
				response.setSucceed(false);
				return response;
			}
			
//			int canDialout = a.getExtenFields().getIntValue(Fields.HttpDialoutPermit);
			int canDialout = a.getExtenFields().getIntValue(Fields.IsTransferIntegration);
			if(canDialout != 1){
				response.setMessage("403 Not allowed");
				response.setSucceed(false);
				return response;
			}

			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setSucceed(false);
				response.setMessage("can not find this pbx: " + pbx);

				return response;
			} else {
				User fromUser = a.getUserViaName(fromExten);
				if(fromUser == null)
					fromUser = a.getUserViaExten(fromExten);
				if(fromUser == null)
					fromUser = a.getUser(fromExten);
				
				if (fromUser == null) {
					response.setMessage("404 Agent not found");
					response.setSucceed(false);
					return response;
				} 
				String sipNum = fromUser.getSipNum();
				if(sipNum == null){
					response.setMessage("409 No call found of this Agent: "
							+ fromExten);
					return response;
				}
				
				SipPeer fromPeer = RuntimeData.getInstance().getSipPeer(pbx, sipNum);
				if(fromPeer == null || fromPeer.getChannels().size() == 0
						|| fromPeer.getChannels().get(0).getLinkedChannel() == null){
					response.setMessage("409 No call found of this Agent: "
							+ fromExten);
					return response;
				}
				C5Channel channel = fromPeer.getChannels().get(0).getLinkedChannel();
				
				User toUser = a.getUserViaName(exten);
				if(toUser == null)
					toUser = a.getUserViaExten(exten);
				if(toUser == null)
					toUser = a.getUser(exten);
				
				if (toUser != null) {
					String status = "";
					boolean idle = true;
					if (toUser.isBusy()) {
						idle = false;
						status = "busy";
					}
					
					String sipNum2 = toUser.getSipNum();
					if(sipNum2 == null){
						response.setMessage("Agent can't take call: "
								+ exten);
						return response;
					}
					
					SipPeer toPeer = RuntimeData.getInstance().getSipPeer(pbx, sipNum2);
					if(toPeer == null){
						response.setMessage("Agent dose not have any sip peer: "
								+ exten);
						return response;
					}
					if (!toPeer.getPeerStatus().equalsIgnoreCase(
							SipPeer.REGISTERED)
							&& !toUser.getExtenType().equalsIgnoreCase(
									Fields.Local)) {
						idle = false;
						status = "unregistered";
					}
					if (toPeer.getChannels().size() > 0) {
						idle = false;
						status = "chatting";
					}

					if (!idle) {
						response.setSucceed(false);
						response.setMessage(status);
						return response;
					}
					channel.addVar(Fields.DisposalAgent,
							toUser.getId());
				} 
				
				//transfer to pstn
				else {
					if(ASConfig.getInstance().isMobileNumber(exten)){
						if(!ASConfig.getInstance().isLocalMobileNumber(exten))
							exten = "0"+exten;
					}
					exten = "9" + exten;
				}
				channel.setTransfer(true);
				if (channel.getLinkedChannel() != null
						&& channel.getChannelType().equalsIgnoreCase(
								Fields.dialout))
					channel.setChannelType(Fields.dialTransfer);
				else if (channel.getChannelType()
						.equalsIgnoreCase(Fields.normal)
						|| channel.getChannelType().equalsIgnoreCase(
								Fields.webcall)) {
					channel.setChannelType(Fields.transfer);
				}

				Redirect redirect = new Redirect(channel.getChannelName(), fromPeer
						.getContext(), exten, "1", action.getActionID());
				AsteriskResponse res;
				try {
					res = amiClient.sendSynchronousAction(redirect);
					boolean result = res.isSuccessful();
					if (!result) {
						response.setSucceed(false);
						response.setMessage("HttpTransfer call failed: "
								+ res.toString());
						return response;
					} else {
						response.setSucceed(true);
						return response;
					}
				} catch (CommunicationException e) {
					log.log(Level.WARNING, "", e);
					response.setSucceed(false);
					return response;
				}
			}
		} catch (Exception e){
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
