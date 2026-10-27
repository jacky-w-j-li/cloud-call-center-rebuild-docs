package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.DynamicRouteNode;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class DynamicRouteNodeHandler {

	private static Logger log = Logger.getLogger(DynamicRouteNodeHandler.class.getName());

	public static C5Response addDynamicRouteNode(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
//			boolean update = action.getBoolValue(Fields.Update);
			String exten = action.getStringValue(Fields.Exten);
			Vector<DynamicRouteNode> dynamicRouteNodes = new Vector<DynamicRouteNode>();
			DynamicRouteNode dynamicRouteNode = RuntimeData.getInstance()
					.getAccount(pbx, accountID).getDynamicRouteNodes()
					.get(exten);
			if (dynamicRouteNode == null)
				dynamicRouteNode = new DynamicRouteNode(pbx, accountID, exten);
			else
				dynamicRouteNode.getRouteRules().clear();
			dynamicRouteNode.setToPeerUnmatched(action.getStringValue(Fields.ToPeerUnmatched));

			if (-1 == dynamicRouteNode.parseStringToRules(
					action.getStringValue(Fields.RouteRules), 
					action.getStringValue(Fields.Conjunctions)))
			{
				response.setSucceed(false);
				return response;
			}
			

			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					dynamicRouteNode.setDisplayName(displayName);
				}
			}
				
			
			dynamicRouteNodes.add(dynamicRouteNode);
//			if (update)
			RuntimeData.getInstance().updateDynamicRouteNodes(pbx, accountID, dynamicRouteNodes);
//			else
//				RuntimeData.getInstance().addDynamicRouteNodes(pbx, accountID, dynamicRouteNodes);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
