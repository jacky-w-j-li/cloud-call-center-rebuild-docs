package com.m7.cc.ass.gateway.config.handler;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class GwHandler {
	public static C5Response handle(C5Action action){
		
		if (action.getActionName().equals(Fields.RouteConfig)) {
			return CommonHandler.routeConfig(action);
		} else if (action.getActionName().equals(Fields.Ping)) {
			return new C5Response(action.getActionName(), action.getActionID(),
					true);
		} else if (action.getActionName().equals(Fields.PeerAdd)) {
			return CommonHandler.peerAdd(action);
		} else if (action.getActionName().equals(Fields.PeerRemove)) {
			return CommonHandler.peerRemove(action);
		}
//		if(action.getActionName().equals(Fields.PeerAdd)){
//			return CommonHandler.peerAdd(action);
//		} else if (action.getActionName().equals(Fields.PeerRemove)){
//			return CommonHandler.peerRemove(action);
//		} else if (action.getActionName().equals(Fields.PeerEffect)){
//			return CommonHandler.effect(action);
//		} else if (action.getActionName().equals(Fields.Domain)){
//			return SipDomainHandler.updateDomain(action);
//		} else if(action.getActionName().equals(Fields.DomainRemove)){
//			return SipDomainHandler.removeDomain(action);
//		}else if (action.getActionName().equals(Fields.Ping)) {
//			return new C5Response(action.getActionName(), action.getActionID(), true);
//		} else if (action.getActionName().equals(Fields.Reload)) {
//			CommonHandler.reload();
//			return new C5Response(action.getActionName(), action.getActionID(), true);
//		} 
		C5Response response = new C5Response(action);
		response.setSucceed(false);
		response.setMessage("Unknow action");
		return response;
	}
}
