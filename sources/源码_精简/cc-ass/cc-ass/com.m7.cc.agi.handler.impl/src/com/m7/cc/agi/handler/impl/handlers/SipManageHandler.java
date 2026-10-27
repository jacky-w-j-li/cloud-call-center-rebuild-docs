package com.m7.cc.agi.handler.impl.handlers;

import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.agi.handler.impl.Activator;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.QueueAdd;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class SipManageHandler {
	
	public static Logger log = Logger.getLogger(SipManageHandler.class.getName());

	public static void bindExten(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = a[1].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			
			action.getParameters().clear();
			
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				session.close();
				return;
			}

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());
			if (account == null) {
				log.warning("Account [" + channel.getAccount()
						+ "] not found");
				session.close();
				return;
			}
			
			SipPeer sipPeer = account.getSipPeer(channel.getExten());
			if (sipPeer == null) {
				log.warning("Sip not found:" + channel.getExten());
				session.close();
				return;
			}
			if (!sipPeer.getExtenType().equals(Fields.gateway)) {
				log.warning("Sip not gateway sip:" + channel.getExten());
				session.close();
				return;
			}
			
			User user = account.getUserViaExten(exten);
			if (user == null) {
				log.warning("User not found: empNo " + exten);
				session.close();
				return;
			}

			session.send("STREAM FILE \"/var/lib/asterisk/sounds/"
					+ "sound/binding"
					+ "\" \"*\"");
			
			String appUrl = ASConfig.getInstance().getVar("app.url");
			if(!appUrl.endsWith("/")){
				appUrl += "/";
			}
			//First ASS do bind operation then close agiSession, last synchronous app and ignore response. 
			appUrl += "service/?action=bindExten&json={\"accountId\":\""+channel.getAccount()
			+"\",\"sip\":\""+channel.getExten()+"\",\"pbx\":\""+pbx+"\",\"userID\":\""+user.getId()+"\"}";
			
			//unbind olduser
			String oldSipNum = null;
			if(sipPeer.getUser()!=null){
				// If binding user has binded this sip peer, return!
				if (user.getOwnSipNums().containsKey(Fields.gateway)) {
					oldSipNum = user.getOwnSipNums().get(Fields.gateway);
					if (oldSipNum.equals(sipPeer.getExten())){ 
						log.info("User " + user.getId() + " has binded this sip peer before, ignore this binding process: " + 
								sipPeer.getExten());
						session.send("set variable bindsucceed \"1\"");
						
						String result = HttpProvider.sendGet(appUrl, 5000);
						log.info("Get return [" + result + "] from url [" + appUrl
								+ "]");
						JSONReader reader = new JSONReader();
						HashMap<String, Object> map = (HashMap<String, Object>) reader.read(result);
						if(!Boolean.valueOf(map.get("success").toString())){
							log.log(Level.WARNING, "["+channel.getExten()+"] bindExten ["+channel.getAccount()+
									"] ["+exten+"] PBX ["+pbx+"] synchronous app failed!!!");
						}
						session.close();
						return;
					}
				}
				User beforeBindUser = account.getUser(sipPeer.getUser().getId());
				if (beforeBindUser != null && (beforeBindUser.isLogin() || beforeBindUser.isReserve())
						&& beforeBindUser.getSipNum().equals(sipPeer.getExten())) {
					if (beforeBindUser.getConnection() != null) {
						beforeBindUser.getConnection().kick("ukick");
					} else {
						removeUserSipFromQueue(beforeBindUser, sipPeer.getExten());
						beforeBindUser.removeAllQueues();
						beforeBindUser.setExtenType("");
						beforeBindUser.setSipNum(null);
						beforeBindUser.setReserve(false);
						beforeBindUser.setLogin(false);
						CallListener.getInstance().userSignOut(exten, user);
					}
				}
				String[] oldUsers = new String[]{sipPeer.getUser().getId()};
				RuntimeData.getInstance().unbindSipPeer(pbx, channel.getAccount(), sipPeer, oldUsers);
				CallListener.getInstance().userUpdate(beforeBindUser.getExten(), beforeBindUser);			
			}
			//bind new user
			boolean isSigninUser = false;
			if ((user.isLogin() || user.isReserve())
					&& user.getExtenType() != null
					&& user.getExtenType().equals(Fields.gateway) 
					&& user.getSipNum() != null
					&& !user.getSipNum().equals("")) {
				removeUserSipFromQueue(user, user.getSipNum());
				isSigninUser = true;
			}
			if (user.getOwnSipNums().containsKey(Fields.gateway)) {
				SipPeer userOldPeer = account.getSipPeer(user.getOwnSipNums().get(Fields.gateway));
				userOldPeer.setUser(null);
				userOldPeer.setUserID(null);
			}
			String[] newUsers = new String[]{user.getId()};
			RuntimeData.getInstance().bindSipPeer(pbx, channel.getAccount(), sipPeer, newUsers);
			user.setSipNum(sipPeer.getExten());
			CallListener.getInstance().userUpdate(user.getExten(), user);
			if (oldSipNum != null) {
				SipPeer oldSip = account.getSipPeer(oldSipNum);
				if (oldSip != null) {
					oldSip.setUser(null);
					oldSip.setUserID(null);
				}
			}
			if (isSigninUser) {
				try {
					QueueAdd queueAdd = null;
					for (String queueExten : user.getQueues()) {
						queueAdd = new QueueAdd(queueExten, "SIP/"
								+ sipPeer.getExten(),
								Utils.getSynActionID("QueueAddOnSipBind"));
						if (user.getBusyType().equals(Fields.B01))
							queueAdd.setPaused("yes");
						AMICore.getInstance().getAMIClient(pbx)
								.sendSynchronousAction(queueAdd);
					}
				} catch (Exception e) {
					log.log(Level.WARNING,
							"QueueRemove failure when sip bind: "
									+ sipPeer.getExten(), e);
				}
			}
			
			sipPeer.setUser(user);
			account.updateSippeers();
			
			session.send("set variable bindsucceed \"1\"");	
			
			String result = HttpProvider.sendGet(appUrl, 5000);
			log.info("Get return [" + result + "] from url [" + appUrl
					+ "]");
			JSONReader reader = new JSONReader();
			HashMap<String, Object> map = (HashMap<String, Object>) reader.read(result);
			if(!Boolean.valueOf(map.get("success").toString())){
				log.log(Level.WARNING, "["+channel.getExten()+"] bindExten ["+channel.getAccount()+
						"] ["+exten+"] PBX ["+pbx+"] synchronous app failed!!!");
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			if(session != null){
				session.close();
			}
		}
	}
	
	public static void queryBindInfo(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			
			action.getParameters().clear();
			
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				
				session.close();
				return;
			}

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());
			if (account == null) {
				log.warning("Account [" + channel.getAccount()
						+ "] not found");
				session.close();
				return;
			}
			
			session.send("STREAM FILE \"/var/lib/asterisk/sounds/"
					+ "sound/searching"
					+ "\" \"*\"");
			//if the pbx is self-support , we don't synchronous app. 
			if(ASConfig.getInstance().getPlatform().equalsIgnoreCase("self-support")){
				
				SipPeer sipPeer = account.getSipPeer(channel.getExten());
				if (sipPeer == null) {
					log.warning("Sip not found:" + channel.getExten());
					session.close();
					return;
				}
				if (!sipPeer.getExtenType().equals(Fields.gateway)) {
					log.warning("Sip not gateway sip:" + channel.getExten());
					session.close();
					return;
				}
				
				User user = sipPeer.getUser();
				if (sipPeer == null) {
					log.warning("User not found:" + channel.getExten());
					session.close();
					return;
				}
				
				String userName = user.getDisplayName();
				String empNo = user.getExten();		
				
				session.send("STREAM FILE \"/var/lib/asterisk/sounds/"
						+ "sound/bindinginfo"
						+ "\" \"*\"");
				session.send("set variable querysucceed \"1\"");	
				StringBuilder readStr = new StringBuilder();
				readStr.append(userName);
				readStr.append(",");
				readStr.append(empNo);
				TtsZhHandler.tts(readStr.toString(), session);
			}else {
				String appUrl = ASConfig.getInstance().getVar("app.url");
				if(!appUrl.endsWith("/")){
					appUrl += "/";
				}
				appUrl += "commonInte/?flag=4&accountId="+channel.getAccount()
							+"&pbx="+pbx
							+"&sip="+channel.getExten();
				String result = HttpProvider.sendGet(appUrl, 3000);
				log.info("Get return [" + result + "] from url [" + appUrl
						+ "]");
				if(result.equals("404")){
					session.send("STREAM FILE \"/var/lib/asterisk/sounds/"
							+ "sound/nobinding"
							+ "\" \"*\"");
					session.send("set variable querysucceed \"1\"");
				} else {
					session.send("STREAM FILE \"/var/lib/asterisk/sounds/"
							+ "sound/bindinginfo"
							+ "\" \"*\"");
					session.send("set variable querysucceed \"1\"");
					TtsZhHandler.tts(result, session);
				}
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			if (session != null) {
				session.close();
			}
		}
	}
	
	public static void sipLogin(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String exten = null;
			if(a.length>1){
				exten = a[1].split("=")[1];				
			}
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			
			action.getParameters().clear();
			
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				session.close();
				return;
			}

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());
			if (account == null) {
				log.warning("Account [" + channel.getAccount()
						+ "] not found");
				session.close();
				return;
			}
			User user = null;
			if(exten == null){
				SipPeer peer = channel.getSipPeer();
				if(peer == null) {
					log.warning("SipPeer not found");
					session.close();
					return;
				}
				user = peer.getUser();
				if(user == null) {
					session.send("set variable siploginsucceed \"404\"");
					session.close();
					return;
				}
			}else{
				user = account.getUserViaExten(exten);
				if(user == null) {
					log.warning("User [" + exten
							+ "] not found");
					session.send("set variable siploginsucceed \"404\"");
					session.close();
					return;
				}
			}
			
			C5Action siginAction = new C5Action(Fields.SignIn, Utils.getSynActionID("signin"));
			siginAction.addParameter(Fields.PBX, account.getPbx());
			siginAction.addParameter(Fields.Account, account.getAccount());
			siginAction.addParameter(Fields.User, user.getId());
			siginAction.addParameter(Fields.ExtenType, Fields.gateway);
			siginAction.addParameter(Fields.SipNum, channel.getExten());
			
			C5Response response = Activator.getHandler().handle(siginAction);
			if(response.isSucceed()){
				session.send("set variable siploginsucceed \"1\"");
			}else if (!(Boolean) response.getParameterValue("isBeyond")){
				session.send("set variable siploginsucceed \"500\"");
			}			
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			if(session != null){
				session.close();
			}
		}
	}
	
	public static void sipLogout(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String pbx = a[0].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);
			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
					.getChannel(channelName);
			
			action.getParameters().clear();
			
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				session.close();
				return;
			}

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					channel.getAccount());
			if (account == null) {
				log.warning("Account [" + channel.getAccount()
						+ "] not found");
				session.close();
				return;
			}
			
			SipPeer peer = channel.getSipPeer();
			if(peer == null) {
				log.warning("SipPeer not found");
				session.close();
				return;
			}
			
			User user = peer.getUser();
			if(user == null){
				session.send("set variable siplogoutsucceed \"404\"");
				session.close();
				return;
			}
			
			C5Action sigoutAction = new C5Action(Fields.SignOut, Utils.getSynActionID("signout"));
			sigoutAction.addParameter(Fields.PBX, account.getPbx());
			sigoutAction.addParameter(Fields.Account, account.getAccount());
			sigoutAction.addParameter(Fields.User, user.getId());
			
			C5Response res = Activator.getHandler().handle(sigoutAction);
			if(res.isSucceed()){
				session.send("set variable siplogoutsucceed \"1\"");
			} else {
				if (res.getParameters().containsKey(Fields.Reason)) {
					session.send("set variable siplogoutsucceed \""
							+ res.getParameters().get(Fields.Reason).toString()
							+ "\"");
				}
			}
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			if (session != null) {
				session.close();
			}
		}
	}
	
	private static void removeUserSipFromQueue(User user, String sipPeerExten) {
		QueueRemove queueRemove = null;
		try {
			for (String queueExten : user.getQueues()) {
				queueRemove = new QueueRemove(
						queueExten,
						"SIP/" + sipPeerExten,
						Utils.getSynActionID("QueueRemoveOnSipBind"));
				AMICore.getInstance().getAMIClient(user.getPbx())
						.sendSynchronousAction(queueRemove);
			}
		} catch (Exception e) {
			log.log(Level.WARNING,
					"QueueRemove failure when sip bind: "
							+ user.getSipNum(), e);
		}
	}
}
