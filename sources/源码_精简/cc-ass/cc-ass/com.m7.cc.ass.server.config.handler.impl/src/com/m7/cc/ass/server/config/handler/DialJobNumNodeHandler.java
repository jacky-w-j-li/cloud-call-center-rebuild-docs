package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.DialJobNumNode;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class DialJobNumNodeHandler {

	private static Logger log = Logger.getLogger(DialJobNumNodeHandler.class
			.getName());

	public static C5Response addDialJobNumNode(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			boolean update = action.getBoolValue(Fields.Update);
			String exten = action.getStringValue(Fields.Exten);
			Vector<DialJobNumNode> dialJobNumNodes = new Vector<DialJobNumNode>();
			DialJobNumNode dialJobNumNode = RuntimeData.getInstance().getAccount(pbx, accountID).getDialJobNumNodes().get(exten);
			if (dialJobNumNode == null)
				dialJobNumNode = new DialJobNumNode(pbx, accountID,
					exten);

			dialJobNumNode.setToPeerNotExist(action.getStringValue(Fields.ToPeer));
			dialJobNumNode.setToPeerAgentBusy(action.getStringValue(Fields.AgentBusyToPeer));
			dialJobNumNode.setToPeerLogoff(action.getStringValue(Fields.LogoffToPeer));
			dialJobNumNode.setParam(action.getStringValue(Fields.DialJobNumParam));


			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					dialJobNumNode.setDisplayName(displayName);
				}
			}
			

			dialJobNumNodes.add(dialJobNumNode);
//			if (update)
				RuntimeData.getInstance().updateDialJobNumNodes(pbx,
						accountID, dialJobNumNodes);
//			else
//				RuntimeData.getInstance().addDialJobNumNodes(pbx, accountID,
//						dialJobNumNodes);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
