package com.m7.cc.ass.server.handler;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class DialoutHandler {
	public static C5Response handle(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String account = (String) action.getParameterValue(Fields.Account);
			String exten = (String) action.getParameterValue(Fields.Exten);
			String agent = (String) action.getParameterValue(Fields.FromExten);
			
			if(!exten.matches("[0-9]+")) {
				response.setMessage("303 exten error ["+exten+"]");
				response.setSucceed(false);
				return response;
			}
			
			String pbx = null;
			if(action.hasKey(Fields.PBX)){
				pbx = (String) action.getParameterValue(Fields.PBX);
			}
			if(pbx == null){
				pbx = RuntimeData.getInstance().getPbxViaAccount(account);
			}
			if(pbx == null){
				response.setMessage("401 ACCOUNT not found");
				response.setSucceed(false);
				return response;
			}
			
			C5Account a = RuntimeData.getInstance().getAccount(pbx, account);
			if(a == null){
				response.setMessage("403 Not allowed");
				response.setSucceed(false);
				return response;
			}
			
//			int canDialout = a.getExtenFields().getIntValue(Fields.HttpDialoutPermit);
			int canDialout = a.getExtenFields().getIntValue(Fields.IsDialoutIntegration);
			if(canDialout != 1){
				response.setMessage("403 Not allowed");
				response.setSucceed(false);
				return response;
			}
			
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			User user = a.getUserViaName(agent);
			if(user == null)
				user = a.getUserViaExten(agent);
			if(user == null)
				user = a.getUser(agent);
			if(user == null){
				response.setMessage("404 Agent not found");
				return response;
			}
			String extenType = null;
			String sipNum = null;
			if(action.hasKey("ExtenType")){
				extenType = (String) action.getParameterValue("ExtenType");
				if(extenType.equalsIgnoreCase(Fields.gateway)){
					sipNum = user.getAvailableGatewayTypeSipNum();
				}else if(extenType.equalsIgnoreCase(Fields.sip)){
					sipNum = user.getAvailableSipTypeSipNum();
				}else if(extenType.equalsIgnoreCase(Fields.Local)){
					sipNum = user.getOwnSipNums().get(Fields.Local);
				}
				if(sipNum == null) {
					response.setMessage("409 Agent extenType not available");
					return response;
				}
			}else{
				sipNum = user.getAvailableSipNum();
			}
			if(sipNum == null) {
				response.setMessage("407 Agent can not take calls");
				return response;
			}
			
			SipPeer mypeer = RuntimeData.getInstance().getSipPeer(pbx, sipNum);
			if(mypeer == null) {
				response.setMessage("501 Server error: peer not found ["+user.getSipNum()+"]");
				return response;
			}
			
			if (mypeer.getChannels().size() > 0 ){
				response.setMessage("408 Agent busy");
				return response;
			} else {
				Originate originate = null;
				String context = account;
//				if(ASConfig.getInstance().isMobileNumber(exten)){
//					if(!ASConfig.getInstance().isLocalMobileNumber(exten))
//						exten = "0"+exten;
//				}
				if (exten.length() <= 4){
					user.setStatus(User.INBOUND_CALL);
				} else {
					exten = "9"+exten;
					user.setStatus(User.OUTBOUND_CALL);
				}
				user.addVar(Fields.DialoutActionID, action.getActionID());
				String exten1 = exten;
				if(exten.startsWith("9")){
					if(!(exten.length()==5 && exten.startsWith("95")) && !(exten.length()==5 && exten.startsWith("96"))){
						exten1 = exten.substring(1);						
					}
				}
				user.addVar(Fields.CalledNo, exten1);
				String actionId = Utils.getSynActionID("originate");
				if(action.hasKey(Fields.CdrVar))
					actionId = "CdrVar=" + action.getStringValue(Fields.CdrVar);
				
				originate = new Originate("SIP/"+mypeer.getExten(),
						exten, context, "1", actionId);
				
				originate.setAccount(account);
				originate.setAsync("true");
				originate.setTimeout("30000");
				
//				AsteriskResponse res;
				try {
					amiClient.sendAction(originate);
//					boolean result = res.isSuccessful();
//					if(!result){
//						user.setStatus(User.IDLE);
//						response.setMessage("500 Server error");
//						response.setSucceed(false);
//					} else {
						response.setSucceed(true);
//					}
				} catch (Exception e) {
					user.setStatus(User.IDLE);
					response.setMessage("500 Server error");
					response.setSucceed(false);
				}
			}
		} catch (Exception e) {
			response.setMessage("500 Server error: " + e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
