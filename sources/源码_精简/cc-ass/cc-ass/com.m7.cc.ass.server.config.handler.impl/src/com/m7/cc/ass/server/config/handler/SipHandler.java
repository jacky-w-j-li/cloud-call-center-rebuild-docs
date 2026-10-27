package com.m7.cc.ass.server.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.QueueAdd;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class SipHandler {

	private static Logger log = Logger.getLogger(SipHandler.class.getName());

	public static C5Response addSipPeers(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try{
			String account = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			String exten = action.getStringValue(Fields.Exten);
			String name = action.getStringValue(Fields.Name);
			if (account == null) {
				log.warning("Account should not be null in this action: "
						+ action.getJsonString());
				response.setMessage("Account should not be null in this action");
				response.setSucceed(false);
			} else {
				try {
					SipPeer peer = RuntimeData.getInstance().getSipPeer(pbx, exten);
					if(peer == null)
						peer = new SipPeer(pbx, account, exten);
					peer.setName("\"" + name + "\"<"
							+ exten + ">");
					if (action.hasKey(Fields.Secret))
						peer.setSecret(action.getStringValue(Fields.Secret));
					peer.setCall_limit(action.getIntValue(Fields.CallLimit));
					peer.setCanreinvite(action.getBoolValue(Fields.Canreinvite));
					peer.setContext(action.getStringValue(Fields.Context));
					peer.setHost(action.getStringValue(Fields.Host));
					peer.setNat(action.getBoolValue(Fields.Nat));
					peer.setQualify(action.getBoolValue(Fields.Qualify));
					peer.setType(action.getStringValue(Fields.Type));
					peer.setLocal(action.getBoolValue(Fields.Local));
					
					if(action.hasKey(Fields.ExtenType))
						peer.setExtenType(action.getStringValue(Fields.ExtenType));
					
					if(action.hasKey(Fields.DisplayName)){
						String displayName = action.getStringValue(Fields.DisplayName);
						if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
							peer.setDisplayName(displayName);
						}
					}
					
					if(action.hasKey(Fields.UserName))
						peer.setLocalNum(action.getStringValue(Fields.UserName));
					else peer.setLocalNum("");
					
					peer.removeAllAllowAudioCodec();
					if (action.hasKey(Fields.Allow)) {
						String[] allow = action.getStringValue(Fields.Allow).split(",");
						if (allow.length > 0)
						for (int j = 0; j < allow.length; j++) {
							peer.addAllowAudioCodec(allow[j]);
						}
					}
					RuntimeData.getInstance().addSipPeer(pbx,
								account, peer);
//					RuntimeData.getInstance().getPbxViaId(pbx).reload();
					response.setSucceed(true);
				} catch (Exception e) {
					log.log(Level.WARNING, action.getJsonString(), e);
					response.setMessage("Add sip peer failed");
					response.setSucceed(false);
				}
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response bindSipPeer(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID());
		try {
			String accountID = action.getStringValue(Fields.Account);
			String pbxID = action.getStringValue(Fields.PBX);
			String exten = action.getStringValue(Fields.Exten);
			String userID = action.getStringValue(Fields.User);

			C5Account c5account = RuntimeData.getInstance().getAccount(pbxID,
					accountID);
			if (c5account == null) {
				response.setMessage("Account not found:" + accountID);
				response.setSucceed(false);
				log.warning(response.getMessage());
				return response;
			}

			SipPeer sipPeer = c5account.getSipPeer(exten);
			if (sipPeer == null) {
				response.setMessage("Exten not found:" + exten);
				response.setSucceed(false);
				log.warning(response.getMessage());
				return response;
			}
			if (!sipPeer.getExtenType().equals(Fields.gateway)) {
				response.setMessage("Exten not gateway sip:" + exten);
				response.setSucceed(false);
				log.warning(response.getMessage());
				return response;
			}
			User user = c5account.getUser(userID);
			if (user == null) {
				response.setMessage("User not found:" + userID);
				response.setSucceed(false);
				log.warning(response.getMessage());
				return response;
			}
			
			String oldSipNum = null;
			if(sipPeer.getUser()!=null){
				// If binding user has binded this sip peer, return!
				if (user.getOwnSipNums().containsKey(Fields.gateway)) {
					oldSipNum = user.getOwnSipNums().get(Fields.gateway);
					if (oldSipNum.equals(sipPeer.getExten())){ 
						log.info("Acs User " + user.getId() + " has binded this sip peer before, ignore this binding process: " + 
								sipPeer.getExten());
						response.setSucceed(true);
						return response;
					}
				}
				User beforeBindUser = c5account.getUser(sipPeer.getUser().getId());
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
				RuntimeData.getInstance().unbindSipPeer(pbxID, accountID, sipPeer, oldUsers);
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
				SipPeer userOldPeer = c5account.getSipPeer(user.getOwnSipNums().get(Fields.gateway));
				userOldPeer.setUser(null);
				userOldPeer.setUserID(null);
			}
			String[] newUsers = new String[]{user.getId()};
			RuntimeData.getInstance().bindSipPeer(pbxID, accountID, sipPeer, newUsers);
			user.setSipNum(sipPeer.getExten());
			CallListener.getInstance().userUpdate(user.getExten(), user);
			if (oldSipNum != null) {
				SipPeer oldSip = c5account.getSipPeer(oldSipNum);
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
						AMICore.getInstance().getAMIClient(pbxID)
								.sendSynchronousAction(queueAdd);
					}
				} catch (Exception e) {
					log.log(Level.WARNING,
							"QueueRemove failure when sip bind: "
									+ sipPeer.getExten(), e);
				}
			}
			
			sipPeer.setUser(user);
			c5account.updateSippeers();

//			String[] users = userIDs.split(",");
//			RuntimeData.getInstance().bindSipPeer(pbxID, accountID, sipPeer, users);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response unbindSipPeer(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID());
		try {
			String accountID = action.getStringValue(Fields.Account);
			String pbxID = action.getStringValue(Fields.PBX);
			String exten = action.getStringValue(Fields.Exten);
			String userIDs = action.getStringValue(Fields.User);

			C5Account c5account = RuntimeData.getInstance().getAccount(pbxID,
					accountID);
			if (c5account == null) {
				response.setMessage("Account not found:" + accountID);
				response.setSucceed(false);
				log.warning(response.getMessage());
				return response;
			}

			SipPeer sipPeer = c5account.getSipPeer(exten);
			if (sipPeer == null) {
				response.setMessage("Exten not found:" + exten);
				response.setSucceed(false);
				log.warning(response.getMessage());
				return response;
			}
			
			if (!sipPeer.getExtenType().equals(Fields.gateway)) {
				response.setMessage("Exten not gateway sip:" + exten);
				response.setSucceed(false);
				log.warning(response.getMessage());
				return response;
			}

			String[] users = userIDs.split(",");
			RuntimeData.getInstance().unbindSipPeer(pbxID, accountID, sipPeer, users);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
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
