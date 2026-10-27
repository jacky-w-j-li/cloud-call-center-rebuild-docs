package com.m7.cc.ass.server.handler;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Connection;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class KickHandler {
	private static Logger log = Logger.getLogger(KickHandler.class.getName());

	public static C5Response processKick(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());

		try {
			String userId = (String) action.getParameterValue(Fields.Exten);
			String account = action.getStringValue(Fields.Account);
			String pbx = (String) action.getParameterValue(Fields.PBX);
			User user = RuntimeData.getInstance().getAccount(pbx, account)
					.getUserViaUserId(userId);
			if (user == null) {
				user = RuntimeData.getInstance().getAccount(pbx, account)
						.getUser(userId);
			}
			if (user == null) {
				response.setMessage("User [" + userId + "] not found in pbx ["
						+ pbx + "]");
				response.setSucceed(false);
				return response;
			}

			C5Connection connection = user.getConnection();
			if (connection != null) {
				connection.kick("akick");
				response.setSucceed(true);
			}
			// kick offline peer such as gateway/local
			else if (connection == null) {
				AMIClient ami = AMICore.getInstance().getAMIClient(pbx);
				if (user.getSipNum() != null) {
					// remove it from queues
					for (int i = 0; i < user.getQueues().size(); i++) {
						String queue = user.getQueues().get(i);
						QueueRemove remove = new QueueRemove(queue, "SIP" + "/"
								+ user.getSipNum(), Utils
								.getSynActionID("kickqueueremove"));
						try {
							AsteriskResponse res = ami
									.sendSynchronousAction(remove);
							boolean result = res.isSuccessful();
							if (!result) {
								// response.setMessage(message)
							}
						} catch (CommunicationException e) {
							response.setMessage(e.getMessage());
							response.setSucceed(false);
							break;
						}
					}
				}
				user.removeAllQueues();
				user.setSipNum(null);
				user.setReserve(false);
				user.setExtenType("");
				user.setLogin(false);
				RuntimeData.getInstance().getPbxViaId(pbx).savePeerTempData(
						user);
				CallListener.getInstance().userSignOut(user.getUser(),
						user);
				response.setSucceed(true);
			}
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}

	/**
	 * Sign in this user as local model.
	 * 
	 * @param action
	 * @return
	 */
	public static C5Response signIn(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String userId = null;
			if (action.hasKey(Fields.User)) {
				userId = action.getStringValue(Fields.User);				
			}
			String extenType = Fields.Local;
			String exten = null;
			if (action.hasKey(Fields.ExtenType)) {
				extenType = action.getStringValue(Fields.ExtenType);
			}
			if (action.hasKey(Fields.Exten)) {
				exten = action.getStringValue(Fields.Exten);
			}
			boolean autoBusy = false;
			if (action.hasKey(Fields.AutoBusy))
				autoBusy = action.getBoolValue(Fields.AutoBusy);
			
			User user = null;
			if(userId == null){
				user = RuntimeData.getInstance().getAccount(pbx, account).getUserViaExten(exten);
				userId = user.getId();
			}else{
				user = RuntimeData.getInstance().getAccount(pbx, account).getUser(userId);
			}
			if (user == null) {
				log.warning("User not found: " + userId + " ["
						+ action.getActionID() + "]");
				response.setMessage("User not found");
				response.setSucceed(false);
				return response;
			}
			
			if(user.getSipNum() == null){
				if(RuntimeData.getInstance().getAccount(pbx, account).isBeyondLicense(user.getVersion())){
					log.warning("User sign in but beyond license: " + userId + " ["
							+ action.getActionID() + "]");
					response.setMessage("User sign in but beyond license");
					response.setSucceed(false);
					response.addParameter("isBeyond", false);
					return response;
				}
			}
			
			SipPeer peer = null;
			if (extenType.equals(Fields.Local)) {
				if (user.getLocalNumber() == null) {
					log.warning("User has not local number: " + userId + " ["
							+ action.getActionID() + "]");
					response.setMessage("User has not local number");
					response.setSucceed(false);
					return response;
				}
				peer = RuntimeData.getInstance().getAccount(pbx, account).getSipPeerViaUserIdAndExtenType(userId, Fields.Local);
			}else if(extenType.equals(Fields.gateway)){
				if (user.getAvailableGatewayTypeSipNum() == null) {
					log.warning("User has not bind gateway sip number or gateway sip number not register: " + userId + " ["
							+ action.getActionID() + "]");
					response.setMessage("User has not bind gateway sip number or gateway sip number not register!");
					response.setSucceed(false);
					return response;
				}
				peer = RuntimeData.getInstance().getSipPeer(pbx, user.getAvailableGatewayTypeSipNum());
//				peer = RuntimeData.getInstance().getAccount(pbx, account)
//						.getSipPeerViaUser(userId, extenType);
			}else {
				String sipNum = action.getStringValue(Fields.SipNum);
				peer = RuntimeData.getInstance().getAccount(pbx, account)
						.getSipPeer(sipNum);
			}

			if (peer == null) {
				response.setSucceed(false);
				response.setMessage("no local peer found for this user: "
						+ user.getId());
				return response;
			}
			//kick prelogin
			LoginHandler.kickRelatedUser(pbx, account, peer.getExten(), user);
			
			peer.setUser(user);
			
			List<String> queues = RuntimeData.getInstance().getAccount(pbx,
					account).getQueuesOfUser(userId);
			user.setQueues(queues);
			user.setSipNum(peer.getExten());
			user.setExtenType(extenType);
			user.setReserve(true);
			
			C5Action queueaction = new C5Action("addqueuemember", Utils
					.getSynActionID("addqueuemember"));
			queueaction.addParameter(Fields.User, user);
			if(autoBusy){
				queueaction.addParameter(Fields.Paused, true);
			}
			QueueActionHandler.queueAdd(queueaction);
			
			RuntimeData.getInstance().getPbxViaId(pbx).savePeerTempData(user);
			CallListener.getInstance().userSignIn(userId, user);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}

	public static C5Response signOut(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String userId = null;
			if (action.hasKey(Fields.User)) {
				userId = action.getStringValue(Fields.User);				
			}
			String exten = null;
			if (action.hasKey(Fields.Exten)) {
				exten = action.getStringValue(Fields.Exten);
			}
			User user = null;
			if(userId == null){
				user = RuntimeData.getInstance().getAccount(pbx, account).getUserViaExten(exten);
				userId = user.getId();
			}else{
				user = RuntimeData.getInstance().getAccount(pbx, account).getUser(userId);
			}
			if (user == null) {
				log.warning("User not found: " + userId + " ["
						+ action.getActionID() + "]");
				response.setMessage("User not found");
				response.setSucceed(false);
				return response;
			}
			if (user.getSipNum() == null) {
				log.info("User sign out but not signin yet: " + userId);
				response.addParameter(Fields.Reason, 301);
				response.setSucceed(false);
				return response;
			}
			
			SipPeer peer = RuntimeData.getInstance().getAccount(pbx, account)
					.getSipPeer(user.getSipNum());

			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setSucceed(false);
				response.setMessage("can not find this pbx: " + pbx);
				return response;
			}
			if (peer == null) {
				response.setSucceed(false);
				response.setMessage("no local peer found for this user: "
						+ user.getId());
				return response;
			}
			
			//kick prelogin
			C5Connection connection = user.getConnection();
			if (connection != null) {
				connection.kick("ekick");
			}

			List<String> queues = RuntimeData.getInstance().getAccount(pbx,
					account).getQueuesOfUser(userId);

			for (int i = 0; i < queues.size(); i++) {
				QueueRemove queueRemove = new QueueRemove(queues.get(i), "SIP" + "/"
						+ user.getSipNum(), Utils.getSynActionID("queueremove"));
				amiClient.sendAction(queueRemove);
			}

			user.setExtenType("");
			user.setSipNum(null);
			user.setReserve(false);
			user.setLogin(false);
			RuntimeData.getInstance().getPbxViaId(pbx).savePeerTempData(user);
			CallListener.getInstance().userSignOut(userId, user);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
	public static C5Response queryExtenState(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String userId = null;
			if (action.hasKey(Fields.User)) {
				userId = action.getStringValue(Fields.User);				
			}
			String exten = null;
			if (action.hasKey(Fields.Exten)) {
				exten = action.getStringValue(Fields.Exten);
			}
			User user = null;
			C5Account curaccount= RuntimeData.getInstance().getAccount(pbx, account);
			if (curaccount == null) {
				log.warning("Account not found: " + account + " ["
						+ action.getActionID() + "]");
				response.setMessage("Account not found");
				response.setSucceed(false);
				return response;
			}
			if(userId == null){
				user = curaccount.getUserViaExten(exten);
				userId = user.getId();
			}else{
				user = curaccount.getUser(userId);
			}
			if (user == null) {
				log.warning("User not found: " + userId + " ["
						+ action.getActionID() + "]");
				response.setMessage("User not found");
				response.setSucceed(false);
				return response;
			}
			
			String state=user.isLogin()?user.getBusyType():user.isReserve()?"true":"false";
			if(state.equals("true")){
				response.setMessage("\u79bb\u7ebf\u63a5\u542c");
				response.addParameter("Flag", "reserve");
			}else if(state.equals("false")){
				response.setMessage("\u7b7e\u51fa");
				response.addParameter("Flag", "signout");
			}else if(state.equals("0")){
				response.setMessage(curaccount.getPhonebarConfig().getB00());
				response.addParameter("Flag", "0");
			}else if(state.equals("1")){
				response.setMessage(curaccount.getPhonebarConfig().getB01());
				response.addParameter("Flag", "1");
			}else if(state.equals("2")){
				response.setMessage(curaccount.getPhonebarConfig().getB02());
				response.addParameter("Flag", "2");
			}else if(state.equals("3")){
				response.setMessage(curaccount.getPhonebarConfig().getB03());
				response.addParameter("Flag", "3");
			}else if(state.equals("4")){
				response.setMessage(curaccount.getPhonebarConfig().getB04());
				response.addParameter("Flag", "4");
			}else if(state.equals("5")){
				response.setMessage(curaccount.getPhonebarConfig().getB05());
				response.addParameter("Flag", "5");
			}else if(state.equals("6")){
				response.setMessage(curaccount.getPhonebarConfig().getB06());
				response.addParameter("Flag", "6");
			}else if(state.equals("7")){
				response.setMessage(curaccount.getPhonebarConfig().getB07());
				response.addParameter("Flag", "7");
			}else if(state.equals("8")){
				response.setMessage(curaccount.getPhonebarConfig().getB08());
				response.addParameter("Flag", "8");
			}else if(state.equals("9")){
				response.setMessage(curaccount.getPhonebarConfig().getB09());
				response.addParameter("Flag", "9");
			}else if(state.equals("99")){
				response.setMessage(curaccount.getPhonebarConfig().getB99());
				response.addParameter("Flag", "99");
			}
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
}
