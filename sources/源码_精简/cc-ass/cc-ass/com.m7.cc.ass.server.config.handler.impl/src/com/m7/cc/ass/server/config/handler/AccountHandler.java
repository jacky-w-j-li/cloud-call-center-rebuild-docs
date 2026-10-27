package com.m7.cc.ass.server.config.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class AccountHandler {

	private static Logger log = Logger
			.getLogger(AccountHandler.class.getName());

	/**
	 * 
	 * @param action
	 * @return
	 */
	public static C5Response addAccount(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());

		try {
			String accountId = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);

			// Aman zhai. 2010.05.10 interfaces (http-dialout & http-transfer)
			Hashtable<String, Object> extenFields = new Hashtable<String, Object>();

			Iterator<String> iteratorKey = action.getParameters().keySet()
					.iterator();
			while (iteratorKey.hasNext()) {
				String key = iteratorKey.next();
				if (!key.equals(Fields.Command) && !key.equals(Fields.Action)
						&& !key.equals(Fields.ActionID)
						&& !key.equals(Fields.PBX)
						&& !key.equals(Fields.Account)) {
					
					extenFields.put(key, action.getParameters().get(key));
				}
			}
			
			/* 
			 * If the account has existed, it will be updated, else, to be added.
			 * Reviser:YangWeiLi
			 * Date:2011-03-29
			 * */
			boolean isAccountExist = RuntimeData.getInstance().isAccountExist(pbx, accountId);
			if(isAccountExist){
				response.setSucceed(RuntimeData.getInstance().updateExtenAccount(pbx,
						accountId, extenFields));
			}else{
				response.setSucceed(RuntimeData.getInstance().addAccount(pbx,
						accountId, extenFields));
			}
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}
	
	public static C5Response updateExtenAccount(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());

		try {
			String accountId = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			// Aman zhai. 2010.05.10 interfaces (http-dialout & http-transfer)
			Hashtable<String, Object> extenFields = new Hashtable<String, Object>();
			
			Iterator<String> iteratorKey = action.getParameters().keySet().iterator();
			while(iteratorKey.hasNext())
			{
				String key = iteratorKey.next();
				if (!key.equals(Fields.Command) 
						&& !key.equals(Fields.Action)
						&& !key.equals(Fields.ActionID)
						&& !key.equals(Fields.PBX)
						&& !key.equals(Fields.Account))
				{
					extenFields.put(key, action.getParameters().get(key));
				}
			}
			response.setSucceed(RuntimeData.getInstance().updateExtenAccount(pbx,
					accountId, extenFields));
			// <--
//			response.setSucceed(RuntimeData.getInstance().addAccount(pbx,
//					accountId));
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}
	
	public static C5Response removeExtenAccount(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());

		try {
			String accountId = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			Vector<String> extenFields = new Vector<String>();
			String fields = action.getStringValue(Fields.Fields);
			String []tmpFields = fields.split(",");
			for (int i = 0; i < tmpFields.length; i++)
			{
				extenFields.add(tmpFields[i]);
			}
			
			response.setSucceed(RuntimeData.getInstance().removeExtenAccount(pbx,
					accountId, extenFields));
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}

	// <--

	public static C5Response removeAccount(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String accountId = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			response.setSucceed(RuntimeData.getInstance().removeAccount(pbx,
					accountId));
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}

	public static C5Response activeAccount(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());

		try {
			String accountId = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			boolean active = action.getBoolValue(Fields.Active);
			if (active)
				response.setSucceed(RuntimeData.getInstance().activeAccount(
						pbx, accountId));
			else
				response.setSucceed(RuntimeData.getInstance().freezeAccount(
						pbx, accountId));
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}

	public static C5Response addDialLine(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String accountId = action.getStringValue(Fields.Account);
			String pbx = action.getStringValue(Fields.PBX);
			String exten = action.getStringValue(Fields.Exten);
			DialLine line = new DialLine(pbx, accountId, exten);
			line.setDialout(action.getBoolValue(Fields.Dialout));
			line.setDidNum(action.getStringValue(Fields.DidNum));
			line.setNeedPrefix(action.getBoolValue(Fields.NeedPrefix));
			
			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					line.setDisplayName(displayName);
				}
			}
			
			if (line.isDialout()){
				if(action.hasKey(Fields.MultiDidEnable))
					line.setMultiDidEnable(action.getBoolValue(Fields.MultiDidEnable));
				if(action.hasKey(Fields.MultiDidStrategy))
					line.setMultiDidStrategy(action.getStringValue(Fields.MultiDidStrategy));
				if(action.hasKey(Fields.MultiDidNum))
					line.setMultiDidNum(action.getStringValue(Fields.MultiDidNum));
				if(action.hasKey(Fields.MultiDidScope))
					line.setMultiDidScope(action.getStringValue(Fields.MultiDidScope));
				RuntimeData.getInstance().setDialoutLine(pbx, accountId, line);
			}else{
				RuntimeData.getInstance().setXferLine(pbx, accountId, line);				
			}
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}
	
	public static C5Response getSipStatus(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String accountId = action.getStringValue("account");
			String pbxID = action.getStringValue("pbx");
			
			C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
			if(pbx == null) {
				response.setSucceed(false);
				response.setMessage("PBX ["+ pbxID +"] not found!");
				return response;
			}
			C5Account account = pbx.getAccount(accountId);
			if(account == null) {
				response.setSucceed(false);
				response.setMessage("account ["+ accountId +"] not found!");
				return response;
			}	

			//update sip
			ArrayList<Map> statusList = new ArrayList<Map>();
			Hashtable<String, SipPeer> peers = account.getPeers();
			Iterator<String> it = peers.keySet().iterator();
			while (it.hasNext()) {
				String peerNum = it.next();
				SipPeer peer = peers.get(peerNum);
				if(peer.getExtenType().equalsIgnoreCase(Fields.gateway)){
					HashMap<String, Object> statusMap = new HashMap<String, Object>();
					statusMap.put("exten", peerNum);
					statusMap.put("peerStatus", peer.getPeerStatus());
					statusMap.put("status", peer.getStatus());
					statusMap.put("ipAddress", peer.getIpAddress());
					statusMap.put("ipPort", peer.getIpPort());
					statusMap.put("sipUseragent", peer.getSipUseragent());
					if(!peer.getRegContact().equals("") && peer.getRegContact().indexOf(";") != -1){
						statusMap.put("regContact", peer.getRegContact().split(";")[0]);						
					}else{
						statusMap.put("regContact", peer.getRegContact());
					}
					statusList.add(statusMap);
				}
			}
			
			response.addParameter("Data", statusList);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}
		return response;
	}
	
	
	//forbid account recorder function, add by PanShuyang 20171117
	public static C5Response forbidRecorder(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String accountId = action.getStringValue("account");
			String pbxId = action.getStringValue("pbx");
			boolean forbid = action.getBoolValue("forbid");
			
			C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxId);
			if(pbx == null) {
				response.setSucceed(false);
				response.setMessage("PBX ["+ pbxId +"] not found!");
				return response;
			}
			C5Account account = pbx.getAccount(accountId);
			if(account == null) {
				response.setSucceed(false);
				response.setMessage("account ["+ accountId +"] not found!");
				return response;
			}
			Hashtable<String, Object> extenFields = new Hashtable<String, Object>();
			extenFields.put("RecorderForbidden", forbid);
			boolean isAccountExist = RuntimeData.getInstance().isAccountExist(pbxId, accountId);
			if(isAccountExist){
				response.setSucceed(RuntimeData.getInstance().updateExtenAccount(pbxId,
						accountId, extenFields));
			}else{
				response.setSucceed(RuntimeData.getInstance().addAccount(pbxId,
						accountId, extenFields));
			}
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, action.getJsonString(), e);
		}	
		return response;
	}
}
