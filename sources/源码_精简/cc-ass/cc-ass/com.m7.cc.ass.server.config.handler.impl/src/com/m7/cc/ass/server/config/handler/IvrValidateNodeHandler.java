package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.IvrValidateNode;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class IvrValidateNodeHandler {

	private static Logger log = Logger.getLogger(IvrValidateNodeHandler.class
			.getName());

	public static C5Response addIvrValidateNode(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
//			boolean update = action.getBoolValue(Fields.Update);
			String exten = action.getStringValue(Fields.Exten);
			Vector<IvrValidateNode> ivrValidateNodes = new Vector<IvrValidateNode>();
			IvrValidateNode ivrValidateNode = RuntimeData.getInstance()
					.getAccount(pbx, accountID).getIvrValidateNodes()
					.get(exten);
			if (ivrValidateNode == null)
				ivrValidateNode = new IvrValidateNode(pbx, accountID,
					exten);

			ivrValidateNode.setValidateToPeer(action.getStringValue(Fields.ValidateToPeer));
			//ivrValidateNode.setParam(action.getStringValue(Fields.IvrValidateParam));
			
			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					ivrValidateNode.setDisplayName(displayName);
				}
			}
			
			ivrValidateNodes.add(ivrValidateNode);
//			if (update)
			RuntimeData.getInstance().updateIvrValidateNodes(pbx,
					accountID, ivrValidateNodes);
//			else
//				RuntimeData.getInstance().addIvrValidateNodes(pbx, accountID,
//						ivrValidateNodes);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
