package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.AssignmentNode;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class AssignmentNodeHandler {

	private static Logger log = Logger.getLogger(AssignmentNodeHandler.class
			.getName());

	public static C5Response addAssignmentNode(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
//			boolean update = action.getBoolValue(Fields.Update);
			String exten = action.getStringValue(Fields.Exten);
			Vector<AssignmentNode> assignmentNodes = new Vector<AssignmentNode>();
			AssignmentNode assignmentNode = RuntimeData.getInstance()
					.getAccount(pbx, accountID).getAssignmentNodes().get(exten);
			if (assignmentNode == null)
				assignmentNode = new AssignmentNode(pbx, accountID, exten);

			assignmentNode.setToPeer(action.getStringValue(Fields.ToPeer));

			assignmentNode.getItems().clear();
			if (-1 == assignmentNode.parseStringToItems(action
					.getStringValue(Fields.SetVar))) {
				response.setSucceed(false);
				return response;
			}
			

			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					assignmentNode.setDisplayName(displayName);
				}
			}

			assignmentNodes.add(assignmentNode);
//			if (update)
			RuntimeData.getInstance().updateAssignmentNodes(pbx,
					accountID, assignmentNodes);
//			else
//				RuntimeData.getInstance().addAssignmentNodes(pbx, accountID,
//						assignmentNodes);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
