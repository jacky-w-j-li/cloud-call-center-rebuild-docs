package com.m7.cc.ass.call.handler;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class CallChatting {

	private static Logger log = Logger.getLogger(CallChatting.class.getName());

	public static C5Response handleAction(Call call, C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID());
		try {
			// To validate processor
			if (action.getActionName().equals(Fields.Validate)) {
				String exten = (String) action.getParameterValue(Fields.Exten);
				String context = (String) action
						.getParameterValue(Fields.Context);
				Redirect redirect = new Redirect(call.getMainChannel()
						.getChannelName(), context, exten, "1",
						Utils.getSynActionID("Redirect"));
				AsteriskResponse res = AMICore.getInstance()
						.getAMIClient(call.getMainChannel().getPbx())
						.sendSynchronousAction(redirect);
				if (res.isSuccessful()) {
					call.getMainChannel().setState(Fields.Unlink);
					call.getMainChannel().setLinked(false);
					call.getMainChannel().setTimestamp(
							Utils.getCurrentTimestamp());
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
					call.getMainChannel().setChannelType(Fields.validate);
					call.close();
					response.setSucceed(true);
				} else {
					response.setSucceed(false);
					response.setMessage("Validate channel faild.");
				}
			}
			// Three way call processor
			else if (action.getActionName().equals(Fields.ThreeWayCall)) {
				String exten = action.getStringValue(Fields.Exten);
				if (exten.length() > 5) {
					exten = "Local/" + exten + "@"
							+ call.getMainChannel().getAccount()
							+ "-predialout/n";
				} else {
					C5Account account = RuntimeData.getInstance().getAccount(
							call.getMainChannel().getPbx(),
							call.getMainChannel().getAccount());
					User toUser = account.getUserViaExten(exten);
					if (toUser != null && toUser.getSipNum() != null) {
						SipPeer peer = RuntimeData.getInstance().getSipPeer(
								account.getPbx(), toUser.getSipNum());
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
				Originate originate = new Originate(exten, call.getRoom(),
						Fields.threewaycall, "1", action.getActionID());
				AsteriskResponse res = AMICore.getInstance()
						.getAMIClient(call.getMainChannel().getPbx())
						.sendSynchronousAction(originate);
				if (res.isSuccessful()) {
					call.setState(CallHandlerImpl.THREE_WAY_CALL);
					response.setSucceed(true);
				} else {
					call.setState(CallHandlerImpl.CHATTING);
					response.setSucceed(false);
					response.setMessage(res.toString());
				}
			}
			//
			else if (action.getActionName().equals(Fields.Hold)) {
				Redirect redirect = new Redirect(call.getMainChannel()
						.getChannelName(), Fields.musiconhold, "s", "1",
						Utils.getSynActionID("musiconhold"));
				redirect.setExtraChannel(call.getSecondChannel()
						.getChannelName());
				call.setState(CallHandlerImpl.HOLD);
				AsteriskResponse res = AMICore.getInstance()
						.getAMIClient(call.getMainChannel().getPbx())
						.sendSynchronousAction(redirect);
				if (res.isSuccessful()) {
					response.setSucceed(true);
				} else {
					ChannelHandler.hangup(call.getMainChannel());
					call.setState(CallHandlerImpl.END);
					call.close();
					response.setSucceed(false);
					response.setMessage(res.toString());
				}
			}
			// Transfer
			else if (action.getActionName().equals(Fields.Transfer)) {
				response = transfer(call, response, action);
			}
			// Consult
			else if (action.getActionName().equals(Fields.Consult)) {
				response = consult(call, response, action);
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

				// TODO here we need to find the check point where this channel
				// should be redirected.
				File f = new File("./" + call.getMainChannel().getAccount()
						+ ".txt");
				BufferedReader br = new BufferedReader(new FileReader(f));
				String line = br.readLine();
				br.close();
				Redirect toCheck = new Redirect(call.getMainChannel()
						.getChannelName(), line, "s", "1",
						Utils.getSynActionID("p2pcall"));
				AsteriskResponse res = AMICore.getInstance()
						.getAMIClient(call.getMainChannel().getPbx())
						.sendSynchronousAction(toCheck);
				if (res.isSuccessful()) {
					call.setState(CallHandlerImpl.VALIDATTING);
					response.setSucceed(true);
				} else {
					response.setSucceed(false);
				}
			} else if (action.getActionName().equals(Fields.IvrMenuInner)) {
				String ivrMenuContext = action
						.getStringValue(Fields.IvrMenuContext);
				Redirect redirect = new Redirect(call.getMainChannel()
						.getChannelName(), ivrMenuContext, "s", "1",
						Utils.getSynActionID(Fields.IvrMenuInner));
				AsteriskResponse res;
				call.setState(CallHandlerImpl.VALIDATTING);
				res = AMICore.getInstance()
						.getAMIClient(call.getMainChannel().getPbx())
						.sendSynchronousAction(redirect);
				boolean result = res.isSuccessful();
				if (result) {
					// To tell softphone ivrMenuing
					response.setSucceed(true);
				} else {
					call.getMainChannel()
							.addVar(Fields.IvrMenu, ivrMenuContext);
					call.setState(CallHandlerImpl.END);
					call.close();
					// To tell softphone ivrMenuFialed
					response.setSucceed(false);
					response.setMessage("501");
					log.log(Level.WARNING,
							"IvrMenu call failed: \n" + res.toString());
				}
			} else if (action.getActionName().equals(Fields.IvrMenuOut)) {
				call.setState(CallHandlerImpl.VALIDATTING);
				IvrMenu menu = (IvrMenu) action.getParameters().get(
						Fields.IvrMenu);
				// only put secondchannel put into musicOnHold,mainchannel and
				// originate outnum into meetme do ivr-menu .
				String outNum = menu.getMenuOutNum();
				String didNum = RuntimeData.getInstance()
						.getAccount(menu.getPbx(), menu.getAccount())
						.getDidNum(Fields.DialoutFlag);

				AMIClient amiClient = AMICore.getInstance().getAMIClient(
						menu.getPbx());
				if (amiClient == null || !amiClient.isAuthenticated()) {
					response.setSucceed(false);
					response.setMessage("can not find this pbx: "
							+ menu.getPbx());
					return response;
				}
				// redirect secondChannel to musicOnHold.
				Redirect redirect = new Redirect(call.getSecondChannel()
						.getChannelName(), Fields.musiconhold, "s", "1",
						Utils.getSynActionID("Redirect"));
				AsteriskResponse res1;
				res1 = amiClient.sendSynchronousAction(redirect);

				// originate outnum to meetme do ivrMenu with mainchannel.
				String exten = "SIP/"
						+ RuntimeData.getInstance()
								.getAccount(menu.getPbx(), menu.getAccount())
								.getSipContact(outNum, Fields.DialoutFlag)
						+ "@" + ASConfig.getInstance().getDialoutLine() + ":"
						+ ASConfig.getInstance().getDialoutPort();
				String ivrMenuActionID = Utils
						.getSynActionID("IvrMenu-Originate");
				Originate originate = new Originate(exten, call.getRoom(),
						Fields.threewaycall, "1", ivrMenuActionID);
				originate.setAsync("true");
				originate.setTimeout("20000");
				if (!"".equals(didNum))
					originate.setCallerID(didNum);
				C5Pbx c5Pbx = RuntimeData.getInstance().getPbxViaId(
						menu.getPbx());
				if (c5Pbx != null) {
					c5Pbx.addOriginateCache(ivrMenuActionID, call
							.getMainChannel().getChannelName());
				}
				amiClient.sendAction(originate);
				// AsteriskResponse res = amiClient.sendSynOriginate(originate);
				// System.out.println("We are waitting 20s, and nofify!!!");
				// System.out.println("channel size: "+RuntimeData.getInstance()
				// .getPbxViaId(call.getMainChannel().getPbx()).getChannels().size());

				// if (res1.isSuccessful() && res.isSuccessful()) {
				// C5Channel thirdChannel = RuntimeData.getInstance()
				// .getPbxViaId(call.getMainChannel().getPbx())
				// .getChannel(res.getParameter(Fields.Channel));
				// System.out.println("Response originate:"+thirdChannel);
				// if (thirdChannel != null) {
				// thirdChannel.setAccount(menu.getAccount());
				// thirdChannel.setCall(call);
				// call.setThirdChannel(thirdChannel);
				// }
				// call.getMainChannel().addVar(Fields.VAL_OF_IVR_MENU,
				// "dial thrid-party success!");
				// response.setSucceed(true);
				// } else {
				// // if ivrMenu failed
				// // redirect secondChannel to threewaycall.
				// Redirect redirect1 = new Redirect(call.getSecondChannel()
				// .getChannelName(), Fields.threewaycall, call
				// .getRoom(), "1", Utils.getSynActionID("p2pcall"));
				// amiClient.sendSynchronousAction(redirect1);
				//
				// call.getMainChannel().addVar(Fields.VAL_OF_IVR_MENU,
				// "dial thrid-party failed!");
				// response.setSucceed(false);
				// response.setMessage("IvrMenu call third party failed: "
				// + res.toString());
				// }
				response.setSucceed(true);
			} else {
				response.setSucceed(false);
				response.setMessage("Unsupport action ["
						+ action.getActionName() + "] in CHATTING state");
				log.warning("Unsupport action [" + action.getActionName()
						+ "] in CHATTING state");
			}
		} catch (Exception e) {
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
						if(call.getThirdChannel()!=null && call.getThirdChannel().getChannelName().equals(channel.getChannelName())){
							return;
						}
						C5Channel mainChannel = call.getMainChannel();
						C5Channel secondChannel = call.getSecondChannel();
						//----for gua hao wang
						if(mainChannel.getVar("CALL_HANGUP_TRANSFER") != null){
							call.setState(CallHandlerImpl.END);
							call.close();
							String calledPhone = "1234";
							if(mainChannel.getVar("calledPhone") != null){
								calledPhone = mainChannel.getVar("calledPhone");
							}
							System.out.println("CALL_HANGUP_TRANSFER has value!" + mainChannel.getVar("CALL_HANGUP_TRANSFER"));
							C5Channel transferChannel = null;
							if (mainChannel.getChannelName().equals(
									channel.getChannelName())) {
								transferChannel = secondChannel;
								calledPhone = mainChannel.getFromCid();
							} else if (channel.getChannelName().equals(
									secondChannel.getChannelName())) {
								transferChannel = mainChannel;
							}
							if(transferChannel != null){
								String transferContext = mainChannel.getVar("CALL_HANGUP_TRANSFER");
								
								Redirect redirect = new Redirect(transferChannel.getChannelName(), transferContext, calledPhone, "1",
										Utils.getSynActionID(transferContext));
								AsteriskResponse res = AMICore.getInstance()
										.getAMIClient(mainChannel.getPbx())
										.sendSynchronousAction(redirect);
								if (res != null && res.isSuccessful()) {
								} else {
									log.warning("CALL_HANGUP_TRANSFER Transfer call failed! ["+transferContext+"]" + res.toString());
								}							
							}
							return;	
						}
						//-----
						if(mainChannel.getMaxCallTimerTask() != null){
							mainChannel.getMaxCallTimerTask().cancel();
						}
						if(secondChannel.getMaxCallTimerTask() != null){
							secondChannel.getMaxCallTimerTask().cancel();
						}
						if (mainChannel.getChannelName().equals(
								channel.getChannelName())) {
							call.setState(CallHandlerImpl.END);
							call.close();
							ChannelHandler.hangup(secondChannel);
						} else if (channel.getChannelName().equals(
								secondChannel.getChannelName())) {
							call.setState(CallHandlerImpl.END);
							call.close();
							if (!ChannelHandler
									.redirectToQueueHangupPeer(mainChannel)) {
								ChannelHandler.hangup(mainChannel);
							}
						}
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
						return;
					}
				}
				CallListener.getInstance().channelStatusChanged(channel);
			} else if (event.getEventName().equals(Fields.Newexten)) {
				String account = event.getStringValue(Fields.Account);
				CallListener.getInstance().channelNewExten(account, event);
			} else if (event.getEventName().equals(Fields.MeetmeLeave)) {
			}

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			call.close();
		}
	}

	private static C5Response transfer(Call call, C5Response response,
			C5Action action) throws Exception {
		Boolean isTransferNode = action.getBoolValue(Fields.isTransferNode);
		if (!isTransferNode) {
			call.setState(CallHandlerImpl.TRANSFERRING);
			String context = action.getStringValue(Fields.Context);
			String exten = action.getStringValue(Fields.Exten);
			// redirect channel1 to Dial channel3
			Redirect redirect = new Redirect(call.getMainChannel()
					.getChannelName(), context, exten, "1",
					Utils.getSynActionID(context));
			AsteriskResponse res = AMICore.getInstance()
					.getAMIClient(call.getMainChannel().getPbx())
					.sendSynchronousAction(redirect);
			if (res != null && res.isSuccessful()) {
				response.setSucceed(true);
			} else {
				log.warning("Transfer call failed,redirect to dial context failed: "
						+ res.toString());
				response.setSucceed(false);
			}
		} else {// transfer to queue
			call.setState(CallHandlerImpl.END);
			ChannelHandler.hangup(call.getSecondChannel());

			C5Channel mainChannel = call.getMainChannel();
			if (mainChannel != null
					&& mainChannel.getState().equals(Fields.Link)) {
				mainChannel.setState(Fields.Unlink);
				mainChannel.setLinked(false);
				mainChannel.setTimestamp(Utils.getCurrentTimestamp());
				CallListener.getInstance().channelStatusChanged(mainChannel);
			}

			call.close();
		}
		return response;
	}

	private static C5Response consult(Call call, C5Response response,
			C5Action action) throws Exception {
		ChannelHandler.redirect(call.getMainChannel(), Fields.musiconhold, "s",
				"1");
		ChannelHandler.redirect(call.getSecondChannel(),
				call.getThirdChannel(), Fields.threewaycall, call.getRoom(),
				"1");
		call.getThirdChannel().setLinkedChannel(call.getSecondChannel());
		call.setState(CallHandlerImpl.CONSULTING);
		response.setSucceed(true);
		return response;
	}
}
