package com.m7.cc.agi.handler.impl.handlers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.SetVar;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class DialinHandler {
	public static Logger log = Logger.getLogger(DialinHandler.class.getName());

	public static void dialin(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}

		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = a[1].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}

			if (channel.getChannelType().equalsIgnoreCase(Fields.inner)
					&& channel.getSipPeer() != null) {
//for cfzx  
//			if(channel.getSipPeer() != null){
				if (channel.getSipPeer().getUser() == null) {
					if (channel.getSipPeer().getExtenType().equals(Fields.gateway)) {
						session.send("EXEC ChannelRedirect " + channelName
								+ "|no-sipuser-bind|1|1");
						action.getParameters().clear();
						session.close();
						return;
					}
				} else {
					SetVar setCallerIDNum = new SetVar(
							Utils.getSynActionID("setvar"));
					setCallerIDNum.setChannel(channel.getChannelName());
					setCallerIDNum.setVariable("CALLERID(num)");
					setCallerIDNum.setValue(channel.getSipPeer().getUser()
							.getExten());
					AMICore.getInstance().getAMIClient(channel.getPbx())
							.sendSynchronousAction(setCallerIDNum);
					
					SetVar setCallerIDName = new SetVar(
							Utils.getSynActionID("setvar"));
					setCallerIDName.setChannel(channel.getChannelName());
					setCallerIDName.setVariable("CALLERID(name)");
					setCallerIDName.setValue(channel.getSipPeer().getUser()
							.getExten());
					AMICore.getInstance().getAMIClient(channel.getPbx())
							.sendSynchronousAction(setCallerIDName);
				}
			}

			String context = action.getStringValue(Fields.agi_context);
			channel.setLocation(context);

			C5Account account = null;
			if(!context.startsWith(channel.getAccount())){
				account = RuntimeData.getInstance().getAccount(pbx,
						context.substring(0, 12));
			}else{
				account = RuntimeData.getInstance().getAccount(pbx,
						channel.getAccount());				
			}

			boolean isCallerMemory = false;
			if (exten.startsWith("0")){
				exten = exten.substring(1);
				isCallerMemory = true;
			}
			boolean isSipTypeCall = false;
			if (exten.startsWith("99")){
				exten = exten.substring(2);
				isSipTypeCall = true;
			}
			boolean isBusyNotCall = false;
			if (exten.startsWith("9")){
				exten = exten.substring(1);
				isBusyNotCall = true;
			}
			User user = account.getUserViaExten(exten);
			if (user == null) {
				//group accounts or another products dial exten.
				String billUrl = ASConfig.getInstance().getVar("lisence.url");
				if(billUrl != null){
					String result = HttpProvider.sendGet(billUrl + "?action=service.queryGroupAccountExten&data={\"account\":\""
							+ account.getAccount() + "\",\"exten\":\""
							+ exten + "\"}");
					log.log(Level.INFO, "ass require yy-server,get group accounts exten or another product exten:"+result);
					if (result != null) {
						JSONReader reader = new JSONReader();
						Map<String, Object> info = (Map<String, Object>) reader.read(result);
						if(info.get("success").toString().equals("true")){
							if(info.get("isHas").toString().equals("true")){
								Map<String, String> agentInfo = (Map<String, String>)info.get("doc");
								String pbxId = agentInfo.get("pbx");
								String pbxUrl = agentInfo.get("sipAddr");
								String agentExten = agentInfo.get("exten");
								String agentAcc = agentInfo.get("account");
								if(pbxId.equals(pbx)){
									session.send("SET VARIABLE hasGroupAccExten 2");
									session.send("SET VARIABLE groupAcc "+agentAcc);
								}else{
									session.send("SET VARIABLE hasGroupAccExten 1");
									session.send("SET VARIABLE groupAccExten "+agentAcc+agentExten+"@"+pbxUrl);
								}
								action.getParameters().clear();
								session.close();
								return;
							}
						}
					}
				}
				//------
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-2-dialjobnum|s|1");
				action.getParameters().clear();
				session.close();
				return;
			}

			if(isBusyNotCall && user.isBusy()){
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-2-dialjobnum-agentbusy|s|1");
				action.getParameters().clear();
				session.close();
				return;
			}
			
			String sipNum = user.getAvailableCCSipNum();
			if(sipNum == null && isCallerMemory){
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-2-dialjobnum-logoff|s|1");
				action.getParameters().clear();
				session.close();
				return;
			}
			
//			if (sipNum == null) {
//				// if ucExtenType = resonance(gong zhen)
//				if (user.getUcExtenType().equals(Fields.resonance)) {
//					List<String> ucSipList = DialinHandler.getUcAllSip(user);
//					StringBuilder sb = new StringBuilder();
//					sb.append("EXEC Dial ");
//					for (int i = 0; i < ucSipList.size(); i++) {
//						if (i == 0) {
//							sb.append("SIP/" + ucSipList.get(i));
//						} else {
//							sb.append("&SIP/" + ucSipList.get(i));
//						}
//					}
//					session.send(sb.toString());
//					action.getParameters().clear();
//					session.close();
//					return;
//				}
//				// if usExtenType = polling (lun xun)
//				if (user.getUcExtenType().equals(Fields.polling)) {
//
//					String pollSipNum = user.getOwnSipNums().get("sip");
//					String pollLocalNum = user.getOwnSipNums().get("Local");
//					String pollGatewayNum = user.getOwnSipNums().get("gateway");
//
//					session.send("EXEC ChannelRedirect " + channelName
//							+ "|ucpolling|" + pollSipNum + "_" + pollLocalNum
//							+ "_" + pollGatewayNum + "|1");
//
//					action.getParameters().clear();
//					session.close();
//					return;
//				}
//
//				sipNum = user.getAvailabeUCSipNum();
//			}

			if (sipNum == null) {
				// User may be extension license, we get gateway sip number
				// first, and Local, and sip.
				sipNum = user.getAvailableGatewayTypeSipNum();
				if (sipNum == null) {
					if (sipNum == null && isSipTypeCall == true) {
						sipNum = user.getAvailableSipTypeSipNum();
					}else{
						sipNum = user.getOwnSipNums().get(Fields.Local);
						//User has sip number of Local type, but local number not set.
						if(sipNum != null && user.getLocalNumber() == null){
							sipNum = null;
						}						
					}
				}
				// If all null, call failure.
				if (sipNum == null) {
					session.send("EXEC ChannelRedirect " + channelName + "|"
							+ account.getAccount() + "-2-dialjobnum-logoff|s|1");
					action.getParameters().clear();
					session.close();
					return;
				}
			}

			SipPeer peer = RuntimeData.getInstance().getSipPeer(pbx, sipNum);
			if (peer.getChannels().size() > 0) {
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-2-dialjobnum-agentbusy|s|1");
				action.getParameters().clear();
				session.close();
				return;
			}

			if (channel.getChannelType().equals(Fields.normal) ||
					channel.getVar(Fields.RefUniqueid.toUpperCase()) != null){
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-dial|" + sipNum + "|1");
			} else {
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-call|" + sipNum + "|1");
			}
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}

	// get uc user all sipNum (local,gateway,sip)
	public static List<String> getUcAllSip(User user) {
		List<String> ucSipList = new ArrayList<String>();

		for (String mapKey : user.getOwnSipNums().keySet()) {
			ucSipList.add(user.getOwnSipNums().get(mapKey));
		}

		return ucSipList;
	}
	
	public static void dialinWithoutRedirect(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}

		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = a[1].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}

			if (channel.getChannelType().equalsIgnoreCase(Fields.inner)
					&& channel.getSipPeer() != null) {
				if (channel.getSipPeer().getUser() == null) {
					session.send("EXEC ChannelRedirect " + channelName
							+ "|no-sipuser-bind|1|1");
					action.getParameters().clear();
					session.close();
					return;
				} else {
					SetVar setCallerIDNum = new SetVar(
							Utils.getSynActionID("setvar"));
					setCallerIDNum.setChannel(channel.getChannelName());
					setCallerIDNum.setVariable("CALLERID(num)");
					setCallerIDNum.setValue(channel.getSipPeer().getUser()
							.getExten());
					AMICore.getInstance().getAMIClient(channel.getPbx())
							.sendSynchronousAction(setCallerIDNum);
				}
			}

			String context = action.getStringValue(Fields.agi_context);
			channel.setLocation(context);

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());

			boolean isCallerMemory = false;
			if (exten.startsWith("0")){
				exten = exten.substring(1);
				isCallerMemory = true;
			}
			User user = account.getUserViaExten(exten);
			if (user == null) {
				session.send("set variable nextContext \""
						+ account.getAccount() + "-2-dialjobnum\"");
				action.getParameters().clear();
				session.close();
				return;
			}

			String sipNum = user.getAvailableCCSipNum();
			if(sipNum == null && isCallerMemory){
				session.send("set variable nextContext \""
						+ account.getAccount() + "-2-dialjobnum-logoff\"");
				action.getParameters().clear();
				session.close();
				return;
			}
			
			if (sipNum == null) {
				// if ucExtenType = resonance(gong zhen)
				if (user.getUcExtenType().equals(Fields.resonance)) {
					List<String> ucSipList = DialinHandler.getUcAllSip(user);
					StringBuilder sb = new StringBuilder();
					sb.append("EXEC Dial ");
					for (int i = 0; i < ucSipList.size(); i++) {
						if (i == 0) {
							sb.append("SIP/" + ucSipList.get(i));
						} else {
							sb.append("&SIP/" + ucSipList.get(i));
						}
					}
					session.send(sb.toString());
					action.getParameters().clear();
					session.close();
					return;
				}
				// if usExtenType = polling (lun xun)
				if (user.getUcExtenType().equals(Fields.polling)) {

					String pollSipNum = user.getOwnSipNums().get("sip");
					String pollLocalNum = user.getOwnSipNums().get("Local");
					String pollGatewayNum = user.getOwnSipNums().get("gateway");

					session.send("EXEC ChannelRedirect " + channelName
							+ "|ucpolling|" + pollSipNum + "_" + pollLocalNum
							+ "_" + pollGatewayNum + "|1");

					action.getParameters().clear();
					session.close();
					return;
				}

				sipNum = user.getAvailabeUCSipNum();
			}

			if (sipNum == null) {
				// User may be extension license, we get gateway sip number
				// first, and Local, and sip.
				sipNum = user.getAvailableGatewayTypeSipNum();
				if (sipNum == null) {
					sipNum = user.getOwnSipNums().get(Fields.Local);
					//User has sip number of Local type, but local number not set.
					if(sipNum != null && user.getLocalNumber() == null){
						sipNum = null;
					}
					if (sipNum == null) {
						sipNum = user.getAvailableSipTypeSipNum();
					}
				}
				// If all null, call failure.
				if (sipNum == null) {
					session.send("set variable nextContext \""
							+ account.getAccount() + "-2-dialjobnum-logoff\"");
					action.getParameters().clear();
					session.close();
					return;
				}
			}

			SipPeer peer = RuntimeData.getInstance().getSipPeer(pbx, sipNum);
			if (peer.getChannels().size() > 0) {
				session.send("set variable nextContext \""
						+ account.getAccount() + "-2-dialjobnum-agentbusy\"");
				action.getParameters().clear();
				session.close();
				return;
			}

			if (channel.getChannelType().equals(Fields.normal) ||
					channel.getVar(Fields.RefUniqueid.toUpperCase()) != null){
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-dial|" + sipNum + "|1");
			} else {
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-call|" + sipNum + "|1");
			}
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
	
	public static void getUserSipViaFromDid(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}

		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String fromDID = a[1].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			
			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());

			if (account == null) {
				log.warning("Account [" + channel.getAccount()
						+ "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			
			User user = account.getUserViaCallerIDNum(fromDID);
			if (user == null) {
				log.warning("User not found, find via fromDID: " + fromDID);
				action.getParameters().clear();
				session.close();
				return;
			}
			
			String exten = user.getExten();
			session.send("SET VARIABLE userExten " + exten);
			
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
	
	public static void superDialin(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}
		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = a[1].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}

			if (channel.getChannelType().equalsIgnoreCase(Fields.inner)
					&& channel.getSipPeer() != null) {
				if (channel.getSipPeer().getUser() == null) {
					if (channel.getSipPeer().getExtenType().equals(Fields.gateway)) {
						session.send("EXEC ChannelRedirect " + channelName
								+ "|no-sipuser-bind|1|1");
						action.getParameters().clear();
						session.close();
						return;
					}
				} else {
					SetVar setCallerIDNum = new SetVar(
							Utils.getSynActionID("setvar"));
					setCallerIDNum.setChannel(channel.getChannelName());
					setCallerIDNum.setVariable("CALLERID(num)");
					setCallerIDNum.setValue(channel.getSipPeer().getUser()
							.getExten());
					AMICore.getInstance().getAMIClient(channel.getPbx())
							.sendSynchronousAction(setCallerIDNum);
					
					SetVar setCallerIDName = new SetVar(
							Utils.getSynActionID("setvar"));
					setCallerIDName.setChannel(channel.getChannelName());
					setCallerIDName.setVariable("CALLERID(name)");
					setCallerIDName.setValue(channel.getSipPeer().getUser()
							.getExten());
					AMICore.getInstance().getAMIClient(channel.getPbx())
							.sendSynchronousAction(setCallerIDName);
				}
			}

			String context = action.getStringValue(Fields.agi_context);
			channel.setLocation(context);

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());

			User user = account.getUserViaExten(exten);
			if (user == null) {
//				session.send("EXEC ChannelRedirect " + channelName + "|"
//						+ account.getAccount() + "-2-dialjobnum|s|1");
				session.send("SET VARIABLE JOBNUM_STATUS \"1\"");
				action.getParameters().clear();
				session.close();
				return;
			}

			String sipNum = user.getAvailableCCSipNum();
			if (sipNum == null) {
				// User may be extension license, we get gateway sip number
				// first, and Local, and sip.
				sipNum = user.getAvailableGatewayTypeSipNum();
				if (sipNum == null) {
					sipNum = user.getOwnSipNums().get(Fields.Local);
					//User has sip number of Local type, but local number not set.
					if(sipNum != null && user.getLocalNumber() == null){
						sipNum = null;
					}
				}
				// If all null, call failure.
				if (sipNum == null) {
//					session.send("EXEC ChannelRedirect " + channelName + "|"
//							+ account.getAccount() + "-2-dialjobnum-logoff|s|1");
					session.send("SET VARIABLE JOBNUM_STATUS \"2\"");
					action.getParameters().clear();
					session.close();
					return;
				}
			}

			SipPeer peer = RuntimeData.getInstance().getSipPeer(pbx, sipNum);
			if (peer.getChannels().size() > 0) {
//				session.send("EXEC ChannelRedirect " + channelName + "|"
//						+ account.getAccount() + "-2-dialjobnum-agentbusy|s|1");
				session.send("SET VARIABLE JOBNUM_STATUS \"3\"");
				action.getParameters().clear();
				session.close();
				return;
			}

			if (channel.getChannelType().equals(Fields.normal) ||
					channel.getVar(Fields.RefUniqueid.toUpperCase()) != null){
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-dial|" + sipNum + "|1");
			} else {
				session.send("EXEC ChannelRedirect " + channelName + "|"
						+ account.getAccount() + "-call|" + sipNum + "|1");
			}
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
}
