package com.m7.cc.ass.call.event;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.handler.ChannelHandler;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Connection;
import com.m7.cc.ass.model.C5LisenceHandler;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.WebCallMaxCallTimerTask;
import com.m7.cc.asterisk.ami.AMIField;
import com.m7.cc.asterisk.ami.action.AsteriskEvent;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.QueueAdd;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.asterisk.ami.action.SetVar;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class NewextenHandler {
	private AstEventHandler asterisk;

	private static final Logger log = Logger.getLogger(NewextenHandler.class
			.getName());

	public NewextenHandler(AstEventHandler asterisk) {
		this.asterisk = asterisk;
	}

	/**
	 * Event: Newexten Privilege: call,all Extension: 2000 Application: Queue
	 * Timestamp: 1245168047.680729 Uniqueid: 1244774639.123 Channel:
	 * SIP/6001-09ed0830 Priority: 1 AppData: 2000 Context: g3si
	 */
	public void handleNewexten(AsteriskEvent _event) {
		NewExtenEvent event = new NewExtenEvent();
		event.setValues(_event.getParameters());
		event.addParameter(Fields.PBX, asterisk.getId());
		C5Channel channel = RuntimeData.getInstance().getPbxViaId(
				asterisk.getId()).getChannel(event.getChannel());
		if (channel == null) {
			log.warning("Can not find channel for: " + _event.toString());
			return;
		} else {
			event.addParameter(Fields.Account, channel.getAccount());
			event.addParameter(Fields.ChannelType, channel.getChannelType());
			if (event.getPriority().equalsIgnoreCase("1")
					&& !event.getExtension().equalsIgnoreCase("h")) {
				if (event.getContext().endsWith("validate")) {
					if (event.getExtension().equals("s")) {
						parserContext(event, channel);
						asterisk.notifyChannelPathChanged(event, channel);
					}
				} else {
					parserContext(event, channel);
					asterisk.notifyChannelPathChanged(event, channel);
				}

			}
			if (event.getApplication().equalsIgnoreCase(AMIField.Set)) {
				processSet(event, channel);
			}
		}
	}

	/**
	 * Normal
	 * 
	 * @param event
	 */
	private void parserContext(NewExtenEvent event, C5Channel channel) {
		try {
			String context = event.getContext();
			channel.setLocation(context);
			// the channel enter an account context
			if (context.matches("[0-9]+")) {
				channel.setChannelType(Fields.normal);
				channel.setFromCid(channel.getCallerIDNum());
				//for tonghuashun quan guo luyou hu ru fuwuhao dingzhi 
//				if(event.getExtension().length() == 4){
//					channel.setFromDid("01058010112");
//				}else{
				if(channel.getVar("calledPhone") != null){
					channel.setFromDid(channel.getVar("calledPhone"));
				}else{					
					channel.setFromDid(event.getExtension());					
				}
//				}
				event.setFromCid(channel.getCallerIDNum());
				event.setFromDid(event.getExtension());
				ServiceNo sn = RuntimeData.getInstance().getPbxViaId(
						asterisk.getId()).getServiceNo(context);
				if (sn != null) {
					channel.setAccount(sn.getAccount());
				}
			} else if (context.matches("[A-Z][0-9]+")) {
				if(channel.getSipPeer() != null){
					if(channel.getSipPeer().getAccount().equals(context)){
						channel.setAccount(context);
					}
				}else{
					channel.setAccount(context);					
				}
				if (channel.isLooting()) {
					if (channel.getState().equals(Fields.Link)) {
						channel.setWaitForRing(true);
					} else {
						channel.setState(Fields.Ring);
						asterisk.notifyChannelStatusChanged(channel);
					}
				} else {
					// if it's an new channel, we need to set it's channel type
					if (channel.getChannelType().equalsIgnoreCase(Fields.none)) {
						String fromdid = event.getExtension();
						if (fromdid.startsWith("9")) {
							fromdid = fromdid.substring(1);
//							if(fromdid.startsWith("00")){
//								channel.setChannelType(Fields.dialout);
//								String cid = fromdid.substring(0,3);
//								fromdid = fromdid.substring(3);
//								channel.setFromCid(cid);
//							} else {
								channel.setChannelType(Fields.dialout);
								if (channel.getSipPeer() != null
										&& channel.getSipPeer().getUser() != null)
									channel.setFromCid(channel.getSipPeer()
											.getUser().getDidNum());
								else
									channel.setFromCid(channel.getCallerIDNum());
//							}
						} else {
							if (channel.getVar(Fields.RefUniqueid.toUpperCase()) == null){
								C5Account account = RuntimeData.getInstance()
										.getAccount(asterisk.getId(),
												channel.getAccount());
								if (account != null) {
									if (account.getUserViaExten(fromdid) != null
											|| fromdid.equals("0000")) {

										channel.setChannelType(Fields.inner);
									} else {
										if(fromdid.length() == 4){
											channel.setChannelType(Fields.inner);
										}else{
											channel.setChannelType(Fields.dialout);											
										}
									}
								} else {
									log.warning("Account ["
											+ channel.getAccount()
											+ "] not found in pbx ["
											+ asterisk.getId() + "] on call: "
											+ channel.getChannelName());
								}
							} else {
								channel.setChannelType(Fields.normal);
							}
							if (channel.getSipPeer() != null
									&& channel.getSipPeer().getUser() != null){
								channel.setFromCid(channel.getSipPeer()
										.getUser().getDidNum());
							} else {
								channel.setFromCid(channel.getCallerIDNum());
							}
						}

						channel.setFromDid(fromdid);
						event.setFromCid(channel.getFromCid());
						event.setFromDid(fromdid);
						if (channel.getState().equals(Fields.Up)) {
							channel.setState(Fields.Ring);
							asterisk.notifyChannelStatusChanged(channel);
							channel.setState(Fields.Up);
							asterisk.notifyChannelStatusChanged(channel);
						} else
							asterisk.notifyChannelStatusChanged(channel);
					} else if (channel.getChannelType().equalsIgnoreCase(
							Fields.webcall)) {

					} else if (channel.getChannelType().equals(Fields.transfer)
							|| channel.getChannelType().equals(
									Fields.dialTransfer)) {
						// This channel is transfered to a peer
						// Create ring event here
						String fromdid = event.getExtension();
						if (fromdid.startsWith("9")) {
							fromdid = fromdid.substring(1);
							channel.setFromDid(fromdid);
						}

						if (channel.getState().equals(Fields.Link)) {
							channel.setWaitForRing(true);
						} else {
							channel.setState(Fields.Ring);
							asterisk.notifyChannelStatusChanged(channel);
						}
					} else if (channel.getChannelType().equals(
							Fields.dialTransfer)) {
						String fromdid = event.getExtension();
						if (fromdid.startsWith("9")) {
							fromdid = fromdid.substring(1);
							channel.setFromCid(channel.getFromDid());
							channel.setFromDid(fromdid);
						}

						if (channel.getState().equals(Fields.Link)) {
							channel.setWaitForRing(true);
						} else {
							channel.setState(Fields.Ring);
							asterisk.notifyChannelStatusChanged(channel);
						}
					} else if (channel.getChannelType().equals(Fields.dialout)) {
						String fromdid = event.getExtension();
						if (fromdid.startsWith("9")) {
							fromdid = fromdid.substring(1);
//							if(fromdid.startsWith("00")){
//								String cid = fromdid.substring(0,3);
//								fromdid = fromdid.substring(3);
//								channel.setFromCid(cid);
//							}else {
								if (channel.getSipPeer() != null
										&& channel.getSipPeer().getUser() != null)
									channel.setFromCid(channel.getSipPeer()
											.getUser().getDidNum());
								else
									channel.setFromCid(channel.getCallerIDNum());
//							}
						} 
						channel.setFromDid(fromdid);
					} else if (channel.getChannelType().equals(Fields.normal)){
						if (channel.getState().equals(Fields.Unlink)){
							asterisk.notifyChannelStatusChanged(channel);
							channel.setChannelType(Fields.transfer);
							channel.setFromDid(event.getExtension());
							channel.setState(Fields.Ring);
							asterisk.notifyChannelStatusChanged(channel);
						}
					}
				}
			} else if (context.endsWith(Fields.dialout)) {
				if (channel.getChannelType().equals(Fields.webcall)
						|| channel.getChannelType().equals(Fields.normal)) {
					String fromdid = event.getExtension();
					if (fromdid.startsWith("9")) {
						fromdid = fromdid.substring(1);
						channel.setFromDid(fromdid);
					} else{
						if(channel.getVar("calledPhone") != null){
							channel.setFromDid(channel.getVar("calledPhone"));
						}else{
							channel.setFromDid(fromdid);							
						}
					}
					event.setFromDid(channel.getFromDid());
				} else if (channel.getChannelType().equals(Fields.transfer)) {

				} else if (channel.getChannelType().equals(Fields.dialTransfer)) {

				} else {
					channel.setChannelType(Fields.dialout);
				}
			} else if (context.endsWith(Fields.webcall)) {
				String serviceNo = context.substring(0, context.indexOf('-'));
				channel.setChannelType(Fields.webcall);
				channel.setFromDid(serviceNo);
				String fromcid = channel.getCallerIDNum();
				if (fromcid.startsWith("9")) {
					fromcid = fromcid.substring(1);
					channel.setFromCid(fromcid);
				}
				event.setFromCid(channel.getFromCid());
				event.setFromDid(channel.getFromDid());

				asterisk.notifyChannelStatusChanged(channel);
			} else if (context.endsWith("investigate-pre")) {
				processInvestigatePre(event, channel);
			} else if (context.endsWith("investigate-result")) {
				processInvestigate(event, channel);
			} else if (context.endsWith("satisfaction-result")) {
				processSatisfaction(event, channel);
			} else if (context.endsWith(Fields.voicemail)) {
			} else if (context.endsWith("ivrlogined")) {
				//processIvrLogin(event, channel);
			} else if (context.endsWith("ivrlogout")) {
				//processIvrLogout(event, channel);
			} else if (context.endsWith("dialin")) {
				//processDialin(event, channel);
			} else if (context.endsWith("call")) {
				processCall(event, channel);
			} else if (context.endsWith("threewaycall")) {
				//System.out.println();
			} else if (context.endsWith("queue")) {
				processQueue(event, channel);
			} else if (context.endsWith("queue-hangup-transfer")) {
				processQueueHangup(event, channel);
			} else if (context.endsWith("room")) {
				processRoom(event, channel);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "process NewExtenEvent failed", e);
		}
	}
	
	private void processRoom(NewExtenEvent event, C5Channel channel) {
		channel.setLocation(event.getContext());
		channel.addVar(Fields.Extension, event.getExtension());
		channel.addC5Var(Fields.Extension, event.getExtension());
		asterisk.notifyChannelStatusChanged(channel);
	}

	private void processQueueHangup(NewExtenEvent event, C5Channel channel)
			throws Exception {
		if (channel.getState().equals(Fields.Unlink)) {
			boolean result = ChannelHandler.redirectToQueueHangupPeer(channel);
			if (!result) {
				ChannelHandler.hangup(channel);
			}
		} else {
			ChannelHandler.hangup(channel);
		}
	}

	private void processQueue(NewExtenEvent event, C5Channel channel)
			throws Exception {
		String context = event.getContext();
		String queueExten = context.split("-")[1];
		C5Queue queue = RuntimeData.getInstance().getPbxViaId(channel.getPbx())
				.getQueue(queueExten);
		if (queue != null && channel.getQueue() == null) {
			channel.setQueue(queueExten);
			channel.setQueueName(queue.getDisplayName());
		}
	}

	private void processCall(NewExtenEvent event, C5Channel channel)
			throws Exception {
		String exten = event.getExtension();
		if (exten.startsWith("9")) {
			exten = exten.substring(1);
			String accountID = channel.getAccount();
			String pbx = channel.getPbx();
			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					accountID);
			String context = "";
//			if (account.getLisence().getMaxOutboundCalls() != -1
//					&& account.getCallReport().getCurrentOutCalls() >= account
//							.getLisence().getMaxOutboundCalls()) {
//				context = "dialout-voerload";
//			}
			
			//get account can call international num
			if(exten.startsWith("00")){
//				String param="{\"account\":\""+ accountID +"\",\"calledNum\":\""+exten+"\"}";
//				String url=ASConfig.getInstance().getVar("bill.url")+"?action=service.gatewaySip&data="+param;
//				log.info("send request to bill:"+url);
//				String result=HttpProvider.sendGet(url);
//				log.info("get response from bill:"+result);
//				JSONReader reader=new JSONReader();
//				Map<String,Object> map =(Map<String,Object>)reader.read(result);
//				boolean success=(Boolean)map.get("success");
//				if(status.equals("1")){
//					context = "no-allow-international";
//				}
			}

			if (context.equals("")) {
				if (channel.getChannelType().equalsIgnoreCase(Fields.dialout) &&
						channel.getSipPeer() != null &&
						channel.getSipPeer().getUser() == null){
					context = "no-sipuser-bind";
				}
					
			}
			
			if (context.equals("")) {
				context = accountID + "-predialout";
				if (account.getLisence().isCanDialout()) {
					context = accountID + "-predialout";
				} else {
					C5LisenceHandler.updateLisence(account);
					if (account.getLisence().isCanDialout()) {
						context = accountID + "-predialout";
					}
				}
			}

			Redirect action = new Redirect(channel.getChannelName(), context,
					exten, "1", Utils.getSynActionID("dialout"));
			try {
				AMICore.getInstance().getAMIClient(asterisk.getId())
						.sendSynchronousAction(action);
			} catch (CommunicationException e) {
				log.log(Level.WARNING, "dialout failed", e);
			}
		}
	}

	private void processDialin(NewExtenEvent event, C5Channel channel) {
		String context = event.getContext();
		channel.setLocation(context);
		try {
			String accountID = channel.getAccount();
			String pbx = channel.getPbx();
			String exten = event.getExtension();
			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					accountID);
			User user = account.getUserViaExten(exten);
			if (user == null) {
				Redirect action = new Redirect(channel.getChannelName(),
						accountID + "-2-dialjobnum", "s", "1", Utils
								.getSynActionID("dialjobnum"));
				AMICore.getInstance().getAMIClient(asterisk.getId())
						.sendAction(action);
				return;
			}
			// channel.addVar(Fields.DisposalAgent, user.getId());
			if (user.getSipNum() == null) {
				Redirect action = new Redirect(channel.getChannelName(),
						accountID + "-2-dialjobnum", "s", "1", Utils
								.getSynActionID("dialjobnum"));
				AMICore.getInstance().getAMIClient(asterisk.getId())
						.sendAction(action);
				return;
			}
			SipPeer peer = RuntimeData.getInstance().getSipPeer(pbx,
					user.getSipNum());
			if (peer == null || peer.getChannels().size() > 0) {
				Redirect action = new Redirect(channel.getChannelName(),
						accountID + "-2-dialjobnum", "s", "1", Utils
								.getSynActionID("dialjobnum"));
				AMICore.getInstance().getAMIClient(asterisk.getId())
						.sendAction(action);
				return;
			}

			Redirect action = new Redirect(channel.getChannelName(), accountID
					+ "-dial", user.getSipNum(), "1", Utils
					.getSynActionID("dialin"));
			AsteriskResponse response = AMICore.getInstance().getAMIClient(
					asterisk.getId()).sendSynchronousAction(action);
			boolean result = response.isSuccessful();
			if (!result)
				log.warning("dial in failed: " + response.toString());
		} catch (Exception e) {
			log.log(Level.WARNING, "dial in failed", e);
		}
	}

	private void processIvrLogin(NewExtenEvent event, C5Channel channel) {
		final String number = channel.getFromCid();
		final String pbx = asterisk.getId();
		final String accountID = channel.getAccount();
		Thread thread = new Thread("ivrlogin") {
			public void run() {
				try {
					String _number = number;
					C5Account account = RuntimeData.getInstance().getAccount(
							pbx, accountID);
					SipPeer peer = account.getSipPeerViaLocalNumber(_number);
					if (peer == null
							&& _number.startsWith(ASConfig.getInstance()
									.getDistrictNo())) {
						_number = _number.substring(ASConfig.getInstance()
								.getDistrictNo().length());
						peer = account.getSipPeerViaLocalNumber(_number);
						if (peer == null)
							return;
					}
					User c5user = account.getUserViaLocalNum(_number);
					if (c5user == null) {
						log.warning("can not found user for [" + _number
								+ "] of " + pbx + " " + accountID);
						return;
					}

					C5Connection connection = c5user.getConnection();
					if (connection != null) {
						connection.kick("ukick");
					}
					// logoff reserve user
					else if (c5user.getSipNum() != null
							&& c5user.getQueues().size() > 0) {
						List<String> _queues = c5user.getQueues();
						for (int i = 0; i < _queues.size(); i++) {
							QueueRemove action = new QueueRemove(
									_queues.get(i), "SIP" + "/"
											+ c5user.getSipNum(),
									Utils.getSynActionID("ivrloginqueueremove"));
							try {
								AsteriskResponse response = AMICore
										.getInstance().getAMIClient(pbx)
										.sendSynchronousAction(action);
								boolean result = response.isSuccessful();
								if (!result)
									log.warning("Remove queue member failed: "
											+ response.toString());
							} catch (CommunicationException e) {
								log.log(Level.WARNING,
										"remove queue member failed", e);
								break;
							}
						}
					}

					List<String> queues = account.getQueuesOfUser(c5user
							.getId());
					c5user.setExtenType(Fields.Local);
					c5user.setSipNum(peer.getExten());
					c5user.setQueues(queues);
					c5user.setReserve(true);
					peer.setUser(c5user);
					RuntimeData.getInstance().getPbxViaId(pbx)
							.savePeerTempData(c5user);
					CallListener.getInstance().userSignIn(c5user.getId(),
							c5user);
					for (int i = 0; i < queues.size(); i++) {
						QueueAdd action = new QueueAdd(queues.get(i), "SIP"
								+ "/" + peer.getExten(), Utils
								.getSynActionID("ivrloginqueueadd"));
						C5Queue queue = RuntimeData.getInstance().getQueue(pbx,
								queues.get(i));
						if (queue != null) {
							String penalty = queue.getPenalty(c5user.getId());
							if (penalty == null)
								penalty = "0";
							action.setPanelty(penalty);
						}

						try {
							AsteriskResponse response = AMICore.getInstance()
									.getAMIClient(pbx).sendSynchronousAction(
											action);
							boolean result = response.isSuccessful();
							if (!result)
								log.warning("Add queue member failed: "
										+ response.toString());
						} catch (CommunicationException e) {
							log
									.log(Level.WARNING,
											"add queue member failed", e);
							break;
						}
					}

				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
				}
			}
		};
		thread.setDaemon(true);
		thread.start();
	}

	private void processIvrLogout(NewExtenEvent event, C5Channel channel) {
		final String number = channel.getFromCid();
		final String pbx = asterisk.getId();
		final String accountID = channel.getAccount();
		Thread thread = new Thread("ivrlogout") {
			public void run() {
				try {
					String _number = number;
					C5Account account = RuntimeData.getInstance().getAccount(
							pbx, accountID);
					SipPeer peer = account.getSipPeerViaLocalNumber(_number);

					if (peer == null
							&& _number.startsWith(ASConfig.getInstance()
									.getDistrictNo())) {
						_number = _number.substring(ASConfig.getInstance()
								.getDistrictNo().length());
						peer = account.getSipPeerViaLocalNumber(_number);
						if (peer == null)
							return;
					}
					User c5user = account.getUserViaLocalNum(_number);
					if (c5user == null)
						return;
					List<String> queues = account.getQueuesOfUser(c5user
							.getId());
					c5user.setExtenType("");
					c5user.setSipNum(null);
					c5user.setReserve(false);
					c5user.setLogin(false);
					RuntimeData.getInstance().getPbxViaId(pbx)
							.savePeerTempData(c5user);
					CallListener.getInstance().userSignOut(c5user.getId(),
							c5user);
					for (int i = 0; i < queues.size(); i++) {
						QueueRemove action = new QueueRemove(queues.get(i),
								"SIP" + "/" + peer.getExten(), Utils
										.getSynActionID("ivrloginqueueremove"));
						try {
							AsteriskResponse response = AMICore.getInstance()
									.getAMIClient(pbx).sendSynchronousAction(
											action);
							boolean result = response.isSuccessful();
							if (!result)
								log.warning("Remove queue member failed: "
										+ response.toString());
						} catch (CommunicationException e) {
							log.log(Level.WARNING,
									"remove queue member failed", e);
							break;
						}
					}

				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
				}
			}
		};
		thread.setDaemon(true);
		thread.start();
	}

	private void processInvestigatePre(NewExtenEvent event, C5Channel channel) {
		String context = event.getContext();
		channel.setLocation(context);
		try {
			String account = channel.getAccount();
			Redirect action = new Redirect(channel.getChannelName(), account
					+ "-investigate", "s", "1", Utils
					.getSynActionID("redirect"));
			AsteriskResponse response = AMICore.getInstance().getAMIClient(
					asterisk.getId()).sendSynchronousAction(action);
			boolean result = response.isSuccessful();
			if (!result)
				log.warning("Remove queue member failed: "
						+ response.toString());
		} catch (CommunicationException e) {
			log.log(Level.WARNING, "remove queue member failed", e);
		}
	}

	private void processInvestigate(NewExtenEvent event, C5Channel channel) {
		String context = event.getContext();
		channel.setLocation(context);
	}
	
	private void processSatisfaction(NewExtenEvent event, C5Channel channel) {
		String context = event.getContext();
		channel.setLocation(context);
	}

	/**
	 * the Set command is used to set a app field for c5 of a channel
	 * 
	 * @param event
	 */
	private void processSet(NewExtenEvent event, C5Channel channel) {
		try {
			String[] appData = event.getAppData().split("=", 2);
			String key = appData[0];
			String value = appData[1].replaceAll("\"", "");
			if (key.startsWith("__")) {
				channel.addC5Var(key.substring(2), value);
				channel.addVar(key.substring(2), value);
				if (key.equals("__ACCOUNT")) {
					// if this context is service number and the setting
					// variable is
					// account,
					// we notify this ring event
					channel.addVar(key, value);
					if ((event.getContext().matches("[0-9]+") || event
							.getContext().matches("[0-9]+-webcall"))) {
						// notify ring channel after set the fromdid and fromcid
						if (channel.getState().equals(Fields.Up)) {
							channel.setState(Fields.Ring);
							asterisk.notifyChannelStatusChanged(channel);
							channel.setState(Fields.Up);
							asterisk.notifyChannelStatusChanged(channel);
						} else
							asterisk.notifyChannelStatusChanged(channel);
					}
				}
			} else if (key.equals("RECFILENAME")) {
				if(channel.getMonitorFilename() != null){
					if(channel.getC5Var("EXT_RECFILENAME") == null){
						channel.addC5Var("EXT_RECFILENAME", ASConfig.getInstance().getFileServer() 
								+ "/" + Utils.getRecordFileName(value,channel.getPbx()));
					}else{
						String tmpStr = channel.getC5Var("EXT_RECFILENAME")+";"+ASConfig.getInstance().getFileServer() 
								+ "/"+Utils.getRecordFileName(value, channel.getPbx());
						channel.addC5Var("EXT_RECFILENAME", tmpStr);
					}
				}
				channel.setMonitorFilename(value);
			} else if (key.equals("FROM_CID") || key.equals("FROM_DID")) {
				String result = value;
				if (Utils.isMobileNo(result)) {

				} else if (result.startsWith("0") && Utils.isMobileNo(result.substring(1))) {
					result = value.substring(1);
				} else if (result.startsWith("400")) {

				} 
//				else if (result.startsWith("00") && channel.getChannelType().equals(Fields.dialout)) {
//					channel.setFromCid(result);
//				} 
				else if (result.startsWith("0")) {
					
				} else if (result.matches("[0-9]+")) {
					result = ASConfig.getInstance().getDistrictNo(channel.getAccount()) + result;
				} else if (key.equals("FROM_CID") && result.matches("^[A-Z].+")
						&& channel.getChannelType().equals(Fields.dialTransfer)) {
					result = result.substring(17);
					if(result.startsWith("0")){
						result = result.substring(1);
					}
					channel.setFromCid(result);
					SetVar setCallerIDNum = new SetVar(
							Utils.getSynActionID("setvar"));
					setCallerIDNum.setChannel(channel.getChannelName());
					setCallerIDNum.setVariable("CALLERID(num)");
					setCallerIDNum.setValue(result);
					AMICore.getInstance().getAMIClient(asterisk.getId())
							.sendAction(setCallerIDNum);
				} else if (key.equals("FROM_CID") && !result.equals("")) {
					channel.setFromCid(result);
				}
				if (channel.getVar(Fields.RefUniqueid.toUpperCase()) != null) {
					if (key.equals("FROM_CID")
							&& !channel.getFromCid().equals(result)) {
						channel.setFromCid(result);
					}
				}
				/*
				 * Sometime originate event publish after Newexten event of serviceNo context
				 * in batch dialout processing, so we need to set real callerIDNum to channel's 
				 * fromCID in the Set event.
				 */
				if (channel.getChannelType().equals(Fields.normal)
						&& key.equals("FROM_CID")
						&& RuntimeData
								.getInstance()
								.getAccount(channel.getPbx(),
										channel.getAccount())
								.getBatchDialoutor() != null) {
					channel.setFromCid(channel.getCallerIDNum());
				}
				channel.addVar(key, result);
			} else if (key.equals("ACCOUNT")) {
				// if this context is service number and the setting
				// variable is
				// account,
				// we notify this ring event
				channel.addVar(key, value);
				if ((event.getContext().matches("[0-9]+") || event.getContext()
						.matches("[0-9]+-webcall"))) {
					// notify ring channel after set the fromdid and fromcid
					if (channel.getState().equals(Fields.Up)) {
						channel.setState(Fields.Ring);
						asterisk.notifyChannelStatusChanged(channel);
						channel.setState(Fields.Up);
						asterisk.notifyChannelStatusChanged(channel);
					} else
						asterisk.notifyChannelStatusChanged(channel);
				}

			} else if (key.equals("CALLERID(num)") && event.getContext().matches("[0-9]+")) {
				channel.setFromCid(value);
			} else if (key.equals("KEY_TAG")){
//			else if (key.equals("KEY_TAG") && channel.getChannelType().equals(Fields.dialout)){
				if(channel.getLinkedChannel() != null){
					channel.getLinkedChannel().addVar(key, value);
				}
				channel.addVar(key, value);
			} else if(key.equals("MAX_CALL_TIME")){
				WebCallMaxCallTimerTask maxCallTask = new WebCallMaxCallTimerTask(channel);
				channel.setMaxCallTime(Integer.parseInt(value)*1000);
				channel.setMaxCallTimerTask(maxCallTask);
				channel.addVar(key, value);
			}else{
				channel.addVar(key, value);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "process Set failed", e);
		}
	}

	public void close() {
		this.asterisk = null;
	}
}
