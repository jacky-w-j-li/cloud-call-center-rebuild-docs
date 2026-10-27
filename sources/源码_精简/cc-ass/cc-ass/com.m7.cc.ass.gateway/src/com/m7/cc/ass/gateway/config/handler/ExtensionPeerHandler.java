package com.m7.cc.ass.gateway.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.gateway.config.model.ExtensionPeer;
import com.m7.cc.ass.gateway.config.model.GWRuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class ExtensionPeerHandler {
	
	private static Logger log = Logger.getLogger(ExtensionPeerHandler.class.getName());
	
	public static C5Response addExtensionPeer(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String exten = action.getStringValue(Fields.Exten);
			
			ExtensionPeer peer = GWRuntimeData.getInstance().getExtensionPeer(exten);
			if (peer == null)
				peer = new ExtensionPeer(exten);
			peer.setValues(action.getParameters());
			

			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					peer.setDisplayName(displayName);
				}
			}
			GWRuntimeData.getInstance().addExtensionPeer(peer);
			response.setSucceed(true);
		} catch (Exception e){
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	public static C5Response removeExtensionPeer(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String exten = action.getStringValue(Fields.Exten);
			GWRuntimeData.getInstance().removeExtensionPeer(exten);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
