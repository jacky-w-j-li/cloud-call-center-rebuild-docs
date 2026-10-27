package com.m7.cc.ass.server.handler;

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class ConsultHandler {
	public static Logger log = Logger.getLogger(ConsultHandler.class.getName());

	public static C5Response consult(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID(), false);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);
			String userId = action.getStringValue(Fields.UserID);
			String exten = (String) action.getParameterValue(Fields.Exten);

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
					user.getSipNum());
			if (sipPeer == null) {
				response.setSucceed(false);
				response.setMessage("SipPeer of user [" + userId
						+ "] not found");
				return response;
			}
			if (sipPeer.getChannels().size() == 0) {
				response.setSucceed(false);
				response.setMessage("No channel found for sippeer ["
						+ sipPeer.getExten() + "]");
				return response;
			}

			C5Channel channel = sipPeer.getChannels().get(0);
			boolean idDialout = false;
			boolean isGroupAcc = false;
			if (exten.startsWith("9")) {
				exten = exten.substring(1);
				exten = "SIP/"
					+ RuntimeData.getInstance()
							.getAccount(pbx, accountId).getSipContact(
									exten, Fields.DialoutFlag) + "@"
					+ ASConfig.getInstance().getDialoutLine() + ":"
					+ ASConfig.getInstance().getDialoutPort();
				idDialout = true;
			} else {
				User touser = null;
				if (exten.length() < 5) {
					touser = RuntimeData.getInstance().getAccount(pbx,
							accountId).getUserViaExten(exten);
				} else {
					touser = RuntimeData.getInstance().getAccount(pbx,
							accountId).getUserViaSipNum(exten);
				}
				if (touser != null) {
					if(touser.getSipNum() == null) {
						response.setSucceed(false);
						response.setMessage("User not logined");
						return response;
					}
					SipPeer peer = RuntimeData.getInstance().getAccount(pbx,
							accountId).getSipPeer(touser.getSipNum());
					if (peer.getChannels().size() > 0){
						response.setMessage("User is chatting");
						response.setSucceed(false);
						return response;
					}
					peer.setOriginateChannel(channel.getChannelName());
					exten = "SIP/" + touser.getSipNum();
				} else {
					String billUrl = ASConfig.getInstance().getVar("lisence.url");
					if(billUrl != null){
						String result = HttpProvider.sendGet(billUrl + "?action=service.queryGroupAccountExten&data={\"account\":\""
								+ channel.getAccount() + "\",\"exten\":\""
								+ exten + "\"}");
						log.log(Level.INFO, "ass require yy-server,consult get group accounts exten or another product exten:"+result);
						if (result != null) {
							JSONReader reader = new JSONReader();
							Map<String, Object> info = (Map<String, Object>) reader.read(result);
							if(info.get("success").toString().equals("true")){
								if(info.get("isHas").toString().equals("true")){
									isGroupAcc = true;
									Map<String, String> agentInfo = (Map<String, String>)info.get("doc");
									String agentId = agentInfo.get("_id");
									String pbxId = agentInfo.get("pbx");
									String pbxUrl = agentInfo.get("sipAddr");
									String agentExten = agentInfo.get("exten");
									String agentAcc = agentInfo.get("account");
									
									exten = agentAcc+agentExten+"@"+pbxUrl;
									exten = "SIP/" + agentAcc+agentExten + "@" +pbxUrl;
								}
							}
						}
					}
					if(!isGroupAcc){
						exten = "SIP/" + exten;
					}
				}
			}

			C5Call call = channel.getCall();
			if (call == null) {
				C5Channel lChannel = channel.getLinkedChannel();
				if (lChannel == null) {
					response.setMessage("channel is not linked");
					response.setSucceed(false);
					return response;
				}
				Call mycall = new Call();
				mycall.setRoom(ASConfig.getThreeWayCallRoom() + "");
				mycall.setMainChannel(lChannel);
				mycall.setSecondChannel(channel);
				call = mycall;
				// Switch call to chatting state
				C5Action unhold = new C5Action(Fields.Unhold, "");
				C5Response unholdRes = mycall.handleAction(unhold);
				unholdRes.addParameter(Fields.Message, "unhold failed");
				if (!unholdRes.isSucceed()) {
					return unholdRes;
				}
			}

			Originate originate = new Originate(exten, call.getRoom(),
					Fields.threewaycall, "1", action.getActionID());
			originate.setAsync("true");
			originate.setTimeout("30000");
			originate.setVariable("__SIPADDHEADER51=7moor-agent-id:"+userId);
			if(idDialout || isGroupAcc) {
				originate.setCallerID(RuntimeData.getInstance().getAccount(pbx,
					accountId).getDidNum(Fields.DialoutFlag));
			}
			AsteriskResponse res1 = AMICore.getInstance().getAMIClient(
					call.getMainChannel().getPbx()).sendSynOriginate(originate);
			String reason = res1.getParameter(Fields.Reason);
			if (res1.isSuccessful() && reason.equals("4")) {
				if(call.getMainChannel() == null || call.getSecondChannel() == null) {
					response.setSucceed(false);
					return response;
				}
				C5Channel thirdChannel = RuntimeData.getInstance().getPbxViaId(
						call.getMainChannel().getPbx()).getChannel(
						res1.getParameter(Fields.Channel));
				call.setThirdChannel(thirdChannel);
			} else {
				response.setSucceed(false);
				response.setMessage(reason);
				return response;
			}
			response = call.handleAction(action);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}

	public static C5Response stopConsult(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID(), false);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String fromExten = action.getStringValue(Fields.FromExten);
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
			C5Call call = channel.getCall();
			if (call == null) {
				Hangup hangupAction = new Hangup(channel.getChannelName(), Utils
						.getSynActionID("hangup"));
				AMICore.getInstance().getAMIClient(channel.getPbx()).sendAction(hangupAction);
				response.setSucceed(true);
				return response;
			}
			response = call.handleAction(action);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
}
