package com.m7.cc.ass.server.config.handler;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.ExtensionPeer;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class ExtensionPeerHandler {
	
	public static C5Response addExtensionPeer(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
//			boolean update = action.getBoolValue(Fields.Update);
			
			ExtensionPeer peer = RuntimeData.getInstance()
					.getAccount(pbx, account).getExtensionPeerNodes()
					.get(exten);
			if (peer == null) 
				peer = new ExtensionPeer(pbx, account, exten);
			peer.setValues(action.getParameters());
			

			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					peer.setDisplayName(displayName);
				}
			}
			
//			if(update)
			RuntimeData.getInstance().updateExtensionPeer(pbx, account, peer);
//			else RuntimeData.getInstance().addExtensionPeer(pbx, account, peer);
			response.setSucceed(true);
		} catch (Exception e){
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
