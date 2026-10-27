package com.m7.cc.ass.server.handler;

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.handler.CallHandlerImpl;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.notify.service.NotifyListener;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class TransferHandler {

	private static final Logger log = Logger.getLogger(TransferHandler.class
			.getName());

	public static C5Response processTransfer(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String channelName = (String) action
					.getParameterValue(Fields.Channel);
			String account = action.getStringValue(Fields.Account);
			String userId = action.getStringValue(Fields.UserID);
			String callType = null;
			if (action.hasKey(Fields.CallType))
				callType = action.getStringValue(Fields.CallType);
			String exten = (String) action.getParameterValue(Fields.Exten);
			String context = (String) action.getParameterValue(Fields.Context);
			String customerId = null;
			if (action.hasKey(Fields.CustomerID))
				customerId = (String) action
						.getParameterValue(Fields.CustomerID);

			String workSheetId = null;
			if (action.hasKey(Fields.WorkSheetID))
				workSheetId = (String) action
						.getParameterValue(Fields.WorkSheetID);
			String transferMode = null;
			String transferNum = null;
			String transferAgent = null;
			
			transferAgent = RuntimeData.getInstance().getAccount(pbx, account)
					.getUser(userId).getExten();
			if(exten.startsWith("9")){
				transferNum = exten.substring(1);
				transferMode = "num";
			}else{
				transferNum = exten;
			}
			if(! exten.startsWith("9") && exten.length() > 5){
				transferMode = "skillgroup";
			}
		
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				log.warning("can not find this pbx: " + pbx);
				response.setSucceed(false);
				response.setMessage("300");

				return response;
			}

			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			// If the channel to transfer is null, this action failed.
			if (channel == null) {
				log.warning("Can not find channel: " + channelName);
				response.setSucceed(false);
				response.setMessage("301");
				return response;
			} else if (!channel.getAccount().equals(account)) {
				log.warning("Channel has been reused: " + channelName);
				response.setSucceed(false);
				response.setMessage("302");
				log.warning("reused channeld: " + channelName);
				return response;
			}

			// special transfer
			if (callType != null) {
				User user = RuntimeData.getInstance().getAccount(pbx, account)
						.getUser(userId);
				// //if it's a loot call
				if (callType.equalsIgnoreCase(Fields.Loot)) {
					channel.setLooting(true);
					if (user != null) {
						channel.addVar(Fields.DisposalAgent, user.getId());
						user.setStatus(Fields.Loot);
					}
					
					if (channel.getCall() != null) {
						C5Action act = new C5Action(Fields.Loot,
								Utils.getSynActionID("loot"));
						channel.getCall().handleAction(act);
					}
				}
				// if it's investigate transfer, we set userid into the channel
				else if (callType.equalsIgnoreCase(Fields.investigate)) {
					if (channel.isInvestigatting()) {
						response.setSucceed(false);
						response.setMessage("The channel is already investigatting.");
						return response;
					}
					channel.setInvestigatting(true);
					if (action.hasKey(Fields.UserID))
						channel.addVar(Fields.UserID,
								action.getStringValue(Fields.UserID));
				}
			}
			// normal transfer
			else {
				// // check the peer is idle or busy
				if (customerId != null)
					channel.addVar(Fields.CustomerID, customerId);
				if (workSheetId != null) {
					channel.addVar(Fields.workSheetId, workSheetId);
					channel.addC5Var(Fields.workSheetId, workSheetId);
				}
				channel.setTransfer(true);
				if (channel.getLinkedChannel() != null
						&& channel.getChannelType().equalsIgnoreCase(
								Fields.dialout))
					channel.setChannelType(Fields.dialTransfer);
				else if (channel.getChannelType().equalsIgnoreCase(
						Fields.normal)
						|| channel.getChannelType().equalsIgnoreCase(
								Fields.webcall)) {
					channel.setChannelType(Fields.transfer);
				}
				
				//咨询转接
				//if(transferNum!=null && transferNum.equals("12345") && channel.getCall()!=null){
				if(transferNum!=null && channel.getCall()!=null && channel.getCall().getState().equalsIgnoreCase(CallHandlerImpl.CONSULTING)){
					C5Call call = channel.getCall();
					C5Channel thirdChannel = call.getThirdChannel();
					if(thirdChannel!=null){
						SipPeer peer = thirdChannel.getSipPeer();
						if(peer != null){
							User user = peer.getUser();
							if(user != null){
								transferNum = user.getExten();
							}
						}
					}
				}
				
				boolean isTransferNode = true;
				if (exten.startsWith("9")) {
					if (RuntimeData.getInstance().getAccount(pbx, account)
							.getDialoutLine() == null) {
						log.warning("The dialout line is not configured.");
						response.setMessage("310");
						response.setSucceed(false);
						return response;
					}
					exten = exten.substring(1);
					// Cross PBX transfer
					if (exten.length() < 5) {
						context += "-dialin";
						isTransferNode = true;
					} else {
						exten = RuntimeData.getInstance()
								.getAccount(pbx, account)
								.getSipContact(exten, Fields.DialoutFlag);
						isTransferNode = false;
						context = account + "-transferout";
					}
				} else {
					User user = null;
					if (exten.length() < 5) {
						user = RuntimeData.getInstance()
								.getAccount(pbx, account)
								.getUserViaExten(exten);
					} else {
						user = RuntimeData.getInstance()
								.getAccount(pbx, account)
								.getUserViaSipNum(exten);
					}

					if (user != null) {
						transferMode = "num";
						SipPeer peer = null;
						String sipNum = user.getSipNum();
						if (sipNum == null) {
							sipNum = user.getAvailableSipNum();
						}
						if (sipNum != null) {
							peer = RuntimeData.getInstance().getSipPeer(pbx,
									sipNum);
							if (peer != null) {
								exten = peer.getExten();
								String status = "";
								String errorFlag = "";
								boolean idle = true;
								//if user is busy allow transfer.
//								if (user.isBusy()) {
//									idle = false;
//									status = "busy";
//									errorFlag = "311";
//								}
								if (!peer.getPeerStatus().equalsIgnoreCase(
										SipPeer.REGISTERED)
										&& !user.getExtenType()
												.equalsIgnoreCase(SipPeer.Local)) {
									idle = false;
									status = "unregistered";
									errorFlag = "312";
								}
								if (peer.getChannels().size() > 0) {
									idle = false;
									status = "chatting";
									errorFlag = "313";
								}

								if (!idle) {
									log.warning("user is " + status);
									response.setSucceed(false);
									response.setMessage(errorFlag);
									return response;
								}
								channel.addVar(Fields.DisposalAgent,
										user.getId());
								peer.setOriginateChannel(channel
										.getChannelName());
								// exten = "SIP/" + peer.getExten();
								isTransferNode = false;
								context = Fields.transferdialin;
							}
						} else {
							log.warning("peer is null");
							response.setMessage("314");
							response.setSucceed(false);
							return response;
						}
					} else {
						if (RuntimeData.getInstance().getAccount(pbx, account)
								.getServicePeer(exten) == null) {
								//group accounts or another products dial exten.
							boolean isfound = false;
							String billUrl = ASConfig.getInstance().getVar("lisence.url");
							if(billUrl != null){
								String result = HttpProvider.sendGet(billUrl + "?action=service.queryGroupAccountExten&data={\"account\":\""
										+ channel.getAccount() + "\",\"exten\":\""
										+ exten + "\"}");
								log.log(Level.INFO, "ass require yy-server,transfer dialin get group accounts exten or another product exten:"+result);
								if (result != null) {
									JSONReader reader = new JSONReader();
									Map<String, Object> info = (Map<String, Object>) reader.read(result);
									if(info.get("success").toString().equals("true")){
										if(info.get("isHas").toString().equals("true")){
											isfound = true;
											Map<String, String> agentInfo = (Map<String, String>)info.get("doc");
											String agentId = agentInfo.get("_id");
											String pbxId = agentInfo.get("pbx");
											String pbxUrl = agentInfo.get("sipAddr");
											String agentExten = agentInfo.get("exten");
											String agentAcc = agentInfo.get("account");
											
											exten = agentAcc+agentExten+"@"+pbxUrl;
											channel.addVar(Fields.DisposalAgent, agentId);
											isTransferNode = false;
											context = Fields.transferdialin;
										}
									}
								}
							}
							if(!isfound){
								log.warning("user is null");
								response.setMessage("316");
								response.setSucceed(false);
								return response;
							}
						}
					}
				}
				if(channel.getC5Var(Fields.TransferMode) != null && channel.getC5Var(Fields.TransferNum) != null){
					channel.addC5Var("PreviousTransferMode", channel.getC5Var(Fields.TransferMode));
					channel.addC5Var("PreviousTransferNum", channel.getC5Var(Fields.TransferNum));
				}
				channel.addC5Var(Fields.TransferNum, transferNum);
				channel.addC5Var(Fields.TransferMode,transferMode);
				channel.addC5Var(Fields.TransferAgent, transferAgent);
				// if (exten.startsWith("SIP") || exten.startsWith("N"))
				// {//transfer inbound or outbound.
				if (!isTransferNode) {
					C5Call call = channel.getCall();
					if (call == null) {
						C5Channel lChannel = channel.getLinkedChannel();
						if (lChannel == null) {
							log.warning("channel is not linked");
							response.setMessage("303");
							response.setSucceed(false);
							return response;
						}
						Call mycall = new Call();
						mycall.setRoom(ASConfig.getThreeWayCallRoom() + "");
						mycall.setMainChannel(channel);
						mycall.setSecondChannel(lChannel);
						call = mycall;
						// Switch call(init) to chatting state
						C5Action unhold = new C5Action(Fields.Unhold, "");
						C5Response unholdRes = mycall.handleAction(unhold);
						unholdRes.addParameter(Fields.Message, "unhold failed");
						if (!unholdRes.isSucceed()) {
							log.warning("Unhold caller and agent failed!");
							unholdRes.setMessage("306");
							return unholdRes;
						}
					}

					// Switch call(chatting) to transferring state
					action.addParameter(Fields.isTransferNode, isTransferNode);
					action.addParameter(Fields.Context, context);
					action.addParameter(Fields.Exten, exten);
					C5Response transferRes = call.handleAction(action);
					if (!transferRes.isSucceed()) {
						log.warning("Transfer caller to dial transfered agent failed!");
						transferRes.setMessage("315");
						return transferRes;
					}
					return transferRes;
				} else {
					// transfer to queue (or other peer)
					transferMode = "skillgroup";
					C5Call call = channel.getCall();
					if (call != null) {
						action.addParameter(Fields.isTransferNode,
								isTransferNode);
						action.addParameter(Fields.Context, context);
						action.addParameter(Fields.Exten, exten);
						call.handleAction(action);
					}
				}
			}
			Redirect redirect = new Redirect(channelName, context, exten, "1",
					action.getActionID());
			AsteriskResponse res;
			res = amiClient.sendSynchronousAction(redirect);
			boolean result = res.isSuccessful();
			if (!result) {
				log.warning("Transfer call failed: " + res.toString());
				response.setSucceed(false);
				response.setMessage("304");
			} else {
				response.setSucceed(true);
				//while investigating , hang up the agent's channel , add by pansy 2016-06-12
				if(callType != null && callType.equalsIgnoreCase(Fields.investigate)){
					Call call = (Call)channel.getCall();
					if(call != null){
						call.close();
						C5Channel linkedChannel = channel.getLinkedChannel();					
						if(linkedChannel != null){
							AsteriskResponse invesRes = amiClient
									.sendSynchronousAction(new Hangup(linkedChannel.getChannelName(), action
											.getActionID()+"TransferInvestigateHanupLink"));
							if(!response.isSucceed()){
								if (invesRes.isSuccessful()) {
									log.log(Level.INFO , "while investigating , hang up the agent's channel SUCCESS");
								} else {
									log.log(Level.WARNING , "while investigating , hang up the agent's channel FAILED");
								}
							}
						}
					}
				}
				NotifyListener.getInstance().sendToSoftPhoneMessage(
						Fields.TransferSuccess, userId, account, pbx);
			}

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage("305");
		}
		return response;
	}

	/**
	 * cancel Transfer status
	 */

	public static C5Response processCancelTransfer(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);
		try {
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String channelName = (String) action
					.getParameterValue(Fields.Channel);
			String account = action.getStringValue(Fields.Account);

			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);

			if (channel == null) {
				log.warning("Can not find channel: " + channelName);
				response.setSucceed(false);
				response.setMessage("301");
				return response;
			} else if (!channel.getAccount().equals(account)) {
				log.warning("Channel has been reused: " + channelName);
				response.setSucceed(false);
				response.setMessage("302");
				log.warning("reused channeld: " + channelName);
				return response;
			}

			C5Call call = channel.getCall();
			if (call == null) {
				log.warning("Can not find call: " + channelName);
				response.setSucceed(false);
				response.setMessage("301");
				return response;
			}
			// switch(transferring) to chatting status.
			response = call.handleAction(action);
			
		} catch (Exception e) {
			log.log(Level.WARNING, "Cancel Transfer failed!", e);
		}
		return response;
	}
}
