package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

/**
 * This handler will process SetExtenType action.
 * User could change his exten type without relogin.
 * 
 * @author Cai Zhibin
 *
 */
public class SetExtenTypeHandler {

	private static Logger log = Logger.getLogger(SetExtenTypeHandler.class.getName());
	
	/**
	 * In SetExtenType action: 
	 * 1. PBX	BPX where this user is in.
	 * 2. Account	Account id of this user.
	 * 3. User	User id of this user.
	 * 4. ExtenType Which exten type the user want to change to.
	 * 5. LoginExten The exten of SipPeer which the user want to use.
	 * 
	 * @param action
	 * @return
	 */
	public static C5Response setExtenType(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try{
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String userId = (String) action.getParameterValue(Fields.User);
			String extenType = (String) action.getParameterValue(Fields.ExtenType);
			String extenParam = null;
			if(action.hasKey(Fields.LoginExten))
				extenParam = action.getStringValue(Fields.LoginExten);
			
			User user = RuntimeData.getInstance().getAccount(pbx, account).getUser(userId);
			if(user == null){
				response.setMessage("Can not find this user: " + userId
						+ " on PBX[" + pbx + "]");
				response.setSucceed(false);
				return response;
			}
			String loginExten = user.getImExten(extenType);
			if(loginExten == null || loginExten.trim().equals("")) {
				if(extenParam == null){
					response.setMessage("exten not found");
					response.setSucceed(false);
					return response;
				}else{
					loginExten = extenParam;
				}
			}
			C5Pbx client = RuntimeData.getInstance().getPbxViaId(pbx);
			if (client == null) {
				response.setMessage("Can not find this PBX[" + pbx + "]");
				response.setSucceed(false);
				return response;
			} else {
				SipPeer peer = client.getPeer(loginExten);
				if (peer == null) {
					response.setMessage("Can not find this Peer: " + loginExten
							+ " on PBX[" + pbx + "]");
					response.setSucceed(false);
					return response;
				} 
				
				C5Action _action = new C5Action("removequeuemember", Utils.getSynActionID("removequeuemember"));
				_action.addParameter(Fields.User, user);
				QueueActionHandler.queueRemove(_action);
				
				user.setExtenType(extenType);
				user.setSipNum(peer.getExten());
				peer.setUser(user);
				
				_action = new C5Action("addqueuemember", Utils.getSynActionID("addqueuemember"));
				_action.addParameter(Fields.User, user);
				if(user.isBusy())
					_action.addParameter(Fields.Paused, true);
				QueueActionHandler.queueAdd(_action);
				
				CallListener.getInstance().userUpdate(user.getId(), user);
				response.setSucceed(true);
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		
		return response;
	}
	
	public static C5Response setUCExtenType(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try{
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String userId = (String) action.getParameterValue(Fields.User);
			String extenType = (String) action.getParameterValue(Fields.ExtenType);
			
			
			C5Pbx client = RuntimeData.getInstance().getPbxViaId(pbx);
			if (client == null) {
				response.setMessage("404:Can not find this PBX[" + pbx + "]");
				response.setSucceed(false);
			} else {
				
				User user = RuntimeData.getInstance().getAccount(pbx, account).getUser(userId);
				if(user == null){
					response.setMessage("404:Can not find this user: " + userId
							+ " on PBX[" + pbx + "]");
					response.setSucceed(false);
					return response;
				}
				//if UCextenType=='resonance' or UCextenType=='polling' 
				if(extenType.equals(Fields.resonance) || extenType.equals(Fields.polling)){
					user.setUcExtenType(extenType);
					RuntimeData.getInstance().getAccount(pbx, account).updateUser();
					
					response.setSucceed(true);
					return response;
				}
				
				String exten = user.getOwnSipNums().get(extenType);
				if(exten == null) {
					response.setMessage("403:Can not find this Peer: " + extenType
							+ " on PBX[" + pbx + "]");
					response.setSucceed(false);
					return response;
				}
				
				SipPeer peer = RuntimeData.getInstance().getSipPeer(pbx, exten);
				if (peer == null) {
					response.setMessage("403:Can not find this Peer: " + extenType
							+ " on PBX[" + pbx + "]");
					response.setSucceed(false);
					return response;
				} 
				
				peer.setUser(user);
				user.setUcSipNum(peer.getExten());
				user.setUcExtenType(extenType);
				RuntimeData.getInstance().getAccount(pbx, account).updateUser();
				RuntimeData.getInstance().getAccount(pbx, account).updateSippeers();		
				
				response.setSucceed(true);
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			response.setMessage("500:"+e.getMessage());
			response.setSucceed(false);
		}
		
		return response;
	}
	
	public static C5Response getUCExtenType(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try{
			String pbx = (String) action.getParameterValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String userId = (String) action.getParameterValue(Fields.User);
			
			C5Pbx client = RuntimeData.getInstance().getPbxViaId(pbx);
			if (client == null) {
				response.setMessage("Can not find this PBX[" + pbx + "]");
				response.setSucceed(false);
			} else {
				
				User user = RuntimeData.getInstance().getAccount(pbx, account).getUser(userId);
				if(user == null){
					response.setMessage("Can not find this user: " + userId
							+ " on PBX[" + pbx + "]");
					response.setSucceed(false);
					return response;
				}
				
				boolean isLoginCallCenter = false;
				if(user.isLogin() || user.isReserve()){
					isLoginCallCenter = true;
				}
				response.addParameter(Fields.IsLoginCallcenter, isLoginCallCenter);
				response.addParameter(Fields.UCExtenType, user.getUcExtenType());
				response.addParameter(Fields.ExtenType, user.getExtenType());
				response.setSucceed(true);
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		
		return response;
	}
}
