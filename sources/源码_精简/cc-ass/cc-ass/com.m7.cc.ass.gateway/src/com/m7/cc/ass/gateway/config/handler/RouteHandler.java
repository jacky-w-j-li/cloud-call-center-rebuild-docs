package com.m7.cc.ass.gateway.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.gateway.config.model.GWRoute;
import com.m7.cc.ass.gateway.config.model.GWRuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class RouteHandler {

	private static Logger log = Logger.getLogger(RouteHandler.class.getName());
	
	public static C5Response addRoute(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String exten = action.getStringValue(Fields.Exten);
			String nextPeer = null;
			if(action.hasKey(Fields.NextPeer))
				nextPeer = action.getStringValue(Fields.NextPeer);
			String displayName = "";
			if(action.hasKey(Fields.DisplayName)){
				displayName = action.getStringValue(Fields.DisplayName);
			}
			
			GWRoute route = GWRuntimeData.getInstance().getRoute(exten);
			if(route == null)
				route = new GWRoute(exten);
			route.setDisplayName(displayName);
			route.setNextPeer(nextPeer);
			
			GWRuntimeData.getInstance().addRoute(route);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
	
	public static C5Response removeRoute(C5Action action){
		C5Response response = new C5Response(action);
		try{
			String exten = action.getStringValue(Fields.Exten);
			GWRuntimeData.getInstance().removeRoute(exten);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
