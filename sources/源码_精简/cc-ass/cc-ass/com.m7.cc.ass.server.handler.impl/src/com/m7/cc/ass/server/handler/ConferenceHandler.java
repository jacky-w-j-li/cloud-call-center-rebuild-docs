package com.m7.cc.ass.server.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.Room;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class ConferenceHandler {
	private static Logger log = Logger.getLogger(ConferenceHandler.class.getName());
	
	public static C5Response GetConference(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String account = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			Hashtable<String,Room> rooms = RuntimeData.getInstance().getAccount(pbx, account).getRooms();
			Iterator<Room> it = rooms.values().iterator();
			List<HashMap<String, Object>> events = new ArrayList<HashMap<String, Object>>();
			while(it.hasNext()){
				Room room = it.next();
				events.add(room.getStateEvent().getParameters());
			}
			response.setSucceed(true);
			response.addParameter(Fields.Event, events);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response JoinConference(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			//Originate 
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
	
//	public static C5Response LeaveConference(C5Action action) {
//		C5Response response = new C5Response(action);
//		try {
//			ConferenceListener listener = (ConferenceListener) action.getParameterValue(Fields.Listener);
//			String exten = action.getStringValue(Fields.Exten);
//			CallListener.getInstance().removeConferenceListener(exten, listener);
//			response.setSucceed(true);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//			response.setSucceed(false);
//		}
//		return response;
//	}
	
	public static C5Response ListenConference(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String exten = action.getStringValue(Fields.Exten);
			String pbxID = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			Room room = RuntimeData.getInstance().getAccount(pbxID, accountID).getRooms().get(exten);
			if(room != null) {
				//Sent room member
				response.setSucceed(true);
				response.addParameter(Fields.Event, room.getMemberEvent());
			} else {
				response.setSucceed(false);
				response.setMessage("Room ["+exten+"] not found");
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response UnListenConference(C5Action action) {
		C5Response response = new C5Response(action);
		try {
//			ConferenceListener listener = (ConferenceListener) action.getParameterValue(Fields.Listener);
//			String exten = action.getStringValue(Fields.Exten);
//			CallListener.getInstance().removeConferenceListener(exten, listener);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
		}
		return response;
	}
	
	public static C5Response inviteToConference(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbxId = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			String room = action.getStringValue(Fields.Room);

			if (exten == null) {
				response.setSucceed(false);
				response.setMessage("Exten could not be null.");
				return response;
			}

			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbxId);
			if (amiClient == null) {
				response.setMessage("Pbx not found:" + pbxId);
				response.setSucceed(false);
				return response;
			}

			String originateExten = null;
			String calleridNum = null;
			C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxId);
			C5Account account = pbx.getAccount(accountId);
			if (account == null) {
				response.setMessage("Account not found:" + account);
				response.setSucceed(false);
				return response;
			}
			if (exten.length() < 5) {
				User user = account.getUserViaExten(exten);
				if (user == null) {
					response.setSucceed(false);
					response.setMessage("User not found via exten " + exten);
					return response;
				}
				String sipNum = user.getAvailableSipNum();
				
				if (sipNum != null) {
					SipPeer peer = RuntimeData.getInstance().getSipPeer(pbxId,
							user.getSipNum());
					if (peer != null) {
						if (peer.getChannels().size() < 1) {
							originateExten = "SIP/" + peer.getExten();
							user.setStatus(SipPeer.INBOUND_CALL);
							user.addVar(Fields.CalledNo, room);
							calleridNum = peer.getExten();
						} else {
							response.setSucceed(false);
							response.setMessage("User is calling.");
							return response;
						}
					} else {
						response.setSucceed(false);
						response.setMessage("User is invalid.");
						return response;
					}
				} else {
					response.setSucceed(false);
					response.setMessage("User not login.");
					return response;
				}
			} else {
				DialLine dialoutLine = account.getDialoutLine();
				if(dialoutLine == null){
					response.setSucceed(false);
					response.setMessage("Dialout line is not configure.");
					return response;
				}
				
				calleridNum = account.getDidNum(Fields.DialoutFlag);
				if (ASConfig.getInstance().isMobileNumber(exten)
						&& !ASConfig.getInstance().isLocalMobileNumber(exten)) {
					exten = "0" + exten;
				}
				originateExten = "SIP/"
						+ account.getSipContact(exten, Fields.DialoutFlag)
						+ "@" + ASConfig.getInstance().getDialoutLine() + ":"
						+ ASConfig.getInstance().getDialoutPort();
				pbx.addParameterCache(action.getActionID(), exten);
			}
			String context = accountId + "-" + room + "-room";
			Originate originate = new Originate(originateExten, "s", context,
					"1", action.getActionID());
			originate.setAsync("true");
			originate.setTimeout("30000");
			if(calleridNum != null)
				originate.setCallerID(calleridNum);
			AsteriskResponse res = amiClient.sendSynOriginate(originate);
			String reason = res.getParameter(Fields.Reason);
			if (res.isSuccessful() && reason.equals("4")) {
				response.setSucceed(true);
				response.setMessage("Invite successful.");
			} else {
				response.setSucceed(false);
				response.setMessage("Invite failure.");
			}
			return response;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
